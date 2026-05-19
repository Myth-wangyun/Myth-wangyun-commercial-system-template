"""
教学质量模块 - 口碑招生关键点年度明细 表 与辅助函数
Schema: teaching_quality

表：teaching_quality."口碑招生关键点年度明细表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 年份 int not null
- 月份 int not null (1..12)
- 类别 varchar(10) not null  -- 老生/新生/毕业生
- 朋友圈数量 int
- 抖音数量 int
- 快手数量 int
- 小红书数量 int
- 在校生访谈 int
- 毕业生访谈 int
- 家长访谈 int
- 活动次数 int
- 比赛次数 int
- 送考报名次 int
唯一：神殿名称 + 年份 + 月份 + 类别
索引：神殿名称 + 年份 + 月份
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Index, Integer, String, UniqueConstraint, inspect
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import engine, ensure_teaching_quality_schema
from app.models.user import Base as AccountBase


class 口碑招生关键点年度明细表(AccountBase):
    __tablename__ = "口碑招生关键点年度明细表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    类别: Mapped[str] = mapped_column(String(10), nullable=False)  # 老生/新生/毕业生

    朋友圈数量: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    抖音数量: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    快手数量: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    小红书数量: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    在校生访谈: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    毕业生访谈: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    家长访谈: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    活动次数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    比赛次数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    送考报名次: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "类别", name="uq_口碑年度明细_维度类别"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_口碑年度明细_维度", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    if not inspect(engine).has_table('口碑招生关键点年度明细表', schema='teaching_quality'):
        AccountBase.metadata.create_all(bind=engine, tables=[口碑招生关键点年度明细表.__table__])
def init_reputation_keypoint_yearly_tables():
    _migrate()

def fetch_reputation_keypoint_yearly_rows(
    db: Session, *, 神殿名称: str, 年份: int
) -> List[口碑招生关键点年度明细表]:
    _migrate()
    return (
        db.query(口碑招生关键点年度明细表)
        .filter(
            口碑招生关键点年度明细表.神殿名称 == 神殿名称,
            口碑招生关键点年度明细表.年份 == 年份,
        )
        .order_by(口碑招生关键点年度明细表.月份, 口碑招生关键点年度明细表.类别)
        .all()
    )

def replace_reputation_keypoint_yearly_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    行列表: List[Dict[str, Any]],
):
    _migrate()
    db.query(口碑招生关键点年度明细表).filter(
        口碑招生关键点年度明细表.神殿名称 == 神殿名称,
        口碑招生关键点年度明细表.年份 == 年份,
    ).delete()

    for row in 行列表:
        db.add(
            口碑招生关键点年度明细表(
                神殿名称=神殿名称,
                年份=年份,
                月份=row.get("月份", 0) or 0,
                类别=row.get("类别") or "",
                朋友圈数量=row.get("朋友圈数量", 0) or 0,
                抖音数量=row.get("抖音数量", 0) or 0,
                快手数量=row.get("快手数量", 0) or 0,
                小红书数量=row.get("小红书数量", 0) or 0,
                在校生访谈=row.get("在校生访谈", 0) or 0,
                毕业生访谈=row.get("毕业生访谈", 0) or 0,
                家长访谈=row.get("家长访谈", 0) or 0,
                活动次数=row.get("活动次数", 0) or 0,
                比赛次数=row.get("比赛次数", 0) or 0,
                送考报名次=row.get("送考报名次", 0) or 0,
            )
        )
    db.flush()

