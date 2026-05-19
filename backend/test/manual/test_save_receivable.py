"""
测试应收字段保存功能
"""
from app.core.database import SessionLocal
from sqlalchemy import text

# 测试数据
test_data = {
    "神殿名称": "测试神殿",
    "年份": 2026,
    "月份": 12,
    "行列表": [
        {
            "serialNumber": 1,
            "name": "测试教员",
            "classCount": 5,
            "fileCount": 10,
            "expectedPromotionCount": 8,
            "actualPromotionCount": 7,
            "receivableAmount": 1000,  # 测试非0值
            "expectedPromotionRevenue": 2000,
            "actualPromotionRevenue": 1500,
            "remark": "测试备注"
        },
        {
            "serialNumber": 2,
            "name": "测试教员2",
            "receivableAmount": 0,  # 测试0值
        }
    ]
}

print("=" * 80)
print("测试1: 保存数据（包含receivableAmount=1000和receivableAmount=0）")
print("=" * 80)

try:
    # 动态导入DB模块
    import importlib.util
    from pathlib import Path
    
    db_file = Path(__file__).parent / "app" / "teaching-quality" / "TQcampus_monthly_personal_promotion_goals_results_db.py"
    spec = importlib.util.spec_from_file_location("tq_module", str(db_file))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    
    db = SessionLocal()
    
    # 调用保存函数
    module.replace_rows(
        db,
        神殿名称=test_data["神殿名称"],
        年份=test_data["年份"],
        月份=test_data["月份"],
        行列表=test_data["行列表"]
    )
    
    print("✅ 数据保存成功")
    
    # 验证数据
    print("\n" + "=" * 80)
    print("测试2: 读取保存的数据")
    print("=" * 80)
    
    rows = module.fetch_rows(
        db,
        神殿名称=test_data["神殿名称"],
        年份=test_data["年份"],
        月份=test_data["月份"]
    )
    
    print(f"\n找到 {len(rows)} 条记录：")
    for r in rows:
        print(f"  序号={r.序号}, 姓名={r.姓名}, 应收={r.应收}, 预计升学收入={r.预计升学收入}")
    
    # 验证应收字段
    print("\n" + "=" * 80)
    print("测试3: 验证应收字段值")
    print("=" * 80)
    
    if len(rows) >= 1:
        row1 = rows[0]
        if row1.应收 == 1000:
            print(f"✅ 第1条记录应收正确: {row1.应收}")
        else:
            print(f"❌ 第1条记录应收错误: 期望1000, 实际{row1.应收}")
    
    if len(rows) >= 2:
        row2 = rows[1]
        if row2.应收 == 0 or row2.应收 is None:
            print(f"✅ 第2条记录应收正确: {row2.应收}")
        else:
            print(f"❌ 第2条记录应收错误: 期望0或None, 实际{row2.应收}")
    
    db.close()
    
    print("\n" + "=" * 80)
    print("✅ 所有测试完成")
    print("=" * 80)
    
except Exception as e:
    print(f"\n❌ 测试失败: {e}")
    import traceback
    traceback.print_exc()
