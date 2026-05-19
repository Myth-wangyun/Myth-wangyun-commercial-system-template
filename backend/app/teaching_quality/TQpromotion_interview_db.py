"""
教学质量模块 - 升学访谈表 数据库与辅助函数（PostgreSQL teaching_quality schema）
一页一表：frontend 5-promotion/PromotionInterviewTable 对应此表。

表：teaching_quality."升学访谈表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 班级名称 varchar(100) null
- 年份 int null
- 月份 int null (1..12)
- 序号 int not null
- 姓名 varchar(100)
- 访谈内容 text
- 抗拒点 text
- 是否明确升学 varchar(10)（是/否/待定）
唯一：神殿名称 + 班级名称 + 年份 + 月份 + 序号
索引：神殿名称 + 班级名称 + 年份 + 月份
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 升学访谈表(AccountBase):
    __tablename__ = "升学访谈表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str | None] = mapped_column(String(100), nullable=True)
    年份: Mapped[int | None] = mapped_column(Integer, nullable=True)
    月份: Mapped[int | None] = mapped_column(Integer, nullable=True)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    访谈内容: Mapped[str | None] = mapped_column(Text, nullable=True)
    抗拒点: Mapped[str | None] = mapped_column(Text, nullable=True)
    是否明确升学: Mapped[str | None] = mapped_column(String(10), nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "年份", "月份", "序号", name="uq_升学访谈_神殿班级年月序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_升学访谈_神殿班级年月", "神殿名称", "班级名称", "年份", "月份"),
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
    # 先创建表（首次部署）
    AccountBase.metadata.create_all(bind=engine, tables=[升学访谈表.__table__])
    _MIGRATED = True

def init_promotion_interview_tables():
    _migrate()

def fetch_interview_rows(
    db: Session, *, 神殿名称: str, 班级名称: Optional[str] = None, 年份: Optional[int] = None, 月份: Optional[int] = None
) -> List[升学访谈表]:
    _migrate()
    q = db.query(升学访谈表).filter(升学访谈表.神殿名称 == 神殿名称)
    if 班级名称 is not None:
        q = q.filter(升学访谈表.班级名称 == 班级名称)
    else:
        q = q.filter(升学访谈表.班级名称.is_(None))
    if 年份 is not None:
        q = q.filter(升学访谈表.年份 == 年份)
    if 月份 is not None:
        q = q.filter(升学访谈表.月份 == 月份)
    return q.order_by(升学访谈表.年份, 升学访谈表.月份, 升学访谈表.序号, 升学访谈表.姓名).all()

def replace_interview_rows(
    db: Session,
    *,
    神殿名称: str,
    班级名称: Optional[str],
    年份: Optional[int],
    月份: Optional[int],
    行列表: List[Dict[str, Any]],
):
    _migrate()
    q = db.query(升学访谈表).filter(升学访谈表.神殿名称 == 神殿名称)
    if 班级名称 is not None:
        q = q.filter(升学访谈表.班级名称 == 班级名称)
    else:
        q = q.filter(升学访谈表.班级名称.is_(None))
    if 年份 is not None:
        q = q.filter(升学访谈表.年份 == 年份)
    else:
        q = q.filter(升学访谈表.年份.is_(None))
    if 月份 is not None:
        q = q.filter(升学访谈表.月份 == 月份)
    else:
        q = q.filter(升学访谈表.月份.is_(None))
    q.delete()

    for row in sorted(行列表, key=lambda x: x.get("序号", 0)):
        db.add(
            升学访谈表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                年份=年份,
                月份=月份,
                序号=row.get("序号", 0),
                姓名=row.get("姓名"),
                访谈内容=row.get("访谈内容"),
                抗拒点=row.get("抗拒点"),
                是否明确升学=row.get("是否明确升学"),
            )
        )
    db.flush()
