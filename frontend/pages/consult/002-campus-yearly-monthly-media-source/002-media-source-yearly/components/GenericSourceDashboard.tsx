/**
 * GenericSourceDashboard - 通用媒体来源数据看板
 * 根据媒体类型动态生成4个子表格：
 * 1. 年度汇总表（按神殿）
 * 2. 月度数据表（按月份）
 * 3. 咨询师汇总表
 * 4. 咨询师月度明细表
 * 
 * 表格结构完全相同，只是转化率和招生成本列的前缀根据媒体类型变化
 * 
 * 特殊处理：
 * - 渠道TAB使用专门的 ChannelSourceDashboard 组件
 * - 口碑/神殿新媒体只显示3个子表（没有第一个按神殿汇总表）
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { App, Table, Spin, Divider, Alert, InputNumber, Button } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { NoCopyContainer } from '@/components/common'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'
import api from '@/services/api'
import ChannelSourceDashboard from './ChannelSourceDashboard'
import * as staffingService from '@/services/consult/staffing'
import * as marketCostService from '@/services/consult/marketCost'
import * as consultantPlanService from '@/services/consult/consultantPlan'
import { getAllCampusYearlyPlanSummary as getCampusYearlyPlanSummary, getCombinedMonthlyDataV2 } from '@/pages/consult/004mgmt-data/007-financial-income/api'

// ==================== 类型定义 ====================

// 基础数据行结构
interface BaseDataRow {
  key: string
  序号: number | string
  isTotal: boolean
  // 招生收入
  计划收入: number | null
  实际收入: number | null
  收入完成率: string
  // 招生数据
  计划招生: number | null
  实际招生: number | null
  退费人数: number | null
  上门总量: number | null
  咨询总量: number | null
  电话量: number | null
  // 转化率（动态前缀）
  总转: string
  当面转化: string
  电转门: string
  // 招生成本（动态前缀）
  市场投入: number | null
  招生成本: number | null
}

// 神殿汇总行
interface CampusSummaryRow extends BaseDataRow {
  神殿: string
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

// 月度数据行
interface MonthlyDataRow extends BaseDataRow {
  月份: number | string
  神殿: string
}

// 咨询师数据行
interface ConsultantDataRow extends BaseDataRow {
  咨询师: string
}

// 咨询师月度数据行
interface ConsultantMonthlyRow extends BaseDataRow {
  月份: number | string
  咨询师: string
}

// ==================== Props ====================

interface Props {
  year: string
  categoryName: string  // 量来源名称：网络、新媒体、市场口碑、合作伙伴、渠道、口碑、神殿新媒体
  bgColor?: string      // 表头背景色
}

// ==================== 辅助函数 ====================

// 获取转化率和成本列的前缀
const getColumnPrefix = (categoryName: string): string => {
  const prefixMap: Record<string, string> = {
    '网络': 'SEM',
    '新媒体': '新媒体',
    '市场口碑': '市场口碑',
    '合作伙伴': '合作伙伴',
    '渠道': '渠道',
    '口碑': '口碑',
    '神殿新媒体': '神殿新媒体',
  }
  return prefixMap[categoryName] || categoryName
}

// 月份常量（移到组件外部避免每次渲染重新创建）
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

// 计算转化率 - 除零时显示 '0%'
const calculateRates = (row: BaseDataRow) => {
  // 收入完成率 = 实际收入 / 计划收入 * 100
  if (row.计划收入 && row.计划收入 > 0 && row.实际收入 !== null) {
    row.收入完成率 = ((row.实际收入 / row.计划收入) * 100).toFixed(1) + '%'
  } else {
    row.收入完成率 = '-'
  }

  // 总转 = 实际招生 / 咨询总量
  if (row.咨询总量 && row.咨询总量 > 0 && row.实际招生 !== null) {
    row.总转 = ((row.实际招生 / row.咨询总量) * 100).toFixed(2) + '%'
  } else {
    row.总转 = '0%'
  }
  
  // 当面转化 = 实际招生 / 上门总量
  if (row.上门总量 && row.上门总量 > 0 && row.实际招生 !== null) {
    row.当面转化 = ((row.实际招生 / row.上门总量) * 100).toFixed(2) + '%'
  } else {
    row.当面转化 = '0%'
  }
  
  // 电转门 = 上门总量 / 咨询总量
  if (row.咨询总量 && row.咨询总量 > 0 && row.上门总量 !== null) {
    row.电转门 = ((row.上门总量 / row.咨询总量) * 100).toFixed(2) + '%'
  } else {
    row.电转门 = '0%'
  }
}

// 渲染数值 - 零值以灰色显示，合计行保留两位小数
const renderValue = (value: number | null | undefined, isTotal: boolean, color = '#1890ff') => {
  if (value === null || value === undefined) return <span style={{ color: '#999' }}>0</span>
  if (value === 0) return <span style={{ color: '#999' }}>0</span>
  if (isTotal) {
    // 合计行：保留两位小数
    const formattedValue = Number.isInteger(value) ? value : value.toFixed(2)
    return <strong style={{ color }}>{formattedValue}</strong>
  }
  return <span>{value}</span>
}

// 渲染转化率 - 0% 以灰色显示
const renderRate = (val: string, isTotal: boolean) => {
  if (val === '0%' || val === '0.00%') {
    return <span style={{ color: '#999' }}>{val}</span>
  }
  const style = { color: '#52c41a', fontWeight: isTotal ? 'bold' as const : 'normal' as const }
  return <span style={style}>{val}</span>
}

// ==================== 主组件 ====================

export default function GenericSourceDashboard({ year, categoryName, bgColor = '#FFD700' }: Props) {
  const { message } = App.useApp()
  const { notification } = App.useApp()
  const campusStore = useCampusStore()
  const currentCampus = campusStore.currentCampus || '未选择'
  const campusList = useMemo(() => campusStore.getAllCampuses(), [campusStore])
  
  const [loading, setLoading] = useState(false)
  const [consultants, setConsultants] = useState<string[]>([])
  
  // 4个表格的数据
  const [summaryRows, setSummaryRows] = useState<CampusSummaryRow[]>([])
  const [monthlyRows, setMonthlyRows] = useState<MonthlyDataRow[]>([])
  const [consultantRows, setConsultantRows] = useState<ConsultantDataRow[]>([])
  const [consultantMonthlyRows, setConsultantMonthlyRows] = useState<ConsultantMonthlyRow[]>([])
  
  // 可编辑字段状态管理
  const [savingPlan, setSavingPlan] = useState(false)
  const [pendingPlanChanges, setPendingPlanChanges] = useState<Map<string, { 
    计划收入?: number
    计划招生?: number
    费用投入?: number  // 新增费用投入字段
  }>>(new Map())
  
  const prefix = useMemo(() => getColumnPrefix(categoryName), [categoryName])

  // 加载咨询师列表
  const loadConsultants = useCallback(async () => {
    try {
      // 从用户表获取咨询师列表（祈福司门）- 按神殿分组返回
      const response = await api.get('/config/department-users', {
        params: { department: '祈福司' }
      })
      // 接口返回 [{campus, users: [{real_name, ...}]}] 格式
      const groups = Array.isArray(response.data) ? response.data : []
      // 筛选当前神殿的咨询师，如果没匹配到则取全部
      const campusGroup = groups.find((g: any) => g.campus === currentCampus)
      const users = campusGroup ? campusGroup.users : groups.flatMap((g: any) => g.users || [])
      const names = users.map((u: any) => u.real_name || '').filter(Boolean)
      setConsultants(names.length > 0 ? names : ['张三', '李四', '王五'])
    } catch {
      setConsultants(['张三', '李四', '王五'])
    }
  }, [currentCampus])

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)
      const currentCampusList = campusStore.getAllCampuses()
      
      // 统计分类直接使用配置中心的量来源名称
      const 统计分类 = categoryName
      
      // 神殿月度财务数据 的数据类型映射（用于子表1计划数据）
      const 财务数据类型映射: Record<string, string> = {
        '网络': 'SEM',
        '新媒体': '新媒体',
        '市场口碑': '市场口碑',
        '合作伙伴': '网络合作伙伴',
        '口碑': '口碑',
        '渠道': '渠道',
        '神殿新媒体': '神殿新媒体',
        '其他': '免费推广',
      }
      const 财务数据类型 = 财务数据类型映射[categoryName] || categoryName
      
      // 确定营销部计划 API 路径
      const getMarketPlanApiPath = (): string | null => {
        // 新媒体：从年度网络计划表获取
        if (categoryName === '新媒体') return '/market/network-plan'
        // 合作伙伴：从月度详细计划获取
        if (categoryName === '合作伙伴') return '/market/monthly-plan/network-partner/detail/list'
        // 市场口碑：使用神殿月度财务数据（getCombinedMonthlyDataV2），不使用月度详细计划
        return null  // 其他类型不使用营销部计划
      }
      
      const marketPlanApiPath = getMarketPlanApiPath()
      
      // 并行获取数据
      const [consultResult, staffingMap, marketCostData, monthlyPlanTotals, consultantPlanMap, consultantMonthlyData, monthlyCampusData, consultantPlanList, yearlyPlanSummary, campusMonthlyPlanData, allCampusMarketPlanData] = await Promise.all([
        // 获取咨询量统计数据（使用分类参数，自动按配置中心筛选）
        statsApi.getAllCampusYearlySummary({
          年份: yearNum,
          分类: 统计分类,
        }).catch(() => null),
        // 获取职数数据映射
        staffingService.getStaffingMap(yearNum).catch(() => new Map()),
        // 获取市场成本数据（根据类型）- SEM、新媒体、市场口碑、合作伙伴、免费推广从市场部表格获取
        (categoryName === '网络' || categoryName === 'SEM')
          ? marketCostService.getSEMCostSummary(currentCampus, yearNum).catch(() => ({}))
          : (categoryName === '新媒体')
            ? marketCostService.getNewMediaCostSummary(currentCampus, yearNum).catch(() => ({}))
            : (categoryName === '市场口碑')
              ? marketCostService.getReputationPlanCost(currentCampus, yearNum).catch(() => ({}))
              : (categoryName === '合作伙伴')
                ? marketCostService.getPartnerCostSummary(currentCampus, yearNum).catch(() => ({}))
                : (categoryName === '其他')  // 免费推广
                  ? marketCostService.getFreePromotionPlanCost(currentCampus, yearNum).catch(() => ({}))
                  : {},  // 渠道、口碑、神殿新媒体从咨询师月度计划获取费用投入
        // 获取月度计划汇总（按数据类型过滤）
        consultantPlanService.getMonthlyPlanTotals(yearNum, currentCampus, categoryName).catch(() => new Map()),
        // 获取咨询师计划数据映射（按数据类型过滤）
        consultantPlanService.getConsultantPlanMap(yearNum, currentCampus, categoryName).catch(() => new Map()),
        // 获取咨询师月度实际数据（从咨询量明细表）
        // 使用分类参数，自动按配置中心筛选
        statsApi.getConsultantMonthlySummary({
          年份: yearNum,
          神殿: currentCampus,
          分类: 统计分类,
        }).catch(() => null),
        // 获取月度神殿汇总数据（从咨询量明细表）
        statsApi.getMonthlyCampusSummary({
          年份: yearNum,
          神殿: currentCampus,
          分类: 统计分类,
        }).catch(() => null),
        // 获取咨询师月度计划列表（用于渠道、口碑、神殿新媒体的费用投入）
        consultantPlanService.getConsultantPlanList({ year: yearNum, campus: currentCampus, data_type: categoryName }).catch(() => []),
        // 获取所有神殿年度计划汇总（从神殿月度财务数据表，用于子表1神殿汇总行）
        // 使用 getCombinedMonthlyDataV2 为每个神殿获取数据，然后汇总
        Promise.all(
          currentCampusList.map(c =>
            getCombinedMonthlyDataV2({ year: yearNum, campus: c.name, data_type: 财务数据类型 })
              .then(res => {
                if (res?.success && res?.data?.年度汇总) {
                  return {
                    神殿: c.name,
                    计划收入: res.data.年度汇总.计划收入 || 0,
                    计划招生: res.data.年度汇总.计划招生 || 0
                  }
                }
                return { 神殿: c.name, 计划收入: 0, 计划招生: 0 }
              })
              .catch(() => ({ 神殿: c.name, 计划收入: 0, 计划招生: 0 }))
          )
        ).catch(() => []),
        // 获取当前神殿月度计划数据（从神殿月度财务数据表，用于子表2月度数据行）
        getCombinedMonthlyDataV2({ year: yearNum, campus: currentCampus, data_type: 财务数据类型 }).catch((err) => {
          console.error(`获取${财务数据类型}神殿月度计划数据失败:`, err)
          return null
        }),
        // 获取所有神殿的营销部计划数据
        // 新媒体：从年度网络计划表获取
        // 市场口碑、合作伙伴：从月度详细计划获取
        marketPlanApiPath
          ? Promise.all(
              currentCampusList.map(c => {
                if (categoryName === '新媒体') {
                  // 新媒体：从年度网络计划表获取
                  return api.get(marketPlanApiPath, {
                    params: { year: yearNum, campus: c.name }
                  }).then(res => ({
                    campus: c.name,
                    data: Array.isArray(res.data) ? res.data : null
                  })).catch(() => ({ campus: c.name, data: null }))
                } else {
                  // 市场口碑、合作伙伴：从月度详细计划获取
                  return api.get(marketPlanApiPath, {
                    params: { year: yearNum, campus: c.name }
                  }).then(res => ({
                    campus: c.name,
                    data: res.data?.code === 0 && res.data?.data ? res.data.data : null
                  })).catch(() => ({ campus: c.name, data: null }))
                }
              })
            )
          : Promise.resolve([]),
      ])

      // 处理市场部计划数据（新媒体、市场口碑、合作伙伴）
      const marketPlanByCampus: Record<string, { 计划收入: number; 计划招生: number }> = {}
      const marketPlanByMonth: Record<number, { 计划收入: number; 计划招生: number }> = {}
      
      if (marketPlanApiPath && allCampusMarketPlanData.length > 0) {
        console.log(`🔍 开始处理${categoryName}的市场部计划数据:`, allCampusMarketPlanData)
        
        // 处理所有神殿的市场部计划数据
        allCampusMarketPlanData.forEach(({ campus: campusName, data: planResult }) => {
          console.log(`🔍 处理神殿 ${campusName} 的数据:`, planResult)
          if (!planResult) return
          
          let campusPlanIncome = 0
          let campusPlanEnroll = 0
          
          if (categoryName === '新媒体') {
            // 新媒体：从年度网络计划表获取（数组格式）
            // planResult 格式: [{ month: 0, newmedia_plan_income: xxx, newmedia_plan_signup: xxx, ... }, ...]
            if (Array.isArray(planResult)) {
              planResult.forEach((row: any) => {
                const month = row.month // 0=总计, 1-12=月份
                const monthPlanIncome = Number(row.newmedia_plan_income || 0)
                const monthPlanEnroll = Number(row.newmedia_plan_signup || 0)
                
                // 累加年度汇总（排除总计行 month=0）
                if (month > 0) {
                  campusPlanIncome += monthPlanIncome
                  campusPlanEnroll += monthPlanEnroll
                  
                  // 如果是当前神殿，记录月度数据（用于表2）
                  if (campusName === currentCampus) {
                    if (!marketPlanByMonth[month]) {
                      marketPlanByMonth[month] = { 计划收入: 0, 计划招生: 0 }
                    }
                    marketPlanByMonth[month].计划收入 += monthPlanIncome
                    marketPlanByMonth[month].计划招生 += monthPlanEnroll
                    console.log(`🔍 当前神殿 ${campusName} 月份 ${month} 数据:`, marketPlanByMonth[month])
                  }
                }
              })
            }
          } else {
            // 市场口碑、合作伙伴：从月度详细计划获取（嵌套对象格式）
            // planResult 格式: { 1: { "合作伙伴1": { plan_income, plan_enrollment, ... }, "合作伙伴2": {...} }, 2: {...}, ... }
            console.log(`🔍 ${categoryName} 神殿 ${campusName} planResult类型:`, typeof planResult, '是否为数组:', Array.isArray(planResult))
            
            Object.entries(planResult).forEach(([monthStr, monthData]: [string, any]) => {
              const month = parseInt(monthStr)
              if (isNaN(month) || !monthData || typeof monthData !== 'object') {
                console.warn(`⚠️ 跳过无效月份: ${monthStr}, month=${month}`)
                return
              }
              
              // monthData 是一个对象，包含多个合作伙伴/渠道的数据
              // 需要遍历所有合作伙伴，累加他们的 plan_income 和 plan_enrollment
              let monthPlanIncome = 0
              let monthPlanEnroll = 0
              
              Object.values(monthData).forEach((partnerData: any) => {
                if (partnerData && typeof partnerData === 'object') {
                  monthPlanIncome += Number(partnerData.plan_income || 0)
                  monthPlanEnroll += Number(partnerData.plan_enrollment || 0)
                }
              })
              
              console.log(`🔍 月份 ${month} 累加所有合作伙伴后: 计划收入=${monthPlanIncome}, 计划招生=${monthPlanEnroll}`)
              
              campusPlanIncome += monthPlanIncome
              campusPlanEnroll += monthPlanEnroll
              
              // 如果是当前神殿，记录月度数据（用于表2）
              if (campusName === currentCampus) {
                if (!marketPlanByMonth[month]) {
                  marketPlanByMonth[month] = { 计划收入: 0, 计划招生: 0 }
                }
                marketPlanByMonth[month].计划收入 += monthPlanIncome
                marketPlanByMonth[month].计划招生 += monthPlanEnroll
                console.log(`✅ 当前神殿 ${campusName} 月份 ${month} 累加后数据:`, marketPlanByMonth[month])
              }
            })
          }
          
          // 记录神殿年度汇总（用于表1）
          if (campusPlanIncome > 0 || campusPlanEnroll > 0) {
            marketPlanByCampus[campusName] = {
              计划收入: campusPlanIncome,
              计划招生: campusPlanEnroll
            }
            console.log(`🔍 神殿 ${campusName} 年度汇总:`, { campusPlanIncome, campusPlanEnroll })
          }
        })
        
        console.log(`✅ 从市场部计划获取到${categoryName}数据:`, {
          神殿数: Object.keys(marketPlanByCampus).length,
          当前神殿月度数: Object.keys(marketPlanByMonth).length,
          marketPlanByCampus,
          marketPlanByMonth
        })
      }
      
      // 检查是否获取到计划数据（仅在数据为空时提示）
      if (marketPlanApiPath) {
        // 新媒体、市场口碑、合作伙伴：检查市场部计划数据
        if (Object.keys(marketPlanByCampus).length === 0) {
          const dataSourceHint = categoryName === '新媒体' 
            ? '年度网络计划表' 
            : '月度详细计划表'
          console.warn(`⚠️ 未获取到${yearNum}年${categoryName}的市场部计划数据，请在"${dataSourceHint}"中录入`)
        }
      } else if (!campusMonthlyPlanData?.success || !campusMonthlyPlanData?.data?.月度数据 || campusMonthlyPlanData.data.月度数据.length === 0) {
        console.warn(`⚠️ 未获取到${currentCampus}${yearNum}年${财务数据类型}的月度计划数据，请在"007财务收入"页面录入`)
      }

      // 处理渠道、口碑、神殿新媒体的费用投入数据
      // 从 consultantPlanMap 获取（与表4保持一致）
      // 构建月度费用投入映射: { 月份: 费用投入总额 }
      const planExpenseByMonth: Record<number, number> = {}
      if (categoryName === '渠道' || categoryName === '口碑' || categoryName === '神殿新媒体') {
        // 从 consultantPlanMap 遍历获取费用投入（key格式：咨询师_月份）
        if (consultantPlanMap && consultantPlanMap.size > 0) {
          consultantPlanMap.forEach((plan: any, key: string) => {
            const parts = key.split('_')
            if (parts.length >= 2) {
              const month = parseInt(parts[parts.length - 1])
              if (month >= 1 && month <= 12 && plan.费用投入) {
                planExpenseByMonth[month] = (planExpenseByMonth[month] || 0) + (plan.费用投入 || 0)
              }
            }
          })
        }
      }

      // 免费推广的费用投入：从咨询师数据计算（咨询量成本 × 咨询总量）
      // 这样表1、表2、表4的费用投入数据保持一致
      const freePromotionExpenseByMonth: Record<number, number> = {}
      if (categoryName === '其他') {
        // 获取咨询师列表
        const apiConsultantNames = consultantMonthlyData?.success && consultantMonthlyData.data?.咨询师数据
          ? Object.keys(consultantMonthlyData.data.咨询师数据)
          : []
        const tempConsultants = apiConsultantNames.length > 0 ? apiConsultantNames : consultants
        
        // 计算每月的费用投入汇总
        MONTHS.forEach(m => {
          let monthTotal = 0
          const costData = marketCostData[m]
          const unitCost = costData?.consult_cost ?? costData?.咨询量成本 ?? costData?.plan_cost ?? 0
          
          tempConsultants.forEach(name => {
            if (consultantMonthlyData?.success && consultantMonthlyData.data?.咨询师数据) {
              const consultantData = consultantMonthlyData.data.咨询师数据[name]
              if (consultantData && consultantData[m]) {
                const consultCount = consultantData[m].咨询总量 ?? 0
                if (unitCost > 0 && consultCount > 0) {
                  monthTotal += Math.round(unitCost * consultCount)
                }
              }
            }
          })
          
          if (monthTotal > 0) {
            freePromotionExpenseByMonth[m] = monthTotal
          }
        })
      }

      // ========== 1. 生成神殿汇总表数据 ==========
      const makeSummaryRow = (序号: number | string, campus: string, isTotal = false): CampusSummaryRow => {
        const staffing = staffingMap.get(campus)
        
        // 计算年度市场投入总额
        // SEM、新媒体、市场口碑、合作伙伴: 各月（咨询量成本 × 咨询总量）累加
        // 渠道、口碑、神殿新媒体: 从咨询师月度计划的费用投入字段累加
        // 免费推广: 从咨询师费用投入汇总（咨询量成本 × 咨询总量）
        let yearlyMarketCost: number | null = null
        let yearlyEnrollment = 0
        
        const usePlanExpense = categoryName === '渠道' || categoryName === '口碑' || categoryName === '神殿新媒体'
        const useFreePromotionCost = categoryName === '其他'  // 免费推广
        
        if (monthlyCampusData?.success && monthlyCampusData.data?.月度数据) {
          let totalMarketCost = 0
          MONTHS.forEach(m => {
            const monthStats = monthlyCampusData.data.月度数据.find((item: any) => item.月份 === m)
            
            if (usePlanExpense) {
              // 渠道、口碑、神殿新媒体: 从咨询师月度计划获取费用投入
              totalMarketCost += planExpenseByMonth[m] || 0
            } else if (useFreePromotionCost) {
              // 免费推广: 从咨询师费用投入汇总（和表4保持一致）
              totalMarketCost += freePromotionExpenseByMonth[m] || 0
            } else {
              // SEM、新媒体、市场口碑、合作伙伴: 咨询量成本 × 咨询总量
              const consultCount = monthStats?.咨询总量 ?? 0
              const costData = marketCostData[m]
              
              if (costData && consultCount > 0) {
                const unitCost = costData.consult_cost ?? costData.咨询量成本 ?? costData.plan_cost ?? 0
                if (unitCost > 0) {
                  totalMarketCost += Math.round(unitCost * consultCount)
                }
              }
            }
            
            yearlyEnrollment += monthStats?.报名量 ?? 0
          })
          yearlyMarketCost = totalMarketCost > 0 ? totalMarketCost : null
        } else if (usePlanExpense) {
          // 即使没有月度数据，渠道等类型也应从计划数据获取费用投入
          let totalMarketCost = 0
          MONTHS.forEach(m => {
            totalMarketCost += planExpenseByMonth[m] || 0
          })
          yearlyMarketCost = totalMarketCost > 0 ? totalMarketCost : null
        } else if (useFreePromotionCost) {
          // 免费推广: 从咨询师费用投入汇总
          let totalMarketCost = 0
          MONTHS.forEach(m => {
            totalMarketCost += freePromotionExpenseByMonth[m] || 0
          })
          yearlyMarketCost = totalMarketCost > 0 ? totalMarketCost : null
        }
        
        // 招生成本 = 市场投入 / 实际招生
        const recruitmentCost = (yearlyMarketCost && yearlyEnrollment > 0) 
          ? Math.round(yearlyMarketCost / yearlyEnrollment) 
          : null
        
        return {
          key: `summary_${序号}_${campus}`,
          序号,
          神殿: isTotal ? '' : campus,
          isTotal,
          计划收入: null,
          实际收入: null,
          收入完成率: '-',
          计划招生: null,
          实际招生: null,
          退费人数: null,
          上门总量: null,
          咨询总量: null,
          电话量: null,
          总转: '-',
          当面转化: '-',
          电转门: '-',
          市场投入: yearlyMarketCost,
          招生成本: recruitmentCost,
          咨询总职数: staffing?.咨询总职数 ?? null,
          咨询干部职数: staffing?.咨询干部职数 ?? null,
          咨询员工职数: staffing?.咨询员工职数 ?? null,
          渠道总职数: staffing?.渠道总职数 ?? null,
          县办: staffing?.县办 ?? null,
          乡办: staffing?.乡办 ?? null,
          信息员: staffing?.信息员 ?? null,
        }
      }

      // 对于"其他"（免费推广）、"网络"（SEM）、"新媒体"、"合作伙伴"和"市场口碑"类型，只显示当前选中的神殿
      const summaryData: CampusSummaryRow[] = (categoryName === '其他' || categoryName === '网络' || categoryName === '新媒体' || categoryName === '合作伙伴' || categoryName === '市场口碑')
        ? [makeSummaryRow(1, currentCampus, false)]
        : currentCampusList.map((c, idx) => makeSummaryRow(idx + 1, c.name, false))
      
      // "其他"、"网络"、"新媒体"、"合作伙伴"和"市场口碑"类型不需要合计行
      if (categoryName !== '其他' && categoryName !== '网络' && categoryName !== '新媒体' && categoryName !== '合作伙伴' && categoryName !== '市场口碑') {
        summaryData.push(makeSummaryRow('合计', '', true))
      }

      // 填充API数据
      if (consultResult?.success && consultResult?.data?.神殿数据) {
        consultResult.data.神殿数据.forEach((item: any) => {
          // 模糊匹配神殿名：后端会去除省份前缀（如"河北主神殿"→"主神殿"），需兼容两种格式
          const row = summaryData.find(r => r.神殿 === item.神殿 || r.神殿?.includes(item.神殿) || item.神殿?.includes(r.神殿))
          if (row) {
            row.咨询总量 = item.咨询总量 || null
            row.上门总量 = item.上门量 || null
            row.实际招生 = item.报名量 || null
            row.退费人数 = item.退费人数 || null
            row.电话量 = item.电话量 || null
            row.实际收入 = item.实际收入 || null
            calculateRates(row)
          }
        })
      }

      // 填充年度计划数据
      // 新媒体：从年度网络计划表获取
      // 市场口碑、合作伙伴：从月度详细计划获取
      // 其他类型：使用神殿月度财务数据表（与007同源）
      if (marketPlanApiPath && Object.keys(marketPlanByCampus).length > 0) {
        // 使用市场部计划数据
        const dataSourceName = categoryName === '新媒体' ? '年度网络计划表' : '月度详细计划表'
        console.log(`🔍 使用市场部${dataSourceName}填充年度计划`)
        summaryData.forEach(row => {
          if (!row.isTotal && row.神殿) {
            const planData = marketPlanByCampus[row.神殿]
            if (planData) {
              row.计划收入 = planData.计划收入 || null
              row.计划招生 = planData.计划招生 || null
              console.log(`🔍 填充神殿 ${row.神殿} 计划数据:`, planData)
            }
          }
        })
      } else if (yearlyPlanSummary && yearlyPlanSummary.length > 0) {
        // 使用神殿月度财务数据表
        console.log(`🔍 使用神殿月度财务数据表填充年度计划`)
        yearlyPlanSummary.forEach((item: any) => {
          const row = summaryData.find(r => 
            r.神殿 === item.神殿 || 
            r.神殿?.includes(item.神殿?.replace(/神殿$/, '')) || 
            item.神殿?.includes(r.神殿?.replace(/神殿$/, ''))
          )
          if (row) {
            row.计划收入 = (row.计划收入 || 0) + (item.计划收入 || 0) || null
            row.计划招生 = (row.计划招生 || 0) + (item.计划招生 || 0) || null
          }
        })
      }

      // 计算汇总行（"其他"、"网络"、"新媒体"、"合作伙伴"和"市场口碑"类型没有合计行，跳过）
      if (categoryName !== '其他' && categoryName !== '网络' && categoryName !== '新媒体' && categoryName !== '合作伙伴' && categoryName !== '市场口碑') {
        const summaryTotalRow = summaryData.find(r => r.isTotal)
        if (summaryTotalRow) {
          const dataRows = summaryData.filter(r => !r.isTotal)
          const sumFields: (keyof CampusSummaryRow)[] = [
            '计划收入', '实际收入', '计划招生', '实际招生', '退费人数',
            '上门总量', '咨询总量', '电话量', '市场投入', '招生成本',
            '咨询总职数', '咨询干部职数', '咨询员工职数',
            '渠道总职数', '县办', '乡办', '信息员'
          ]
          sumFields.forEach(field => {
            const sum = dataRows.reduce((acc, r) => {
              const val = r[field]
              return acc + (typeof val === 'number' ? val : 0)
            }, 0)
            // 对计划收入和实际收入保留两位小数，其他字段四舍五入为整数
            if (field === '计划收入' || field === '实际收入') {
              ;(summaryTotalRow as any)[field] = sum > 0 ? parseFloat(sum.toFixed(2)) : null
            } else {
              ;(summaryTotalRow as any)[field] = sum > 0 ? Math.round(sum) : null
            }
          })
          calculateRates(summaryTotalRow)
        }
      }
      setSummaryRows(summaryData)

      // ========== 2. 生成月度数据表 ==========
      // 新媒体：计划数据从年度网络计划表获取
      // 市场口碑、合作伙伴：计划数据从月度详细计划获取
      // 其他类型：计划数据从神殿月度财务数据表直读（与007 TAB2同源）
      const makeMonthlyRow = (月份: number | string, campus: string, isTotal = false): MonthlyDataRow => {
        const monthNum = typeof 月份 === 'number' ? 月份 : 0
        const costData = marketCostData[monthNum]
        
        // 从API获取月度实际数据
        let monthStats = null
        if (monthlyCampusData?.success && monthlyCampusData.data?.月度数据) {
          monthStats = monthlyCampusData.data.月度数据.find((m: any) => m.月份 === monthNum)
        }

        // 获取计划数据
        let campusPlanIncome: number | null = null
        let campusPlanEnroll: number | null = null
        
        if (marketPlanApiPath && monthNum > 0) {
          // 新媒体、市场口碑、合作伙伴：从市场部月度明细计划获取
          const planData = marketPlanByMonth[monthNum]
          if (planData) {
            campusPlanIncome = planData.计划收入 || null
            campusPlanEnroll = planData.计划招生 || null
            console.log(`🔍 月份 ${monthNum} 从市场部计划获取:`, planData)
          }
        } else if (campusMonthlyPlanData?.success && campusMonthlyPlanData?.data?.月度数据 && monthNum > 0) {
          // 其他类型：从神殿月度财务数据获取
          const planRow = campusMonthlyPlanData.data.月度数据.find((r: any) => r.月份 === monthNum)
          if (planRow) {
            campusPlanIncome = planRow.计划收入 ? Number(planRow.计划收入) : null
            campusPlanEnroll = planRow.计划招生 ? Number(planRow.计划招生) : null
            console.log(`🔍 月份 ${monthNum} 从神殿月度财务数据获取:`, { campusPlanIncome, campusPlanEnroll })
          }
        }
        
        // 获取咨询总量（从统计数据）
        const consultCount = monthStats?.咨询总量 ?? 0
        
        // 计算市场投入
        // 渠道、口碑、神殿新媒体: 从咨询师月度计划的费用投入字段获取
        // 免费推广: 从咨询师费用投入汇总（咨询量成本 × 咨询总量）
        // SEM、新媒体、市场口碑、合作伙伴: 咨询量成本 × 咨询总量
        let marketCost: number | null = null
        const usePlanExpense = categoryName === '渠道' || categoryName === '口碑' || categoryName === '神殿新媒体'
        const useFreePromotionCost = categoryName === '其他'  // 免费推广
        
        if (usePlanExpense) {
          // 从咨询师月度计划获取费用投入
          const planExpense = planExpenseByMonth[monthNum] || 0
          marketCost = planExpense > 0 ? planExpense : null
        } else if (useFreePromotionCost) {
          // 免费推广: 从咨询师费用投入汇总获取（和表4保持一致）
          const expense = freePromotionExpenseByMonth[monthNum] || 0
          marketCost = expense > 0 ? expense : null
        } else if (costData && consultCount > 0) {
          // 根据不同类型获取咨询量成本
          // SEM: consult_cost
          // 新媒体: 咨询量成本
          // 市场口碑: plan_cost 作为咨询量成本
          const unitCost = costData.consult_cost ?? costData.咨询量成本 ?? costData.plan_cost ?? 0
          if (unitCost > 0) {
            marketCost = Math.round(unitCost * consultCount)
          }
        }
        
        return {
          key: `monthly_${月份}_${campus}`,
          序号: 月份,
          月份,
          神殿: campus,
          isTotal,
          计划收入: campusPlanIncome,
          实际收入: monthStats?.实际收入 ?? null,
          收入完成率: '-',
          计划招生: campusPlanEnroll,
          实际招生: monthStats?.报名量 ?? null,
          退费人数: monthStats?.退费人数 ?? null,
          上门总量: monthStats?.上门量 ?? null,
          咨询总量: monthStats?.咨询总量 ?? null,
          电话量: monthStats?.电话量 ?? null,
          总转: '-',
          当面转化: '-',
          电转门: '-',
          // 市场投入：优先使用计算后的 marketCost（咨询量成本 × 咨询总量），fallback 到直接的市场投入字段
          市场投入: marketCost ?? costData?.sem_consumption ?? costData?.actual_expense ?? costData?.市场投入 ?? null,
          招生成本: null,
        }
      }

      const monthlyData: MonthlyDataRow[] = MONTHS.map(m => makeMonthlyRow(m, currentCampus, false))
      monthlyData.push(makeMonthlyRow('合计', currentCampus, true))

      // 计算招生成本和汇总行
      const monthlyTotalRow = monthlyData.find(r => r.isTotal)
      if (monthlyTotalRow) {
        const dataRows = monthlyData.filter(r => !r.isTotal)
        ;['计划收入', '计划招生', '实际收入', '实际招生', '退费人数', '上门总量', '咨询总量', '电话量', '市场投入'].forEach(field => {
          const sum = dataRows.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
          // 对计划收入和实际收入保留两位小数，其他字段四舍五入为整数
          if (field === '计划收入' || field === '实际收入') {
            ;(monthlyTotalRow as any)[field] = sum > 0 ? parseFloat(sum.toFixed(2)) : null
          } else {
            ;(monthlyTotalRow as any)[field] = sum > 0 ? Math.round(sum) : null
          }
        })
      }
      monthlyData.forEach(row => {
        calculateRates(row)
        // 招生成本 = 市场投入 / 实际招生
        if (row.市场投入 && row.实际招生 && row.实际招生 > 0) {
          row.招生成本 = Math.round(row.市场投入 / row.实际招生)
        }
      })
      setMonthlyRows(monthlyData)

      // ========== 3. 生成咨询师汇总表 ==========
      // 优先使用API返回的咨询师名单（来自实际数据），fallback到用户列表
      const apiConsultantNames = consultantMonthlyData?.success && consultantMonthlyData.data?.咨询师数据
        ? Object.keys(consultantMonthlyData.data.咨询师数据)
        : []
      const effectiveConsultants = apiConsultantNames.length > 0 ? apiConsultantNames : consultants

      const makeConsultantRow = (序号: number | string, name: string, isTotal = false): ConsultantDataRow => ({
        key: `consultant_${序号}_${name}`,
        序号,
        咨询师: isTotal ? '' : name,
        isTotal,
        计划收入: null,
        实际收入: null,
        收入完成率: '-',
        计划招生: null,
        实际招生: null,
        退费人数: null,
        上门总量: null,
        咨询总量: null,
        电话量: null,
        总转: '-',
        当面转化: '-',
        电转门: '-',
        市场投入: null,
        招生成本: null,
      })

      const consultantData: ConsultantDataRow[] = effectiveConsultants.map((name, idx) =>
        makeConsultantRow(idx + 1, name, false)
      )
      // 补充空行到10行
      for (let i = consultantData.length; i < 10; i++) {
        consultantData.push(makeConsultantRow(i + 1, '', false))
      }
      consultantData.push(makeConsultantRow('合计', '', true))

      // 计算咨询师年度汇总（从API数据和计划数据累加）
      if (consultantMonthlyData?.success && consultantMonthlyData.data?.咨询师数据) {
        const 咨询师数据 = consultantMonthlyData.data.咨询师数据
        const usePlanExpense = categoryName === '渠道' || categoryName === '口碑' || categoryName === '神殿新媒体'
        
        consultantData.forEach(row => {
          if (!row.isTotal && row.咨询师) {
            // 累加年度计划数据
            let yearlyPlanIncome = 0
            let yearlyPlanEnrollment = 0
            // 累加年度实际数据
            let yearly实际招生 = 0
            let yearly退费人数 = 0
            let yearly上门总量 = 0
            let yearly咨询总量 = 0
            let yearly电话量 = 0
            // 累加年度市场投入
            let yearly市场投入 = 0
            
            const consultantMonthlyStats = 咨询师数据[row.咨询师] || {}
            
            MONTHS.forEach(m => {
              // 计划数据
              const planKey = `${row.咨询师}_${m}`
              const plan = consultantPlanMap.get(planKey)
              if (plan) {
                yearlyPlanIncome += plan.计划收入 || 0
                yearlyPlanEnrollment += plan.计划招生 || 0
                // 渠道、口碑、神殿新媒体、其他: 从计划数据的费用投入字段累加
                if (usePlanExpense) {
                  yearly市场投入 += plan.费用投入 || 0
                }
              }
              
              // 实际数据
              const monthStats = consultantMonthlyStats[m]
              if (monthStats) {
                yearly实际招生 += monthStats.报名量 || 0
                yearly退费人数 += monthStats.退费人数 || 0
                yearly上门总量 += monthStats.上门量 || 0
                yearly咨询总量 += monthStats.咨询总量 || 0
                yearly电话量 += monthStats.电话量 || 0
                
                // SEM、新媒体、市场口碑、合作伙伴: 咨询量成本 × 咨询总量
                if (!usePlanExpense) {
                  const costData = marketCostData[m]
                  const consultCount = monthStats.咨询总量 ?? 0
                  if (costData && consultCount > 0) {
                    const unitCost = costData.consult_cost ?? costData.咨询量成本 ?? costData.plan_cost ?? 0
                    if (unitCost > 0) {
                      yearly市场投入 += Math.round(unitCost * consultCount)
                    }
                  }
                }
              }
            })
            
            row.计划收入 = yearlyPlanIncome || null
            row.计划招生 = yearlyPlanEnrollment || null
            row.实际招生 = yearly实际招生 || null
            row.退费人数 = yearly退费人数 || null
            row.上门总量 = yearly上门总量 || null
            row.咨询总量 = yearly咨询总量 || null
            row.电话量 = yearly电话量 || null
            row.市场投入 = yearly市场投入 > 0 ? yearly市场投入 : null
            // 招生成本 = 市场投入 / 实际招生
            row.招生成本 = (row.市场投入 && row.实际招生 && row.实际招生 > 0) 
              ? Math.round(row.市场投入 / row.实际招生) 
              : null
          }
          calculateRates(row)
        })
      } else {
        // 如果API数据获取失败，仅填充计划数据
        consultantData.forEach(row => {
          if (!row.isTotal && row.咨询师) {
            let yearlyPlanIncome = 0
            let yearlyPlanEnrollment = 0
            MONTHS.forEach(m => {
              const planKey = `${row.咨询师}_${m}`
              const plan = consultantPlanMap.get(planKey)
              if (plan) {
                yearlyPlanIncome += plan.计划收入 || 0
                yearlyPlanEnrollment += plan.计划招生 || 0
              }
            })
            row.计划收入 = yearlyPlanIncome || null
            row.计划招生 = yearlyPlanEnrollment || null
          }
          calculateRates(row)
        })
      }
      
      // 计算咨询师汇总行
      const consultantTotalRow = consultantData.find(r => r.isTotal)
      if (consultantTotalRow) {
        const dataRows = consultantData.filter(r => !r.isTotal && r.咨询师)
        ;['计划收入', '计划招生', '实际收入', '实际招生', '退费人数', '上门总量', '咨询总量', '电话量', '市场投入'].forEach(field => {
          const sum = dataRows.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
          // 对计划收入和实际收入保留两位小数，其他字段四舍五入为整数
          if (field === '计划收入' || field === '实际收入') {
            ;(consultantTotalRow as any)[field] = sum > 0 ? parseFloat(sum.toFixed(2)) : null
          } else {
            ;(consultantTotalRow as any)[field] = sum > 0 ? Math.round(sum) : null
          }
        })
        // 招生成本 = 市场投入 / 实际招生
        if (consultantTotalRow.市场投入 && consultantTotalRow.实际招生 && consultantTotalRow.实际招生 > 0) {
          consultantTotalRow.招生成本 = Math.round(consultantTotalRow.市场投入 / consultantTotalRow.实际招生)
        }
        calculateRates(consultantTotalRow)
      }
      setConsultantRows(consultantData)

      // ========== 4. 生成咨询师月度明细表 ==========
      const makeConsultantMonthlyRow = (月份: number | string, name: string, isTotal = false): ConsultantMonthlyRow => {
        const monthNum = typeof 月份 === 'number' ? 月份 : 0
        const planKey = `${name}_${monthNum}`
        const plan = consultantPlanMap.get(planKey)
        const costData = marketCostData[monthNum]
        const usePlanExpense = categoryName === '渠道' || categoryName === '口碑' || categoryName === '神殿新媒体'
        
        // 从API获取实际数据
        let monthStats = null
        if (consultantMonthlyData?.success && consultantMonthlyData.data?.咨询师数据) {
          const consultantData = consultantMonthlyData.data.咨询师数据[name]
          if (consultantData && typeof 月份 === 'number') {
            monthStats = consultantData[月份]
          }
        }
        
        // 获取咨询总量（从统计数据）
        const consultCount = monthStats?.咨询总量 ?? 0
        
        // 计算市场投入
        // 渠道、口碑、神殿新媒体: 从咨询师月度计划的费用投入字段获取
        // SEM、新媒体、市场口碑、合作伙伴、免费推广: 咨询量成本 × 咨询总量
        let marketCost: number | null = null
        if (usePlanExpense) {
          // 从咨询师计划获取费用投入
          const planExpense = plan?.费用投入 ?? 0
          marketCost = planExpense > 0 ? planExpense : null
        } else if (costData && consultCount > 0) {
          // 咨询量成本 × 咨询总量（适用于SEM、新媒体、市场口碑、合作伙伴、免费推广）
          const unitCost = costData.consult_cost ?? costData.咨询量成本 ?? costData.plan_cost ?? 0
          if (unitCost > 0) {
            marketCost = Math.round(unitCost * consultCount)
          }
        }
        
        return {
          key: `cm_${月份}_${name}`,
          序号: 月份,
          月份,
          咨询师: name,
          isTotal,
          计划收入: plan?.计划收入 ?? null,
          实际收入: monthStats?.实际收入 ?? null,  // 从咨询量统计数据获取实际收入
          收入完成率: '-',
          计划招生: plan?.计划招生 ?? null,
          实际招生: monthStats?.报名量 ?? null,
          退费人数: monthStats?.退费人数 ?? null,
          上门总量: monthStats?.上门量 ?? null,
          咨询总量: monthStats?.咨询总量 ?? null,
          电话量: monthStats?.电话量 ?? null,
          总转: '-',
          当面转化: '-',
          电转门: '-',
          市场投入: marketCost,  // 费用投入 = 咨询量成本 × 咨询总量
          招生成本: null,
        }
      }

      const cmData: ConsultantMonthlyRow[] = []
      MONTHS.forEach(m => {
        // 每个月的咨询师数据
        effectiveConsultants.forEach(name => {
          cmData.push(makeConsultantMonthlyRow(m, name, false))
        })
        // 补充空行
        for (let i = effectiveConsultants.length; i < 4; i++) {
          cmData.push(makeConsultantMonthlyRow(m, '', false))
        }
        // 每个月的合计行
        const monthTotalRow = makeConsultantMonthlyRow('', '合计', true)
        monthTotalRow.月份 = m  // 确保月份正确
        monthTotalRow.序号 = m  // 确保序号正确
        // 计算月度合计（从咨询师数据汇总）
        const monthDataRows = cmData.filter(r => r.月份 === m && !r.isTotal && r.咨询师)
        ;['计划收入', '计划招生', '实际收入', '实际招生', '退费人数', '上门总量', '咨询总量', '电话量', '市场投入'].forEach(field => {
          const sum = monthDataRows.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
          // 对计划收入和实际收入保留两位小数，其他字段四舍五入为整数
          if (field === '计划收入' || field === '实际收入') {
            ;(monthTotalRow as any)[field] = sum > 0 ? parseFloat(sum.toFixed(2)) : null
          } else {
            ;(monthTotalRow as any)[field] = sum > 0 ? Math.round(sum) : null
          }
        })
        
        // 计算招生成本 = 市场投入 / 实际招生
        if (monthTotalRow.市场投入 && monthTotalRow.实际招生 && monthTotalRow.实际招生 > 0) {
          monthTotalRow.招生成本 = Math.round(monthTotalRow.市场投入 / monthTotalRow.实际招生)
        }
        cmData.push(monthTotalRow)
      })
      // 年度总合计（从所有咨询师数据汇总）
      const yearTotalRow = makeConsultantMonthlyRow('合计', '', true)
      const allDataRows = cmData.filter(r => !r.isTotal && r.咨询师)
      ;['计划收入', '计划招生', '实际收入', '实际招生', '退费人数', '上门总量', '咨询总量', '电话量', '市场投入'].forEach(field => {
        const sum = allDataRows.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
        // 对计划收入和实际收入保留两位小数，其他字段四舍五入为整数
        if (field === '计划收入' || field === '实际收入') {
          ;(yearTotalRow as any)[field] = sum > 0 ? parseFloat(sum.toFixed(2)) : null
        } else {
          ;(yearTotalRow as any)[field] = sum > 0 ? Math.round(sum) : null
        }
      })
      
      // 计算招生成本 = 市场投入 / 实际招生
      if (yearTotalRow.市场投入 && yearTotalRow.实际招生 && yearTotalRow.实际招生 > 0) {
        yearTotalRow.招生成本 = Math.round(yearTotalRow.市场投入 / yearTotalRow.实际招生)
      }
      cmData.push(yearTotalRow)

      // 计算所有行的转化率和招生成本
      cmData.forEach(row => {
        calculateRates(row)
        // 招生成本 = 市场投入 / 实际招生（非合计行也需要计算）
        if (!row.招生成本 && row.市场投入 && row.实际招生 && row.实际招生 > 0) {
          row.招生成本 = Math.round(row.市场投入 / row.实际招生)
        }
      })
      setConsultantMonthlyRows(cmData)

    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [year, categoryName, currentCampus, consultants, campusStore])  // consultants kept for fallback

  useEffect(() => {
    loadConsultants()
  }, [loadConsultants])

  useEffect(() => {
    if (consultants.length > 0) {
      loadData()
    }
  }, [year, categoryName, consultants, currentCampus, loadData])

  // ==================== 可编辑功能 ====================

  // 处理计划数据变更
  const handlePlanChange = useCallback((
    月份: number, 
    咨询师: string, 
    field: '计划收入' | '计划招生', 
    value: number | null
  ) => {
    const key = `${月份}_${咨询师}`
    setPendingPlanChanges(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(key) || {}
      newMap.set(key, { ...existing, [field]: value || 0 })
      return newMap
    })
  }, [])

  // 保存计划数据
  const savePlanData = useCallback(async () => {
    if (pendingPlanChanges.size === 0) {
      message.info('没有需要保存的更改')
      return
    }

    console.log('🔍 开始保存，pendingPlanChanges:', Array.from(pendingPlanChanges.entries()))

    setSavingPlan(true)
    try {
      const dataList: Omit<consultantPlanService.ConsultantMonthlyPlan, '记录ID'>[] = []

      pendingPlanChanges.forEach((changes, key) => {
        const [monthStr, consultant] = key.split('_')
        const month = parseInt(monthStr, 10)

        // 获取当前咨询师当月的现有数据
        const existingRow = consultantMonthlyRows.find(
          r => r.月份 === month && r.咨询师 === consultant && !r.isTotal
        )

        // 构建保存数据：优先使用变更值，其次使用现有值，最后使用0
        const dataItem = {
          年份: parseInt(year),
          月份: month,
          神殿: currentCampus,
          咨询师: consultant,
          数据类型: categoryName,
          计划收入: changes.计划收入 !== undefined ? changes.计划收入 : (existingRow?.计划收入 ?? 0),
          计划招生: changes.计划招生 !== undefined ? changes.计划招生 : (existingRow?.计划招生 ?? 0),
          费用投入: changes.费用投入 !== undefined ? changes.费用投入 : (existingRow?.市场投入 ?? 0),
        }
        
        console.log('🔍 构建保存数据项:', { 
          key, 
          changes, 
          existingRow: existingRow ? { 计划收入: existingRow.计划收入, 计划招生: existingRow.计划招生, 市场投入: existingRow.市场投入 } : null,
          dataItem 
        })
        
        dataList.push(dataItem)
      })

      console.log('🔍 最终保存数据列表:', dataList)

      await consultantPlanService.batchSaveConsultantPlans(dataList)
      notification.success({ message: '已保存', description: '计划数据保存成功', placement: 'topRight', duration: 3 })
      setPendingPlanChanges(new Map())

      // 重新加载数据
      await loadData()
    } catch (error) {
      console.error('保存计划数据失败:', error)
      notification.error({ message: '保存失败', description: '保存计划数据失败', placement: 'topRight', duration: 4 })
    } finally {
      setSavingPlan(false)
    }
  }, [pendingPlanChanges, consultantMonthlyRows, year, currentCampus, categoryName, loadData])

  // 处理咨询师月度数据更新（包括费用投入）
  const handleUpdateConsultantMonthlyData = useCallback((
    key: string,
    field: '市场投入',
    value: number | null
  ) => {
    setConsultantMonthlyRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.key === key)
      
      if (row && !row.isTotal) {
        // 更新字段值
        row[field] = value
        
        // 重新计算招生成本
        if (row.实际招生 && row.实际招生 > 0 && row.市场投入 !== null) {
          row.招生成本 = row.市场投入 / row.实际招生
        } else {
          row.招生成本 = null
        }
        
        // 重新计算转化率
        calculateRates(row)
        
      // 跟踪费用投入的变更以便保存
      if (typeof row.月份 === 'number' && row.咨询师) {
        const changeKey = `${row.月份}_${row.咨询师}`
        setPendingPlanChanges(prev => {
          const newMap = new Map(prev)
          const existing = newMap.get(changeKey) || {}
          const newChanges = { ...existing, 费用投入: value || 0 }
          newMap.set(changeKey, newChanges)
          console.log('🔍 费用投入变更跟踪:', { 
            key: changeKey, 
            value, 
            费用投入: value || 0,
            changes: newChanges,
            allChanges: Array.from(newMap.entries())
          })
          return newMap
        })
      }
    }      // 重新计算合计行
      return recomputeConsultantMonthlyTotals(next)
    })
  }, [])

  // 重新计算咨询师月度明细表的合计行
  const recomputeConsultantMonthlyTotals = (rows: ConsultantMonthlyRow[]): ConsultantMonthlyRow[] => {
    const sumFields: (keyof ConsultantMonthlyRow)[] = [
      '计划收入', '实际收入', '计划招生', '实际招生', '退费人数',
      '上门总量', '咨询总量', '电话量', '市场投入'
    ]

    // 计算每月合计
    for (let month = 1; month <= 12; month++) {
      const monthRows = rows.filter(r => r.月份 === month && !r.isTotal)
      const monthTotal = rows.find(r => r.月份 === month && r.isTotal)
      
      if (monthTotal) {
        sumFields.forEach(field => {
          const sum = monthRows.reduce((acc, r) => {
            const val = r[field]
            return acc + (typeof val === 'number' ? val : 0)
          }, 0)
          // 对计划收入和实际收入保留两位小数，其他字段四舍五入为整数
          if (field === '计划收入' || field === '实际收入') {
            ;(monthTotal as any)[field] = sum > 0 ? parseFloat(sum.toFixed(2)) : null
          } else {
            ;(monthTotal as any)[field] = sum > 0 ? Math.round(sum) : null
          }
        })
        
        // 计算合计行的招生成本
        if (monthTotal.实际招生 && monthTotal.实际招生 > 0 && monthTotal.市场投入 !== null) {
          monthTotal.招生成本 = monthTotal.市场投入 / monthTotal.实际招生
        } else {
          monthTotal.招生成本 = null
        }
        
        calculateRates(monthTotal)
      }
    }

    // 计算年度总合计
    const yearTotal = rows.find(r => r.月份 === '合计' && r.isTotal)
    if (yearTotal) {
      const allMonthTotals = rows.filter(r => typeof r.月份 === 'number' && r.isTotal)
      sumFields.forEach(field => {
        const sum = allMonthTotals.reduce((acc, r) => {
          const val = r[field]
          return acc + (typeof val === 'number' ? val : 0)
        }, 0)
        // 对计划收入和实际收入保留两位小数，其他字段四舍五入为整数
        if (field === '计划收入' || field === '实际收入') {
          ;(yearTotal as any)[field] = sum > 0 ? parseFloat(sum.toFixed(2)) : null
        } else {
          ;(yearTotal as any)[field] = sum > 0 ? Math.round(sum) : null
        }
      })
      
      // 计算年度总合计的招生成本
      if (yearTotal.实际招生 && yearTotal.实际招生 > 0 && yearTotal.市场投入 !== null) {
        yearTotal.招生成本 = yearTotal.市场投入 / yearTotal.实际招生
      } else {
        yearTotal.招生成本 = null
      }
      
      calculateRates(yearTotal)
    }

    return rows
  }

  // ==================== 级联聚合：表4→表3（咨询师级别内部） ====================

  // 子表2（月度数据）的计划数据已在 loadData 中直接从神殿月度财务数据填充，
  // 不再从咨询师数据（表4）聚合。此处直接透传 monthlyRows。
  const cascadedMonthlyRows: MonthlyDataRow[] = useMemo(() => {
    return monthlyRows
  }, [monthlyRows])

  // 从表4（咨询师月度明细）聚合计划数据到表3（咨询师汇总表）
  const cascadedConsultantRows: ConsultantDataRow[] = useMemo(() => {
    if (consultantRows.length === 0) return consultantRows
    
    // 从 consultantMonthlyRows 按咨询师聚合年度计划数据
    const consultantPlanMap = new Map<string, { 计划收入: number; 计划招生: number }>()
    
    consultantMonthlyRows.forEach(row => {
      if (!row.isTotal && row.咨询师 && typeof row.月份 === 'number') {
        const key = `${row.月份}_${row.咨询师}`
        const pending = pendingPlanChanges.get(key)
        const planIncome = pending?.计划收入 !== undefined ? pending.计划收入 : (row.计划收入 || 0)
        const planEnrollment = pending?.计划招生 !== undefined ? pending.计划招生 : (row.计划招生 || 0)
        
        if (!consultantPlanMap.has(row.咨询师)) {
          consultantPlanMap.set(row.咨询师, { 计划收入: 0, 计划招生: 0 })
        }
        const current = consultantPlanMap.get(row.咨询师)!
        current.计划收入 += planIncome
        current.计划招生 += planEnrollment
      }
    })
    
    // 将聚合的计划数据应用到咨询师汇总行
    const updated = consultantRows.map(row => {
      if (row.isTotal) return { ...row }
      if (!row.咨询师) return { ...row }
      const planData = consultantPlanMap.get(row.咨询师)
      const newRow = {
        ...row,
        计划收入: planData?.计划收入 || row.计划收入,
        计划招生: planData?.计划招生 || row.计划招生,
      }
      calculateRates(newRow)
      return newRow
    })
    
    // 重新计算汇总行
    const totalRow = updated.find(r => r.isTotal)
    if (totalRow) {
      const dataRows = updated.filter(r => !r.isTotal && r.咨询师)
      ;['计划收入', '计划招生', '实际收入', '实际招生', '退费人数', '上门总量', '咨询总量', '电话量'].forEach(field => {
        const sum = dataRows.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
        // 对计划收入和实际收入保留两位小数，其他字段四舍五入为整数
        if (field === '计划收入' || field === '实际收入') {
          ;(totalRow as any)[field] = sum > 0 ? parseFloat(sum.toFixed(2)) : null
        } else {
          ;(totalRow as any)[field] = sum > 0 ? Math.round(sum) : null
        }
      })
      calculateRates(totalRow)
    }
    
    return updated
  }, [consultantRows, consultantMonthlyRows, pendingPlanChanges])

  // ==================== 列定义 ====================

  // 通用的招生收入列
  const incomeColumns: ColumnsType<any> = [
    {
      title: '计划收入',
      dataIndex: '计划收入',
      width: 80,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
    {
      title: '实际收入',
      dataIndex: '实际收入',
      width: 80,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
    {
      title: '收入完成率',
      dataIndex: '收入完成率',
      width: 85,
      align: 'center',
      render: (v, r) => renderRate(v, r.isTotal),
    },
  ]

  // 通用的招生数据列
  const enrollmentColumns: ColumnsType<any> = [
    {
      title: '计划招生',
      dataIndex: '计划招生',
      width: 70,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
    {
      title: '实际招生',
      dataIndex: '实际招生',
      width: 70,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
    {
      title: '退费人数',
      dataIndex: '退费人数',
      width: 70,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
    {
      title: '上门总量',
      dataIndex: '上门总量',
      width: 70,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
    {
      title: '电话量',
      dataIndex: '电话量',
      width: 70,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
    {
      title: '咨询总量',
      dataIndex: '咨询总量',
      width: 70,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
  ]

  // 转化率列（带前缀）- 口碑、神殿新媒体和合作伙伴使用特殊名称
  const rateColumns: ColumnsType<any> = [
    {
      title: (categoryName === '口碑' || categoryName === '神殿新媒体' || categoryName === '合作伙伴') ? '报名转化率' : '总转',
      dataIndex: '总转',
      width: (categoryName === '口碑' || categoryName === '神殿新媒体' || categoryName === '合作伙伴') ? 90 : 70,
      align: 'center',
      render: (v, r) => renderRate(v, r.isTotal),
    },
    {
      title: (categoryName === '口碑' || categoryName === '神殿新媒体' || categoryName === '合作伙伴') ? '当面转化率' : '当面转化',
      dataIndex: '当面转化',
      width: (categoryName === '口碑' || categoryName === '神殿新媒体' || categoryName === '合作伙伴') ? 90 : 80,
      align: 'center',
      render: (v, r) => renderRate(v, r.isTotal),
    },
    {
      title: (categoryName === '口碑' || categoryName === '神殿新媒体' || categoryName === '合作伙伴') ? '上门率' : `${prefix}电转门`,
      dataIndex: '电转门',
      width: (categoryName === '口碑' || categoryName === '神殿新媒体' || categoryName === '合作伙伴') ? 70 : 80,
      align: 'center',
      render: (v, r) => renderRate(v, r.isTotal),
    },
  ]

  // 招生成本列（带前缀） - 根据媒体类型动态显示投入字段标题
  const getCostColumnTitle = () => {
    // 根据媒体类型返回不同的投入字段名
    const titleMap: Record<string, string> = {
      '网络': 'SEM投入',
      '新媒体': '新媒体投入',
      '市场口碑': '市场口碑投入',
      '合作伙伴': '费用投入',
      '渠道': '渠道投入',
      '口碑': '费用投入',
      '神殿新媒体': '费用投入',
    }
    return titleMap[categoryName] || '市场投入'
  }

  const costColumns: ColumnsType<any> = [
    {
      title: getCostColumnTitle(),
      dataIndex: '市场投入',
      width: 90,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
    {
      title: '招生成本',
      dataIndex: '招生成本',
      width: 80,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
  ]

  // 咨询师职数列（仅汇总表使用）
  const consultantJobColumns: ColumnsType<any> = [
    {
      title: '咨询总职数',
      dataIndex: '咨询总职数',
      width: 80,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
    {
      title: '咨询干部职数',
      dataIndex: '咨询干部职数',
      width: 90,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
    {
      title: '咨询员工职数',
      dataIndex: '咨询员工职数',
      width: 90,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
  ]

  // 渠道职数列（仅汇总表使用）
  const channelJobColumns: ColumnsType<any> = [
    {
      title: '渠道总职数',
      dataIndex: '渠道总职数',
      width: 80,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
    {
      title: '县办',
      dataIndex: '县办',
      width: 60,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
    {
      title: '乡办',
      dataIndex: '乡办',
      width: 60,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
    {
      title: '信息员',
      dataIndex: '信息员',
      width: 70,
      align: 'center',
      render: (v, r) => renderValue(v, r.isTotal),
    },
  ]

  // 判断是否为渠道类型（渠道有特殊的职数列）
  const isChannelType = categoryName === '渠道'

  // 1. 神殿汇总表列 - 年度核心数据看板汇总（包含所有列：招生成本、咨询师、渠道职数）
  const summaryColumns: ColumnsType<CampusSummaryRow> = useMemo(() => {
    const cols: ColumnsType<CampusSummaryRow> = [
      {
        title: '序号',
        dataIndex: '序号',
        width: 50,
        align: 'center',
        fixed: 'left',
        render: (v, r) => r.isTotal ? <strong style={{ color: '#f5222d' }}>{v}</strong> : v,
      },
      {
        title: '神殿',
        dataIndex: '神殿',
        width: 100,
        fixed: 'left',
      },
      {
        title: '招生收入',
        children: incomeColumns,
      },
      {
        title: '招生数据',
        children: enrollmentColumns,
      },
    ]

    // 网络(SEM)、新媒体、市场口碑类型：使用各自的表头名称，不显示咨询师和渠道职数列
    if (categoryName === '网络' || categoryName === '新媒体' || categoryName === '市场口碑') {
      // 根据类型确定表头名称
      let rateTitle = 'SEM转化率'
      let costTitle = 'SEM招生成本'
      
      if (categoryName === '新媒体') {
        rateTitle = '新媒体转化率'
        costTitle = '新媒体招生成本'
      } else if (categoryName === '市场口碑') {
        rateTitle = '市场口碑转化率'
        costTitle = '市场口碑招生成本'
      }
      
      cols.push({
        title: rateTitle,
        children: [
          {
            title: '报名转化率',
            dataIndex: '总转',
            width: 90,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
          {
            title: '当面转化率',
            dataIndex: '当面转化',
            width: 90,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
          {
            title: '上门率',
            dataIndex: '电转门',
            width: 70,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
        ],
      })
      cols.push({
        title: costTitle,
        children: [
          {
            title: '费用投入',
            dataIndex: '市场投入',
            width: 90,
            align: 'center',
            render: (v, r) => renderValue(v, r.isTotal),
          },
          {
            title: '招生成本',
            dataIndex: '招生成本',
            width: 80,
            align: 'center',
            render: (v, r) => renderValue(v, r.isTotal),
          },
        ],
      })
    }
    // 其他（免费推广）类型：使用免费推广专用表头
    else if (categoryName === '其他') {
      cols.push({
        title: '免费推广转化率',
        children: [
          {
            title: '报名转化率',
            dataIndex: '总转',
            width: 90,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
          {
            title: '当面转化率',
            dataIndex: '当面转化',
            width: 90,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
          {
            title: '上门率',
            dataIndex: '电转门',
            width: 70,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
        ],
      })
      cols.push({
        title: '免费推广招生成本',
        children: [
          {
            title: '费用投入',
            dataIndex: '市场投入',
            width: 90,
            align: 'center',
            render: (v, r) => renderValue(v, r.isTotal),
          },
          {
            title: '招生成本',
            dataIndex: '招生成本',
            width: 80,
            align: 'center',
            render: (v, r) => renderValue(v, r.isTotal),
          },
        ],
      })
    }
    // 合作伙伴类型：使用特殊的表头名称，不显示咨询师和渠道职数列
    else if (categoryName === '合作伙伴') {
      cols.push({
        title: '合作伙伴转化率',
        children: rateColumns,
      })
      cols.push({
        title: '合作伙伴招生成本',
        children: costColumns,
      })
    } else {
      // 其他类型：使用通用表头，包含咨询师和渠道职数列
      cols.push({
        title: '转化率',
        children: rateColumns,
      })
      cols.push({
        title: '招生成本',
        children: costColumns,
      })
      cols.push({
        title: '咨询师',
        children: consultantJobColumns,
      })
      cols.push({
        title: '渠道职数',
        children: channelJobColumns,
      })
    }

    return cols
  }, [categoryName, incomeColumns, enrollmentColumns, rateColumns, costColumns, consultantJobColumns, channelJobColumns])

  // 2. 月度数据表列（根据类型动态生成）
  const monthlyColumns: ColumnsType<MonthlyDataRow> = useMemo(() => {
    const cols: ColumnsType<MonthlyDataRow> = [
      {
        title: '月份',
        dataIndex: '月份',
        width: 50,
        align: 'center',
        fixed: 'left',
        render: (v, r) => r.isTotal ? <strong style={{ color: '#f5222d' }}>{v}</strong> : v,
      },
      {
        title: '神殿',
        dataIndex: '神殿',
        width: 100,
        fixed: 'left',
      },
      {
        title: '招生收入',
        children: incomeColumns,
      },
      {
        title: '招生数据',
        children: enrollmentColumns,
      },
    ]

    // 网络(SEM)、新媒体、市场口碑类型：使用各自的表头名称
    if (categoryName === '网络' || categoryName === '新媒体' || categoryName === '市场口碑') {
      // 根据类型确定表头名称
      let rateTitle = 'SEM转化率'
      let costTitle = 'SEM招生成本'
      
      if (categoryName === '新媒体') {
        rateTitle = '新媒体转化率'
        costTitle = '新媒体招生成本'
      } else if (categoryName === '市场口碑') {
        rateTitle = '市场口碑转化率'
        costTitle = '市场口碑招生成本'
      }
      
      cols.push({
        title: rateTitle,
        children: [
          {
            title: '报名转化率',
            dataIndex: '总转',
            width: 90,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
          {
            title: '当面转化率',
            dataIndex: '当面转化',
            width: 90,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
          {
            title: '上门率',
            dataIndex: '电转门',
            width: 70,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
        ],
      })
      cols.push({
        title: costTitle,
        children: [
          {
            title: '费用投入',
            dataIndex: '市场投入',
            width: 90,
            align: 'center',
            render: (v, r) => renderValue(v, r.isTotal),
          },
          {
            title: '招生成本',
            dataIndex: '招生成本',
            width: 80,
            align: 'center',
            render: (v, r) => renderValue(v, r.isTotal),
          },
        ],
      })
    }
    // 其他（免费推广）类型：使用免费推广专用表头
    else if (categoryName === '其他') {
      cols.push({
        title: '免费推广转化率',
        children: [
          {
            title: '报名转化率',
            dataIndex: '总转',
            width: 90,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
          {
            title: '当面转化率',
            dataIndex: '当面转化',
            width: 90,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
          {
            title: '上门率',
            dataIndex: '电转门',
            width: 70,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
        ],
      })
      cols.push({
        title: '免费推广招生成本',
        children: [
          {
            title: '费用投入',
            dataIndex: '市场投入',
            width: 90,
            align: 'center',
            render: (v, r) => renderValue(v, r.isTotal),
          },
          {
            title: '招生成本',
            dataIndex: '招生成本',
            width: 80,
            align: 'center',
            render: (v, r) => renderValue(v, r.isTotal),
          },
        ],
      })
    }
    // 渠道类型：添加渠道转化率、渠道招生成本和渠道职数列
    else if (isChannelType) {
      cols.push({
        title: `${prefix}转化率`,
        children: rateColumns,
      })
      cols.push({
        title: `${prefix}招生成本`,
        children: costColumns,
      })
      cols.push({
        title: '渠道职数',
        children: channelJobColumns,
      })
    } else {
      // 其他类型：使用动态前缀的转化率和招生成本列
      cols.push({
        title: `${prefix}转化率`,
        children: rateColumns,
      })
      cols.push({
        title: `${prefix}招生成本`,
        children: costColumns,
      })
    }

    return cols
  }, [categoryName, prefix, isChannelType, incomeColumns, enrollmentColumns, rateColumns, costColumns, channelJobColumns])

  // 3. 咨询师汇总表列（根据类型动态生成表头）
  const consultantColumns: ColumnsType<ConsultantDataRow> = useMemo(() => {
    const cols: ColumnsType<ConsultantDataRow> = [
      {
        title: '序号',
        dataIndex: '序号',
        width: 50,
        align: 'center',
        fixed: 'left',
        render: (v, r) => r.isTotal ? <strong style={{ color: '#f5222d' }}>{v}</strong> : v,
      },
      {
        title: '咨询师',
        dataIndex: '咨询师',
        width: 100,
        fixed: 'left',
        render: (v, r) => r.isTotal ? <strong style={{ color: '#f5222d' }}>{v}</strong> : v,
      },
      {
        title: '招生收入',
        children: incomeColumns,
      },
      {
        title: '招生数据',
        children: enrollmentColumns,
      },
    ]

    // 其他（免费推广）类型：使用免费推广专用表头
    if (categoryName === '其他') {
      cols.push({
        title: '免费推广转化率',
        children: [
          {
            title: '报名转化率',
            dataIndex: '总转',
            width: 90,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
          {
            title: '当面转化率',
            dataIndex: '当面转化',
            width: 90,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
          {
            title: '上门率',
            dataIndex: '电转门',
            width: 70,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
        ],
      })
      cols.push({
        title: '免费推广招生成本',
        children: [
          {
            title: '费用投入',
            dataIndex: '市场投入',
            width: 90,
            align: 'center',
            render: (v, r) => renderValue(v, r.isTotal),
          },
          {
            title: '招生成本',
            dataIndex: '招生成本',
            width: 80,
            align: 'center',
            render: (v, r) => renderValue(v, r.isTotal),
          },
        ],
      })
    } else {
      // 其他类型：使用渠道转化率和渠道招生成本
      cols.push({
        title: '渠道转化率',
        children: [
          {
            title: '报名转化率',
            dataIndex: '总转',
            width: 90,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
          {
            title: '当面转化率',
            dataIndex: '当面转化',
            width: 90,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
          {
            title: '上门率',
            dataIndex: '电转门',
            width: 70,
            align: 'center',
            render: (v, r) => renderRate(v, r.isTotal),
          },
        ],
      })
      cols.push({
        title: '渠道招生成本',
        children: [
          {
            title: '费用投入',
            dataIndex: '市场投入',
            width: 90,
            align: 'center',
            render: (v, r) => renderValue(v, r.isTotal),
          },
          {
            title: '招生成本',
            dataIndex: '招生成本',
            width: 80,
            align: 'center',
            render: (v, r) => renderValue(v, r.isTotal),
          },
        ],
      })
    }

    return cols
  }, [categoryName, incomeColumns, enrollmentColumns])

  // 4. 咨询师月度明细表列（根据类型动态生成）
  const consultantMonthlyColumns: ColumnsType<ConsultantMonthlyRow> = useMemo(() => {
    // 为咨询师月度明细表创建可编辑的招生收入列
    const editableIncomeColumns: ColumnsType<ConsultantMonthlyRow> = [
      {
        title: '计划收入',
        dataIndex: '计划收入',
        width: 100,
        align: 'center',
        render: (val: number, r: ConsultantMonthlyRow) => {
          if (r.isTotal) {
            return <strong style={{ color: '#f5222d' }}>{val > 0 ? val.toLocaleString() : '-'}</strong>
          }
          // 如果没有咨询师名称，显示为空
          if (!r.咨询师) {
            return '-'
          }
          // 检查是否有待保存的更改
          const key = `${r.月份}_${r.咨询师}`
          const pendingValue = pendingPlanChanges.get(key)?.计划收入
          const displayValue = pendingValue !== undefined ? pendingValue : val

          return (
            <InputNumber
              size="small"
              style={{ width: 90 }}
              value={displayValue || undefined}
              min={0}
              step={10000}
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={v => Number(v?.replace(/,/g, '') || 0)}
              onChange={(v) => {
                const monthNum = typeof r.月份 === 'number' ? r.月份 : parseInt(String(r.月份))
                if (!isNaN(monthNum)) {
                  handlePlanChange(monthNum, r.咨询师, '计划收入', v)
                }
              }}
            />
          )
        }
      },
      {
        title: '实际收入',
        dataIndex: '实际收入',
        width: 80,
        align: 'center',
        render: (v, r) => renderValue(v, r.isTotal),
      },
    ]

    // 为咨询师月度明细表创建可编辑的招生数据列
    const editableEnrollmentColumns: ColumnsType<ConsultantMonthlyRow> = [
      {
        title: '计划招生',
        dataIndex: '计划招生',
        width: 80,
        align: 'center',
        render: (val: number, r: ConsultantMonthlyRow) => {
          if (r.isTotal) {
            return <strong style={{ color: '#f5222d' }}>{val || '-'}</strong>
          }
          // 如果没有咨询师名称，显示为空
          if (!r.咨询师) {
            return '-'
          }
          // 检查是否有待保存的更改
          const key = `${r.月份}_${r.咨询师}`
          const pendingValue = pendingPlanChanges.get(key)?.计划招生
          const displayValue = pendingValue !== undefined ? pendingValue : val

          return (
            <InputNumber
              size="small"
              style={{ width: 60 }}
              value={displayValue || undefined}
              min={0}
              onChange={(v) => {
                const monthNum = typeof r.月份 === 'number' ? r.月份 : parseInt(String(r.月份))
                if (!isNaN(monthNum)) {
                  handlePlanChange(monthNum, r.咨询师, '计划招生', v)
                }
              }}
            />
          )
        }
      },
      {
        title: '实际招生',
        dataIndex: '实际招生',
        width: 70,
        align: 'center',
        render: (v, r) => renderValue(v, r.isTotal),
      },
      {
        title: '退费人数',
        dataIndex: '退费人数',
        width: 70,
        align: 'center',
        render: (v, r) => renderValue(v, r.isTotal),
      },
      {
        title: '上门总量',
        dataIndex: '上门总量',
        width: 70,
        align: 'center',
        render: (v, r) => renderValue(v, r.isTotal),
      },
      {
        title: '电话量',
        dataIndex: '电话量',
        width: 70,
        align: 'center',
        render: (v, r) => renderValue(v, r.isTotal),
      },
      {
        title: '咨询总量',
        dataIndex: '咨询总量',
        width: 70,
        align: 'center',
        render: (v, r) => renderValue(v, r.isTotal),
      },
    ]

    // 为咨询师月度明细表创建可编辑的成本列（口碑、神殿新媒体和免费推广的费用投入可编辑）
    const editableCostColumns: ColumnsType<ConsultantMonthlyRow> = [
      {
        title: (categoryName === '口碑' || categoryName === '神殿新媒体' || categoryName === '其他') ? '费用投入' : getCostColumnTitle(),
        dataIndex: '市场投入',
        width: 100,
        align: 'center',
        render: (val: number, r: ConsultantMonthlyRow) => {
          // 口碑、神殿新媒体和免费推广类型的费用投入可以编辑
          if ((categoryName === '口碑' || categoryName === '神殿新媒体' || categoryName === '其他') && !r.isTotal) {
            return (
              <InputNumber
                value={val}
                onChange={(v) => handleUpdateConsultantMonthlyData(r.key, '市场投入', v)}
                size="small"
                min={0}
                style={{ width: 90 }}
                placeholder="0"
              />
            )
          }
          // 其他类型或合计行不可编辑
          return renderValue(val, r.isTotal)
        }
      },
      {
        title: '招生成本',
        dataIndex: '招生成本',
        width: 80,
        align: 'center',
        render: (v, r) => renderValue(v, r.isTotal),
      },
    ]

    // 网络(SEM)、新媒体、市场口碑类型：使用各自的转化率列
    const semRateColumns: ColumnsType<ConsultantMonthlyRow> = [
      {
        title: '报名转化率',
        dataIndex: '总转',
        width: 90,
        align: 'center',
        render: (v, r) => renderRate(v, r.isTotal),
      },
      {
        title: '当面转化率',
        dataIndex: '当面转化',
        width: 90,
        align: 'center',
        render: (v, r) => renderRate(v, r.isTotal),
      },
      {
        title: '上门率',
        dataIndex: '电转门',
        width: 70,
        align: 'center',
        render: (v, r) => renderRate(v, r.isTotal),
      },
    ]

    // 网络(SEM)、新媒体、市场口碑类型：使用各自的成本列
    const semCostColumns: ColumnsType<ConsultantMonthlyRow> = [
      {
        title: '费用投入',
        dataIndex: '市场投入',
        width: 90,
        align: 'center',
        render: (val: number, r: ConsultantMonthlyRow) => {
          // 口碑、神殿新媒体和免费推广类型的费用投入可以编辑
          if ((categoryName === '口碑' || categoryName === '神殿新媒体' || categoryName === '其他') && !r.isTotal) {
            return (
              <InputNumber
                value={val}
                onChange={(v) => handleUpdateConsultantMonthlyData(r.key, '市场投入', v)}
                size="small"
                min={0}
                style={{ width: 90 }}
                placeholder="0"
              />
            )
          }
          return renderValue(val, r.isTotal)
        }
      },
      {
        title: '招生成本',
        dataIndex: '招生成本',
        width: 80,
        align: 'center',
        render: (v, r) => renderValue(v, r.isTotal),
      },
    ]

    const cols: ColumnsType<ConsultantMonthlyRow> = [
      {
        title: '月份',
        dataIndex: '月份',
        width: 50,
        align: 'center',
        fixed: 'left',
        render: (v, r) => r.isTotal ? <strong style={{ color: '#f5222d' }}>{v}</strong> : v,
      },
      {
        title: '咨询师',
        dataIndex: '咨询师',
        width: 80,
        fixed: 'left',
      },
      {
        title: '招生收入',
        children: editableIncomeColumns,
      },
      {
        title: '招生数据',
        children: editableEnrollmentColumns,
      },
    ]

    // 网络(SEM)、新媒体、市场口碑类型：使用各自的表头名称
    if (categoryName === '网络' || categoryName === '新媒体' || categoryName === '市场口碑') {
      // 根据类型确定表头名称
      let rateTitle = 'SEM转化率'
      let costTitle = 'SEM招生成本'
      
      if (categoryName === '新媒体') {
        rateTitle = '新媒体转化率'
        costTitle = '新媒体招生成本'
      } else if (categoryName === '市场口碑') {
        rateTitle = '市场口碑转化率'
        costTitle = '市场口碑招生成本'
      }
      
      cols.push({
        title: rateTitle,
        children: semRateColumns,
      })
      cols.push({
        title: costTitle,
        children: semCostColumns,
      })
    }
    // 其他（免费推广）类型：使用免费推广专用表头
    else if (categoryName === '其他') {
      cols.push({
        title: '免费推广转化率',
        children: semRateColumns,
      })
      cols.push({
        title: '免费推广招生成本',
        children: editableCostColumns,
      })
    }
    // 渠道类型：添加渠道职数列
    else if (isChannelType) {
      cols.push({
        title: `${prefix}转化率`,
        children: rateColumns,
      })
      cols.push({
        title: '渠道职数',
        children: channelJobColumns,
      })
    } else {
      // 其他类型：使用动态前缀
      cols.push({
        title: `${prefix}转化率`,
        children: rateColumns,
      })
      cols.push({
        title: `${prefix}招生成本`,
        children: editableCostColumns,
      })
    }

    return cols
  }, [categoryName, prefix, isChannelType, rateColumns, channelJobColumns, pendingPlanChanges, handlePlanChange])

  // 口碑汇总表格的数据（必须在所有 early return 之前）
  const reputationSummaryData = useMemo(() => {
    if (categoryName !== '口碑') return []
    
    // 从级联后的月度数据的合计行提取
    const totalRow = cascadedMonthlyRows.find(r => r.isTotal)
    if (!totalRow) return []
    
    return [{
      key: 'reputation-summary',
      序号: 1,
      神殿: currentCampus,
      计划收入: totalRow.计划收入,
      实际收入: totalRow.实际收入,
      计划招生: totalRow.计划招生,
      实际招生: totalRow.实际招生,
      退费人数: totalRow.退费人数,
      上门总量: totalRow.上门总量,
      电话量: totalRow.电话量,
      咨询总量: totalRow.咨询总量,
      报名转化率: totalRow.总转,
      当面转化率: totalRow.当面转化,
      上门率: totalRow.电转门,
      费用投入: totalRow.市场投入,
      招生成本: totalRow.招生成本 ? String(totalRow.招生成本) : '-',
    }]
  }, [categoryName, cascadedMonthlyRows, currentCampus])

  // 神殿新媒体汇总表格的数据
  const campusNewMediaSummaryData = useMemo(() => {
    if (categoryName !== '神殿新媒体') return []
    
    // 从级联后的月度数据的合计行提取
    const totalRow = cascadedMonthlyRows.find(r => r.isTotal)
    if (!totalRow) return []
    
    return [{
      key: 'campus-newmedia-summary',
      序号: 1,
      神殿: currentCampus,
      计划收入: totalRow.计划收入,
      实际收入: totalRow.实际收入,
      计划招生: totalRow.计划招生,
      实际招生: totalRow.实际招生,
      退费人数: totalRow.退费人数,
      上门总量: totalRow.上门总量,
      电话量: totalRow.电话量,
      咨询总量: totalRow.咨询总量,
      报名转化率: totalRow.总转,
      当面转化率: totalRow.当面转化,
      上门率: totalRow.电转门,
      费用投入: totalRow.市场投入,
      招生成本: totalRow.招生成本 ? String(totalRow.招生成本) : '#DIV/0!',
    }]
  }, [categoryName, cascadedMonthlyRows, currentCampus])

  // 表头样式
  const headerStyle = {
    background: bgColor,
    color: '#000',
    padding: '8px 12px',
    fontWeight: 'bold' as const,
    fontSize: '14px',
    marginBottom: '8px',
  }

  // 确定是否使用营销部月度明细计划（用于渲染部分的提示信息）
  const usesMarketPlan = categoryName === '新媒体' || categoryName === '市场口碑' || categoryName === '合作伙伴'

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin tip="加载数据中..." />
      </div>
    )
  }

  // 口碑和神殿新媒体只有3个子表（没有第一个按神殿汇总表）
  // 渠道使用专门的 ChannelSourceDashboard 组件
  const is3TableType = categoryName === '口碑' || categoryName === '神殿新媒体'
  const isChannelTab = categoryName === '渠道'

  // 渠道TAB使用专门的组件
  if (isChannelTab) {
    return <ChannelSourceDashboard year={year} bgColor={bgColor} />
  }

  const reputationSummaryColumns = [
    { title: '序号', dataIndex: '序号', width: 60, align: 'center' as const },
    { title: '神殿', dataIndex: '神殿', width: 100, align: 'center' as const },
    {
      title: '招生收入',
      children: [
        { title: '计划收入', dataIndex: '计划收入', width: 100, align: 'center' as const },
        { title: '实际收入', dataIndex: '实际收入', width: 100, align: 'center' as const },
      ],
    },
    {
      title: '招生数据',
      children: [
        { title: '计划招生', dataIndex: '计划招生', width: 90, align: 'center' as const },
        { title: '实际招生', dataIndex: '实际招生', width: 90, align: 'center' as const },
        { title: '退费人数', dataIndex: '退费人数', width: 90, align: 'center' as const },
        { title: '上门总量', dataIndex: '上门总量', width: 90, align: 'center' as const },
        { title: '电话量', dataIndex: '电话量', width: 80, align: 'center' as const },
        { title: '咨询总量', dataIndex: '咨询总量', width: 90, align: 'center' as const },
      ],
    },
    {
      title: '口碑转化率',
      children: [
        { 
          title: '报名转化率', 
          dataIndex: '报名转化率', 
          width: 110, 
          align: 'center' as const,
          render: (val: string) => renderRate(val, val === '#DIV/0!')
        },
        { 
          title: '当面转化率', 
          dataIndex: '当面转化率', 
          width: 110, 
          align: 'center' as const,
          render: (val: string) => renderRate(val, val === '#DIV/0!')
        },
        { 
          title: '上门率', 
          dataIndex: '上门率', 
          width: 90, 
          align: 'center' as const,
          render: (val: string) => renderRate(val, val === '#DIV/0!')
        },
      ],
    },
    {
      title: '口碑招生成本',
      children: [
        { title: '费用投入', dataIndex: '费用投入', width: 100, align: 'center' as const },
        { 
          title: '招生成本', 
          dataIndex: '招生成本', 
          width: 100, 
          align: 'center' as const,
          render: (val: string) => renderRate(val, val === '#DIV/0!')
        },
      ],
    },
  ]

  // 神殿新媒体汇总表列定义
  const campusNewMediaSummaryColumns = [
    { title: '序号', dataIndex: '序号', width: 60, align: 'center' as const },
    { title: '神殿', dataIndex: '神殿', width: 100, align: 'center' as const },
    {
      title: '招生收入',
      children: [
        { 
          title: '计划收入', 
          dataIndex: '计划收入', 
          width: 80, 
          align: 'center' as const,
          render: (val: number) => <strong style={{ color: '#1890ff' }}>{val || 0}</strong>
        },
        { 
          title: '实际收入', 
          dataIndex: '实际收入', 
          width: 80, 
          align: 'center' as const,
          render: (val: number) => <strong style={{ color: '#1890ff' }}>{val || 0}</strong>
        },
      ],
    },
    {
      title: '招生数据',
      children: [
        { 
          title: '计划招生', 
          dataIndex: '计划招生', 
          width: 70, 
          align: 'center' as const,
          render: (val: number) => <strong style={{ color: '#1890ff' }}>{val || 0}</strong>
        },
        { 
          title: '实际招生', 
          dataIndex: '实际招生', 
          width: 70, 
          align: 'center' as const,
          render: (val: number) => <strong style={{ color: '#1890ff' }}>{val || 0}</strong>
        },
        { 
          title: '退费人数', 
          dataIndex: '退费人数', 
          width: 70, 
          align: 'center' as const,
          render: (val: number) => <strong style={{ color: '#1890ff' }}>{val || 0}</strong>
        },
        { 
          title: '上门总量', 
          dataIndex: '上门总量', 
          width: 70, 
          align: 'center' as const,
          render: (val: number) => <strong style={{ color: '#1890ff' }}>{val || 0}</strong>
        },
        { 
          title: '电话量', 
          dataIndex: '电话量', 
          width: 70, 
          align: 'center' as const,
          render: (val: number) => <strong style={{ color: '#1890ff' }}>{val || 0}</strong>
        },
        { 
          title: '咨询总量', 
          dataIndex: '咨询总量', 
          width: 70, 
          align: 'center' as const,
          render: (val: number) => <strong style={{ color: '#1890ff' }}>{val || 0}</strong>
        },
      ],
    },
    {
      title: '神殿新媒体转化率',
      children: [
        { 
          title: '报名转化率', 
          dataIndex: '报名转化率', 
          width: 90, 
          align: 'center' as const,
          render: (val: string) => renderRate(val, val === '#DIV/0!')
        },
        { 
          title: '当面转化率', 
          dataIndex: '当面转化率', 
          width: 90, 
          align: 'center' as const,
          render: (val: string) => renderRate(val, val === '#DIV/0!')
        },
        { 
          title: '上门率', 
          dataIndex: '上门率', 
          width: 70, 
          align: 'center' as const,
          render: (val: string) => renderRate(val, val === '#DIV/0!')
        },
      ],
    },
    {
      title: '神殿新媒体招生成本',
      children: [
        { 
          title: '费用投入', 
          dataIndex: '费用投入', 
          width: 90, 
          align: 'center' as const,
          render: (val: number) => <strong style={{ color: '#1890ff' }}>{val || 0}</strong>
        },
        { 
          title: '招生成本', 
          dataIndex: '招生成本', 
          width: 80, 
          align: 'center' as const,
          render: (val: string) => {
            if (val === '#DIV/0!') {
              return <span style={{ color: '#999' }}>{val}</span>
            }
            return <strong style={{ color: '#52c41a' }}>{val}</strong>
          }
        },
      ],
    },
  ]

  return (
    <NoCopyContainer>
      <div style={{ padding: '8px' }}>
        {/* 数据提示 */}
        {!loading && monthlyRows.length > 0 && monthlyRows.every(r => !r.isTotal && r.计划收入 === null && r.计划招生 === null) && (
          <Alert
            message="提示"
            description={
              usesMarketPlan 
                ? `当前${currentCampus}${year}年${categoryName}的月度计划数据为空，请在"市场部 → 月度明细计划"页面录入计划收入和计划招生数据。`
                : `当前${currentCampus}${year}年${categoryName === '其他' ? '免费推广' : categoryName}的月度计划数据为空，请在"祈福司 → 004管理数据 → 007财务收入"页面录入计划收入和计划招生数据。`
            }
            type="warning"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 口碑专属汇总表格 */}
        {categoryName === '口碑' && (
          <>
            <div style={{ 
              background: '#52c41a', 
              color: '#fff',
              padding: '8px 12px',
              fontWeight: 'bold' as const,
              fontSize: '14px',
              marginBottom: '8px',
            }}>
              {currentCampus}{year}年度口碑数据汇总
            </div>
            <Table
              columns={reputationSummaryColumns}
              dataSource={reputationSummaryData}
              pagination={false}
              bordered
              size="small"
              scroll={{ x: 1600 }}
              rowClassName={() => 'summary-table-row'}
            />
            <Divider style={{ margin: '16px 0' }} />
          </>
        )}

        {/* 神殿新媒体专属汇总表格 */}
        {categoryName === '神殿新媒体' && (
          <>
            <div style={{ 
              background: '#5B9BD5', 
              color: '#fff',
              padding: '8px 12px',
              fontWeight: 'bold' as const,
              fontSize: '14px',
              marginBottom: '8px',
            }}>
              {currentCampus}{year}年度神殿新媒体数据汇总看板
            </div>
            <Table
              columns={campusNewMediaSummaryColumns}
              dataSource={campusNewMediaSummaryData}
              pagination={false}
              bordered
              size="small"
              scroll={{ x: 1200 }}
              style={{ marginBottom: 24 }}
            />
            <Divider style={{ margin: '16px 0' }} />
          </>
        )}

        {/* 1. 年度核心数据看板汇总（按神殿，包含所有列）- 仅网络、新媒体、市场口碑、合作伙伴显示 */}
        {!is3TableType && (
          <>
            <div style={headerStyle}>
              清美教育集团{year}年度核心数据看板汇总
            </div>
            <Table
              columns={summaryColumns}
              dataSource={summaryRows}
              pagination={false}
              bordered
              size="small"
              scroll={{ x: 1800 }}
              rowClassName={(record) => record.isTotal ? 'total-row' : ''}
            />
            <Divider style={{ margin: '16px 0' }} />
          </>
        )}

        {/* 2. 月度数据表（按月份）- 计划数据从表4级联聚合 */}
        <div style={headerStyle}>
          清美教育集团{year}年度神殿{categoryName === '其他' ? '免费推广' : categoryName}数据核心数据看板
        </div>
        <Table
          columns={monthlyColumns}
          dataSource={cascadedMonthlyRows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1200 }}
          rowClassName={(record) => record.isTotal ? 'total-row' : ''}
        />

        <Divider style={{ margin: '16px 0' }} />

        {/* 3. 咨询师年度汇总表 - 计划数据从表4级联聚合 */}
        <div style={headerStyle}>
          清美教育集团{year}年度神殿{categoryName === '其他' ? '免费推广' : categoryName}数据核心数据看板
        </div>
        <Table
          columns={consultantColumns}
          dataSource={cascadedConsultantRows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1100 }}
          rowClassName={(record) => record.isTotal ? 'total-row' : ''}
        />

        <Divider style={{ margin: '16px 0' }} />

        {/* 4. 咨询师月度明细表 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={headerStyle}>
            清美教育集团{year}年度神殿{categoryName === '其他' ? '免费推广' : categoryName}数据核心数据看板
          </div>
          {pendingPlanChanges.size > 0 && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={savingPlan}
              onClick={savePlanData}
            >
              保存计划数据 ({pendingPlanChanges.size}项更改)
            </Button>
          )}
        </div>
        <Table
          columns={consultantMonthlyColumns}
          dataSource={consultantMonthlyRows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1100, y: 600 }}
          rowClassName={(record) => record.isTotal ? 'total-row' : ''}
        />
      </div>

      <style>{`
        .total-row td {
          background-color: #fafafa !important;
          font-weight: bold;
        }
      `}</style>
    </NoCopyContainer>
  )
}
