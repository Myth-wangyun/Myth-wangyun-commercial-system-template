# 校区排序更新清单

## ✅ 已更新的文件

1. ✅ `frontend/utils/campusSort.ts` - 核心排序工具
2. ✅ `frontend/utils/campusHelpers.ts` - 校区辅助工具
3. ✅ `frontend/stores/campusStore.ts` - Store 自动排序
4. ✅ `frontend/components/common/CampusSelector.tsx` - 校区选择器自动排序
5. ✅ `frontend/config/campusConfig.ts` - 配置文件自动排序
6. ✅ `frontend/pages/teaching-quality/mgnt/campus-level/1-02-01campus-core-data-summary/index.tsx` - 教质部示例页面
7. ✅ `frontend/pages/academic/mgnt/1-core-summary/index.tsx` - 学术部核心汇总
8. ✅ `frontend/pages/teaching-quality/mgnt/AllPages.tsx` - 教质部总页面

## 📋 需要更新的文件

### 市场部年度汇总（1-market-yearly-summary）

#### 管理中心数据汇总页面
1. ⚠️ `1-mgnt-center-data-summary/01-core-data-summary.tsx`
   - 第 80 行左右：硬编码的校区数组 `['盛邦', '竞美', '首关', '顺关', '胜美', '黔关', '息关']`
   - 需要替换为：`getAllCampuses()`

2. ⚠️ `1-mgnt-center-data-summary/02-newmedia-data-summary.tsx`
   - 检查是否有硬编码的校区数组

3. ⚠️ `1-mgnt-center-data-summary/03-sem-data-summary.tsx`
   - 检查是否有硬编码的校区数组

4. ⚠️ `1-mgnt-center-data-summary/04-online-partner-data-summary.tsx`
   - 检查是否有硬编码的校区数组

5. ⚠️ `1-mgnt-center-data-summary/05-market-reputation-data-summary.tsx`
   - 检查是否有硬编码的校区数组

#### 校区数据表页面
6. ⚠️ `2-campus/01-campuse-network-data-table.tsx`
7. ⚠️ `2-campus/02-newmedia-data-table.tsx`
8. ⚠️ `2-campus/03-sem-data-table.tsx`
9. ⚠️ `2-campus/04-online-partner-data-table.tsx`
10. ⚠️ `2-campus/05-market-reputation-data-table.tsx`

### 教质部其他页面（teaching-quality/mgnt）
11. ⚠️ `teaching-quality/mgnt/campus-level/2-employment-goals-results/index.tsx`
12. ⚠️ `teaching-quality/mgnt/campus-level/3-contract-goals-results/index.tsx`
13. ⚠️ `teaching-quality/mgnt/campus-level/4-reputation-summary/index.tsx`
14. ⚠️ `teaching-quality/mgnt/campus-level/5-new-student-stability/index.tsx`
15. ⚠️ `teaching-quality/mgnt/campus-level/6-promotion-plan/index.tsx`
16. ⚠️ `teaching-quality/mgnt/campus-level/7-student-fluctuation/index.tsx`
17. ⚠️ `teaching-quality/mgnt/campus-level/8-dormitory-statistics/index.tsx`
18. ⚠️ `teaching-quality/mgnt/campus-level/9-enrollment-statistics/index.tsx`
19. ⚠️ `teaching-quality/mgnt/campus-level/10-manager-analysis/index.tsx`
20. ⚠️ `teaching-quality/mgnt/campus-level/11-training-plan-performance/index.tsx`
21. ⚠️ `teaching-quality/mgnt/campus-level/12-teacher-ratio/index.tsx`
22. ⚠️ `teaching-quality/mgnt/campus-level/13-recruitment-summary/index.tsx`

### 学术部校区级页面（academic/mgnt/campus-level）
23. ⚠️ `academic/mgnt/campus-level/2-employment-goals-results/index.tsx`
24. ⚠️ `academic/mgnt/campus-level/3-reputation-enrollment-goals-results/index.tsx`
25. ⚠️ `academic/mgnt/campus-level/4-student-stability/index.tsx`
26. ⚠️ `academic/mgnt/campus-level/5-teacher-staffing-ratio/teacher-staffing-ratio.tsx`
27. ⚠️ `academic/mgnt/campus-level/7-training-summary/training-summary.tsx`
28. ⚠️ `academic/mgnt/campus-level/9-enterprise-survey-summary/index.tsx`

## 🔧 更新步骤

### 方法一：使用 CampusSelector（推荐）

如果页面使用 CampusSelector 组件，并且使用全局状态模式，则不需要任何更改：

```tsx
<CampusSelector useGlobalState />
```

### 方法二：使用 getEnvironmentCampusList

如果页面有自己的校区选择器：

```tsx
// 1. 添加导入
import { getEnvironmentCampusList } from '@/utils/campusHelpers'

// 2. 替换硬编码的校区列表
// 之前：
const campuses = [
  { id: '盛邦校区', name: '盛邦校区' },
  { id: '冀美校区', name: '冀美校区' },
  // ...
]

// 之后：
const campuses = getEnvironmentCampusList()
```

### 方法三：使用 getAllCampuses（已在 Store 中排序）

```tsx
// 1. 添加导入
import { useCampusStore } from '@/stores/campusStore'

// 2. 使用 Store 中的校区（已自动排序）
const { getAllCampuses } = useCampusStore()
const campuses = getAllCampuses()
```

### 方法四：对已有数组排序

如果页面需要处理已有的校区数组：

```tsx
// 1. 添加导入
import { sortCampuses } from '@/utils/campusSort'

// 2. 对数组排序
const sortedCampuses = sortCampuses(campuses)
// 或对对象数组排序
const sortedCampuses = sortCampuses(campuses, 'name')
```

## 🎯 具体更新示例

### 示例 1：市场部核心数据汇总页面

**文件**: `frontend/pages/market/1-market-yearly-summary/1-mgnt-center-data-summary/01-core-data-summary.tsx`

**位置**: 第 80 行左右

**之前**:
```tsx
const initialRows = useMemo<Row[]>(() => {
  const campuses = ['盛邦', '竞美', '首关', '顺关', '胜美', '黔关', '息关']
  return ['总计', ...campuses].map((c) => makeEmptyRow(c, c === '总计'))
}, [])
```

**之后**:
```tsx
// 在文件顶部添加导入
import { getAllCampuses } from '@/stores/campusStore'
import { normalizeCampusName } from '@/utils/campusSort'

// 修改 useMemo 部分
const initialRows = useMemo<Row[]>(() => {
  const allCampuses = getAllCampuses()
  const campusNames = allCampuses.map(c => normalizeCampusName(c.name))
  return ['总计', ...campusNames].map((c) => makeEmptyRow(c, c === '总计'))
}, [])
```

### 示例 2：教质部校区页面

**文件**: `frontend/pages/teaching-quality/mgnt/campus-level/2-employment-goals-results/index.tsx`

**之前**:
```tsx
const campuses = [
  { id: '盛邦校区', name: '盛邦校区' },
  { id: '冀美校区', name: '冀美校区' },
  // ...
]
```

**之后**:
```tsx
// 在文件顶部添加导入
import { getEnvironmentCampusList } from '@/utils/campusHelpers'

// 替换硬编码
const campuses = getEnvironmentCampusList()
```

## ✅ 验证步骤

更新完成后，请验证：

1. **检查排序顺序**: 校区应按照 盛邦→冀美→石美→晋美→原美→太美→桂美→邕美→黔美 的顺序显示

2. **检查兼容性**:
   - 带省份的校区名称（如：河北盛邦校区）应正确排序
   - 不带省份的校区名称（如：盛邦校区）应正确排序
   - 混合格式应正确排序

3. **检查表格显示**: 表格中的校区数据应按照排序后的顺序显示

4. **测试功能**:
   - 校区切换功能正常
   - 数据加载正常
   - 排序功能正常

## 📝 注意事项

1. **不要修改测试数据**: 如果文件中的校区数组是用于测试目的的，可以保留
2. **保持一致性**: 确保所有使用校区的地方都使用相同的排序规则
3. **性能考虑**: `sortCampuses` 函数性能很好，不需要担心性能问题
4. **类型安全**: TypeScript 类型会自动推导，无需额外类型声明

## 🚀 自动化更新脚本

如果需要批量更新，可以运行：

```bash
# 使用 Node.js 运行更新脚本
node scripts/update-campus-sorting.js
```

脚本会自动：
- 查找所有硬编码的校区数组
- 替换为使用工具函数
- 添加必要的导入语句
- 保持代码格式不变

## 📚 参考文档

- [校区排序使用指南](./campus-sorting-guide.md)
- [校区排序实现总结](./campus-sorting-implementation-summary.md)
