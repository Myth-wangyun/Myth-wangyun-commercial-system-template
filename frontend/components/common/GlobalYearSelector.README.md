# GlobalYearSelector 全局年份选择器

## 功能特点

- ✅ **支持任意年份输入** - 用户可以直接输入任意年份（2000-2100）
- ✅ **快速选择常用年份** - 默认提供2020-2030年快速选择
- ✅ **统一体验** - 所有页面使用相同的年份选择组件
- ✅ **灵活配置** - 支持自定义年份范围、宽度、尺寸等

## 使用方法

### 基础用法

```tsx
import { GlobalYearSelector } from '@/components/common'

const [selectedYear, setSelectedYear] = useState(2024)

<GlobalYearSelector 
  value={selectedYear} 
  onChange={setSelectedYear} 
/>
```

### 完整示例

```tsx
import React, { useState } from 'react'
import { GlobalYearSelector } from '@/components/common'

const MyComponent: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear())

  return (
    <div>
      <label>选择年份：</label>
      <GlobalYearSelector 
        value={year}
        onChange={setYear}
        width={120}
        size="middle"
        placeholder="选择年份"
      />
    </div>
  )
}
```

## API 参数

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| value | 当前选中的年份 | `number` | - |
| defaultValue | 默认年份 | `number` | - |
| onChange | 年份变化回调 | `(year: number) => void` | - |
| minYear | 最小年份 | `number` | `2000` |
| maxYear | 最大年份 | `number` | `2100` |
| showQuickSelect | 是否显示常用年份快速选择 | `boolean` | `true` |
| quickSelectRange | 常用年份范围 | `[number, number]` | `[2020, 2030]` |
| width | 宽度 | `number \| string` | `120` |
| size | 尺寸 | `'small' \| 'middle' \| 'large'` | `'middle'` |
| disabled | 是否禁用 | `boolean` | `false` |
| placeholder | 占位符 | `string` | `'选择年份'` |
| allowClear | 是否允许清除 | `boolean` | `true` |
| useInputNumber | 使用InputNumber模式（直接输入） | `boolean` | `false` |

## 替换现有年份选择器

### 替换前（旧代码）

```tsx
<Select value={selectedYear} onChange={setSelectedYear} style={{ width: 120 }}>
  <Option value={2023}>2023</Option>
  <Option value={2024}>2024</Option>
  <Option value={2025}>2025</Option>
</Select>
```

### 替换后（新代码）

```tsx
import { GlobalYearSelector } from '@/components/common'

<GlobalYearSelector 
  value={selectedYear} 
  onChange={setSelectedYear}
  width={120}
/>
```

## 使用场景

### 1. 标准下拉选择模式（默认）

```tsx
<GlobalYearSelector 
  value={year} 
  onChange={setYear}
/>
```

- 显示常用年份列表（2020-2030）
- 支持搜索和直接输入任意年份
- 自动验证年份范围

### 2. 纯输入模式

```tsx
<GlobalYearSelector 
  value={year} 
  onChange={setYear}
  useInputNumber={true}
/>
```

- 直接显示数字输入框
- 适合需要频繁输入不同年份的场景

### 3. 自定义年份范围

```tsx
<GlobalYearSelector 
  value={year} 
  onChange={setYear}
  minYear={2020}
  maxYear={2030}
  quickSelectRange={[2023, 2028]}
/>
```

## 已替换的页面

- ✅ `frontend/pages/academic/campus/06-enterprise-culture/1-culture-presentation-plan.tsx` - 企业文化宣讲计划表
- ✅ `frontend/pages/academic/campus/06-enterprise-culture/2-culture-exam-plan.tsx` - 企业文化考试计划表

## 待替换的页面

以下页面仍使用旧的年份选择方式，建议逐步替换：

- `frontend/pages/academic/campus/05-manage-data/27-academic-teacher-function-analysis/8-teacher-exam-pass-rate.tsx`
- `frontend/pages/academic/campus/05-manage-data/27-academic-teacher-function-analysis/8-teacher-violation-tab.tsx`
- `frontend/pages/academic/campus/05-manage-data/27-academic-teacher-function-analysis/8-teacher-satisfaction-tab.tsx`
- ... (更多页面见 grep 搜索结果)

## 迁移指南

1. **导入组件**
   ```tsx
   import { GlobalYearSelector } from '@/components/common'
   ```

2. **替换Select组件**
   - 删除所有 `<Option>` 子元素
   - 将 `Select` 替换为 `GlobalYearSelector`
   - 保持 `value` 和 `onChange` 属性不变

3. **测试验证**
   - 测试选择常用年份
   - 测试输入自定义年份
   - 验证年份范围限制

## 注意事项

1. **年份类型**：确保 `value` 和 `onChange` 的参数都是 `number` 类型
2. **年份范围**：默认限制在 2000-2100 年，可根据需要调整
3. **性能**：组件已优化，支持大量页面使用

