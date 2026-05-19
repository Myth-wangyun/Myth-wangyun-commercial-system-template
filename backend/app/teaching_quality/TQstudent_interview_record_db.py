"""
教学质量模块 - 学员访谈记录表 数据库与辅助函数
Schema: teaching_quality

表：teaching_quality."学员访谈记录表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 年份 int not null
- 月份 int not null (1..12)
- 访谈类型 varchar(20) not null ('学员访谈', '家长访谈', '毕业生访谈')
- 序号 int not null
- 姓名 varchar(100)
- 班级 varchar(100)
- 咨询师 varchar(50)
- 学历 varchar(50)
- 籍贯 varchar(100)
- 入学时间 date
- 访谈时间 date
- 访谈记录 text (存储多条记录的文本块)
唯一：神殿名称 + 年份 + 月份 + 访谈类型 + 序号
索引：神殿名称 + 年份 + 月份 + 访谈类型
"""
from datetime import date as pydate
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import engine, ensure_teaching_quality_schema
from app.models.user import Base as AccountBase


class 学员访谈记录表(AccountBase):
    __tablename__ = "学员访谈记录表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    访谈类型: Mapped[str] = mapped_column(String(20), nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    姓名: Mapped[str | None] = mapped_column("姓名", String(100), nullable=True)
    专业名称: Mapped[str | None] = mapped_column("专业名称", String(100), nullable=True)
    班级: Mapped[str | None] = mapped_column("班级", String(100), nullable=True)
    咨询师: Mapped[str | None] = mapped_column("咨询师", String(50), nullable=True)
    # 显式指定列名，避免不同环境/反射/编码导致取值为 None
    班主任: Mapped[str | None] = mapped_column("班主任", String(50), nullable=True)
    学历: Mapped[str | None] = mapped_column("学历", String(50), nullable=True)
    籍贯: Mapped[str | None] = mapped_column("籍贯", String(100), nullable=True)
    入学时间: Mapped[str | None] = mapped_column("入学时间", Date, nullable=True)
    访谈时间: Mapped[str | None] = mapped_column("访谈时间", Date, nullable=True)
    访谈记录: Mapped[str | None] = mapped_column("访谈记录", Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        # 唯一约束必须包含班主任字段，避免不同班主任的数据相互覆盖
        UniqueConstraint("神殿名称", "年份", "月份", "访谈类型", "班主任", "序号", name="uq_访谈记录_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_访谈记录_维度", "神殿名称", "年份", "月份", "访谈类型"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[学员访谈记录表.__table__])

def init_student_interview_tables():
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
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    访谈类型: str,
    班主任: Optional[str] = None,
) -> List[学员访谈记录表]:
    _migrate()
    q = db.query(学员访谈记录表).filter(
        学员访谈记录表.神殿名称 == 神殿名称,
        学员访谈记录表.年份 == 年份,
        学员访谈记录表.月份 == 月份,
        学员访谈记录表.访谈类型 == 访谈类型,
    )
    if 班主任:
        q = q.filter(学员访谈记录表.班主任 == 班主任)

    return q.order_by(学员访谈记录表.序号).all()

def replace_interview_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    访谈类型: str,
    行列表: List[Dict[str, Any]],
    班主任: Optional[str] = None,
):
    _migrate()
    # 删除时需要根据班主任进行过滤，避免覆盖其他班主任的数据
    q = db.query(学员访谈记录表).filter(
        学员访谈记录表.神殿名称 == 神殿名称,
        学员访谈记录表.年份 == 年份,
        学员访谈记录表.月份 == 月份,
        学员访谈记录表.访谈类型 == 访谈类型,
    )
    if 班主任:
        q = q.filter(学员访谈记录表.班主任 == 班主任)
    q.delete()

    for row in sorted(行列表, key=lambda x: x.get("序号", 0)):
        db.add(
            学员访谈记录表(
                神殿名称=神殿名称,
                年份=年份,
                月份=月份,
                访谈类型=访谈类型,
                序号=row.get("序号", 0),
                姓名=row.get("姓名"),
                专业名称=row.get("专业名称"),
                班级=row.get("班级"),
                咨询师=row.get("咨询师"),
                班主任=row.get("班主任"),
                学历=row.get("学历"),
                籍贯=row.get("籍贯"),
                入学时间=_to_date(row.get("入学时间")),
                访谈时间=_to_date(row.get("访谈时间")),
                访谈记录=row.get("访谈记录"),
            )
        )
    db.flush()

