# 部门级访问控制实施文档

## 概述

在原有的RBAC权限系统基础上，新增了部门级访问控制，实现了学术部和教质部的菜单隔离，同时允许特定菜单（如班档案表）被多个部门访问。

## 实现逻辑

### 1. 菜单配置（MenuItemConfig）

在菜单项接口中增加了 `department` 字段：

```typescript
export interface MenuItemConfig {
  key: string
  label: string
  icon?: React.ReactNode
  routeKey?: string
  menuKey?: string
  permissions?: string[]
  department?: 'academic' | 'teaching_quality' | 'common'  // 新增
  children?: MenuItemConfig[]
}
```

**department 字段说明：**
- `'academic'`: 仅学术部可访问
- `'teaching_quality'`: 仅教质部可访问
- `'common'`: 所有部门都可访问（如班档案表）
- `undefined`: 不进行部门过滤（默认行为，向后兼容）

### 2. 菜单标记

#### 学术部菜单
```typescript
export const CAMPUS_ACADEMIC_MENU: MenuItemConfig[] = [
  {
    key: 'campus-academic',
    label: '学术部',
    icon: <BookOutlined />,
    department: 'academic',  // 标记为学术部菜单
    children: [...]
  }
]
```

#### 教质部菜单
```typescript
export const CAMPUS_TEACHING_QUALITY_MENU: MenuItemConfig[] = [
  {
    key: 'campus-teaching-quality',
    label: '教质部',
    icon: <SafetyOutlined />,
    department: 'teaching_quality',  // 标记为教质部菜单
    children: [...]
  }
]
```

#### 共享菜单项（班档案表）
```typescript
{
  key: 'campus-tq-class-file-record',
  label: '班档案表',
  icon: <FileTextOutlined />,
  routeKey: 'campus-tq-class-file-record',
  department: 'common',  // 标记为共享，学术部也可以访问
}
```

### 3. 过滤函数

#### filterMenuByDepartment
按部门过滤菜单项，递归处理子菜单：

```typescript
export const filterMenuByDepartment = (
  items: MenuItemConfig[],
  userDepartment: string | null | undefined,
  isAdmin: boolean = false
): MenuItemConfig[]
```

**过滤规则：**
1. 管理员/超级用户：可访问所有菜单
2. 无部门信息：返回所有菜单（向后兼容）
3. 学术部（'学术部'）：可访问 `department === 'academic' || department === 'common'`
4. 教质部（'教质部'）：可访问 `department === 'teaching_quality' || department === 'common'`
5. 无 department 标识：默认不过滤

#### filterMenuByPermissionsAndDepartment
先按权限过滤，再按部门过滤：

```typescript
export const filterMenuByPermissionsAndDepartment = (
  items: MenuItemConfig[],
  userPermissions: string[] = [],
  userDepartment: string | null | undefined,
  isAdmin: boolean = false
): MenuItemConfig[]
```

#### convertToAntMenuItemsWithPermissionsAndDepartment
组合过滤并转换为 Ant Design Menu 格式：

```typescript
export const convertToAntMenuItemsWithPermissionsAndDepartment = (
  items: MenuItemConfig[],
  userPermissions: string[] = [],
  userDepartment: string | null | undefined,
  isAdmin: boolean = false
): MenuProps['items']
```

### 4. Sidebar 集成

更新了 Sidebar 组件，使用新的过滤函数：

```typescript
// 获取用户的部门
const userDepartment = user?.department

// 根据用户权限和部门过滤菜单
const menuItems = React.useMemo<MenuProps['items']>(
  () => [
    { key: 'campuses', icon: <BankOutlined />, label: '校区信息' },
    ...convertToAntMenuItemsWithPermissionsAndDepartment(
      ALL_MENU_ITEMS, 
      permissions, 
      userDepartment, 
      isAdmin
    ),
  ],
  [permissions, isAdmin, userDepartment],
)
```

## 访问控制矩阵

| 用户部门 | 可访问菜单 |
|---------|-----------|
| 学术部   | - 学术部所有菜单<br>- 教质部的班档案表<br>- 其他 common 标记的菜单 |
| 教质部   | - 教质部所有菜单<br>- 其他 common 标记的菜单 |
| 管理员   | 所有菜单（绕过部门检查） |
| 无部门信息 | 所有菜单（向后兼容） |

## 实现文件

### 前端文件
1. **frontend/config/ui/menuItems.tsx**
   - 添加 `department` 字段到 MenuItemConfig 接口
   - 实现 `filterMenuByDepartment()` 函数
   - 实现 `filterMenuByPermissionsAndDepartment()` 函数
   - 实现 `convertToAntMenuItemsWithPermissionsAndDepartment()` 函数
   - 标记各菜单的 department 属性

2. **frontend/components/Sidebar.tsx**
   - 从 authStore 获取 `user.department`
   - 使用 `convertToAntMenuItemsWithPermissionsAndDepartment()` 过滤菜单
   - 添加 `userDepartment` 到依赖数组

## 测试场景

### 场景1：学术部用户登录
**期望结果：**
- ✅ 显示学术部所有菜单
- ✅ 显示教质部的"班档案表"
- ❌ 不显示教质部其他菜单

### 场景2：教质部用户登录
**期望结果：**
- ✅ 显示教质部所有菜单
- ❌ 不显示学术部菜单（包括班档案表在学术部中的入口）

### 场景3：管理员登录
**期望结果：**
- ✅ 显示所有菜单（不受部门限制）

### 场景4：无部门信息的用户
**期望结果：**
- ✅ 显示所有菜单（向后兼容）

## 数据库字段

确保 `users` 表有 `department` 字段：

```sql
SELECT username, name, department, position 
FROM users 
WHERE department IN ('学术部', '教质部');
```

## 与 RBAC 权限系统的关系

部门级访问控制是在权限系统之上的额外过滤层：

1. **第一层过滤：权限检查**
   - 通过 `filterMenuByPermissions()` 检查用户是否有访问该菜单的权限
   
2. **第二层过滤：部门检查**
   - 通过 `filterMenuByDepartment()` 检查用户部门是否允许访问该菜单

两层过滤都通过，菜单项才会显示。

## 扩展性

### 添加新部门
如需添加新部门（如"行政部"）：

1. 在 MenuItemConfig 的 department 类型中添加新值：
```typescript
department?: 'academic' | 'teaching_quality' | 'administrative' | 'common'
```

2. 在 filterMenuByDepartment 函数中添加过滤逻辑：
```typescript
// 行政部用户可以访问：administrative和common
if (userDepartment === '行政部' && (item.department === 'administrative' || item.department === 'common')) {
  return item
}
```

3. 标记相关菜单项的 department 属性

### 跨部门共享菜单
将需要共享的菜单项的 `department` 设置为 `'common'`：
```typescript
{
  key: 'shared-menu-item',
  label: '共享菜单',
  department: 'common',  // 所有部门都可访问
  children: [...]
}
```

## 注意事项

1. **路由保护**：前端菜单过滤不能替代后端权限验证，后端API仍需进行权限检查

2. **数据一致性**：确保数据库中的 department 字段值与代码中的字符串完全匹配（'学术部', '教质部'）

3. **向后兼容**：没有 department 信息的用户和菜单项不受部门过滤影响

4. **性能考虑**：filterMenuByDepartment 使用递归算法，对于大型菜单树可能有性能影响，但通常可以忽略

## 未来改进

1. **动态配置**：将部门-菜单映射关系存储在数据库中，支持运行时配置
2. **细粒度控制**：支持部门+角色的组合条件
3. **审计日志**：记录部门访问控制的决策过程
4. **UI指示**：在菜单上显示部门标签，让用户知道菜单的访问范围

## 相关文档

- [RBAC权限系统实施文档](./handover/IMPLEMENTATION_SUMMARY.md)
- [教员数据范围控制](./DETAILED_FIXES.md)
- [前端权限检查](./frontend/docs/permissions.md)
