"""
教学质量模块 - 神殿教化司寒暑假学生明细表（按月保存明细行，可编辑）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份 + 身份证号（唯一）
前端编辑保存时按月覆盖写入。
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 寒暑假学生明细表(AccountBase):
    __tablename__ = "寒暑假学生明细表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    序号: Mapped[int | None] = mapped_column(Integer, nullable=True)
    学生姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    性别: Mapped[str | None] = mapped_column(String(10), nullable=True)
    原班级: Mapped[str | None] = mapped_column(String(100), nullable=True)
    原班主任: Mapped[str | None] = mapped_column(String(100), nullable=True)
    入学时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    第一次离校时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    联系电话: Mapped[str | None] = mapped_column(String(50), nullable=True)
    第二次应复学时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    第二次实际复学时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    第二次离校时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    第二次班主任: Mapped[str | None] = mapped_column(String(100), nullable=True)
    第三次应复学时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    第三次实际复学时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    第三次离校时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    第三次班主任: Mapped[str | None] = mapped_column(String(100), nullable=True)
    入学年龄: Mapped[str | None] = mapped_column(String(50), nullable=True)
    身份证号: Mapped[str | None] = mapped_column(String(50), nullable=True)
    咨询师: Mapped[str | None] = mapped_column(String(100), nullable=True)
    应收学费: Mapped[int | None] = mapped_column(Integer, nullable=True)
    已收学费: Mapped[int | None] = mapped_column(Integer, nullable=True)
    所报专业: Mapped[str | None] = mapped_column(String(100), nullable=True)
    学制: Mapped[str | None] = mapped_column(String(50), nullable=True)
    是否承诺注册学历: Mapped[str | None] = mapped_column(String(10), nullable=True)
    承诺注册学历性质级别名称: Mapped[str | None] = mapped_column(Text, nullable=True)
    是否已注册中专大专: Mapped[str | None] = mapped_column(String(10), nullable=True)
    所注册学校: Mapped[str | None] = mapped_column(String(200), nullable=True)
    已上课时数周期时长: Mapped[str | None] = mapped_column(Text, nullable=True)
    所学过的课程名称: Mapped[str | None] = mapped_column(Text, nullable=True)
    剩余没学的课程名称及剩余课时数: Mapped[str | None] = mapped_column(Text, nullable=True)
    学生寒暑假情况说明: Mapped[str | None] = mapped_column(Text, nullable=True)
    目前学生和家长的想法: Mapped[str | None] = mapped_column(Text, nullable=True)
    下一步对他的工作计划: Mapped[str | None] = mapped_column(Text, nullable=True)
    入学协议签署情况: Mapped[str | None] = mapped_column(String(100), nullable=True)
    放弃就业声明: Mapped[str | None] = mapped_column(String(100), nullable=True)
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "身份证号"),
        Index(None, "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[寒暑假学生明细表.__table__], checkfirst=True)

def init_vacation_students_detail_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int, 月份: int) -> List[寒暑假学生明细表]:
    _migrate()
    return (
        db.query(寒暑假学生明细表)
        .filter(
            寒暑假学生明细表.神殿名称 == 神殿名称,
            寒暑假学生明细表.年份 == 年份,
            寒暑假学生明细表.月份 == 月份,
        )
        .order_by(寒暑假学生明细表.序号.asc().nullsfirst(), 寒暑假学生明细表.学生姓名.asc())
        .all()
    )

def replace_rows(db: Session, *, 神殿名称: str, 年份: int, 月份: int, 行列表: List[Dict[str, Any]]):
    _migrate()
    db.query(寒暑假学生明细表).filter(
        寒暑假学生明细表.神殿名称 == 神殿名称,
        寒暑假学生明细表.年份 == 年份,
        寒暑假学生明细表.月份 == 月份,
    ).delete()

    def _to_int(v) -> Optional[int]:
        try:
            if v in (None, ""):
                return None
            return int(str(v))
        except Exception:
            try:
                return int(float(v))
            except Exception:
                return None

    def _get(d: Dict[str, Any], *keys: str, text_only: bool = False):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return str(d[k]) if text_only else d[k]
        return None

    for r in 行列表:
        姓名 = _get(r, "学生姓名", "studentName", text_only=True)
        身份证 = _get(r, "身份证号", "idCard", text_only=True)
        if not (姓名 or 身份证):
            continue
        db.add(
            寒暑假学生明细表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=int(月份 or 0),
                序号=_to_int(_get(r, "序号", "serialNumber")),
                学生姓名=姓名,
                性别=_get(r, "性别", "gender", text_only=True),
                原班级=_get(r, "原班级", "originalClass", text_only=True),
                原班主任=_get(r, "原班主任", "originalHeadTeacher", text_only=True),
                入学时间=_get(r, "入学时间", "enrollDate", text_only=True),
                第一次离校时间=_get(r, "离校时间", "firstLeaveDate", text_only=True),
                联系电话=_get(r, "联系电话", "contactPhone", text_only=True),
                第二次应复学时间=_get(r, "第二次应复学时间", "secondPlannedReturnDate", text_only=True),
                第二次实际复学时间=_get(r, "实际复学时间", "secondActualReturnDate", text_only=True),
                第二次离校时间=_get(r, "第二次离校时间", "secondLeaveDate", text_only=True),
                第二次班主任=_get(r, "第二次班主任", "secondHeadTeacher", text_only=True),
                第三次应复学时间=_get(r, "第三次应复学时间", "thirdPlannedReturnDate", text_only=True),
                第三次实际复学时间=_get(r, "第三次实际复学时间", "thirdActualReturnDate", text_only=True),
                第三次离校时间=_get(r, "第三次离校时间", "thirdLeaveDate", text_only=True),
                第三次班主任=_get(r, "第三次班主任", "thirdHeadTeacher", text_only=True),
                入学年龄=_get(r, "入学年龄", "enrollAge", text_only=True),
                身份证号=身份证,
                咨询师=_get(r, "咨询师", "consultant", text_only=True),
                应收学费=_to_int(_get(r, "应收学费", "receivableTuition")),
                已收学费=_to_int(_get(r, "已收学费", "paidTuition")),
                所报专业=_get(r, "所报专业", "reportedMajor", text_only=True),
                学制=_get(r, "学制", "educationSystem", text_only=True),
                是否承诺注册学历=_get(r, "是否承诺注册学历", "hasRegistrationCommitment", text_only=True),
                承诺注册学历性质级别名称=_get(r, "承诺注册学历性质级别名称", "registrationCommitmentDetails", text_only=True),
                是否已注册中专大专=_get(r, "是否已注册中专大专", "hasRegistered", text_only=True),
                所注册学校=_get(r, "所注册学校", "registeredSchool", text_only=True),
                已上课时数周期时长=_get(r, "已上课时数、周期时长", "completedCoursesInfo", text_only=True),
                所学过的课程名称=_get(r, "所学过的课程名称", "completedCoursesNames", text_only=True),
                剩余没学的课程名称及剩余课时数=_get(r, "剩余没学的课程名称及剩余课时数", "remainingCoursesInfo", text_only=True),
                学生寒暑假情况说明=_get(r, "寒暑假情况说明", "vacationDescription", text_only=True),
                目前学生和家长的想法=_get(r, "目前学生和家长的想法", "studentParentThoughts", text_only=True),
                下一步对他的工作计划=_get(r, "下一步对他的工作计划", "nextWorkPlan", text_only=True),
                入学协议签署情况=_get(r, "入学协议签署情况", "enrollmentAgreementStatus", text_only=True),
                放弃就业声明=_get(r, "放弃就业声明", "employmentWaiverStatement", text_only=True),
                备注=_get(r, "备注", "remarks", text_only=True),
            )
        )
    db.flush()

