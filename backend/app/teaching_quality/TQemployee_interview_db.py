"""
教学质量模块 - 员工访谈表（PostgreSQL teaching_quality schema）
文件位置：backend/app/teaching-quality

表：teaching_quality."员工访谈表"
- 记录ID serial PK
- 神殿名称 varchar(50)
- 年份 int
- 月份 int              # 仅一个月份（1-12）
- 序号 int              # 对应前端 serialNumber
- 访谈对象 varchar(100)
- 访谈时间 varchar(100)
- 访谈内容 text
- 创建时间/更新时间

提供：
- init_employee_interview_tables()  建表/迁移（幂等）
- fetch_rows(db, 神殿名称, 年份, 月份)  查询
- replace_rows(db, 神殿名称, 年份, 月份, 行列表)  覆盖写入（按序号排序）
- force_fix_constraints()  强制删除旧唯一约束/索引（若残留）
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 员工访谈表(AccountBase):
    __tablename__ = "员工访谈表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份(1-12)")
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="行序号")
    访谈对象: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="访谈对象")
    访谈时间: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="访谈时间（自由文本）")
    访谈内容: Mapped[str | None] = mapped_column(Text, nullable=True, comment="访谈内容")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "序号", name="uq_员工访谈_神殿年月序号"),
        Index("idx_员工访谈_神殿年月", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

    def __repr__(self) -> str:
        return f"<员工访谈表(神殿={self.神殿名称}, 年份={self.年份}, 月份={self.月份}, 序号={self.序号}, 访谈对象={self.访谈对象})>"

def force_fix_constraints() -> None:
    """强制删除旧唯一约束/索引（老版本为：神殿+年份+序号，不含月份）。
    无论是否存在，都会尝试 DROP IF EXISTS，确保不再触发旧约束报错。
    """
    with engine.begin() as conn:
        conn.execute(text('ALTER TABLE teaching_quality."员工访谈表" DROP CONSTRAINT IF EXISTS "uq_员工访谈_神殿年序号"'))
        conn.execute(text('DROP INDEX IF EXISTS teaching_quality."uq_员工访谈_神殿年序号_idx"'))

def _migrate_employee_interview_table() -> None:
    """确保表存在"""
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[员工访谈表.__table__])

def init_employee_interview_tables() -> None:
    _migrate_employee_interview_table()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int, 月份: int) -> List[员工访谈表]:
    _migrate_employee_interview_table()
    return (
        db.query(员工访谈表)
        .filter(员工访谈表.神殿名称 == 神殿名称, 员工访谈表.年份 == 年份, 员工访谈表.月份 == 月份)
        .order_by(员工访谈表.序号)
        .all()
    )

def replace_rows(db: Session, *, 神殿名称: str, 年份: int, 月份: int, 行列表: List[Dict[str, Any]]) -> None:
    _migrate_employee_interview_table()
    # 覆盖当前 年+月 的数据
    db.query(员工访谈表).filter(员工访谈表.神殿名称 == 神殿名称, 员工访谈表.年份 == 年份, 员工访谈表.月份 == 月份).delete()
    for row in sorted(行列表, key=lambda x: x.get("序号", 0)):
        db.add(
            员工访谈表(
                神殿名称=神殿名称,
                年份=年份,
                月份=月份,
                序号=row.get("序号"),
                访谈对象=row.get("访谈对象", ""),
                访谈时间=row.get("访谈时间"),
                访谈内容=row.get("访谈内容"),
            )
        )
