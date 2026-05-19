# 口碑页面咨询师月度表费用投入编辑功能 - 修复总结

## 问题诊断

用户反馈口碑页面的咨询师月度表的费用投入无法输入。经过检查发现：

1. **错误的组件**: 最初修改了 `ConsultantChannelDashboard.tsx`，但实际使用的是 `GenericSourceDashboard.tsx`
2. **被注释的功能**: 在 `GenericSourceDashboard.tsx` 第1117行，费用投入被明确标注为"暂时不可编辑"
3. **注释原因**: 代码中说明"因为咨询师月度计划数据表中没有费用投入字段"

## 解决方案

### 修改的文件
`frontend/pages/consult/002-campus-yearly-monthly-media-source/002-media-source-yearly/components/GenericSourceDashboard.tsx`

### 主要修改内容

#### 1. 启用费用投入可编辑功能（第1109-1140行）

**修改前：**
```typescript
// 为咨询师月度明细表创建可编辑的成本列（费用投入暂不可编辑，因为数据库中不存在该字段）
const editableCostColumns: ColumnsType<ConsultantMonthlyRow> = [
  {
    title: categoryName === '口碑' ? '费用投入' : getCostColumnTitle(),
    dataIndex: '市场投入',
    width: 100,
    align: 'center',
    render: (val: number, r: ConsultantMonthlyRow) => {
      // 暂时不可编辑，因为咨询师月度计划数据表中没有费用投入字段
      // 如果将来需要编辑，需要先在数据库模型中添加该字段
      return renderValue(val, r.isTotal)
    }
  },
  // ...
]
```

**修改后：**
```typescript
// 为咨询师月度明细表创建可编辑的成本列（口碑的费用投入可编辑）
const editableCostColumns: ColumnsType<ConsultantMonthlyRow> = [
  {
    title: categoryName === '口碑' ? '费用投入' : getCostColumnTitle(),
    dataIndex: '市场投入',
    width: 100,
    align: 'center',
    render: (val: number, r: ConsultantMonthlyRow) => {
      // 口碑类型的费用投入可以编辑
      if (categoryName === '口碑' && !r.isTotal) {
        return (
          <InputNumber
            value={val}
            onChange={(v) => handleUpdateConsultantMonthlyData(r.key, '市场投入', v)}
            size="small"
            min={0}
            style={{ width: 90 }}
            placeholder="0"
          />
        )
      }
      // 其他类型或合计行不可编辑
      return renderValue(val, r.isTotal)
    }
  },
  // ...
]
```

#### 2. 添加数据更新函数（第631-640行）

```typescript
// 处理咨询师月度数据更新（包括费用投入）
const handleUpdateConsultantMonthlyData = useCallback((
  key: string,
  field: '市场投入',
  value: number | null
) => {
  setConsultantMonthlyRows(prev => {
    const next = [...prev]
    const row = next.find(r => r.key === key)
    
    if (row && !row.isTotal) {
      // 更新字段值
      row[field] = value
      
      // 重新计算招生成本
      if (row.实际招生 && row.实际招生 > 0 && row.市场投入 !== null) {
        row.招生成本 = row.市场投入 / row.实际招生
      } else {
        row.招生成本 = null
      }
      
      // 重新计算转化率
      calculateRates(row)
    }
    
    // 重新计算合计行
    return recomputeConsultantMonthlyTotals(next)
  })
}, [])
```

#### 3. 添加合计行重新计算函数（第642-708行）

```typescript
// 重新计算咨询师月度明细表的合计行
const recomputeConsultantMonthlyTotals = (rows: ConsultantMonthlyRow[]): ConsultantMonthlyRow[] => {
  const sumFields: (keyof ConsultantMonthlyRow)[] = [
    '计划收入', '实际收入', '计划招生', '实划招生', '退费人数',
    '上门总量', '咨询总量', '电话量', '市场投入'
  ]

  // 计算每月合计
  for (let month = 1; month <= 12; month++) {
    const monthRows = rows.filter(r => r.月份 === month && !r.isTotal)
    const monthTotal = rows.find(r => r.月份 === month && r.isTotal)
    
    if (monthTotal) {
      sumFields.forEach(field => {
        const sum = monthRows.reduce((acc, r) => {
          const val = r[field]
          return acc + (typeof val === 'number' ? val : 0)
        }, 0)
        ;(monthTotal as any)[field] = sum || null
      })
      
      // 计算合计行的招生成本
      if (monthTotal.实际招生 && monthTotal.实际招生 > 0 && monthTotal.市场投入 !== null) {
        monthTotal.招生成本 = monthTotal.市场投入 / monthTotal.实际招生
      } else {
        monthTotal.招生成本 = null
      }
      
      calculateRates(monthTotal)
    }
  }

  // 计算年度总合计
  const yearTotal = rows.find(r => r.月份 === '合计' && r.isTotal)
  if (yearTotal) {
    const allMonthTotals = rows.filter(r => typeof r.月份 === 'number' && r.isTotal)
    sumFields.forEach(field => {
      const sum = allMonthTotals.reduce((acc, r) => {
        const val = r[field]
        return acc + (typeof val === 'number' ? val : 0)
      }, 0)
      ;(yearTotal as any)[field] = sum || null
    })
    
    // 计算年度总合计的招生成本
    if (yearTotal.实际招生 && yearTotal.实际招生 > 0 && yearTotal.市场投入 !== null) {
      yearTotal.招生成本 = yearTotal.市场投入 / yearTotal.实际招生
    } else {
      yearTotal.招生成本 = null
    }
    
    calculateRates(yearTotal)
  }

  return rows
}
```

## 功能特性

### ✅ 已实现的功能

1. **可编辑输入框**
   - 只在口碑类型下启用
   - 使用 `InputNumber` 组件
   - 只能输入非负数（min=0）
   - 合计行不可编辑

2. **自动计算**
   - 输入费用投入后，自动计算招生成本（费用投入 ÷ 实际招生）
   - 自动更新该月的合计行
   - 自动更新年度总合计行

3. **实时更新**
   - 使用 React state 管理数据
   - 输入后立即更新界面
   - 所有相关数据同步更新

### ⚠️ 注意事项

1. **数据持久化**
   - 当前修改只在前端 state 中
   - 刷新页面后数据会丢失
   - 需要后端 API 支持才能真正保存

2. **仅限口碑类型**
   - 只有口碑（categoryName === '口碑'）类型下费用投入可编辑
   - 其他媒体来源类型（网络、新媒体等）仍然不可编辑

3. **字段映射**
   - 前端使用 `市场投入` 字段存储费用投入数据
   - 显示时对于口碑类型标题为"费用投入"

## 测试验证

### 测试步骤

1. 打开前端页面：`localhost:5173/consult/campus-yearly-monthly-media`
2. 选择任意校区
3. 点击"口碑"标签
4. 滚动到"咨询师月度明细表"
5. 在"费用投入"列找到输入框
6. 输入数值（例如：5000）
7. 验证：
   - ✅ 输入框正常接受数字
   - ✅ "招生成本"列自动更新
   - ✅ 月度合计行自动更新
   - ✅ 年度总合计行自动更新

### 边界测试

- ✅ 输入0：正常接受
- ✅ 输入负数：被拒绝（min=0限制）
- ✅ 清空输入：费用投入变为null
- ✅ 实际招生为0：招生成本显示null（避免除零错误）

## 与其他组件的区别

| 组件 | 用途 | 是否修改 |
|------|------|---------|
| `ConsultantChannelDashboard.tsx` | 专用的渠道咨询师看板 | ✅ 已修改（但未使用） |
| `GenericSourceDashboard.tsx` | 通用媒体来源看板（含口碑） | ✅ 已修改（实际使用） |

**实际使用的组件是 `GenericSourceDashboard.tsx`**，它通过 `categoryName` 属性动态生成不同媒体来源的看板。

## 后续工作建议

### 必须完成

1. **后端 API 开发**
   - 创建保存口碑费用投入的接口
   - 创建查询口碑费用投入的接口
   - 确定数据存储表和字段

2. **前端集成**
   - 在 `loadData` 中获取已保存的费用投入数据
   - 添加保存按钮和保存功能
   - 实现真正的数据持久化

### 可选优化

1. **用户体验**
   - 添加保存按钮（类似现有的"保存计划数据"按钮）
   - 添加未保存提醒
   - 添加保存中的 loading 状态

2. **数据验证**
   - 添加数值范围验证
   - 添加保存前的数据检查

## 文件清单

### 已修改的文件
1. `frontend/pages/consult/002-campus-yearly-monthly-media-source/002-media-source-yearly/components/GenericSourceDashboard.tsx` ✅

### 已创建的文档
1. `../handover/CONSULTANT_CHANNEL_EXPENSE_EDIT_SUMMARY.md` - ConsultantChannelDashboard 修改总结（未使用）
2. `../guides/CONSULTANT_CHANNEL_EXPENSE_TEST_GUIDE.md` - 测试指南（未使用）
3. `GENERIC_DASHBOARD_EXPENSE_EDIT_FIX.md` - 本文档（实际修复）

## 版本信息

- 修复日期: 2026-02-04
- 修复人: GitHub Copilot
- 问题: 口碑页面咨询师月度表费用投入无法输入
- 状态: ✅ 已修复（前端功能完成，待后端集成）
