/**
 * 神殿月度全平台综合数据核心数据看板
 * 按月份展示SEM+新媒体+市场口碑+合作伙伴+口碑+渠道+神殿新媒体数据
 * 数据来源：咨询量明细表（全平台汇总，不按量来源筛选）
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App, Table, Spin, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { NoCopyContainer } from '@/components/common'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'
import { getCampusMonthlyData } from '@/pages/consult/004mgmt-data/007-financial-income/api'
import * as marketCostService from '@/services/consult/marketCost'
import * as consultantPlanService from '@/services/consult/consultantPlan'
import api from '@/services/api'

interface SEMComprehensiveRow {
  key: string
  月份: number | string
  神殿: string
  isTotal: boolean
  // 全平台招生收入
  计划收入: number | null
  实际收入: number | null
  // 全平台招生数据
  计划招生: number | null
  实际招生: number | null
  退费人数: number | null
  上门总量: number | null
  电话量: number | null
  咨询总量: number | null
  // 全平台转化率
  报名转化率: string
  当面转化率: string
  上门率: string
  // 全平台招生成本
  费用投入: number | null
  招生成本: string
}

interface Props {
  year: string
  campus: string
}

export default function SEMComprehensiveTable({ year, campus }: Props) {
  const { message } = App.useApp()
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<SEMComprehensiveRow[]>([])

  const makeEmptyRow = (月份: number | string, isTotal = false): SEMComprehensiveRow => ({
    key: String(月份),
    月份,
    神殿: isTotal ? '' : campus,
    isTotal,
    计划收入: null,
    实际收入: null,
    计划招生: null,
    实际招生: null,
    退费人数: null,
    上门总量: null,
    电话量: null,
    咨询总量: null,
    报名转化率: '-',
    当面转化率: '-',
    上门率: '-',
    费用投入: null,
    招生成本: '-',
  })

  const calculateRates = (row: SEMComprehensiveRow) => {
    // 报名转化率 = 实际招生 / 咨询总量
    if (row.咨询总量 && row.咨询总量 > 0 && row.实际招生 && row.实际招生 > 0) {
      row.报名转化率 = ((row.实际招生 / row.咨询总量) * 100).toFixed(2) + '%'
    }
    // 当面转化率 = 实际招生 / 上门总量
    if (row.上门总量 && row.上门总量 > 0 && row.实际招生 && row.实际招生 > 0) {
      row.当面转化率 = ((row.实际招生 / row.上门总量) * 100).toFixed(2) + '%'
    }
    // 上门率 = 上门总量 / 咨询总量
    if (row.咨询总量 && row.咨询总量 > 0 && row.上门总量 && row.上门总量 > 0) {
      row.上门率 = ((row.上门总量 / row.咨询总量) * 100).toFixed(2) + '%'
    }
    // 招生成本 = 费用投入 / 实际招生
    if (row.实际招生 && row.实际招生 > 0 && row.费用投入 && row.费用投入 > 0) {
      row.招生成本 = (row.费用投入 / row.实际招生).toFixed(2)
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)

      // 并行获取：各类型计划数据 + 全平台咨询量统计 + 费用数据
      const [
        // 口碑、渠道、神殿新媒体从神殿月度财务数据获取
        reputationCampusData, channelCampusData, campusNewMediaCampusData,
        // 新媒体和SEM从年度网络计划表获取
        networkPlanData,
        // 市场口碑从月度详细计划获取
        reputationMonthlyPlan,
        // 合作伙伴从月度详细计划获取
        partnerMonthlyPlan,
        // 免费推广从月度详细计划获取
        freePromotionMonthlyPlan,
        // 全平台咨询量统计
        consultResult,
        // 费用数据
        semCostData, newMediaCostData, reputationCostData, partnerCostData, freePromotionCostData,
        // 咨询师月度计划（渠道、口碑、神殿新媒体费用投入）
        channelPlanList, reputationPlanList, campusNewMediaPlanList
      ] = await Promise.all([
        // 1. 口碑、渠道、神殿新媒体从神殿月度财务数据获取
        getCampusMonthlyData({ year: yearNum, campus, data_type: '口碑' }).catch(() => null),
        getCampusMonthlyData({ year: yearNum, campus, data_type: '渠道' }).catch(() => null),
        getCampusMonthlyData({ year: yearNum, campus, data_type: '神殿新媒体' }).catch(() => null),
        // 2. 新媒体和SEM从年度网络计划表获取
        api.get('/market/network-plan', { params: { year: yearNum, campus } })
          .then(res => Array.isArray(res.data) ? res.data : null)
          .catch(() => null),
        // 3. 市场口碑从月度详细计划获取
        api.get('/market/monthly-plan/reputation/list', { params: { year: yearNum, campus } })
          .then(res => res.data?.code === 0 && res.data?.data ? res.data.data : null)
          .catch(() => null),
        // 4. 合作伙伴从月度详细计划获取
        api.get('/market/monthly-plan/network-partner/detail/list', { params: { year: yearNum, campus } })
          .then(res => res.data?.code === 0 && res.data?.data ? res.data.data : null)
          .catch(() => null),
        // 5. 免费推广从月度详细计划获取
        api.get('/market/monthly-plan/free-promotion/list', { params: { year: yearNum, campus } })
          .then(res => res.data?.code === 0 && res.data?.data ? res.data.data : null)
          .catch(() => null),
        // 6. 全平台咨询量统计
        statsApi.getMonthlyCampusSummary({ 年份: yearNum, 神殿: campus }).catch(() => null),
        // 7. 从市场部获取各类型费用数据
        marketCostService.getSEMCostSummary(campus, yearNum).catch(() => ({})),
        marketCostService.getNewMediaCostSummary(campus, yearNum).catch(() => ({})),
        marketCostService.getReputationPlanCost(campus, yearNum).catch(() => ({})),
        marketCostService.getPartnerCostSummary(campus, yearNum).catch(() => ({})),
        marketCostService.getFreePromotionPlanCost(campus, yearNum).catch(() => ({})),
        // 8. 从咨询师月度计划获取渠道、口碑、神殿新媒体费用投入
        consultantPlanService.getConsultantPlanList({ year: yearNum, campus, data_type: '渠道' }).catch(() => []),
        consultantPlanService.getConsultantPlanList({ year: yearNum, campus, data_type: '口碑' }).catch(() => []),
        consultantPlanService.getConsultantPlanList({ year: yearNum, campus, data_type: '神殿新媒体' }).catch(() => []),
      ])

      // 按月汇总各类型的计划收入和计划招生
      const planByMonth: Record<number, { 计划收入: number; 计划招生: number }> = {}
      months.forEach(m => { planByMonth[m] = { 计划收入: 0, 计划招生: 0 } })
      
      // 1. 口碑、渠道、神殿新媒体：从神殿月度财务数据获取
      const campusDataList = [reputationCampusData, channelCampusData, campusNewMediaCampusData]
      campusDataList.forEach(res => {
        if (res?.月度数据) {
          res.月度数据.forEach((md: any) => {
            const m = md.月份
            if (planByMonth[m]) {
              const planIncome = Number(md.计划收入 || 0)
              const planEnroll = Number(md.计划招生 || 0)
              planByMonth[m].计划收入 += isNaN(planIncome) ? 0 : planIncome
              planByMonth[m].计划招生 += isNaN(planEnroll) ? 0 : planEnroll
            }
          })
        }
      })
      
      // 2. 新媒体和SEM：从年度网络计划表获取
      if (networkPlanData && Array.isArray(networkPlanData)) {
        networkPlanData.forEach((monthRow: any) => {
          const month = monthRow.month
          if (month > 0 && month <= 12) {
            const semIncome = Number(monthRow.sem_plan_income || 0)
            const semEnroll = Number(monthRow.sem_plan_signup || 0)
            const newMediaIncome = Number(monthRow.newmedia_plan_income || 0)
            const newMediaEnroll = Number(monthRow.newmedia_plan_signup || 0)
            
            planByMonth[month].计划收入 += semIncome + newMediaIncome
            planByMonth[month].计划招生 += semEnroll + newMediaEnroll
          }
        })
      }
      
      // 3. 市场口碑：从月度详细计划获取
      if (reputationMonthlyPlan && typeof reputationMonthlyPlan === 'object') {
        Object.entries(reputationMonthlyPlan).forEach(([monthStr, monthData]: [string, any]) => {
          const month = parseInt(monthStr)
          if (month > 0 && month <= 12 && monthData && typeof monthData === 'object') {
            const income = Number(monthData.plan_income || monthData.计划收入 || 0)
            const enroll = Number(monthData.plan_enrollment || monthData.计划招生 || 0)
            planByMonth[month].计划收入 += income
            planByMonth[month].计划招生 += enroll
          }
        })
      }
      
      // 4. 合作伙伴：从月度详细计划获取
      if (partnerMonthlyPlan && typeof partnerMonthlyPlan === 'object') {
        Object.entries(partnerMonthlyPlan).forEach(([monthStr, monthData]: [string, any]) => {
          const month = parseInt(monthStr)
          if (month > 0 && month <= 12 && monthData && typeof monthData === 'object') {
            // 检查是否直接包含计划数据
            if (monthData.计划收入 !== undefined || monthData.plan_income !== undefined) {
              const income = Number(monthData.plan_income || monthData.计划收入 || 0)
              const enroll = Number(monthData.plan_enrollment || monthData.计划招生 || 0)
              planByMonth[month].计划收入 += income
              planByMonth[month].计划招生 += enroll
            } else {
              // 否则遍历所有合作伙伴
              Object.values(monthData).forEach((partnerData: any) => {
                if (partnerData && typeof partnerData === 'object') {
                  const income = Number(partnerData.plan_income || partnerData.计划收入 || 0)
                  const enroll = Number(partnerData.plan_enrollment || partnerData.计划招生 || 0)
                  planByMonth[month].计划收入 += income
                  planByMonth[month].计划招生 += enroll
                }
              })
            }
          }
        })
      }
      
      // 5. 免费推广：从月度详细计划获取
      if (freePromotionMonthlyPlan && typeof freePromotionMonthlyPlan === 'object') {
        Object.entries(freePromotionMonthlyPlan).forEach(([monthStr, monthData]: [string, any]) => {
          const month = parseInt(monthStr)
          if (month > 0 && month <= 12 && monthData && typeof monthData === 'object') {
            const income = Number(monthData.plan_income || monthData.计划收入 || 0)
            const enroll = Number(monthData.plan_enrollment || monthData.计划招生 || 0)
            planByMonth[month].计划收入 += income
            planByMonth[month].计划招生 += enroll
          }
        })
      }

      // 构建咨询师月度计划费用投入映射
      const planExpenseByMonth: Record<number, number> = {}
      const processPlanList = (list: any[]) => {
        if (list && list.length > 0) {
          list.forEach((plan: any) => {
            const month = plan.月份
            if (month >= 1 && month <= 12) {
              planExpenseByMonth[month] = (planExpenseByMonth[month] || 0) + (plan.费用投入 || 0)
            }
          })
        }
      }
      processPlanList(channelPlanList)
      processPlanList(reputationPlanList)
      processPlanList(campusNewMediaPlanList)

      const dataRows: SEMComprehensiveRow[] = months.map(m => {
        const row = makeEmptyRow(m, false)
        // 计划数据 — 来自各类型汇总
        row.计划收入 = planByMonth[m].计划收入 || null
        row.计划招生 = planByMonth[m].计划招生 || null
        // 实际数据 — 来自咨询量统计（全平台）
        if (consultResult?.success && consultResult.data?.月度数据) {
          const monthData = consultResult.data.月度数据.find((d: any) => d.月份 === m)
          if (monthData) {
            row.实际收入 = monthData.实际收入 || null
            row.实际招生 = monthData.报名量 || null
            row.退费人数 = monthData.退费人数 || null
            row.上门总量 = monthData.上门量 || null
            row.电话量 = monthData.电话量 || null
            row.咨询总量 = monthData.咨询总量 || null
          }
        }
        
        // 计算月度费用投入 = 各类型费用投入之和
        let monthlyExpense = 0
        const consultCount = row.咨询总量 || 0
        
        // 1. SEM: consult_cost × 咨询量
        const semCost = semCostData[m]
        if (semCost && semCost.consult_cost > 0 && consultCount > 0) {
          monthlyExpense += Math.round(semCost.consult_cost * consultCount)
        }
        
        // 2. 新媒体: 咨询量成本 × 咨询量
        const newMediaCost = newMediaCostData[m]
        if (newMediaCost && newMediaCost.咨询量成本 > 0 && consultCount > 0) {
          monthlyExpense += Math.round(newMediaCost.咨询量成本 * consultCount)
        }
        
        // 3. 市场口碑: plan_cost × 咨询量
        const reputationCost = reputationCostData[m]
        if (reputationCost && reputationCost.plan_cost > 0 && consultCount > 0) {
          monthlyExpense += Math.round(reputationCost.plan_cost * consultCount)
        }
        
        // 4. 合作伙伴: consult_cost × 咨询量
        const partnerCost = partnerCostData[m]
        if (partnerCost && partnerCost.consult_cost > 0 && consultCount > 0) {
          monthlyExpense += Math.round(partnerCost.consult_cost * consultCount)
        }
        
        // 5. 免费推广: plan_cost（直接累加）
        const freePromotionCost = freePromotionCostData[m]
        if (freePromotionCost && freePromotionCost.plan_cost > 0) {
          monthlyExpense += freePromotionCost.plan_cost
        }
        
        // 6. 渠道、口碑、神殿新媒体: 从咨询师月度计划获取费用投入
        monthlyExpense += planExpenseByMonth[m] || 0
        
        row.费用投入 = monthlyExpense > 0 ? monthlyExpense : null
        
        calculateRates(row)
        return row
      })

      // 合计行
      const totalRow = makeEmptyRow('合计', true)
      const sumFields: (keyof SEMComprehensiveRow)[] = ['计划收入', '实际收入', '计划招生', '实际招生', '退费人数', '上门总量', '电话量', '咨询总量', '费用投入']
      sumFields.forEach(field => {
        const sum = dataRows.reduce((acc, r) => acc + ((r[field] as number) || 0), 0)
        ;(totalRow as any)[field] = sum || null
      })
      calculateRates(totalRow)
      dataRows.push(totalRow)

      setRows(dataRows)
    } catch (error) {
      console.error('加载全平台综合数据失败:', error)
      message.error('加载数据失败')
      const emptyRows = months.map(m => makeEmptyRow(m, false))
      emptyRows.push(makeEmptyRow('合计', true))
      setRows(emptyRows)
    } finally {
      setLoading(false)
    }
  }, [year, campus])

  useEffect(() => {
    loadData()
  }, [loadData])

  const renderValue = (value: number | null | string) => {
    if (value === null || value === undefined) return ''
    return value
  }

  const renderRate = (val: string, isTotal: boolean) => {
    if (val === '#DIV/0!') {
      return <span style={{ color: '#ff4d4f' }}>{val}</span>
    }
    const style = { color: '#52c41a', fontWeight: isTotal ? 'bold' as const : 'normal' as const }
    return <span style={style}>{val}</span>
  }

  const columns = [
    {
      title: '月份',
      dataIndex: '月份',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: number | string, r: SEMComprehensiveRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      width: 100,
      fixed: 'left' as const,
      align: 'center' as const,
    },
    {
      title: '全平台招生收入',
      children: [
        { 
          title: '计划收入', 
          dataIndex: '计划收入',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, r: SEMComprehensiveRow) => 
            r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val)
        },
        { 
          title: '实际收入', 
          dataIndex: '实际收入',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, r: SEMComprehensiveRow) => 
            r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val)
        },
      ],
    },
    {
      title: '全平台招生数据',
      children: [
        { 
          title: '计划招生', 
          dataIndex: '计划招生',
          width: 90,
          align: 'center' as const,
          render: (val: number | null, r: SEMComprehensiveRow) => 
            r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val)
        },
        { 
          title: '实际招生', 
          dataIndex: '实际招生',
          width: 90,
          align: 'center' as const,
          render: (val: number | null, r: SEMComprehensiveRow) => 
            r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val)
        },
        { 
          title: '退费人数', 
          dataIndex: '退费人数',
          width: 90,
          align: 'center' as const,
          render: (val: number | null, r: SEMComprehensiveRow) => 
            r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val)
        },
        { 
          title: '上门总量', 
          dataIndex: '上门总量',
          width: 90,
          align: 'center' as const,
          render: (val: number | null, r: SEMComprehensiveRow) => 
            r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val)
        },
        { 
          title: '电话量', 
          dataIndex: '电话量',
          width: 80,
          align: 'center' as const,
          render: (val: number | null, r: SEMComprehensiveRow) => 
            r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val)
        },
        { 
          title: '咨询总量', 
          dataIndex: '咨询总量',
          width: 90,
          align: 'center' as const,
          render: (val: number | null, r: SEMComprehensiveRow) => 
            r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val)
        },
      ],
    },
    {
      title: '全平台转化率',
      children: [
        { 
          title: '报名转化率', 
          dataIndex: '报名转化率',
          width: 100,
          align: 'center' as const,
          render: (val: string, r: SEMComprehensiveRow) => renderRate(val, r.isTotal)
        },
        { 
          title: '当面转化率', 
          dataIndex: '当面转化率',
          width: 100,
          align: 'center' as const,
          render: (val: string, r: SEMComprehensiveRow) => renderRate(val, r.isTotal)
        },
        { 
          title: '上门率', 
          dataIndex: '上门率',
          width: 90,
          align: 'center' as const,
          render: (val: string, r: SEMComprehensiveRow) => renderRate(val, r.isTotal)
        },
      ],
    },
    {
      title: '全平台招生成本',
      children: [
        { 
          title: '费用投入', 
          dataIndex: '费用投入',
          width: 100,
          align: 'center' as const,
          render: (val: number | null, r: SEMComprehensiveRow) => 
            r.isTotal ? <strong style={{ color: '#1890ff' }}>{renderValue(val)}</strong> : renderValue(val)
        },
        { 
          title: '招生成本', 
          dataIndex: '招生成本',
          width: 100,
          align: 'center' as const,
          render: (val: string, r: SEMComprehensiveRow) => 
            val === '#DIV/0!' ? <span style={{ color: '#ff4d4f' }}>{val}</span> : 
            r.isTotal ? <strong style={{ color: '#1890ff' }}>{val}</strong> : val
        },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Spin spinning={loading}>
        <div>
          <div style={{ 
            background: '#006400', 
            color: '#fff',
            padding: '8px 16px', 
            fontWeight: 'bold', 
            marginBottom: 0,
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{campus}{year}年度全平台数据核心数据看板</span>
            <Button 
              icon={<ReloadOutlined />} 
              size="small" 
              onClick={loadData}
              style={{ color: '#fff', borderColor: '#fff' }}
              ghost
            >
              刷新数据
            </Button>
          </div>
        <Table
          columns={columns}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1600 }}
          rowClassName={r => (r.isTotal ? 'total-row' : '')}
        />
        <style>{`
          .total-row { background-color: #fffbe6; }
          .total-row td { background-color: #fffbe6 !important; }
        `}</style>
      </div>
      </Spin>
    </NoCopyContainer>
  )
}
