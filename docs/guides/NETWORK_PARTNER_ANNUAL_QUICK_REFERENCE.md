# 网络合作伙伴年度数据自动填充 - 快速参考

## 新增文件

### 后端
- `backend/app/api/v1/market/network_partner_annual.py` - 年度数据聚合API

### 前端
- `frontend/services/market/networkPartnerAnnual.ts` - 年度数据服务

## 修改文件

### 后端
- `backend/app/api/v1/market/__init__.py` - 添加路由注册

### 前端
- `frontend/pages/market/2-market-monthly-data/4-network-partner-breakdown/01-network-partner-dashboard.tsx` - 添加自动加载逻辑
- `frontend/pages/market/2-market-monthly-data/4-network-partner-breakdown/02-network-partner-dashboard.tsx` - 添加自动加载逻辑

## API端点

### GET /api/v1/market/network-partner-annual/dashboard
获取年度数据看板(按月聚合所有合作伙伴)

**参数:**
- `campus` (string): 校区名称
- `year` (string): 年份

**返回:**
```typescript
{
  success: boolean
  data: {
    [month: number]: {
      actual_income: number
      refund_count: number
      net_enrollment: number
      gross_enrollment: number
      order_count: number
      visit_count: number
      actual_consult_volume: number
      actual_cost: number
    }
  }
}
```

### GET /api/v1/market/network-partner-annual/dashboard-detail
获取年度数据看板明细(按月和合作伙伴聚合)

**参数:**
- `campus` (string): 校区名称
- `year` (string): 年份

**返回:**
```typescript
{
  success: boolean
  data: {
    [month: number]: {
      [partner: string]: {
        partner_actual_income: number
        refund_count: number
        net_enrollment: number
        gross_enrollment: number
        order_count: number
        visit_count: number
        actual_consult_volume: number
        actual_cost: number
      }
    }
  }
}
```

## 合作伙伴映射

数据库key → 显示名称:
- `zhiliao` → 知了好学
- `tantu` → 坦途网
- `baijiao` → 百教网
- `houxue` → 厚学网
- `jiuyisouke` → 91搜客

## 数据来源

从"市场部网络合作伙伴日度数据表"聚合,排除 `合作伙伴='summary'` 的汇总行。

## 自动填充字段

以下字段从日度数据自动聚合:
- 合作伙伴实际收入 (actualIncome / partner_actual_income)
- 退费数 (refundCount)
- 净报名 (netEnrollment)
- 毛报总数 (grossEnrollment)
- 订单数 (orderCount)
- 上门人数 (visitCount)
- 实际总咨询量 (actualConsultVolume)
- 实际消费 (actualCost)

## 计划字段

以下字段仍需手动输入:
- 合作伙伴计划收入 (planIncome)
- 合作伙伴计划报名 (planEnrollment)
- 合作伙伴计划咨询量 (planConsultVolume)
- 合作伙伴计划消费 (planCost)

## 自动计算字段

以下字段根据输入自动计算:
- 投产比 = 实际收入 / 实际消费
- 报名转化率 = 净报名 / 实际总量
- 退费率 = 退费数 / 毛报总数
- 报名进度 = 毛报总数 / 计划报名
- 净成本 = 实际消费 / 净报名
- 上门率 = 上门人数 / 实际总量
- 咨询量完成进度 = 实际总量 / 计划咨询量
- 咨询量成本 = 实际消费 / 实际总量

## 触发数据加载的时机

1. 组件首次挂载
2. 校区切换时
3. 年份切换时

## 相关文档

- 实现总结: `../handover/NETWORK_PARTNER_ANNUAL_AUTO_FILL_SUMMARY.md`
- 测试指南: `NETWORK_PARTNER_ANNUAL_TEST_GUIDE.md`
