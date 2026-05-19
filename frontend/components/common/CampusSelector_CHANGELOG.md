# CampusSelector 组件创建日志

## 📅 创建时间

2025年11月11日

## 🎯 创建目的

解决项目中存在47个重复的 `CampusSelector` 组件的问题，统一实现和维护。

## ✅ 完成的工作

### 1. 扩展 campusStore (stores/campusStore.ts)

- ✅ 添加 `addCampus(campus)` 方法
- ✅ 添加 `updateCampus(id, campus)` 方法
- ✅ 添加 `removeCampus(id)` 方法
- ✅ 扩展持久化配置，保存 campuses 到 localStorage

### 2. 创建统一组件 (components/common/CampusSelector.tsx)

- ✅ 支持全局状态模式（useGlobalState）
- ✅ 支持受控组件模式（value/onChange/campuses）
- ✅ 支持添加校区功能（showAddButton）
- ✅ 支持两种按钮位置（inside/outside）
- ✅ 支持标签显示（showTag）
- ✅ 支持搜索过滤
- ✅ 完整的 TypeScript 类型定义
- ✅ 导出便捷函数（GlobalCampusSelector, ControlledCampusSelector）

### 3. 创建文档和示例

- ✅ README_CampusSelector.md - 完整使用文档
- ✅ CampusSelectorDemo.tsx - 9个使用场景示例
- ✅ CHANGELOG.md - 本文档

## 📊 功能特性

### 核心功能

- [x] 全局状态模式
- [x] 受控组件模式
- [x] 搜索过滤
- [x] 添加校区（with Modal）
- [x] 标签显示
- [x] 尺寸配置（small/middle/large）
- [x] 禁用状态
- [x] 清除功能

### 高级功能

- [x] 自定义添加逻辑回调
- [x] 两种按钮位置（下拉内/外部）
- [x] 自定义按钮文字
- [x] 表单验证（Modal内）
- [x] Loading状态
- [x] 错误处理

### 待扩展功能（未来）

- [ ] 多选模式（mode="multiple"）
- [ ] 分组显示
- [ ] 禁用特定校区
- [ ] 自定义选项渲染
- [ ] 虚拟滚动（大数据量）
- [ ] 权限集成

## 🎨 Props API

| Prop              | 类型                           | 默认值       | 说明               |
| ----------------- | ------------------------------ | ------------ | ------------------ |
| useGlobalState    | boolean                        | false        | 使用全局状态       |
| value             | string                         | -            | 受控：当前值       |
| onChange          | (v: string) => void            | -            | 受控：变更回调     |
| campuses          | Array<{id, name}>              | -            | 受控：数据源       |
| size              | 'small' \| 'middle' \| 'large' | 'middle'     | 尺寸               |
| style             | CSSProperties                  | -            | 自定义样式         |
| showTag           | boolean                        | false        | 显示标签           |
| showLabel         | boolean                        | true         | 显示"当前校区"文字 |
| placeholder       | string                         | '请选择校区' | 占位符             |
| disabled          | boolean                        | false        | 禁用               |
| showAddButton     | boolean                        | false        | 显示添加按钮       |
| onAddCampus       | (data) => Promise<void>        | -            | 自定义添加逻辑     |
| addButtonText     | string                         | '添加校区'   | 按钮文字           |
| addButtonPosition | 'inside' \| 'outside'          | 'outside'    | 按钮位置           |
| allowClear        | boolean                        | true         | 允许清除           |
| className         | string                         | -            | 自定义类名         |

## 📝 使用示例

### 最简单的用法

```typescript
<CampusSelector useGlobalState />
```

### 带添加功能

```typescript
<CampusSelector
  useGlobalState
  showAddButton
/>
```

### 受控组件

```typescript
<CampusSelector
  value={value}
  onChange={setValue}
  campuses={list}
/>
```

### 自定义添加逻辑

```typescript
<CampusSelector
  useGlobalState
  showAddButton
  onAddCampus={async (data) => {
    await api.createCampus(data);
    await refetch();
  }}
/>
```

## 🔄 迁移指南

### 从本地组件迁移

**之前（47处重复代码）：**

```typescript
// pages/xxx/components/CampusSelector.tsx
import CampusSelector from './components/CampusSelector'
```

**之后（统一组件）：**

```typescript
import CampusSelector from '@/components/common/CampusSelector'
```

### 替换步骤

1. 删除本地 `components/CampusSelector.tsx`
2. 更新导入路径
3. 根据需求调整 props（可选）
4. 测试功能

## 🧪 测试

- ✅ 编译通过（TypeScript无错误）
- ✅ 创建了测试页面（CampusSelectorDemo.tsx）
- ✅ 包含9个使用场景示例

## 📦 文件清单

### 新增文件

```
frontend/
├── components/common/
│   ├── CampusSelector.tsx                     // 主组件（241行）
│   ├── README_CampusSelector.md               // 使用文档
│   └── CampusSelector_CHANGELOG.md            // 本文档
├── pages/test/
│   └── CampusSelectorDemo.tsx                 // 测试示例页面
└── stores/
    └── campusStore.ts                         // 扩展（+40行）
```

### 待删除文件（47个）

这些文件可以在逐步迁移后删除：

- `pages/campus/training-plan/components/CampusSelector.tsx`
- `pages/academic/teaching-content/shared/CampusSelector.tsx`
- `pages/campus/student-status/components/CampusSelector.tsx`
- ... (还有44个)

## 🎯 收益分析

### 代码减少

- **之前**: ~1,500行重复代码（47个文件 × ~32行）
- **之后**: ~240行统一代码（1个文件）
- **减少**: ~1,260行代码（84%减少）

### 维护成本

- **之前**: 修改需要同步47个文件
- **之后**: 只需修改1个文件
- **效率提升**: 47倍

### 功能增强

- 统一的用户体验
- 更强大的功能（添加校区）
- 更好的类型安全
- 更完善的错误处理

## 🐛 已知问题

无

## 🔮 后续计划

### 短期（1-2周）

1. 逐步替换现有的47个本地组件
2. 收集用户反馈
3. 优化性能（如需要）

### 中期（1个月）

1. 添加多选模式
2. 添加分组显示功能
3. 集成权限系统

### 长期

1. 提取为独立的 npm 包
2. 添加更多自定义选项
3. 支持主题定制

## 📞 联系方式

如有问题或建议，请在项目中提issue或联系开发团队。

## 🎉 总结

成功创建了统一的 CampusSelector 组件，解决了代码重复问题，提供了更强大和灵活的功能。
