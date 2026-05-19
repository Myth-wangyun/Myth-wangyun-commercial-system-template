-- 数据库迁移脚本：添加咨询量明细表缺失的所有字段
-- 执行方式：在 PostgreSQL 中执行此 SQL 文件

-- 1. 口碑提供人
ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "口碑提供人" VARCHAR(50);
COMMENT ON COLUMN consult."咨询量明细表_v2"."口碑提供人" IS '口碑提供人（量来源为口碑时填写）';

-- 2. 标记字段
ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "是否无效量" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."是否无效量" IS '是否无效量：0-否，1-是';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "无效原因" VARCHAR(100);
COMMENT ON COLUMN consult."咨询量明细表_v2"."无效原因" IS '无效原因';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "是否不算量" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."是否不算量" IS '是否不算量：0-否，1-是';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "不算量原因" VARCHAR(100);
COMMENT ON COLUMN consult."咨询量明细表_v2"."不算量原因" IS '不算量原因';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "是否上门" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."是否上门" IS '是否上门：0-否，1-是';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "上门时间" TIMESTAMP;
COMMENT ON COLUMN consult."咨询量明细表_v2"."上门时间" IS '上门时间';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "是否报名" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."是否报名" IS '是否报名：0-否，1-是';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "报名时间" TIMESTAMP;
COMMENT ON COLUMN consult."咨询量明细表_v2"."报名时间" IS '报名时间';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "是否订座" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."是否订座" IS '是否订座：0-否，1-是';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "是否校园量" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."是否校园量" IS '是否校园量：0-否，1-是';

-- 3. 网络专员/渠道专员
ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "网络专员" VARCHAR(50);
COMMENT ON COLUMN consult."咨询量明细表_v2"."网络专员" IS '网络专员';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "渠道专员" VARCHAR(50);
COMMENT ON COLUMN consult."咨询量明细表_v2"."渠道专员" IS '渠道专员';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "留量时间" VARCHAR(50);
COMMENT ON COLUMN consult."咨询量明细表_v2"."留量时间" IS '留量时间';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "咨询结果" TEXT;
COMMENT ON COLUMN consult."咨询量明细表_v2"."咨询结果" IS '咨询结果';

-- 4. 上门情况统计相关
ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "代咨" VARCHAR(50);
COMMENT ON COLUMN consult."咨询量明细表_v2"."代咨" IS '代咨';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "网转上门" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."网转上门" IS '网转上门';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "网络新媒体" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."网络新媒体" IS '网络新媒体';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "口碑上门" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."口碑上门" IS '口碑上门';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "渠道上门" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."渠道上门" IS '渠道上门';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "校园新渠道" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."校园新渠道" IS '校园新渠道';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "新媒体来源" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."新媒体来源" IS '新媒体来源';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "就读学校" VARCHAR(100);
COMMENT ON COLUMN consult."咨询量明细表_v2"."就读学校" IS '就读学校';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "目前状态" VARCHAR(50);
COMMENT ON COLUMN consult."咨询量明细表_v2"."目前状态" IS '目前状态';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "地区" VARCHAR(50);
COMMENT ON COLUMN consult."咨询量明细表_v2"."地区" IS '地区';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "县" VARCHAR(50);
COMMENT ON COLUMN consult."咨询量明细表_v2"."县" IS '县';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "报名专业" VARCHAR(100);
COMMENT ON COLUMN consult."咨询量明细表_v2"."报名专业" IS '报名专业';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "咨询时间" VARCHAR(50);
COMMENT ON COLUMN consult."咨询量明细表_v2"."咨询时间" IS '咨询时间';

-- 5. 已交学费
ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "已交学费" VARCHAR(50);
COMMENT ON COLUMN consult."咨询量明细表_v2"."已交学费" IS '已交学费金额';

-- 6. 报名相关新字段
ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "长期短期" VARCHAR(20);
COMMENT ON COLUMN consult."咨询量明细表_v2"."长期短期" IS '长期/短期';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "课程" VARCHAR(100);
COMMENT ON COLUMN consult."咨询量明细表_v2"."课程" IS '课程';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "全款" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."全款" IS '全款金额';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "分期" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."分期" IS '分期金额';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "注册" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."注册" IS '注册金额';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "贷款" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."贷款" IS '贷款金额';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "详细地址" VARCHAR(200);
COMMENT ON COLUMN consult."咨询量明细表_v2"."详细地址" IS '详细地址';

-- 7. 订座相关新字段
ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "订座时间" TIMESTAMP;
COMMENT ON COLUMN consult."咨询量明细表_v2"."订座时间" IS '订座时间';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "订座金额" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."订座金额" IS '订座金额';

-- 8. 缴费金额
ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "缴费金额" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."缴费金额" IS '缴费金额';

-- 9. 退费相关新字段
ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "是否退费" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."是否退费" IS '是否退费：0-否，1-是（需先勾选报名或订座）';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "退费原因" VARCHAR(200);
COMMENT ON COLUMN consult."咨询量明细表_v2"."退费原因" IS '退费原因';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "退费金额" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."退费金额" IS '退费金额';

-- 10. 交接相关字段
ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "是否已交接" INTEGER DEFAULT 0;
COMMENT ON COLUMN consult."咨询量明细表_v2"."是否已交接" IS '是否已交接给教质：0-否，1-是';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "交接时间" TIMESTAMP;
COMMENT ON COLUMN consult."咨询量明细表_v2"."交接时间" IS '交接时间';

ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "交接人" VARCHAR(50);
COMMENT ON COLUMN consult."咨询量明细表_v2"."交接人" IS '交接人';

-- 11. 录量人
ALTER TABLE consult."咨询量明细表_v2" 
ADD COLUMN IF NOT EXISTS "录量人" VARCHAR(50);
COMMENT ON COLUMN consult."咨询量明细表_v2"."录量人" IS '录量人（当前登录用户的real_name）';

-- 完成提示
SELECT '✅ 所有缺失字段添加完成！' AS status;



















