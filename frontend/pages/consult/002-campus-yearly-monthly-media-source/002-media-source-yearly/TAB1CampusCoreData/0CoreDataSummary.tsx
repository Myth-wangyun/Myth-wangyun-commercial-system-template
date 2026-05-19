/**
 * 神殿年度核心数据看板汇总
 * 综合展示招生收入、招生数据、转化率、招生成本、咨询师、渠道职数
 * 数据来源：
 * - 计划收入、实际收入、计划招生、实际招生、退费人数 来自007财务收入和退费
 * - 上门总量、咨询总量、报名量 来自咨询量录入系统
 * - 电话量 来自咨询沟通记录统计
 */

import React, { useState, useEffect, useCallback } from 'react'
import { App, Table, Spin, Button } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { NoCopyContainer } from '@/components/common'
import { getCampusMonthlyData } from '@/pages/consult/004mgmt-data/007-financial-income/api'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'
import * as phoneStatsApi from '@/pages/consult/type-count-system/phoneStatsApi'
import * as staffingService from '@/services/consult/staffing'
import * as consultantPlanService from '@/services/consult/consultantPlan'
import * as marketCostService from '@/services/consult/marketCost'
import api from '@/services/api'

interface CoreDataRow {
  key: string
  序号: number | string
  神殿: string
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
  // 咨询师
  咨询总职数: number | null
  咨询干部职数: number | null
  咨询员工职数: number | null
  // 渠道职数
  渠道总职数: number | null
  县办: number | null
  乡办: number | null
  信息员: number | null
}

interface Props {
  year: string
  campus: string
}

export default function CoreDataSummary({ year, campus }: Props) {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<CoreDataRow[]>([])

  const makeEmptyRow = (): CoreDataRow => ({
    key: '1',
    序号: 1,
    神殿: campus,
    计划收入: 0,
    实际收入: 0,
    计划招生: 0,
    实际招生: 0,
    退费人数: 0,
    上门总量: 0,
    电话量: 0,
    咨询总量: 0,
    报名转化率: '#DIV/0!',
    当面转化率: '#DIV/0!',
    上门率: '#DIV/0!',
    费用投入: 0,
    招生成本: '#DIV/0!',
    咨询总职数: null,
    咨询干部职数: null,
    咨询员工职数: null,
    渠道总职数: null,
    县办: null,
    乡办: null,
    信息员: null,
  })

  const calculateRates = (row: CoreDataRow) => {
    // 报名转化率 = 实际招生 / 咨询总量
    if (row.咨询总量 && row.咨询总量 > 0 && row.实际招生) {
      row.报名转化率 = ((row.实际招生 / row.咨询总量) * 100).toFixed(2) + '%'
    } else {
      row.报名转化率 = '#DIV/0!'
    }
    
    // 当面转化率 = 实际招生 / 上门总量
    if (row.上门总量 && row.上门总量 > 0 && row.实际招生) {
      row.当面转化率 = ((row.实际招生 / row.上门总量) * 100).toFixed(2) + '%'
    } else {
      row.当面转化率 = '#DIV/0!'
    }
    
    // 上门率 = 上门总量 / 咨询总量
    if (row.咨询总量 && row.咨询总量 > 0 && row.上门总量) {
      row.上门率 = ((row.上门总量 / row.咨询总量) * 100).toFixed(2) + '%'
    } else {
      row.上门率 = '#DIV/0!'
    }
    
    // 招生成本 = 费用投入 / 实际招生
    if (row.实际招生 && row.实际招生 > 0 && row.费用投入) {
      row.招生成本 = (row.费用投入 / row.实际招生).toFixed(2)
    } else {
      row.招生成本 = '#DIV/0!'
    }
  }

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)
      const row = makeEmptyRow()
      
      // 所有数据类型 — 与002各TAB一致
      const DATA_TYPES = ['SEM', '新媒体', '市场口碑', '网络合作伙伴', '口碑', '渠道', '神殿新媒体']
      
      // 并行获取：各类型神殿级计划数据、全平台咨询量统计、电话量、职数、市场成本、咨询师计划
      // 新媒体和SEM从年度网络计划表获取，市场口碑、合作伙伴、免费推广从月度详细计划获取
      const [typeResults, networkPlanData, reputationMonthlyPlan, partnerMonthlyPlan, freePromotionMonthlyPlan, consultStatsResult, phoneStatsResult, staffingMap,
        // 获取各类型成本数据
        semCostData, newMediaCostData, reputationCostData, partnerCostData, freePromotionCostData,
        // 获取咨询师月度计划数据（渠道、口碑、神殿新媒体的费用投入）
        channelPlanList, reputationPlanList, campusNewMediaPlanList
      ] = await Promise.all([
        // 1. 获取口碑、渠道、神殿新媒体的神殿级年度计划数据（从神殿月度财务数据表）
        Promise.all(
          ['口碑', '渠道', '神殿新媒体'].map(dt =>
            getCampusMonthlyData({ year: yearNum, campus, data_type: dt })
              .catch(() => null)
          )
        ),
        // 2. 获取新媒体和SEM的年度网络计划数据
        api.get('/market/network-plan', { params: { year: yearNum, campus } })
          .then(res => Array.isArray(res.data) ? res.data : null)
          .catch(() => null),
        // 3. 获取市场口碑的月度详细计划数据
        api.get('/market/monthly-plan/reputation/list', { params: { year: yearNum, campus } })
          .then(res => res.data?.code === 0 && res.data?.data ? res.data.data : null)
          .catch(() => null),
        // 4. 获取合作伙伴的月度详细计划数据
        api.get('/market/monthly-plan/network-partner/detail/list', { params: { year: yearNum, campus } })
          .then(res => res.data?.code === 0 && res.data?.data ? res.data.data : null)
          .catch(() => null),
        // 5. 获取免费推广的月度详细计划数据
        api.get('/market/monthly-plan/free-promotion/list', { params: { year: yearNum, campus } })
          .then(res => res.data?.code === 0 && res.data?.data ? res.data.data : null)
          .catch(() => null),
        // 6. 全平台咨询量统计（不传分类=全平台汇总）
        statsApi.getMonthlyCampusSummary({ 年份: yearNum, 神殿: campus }).catch(() => null),
        // 7. 电话量
        phoneStatsApi.getPhoneStatsByCampus({ year: yearNum }).catch(() => null),
        // 8. 职数数据
        staffingService.getStaffingMap(yearNum).catch(() => new Map()),
        // SEM、新媒体、市场口碑、合作伙伴、免费推广从市场部获取
        marketCostService.getSEMCostSummary(campus, yearNum).catch(() => ({})),
        marketCostService.getNewMediaCostSummary(campus, yearNum).catch(() => ({})),
        marketCostService.getReputationPlanCost(campus, yearNum).catch(() => ({})),
        marketCostService.getPartnerCostSummary(campus, yearNum).catch(() => ({})),
        marketCostService.getFreePromotionPlanCost(campus, yearNum).catch(() => ({})),
        // 渠道、口碑、神殿新媒体从咨询师月度计划获取
        consultantPlanService.getConsultantPlanList({ year: yearNum, campus, data_type: '渠道' }).catch(() => []),
        consultantPlanService.getConsultantPlanList({ year: yearNum, campus, data_type: '口碑' }).catch(() => []),
        consultantPlanService.getConsultantPlanList({ year: yearNum, campus, data_type: '神殿新媒体' }).catch(() => []),
      ])

      // 汇总各数据类型的计划收入和计划招生
      // 1. 口碑、渠道、神殿新媒体：从神殿月度财务数据表获取
      typeResults.forEach(res => {
        if (res?.年度汇总) {
          const summary = res.年度汇总
          row.计划收入 = (row.计划收入 || 0) + (summary.计划收入 || 0)
          row.计划招生 = (row.计划招生 || 0) + (summary.计划招生 || 0)
        }
      })
      
      // 2. 新媒体和SEM：从年度网络计划表获取
      if (networkPlanData && Array.isArray(networkPlanData)) {
        let semPlanIncome = 0
        let semPlanEnroll = 0
        let newMediaPlanIncome = 0
        let newMediaPlanEnroll = 0
        
        networkPlanData.forEach((monthRow: any) => {
          const month = monthRow.month
          // 排除总计行（month=0）
          if (month > 0) {
            semPlanIncome += Number(monthRow.sem_plan_income || 0)
            semPlanEnroll += Number(monthRow.sem_plan_signup || 0)
            newMediaPlanIncome += Number(monthRow.newmedia_plan_income || 0)
            newMediaPlanEnroll += Number(monthRow.newmedia_plan_signup || 0)
          }
        })
        
        console.log('年度网络计划数据 - SEM:', { semPlanIncome, semPlanEnroll })
        console.log('年度网络计划数据 - 新媒体:', { newMediaPlanIncome, newMediaPlanEnroll })
        
        row.计划收入 = (row.计划收入 || 0) + semPlanIncome + newMediaPlanIncome
        row.计划招生 = (row.计划招生 || 0) + semPlanEnroll + newMediaPlanEnroll
      }
      
      // 3. 市场口碑：从月度详细计划获取（直接月份→数据格式）
      if (reputationMonthlyPlan && typeof reputationMonthlyPlan === 'object') {
        let reputationPlanIncome = 0
        let reputationPlanEnroll = 0
        
        console.log('市场口碑月度计划原始数据:', reputationMonthlyPlan)
        
        Object.entries(reputationMonthlyPlan).forEach(([monthStr, monthData]: [string, any]) => {
          if (monthData && typeof monthData === 'object') {
            // 从月度数据中提取计划收入和计划招生（支持中英文字段名）
            const income = Number(monthData.plan_income || monthData.计划收入 || 0)
            const enroll = Number(monthData.plan_enrollment || monthData.计划招生 || 0)
            console.log(`市场口碑 - 月份${monthStr}:`, { income, enroll, rawData: monthData })
            reputationPlanIncome += income
            reputationPlanEnroll += enroll
          }
        })
        
        console.log('市场口碑汇总:', { reputationPlanIncome, reputationPlanEnroll })
        
        row.计划收入 = (row.计划收入 || 0) + reputationPlanIncome
        row.计划招生 = (row.计划招生 || 0) + reputationPlanEnroll
      }
      
      // 4. 合作伙伴：从月度详细计划获取
      if (partnerMonthlyPlan && typeof partnerMonthlyPlan === 'object') {
        let partnerPlanIncome = 0
        let partnerPlanEnroll = 0
        
        console.log('合作伙伴月度计划原始数据:', partnerMonthlyPlan)
        
        Object.entries(partnerMonthlyPlan).forEach(([monthStr, monthData]: [string, any]) => {
          if (monthData && typeof monthData === 'object') {
            // 检查数据格式：如果直接包含计划收入/计划招生，则直接使用（支持中英文字段名）
            if (monthData.计划收入 !== undefined || monthData.计划招生 !== undefined || 
                monthData.plan_income !== undefined || monthData.plan_enrollment !== undefined) {
              const income = Number(monthData.plan_income || monthData.计划收入 || 0)
              const enroll = Number(monthData.plan_enrollment || monthData.计划招生 || 0)
              console.log(`合作伙伴 - 月份${monthStr}:`, { income, enroll, rawData: monthData })
              partnerPlanIncome += income
              partnerPlanEnroll += enroll
            } else {
              // 否则遍历所有合作伙伴，累加计划数据
              Object.entries(monthData).forEach(([partner, partnerData]: [string, any]) => {
                if (partnerData && typeof partnerData === 'object') {
                  const income = Number(partnerData.plan_income || partnerData.计划收入 || 0)
                  const enroll = Number(partnerData.plan_enrollment || partnerData.计划招生 || 0)
                  console.log(`合作伙伴 - 月份${monthStr} - 伙伴${partner}:`, { income, enroll })
                  partnerPlanIncome += income
                  partnerPlanEnroll += enroll
                }
              })
            }
          }
        })
        
        console.log('合作伙伴汇总:', { partnerPlanIncome, partnerPlanEnroll })
        
        row.计划收入 = (row.计划收入 || 0) + partnerPlanIncome
        row.计划招生 = (row.计划招生 || 0) + partnerPlanEnroll
      }
      
      // 5. 免费推广：从月度详细计划获取
      if (freePromotionMonthlyPlan && typeof freePromotionMonthlyPlan === 'object') {
        let freePromotionPlanIncome = 0
        let freePromotionPlanEnroll = 0
        
        console.log('免费推广月度计划原始数据:', freePromotionMonthlyPlan)
        
        Object.entries(freePromotionMonthlyPlan).forEach(([monthStr, monthData]: [string, any]) => {
          if (monthData && typeof monthData === 'object') {
            const income = Number(monthData.plan_income || monthData.计划收入 || 0)
            const enroll = Number(monthData.plan_enrollment || monthData.计划招生 || 0)
            console.log(`免费推广 - 月份${monthStr}:`, { income, enroll, rawData: monthData })
            freePromotionPlanIncome += income
            freePromotionPlanEnroll += enroll
          }
        })
        
        console.log('免费推广汇总:', { freePromotionPlanIncome, freePromotionPlanEnroll })
        
        row.计划收入 = (row.计划收入 || 0) + freePromotionPlanIncome
        row.计划招生 = (row.计划招生 || 0) + freePromotionPlanEnroll
      }
      
      console.log('最终汇总 - 计划收入:', row.计划收入, '计划招生:', row.计划招生)
      
      // 处理咨询量统计数据 — 全平台年度汇总（实际招生、实际收入、上门、咨询量、电话量等）
      if (consultStatsResult && consultStatsResult.success && consultStatsResult.data) {
        const { 年度汇总 } = consultStatsResult.data
        if (年度汇总) {
          row.咨询总量 = 年度汇总.咨询总量 || 0
          row.上门总量 = 年度汇总.上门量 || 0
          row.实际招生 = 年度汇总.报名量 || 0
          row.实际收入 = 年度汇总.实际收入 || 0
          row.退费人数 = 年度汇总.退费人数 || 0
          row.电话量 = 年度汇总.电话量 || 0  // 直接从咨询量统计API获取电话量
        }
      }
      
      // 备用方案：如果咨询量统计API中没有电话量，则从电话量API获取
      if (row.电话量 === 0 && phoneStatsResult && phoneStatsResult.success && phoneStatsResult.data) {
        const campusData = phoneStatsResult.data.find((item: any) => item.神殿 === campus)
        if (campusData) {
          row.电话量 = campusData.电话量 || 0
        }
      }
      
      // 处理职数数据 - 从010咨询和渠道职数获取，使用模糊匹配神殿名
      if (staffingMap && staffingMap.size > 0) {
        // 尝试精确匹配或模糊匹配神殿名
        let staffingResult = staffingMap.get(campus)
        if (!staffingResult) {
          // 尝试模糊匹配：检查神殿名是否包含或被包含
          for (const [key, value] of staffingMap.entries()) {
            if (campus.includes(key) || key.includes(campus)) {
              staffingResult = value
              break
            }
          }
        }
        if (staffingResult) {
          row.咨询总职数 = staffingResult.咨询总职数 ?? null
          row.咨询干部职数 = staffingResult.咨询干部职数 ?? null
          row.咨询员工职数 = staffingResult.咨询员工职数 ?? null
          row.渠道总职数 = staffingResult.渠道总职数 ?? null
          row.县办 = staffingResult.县办 ?? null
          row.乡办 = staffingResult.乡办 ?? null
          row.信息员 = staffingResult.信息员 ?? null
        }
      }
      
      // 计算全平台费用投入 = 所有类型费用投入之和
      let totalExpense = 0
      const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      
      // 获取各月咨询量数据（用于计算 咨询量成本 × 咨询量）
      const monthlyConsultCounts: Record<number, number> = {}
      if (consultStatsResult?.success && consultStatsResult.data?.月度数据) {
        consultStatsResult.data.月度数据.forEach((item: any) => {
          monthlyConsultCounts[item.月份] = item.咨询总量 || 0
        })
      }
      
      // 1. SEM: 咨询量成本 × 咨询量
      MONTHS.forEach(m => {
        const cost = semCostData[m]
        const consultCount = monthlyConsultCounts[m] || 0
        if (cost && cost.consult_cost > 0 && consultCount > 0) {
          totalExpense += Math.round(cost.consult_cost * consultCount)
        }
      })
      
      // 2. 新媒体: 咨询量成本 × 咨询量
      MONTHS.forEach(m => {
        const cost = newMediaCostData[m]
        const consultCount = monthlyConsultCounts[m] || 0
        if (cost && cost.咨询量成本 > 0 && consultCount > 0) {
          totalExpense += Math.round(cost.咨询量成本 * consultCount)
        }
      })
      
      // 3. 市场口碑: plan_cost × 咨询量
      MONTHS.forEach(m => {
        const cost = reputationCostData[m]
        const consultCount = monthlyConsultCounts[m] || 0
        if (cost && cost.plan_cost > 0 && consultCount > 0) {
          totalExpense += Math.round(cost.plan_cost * consultCount)
        }
      })
      
      // 4. 合作伙伴: consult_cost × 咨询量
      MONTHS.forEach(m => {
        const cost = partnerCostData[m]
        const consultCount = monthlyConsultCounts[m] || 0
        if (cost && cost.consult_cost > 0 && consultCount > 0) {
          totalExpense += Math.round(cost.consult_cost * consultCount)
        }
      })
      
      // 5. 免费推广: plan_cost（直接累加）
      MONTHS.forEach(m => {
        const cost = freePromotionCostData[m]
        if (cost && cost.plan_cost > 0) {
          totalExpense += cost.plan_cost
        }
      })
      
      // 6. 渠道: 从咨询师月度计划获取费用投入
      if (channelPlanList && channelPlanList.length > 0) {
        channelPlanList.forEach((plan: any) => {
          totalExpense += plan.费用投入 || 0
        })
      }
      
      // 7. 口碑: 从咨询师月度计划获取费用投入
      if (reputationPlanList && reputationPlanList.length > 0) {
        reputationPlanList.forEach((plan: any) => {
          totalExpense += plan.费用投入 || 0
        })
      }
      
      // 8. 神殿新媒体: 从咨询师月度计划获取费用投入
      if (campusNewMediaPlanList && campusNewMediaPlanList.length > 0) {
        campusNewMediaPlanList.forEach((plan: any) => {
          totalExpense += plan.费用投入 || 0
        })
      }
      
      row.费用投入 = totalExpense > 0 ? totalExpense : null
      
      // 计算转化率和招生成本
      calculateRates(row)
      
      setRows([row])
      
    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
      setRows([makeEmptyRow()])
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

  const renderRate = (val: string) => {
    if (val === '#DIV/0!') {
      return <span style={{ color: '#ff4d4f' }}>{val}</span>
    }
    return <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{val}</span>
  }

  const columns = [
    {
      title: '序号',
      dataIndex: '序号',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
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
          render: (val: number | null) => renderValue(val)
        },
        { 
          title: '实际收入', 
          dataIndex: '实际收入',
          width: 100,
          align: 'center' as const,
          render: (val: number | null) => renderValue(val)
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
          render: (val: number | null) => renderValue(val)
        },
        { 
          title: '实际招生', 
          dataIndex: '实际招生',
          width: 90,
          align: 'center' as const,
          render: (val: number | null) => renderValue(val)
        },
        { 
          title: '退费人数', 
          dataIndex: '退费人数',
          width: 90,
          align: 'center' as const,
          render: (val: number | null) => renderValue(val)
        },
        { 
          title: '上门总量', 
          dataIndex: '上门总量',
          width: 90,
          align: 'center' as const,
          render: (val: number | null) => renderValue(val)
        },
        { 
          title: '电话量', 
          dataIndex: '电话量',
          width: 80,
          align: 'center' as const,
          render: (val: number | null) => renderValue(val)
        },
        { 
          title: '咨询总量', 
          dataIndex: '咨询总量',
          width: 90,
          align: 'center' as const,
          render: (val: number | null) => renderValue(val)
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
          render: (val: string) => renderRate(val)
        },
        { 
          title: '当面转化率', 
          dataIndex: '当面转化率',
          width: 100,
          align: 'center' as const,
          render: (val: string) => renderRate(val)
        },
        { 
          title: '上门率', 
          dataIndex: '上门率',
          width: 90,
          align: 'center' as const,
          render: (val: string) => renderRate(val)
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
          render: (val: number | null) => renderValue(val)
        },
        { 
          title: '招生成本', 
          dataIndex: '招生成本',
          width: 100,
          align: 'center' as const,
          render: (val: string) => val === '#DIV/0!' ? <span style={{ color: '#ff4d4f' }}>{val}</span> : val
        },
      ],
    },
    {
      title: '咨询师',
      children: [
        { 
          title: '咨询总职数', 
          dataIndex: '咨询总职数',
          width: 100,
          align: 'center' as const,
          render: (val: number | null) => renderValue(val)
        },
        { 
          title: '咨询干部职数', 
          dataIndex: '咨询干部职数',
          width: 110,
          align: 'center' as const,
          render: (val: number | null) => renderValue(val)
        },
        { 
          title: '咨询员工职数', 
          dataIndex: '咨询员工职数',
          width: 110,
          align: 'center' as const,
          render: (val: number | null) => renderValue(val)
        },
      ],
    },
    {
      title: '渠道职数',
      children: [
        { 
          title: '渠道总职数', 
          dataIndex: '渠道总职数',
          width: 100,
          align: 'center' as const,
          render: (val: number | null) => renderValue(val)
        },
        { 
          title: '县办', 
          dataIndex: '县办',
          width: 70,
          align: 'center' as const,
          render: (val: number | null) => renderValue(val)
        },
        { 
          title: '乡办', 
          dataIndex: '乡办',
          width: 70,
          align: 'center' as const,
          render: (val: number | null) => renderValue(val)
        },
        { 
          title: '信息员', 
          dataIndex: '信息员',
          width: 80,
          align: 'center' as const,
          render: (val: number | null) => renderValue(val)
        },
      ],
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Spin spinning={loading}>
        <div>
          <div style={{ 
            background: '#FFD700', 
            padding: '8px 16px', 
            fontWeight: 'bold', 
            marginBottom: 0,
            fontSize: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{campus}{year}年度核心数据看板汇总</span>
            <Button 
              icon={<ReloadOutlined />} 
              size="small" 
              onClick={loadData}
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
            scroll={{ x: 1800 }}
          />
        </div>
      </Spin>
    </NoCopyContainer>
  )
}
