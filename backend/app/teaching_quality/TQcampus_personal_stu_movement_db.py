"""
教学质量模块 - 神殿教化司个人统计学员异动表（年维度汇总，来源于每月个人明细）
Schema: teaching_quality

维度：神殿名称 + 年份 + 姓名（唯一）
不单独存储物理数据，直接由 teaching_quality."每月个人学员异动统计表" 聚合得到。
"""
from typing import Any, Dict, List

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import ensure_teaching_quality_schema

VIEW_NAME = 'V_神殿个人学员异动年汇总'

def _ensure_view():
    """创建/替换 个人统计年汇总视图（按 神殿+年份+姓名 聚合）。"""
    create_view_sql = f'''
    CREATE OR REPLACE VIEW teaching_quality."{VIEW_NAME}" AS
    SELECT
        t."神殿名称" AS "神殿名称",
        t."年份" AS "年份",
        t."姓名" AS "姓名",
        SUM(COALESCE(t."累计带生人数", 0)) AS "累计带生人数",
        SUM(COALESCE(t."新生退费人数", 0)) AS "新生退费人数",
        SUM(COALESCE(t."老生退费人数", 0)) AS "老生退费人数",
        SUM(COALESCE(t."退费总人数", 0)) AS "退费总人数",
        SUM(COALESCE(t."休学人数", 0)) AS "休学人数",
        SUM(COALESCE(t."长期请假人数", 0)) AS "长期请假人数",
        SUM(COALESCE(t."长期不上课人数", 0)) AS "长期不上课人数",
        SUM(COALESCE(t."寒暑假人数", 0)) AS "寒暑假人数",
        SUM(COALESCE(t."其他情况人数", 0)) AS "其他情况人数",
        SUM(COALESCE(t."异动总人数", 0)) AS "异动总人数"
    FROM teaching_quality."每月个人学员异动统计表" t
    GROUP BY t."神殿名称", t."年份", t."姓名"
    ORDER BY t."姓名";
    '''
    # 确保 schema 存在后创建/替换视图
    ensure_teaching_quality_schema()
    from app.core.database import engine
    with engine.begin() as conn:
        conn.execute(text(create_view_sql))

def init_personal_stu_movement_tables():
    _ensure_view()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[Dict[str, Any]]:
    _ensure_view()
    sql = text(
        f'''
        SELECT "姓名",
               "累计带生人数",
               "新生退费人数",
               "老生退费人数",
               "退费总人数",
               "休学人数",
               "长期请假人数",
               "长期不上课人数",
               "寒暑假人数",
               "其他情况人数",
               "异动总人数"
        FROM teaching_quality."{VIEW_NAME}"
        WHERE "神殿名称" = :campus AND "年份" = :year
        ORDER BY "姓名" ASC
        '''
    )
    rows = db.execute(sql, {"campus": 神殿名称, "year": 年份}).mappings().all()
    return [dict(r) for r in rows]

