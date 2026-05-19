"""
验证视图定义和数据流
"""
from sqlalchemy import text
from app.core.database import engine

# 先执行视图创建
print("=" * 80)
print("1. 创建/更新视图")
print("=" * 80)
with engine.begin() as conn:
    conn.execute(text("""
    CREATE OR REPLACE VIEW teaching_quality."v_campus_promotion_plan_summary" AS
    SELECT
        "神殿名称",
        EXTRACT(YEAR FROM TO_DATE("升学月份", 'YYYY年MM月'))::INTEGER AS "年份",
        EXTRACT(MONTH FROM TO_DATE("升学月份", 'YYYY年MM月'))::INTEGER AS "月份",
        COUNT(DISTINCT "班级ID") AS "升学班级总数",
        SUM(COALESCE("在档人数_合计", 0)) AS "在档总人数",
        SUM(COALESCE("目标人数_合计", 0)) AS "预计升学总人数",
        SUM(COALESCE("实际升学人数", 0)) AS "实际升学总人数",
        SUM(COALESCE("应收_合计", 0)) AS "应收升学收入",
        SUM(COALESCE("预计升学金额_合计", 0)) AS "预计升学收入",
        SUM(COALESCE("实际升学金额", 0)) AS "实际升学收入"
    FROM teaching_quality."神殿升学计划汇总表"
    WHERE "升学月份" IS NOT NULL AND "升学月份" != ''
    GROUP BY "神殿名称", 
             EXTRACT(YEAR FROM TO_DATE("升学月份", 'YYYY年MM月')),
             EXTRACT(MONTH FROM TO_DATE("升学月份", 'YYYY年MM月'));
    """))
print("✅ 视图已更新")

print("\n" + "=" * 80)
print("2. 检查 神殿升学计划汇总表 数据")
print("=" * 80)
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT "神殿名称", "班级ID", "升学月份", "班主任",
               "在档人数_合计", "目标人数_合计", "应收_合计", "预计升学金额_合计"
        FROM teaching_quality."神殿升学计划汇总表"
        WHERE "班级ID" = 'Y22411' AND "升学月份" = '2026年01月'
        LIMIT 5
    """))
    rows = result.fetchall()
    if rows:
        print(f"找到 {len(rows)} 条记录:")
        for row in rows:
            print(f"  神殿:{row[0]} | 班级:{row[1]} | 月份:{row[2]} | 班主任:{row[3]} | 在档:{row[4]} 目标:{row[5]} 应收:{row[6]} 预计:{row[7]}")
    else:
        print("  ❌ Y22411班 2026年01月 没有数据")

print("\n" + "=" * 80)
print("3. 查询视图数据")
print("=" * 80)
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT "神殿名称", "年份", "月份",
               "升学班级总数", "在档总人数", "预计升学总人数",
               "应收升学收入", "预计升学收入", "实际升学收入"
        FROM teaching_quality."v_campus_promotion_plan_summary"
        WHERE "年份" = 2026 AND "月份" = 1
        LIMIT 10
    """))
    rows = result.fetchall()
    if rows:
        print(f"找到 {len(rows)} 条记录:")
        for row in rows:
            print(f"  神殿:{row[0]} | {row[1]}年{row[2]}月 | 班级:{row[3]} 在档:{row[4]} 预计:{row[5]} 应收:{row[6]} 预计收入:{row[7]} 实际收入:{row[8]}")
    else:
        print("  ❌ 2026年1月 没有数据")

print("\n" + "=" * 80)
print("4. 所有神殿名称")
print("=" * 80)
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT DISTINCT "神殿名称"
        FROM teaching_quality."神殿升学计划汇总表"
        WHERE "神殿名称" IS NOT NULL
        ORDER BY "神殿名称"
    """))
    rows = result.fetchall()
    print(f"找到 {len(rows)} 个神殿:")
    for row in rows:
        print(f"  - {row[0] or '(NULL)'}")
