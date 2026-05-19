-- 清理教质经理/副经理功能分析表中的混乱数据
-- 可以使用 pgAdmin 或其他 PostgreSQL 客户端执行此脚本

BEGIN;

-- 1. 删除经理表中的占位符记录
DELETE FROM teaching_quality."教质经理功能分析月表"
WHERE "姓名" IN ('经理', '副经理');

-- 2. 将副经理"姜楠"的数据从经理表移动到副经理表
INSERT INTO teaching_quality."教质副经理功能分析月表"
("校区名称", "年份", "月份", "姓名", "价值观", "责任感", "执行力",
 "计划", "组织", "领导", "控制", "学员就业", "口碑招生", "学员流失",
 "升学", "教务管理能力", "宿舍管理能力", "合计分数", "备注")
SELECT "校区名称", "年份", "月份", "姓名", "价值观", "责任感", "执行力",
       "计划", "组织", "领导", "控制", "学员就业", "口碑招生", "学员流失",
       "升学", "教务管理能力", "宿舍管理能力", "合计分数", "备注"
FROM teaching_quality."教质经理功能分析月表"
WHERE "姓名" = '姜楠'
ON CONFLICT ("校区名称", "年份", "月份", "姓名") DO UPDATE SET
    "价值观" = EXCLUDED."价值观",
    "责任感" = EXCLUDED."责任感",
    "执行力" = EXCLUDED."执行力",
    "计划" = EXCLUDED."计划",
    "组织" = EXCLUDED."组织",
    "领导" = EXCLUDED."领导",
    "控制" = EXCLUDED."控制",
    "学员就业" = EXCLUDED."学员就业",
    "口碑招生" = EXCLUDED."口碑招生",
    "学员流失" = EXCLUDED."学员流失",
    "升学" = EXCLUDED."升学",
    "教务管理能力" = EXCLUDED."教务管理能力",
    "宿舍管理能力" = EXCLUDED."宿舍管理能力",
    "合计分数" = EXCLUDED."合计分数",
    "备注" = EXCLUDED."备注",
    "更新时间" = CURRENT_TIMESTAMP;

-- 3. 从经理表中删除姜楠的数据
DELETE FROM teaching_quality."教质经理功能分析月表"
WHERE "姓名" = '姜楠';

-- 4. 验证清理结果
SELECT '经理表' as 表名, COUNT(*) as 记录数,
       STRING_AGG(DISTINCT "姓名", ', ') as 姓名列表
FROM teaching_quality."教质经理功能分析月表"
GROUP BY 1
UNION ALL
SELECT '副经理表', COUNT(*),
       STRING_AGG(DISTINCT "姓名", ', ')
FROM teaching_quality."教质副经理功能分析月表"
GROUP BY 1;

COMMIT;
