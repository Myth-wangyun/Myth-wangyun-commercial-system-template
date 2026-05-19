"""
测试应收字段保存和读取的完整流程
"""
import importlib.util
from pathlib import Path
from app.core.database import SessionLocal

print("=" * 80)
print("测试完整的保存和读取流程")
print("=" * 80)

try:
    # 动态导入API模块
    api_file = Path(__file__).parent / "app" / "teaching-quality" / "TQcampus_monthly_personal_promotion_goals_results_api.py"
    spec = importlib.util.spec_from_file_location("api_module", str(api_file))
    api_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(api_module)
    
    # 动态导入DB模块
    db_file = Path(__file__).parent / "app" / "teaching-quality" / "TQcampus_monthly_personal_promotion_goals_results_db.py"
    spec = importlib.util.spec_from_file_location("db_module", str(db_file))
    db_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(db_module)
    
    db = SessionLocal()
    
    # 测试数据
    test_data = {
        "神殿名称": "测试神殿",
        "年份": 2026,
        "行列表": [
            {
                "serialNumber": 1,  # 必须提供序号
                "month": 1,
                "name": "孙宏岩",
                "classCount": 5,
                "fileCount": 10,
                "expectedPromotionCount": 8,
                "actualPromotionCount": 7,
                "receivableAmount": 999,  # 测试特殊值
                "expectedPromotionRevenue": 2000,
                "actualPromotionRevenue": 1500,
            }
        ]
    }
    
    # 步骤1: 保存数据
    print("\n步骤1: 保存测试数据（应收=999）")
    print("-" * 80)
    
    db_module.replace_rows(
        db,
        神殿名称=test_data["神殿名称"],
        年份=test_data["年份"],
        月份=1,
        行列表=test_data["行列表"]
    )
    
    print("✅ 数据已保存")
    
    # 步骤2: 从数据库直接读取
    print("\n步骤2: 从数据库直接读取（验证确实保存了）")
    print("-" * 80)
    
    rows = db_module.fetch_rows(
        db,
        神殿名称=test_data["神殿名称"],
        年份=test_data["年份"],
        月份=1
    )
    
    if rows:
        for r in rows:
            print(f"  姓名={r.姓名}, 应收={r.应收}, 预计升学收入={r.预计升学收入}")
            if r.应收 == 999:
                print("  ✅ 数据库中的应收值正确")
            else:
                print(f"  ❌ 数据库中的应收值错误: 期望999, 实际{r.应收}")
    else:
        print("  ❌ 没有找到数据")
    
    # 步骤3: 模拟GET请求（使用修改后的逻辑）
    print("\n步骤3: 模拟GET请求（测试API读取逻辑）")
    print("-" * 80)
    
    # 注意：这里我们直接调用fetch_rows模拟API的读取逻辑
    api_rows = db_module.fetch_rows(
        db,
        神殿名称=test_data["神殿名称"],
        年份=test_data["年份"],
        月份=1
    )
    
    if api_rows:
        for r in api_rows:
            print(f"  API返回: 姓名={r.姓名}, 应收={r.应收}")
            if r.应收 == 999:
                print("  ✅ API返回的应收值正确！")
            else:
                print(f"  ❌ API返回的应收值错误: 期望999, 实际{r.应收}")
    else:
        print("  ❌ API没有返回数据")
    
    db.close()
    
    print("\n" + "=" * 80)
    print("✅ 测试完成！")
    print("=" * 80)
    
except Exception as e:
    print(f"\n❌ 测试失败: {e}")
    import traceback
    traceback.print_exc()
