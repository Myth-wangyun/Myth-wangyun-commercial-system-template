"""
Teacher KPI templates and results CRUD logic
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.teacher_kpi import TeacherKPIAssessment, TeacherKPIResult, TeacherKPITemplate

DEFAULT_TEMPLATE_ROWS = [
    ("部门业绩目标完成率", "（2*部门业绩目标完成率+0.8）/0.3（目标40000元）", "神藏司", 15),
    ("学生就业率", "10*目标就业学生数/实际就业学生数（目标18人）", "就业部", 15),
    ("就业薪资", "10*就业学员的平均就业薪资/就业薪资基数（目标7000元）", "就业部", 15),
    ("教学测评", "10*考试合格率", "教化司", 15),
    ("新生流失率", "10-2*新生入班流失数", "咨询助理", None),
    ("老生流失率", "10-2*所带老班学员流失数", "咨询助理", 10),
    ("学员满意度", "10*学员满意度", "教化司", 10),
    ("学员管理", "6*（违纪情况排名－教员数量）/（1－教员数量）+4", "教化司", None),
    ("作业提交率", "10*作业提交率", "学术经理", 10),
    ("作业合格率", "10*作业合格率", "学术经理", None),
    ("工作完成率", "实际完成工作数量/应完成工作数量", "学术经理", None),
    ("朋友圈转发", "朋友圈实际转发60条", "咨询助理", None),
    ("口碑信息提供", "提供两个口碑信息", "咨询助理", None),
    ("口碑报名", "产生一个口碑报名", "神藏司", None),
    ("招聘达标率", "招聘1名云计算方向老师", "学术经理", None),
    ("岗位胜任度", "上级领导评价", "学术经理", 10),
]


def ensure_default_templates(db: Session):
    count = db.query(TeacherKPITemplate).count()
    if count:
        return
    for index, (indicator, formula, source, weight) in enumerate(DEFAULT_TEMPLATE_ROWS):
        db.add(
            TeacherKPITemplate(
                role="教员",
                indicator=indicator,
                formula=formula,
                data_source=source,
                default_weight=Decimal(weight) if weight is not None else None,
                order_index=index,
            )
        )
    db.commit()


def get_templates(db: Session, role: Optional[str] = None) -> List[TeacherKPITemplate]:
    ensure_default_templates(db)
    query = db.query(TeacherKPITemplate).filter(TeacherKPITemplate.is_active.is_(True))
    if role:
        query = query.filter(TeacherKPITemplate.role == role)
    return query.order_by(TeacherKPITemplate.order_index).all()


def list_results(db: Session, campus: str, year: int, month: int) -> List[dict]:
    rows = (
        db.query(TeacherKPIResult)
        .filter(
            TeacherKPIResult.campus_name == campus,
            TeacherKPIResult.year == year,
            TeacherKPIResult.month == month,
        )
        .order_by(TeacherKPIResult.teacher_name, TeacherKPIResult.order_index)
        .all()
    )
    grouped: dict[str, dict] = {}
    for row in rows:
        key = str(row.teacher_id or row.teacher_name)
        entry = grouped.setdefault(
            key,
            {
                "teacher_id": row.teacher_id,
                "teacher_name": row.teacher_name,
                "role": row.role,
                "rows": [],
            },
        )
        entry["rows"].append(
            {
                "template_id": row.template_id,
                "indicator": row.indicator,
                "formula": row.formula,
                "data_source": row.data_source,
                "weight": float(row.weight) if row.weight is not None else None,
                "score": float(row.score) if row.score is not None else None,
                "kpi_value": float(row.kpi_value) if row.kpi_value is not None else None,
                "order_index": row.order_index,
            }
        )
    return list(grouped.values())


def save_results(
    db: Session,
    campus: str,
    year: int,
    month: int,
    entries: List[dict],
):
    # 删除现有记录
    db.query(TeacherKPIResult).filter(
        TeacherKPIResult.campus_name == campus,
        TeacherKPIResult.year == year,
        TeacherKPIResult.month == month,
    ).delete()

    now = datetime.utcnow()
    for entry in entries:
        teacher_name = entry.get("teacher_name") or entry.get("name")
        if not teacher_name:
            continue
        role = entry.get("role") or "教员"
        teacher_id = entry.get("teacher_id")
        rows = entry.get("rows") or []
        for idx, row in enumerate(rows):
            model = TeacherKPIResult(
                campus_name=campus,
                year=year,
                month=month,
                teacher_id=teacher_id,
                teacher_name=teacher_name,
                role=role,
                template_id=row.get("template_id"),
                indicator=row.get("indicator"),
                formula=row.get("formula"),
                data_source=row.get("data_source"),
                weight=row.get("weight"),
                score=row.get("score"),
                kpi_value=row.get("kpi_value"),
                order_index=row.get("order_index", idx),
                created_at=now,
                updated_at=now,
            )
            db.add(model)
    db.commit()
    return list_results(db, campus, year, month)


def save_assessments(
    db: Session,
    campus: str,
    year: int,
    month: int,
    records: List[dict],
):
    """保存 KPI 考核数据"""
    # 删除现有记录
    db.query(TeacherKPIAssessment).filter(
        TeacherKPIAssessment.campus_name == campus,
        TeacherKPIAssessment.year == year,
        TeacherKPIAssessment.month == month,
    ).delete()

    now = datetime.utcnow()
    for record in records:
        teacher_name = record.get("name")
        if not teacher_name:
            continue
        
        model = TeacherKPIAssessment(
            campus_name=campus,
            year=year,
            month=month,
            teacher_name=teacher_name,
            department_performance=record.get("department_performance"),
            assignment_submit_rate=record.get("assignment_submit_rate"),
            assignment_pass_rate=record.get("assignment_pass_rate"),
            exam_pass_rate=record.get("exam_pass_rate"),
            employment_count=record.get("employment_count"),
            employment_salary=record.get("employment_salary"),
            attendance_rate=record.get("attendance_rate"),
            old_student_loss=record.get("old_student_loss"),
            new_student_loss=record.get("new_student_loss"),
            satisfaction=record.get("satisfaction"),
            recruitment_completion=record.get("recruitment_completion"),
            wechat_moments=record.get("wechat_moments"),
            kuaishou_shares=record.get("kuaishou_shares"),
            douyin_shares=record.get("douyin_shares"),
            new_media_total=record.get("new_media_total"),
            leader_review=record.get("leader_review"),
            created_at=now,
            updated_at=now,
        )
        db.add(model)
    db.commit()


def list_assessments(db: Session, campus: str, year: int, month: int) -> List[dict]:
    """获取 KPI 考核数据"""
    rows = (
        db.query(TeacherKPIAssessment)
        .filter(
            TeacherKPIAssessment.campus_name == campus,
            TeacherKPIAssessment.year == year,
            TeacherKPIAssessment.month == month,
        )
        .order_by(TeacherKPIAssessment.teacher_name)
        .all()
    )
    return [
        {
            "name": row.teacher_name,
            "department_performance": float(row.department_performance) if row.department_performance is not None else None,
            "assignment_submit_rate": float(row.assignment_submit_rate) if row.assignment_submit_rate is not None else None,
            "assignment_pass_rate": float(row.assignment_pass_rate) if row.assignment_pass_rate is not None else None,
            "exam_pass_rate": float(row.exam_pass_rate) if row.exam_pass_rate is not None else None,
            "employment_count": row.employment_count,
            "employment_salary": float(row.employment_salary) if row.employment_salary is not None else None,
            "attendance_rate": float(row.attendance_rate) if row.attendance_rate is not None else None,
            "old_student_loss": float(row.old_student_loss) if row.old_student_loss is not None else None,
            "new_student_loss": float(row.new_student_loss) if row.new_student_loss is not None else None,
            "satisfaction": float(row.satisfaction) if row.satisfaction is not None else None,
            "recruitment_completion": float(row.recruitment_completion) if row.recruitment_completion is not None else None,
            "wechat_moments": row.wechat_moments,
            "kuaishou_shares": row.kuaishou_shares,
            "douyin_shares": row.douyin_shares,
            "new_media_total": row.new_media_total,
            "leader_review": float(row.leader_review) if row.leader_review is not None else None,
        }
        for row in rows
    ]
