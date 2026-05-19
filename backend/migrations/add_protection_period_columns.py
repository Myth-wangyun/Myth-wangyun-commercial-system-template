"""
数据库迁移脚本：为咨询量表添加保护期相关字段

保护期规则（根据《清美教育咨询量管理规定》）：
1. 咨询师私域保护期：15天
2. 校域/省域保护期：180天
3. 90天无追访记录可释放到公域
"""

import sys
import os

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import SessionLocal


def add_protection_period_columns():
    """添加保护期相关字段到咨询量主表和明细表"""
    
    db = SessionLocal()
    
    try:
        # 检查并添加咨询量主表的字段
        主表字段 = [
            ('最后追访时间', 'TIMESTAMP', None, '最后追访时间（私域保护期判断依据）'),
            ('保护期状态', 'VARCHAR(20)', "'私域保护中'", '保护期状态：私域保护中/已释放到校域/已释放到公域'),
            ('释放时间', 'TIMESTAMP', None, '释放到校域/公域的时间'),
        ]
        
        for column_name, column_type, default_value, comment in 主表字段:
            # 检查字段是否存在
            check_sql = text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_schema = 'consult' 
                AND table_name = '咨询量主表' 
                AND column_name = :column_name
            """)
            result = db.execute(check_sql, {"column_name": column_name}).fetchone()
            
            if not result:
                # 添加字段
                default_clause = f" DEFAULT {default_value}" if default_value else ""
                alter_sql = text(f"""
                    ALTER TABLE consult."咨询量主表" 
                    ADD COLUMN "{column_name}" {column_type}{default_clause}
                """)
                db.execute(alter_sql)
                
                # 添加注释 - 使用字面量而非参数绑定
                comment_sql = text(f"""
                    COMMENT ON COLUMN consult."咨询量主表"."{column_name}" IS '{comment}'
                """)
                db.execute(comment_sql)
                print(f"✅ 已添加字段: 咨询量主表.{column_name}")
            else:
                print(f"⏭️ 字段已存在: 咨询量主表.{column_name}")
        
        # 检查并添加咨询量明细表的字段
        明细表字段 = [
            ('最近追访时间', 'TIMESTAMP', None, '最近追访时间'),
            ('追访记录', 'TEXT', None, '追访记录内容'),
        ]
        
        for column_name, column_type, default_value, comment in 明细表字段:
            # 检查字段是否存在
            check_sql = text("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_schema = 'consult' 
                AND table_name = '咨询量明细表_v2' 
                AND column_name = :column_name
            """)
            result = db.execute(check_sql, {"column_name": column_name}).fetchone()
            
            if not result:
                # 添加字段
                default_clause = f" DEFAULT {default_value}" if default_value else ""
                alter_sql = text(f"""
                    ALTER TABLE consult."咨询量明细表_v2" 
                    ADD COLUMN "{column_name}" {column_type}{default_clause}
                """)
                db.execute(alter_sql)
                
                # 添加注释 - 使用字面量而非参数绑定
                comment_sql = text(f"""
                    COMMENT ON COLUMN consult."咨询量明细表_v2"."{column_name}" IS '{comment}'
                """)
                db.execute(comment_sql)
                print(f"✅ 已添加字段: 咨询量明细表_v2.{column_name}")
            else:
                print(f"⏭️ 字段已存在: 咨询量明细表_v2.{column_name}")
        
        # 为主表添加保护期状态索引
        index_name = "idx_主表_保护期状态"
        check_index_sql = text("""
            SELECT indexname FROM pg_indexes 
            WHERE schemaname = 'consult' 
            AND tablename = '咨询量主表' 
            AND indexname = :index_name
        """)
        result = db.execute(check_index_sql, {"index_name": index_name}).fetchone()
        
        if not result:
            create_index_sql = text(f"""
                CREATE INDEX "{index_name}" ON consult."咨询量主表" ("保护期状态")
            """)
            db.execute(create_index_sql)
            print(f"✅ 已创建索引: {index_name}")
        else:
            print(f"⏭️ 索引已存在: {index_name}")
        
        # 为主表添加最后追访时间索引
        index_name = "idx_主表_最后追访时间"
        result = db.execute(check_index_sql, {"index_name": index_name}).fetchone()
        
        if not result:
            create_index_sql = text(f"""
                CREATE INDEX "{index_name}" ON consult."咨询量主表" ("最后追访时间")
            """)
            db.execute(create_index_sql)
            print(f"✅ 已创建索引: {index_name}")
        else:
            print(f"⏭️ 索引已存在: {index_name}")
        
        db.commit()
        print("\n✅ 保护期字段迁移完成！")
        
        # 初始化现有数据的保护期状态
        print("\n正在初始化现有数据的保护期状态...")
        init_protection_status(db)
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ 迁移失败: {e}")
        raise
    finally:
        db.close()


def init_protection_status(db):
    """初始化现有数据的保护期状态"""
    from datetime import datetime, timedelta
    
    当前时间 = datetime.now()
    私域到期截止 = 当前时间 - timedelta(days=15)
    校域到期截止 = 当前时间 - timedelta(days=180)
    无追访截止 = 当前时间 - timedelta(days=90)
    
    # 1. 更新未设置保护期状态的记录
    # 默认设为私域保护中
    update_sql = text("""
        UPDATE consult."咨询量主表" 
        SET "保护期状态" = '私域保护中'
        WHERE "保护期状态" IS NULL
    """)
    result = db.execute(update_sql)
    print(f"  - 设置默认保护期状态: {result.rowcount} 条记录")
    
    # 2. 更新私域过期的记录（首次登记时间超过15天）
    update_sql = text("""
        UPDATE consult."咨询量主表" 
        SET "保护期状态" = '已释放到校域',
            "释放时间" = CURRENT_TIMESTAMP
        WHERE "保护期状态" = '私域保护中'
        AND "首次登记时间" < :私域到期截止
        AND ("最后追访时间" IS NULL OR "最后追访时间" < :私域到期截止)
    """)
    result = db.execute(update_sql, {
        "私域到期截止": 私域到期截止
    })
    print(f"  - 释放到校域: {result.rowcount} 条记录")
    
    # 3. 更新校域过期的记录（首次登记时间超过180天且90天无追访）
    update_sql = text("""
        UPDATE consult."咨询量主表" 
        SET "保护期状态" = '已释放到公域',
            "释放时间" = CURRENT_TIMESTAMP
        WHERE "保护期状态" IN ('私域保护中', '已释放到校域')
        AND "首次登记时间" < :校域到期截止
        AND ("最后追访时间" IS NULL OR "最后追访时间" < :无追访截止)
    """)
    result = db.execute(update_sql, {
        "校域到期截止": 校域到期截止,
        "无追访截止": 无追访截止
    })
    print(f"  - 释放到公域: {result.rowcount} 条记录")
    
    db.commit()
    print("✅ 保护期状态初始化完成！")


def show_statistics(db):
    """显示保护期统计信息"""
    stats_sql = text("""
        SELECT 
            "保护期状态",
            COUNT(*) as 数量
        FROM consult."咨询量主表"
        GROUP BY "保护期状态"
        ORDER BY "保护期状态"
    """)
    results = db.execute(stats_sql).fetchall()
    
    print("\n📊 保护期状态统计:")
    print("-" * 40)
    total = 0
    for row in results:
        状态 = row[0] or "未设置"
        数量 = row[1]
        total += 数量
        print(f"  {状态}: {数量} 条")
    print("-" * 40)
    print(f"  总计: {total} 条")


if __name__ == "__main__":
    print("=" * 50)
    print("保护期字段迁移脚本")
    print("=" * 50)
    
    add_protection_period_columns()
    
    # 显示统计信息
    db = SessionLocal()
    try:
        show_statistics(db)
    finally:
        db.close()
