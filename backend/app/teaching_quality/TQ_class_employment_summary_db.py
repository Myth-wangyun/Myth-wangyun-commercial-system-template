"""
教学质量模块 - QT班级就业信息汇总表
Schema: teaching_quality

维度：神殿名称 + 年份 + 班级名称（唯一）
说明：存储班级维度的就业汇总信息，部分手填，部分自动计算。
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class QT班级就业信息汇总表(AccountBase):
    __tablename__ = "QT班级就业信息汇总表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)

    结案人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    需就业人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际就业人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际就业率: Mapped[float | None] = mapped_column(Float, nullable=True)
    实际需就业率: Mapped[float | None] = mapped_column(Float, nullable=True)
    目标平均薪资: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际平均薪资: Mapped[int | None] = mapped_column(Integer, nullable=True)
    就业达标率: Mapped[float | None] = mapped_column(Float, nullable=True)
    教员: Mapped[str | None] = mapped_column(String(100), nullable=True)
    班主任: Mapped[str | None] = mapped_column(String(100), nullable=True)
    毕业时间: Mapped[str | None] = mapped_column(String(50), nullable=True)  # YYYY-MM-DD 或 YYYY-MM

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "班级名称", name="uq_QT班级就业汇总_班级唯一"),
        # Index 移至 _migrate() 中手动创建，避免重复定义
        Index("idx_QT班级就业汇总_神殿年份班级", "神殿名称", "年份", "班级名称"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

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
    AccountBase.metadata.create_all(bind=engine, tables=[QT班级就业信息汇总表.__table__], checkfirst=True)
    _MIGRATED = True

def init_qt_class_employment_summary_tables():
    _migrate()

def _init_if_needed():
    if not _MIGRATED:
        _migrate()

def fetch_summary(db: Session, *, 神殿名称: str, 年份: int, 班级名称: str) -> Optional[QT班级就业信息汇总表]:

    from sqlalchemy import or_
    norm = str(神殿名称).strip()
    norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
    return (
        db.query(QT班级就业信息汇总表)
        .filter(
            QT班级就业信息汇总表.年份 == 年份,
            QT班级就业信息汇总表.班级名称 == 班级名称,
            or_(
                QT班级就业信息汇总表.神殿名称 == norm,
                QT班级就业信息汇总表.神殿名称 == norm2,
                QT班级就业信息汇总表.神殿名称.ilike(f"{norm}%"),
                QT班级就业信息汇总表.神殿名称.ilike(f"{norm2}%"),
            ),
        )
        .first()
    )

def fetch_summaries_by_campus_and_year(db: Session, *, 神殿名称: str, 年份: int) -> List[QT班级就业信息汇总表]:
    """获取指定神殿和年份的所有班级就业汇总信息。"""

    from sqlalchemy import or_
    norm = str(神殿名称).strip()
    norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
    return (
        db.query(QT班级就业信息汇总表)
        .filter(
            QT班级就业信息汇总表.年份 == 年份,
            or_(
                QT班级就业信息汇总表.神殿名称 == norm,
                QT班级就业信息汇总表.神殿名称 == norm2,
                QT班级就业信息汇总表.神殿名称.ilike(f"{norm}%"),
                QT班级就业信息汇总表.神殿名称.ilike(f"{norm2}%"),
            ),
        )
        .order_by(QT班级就业信息汇总表.班级名称)
        .all()
    )

def _normalize_campus_name(campus: str) -> str:
    """统一神殿名称格式：去掉末尾的'神殿'后缀，保持一致性存储。"""
    name = str(campus or "").strip()
    if name.endswith("神殿"):
        name = name[:-2]
    return name

def upsert_summary(db: Session, *, data: Dict[str, Any]):
    """更新或插入汇总数据。
    
    注意：神殿名称会被标准化（去掉'神殿'后缀）以保持一致性。
    """
    from sqlalchemy import or_
    
    # 标准化神殿名称
    normalized_campus = _normalize_campus_name(data.get("神殿名称", ""))
    
    # 查找现有记录（使用变体查询）
    existing = fetch_summary(db, 神殿名称=data["神殿名称"], 年份=data["年份"], 班级名称=data["班级名称"])
    
    if existing:
        # 更新：确保所有字段都被更新，但神殿名称使用标准化后的
        for key, value in data.items():
            if hasattr(existing, key):
                if key == "神殿名称":
                    setattr(existing, key, normalized_campus)
                else:
                    setattr(existing, key, value)
    else:
        # 删除可能存在的其他神殿名称变体的记录，避免重复
        norm = normalized_campus
        norm2 = f"{norm}神殿"
        db.query(QT班级就业信息汇总表).filter(
            QT班级就业信息汇总表.年份 == data["年份"],
            QT班级就业信息汇总表.班级名称 == data["班级名称"],
            or_(
                QT班级就业信息汇总表.神殿名称 == norm,
                QT班级就业信息汇总表.神殿名称 == norm2,
            ),
        ).delete(synchronize_session=False)
        
        # 使用标准化的神殿名称插入
        insert_data = data.copy()
        insert_data["神殿名称"] = normalized_campus
        new_summary = QT班级就业信息汇总表(**insert_data)
        db.add(new_summary)
    
    db.flush()