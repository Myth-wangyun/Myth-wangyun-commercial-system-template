"""
教学质量模块 - 员工功能分析（单表方案）数据库与辅助函数
Schema: teaching_quality

表A：teaching_quality."班主任业务功能分析"（不变，月度×员工粒度）
- 记录ID, 神殿名称, 年份, 月份, 员工姓名, 指标列...（见下）
唯一：神殿名称 + 年份 + 月份 + 员工姓名

表B：teaching_quality."班主任功能分析"（单表，按 年份×员工×项目序号 存储）
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 年份 int not null
- 员工姓名 varchar(50) not null
- 序号 int not null（项目序号）
- 类别 varchar(50)
- 功能项目 varchar(100)
- 详细要求 text
- 满分 numeric
- 得分 numeric
唯一：神殿名称 + 年份 + 员工姓名 + 序号

提供API层使用的函数：
- init_employee_function_tables()
- fetch_business_rows(db, 神殿名称, 年份) -> List[班主任业务功能分析]
- replace_business_rows(db, 神殿名称, 年份, 行列表)
- fetch_function_flat(db, 神殿名称, 年份) -> List[班主任功能分析]
- replace_function_flat(db, 神殿名称, 年份, 行列表扁平)
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 班主任业务功能分析(AccountBase):
    __tablename__ = "班主任业务功能分析"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    员工姓名: Mapped[str] = mapped_column(String(50), nullable=False)

    带班量: Mapped[int] = mapped_column(Integer)
    带班人数: Mapped[int] = mapped_column(Integer)
    带宿舍量: Mapped[int] = mapped_column(Integer)
    带宿舍人数: Mapped[int] = mapped_column(Integer)
    学生平均出勤率: Mapped[float] = mapped_column(Float)
    日常访谈率: Mapped[float] = mapped_column(Float)
    家长访谈率: Mapped[float] = mapped_column(Float)
    素质课次数: Mapped[int] = mapped_column(Integer)
    活动组织次数: Mapped[int] = mapped_column(Integer)
    就业率: Mapped[float] = mapped_column(Float)
    就业平均薪资: Mapped[float] = mapped_column(Float)
    就业人数: Mapped[int] = mapped_column(Integer)
    口碑报名人数: Mapped[int] = mapped_column(Integer)
    口碑收入: Mapped[float] = mapped_column(Float)
    异动人数: Mapped[int] = mapped_column(Integer)
    异动率: Mapped[float] = mapped_column(Float)
    退费人数: Mapped[int] = mapped_column(Integer)
    退费率: Mapped[float] = mapped_column(Float)
    升学率: Mapped[float] = mapped_column(Float)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "员工姓名", name="uq_业务功能分析_神殿年月姓名"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_业务功能分析_神殿年", "神殿名称", "年份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

class 班主任功能分析(AccountBase):
    __tablename__ = "班主任功能分析"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    员工姓名: Mapped[str] = mapped_column(String(50), nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)
    类别: Mapped[str] = mapped_column(String(50))
    功能项目: Mapped[str] = mapped_column(String(100))
    详细要求: Mapped[str] = mapped_column(Text)
    满分: Mapped[float] = mapped_column(Float)
    得分: Mapped[float] = mapped_column(Float)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "员工姓名", "序号", name="uq_功能分析_维度"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_功能分析_神殿年", "神殿名称", "年份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

# 迁移

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    # 创建两张目标表
    AccountBase.metadata.create_all(
        bind=engine,
        tables=[班主任业务功能分析.__table__, 班主任功能分析.__table__],
    )
    # 清理旧的两表方案（项目/得分），如果存在则删除
    with engine.begin() as conn:
        # 删除旧的两表方案（如果存在）
        conn.execute(text('DROP TABLE IF EXISTS teaching_quality."班主任功能分析项目" CASCADE'))
        conn.execute(text('DROP TABLE IF EXISTS teaching_quality."班主任功能分析得分" CASCADE'))
        # 删除更旧的"教员功能分析总表/子表"（如果存在）
        conn.execute(text('DROP TABLE IF EXISTS teaching_quality."教员功能分析总表" CASCADE'))
        conn.execute(text('DROP TABLE IF EXISTS teaching_quality."教员功能分析子表" CASCADE'))

def init_employee_function_tables():
    _migrate()

# 神殿名称兼容匹配辅助函数
def _normalize_campus(campus: str) -> str:
    """去掉"神殿"后缀，统一格式"""
    return str(campus or "").replace("神殿", "").strip()

def _campus_variants(campus: str) -> List[str]:
    """生成神殿名称的多种变体"""
    norm = _normalize_campus(campus)
    variants = {str(campus or "").strip(), norm}
    if norm:
        variants.add(f"{norm}神殿")
    return [v for v in variants if v]

def _build_campus_filter(column, campus: str):
    """构建神殿名称兼容过滤条件"""
    from sqlalchemy import or_
    variants = _campus_variants(campus)
    if not variants:
        return None
    clauses = []
    for name in variants:
        clauses.append(column == name)
        clauses.append(column.ilike(f"{name}%"))
    return or_(*clauses)

# 业务功能分析

def fetch_business_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[班主任业务功能分析]:
    _migrate()
    query = db.query(班主任业务功能分析).filter(班主任业务功能分析.年份 == 年份)
    campus_filter = _build_campus_filter(班主任业务功能分析.神殿名称, 神殿名称)
    if campus_filter is not None:
        query = query.filter(campus_filter)
    return query.order_by(班主任业务功能分析.月份, 班主任业务功能分析.员工姓名).all()

def replace_business_rows(db: Session, *, 神殿名称: str, 年份: int, 行列表: List[Dict[str, Any]]):
    _migrate()
    # 删除时使用兼容匹配
    query = db.query(班主任业务功能分析).filter(班主任业务功能分析.年份 == 年份)
    campus_filter = _build_campus_filter(班主任业务功能分析.神殿名称, 神殿名称)
    if campus_filter is not None:
        query = query.filter(campus_filter)
    query.delete(synchronize_session=False)
    for row in 行列表:
        db.add(
            班主任业务功能分析(
                神殿名称=神殿名称,
                年份=年份,
                月份=row.get("月份"),
                员工姓名=row.get("员工姓名"),
                带班量=row.get("带班量"),
                带班人数=row.get("带班人数"),
                带宿舍量=row.get("带宿舍量"),
                带宿舍人数=row.get("带宿舍人数"),
                学生平均出勤率=row.get("学生平均出勤率"),
                日常访谈率=row.get("日常访谈率"),
                家长访谈率=row.get("家长访谈率"),
                素质课次数=row.get("素质课次数"),
                活动组织次数=row.get("活动组织次数"),
                就业率=row.get("就业率"),
                就业平均薪资=row.get("就业平均薪资"),
                就业人数=row.get("就业人数"),
                口碑报名人数=row.get("口碑报名人数"),
                口碑收入=row.get("口碑收入"),
                异动人数=row.get("异动人数"),
                异动率=row.get("异动率"),
                退费人数=row.get("退费人数"),
                退费率=row.get("退费率"),
                升学率=row.get("升学率"),
            )
        )
    db.flush()

# 功能分析（单表扁平）

def fetch_function_flat(db: Session, *, 神殿名称: str, 年份: int) -> List[班主任功能分析]:
    _migrate()
    query = db.query(班主任功能分析).filter(班主任功能分析.年份 == 年份)
    campus_filter = _build_campus_filter(班主任功能分析.神殿名称, 神殿名称)
    if campus_filter is not None:
        query = query.filter(campus_filter)
    return query.order_by(班主任功能分析.序号, 班主任功能分析.员工姓名).all()

def replace_function_flat(db: Session, *, 神殿名称: str, 年份: int, 行列表: List[Dict[str, Any]]):
    _migrate()
    # 删除时使用兼容匹配
    query = db.query(班主任功能分析).filter(班主任功能分析.年份 == 年份)
    campus_filter = _build_campus_filter(班主任功能分析.神殿名称, 神殿名称)
    if campus_filter is not None:
        query = query.filter(campus_filter)
    query.delete(synchronize_session=False)
    for row in 行列表:
        db.add(
            班主任功能分析(
                神殿名称=神殿名称,
                年份=年份,
                员工姓名=row.get("员工姓名"),
                序号=row.get("序号"),
                类别=row.get("类别"),
                功能项目=row.get("功能项目"),
                详细要求=row.get("详细要求"),
                满分=row.get("满分"),
                得分=row.get("得分"),
            )
        )
    db.flush()
