import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Button, Card, DatePicker, Space, Tabs, Typography } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import SummaryTab, { type SummaryRow } from './SummaryTab'
import BaiduPromotionTab, { type BaiduPromotionRow } from './BaiduPromotionTab'
import OtherPlatformTab, { type OtherPlatformRow } from './OtherPlatformTab'
import { marketSemDailyDataService } from '@/services/market/marketSemDailyData'
import ExcelImporter, { type ImportedData } from './ExcelImporter'

const { Title } = Typography

const formatMonthDay = (d: dayjs.Dayjs) => `${d.month() + 1}月${d.date()}日`

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

// 计算转化率
const calcConversionRate = (netSignup: number, consultCount: number): string => {
  if (!consultCount) return '0%'
  const v = (netSignup / consultCount) * 100
  return `${v.toFixed(2)}%`
}

// 计算咨询成本
const calcConsultCost = (consumption: number, consultCount: number): string => {
  if (!consultCount) return '¥0.00'
  const v = consumption / consultCount
  return `¥${v.toFixed(2)}`
}

// 构建月度行数据 - 汇总
const buildSummaryMonthRows = (monthStart: Dayjs): SummaryRow[] => {
  const start = monthStart.startOf('month')
  const daysInMonth = start.daysInMonth()
  const rows: SummaryRow[] = []

  // 汇总行
  rows.push({
    key: 'summary',
    weekday: '',
    dateText: '汇总',
    semActualIncome: 0,
    semSignupConversionRate: '0%',
    refundCount: 0,
    netSignup: 0,
    grossTotal: 0,
    orderCount: 0,
    visitCount: 0,
    actualConsultCount: 0,
    consultCost: '¥0.00',
    semConsumption: 0,
  })

  for (let i = 0; i < daysInMonth; i++) {
    const d = start.add(i, 'day')
    rows.push({
      key: d.format('YYYY-MM-DD'),
      weekday: weekdayMap[d.day()],
      dateText: formatMonthDay(d),
      semActualIncome: 0,
      semSignupConversionRate: '0%',
      refundCount: 0,
      netSignup: 0,
      grossTotal: 0,
      orderCount: 0,
      visitCount: 0,
      actualConsultCount: 0,
      consultCost: '¥0.00',
      semConsumption: 0,
    })
  }

  return rows
}

// 构建月度行数据 - 百度推广
const buildBaiduMonthRows = (monthStart: Dayjs): BaiduPromotionRow[] => {
  const start = monthStart.startOf('month')
  const daysInMonth = start.daysInMonth()
  const rows: BaiduPromotionRow[] = []

  // 汇总行
  rows.push({
    key: 'summary',
    weekday: '',
    dateText: '汇总',
    baiduIncome: 0,
    baiduConversionRate: '0%',
    refundCount: 0,
    netSignup: 0,
    grossTotal: 0,
    orderCount: 0,
    visitCount: 0,
    baiduConsultCount: 0,
    consultCost: '¥0.00',
    baiduConsumption: 0,
    baiduForm: 0,
    centerComeIn: 0,
    baiduChatOut: 0,
    totalConsultCount: 0,
    validConsultCount: 0,
    validConsultRate: 0,
    validConsultCost: '¥0.00',
    baiduTotalDialogue: 0,
    validDialogue: 0,
    validDialogueRate: 0,
    impressionCount: 0,
    clickCount: 0,
    clickRate: 0,
    consumption: 0,
    avgPrice: '¥0.00',
  })

  for (let i = 0; i < daysInMonth; i++) {
    const d = start.add(i, 'day')
    rows.push({
      key: d.format('YYYY-MM-DD'),
      weekday: weekdayMap[d.day()],
      dateText: formatMonthDay(d),
      baiduIncome: 0,
      baiduConversionRate: '0%',
      refundCount: 0,
      netSignup: 0,
      grossTotal: 0,
      orderCount: 0,
      visitCount: 0,
      baiduConsultCount: 0,
      consultCost: '¥0.00',
      baiduConsumption: 0,
      baiduForm: 0,
      centerComeIn: 0,
      baiduChatOut: 0,
      totalConsultCount: 0,
      validConsultCount: 0,
      validConsultRate: 0,
      validConsultCost: '¥0.00',
      baiduTotalDialogue: 0,
      validDialogue: 0,
      validDialogueRate: 0,
      impressionCount: 0,
      clickCount: 0,
      clickRate: 0,
      consumption: 0,
      avgPrice: '¥0.00',
    })
  }

  return rows
}

// 构建月度行数据 - 其他平台
const buildOtherMonthRows = (monthStart: Dayjs): OtherPlatformRow[] => {
  const start = monthStart.startOf('month')
  const daysInMonth = start.daysInMonth()
  const rows: OtherPlatformRow[] = []

  // 汇总行
  rows.push({
    key: 'summary',
    weekday: '',
    dateText: '汇总',
    otherActualIncome: 0,
    otherConversionRate: '0%',
    refundCount: 0,
    netSignup: 0,
    grossTotal: 0,
    orderCount: 0,
    visitCount: 0,
    otherConsultCount: 0,
    consultCost: '¥0.00',
    otherConsumption: 0,
    campusWebsiteVisit: 0,
    geo: 0,
  })

  for (let i = 0; i < daysInMonth; i++) {
    const d = start.add(i, 'day')
    rows.push({
      key: d.format('YYYY-MM-DD'),
      weekday: weekdayMap[d.day()],
      dateText: formatMonthDay(d),
      otherActualIncome: 0,
      otherConversionRate: '0%',
      refundCount: 0,
      netSignup: 0,
      grossTotal: 0,
      orderCount: 0,
      visitCount: 0,
      otherConsultCount: 0,
      consultCost: '¥0.00',
      otherConsumption: 0,
      campusWebsiteVisit: 0,
      geo: 0,
    })
  }

  return rows
}

const MarketingSEMDailyDataPage: React.FC = () => {
  const { message } = App.useApp()
  const { getAllCampuses, loadCampusesFromConfig } = useCampusStore()
  
  // 获取排序后的神殿列表 - 使用 useMemo 避免无限循环
  const campuses = useMemo(() => getAllCampuses(), [getAllCampuses])

  const [activeCampusId, setActiveCampusId] = useState<string | undefined>(undefined)
  const [activeTabKey, setActiveTabKey] = useState<string>('summary')
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(() => dayjs().startOf('month'))

  // 数据结构：{ campusId: { summary: [], baidu: [], other: [] } }
  const [campusData, setCampusData] = useState<
    Record<
      string,
      {
        summary: SummaryRow[]
        baidu: BaiduPromotionRow[]
        other: OtherPlatformRow[]
      }
    >
  >({})

  const [loadingByKey, setLoadingByKey] = useState<Record<string, boolean>>({})
  const [savingByKey, setSavingByKey] = useState<Record<string, boolean>>({})
  const [dirtyByKey, setDirtyByKey] = useState<Record<string, boolean>>({})
  const [loadedKeys, setLoadedKeys] = useState<Set<string>>(new Set()) // 跟踪已加载的数据

  useEffect(() => {
    loadCampusesFromConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 确定默认 tab
  useEffect(() => {
    if (!activeCampusId && campuses.length > 0) {
      setActiveCampusId(campuses[0].id)
    }
  }, [activeCampusId, campuses])

  // 月份变化：为所有神殿重建当月行
  useEffect(() => {
    setCampusData((prev) => {
      const next: typeof prev = {}
      campuses.forEach((c) => {
        next[c.id] = {
          summary: buildSummaryMonthRows(selectedMonth),
          baidu: buildBaiduMonthRows(selectedMonth),
          other: buildOtherMonthRows(selectedMonth),
        }
      })
      return next
    })
    // 清空dirty标记和已加载标记
    setDirtyByKey({})
    setLoadedKeys(new Set())
  }, [selectedMonth, campuses])

  // 加载数据
  const loadData = async (campusId: string, campusName: string, tabKey: string) => {
    const loadKey = `${campusId}-${tabKey}`
    setLoadingByKey((prev) => ({ ...prev, [loadKey]: true }))

    try {
      const monthStr = selectedMonth.format('YYYY-MM')

      if (tabKey === 'baidu') {
        // 加载百度推广数据
        const response = await marketSemDailyDataService.getBaiduList(campusName, monthStr)
        if (response.items && response.items.length > 0) {
          // 将API数据映射到前端数据结构
          const dataMap = new Map(response.items.map((item) => [item.date, item]))
          
          setCampusData((prev) => {
            const currentRows = prev[campusId]?.baidu || buildBaiduMonthRows(selectedMonth)
            const updatedRows = currentRows.map((row) => {
              if (row.key === 'summary') return row
              const apiData = dataMap.get(row.key)
              if (!apiData) return row

              // 百度消费等于消费
              const consumptionValue = apiData.consumption
              
              return {
                ...row,
                baiduIncome: apiData.baidu_income,
                refundCount: apiData.refund_count,
                netSignup: apiData.net_signup,
                grossTotal: apiData.gross_total,
                orderCount: apiData.order_count,
                visitCount: apiData.visit_count,
                baiduConsultCount: apiData.baidu_consult_count,
                baiduConsumption: consumptionValue,
                baiduForm: apiData.baidu_form,
                centerComeIn: apiData.center_come_in,
                baiduChatOut: apiData.baidu_chat_out,
                totalConsultCount: apiData.total_consult_count,
                validConsultCount: apiData.valid_consult_count,
                baiduTotalDialogue: apiData.baidu_total_dialogue,
                validDialogue: apiData.valid_dialogue,
                impressionCount: apiData.impression_count,
                clickCount: apiData.click_count,
                consumption: consumptionValue,
                baiduConversionRate: calcConversionRate(apiData.net_signup, apiData.baidu_consult_count),
                consultCost: calcConsultCost(consumptionValue, apiData.baidu_consult_count),
                validConsultRate: apiData.total_consult_count
                  ? Number(((apiData.valid_consult_count / apiData.total_consult_count) * 100).toFixed(2))
                  : 0,
                validConsultCost: calcConsultCost(consumptionValue, apiData.valid_consult_count),
                validDialogueRate: apiData.baidu_total_dialogue
                  ? Number(((apiData.valid_dialogue / apiData.baidu_total_dialogue) * 100).toFixed(2))
                  : 0,
                clickRate: apiData.impression_count
                  ? Number(((apiData.click_count / apiData.impression_count) * 100).toFixed(2))
                  : 0,
                avgPrice: apiData.click_count
                  ? `¥${(consumptionValue / apiData.click_count).toFixed(2)}`
                  : '¥0.00',
              }
            })

            const summaryRow = calculateBaiduSummaryRow(updatedRows)
            const finalRows = [summaryRow, ...updatedRows.filter((r) => r.key !== 'summary')]

            return {
              ...prev,
              [campusId]: {
                ...prev[campusId],
                baidu: finalRows,
              },
            }
          })
        }
      } else if (tabKey === 'other') {
        // 加载其他平台数据
        const response = await marketSemDailyDataService.getOtherList(campusName, monthStr)
        if (response.items && response.items.length > 0) {
          const dataMap = new Map(response.items.map((item) => [item.date, item]))
          
          setCampusData((prev) => {
            const currentRows = prev[campusId]?.other || buildOtherMonthRows(selectedMonth)
            const updatedRows = currentRows.map((row) => {
              if (row.key === 'summary') return row
              const apiData = dataMap.get(row.key)
              if (!apiData) return row

              // 其他咨询量 = 神殿网站/直接访问 + GEO
              const calculatedOtherConsultCount = apiData.campus_website_visit + apiData.geo
              
              return {
                ...row,
                otherActualIncome: apiData.other_income,
                refundCount: apiData.refund_count,
                netSignup: apiData.net_signup,
                grossTotal: apiData.gross_total,
                orderCount: apiData.order_count,
                visitCount: apiData.visit_count,
                otherConsultCount: calculatedOtherConsultCount,
                otherConsumption: apiData.other_consumption,
                campusWebsiteVisit: apiData.campus_website_visit,
                geo: apiData.geo,
                otherConversionRate: calcConversionRate(apiData.net_signup, calculatedOtherConsultCount),
                consultCost: calcConsultCost(apiData.other_consumption, calculatedOtherConsultCount),
              }
            })

            const summaryRow = calculateOtherSummaryRow(updatedRows)
            const finalRows = [summaryRow, ...updatedRows.filter((r) => r.key !== 'summary')]

            return {
              ...prev,
              [campusId]: {
                ...prev[campusId],
                other: finalRows,
              },
            }
          })
        }
      } else if (tabKey === 'summary') {
        // 加载汇总数据（从后端自动汇总）
        const response = await marketSemDailyDataService.getSummaryList(campusName, monthStr)
        console.log('汇总数据响应:', response)
        if (response.items && response.items.length > 0) {
          const dataMap = new Map(response.items.map((item) => [item.date, item]))
          console.log('数据映射:', dataMap)
          
          setCampusData((prev) => {
            const currentRows = prev[campusId]?.summary || buildSummaryMonthRows(selectedMonth)
            console.log('当前行数据:', currentRows)
            const updatedRows = currentRows.map((row) => {
              if (row.key === 'summary') return row
              const apiData = dataMap.get(row.key)
              if (!apiData) return row

              const updatedRow = {
                ...row,
                semActualIncome: apiData.sem_actual_income,
                refundCount: apiData.refund_count,
                netSignup: apiData.net_signup,
                grossTotal: apiData.gross_total,
                orderCount: apiData.order_count,
                visitCount: apiData.visit_count,
                actualConsultCount: apiData.actual_consult_count,
                semConsumption: apiData.sem_consumption,
                semSignupConversionRate: calcConversionRate(apiData.net_signup, apiData.actual_consult_count),
                consultCost: calcConsultCost(apiData.sem_consumption, apiData.actual_consult_count),
              }
              console.log('更新行:', row.key, updatedRow)
              return updatedRow
            })

            const summaryRow = calculateSummarySummaryRow(updatedRows)
            const finalRows = [summaryRow, ...updatedRows.filter((r) => r.key !== 'summary')]
            console.log('最终行数据:', finalRows)

            return {
              ...prev,
              [campusId]: {
                ...prev[campusId],
                summary: finalRows,
              },
            }
          })
        } else {
          console.log('没有数据或数据为空')
        }
      }

      setDirtyByKey((prev) => ({ ...prev, [loadKey]: false }))
      setLoadedKeys((prev) => new Set(prev).add(loadKey)) // 标记为已加载
      message.success('数据加载成功')
    } catch (error: any) {
      message.error(`加载失败: ${error.message || '未知错误'}`)
    } finally {
      setLoadingByKey((prev) => ({ ...prev, [loadKey]: false }))
    }
  }

  // 当切换神殿或tab时自动加载数据（仅在未加载时）
  useEffect(() => {
    if (activeCampusId && activeCampus && activeTabKey) {
      const loadKey = `${activeCampusId}-${activeTabKey}`
      // 只有在数据未加载时才加载
      if (!loadedKeys.has(loadKey)) {
        loadData(activeCampusId, activeCampus.name, activeTabKey)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCampusId, activeTabKey, selectedMonth, loadedKeys])

  const activeCampus = useMemo(
    () => campuses.find((c) => c.id === activeCampusId),
    [campuses, activeCampusId],
  )

  const selectedMonthStr = useMemo(() => selectedMonth.format('YYYY-MM'), [selectedMonth])

  // 计算汇总行 - 汇总页面
  const calculateSummarySummaryRow = (rows: SummaryRow[]): SummaryRow => {
    const dataRows = rows.filter((r) => r.key !== 'summary')
    const totals = dataRows.reduce(
      (acc, row) => ({
        semActualIncome: acc.semActualIncome + row.semActualIncome,
        refundCount: acc.refundCount + row.refundCount,
        netSignup: acc.netSignup + row.netSignup,
        grossTotal: acc.grossTotal + row.grossTotal,
        orderCount: acc.orderCount + row.orderCount,
        visitCount: acc.visitCount + row.visitCount,
        actualConsultCount: acc.actualConsultCount + row.actualConsultCount,
        semConsumption: acc.semConsumption + row.semConsumption,
      }),
      {
        semActualIncome: 0,
        refundCount: 0,
        netSignup: 0,
        grossTotal: 0,
        orderCount: 0,
        visitCount: 0,
        actualConsultCount: 0,
        semConsumption: 0,
      },
    )

    return {
      key: 'summary',
      weekday: '',
      dateText: '汇总',
      semActualIncome: totals.semActualIncome,
      semSignupConversionRate: calcConversionRate(totals.netSignup, totals.actualConsultCount),
      refundCount: totals.refundCount,
      netSignup: totals.netSignup,
      grossTotal: totals.grossTotal,
      orderCount: totals.orderCount,
      visitCount: totals.visitCount,
      actualConsultCount: totals.actualConsultCount,
      consultCost: calcConsultCost(totals.semConsumption, totals.actualConsultCount),
      semConsumption: totals.semConsumption,
    }
  }

  // 计算汇总行 - 百度推广
  const calculateBaiduSummaryRow = (rows: BaiduPromotionRow[]): BaiduPromotionRow => {
    const dataRows = rows.filter((r) => r.key !== 'summary')
    const totals = dataRows.reduce(
      (acc, row) => ({
        baiduIncome: acc.baiduIncome + row.baiduIncome,
        refundCount: acc.refundCount + row.refundCount,
        netSignup: acc.netSignup + row.netSignup,
        grossTotal: acc.grossTotal + row.grossTotal,
        orderCount: acc.orderCount + row.orderCount,
        visitCount: acc.visitCount + row.visitCount,
        baiduConsultCount: acc.baiduConsultCount + row.baiduConsultCount,
        baiduConsumption: acc.baiduConsumption + row.baiduConsumption,
        baiduForm: acc.baiduForm + row.baiduForm,
        centerComeIn: acc.centerComeIn + row.centerComeIn,
        baiduChatOut: acc.baiduChatOut + row.baiduChatOut,
        totalConsultCount: acc.totalConsultCount + row.totalConsultCount,
        validConsultCount: acc.validConsultCount + row.validConsultCount,
        baiduTotalDialogue: acc.baiduTotalDialogue + row.baiduTotalDialogue,
        validDialogue: acc.validDialogue + row.validDialogue,
        impressionCount: acc.impressionCount + row.impressionCount,
        clickCount: acc.clickCount + row.clickCount,
        consumption: acc.consumption + row.consumption,
      }),
      {
        baiduIncome: 0,
        refundCount: 0,
        netSignup: 0,
        grossTotal: 0,
        orderCount: 0,
        visitCount: 0,
        baiduConsultCount: 0,
        baiduConsumption: 0,
        baiduForm: 0,
        centerComeIn: 0,
        baiduChatOut: 0,
        totalConsultCount: 0,
        validConsultCount: 0,
        baiduTotalDialogue: 0,
        validDialogue: 0,
        impressionCount: 0,
        clickCount: 0,
        consumption: 0,
      },
    )

    const validConsultRate = totals.totalConsultCount
      ? (totals.validConsultCount / totals.totalConsultCount) * 100
      : 0
    const validDialogueRate = totals.baiduTotalDialogue
      ? (totals.validDialogue / totals.baiduTotalDialogue) * 100
      : 0
    const clickRate = totals.impressionCount ? (totals.clickCount / totals.impressionCount) * 100 : 0

    return {
      key: 'summary',
      weekday: '',
      dateText: '汇总',
      baiduIncome: totals.baiduIncome,
      baiduConversionRate: calcConversionRate(totals.netSignup, totals.baiduConsultCount),
      refundCount: totals.refundCount,
      netSignup: totals.netSignup,
      grossTotal: totals.grossTotal,
      orderCount: totals.orderCount,
      visitCount: totals.visitCount,
      baiduConsultCount: totals.baiduConsultCount,
      consultCost: calcConsultCost(totals.baiduConsumption, totals.baiduConsultCount),
      baiduConsumption: totals.baiduConsumption,
      baiduForm: totals.baiduForm,
      centerComeIn: totals.centerComeIn,
      baiduChatOut: totals.baiduChatOut,
      totalConsultCount: totals.totalConsultCount,
      validConsultCount: totals.validConsultCount,
      validConsultRate: Number(validConsultRate.toFixed(2)),
      validConsultCost: calcConsultCost(totals.baiduConsumption, totals.validConsultCount),
      baiduTotalDialogue: totals.baiduTotalDialogue,
      validDialogue: totals.validDialogue,
      validDialogueRate: Number(validDialogueRate.toFixed(2)),
      impressionCount: totals.impressionCount,
      clickCount: totals.clickCount,
      clickRate: Number(clickRate.toFixed(2)),
      consumption: totals.consumption,
      avgPrice: totals.clickCount ? `¥${(totals.consumption / totals.clickCount).toFixed(2)}` : '¥0.00',
    }
  }

  // 计算汇总行 - 其他平台
  const calculateOtherSummaryRow = (rows: OtherPlatformRow[]): OtherPlatformRow => {
    const dataRows = rows.filter((r) => r.key !== 'summary')
    const totals = dataRows.reduce(
      (acc, row) => ({
        otherActualIncome: acc.otherActualIncome + row.otherActualIncome,
        refundCount: acc.refundCount + row.refundCount,
        netSignup: acc.netSignup + row.netSignup,
        grossTotal: acc.grossTotal + row.grossTotal,
        orderCount: acc.orderCount + row.orderCount,
        visitCount: acc.visitCount + row.visitCount,
        otherConsultCount: acc.otherConsultCount + row.otherConsultCount,
        otherConsumption: acc.otherConsumption + row.otherConsumption,
        campusWebsiteVisit: acc.campusWebsiteVisit + row.campusWebsiteVisit,
        geo: acc.geo + row.geo,
      }),
      {
        otherActualIncome: 0,
        refundCount: 0,
        netSignup: 0,
        grossTotal: 0,
        orderCount: 0,
        visitCount: 0,
        otherConsultCount: 0,
        otherConsumption: 0,
        campusWebsiteVisit: 0,
        geo: 0,
      },
    )

    return {
      key: 'summary',
      weekday: '',
      dateText: '汇总',
      otherActualIncome: totals.otherActualIncome,
      otherConversionRate: calcConversionRate(totals.netSignup, totals.otherConsultCount),
      refundCount: totals.refundCount,
      netSignup: totals.netSignup,
      grossTotal: totals.grossTotal,
      orderCount: totals.orderCount,
      visitCount: totals.visitCount,
      otherConsultCount: totals.otherConsultCount,
      consultCost: calcConsultCost(totals.otherConsumption, totals.otherConsultCount),
      otherConsumption: totals.otherConsumption,
      campusWebsiteVisit: totals.campusWebsiteVisit,
      geo: totals.geo,
    }
  }

  // 更新数据处理函数 - 使用 useCallback 优化
  const updateSummaryRow = useCallback((campusId: string, rowKey: string, field: string, value: number) => {
    setCampusData((prev) => {
      const current = prev[campusId]?.summary || []
      const nextRows = current.map((r) => {
        if (r.key !== rowKey) return r
        const next = { ...r, [field]: value }
        if (rowKey !== 'summary') {
          next.semSignupConversionRate = calcConversionRate(next.netSignup, next.actualConsultCount)
          next.consultCost = calcConsultCost(next.semConsumption, next.actualConsultCount)
        }
        return next
      })
      const summaryRow = calculateSummarySummaryRow(nextRows)
      const finalRows = [summaryRow, ...nextRows.filter((r) => r.key !== 'summary')]
      return {
        ...prev,
        [campusId]: {
          ...prev[campusId],
          summary: finalRows,
        },
      }
    })
    const loadKey = `${campusId}-summary`
    setDirtyByKey((prev) => ({ ...prev, [loadKey]: true }))
  }, [])

  const updateBaiduRow = useCallback((campusId: string, rowKey: string, field: string, value: number) => {
    setCampusData((prev) => {
      const current = prev[campusId]?.baidu || []
      const nextRows = current.map((r) => {
        if (r.key !== rowKey) return r
        const next = { ...r, [field]: value }
        
        // 百度消费等于消费：当更新其中一个时，同步更新另一个
        if (field === 'consumption') {
          next.baiduConsumption = value
        } else if (field === 'baiduConsumption') {
          next.consumption = value
        }
        
        // 当更新百度表单、中心来电或百度聊出时，自动计算总咨询量和百度咨询量
        if (field === 'baiduForm' || field === 'centerComeIn' || field === 'baiduChatOut') {
          next.totalConsultCount = next.baiduForm + next.centerComeIn + next.baiduChatOut
          next.baiduConsultCount = next.totalConsultCount
        }
        
        if (rowKey !== 'summary') {
          next.baiduConversionRate = calcConversionRate(next.netSignup, next.baiduConsultCount)
          next.consultCost = calcConsultCost(next.baiduConsumption, next.baiduConsultCount)
          next.validConsultRate = next.totalConsultCount
            ? Number(((next.validConsultCount / next.totalConsultCount) * 100).toFixed(2))
            : 0
          next.validConsultCost = calcConsultCost(next.baiduConsumption, next.validConsultCount)
          next.validDialogueRate = next.baiduTotalDialogue
            ? Number(((next.validDialogue / next.baiduTotalDialogue) * 100).toFixed(2))
            : 0
          next.clickRate = next.impressionCount
            ? Number(((next.clickCount / next.impressionCount) * 100).toFixed(2))
            : 0
          next.avgPrice = next.clickCount ? `¥${(next.consumption / next.clickCount).toFixed(2)}` : '¥0.00'
        }
        return next
      })
      const summaryRow = calculateBaiduSummaryRow(nextRows)
      const finalRows = [summaryRow, ...nextRows.filter((r) => r.key !== 'summary')]
      return {
        ...prev,
        [campusId]: {
          ...prev[campusId],
          baidu: finalRows,
        },
      }
    })
    const loadKey = `${campusId}-baidu`
    setDirtyByKey((prev) => ({ ...prev, [loadKey]: true }))
  }, [])

  const updateOtherRow = useCallback((campusId: string, rowKey: string, field: string, value: number) => {
    setCampusData((prev) => {
      const current = prev[campusId]?.other || []
      const nextRows = current.map((r) => {
        if (r.key !== rowKey) return r
        const next = { ...r, [field]: value }
        if (rowKey !== 'summary') {
          // 当更新神殿网站/直接访问或GEO时，自动计算其他咨询量
          if (field === 'campusWebsiteVisit' || field === 'geo') {
            next.otherConsultCount = next.campusWebsiteVisit + next.geo
          }
          next.otherConversionRate = calcConversionRate(next.netSignup, next.otherConsultCount)
          next.consultCost = calcConsultCost(next.otherConsumption, next.otherConsultCount)
        }
        return next
      })
      const summaryRow = calculateOtherSummaryRow(nextRows)
      const finalRows = [summaryRow, ...nextRows.filter((r) => r.key !== 'summary')]
      return {
        ...prev,
        [campusId]: {
          ...prev[campusId],
          other: finalRows,
        },
      }
    })
    const loadKey = `${campusId}-other`
    setDirtyByKey((prev) => ({ ...prev, [loadKey]: true }))
  }, [])

  const handleSave = async () => {
    if (!activeCampusId || !activeCampus) return

    const loadKey = `${activeCampusId}-${activeTabKey}`
    setSavingByKey((prev) => ({ ...prev, [loadKey]: true }))

    try {
      const monthStr = selectedMonth.format('YYYY-MM')

      if (activeTabKey === 'baidu') {
        // 保存百度推广数据
        const rows = campusData[activeCampusId]?.baidu || []
        const dataRows = rows.filter((r) => r.key !== 'summary')
        const apiRows = dataRows.map((row) => ({
          date: row.key,
          baidu_income: row.baiduIncome,
          refund_count: row.refundCount,
          net_signup: row.netSignup,
          gross_total: row.grossTotal,
          order_count: row.orderCount,
          visit_count: row.visitCount,
          baidu_consult_count: row.baiduConsultCount,
          baidu_consumption: row.baiduConsumption,
          baidu_form: row.baiduForm,
          center_come_in: row.centerComeIn,
          baidu_chat_out: row.baiduChatOut,
          total_consult_count: row.totalConsultCount,
          valid_consult_count: row.validConsultCount,
          baidu_total_dialogue: row.baiduTotalDialogue,
          valid_dialogue: row.validDialogue,
          impression_count: row.impressionCount,
          click_count: row.clickCount,
          consumption: row.consumption,
        }))

        await marketSemDailyDataService.bulkSaveBaidu(activeCampus.name, monthStr, apiRows)
        message.success('百度推广数据保存成功')
      } else if (activeTabKey === 'other') {
        // 保存其他平台数据
        const rows = campusData[activeCampusId]?.other || []
        const dataRows = rows.filter((r) => r.key !== 'summary')
        const apiRows = dataRows.map((row) => ({
          date: row.key,
          other_income: row.otherActualIncome,
          refund_count: row.refundCount,
          net_signup: row.netSignup,
          gross_total: row.grossTotal,
          order_count: row.orderCount,
          visit_count: row.visitCount,
          other_consult_count: row.otherConsultCount,
          other_consumption: row.otherConsumption,
          campus_website_visit: row.campusWebsiteVisit,
          geo: row.geo,
        }))

        await marketSemDailyDataService.bulkSaveOther(activeCampus.name, monthStr, apiRows)
        message.success('其他平台数据保存成功')
      } else if (activeTabKey === 'summary') {
        // 汇总页面不可保存
        message.warning('汇总页面数据由百度推广和其他平台自动汇总，无需保存')
        return
      }

      setDirtyByKey((prev) => ({ ...prev, [loadKey]: false }))
    } catch (error: any) {
      message.error(`保存失败: ${error.message || '未知错误'}`)
    } finally {
      setSavingByKey((prev) => ({ ...prev, [loadKey]: false }))
    }
  }

  const handleRefresh = useCallback(() => {
    if (activeCampusId && activeCampus && activeTabKey) {
      const loadKey = `${activeCampusId}-${activeTabKey}`
      // 刷新时移除已加载标记，强制重新加载
      setLoadedKeys((prev) => {
        const next = new Set(prev)
        next.delete(loadKey)
        return next
      })
      loadData(activeCampusId, activeCampus.name, activeTabKey)
    }
  }, [activeCampusId, activeCampus, activeTabKey])

  const campusTabItems = useMemo(
    () =>
      campuses.map((c) => ({
        label: c.name,
        key: c.id,
      })),
    [campuses],
  )

  const dataTabItems = useMemo(
    () => [
      { label: '汇总', key: 'summary' },
      { label: '百度推广', key: 'baidu' },
      { label: '其他平台', key: 'other' },
    ],
    [],
  )

  const loadKey = useMemo(
    () => (activeCampusId ? `${activeCampusId}-${activeTabKey}` : ''),
    [activeCampusId, activeTabKey],
  )

  // 为每个 tab 创建稳定的 onUpdate 回调
  const summaryOnUpdate = useCallback(
    (rowKey: string, field: string, value: number) => {
      if (activeCampusId) {
        updateSummaryRow(activeCampusId, rowKey, field, value)
      }
    },
    [activeCampusId, updateSummaryRow],
  )

  const baiduOnUpdate = useCallback(
    (rowKey: string, field: string, value: number) => {
      if (activeCampusId) {
        updateBaiduRow(activeCampusId, rowKey, field, value)
      }
    },
    [activeCampusId, updateBaiduRow],
  )

  const otherOnUpdate = useCallback(
    (rowKey: string, field: string, value: number) => {
      if (activeCampusId) {
        updateOtherRow(activeCampusId, rowKey, field, value)
      }
    },
    [activeCampusId, updateOtherRow],
  )

  // 处理Excel导入
  const handleImportSuccess = async (importedData: ImportedData) => {
    console.log('handleImportSuccess被调用，数据:', importedData)
    
    if (!activeCampusId) {
      message.error('请先选择神殿')
      return
    }

    const campus = campuses.find((c) => c.id === activeCampusId)
    if (!campus) {
      message.error('未找到神殿信息')
      return
    }

    const importMonth = dayjs(importedData.month)
    const monthStr = importMonth.format('YYYY-MM')
    
    // 先设置月份（如果不同）
    if (!selectedMonth.isSame(importMonth, 'month')) {
      setSelectedMonth(importMonth)
    }

    // 使用 setTimeout 确保在月份变化的 effect 执行后再更新数据
    setTimeout(async () => {
      let totalSaved = 0
      
      // 处理百度推广数据并保存到数据库
      if (importedData.baidu && Array.isArray(importedData.baidu) && importedData.baidu.length > 0) {
        try {
          const apiRows = importedData.baidu.map((item) => ({
            date: item.date,
            baidu_income: item.baiduIncome,
            refund_count: item.refundCount,
            net_signup: item.netSignup,
            gross_total: item.grossTotal,
            order_count: item.orderCount,
            visit_count: item.visitCount,
            baidu_consult_count: item.baiduConsultCount,
            baidu_consumption: item.baiduConsumption,
            baidu_form: item.baiduForm,
            center_come_in: item.centerComeIn,
            baidu_chat_out: item.baiduChatOut,
            total_consult_count: item.totalConsultCount,
            valid_consult_count: item.validConsultCount,
            baidu_total_dialogue: item.baiduTotalDialogue,
            valid_dialogue: item.validDialogue,
            impression_count: item.impressionCount,
            click_count: item.clickCount,
            consumption: item.consumption,
          }))

          console.log('正在保存百度推广数据到数据库...')
          await marketSemDailyDataService.bulkSaveBaidu(campus.name, monthStr, apiRows)
          totalSaved += apiRows.length
          console.log('百度推广数据保存成功')
        } catch (error) {
          console.error('保存百度推广数据失败:', error)
          message.error('保存百度推广数据失败')
        }
      }
      
      // 处理其他平台数据并保存到数据库
      if (importedData.other && Array.isArray(importedData.other) && importedData.other.length > 0) {
        try {
          const apiRows = importedData.other.map((item) => ({
            date: item.date,
            other_income: item.otherActualIncome,
            refund_count: item.refundCount,
            net_signup: item.netSignup,
            gross_total: item.grossTotal,
            order_count: item.orderCount,
            visit_count: item.visitCount,
            other_consult_count: item.campusWebsiteVisit + item.geo,
            other_consumption: item.otherConsumption,
            campus_website_visit: item.campusWebsiteVisit,
            geo: item.geo,
          }))

          console.log('正在保存其他平台数据到数据库...')
          await marketSemDailyDataService.bulkSaveOther(campus.name, monthStr, apiRows)
          totalSaved += apiRows.length
          console.log('其他平台数据保存成功')
        } catch (error) {
          console.error('保存其他平台数据失败:', error)
          message.error('保存其他平台数据失败')
        }
      }
      
      // 从数据库重新加载数据
      if (importedData.baidu && Array.isArray(importedData.baidu) && importedData.baidu.length > 0) {
        try {
          await loadData(activeCampusId, campus.name, 'baidu')
          const loadKey = `${activeCampusId}-baidu`
          setDirtyByKey((prev) => ({ ...prev, [loadKey]: false }))
          setLoadedKeys((prev) => new Set(prev).add(loadKey))
        } catch (error) {
          console.error('重新加载百度推广数据失败:', error)
        }
      }
      
      if (importedData.other && Array.isArray(importedData.other) && importedData.other.length > 0) {
        try {
          await loadData(activeCampusId, campus.name, 'other')
          const loadKey = `${activeCampusId}-other`
          setDirtyByKey((prev) => ({ ...prev, [loadKey]: false }))
          setLoadedKeys((prev) => new Set(prev).add(loadKey))
        } catch (error) {
          console.error('重新加载其他平台数据失败:', error)
        }
      }
      
      message.success(`成功导入并保存 ${totalSaved} 条数据`)
      
      // 重新加载汇总数据
      if (activeCampusId) {
        setTimeout(() => {
          loadData(activeCampusId, campus.name, 'summary')
        }, 200)
      }
    }, 100)
  }

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          5 市场部SEM日常数据表
        </Title>
        <ExcelImporter 
          campusId={activeCampusId || ''} 
          onImportSuccess={handleImportSuccess}
        />
      </div>

      <div style={{ paddingLeft: 12 }}>
        <Tabs activeKey={activeCampusId} onChange={(key) => setActiveCampusId(key)} items={campusTabItems} />
      </div>

      <div style={{ paddingLeft: 12, marginTop: 8 }}>
        <Tabs
          activeKey={activeTabKey}
          onChange={(key) => setActiveTabKey(key)}
          items={dataTabItems}
          type="card"
        />
      </div>

      <div style={{ paddingLeft: 12, marginTop: 8, marginBottom: 12 }}>
        <Space size={12}>
          <span>选择年月：</span>
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={(val) => {
              if (val) setSelectedMonth(val.startOf('month'))
            }}
            allowClear={false}
            format="YYYY-MM"
          />
          <Button onClick={handleRefresh} loading={!!(loadKey && loadingByKey[loadKey])}>
            刷新
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            disabled={!loadKey || !dirtyByKey[loadKey] || activeTabKey === 'summary'}
            loading={!!(loadKey && savingByKey[loadKey])}
          >
            保存
          </Button>
        </Space>
      </div>

      <div style={{ paddingLeft: 12 }}>
        <Card>
          <div
            style={{
              backgroundColor: '#E8B830',
              padding: '10px 12px',
              fontWeight: 'bold',
              borderBottom: '1px solid #000',
              textAlign: 'left',
            }}
          >
            {activeCampus?.name || ''} - 市场部SEM推广数据看板
          </div>

          {activeTabKey === 'summary' && activeCampusId && (
            <SummaryTab
              data={campusData[activeCampusId]?.summary || []}
              loading={!!(loadKey && loadingByKey[loadKey])}
              onUpdate={summaryOnUpdate}
              readonly={true}
            />
          )}

          {activeTabKey === 'baidu' && activeCampusId && (
            <BaiduPromotionTab
              data={campusData[activeCampusId]?.baidu || []}
              loading={!!(loadKey && loadingByKey[loadKey])}
              onUpdate={baiduOnUpdate}
            />
          )}

          {activeTabKey === 'other' && activeCampusId && (
            <OtherPlatformTab
              data={campusData[activeCampusId]?.other || []}
              loading={!!(loadKey && loadingByKey[loadKey])}
              onUpdate={otherOnUpdate}
            />
          )}
        </Card>
      </div>

      <style>{`
        .summary-row {
          background-color: #FFF2CC !important;
          font-weight: bold;
        }
        .summary-row:hover {
          background-color: #FFF2CC !important;
        }
      `}</style>
    </div>
  )
}

export default MarketingSEMDailyDataPage

