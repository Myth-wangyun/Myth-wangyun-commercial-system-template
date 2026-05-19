# 配置目录说明

本目录集中管理所有路由配置、UI配置和组件映射配置。

## 目录结构

```
config/
├── router/                    # 路由配置
│   ├── routes.ts             # 路由路径定义
│   ├── routeComponents.ts   # 路由组件映射
│   └── index.ts              # 路由配置导出
├── ui/                       # UI配置
│   ├── menuItems.ts          # 菜单项配置
│   ├── menuRoutes.ts         # 菜单到路由的映射
│   └── index.ts              # UI配置导出
├── components/               # 组件配置
│   ├── coreDataComponents.ts # Core-data 组件映射
│   └── index.ts              # 组件配置导出
├── campusConfig.ts           # 校区配置
└── index.ts                  # 统一导出入口
```

## 使用方式

### 1. 在 router/index.tsx 中使用

```typescript
import { STANDALONE_ROUTES, CoreDataPage, getRouteComponent } from '../config';
import { Suspense } from 'react';

// 生成路由配置
const routes = [
  ...STANDALONE_ROUTES.map(route => ({
    path: route.path,
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        {getRouteComponent(route.key)}
      </Suspense>
    ),
  })),
  {
    path: '/academic/teaching-content',
    element: <CoreDataPage />,
  },
];
```

### 2. 在 Sidebar.tsx 中使用

```typescript
import { ALL_MENU_ITEMS, generateRouteMap, convertToAntMenuItems } from '../config'

const routeMap = generateRouteMap()
const menuItems = convertToAntMenuItems(ALL_MENU_ITEMS)

const handleMenuClick = ({ key }: { key: string }) => {
  navigate(routeMap[key] || '#')
}
```

### 3. 在 core-data/index.tsx 中使用

```typescript
import { ALL_CORE_DATA_COMPONENTS } from '../../config'

const LAZY_COMPONENTS = ALL_CORE_DATA_COMPONENTS
```

## 配置说明

### 路由配置 (router/routes.ts)

- `STANDALONE_ROUTES`: 独立路由（直接访问的页面）
- `CORE_DATA_ROUTES`: 通过 core-data 入口访问的路由
- `getRouteByKey()`: 根据路由 key 查找配置
- `getFullPath()`: 生成完整路径（包含 menu 参数）

### UI菜单配置 (ui/menuItems.ts)

- `ACADEMIC_MANAGEMENT_CENTER_MENU`: 管理中心菜单
- `ACADEMIC_CAMPUS_LEVEL_MENU`: 校区级别菜单
- `convertToAntMenuItems()`: 转换为 Ant Design Menu 格式
- `findMenuItemByKey()`: 根据 key 查找菜单项

### 组件配置 (components/coreDataComponents.ts)

- `MANAGEMENT_CENTER_COMPONENTS`: 管理中心组件映射（14张表）
- `CAMPUS_COMPONENTS`: 校区组件映射
- `ALL_CORE_DATA_COMPONENTS`: 合并所有菜单绑定的组件

**注意**: 此文件仅保留当前菜单中实际绑定的路由组件，其余未使用的组件映射已被清理。

## 优势

1. ✅ 集中管理：所有配置在一个地方
2. ✅ 类型安全：TypeScript 类型约束
3. ✅ 易于维护：修改配置即可，无需多处改动
4. ✅ 一致性：路由与菜单自动对齐
5. ✅ 可扩展：新增页面只需在配置中添加
