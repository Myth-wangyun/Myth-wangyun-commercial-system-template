# 小红书平台数据分析页面更新说明

## 更新时间
2026年1月28日

## 更新内容

### 1. 校区名称映射 ✅
**前端显示名称 → 数据库完整名称**:
- 盛邦 → 河北盛邦校区
- 冀美 → 河北冀美校区
- 晋美 → 山西晋美校区
- 太美 → 山西太美校区
- 原美 → 山西原美校区
- 桂美 → 广西桂美校区
- 黔美 → 贵州黔美校区

**实现方式**:
```typescript
const campusMapping: Record<string, string> = {
  '盛邦': '河北盛邦校区',
  '冀美': '河北冀美校区',
  '晋美': '山西晋美校区',
  '太美': '山西太美校区',
  '原美': '山西原美校区',
  '桂美': '广西桂美校区',
  '黔美': '贵州黔美校区',
}
```

前端表格显示简称,查询API时使用完整的数据库名称。

### 2. 数据源改造 ✅
- **原来**: 使用静态模拟数据 (mockAnalysisData)
- **现在**: 从市场部新媒体日度数据表的小红书部分实时读取数据
- **数据来源**: `/market/xiaohongshu-daily-data` API
- **支持校区**: 7个校区(盛邦、冀美、晋美、太美、原美、桂美、黔美)

### 3. 可编辑字段 ✅
将以下两个字段改为可手动填写:
- **小红书计划消费** (plannedSales)
- **小红书计划收入** (plannedIncome)

**实现方式**:
- 使用 `InputNumber` 组件替换原来的只读显示
- 支持实时编辑,输入后自动重新计算相关指标
- 最小值限制为 0

### 4. UI优化 ✅
- **删除重置按钮**: 移除了原有的"重置"按钮功能
- **保留导出按钮**: 保留了"导出"功能按钮
- **保持样式不变**: 表格样式、布局、颜色等完全保持原样

### 5. 数据计算逻辑

#### 从API获取的数据字段:
- `consumption` → 实际消费 (actualSales)
- `display_count` → 展现量 (impressions)
- `click_count` → 点击量 (clicks)
- `private_message_count` → 私信留资数 (retention)
- `effective_consult_count` → 实际咨询量 (actualConsultation)
- `visit_count` → 上门人数 (visitingPeople)
- `net_signup` → 实际报名 (actualRegistration)
- `actual_income` → 小红书实际收入 (actualIncome)

#### 自动计算的指标:
- **点击率** = (点击量 / 展现量) × 100%
- **平均点击成本** = 实际消费 / 点击量
- **咨询量成本** = 实际消费 / 实际咨询量
- **报名转化率** = (实际报名 / 实际咨询量) × 100%
- **实际报名成本** = 实际消费 / 实际报名
- **业绩完成率** = (实际收入 / 计划收入) × 100%
- **投产比** = 实际收入 / 实际消费

### 6. 功能特性

#### 日期范围筛选
- 支持自定义日期范围选择
- 提供预设快捷选项:今天、本周、本月、上月、最近7/30/90天等
- 根据选择的日期范围自动过滤和聚合数据

#### 数据加载
- 使用 `useEffect` 监听日期范围和可编辑数据的变化
- 自动异步加载各校区数据
- 支持加载状态显示 (loading)
- 错误处理和提示

#### 数据聚合
- 按校区分别聚合日期范围内的所有日度数据
- 自动计算"合计"行的总和
- 实时响应计划数据的修改

### 7. 技术实现

#### 新增依赖
```typescript
import { xiaohongshuDailyDataService } from '@/services/market/marketXiaohongshuDailyData'
import { InputNumber, message } from 'antd'
```

#### 状态管理
```typescript
const [loading, setLoading] = useState(false)
const [analysisData, setAnalysisData] = useState<XiaohongshuAnalysisData[]>([])
const [editableData, setEditableData] = useState<Record<string, { plannedSales?: number; plannedIncome?: number }>>({})
```

#### 核心函数
- `loadData()`: 异步加载和聚合数据
- `handlePlannedSalesChange()`: 处理计划消费编辑
- `handlePlannedIncomeChange()`: 处理计划收入编辑

### 8. 数据流程

```
用户选择日期范围
    ↓
触发 loadData()
    ↓
使用 campusMapping 转换校区名称
    ↓
并发请求各校区数据(使用完整数据库名称)
    ↓
过滤日期范围内的数据
    ↓
聚合计算各项指标
    ↓
更新 analysisData 状态(使用简称显示)
    ↓
表格自动重新渲染
```

### 9. 注意事项

1. **日期过滤**: 使用 dayjs 的 `isAfter`、`isBefore`、`isSame` 方法进行日期比较
2. **API响应**: 访问数据通过 `response.data?.items` 确保安全访问
3. **错误处理**: 单个校区数据加载失败不影响其他校区
4. **计算精度**: 所有比率保留2位小数
5. **除零保护**: 计算前检查分母,避免除零错误,显示 `#DIV/0!`
6. **校区名称**: 查询使用完整名称,显示使用简称

### 10. 校区列表更新

**原校区列表**: 盛邦、冀美、晋美、原美、桂美、黔美、邕美 (7个)
**新校区列表**: 盛邦、冀美、晋美、太美、原美、桂美、黔美 (7个)

**变更**: 移除"邕美",新增"太美"

### 11. 待优化项

- [ ] 导出功能的实际实现
- [ ] 计划数据的持久化存储
- [ ] 数据概览卡片的实时数据更新
- [ ] 添加数据保存按钮
- [ ] 加载失败时的友好提示

## 文件修改清单

- ✅ `frontend/pages/market/3-new-media-phase-report/5-XiaohongshuPlatformAnalysis.tsx` - 主要修改文件
- ✅ 已确认 `frontend/services/market/marketXiaohongshuDailyData.ts` 服务可用

## 测试建议

1. ✅ 验证校区名称映射是否正确
2. ✅ 验证日期范围选择功能
3. ✅ 测试各校区数据加载(使用完整数据库名称)
4. ✅ 验证计划消费和计划收入的编辑功能
5. ✅ 检查各项指标计算的准确性
6. ✅ 测试边界情况(空数据、除零等)
7. ✅ 确认表格显示的是简称而非完整名称

## 关键代码示例

### 校区名称映射使用
```typescript
// 遍历显示名称
campusList.map(async (campusDisplayName) => {
  // 获取数据库完整名称
  const campusDbName = campusMapping[campusDisplayName]
  
  // 使用完整名称查询API
  const response = await xiaohongshuDailyDataService.list(campusDbName, month)
  
  // 返回时使用显示名称
  return {
    campus: campusDisplayName,  // 前端显示用
    ...data
  }
})
```

这样确保了:
- API查询使用正确的数据库完整名称
- 前端表格显示友好的简称
- 数据映射关系清晰可维护
