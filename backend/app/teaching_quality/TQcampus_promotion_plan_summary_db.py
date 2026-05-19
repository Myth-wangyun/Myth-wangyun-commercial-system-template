"""
教学质量模块 - 神殿教化司升学计划汇总表 数据库
此表的数据来源于`每月个人升学目标与结果表`（06-2XX）的月度汇总，通过数据库视图实现。
Schema: teaching_quality
"""
from typing import List

from sqlalchemy import Integer, String, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

from app.core.database import engine, ensure_teaching_quality_schema


# 使用一个临时的Base，因为这是一个视图，不直接对应一个可写的表
class Base(DeclarativeBase):
    pass

class 神殿升学计划汇总视图(Base):
    __tablename__ = "v_campus_promotion_plan_summary"
    
    # 将视图的列映射到类属性
    神殿名称: Mapped[str] = mapped_column(String(50), primary_key=True)
    年份: Mapped[int] = mapped_column(Integer, primary_key=True)
    月份: Mapped[int] = mapped_column(Integer, primary_key=True)
    升学班级总数: Mapped[int] = mapped_column(Integer)
    在档总人数: Mapped[int] = mapped_column(Integer)
    预计升学总人数: Mapped[int] = mapped_column(Integer)
    实际升学总人数: Mapped[int] = mapped_column(Integer)
    应收升学收入: Mapped[int] = mapped_column(Integer)
    预计升学收入: Mapped[int] = mapped_column(Integer)
    实际升学收入: Mapped[int] = mapped_column(Integer)

    __table_args__ = {"schema": "teaching_quality", "extend_existing": True}

def _migrate():
    """
    创建或更新神殿升学计划汇总视图
    注意：不使用_MIGRATED标志，每次启动都更新视图定义以确保与数据源同步
    """
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    # 由 06-2XX（每月个人升学目标与结果表）按神殿+年+月聚合得到神殿层面的升学计划汇总
    view_sql = text(f"""
    CREATE OR REPLACE VIEW teaching_quality."{神殿升学计划汇总视图.__tablename__}" AS
    SELECT
        "神殿名称",
        "年份"::INTEGER AS "年份",
        "月份"::INTEGER AS "月份",
        SUM(COALESCE("升学班级总数", 0)) AS "升学班级总数",
        SUM(COALESCE("在档总人数", 0)) AS "在档总人数",
        SUM(COALESCE("预计升学总人数", 0)) AS "预计升学总人数",
        SUM(COALESCE("实际升学总人数", 0)) AS "实际升学总人数",
        SUM(COALESCE("应收", 0)) AS "应收升学收入",
        SUM(COALESCE("预计升学收入", 0)) AS "预计升学收入",
        SUM(COALESCE("实际升学收入", 0)) AS "实际升学收入"
    FROM teaching_quality."每月个人升学目标与结果表"
    GROUP BY "神殿名称", "年份", "月份";
    """)
    with engine.begin() as conn:
        conn.execute(view_sql)

def init_campus_promotion_plan_summary_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[神殿升学计划汇总视图]:
    return (
        db.query(神殿升学计划汇总视图)
        .filter(
            神殿升学计划汇总视图.神殿名称 == 神殿名称,
            神殿升学计划汇总视图.年份 == 年份,
        )
        .order_by(神殿升学计划汇总视图.月份)
        .all()
    )

# replace_rows 函数不再需要，因为此表是只读的汇总视图
