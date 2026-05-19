-- ============================================================================
-- 添加缺失字段到咨询量明细表_v2
-- ============================================================================
-- 执行方式：在 PostgreSQL 数据库中直接执行此 SQL
-- 
-- 根据错误信息，已知缺失的字段：
-- 1. 渠道代理
-- 2. 网聊专员
-- 3. 咨询次数
-- ============================================================================

DO $$
BEGIN
    -- 1. 检查并添加 渠道代理 字段
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'consult' 
          AND table_name = '咨询量明细表_v2' 
          AND column_name = '渠道代理'
    ) THEN
        ALTER TABLE consult."咨询量明细表_v2" 
        ADD COLUMN "渠道代理" VARCHAR(50);
        
        COMMENT ON COLUMN consult."咨询量明细表_v2"."渠道代理" IS '渠道代理';
        
        RAISE NOTICE '✅ 成功添加字段: 渠道代理';
    ELSE
        RAISE NOTICE '⊙ 字段 渠道代理 已存在，无需添加';
    END IF;
    
    -- 2. 检查并添加 网聊专员 字段
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'consult' 
          AND table_name = '咨询量明细表_v2' 
          AND column_name = '网聊专员'
    ) THEN
        ALTER TABLE consult."咨询量明细表_v2" 
        ADD COLUMN "网聊专员" VARCHAR(50);
        
        COMMENT ON COLUMN consult."咨询量明细表_v2"."网聊专员" IS '网聊专员';
        
        RAISE NOTICE '✅ 成功添加字段: 网聊专员';
    ELSE
        RAISE NOTICE '⊙ 字段 网聊专员 已存在，无需添加';
    END IF;
    
    -- 3. 检查并添加 咨询次数 字段
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'consult' 
          AND table_name = '咨询量明细表_v2' 
          AND column_name = '咨询次数'
    ) THEN
        ALTER TABLE consult."咨询量明细表_v2" 
        ADD COLUMN "咨询次数" INTEGER DEFAULT 1;
        
        COMMENT ON COLUMN consult."咨询量明细表_v2"."咨询次数" IS '咨询次数';
        
        RAISE NOTICE '✅ 成功添加字段: 咨询次数';
    ELSE
        RAISE NOTICE '⊙ 字段 咨询次数 已存在，无需添加';
    END IF;
    
END $$;

-- ============================================================================
-- 验证字段是否添加成功
-- ============================================================================

SELECT 
    column_name AS "字段名",
    data_type AS "数据类型",
    CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END AS "是否可空"
FROM information_schema.columns 
WHERE table_schema = 'consult' 
  AND table_name = '咨询量明细表_v2'
  AND column_name IN ('渠道代理', '网聊专员', '咨询次数')
ORDER BY column_name;

