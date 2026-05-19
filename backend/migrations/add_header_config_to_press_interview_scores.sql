-- 为 academic.press_interview_scores 表添加 header_config 字段
-- 如果字段已存在，则不会出错（PostgreSQL 10+ 支持 IF NOT EXISTS）

-- 检查并添加 header_config 字段
DO $$
BEGIN
    -- 检查字段是否已存在
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'academic' 
        AND table_name = 'press_interview_scores' 
        AND column_name = 'header_config'
    ) THEN
        -- 字段不存在，添加字段
        ALTER TABLE academic.press_interview_scores 
        ADD COLUMN header_config JSONB DEFAULT '{}'::jsonb;
        
        -- 添加注释
        COMMENT ON COLUMN academic.press_interview_scores.header_config IS '表头配置JSON，格式：{project_number: {instructor1: "张建新评分", instructor2: "教员2评分", ...}}';
        
        RAISE NOTICE '已成功添加 header_config 字段到 academic.press_interview_scores 表';
    ELSE
        RAISE NOTICE 'header_config 字段已存在，无需添加';
    END IF;
END $$;
