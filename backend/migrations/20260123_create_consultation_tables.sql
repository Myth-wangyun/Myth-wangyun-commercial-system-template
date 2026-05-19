-- 咨询量录入系统数据表创建脚本
-- 创建日期: 2026-01-23

-- 创建 consult schema (如果不存在)
CREATE SCHEMA IF NOT EXISTS consult;

-- 创建咨询量主表
CREATE TABLE IF NOT EXISTS consult."咨询量主表" (
    "对象ID" SERIAL PRIMARY KEY,
    "电话列表" JSONB NOT NULL,
    "咨询日期列表" JSONB DEFAULT '[]'::jsonb,
    "最新咨询者姓名" VARCHAR(50),
    "最新状态" VARCHAR(20),
    "咨询次数" INTEGER DEFAULT 1,
    "首次登记时间" TIMESTAMP NOT NULL,
    "首次分量人" VARCHAR(50),
    "首次咨询师" VARCHAR(50),
    "最后更新时间" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "校区" VARCHAR(50)
);

-- 创建咨询量明细表
CREATE TABLE IF NOT EXISTS consult."咨询量明细表_v2" (
    "记录ID" SERIAL PRIMARY KEY,
    "对象ID" INTEGER NOT NULL,
    "登记日期" TIMESTAMP NOT NULL,
    "登记时间" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "分量人" VARCHAR(50),
    "咨询师" VARCHAR(50),
    "咨询者姓名" VARCHAR(50),
    "年龄" VARCHAR(20),
    "性别" VARCHAR(10),
    "电话" VARCHAR(20) NOT NULL,
    "QQ" VARCHAR(20),
    "微信" VARCHAR(50),
    "抖音" VARCHAR(50),
    "快手" VARCHAR(50),
    "学历" VARCHAR(20),
    "状态" VARCHAR(20),
    "位置" VARCHAR(100),
    "报名意向" VARCHAR(50),
    "咨询类别" VARCHAR(50),
    "量来源" VARCHAR(50),
    "媒体来源" VARCHAR(50),
    "关键字" VARCHAR(50),
    "备注" TEXT,
    "校区" VARCHAR(50),
    "创建人ID" INTEGER,
    "创建人姓名" VARCHAR(50),
    "创建时间" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "更新时间" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引 - 咨询量主表
DO $$
BEGIN
    -- 若已有列为 json 类型，升级为 jsonb，避免 GIN 操作符表错误
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'consult'
          AND table_name = '咨询量主表'
          AND column_name = '电话列表'
          AND data_type = 'json'
    ) THEN
        ALTER TABLE consult."咨询量主表"
        ALTER COLUMN "电话列表" TYPE JSONB USING "电话列表"::jsonb;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_consultation_电话列表" ON consult."咨询量主表" USING GIN ("电话列表" jsonb_path_ops);
CREATE INDEX IF NOT EXISTS "idx_consultation_最新咨询者姓名" ON consult."咨询量主表"("最新咨询者姓名");
CREATE INDEX IF NOT EXISTS "idx_consultation_首次登记时间" ON consult."咨询量主表"("首次登记时间");
CREATE INDEX IF NOT EXISTS "idx_consultation_校区" ON consult."咨询量主表"("校区");

-- 创建索引 - 咨询量明细表
CREATE INDEX IF NOT EXISTS "idx_detail_对象ID" ON consult."咨询量明细表_v2"("对象ID");
CREATE INDEX IF NOT EXISTS "idx_detail_登记日期" ON consult."咨询量明细表_v2"("登记日期");
CREATE INDEX IF NOT EXISTS "idx_detail_电话" ON consult."咨询量明细表_v2"("电话");
CREATE INDEX IF NOT EXISTS "idx_detail_咨询者姓名" ON consult."咨询量明细表_v2"("咨询者姓名");
CREATE INDEX IF NOT EXISTS "idx_detail_分量人" ON consult."咨询量明细表_v2"("分量人");
CREATE INDEX IF NOT EXISTS "idx_detail_咨询师" ON consult."咨询量明细表_v2"("咨询师");
CREATE INDEX IF NOT EXISTS "idx_detail_校区" ON consult."咨询量明细表_v2"("校区");
CREATE INDEX IF NOT EXISTS "idx_detail_状态" ON consult."咨询量明细表_v2"("状态");
CREATE INDEX IF NOT EXISTS "idx_detail_量来源" ON consult."咨询量明细表_v2"("量来源");
CREATE INDEX IF NOT EXISTS "idx_detail_媒体来源" ON consult."咨询量明细表_v2"("媒体来源");

-- 添加注释
COMMENT ON TABLE consult."咨询量主表" IS '咨询量主表 - 以对象ID唯一标识一个咨询者';
COMMENT ON TABLE consult."咨询量明细表_v2" IS '咨询量明细表 - 记录每次咨询的详细信息';

COMMENT ON COLUMN consult."咨询量主表"."对象ID" IS '对象ID，唯一标识一个咨询者';
COMMENT ON COLUMN consult."咨询量主表"."电话列表" IS '电话号码列表，支持多个电话';
COMMENT ON COLUMN consult."咨询量主表"."咨询日期列表" IS '咨询日期列表，按咨询顺序存储';
COMMENT ON COLUMN consult."咨询量主表"."咨询次数" IS '咨询次数';

COMMENT ON COLUMN consult."咨询量明细表_v2"."记录ID" IS '记录ID';
COMMENT ON COLUMN consult."咨询量明细表_v2"."对象ID" IS '关联的对象ID';
COMMENT ON COLUMN consult."咨询量明细表_v2"."登记日期" IS '登记日期，精确到年月日时分秒';
COMMENT ON COLUMN consult."咨询量明细表_v2"."电话" IS '电话（必填）';

-- 完成提示
SELECT '✅ 咨询量录入系统数据表创建完成!' AS status;
