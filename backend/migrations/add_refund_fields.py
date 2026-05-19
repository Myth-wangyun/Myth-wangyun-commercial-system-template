"""
数据库迁移脚本：添加退费相关字段
执行方式：python backend/migrations/add_refund_fields.py
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    """添加退费相关字段到咨询量明细表"""
    
    # 创建数据库引擎
    engine = create_engine(settings.DATABASE_URL)
    
    # 需要添加的字段
    new_columns = [
        ('缴费金额', 'INTEGER DEFAULT 0', '缴费金额'),
        ('是否退费', 'INTEGER DEFAULT 0', '是否退费：0-否，1-是（需先勾选报名或订座）'),
        ('退费原因', 'VARCHAR(200)', '退费原因'),
        ('退费金额', 'INTEGER DEFAULT 0', '退费金额'),
    ]
    
    with engine.connect() as conn:
        for column_name, column_type, comment in new_columns:
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
                
                if result.fetchone():
                    print(f"字段 '{column_name}' 已存在，跳过")
                    continue
                
                # 添加字段
                alter_sql = text(f"""
                    ALTER TABLE consult."咨询量明细表_v2" 
                    ADD COLUMN "{column_name}" {column_type}
                """)
                conn.execute(alter_sql)
                
                # 添加注释
                comment_sql = text(f"""
                    COMMENT ON COLUMN consult."咨询量明细表_v2"."{column_name}" IS :comment
                """)
                conn.execute(comment_sql, {'comment': comment})
                
                conn.commit()
                print(f"成功添加字段: {column_name}")
                
            except Exception as e:
                print(f"添加字段 '{column_name}' 失败: {e}")
                conn.rollback()
    
    print("\n迁移完成!")

if __name__ == '__main__':
    run_migration()
