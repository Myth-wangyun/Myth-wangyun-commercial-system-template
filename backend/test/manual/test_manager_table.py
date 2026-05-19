#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
测试经理功能分析表是否能被创建
"""
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

print("=" * 70)
print("测试经理功能分析表创建")
print("=" * 70)

try:
    print("\n[1] 导入数据库模块...")
    from app.core.database import engine, ensure_teaching_quality_schema, TQBase
    print("✅ 数据库模块导入成功")
    
    print("\n[2] 导入表定义...")
    from app.teaching_quality.campus_manager_analysis_db import 经理功能分析月表, init_campus_manager_analysis_tables
    print("✅ 表定义导入成功")
    
    print("\n[3] 初始化 schema...")
    ensure_teaching_quality_schema()
    print("✅ Schema 初始化成功")
    
    print("\n[4] 创建表...")
    init_campus_manager_analysis_tables()
    print("✅ 表创建成功")
    
    print("\n[5] 检查表是否存在...")
    from sqlalchemy import inspect
    inspector = inspect(engine)
    
    # 检查 teaching_quality schema 中的表
    tables = inspector.get_table_names(schema='teaching_quality')
    print(f"   teaching_quality schema 中的表: {tables}")
    
    if '经理功能分析月表' in tables:
        print("✅ 经理功能分析月表已成功创建")
        
        # 获取表的列信息
        columns = inspector.get_columns('经理功能分析月表', schema='teaching_quality')
        print(f"\n   表的列数: {len(columns)}")
        for col in columns[:5]:
            print(f"   - {col['name']}: {col['type']}")
        print("   ...")
    else:
        print("❌ 经理功能分析月表未被创建")
        print(f"   可用的表: {tables}")
        
except Exception as e:
    print(f"\n❌ 错误: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 70)
print("✅ 测试完成")
print("=" * 70)

