"""
教学质量模块 - 神殿教化司个人升学目标与结果汇总表 数据库
此表的数据来源于`每月个人升学目标与结果表`（06-2XX），按年份汇总班主任数据。
Schema: teaching_quality
"""
from typing import List

from sqlalchemy import Integer, String, text
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

from app.core.database import engine, ensure_teaching_quality_schema


# 使用一个临时的Base，因为这是一个视图，不直接对应一个可写的表
class Base(DeclarativeBase):
    pass

class 个人升学目标与结果汇总视图(Base):
    __tablename__ = "v_personal_promotion_summary"
    
    # 将视图的列映射到类属性
    # 注意：视图没有真正的主键，但 SQLAlchemy 要求至少有一个列标记为 primary_key
    神殿名称: Mapped[str] = mapped_column(String(50), primary_key=True)
    年份: Mapped[int] = mapped_column(Integer, primary_key=True)
    姓名: Mapped[str] = mapped_column(String(100), primary_key=True)
    升学班级总数: Mapped[int] = mapped_column(Integer)
    在档总人数: Mapped[int] = mapped_column(Integer)
    预计升学总人数: Mapped[int] = mapped_column(Integer)
    实际升学总人数: Mapped[int] = mapped_column(Integer)
    应收: Mapped[int] = mapped_column(Integer)
    预计升学收入: Mapped[int] = mapped_column(Integer)
    实际升学收入: Mapped[int] = mapped_column(Integer)

    __table_args__ = {"schema": "teaching_quality", "extend_existing": True}

def _migrate():
    """
    创建或更新个人升学目标与结果汇总视图
    注意：这是一个轻量级操作，使用 CREATE OR REPLACE VIEW 确保每次启动时视图定义都是最新的
    """
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    # 创建或替换视图
    # 注意：神殿升学计划汇总表的字段名称与视图中期望的名称不同，需要映射
    view_sql = text(f"""
    DROP VIEW IF EXISTS teaching_quality."{个人升学目标与结果汇总视图.__tablename__}";
    CREATE VIEW teaching_quality."{个人升学目标与结果汇总视图.__tablename__}" AS
    SELECT
        "神殿名称",
        "年份",
        "姓名",
        SUM(COALESCE("升学班级总数", 0)) AS "升学班级总数",
        SUM(COALESCE("在档总人数", 0)) AS "在档总人数",
        SUM(COALESCE("预计升学总人数", 0)) AS "预计升学总人数",
        SUM(COALESCE("实际升学总人数", 0)) AS "实际升学总人数",
        SUM(COALESCE("应收", 0)) AS "应收",
        SUM(COALESCE("预计升学收入", 0)) AS "预计升学收入",
        SUM(COALESCE("实际升学收入", 0)) AS "实际升学收入"
    FROM
        teaching_quality."每月个人升学目标与结果表"
    WHERE
        "姓名" IS NOT NULL AND "姓名" != ''
    GROUP BY
        "神殿名称", "年份", "姓名";
    """)
    with engine.begin() as conn:
        conn.execute(view_sql)

def init_personal_promotion_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[个人升学目标与结果汇总视图]:
    return (
        db.query(个人升学目标与结果汇总视图)
        .filter(
            个人升学目标与结果汇总视图.神殿名称 == 神殿名称,
            个人升学目标与结果汇总视图.年份 == 年份,
        )
        .order_by(个人升学目标与结果汇总视图.姓名)
        .all()
    )

# replace_rows 函数不再需要，因为此表是只读的汇总视图
