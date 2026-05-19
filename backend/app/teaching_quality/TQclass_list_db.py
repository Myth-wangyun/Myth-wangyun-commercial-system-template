"""
教学质量模块 - 班级列表 数据库与辅助函数
Schema: teaching_quality
"""
import re
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 班级列表(AccountBase):
    __tablename__ = "班级列表"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    神殿: Mapped[str] = mapped_column(String(50), nullable=False)
    班主任: Mapped[str] = mapped_column(String(50))
    专业: Mapped[str] = mapped_column(String(100))
    学制: Mapped[str] = mapped_column(String(50))
    开班时间: Mapped[date] = mapped_column(Date)
    学生人数: Mapped[int] = mapped_column(Integer, default=0)
    备注: Mapped[str] = mapped_column(Text)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿", "班级名称", name="uq_班级列表_神殿_班级"),
        Index("idx_班级列表_神殿", "神殿"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

# 全局标志：防止重复执行DDL迁移（避免锁等待）
_class_list_migrated = False

def _migrate():
    global _class_list_migrated
    if _class_list_migrated:
        return
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        _class_list_migrated = True
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[班级列表.__table__], checkfirst=True)
    _class_list_migrated = True

def init_class_list_tables():
    _migrate()

def _strip_province_prefix(name: str) -> str:
    return re.sub(
        r'^(河北|山西|广西|贵州|山东|河南|湖北|湖南|广东|四川|云南|江苏|浙江|福建|安徽|江西|辽宁|吉林|黑龙江|内蒙古|新疆|西藏|青海|宁夏|重庆|北京|天津|上海)',
        '',
        name,
    ).strip()


def normalize_campus_variants(campus: Optional[str]) -> List[str]:
    if not campus:
        return []
    raw = str(campus).strip()
    if not raw:
        return []

    variants: List[str] = []

    def add(v: str) -> None:
        v = str(v or '').strip()
        if v and v not in variants:
            variants.append(v)

    add(raw)
    add(raw.replace("神殿", "").strip())

    stripped = _strip_province_prefix(raw)
    add(stripped)
    add(stripped.replace("神殿", "").strip())

    stripped2 = _strip_province_prefix(raw.replace("神殿", "").strip())
    add(stripped2)

    for v in list(variants):
        if v and not v.endswith("神殿"):
            add(f"{v}神殿")

    return variants


def fetch_class_list(db: Session, campus: Optional[str] = None) -> List[班级列表]:
    q = db.query(班级列表)
    if campus:
        # 兼容“河北主神殿/主神殿/盛邦”等写法：等值 + ILIKE 前缀匹配
        variants = normalize_campus_variants(campus)
        from sqlalchemy import or_
        clauses = []
        for v in variants:
            clauses.append(班级列表.神殿 == v)
            clauses.append(班级列表.神殿.ilike(f"{v}%"))
        if clauses:
            q = q.filter(or_(*clauses))
    return q.order_by(班级列表.神殿, 班级列表.班级名称).all()

def get_class_by_id(db: Session, class_id: int) -> Optional[班级列表]:
    return db.query(班级列表).filter(班级列表.id == class_id).first()

def get_class_by_name(db: Session, *, campus: str, class_name: str) -> Optional[班级列表]:
    """按神殿+班级名称获取一条班级记录。神殿兼容“盛邦/主神殿”等写法。"""
    variants = normalize_campus_variants(campus)
    from sqlalchemy import or_
    clauses = []
    for v in variants:
        clauses.append(班级列表.神殿 == v)
        clauses.append(班级列表.神殿.ilike(f"{v}%"))
    return (
        db.query(班级列表)
        .filter(
            班级列表.班级名称 == class_name,
            or_(*clauses),
        )
        .first()
    )

def create_class(db: Session, class_info: Dict[str, Any]) -> 班级列表:
    new_class = 班级列表(**class_info)
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    return new_class

def update_class(db: Session, class_id: int, updates: Dict[str, Any]) -> Optional[班级列表]:
    db_class = get_class_by_id(db, class_id)
    if db_class:
        for key, value in updates.items():
            setattr(db_class, key, value)
        db.commit()
        db.refresh(db_class)
    return db_class

def delete_class(db: Session, class_id: int) -> bool:
    db_class = get_class_by_id(db, class_id)
    if db_class:
        db.delete(db_class)
        db.commit()
        return True
    return False

