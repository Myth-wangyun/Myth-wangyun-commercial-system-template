/**
 * 新媒体数据核心数据看板
 * 根据用户需求完整实现4个子表格：
 * 1. 年度核心数据看板汇总（按神殿）
 * 2. 月度数据看板（按月份）
 * 3. 咨询师年度汇总表
 * 4. 咨询师月度明细表
 * 
 * 功能：
 * 费用投入 = 新媒体咨询量成本（从市场部获取）× 咨询总量
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { App, Table, Spin, Divider } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { NoCopyContainer } from '@/components/common'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'
import { getCampusMonthlyData } from '@/pages/consult/004mgmt-data/007-financial-income/api'
import api from '@/services/api'
import { getNewMediaCostSummary } from '@/services/consult/marketCost'

// ==================== 类型定义 ====================

// 表1: 神殿年度汇总行（包含咨询师和渠道职数）
interface CampusSummaryRow {
  key: string
  序号: number | string
  神殿: string
  isTotal: boolean
  // 招生收入
  计划收入: number | null
  实际收入: number | null
  // 招生数据
  计划招生: number | null
  实际招生: number | null
  退费人数: number | null
  上门总量: number | null
  咨询总量: number | null
  电话量: number | null
  // 转化率
  总转化率: string
  当面转化率: string
  电话上门率: string
  // 招生成本
  新媒体投入: number | null
  招生成本: number | null
  // 咨询师职数
  咨询总职数: number | null
  咨询干部职数: number | null
  咨询员工职数: number | null
  // 渠道职数
  渠道总职数: number | null
  县办: number | null
  乡办: number | null
  信息员: number | null
}

// 表2: 月度数据行
interface MonthlyDataRow {
  key: string
  月份: number | string
  神殿: string
  isTotal: boolean
  // 招生收入
  计划收入: number | null
  实际收入: number | null
  // 招生数据
  计划招生: number | null
  实际招生: number | null
  退费人数: number | null
  上门总量: number | null
  咨询总量: number | null
  电话量: number | null
  // 新媒体转化率
  总转: string
  当面转化: string
  新媒体电转门: string
  // 新媒体招生成本
  新媒体投入: number | null
  招生成本: number | null
}

// 表3: 咨询师年度汇总行
interface ConsultantYearlyRow {
  key: string
  序号: number | string
  咨询师: string
  isTotal: boolean
  // 招生收入
  计划收入: number | null
  实际收入: number | null
  // 招生数据
  计划招生: number | null
  实际招生: number | null
  退费人数: number | null
  上门总量: number | null
  咨询总量: number | null
  电话量: number | null
  // 新媒体转化率
  总转: string
  当面转化: string
  新媒体电转门: string
  // 新媒体招生成本
  新媒体投入: number | null
  招生成本: number | null
}

// 表4: 咨询师月度明细行
interface ConsultantMonthlyRow {
  key: string
  月份: number | string
  咨询师: string
  isTotal: boolean
  isMonthTotal: boolean  // 每个月的小计
  // 招生收入
  计划收入: number | null
  实际收入: number | null
  // 招生数据
  计划招生: number | null
  实际招生: number | null
  退费人数: number | null
  上门总量: number | null
  咨询总量: number | null
  电话量: number | null
  // 新媒体转化率
  总转: string
  当面转化: string
  新媒体电转门: string
  // 新媒体招生成本
  新媒体投入: number | null
  招生成本: number | null
}

// ==================== Props ====================

interface Props {
  year: string
  campus?: string
}

// ==================== 辅助函数 ====================

// 计算转化率 - 表1用（总转化率、当面转化率、电话上门率）
const calculateSummaryRates = (row: CampusSummaryRow) => {
  // 总转化率 = 实际招生 / 咨询总量
  if (row.咨询总量 && row.实际招生) {
    row.总转化率 = ((row.实际招生 / row.咨询总量) * 100).toFixed(2) + '%'
  } else {
    row.总转化率 = '-'
  }
  
  // 当面转化率 = 实际招生 / 上门总量
  if (row.上门总量 && row.实际招生) {
    row.当面转化率 = ((row.实际招生 / row.上门总量) * 100).toFixed(2) + '%'
  } else {
    row.当面转化率 = '-'
  }
  
  // 上门率 = 上门总量 / 咨询总量
  if (row.咨询总量 && row.上门总量) {
    row.电话上门率 = ((row.上门总量 / row.咨询总量) * 100).toFixed(2) + '%'
  } else {
    row.电话上门率 = '-'
  }
}

// 计算转化率 - 表2/3/4用（总转、当面转化、新媒体电转门）
const calculateMediaRates = (row: MonthlyDataRow | ConsultantYearlyRow | ConsultantMonthlyRow) => {
  // 总转 = 实际招生 / 咨询总量
  if (row.咨询总量 && row.实际招生) {
    row.总转 = ((row.实际招生 / row.咨询总量) * 100).toFixed(2) + '%'
  } else {
    row.总转 = '-'
  }
  
  // 当面转化 = 实际招生 / 上门总量
  if (row.上门总量 && row.实际招生) {
    row.当面转化 = ((row.实际招生 / row.上门总量) * 100).toFixed(2) + '%'
  } else {
    row.当面转化 = '-'
  }
  
  // 上门率 = 上门总量 / 咨询总量
  if (row.咨询总量 && row.上门总量) {
    row.新媒体电转门 = ((row.上门总量 / row.咨询总量) * 100).toFixed(2) + '%'
  } else {
    row.新媒体电转门 = '-'
  }
}

// 渲染数值
const renderValue = (value: number | null | undefined, isTotal: boolean, color = '#1890ff') => {
  if (value === null || value === undefined) return <span>-</span>
  if (isTotal) {
    return <strong style={{ color }}>{value}</strong>
  }
  return <span>{value}</span>
}

// 渲染转化率
const renderRate = (val: string, isTotal: boolean) => {
  if (val === '#DIV/0!' || val === '#REF!' || val === '-') {
    return <span style={{ color: '#999' }}>{val}</span>
  }
  const style = { color: '#52c41a', fontWeight: isTotal ? 'bold' as const : 'normal' as const }
  return <span style={style}>{val}</span>
}

// 月份常量（移到组件外部避免每次渲染重新创建）
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

// ==================== 主组件 ====================

export default function NewMediaDataDashboard({ year, campus = '盛邦' }: Props) {
  const { message } = App.useApp()
  const campusStore = useCampusStore()
  const currentCampus = campus || campusStore.currentCampus || '未选择'
  const campusList = useMemo(() => campusStore.getAllCampuses(), [campusStore])
  
  const [loading, setLoading] = useState(false)
  const [consultants, setConsultants] = useState<string[]>([])
  
  // 4个表格的数据
  const [summaryRows, setSummaryRows] = useState<CampusSummaryRow[]>([])
  const [monthlyRows, setMonthlyRows] = useState<MonthlyDataRow[]>([])
  const [consultantYearlyRows, setConsultantYearlyRows] = useState<ConsultantYearlyRow[]>([])
  const [consultantMonthlyRows, setConsultantMonthlyRows] = useState<ConsultantMonthlyRow[]>([])

  // 加载咨询师列表
  const loadConsultants = useCallback(async () => {
    try {
      // 从用户表获取咨询师列表（祈福司门）- 按神殿分组返回
      const response = await api.get('/config/department-users', {
        params: { department: '祈福司' }
      })
      const groups = Array.isArray(response.data) ? response.data : []
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

      // 获取咨询量统计数据、计划数据和新媒体成本数据 - 并行请求
      const [consultResult, monthlyResult, allCampusPlanData, newMediaCostData] = await Promise.all([
        statsApi.getAllCampusYearlySummary({
          年份: yearNum,
          数据类型: '新媒体',
        }).catch(() => null),
        statsApi.getMonthlyCampusSummary({
          年份: yearNum,
          神殿: currentCampus,
          分类: '新媒体',
        }).catch(() => null),
        // 获取所有神殿的月度详细计划数据
        Promise.all(
          currentCampusList.map(c => 
            api.get('/market/monthly-plan/newmedia/list', {
              params: { year: yearNum, campus: c.name }
            }).then(res => ({
              campus: c.name,
              data: res.data?.code === 0 && res.data?.data ? res.data.data : null
            })).catch(() => ({ campus: c.name, data: null }))
          )
        ),
        // 获取新媒体咨询量成本（从市场部获取）
        getNewMediaCostSummary(currentCampus, yearNum).catch((err) => {
          console.error('获取新媒体成本数据失败:', err)
          return {}
        }),
      ])

      // 按神殿和月份索引计划数据
      const planByCampus: Record<string, { 计划收入: number; 计划招生: number }> = {}
      const planByMonth: Record<number, { 计划收入: number; 计划招生: number }> = {}
      
      // 处理所有神殿的计划数据
      allCampusPlanData.forEach(({ campus: campusName, data: planResult }) => {
        if (!planResult) return
        
        let campusPlanIncome = 0
        let campusPlanEnroll = 0
        
        // planResult 格式: { 1: { 抖音: {...}, 快手: {...}, ... }, 2: {...}, ... }
        Object.entries(planResult).forEach(([monthStr, platformData]: [string, any]) => {
          const month = parseInt(monthStr)
          if (isNaN(month) || !platformData) return
          
          let monthPlanIncome = 0
          let monthPlanEnroll = 0
          
          // 汇总该月所有平台的计划数据
          Object.values(platformData).forEach((data: any) => {
            monthPlanIncome += data.plan_income || 0
            monthPlanEnroll += data.plan_enrollment || 0
          })
          
          campusPlanIncome += monthPlanIncome
          campusPlanEnroll += monthPlanEnroll
          
          // 如果是当前神殿，记录月度数据
          if (campusName === currentCampus) {
            planByMonth[month] = { 
              计划收入: monthPlanIncome, 
              计划招生: monthPlanEnroll 
            }
          }
        })
        
        // 记录该神殿的年度计划汇总
        planByCampus[campusName] = {
          计划收入: campusPlanIncome,
          计划招生: campusPlanEnroll
        }
      })

      // 处理新媒体咨询量成本数据
      const costMap = new Map<number, number>()
      if (newMediaCostData) {
        Object.entries(newMediaCostData).forEach(([month, data]: [string, any]) => {
          const monthNum = parseInt(month)
          const consultCost = data.咨询量成本 || 0
          costMap.set(monthNum, consultCost)
        })
      }

      // ========== 1. 生成神殿年度汇总表数据 ==========
      const makeSummaryRow = (序号: number | string, campusName: string, isTotal = false): CampusSummaryRow => ({
        key: `summary_${序号}_${campusName}`,
        序号,
        神殿: isTotal ? '' : campusName,
        isTotal,
        计划收入: null,
        实际收入: null,
        计划招生: null,
        实际招生: null,
        退费人数: null,
        上门总量: null,
        咨询总量: null,
        电话量: null,
        总转化率: '#REF!',
        当面转化率: '#REF!',
        电话上门率: '#REF!',
        新媒体投入: null,
        招生成本: null,
        咨询总职数: null,
        咨询干部职数: null,
        咨询员工职数: null,
        渠道总职数: null,
        县办: null,
        乡办: null,
        信息员: null,
      })

      const summaryData: CampusSummaryRow[] = currentCampusList.map((c, idx) => 
        makeSummaryRow(idx + 1, c.name, false)
      )
      // 如果神殿列表为空，添加示例行
      if (summaryData.length === 0) {
        summaryData.push(makeSummaryRow(1, currentCampus, false))
      }

      // 填充API数据
      if (consultResult?.success && consultResult?.data?.神殿数据) {
        consultResult.data.神殿数据.forEach((item: any) => {
          const row = summaryData.find(r => r.神殿 === item.神殿)
          if (row) {
            row.咨询总量 = item.咨询总量 || null
            row.上门总量 = item.上门量 || null
            row.实际招生 = item.报名量 || null
            calculateSummaryRates(row)
          }
        })
      }
      
      // 填充所有神殿的计划数据（从月度详细计划）
      summaryData.forEach(row => {
        if (row.神殿 && planByCampus[row.神殿]) {
          row.计划收入 = planByCampus[row.神殿].计划收入 || null
          row.计划招生 = planByCampus[row.神殿].计划招生 || null
        }
      })

      setSummaryRows(summaryData)

      // ========== 2. 生成月度数据表 ==========
      const makeMonthlyRow = (月份: number | string, campusName: string, isTotal = false): MonthlyDataRow => ({
        key: `monthly_${月份}_${campusName}`,
        月份,
        神殿: campusName,
        isTotal,
        计划收入: null,
        实际收入: null,
        计划招生: null,
        实际招生: null,
        退费人数: null,
        上门总量: null,
        咨询总量: null,
        电话量: null,
        总转: '-',
        当面转化: '-',
        新媒体电转门: '-',
        新媒体投入: null,
        招生成本: null,
      })

      const monthlyData: MonthlyDataRow[] = MONTHS.map(m => {
        const row = makeMonthlyRow(m, currentCampus, false)
        // 计划数据
        if (planByMonth[m]) {
          row.计划收入 = planByMonth[m].计划收入 || null
          row.计划招生 = planByMonth[m].计划招生 || null
        }
        return row
      })
      const totalMonthlyRow = makeMonthlyRow('合计', currentCampus, true)

      // 填充月度API数据
      if (monthlyResult?.success && monthlyResult.data?.月度数据) {
        monthlyResult.data.月度数据.forEach((monthData: any) => {
          const row = monthlyData.find(r => r.月份 === monthData.月份)
          if (row) {
            row.实际收入 = monthData.实际收入 || null
            row.实际招生 = monthData.报名量 || null
            row.退费人数 = monthData.退费人数 || null
            row.上门总量 = monthData.上门量 || null
            row.电话量 = monthData.电话量 || null
            row.咨询总量 = monthData.咨询总量 || null
          }
        })
      }

      // 计算费用投入和转化率
      monthlyData.forEach(row => {
        if (!row.isTotal) {
          // 费用投入 = 新媒体咨询量成本 × 咨询总量
          const monthNum = typeof row.月份 === 'number' ? row.月份 : parseInt(String(row.月份))
          const consultCost = costMap.get(monthNum) || 0
          if (consultCost > 0 && row.咨询总量 && row.咨询总量 > 0) {
            row.新媒体投入 = Math.round(consultCost * row.咨询总量)
          }
          // 计算招生成本 = 费用投入 / 实际招生
          if (row.新媒体投入 && row.实际招生 && row.实际招生 > 0) {
            row.招生成本 = Math.round(row.新媒体投入 / row.实际招生)
          }
          calculateMediaRates(row)
        }
      })

      // 计算合计行
      const sumMonthlyFields: (keyof MonthlyDataRow)[] = ['计划收入', '实际收入', '计划招生', '实际招生', '退费人数', '上门总量', '咨询总量', '电话量', '新媒体投入']
      sumMonthlyFields.forEach(field => {
        const sum = monthlyData.filter(r => !r.isTotal).reduce((acc, r) => {
          const val = r[field] as number
          // 确保val是数字类型
          const numVal = typeof val === 'number' ? val : (val ? Number(val) : 0)
          return acc + (isNaN(numVal) ? 0 : numVal)
        }, 0)
        ;(totalMonthlyRow as any)[field] = sum > 0 ? sum : null
      })
      // 合计行的招生成本
      if (totalMonthlyRow.新媒体投入 && totalMonthlyRow.实际招生 && totalMonthlyRow.实际招生 > 0) {
        totalMonthlyRow.招生成本 = Math.round(totalMonthlyRow.新媒体投入 / totalMonthlyRow.实际招生)
      }
      calculateMediaRates(totalMonthlyRow)
      monthlyData.push(totalMonthlyRow)

      setMonthlyRows(monthlyData)

      // ========== 3. 生成咨询师年度汇总表 ==========
      const makeConsultantYearlyRow = (序号: number | string, name: string, isTotal = false): ConsultantYearlyRow => ({
        key: `consultant_yearly_${序号}_${name}`,
        序号,
        咨询师: isTotal ? '' : name,
        isTotal,
        计划收入: null,
        实际收入: null,
        计划招生: null,
        实际招生: null,
        退费人数: null,
        上门总量: null,
        咨询总量: null,
        电话量: null,
        总转: '-',
        当面转化: '-',
        新媒体电转门: '-',
        新媒体投入: null,
        招生成本: null,
      })

      const consultantYearlyData: ConsultantYearlyRow[] = consultants.map((name, idx) =>
        makeConsultantYearlyRow(idx + 1, name, false)
      )
      // 补充空行到10行
      for (let i = consultantYearlyData.length; i < 10; i++) {
        consultantYearlyData.push(makeConsultantYearlyRow(i + 1, '', false))
      }
      consultantYearlyData.push(makeConsultantYearlyRow('合计', '', true))

      consultantYearlyData.forEach(row => {
        if (!row.isTotal) calculateMediaRates(row)
      })
      setConsultantYearlyRows(consultantYearlyData)

      // ========== 4. 生成咨询师月度明细表 ==========
      const makeConsultantMonthlyRow = (
        月份: number | string, 
        name: string, 
        isTotal = false, 
        isMonthTotal = false
      ): ConsultantMonthlyRow => ({
        key: `cm_${月份}_${name}_${isMonthTotal ? 'total' : 'data'}`,
        月份: isMonthTotal ? '' : 月份,
        咨询师: isMonthTotal ? '合计' : name,
        isTotal,
        isMonthTotal,
        计划收入: null,
        实际收入: null,
        计划招生: null,
        实际招生: null,
        退费人数: null,
        上门总量: null,
        咨询总量: null,
        电话量: null,
        总转: '-',
        当面转化: '-',
        新媒体电转门: '-',
        新媒体投入: null,
        招生成本: null,
      })

      const cmData: ConsultantMonthlyRow[] = []
      MONTHS.forEach(m => {
        // 每个月的咨询师数据
        consultants.forEach(name => {
          cmData.push(makeConsultantMonthlyRow(m, name, false, false))
        })
        // 补充空行到10行（每月的咨询师列表保持10行）
        for (let i = consultants.length; i < 10; i++) {
          cmData.push(makeConsultantMonthlyRow(m, '', false, false))
        }
        // 每个月的合计行
        cmData.push(makeConsultantMonthlyRow(m, '', false, true))
      })

      cmData.forEach(row => {
        if (!row.isTotal && !row.isMonthTotal) calculateMediaRates(row)
      })
      setConsultantMonthlyRows(cmData)

    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [year, currentCampus, consultants, campusStore])

  useEffect(() => {
    loadConsultants()
  }, [loadConsultants])

  useEffect(() => {
    if (consultants.length > 0) {
      loadData()
    }
  }, [year, consultants, loadData])

  // ==================== 表1列定义: 年度核心数据看板汇总 ====================
  const summaryColumns: ColumnsType<CampusSummaryRow> = [
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
      width: 80,
      fixed: 'left',
    },
    {
      title: '招生收入',
      children: [
        { title: '计划收入', dataIndex: '计划收入', width: 80, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
        { title: '实际收入', dataIndex: '实际收入', width: 80, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
      ],
    },
    {
      title: '招生数据',
      children: [
        { title: '计划招生', dataIndex: '计划招生', width: 70, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
        { title: '实际招生', dataIndex: '实际招生', width: 70, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
        { title: '退费人数', dataIndex: '退费人数', width: 70, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
        { title: '上门总量', dataIndex: '上门总量', width: 70, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
        { title: '咨询总量', dataIndex: '咨询总量', width: 70, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
        { title: '电话量', dataIndex: '电话量', width: 60, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
      ],
    },
    {
      title: '转化率',
      children: [
        { title: '总转化率', dataIndex: '总转化率', width: 80, align: 'center' as const, render: (v: string, r: CampusSummaryRow) => renderRate(v, r.isTotal) },
        { title: '当面转化率', dataIndex: '当面转化率', width: 90, align: 'center' as const, render: (v: string, r: CampusSummaryRow) => renderRate(v, r.isTotal) },
        { title: '电话上门率', dataIndex: '电话上门率', width: 90, align: 'center' as const, render: (v: string, r: CampusSummaryRow) => renderRate(v, r.isTotal) },
      ],
    },
    {
      title: '招生成本',
      children: [
        { title: '新媒体投入', dataIndex: '新媒体投入', width: 80, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
        { title: '招生成本', dataIndex: '招生成本', width: 80, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
      ],
    },
    {
      title: '咨询师',
      children: [
        { title: '咨询总职数', dataIndex: '咨询总职数', width: 80, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
        { title: '咨询干部职数', dataIndex: '咨询干部职数', width: 90, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
        { title: '咨询员工职数', dataIndex: '咨询员工职数', width: 90, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
      ],
    },
    {
      title: '渠道职数',
      children: [
        { title: '渠道总职数', dataIndex: '渠道总职数', width: 80, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
        { title: '县办', dataIndex: '县办', width: 50, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
        { title: '乡办', dataIndex: '乡办', width: 50, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
        { title: '信息员', dataIndex: '信息员', width: 60, align: 'center' as const, render: (v: any, r: CampusSummaryRow) => renderValue(v, r.isTotal) },
      ],
    },
  ]

  // ==================== 表2列定义: 新媒体月度数据看板 ====================
  const monthlyColumns: ColumnsType<MonthlyDataRow> = [
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
      width: 80,
      fixed: 'left',
    },
    {
      title: '招生收入',
      children: [
        { title: '计划收入', dataIndex: '计划收入', width: 80, align: 'center' as const, render: (v: any, r: MonthlyDataRow) => renderValue(v, r.isTotal) },
        { title: '实际收入', dataIndex: '实际收入', width: 80, align: 'center' as const, render: (v: any, r: MonthlyDataRow) => renderValue(v, r.isTotal) },
      ],
    },
    {
      title: '招生数据',
      children: [
        { title: '计划招生', dataIndex: '计划招生', width: 70, align: 'center' as const, render: (v: any, r: MonthlyDataRow) => renderValue(v, r.isTotal) },
        { title: '实际招生', dataIndex: '实际招生', width: 70, align: 'center' as const, render: (v: any, r: MonthlyDataRow) => renderValue(v, r.isTotal) },
        { title: '退费人数', dataIndex: '退费人数', width: 70, align: 'center' as const, render: (v: any, r: MonthlyDataRow) => renderValue(v, r.isTotal) },
        { title: '上门总量', dataIndex: '上门总量', width: 70, align: 'center' as const, render: (v: any, r: MonthlyDataRow) => renderValue(v, r.isTotal) },
        { title: '电话量', dataIndex: '电话量', width: 60, align: 'center' as const, render: (v: any, r: MonthlyDataRow) => renderValue(v, r.isTotal) },
        { title: '咨询总量', dataIndex: '咨询总量', width: 70, align: 'center' as const, render: (v: any, r: MonthlyDataRow) => renderValue(v, r.isTotal) },
      ],
    },
    {
      title: '新媒体转化率',
      children: [
        { title: '报名转化率', dataIndex: '总转', width: 90, align: 'center' as const, render: (v: string, r: MonthlyDataRow) => renderRate(v, r.isTotal) },
        { title: '当面转化率', dataIndex: '当面转化', width: 90, align: 'center' as const, render: (v: string, r: MonthlyDataRow) => renderRate(v, r.isTotal) },
        { title: '上门率', dataIndex: '新媒体电转门', width: 70, align: 'center' as const, render: (v: string, r: MonthlyDataRow) => renderRate(v, r.isTotal) },
      ],
    },
    {
      title: '新媒体招生成本',
      children: [
        { title: '费用投入', dataIndex: '新媒体投入', width: 80, align: 'center' as const, render: (v: any, r: MonthlyDataRow) => renderValue(v, r.isTotal) },
        { title: '招生成本', dataIndex: '招生成本', width: 80, align: 'center' as const, render: (v: any, r: MonthlyDataRow) => renderValue(v, r.isTotal) },
      ],
    },
  ]

  // ==================== 表3列定义: 咨询师年度汇总表 ====================
  const consultantYearlyColumns: ColumnsType<ConsultantYearlyRow> = [
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
      width: 80,
      fixed: 'left',
    },
    {
      title: '招生收入',
      children: [
        { title: '计划收入', dataIndex: '计划收入', width: 80, align: 'center' as const, render: (v: any, r: ConsultantYearlyRow) => renderValue(v, r.isTotal) },
        { title: '实际收入', dataIndex: '实际收入', width: 80, align: 'center' as const, render: (v: any, r: ConsultantYearlyRow) => renderValue(v, r.isTotal) },
      ],
    },
    {
      title: '招生数据',
      children: [
        { title: '计划招生', dataIndex: '计划招生', width: 70, align: 'center' as const, render: (v: any, r: ConsultantYearlyRow) => renderValue(v, r.isTotal) },
        { title: '实际招生', dataIndex: '实际招生', width: 70, align: 'center' as const, render: (v: any, r: ConsultantYearlyRow) => renderValue(v, r.isTotal) },
        { title: '退费人数', dataIndex: '退费人数', width: 70, align: 'center' as const, render: (v: any, r: ConsultantYearlyRow) => renderValue(v, r.isTotal) },
        { title: '上门总量', dataIndex: '上门总量', width: 70, align: 'center' as const, render: (v: any, r: ConsultantYearlyRow) => renderValue(v, r.isTotal) },
        { title: '咨询总量', dataIndex: '咨询总量', width: 70, align: 'center' as const, render: (v: any, r: ConsultantYearlyRow) => renderValue(v, r.isTotal) },
        { title: '电话量', dataIndex: '电话量', width: 60, align: 'center' as const, render: (v: any, r: ConsultantYearlyRow) => renderValue(v, r.isTotal) },
      ],
    },
    {
      title: '新媒体转化率',
      children: [
        { title: '总转', dataIndex: '总转', width: 70, align: 'center' as const, render: (v: string, r: ConsultantYearlyRow) => renderRate(v, r.isTotal) },
        { title: '当面转化', dataIndex: '当面转化', width: 80, align: 'center' as const, render: (v: string, r: ConsultantYearlyRow) => renderRate(v, r.isTotal) },
        { title: '新媒体电转门', dataIndex: '新媒体电转门', width: 100, align: 'center' as const, render: (v: string, r: ConsultantYearlyRow) => renderRate(v, r.isTotal) },
      ],
    },
    {
      title: '新媒体招生成本',
      children: [
        { title: '新媒体投入', dataIndex: '新媒体投入', width: 80, align: 'center' as const, render: (v: any, r: ConsultantYearlyRow) => renderValue(v, r.isTotal) },
        { title: '招生成本', dataIndex: '招生成本', width: 80, align: 'center' as const, render: (v: any, r: ConsultantYearlyRow) => renderValue(v, r.isTotal) },
      ],
    },
  ]

  // ==================== 表4列定义: 咨询师月度明细表 ====================
  const consultantMonthlyColumns: ColumnsType<ConsultantMonthlyRow> = [
    {
      title: '月份',
      dataIndex: '月份',
      width: 50,
      align: 'center',
      fixed: 'left',
      render: (v, r) => {
        if (r.isMonthTotal) return null
        return r.isTotal ? <strong style={{ color: '#f5222d' }}>{v}</strong> : v
      },
    },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      width: 80,
      fixed: 'left',
      render: (v, r) => r.isMonthTotal ? <strong style={{ color: '#f5222d' }}>{v}</strong> : v,
    },
    {
      title: '招生收入',
      children: [
        { title: '计划收入', dataIndex: '计划收入', width: 80, align: 'center' as const, render: (v: any, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal || r.isMonthTotal) },
        { title: '实际收入', dataIndex: '实际收入', width: 80, align: 'center' as const, render: (v: any, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal || r.isMonthTotal) },
      ],
    },
    {
      title: '招生数据',
      children: [
        { title: '计划招生', dataIndex: '计划招生', width: 70, align: 'center' as const, render: (v: any, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal || r.isMonthTotal) },
        { title: '实际招生', dataIndex: '实际招生', width: 70, align: 'center' as const, render: (v: any, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal || r.isMonthTotal) },
        { title: '退费人数', dataIndex: '退费人数', width: 70, align: 'center' as const, render: (v: any, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal || r.isMonthTotal) },
        { title: '上门总量', dataIndex: '上门总量', width: 70, align: 'center' as const, render: (v: any, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal || r.isMonthTotal) },
        { title: '咨询总量', dataIndex: '咨询总量', width: 70, align: 'center' as const, render: (v: any, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal || r.isMonthTotal) },
        { title: '电话量', dataIndex: '电话量', width: 60, align: 'center' as const, render: (v: any, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal || r.isMonthTotal) },
      ],
    },
    {
      title: '新媒体转化率',
      children: [
        { title: '总转', dataIndex: '总转', width: 70, align: 'center' as const, render: (v: string, r: ConsultantMonthlyRow) => renderRate(v, r.isTotal || r.isMonthTotal) },
        { title: '当面转化', dataIndex: '当面转化', width: 80, align: 'center' as const, render: (v: string, r: ConsultantMonthlyRow) => renderRate(v, r.isTotal || r.isMonthTotal) },
        { title: '新媒体电转门', dataIndex: '新媒体电转门', width: 100, align: 'center' as const, render: (v: string, r: ConsultantMonthlyRow) => renderRate(v, r.isTotal || r.isMonthTotal) },
      ],
    },
    {
      title: '新媒体招生成本',
      children: [
        { title: '新媒体投入', dataIndex: '新媒体投入', width: 80, align: 'center' as const, render: (v: any, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal || r.isMonthTotal) },
        { title: '招生成本', dataIndex: '招生成本', width: 80, align: 'center' as const, render: (v: any, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal || r.isMonthTotal) },
      ],
    },
  ]

  // 表头样式
  const headerStyle = {
    background: '#87CEEB',
    color: '#000',
    padding: '8px 12px',
    fontWeight: 'bold' as const,
    fontSize: '14px',
    marginBottom: '8px',
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin tip="加载数据中..." />
      </div>
    )
  }

  return (
    <NoCopyContainer>
      <div style={{ padding: '8px' }}>
        {/* 只显示新媒体月度数据看板 */}
        <div style={headerStyle}>
          {currentCampus}{year}年度新媒体数据核心数据看板
        </div>
        <Table
          columns={monthlyColumns}
          dataSource={monthlyRows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1200 }}
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

