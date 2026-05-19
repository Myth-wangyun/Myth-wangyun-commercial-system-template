"""
数据库迁移脚本：为咨询量明细表添加口碑提供人字段

执行方式：
cd backend
python migrations/add_referrer_column.py
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    """添加口碑提供人字段到咨询量明细表"""
    
    # 创建数据库连接
    engine = create_engine(settings.DATABASE_URL)
    
    # 检查列是否已存在
    check_column_sql = """
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'consult' 
      AND table_name = '咨询量明细表_v2' 
      AND column_name = '口碑提供人'
    """
    
    # 添加列的SQL
    add_column_sql = """
    ALTER TABLE consult."咨询量明细表_v2" 
    ADD COLUMN IF NOT EXISTS "口碑提供人" VARCHAR(50);
    
    COMMENT ON COLUMN consult."咨询量明细表_v2"."口碑提供人" IS '口碑提供人（量来源为口碑时填写）';
    """
    
    with engine.connect() as conn:
        # 检查列是否存在
        result = conn.execute(text(check_column_sql))
        exists = result.fetchone()
        
        if exists:
            print("列 '口碑提供人' 已存在，跳过迁移。")
        else:
            print("正在添加列 '口碑提供人'...")
            conn.execute(text(add_column_sql))
            conn.commit()
            print("列 '口碑提供人' 添加成功！")

if __name__ == "__main__":
    run_migration()
