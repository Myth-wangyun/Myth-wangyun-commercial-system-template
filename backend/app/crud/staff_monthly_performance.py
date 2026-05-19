"""
神殿智慧司员工业绩逐月统计表 CRUD 操作
"""

from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.staff_monthly_performance import 神殿智慧司员工业绩逐月统计表


def get_records(
    db: Session,
    campus: str,
    year: int,
    month: Optional[int] = None,
    teacher_name: Optional[str] = None,
) -> List[神殿智慧司员工业绩逐月统计表]:
    """获取员工业绩逐月统计记录"""
    query = db.query(神殿智慧司员工业绩逐月统计表).filter(
        神殿智慧司员工业绩逐月统计表.神殿名称 == campus,
        神殿智慧司员工业绩逐月统计表.年份 == year,
    )
    
    if month is not None:
        query = query.filter(神殿智慧司员工业绩逐月统计表.月份 == month)
    
    if teacher_name:
        query = query.filter(神殿智慧司员工业绩逐月统计表.教员姓名 == teacher_name)
    
    return query.order_by(
        神殿智慧司员工业绩逐月统计表.月份,
        神殿智慧司员工业绩逐月统计表.教员姓名,
    ).all()


def get_record_by_id(db: Session, record_id: int) -> Optional[神殿智慧司员工业绩逐月统计表]:
    """根据ID获取记录"""
    return db.query(神殿智慧司员工业绩逐月统计表).filter(
        神殿智慧司员工业绩逐月统计表.记录ID == record_id
    ).first()


def get_record_by_key(
    db: Session,
    campus: str,
    year: int,
    month: int,
    teacher_name: str,
) -> Optional[神殿智慧司员工业绩逐月统计表]:
    """根据唯一键获取记录"""
    return db.query(神殿智慧司员工业绩逐月统计表).filter(
        神殿智慧司员工业绩逐月统计表.神殿名称 == campus,
        神殿智慧司员工业绩逐月统计表.年份 == year,
        神殿智慧司员工业绩逐月统计表.月份 == month,
        神殿智慧司员工业绩逐月统计表.教员姓名 == teacher_name,
    ).first()


def create_record(db: Session, data: Dict[str, Any]) -> 神殿智慧司员工业绩逐月统计表:
    """创建新记录"""
    record = 神殿智慧司员工业绩逐月统计表(
        神殿名称=data["campus"],
        年份=data["year"],
        月份=data["month"],
        教员姓名=data["teacher"],
        作业提交率=data.get("homeworkSubmissionRate", 0),
        作业合格率=data.get("homeworkPassRate", 0),
        考试合格率=data.get("examPassRate", 0),
        项目合格率=data.get("projectPassRate", 0),
        学员满意度=data.get("studentSatisfaction", 0),
        学员违纪=data.get("studentViolations", 0),
        就业率=data.get("employmentRate", 0),
        就业薪资=data.get("employmentSalary", 0),
        口碑报名=data.get("reputationEnrollment", 0),
        口碑收入=data.get("reputationIncome", 0),
        带新生人数=data.get("newStudentCount", 0),
        退费人数=data.get("refundCount", 0),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_record(
    db: Session,
    record: 神殿智慧司员工业绩逐月统计表,
    data: Dict[str, Any],
) -> 神殿智慧司员工业绩逐月统计表:
    """更新记录"""
    field_mapping = {
        "homeworkSubmissionRate": "作业提交率",
        "homeworkPassRate": "作业合格率",
        "examPassRate": "考试合格率",
        "projectPassRate": "项目合格率",
        "studentSatisfaction": "学员满意度",
        "studentViolations": "学员违纪",
        "employmentRate": "就业率",
        "employmentSalary": "就业薪资",
        "reputationEnrollment": "口碑报名",
        "reputationIncome": "口碑收入",
        "newStudentCount": "带新生人数",
        "refundCount": "退费人数",
    }
    
    for en_field, cn_field in field_mapping.items():
        if en_field in data:
            setattr(record, cn_field, data[en_field])
    
    db.commit()
    db.refresh(record)
    return record


def upsert_record(db: Session, data: Dict[str, Any]) -> 神殿智慧司员工业绩逐月统计表:
    """创建或更新记录"""
    existing = get_record_by_key(
        db,
        campus=data["campus"],
        year=data["year"],
        month=data["month"],
        teacher_name=data["teacher"],
    )
    
    if existing:
        return update_record(db, existing, data)
    else:
        return create_record(db, data)


def batch_upsert_records(
    db: Session,
    campus: str,
    year: int,
    records_data: List[Dict[str, Any]],
) -> List[神殿智慧司员工业绩逐月统计表]:
    """批量创建或更新记录"""
    results = []
    
    for item in records_data:
        item["campus"] = campus
        item["year"] = year
        result = upsert_record(db, item)
        results.append(result)
    
    return results


def delete_record(db: Session, record_id: int) -> bool:
    """删除记录"""
    record = get_record_by_id(db, record_id)
    if record:
        db.delete(record)
        db.commit()
        return True
    return False


def delete_records_by_campus_year(db: Session, campus: str, year: int) -> int:
    """删除指定神殿和年份的所有记录"""
    count = db.query(神殿智慧司员工业绩逐月统计表).filter(
        神殿智慧司员工业绩逐月统计表.神殿名称 == campus,
        神殿智慧司员工业绩逐月统计表.年份 == year,
    ).delete()
    db.commit()
    return count


def record_to_dict(record: 神殿智慧司员工业绩逐月统计表) -> Dict[str, Any]:
    """将记录转换为字典"""
    return {
        "id": f"{record.月份}-{record.教员姓名}",
        "recordId": record.记录ID,
        "campus": record.神殿名称,
        "year": record.年份,
        "month": record.月份,
        "teacher": record.教员姓名,
        "homeworkSubmissionRate": float(record.作业提交率 or 0),
        "homeworkPassRate": float(record.作业合格率 or 0),
        "examPassRate": float(record.考试合格率 or 0),
        "projectPassRate": float(record.项目合格率 or 0),
        "studentSatisfaction": float(record.学员满意度 or 0),
        "studentViolations": int(record.学员违纪 or 0),
        "employmentRate": float(record.就业率 or 0),
        "employmentSalary": float(record.就业薪资 or 0),
        "reputationEnrollment": int(record.口碑报名 or 0),
        "reputationIncome": float(record.口碑收入 or 0),
        "newStudentCount": int(record.带新生人数 or 0),
        "refundCount": int(record.退费人数 or 0),
    }
