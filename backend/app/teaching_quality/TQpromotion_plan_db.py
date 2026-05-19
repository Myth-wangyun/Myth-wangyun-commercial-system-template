"""
教学质量模块 - 升学计划表 数据库与辅助函数（PostgreSQL teaching_quality schema）
一页一表：frontend 5-promotion/PromotionPlanTable 对应此表。

表：teaching_quality."升学计划表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 班级名称 varchar(100) null（前端可传，若没有可为 NULL/默认班级）
- 年份 int null
- 月份 int null (1..12)
- 序号 int not null（行序，前端可用索引/Date排序生成）
- 记录日期 date
- 星期 varchar(20)
- 核心任务 varchar(20)（活动/访谈/班会）
- 具体操作 text
- 实施地点 varchar(100)
- 实施者 varchar(50)
- 交付内容 text
- 监督人 varchar(50)
- 完成情况 varchar(20)（已完成/进行中/未开始）
唯一：神殿名称 + 班级名称 + 年份 + 月份 + 序号
索引：神殿名称 + 班级名称 + 年份 + 月份
"""
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 升学计划表(AccountBase):
    __tablename__ = "升学计划表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str | None] = mapped_column(String(100), nullable=True)
    年份: Mapped[int | None] = mapped_column(Integer, nullable=True)
    月份: Mapped[int | None] = mapped_column(Integer, nullable=True)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    记录日期: Mapped[date | None] = mapped_column(Date, nullable=True)
    星期: Mapped[str | None] = mapped_column(String(20), nullable=True)
    核心任务: Mapped[str | None] = mapped_column(String(20), nullable=True)
    具体操作: Mapped[str | None] = mapped_column(Text, nullable=True)
    实施地点: Mapped[str | None] = mapped_column(String(100), nullable=True)
    实施者: Mapped[str | None] = mapped_column(String(50), nullable=True)
    交付内容: Mapped[str | None] = mapped_column(Text, nullable=True)
    监督人: Mapped[str | None] = mapped_column(String(50), nullable=True)
    完成情况: Mapped[str | None] = mapped_column(String(20), nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "年份", "月份", "序号", name="uq_升学计划_神殿班级年月序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_升学计划_神殿班级年月", "神殿名称", "班级名称", "年份", "月份"),
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
    # 首次创建
    AccountBase.metadata.create_all(bind=engine, tables=[升学计划表.__table__])
    _MIGRATED = True

def init_promotion_plan_tables():
    _migrate()

def fetch_plan_rows(
    db: Session, *, 神殿名称: str, 班级名称: Optional[str] = None, 年份: Optional[int] = None, 月份: Optional[int] = None
) -> List[升学计划表]:
    _migrate()
    q = db.query(升学计划表).filter(升学计划表.神殿名称 == 神殿名称)
    if 班级名称 is not None:
        q = q.filter(升学计划表.班级名称 == 班级名称)
    else:
        q = q.filter(升学计划表.班级名称.is_(None))
    if 年份 is not None:
        q = q.filter(升学计划表.年份 == 年份)
    if 月份 is not None:
        q = q.filter(升学计划表.月份 == 月份)
    return q.order_by(升学计划表.年份, 升学计划表.月份, 升学计划表.序号, 升学计划表.记录日期).all()

def replace_plan_rows(
    db: Session,
    *,
    神殿名称: str,
    班级名称: Optional[str],
    年份: Optional[int],
    月份: Optional[int],
    行列表: List[Dict[str, Any]],
):
    _migrate()
    q = db.query(升学计划表).filter(升学计划表.神殿名称 == 神殿名称)
    if 班级名称 is not None:
        q = q.filter(升学计划表.班级名称 == 班级名称)
    else:
        q = q.filter(升学计划表.班级名称.is_(None))
    if 年份 is not None:
        q = q.filter(升学计划表.年份 == 年份)
    else:
        q = q.filter(升学计划表.年份.is_(None))
    if 月份 is not None:
        q = q.filter(升学计划表.月份 == 月份)
    else:
        q = q.filter(升学计划表.月份.is_(None))
    q.delete()

    for row in sorted(行列表, key=lambda x: x.get("序号", 0)):
        # 记录日期转换：字符串 -> date
        rd = row.get("记录日期")
        rd_date = None
        if isinstance(rd, date):
            rd_date = rd
        elif isinstance(rd, str) and rd:
            try:
                rd_date = date.fromisoformat(rd)
            except Exception:
                rd_date = None

        db.add(
            升学计划表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                年份=年份,
                月份=月份,
                序号=row.get("序号", 0),
                记录日期=rd_date,
                星期=row.get("星期"),
                核心任务=row.get("核心任务"),
                具体操作=row.get("具体操作"),
                实施地点=row.get("实施地点"),
                实施者=row.get("实施者"),
                交付内容=row.get("交付内容"),
                监督人=row.get("监督人"),
                完成情况=row.get("完成情况"),
            )
        )
    db.flush()
