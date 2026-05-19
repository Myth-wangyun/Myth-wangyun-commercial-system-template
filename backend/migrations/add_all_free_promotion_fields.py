"""
数据库迁移脚本：一次性执行所有免费推广表的字段更新

执行方式：
cd backend
python migrations/add_all_free_promotion_fields.py
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings


def table_exists(conn, table_name: str) -> bool:
    return bool(
        conn.execute(
            text(
                """
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'market'
                  AND table_name = :table_name
                """
            ),
            {"table_name": table_name},
        ).scalar()
    )

def run_migration():
    """一次性执行所有表的字段更新"""
    
    # 创建数据库连接
    engine = create_engine(settings.DATABASE_URL)
    
    # 定义所有需要添加的字段
    migrations = {
        '市场部免费推广地图日度数据表': [
            # 百度地图
            ('百度地图评论数', 'INTEGER DEFAULT 0', '百度地图评论数'),
            ('百度地图点赞数', 'INTEGER DEFAULT 0', '百度地图点赞数'),
            ('百度地图图片数', 'INTEGER DEFAULT 0', '百度地图图片数'),
            ('百度地图精选案例数', 'INTEGER DEFAULT 0', '百度地图精选案例数'),
            ('百度地图产品服务数', 'INTEGER DEFAULT 0', '百度地图产品服务数'),
            ('百度地图评论分', 'NUMERIC(3, 1)', '百度地图评论分'),
            ('百度地图咨询量', 'INTEGER DEFAULT 0', '百度地图电话/咨询量'),
            # 高德地图
            ('高德地图评论数', 'INTEGER DEFAULT 0', '高德地图评论数'),
            ('高德地图点赞数', 'INTEGER DEFAULT 0', '高德地图点赞数'),
            ('高德地图图片数', 'INTEGER DEFAULT 0', '高德地图图片数'),
            ('高德地图产品服务数', 'INTEGER DEFAULT 0', '高德地图产品服务数'),
            ('高德地图评论分', 'NUMERIC(3, 1)', '高德地图评论分'),
            ('高德地图咨询量', 'INTEGER DEFAULT 0', '高德地图电话/咨询量'),
            # 腾讯地图
            ('腾讯地图评论数', 'INTEGER DEFAULT 0', '腾讯地图评论数'),
            ('腾讯地图点赞数', 'INTEGER DEFAULT 0', '腾讯地图点赞数'),
            ('腾讯地图图片数', 'INTEGER DEFAULT 0', '腾讯地图图片数'),
            ('腾讯地图产品服务数', 'INTEGER DEFAULT 0', '腾讯地图产品服务数'),
            ('腾讯地图评论分', 'NUMERIC(3, 1)', '腾讯地图评论分'),
            ('腾讯地图咨询量', 'INTEGER DEFAULT 0', '腾讯地图电话/咨询量'),
            # 其他地图
            ('其他地图评论数', 'INTEGER DEFAULT 0', '其他地图评论数'),
            ('其他地图点赞数', 'INTEGER DEFAULT 0', '其他地图点赞数'),
            ('其他地图图片数', 'INTEGER DEFAULT 0', '其他地图图片数'),
            ('其他地图产品服务数', 'INTEGER DEFAULT 0', '其他地图产品服务数'),
            ('其他地图评论分', 'NUMERIC(3, 1)', '其他地图评论分'),
            ('其他地图咨询量', 'INTEGER DEFAULT 0', '其他地图电话/咨询量'),
        ],
        '市场部免费推广微信平台日度数据表': [
            ('视频号有效条数', 'INTEGER DEFAULT 0', '微信视频号有效条数'),
            ('视频号播放量', 'INTEGER DEFAULT 0', '微信视频号播放量'),
            ('视频号喜欢数', 'INTEGER DEFAULT 0', '微信视频号喜欢数'),
            ('视频号点赞数', 'INTEGER DEFAULT 0', '微信视频号点赞数'),
            ('视频号评论数', 'INTEGER DEFAULT 0', '微信视频号评论数'),
            ('视频号新增关注', 'INTEGER DEFAULT 0', '微信视频号新增关注'),
            ('视频号转发量', 'INTEGER DEFAULT 0', '微信视频号转发总量'),
            ('视频号咨询量', 'INTEGER DEFAULT 0', '微信视频号咨询量'),
        ],
        '市场部免费推广视频日度数据表': [
            ('爱奇艺视频数', 'INTEGER DEFAULT 0', '爱奇艺视频数'),
            ('爱奇艺展现量', 'INTEGER DEFAULT 0', '爱奇艺总展现量'),
            ('爱奇艺播放量', 'INTEGER DEFAULT 0', '爱奇艺总播放量'),
            ('爱奇艺评论量', 'INTEGER DEFAULT 0', '爱奇艺总评论量'),
            ('爱奇艺点赞量', 'INTEGER DEFAULT 0', '爱奇艺总点赞量'),
            ('爱奇艺咨询量', 'INTEGER DEFAULT 0', '爱奇艺咨询量'),
        ],
    }
    
    # 需要重命名的字段
    renames = {
        '市场部免费推广地图日度数据表': [
            ('地图花费', '地图消费'),
            ('地图咨询量', '地图总量'),
        ]
    }
    
    # 需要删除的字段
    drops = {
        '市场部免费推广地图日度数据表': [
            '百度地图浏览量',
            '高德地图浏览量',
        ]
    }
    
    print("="*60)
    print("开始执行免费推广表字段迁移...")
    print("="*60)
    
    total_added = 0
    total_skipped = 0
    total_failed = 0
    
    with engine.connect() as conn:
        # 1. 处理重命名
        print("\n【步骤1】处理字段重命名...")
        for table_name, rename_list in renames.items():
            if not table_exists(conn, table_name):
                print(f"  ⊙ [{table_name}] 目标表不存在，跳过重命名")
                continue
            for old_name, new_name in rename_list:
                try:
                    # 检查旧字段是否存在
                    check_sql = text("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_schema = 'market' 
                          AND table_name = :table_name 
                          AND column_name = :column_name
                    """)
                    result = conn.execute(check_sql, {'table_name': table_name, 'column_name': old_name})
                    exists = result.fetchone()
                    
                    if not exists:
                        print(f"  ⊙ [{table_name}] 字段 '{old_name}' 不存在，跳过重命名")
                        continue
                    
                    # 检查新字段是否已存在
                    result = conn.execute(check_sql, {'table_name': table_name, 'column_name': new_name})
                    new_exists = result.fetchone()
                    
                    if new_exists:
                        print(f"  ⊙ [{table_name}] 字段 '{new_name}' 已存在，跳过重命名")
                        continue
                    
                    # 重命名字段
                    rename_sql = f"""
                        ALTER TABLE market."{table_name}" 
                        RENAME COLUMN "{old_name}" TO "{new_name}";
                    """
                    conn.execute(text(rename_sql))
                    conn.commit()
                    print(f"  ✓ [{table_name}] 成功重命名: {old_name} -> {new_name}")
                    
                except Exception as e:
                    print(f"  ✗ [{table_name}] 重命名失败 {old_name}: {e}")
                    conn.rollback()
        
        # 2. 处理删除
        print("\n【步骤2】删除旧字段...")
        for table_name, drop_list in drops.items():
            if not table_exists(conn, table_name):
                print(f"  ⊙ [{table_name}] 目标表不存在，跳过删除")
                continue
            for column_name in drop_list:
                try:
                    check_sql = text("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_schema = 'market' 
                          AND table_name = :table_name 
                          AND column_name = :column_name
                    """)
                    result = conn.execute(check_sql, {'table_name': table_name, 'column_name': column_name})
                    exists = result.fetchone()
                    
                    if not exists:
                        print(f"  ⊙ [{table_name}] 字段 '{column_name}' 不存在，跳过删除")
                        continue
                    
                    drop_sql = f"""
                        ALTER TABLE market."{table_name}" 
                        DROP COLUMN IF EXISTS "{column_name}";
                    """
                    conn.execute(text(drop_sql))
                    conn.commit()
                    print(f"  ✓ [{table_name}] 成功删除字段: {column_name}")
                    
                except Exception as e:
                    print(f"  ✗ [{table_name}] 删除失败 {column_name}: {e}")
                    conn.rollback()
        
        # 3. 添加新字段
        print("\n【步骤3】添加新字段...")
        for table_name, fields in migrations.items():
            print(f"\n  处理表: {table_name}")
            if not table_exists(conn, table_name):
                print(f"    ⊙ 目标表不存在，跳过整表")
                continue
            for column_name, column_type, comment in fields:
                try:
                    # 检查字段是否存在
                    check_sql = text("""
                        SELECT column_name 
                        FROM information_schema.columns 
                        WHERE table_schema = 'market' 
                          AND table_name = :table_name 
                          AND column_name = :column_name
                    """)
                    result = conn.execute(check_sql, {'table_name': table_name, 'column_name': column_name})
                    exists = result.fetchone()
                    
                    if exists:
                        print(f"    ⊙ 字段 '{column_name}' 已存在，跳过")
                        total_skipped += 1
                        continue
                    
                    # 添加字段
                    add_column_sql = f"""
                        ALTER TABLE market."{table_name}" 
                        ADD COLUMN "{column_name}" {column_type};
                    """
                    conn.execute(text(add_column_sql))
                    
                    # 添加注释
                    comment_sql = f"""
                        COMMENT ON COLUMN market."{table_name}"."{column_name}" IS '{comment}';
                    """
                    conn.execute(text(comment_sql))
                    
                    conn.commit()
                    print(f"    ✓ 成功添加字段: {column_name}")
                    total_added += 1
                    
                except Exception as e:
                    print(f"    ✗ 添加字段 '{column_name}' 失败: {e}")
                    total_failed += 1
                    conn.rollback()
    
    print("\n" + "="*60)
    print(f"迁移完成！")
    print(f"  - 新增字段: {total_added}")
    print(f"  - 已存在字段: {total_skipped}")
    print(f"  - 失败字段: {total_failed}")
    print("="*60)
    print("\n提示：请重启后端服务以加载新的数据库模型")

if __name__ == "__main__":
    run_migration()
