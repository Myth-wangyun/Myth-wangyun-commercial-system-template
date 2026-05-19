-- 清理教质经理/副经理功能分析表中的混乱数据
-- 执行方式：在 pgAdmin 或其他 PostgreSQL 客户端中直接运行此脚本

-- 开始事务
BEGIN;

-- 1. 查看当前数据状态（执行前）
SELECT '=== 清理前的数据状态 ===' as 状态;

SELECT '经理表' as 表名, "姓名", COUNT(*) as 记录数
FROM teaching_quality."教质经理功能分析月表"
GROUP BY "姓名"
ORDER BY "姓名";

SELECT '副经理表' as 表名, "姓名", COUNT(*) as 记录数
FROM teaching_quality."教质副经理功能分析月表"
GROUP BY "姓名"
ORDER BY "姓名";

-- 2. 删除经理表中的占位符记录
DELETE FROM teaching_quality."教质经理功能分析月表"
WHERE "姓名" IN ('经理', '副经理');

-- 3. 查询用户表，找出所有教质副经理
SELECT '=== 用户表中的教质副经理 ===' as 状态;
SELECT "real_name", "position", "campus"
FROM public.users
WHERE "position" = '教质副经理' AND "real_name" IS NOT NULL;

-- 4. 将副经理"姜楠"的数据从经理表移动到副经理表
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

-- 5. 从经理表中删除姜楠的数据
DELETE FROM teaching_quality."教质经理功能分析月表"
WHERE "姓名" = '姜楠';

-- 6. 查看清理后的数据状态
SELECT '=== 清理后的数据状态 ===' as 状态;

SELECT '经理表' as 表名, "姓名", COUNT(*) as 记录数
FROM teaching_quality."教质经理功能分析月表"
GROUP BY "姓名"
ORDER BY "姓名";

SELECT '副经理表' as 表名, "姓名", COUNT(*) as 记录数
FROM teaching_quality."教质副经理功能分析月表"
GROUP BY "姓名"
ORDER BY "姓名";

-- 7. 验证结果（应该只有郭彩兰在经理表，姜楠在副经理表）
SELECT '=== 验证结果 ===' as 状态;

SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM teaching_quality."教质经理功能分析月表" WHERE "姓名" = '姜楠')
        THEN '✗ 错误：姜楠仍在经理表中'
        ELSE '✓ 正确：姜楠已从经理表移除'
    END as 检查1;

SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM teaching_quality."教质副经理功能分析月表" WHERE "姓名" = '姜楠')
        THEN '✓ 正确：姜楠在副经理表中'
        ELSE '✗ 错误：姜楠不在副经理表中'
    END as 检查2;

SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM teaching_quality."教质经理功能分析月表" WHERE "姓名" = '郭彩兰')
        THEN '✓ 正确：郭彩兰在经理表中'
        ELSE '✗ 错误：郭彩兰不在经理表中'
    END as 检查3;

-- 提交事务（如果一切正常）
COMMIT;

-- 如果需要回滚，执行：
-- ROLLBACK;
