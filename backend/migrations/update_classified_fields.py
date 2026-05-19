"""
更新分类信息表字段结构
将58同城和赶集网的分开字段改为统一的分类信息基础数据字段
执行时间: 2026-02-09
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine

def upgrade():
    """更新字段结构"""
    with engine.connect() as conn:
        print("开始删除旧字段...")
        # 删除旧的58同城和赶集网字段（PostgreSQL语法）
        conn.execute(text("""
            ALTER TABLE market."市场部免费推广分类信息日度数据表"
            DROP COLUMN IF EXISTS "同城有效条数",
            DROP COLUMN IF EXISTS "同城浏览量",
            DROP COLUMN IF EXISTS "同城收藏数",
            DROP COLUMN IF EXISTS "同城分享量",
            DROP COLUMN IF EXISTS "同城咨询量",
            DROP COLUMN IF EXISTS "赶集有效条数",
            DROP COLUMN IF EXISTS "赶集浏览量",
            DROP COLUMN IF EXISTS "赶集收藏数",
            DROP COLUMN IF EXISTS "赶集分享量",
            DROP COLUMN IF EXISTS "赶集咨询量"
        """))
        print("✓ 旧字段删除成功")
        
        print("开始添加新字段...")
        # 添加新的统一分类信息基础数据字段（PostgreSQL语法）
        conn.execute(text("""
            ALTER TABLE market."市场部免费推广分类信息日度数据表"
            ADD COLUMN "有效分类信息量" INTEGER DEFAULT 0,
            ADD COLUMN "有效量" INTEGER DEFAULT 0,
            ADD COLUMN "有效率" NUMERIC(10,2),
            ADD COLUMN "浏览量" INTEGER DEFAULT 0,
            ADD COLUMN "点赞量" INTEGER DEFAULT 0,
            ADD COLUMN "分享量" INTEGER DEFAULT 0,
            ADD COLUMN "咨询量" INTEGER DEFAULT 0
        """))
        print("✓ 新字段添加成功")
        
        print("添加字段注释...")
        # 添加字段注释
        conn.execute(text("""
            COMMENT ON COLUMN market."市场部免费推广分类信息日度数据表"."有效分类信息量" IS '有效分类信息量'
        """))
        conn.execute(text("""
            COMMENT ON COLUMN market."市场部免费推广分类信息日度数据表"."有效量" IS '有效量'
        """))
        conn.execute(text("""
            COMMENT ON COLUMN market."市场部免费推广分类信息日度数据表"."有效率" IS '有效率'
        """))
        conn.execute(text("""
            COMMENT ON COLUMN market."市场部免费推广分类信息日度数据表"."浏览量" IS '浏览量'
        """))
        conn.execute(text("""
            COMMENT ON COLUMN market."市场部免费推广分类信息日度数据表"."点赞量" IS '点赞量'
        """))
        conn.execute(text("""
            COMMENT ON COLUMN market."市场部免费推广分类信息日度数据表"."分享量" IS '分享量'
        """))
        conn.execute(text("""
            COMMENT ON COLUMN market."市场部免费推广分类信息日度数据表"."咨询量" IS '咨询量'
        """))
        print("✓ 字段注释添加成功")
        
        conn.commit()
        print("✓ 分类信息表字段更新成功")

def downgrade():
    """回滚：恢复旧字段结构"""
    with engine.connect() as conn:
        # 删除新字段（PostgreSQL语法）
        conn.execute(text("""
            ALTER TABLE market."市场部免费推广分类信息日度数据表"
            DROP COLUMN IF EXISTS "有效分类信息量",
            DROP COLUMN IF EXISTS "有效量",
            DROP COLUMN IF EXISTS "有效率",
            DROP COLUMN IF EXISTS "浏览量",
            DROP COLUMN IF EXISTS "点赞量",
            DROP COLUMN IF EXISTS "分享量",
            DROP COLUMN IF EXISTS "咨询量"
        """))
        
        # 恢复旧字段（PostgreSQL语法）
        conn.execute(text("""
            ALTER TABLE market."市场部免费推广分类信息日度数据表"
            ADD COLUMN "同城有效条数" INTEGER DEFAULT 0,
            ADD COLUMN "同城浏览量" INTEGER DEFAULT 0,
            ADD COLUMN "同城收藏数" INTEGER DEFAULT 0,
            ADD COLUMN "同城分享量" INTEGER DEFAULT 0,
            ADD COLUMN "同城咨询量" INTEGER DEFAULT 0,
            ADD COLUMN "赶集有效条数" INTEGER DEFAULT 0,
            ADD COLUMN "赶集浏览量" INTEGER DEFAULT 0,
            ADD COLUMN "赶集收藏数" INTEGER DEFAULT 0,
            ADD COLUMN "赶集分享量" INTEGER DEFAULT 0,
            ADD COLUMN "赶集咨询量" INTEGER DEFAULT 0
        """))
        
        conn.commit()
        print("✓ 已回滚到旧字段结构")

if __name__ == '__main__':
    print("开始执行迁移...")
    try:
        upgrade()
        print("\n迁移执行成功！")
    except Exception as e:
        print(f"\n迁移执行失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

