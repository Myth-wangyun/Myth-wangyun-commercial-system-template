"""
教学质量模块 - 毕业生家长访谈记录表 数据库与辅助函数
Schema: teaching_quality

表：teaching_quality."毕业生家长访谈记录表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 年份 int not null
- 月份 int not null (1..12)
- 序号 int not null
- 姓名 varchar(100)
- 访谈时间 date
- 访谈记录 text
- 班主任 varchar(50)
唯一：神殿名称 + 年份 + 月份 + 班主任 + 序号
索引：神殿名称 + 年份 + 月份
"""
from datetime import date, datetime
from datetime import date as pydate
from typing import Any, Dict, List, Optional

from sqlalchemy import (
    Date,
    DateTime,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    inspect,
    text,
)
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import engine, ensure_teaching_quality_schema
from app.models.user import Base as AccountBase


class 毕业生家长访谈记录表(AccountBase):
    __tablename__ = "毕业生家长访谈记录表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    访谈时间: Mapped[date | None] = mapped_column(Date, nullable=True)
    访谈记录: Mapped[str | None] = mapped_column(Text, nullable=True)
    班主任: Mapped[str | None] = mapped_column(String(50), nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "班主任", "序号", name="uq_毕业生家长访谈记录_维度班主任序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_毕业生家长访谈记录_维度", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    table_key = f'teaching_quality.{毕业生家长访谈记录表.__tablename__}'
    inspector = inspect(engine)
    if not inspector.has_table(毕业生家长访谈记录表.__tablename__, schema="teaching_quality"):
        AccountBase.metadata.create_all(bind=engine, tables=[毕业生家长访谈记录表.__table__])
    else:
        # 检查并添加缺失的列
        columns = [c['name'] for c in inspector.get_columns('毕业生家长访谈记录表', schema='teaching_quality')]
        with engine.begin() as conn:
            if '访谈时间' not in columns:
                conn.execute(text('ALTER TABLE teaching_quality."毕业生家长访谈记录表" ADD COLUMN "访谈时间" DATE'))
            if '班主任' not in columns:
                conn.execute(text('ALTER TABLE teaching_quality."毕业生家长访谈记录表" ADD COLUMN "班主任" VARCHAR(50)'))

_MIGRATED = False

def init_graduate_parent_interview_tables():
    global _MIGRATED
    if _MIGRATED:
        return
    _migrate()
    _MIGRATED = True

def fetch_interview_rows(
    db: Session, *, 神殿名称: str, 年份: int, 月份: int, 班主任: Optional[str] = None
) -> List[毕业生家长访谈记录表]:
    init_graduate_parent_interview_tables()
    q = (
        db.query(毕业生家长访谈记录表)
        .filter(
            毕业生家长访谈记录表.神殿名称 == 神殿名称,
            毕业生家长访谈记录表.年份 == 年份,
            毕业生家长访谈记录表.月份 == 月份,
        )
    )
    if 班主任:
        q = q.filter(毕业生家长访谈记录表.班主任 == 班主任)
    return q.order_by(毕业生家长访谈记录表.序号).all()

def replace_interview_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    init_graduate_parent_interview_tables()
    # 重要：毕业生家长访谈记录按"神殿+年月+班主任"维度分别保存。
    # 先删除当前维度下的所有记录
    db.query(毕业生家长访谈记录表).filter(
        毕业生家长访谈记录表.神殿名称 == 神殿名称,
        毕业生家长访谈记录表.年份 == 年份,
        毕业生家长访谈记录表.月份 == 月份,
    ).delete()

    # 按班主任分组保存
    by_teacher: Dict[str, List[Dict[str, Any]]] = {}
    for r in 行列表:
        t = r.get("班主任") or ""
        if t not in by_teacher:
            by_teacher[t] = []
        by_teacher[t].append(r)

    for t, rows in by_teacher.items():
        for r in rows:
            db.add(
                毕业生家长访谈记录表(
                    神殿名称=神殿名称,
                    年份=年份,
                    月份=月份,
                    序号=r.get("序号", 0),
                    姓名=r.get("姓名"),
                    访谈时间=pydate.fromisoformat(r["访谈时间"]) if r.get("访谈时间") else None,
                    访谈记录=r.get("访谈记录"),
                    班主任=t or None,
                )
            )
