# 快速参考指南 - 性能优化

## 🎯 优化概览

| 优化项 | 方法 | 效果 |
|--------|------|------|
| 列配置 | `useMemo` | 避免每次渲染重新生成 31 个列 |
| rowSpan | `useMemo` + Map | O(n²) → O(1) 查询 |
| 合计值 | `useMemo` + Map | 避免 186 次重复求和 |
| 单元格 | `React.memo` | 避免 693 个单元格不必要重渲染 |
| 函数 | `useCallback` | 稳定函数引用 |
| 加载 | `useCallback` | 正确的依赖管理 |

## 📋 关键代码片段

### EditableCell 组件
```typescript
const EditableCell = memo(({ text, record, field, editMode, onCellChange }: EditableCellProps) => {
  // 单元格组件
})
```

### 缓存列配置
```typescript
const columns = useMemo(() => {
  // 生成列配置
}, [daysInMonth, editMode, handleCellChange, categoryRowSpanMap, totalMap])
```

### 缓存 rowSpan
```typescript
const categoryRowSpanMap = useMemo(() => {
  const map: Record<string, number> = {}
  // 计算 rowSpan
  return map
}, [dataSource])
```

### 缓存合计值
```typescript
const totalMap = useMemo(() => {
  const map: Record<string, number | string> = {}
  // 计算合计
  return map
}, [dataSource, daysInMonth])
```

### 稳定函数引用
```typescript
const handleCellChange = useCallback((key, field, value) => {
  setDataSource((prevData) => {
    // 使用函数式更新
  })
}, [])
```

## ✅ 验证清单

- [ ] 代码编译无错误
- [ ] 单元格编辑功能正常
- [ ] 编辑模式切换正常
- [ ] 数据保存成功
- [ ] 月份切换响应快速
- [ ] 使用 React Scan 验证渲染次数减少
- [ ] 合计值计算正确
- [ ] 行合并显示正确

## 🔧 常见问题

### Q: 为什么还是卡顿?
A: 可能需要虚拟滚动。使用 React Scan 导出数据，查看是否有其他组件频繁渲染。

### Q: 能否移除所有 useMemo/useCallback?
A: 不能。这些优化是必要的。如果启用 React Compiler，可以移除。

### Q: 如何进一步优化?
A: 考虑虚拟滚动、分页或行级 memoization。

## 📊 性能指标

**目标**:
- 首次加载: < 2s
- 编辑响应: < 100ms
- 保存完成: < 1s
- 月份切换: < 500ms

## 🚀 下一步

1. 测试优化效果
2. 使用 React Scan 验证
3. 如有问题，导出性能数据
4. 考虑虚拟滚动（如果表格继续增长）

