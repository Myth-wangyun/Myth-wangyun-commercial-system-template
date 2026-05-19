# 口碑费用投入保存功能 - 完整实施指南

## 问题描述

口碑页面咨询师月度表的费用投入可以编辑，但点击"保存计划数据"按钮时，费用投入没有被保存到数据库。

## 根本原因

数据库表 `consult.咨询师月度计划数据` 中缺少 `费用投入` 字段，导致无法保存费用投入数据。

## 解决方案

### 步骤1: 数据库迁移

执行以下SQL脚本添加 `费用投入` 字段：

```sql
-- 在 consult.咨询师月度计划数据 表中添加 费用投入 字段
ALTER TABLE consult.咨询师月度计划数据 
ADD COLUMN 费用投入 NUMERIC(15, 2) DEFAULT 0 
COMMENT '费用投入/市场投入（元）';

-- 更新已有数据的默认值
UPDATE consult.咨询师月度计划数据 
SET 费用投入 = 0 
WHERE 费用投入 IS NULL;
```

**迁移脚本位置**: `migrations/20260204_add_expense_to_consultant_plan.sql`

### 步骤2: 后端模型修改

#### 2.1 修改数据库模型

**文件**: `backend/app/models/consult/consultant_monthly_plan.py`

```python
# 计划数据
计划收入 = Column(Numeric(15, 2), default=0, comment="计划收入（元）")
计划招生 = Column(Integer, default=0, comment="计划招生人数")
费用投入 = Column(Numeric(15, 2), default=0, comment="费用投入/市场投入（元）")  # 新增
```

#### 2.2 修改 Pydantic Schema

**文件**: `backend/app/schemas/consult/consultant_monthly_plan.py`

在 `ConsultantMonthlyPlanBase` 中添加：
```python
费用投入: float = Field(default=0, description="费用投入/市场投入（元）", ge=0)
```

在 `ConsultantMonthlyPlanUpdate` 中添加：
```python
费用投入: Optional[float] = Field(None, description="费用投入/市场投入（元）", ge=0)
```

### 步骤3: 前端修改

#### 3.1 修改 TypeScript 接口

**文件**: `frontend/services/consult/consultantPlan.ts`

```typescript
export interface ConsultantMonthlyPlan {
  记录ID?: number
  年份: number
  月份: number
  校区: string
  咨询师: string
  数据类型: string
  计划收入: number | null
  计划招生: number | null
  费用投入?: number | null  // 新增
  创建时间?: string
  更新时间?: string
}
```

#### 3.2 修改组件状态管理

**文件**: `frontend/pages/consult/002-campus-yearly-monthly-media-source/002-media-source-yearly/components/GenericSourceDashboard.tsx`

**修改1: 更新 pendingPlanChanges 类型**
```typescript
const [pendingPlanChanges, setPendingPlanChanges] = useState<Map<string, { 
  计划收入?: number
  计划招生?: number
  费用投入?: number  // 新增
}>>(new Map())
```

**修改2: 更新费用投入时跟踪变更**
```typescript
const handleUpdateConsultantMonthlyData = useCallback((
  key: string,
  field: '市场投入',
  value: number | null
) => {
  setConsultantMonthlyRows(prev => {
    const next = [...prev]
    const row = next.find(r => r.key === key)
    
    if (row && !row.isTotal) {
      row[field] = value
      
      // 重新计算招生成本
      if (row.实际招生 && row.实际招生 > 0 && row.市场投入 !== null) {
        row.招生成本 = row.市场投入 / row.实际招生
      } else {
        row.招生成本 = null
      }
      
      calculateRates(row)
      
      // 🔥 关键：跟踪费用投入的变更
      if (typeof row.月份 === 'number' && row.咨询师) {
        const changeKey = `${row.月份}_${row.咨询师}`
        setPendingPlanChanges(prev => {
          const newMap = new Map(prev)
          const existing = newMap.get(changeKey) || {}
          newMap.set(changeKey, { ...existing, 费用投入: value || 0 })
          return newMap
        })
      }
    }
    
    return recomputeConsultantMonthlyTotals(next)
  })
}, [])
```

**修改3: 保存时包含费用投入**
```typescript
dataList.push({
  年份: parseInt(year),
  月份: month,
  校区: currentCampus,
  咨询师: consultant,
  数据类型: categoryName,
  计划收入: changes.计划收入 ?? existingRow?.计划收入 ?? 0,
  计划招生: changes.计划招生 ?? existingRow?.计划招生 ?? 0,
  费用投入: changes.费用投入 ?? existingRow?.市场投入 ?? 0,  // 🔥 保存费用投入
})
```

**修改4: 加载数据时读取费用投入**
```typescript
return {
  // ... 其他字段
  市场投入: plan?.费用投入 ?? null,  // 🔥 从计划数据中读取费用投入
  招生成本: null,
}
```

## 实施清单

### ✅ 必须按顺序执行

- [ ] **步骤1**: 执行数据库迁移脚本
  ```bash
  # 连接到数据库
  psql -U postgres -d qm_system
  
  # 执行迁移
  \i migrations/20260204_add_expense_to_consultant_plan.sql
  
  # 验证字段已添加
  \d consult.咨询师月度计划数据
  ```

- [ ] **步骤2**: 重启后端服务
  ```bash
  # 停止后端
  # Ctrl+C 或关闭终端
  
  # 重新启动后端
  python backend/main.py --mode dev
  ```

- [ ] **步骤3**: 重启前端服务（如果需要）
  ```bash
  # 前端通常会自动热重载
  # 如果没有，手动重启
  npm run dev
  ```

- [ ] **步骤4**: 测试功能
  1. 刷新浏览器页面
  2. 打开"口碑"标签
  3. 编辑费用投入
  4. 点击"保存计划数据"按钮
  5. 刷新页面验证数据已保存

## 测试验证

### 测试用例1: 新建费用投入

1. 选择一个之前没有数据的咨询师和月份
2. 输入费用投入：5000
3. 点击"保存计划数据"
4. 刷新页面
5. ✅ 验证：费用投入仍然显示 5000

### 测试用例2: 修改已有费用投入

1. 选择一个已有费用投入的咨询师和月份
2. 修改费用投入：从 5000 改为 8000
3. 点击"保存计划数据"
4. 刷新页面
5. ✅ 验证：费用投入显示 8000

### 测试用例3: 同时编辑多个字段

1. 编辑某咨询师某月的：
   - 计划收入：100000
   - 计划招生：50
   - 费用投入：6000
2. 点击"保存计划数据"
3. 刷新页面
4. ✅ 验证：三个字段都正确保存

### 测试用例4: 自动计算验证

1. 编辑某咨询师某月：
   - 费用投入：6000
   - 假设实际招生：10
2. ✅ 验证：招生成本自动显示 600.00
3. 保存并刷新
4. ✅ 验证：招生成本仍然正确计算

## 数据流程图

```
用户编辑费用投入
    ↓
handleUpdateConsultantMonthlyData 被调用
    ↓
更新 consultantMonthlyRows state
    ↓
添加到 pendingPlanChanges (跟踪变更)
    ↓
用户点击"保存计划数据"
    ↓
savePlanData 被调用
    ↓
构建 dataList (包含 费用投入)
    ↓
调用 consultantPlanService.batchSaveConsultantPlans
    ↓
发送 POST /api/v1/consult/consultant-plan/batch
    ↓
后端保存到数据库
    ↓
刷新页面
    ↓
loadData 被调用
    ↓
从 consultantPlanMap 读取 费用投入
    ↓
显示在界面上
```

## 已修改的文件清单

### 数据库
- ✅ `migrations/20260204_add_expense_to_consultant_plan.sql` (新建)

### 后端
- ✅ `backend/app/models/consult/consultant_monthly_plan.py`
- ✅ `backend/app/schemas/consult/consultant_monthly_plan.py`

### 前端
- ✅ `frontend/services/consult/consultantPlan.ts`
- ✅ `frontend/pages/consult/002-campus-yearly-monthly-media-source/002-media-source-yearly/components/GenericSourceDashboard.tsx`

### 文档
- ✅ `EXPENSE_SAVE_IMPLEMENTATION_GUIDE.md` (本文档)

## 常见问题

### Q1: 保存后显示成功，但刷新后数据丢失？

**答**: 检查数据库迁移是否成功执行。运行：
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'consult' 
  AND table_name = '咨询师月度计划数据' 
  AND column_name = '费用投入';
```

### Q2: 保存时报错 "字段不存在"？

**答**: 重启后端服务以重新加载模型定义。

### Q3: 前端显示费用投入输入框，但无法输入？

**答**: 检查是否在口碑类型下（`categoryName === '口碑'`）。只有口碑类型才启用费用投入编辑。

### Q4: 保存按钮显示 "0项更改"？

**答**: 确保编辑后有调用 `setPendingPlanChanges`。检查 `handleUpdateConsultantMonthlyData` 函数。

## 回滚方案

如果需要回滚，执行：

```sql
-- 删除费用投入字段
ALTER TABLE consult.咨询师月度计划数据 
DROP COLUMN 费用投入;
```

然后恢复代码到之前的版本。

## 版本信息

- 实施日期: 2026-02-04
- 实施人: GitHub Copilot
- 功能: 口碑费用投入保存
- 状态: ✅ 完成（待测试）

## 后续优化建议

1. **添加批量导入**: 支持从 Excel 批量导入费用投入数据
2. **历史记录**: 记录费用投入的修改历史
3. **数据验证**: 添加费用投入的合理范围验证
4. **数据分析**: 添加费用投入的统计图表
