# 校区排序功能实现总结

## 完成情况

✅ **已完成** - 校区排序功能已成功实现并通过所有测试

## 实现内容

### 1. 核心排序工具 (`frontend/utils/campusSort.ts`)

实现了以下功能：

- ✅ `getCampusSortIndex()` - 获取校区的排序索引
- ✅ `sortCampuses()` - 对校区数组进行排序（支持字符串和对象数组）
- ✅ `getSortedCampusNames()` - 获取排序后的校区名称列表
- ✅ `getSortedCampusOptions()` - 获取排序后的选项列表（用于 Select 组件）
- ✅ `normalizeCampusName()` - 标准化校区名称（移除省份前缀）
- ✅ `isSameCampus()` - 比较两个校区是否相同（忽略省份）

### 2. 校区辅助工具 (`frontend/utils/campusHelpers.ts`)

提供了便捷的校区列表获取函数：

- ✅ `getStandardCampusList()` - 获取带省份的标准校区列表
- ✅ `getSimpleCampusList()` - 获取不带省份的简化校区列表
- ✅ `getEnvironmentCampusList()` - 根据环境自动选择校区列表
- ✅ `campusListToOptions()` - 将校区列表转换为 Select 组件的 options 格式

### 3. 更新的组件和 Store

- ✅ `frontend/stores/campusStore.ts` - 在 `getAllCampuses()` 和 `getFilteredCampuses()` 中应用排序
- ✅ `frontend/components/common/CampusSelector.tsx` - 在受控模式下自动排序校区列表
- ✅ `frontend/config/campusConfig.ts` - 在 `getCampusOptions()` 中应用排序

### 4. 示例页面更新

- ✅ `frontend/pages/teaching-quality/mgnt/campus-level/1-02-01campus-core-data-summary/index.tsx` - 使用 `getEnvironmentCampusList()` 替代硬编码列表

### 5. 测试和文档

- ✅ `frontend/utils/__tests__/campusSort.test.ts` - 26 个测试用例全部通过
- ✅ `docs/campus-sorting-guide.md` - 完整的使用指南

## 排序规则

### 标准排序顺序

1. 河北盛邦 / 盛邦
2. 河北冀美 / 冀美
3. 河北石美 / 石美
4. 山西晋美 / 晋美
5. 山西原美 / 原美
6. 山西太美 / 太美
7. 广西桂美 / 桂美
8. 广西邕美 / 邕美
9. 贵州黔美 / 黔美

### 兼容性特性

- ✅ 支持带省份的校区名称（如：河北盛邦校区）
- ✅ 支持不带省份的校区名称（如：盛邦校区）
- ✅ 支持混合格式（同时存在带省份和不带省份的校区）
- ✅ 未在规则中的校区会排在最后，并按字母顺序排列
- ✅ 不修改原数组，返回新的排序数组

## 测试结果

```
✓ frontend/utils/__tests__/campusSort.test.ts (26 tests) 16ms
  ✓ 校区排序功能测试 (26)
    ✓ getCampusSortIndex (4)
    ✓ sortCampuses - 字符串数组 (5)
    ✓ sortCampuses - 对象数组 (3)
    ✓ getSortedCampusNames (1)
    ✓ getSortedCampusOptions (1)
    ✓ normalizeCampusName (3)
    ✓ isSameCampus (3)
    ✓ 完整排序测试 (2)
    ✓ 边界情况测试 (4)

Test Files  1 passed (1)
     Tests  26 passed (26)
```

## 使用示例

### 在组件中使用

```tsx
import { getEnvironmentCampusList } from '@/utils/campusHelpers'
import CampusSelector from '@/components/common/CampusSelector'

// 获取排序后的校区列表
const campuses = getEnvironmentCampusList()

// 使用 CampusSelector 组件（自动排序）
<CampusSelector
  value={selectedCampus}
  onChange={setSelectedCampus}
  campuses={campuses}
/>
```

### 对自定义数组排序

```tsx
import { sortCampuses } from '@/utils/campusSort'

// 对字符串数组排序
const sorted = sortCampuses(['晋美校区', '盛邦校区', '冀美校区'])
// 结果: ['盛邦校区', '冀美校区', '晋美校区']

// 对对象数组排序
const campuses = [
  { id: '3', name: '晋美校区' },
  { id: '1', name: '盛邦校区' },
]
const sorted = sortCampuses(campuses)
```

## 需要后续更新的页面

以下页面仍需要更新以使用统一的排序功能：

### 市场部管理中心
- [ ] `/market/1-market-yearly-summary/1-mgnt-center-data-summary/*`
- [ ] `/market/2-market-monthly-data/1-campus/*`
- [ ] 其他市场部汇总页面

### 教质部管理中心
- [x] `/teaching-quality/mgnt/campus-level/1-02-01campus-core-data-summary/` ✅
- [ ] `/teaching-quality/mgnt/campus-level/2-employment-goals-results/`
- [ ] `/teaching-quality/mgnt/campus-level/3-contract-goals-results/`
- [ ] 其他教质部校区级页面

### 学术部管理中心
- [ ] `/academic/mgnt/campus-level/*`
- [ ] 其他学术部汇总页面

## 更新步骤

对于每个需要更新的页面：

1. 导入工具函数：
   ```tsx
   import { getEnvironmentCampusList } from '@/utils/campusHelpers'
   ```

2. 替换硬编码的校区列表：
   ```tsx
   // 之前
   const campuses = [
     { id: '盛邦校区', name: '盛邦校区' },
     { id: '冀美校区', name: '冀美校区' },
     // ...
   ]
   
   // 之后
   const campuses = getEnvironmentCampusList()
   ```

3. 验证排序是否正确

## 添加新校区

当需要添加新校区时：

1. 更新 `frontend/utils/campusSort.ts` 中的排序规则
2. 更新 `frontend/utils/campusHelpers.ts` 中的标准校区列表
3. 更新 `frontend/stores/campusStore.ts` 中的默认校区列表
4. 运行测试确保功能正常

## 技术亮点

1. **类型安全**：使用 TypeScript 泛型支持不同类型的数组排序
2. **不可变性**：排序函数不修改原数组，返回新数组
3. **灵活性**：支持字符串数组和对象数组，支持自定义字段名
4. **兼容性**：兼容带省份和不带省份的校区名称
5. **可扩展性**：易于添加新校区和修改排序规则
6. **测试覆盖**：26 个测试用例覆盖各种场景

## 相关文件

- `frontend/utils/campusSort.ts` - 核心排序逻辑
- `frontend/utils/campusHelpers.ts` - 校区辅助工具
- `frontend/utils/__tests__/campusSort.test.ts` - 测试文件
- `frontend/stores/campusStore.ts` - 校区状态管理
- `frontend/components/common/CampusSelector.tsx` - 校区选择器组件
- `frontend/config/campusConfig.ts` - 校区配置
- `docs/campus-sorting-guide.md` - 使用指南

## 总结

校区排序功能已经成功实现并集成到系统中。所有核心功能都经过了充分的测试，确保了代码的质量和可靠性。现在可以在整个系统中使用统一的校区排序规则，确保市场部、教质部、学术部的管理中心都能按照相同的顺序显示校区列表。

后续只需要将其他页面中硬编码的校区列表替换为使用工具函数即可。
