"""
教学质量模块 - 企业文化宣讲计划表（teaching_quality schema）

表：teaching_quality."企业文化宣讲计划表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 年份 int（可选）
- 月份 int（可选）
- 序号 int not null
- 宣讲时间 varchar(50)
- 宣讲地点 varchar(200)
- 宣讲方式 varchar(100)
- 宣讲主题 varchar(200)
- 宣讲内容概述 text
- 宣讲对象 varchar(200)
- 主讲人 varchar(100)
- 需准备资料 text
- 备注 text
- 创建时间/更新时间

唯一：神殿名称 + 年份 + 月份 + 序号
索引：神殿名称 + 年份 + 月份
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 企业文化宣讲计划表(AccountBase):
    __tablename__ = "企业文化宣讲计划表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int | None] = mapped_column(Integer, nullable=True)
    月份: Mapped[int | None] = mapped_column(Integer, nullable=True)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    宣讲时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    宣讲地点: Mapped[str | None] = mapped_column(String(200), nullable=True)
    宣讲方式: Mapped[str | None] = mapped_column(String(100), nullable=True)
    宣讲主题: Mapped[str | None] = mapped_column(String(200), nullable=True)
    宣讲内容概述: Mapped[str | None] = mapped_column(Text, nullable=True)
    宣讲对象: Mapped[str | None] = mapped_column(String(200), nullable=True)
    主讲人: Mapped[str | None] = mapped_column(String(100), nullable=True)
    需准备资料: Mapped[str | None] = mapped_column(Text, nullable=True)
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "序号", name="uq_企业文化宣讲计划_神殿年月序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_企业文化宣讲计划_神殿年月", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate() -> None:
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[企业文化宣讲计划表.__table__])
def init_culture_presentation_plan_tables() -> None:
    _migrate()

def fetch_plan_rows(
    db: Session, *, 神殿名称: str, 年份: Optional[int] = None, 月份: Optional[int] = None
) -> List[企业文化宣讲计划表]:
    _migrate()
    query = db.query(企业文化宣讲计划表).filter(企业文化宣讲计划表.神殿名称 == 神殿名称)
    if 年份 is not None:
        query = query.filter(企业文化宣讲计划表.年份 == 年份)
    if 月份 is not None:
        query = query.filter(企业文化宣讲计划表.月份 == 月份)
    return query.order_by(企业文化宣讲计划表.序号).all()

def replace_plan_rows(
    db: Session,
    *,
    神殿名称: str,
    行列表: List[Dict[str, Any]],
    年份: Optional[int] = None,
    月份: Optional[int] = None,
) -> None:
    _migrate()
    query = db.query(企业文化宣讲计划表).filter(企业文化宣讲计划表.神殿名称 == 神殿名称)
    if 年份 is not None:
        query = query.filter(企业文化宣讲计划表.年份 == 年份)
    if 月份 is not None:
        query = query.filter(企业文化宣讲计划表.月份 == 月份)
    query.delete()

    for row in sorted(行列表, key=lambda x: int(x.get("序号") or x.get("index") or 0)):
        序号 = int(row.get("序号") or row.get("index") or row.get("serialNumber") or 0)
        db.add(
            企业文化宣讲计划表(
                神殿名称=神殿名称,
                年份=年份,
                月份=月份,
                序号=序号,
                宣讲时间=row.get("宣讲时间") or row.get("time"),
                宣讲地点=row.get("宣讲地点") or row.get("location"),
                宣讲方式=row.get("宣讲方式") or row.get("method"),
                宣讲主题=row.get("宣讲主题") or row.get("topic"),
                宣讲内容概述=row.get("宣讲内容概述") or row.get("summary"),
                宣讲对象=row.get("宣讲对象") or row.get("audience"),
                主讲人=row.get("主讲人") or row.get("speaker"),
                需准备资料=row.get("需准备资料") or row.get("materials"),
                备注=row.get("备注") or row.get("remark"),
            )
        )

    db.flush()

def delete_plan_rows(
    db: Session, *, 神殿名称: str, 年份: Optional[int] = None, 月份: Optional[int] = None
) -> int:
    _migrate()
    query = db.query(企业文化宣讲计划表).filter(企业文化宣讲计划表.神殿名称 == 神殿名称)
    if 年份 is not None:
        query = query.filter(企业文化宣讲计划表.年份 == 年份)
    if 月份 is not None:
        query = query.filter(企业文化宣讲计划表.月份 == 月份)
    return query.delete()
