# 007财务收入页面数据源问题排查

## 问题现象
007财务收入页面的计划收入和计划招生数据显示为0，没有从市场部表读取数据。

## 问题原因
从后端日志可以看到：
```
INFO:app.api.v1.endpoints.consult.financial_income_refund:[财务收入API] 查询到 0 条记录
INFO:app.api.v1.endpoints.consult.financial_income_refund:[财务收入API] plan_map 最终结果: {}
```

**原因：市场部年度网络计划表中没有2026年的数据**

## 数据来源说明

根据数据类型，计划数据从不同的表读取：

### 1. SEM 和 新媒体
- **数据表**：`市场部网络计划表` (MarketNetworkPlan)
- **字段**：
  - SEM: `sem_plan_income`（计划收入）、`sem_plan_signup`（计划招生）
  - 新媒体: `newmedia_plan_income`（计划收入）、`newmedia_plan_signup`（计划招生）
- **查询条件**：
  - `year = '2026'`（字符串类型）
  - `campus = '校区名称'`（支持模糊匹配）
  - `month != 0`（排除总计行）

### 2. 市场口碑
- **数据表**：`市场部口碑月度计划表`
- **字段**：`plan_income`（计划收入）、`plan_enrollment`（计划招生）
- **查询条件**：
  - `year = '2026'`
  - `campus = '校区名称'`（支持模糊匹配）

### 3. 网络合作伙伴
- **数据表**：`市场部网络合作伙伴月度计划表`
- **字段**：`plan_income`（计划收入）、`plan_enrollment`（计划招生）
- **查询条件**：
  - `year = '2026'`
  - `campus = '校区名称'`（支持模糊匹配）
  - 按月份汇总

### 4. 其他数据类型（口碑、渠道、校区新媒体）
- **数据表**：`校区月度财务数据表`
- **字段**：`计划收入`、`计划招生`

## 解决方案

### 方案1：录入市场部计划数据（推荐）
1. 进入市场部数据录入页面
2. 录入2026年各校区的计划数据：
   - 市场部网络计划表（SEM和新媒体）
   - 市场部口碑月度计划表（市场口碑）
   - 市场部网络合作伙伴月度计划表（网络合作伙伴）

### 方案2：检查校区名称是否匹配
后端代码已经支持模糊匹配，但如果校区名称差异太大可能匹配不上。

**示例：**
- 如果表中是 "河北盛邦校区"
- 查询时用的是 "盛邦校区"
- 模糊匹配会自动找到对应数据

### 方案3：查看后端日志
后端已经添加了详细的调试日志，可以查看：
- 查询了哪个表
- 查询条件是什么
- 查询到多少条记录
- 是否使用了模糊匹配

**日志示例：**
```
INFO:app.api.v1.endpoints.consult.financial_income_refund:[财务收入API] 查询市场部年度网络计划表: year=2026, campus=盛邦校区, data_type=SEM
INFO:app.api.v1.endpoints.consult.financial_income_refund:[财务收入API] 精确匹配无结果，尝试模糊匹配
INFO:app.api.v1.endpoints.consult.financial_income_refund:[财务收入API] 模糊匹配成功，匹配到的校区名: 河北盛邦校区
INFO:app.api.v1.endpoints.consult.financial_income_refund:[财务收入API] 查询到 12 条记录
```

## 代码修改说明

已对以下端点添加了模糊匹配功能：
1. `/api/v1/consult/financial/combined-monthly-data-v2` - 007页面TAB2使用
2. `/api/v1/consult/financial/mgnt-core-summary` - 002页面TAB1使用
3. `/api/v1/consult/financial/mgnt-core-summary/all` - 002页面TAB1全部数据类型

**模糊匹配逻辑：**
- 先尝试精确匹配 `campus == '校区名称'`
- 如果没有结果，尝试模糊匹配 `campus LIKE '%校区名称%'`
- 日志会显示是否使用了模糊匹配以及匹配到的校区名

## 验证步骤

1. **重启后端服务**（如果还没重启）
2. **打开浏览器开发者工具**（F12）
3. **访问007财务收入页面**
4. **查看Network标签**，找到API请求：
   - `/api/v1/consult/financial/combined-monthly-data-v2?year=2026&campus=xxx&data_type=SEM`
5. **查看后端控制台日志**，确认：
   - 是否查询了市场部表
   - 查询到多少条记录
   - plan_map的内容是什么

## 下一步

如果确认市场部表中没有数据，需要：
1. 找到市场部数据录入的入口
2. 录入2026年各校区的计划数据
3. 刷新007页面验证数据是否正确显示

