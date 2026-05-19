"""
教学质量模块 - 班级档案表（与班级列表关联）
Schema: teaching_quality

维度：神殿名称 + 班级名称
- 可选关联：班级ID -> teaching_quality."班级列表"(id)
- 记录粒度：一名学员一行，按“序号”排序

提供：
- init_class_file_tables()
- fetch_class_file_rows(db, 神殿名称, 班级名称)
- replace_class_file_rows(db, 神殿名称, 班级名称, 行列表)
"""
from __future__ import annotations

from datetime import date, datetime
from datetime import date as pydate
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Date,
    DateTime,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 班级档案表(AccountBase):
    __tablename__ = "班级档案表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    班级ID: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 仅存储关联ID，不加外键约束，避免跨模块装载顺序问题
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    姓名: Mapped[str] = mapped_column(String(100))
    性别: Mapped[str] = mapped_column(String(10))
    身份证号: Mapped[str] = mapped_column(Text)
    入学时间: Mapped[date | None] = mapped_column(Date, nullable=True)
    入学年龄: Mapped[str] = mapped_column(String(10))
    学历: Mapped[str] = mapped_column(String(50))
    毕业时间: Mapped[date | None] = mapped_column(Date, nullable=True)
    毕业年龄: Mapped[str] = mapped_column(String(10))
    最高学历及性质: Mapped[str] = mapped_column(String(200))
    神殿来源: Mapped[str] = mapped_column(String(100))
    招生神殿: Mapped[str] = mapped_column(String(100))
    咨询师: Mapped[str] = mapped_column(String(50))
    所报专业: Mapped[str] = mapped_column(String(100))
    学制: Mapped[str] = mapped_column(String(50))
    开班时间: Mapped[date | None] = mapped_column(Date, nullable=True)
    应收学费金额: Mapped[str] = mapped_column(String(50))  # 以文本存储，避免前端格式差异
    班主任姓名: Mapped[str] = mapped_column(String(50))
    往任班主任: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)  # 存储往任班主任列表
    学员状态: Mapped[str] = mapped_column(String(50))
    过往专业: Mapped[str] = mapped_column(String(100))
    毕业学校: Mapped[str] = mapped_column(String(200))
    联系电话: Mapped[str] = mapped_column(String(50))
    家长电话: Mapped[str] = mapped_column(String(200))
    通信地址: Mapped[str] = mapped_column(Text)
    户口性质: Mapped[str] = mapped_column(String(50))
    就读方式: Mapped[str] = mapped_column(String(50))
    现住址: Mapped[str] = mapped_column(Text)
    是否承诺注册学历: Mapped[str] = mapped_column(String(10))
    承诺注册学历性质: Mapped[str] = mapped_column(String(50))
    承诺注册学历级别: Mapped[str] = mapped_column(String(50))
    学历学校名称: Mapped[str] = mapped_column(String(200))
    是否已注册中专或大专: Mapped[str] = mapped_column(String(50))
    所注册学校: Mapped[str] = mapped_column(String(200))
    备注: Mapped[str] = mapped_column(Text)
    审批无需就业: Mapped[str] = mapped_column(String(50))

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "序号", name="uq_班级档案_神殿班级序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义
        Index("idx_班级档案_神殿班级", "神殿名称", "班级名称"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

# =============== 迁移 ===============

_MIGRATED = False

def _migrate():
    global _MIGRATED
    if _MIGRATED:
        return
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        _MIGRATED = True
        return
    ensure_teaching_quality_schema()
    # 使用 checkfirst=True 确保幂等创建
    AccountBase.metadata.create_all(bind=engine, tables=[班级档案表.__table__], checkfirst=True)
    _MIGRATED = True

def init_class_file_tables():
    _migrate()

# =============== 工具 ===============

def _to_date(val) -> Optional[pydate]:
    if isinstance(val, pydate):
        return val
    if isinstance(val, str) and val:
        try:
            return pydate.fromisoformat(val)
        except Exception:
            return None
    return None

# =============== CRUD ===============

def _campus_variants(campus: str) -> List[str]:
    """兼容神殿名称：支持'测试'/'测试神殿'/' 测试神殿 '等。"""
    c0 = (campus or "").strip()
    c1 = c0.rstrip("神殿").strip()
    variants = {c0, c1, f"{c1}神殿" if c1 else c0}
    return [v for v in variants if v]

def fetch_class_file_rows(db: Session, *, 神殿名称: str, 班级名称: str) -> List[班级档案表]:
    _migrate()
    variants = _campus_variants(神殿名称)
    return (
        db.query(班级档案表)
        .filter(
            func.trim(班级档案表.神殿名称).in_(variants),
            班级档案表.班级名称 == 班级名称,
        )
        .order_by(班级档案表.序号)
        .all()
    )

def replace_class_file_rows(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入某神殿某班级的班级档案。行元素兼容前端键名与中文键名。"""
    _migrate()
    variants = _campus_variants(神殿名称)

    # optional: 关联班级ID
    try:
        from .class_list_db import 班级列表  # type: ignore
        cls_row = (
            db.query(班级列表)
            .filter(func.trim(班级列表.神殿).in_(variants), 班级列表.班级名称 == 班级名称)
            .first()
        )
        班级ID: Optional[int] = cls_row.id if cls_row else None
    except Exception:
        班级ID = None

    # 删除同一“逻辑神殿”的所有变体，避免出现 campus=测试 与 campus=测试神殿 各存一份数据导致前端展示不全
    db.query(班级档案表).filter(
        func.trim(班级档案表.神殿名称).in_(variants),
        班级档案表.班级名称 == 班级名称,
    ).delete(synchronize_session=False)

    def _g(d: Dict[str, Any], *keys: str) -> Any:
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return d[k]
        return None

    for r in sorted(行列表, key=lambda x: int((_g(x, "serialNumber", "序号") or 0))):
        db.add(
            班级档案表(
                班级ID=班级ID,
                神殿名称=神殿名称,
                班级名称=班级名称,
                序号=int(_g(r, "serialNumber", "序号") or 0),
                姓名=_g(r, "name", "姓名"),
                性别=_g(r, "gender", "性别"),
                身份证号=_g(r, "idCard", "身份证号"),
                入学时间=_to_date(_g(r, "enrollmentDate", "入学时间")),
                入学年龄=str(_g(r, "enrollmentAge", "入学年龄") or ""),
                学历=_g(r, "education", "学历"),
                毕业时间=_to_date(_g(r, "graduationDate", "毕业时间")),
                毕业年龄=str(_g(r, "graduationAge", "毕业年龄") or ""),
                最高学历及性质=_g(r, "highestEducationAndType", "最高学历及性质"),
                神殿来源=_g(r, "campusSource", "神殿来源"),
                招生神殿=_g(r, "enrollmentCampus", "招生神殿"),
                咨询师=_g(r, "consultant", "咨询师"),
                所报专业=_g(r, "reportedMajor", "所报专业"),
                学制=_g(r, "schoolingLength", "学制"),
                开班时间=_to_date(_g(r, "openingDate", "开班时间")),
                应收学费金额=str(_g(r, "tuitionAmount", "应收学费金额") or ""),
                班主任姓名=_g(r, "headTeacher", "班主任姓名"),
                往任班主任=_g(r, "formerHeadTeachers", "往任班主任"),
                学员状态=_g(r, "studentStatus", "学员状态"),
                过往专业=_g(r, "previousMajor", "过往专业"),
                毕业学校=_g(r, "graduateSchool", "毕业学校"),
                联系电话=_g(r, "phone", "联系电话"),
                家长电话=_g(r, "parentPhone", "家长电话"),
                通信地址=_g(r, "address", "通信地址"),
                户口性质=_g(r, "householdType", "户口性质"),
                就读方式=_g(r, "studyMode", "就读方式"),
                现住址=_g(r, "currentAddress", "现住址"),
                是否承诺注册学历=_g(r, "promisedRegisterEducation", "是否承诺注册学历"),
                承诺注册学历性质=_g(r, "promisedEducationNature", "承诺注册学历性质"),
                承诺注册学历级别=_g(r, "promisedEducationLevel", "承诺注册学历级别"),
                学历学校名称=_g(r, "educationSchoolName", "学历学校名称"),
                是否已注册中专或大专=_g(r, "registeredSecondaryOrCollege", "是否已注册中专/大专"),
                所注册学校=_g(r, "registeredSchool", "所注册学校"),
                备注=_g(r, "remark", "备注"),
                审批无需就业=_g(r, "employmentApprovalStatus", "审批无需就业"),
            )
        )
    db.flush()

