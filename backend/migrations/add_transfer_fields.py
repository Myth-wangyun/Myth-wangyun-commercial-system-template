"""
添加转量相关字段到咨询量表

该脚本为咨询量主表和明细表添加转量功能所需的字段
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine


def add_transfer_fields():
    """添加转量相关字段"""
    
    print("=" * 60)
    print("开始执行转量字段迁移脚本")
    print("=" * 60)
    
    with engine.connect() as conn:
        # ==================== 咨询量主表添加转量字段 ====================
        print("\n1. 为咨询量主表添加转量字段...")
        
        main_table_fields = [
            ('是否已转量', 'INTEGER', '0', '是否已转量：0-否，1-是'),
            ('转量类型', 'VARCHAR(20)', None, '转量类型：同城转量/跨省转量'),
            ('转量阶段', 'VARCHAR(20)', None, '转量阶段：上门前/上门后/报名后'),
            ('原神殿', 'VARCHAR(50)', None, '转量前的原神殿'),
            ('目标神殿', 'VARCHAR(50)', None, '转量后的目标神殿'),
            ('转量时间', 'TIMESTAMP', None, '转量时间'),
            ('转量操作人', 'VARCHAR(50)', None, '转量操作人'),
            ('转量原因', 'TEXT', None, '转量原因'),
        ]
        
        for field_name, field_type, default_value, comment in main_table_fields:
            try:
                # 检查字段是否已存在
                check_sql = text("""
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_schema = 'consult' 
                    AND table_name = '咨询量主表' 
                    AND column_name = :field_name
                """)
                result = conn.execute(check_sql, {"field_name": field_name})
                if result.fetchone():
                    print(f"  - 字段 '{field_name}' 已存在，跳过")
                    continue
                
                # 添加字段（包含注释）
                default_clause = f"DEFAULT {default_value}" if default_value else ""
                alter_sql = f"""
                    ALTER TABLE consult."咨询量主表" 
                    ADD COLUMN "{field_name}" {field_type} {default_clause}
                """
                conn.execute(text(alter_sql))
                conn.commit()
                
                # 添加注释（使用字符串拼接而不是参数绑定，因为 COMMENT 语句不支持参数）
                escaped_comment = comment.replace("'", "''")
                comment_sql = f"""
                    COMMENT ON COLUMN consult."咨询量主表"."{field_name}" IS '{escaped_comment}'
                """
                conn.execute(text(comment_sql))
                conn.commit()
                
                print(f"  ✓ 字段 '{field_name}' 添加成功")
            except Exception as e:
                conn.rollback()
                print(f"  ✗ 字段 '{field_name}' 添加失败: {e}")
        
        # ==================== 咨询量明细表添加转量字段 ====================
        print("\n2. 为咨询量明细表添加转量字段...")
        
        detail_table_fields = [
            ('是否已转量', 'INTEGER', '0', '是否已转量：0-否，1-是'),
            ('转量类型', 'VARCHAR(20)', None, '转量类型：同城转量/跨省转量'),
            ('转量阶段', 'VARCHAR(20)', None, '转量阶段：上门前/上门后/报名后'),
            ('原神殿', 'VARCHAR(50)', None, '转量前的原神殿'),
            ('目标神殿', 'VARCHAR(50)', None, '转量后的目标神殿'),
            ('转量时间', 'TIMESTAMP', None, '转量时间'),
            ('转量操作人', 'VARCHAR(50)', None, '转量操作人'),
            ('转量原因', 'TEXT', None, '转量原因'),
        ]
        
        for field_name, field_type, default_value, comment in detail_table_fields:
            try:
                # 检查字段是否已存在
                check_sql = text("""
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_schema = 'consult' 
                    AND table_name = '咨询量明细表_v2' 
                    AND column_name = :field_name
                """)
                result = conn.execute(check_sql, {"field_name": field_name})
                if result.fetchone():
                    print(f"  - 字段 '{field_name}' 已存在，跳过")
                    continue
                
                # 添加字段
                default_clause = f"DEFAULT {default_value}" if default_value else ""
                alter_sql = f"""
                    ALTER TABLE consult."咨询量明细表_v2" 
                    ADD COLUMN "{field_name}" {field_type} {default_clause}
                """
                conn.execute(text(alter_sql))
                conn.commit()
                
                # 添加注释
                escaped_comment = comment.replace("'", "''")
                comment_sql = f"""
                    COMMENT ON COLUMN consult."咨询量明细表_v2"."{field_name}" IS '{escaped_comment}'
                """
                conn.execute(text(comment_sql))
                conn.commit()
                
                print(f"  ✓ 字段 '{field_name}' 添加成功")
            except Exception as e:
                conn.rollback()
                print(f"  ✗ 字段 '{field_name}' 添加失败: {e}")
        
        # ==================== 添加索引 ====================
        print("\n3. 添加转量相关索引...")
        
        indexes = [
            ('idx_main_是否已转量', 'consult."咨询量主表"', '"是否已转量"'),
            ('idx_main_转量类型', 'consult."咨询量主表"', '"转量类型"'),
            ('idx_main_原神殿', 'consult."咨询量主表"', '"原神殿"'),
            ('idx_main_目标神殿', 'consult."咨询量主表"', '"目标神殿"'),
            ('idx_detail_是否已转量', 'consult."咨询量明细表_v2"', '"是否已转量"'),
            ('idx_detail_转量类型', 'consult."咨询量明细表_v2"', '"转量类型"'),
            ('idx_detail_原神殿', 'consult."咨询量明细表_v2"', '"原神殿"'),
            ('idx_detail_目标神殿', 'consult."咨询量明细表_v2"', '"目标神殿"'),
        ]
        
        for index_name, table_name, columns in indexes:
            try:
                create_index_sql = f"""
                    CREATE INDEX IF NOT EXISTS "{index_name}" ON {table_name} ({columns})
                """
                conn.execute(text(create_index_sql))
                conn.commit()
                print(f"  ✓ 索引 '{index_name}' 创建成功")
            except Exception as e:
                conn.rollback()
                print(f"  ✗ 索引 '{index_name}' 创建失败: {e}")
        
        # ==================== 验证结果 ====================
        print("\n4. 验证迁移结果...")
        
        # 检查主表字段
        check_main_sql = text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_schema = 'consult' 
            AND table_name = '咨询量主表' 
            AND column_name LIKE '%转量%'
            ORDER BY column_name
        """)
        result = conn.execute(check_main_sql)
        main_fields = [row[0] for row in result.fetchall()]
        print(f"  咨询量主表转量相关字段: {main_fields}")
        
        # 检查明细表字段
        check_detail_sql = text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_schema = 'consult' 
            AND table_name = '咨询量明细表_v2' 
            AND column_name LIKE '%转量%'
            ORDER BY column_name
        """)
        result = conn.execute(check_detail_sql)
        detail_fields = [row[0] for row in result.fetchall()]
        print(f"  咨询量明细表转量相关字段: {detail_fields}")
        
        print("\n" + "=" * 60)
        print("转量字段迁移完成！")
        print("=" * 60)


if __name__ == "__main__":
    add_transfer_fields()
