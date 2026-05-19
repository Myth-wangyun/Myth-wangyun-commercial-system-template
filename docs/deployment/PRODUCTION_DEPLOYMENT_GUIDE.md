# 生产环境部署指南 - 06XX升学计划数据问题永久修复

## 问题描述
06XX校区教质部升学计划页面无法正常获取数据，显示应收为0或根本没有数据。

**根本原因**：历史数据中`校区升学计划汇总表.校区名称`字段为NULL，导致视图聚合时数据丢失。

## 解决方案
1. **代码修复**：API保存时自动从JSONB数据中提取校区名称
2. **数据修复**：修复历史数据中的NULL值
3. **约束保护**：添加NOT NULL约束防止未来再出现

---

## 生产环境部署步骤

### 前置准备

1. **备份数据库**（必须！）
```bash
# PostgreSQL备份
pg_dump -h <host> -U <user> -d <database> -n teaching_quality > teaching_quality_backup_$(date +%Y%m%d).sql

# 或完整备份
pg_dump -h <host> -U <user> -d <database> -Fc > qm_system_backup_$(date +%Y%m%d).dump
```

2. **确认环境**
```bash
# 检查Python环境
python --version  # 应该是3.10+

# 检查数据库连接
psql -h <host> -U <user> -d <database> -c "SELECT version();"
```

---

### 步骤1: 检查当前数据状态

```bash
cd backend
python scripts/maintenance/fix_null_campus_production.py --check
```

**预期输出**：
- 显示总记录数
- 显示有多少条记录校区名称为NULL
- 列出NULL记录的详细信息

---

### 步骤2: 部署新代码

1. **拉取最新代码**
```bash
git pull origin main
```

2. **确认以下文件已更新**：
   - `backend/app/teaching-quality/TQcampus_monthly_class_promotion_goals_results_api.py`
   - `backend/app/teaching-quality/TQcampus_promotion_plan_summary_db.py`
   - `frontend/pages/teaching-quality/campus/1-core-data/1-core-data-summary/1-core-data/006-promotion-plan/ClassPromotionDetail.tsx`

3. **重启后端服务**
```bash
sudo systemctl restart qm-backend

# 或Docker方式
docker-compose restart backend

# 或PM2方式
pm2 restart qm-backend
```

4. **执行修复**：`python scripts/maintenance/fix_null_campus_production.py --fix`
### 步骤3: 修复历史数据

```bash
# 先检查一次（确认）
python scripts/maintenance/fix_null_campus_production.py --check

# 执行修复
python scripts/maintenance/fix_null_campus_production.py --fix

# 验证结果
python scripts/maintenance/fix_null_campus_production.py --verify
```

**或者一键执行完整流程**：
```bash
python scripts/maintenance/fix_null_campus_production.py --all
```

---

### 步骤4: 添加NOT NULL约束（推荐）

**⚠️ 重要**：此步骤将永久禁止插入NULL值，执行前必须确保所有历史数据已修复。

```bash
python scripts/maintenance/fix_null_campus_production.py --add-constraint
```

或手动执行SQL：
```sql
ALTER TABLE teaching_quality."校区升学计划汇总表"
ALTER COLUMN "校区名称" SET NOT NULL;
```

---

### 步骤5: 验证修复效果

1. **数据库层面验证**
```sql
-- 检查是否还有NULL
SELECT COUNT(*) 
FROM teaching_quality."校区升学计划汇总表" 
WHERE "校区名称" IS NULL;
-- 应该返回 0

-- 检查视图数据
SELECT "校区名称", "年份", COUNT(*) as months
FROM teaching_quality."v_campus_promotion_plan_summary"
GROUP BY "校区名称", "年份"
ORDER BY "年份" DESC;
-- 应该能看到各校区的数据
```

2. **前端页面验证**
   - 访问：`/teaching-quality/campus/promotion-education`
   - 选择校区和年份
   - 06XX页面应该能正常显示应收等数据
   - 06-2XX和06-3XX页面应该能正常保存

---

## 回滚方案

如果出现问题，可以快速回滚：

```bash
# 1. 恢复数据库
psql -h <host> -U <user> -d <database> < teaching_quality_backup_YYYYMMDD.sql

# 2. 回滚代码
git checkout <previous-commit-hash>
sudo systemctl restart qm-backend

# 3. 清除浏览器缓存
# 用户端执行：Ctrl+F5 或 Ctrl+Shift+R
```

---

## 监控和维护

### 定期检查（每月一次）

```bash
# 检查是否有新的NULL数据出现
cd backend
python scripts/maintenance/fix_null_campus_production.py --check
```

### 如果发现新的NULL数据

1. **检查代码**：确认API保存逻辑是否正常工作
2. **检查数据来源**：是否有其他途径写入了数据
3. **执行修复**：`cd backend && python scripts/maintenance/fix_null_campus_production.py --fix`

---

## 问题排查

### 问题1：修复脚本报错"无法提取校区名称"

**原因**：JSONB字段为空或格式不正确

**解决**：
```sql
-- 查看这些记录的JSONB数据
SELECT "记录ID", "班级ID", "在档人数_校区数据", "应收_校区数据"
FROM teaching_quality."校区升学计划汇总表"
WHERE "校区名称" IS NULL;

-- 手动更新（根据班级ID推断校区）
UPDATE teaching_quality."校区升学计划汇总表"
SET "校区名称" = '清美校区'  -- 根据实际情况填写
WHERE "记录ID" = <id>;
```

### 问题2：添加NOT NULL约束失败

**原因**：仍有NULL数据未修复

**解决**：
```bash
# 重新检查
cd backend
python scripts/maintenance/fix_null_campus_production.py --check

# 如果有未修复的，手动处理后再添加约束
```

### 问题3：前端仍然显示数据为0

**原因**：浏览器缓存或后端未重启

**解决**：
1. 硬刷新浏览器：Ctrl+F5
2. 确认后端已重启：`systemctl status qm-backend`
3. 检查视图数据：运行上面的验证SQL

---

## 联系支持

如遇到问题，请提供：
1. 错误日志：`journalctl -u qm-backend -n 100`
2. 数据库状态：执行 `--check` 的输出
3. 操作步骤记录

---

## 时间估算

| 步骤 | 预计时间 |
|------|----------|
| 备份数据库 | 2-5分钟 |
| 检查数据 | 1分钟 |
| 部署代码 | 3-5分钟 |
| 修复数据 | 1-3分钟 |
| 添加约束 | 1分钟 |
| 验证测试 | 5分钟 |
| **总计** | **15-20分钟** |

---

## 成功标志

✅ `fix_null_campus_production.py --verify` 显示0条NULL记录  
✅ 视图查询返回各校区数据  
✅ 06XX前端页面正常显示应收等数据  
✅ 06-2XX和06-3XX页面能正常保存  
✅ NOT NULL约束已添加（可选）

---

**最后更新**: 2026-01-03  
**版本**: 1.0
