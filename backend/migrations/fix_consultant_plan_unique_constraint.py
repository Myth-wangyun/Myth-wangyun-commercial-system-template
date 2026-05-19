"""
修复咨询师月度计划数据表的唯一约束
删除旧的4字段约束，添加新的5字段约束（包含数据类型）
"""

import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import create_engine, text
from app.core.config import settings


def fix_unique_constraint():
    """修复唯一约束"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("开始修复咨询师月度计划数据表的唯一约束...")
        
        # 1. 删除旧的唯一约束（如果存在）
        try:
            print("1. 删除旧的唯一约束 uq_consultant_plan_year_month_campus_consultant...")
            conn.execute(text("""
                ALTER TABLE consult."咨询师月度计划数据" 
                DROP CONSTRAINT IF EXISTS uq_consultant_plan_year_month_campus_consultant;
            """))
            conn.commit()
            print("   ✓ 旧约束已删除")
        except Exception as e:
            print(f"   警告：删除旧约束时出错（可能不存在）: {e}")
            conn.rollback()
        
        existing_constraint = conn.execute(text("""
            SELECT 1
            FROM information_schema.table_constraints
            WHERE table_schema = 'consult'
              AND table_name = '咨询师月度计划数据'
              AND constraint_type = 'UNIQUE'
              AND constraint_name = 'uq_consultant_plan_year_month_campus_consultant_type';
        """)).scalar()

        if existing_constraint:
            print("2. 新唯一约束已存在，跳过创建")
        else:
            # 2. 创建新的唯一约束（包含数据类型）
            try:
                print("2. 创建新的唯一约束 uq_consultant_plan_year_month_campus_consultant_type...")
                conn.execute(text("""
                    ALTER TABLE consult."咨询师月度计划数据" 
                    ADD CONSTRAINT uq_consultant_plan_year_month_campus_consultant_type 
                    UNIQUE ("年份", "月份", "神殿", "咨询师", "数据类型");
                """))
                conn.commit()
                print("   ✓ 新约束已创建")
            except Exception as e:
                print(f"   错误：创建新约束时出错: {e}")
                conn.rollback()
                raise
        
        # 3. 验证约束
        print("3. 验证约束...")
        result = conn.execute(text("""
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_schema = 'consult'
            AND table_name = '咨询师月度计划数据'
            AND constraint_type = 'UNIQUE';
        """))
        constraints = result.fetchall()
        print("   当前唯一约束:")
        for constraint in constraints:
            print(f"   - {constraint[0]}")
        
        print("\n✓ 修复完成！")


if __name__ == "__main__":
    fix_unique_constraint()
