"""
教学质量模块 - 班主任标准化检查表 数据库与辅助函数（PostgreSQL / teaching_quality schema）

表结构：teaching_quality."班主任标准化检查表"
- 记录ID: serial PK
- 神殿名称: varchar(50)
- 年份: int
- 月份: int
- 班主任: varchar(50)  （班主任名称）
- 日期: DATE           （具体日期，格式 YYYY-MM-DD）
- 序号: int            （行号，对应前端"序号"）
- 项目: varchar        （行名称，对应前端"项目"）
- 天数: JSONB          （1..31 -> bool 的映射，按当月天数使用）
- 创建时间/更新时间

唯一约束：神殿名称 + 年份 + 月份 + 班主任 + 序号
索引：    神殿名称 + 年份 + 月份 + 班主任
索引：    神殿名称 + 班主任 + 日期

本文件位于 teaching-quality 目录下（包含连字符），供模块内使用。
"""
from datetime import date, datetime
from typing import Any, List, Optional

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import engine, ensure_teaching_quality_schema
from app.models.user import Base as AccountBase


class 班主任标准化检查表(AccountBase):
    __tablename__ = "班主任标准化检查表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份(1-12)")
    班主任: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="班主任名称")
    日期: Mapped[date | None] = mapped_column(Date, nullable=True, comment="具体日期(YYYY-MM-DD)")
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号（行号）")
    项目: Mapped[str] = mapped_column(String(200), nullable=False, comment="项目名称")
    天数: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True, comment="天数映射，如 {1:true,2:false,...}")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "班主任", "序号", name="uq_班主任标准化_神殿年月班主任序号"),
        Index("idx_班主任标准化_神殿年月", "神殿名称", "年份", "月份"),
        Index("idx_班主任标准化_神殿年月班主任", "神殿名称", "年份", "月份", "班主任"),
        Index("idx_班主任标准化_神殿班主任日期", "神殿名称", "班主任", "日期"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

    def __repr__(self) -> str:
        return f"<班主任标准化检查表(神殿={self.神殿名称},{self.年份}-{self.月份}, 班主任={self.班主任}, 日期={self.日期}, 序号={self.序号}, 项目={self.项目})>"

def _migrate_standardization_table() -> None:
    """幂等迁移：确保表、列与索引齐全"""
    ensure_teaching_quality_schema()
    # 先按模型尝试创建表（checkfirst=True 确保幂等）
    AccountBase.metadata.create_all(bind=engine, tables=[班主任标准化检查表.__table__], checkfirst=True)

def init_standardization_tables() -> None:
    """创建/迁移表结构（幂等）"""
    _migrate_standardization_table()

def _to_date(value):
    if value is None:
        return None
    if isinstance(value, str) and value:
        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except Exception:
            return None
    return value

def upsert_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    班主任: Optional[str] = None,
    日期: Optional[str] = None,
    行列表: List[dict],
) -> None:
    """替换某神殿某月的全部行。
    行元素形如：{"序号":1,"项目":"日工单","天数": {"1": true, "2": false, ...}}
    
    参数：
    - 神殿名称: 神殿名称
    - 年份: 年份
    - 月份: 月份
    - 班主任: 班主任名称（可选）
    - 日期: 具体日期，格式 YYYY-MM-DD（可选）
    - 行列表: 行数据列表
    """
    # 防御性：确保迁移
    _migrate_standardization_table()

    teacher_value = 班主任.strip() if isinstance(班主任, str) else None
    if teacher_value == "":
        teacher_value = None

    # 先删除旧数据（按神殿+年月+班主任）
    query = db.query(班主任标准化检查表).filter(
        班主任标准化检查表.神殿名称 == 神殿名称,
        班主任标准化检查表.年份 == 年份,
        班主任标准化检查表.月份 == 月份,
    )
    if teacher_value is not None:
        query = query.filter(班主任标准化检查表.班主任 == teacher_value)
    else:
        query = query.filter(班主任标准化检查表.班主任.is_(None))
    query.delete()

    # 插入新数据（按序号排序）
    for row in sorted(行列表, key=lambda x: x.get("序号", 0)):
        db.add(
            班主任标准化检查表(
                神殿名称=神殿名称,
                年份=年份,
                月份=月份,
                班主任=teacher_value,
                日期=_to_date(日期),
                序号=row.get("序号"),
                项目=row.get("项目", ""),
                天数=row.get("天数", {}),
            )
        )

def fetch_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: Optional[int] = None,
    月份: Optional[int] = None,
    班主任: Optional[str] = None,
    日期: Optional[str] = None,
) -> List[班主任标准化检查表]:
    """查询班主任标准化检查表数据
    
    参数：
    - 神殿名称: 必填，神殿名称
    - 年份: 可选，年份
    - 月份: 可选，月份
    - 班主任: 可选，班主任名称
    - 日期: 可选，具体日期（YYYY-MM-DD 格式）
    
    返回：符合条件的记录列表
    """
    _migrate_standardization_table()
    query = db.query(班主任标准化检查表).filter(
        班主任标准化检查表.神殿名称 == 神殿名称
    )
    
    # 按年份、月份过滤
    if 年份 is not None:
        query = query.filter(班主任标准化检查表.年份 == 年份)
    if 月份 is not None:
        query = query.filter(班主任标准化检查表.月份 == 月份)
    
    # 按班主任过滤
    if 班主任 is not None:
        teacher_value = 班主任.strip()
        if teacher_value:
            query = query.filter(班主任标准化检查表.班主任 == teacher_value)
    
    # 按日期过滤
    if 日期 is not None:
        query = query.filter(班主任标准化检查表.日期 == _to_date(日期))
    
    return query.order_by(班主任标准化检查表.班主任, 班主任标准化检查表.序号).all()

def fetch_homeroom_teachers(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
) -> List[str]:
    """获取指定神殿年月下已填写的班主任列表"""
    _migrate_standardization_table()
    rows = (
        db.query(班主任标准化检查表.班主任)
        .filter(
            班主任标准化检查表.神殿名称 == 神殿名称,
            班主任标准化检查表.年份 == 年份,
            班主任标准化检查表.月份 == 月份,
            班主任标准化检查表.班主任.isnot(None),
            班主任标准化检查表.班主任 != "",
        )
        .distinct()
        .order_by(班主任标准化检查表.班主任)
        .all()
    )
    return [row[0] for row in rows if row[0]]

def fetch_rows_by_homeroom_and_date(
    db: Session,
    *,
    神殿名称: str,
    班主任: str,
    日期: str,
) -> List[班主任标准化检查表]:
    """按班主任和日期查询数据（便捷方法）
    
    参数：
    - 神殿名称: 神殿名称
    - 班主任: 班主任名称
    - 日期: 具体日期（YYYY-MM-DD 格式）
    
    返回：符合条件的记录列表
    """
    return fetch_rows(
        db,
        神殿名称=神殿名称,
        班主任=班主任,
        日期=日期,
    )

# 模块导入时进行一次迁移，保证热重载后也能继续使用
try:
    _migrate_standardization_table()
except Exception:
    # 不阻塞应用启动
    pass
