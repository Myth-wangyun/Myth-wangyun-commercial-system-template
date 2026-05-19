"""
CRUD for class press interview scores
"""

from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.press_interview_score import PressInterviewScore


def list_scores(
    db: Session,
    campus_name: Optional[str] = None,
    class_name: Optional[str] = None,
    major_name: Optional[str] = None,
    course_name: Optional[str] = None,
    instructor_name: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    search: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Tuple[List[PressInterviewScore], int]:
    query = db.query(PressInterviewScore)
    if campus_name:
        query = query.filter(PressInterviewScore.campus_name == campus_name)
    if class_name:
        query = query.filter(PressInterviewScore.class_name == class_name)
    if major_name:
        query = query.filter(PressInterviewScore.major_name == major_name)
    if course_name:
        query = query.filter(PressInterviewScore.course_name == course_name)
    if instructor_name:
        query = query.filter(PressInterviewScore.instructor_name == instructor_name)
    if year is not None:
        query = query.filter(PressInterviewScore.year == year)
    if month is not None:
        query = query.filter(PressInterviewScore.month == month)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            func.lower(PressInterviewScore.student_name).like(func.lower(pattern))
            | func.lower(PressInterviewScore.student_id).like(func.lower(pattern))
        )
    total = query.count()
    records = (
        query.order_by(PressInterviewScore.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return records, total


def create_score(db: Session, data: dict) -> PressInterviewScore:
    # 获取现有的记录以同步 header_config
    campus_name = data.get("campus_name")
    class_name = data.get("class_name")
    provided_header_config = data.get("header_config")
    
    # 确保 header_config 有正确的值
    if campus_name and class_name:
        existing_record = (
            db.query(PressInterviewScore)
            .filter(
                PressInterviewScore.campus_name == campus_name,
                PressInterviewScore.class_name == class_name,
            )
            .first()
        )
        
        # 优先使用提供的 header_config（如果提供了且是字典类型）
        if provided_header_config is not None and isinstance(provided_header_config, dict):
            # 如果提供了新的 header_config，使用提供的配置（即使为空字典）
            data["header_config"] = provided_header_config
        elif existing_record and existing_record.header_config:
            # 如果没有提供新的 header_config，但已有记录且有 header_config，使用已有记录的配置（保持一致）
            data["header_config"] = existing_record.header_config
        else:
            # 如果没有提供且没有已有记录，使用空字典
            data["header_config"] = {}
    else:
        # 如果 campus_name 或 class_name 不存在，确保 header_config 有默认值
        data["header_config"] = provided_header_config if (provided_header_config is not None and isinstance(provided_header_config, dict)) else {}
    
    record = PressInterviewScore(**data)
    db.add(record)
    db.commit()
    db.refresh(record)
    
    # 如果提供了新的 header_config，更新所有相同神殿+班级的记录（包括刚创建的这条）
    if provided_header_config is not None and campus_name and class_name:
        # 直接更新所有记录，包括刚创建的这条
        records = (
            db.query(PressInterviewScore)
            .filter(
                PressInterviewScore.campus_name == campus_name,
                PressInterviewScore.class_name == class_name,
            )
            .all()
        )
        for r in records:
            r.header_config = provided_header_config
        db.commit()
        db.refresh(record)
    
    return record


def update_score(db: Session, record_id: int, data: dict) -> Optional[PressInterviewScore]:
    record = db.get(PressInterviewScore, record_id)
    if not record:
        return None
    
    # 如果更新了 header_config，需要同步到所有相同神殿+班级的记录
    header_config = data.get("header_config")
    if header_config is not None and record.campus_name and record.class_name:
        # 同步到所有相同神殿+班级的记录
        records = (
            db.query(PressInterviewScore)
            .filter(
                PressInterviewScore.campus_name == record.campus_name,
                PressInterviewScore.class_name == record.class_name,
            )
            .all()
        )
        for r in records:
            r.header_config = header_config
        db.commit()
        db.refresh(record)
        # 从 data 中移除 header_config，避免重复设置
        data = {k: v for k, v in data.items() if k != "header_config"}
    
    # 更新其他字段
    for key, value in data.items():
        if value is not None and hasattr(record, key):
            setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return record


def delete_score(db: Session, record_id: int) -> bool:
    record = db.get(PressInterviewScore, record_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


def get_header_config(
    db: Session,
    campus_name: str,
    class_name: str,
) -> Optional[dict]:
    """获取指定神殿和班级的表头配置（从第一条记录获取）"""
    record = (
        db.query(PressInterviewScore)
        .filter(
            PressInterviewScore.campus_name == campus_name,
            PressInterviewScore.class_name == class_name,
        )
        .first()
    )
    if record and record.header_config:
        return record.header_config
    return None


def update_header_config(
    db: Session,
    campus_name: str,
    class_name: str,
    header_config: dict,
) -> int:
    """更新指定神殿和班级的所有记录的表头配置"""
    records = (
        db.query(PressInterviewScore)
        .filter(
            PressInterviewScore.campus_name == campus_name,
            PressInterviewScore.class_name == class_name,
        )
        .all()
    )
    
    # 如果没有任何记录，返回0（前端需要在有记录后再保存配置）
    if not records:
        return 0
    
    # 更新所有记录的表头配置
    for record in records:
        record.header_config = header_config
    
    db.commit()
    return len(records)
