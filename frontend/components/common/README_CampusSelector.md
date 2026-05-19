# CampusSelector 统一校区选择器

## 📝 概述

这是一个统一的校区选择器组件，替代了项目中47个重复的 `CampusSelector` 实现。

## 🎯 功能特性

- ✅ 两种工作模式：全局状态 / 受控组件
- ✅ 搜索过滤功能
- ✅ 添加校区功能（可选）
- ✅ 标签显示（可选）
- ✅ 灵活的样式配置
- ✅ TypeScript 类型安全

## 📦 使用方式

### 方式1：全局状态模式（最常用）

```typescript
import CampusSelector from '@/components/common/CampusSelector';
// 或者使用便捷导出
import { GlobalCampusSelector } from '@/components/common/CampusSelector';

// 基础使用
<CampusSelector useGlobalState />

// 带标签显示
<CampusSelector useGlobalState showTag />

// 带添加功能
<CampusSelector useGlobalState showAddButton />

// 完整配置
<CampusSelector
  useGlobalState
  showTag
  showAddButton
  addButtonPosition="inside"  // 或 "outside"
  size="large"
/>
```

### 方式2：受控组件模式

```typescript
import CampusSelector from '@/components/common/CampusSelector';

const [selectedCampus, setSelectedCampus] = useState('');
const campusList = [
  { id: '1', name: '盛邦校区' },
  { id: '2', name: '冀美校区' },
];

<CampusSelector
  value={selectedCampus}
  onChange={setSelectedCampus}
  campuses={campusList}
/>
```

### 方式3：自定义添加校区逻辑

```typescript
const handleAddCampus = async (data: { name: string; website?: string }) => {
  // 调用 API
  await api.campus.create(data);
  // 刷新列表
  await refetchCampuses();
};

<CampusSelector
  useGlobalState
  showAddButton
  onAddCampus={handleAddCampus}
/>
```

## 🎨 Props API

| Prop                | 类型                             | 默认值         | 说明                   |
| ------------------- | -------------------------------- | -------------- | ---------------------- |
| `useGlobalState`    | `boolean`                        | `false`        | 是否使用全局状态管理   |
| `value`             | `string`                         | -              | 受控模式：当前值       |
| `onChange`          | `(value: string) => void`        | -              | 受控模式：变更回调     |
| `campuses`          | `Array<{id, name}>`              | -              | 受控模式：校区列表     |
| `size`              | `'small' \| 'middle' \| 'large'` | `'middle'`     | 组件尺寸               |
| `style`             | `CSSProperties`                  | -              | 自定义样式             |
| `showTag`           | `boolean`                        | `false`        | 是否显示标签           |
| `showLabel`         | `boolean`                        | `true`         | 是否显示"当前校区"文字 |
| `placeholder`       | `string`                         | `'请选择校区'` | 占位符文本             |
| `disabled`          | `boolean`                        | `false`        | 是否禁用               |
| `showAddButton`     | `boolean`                        | `false`        | 是否显示添加按钮       |
| `onAddCampus`       | `(data) => Promise<void>`        | -              | 自定义添加逻辑         |
| `addButtonText`     | `string`                         | `'添加校区'`   | 添加按钮文字           |
| `addButtonPosition` | `'inside' \| 'outside'`          | `'outside'`    | 按钮位置               |
| `allowClear`        | `boolean`                        | `true`         | 是否允许清除           |
| `className`         | `string`                         | -              | 自定义类名             |

## 🔄 迁移指南

### 从本地 CampusSelector 迁移

**之前：**

```typescript
// pages/xxx/components/CampusSelector.tsx
import CampusSelector from './components/CampusSelector';

<CampusSelector
  value={campus}
  onChange={setCampus}
  campuses={campusList}
/>
```

**之后：**

```typescript
// 删除本地 CampusSelector.tsx 文件
import CampusSelector from '@/components/common/CampusSelector';

<CampusSelector
  value={campus}
  onChange={setCampus}
  campuses={campusList}
/>
```

### 使用全局状态的迁移

**之前：**

```typescript
const { currentCampus, getAllCampuses, setCampus } = useCampusStore();

<Select
  value={currentCampus}
  onChange={setCampus}
  options={getAllCampuses().map(c => ({ value: c.name, label: c.name }))}
/>
```

**之后：**

```typescript
<CampusSelector useGlobalState />
```

## 🎯 使用场景示例

### 场景1：基础数据展示页面

```typescript
// 只需要选择，不需要添加
<CampusSelector useGlobalState />
```

### 场景2：管理员管理页面

```typescript
// 管理员可以添加新校区
<CampusSelector
  useGlobalState
  showAddButton={isAdmin}
  showTag
/>
```

### 场景3：表单中的校区选择

```typescript
<Form.Item label="所属校区" name="campusId">
  <CampusSelector
    value={formValues.campusId}
    onChange={(v) => setFormValues({...formValues, campusId: v})}
    campuses={campusList}
    showLabel={false}
  />
</Form.Item>
```

### 场景4：紧凑布局

```typescript
<CampusSelector
  useGlobalState
  size="small"
  showLabel={false}
  style={{ width: 120 }}
/>
```

## 🔧 高级用法

### 与API集成

```typescript
const handleAddCampus = async (data: { name: string }) => {
  try {
    const response = await fetch('/api/campuses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('创建失败');
    message.success('校区创建成功');
    // 刷新全局状态
    refetchCampuses();
  } catch (error) {
    throw new Error('校区创建失败，请重试');
  }
};

<CampusSelector
  useGlobalState
  showAddButton
  onAddCampus={handleAddCampus}
/>
```

### 权限控制

```typescript
const { hasPermission } = useAuth();

<CampusSelector
  useGlobalState
  showAddButton={hasPermission('campus:create')}
  disabled={!hasPermission('campus:read')}
/>
```

## 📊 性能优化

组件已内置以下优化：

- 使用 Ant Design 的虚拟滚动（数据量大时自动启用）
- 搜索防抖
- Modal 懒加载

## 🐛 常见问题

### Q: 如何自定义添加校区的表单字段？

A: 使用 `onAddCampus` 回调，在外部实现自定义表单和逻辑。

### Q: 可以支持多选吗？

A: 当前版本不支持，如需多选，请扩展 Props 添加 `mode="multiple"`。

### Q: 如何在添加后自动选中新校区？

A: 在 `onAddCampus` 回调中，添加完成后调用 `setCampus(newCampusName)`。

## 📝 待办事项

- [ ] 添加多选模式支持
- [ ] 添加分组显示功能
- [ ] 添加禁用特定校区的功能
- [ ] 添加自定义渲染选项的能力

## 🤝 贡献

如需扩展功能，请在 `/home/xzw65/Project/qm-system/frontend/components/common/CampusSelector.tsx` 中修改。
