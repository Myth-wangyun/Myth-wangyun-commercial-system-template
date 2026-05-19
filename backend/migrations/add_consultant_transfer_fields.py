"""
添加咨询师转量相关字段到咨询量明细表

该脚本为咨询量明细表添加咨询师转量和跨神殿审批功能所需的字段
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine


def add_consultant_transfer_fields():
    """添加咨询师转量相关字段"""
    
    print("=" * 60)
    print("开始执行咨询师转量字段迁移脚本")
    print("=" * 60)
    
    with engine.connect() as conn:
        # ==================== 咨询量明细表添加咨询师转量字段 ====================
        print("\n为咨询量明细表添加咨询师转量字段...")
        
        detail_table_fields = [
            # 咨询师转量追踪字段
            ('原咨询师', 'VARCHAR(50)', None, '转量前的原咨询师'),
            ('转自咨询师', 'VARCHAR(50)', None, '转自哪个咨询师的量（用于数据指标分析）'),
            ('咨询师转量次数', 'INTEGER', '0', '该记录被咨询师转量的次数'),
            # 跨神殿转量审批相关
            ('转量审批状态', 'VARCHAR(20)', None, '审批状态：待审批/已通过/已拒绝'),
            ('转量审批人', 'VARCHAR(50)', None, '审批人'),
            ('转量审批时间', 'TIMESTAMP', None, '审批时间'),
            ('转量审批意见', 'TEXT', None, '审批意见'),
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
                
                # 添加字段（包含注释）
                default_clause = f"DEFAULT {default_value}" if default_value else ""
                alter_sql = f"""
                    ALTER TABLE consult."咨询量明细表_v2" 
                    ADD COLUMN "{field_name}" {field_type} {default_clause}
                """
                conn.execute(text(alter_sql))
                conn.commit()
                
                # 添加注释（使用字符串拼接而不是参数绑定，因为 COMMENT 语句不支持参数）
                escaped_comment = comment.replace("'", "''")
                comment_sql = f"""
                    COMMENT ON COLUMN consult."咨询量明细表_v2"."{field_name}" IS '{escaped_comment}'
                """
                conn.execute(text(comment_sql))
                conn.commit()
                
                print(f"  [OK] 字段 '{field_name}' 添加成功")
            except Exception as e:
                conn.rollback()
                print(f"  [ERROR] 字段 '{field_name}' 添加失败: {e}")
        
        print("\n" + "=" * 60)
        print("咨询师转量字段迁移完成！")
        print("=" * 60)


def main():
    """主入口"""
    try:
        add_consultant_transfer_fields()
        print("\n[SUCCESS] 迁移脚本执行成功！")
    except Exception as e:
        print(f"\n[FAILED] 迁移脚本执行失败: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
