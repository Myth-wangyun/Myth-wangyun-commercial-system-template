"""
添加费用投入字段到咨询师月度计划数据表

迁移时间: 2026-02-04
说明: 为口碑等渠道的费用投入数据添加存储字段
"""

-- 在 consult.咨询师月度计划数据 表中添加 费用投入 字段
ALTER TABLE consult.咨询师月度计划数据 
ADD COLUMN 费用投入 NUMERIC(15, 2) DEFAULT 0 
COMMENT '费用投入/市场投入（元）';

-- 更新已有数据的默认值
UPDATE consult.咨询师月度计划数据 
SET 费用投入 = 0 
WHERE 费用投入 IS NULL;
