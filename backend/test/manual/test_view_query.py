"""测试视图查询"""
from app.core.database import engine
from sqlalchemy import text

print("=" * 60)
print("测试查询 v_personal_promotion_summary 视图")
print("=" * 60)

try:
    with engine.begin() as conn:
        # 查看视图定义
        result = conn.execute(text("""
            SELECT pg_get_viewdef('teaching_quality.v_personal_promotion_summary'::regclass, true)
        """))
        view_def = result.scalar()
        print("\n视图定义：")
        print(view_def)
        
        # 尝试查询视图数据
        print("\n" + "=" * 60)
        print("查询视图数据 (year=2026):")
        print("=" * 60)
        
        result = conn.execute(text("""
            SELECT * FROM teaching_quality."v_personal_promotion_summary"
            WHERE "年份" = 2026
            LIMIT 5
        """))
        
        rows = result.fetchall()
        if rows:
            print(f"\n找到 {len(rows)} 条记录（最多显示5条）：")
            for row in rows:
                print(f"  - {row}")
        else:
            print("\n没有找到数据")
            
        # 查询所有年份的数据量
        print("\n" + "=" * 60)
        print("按年份统计数据量:")
        print("=" * 60)
        
        result = conn.execute(text("""
            SELECT "年份", COUNT(*) as cnt
            FROM teaching_quality."v_personal_promotion_summary"
            GROUP BY "年份"
            ORDER BY "年份"
        """))
        
        for row in result.fetchall():
            print(f"  - 年份 {row[0]}: {row[1]} 条记录")
            
except Exception as e:
    print(f"\n❌ 错误: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
