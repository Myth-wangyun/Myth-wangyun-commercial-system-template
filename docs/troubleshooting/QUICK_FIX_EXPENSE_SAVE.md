# 口碑费用投入保存功能 - 快速实施步骤

## ⚠️ 重要：必须按顺序执行

### 步骤1: 执行数据库迁移 (最关键！)

打开数据库客户端或使用 psql：

```bash
# 方式1: 使用 psql 命令行
psql -U postgres -d qm_system -f migrations/20260204_add_expense_to_consultant_plan.sql

# 方式2: 或者手动执行SQL
```

手动执行的 SQL：
```sql
ALTER TABLE consult.咨询师月度计划数据 
ADD COLUMN 费用投入 NUMERIC(15, 2) DEFAULT 0;

UPDATE consult.咨询师月度计划数据 
SET 费用投入 = 0 
WHERE 费用投入 IS NULL;
```

**验证**：
```sql
-- 检查字段是否添加成功
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'consult' 
  AND table_name = '咨询师月度计划数据';
```

应该能看到 `费用投入` 字段。

### 步骤2: 重启后端服务

在运行后端的终端中：

```powershell
# 按 Ctrl+C 停止后端

# 重新启动
python backend/main.py --mode dev
```

**验证**：后端启动时应该没有错误，模型加载成功。

### 步骤3: 刷新前端

在浏览器中按 `Ctrl+Shift+R` 强制刷新页面（清除缓存）。

### 步骤4: 测试

1. 打开口碑页面
2. 编辑一个费用投入（比如输入 5000）
3. 点击"保存计划数据"按钮
4. 应该显示"计划数据保存成功"
5. 刷新页面（F5）
6. ✅ 验证：费用投入仍然显示 5000

## 如果遇到问题

### 问题1: 保存时报错 "unknown column 费用投入"

**原因**: 数据库迁移没有执行
**解决**: 返回步骤1，确保SQL执行成功

### 问题2: 保存成功，但刷新后数据丢失

**原因**: 后端没有重启，模型定义没有更新
**解决**: 返回步骤2，重启后端

### 问题3: 前端报类型错误

**原因**: TypeScript缓存问题
**解决**: 
```bash
# 清除 node_modules/.vite 缓存
rm -rf node_modules/.vite

# 重启前端
npm run dev
```

## 验证成功的标志

✅ 数据库有 `费用投入` 字段
✅ 后端启动无错误
✅ 前端可以编辑费用投入
✅ 保存后显示成功消息
✅ 刷新页面数据仍然存在

## 已修改的文件

✅ `backend/app/models/consult/consultant_monthly_plan.py`
✅ `backend/app/schemas/consult/consultant_monthly_plan.py`
✅ `frontend/services/consult/consultantPlan.ts`
✅ `frontend/pages/consult/.../GenericSourceDashboard.tsx`
✅ `migrations/20260204_add_expense_to_consultant_plan.sql`

---

**完成后记得提交代码到 Git！**
