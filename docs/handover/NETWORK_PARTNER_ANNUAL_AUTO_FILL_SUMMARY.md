# 网络合作伙伴年度数据自动填充功能实现总结

## 概述
实现了从"6 市场部网络合作伙伴日度数据表"自动聚合数据到年度数据看板的功能。

## 实现的功能

### 1. 后端API实现

#### 文件: `backend/app/api/v1/market/network_partner_annual.py`
创建了两个新的API接口:

**接口1: `/market/network-partner-annual/dashboard`**
- 功能: 获取01市场部网络合作伙伴年度数据看板
- 说明: 按月聚合所有合作伙伴的日度数据（排除汇总行）
- 参数:
  - `campus`: 校区名称
  - `year`: 年份
- 返回: 月度聚合数据(1-12月)，包含以下字段:
  - `actual_income`: 合作伙伴实际收入
  - `refund_count`: 退费数
  - `net_enrollment`: 净报名
  - `gross_enrollment`: 毛报总数
  - `order_count`: 订单数
  - `visit_count`: 上门人数
  - `actual_consult_volume`: 实际总咨询量
  - `actual_cost`: 实际消费

**接口2: `/market/network-partner-annual/dashboard-detail`**
- 功能: 获取02市场部网络合作伙伴年度数据看板明细
- 说明: 按月和合作伙伴聚合日度数据
- 参数:
  - `campus`: 校区名称
  - `year`: 年份
- 返回: 按月和合作伙伴分组的数据，支持5个合作伙伴:
  - 知了好学
  - 坦途网
  - 百教网
  - 厚学网
  - 91搜客

#### 文件: `backend/app/api/v1/market/__init__.py`
注册了新的路由模块 `network_partner_annual_router`

### 2. 前端服务层实现

#### 文件: `frontend/services/market/networkPartnerAnnual.ts`
创建了前端服务模块，提供两个方法:
- `getDashboard(campus, year)`: 调用年度数据看板API
- `getDashboardDetail(campus, year)`: 调用年度数据看板明细API

### 3. 前端组件更新

#### 文件: `frontend/pages/market/2-market-monthly-data/4-network-partner-breakdown/01-network-partner-dashboard.tsx`
**更新内容:**
1. 导入新的服务模块 `networkPartnerAnnualService`
2. 添加 `useEffect` 钩子，在校区或年份变化时自动加载数据
3. 数据加载逻辑:
   - 从API获取月度聚合数据
   - 填充到对应月份的行中
   - 自动重新计算公式字段（投产比、转化率、成本等）
   - 重新计算总计行

#### 文件: `frontend/pages/market/2-market-monthly-data/4-network-partner-breakdown/02-network-partner-dashboard.tsx`
**更新内容:**
1. 导入新的服务模块 `networkPartnerAnnualService`
2. 添加 `useEffect` 钩子，在校区或年份变化时自动加载数据
3. 数据加载逻辑:
   - 从API获取按月和合作伙伴分组的数据
   - 计算"全年"数据（汇总所有月份）
   - 填充到对应月份和合作伙伴的行中
   - 自动重新计算公式字段
   - 重新计算所有合计行（总合计、全年合计、月度合计）

## 数据流程

```
市场部网络合作伙伴日度数据表 (数据库)
    ↓
后端API聚合 (按月/按合作伙伴)
    ↓
前端服务层调用
    ↓
前端组件 useEffect 监听
    ↓
数据填充到表格
    ↓
自动计算公式字段
    ↓
重新计算汇总行
```

## 自动计算的字段

两个看板都会自动计算以下字段:

1. **投产比** = 合作伙伴实际收入 / 实际消费
2. **报名转化率** = 净报名 / 实际总量
3. **退费率** = 退费数 / 毛报总数
4. **报名进度** = 毛报总数 / 合作伙伴计划报名
5. **净成本** = 实际消费 / 净报名
6. **上门率** = 上门人数 / 实际总量
7. **咨询量完成进度** = 实际总量 / 合作伙伴计划咨询量
8. **咨询量成本** = 实际消费 / 实际总量

## 校区名称处理

后端API会自动处理不同格式的校区名称:
- 去除"河北"前缀
- 确保有"校区"后缀
- 例如: "河北盛邦校区" → "盛邦校区"

## 使用说明

1. **01市场部年度网络合作伙伴数据看板**
   - 切换校区或年份时，自动从日度数据表聚合数据
   - 显示每月汇总数据和年度总计
   - 用户仍可手动编辑"计划"相关字段

2. **02市场部年度网络合作伙伴数据看板明细**
   - 切换校区或年份时，自动从日度数据表聚合数据
   - 按合作伙伴显示每月详细数据
   - 自动计算全年汇总、月度合计和总合计
   - 用户仍可手动编辑"计划"相关字段

## 注意事项

1. 所有从日度数据聚合的字段都是自动填充的
2. "计划"相关字段(如"合作伙伴计划收入"、"合作伙伴计划报名"等)仍需要手动输入
3. 数据会在组件加载时和校区/年份变化时自动刷新
4. 计算字段会根据输入数据自动更新
5. 总计行会根据月度数据自动计算

## 技术要点

1. 使用 `useEffect` 实现数据自动加载
2. 使用 SQLAlchemy 的 `extract` 函数提取年份和月份
3. 使用 `func.sum` 进行数据聚合
4. 合作伙伴英文key到中文名称的映射转换
5. 前端状态管理确保数据一致性
