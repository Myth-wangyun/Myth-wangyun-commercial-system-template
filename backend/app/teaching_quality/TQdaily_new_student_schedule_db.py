"""
教学质量模块 - 每日新生安排表 数据库与辅助函数（PostgreSQL teaching_quality schema）
一页一表：frontend 4-stu-stability/1-daily-new-student-schedule 对应此表。

表：teaching_quality."每日新生安排表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 记录日期 date not null （页面右上角选择的日期）
- 序号 int not null（行序）
- 姓名 varchar(100)
- 年龄 int
- 性别 varchar(10)
- 所报专业 varchar(100)
- 学制 varchar(50)
- 抗拒点关注点 text
- 应收金额 double precision
- 已收金额 double precision
- 欠费金额 double precision
- 预计回款时间 date
- 授课内容 text
- 授课地点 varchar(100)
- 入学日期 date
- 上课天数 int
- 规划师 varchar(50)
- 班主任 varchar(50)
- 教员 varchar(50)
- 备注 text
- 填表人 varchar(50)
- 填表时间 date
唯一：神殿名称 + 记录日期 + 序号
索引：神殿名称 + 记录日期
"""
from datetime import date, datetime
from datetime import date as pydate
from typing import Any, Dict, List

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 每日新生安排表(AccountBase):
    __tablename__ = "每日新生安排表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    记录日期: Mapped[date] = mapped_column(Date, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    年龄: Mapped[int | None] = mapped_column(Integer, nullable=True)
    性别: Mapped[str | None] = mapped_column(String(10), nullable=True)
    所报专业: Mapped[str | None] = mapped_column(String(100), nullable=True)
    学制: Mapped[str | None] = mapped_column(String(50), nullable=True)
    抗拒点关注点: Mapped[str | None] = mapped_column(Text, nullable=True)
    应收金额: Mapped[float | None] = mapped_column(Float, nullable=True)
    已收金额: Mapped[float | None] = mapped_column(Float, nullable=True)
    欠费金额: Mapped[float | None] = mapped_column(Float, nullable=True)
    预计回款时间: Mapped[date | None] = mapped_column(Date, nullable=True)
    授课内容: Mapped[str | None] = mapped_column(Text, nullable=True)
    授课地点: Mapped[str | None] = mapped_column(String(100), nullable=True)
    入学日期: Mapped[date | None] = mapped_column(Date, nullable=True)
    上课天数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    规划师: Mapped[str | None] = mapped_column(String(50), nullable=True)
    班主任: Mapped[str | None] = mapped_column(String(50), nullable=True)
    教员: Mapped[str | None] = mapped_column(String(50), nullable=True)
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)
    填表人: Mapped[str | None] = mapped_column(String(50), nullable=True)
    填表时间: Mapped[date | None] = mapped_column(Date, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "记录日期", "序号", name="uq_新生安排_神殿日期序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_新生安排_神殿日期", "神殿名称", "记录日期"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[每日新生安排表.__table__])
def init_daily_new_student_tables():
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

def fetch_daily_rows(db: Session, *, 神殿名称: str, 记录日期: pydate) -> List[每日新生安排表]:
    _migrate()
    return (
        db.query(每日新生安排表)
        .filter(每日新生安排表.神殿名称 == 神殿名称, 每日新生安排表.记录日期 == 记录日期)
        .order_by(每日新生安排表.序号)
        .all()
    )

def replace_daily_rows(
    db: Session,
    *,
    神殿名称: str,
    记录日期: pydate,
    行列表: List[Dict[str, Any]],
):
    _migrate()
    db.query(每日新生安排表).filter(每日新生安排表.神殿名称 == 神殿名称, 每日新生安排表.记录日期 == 记录日期).delete()

    for row in sorted(行列表, key=lambda x: x.get("序号", 0)):
        db.add(
            每日新生安排表(
                神殿名称=神殿名称,
                记录日期=记录日期,
                序号=row.get("序号", 0),
                姓名=row.get("姓名"),
                年龄=row.get("年龄"),
                性别=row.get("性别"),
                所报专业=row.get("所报专业"),
                学制=row.get("学制"),
                抗拒点关注点=row.get("抗拒点关注点"),
                应收金额=row.get("应收金额"),
                已收金额=row.get("已收金额"),
                欠费金额=row.get("欠费金额"),
                预计回款时间=_to_date(row.get("预计回款时间")),
                授课内容=row.get("授课内容"),
                授课地点=row.get("授课地点"),
                入学日期=_to_date(row.get("入学日期")),
                上课天数=row.get("上课天数"),
                规划师=row.get("规划师"),
                班主任=row.get("班主任"),
                教员=row.get("教员"),
                备注=row.get("备注"),
                填表人=row.get("填表人"),
                填表时间=_to_date(row.get("填表时间")),
            )
        )
    db.flush()

