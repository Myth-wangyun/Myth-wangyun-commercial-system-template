-- 添加微信平台表缺失字段（PostgreSQL）
-- 执行前请确保已连接到正确的数据库

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'market'
          AND table_name = '市场部免费推广微信平台日度数据表'
    ) THEN
        RAISE NOTICE '表 market."市场部免费推广微信平台日度数据表" 不存在，跳过';
        RETURN;
    END IF;

    -- 1. 视频号数据诊断结果均值
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'market'
          AND table_name = '市场部免费推广微信平台日度数据表'
          AND column_name = '视频号数据诊断结果均值'
    ) THEN
        ALTER TABLE market."市场部免费推广微信平台日度数据表"
        ADD COLUMN "视频号数据诊断结果均值" NUMERIC(10,2);
        COMMENT ON COLUMN market."市场部免费推广微信平台日度数据表"."视频号数据诊断结果均值" IS '微信视频号数据诊断结果均值';
    END IF;

    -- 2. 视频号完播率
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'market'
          AND table_name = '市场部免费推广微信平台日度数据表'
          AND column_name = '视频号完播率'
    ) THEN
        ALTER TABLE market."市场部免费推广微信平台日度数据表"
        ADD COLUMN "视频号完播率" NUMERIC(10,2);
        COMMENT ON COLUMN market."市场部免费推广微信平台日度数据表"."视频号完播率" IS '微信视频号完播率';
    END IF;

    -- 3. 视频号平均播放时长
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'market'
          AND table_name = '市场部免费推广微信平台日度数据表'
          AND column_name = '视频号平均播放时长'
    ) THEN
        ALTER TABLE market."市场部免费推广微信平台日度数据表"
        ADD COLUMN "视频号平均播放时长" NUMERIC(10,2);
        COMMENT ON COLUMN market."市场部免费推广微信平台日度数据表"."视频号平均播放时长" IS '微信视频号平均播放时长(秒)';
    END IF;

    -- 4. 视频号3s以上播放率
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'market'
          AND table_name = '市场部免费推广微信平台日度数据表'
          AND column_name = '视频号3s以上播放率'
    ) THEN
        ALTER TABLE market."市场部免费推广微信平台日度数据表"
        ADD COLUMN "视频号3s以上播放率" NUMERIC(10,2);
        COMMENT ON COLUMN market."市场部免费推广微信平台日度数据表"."视频号3s以上播放率" IS '微信视频号3s以上播放率';
    END IF;

    -- 5. 公众号推荐数
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'market'
          AND table_name = '市场部免费推广微信平台日度数据表'
          AND column_name = '公众号推荐数'
    ) THEN
        ALTER TABLE market."市场部免费推广微信平台日度数据表"
        ADD COLUMN "公众号推荐数" INTEGER DEFAULT 0;
        COMMENT ON COLUMN market."市场部免费推广微信平台日度数据表"."公众号推荐数" IS '公众号推荐人数';
    END IF;

    -- 6. 公众号留言数
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'market'
          AND table_name = '市场部免费推广微信平台日度数据表'
          AND column_name = '公众号留言数'
    ) THEN
        ALTER TABLE market."市场部免费推广微信平台日度数据表"
        ADD COLUMN "公众号留言数" INTEGER DEFAULT 0;
        COMMENT ON COLUMN market."市场部免费推广微信平台日度数据表"."公众号留言数" IS '公众号留言条数';
    END IF;
END $$;

-- 验证字段是否添加成功
SELECT
    column_name AS "字段名",
    data_type AS "数据类型",
    numeric_precision AS "数值精度",
    numeric_scale AS "小数位数"
FROM information_schema.columns
WHERE table_schema = 'market'
  AND table_name = '市场部免费推广微信平台日度数据表'
  AND column_name IN (
    '视频号数据诊断结果均值',
    '视频号完播率',
    '视频号平均播放时长',
    '视频号3s以上播放率',
    '公众号推荐数',
    '公众号留言数'
  )
ORDER BY ordinal_position;

