/**
 * ConsultantChannelDashboard - 咨询师渠道数据看板
 * 
 * 包含：
 * 1. 月度数据表（按月份）- 包含渠道职数列
 * 2. 咨询师年度汇总表
 * 3. 咨询师月度明细表
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { App, Table, Spin, Divider, InputNumber, Button } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useCampusStore } from '@/stores/campusStore'
import { NoCopyContainer } from '@/components/common'
import api from '@/services/api'
import * as staffingService from '@/services/consult/staffing'
import * as consultantPlanService from '@/services/consult/consultantPlan'
import type { ConsultantMonthlyPlan, ConsultantMonthlySummaryData } from '@/services/consult/consultantPlan'

// ==================== 类型定义 ====================

// 神殿汇总行（新增）
interface CampusSummaryRow {
  key: string
  序号: number | string
  神殿: string
  // 招生收入
  计划收入: number | null
  实际收入: number | null
  收入完成率: string
  // 招生数据
  计划招生: number | null
  实际招生: number | null
  退费人数: number | null
  上门总量: number | null
  电话量: number | null
  咨询总量: number | null
  // 渠道转化率
  报名转化率: string
  当面转化率: string
  上门率: string
  // 渠道招生成本
  费用投入: number | null
  招生成本: string
}

// 月度数据行
interface MonthlyDataRow {
  key: string
  序号: number | string
  月份: number | string
  神殿: string
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
  电话量: number | null
  咨询总量: number | null
  // 渠道转化率
  总转: string
  当面转化: string
  渠道电转门: string
  // 免费推广招生成本
  费用投入: number | null
  招生成本: string
  // 渠道职数
  渠道总职数: number | null
  县办: number | null
  乡办: number | null
  信息员: number | null
}

// 咨询师数据行
interface ConsultantDataRow {
  key: string
  序号: number | string
  咨询师: string
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
  电话量: number | null
  咨询总量: number | null
  // 渠道转化率
  总转: string
  当面转化: string
  渠道电转门: string
  // 免费推广招生成本
  费用投入: number | null
  招生成本: string
  // 渠道职数
  渠道总职数: number | null
  县办: number | null
  乡办: number | null
  信息员: number | null
}

// 咨询师月度数据行
interface ConsultantMonthlyRow extends ConsultantDataRow {
  月份: number | string
}

// ==================== Props ====================

interface Props {
  year: string
  bgColor?: string
}

// 月份常量
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

// 计算转化率 - 除零时显示 '-'
const calculateRates = (row: any) => {
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
    row.总转 = '-'
  }
  
  // 当面转化 = 实际招生 / 上门总量
  if (row.上门总量 && row.上门总量 > 0 && row.实际招生 !== null) {
    row.当面转化 = ((row.实际招生 / row.上门总量) * 100).toFixed(2) + '%'
  } else {
    row.当面转化 = '-'
  }
  
  // 电转门 = 上门总量 / 咨询总量
  if (row.咨询总量 && row.咨询总量 > 0 && row.上门总量 !== null) {
    row.渠道电转门 = ((row.上门总量 / row.咨询总量) * 100).toFixed(2) + '%'
  } else {
    row.渠道电转门 = '-'
  }
  
  // 招生成本 = 费用投入 / 实际招生
  if (row.实际招生 && row.实际招生 > 0 && row.费用投入 !== null) {
    row.招生成本 = (row.费用投入 / row.实际招生).toFixed(2)
  } else {
    row.招生成本 = '-'
  }
}

// 计算神殿汇总的转化率（新增）
const calculateSummaryRates = (row: CampusSummaryRow) => {
  // 收入完成率 = 实际收入 / 计划收入 * 100
  if (row.计划收入 && row.计划收入 > 0 && row.实际收入 !== null) {
    row.收入完成率 = ((row.实际收入 / row.计划收入) * 100).toFixed(1) + '%'
  } else {
    row.收入完成率 = '#DIV/0!'
  }

  // 报名转化率 = 实际招生 / 咨询总量
  if (row.咨询总量 && row.咨询总量 > 0 && row.实际招生 !== null) {
    row.报名转化率 = ((row.实际招生 / row.咨询总量) * 100).toFixed(2) + '%'
  } else {
    row.报名转化率 = '#DIV/0!'
  }
  
  // 当面转化率 = 实际招生 / 上门总量
  if (row.上门总量 && row.上门总量 > 0 && row.实际招生 !== null) {
    row.当面转化率 = ((row.实际招生 / row.上门总量) * 100).toFixed(2) + '%'
  } else {
    row.当面转化率 = '#DIV/0!'
  }
  
  // 上门率 = 上门总量 / 咨询总量
  if (row.咨询总量 && row.咨询总量 > 0 && row.上门总量 !== null) {
    row.上门率 = ((row.上门总量 / row.咨询总量) * 100).toFixed(2) + '%'
  } else {
    row.上门率 = '#DIV/0!'
  }
  
  // 招生成本 = 费用投入 / 实际招生
  if (row.实际招生 && row.实际招生 > 0 && row.费用投入 !== null) {
    row.招生成本 = (row.费用投入 / row.实际招生).toFixed(2)
  } else {
    row.招生成本 = '#DIV/0!'
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

// 渲染转化率 - '-' 也显示为灰色
const renderRate = (val: string, isTotal: boolean) => {
  if (val === '-' || val === '#DIV/0!' || val === '#REF!' || val === '#VALUE!') {
    return <span style={{ color: '#999' }}>{val}</span>
  }
  const style = { color: '#52c41a', fontWeight: isTotal ? 'bold' as const : 'normal' as const }
  return <span style={style}>{val}</span>
}

// ==================== 主组件 ====================

export default function ConsultantChannelDashboard({ year, bgColor = '#F0E68C' }: Props) {
  const { notification, message } = App.useApp()
  const campusStore = useCampusStore()
  const currentCampus = campusStore.currentCampus || '未选择'
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [consultants, setConsultants] = useState<string[]>([])
  
  // 数据状态
  const [summaryRow, setSummaryRow] = useState<CampusSummaryRow | null>(null) // 新增
  const [monthlyRows, setMonthlyRows] = useState<MonthlyDataRow[]>([])
  const [consultantRows, setConsultantRows] = useState<ConsultantDataRow[]>([])
  const [consultantMonthlyRows, setConsultantMonthlyRows] = useState<ConsultantMonthlyRow[]>([])

  // ==================== 咨询师月度明细表 - 计划数据和费用投入编辑功能 ====================
  
  // 重新计算咨询师月度明细表的合计行
  const recomputeConsultantMonthlyTotals = (rows: ConsultantMonthlyRow[]): ConsultantMonthlyRow[] => {
    const sumFields: (keyof ConsultantMonthlyRow)[] = [
      '计划收入', '实际收入', '计划招生', '实际招生', '退费人数',
      '上门总量', '咨询总量', '电话量', '费用投入'
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
          ;(monthTotal as any)[field] = sum || null
        })
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
        ;(yearTotal as any)[field] = sum || null
      })
      calculateRates(yearTotal)
    }

    return rows
  }

  // 更新咨询师月度明细表的计划收入
  const updateConsultantMonthlyPlanIncome = useCallback((key: string, value: number | null) => {
    setConsultantMonthlyRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.key === key)
      if (row && !row.isTotal) {
        row.计划收入 = value
      }
      return recomputeConsultantMonthlyTotals(next)
    })
  }, [])

  // 更新咨询师月度明细表的计划招生
  const updateConsultantMonthlyPlanEnrollment = useCallback((key: string, value: number | null) => {
    setConsultantMonthlyRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.key === key)
      if (row && !row.isTotal) {
        row.计划招生 = value
      }
      return recomputeConsultantMonthlyTotals(next)
    })
  }, [])

  // 更新咨询师月度明细表的费用投入
  const updateConsultantMonthlyExpense = useCallback((key: string, value: number | null) => {
    setConsultantMonthlyRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.key === key)
      if (row && !row.isTotal) {
        row.费用投入 = value
        calculateRates(row)
      }
      return recomputeConsultantMonthlyTotals(next)
    })
  }, [])

  // 保存计划数据（计划收入、计划招生、费用投入）
  const handleSaveMonthlyPlans = useCallback(async () => {
    try {
      setSaving(true)

      // 收集所有非合计行且有咨询师姓名的数据
      const plans: ConsultantMonthlyPlan[] = consultantMonthlyRows
        .filter(row => !row.isTotal && row.咨询师.trim())
        .map(row => ({
          年份: parseInt(year),
          月份: typeof row.月份 === 'number' ? row.月份 : parseInt(String(row.月份)),
          神殿: currentCampus,
          咨询师: row.咨询师,
          数据类型: '渠道',
          计划收入: row.计划收入 ?? 0,  // null 转换为 0
          计划招生: row.计划招生 ?? 0,  // null 转换为 0
          费用投入: row.费用投入 ?? 0,  // null 转换为 0
        }))

      if (plans.length === 0) {
        message.warning('没有需要保存的数据')
        return
      }

      console.log('准备保存的计划数据:', plans)
      const result = await consultantPlanService.batchSaveConsultantPlans(plans)
      notification.success({ message: '已保存', description: `保存成功！成功 ${result.成功数量} 条${result.失败数量 > 0 ? `，失败 ${result.失败数量} 条` : ''}`, placement: 'topRight', duration: 3 })
      
      // 重新加载数据
      await loadData()
    } catch (error: any) {
      console.error('保存失败:', error)
      console.error('错误详情:', error.response?.data)
      notification.error({ message: '保存失败', description: error.response?.data?.message || error.message || '保存失败，请稍后重试', placement: 'topRight', duration: 4 })
    } finally {
      setSaving(false)
    }
  }, [consultantMonthlyRows, year, currentCampus])

  // 保存费用投入数据（已废弃，合并到 handleSaveMonthlyPlans）
  const handleSaveExpenses = useCallback(async () => {
    await handleSaveMonthlyPlans()
  }, [handleSaveMonthlyPlans])


  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const yearNum = parseInt(year)
      
      // 获取职数数据、渠道类型的计划数据和咨询统计数据
      const [staffingData, channelPlans, consultStats] = await Promise.all([
        staffingService.getStaffingSummary(yearNum, currentCampus).catch(() => null),
        consultantPlanService.getConsultantPlanList({
          year: yearNum,
          campus: currentCampus,
          data_type: '渠道'
        }).catch(() => []),
        consultantPlanService.getConsultantMonthlySummary({
          年份: yearNum,
          神殿: currentCampus,
          数据类型: '渠道'
        }).catch(() => ({
          年份: yearNum,
          神殿: currentCampus,
          数据类型: '渠道',
          咨询师数据: {}
        })),
      ])

      console.log('=== 渠道咨询师数据加载 ===')
      console.log('咨询统计数据:', consultStats)
      console.log('咨询师数据:', consultStats.咨询师数据)
      console.log('计划数据:', channelPlans)

      // 从统计数据中提取咨询师列表
      const consultantNames = Object.keys(consultStats.咨询师数据 || {}).filter(name => name.trim())
      console.log('提取的咨询师列表:', consultantNames)
      
      // 更新咨询师列表状态
      setConsultants(consultantNames.length > 0 ? consultantNames : [])

      // 创建渠道计划数据Map
      const channelPlanMap = new Map<string, ConsultantMonthlyPlan>()
      channelPlans.forEach(plan => {
        const key = `${plan.咨询师}_${plan.月份}`
        channelPlanMap.set(key, plan)
      })

      // ========== 1. 先生成咨询师月度明细表（其他表都从这里汇总） ==========
      const makeConsultantMonthlyRow = (月份: number | string, name: string, isTotal = false): ConsultantMonthlyRow => {
        const monthNum = typeof 月份 === 'number' ? 月份 : 0
        const planKey = `${name}_${monthNum}`
        const plan = channelPlanMap.get(planKey)
        
        // 从咨询统计数据中获取实际数据（后端返回的月份可能是字符串或数字）
        const consultantStats = consultStats.咨询师数据[name]
        const stats = consultantStats?.[monthNum] || consultantStats?.[String(monthNum)]
        
        return {
          key: `cm_${月份}_${name}`,
          序号: 月份,
          月份,
          咨询师: name,
          isTotal,
          计划收入: plan?.计划收入 ?? null,
          实际收入: stats?.实际收入 ?? null,  // 从咨询统计数据中获取实际收入（缴费金额）
          收入完成率: '-',
          计划招生: plan?.计划招生 ?? null,
          实际招生: stats?.报名量 ?? null,
          退费人数: stats?.退费人数 ?? null,
          上门总量: stats?.上门量 ?? null,
          电话量: stats?.电话量 ?? null,
          咨询总量: stats?.咨询总量 ?? null,
          总转: '-',
          当面转化: '-',
          渠道电转门: '-',
          费用投入: plan?.费用投入 ?? null,
          招生成本: '-',
          渠道总职数: null,
          县办: null,
          乡办: null,
          信息员: null,
        }
      }

      const cmData: ConsultantMonthlyRow[] = []
      MONTHS.forEach(m => {
        // 使用从统计数据中提取的咨询师列表
        consultantNames.forEach(name => {
          const row = makeConsultantMonthlyRow(m, name, false)
          console.log(`生成行 [月份=${m}, 咨询师=${name}]:`, row)
          cmData.push(row)
        })
        // 补充空行到至少4个咨询师
        for (let i = consultantNames.length; i < 4; i++) {
          cmData.push(makeConsultantMonthlyRow(m, '', false))
        }
        // 每个月的合计行
        const monthTotalRow = makeConsultantMonthlyRow(m, '合计', true)
        // 计算月度合计
        const monthDataRows = cmData.filter(r => r.月份 === m && !r.isTotal && r.咨询师)
        ;['计划收入', '计划招生', '实际收入', '实际招生', '退费人数', '上门总量', '咨询总量', '电话量', '费用投入'].forEach(field => {
          const sum = monthDataRows.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
          ;(monthTotalRow as any)[field] = sum || null
        })
        calculateRates(monthTotalRow)
        cmData.push(monthTotalRow)
      })
      // 年度总合计
      const yearTotalRow = makeConsultantMonthlyRow('合计', '', true)
      const allDataRows = cmData.filter(r => !r.isTotal && r.咨询师)
      ;['计划收入', '计划招生', '实际收入', '实际招生', '退费人数', '上门总量', '咨询总量', '电话量', '费用投入'].forEach(field => {
        const sum = allDataRows.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
        ;(yearTotalRow as any)[field] = sum || null
      })
      calculateRates(yearTotalRow)
      cmData.push(yearTotalRow)
      
      // 设置咨询师月度明细表数据
      console.log('设置咨询师月度明细表数据，共', cmData.length, '行')
      setConsultantMonthlyRows(cmData)

      // ========== 2. 生成神殿汇总行（从月度明细表汇总） ==========
      const summary: CampusSummaryRow = {
        key: 'campus_summary',
        序号: 1,
        神殿: currentCampus,
        计划收入: yearTotalRow.计划收入,
        实际收入: yearTotalRow.实际收入,
        收入完成率: '#DIV/0!',
        计划招生: yearTotalRow.计划招生,
        实际招生: yearTotalRow.实际招生,
        退费人数: yearTotalRow.退费人数,
        上门总量: yearTotalRow.上门总量,
        电话量: yearTotalRow.电话量,
        咨询总量: yearTotalRow.咨询总量,
        报名转化率: '#DIV/0!',
        当面转化率: '#DIV/0!',
        上门率: '#DIV/0!',
        费用投入: yearTotalRow.费用投入,
        招生成本: '#DIV/0!',
      }
      
      calculateSummaryRates(summary)
      setSummaryRow(summary)

      // ========== 3. 生成月度数据表（从月度明细表汇总每月数据） ==========
      const makeMonthlyRow = (月份: number | string, campus: string, isTotal = false): MonthlyDataRow => {
        const monthNum = typeof 月份 === 'number' ? 月份 : 0
        
        // 从月度明细表中找到该月的汇总行
        const monthTotalInCmData = cmData.find(r => r.月份 === monthNum && r.isTotal && r.咨询师 === '合计')
        
        return {
          key: `monthly_${月份}_${campus}`,
          序号: 月份,
          月份,
          神殿: campus,
          isTotal,
          计划收入: monthTotalInCmData?.计划收入 ?? null,
          实际收入: monthTotalInCmData?.实际收入 ?? null,
          收入完成率: '-',
          计划招生: monthTotalInCmData?.计划招生 ?? null,
          实际招生: monthTotalInCmData?.实际招生 ?? null,
          退费人数: monthTotalInCmData?.退费人数 ?? null,
          上门总量: monthTotalInCmData?.上门总量 ?? null,
          电话量: monthTotalInCmData?.电话量 ?? null,
          咨询总量: monthTotalInCmData?.咨询总量 ?? null,
          总转: monthTotalInCmData?.总转 ?? '-',
          当面转化: monthTotalInCmData?.当面转化 ?? '-',
          渠道电转门: monthTotalInCmData?.渠道电转门 ?? '-',
          费用投入: monthTotalInCmData?.费用投入 ?? null,  // 从月度明细表的汇总行获取费用投入
          招生成本: monthTotalInCmData?.招生成本 ?? '-',  // 从月度明细表的汇总行获取招生成本
          渠道总职数: staffingData?.渠道总职数 ?? null,
          县办: staffingData?.县办 ?? null,
          乡办: staffingData?.乡办 ?? null,
          信息员: staffingData?.信息员 ?? null,
        }
      }

      const monthlyData: MonthlyDataRow[] = MONTHS.map(m => makeMonthlyRow(m, currentCampus, false))
      monthlyData.push(makeMonthlyRow('合计', currentCampus, true))
      
      // 计算汇总行（包括费用投入）
      const monthlyTotalRow = monthlyData.find(r => r.isTotal)
      if (monthlyTotalRow) {
        const dataRows = monthlyData.filter(r => !r.isTotal)
        ;['计划收入', '计划招生', '实际收入', '实际招生', '退费人数', '上门总量', '咨询总量', '电话量', '费用投入'].forEach(field => {
          const sum = dataRows.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
          ;(monthlyTotalRow as any)[field] = sum || null
        })
      }
      
      monthlyData.forEach(row => calculateRates(row))
      setMonthlyRows(monthlyData)

      // ========== 2. 生成咨询师汇总表 ==========
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
        电话量: null,
        咨询总量: null,
        总转: '-',
        当面转化: '-',
        渠道电转门: '-',
        费用投入: null,
        招生成本: '-',
        渠道总职数: null,
        县办: null,
        乡办: null,
        信息员: null,
      })

      const consultantData: ConsultantDataRow[] = consultantNames.map((name, idx) =>
        makeConsultantRow(idx + 1, name, false)
      )
      // 补充空行到10行
      for (let i = consultantData.length; i < 10; i++) {
        consultantData.push(makeConsultantRow(i + 1, '', false))
      }
      consultantData.push(makeConsultantRow('合计', '', true))

      // 计算咨询师年度汇总（从月度明细表汇总）
      consultantData.forEach(row => {
        if (!row.isTotal && row.咨询师) {
          // 从月度明细表中找到该咨询师的所有月份数据
          const consultantMonthlyData = cmData.filter(r => 
            r.咨询师 === row.咨询师 && !r.isTotal && typeof r.月份 === 'number'
          )
          
          // 汇总该咨询师的年度数据
          ;['计划收入', '计划招生', '实际收入', '实际招生', '退费人数', '上门总量', '咨询总量', '电话量', '费用投入'].forEach(field => {
            const sum = consultantMonthlyData.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
            ;(row as any)[field] = sum || null
          })
        }
        calculateRates(row)
      })
      
      // 计算咨询师汇总行（直接使用年度总合计行的数据）
      const consultantTotalRow = consultantData.find(r => r.isTotal)
      if (consultantTotalRow) {
        ;['计划收入', '计划招生', '实际收入', '实际招生', '退费人数', '上门总量', '咨询总量', '电话量', '费用投入'].forEach(field => {
          ;(consultantTotalRow as any)[field] = (yearTotalRow as any)[field]
        })
        calculateRates(consultantTotalRow)
      }
      
      setConsultantRows(consultantData)

    } catch (error) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [year, currentCampus])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ==================== 列定义 ====================

  // 0. 神殿汇总表列定义（新增）
  const summaryColumns: ColumnsType<CampusSummaryRow> = useMemo(() => [
    { title: '序号', dataIndex: '序号', width: 50, align: 'center', fixed: 'left' },
    { title: '神殿', dataIndex: '神殿', width: 80, fixed: 'left' },
    { 
      title: '招生收入', 
      children: [
        { title: '计划收入', dataIndex: '计划收入', width: 80, align: 'center', render: (v) => renderValue(v, false) },
        { title: '实际收入', dataIndex: '实际收入', width: 80, align: 'center', render: (v) => renderValue(v, false) },
        { title: '收入完成率', dataIndex: '收入完成率', width: 85, align: 'center', render: (v) => renderRate(v, false) },
      ]
    },
    { 
      title: '招生数据', 
      children: [
        { title: '计划招生', dataIndex: '计划招生', width: 70, align: 'center', render: (v) => renderValue(v, false) },
        { title: '实际招生', dataIndex: '实际招生', width: 70, align: 'center', render: (v) => renderValue(v, false) },
        { title: '退费人数', dataIndex: '退费人数', width: 70, align: 'center', render: (v) => renderValue(v, false) },
        { title: '上门总量', dataIndex: '上门总量', width: 70, align: 'center', render: (v) => renderValue(v, false) },
        { title: '电话量', dataIndex: '电话量', width: 70, align: 'center', render: (v) => renderValue(v, false) },
        { title: '咨询总量', dataIndex: '咨询总量', width: 70, align: 'center', render: (v) => renderValue(v, false) },
      ]
    },
    { 
      title: '免费推广转化率', 
      children: [
        { title: '报名转化率', dataIndex: '报名转化率', width: 90, align: 'center', render: (v) => renderRate(v, false) },
        { title: '当面转化率', dataIndex: '当面转化率', width: 90, align: 'center', render: (v) => renderRate(v, false) },
        { title: '上门率', dataIndex: '上门率', width: 70, align: 'center', render: (v) => renderRate(v, false) },
      ]
    },
    { 
      title: '免费推广招生成本', 
      children: [
        { title: '费用投入', dataIndex: '费用投入', width: 80, align: 'center', render: (v) => renderValue(v, false) },
        { title: '招生成本', dataIndex: '招生成本', width: 80, align: 'center', render: (v) => renderRate(v, false) },
      ]
    },
  ], [])

  // 招生收入列
  const incomeColumns: ColumnsType<any> = [
    { title: '计划收入', dataIndex: '计划收入', width: 80, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '实际收入', dataIndex: '实际收入', width: 80, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '收入完成率', dataIndex: '收入完成率', width: 85, align: 'center', render: (v, r) => renderRate(v, r.isTotal) },
  ]

  // 招生数据列（添加电话量）
  const enrollmentColumns: ColumnsType<any> = [
    { title: '计划招生', dataIndex: '计划招生', width: 70, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '实际招生', dataIndex: '实际招生', width: 70, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '退费人数', dataIndex: '退费人数', width: 70, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '上门总量', dataIndex: '上门总量', width: 70, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '电话量', dataIndex: '电话量', width: 70, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '咨询总量', dataIndex: '咨询总量', width: 70, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
  ]

  // 免费推广转化率列
  const channelRateColumns: ColumnsType<any> = [
    { title: '报名转化率', dataIndex: '总转', width: 90, align: 'center', render: (v, r) => renderRate(v, r.isTotal) },
    { title: '当面转化率', dataIndex: '当面转化', width: 90, align: 'center', render: (v, r) => renderRate(v, r.isTotal) },
    { title: '上门率', dataIndex: '渠道电转门', width: 70, align: 'center', render: (v, r) => renderRate(v, r.isTotal) },
  ]

  // 免费推广招生成本列
  const channelCostColumns: ColumnsType<any> = [
    { title: '费用投入', dataIndex: '费用投入', width: 80, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '招生成本', dataIndex: '招生成本', width: 80, align: 'center', render: (v, r) => renderRate(v, r.isTotal) },
  ]

  // 免费推广招生成本列 - 咨询师月度明细表（可编辑）
  const editableChannelCostColumns: ColumnsType<ConsultantMonthlyRow> = useMemo(() => [
    { 
      title: '费用投入', 
      width: 100, 
      align: 'center',
      render: (_: any, r: ConsultantMonthlyRow) => {
        if (r.isTotal) {
          return <strong style={{ color: '#1890ff' }}>{r.费用投入 ?? ''}</strong>
        }
        return (
          <InputNumber
            value={r.费用投入}
            onChange={v => updateConsultantMonthlyExpense(r.key, v)}
            size="small"
            min={0}
            style={{ width: 90 }}
            placeholder="0"
          />
        )
      }
    },
    { 
      title: '招生成本', 
      dataIndex: '招生成本', 
      width: 80, 
      align: 'center', 
      render: (v, r) => renderRate(v, r.isTotal) 
    },
  ], [updateConsultantMonthlyExpense])

  // 可编辑的招生收入列 - 咨询师月度明细表
  const editableIncomeColumns: ColumnsType<ConsultantMonthlyRow> = useMemo(() => [
    { 
      title: '计划收入', 
      width: 100, 
      align: 'center',
      render: (_: any, r: ConsultantMonthlyRow) => {
        if (r.isTotal) {
          return <strong style={{ color: '#1890ff' }}>{r.计划收入 ?? ''}</strong>
        }
        return (
          <InputNumber
            value={r.计划收入}
            onChange={v => updateConsultantMonthlyPlanIncome(r.key, v)}
            size="small"
            min={0}
            style={{ width: 90 }}
            placeholder="0"
          />
        )
      }
    },
    { 
      title: '实际收入', 
      dataIndex: '实际收入', 
      width: 80, 
      align: 'center', 
      render: (v, r) => renderValue(v, r.isTotal) 
    },
    { 
      title: '收入完成率', 
      dataIndex: '收入完成率', 
      width: 85, 
      align: 'center', 
      render: (v, r) => renderRate(v, r.isTotal) 
    },
  ], [updateConsultantMonthlyPlanIncome])

  // 可编辑的招生数据列 - 咨询师月度明细表
  const editableEnrollmentColumns: ColumnsType<ConsultantMonthlyRow> = useMemo(() => [
    { 
      title: '计划招生', 
      width: 90, 
      align: 'center',
      render: (_: any, r: ConsultantMonthlyRow) => {
        if (r.isTotal) {
          return <strong style={{ color: '#1890ff' }}>{r.计划招生 ?? ''}</strong>
        }
        return (
          <InputNumber
            value={r.计划招生}
            onChange={v => updateConsultantMonthlyPlanEnrollment(r.key, v)}
            size="small"
            min={0}
            style={{ width: 80 }}
            placeholder="0"
          />
        )
      }
    },
    { title: '实际招生', dataIndex: '实际招生', width: 70, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '退费人数', dataIndex: '退费人数', width: 70, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '上门总量', dataIndex: '上门总量', width: 70, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '电话量', dataIndex: '电话量', width: 70, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '咨询总量', dataIndex: '咨询总量', width: 70, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
  ], [updateConsultantMonthlyPlanEnrollment])

  // 渠道职数列
  const channelJobColumns: ColumnsType<any> = [
    { title: '渠道总职数', dataIndex: '渠道总职数', width: 90, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '县办', dataIndex: '县办', width: 60, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '乡办', dataIndex: '乡办', width: 60, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
    { title: '信息员', dataIndex: '信息员', width: 70, align: 'center', render: (v, r) => renderValue(v, r.isTotal) },
  ]

  // 1. 月度数据表列
  const monthlyColumns: ColumnsType<MonthlyDataRow> = useMemo(() => [
    { title: '月份', dataIndex: '月份', width: 50, align: 'center', fixed: 'left', render: (v, r) => r.isTotal ? <strong style={{ color: '#f5222d' }}>{v}</strong> : v },
    { title: '神殿', dataIndex: '神殿', width: 80, fixed: 'left' },
    { title: '招生收入', children: incomeColumns },
    { title: '招生数据', children: enrollmentColumns },
    { title: '免费推广转化率', children: channelRateColumns },
    { title: '免费推广招生成本', children: channelCostColumns },
  ], [incomeColumns, enrollmentColumns, channelRateColumns, channelCostColumns])

  // 2. 咨询师汇总表列
  const consultantColumns: ColumnsType<ConsultantDataRow> = useMemo(() => [
    { title: '序号', dataIndex: '序号', width: 50, align: 'center', render: (v, r) => r.isTotal ? <strong style={{ color: '#f5222d' }}>{v}</strong> : v },
    { title: '咨询师', dataIndex: '咨询师', width: 80 },
    { title: '招生收入', children: incomeColumns },
    { title: '招生数据', children: enrollmentColumns },
    { title: '免费推广转化率', children: channelRateColumns },
    { title: '免费推广招生成本', children: channelCostColumns },
  ], [incomeColumns, enrollmentColumns, channelRateColumns, channelCostColumns])

  // 3. 咨询师月度明细表列
  const consultantMonthlyColumns: ColumnsType<ConsultantMonthlyRow> = useMemo(() => [
    { title: '月份', dataIndex: '月份', width: 50, align: 'center', render: (v, r) => r.isTotal ? <strong style={{ color: '#f5222d' }}>{v}</strong> : v },
    { title: '咨询师', dataIndex: '咨询师', width: 80 },
    { title: '招生收入', children: editableIncomeColumns },
    { title: '招生数据', children: editableEnrollmentColumns },
    { title: '免费推广转化率', children: channelRateColumns },
    { title: '免费推广招生成本', children: editableChannelCostColumns },
  ], [editableIncomeColumns, editableEnrollmentColumns, channelRateColumns, editableChannelCostColumns])

  // 表头样式
  const headerStyle = {
    background: bgColor,
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
        {/* 0. 神殿汇总表（新增） */}
        <div style={headerStyle}>
          清美教育集团{year}年度渠道数据核心数据看板-咨询师（神殿汇总）
        </div>
        <Table
          columns={summaryColumns}
          dataSource={summaryRow ? [summaryRow] : []}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1200 }}
        />

        <Divider style={{ margin: '16px 0' }} />

        {/* 1. 月度数据表 */}
        <div style={headerStyle}>
          清美教育集团{year}年度渠道数据核心数据看板-咨询师（月度）
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

        <Divider style={{ margin: '16px 0' }} />

        {/* 2. 咨询师年度汇总表 */}
        <div style={headerStyle}>
          清美教育集团{year}年度渠道数据核心数据看板-咨询师（年度汇总）
        </div>
        <Table
          columns={consultantColumns}
          dataSource={consultantRows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1200 }}
          rowClassName={(record) => record.isTotal ? 'total-row' : ''}
        />

        <Divider style={{ margin: '16px 0' }} />

        {/* 3. 咨询师月度明细表 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...headerStyle }}>
          <span>
            清美教育集团{year}年度渠道数据核心数据看板-咨询师（月度明细）
          </span>
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={handleSaveMonthlyPlans}
            loading={saving}
            size="small"
          >
            保存计划数据
          </Button>
        </div>
        <Table
          columns={consultantMonthlyColumns}
          dataSource={consultantMonthlyRows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 1200, y: 600 }}
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

