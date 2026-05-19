"""
教学质量模块 - 其他访谈记录表 数据库与辅助函数
Schema: teaching_quality

表：teaching_quality."其他访谈记录表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 年份 int not null
- 月份 int not null (1..12)
- 序号 int not null
- 姓名 varchar(100)
- 访谈时间 date
- 访谈记录 text
- 班主任 varchar(50)

唯一：神殿名称 + 年份 + 月份 + 序号
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


class 其他访谈记录表(AccountBase):
    __tablename__ = "其他访谈记录表"

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
        # 唯一约束必须包含班主任字段，避免不同班主任的数据相互覆盖
        UniqueConstraint("神殿名称", "年份", "月份", "班主任", "序号", name="uq_其他访谈记录_维度序号"),
        Index("idx_其他访谈记录_维度", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    # 根据数据库实际状态创建表
    if not inspect(engine).has_table('其他访谈记录表', schema='teaching_quality'):
        AccountBase.metadata.create_all(bind=engine, tables=[其他访谈记录表.__table__])

    with engine.begin() as conn:
        # 幂等添加列（兼容旧表）
        inspector = inspect(conn)
        if not inspector.has_table('其他访谈记录表', schema='teaching_quality'):
            return
        columns = [c['name'] for c in inspector.get_columns('其他访谈记录表', schema='teaching_quality')]
        if '访谈时间' not in columns:
            conn.execute(text('ALTER TABLE teaching_quality."其他访谈记录表" ADD COLUMN "访谈时间" DATE'))
        if '班主任' not in columns:
            conn.execute(text('ALTER TABLE teaching_quality."其他访谈记录表" ADD COLUMN "班主任" VARCHAR(50)'))

        
        # 删除旧的唯一约束（不包含班主任字段）
        conn.execute(text('ALTER TABLE teaching_quality."其他访谈记录表" DROP CONSTRAINT IF EXISTS "uq_其他访谈记录_维度序号"'))
        
        # 创建新的唯一约束（包含班主任字段）
        conn.execute(text('ALTER TABLE teaching_quality."其他访谈记录表" ADD CONSTRAINT "uq_其他访谈记录_维度序号" UNIQUE ("神殿名称", "年份", "月份", "班主任", "序号")'))

def init_other_interview_tables():
    _migrate()

def _to_date(val):
    if isinstance(val, pydate):
        return val
    if isinstance(val, str) and val:
        try:
            return pydate.fromisoformat(val)
        except Exception:
            return None
    return None

def fetch_interview_rows(
    db: Session, *, 神殿名称: str, 年份: int, 月份: int, 班主任: Optional[str] = None
) -> List[其他访谈记录表]:
    _migrate()
    q = db.query(其他访谈记录表).filter(
        其他访谈记录表.神殿名称 == 神殿名称,
        其他访谈记录表.年份 == 年份,
        其他访谈记录表.月份 == 月份,
    )
    if 班主任:
        q = q.filter(其他访谈记录表.班主任 == 班主任)
    return q.order_by(其他访谈记录表.序号).all()

def replace_interview_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
    班主任: Optional[str] = None,
):
    _migrate()
    # 删除时需要根据班主任进行过滤，避免覆盖其他班主任的数据
    q = db.query(其他访谈记录表).filter(
        其他访谈记录表.神殿名称 == 神殿名称,
        其他访谈记录表.年份 == 年份,
        其他访谈记录表.月份 == 月份,
    )
    if 班主任:
        q = q.filter(其他访谈记录表.班主任 == 班主任)
    q.delete()

    for row in sorted(行列表, key=lambda x: x.get("序号", 0)):
        db.add(
            其他访谈记录表(
                神殿名称=神殿名称,
                年份=年份,
                月份=月份,
                序号=row.get("序号", 0),
                姓名=row.get("姓名"),
                访谈时间=_to_date(row.get("访谈时间")),
                访谈记录=row.get("访谈记录"),
                班主任=row.get("班主任"),
            )
        )
    db.flush()

