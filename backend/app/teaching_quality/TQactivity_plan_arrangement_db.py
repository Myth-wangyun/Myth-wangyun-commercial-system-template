"""
教学质量模块 - 神殿活动计划安排表 数据库与辅助函数
Schema: teaching_quality

表：teaching_quality."神殿活动计划安排表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 年份 int not null
- 月份 int not null (1..12)
- 序号 int not null
- 时间 varchar(100)
- 地点 varchar(100)
- 活动形式 varchar(100)
- 主要内容 text
- 负责人 varchar(50)
- 预期结果 text
- 过程关键点 text
- 实标结果 text
唯一：神殿名称 + 年份 + 月份 + 序号
索引：神殿名称 + 年份 + 月份
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 神殿活动计划安排表(AccountBase):
    __tablename__ = "神殿活动计划安排表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    时间: Mapped[str | None] = mapped_column(String(100), nullable=True)
    地点: Mapped[str | None] = mapped_column(String(100), nullable=True)
    活动形式: Mapped[str | None] = mapped_column(String(100), nullable=True)
    主要内容: Mapped[str | None] = mapped_column(Text, nullable=True)
    负责人: Mapped[str | None] = mapped_column(String(50), nullable=True)
    预期结果: Mapped[str | None] = mapped_column(Text, nullable=True)
    过程关键点: Mapped[str | None] = mapped_column(Text, nullable=True)
    实标结果: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "序号", name="uq_神殿活动计划_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_神殿活动计划_维度", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[神殿活动计划安排表.__table__])
def init_activity_plan_tables():
    _migrate()

def fetch_activity_plan_rows(
    db: Session, *, 神殿名称: str, 年份: int, 月份: int
) -> List[神殿活动计划安排表]:
    _migrate()
    return (
        db.query(神殿活动计划安排表)
        .filter(
            神殿活动计划安排表.神殿名称 == 神殿名称,
            神殿活动计划安排表.年份 == 年份,
            神殿活动计划安排表.月份 == 月份,
        )
        .order_by(神殿活动计划安排表.序号)
        .all()
    )

def replace_activity_plan_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    _migrate()
    db.query(神殿活动计划安排表).filter(
        神殿活动计划安排表.神殿名称 == 神殿名称,
        神殿活动计划安排表.年份 == 年份,
        神殿活动计划安排表.月份 == 月份,
    ).delete()

    for row in sorted(行列表, key=lambda x: x.get("序号", 0)):
        db.add(
            神殿活动计划安排表(
                神殿名称=神殿名称,
                年份=年份,
                月份=月份,
                序号=row.get("序号", 0),
                时间=row.get("时间"),
                地点=row.get("地点"),
                活动形式=row.get("活动形式"),
                主要内容=row.get("主要内容"),
                负责人=row.get("负责人"),
                预期结果=row.get("预期结果"),
                过程关键点=row.get("过程关键点"),
                实标结果=row.get("实标结果"),
            )
        )
    db.flush()

