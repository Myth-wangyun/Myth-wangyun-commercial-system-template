"""
添加会议记录表文件上传字段
- 添加 file_path 字段（会议纪要文件路径）
- 添加 file_name 字段（会议纪要文件名）
- 修改 issues_resolved 注释为"会议记录人"
- 修改 issues_pending 注释为"备注"
执行方式：python migrations/add_meeting_record_file_fields.py
"""

import sys
import os
from pathlib import Path

# 添加项目根目录到 Python 路径
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from app.core.config import settings

def upgrade():
    """添加文件上传相关字段"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        # 开始事务
        trans = conn.begin()
        try:
            # 检查字段是否已存在
            check_file_path = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'market' 
                AND table_name = '市场部会议记录表' 
                AND column_name = 'file_path'
            """)
            result = conn.execute(check_file_path).fetchone()
            
            if not result:
                # 添加 file_path 字段
                conn.execute(text("""
                    ALTER TABLE market."市场部会议记录表"
                    ADD COLUMN file_path VARCHAR(500) NOT NULL DEFAULT ''
                """))
                # 添加字段注释（PostgreSQL语法）
                conn.execute(text("""
                    COMMENT ON COLUMN market."市场部会议记录表".file_path IS '会议纪要文件路径'
                """))
                print("✓ 添加 file_path 字段成功")
            else:
                print("✓ file_path 字段已存在，跳过")
            
            # 检查 file_name 字段
            check_file_name = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'market' 
                AND table_name = '市场部会议记录表' 
                AND column_name = 'file_name'
            """)
            result = conn.execute(check_file_name).fetchone()
            
            if not result:
                # 添加 file_name 字段
                conn.execute(text("""
                    ALTER TABLE market."市场部会议记录表"
                    ADD COLUMN file_name VARCHAR(200) NOT NULL DEFAULT ''
                """))
                # 添加字段注释（PostgreSQL语法）
                conn.execute(text("""
                    COMMENT ON COLUMN market."市场部会议记录表".file_name IS '会议纪要文件名'
                """))
                print("✓ 添加 file_name 字段成功")
            else:
                print("✓ file_name 字段已存在，跳过")
            
            # 提交事务
            trans.commit()
            print("✓ 数据库迁移完成")
            
        except Exception as e:
            trans.rollback()
            print(f"✗ 迁移失败: {e}")
            raise

def downgrade():
    """回滚：删除文件上传相关字段"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # 删除 file_path 字段
            conn.execute(text("""
                ALTER TABLE market."市场部会议记录表"
                DROP COLUMN IF EXISTS file_path
            """))
            
            # 删除 file_name 字段
            conn.execute(text("""
                ALTER TABLE market."市场部会议记录表"
                DROP COLUMN IF EXISTS file_name
            """))
            
            trans.commit()
            print("✓ 回滚完成")
            
        except Exception as e:
            trans.rollback()
            print(f"✗ 回滚失败: {e}")
            raise

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == 'downgrade':
        downgrade()
    else:
        upgrade()

