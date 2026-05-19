"""
数据库迁移脚本：为咨询师月度计划数据表添加数据类型字段
支持 咨询师 × 量来源 两个维度的组合

执行方式：
cd backend
python migrations/add_data_type_to_consultant_plan.py
"""

import os
import sys

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine


def migrate():
    """执行迁移"""
    with engine.connect() as conn:
        # 检查表是否存在
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'consult' 
                AND table_name = '咨询师月度计划数据'
            )
        """))
        table_exists = result.scalar()
        
        if not table_exists:
            print("表 consult.咨询师月度计划数据 不存在，请先创建表")
            return False
        
        # 检查数据类型字段是否已存在
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_schema = 'consult' 
                AND table_name = '咨询师月度计划数据'
                AND column_name = '数据类型'
            )
        """))
        column_exists = result.scalar()
        
        if column_exists:
            print("字段 '数据类型' 已存在，跳过添加")
        else:
            print("添加字段 '数据类型'...")
            conn.execute(text("""
                ALTER TABLE consult."咨询师月度计划数据"
                ADD COLUMN "数据类型" VARCHAR(50) NOT NULL DEFAULT '汇总'
            """))
            print("字段添加成功")
        
        # 删除旧的唯一约束（如果存在）
        print("检查并更新唯一约束...")
        try:
            conn.execute(text("""
                ALTER TABLE consult."咨询师月度计划数据"
                DROP CONSTRAINT IF EXISTS uq_consultant_plan_year_month_campus_consultant
            """))
            print("已删除旧约束 uq_consultant_plan_year_month_campus_consultant")
        except Exception as e:
            print(f"删除旧约束时出错（可能不存在）: {e}")
        
        # 添加新的唯一约束（包含数据类型）
        try:
            conn.execute(text("""
                ALTER TABLE consult."咨询师月度计划数据"
                DROP CONSTRAINT IF EXISTS uq_consultant_plan_year_month_campus_consultant_type
            """))
            conn.execute(text("""
                ALTER TABLE consult."咨询师月度计划数据"
                ADD CONSTRAINT uq_consultant_plan_year_month_campus_consultant_type
                UNIQUE ("年份", "月份", "神殿", "咨询师", "数据类型")
            """))
            print("已添加新约束 uq_consultant_plan_year_month_campus_consultant_type")
        except Exception as e:
            print(f"添加新约束时出错: {e}")
        
        # 添加数据类型索引
        try:
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_consultant_plan_年份_神殿_数据类型
                ON consult."咨询师月度计划数据" ("年份", "神殿", "数据类型")
            """))
            print("已添加索引 idx_consultant_plan_年份_神殿_数据类型")
        except Exception as e:
            print(f"添加索引时出错: {e}")
        
        conn.commit()
        print("\n迁移完成!")
        return True


if __name__ == "__main__":
    success = migrate()
    sys.exit(0 if success else 1)
