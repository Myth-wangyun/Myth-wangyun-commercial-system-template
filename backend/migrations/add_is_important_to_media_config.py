"""
数据库迁移脚本：为媒体来源配置表添加 is_important 字段
执行方式：python migrations/add_is_important_to_media_config.py
"""

import sys
import os

# 添加项目根目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine


def migrate():
    """添加 is_important 字段到 media_sources 和 media_details 表"""
    
    with engine.connect() as conn:
        # 检查 media_sources 表是否已有 is_important 字段
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'config' 
            AND table_name = 'media_sources' 
            AND column_name = 'is_important'
        """))
        
        if not result.fetchone():
            print("为 config.media_sources 表添加 is_important 字段...")
            conn.execute(text("""
                ALTER TABLE config.media_sources 
                ADD COLUMN is_important BOOLEAN NOT NULL DEFAULT FALSE
            """))
            conn.execute(text("""
                COMMENT ON COLUMN config.media_sources.is_important 
                IS '是否重要来源（在统计表中单独显示列）'
            """))
            print("✓ media_sources.is_important 字段添加成功")
        else:
            print("✓ media_sources.is_important 字段已存在，跳过")
        
        # 检查 media_details 表是否已有 is_important 字段
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'config' 
            AND table_name = 'media_details' 
            AND column_name = 'is_important'
        """))
        
        if not result.fetchone():
            print("为 config.media_details 表添加 is_important 字段...")
            conn.execute(text("""
                ALTER TABLE config.media_details 
                ADD COLUMN is_important BOOLEAN NOT NULL DEFAULT FALSE
            """))
            conn.execute(text("""
                COMMENT ON COLUMN config.media_details.is_important 
                IS '是否重要来源（在统计表中单独显示列）'
            """))
            print("✓ media_details.is_important 字段添加成功")
        else:
            print("✓ media_details.is_important 字段已存在，跳过")
        
        conn.commit()
        print("\n迁移完成!")


def run_migration() -> None:
    migrate()


if __name__ == "__main__":
    migrate()
