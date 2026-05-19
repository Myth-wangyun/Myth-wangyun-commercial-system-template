"""
测试表选择逻辑是否正确
"""
import sys
sys.path.insert(0, '.')

# 测试表类的选择逻辑
def test_table_selection():
    print("=" * 80)
    print("测试表选择逻辑")
    print("=" * 80)

    # 导入表类
    from app.teaching_quality.TQcampus_manager_analysis_db import (
        教质经理功能分析月表,
        教质副经理功能分析月表,
    )

    # 测试 manager 的表选择
    职位类型 = "manager"
    if 职位类型 == "manager":
        TableClass = 教质经理功能分析月表
        table_name = "教质经理功能分析月表"
    elif 职位类型 == "deputy":
        TableClass = 教质副经理功能分析月表
        table_name = "教质副经理功能分析月表"

    print(f"\n职位类型: {职位类型}")
    print(f"期望表名: {table_name}")
    print(f"实际表名: {TableClass.__tablename__}")
    print(f"表类名称: {TableClass.__name__}")
    print(f"✓ 匹配成功" if TableClass.__tablename__ == table_name else "✗ 匹配失败")

    # 测试 deputy 的表选择
    职位类型 = "deputy"
    if 职位类型 == "manager":
        TableClass = 教质经理功能分析月表
        table_name = "教质经理功能分析月表"
    elif 职位类型 == "deputy":
        TableClass = 教质副经理功能分析月表
        table_name = "教质副经理功能分析月表"

    print(f"\n职位类型: {职位类型}")
    print(f"期望表名: {table_name}")
    print(f"实际表名: {TableClass.__tablename__}")
    print(f"表类名称: {TableClass.__name__}")
    print(f"✓ 匹配成功" if TableClass.__tablename__ == table_name else "✗ 匹配失败")

    print("\n" + "=" * 80)
    print("测试完成")
    print("=" * 80)

if __name__ == "__main__":
    test_table_selection()
