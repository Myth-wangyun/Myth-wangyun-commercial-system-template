# 002页面数据来源修改完成总结

## 修改内容

已成功修改002页面标签页部分的校区表（前两个表）的计划收入和计划招生数据来源。

## 修改的文件

### 1. GenericSourceDashboard.tsx
**文件路径：** `frontend/pages/consult/002-campus-yearly-monthly-media-source/002-media-source-yearly/components/GenericSourceDashboard.tsx`

**修改点：**

#### 修改1：导入语句（第28行）
```typescript
// 修改前
import { getAllCampusYearlyPlanSummary as getCampusYearlyPlanSummary, getCampusMonthlyData } from '@/pages/consult/004mgmt-data/007-financial-income/api'

// 修改后
import { getAllCampusYearlyPlanSummary as getCampusYearlyPlanSummary, getCombinedMonthlyDataV2 } from '@/pages/consult/004mgmt-data/007-financial-income/api'
```

#### 修改2：API调用（约第265行）
```typescript
// 修改前
getCampusMonthlyData({ year: yearNum, campus: currentCampus, data_type: 财务数据类型 }).catch((err) => {
  console.error(`获取${财务数据类型}校区月度计划数据失败:`, err)
  return null
}),

// 修改后
getCombinedMonthlyDataV2({ year: yearNum, campus: currentCampus, data_type: 财务数据类型 }).catch((err) => {
  console.error(`获取${财务数据类型}校区月度计划数据失败:`, err)
  return null
}),
```

#### 修改3：数据检查逻辑（约第330行）
```typescript
// 修改前
} else if (!campusMonthlyPlanData || !campusMonthlyPlanData.月度数据 || campusMonthlyPlanData.月度数据.length === 0) {
  console.warn(`⚠️ 未获取到${currentCampus}${yearNum}年${财务数据类型}的月度计划数据，请在"007财务收入"页面录入`)
}

// 修改后
} else if (!campusMonthlyPlanData?.success || !campusMonthlyPlanData?.data?.月度数据 || campusMonthlyPlanData.data.月度数据.length === 0) {
  console.warn(`⚠️ 未获取到${currentCampus}${yearNum}年${财务数据类型}的月度计划数据，请在"007财务收入"页面录入`)
}
```

#### 修改4：数据提取逻辑（约第580行）
```typescript
// 修改前
} else if (campusMonthlyPlanData && campusMonthlyPlanData.月度数据 && monthNum > 0) {
  // 其他类型：从校区月度财务数据获取
  const planRow = campusMonthlyPlanData.月度数据.find((r: any) => r.月份 === monthNum)
  if (planRow) {
    campusPlanIncome = planRow.计划收入 ? Number(planRow.计划收入) : null
    campusPlanEnroll = planRow.计划招生 ? Number(planRow.计划招生) : null
    console.log(`🔍 月份 ${monthNum} 从校区月度财务数据获取:`, { campusPlanIncome, campusPlanEnroll })
  }
}

// 修改后
} else if (campusMonthlyPlanData?.success && campusMonthlyPlanData?.data?.月度数据 && monthNum > 0) {
  // 其他类型：从校区月度财务数据获取
  const planRow = campusMonthlyPlanData.data.月度数据.find((r: any) => r.月份 === monthNum)
  if (planRow) {
    campusPlanIncome = planRow.计划收入 ? Number(planRow.计划收入) : null
    campusPlanEnroll = planRow.计划招生 ? Number(planRow.计划招生) : null
    console.log(`🔍 月份 ${monthNum} 从校区月度财务数据获取:`, { campusPlanIncome, campusPlanEnroll })
  }
}
```

## 数据来源说明

修改后，002页面各数据类型的计划数据来源如下：

| 数据类型 | 计划数据来源 | 说明 |
|---------|------------|------|
| SEM（网络） | 市场部年度网络计划表 | 通过`getCombinedMonthlyDataV2` API自动从市场部表读取 |
| 新媒体 | 市场部年度网络计划表 | 通过`getCombinedMonthlyDataV2` API自动从市场部表读取 |
| 市场口碑 | 市场部口碑月度计划表 | 通过`getCombinedMonthlyDataV2` API自动从市场部表读取 |
| 网络合作伙伴 | 市场部网络合作伙伴月度计划表 | 通过`getCombinedMonthlyDataV2` API自动从市场部表读取 |
| 口碑 | 校区月度财务数据表 | 通过`getCombinedMonthlyDataV2` API读取（保持原有逻辑） |
| 渠道 | 校区月度财务数据表 | 通过`getCombinedMonthlyDataV2` API读取（保持原有逻辑） |
| 校区新媒体 | 校区月度财务数据表 | 通过`getCombinedMonthlyDataV2` API读取（保持原有逻辑） |

## 关键变化

1. **API更换**：从`getCampusMonthlyData`改为`getCombinedMonthlyDataV2`
2. **数据结构适配**：新API返回`{ success: boolean, data: { 月度数据: [...] } }`格式，需要通过`campusMonthlyPlanData.data.月度数据`访问
3. **后端逻辑**：后端`getCombinedMonthlyDataV2`会根据数据类型自动从不同的市场部表读取计划数据
4. **模糊匹配**：后端已支持校区名称模糊匹配，即使校区名称不完全一致也能找到数据

## 影响范围

### 修改的表格
1. **子表1：年度核心数据看板汇总（按校区）** - 计划收入、计划招生
2. **子表2：月度数据表（按月份）** - 计划收入、计划招生

### 不受影响的数据
- 实际收入、实际招生、退费人数等实际数据仍然从咨询量录入系统读取
- 转化率、招生成本等计算字段保持不变
- 咨询师汇总表和咨询师月度明细表的逻辑不变

## 验证步骤

1. **重启前端开发服务器**（如果需要）
2. **访问002页面**
3. **切换到各个数据类型的TAB**（SEM、新媒体、市场口碑、网络合作伙伴等）
4. **检查前两个表格**：
   - 年度核心数据看板汇总（按校区）
   - 月度数据表（按月份）
5. **验证计划收入和计划招生是否正确显示**
6. **打开浏览器开发者工具（F12）**：
   - 查看Network标签，确认调用的是`combined-monthly-data-v2` API
   - 查看Console标签，确认没有错误
7. **查看后端日志**：
   - 确认是否从市场部表读取数据
   - 确认是否使用了模糊匹配
   - 确认查询到的记录数

## 注意事项

1. **数据录入**：如果市场部表中没有数据，需要先在市场部数据录入页面添加计划数据
2. **校区名称**：后端已支持模糊匹配，但建议保持校区名称一致
3. **年份格式**：市场部表中的年份字段是字符串类型（如"2026"）
4. **数据同步**：007页面和002页面现在使用相同的数据源，数据会自动同步

## 与007页面的关系

- **007页面**：已在之前修改完成，使用`getCombinedMonthlyDataV2` API
- **002页面**：本次修改完成，使用相同的`getCombinedMonthlyDataV2` API
- **数据一致性**：两个页面现在使用相同的数据源，确保数据一致

## 后续工作

如果需要修改其他页面或组件，可以参考本次修改的模式：
1. 将`getCampusMonthlyData`改为`getCombinedMonthlyDataV2`
2. 修改数据提取逻辑，添加`success`检查和`data.`前缀
3. 测试验证数据是否正确显示

## 完成状态

✅ 007页面修改完成  
✅ 002页面标签页部分（前两个表）修改完成  
✅ 后端API支持模糊匹配  
✅ 数据来源已切换到市场部表

