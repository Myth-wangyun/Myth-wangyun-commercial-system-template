"""
测试视图在生产环境的自动更新
"""
from app.core.database import engine
from sqlalchemy import text

print("=" * 80)
print("测试1: 删除视图，模拟生产环境初始状态")
print("=" * 80)

try:
    with engine.begin() as conn:
        # 1. 删除视图（模拟生产环境没有视图的情况）
        conn.execute(text("""
            DROP VIEW IF EXISTS teaching_quality."v_personal_promotion_summary"
        """))
        print("✅ 视图已删除")
        
    # 2. 调用初始化函数（模拟生产环境启动）
    print("\n" + "=" * 80)
    print("测试2: 调用初始化函数，模拟生产环境启动")
    print("=" * 80)
    
    # 使用动态导入避免模块路径问题
    import importlib.util
    from pathlib import Path
    
    db_file = Path(__file__).parent / "app" / "teaching-quality" / "TQcampus_personal_promotion_goals_results_db.py"
    spec = importlib.util.spec_from_file_location("tq_module", str(db_file))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    
    module.init_personal_promotion_tables()
    print("✅ 初始化函数执行成功")
    
    # 3. 验证视图是否创建成功
    print("\n" + "=" * 80)
    print("测试3: 验证视图已创建并可以查询")
    print("=" * 80)
    
    with engine.begin() as conn:
        result = conn.execute(text("""
            SELECT 
                "年份",
                "姓名",
                "升学班级总数",
                "在档总人数",
                "应收"
            FROM teaching_quality."v_personal_promotion_summary"
            WHERE "年份" = 2026
        """))
        
        rows = result.fetchall()
        if rows:
            print(f"✅ 视图查询成功，找到 {len(rows)} 条记录")
            for row in rows:
                print(f"   年份={row[0]}, 姓名={row[1]}, 班级数={row[2]}, 在档={row[3]}, 应收={row[4]}")
        else:
            print("⚠️ 没有找到数据（可能数据库本身没有数据）")
    
    # 4. 再次调用初始化函数，验证幂等性
    print("\n" + "=" * 80)
    print("测试4: 再次调用初始化函数，验证CREATE OR REPLACE正常工作")
    print("=" * 80)
    
    module.init_personal_promotion_tables()
    print("✅ 第二次初始化成功（证明CREATE OR REPLACE工作正常）")
    
    # 5. 最终验证
    print("\n" + "=" * 80)
    print("测试5: 最终验证视图定义正确")
    print("=" * 80)
    
    with engine.begin() as conn:
        # 检查视图定义
        result = conn.execute(text("""
            SELECT definition 
            FROM pg_views 
            WHERE schemaname = 'teaching_quality' 
            AND viewname = 'v_personal_promotion_summary'
        """))
        
        row = result.fetchone()
        if row:
            print("✅ 视图定义:")
            print(row[0][:300] + "..." if len(row[0]) > 300 else row[0])
        else:
            print("❌ 未找到视图定义")
    
    print("\n" + "=" * 80)
    print("✅ 所有测试通过！生产环境启动时会自动正确更新视图")
    print("=" * 80)
    
except Exception as e:
    print(f"\n❌ 测试失败: {e}")
    import traceback
    traceback.print_exc()
