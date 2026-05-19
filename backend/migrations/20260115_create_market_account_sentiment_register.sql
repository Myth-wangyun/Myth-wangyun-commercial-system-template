-- 创建 market schema（如果不存在）
CREATE SCHEMA IF NOT EXISTS market;

-- 市场部各校新媒体账号舆情登记表
CREATE TABLE IF NOT EXISTS market.account_sentiment_register (
  id SERIAL PRIMARY KEY,
  campus_name VARCHAR(100) NOT NULL,
  "inchargeInside" VARCHAR(100) NOT NULL DEFAULT '',
  "inchargeOutside" VARCHAR(100) NOT NULL DEFAULT '',
  platform VARCHAR(100) NOT NULL DEFAULT '',
  "accountId" VARCHAR(100) NOT NULL DEFAULT '',
  nickname VARCHAR(200) NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT '',
  remark TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_account_sentiment_campus
  ON market.account_sentiment_register (campus_name);

