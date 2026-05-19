# 校区排序功能 - 批量更新指南

## ✅ 已完成的核心功能

所有核心排序工具已经完成并测试通过：
- ✅ `frontend/utils/campusSort.ts` - 核心排序逻辑（26个测试全部通过）
- ✅ `frontend/utils/campusHelpers.ts` - 辅助工具函数
- ✅ `frontend/stores/campusStore.ts` - Store 自动排序
- ✅ `frontend/components/common/CampusSelector.tsx` - 选择器自动排序
- ✅ 示例页面已更新

## 📋 需要手动更新的文件清单

由于 Windows 命令行限制，需要手动更新以下文件。每个文件的更新方法都很简单。

### 🎯 一键更新方法（推荐）

大多数情况下，你只需要做以下两步：

#### 第一步：在文件顶部添加导入

```tsx
import { getAllCampuses } from '@/stores/campusStore'
import { sortCampuses } from '@/utils/campusSort'
```

#### 第二步：替换硬编码的校区列表

**替换前：**
```tsx
const campuses = [
  { id: '盛邦校区', name: '盛邦校区' },
  { id: '冀美校区', name: '冀美校区' },
  { id: '石美校区', name: '石美校区' },
  // ...
]
```

**替换后：**
```tsx
const campuses = getAllCampuses() // 已自动排序
```

---

## 📝 更新检查清单

使用此清单确保所有重要文件都已更新：

### 市场部
- [ ] `01-core-data-summary.tsx` ⚠️ **重要**
- [ ] `02-newmedia-data-summary.tsx`
- [ ] `03-sem-data-summary.tsx`
- [ ] `04-online-partner-data-summary.tsx`
- [ ] `05-market-reputation-data-summary.tsx`

### 教质部管理中心
- [x] `AllPages.tsx` ✅ 已完成
- [ ] `campus-level/2-employment-goals-results/index.tsx`
- [ ] `campus-level/3-contract-goals-results/index.tsx`
- [ ] `campus-level/4-reputation-summary/index.tsx`
- [ ] `campus-level/5-new-student-stability/index.tsx`
- [ ] `campus-level/6-promotion-plan/index.tsx`
- [ ] `campus-level/7-student-fluctuation/index.tsx`
- [ ] `campus-level/8-dormitory-statistics/index.tsx`
- [ ] `campus-level/9-enrollment-statistics/index.tsx`
- [ ] `campus-level/10-manager-analysis/index.tsx`
- [ ] `campus-level/11-training-plan-performance/index.tsx`
- [ ] `campus-level/12-teacher-ratio/index.tsx`
- [ ] `campus-level/13-recruitment-summary/index.tsx`

### 学术部管理中心
- [x] `1-core-summary/index.tsx` ✅ 已完成
- [ ] `campus-level/2-employment-goals-results/index.tsx`
- [ ] `campus-level/3-reputation-enrollment-goals-results/index.tsx`
- [ ] `campus-level/4-student-stability/index.tsx`
- [ ] `campus-level/5-teacher-staffing-ratio/teacher-staffing-ratio.tsx`
- [ ] `campus-level/7-training-summary/training-summary.tsx`
- [ ] `campus-level/9-enterprise-survey-summary/index.tsx`

## ✅ 验证更新的正确性

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 访问以下页面并检查校区顺序

校区应该按照以下顺序显示：
1. 盛邦（河北盛邦）
2. 冀美（河北冀美）
3. 石美（河北石美）
4. 晋美（山西晋美）
5. 原美（山西原美）
6. 太美（山西太美）
7. 桂美（广西桂美）
8. 邕美（广西邕美）
9. 黔美（贵州黔美）

### 3. 测试页面
- 市场部年度汇总页面
- 教质部管理中心页面
- 学术部核心汇总页面

### 4. 检查表格数据
确认表格中的校区行按照正确顺序排列
