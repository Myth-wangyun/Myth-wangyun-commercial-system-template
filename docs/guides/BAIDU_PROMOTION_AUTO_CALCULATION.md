# 百度推广页面自动计算功能实现总结

## 📋 需求说明

在百度推广页面中实现以下自动计算规则：
- **总咨询量** = 百度表单 + 中心来电 + 百度聊出
- **百度咨询量** = 总咨询量

## ✅ 实现内容

### 1. 修改文件

#### `frontend/pages/market/5-Marketing-SEM-Daily-Data/index.tsx`

在 `updateBaiduRow` 函数中添加自动计算逻辑：

```typescript
// 当更新百度表单、中心来电或百度聊出时，自动计算总咨询量和百度咨询量
if (field === 'baiduForm' || field === 'centerComeIn' || field === 'baiduChatOut') {
  next.totalConsultCount = next.baiduForm + next.centerComeIn + next.baiduChatOut
  next.baiduConsultCount = next.totalConsultCount
}
```

#### `frontend/pages/market/5-Marketing-SEM-Daily-Data/BaiduPromotionTab.tsx`

1. **更新类型定义**：将 `totalConsultCount` 和 `baiduConsultCount` 从可编辑字段中排除

```typescript
type EditableField = keyof Omit<
  BaiduPromotionRow,
  | 'key'
  | 'weekday'
  | 'dateText'
  | 'baiduConversionRate'
  | 'consultCost'
  | 'validConsultCost'
  | 'validConsultRate'
  | 'validDialogueRate'
  | 'clickRate'
  | 'avgPrice'
  | 'totalConsultCount'    // 新增：自动计算字段
  | 'baiduConsultCount'    // 新增：自动计算字段
>
```

2. **修改渲染方式**：将这两个字段从可编辑输入框改为只读显示

```typescript
// 百度咨询量 - 改为只读显示
{
  title: '百度咨询量',
  dataIndex: 'baiduConsultCount',
  width: 90,
  align: 'center',
  onHeaderCell: () => ({ style: orangeHeaderStyle }),
  render: (val: number, record: BaiduPromotionRow) => {
    const isZero = val === 0
    const displayVal = isZero ? <span style={{ color: '#999' }}>{val}</span> : val
    
    if (record.key === 'summary') {
      return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
    }
    return displayVal
  },
}

// 总咨询量 - 改为只读显示
{
  title: '总咨询量',
  dataIndex: 'totalConsultCount',
  width: 80,
  align: 'center',
  onHeaderCell: () => ({ style: blueHeaderStyle }),
  render: (val: number, record: BaiduPromotionRow) => {
    const isZero = val === 0
    const displayVal = isZero ? <span style={{ color: '#999' }}>{val}</span> : val
    
    if (record.key === 'summary') {
      return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
    }
    return displayVal
  },
}
```

## 🔄 功能说明

### 自动计算触发条件

当用户编辑以下任一字段时，会自动触发计算：
1. **百度表单** (`baiduForm`)
2. **中心来电** (`centerComeIn`)
3. **百度聊出** (`baiduChatOut`)

### 计算流程

```
用户输入百度表单/中心来电/百度聊出
    ↓
自动计算：总咨询量 = baiduForm + centerComeIn + baiduChatOut
    ↓
自动赋值：百度咨询量 = 总咨询量
    ↓
级联计算其他相关字段：
  - 百度报名转化率
  - 咨询量成本
  - 有效率
  - 有效咨询量成本
```

### 用户体验优化

1. **字段锁定**：`总咨询量` 和 `百度咨询量` 显示为普通文本，无法直接编辑
2. **视觉反馈**：
   - 值为 0 时以灰色显示（`color: #999`）
   - 汇总行以粗体显示（`fontWeight: 'bold'`）
3. **实时更新**：修改任一源字段后，计算字段立即更新

## 📊 涉及的数据字段

| 字段名 | 中文名 | 类型 | 说明 |
|--------|--------|------|------|
| `baiduForm` | 百度表单 | 可编辑 | 用户输入 |
| `centerComeIn` | 中心来电 | 可编辑 | 用户输入 |
| `baiduChatOut` | 百度聊出 | 可编辑 | 用户输入 |
| `totalConsultCount` | 总咨询量 | 只读 | 自动计算 = baiduForm + centerComeIn + baiduChatOut |
| `baiduConsultCount` | 百度咨询量 | 只读 | 自动计算 = totalConsultCount |

## 🧪 测试建议

1. **基础计算测试**
   - 输入百度表单数据，验证总咨询量和百度咨询量是否正确计算
   - 输入中心来电数据，验证计算是否正确
   - 输入百度聊出数据，验证计算是否正确

2. **组合测试**
   - 同时输入多个字段，验证总和计算是否正确
   - 修改已有数据，验证是否实时更新

3. **边界测试**
   - 输入 0，验证显示效果（灰色）
   - 输入大数值，验证计算精度
   - 清空数据，验证是否正确重置为 0

4. **汇总行测试**
   - 验证多行数据的汇总行计算是否正确
   - 验证汇总行的字体加粗效果

## ✨ 技术亮点

1. **类型安全**：通过 TypeScript 类型定义确保只读字段不会被误传给编辑函数
2. **性能优化**：使用 `useCallback` 避免不必要的重渲染
3. **一致性**：保持与其他自动计算字段（如 `otherConsultCount`）的实现模式一致
4. **可维护性**：代码注释清晰，逻辑集中在 `updateBaiduRow` 函数中

## 📝 后续建议

1. 如果未来需要修改计算公式，只需调整 `updateBaiduRow` 函数中的计算逻辑
2. 如果需要支持手动覆盖，可以添加"锁定/解锁"按钮功能
3. 考虑添加数据验证，确保输入值的合理性（如非负数）

---

**修改日期**: 2026年2月6日  
**修改人**: GitHub Copilot  
**相关模块**: 市场部 > SEM每日数据
