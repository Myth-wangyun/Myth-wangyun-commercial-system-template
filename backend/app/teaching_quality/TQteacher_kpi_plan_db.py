"""
教学质量模块 - 班主任KPI计划 数据库与辅助函数（PostgreSQL teaching_quality schema）
文件位置：backend/app/teaching-quality

- 主表：teaching_quality."班主任KPI计划表"
  神殿名称、年份、月份、序号、姓名、KPI指标、KPI名称、计算细则、数据来源、权重、备注、得分(上级领导打分)、KPI值、行类型

说明：原附表(teaching_quality."班主任KPI计划附表")已废弃，迁移时会自动删除。

按“神殿+年+月”维度覆盖写入/读取。
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 班主任KPI计划表(AccountBase):
    __tablename__ = "班主任KPI计划表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int | None] = mapped_column(Integer, nullable=True)
    月份: Mapped[int | None] = mapped_column(Integer, nullable=True)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)
    姓名: Mapped[str | None] = mapped_column(String(50), nullable=True)
    KPI指标: Mapped[str | None] = mapped_column(String(50), nullable=True)
    KPI名称: Mapped[str | None] = mapped_column(String(200), nullable=True)
    计算细则: Mapped[str | None] = mapped_column(Text, nullable=True)
    数据来源: Mapped[str | None] = mapped_column(String(100), nullable=True)
    权重: Mapped[float | None] = mapped_column(Float, nullable=True)
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)
    得分: Mapped[float | None] = mapped_column(Float, nullable=True)
    KPI值: Mapped[float | None] = mapped_column(Float, nullable=True)
    行类型: Mapped[str | None] = mapped_column(String(20), nullable=True)  # data/total

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "姓名", "序号", name="uq_班主任kpi_神殿年月姓名序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_班主任kpi_神殿年月", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    """确保 schema/表/索引/唯一约束存在，并清理废弃附表（幂等）。"""
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()

    # 创建主表
    AccountBase.metadata.create_all(bind=engine, tables=[班主任KPI计划表.__table__])

def init_teacher_kpi_tables():
    _migrate()

def fetch_teacher(db: Session, *, 神殿名称: str, 年份: Optional[int] = None, 月份: Optional[int] = None):
    _migrate()
    q = db.query(班主任KPI计划表).filter(班主任KPI计划表.神殿名称 == 神殿名称)
    if 年份 is not None:
        q = q.filter(班主任KPI计划表.年份 == 年份)
    if 月份 is not None:
        q = q.filter(班主任KPI计划表.月份 == 月份)
    return q.order_by(班主任KPI计划表.姓名, 班主任KPI计划表.序号).all()

def replace_teacher(
    db: Session,
    *,
    神殿名称: str,
    年份: Optional[int],
    月份: Optional[int],
    主表: List[Dict[str, Any]],
):
    _migrate()
    q = db.query(班主任KPI计划表).filter(班主任KPI计划表.神殿名称 == 神殿名称)
    if 年份 is not None:
        q = q.filter(班主任KPI计划表.年份 == 年份)
    else:
        q = q.filter(班主任KPI计划表.年份.is_(None))
    if 月份 is not None:
        q = q.filter(班主任KPI计划表.月份 == 月份)
    else:
        q = q.filter(班主任KPI计划表.月份.is_(None))
    q.delete()

    for row in sorted(行列表 := 主表, key=lambda x: (x.get("姓名") or "", x.get("序号", 0))):
        db.add(
            班主任KPI计划表(
                神殿名称=神殿名称,
                年份=年份,
                月份=月份,
                序号=row.get("序号"),
                姓名=row.get("姓名"),
                KPI指标=row.get("KPI指标"),
                KPI名称=row.get("KPI名称"),
                计算细则=row.get("计算细则"),
                数据来源=row.get("数据来源"),
                权重=row.get("权重"),
                备注=row.get("备注"),
                得分=row.get("得分"),
                KPI值=row.get("KPI值"),
                行类型=row.get("行类型"),
            )
        )
