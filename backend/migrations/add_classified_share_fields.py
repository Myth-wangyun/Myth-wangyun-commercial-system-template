"""
为分类信息表添加分享量字段
执行时间: 2026-02-09
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine

def upgrade():
    """添加分享量字段"""
    with engine.connect() as conn:
        # 为58同城添加分享量字段
        conn.execute(text("""
            ALTER TABLE `市场部免费推广分类信息日度数据表`
            ADD COLUMN `同城分享量` INT DEFAULT 0 COMMENT '58同城分享量' AFTER `同城收藏数`
        """))
        
        # 为赶集网添加分享量字段
        conn.execute(text("""
            ALTER TABLE `市场部免费推广分类信息日度数据表`
            ADD COLUMN `赶集分享量` INT DEFAULT 0 COMMENT '赶集网分享量' AFTER `赶集收藏数`
        """))
        
        conn.commit()
        print("✓ 分类信息表分享量字段添加成功")

def downgrade():
    """回滚：删除分享量字段"""
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE `市场部免费推广分类信息日度数据表`
            DROP COLUMN `同城分享量`,
            DROP COLUMN `赶集分享量`
        """))
        conn.commit()
        print("✓ 分类信息表分享量字段已删除")

if __name__ == '__main__':
    print("开始执行迁移...")
    try:
        upgrade()
        print("\n迁移执行成功！")
    except Exception as e:
        print(f"\n迁移执行失败: {e}")
        sys.exit(1)

