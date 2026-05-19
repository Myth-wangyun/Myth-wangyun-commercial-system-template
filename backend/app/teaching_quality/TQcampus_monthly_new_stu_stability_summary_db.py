"""
教学质量模块 - 神殿教化司新生当月维稳统计（按月汇总）视图
Schema: teaching_quality

对象：教学质量视图 teaching_quality."神殿新生当月维稳统计视图"
分组：神殿名称 + 年份 + 月份
字段：交接人数、报到人数、稳定过课时人数、未过课时人数、回全款人数、仍欠费人数、欠费总金额、退费人数、退费情况说明（文本聚合）
说明：保持幂等创建，重复执行不报错；API当前直接做聚合，此视图便于SQL/报表使用。
"""
from sqlalchemy import text

from app.core.database import engine, ensure_teaching_quality_schema

VIEW_NAME = '神殿新生当月维稳统计视图'
SRC_TABLE = '每月个人新生维稳统计表'
SCHEMA = 'teaching_quality'

def ensure_monthly_new_stu_stability_view():
    ensure_teaching_quality_schema()
    # 先确保依赖表存在
    try:
        import importlib.util
        from pathlib import Path
        module_path = Path(__file__).resolve().parent / "TQcampus_monthly_personal_new_stu_stability_db.py"
        spec = importlib.util.spec_from_file_location("TQcampus_monthly_personal_new_stu_stability_db", module_path)
        if spec and spec.loader:
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            if hasattr(module, "init_monthly_personal_new_stu_stability_tables"):
                module.init_monthly_personal_new_stu_stability_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化依赖表 {SRC_TABLE} 失败: {e}")
        return
    ddl = f'''
    CREATE OR REPLACE VIEW {SCHEMA}."{VIEW_NAME}" AS
    SELECT 
        神殿名称,
        年份,
        月份,
        COALESCE(SUM(交接人数), 0) AS 交接人数,
        COALESCE(SUM(报到人数), 0) AS 报到人数,
        COALESCE(SUM(稳定过课时人数), 0) AS 稳定过课时人数,
        COALESCE(SUM(未过课时人数), 0) AS 未过课时人数,
        COALESCE(SUM(回全款人数), 0) AS 回全款人数,
        COALESCE(SUM(仍欠费人数), 0) AS 仍欠费人数,
        COALESCE(SUM(欠费总金额), 0) AS 欠费总金额,
        COALESCE(SUM(退费人数), 0) AS 退费人数,
        STRING_AGG(NULLIF(退费情况说明, ''), '；' ORDER BY 月份) FILTER (WHERE 退费情况说明 IS NOT NULL AND 退费情况说明 <> '') AS 退费情况说明
    FROM {SCHEMA}."{SRC_TABLE}"
    GROUP BY 神殿名称, 年份, 月份;
    '''
    with engine.begin() as conn:
        conn.execute(text(ddl))

