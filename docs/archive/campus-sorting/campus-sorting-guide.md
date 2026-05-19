# 校区排序功能使用指南

## 概述

本系统已实现统一的校区排序功能，确保所有部门（市场部、教质部、学术部）的校区列表都按照统一的顺序显示。

## 排序规则

### 默认排序顺序

校区按照以下顺序排列：

1. 河北盛邦 / 盛邦
2. 河北冀美 / 冀美
3. 河北石美 / 石美
4. 山西晋美 / 晋美
5. 山西原美 / 原美
6. 山西太美 / 太美
7. 广西桂美 / 桂美
8. 广西邕美 / 邕美
9. 贵州黔美 / 黔美

### 兼容性

- ✅ 支持带省份的校区名称（如：河北盛邦校区）
- ✅ 支持不带省份的校区名称（如：盛邦校区）
- ✅ 新添加的校区会按照省份顺序或配置顺序排序
- ✅ 未在规则中的校区会排在最后，并按字母顺序排列

## 使用方法

### 1. 在组件中使用 CampusSelector

`CampusSelector` 组件已经内置了排序功能，直接使用即可：

```tsx
import CampusSelector from '@/components/common/CampusSelector'
import { getEnvironmentCampusList } from '@/utils/campusHelpers'

// 方式1：使用全局状态（推荐）
<CampusSelector useGlobalState />

// 方式2：使用受控组件模式（会自动排序）
const campuses = getEnvironmentCampusList()
<CampusSelector
  value={selectedCampus}
  onChange={setSelectedCampus}
  campuses={campuses}
/>
```

### 2. 获取排序后的校区列表

使用 `campusHelpers` 工具函数：

```tsx
import { getEnvironmentCampusList, getStandardCampusList, getSimpleCampusList } from '@/utils/campusHelpers'

// 根据环境自动选择（推荐）
const campuses = getEnvironmentCampusList()

// 获取带省份的完整名称列表
const campuses = getStandardCampusList()

// 获取不带省份的简化名称列表
const campuses = getSimpleCampusList()
```

### 3. 对自定义校区数组排序

使用 `sortCampuses` 函数：

```tsx
import { sortCampuses } from '@/utils/campusSort'

// 对字符串数组排序
const campusNames = ['晋美校区', '盛邦校区', '冀美校区']
const sorted = sortCampuses(campusNames)
// 结果: ['盛邦校区', '冀美校区', '晋美校区']

// 对对象数组排序（默认使用 'name' 字段）
const campuses = [
  { id: '3', name: '晋美校区' },
  { id: '1', name: '盛邦校区' },
  { id: '2', name: '冀美校区' }
]
const sorted = sortCampuses(campuses)

// 对对象数组排序（指定字段名）
const sorted = sortCampuses(campuses, 'campusName')
```

### 4. 在 Store 中使用

`useCampusStore` 已经内置了排序功能：

```tsx
import { useCampusStore } from '@/stores/campusStore'

const { getAllCampuses, getFilteredCampuses } = useCampusStore()

// 获取所有校区（已排序）
const campuses = getAllCampuses()

// 获取过滤后的校区（已排序）
const campuses = getFilteredCampuses(accessibleCampuses)
```

## 需要更新的页面

以下页面需要更新以使用统一的排序功能：

### 市场部管理中心

- [ ] `/market/1-market-yearly-summary/1-mgnt-center-data-summary/*`
- [ ] `/market/2-market-monthly-data/1-campus/*`
- [ ] 其他市场部汇总页面

### 教质部管理中心

- [x] `/teaching-quality/mgnt/campus-level/1-02-01campus-core-data-summary/` ✅ 已更新
- [ ] `/teaching-quality/mgnt/campus-level/2-employment-goals-results/`
- [ ] `/teaching-quality/mgnt/campus-level/3-contract-goals-results/`
- [ ] 其他教质部校区级页面

### 学术部管理中心

- [ ] `/academic/mgnt/campus-level/*`
- [ ] 其他学术部汇总页面

## 更新步骤

### 步骤1：导入工具函数

```tsx
import { getEnvironmentCampusList } from '@/utils/campusHelpers'
```

### 步骤2：替换硬编码的校区列表

**之前：**
```tsx
const campuses = [
  { id: '盛邦校区', name: '盛邦校区' },
  { id: '冀美校区', name: '冀美校区' },
  { id: '石美校区', name: '石美校区' },
  // ...
]
```

**之后：**
```tsx
const campuses = getEnvironmentCampusList()
```

### 步骤3：验证排序

在浏览器中打开页面，确认校区列表按照正确的顺序显示。

## 添加新校区

当需要添加新校区时：

### 1. 更新排序规则

编辑 `frontend/utils/campusSort.ts`：

```tsx
// 添加到不带省份的列表
const CAMPUS_SORT_ORDER = [
  '盛邦',
  '冀美',
  '石美',
  '晋美',
  '原美',
  '太美',
  '桂美',
  '邕美',
  '黔美',
  '新校区', // 添加新校区
]

// 添加到带省份的列表
const CAMPUS_SORT_ORDER_WITH_PROVINCE = [
  '河北盛邦',
  '河北冀美',
  '河北石美',
  '山西晋美',
  '山西原美',
  '山西太美',
  '广西桂美',
  '广西邕美',
  '贵州黔美',
  '省份新校区', // 添加新校区
]
```

### 2. 更新标准校区列表

编辑 `frontend/utils/campusHelpers.ts`：

```tsx
export const getStandardCampusList = () => {
  const campuses = [
    // ... 现有校区
    { id: '省份新校区校区', name: '省份新校区校区' }, // 添加新校区
  ]
  
  return sortCampuses(campuses)
}
```

### 3. 更新 Store 的默认列表

编辑 `frontend/stores/campusStore.ts`，在 `CAMPUSES` 数组中添加新校区。

## 测试

运行测试以确保排序功能正常：

```bash
npm test -- campusSort.test.ts
```

## 常见问题

### Q: 为什么有些校区带省份，有些不带？

A: 生产环境和测试环境的校区配置都是带省份的。排序功能兼容两种格式，会自动识别并正确排序。

### Q: 新添加的校区会排在哪里？

A: 如果新校区在排序规则中，会按规则排序；如果不在规则中，会排在最后，并按字母顺序排列。

### Q: 如何修改排序顺序？

A: 编辑 `frontend/utils/campusSort.ts` 文件中的 `CAMPUS_SORT_ORDER` 和 `CAMPUS_SORT_ORDER_WITH_PROVINCE` 数组。

### Q: 排序功能会影响性能吗？

A: 不会。排序操作非常快速，对性能影响可以忽略不计。

## 相关文件

- `frontend/utils/campusSort.ts` - 核心排序逻辑
- `frontend/utils/campusHelpers.ts` - 校区辅助工具
- `frontend/stores/campusStore.ts` - 校区状态管理
- `frontend/components/common/CampusSelector.tsx` - 校区选择器组件
- `frontend/config/campusConfig.ts` - 校区配置

## 维护建议

1. **统一使用工具函数**：避免在代码中硬编码校区列表
2. **及时更新排序规则**：添加新校区时同步更新排序规则
3. **保持命名一致**：确保校区名称在整个系统中保持一致
4. **定期检查**：定期检查各个页面的校区排序是否正确
