"""
添加追访相关字段到咨询量表
- 咨询量明细表_v2: 最近追访时间, 追访记录
- 咨询量主表: 最后追访时间, 保护期状态, 释放时间（如果不存在）
"""

import sys
import os
from pathlib import Path

# 添加项目根目录到 Python 路径
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import engine
from sqlalchemy import text


def add_follow_up_fields():
    """添加追访相关字段"""
    
    with engine.connect() as conn:
        print("开始添加追访相关字段...")
        
        # 1. 检查并添加 咨询量明细表_v2 的字段
        print("\n检查咨询量明细表_v2...")
        
        # 检查最近追访时间字段是否存在
        check_detail_追访时间 = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'consult' 
            AND table_name = '咨询量明细表_v2' 
            AND column_name = '最近追访时间'
        """)
        result = conn.execute(check_detail_追访时间).fetchone()
        
        if not result:
            print("  添加字段: 最近追访时间")
            add_field = text("""
                ALTER TABLE consult."咨询量明细表_v2"
                ADD COLUMN "最近追访时间" TIMESTAMP;
            """)
            conn.execute(add_field)
            
            # 添加注释
            comment = text("""
                COMMENT ON COLUMN consult."咨询量明细表_v2"."最近追访时间" 
                IS '最近追访时间';
            """)
            conn.execute(comment)
            print("  ✓ 成功添加字段: 最近追访时间")
        else:
            print("  - 字段已存在: 最近追访时间")
        
        # 检查追访记录字段是否存在
        check_detail_追访记录 = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'consult' 
            AND table_name = '咨询量明细表_v2' 
            AND column_name = '追访记录'
        """)
        result = conn.execute(check_detail_追访记录).fetchone()
        
        if not result:
            print("  添加字段: 追访记录")
            add_field = text("""
                ALTER TABLE consult."咨询量明细表_v2"
                ADD COLUMN "追访记录" TEXT;
            """)
            conn.execute(add_field)
            
            # 添加注释
            comment = text("""
                COMMENT ON COLUMN consult."咨询量明细表_v2"."追访记录" 
                IS '追访记录内容';
            """)
            conn.execute(comment)
            print("  ✓ 成功添加字段: 追访记录")
        else:
            print("  - 字段已存在: 追访记录")
        
        # 2. 检查并添加 咨询量主表 的字段
        print("\n检查咨询量主表...")
        
        # 检查最后追访时间字段是否存在
        check_main_追访时间 = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'consult' 
            AND table_name = '咨询量主表' 
            AND column_name = '最后追访时间'
        """)
        result = conn.execute(check_main_追访时间).fetchone()
        
        if not result:
            print("  添加字段: 最后追访时间")
            add_field = text("""
                ALTER TABLE consult."咨询量主表"
                ADD COLUMN "最后追访时间" TIMESTAMP;
            """)
            conn.execute(add_field)
            
            # 添加注释
            comment = text("""
                COMMENT ON COLUMN consult."咨询量主表"."最后追访时间" 
                IS '最后追访时间（私域保护期判断依据）';
            """)
            conn.execute(comment)
            print("  ✓ 成功添加字段: 最后追访时间")
        else:
            print("  - 字段已存在: 最后追访时间")
        
        # 检查保护期状态字段是否存在
        check_main_保护期状态 = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'consult' 
            AND table_name = '咨询量主表' 
            AND column_name = '保护期状态'
        """)
        result = conn.execute(check_main_保护期状态).fetchone()
        
        if not result:
            print("  添加字段: 保护期状态")
            add_field = text("""
                ALTER TABLE consult."咨询量主表"
                ADD COLUMN "保护期状态" VARCHAR(20) DEFAULT '私域保护中';
            """)
            conn.execute(add_field)
            
            # 添加注释
            comment = text("""
                COMMENT ON COLUMN consult."咨询量主表"."保护期状态" 
                IS '保护期状态：私域保护中/已释放到校域/已释放到公域';
            """)
            conn.execute(comment)
            print("  ✓ 成功添加字段: 保护期状态")
        else:
            print("  - 字段已存在: 保护期状态")
        
        # 检查释放时间字段是否存在
        check_main_释放时间 = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'consult' 
            AND table_name = '咨询量主表' 
            AND column_name = '释放时间'
        """)
        result = conn.execute(check_main_释放时间).fetchone()
        
        if not result:
            print("  添加字段: 释放时间")
            add_field = text("""
                ALTER TABLE consult."咨询量主表"
                ADD COLUMN "释放时间" TIMESTAMP;
            """)
            conn.execute(add_field)
            
            # 添加注释
            comment = text("""
                COMMENT ON COLUMN consult."咨询量主表"."释放时间" 
                IS '释放到校域/公域的时间';
            """)
            conn.execute(comment)
            print("  ✓ 成功添加字段: 释放时间")
        else:
            print("  - 字段已存在: 释放时间")
        
        # 提交更改
        conn.commit()
        
        print("\n" + "="*60)
        print("追访相关字段添加完成！")
        print("="*60)
        
        # 显示添加的字段列表
        print("\n已添加的字段:")
        print("  咨询量明细表_v2:")
        print("    - 最近追访时间 (TIMESTAMP)")
        print("    - 追访记录 (TEXT)")
        print("\n  咨询量主表:")
        print("    - 最后追访时间 (TIMESTAMP)")
        print("    - 保护期状态 (VARCHAR(20), DEFAULT '私域保护中')")
        print("    - 释放时间 (TIMESTAMP)")


def verify_fields():
    """验证字段是否添加成功"""
    
    with engine.connect() as conn:
        print("\n" + "="*60)
        print("验证字段...")
        print("="*60)
        
        # 验证咨询量明细表_v2
        print("\n咨询量明细表_v2 的追访相关字段:")
        query = text("""
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'consult' 
            AND table_name = '咨询量明细表_v2' 
            AND column_name IN ('最近追访时间', '追访记录')
            ORDER BY column_name
        """)
        results = conn.execute(query).fetchall()
        
        if results:
            for row in results:
                print(f"  ✓ {row[0]}: {row[1]} (nullable: {row[3]})")
        else:
            print("  ✗ 未找到追访相关字段")
        
        # 验证咨询量主表
        print("\n咨询量主表 的保护期相关字段:")
        query = text("""
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'consult' 
            AND table_name = '咨询量主表' 
            AND column_name IN ('最后追访时间', '保护期状态', '释放时间')
            ORDER BY column_name
        """)
        results = conn.execute(query).fetchall()
        
        if results:
            for row in results:
                default = row[2] if row[2] else 'NULL'
                print(f"  ✓ {row[0]}: {row[1]} (default: {default}, nullable: {row[3]})")
        else:
            print("  ✗ 未找到保护期相关字段")


if __name__ == "__main__":
    try:
        print("="*60)
        print("咨询量表追访字段迁移脚本")
        print("="*60)
        print("\n此脚本将添加以下字段:")
        print("  1. 咨询量明细表_v2: 最近追访时间, 追访记录")
        print("  2. 咨询量主表: 最后追访时间, 保护期状态, 释放时间")
        print("\n" + "="*60)
        
        # 询问用户确认
        confirm = input("\n是否继续执行? (yes/no): ").strip().lower()
        if confirm not in ['yes', 'y', '是']:
            print("操作已取消")
            sys.exit(0)
        
        # 执行迁移
        add_follow_up_fields()
        
        # 验证结果
        verify_fields()
        
        print("\n" + "="*60)
        print("迁移完成！")
        print("="*60)
        
    except Exception as e:
        print(f"\n错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
