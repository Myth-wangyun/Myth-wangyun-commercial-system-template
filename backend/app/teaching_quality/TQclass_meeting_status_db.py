"""
教学质量模块 - 班会情况表
Schema: teaching_quality

维度：神殿名称 + 班级名称 + 年份 + 月份
存储：每行一条记录（序号行），包含时间、地点、参与人、主题、把控关键点

表：teaching_quality."班会情况表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 班级名称 varchar(100) not null
- 年份 int not null
- 月份 int not null (1..12)
- 序号 int not null              -- 行序号
- 时间 varchar(100)
- 地点 varchar(160)
- 参与人 text
- 主题 text
- 把控关键点 text
唯一：神殿名称 + 班级名称 + 年份 + 月份 + 序号
索引：神殿名称 + 班级名称 + 年份 + 月份
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 班会情况表(AccountBase):
    __tablename__ = "班会情况表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    时间: Mapped[str | None] = mapped_column(String(100), nullable=True)
    地点: Mapped[str | None] = mapped_column(String(160), nullable=True)
    参与人: Mapped[str | None] = mapped_column(Text, nullable=True)
    主题: Mapped[str | None] = mapped_column(Text, nullable=True)
    把控关键点: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "年份", "月份", "序号", name="uq_班会情况_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_班会情况_维度", "神殿名称", "班级名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[班会情况表.__table__])
def init_class_meeting_status_tables():
    _migrate()

def fetch_class_meeting_status_rows(
    db: Session, *, 神殿名称: str, 班级名称: str, 年份: int, 月份: int
) -> List[班会情况表]:
    _migrate()
    return (
        db.query(班会情况表)
        .filter(
            班会情况表.神殿名称 == 神殿名称,
            班会情况表.班级名称 == 班级名称,
            班会情况表.年份 == 年份,
            班会情况表.月份 == 月份,
        )
        .order_by(班会情况表.序号)
        .all()
    )

def replace_class_meeting_status_rows(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入指定班级+年月的班会情况表。
    支持字段：序号/时间/地点/参与人/主题/把控关键点
    兼容英文字段：time/location/participants/topic/keyPoints
    """
    _migrate()
    db.query(班会情况表).filter(
        班会情况表.神殿名称 == 神殿名称,
        班会情况表.班级名称 == 班级名称,
        班会情况表.年份 == 年份,
        班会情况表.月份 == 月份,
    ).delete()

    for i, r in enumerate(行列表, start=1):
        # 若未提供“序号”，按传入顺序自动编号，避免唯一约束冲突
        _oid = r.get("序号")
        try:
            序号 = int(_oid) if _oid is not None else i
        except Exception:
            序号 = i
        时间 = r.get("时间") or r.get("time")
        地点 = r.get("地点") or r.get("location")
        参与人 = r.get("参与人") or r.get("participants")
        主题 = r.get("主题") or r.get("topic")
        把控关键点 = r.get("把控关键点") or r.get("keyPoints")
        # 跳过完全空白行
        if not (时间 or 地点 or 参与人 or 主题 or 把控关键点):
            continue
        db.add(
            班会情况表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                年份=年份,
                月份=月份,
                序号=序号,
                时间=时间,
                地点=地点,
                参与人=参与人,
                主题=主题,
                把控关键点=把控关键点,
            )
        )

    db.flush()

