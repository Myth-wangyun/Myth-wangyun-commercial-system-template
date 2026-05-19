-- 免费推广明细登记表迁移脚本
-- 创建5个明细登记表

-- 1. 社交新媒体明细登记表
CREATE TABLE IF NOT EXISTS "市场部免费推广社交新媒体明细登记表" (
    id SERIAL PRIMARY KEY,
    校区 VARCHAR(50) NOT NULL,
    月份 VARCHAR(10) NOT NULL,
    序号 INTEGER NOT NULL,
    日期 DATE,
    发布平台 VARCHAR(50),
    重点人群 VARCHAR(100),
    主题题目 VARCHAR(500),
    剪辑短视频名称 VARCHAR(200),
    秒 INTEGER DEFAULT 0,
    备注链接 TEXT,
    有效数 INTEGER DEFAULT 0,
    备注 TEXT
);
CREATE INDEX IF NOT EXISTS idx_social_detail_campus_month 
    ON "市场部免费推广社交新媒体明细登记表" (校区, 月份);

-- 2. 问答明细登记表
CREATE TABLE IF NOT EXISTS "市场部免费推广问答明细登记表" (
    id SERIAL PRIMARY KEY,
    校区 VARCHAR(50) NOT NULL,
    月份 VARCHAR(10) NOT NULL,
    序号 INTEGER NOT NULL,
    日期 DATE,
    发布平台 VARCHAR(50),
    重点人群 VARCHAR(100),
    主题提问语 VARCHAR(500),
    问答链接 TEXT,
    有效数 INTEGER DEFAULT 0,
    备注 TEXT
);
CREATE INDEX IF NOT EXISTS idx_qa_detail_campus_month 
    ON "市场部免费推广问答明细登记表" (校区, 月份);

-- 3. 分类信息明细登记表
CREATE TABLE IF NOT EXISTS "市场部免费推广分类信息明细登记表" (
    id SERIAL PRIMARY KEY,
    校区 VARCHAR(50) NOT NULL,
    月份 VARCHAR(10) NOT NULL,
    序号 INTEGER NOT NULL,
    日期 DATE,
    发布平台 VARCHAR(50),
    重点人群 VARCHAR(100),
    主题标题 VARCHAR(500),
    分类信息链接 TEXT,
    有效数 INTEGER DEFAULT 0,
    备注 TEXT
);
CREATE INDEX IF NOT EXISTS idx_classified_detail_campus_month 
    ON "市场部免费推广分类信息明细登记表" (校区, 月份);

-- 4. 微信平台明细登记表
CREATE TABLE IF NOT EXISTS "市场部免费推广微信平台明细登记表" (
    id SERIAL PRIMARY KEY,
    校区 VARCHAR(50) NOT NULL,
    月份 VARCHAR(10) NOT NULL,
    序号 INTEGER NOT NULL,
    日期 DATE,
    发布平台 VARCHAR(50),
    重点人群 VARCHAR(100),
    主题题目 VARCHAR(500),
    剪辑短视频小程序名称 VARCHAR(200),
    秒 INTEGER DEFAULT 0,
    发布链接 TEXT,
    有效数 INTEGER DEFAULT 0,
    备注 TEXT
);
CREATE INDEX IF NOT EXISTS idx_wechat_detail_campus_month 
    ON "市场部免费推广微信平台明细登记表" (校区, 月份);

-- 5. 视频明细登记表
CREATE TABLE IF NOT EXISTS "市场部免费推广视频明细登记表" (
    id SERIAL PRIMARY KEY,
    校区 VARCHAR(50) NOT NULL,
    月份 VARCHAR(10) NOT NULL,
    序号 INTEGER NOT NULL,
    日期 DATE,
    发布平台 VARCHAR(50),
    重点人群 VARCHAR(100),
    视频主题标题 VARCHAR(500),
    剪辑短长视频名称 VARCHAR(200),
    秒 INTEGER DEFAULT 0,
    备注链接 TEXT,
    有效数 INTEGER DEFAULT 0,
    备注 TEXT
);
CREATE INDEX IF NOT EXISTS idx_video_detail_campus_month 
    ON "市场部免费推广视频明细登记表" (校区, 月份);

-- 完成
SELECT '免费推广明细登记表创建完成' AS message;
