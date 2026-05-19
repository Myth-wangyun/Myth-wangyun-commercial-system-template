"""
教学质量模块 - 口碑招生关键点结果汇总表 数据库与辅助函数
Schema: teaching_quality

表：teaching_quality."口碑招生关键点结果汇总表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 年份 int not null
- 月份 int not null (1..12)
- 序号 int not null
- 班主任姓名 varchar(50)
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
- 行类型 varchar(10) default 'data' (data | total)
唯一：神殿名称 + 年份 + 月份 + 序号
索引：神殿名称 + 年份 + 月份
"""
import threading
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import engine, ensure_teaching_quality_schema
from app.models.user import Base as AccountBase

_init_lock = threading.Lock()
_initialized = False

class 口碑招生关键点结果汇总表(AccountBase):
    __tablename__ = "口碑招生关键点结果汇总表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    班主任姓名: Mapped[str | None] = mapped_column(String(50), nullable=True)
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
    行类型: Mapped[str] = mapped_column(String(10), nullable=False, default='data')

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "序号", name="uq_口碑关键点_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_口碑关键点_维度", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    global _initialized
    if _initialized:
        return
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        _initialized = True
        return
    with _init_lock:
        if _initialized:
            return
        ensure_teaching_quality_schema()
        # 始终使用 checkfirst 创建表（若不存在）
        AccountBase.metadata.create_all(bind=engine, tables=[口碑招生关键点结果汇总表.__table__], checkfirst=True)
        _initialized = True

def init_reputation_keypoint_tables():
    _migrate()

def fetch_reputation_keypoint_rows(
    db: Session, *, 神殿名称: str, 年份: int, 月份: int
) -> List[口碑招生关键点结果汇总表]:
    _migrate()
    return (
        db.query(口碑招生关键点结果汇总表)
        .filter(
            口碑招生关键点结果汇总表.神殿名称 == 神殿名称,
            口碑招生关键点结果汇总表.年份 == 年份,
            口碑招生关键点结果汇总表.月份 == 月份,
        )
        .order_by(口碑招生关键点结果汇总表.序号)
        .all()
    )

def replace_reputation_keypoint_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    _migrate()
    db.query(口碑招生关键点结果汇总表).filter(
        口碑招生关键点结果汇总表.神殿名称 == 神殿名称,
        口碑招生关键点结果汇总表.年份 == 年份,
        口碑招生关键点结果汇总表.月份 == 月份,
    ).delete()

    for row in sorted(行列表, key=lambda x: x.get("序号", 0)):
        db.add(
            口碑招生关键点结果汇总表(
                神殿名称=神殿名称,
                年份=年份,
                月份=月份,
                序号=row.get("序号", 0),
                班主任姓名=row.get("班主任姓名"),
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
                行类型=row.get("行类型", "data"),
            )
        )
    db.flush()

