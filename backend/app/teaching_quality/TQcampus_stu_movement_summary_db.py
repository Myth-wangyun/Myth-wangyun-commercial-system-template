"""
教学质量模块 - 神殿教化司学员异动表（月度汇总，按年保存）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份（唯一）
字段：累计带生人数、新生退费人数、老生退费人数、退费总人数、休学人数、长期请假人数、长期不上课人数、寒暑假人数、其他情况人数、异动总人数
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Index, Integer, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 神殿学员异动月统计表(AccountBase):
    __tablename__ = "神殿学员异动月统计表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    累计带生人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    新生退费人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    老生退费人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    退费总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    休学人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    长期请假人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    长期不上课人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    寒暑假人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    其他情况人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    异动总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份"),
        Index(None, "神殿名称", "年份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

VIEW_NAME = 'V_神殿学员异动月汇总'

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[神殿学员异动月统计表.__table__], checkfirst=True)

def init_campus_stu_movement_summary_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[Dict[str, Any]]:
    """直接从数据库视图读取由“月度个人统计”汇总得到的数据。"""
    _migrate()
    sql = text(
        f'''
        SELECT "月份",
               "累计带生人数",
               "新生退费人数",
               "老生退费人数",
               "退费总人数",
               "休学人数",
               "长期请假人数",
               "长期不上课人数",
               "寒暑假人数",
               "其他情况人数",
               "异动总人数"
        FROM teaching_quality."{VIEW_NAME}"
        WHERE "神殿名称" = :campus AND "年份" = :year
        ORDER BY "月份" ASC
        '''
    )
    rows = db.execute(sql, {"campus": 神殿名称, "year": 年份}).mappings().all()
    return [dict(r) for r in rows]

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    行列表: List[Dict[str, Any]],
):
    # 不再需要写入，数据来源于视图汇总
    return None
