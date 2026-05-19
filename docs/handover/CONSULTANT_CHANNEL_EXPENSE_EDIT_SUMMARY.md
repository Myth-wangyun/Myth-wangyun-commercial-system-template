# 咨询师口碑渠道月度费用投入编辑功能实现总结

## 修改文件
- `frontend/pages/consult/002-campus-yearly-monthly-media-source/002-media-source-yearly/components/ConsultantChannelDashboard.tsx`

## 功能说明
为咨询师口碑渠道数据看板的**月度明细表**添加了费用投入的编辑和保存功能。

## 主要修改内容

### 1. 导入必要组件
```typescript
import { Table, Spin, message, Divider, InputNumber, Button } from 'antd'
```
- 新增 `InputNumber`: 用于费用投入的数字输入
- 新增 `Button`: 用于保存费用投入数据

### 2. 增强费用计算逻辑
在 `calculateRates` 函数中添加了招生成本的计算：
```typescript
// 招生成本 = 费用投入 / 实际招生
if (row.实际招生 && row.实际招生 > 0 && row.费用投入 !== null) {
  row.招生成本 = (row.费用投入 / row.实际招生).toFixed(2)
} else {
  row.招生成本 = '-'
}
```

### 3. 添加数据更新和重新计算函数

#### 3.1 重新计算咨询师月度明细表合计
```typescript
const recomputeConsultantMonthlyTotals = (rows: ConsultantMonthlyRow[]): ConsultantMonthlyRow[]
```
- 计算每月合计行
- 计算年度总合计行
- 自动重新计算所有转化率和招生成本

#### 3.2 更新费用投入
```typescript
const updateConsultantMonthlyExpense = (key: string, value: number | null)
```
- 更新指定行的费用投入值
- 自动重新计算该行的转化率和招生成本
- 自动更新所有合计行

#### 3.3 保存费用投入数据
```typescript
const handleSaveExpenses = async ()
```
- 保存所有编辑后的费用投入数据
- 显示保存成功/失败提示
- **注意**: 需要根据实际后端API接口进行调整

### 4. 新增可编辑列定义

创建了专门用于咨询师月度明细表的可编辑费用投入列：

```typescript
const editableChannelCostColumns: ColumnsType<ConsultantMonthlyRow> = [
  { 
    title: '费用投入', 
    width: 100, 
    align: 'center',
    render: (_: any, r: ConsultantMonthlyRow) => {
      if (r.isTotal) {
        return <strong style={{ color: '#1890ff' }}>{r.费用投入 ?? ''}</strong>
      }
      return (
        <InputNumber
          value={r.费用投入}
          onChange={v => updateConsultantMonthlyExpense(r.key, v)}
          size="small"
          min={0}
          style={{ width: 90 }}
          placeholder="0"
        />
      )
    }
  },
  { 
    title: '招生成本', 
    dataIndex: '招生成本', 
    width: 80, 
    align: 'center', 
    render: (v, r) => renderRate(v, r.isTotal) 
  },
]
```

### 5. 更新咨询师月度明细表列定义

将原来的只读 `channelCostColumns` 替换为可编辑的 `editableChannelCostColumns`：

```typescript
const consultantMonthlyColumns: ColumnsType<ConsultantMonthlyRow> = useMemo(() => [
  // ... 其他列 ...
  { title: '免费推广招生成本', children: editableChannelCostColumns },
], [incomeColumns, enrollmentColumns, channelRateColumns, editableChannelCostColumns])
```

### 6. UI优化 - 添加保存按钮

在咨询师月度明细表上方添加了保存按钮：

```typescript
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
  <div style={headerStyle}>
    清美教育集团{year}年度渠道数据核心数据看板-咨询师（月度明细）
  </div>
  <Button type="primary" onClick={handleSaveExpenses} style={{ marginLeft: '16px' }}>
    保存费用投入
  </Button>
</div>
```

## 用户操作流程

1. **编辑费用投入**
   - 在咨询师月度明细表中找到对应的咨询师和月份
   - 点击"费用投入"列的输入框
   - 输入费用金额（只能输入非负数）

2. **自动计算**
   - 输入后，系统自动计算该行的"招生成本"（费用投入/实际招生）
   - 自动更新该月的合计行
   - 自动更新年度总合计行

3. **保存数据**
   - 点击表格上方的"保存费用投入"按钮
   - 系统显示保存成功的提示

## 数据自动计算逻辑

### 每行自动计算
- **招生成本** = 费用投入 ÷ 实际招生
- 若实际招生为0或null，显示 `-`

### 合计行自动计算
- **月度合计**: 汇总该月所有咨询师的费用投入
- **年度总合计**: 汇总所有月度合计的费用投入
- 合计行的招生成本也会自动重新计算

## 特性

✅ **实时计算**: 输入费用投入后立即计算招生成本和更新合计  
✅ **数据验证**: 只能输入非负数  
✅ **合计自动更新**: 所有合计行自动重新计算  
✅ **用户友好**: 合计行以粗体蓝色显示，不可编辑  
✅ **错误处理**: 除零等异常情况显示 `-`  

## 待完成事项

⚠️ **后端API集成**
- 需要在 `handleSaveExpenses` 函数中实现实际的API调用
- 建议API接口格式：
  ```typescript
  POST /api/v1/consultant-channel-expense
  {
    year: string,
    campus: string,
    data: [
      { month: number, consultant: string, expense: number },
      ...
    ]
  }
  ```

⚠️ **数据持久化**
- 目前只在前端状态中保存
- 需要从后端加载已保存的费用投入数据
- 建议在 `loadData` 函数中获取费用投入历史数据

## 测试建议

1. 测试单个费用输入和计算
2. 测试批量编辑多个咨询师的费用
3. 测试合计行的自动更新
4. 测试边界情况（0、null、大数字）
5. 测试保存功能（需要后端API）

## 参考实现

本实现参考了以下组件的类似功能：
- `TAB2Network/4MonthlyConsultantSEMDashboard.tsx` - SEM投入编辑
- `TAB1CampusCoreData/7ReputationDashboard.tsx` - 口碑费用投入编辑

## 版本信息

- 修改日期: 2026-02-04
- 组件版本: v1.1.0
- 修改人: GitHub Copilot
