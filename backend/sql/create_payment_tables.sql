-- 创建缴费记录表和缴费汇总表

-- 创建缴费记录表
CREATE TABLE IF NOT EXISTS consult."缴费记录表" (
    "缴费ID" SERIAL PRIMARY KEY,
    "记录ID" INTEGER NOT NULL,
    "对象ID" INTEGER NOT NULL,
    "缴费类型" VARCHAR(20) NOT NULL,
    "缴费金额" NUMERIC(12, 2) NOT NULL,
    "缴费时间" TIMESTAMP NOT NULL,
    "缴费方式" VARCHAR(50),
    "收款人" VARCHAR(100),
    "备注" TEXT,
    "凭证号" VARCHAR(100),
    "创建时间" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "创建人" VARCHAR(100),
    "更新时间" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "更新人" VARCHAR(100)
);

-- 缴费记录表索引
CREATE INDEX IF NOT EXISTS "idx_缴费记录_记录ID" ON consult."缴费记录表"("记录ID");
CREATE INDEX IF NOT EXISTS "idx_缴费记录_对象ID" ON consult."缴费记录表"("对象ID");
CREATE INDEX IF NOT EXISTS "idx_缴费记录_缴费类型" ON consult."缴费记录表"("缴费类型");
CREATE INDEX IF NOT EXISTS "idx_缴费记录_缴费时间" ON consult."缴费记录表"("缴费时间");

-- 创建缴费汇总表
CREATE TABLE IF NOT EXISTS consult."缴费汇总表" (
    "汇总ID" SERIAL PRIMARY KEY,
    "记录ID" INTEGER NOT NULL UNIQUE,
    "对象ID" INTEGER NOT NULL,
    "应交金额" NUMERIC(12, 2) DEFAULT 0,
    "首款金额" NUMERIC(12, 2) DEFAULT 0,
    "已交金额" NUMERIC(12, 2) DEFAULT 0,
    "欠费金额" NUMERIC(12, 2) DEFAULT 0,
    "缴费状态" VARCHAR(20) DEFAULT '未缴费',
    "后续交费次数" INTEGER DEFAULT 0,
    "创建时间" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "创建人" VARCHAR(100),
    "更新时间" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "更新人" VARCHAR(100)
);

-- 缴费汇总表索引
CREATE INDEX IF NOT EXISTS "idx_缴费汇总_对象ID" ON consult."缴费汇总表"("对象ID");
CREATE INDEX IF NOT EXISTS "idx_缴费汇总_缴费状态" ON consult."缴费汇总表"("缴费状态");
