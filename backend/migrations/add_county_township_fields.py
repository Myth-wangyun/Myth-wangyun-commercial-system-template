"""
数据库迁移脚本：添加县办、乡办等缺失字段到咨询量明细表_v2

执行方式：
cd backend
python migrations/add_county_township_fields.py
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    """添加县办、乡办、信息员等字段到咨询量明细表_v2"""
    
    # 创建数据库连接
    engine = create_engine(settings.DATABASE_URL)
    
    print("开始检查并添加缺失字段...\n")
    
    fields_to_add = [
        ('县办', 'VARCHAR(50)', '县办'),
        ('乡办', 'VARCHAR(50)', '乡办'),
        ('信息员', 'VARCHAR(50)', '信息员'),
    ]
    
    added_count = 0
    skipped_count = 0
    
    with engine.connect() as conn:
        for column_name, column_type, comment in fields_to_add:
            try:
                # 检查字段是否存在
                check_sql = text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'consult' 
                      AND table_name = '咨询量明细表_v2' 
                      AND column_name = :column_name
                """)
                result = conn.execute(check_sql, {'column_name': column_name})
                exists = result.fetchone()
                
                if exists:
                    print(f"⊙ 字段 '{column_name}' 已存在，跳过")
                    skipped_count += 1
                    continue
                
                # 添加字段
                add_column_sql = f"""
                    ALTER TABLE consult."咨询量明细表_v2" 
                    ADD COLUMN "{column_name}" {column_type};
                """
                conn.execute(text(add_column_sql))
                
                # 添加注释
                comment_sql = f"""
                    COMMENT ON COLUMN consult."咨询量明细表_v2"."{column_name}" IS '{comment}';
                """
                conn.execute(text(comment_sql))
                
                conn.commit()
                print(f"✅ 成功添加字段: {column_name}")
                added_count += 1
                
            except Exception as e:
                print(f"❌ 添加字段 '{column_name}' 失败: {e}")
                conn.rollback()
                raise
    
    print("\n" + "="*60)
    print(f"迁移完成！")
    print(f"  - 新增字段: {added_count}")
    print(f"  - 已存在字段: {skipped_count}")
    print("="*60)

if __name__ == "__main__":
    run_migration()

