"""
数据库迁移脚本：更新市场部免费推广地图日度数据表字段

执行方式：
cd backend
python migrations/add_map_table_fields.py
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    """更新地图日度数据表字段"""
    
    # 创建数据库连接
    engine = create_engine(settings.DATABASE_URL)
    
    # 需要添加/修改的字段
    operations = [
        # 1. 重命名旧字段
        ('rename', '地图花费', '地图消费', None),
        ('rename', '地图咨询量', '地图总量', None),
        
        # 2. 删除旧的浏览量字段（如果存在）
        ('drop', '百度地图浏览量', None, None),
        ('drop', '高德地图浏览量', None, None),
        
        # 3. 添加百度地图新字段
        ('add', '百度地图评论数', 'INTEGER DEFAULT 0', '百度地图评论数'),
        ('add', '百度地图点赞数', 'INTEGER DEFAULT 0', '百度地图点赞数'),
        ('add', '百度地图图片数', 'INTEGER DEFAULT 0', '百度地图图片数'),
        ('add', '百度地图精选案例数', 'INTEGER DEFAULT 0', '百度地图精选案例数'),
        ('add', '百度地图产品服务数', 'INTEGER DEFAULT 0', '百度地图产品服务数'),
        ('add', '百度地图评论分', 'NUMERIC(3, 1)', '百度地图评论分'),
        
        # 4. 添加高德地图新字段
        ('add', '高德地图评论数', 'INTEGER DEFAULT 0', '高德地图评论数'),
        ('add', '高德地图点赞数', 'INTEGER DEFAULT 0', '高德地图点赞数'),
        ('add', '高德地图图片数', 'INTEGER DEFAULT 0', '高德地图图片数'),
        ('add', '高德地图产品服务数', 'INTEGER DEFAULT 0', '高德地图产品服务数'),
        ('add', '高德地图评论分', 'NUMERIC(3, 1)', '高德地图评论分'),
        
        # 5. 添加腾讯地图字段
        ('add', '腾讯地图评论数', 'INTEGER DEFAULT 0', '腾讯地图评论数'),
        ('add', '腾讯地图点赞数', 'INTEGER DEFAULT 0', '腾讯地图点赞数'),
        ('add', '腾讯地图图片数', 'INTEGER DEFAULT 0', '腾讯地图图片数'),
        ('add', '腾讯地图产品服务数', 'INTEGER DEFAULT 0', '腾讯地图产品服务数'),
        ('add', '腾讯地图评论分', 'NUMERIC(3, 1)', '腾讯地图评论分'),
        ('add', '腾讯地图咨询量', 'INTEGER DEFAULT 0', '腾讯地图电话/咨询量'),
        
        # 6. 添加其他地图字段
        ('add', '其他地图评论数', 'INTEGER DEFAULT 0', '其他地图评论数'),
        ('add', '其他地图点赞数', 'INTEGER DEFAULT 0', '其他地图点赞数'),
        ('add', '其他地图图片数', 'INTEGER DEFAULT 0', '其他地图图片数'),
        ('add', '其他地图产品服务数', 'INTEGER DEFAULT 0', '其他地图产品服务数'),
        ('add', '其他地图评论分', 'NUMERIC(3, 1)', '其他地图评论分'),
        ('add', '其他地图咨询量', 'INTEGER DEFAULT 0', '其他地图电话/咨询量'),
    ]
    
    print("开始更新地图日度数据表字段...\n")
    
    success_count = 0
    skipped_count = 0
    failed_count = 0
    
    with engine.connect() as conn:
        table_exists = conn.execute(
            text(
                """
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'market'
                  AND table_name = '市场部免费推广地图日度数据表'
                """
            )
        ).scalar()
        if not table_exists:
            print('⊙ 目标表 market."市场部免费推广地图日度数据表" 不存在，跳过整个迁移')
            print("\n" + "=" * 60)
            print("迁移完成！")
            print("  - 成功操作: 0")
            print("  - 跳过操作: 0")
            print("  - 失败操作: 0")
            print("=" * 60)
            return

        for operation in operations:
            op_type = operation[0]
            column_name = operation[1]
            
            try:
                if op_type == 'rename':
                    old_name = column_name
                    new_name = operation[2]
                    
                    # 检查旧字段是否存在
                    check_sql = text("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_schema = 'market' 
                          AND table_name = '市场部免费推广地图日度数据表' 
                          AND column_name = :column_name
                    """)
                    result = conn.execute(check_sql, {'column_name': old_name})
                    exists = result.fetchone()
                    
                    if not exists:
                        print(f"⊙ 字段 '{old_name}' 不存在，跳过重命名")
                        skipped_count += 1
                        continue
                    
                    # 检查新字段是否已存在
                    result = conn.execute(check_sql, {'column_name': new_name})
                    new_exists = result.fetchone()
                    
                    if new_exists:
                        print(f"⊙ 字段 '{new_name}' 已存在，跳过重命名")
                        skipped_count += 1
                        continue
                    
                    # 重命名字段
                    rename_sql = f"""
                        ALTER TABLE market."市场部免费推广地图日度数据表" 
                        RENAME COLUMN "{old_name}" TO "{new_name}";
                    """
                    conn.execute(text(rename_sql))
                    conn.commit()
                    print(f"✓ 成功重命名字段: {old_name} -> {new_name}")
                    success_count += 1
                    
                elif op_type == 'drop':
                    # 检查字段是否存在
                    check_sql = text("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_schema = 'market' 
                          AND table_name = '市场部免费推广地图日度数据表' 
                          AND column_name = :column_name
                    """)
                    result = conn.execute(check_sql, {'column_name': column_name})
                    exists = result.fetchone()
                    
                    if not exists:
                        print(f"⊙ 字段 '{column_name}' 不存在，跳过删除")
                        skipped_count += 1
                        continue
                    
                    # 删除字段
                    drop_sql = f"""
                        ALTER TABLE market."市场部免费推广地图日度数据表" 
                        DROP COLUMN IF EXISTS "{column_name}";
                    """
                    conn.execute(text(drop_sql))
                    conn.commit()
                    print(f"✓ 成功删除字段: {column_name}")
                    success_count += 1
                    
                elif op_type == 'add':
                    column_type = operation[2]
                    comment = operation[3]
                    
                    # 检查字段是否存在
                    check_sql = text("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_schema = 'market' 
                          AND table_name = '市场部免费推广地图日度数据表' 
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
                        ALTER TABLE market."市场部免费推广地图日度数据表" 
                        ADD COLUMN "{column_name}" {column_type};
                    """
                    conn.execute(text(add_column_sql))
                    
                    # 添加注释
                    if comment:
                        comment_sql = f"""
                            COMMENT ON COLUMN market."市场部免费推广地图日度数据表"."{column_name}" IS '{comment}';
                        """
                        conn.execute(text(comment_sql))
                    
                    conn.commit()
                    print(f"✓ 成功添加字段: {column_name}")
                    success_count += 1
                    
            except Exception as e:
                print(f"✗ 操作字段 '{column_name}' 失败: {e}")
                failed_count += 1
                conn.rollback()
    
    print("\n" + "="*60)
    print(f"迁移完成！")
    print(f"  - 成功操作: {success_count}")
    print(f"  - 跳过操作: {skipped_count}")
    print(f"  - 失败操作: {failed_count}")
    print("="*60)

if __name__ == "__main__":
    run_migration()
