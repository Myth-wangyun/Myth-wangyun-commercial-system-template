"""
数据库迁移脚本：为微信平台表添加视频号字段

执行方式：
cd backend
python migrations/add_wechat_video_fields.py
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    """为微信平台表添加视频号字段"""
    
    # 创建数据库连接
    engine = create_engine(settings.DATABASE_URL)
    
    # 需要添加的字段
    fields_to_add = [
        ('视频号有效条数', 'INTEGER DEFAULT 0', '微信视频号有效条数'),
        ('视频号播放量', 'INTEGER DEFAULT 0', '微信视频号播放量'),
        ('视频号喜欢数', 'INTEGER DEFAULT 0', '微信视频号喜欢数'),
        ('视频号点赞数', 'INTEGER DEFAULT 0', '微信视频号点赞数'),
        ('视频号评论数', 'INTEGER DEFAULT 0', '微信视频号评论数'),
        ('视频号新增关注', 'INTEGER DEFAULT 0', '微信视频号新增关注'),
        ('视频号转发量', 'INTEGER DEFAULT 0', '微信视频号转发总量'),
        ('视频号咨询量', 'INTEGER DEFAULT 0', '微信视频号咨询量'),
    ]
    
    print("开始为微信平台表添加视频号字段...\n")
    
    added_count = 0
    skipped_count = 0
    failed_count = 0
    
    with engine.connect() as conn:
        table_exists = conn.execute(
            text(
                """
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'market'
                  AND table_name = '市场部免费推广微信平台日度数据表'
                """
            )
        ).scalar()
        if not table_exists:
            print('⊙ 目标表 market."市场部免费推广微信平台日度数据表" 不存在，跳过整个迁移')
            print("\n" + "=" * 60)
            print("迁移完成！")
            print("  - 新增字段: 0")
            print("  - 已存在字段: 0")
            print("  - 失败字段: 0")
            print("=" * 60)
            return

        for column_name, column_type, comment in fields_to_add:
            try:
                # 检查字段是否存在
                check_sql = text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'market' 
                      AND table_name = '市场部免费推广微信平台日度数据表' 
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
                    ALTER TABLE market."市场部免费推广微信平台日度数据表" 
                    ADD COLUMN "{column_name}" {column_type};
                """
                conn.execute(text(add_column_sql))
                
                # 添加注释
                comment_sql = f"""
                    COMMENT ON COLUMN market."市场部免费推广微信平台日度数据表"."{column_name}" IS '{comment}';
                """
                conn.execute(text(comment_sql))
                
                conn.commit()
                print(f"✓ 成功添加字段: {column_name}")
                added_count += 1
                
            except Exception as e:
                print(f"✗ 添加字段 '{column_name}' 失败: {e}")
                failed_count += 1
                conn.rollback()
    
    print("\n" + "="*60)
    print(f"迁移完成！")
    print(f"  - 新增字段: {added_count}")
    print(f"  - 已存在字段: {skipped_count}")
    print(f"  - 失败字段: {failed_count}")
    print("="*60)

if __name__ == "__main__":
    run_migration()
