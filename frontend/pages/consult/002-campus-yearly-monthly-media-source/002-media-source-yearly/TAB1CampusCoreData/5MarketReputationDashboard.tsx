/**
 * 盛邦年度市场口碑数据核心数据看板
 * 按月份展示市场口碑完整数据
 * 
 * 功能：
 * 1. 咨询师月度表的咨询师从配置中心的员工管理部分读取
 * 2. 相关数据从咨询量统计系统读取
 * 3. 费用投入 = 市场口碑咨询量成本（从市场部获取）× 咨询总量
 * 4. 月度汇总表（1,2,3表）数据从咨询师月度明细表（4表）自动汇总
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { App, InputNumber, Table, Button, Spin, Divider } from 'antd'
import { SaveOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { NoCopyContainer } from '@/components/common'
import api from '@/services/api'
import * as consultantPlanService from '@/services/consult/consultantPlan'
import * as statsApi from '@/pages/consult/type-count-system/statsApi'
import { getReputationPlanCost } from '@/services/consult/marketCost'

// ==================== 常量定义 ====================
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// ==================== 类型定义 ====================

// 月度汇总行（表1,2,3）
interface MarketReputationRow {
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
  电话量: number | null
  咨询总量: number | null
  // 市场口碑转化率
  报名转化率: string
  当面转化率: string
  上门率: string
  // 市场口碑招生成本
  费用投入: number | null
  招生成本: number | null
}

// 咨询师月度明细行（表4）
interface ConsultantMonthlyRow {
  key: string
  月份: number | string
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
  // 转化率
  总转: string
  当面转化: string
  电转门: string
  // 招生成本
  费用投入: number | null
  招生成本: number | null
}

interface Props {
  year: string
  campus?: string
  /** 是否显示咨询师月度明细表，默认true */
  showConsultantTable?: boolean
}

// ==================== 转化率计算函数 ====================
const calculateRates = (row: MarketReputationRow | ConsultantMonthlyRow) => {
  // 报名转化率 = 实际招生 / 咨询总量
  if (row.咨询总量 && row.咨询总量 > 0 && row.实际招生 !== null) {
    const rate = ((row.实际招生 / row.咨询总量) * 100).toFixed(2) + '%'
    if ('报名转化率' in row) row.报名转化率 = rate
    if ('总转' in row) row.总转 = rate
  } else if (row.实际招生 === 0 && row.咨询总量 === 0) {
    if ('报名转化率' in row) row.报名转化率 = '-'
    if ('总转' in row) row.总转 = '-'
  } else if (row.咨询总量 === 0 || row.咨询总量 === null) {
    if ('报名转化率' in row) row.报名转化率 = '0%'
    if ('总转' in row) row.总转 = '0%'
  } else {
    if ('报名转化率' in row) row.报名转化率 = '-'
    if ('总转' in row) row.总转 = '-'
  }
  
  // 当面转化率 = 实际招生 / 上门总量
  if (row.上门总量 && row.上门总量 > 0 && row.实际招生 !== null) {
    const rate = ((row.实际招生 / row.上门总量) * 100).toFixed(2) + '%'
    if ('当面转化率' in row) row.当面转化率 = rate
    if ('当面转化' in row) row.当面转化 = rate
  } else if (row.实际招生 === 0 && row.上门总量 === 0) {
    if ('当面转化率' in row) row.当面转化率 = '-'
    if ('当面转化' in row) row.当面转化 = '-'
  } else if (row.上门总量 === 0 || row.上门总量 === null) {
    if ('当面转化率' in row) row.当面转化率 = '0%'
    if ('当面转化' in row) row.当面转化 = '0%'
  } else {
    if ('当面转化率' in row) row.当面转化率 = '-'
    if ('当面转化' in row) row.当面转化 = '-'
  }
  
  // 上门率 = 上门总量 / 咨询总量
  if (row.咨询总量 && row.咨询总量 > 0 && row.上门总量 !== null) {
    const rate = ((row.上门总量 / row.咨询总量) * 100).toFixed(2) + '%'
    if ('上门率' in row) row.上门率 = rate
    if ('电转门' in row) row.电转门 = rate
  } else if (row.上门总量 === 0 && row.咨询总量 === 0) {
    if ('上门率' in row) row.上门率 = '-'
    if ('电转门' in row) row.电转门 = '-'
  } else if (row.咨询总量 === 0 || row.咨询总量 === null) {
    if ('上门率' in row) row.上门率 = '0%'
    if ('电转门' in row) row.电转门 = '0%'
  } else {
    if ('上门率' in row) row.上门率 = '-'
    if ('电转门' in row) row.电转门 = '-'
  }
}

export default function MarketReputationDashboard({ year, campus = '盛邦', showConsultantTable = true }: Props) {
  const { message } = App.useApp()
  const { notification } = App.useApp()
  // ==================== 状态定义 ====================
  const [loading, setLoading] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const loadIdRef = useRef(0)
  
  // 月度汇总表数据（从表4自动汇总）
  const [monthlyRows, setMonthlyRows] = useState<MarketReputationRow[]>([])
  // 咨询师月度明细表数据（表4）
  const [consultantMonthlyRows, setConsultantMonthlyRows] = useState<ConsultantMonthlyRow[]>([])
  // 待保存的计划数据变更
  const [pendingPlanChanges, setPendingPlanChanges] = useState<Map<string, { 计划收入?: number; 计划招生?: number }>>(new Map())
  // 市场口碑咨询量成本（按月份）
  const [marketCostByMonth, setMarketCostByMonth] = useState<Map<number, number>>(new Map())
  
  // ==================== 辅助函数 ====================
  
  // 创建空的月度汇总行
  const makeEmptyRow = (月份: number | string, isTotal = false): MarketReputationRow => ({
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
    报名转化率: '',
    当面转化率: '',
    上门率: '',
    费用投入: null,
    招生成本: null,
  })
  
  // 创建咨询师月度行
  const makeConsultantMonthlyRow = (
    月份: number | string,
    咨询师: string,
    isTotal = false
  ): ConsultantMonthlyRow => ({
    key: `cm_${月份}_${咨询师}`,
    月份,
    咨询师,
    isTotal,
    计划收入: null,
    实际收入: null,
    计划招生: null,
    实际招生: null,
    退费人数: null,
    上门总量: null,
    咨询总量: null,
    电话量: null,
    总转: '',
    当面转化: '',
    电转门: '',
    费用投入: null,
    招生成本: null,
  })

  // 渲染值
  const renderValue = (v: number | null, isTotal: boolean, color?: string) => {
    if (v === null || v === undefined) return '-'
    const displayValue = typeof v === 'number' ? v.toLocaleString() : v
    if (isTotal) {
      return <strong style={{ color: color || '#f5222d' }}>{displayValue}</strong>
    }
    return displayValue
  }
  
  // 渲染转化率
  const renderRate = (v: string, isTotal: boolean) => {
    if (!v || v === '-') return <span style={{ color: '#999' }}>-</span>
    if (v === '0%') return <span style={{ color: '#999' }}>0%</span>
    if (isTotal) {
      return <strong style={{ color: '#52c41a' }}>{v}</strong>
    }
    return <span style={{ color: '#52c41a' }}>{v}</span>
  }

  // ==================== 数据加载 ====================
  const loadData = useCallback(async (currentLoadId: number) => {
    const isStale = () => loadIdRef.current !== currentLoadId
    
    setLoading(true)
    try {
      const yearNum = parseInt(year)

      // 并行获取数据
      const [
        reputationPlanData,
        consultantMonthlyData,
        monthlyCampusData,
        reputationCostData,
        configConsultants
      ] = await Promise.all([
        // 从月度详细计划获取市场口碑计划数据
        api.get('/market/monthly-plan/reputation/list', {
          params: { year: yearNum, campus }
        }).then(res => {
          if (res.data?.code === 0 && res.data?.data) {
            return res.data.data
          }
          return null
        }).catch((err) => {
          console.error('获取市场口碑计划数据失败:', err)
          return null
        }),
        // 咨询师月度实际数据（从咨询量明细表_v2）
        // 使用分类参数，后端会自动处理量来源='口碑'+媒体来源='市场口碑'的组合查询
        statsApi.getConsultantMonthlySummary({
          年份: yearNum,
          神殿: campus,
          分类: '市场口碑',
        }).catch((err) => {
          console.error('获取咨询师月度数据失败:', err)
          return null
        }),
        // 月度神殿汇总数据（从咨询量明细表_v2）
        statsApi.getMonthlyCampusSummary({
          年份: yearNum,
          神殿: campus,
          分类: '市场口碑',
        }).catch((err) => {
          console.error('获取月度神殿汇总数据失败:', err)
          return null
        }),
        // 市场部口碑成本数据（获取咨询量成本）
        getReputationPlanCost(campus, yearNum).catch((err) => {
          console.error('获取市场口碑成本数据失败:', err)
          return {}
        }),
        // 从配置中心获取咨询师列表（祈福司员工，按神殿分组）
        api.get('/config/department-users', { params: { department: '祈福司' } }).then(res => {
          if (res.data) {
            // 从所有神殿分组中提取咨询师姓名
            const allUsers: string[] = []
            res.data.forEach((group: any) => {
              if (group.users && Array.isArray(group.users)) {
                group.users.forEach((u: any) => {
                  if (u.real_name) allUsers.push(u.real_name)
                })
              }
            })
            return allUsers.filter(Boolean)
          }
          return []
        }).catch((err) => {
          console.error('获取咨询师列表失败:', err)
          return []
        }),
      ])

      // 从咨询统计数据中提取实际有数据的咨询师列表
      const actualConsultants = consultantMonthlyData?.success && consultantMonthlyData.data?.咨询师数据
        ? Object.keys(consultantMonthlyData.data.咨询师数据).filter(name => name.trim())
        : []
      
      // 合并所有来源的咨询师：实际数据 + 配置中心
      // 如果所有来源都为空，使用默认列表
      const mergedConsultants = [...new Set([...actualConsultants, ...configConsultants])].length > 0
        ? [...new Set([...actualConsultants, ...configConsultants])]
        : ['张三', '李四', '王五']
      
      // 构建计划数据映射（从月度详细计划）
      const planByMonth: Record<number, { 计划收入: number; 计划招生: number }> = {}
      if (reputationPlanData) {
        // reputationPlanData 格式: { 1: { plan_income: xxx, plan_enrollment: xxx }, 2: {...}, ... }
        Object.entries(reputationPlanData).forEach(([monthStr, monthData]: [string, any]) => {
          const month = parseInt(monthStr)
          if (isNaN(month) || !monthData) return
          
          // 从月度数据中提取计划收入和计划招生（支持中英文字段名）
          const planIncome = Number(monthData.plan_income || monthData.计划收入 || 0)
          const planEnroll = Number(monthData.plan_enrollment || monthData.计划招生 || 0)
          
          planByMonth[month] = {
            计划收入: planIncome,
            计划招生: planEnroll,
          }
        })
      }
      
      console.log('市场口碑计划数据:', planByMonth)

      // 处理市场口碑咨询量成本数据（咨询量成本 = 实际消费 / 实际咨询量）
      const costMap = new Map<number, number>()
      if (reputationCostData) {
        Object.entries(reputationCostData).forEach(([month, data]: [string, any]) => {
          const monthNum = parseInt(month)
          // 咨询量成本 = plan_cost（计划消费）作为单价，或者用 actual_expense / 咨询量
          const consultCost = data.plan_cost || 0
          costMap.set(monthNum, consultCost)
        })
      }
      setMarketCostByMonth(costMap)

      // ========== 生成咨询师月度明细表（表4）==========
      const cmData: ConsultantMonthlyRow[] = []
      
      MONTHS.forEach(m => {
        // 每个月的咨询师数据
        mergedConsultants.forEach(name => {
          const row = makeConsultantMonthlyRow(m, name, false)
          
          // 获取该月的计划数据（从月度详细计划，按月汇总，不区分咨询师）
          const monthPlan = planByMonth[m]
          if (monthPlan) {
            // 将月度计划平均分配给所有咨询师（或者可以设置为null，让用户手动填写）
            // 这里暂时不填充计划数据到咨询师行，因为月度详细计划是神殿级别的
            // row.计划收入 = null
            // row.计划招生 = null
          }
          
          // 获取实际数据（从咨询量统计表）
          if (consultantMonthlyData?.success && consultantMonthlyData.data?.咨询师数据) {
            const consultantData = consultantMonthlyData.data.咨询师数据[name]
            if (consultantData) {
              const stats = consultantData[m] || consultantData[String(m)]
              if (stats) {
                row.实际招生 = stats.报名量 ?? null
                if (stats.实际收入 !== undefined && stats.实际收入 !== null) {
                  row.实际收入 = stats.实际收入
                }
                row.退费人数 = stats.退费人数 ?? null
                row.上门总量 = stats.上门量 ?? null
                row.咨询总量 = stats.咨询总量 ?? null
                row.电话量 = stats.电话量 ?? null
              }
            }
          }
          
          // 费用投入 = 市场口碑咨询量成本 × 咨询总量
          const consultCost = costMap.get(m) || 0
          if (consultCost > 0 && row.咨询总量 && row.咨询总量 > 0) {
            row.费用投入 = Math.round(consultCost * row.咨询总量)
          }
          
          // 计算招生成本 = 费用投入 / 实际招生
          if (row.费用投入 && row.实际招生 && row.实际招生 > 0) {
            row.招生成本 = Math.round(row.费用投入 / row.实际招生)
          }
          
          calculateRates(row)
          cmData.push(row)
        })
        
        // 补充空行到4行
        for (let i = mergedConsultants.length; i < 4; i++) {
          cmData.push(makeConsultantMonthlyRow(m, '', false))
        }
        
        // 每月的合计行
        const monthTotalRow = makeConsultantMonthlyRow('', '合计', true)
        monthTotalRow.key = `cm_total_${m}`
        const monthDataRows = cmData.filter(r => r.月份 === m && !r.isTotal && r.咨询师)
        
        // 汇总实际数据
        ;['实际收入', '实际招生', '退费人数', '上门总量', '咨询总量', '电话量', '费用投入'].forEach(field => {
          const sum = monthDataRows.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
          ;(monthTotalRow as any)[field] = sum || null
        })
        
        // 合计行的计划数据从月度详细计划获取
        const monthPlan = planByMonth[m]
        if (monthPlan) {
          monthTotalRow.计划收入 = monthPlan.计划收入 || null
          monthTotalRow.计划招生 = monthPlan.计划招生 || null
        }
        
        if (monthTotalRow.费用投入 && monthTotalRow.实际招生 && monthTotalRow.实际招生 > 0) {
          monthTotalRow.招生成本 = Math.round(monthTotalRow.费用投入 / monthTotalRow.实际招生)
        }
        calculateRates(monthTotalRow)
        cmData.push(monthTotalRow)
      })
      
      // 年度总合计行
      const yearTotalRow = makeConsultantMonthlyRow('合计', '', true)
      yearTotalRow.key = 'cm_total_year'
      const allDataRows = cmData.filter(r => !r.isTotal && r.咨询师)
      
      // 汇总实际数据
      ;['实际收入', '实际招生', '退费人数', '上门总量', '咨询总量', '电话量', '费用投入'].forEach(field => {
        const sum = allDataRows.reduce((acc, r) => acc + ((r as any)[field] || 0), 0)
        ;(yearTotalRow as any)[field] = sum || null
      })
      
      // 年度总计划数据从所有月份汇总
      let totalPlanIncome = 0
      let totalPlanEnroll = 0
      Object.values(planByMonth).forEach(plan => {
        totalPlanIncome += plan.计划收入 || 0
        totalPlanEnroll += plan.计划招生 || 0
      })
      yearTotalRow.计划收入 = totalPlanIncome || null
      yearTotalRow.计划招生 = totalPlanEnroll || null
      
      if (yearTotalRow.费用投入 && yearTotalRow.实际招生 && yearTotalRow.实际招生 > 0) {
        yearTotalRow.招生成本 = Math.round(yearTotalRow.费用投入 / yearTotalRow.实际招生)
      }
      calculateRates(yearTotalRow)
      cmData.push(yearTotalRow)
      
      if (isStale()) return
      setConsultantMonthlyRows(cmData)

      // ========== 生成月度汇总表（从表4自动汇总）==========
      const monthlyData: MarketReputationRow[] = MONTHS.map(m => {
        const row = makeEmptyRow(m, false)
        
        // 从咨询师月度表汇总本月数据
        const monthConsultantRows = cmData.filter(r => r.月份 === m && !r.isTotal && r.咨询师)
        
        // 计划数据直接从 planByMonth 获取（神殿级别）
        const monthPlan = planByMonth[m]
        if (monthPlan) {
          row.计划收入 = monthPlan.计划收入 || null
          row.计划招生 = monthPlan.计划招生 || null
        }
        
        // 汇总实际数据
        row.实际收入 = monthConsultantRows.reduce((sum, r) => sum + (r.实际收入 || 0), 0) || null
        row.实际招生 = monthConsultantRows.reduce((sum, r) => sum + (r.实际招生 || 0), 0) || null
        row.退费人数 = monthConsultantRows.reduce((sum, r) => sum + (r.退费人数 || 0), 0) || null
        row.上门总量 = monthConsultantRows.reduce((sum, r) => sum + (r.上门总量 || 0), 0) || null
        row.咨询总量 = monthConsultantRows.reduce((sum, r) => sum + (r.咨询总量 || 0), 0) || null
        row.电话量 = monthConsultantRows.reduce((sum, r) => sum + (r.电话量 || 0), 0) || null
        row.费用投入 = monthConsultantRows.reduce((sum, r) => sum + (r.费用投入 || 0), 0) || null
        
        // 如果月度汇总没有数据，尝试从月度神殿汇总API获取
        if (monthlyCampusData?.success && monthlyCampusData.data?.月度数据) {
          const monthStats = monthlyCampusData.data.月度数据.find((item: any) => item.月份 === m)
          if (monthStats) {
            if (!row.实际招生) row.实际招生 = monthStats.报名量 ?? null
            if (!row.实际收入) row.实际收入 = monthStats.实际收入 ?? null
            if (!row.退费人数) row.退费人数 = monthStats.退费人数 ?? null
            if (!row.上门总量) row.上门总量 = monthStats.上门量 ?? null
            if (!row.咨询总量) row.咨询总量 = monthStats.咨询总量 ?? null
            if (!row.电话量) row.电话量 = monthStats.电话量 ?? monthStats.咨询总量 ?? null
          }
        }
        
        // 计算招生成本
        if (row.费用投入 && row.实际招生 && row.实际招生 > 0) {
          row.招生成本 = Math.round(row.费用投入 / row.实际招生)
        }
        
        calculateRates(row)
        return row
      })
      
      // 添加合计行
      const totalRow = makeEmptyRow('合计', true)
      const sumFields: (keyof MarketReputationRow)[] = [
        '计划收入', '实际收入', '计划招生', '实际招生', '退费人数',
        '上门总量', '咨询总量', '电话量', '费用投入'
      ]
      sumFields.forEach(field => {
        const sum = monthlyData.reduce((acc, r) => acc + ((r[field] as number) || 0), 0)
        ;(totalRow as any)[field] = sum || null
      })
      if (totalRow.费用投入 && totalRow.实际招生 && totalRow.实际招生 > 0) {
        totalRow.招生成本 = Math.round(totalRow.费用投入 / totalRow.实际招生)
      }
      calculateRates(totalRow)
      monthlyData.push(totalRow)
      
      if (isStale()) return
      setMonthlyRows(monthlyData)
      
    } catch (error) {
      if (!isStale()) {
        console.error('加载市场口碑数据失败:', error)
        message.error('加载数据失败')
      }
    } finally {
      if (!isStale()) {
        setLoading(false)
      }
    }
  }, [year, campus])

  // 只在 year 或 campus 变化时加载数据
  useEffect(() => {
    const id = ++loadIdRef.current
    loadData(id)
  }, [year, campus, loadData])

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
    
    // 同时更新表格显示
    setConsultantMonthlyRows(prev => {
      const next = [...prev]
      const row = next.find(r => r.月份 === 月份 && r.咨询师 === 咨询师 && !r.isTotal)
      if (row) {
        ;(row as any)[field] = value
      }
      return next
    })
  }, [])

  // 保存计划数据
  const savePlanData = useCallback(async () => {
    if (pendingPlanChanges.size === 0) {
      message.info('没有需要保存的更改')
      return
    }

    setSavingPlan(true)
    try {
      const dataList: Omit<consultantPlanService.ConsultantMonthlyPlan, '记录ID'>[] = []

      pendingPlanChanges.forEach((changes, key) => {
        const [monthStr, consultant] = key.split('_')
        const month = parseInt(monthStr, 10)

        const existingRow = consultantMonthlyRows.find(
          r => r.月份 === month && r.咨询师 === consultant && !r.isTotal
        )

        const dataItem = {
          年份: parseInt(year),
          月份: month,
          神殿: campus,
          咨询师: consultant,
          数据类型: '市场口碑',
          计划收入: changes.计划收入 !== undefined ? changes.计划收入 : (existingRow?.计划收入 ?? 0),
          计划招生: changes.计划招生 !== undefined ? changes.计划招生 : (existingRow?.计划招生 ?? 0),
          费用投入: existingRow?.费用投入 ?? 0,
        }

        dataList.push(dataItem)
      })

      await consultantPlanService.batchSaveConsultantPlans(dataList)
      notification.success({ message: '已保存', description: '计划数据保存成功', placement: 'topRight', duration: 3 })
      setPendingPlanChanges(new Map())

      // 重新加载数据
      const id = ++loadIdRef.current
      await loadData(id)
    } catch (error) {
      console.error('保存计划数据失败:', error)
      notification.error({ message: '保存失败', description: '保存计划数据失败', placement: 'topRight', duration: 4 })
    } finally {
      setSavingPlan(false)
    }
  }, [pendingPlanChanges, consultantMonthlyRows, year, campus, loadData])

  // ==================== 表格列定义 ====================

  // 月度汇总表列
  const monthlyColumns: ColumnsType<MarketReputationRow> = [
    {
      title: '月份',
      dataIndex: '月份',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (val: number | string, r: MarketReputationRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{val}</strong> : val,
    },
    {
      title: '神殿',
      dataIndex: '神殿',
      width: 80,
      fixed: 'left' as const,
      align: 'center' as const,
    },
    {
      title: '招生收入',
      children: [
        { 
          title: '计划收入', 
          dataIndex: '计划收入',
          width: 100, 
          align: 'center' as const,
          render: (v: number | null, r: MarketReputationRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '实际收入', 
          dataIndex: '实际收入',
          width: 100, 
          align: 'center' as const,
          render: (v: number | null, r: MarketReputationRow) => renderValue(v, r.isTotal)
        },
      ],
    },
    {
      title: '招生数据',
      children: [
        { 
          title: '计划招生', 
          dataIndex: '计划招生',
          width: 80, 
          align: 'center' as const,
          render: (v: number | null, r: MarketReputationRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '实际招生', 
          dataIndex: '实际招生',
          width: 80, 
          align: 'center' as const,
          render: (v: number | null, r: MarketReputationRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '退费人数', 
          dataIndex: '退费人数',
          width: 80, 
          align: 'center' as const,
          render: (v: number | null, r: MarketReputationRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '上门总量', 
          dataIndex: '上门总量',
          width: 80, 
          align: 'center' as const,
          render: (v: number | null, r: MarketReputationRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '电话量', 
          dataIndex: '电话量',
          width: 80, 
          align: 'center' as const,
          render: (v: number | null, r: MarketReputationRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '咨询总量', 
          dataIndex: '咨询总量',
          width: 80, 
          align: 'center' as const,
          render: (v: number | null, r: MarketReputationRow) => renderValue(v, r.isTotal)
        },
      ],
    },
    {
      title: '市场口碑转化率',
      children: [
        { 
          title: '报名转化率', 
          dataIndex: '报名转化率', 
          width: 100, 
          align: 'center' as const,
          render: (v: string, r: MarketReputationRow) => renderRate(v, r.isTotal)
        },
        { 
          title: '当面转化率', 
          dataIndex: '当面转化率', 
          width: 100, 
          align: 'center' as const,
          render: (v: string, r: MarketReputationRow) => renderRate(v, r.isTotal)
        },
        { 
          title: '上门率', 
          dataIndex: '上门率', 
          width: 80, 
          align: 'center' as const,
          render: (v: string, r: MarketReputationRow) => renderRate(v, r.isTotal)
        },
      ],
    },
    {
      title: '市场口碑招生成本',
      children: [
        { 
          title: '费用投入', 
          dataIndex: '费用投入',
          width: 90, 
          align: 'center' as const,
          render: (v: number | null, r: MarketReputationRow) => renderValue(v, r.isTotal, '#f5222d')
        },
        { 
          title: '招生成本', 
          dataIndex: '招生成本',
          width: 90, 
          align: 'center' as const,
          render: (v: number | null, r: MarketReputationRow) => renderValue(v, r.isTotal)
        },
      ],
    },
  ]

  // 咨询师月度明细表列
  const consultantMonthlyColumns: ColumnsType<ConsultantMonthlyRow> = [
    {
      title: '月份',
      dataIndex: '月份',
      width: 60,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (v: number | string, r: ConsultantMonthlyRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{v || '合计'}</strong> : v,
    },
    {
      title: '咨询师',
      dataIndex: '咨询师',
      width: 80,
      fixed: 'left' as const,
      align: 'center' as const,
      render: (v: string, r: ConsultantMonthlyRow) =>
        r.isTotal ? <strong style={{ color: '#ff4d4f' }}>{v || '合计'}</strong> : v,
    },
    {
      title: '招生收入',
      children: [
        { 
          title: '计划收入', 
          dataIndex: '计划收入',
          width: 100, 
          align: 'center' as const,
          render: (val: number | null, r: ConsultantMonthlyRow) => {
            if (r.isTotal) {
              return <strong style={{ color: '#f5222d' }}>{val ? val.toLocaleString() : '-'}</strong>
            }
            if (!r.咨询师) return '-'
            
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
          width: 100, 
          align: 'center' as const,
          render: (v: number | null, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal)
        },
      ],
    },
    {
      title: '招生数据',
      children: [
        { 
          title: '计划招生', 
          dataIndex: '计划招生',
          width: 80, 
          align: 'center' as const,
          render: (val: number | null, r: ConsultantMonthlyRow) => {
            if (r.isTotal) {
              return <strong style={{ color: '#f5222d' }}>{val || '-'}</strong>
            }
            if (!r.咨询师) return '-'
            
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
          align: 'center' as const,
          render: (v: number | null, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '退费人数', 
          dataIndex: '退费人数',
          width: 70, 
          align: 'center' as const,
          render: (v: number | null, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '上门总量', 
          dataIndex: '上门总量',
          width: 70, 
          align: 'center' as const,
          render: (v: number | null, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '咨询总量', 
          dataIndex: '咨询总量',
          width: 70, 
          align: 'center' as const,
          render: (v: number | null, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '电话量', 
          dataIndex: '电话量',
          width: 70, 
          align: 'center' as const,
          render: (v: number | null, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal)
        },
      ],
    },
    {
      title: '市场口碑转化率',
      children: [
        { 
          title: '总转', 
          dataIndex: '总转', 
          width: 70, 
          align: 'center' as const,
          render: (v: string, r: ConsultantMonthlyRow) => renderRate(v, r.isTotal)
        },
        { 
          title: '当面转化', 
          dataIndex: '当面转化', 
          width: 80, 
          align: 'center' as const,
          render: (v: string, r: ConsultantMonthlyRow) => renderRate(v, r.isTotal)
        },
        { 
          title: '电转门', 
          dataIndex: '电转门', 
          width: 70, 
          align: 'center' as const,
          render: (v: string, r: ConsultantMonthlyRow) => renderRate(v, r.isTotal)
        },
      ],
    },
    {
      title: '市场口碑招生成本',
      children: [
        { 
          title: '费用投入', 
          dataIndex: '费用投入',
          width: 90, 
          align: 'center' as const,
          render: (v: number | null, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal)
        },
        { 
          title: '招生成本', 
          dataIndex: '招生成本',
          width: 80, 
          align: 'center' as const,
          render: (v: number | null, r: ConsultantMonthlyRow) => renderValue(v, r.isTotal)
        },
      ],
    },
  ]

  // ==================== 渲染 ====================
  return (
    <Spin spinning={loading}>
      <NoCopyContainer warningMessage="祈福司门数据禁止复制">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 月度汇总表（从表4自动汇总） */}
          <div>
            <div style={{ 
              background: '#FFA500', 
              padding: '8px 16px', 
              fontWeight: 'bold', 
              marginBottom: 8,
              fontSize: '14px',
              color: 'white'
            }}>
              {campus}{year}年度市场口碑数据核心数据看板
            </div>
            <Table
              columns={monthlyColumns}
              dataSource={monthlyRows}
              pagination={false}
              bordered
              size="small"
              scroll={{ x: 1400 }}
              rowClassName={r => (r.isTotal ? 'total-row' : '')}
            />
          </div>

          {/* 咨询师月度明细表（表4）- 仅在 showConsultantTable 为 true 时显示 */}
          {showConsultantTable && (
            <>
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  background: '#FFA500', 
                  padding: '8px 16px', 
                  marginBottom: 8,
                  fontSize: '14px',
                  color: 'white'
                }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {campus}{year}年度市场口碑咨询师月度明细表
                  </span>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    size="small"
                    loading={savingPlan}
                    onClick={savePlanData}
                    disabled={pendingPlanChanges.size === 0}
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
                  scroll={{ x: 1400 }}
                  rowClassName={r => (r.isTotal ? 'total-row' : '')}
                />
              </div>
            </>
          )}
          
          <style>{`
            .total-row { background-color: #e6f7ff; }
            .total-row td { background-color: #e6f7ff !important; font-weight: bold; }
          `}</style>
        </div>
      </NoCopyContainer>
    </Spin>
  )
}

