# 002页面数据来源修改计划

## 修改目标
修改002页面标签页部分的校区表（前两个表）的计划收入和计划招生数据来源，使其从市场部表读取。

## 需要修改的文件

### TAB1CampusCoreData 目录下的文件

以下文件需要修改：

1. **3SEMDataDashboard.tsx** - SEM数据看板
2. **4NewMediaDataDashboard.tsx** - 新媒体数据看板
3. **5MarketReputationDashboard.tsx** - 市场口碑数据看板
4. **6PartnershipDashboard.tsx** - 合作伙伴数据看板
5. **7ReputationDashboard.tsx** - 口碑数据看板
6. **8ChannelDashboard.tsx** - 渠道数据看板
7. **9CampusNewMediaDashboard.tsx** - 校区新媒体数据看板

### 修改步骤

#### 步骤1：修改import语句

**原代码：**
```typescript
import { getCampusMonthlyData } from '@/pages/consult/004mgmt-data/007-financial-income/api'
```

**修改为：**
```typescript
import { getCombinedMonthlyDataV2 } from '@/pages/consult/004mgmt-data/007-financial-income/api'
```

#### 步骤2：修改API调用

**原代码：**
```typescript
const planResult = await getCampusMonthlyData({ 
  year: yearNum, 
  campus, 
  data_type: 'SEM'  // 或其他数据类型
}).catch(() => null)
```

**修改为：**
```typescript
const planResult = await getCombinedMonthlyDataV2({ 
  year: yearNum, 
  campus, 
  data_type: 'SEM'  // 或其他数据类型
}).catch(() => null)
```

#### 步骤3：修改数据提取逻辑

**原代码：**
```typescript
const planByMonth: Record<number, { 计划收入: number; 计划招生: number }> = {}
if (planResult?.月度数据) {
  planResult.月度数据.forEach((md: any) => {
    const planIncome = md.计划收入 ? Number(md.计划收入) : 0
    const planEnroll = md.计划招生 ? Number(md.计划招生) : 0
    planByMonth[md.月份] = { 
      计划收入: isNaN(planIncome) ? 0 : planIncome, 
      计划招生: isNaN(planEnroll) ? 0 : planEnroll 
    }
  })
}
```

**修改为：**
```typescript
const planByMonth: Record<number, { 计划收入: number; 计划招生: number }> = {}
if (planResult?.success && planResult?.data?.月度数据) {
  planResult.data.月度数据.forEach((md: any) => {
    const planIncome = md.计划收入 ? Number(md.计划收入) : 0
    const planEnroll = md.计划招生 ? Number(md.计划招生) : 0
    planByMonth[md.月份] = { 
      计划收入: isNaN(planIncome) ? 0 : planIncome, 
      计划招生: isNaN(planEnroll) ? 0 : planEnroll 
    }
  })
}
```

**关键变化：**
- `getCombinedMonthlyDataV2` 返回的数据结构是 `{ success: boolean, data: { 月度数据: [...] } }`
- 需要先检查 `planResult?.success`，然后访问 `planResult.data.月度数据`

## 数据来源说明

修改后，各数据类型的计划数据来源如下：

| 数据类型 | 计划数据来源 |
|---------|------------|
| SEM | 市场部年度网络计划表 |
| 新媒体 | 市场部年度网络计划表 |
| 市场口碑 | 市场部口碑月度计划表 |
| 网络合作伙伴 | 市场部网络合作伙伴月度计划表 |
| 口碑 | 校区月度财务数据表 |
| 渠道 | 校区月度财务数据表 |
| 校区新媒体 | 校区月度财务数据表 |

## 验证步骤

修改完成后：

1. 重启前端开发服务器
2. 访问002页面
3. 切换到各个数据类型的TAB
4. 检查计划收入和计划招生是否正确显示
5. 打开浏览器开发者工具，查看Network标签，确认调用的是 `combined-monthly-data-v2` API
6. 查看后端日志，确认是否从市场部表读取数据

## 注意事项

1. **只修改计划数据的获取方式**，实际数据（实际收入、实际招生等）的获取方式不变
2. **保持其他逻辑不变**，只修改API调用和数据提取部分
3. **确保数据类型参数正确**，每个看板对应的data_type要匹配
4. **测试所有数据类型**，确保SEM、新媒体、市场口碑、网络合作伙伴等都能正确显示

## 完整示例

以下是 `3SEMDataDashboard.tsx` 的完整修改示例：

### 修改前（第11行）：
```typescript
import { getCampusMonthlyData } from '@/pages/consult/004mgmt-data/007-financial-income/api'
```

### 修改后：
```typescript
import { getCombinedMonthlyDataV2 } from '@/pages/consult/004mgmt-data/007-financial-income/api'
```

### 修改前（第95-97行）：
```typescript
const [planResult, result, semCostData] = await Promise.all([
  getCampusMonthlyData({ year: yearNum, campus, data_type: 'SEM' }).catch(() => null),
  statsApi.getMonthlyCampusSummary({ 年份: yearNum, 校区: campus, 分类: 'SEM' }).catch(() => null),
```

### 修改后：
```typescript
const [planResult, result, semCostData] = await Promise.all([
  getCombinedMonthlyDataV2({ year: yearNum, campus, data_type: 'SEM' }).catch(() => null),
  statsApi.getMonthlyCampusSummary({ 年份: yearNum, 校区: campus, 分类: 'SEM' }).catch(() => null),
```

### 修改前（第104-113行）：
```typescript
const planByMonth: Record<number, { 计划收入: number; 计划招生: number }> = {}
if (planResult?.月度数据) {
  planResult.月度数据.forEach((md: any) => {
    const planIncome = md.计划收入 ? Number(md.计划收入) : 0
    const planEnroll = md.计划招生 ? Number(md.计划招生) : 0
    planByMonth[md.月份] = { 
      计划收入: isNaN(planIncome) ? 0 : planIncome, 
      计划招生: isNaN(planEnroll) ? 0 : planEnroll 
    }
  })
}
```

### 修改后：
```typescript
const planByMonth: Record<number, { 计划收入: number; 计划招生: number }> = {}
if (planResult?.success && planResult?.data?.月度数据) {
  planResult.data.月度数据.forEach((md: any) => {
    const planIncome = md.计划收入 ? Number(md.计划收入) : 0
    const planEnroll = md.计划招生 ? Number(md.计划招生) : 0
    planByMonth[md.月份] = { 
      计划收入: isNaN(planIncome) ? 0 : planIncome, 
      计划招生: isNaN(planEnroll) ? 0 : planEnroll 
    }
  })
}
```

## 其他文件的修改

其他文件（4NewMediaDataDashboard.tsx、5MarketReputationDashboard.tsx等）的修改方式完全相同，只需要：
1. 修改import语句
2. 修改API调用
3. 修改数据提取逻辑（添加 `success` 检查和 `data.` 前缀）

每个文件的data_type参数要对应正确：
- 3SEMDataDashboard.tsx → 'SEM'
- 4NewMediaDataDashboard.tsx → '新媒体'
- 5MarketReputationDashboard.tsx → '市场口碑'
- 6PartnershipDashboard.tsx → '网络合作伙伴'
- 7ReputationDashboard.tsx → '口碑'
- 8ChannelDashboard.tsx → '渠道'
- 9CampusNewMediaDashboard.tsx → '校区新媒体'

