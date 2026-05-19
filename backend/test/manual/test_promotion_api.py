"""测试个人升学目标与结果汇总 DB"""
import sys
from pathlib import Path

# 添加 backend 目录到 sys.path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal

# 使用 importlib 动态加载模块
import importlib.util
db_file = backend_dir / "app" / "teaching-quality" / "TQcampus_personal_promotion_goals_results_db.py"
spec = importlib.util.spec_from_file_location("db_module", str(db_file))
db_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(db_module)

init_personal_promotion_tables = db_module.init_personal_promotion_tables
fetch_rows = db_module.fetch_rows

print("=" * 60)
print("测试个人升学目标与结果汇总 DB")
print("=" * 60)

try:
    # 初始化表
    print("\n1. 初始化表...")
    init_personal_promotion_tables()
    print("   ✅ 初始化成功")
    
    # 查询数据
    print("\n2. 查询数据 (year=2026)...")
    db = SessionLocal()
    try:
        rows = fetch_rows(db, 年份=2026)
        print(f"   ✅ 找到 {len(rows)} 条记录")
        
        if rows:
            print("\n   数据样例（最多显示3条）：")
            for i, row in enumerate(rows[:3], 1):
                print(f"   {i}. 姓名={row.姓名}, 班级数={row.升学班级总数}, 在档={row.在档总人数}, "
                      f"预计={row.预计升学总人数}, 实际={row.实际升学总人数}")
        else:
            print("   ⚠️  没有数据")
    finally:
        db.close()
    
    print("\n" + "=" * 60)
    print("✅ 测试成功！")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ 错误: {e}")
    import traceback
    traceback.print_exc()
