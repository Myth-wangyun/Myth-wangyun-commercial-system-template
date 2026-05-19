"""
CRUD for press interview header configuration
"""
from typing import Dict, List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.press_interview_header_config import PressInterviewHeaderConfig


def get_config(
    db: Session,
    campus_name: str,
    class_name: str,
    project_number: int,
) -> Optional[PressInterviewHeaderConfig]:
    """获取指定神殿、班级、项目的表头配置"""
    return db.query(PressInterviewHeaderConfig).filter(
        and_(
            PressInterviewHeaderConfig.campus_name == campus_name,
            PressInterviewHeaderConfig.class_name == class_name,
            PressInterviewHeaderConfig.project_number == project_number,
        )
    ).first()


def get_all_configs(
    db: Session,
    campus_name: Optional[str] = None,
    class_name: Optional[str] = None,
) -> List[PressInterviewHeaderConfig]:
    """获取所有表头配置（可筛选神殿和班级）"""
    query = db.query(PressInterviewHeaderConfig)
    if campus_name:
        query = query.filter(PressInterviewHeaderConfig.campus_name == campus_name)
    if class_name:
        query = query.filter(PressInterviewHeaderConfig.class_name == class_name)
    return query.all()


def create_or_update_config(
    db: Session,
    campus_name: str,
    class_name: str,
    project_number: int,
    header_config: Dict[str, str],
) -> PressInterviewHeaderConfig:
    """创建或更新表头配置"""
    existing = get_config(db, campus_name, class_name, project_number)
    if existing:
        existing.header_config = header_config
        db.commit()
        db.refresh(existing)
        return existing
    else:
        record = PressInterviewHeaderConfig(
            campus_name=campus_name,
            class_name=class_name,
            project_number=project_number,
            header_config=header_config,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record


def delete_config(
    db: Session,
    campus_name: str,
    class_name: str,
    project_number: int,
) -> bool:
    """删除表头配置"""
    record = get_config(db, campus_name, class_name, project_number)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
