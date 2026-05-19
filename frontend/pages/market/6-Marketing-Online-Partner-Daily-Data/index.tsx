import React, { useEffect, useMemo, useState } from 'react'
import { App, Button, Card, DatePicker, InputNumber, Space, Table, Tabs, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { marketOnlinePartnerDailyService } from '@/services/market/marketOnlinePartnerDaily'
import ExcelImporter, { type ImportedData } from './ExcelImporter'

const { Title } = Typography

// 合作伙伴列表
const PARTNERS = [
  { key: 'summary', name: '汇总' },
  { key: 'baijiao', name: '百教网' },
  { key: 'zhiliao', name: '知了好学' },
  { key: 'tantu', name: '坦途网' },
  { key: 'houxue', name: '厚学网' },
  { key: 'jiuyisouke', name: '91搜客' },
]

type PartnerDailyRow = {
  key: string
  weekday: string
  dateText: string
  partnerActualIncome: number
  partnerSignupConversionRate: string
  refundCount: number
  netSignup: number
  grossTotal: number
  orderCount: number
  visitCount: number
  actualConsultCount: number
  consultCost: string
  partnerCost: number
}

type EditableField = keyof Omit<
  PartnerDailyRow,
  'key' | 'weekday' | 'dateText' | 'partnerSignupConversionRate' | 'consultCost'
>

const formatMonthDay = (d: dayjs.Dayjs) => `${d.month() + 1}月${d.date()}日`

const emptyNumericRow = (
  d: Dayjs,
): Omit<PartnerDailyRow, 'weekday' | 'dateText' | 'partnerSignupConversionRate' | 'consultCost'> => ({
  key: d.format('YYYY-MM-DD'),
  partnerActualIncome: 0,
  refundCount: 0,
  netSignup: 0,
  grossTotal: 0,
  orderCount: 0,
  visitCount: 0,
  actualConsultCount: 0,
  partnerCost: 0,
})

const calcSignupConversionRate = (netSignup: number, actualConsultCount: number): string => {
  if (!actualConsultCount) return '0%'
  const v = (netSignup / actualConsultCount) * 100
  return `${v.toFixed(2)}%`
}

const calcConsultCost = (partnerCost: number, actualConsultCount: number): string => {
  if (!actualConsultCount) return '¥0.00'
  const v = partnerCost / actualConsultCount
  return `¥${v.toFixed(2)}`
}

const buildMonthRows = (monthStart: Dayjs): PartnerDailyRow[] => {
  const start = monthStart.startOf('month')
  const daysInMonth = start.daysInMonth()

  const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

  const rows: PartnerDailyRow[] = []

  // 汇总行
  rows.push({
    key: 'summary',
    weekday: '',
    dateText: '汇总',
    partnerActualIncome: 0,
    partnerSignupConversionRate: '0%',
    refundCount: 0,
    netSignup: 0,
    grossTotal: 0,
    orderCount: 0,
    visitCount: 0,
    actualConsultCount: 0,
    consultCost: '¥0.00',
    partnerCost: 0,
  })

  for (let i = 0; i < daysInMonth; i++) {
    const d = start.add(i, 'day')
    const base = emptyNumericRow(d)
    rows.push({
      ...base,
      weekday: weekdayMap[d.day()],
      dateText: formatMonthDay(d),
      partnerSignupConversionRate: calcSignupConversionRate(base.netSignup, base.actualConsultCount),
      consultCost: calcConsultCost(base.partnerCost, base.actualConsultCount),
    })
  }

  return rows
}

const mergeRowsPreserveValues = (newRows: PartnerDailyRow[], oldRows?: PartnerDailyRow[]) => {
  if (!oldRows || oldRows.length === 0) return newRows

  const oldMap = new Map(oldRows.map((r) => [r.key, r]))

  return newRows.map((r) => {
    const old = oldMap.get(r.key)
    if (!old) return r

    if (r.key === 'summary') {
      return {
        ...r,
        partnerActualIncome: old.partnerActualIncome,
        refundCount: old.refundCount,
        netSignup: old.netSignup,
        grossTotal: old.grossTotal,
        orderCount: old.orderCount,
        visitCount: old.visitCount,
        actualConsultCount: old.actualConsultCount,
        partnerCost: old.partnerCost,
        partnerSignupConversionRate: '0%',
        consultCost: '¥0.00',
      }
    }

    const next: PartnerDailyRow = {
      ...r,
      partnerActualIncome: old.partnerActualIncome,
      refundCount: old.refundCount,
      netSignup: old.netSignup,
      grossTotal: old.grossTotal,
      orderCount: old.orderCount,
      visitCount: old.visitCount,
      actualConsultCount: old.actualConsultCount,
      partnerCost: old.partnerCost,
      partnerSignupConversionRate: calcSignupConversionRate(old.netSignup, old.actualConsultCount),
      consultCost: calcConsultCost(old.partnerCost, old.actualConsultCount),
    }

    return next
  })
}

const calculateSummaryRow = (rows: PartnerDailyRow[]): PartnerDailyRow => {
  const dataRows = rows.filter((r) => r.key !== 'summary')

  const totals = dataRows.reduce(
    (acc, row) => ({
      partnerActualIncome: acc.partnerActualIncome + row.partnerActualIncome,
      refundCount: acc.refundCount + row.refundCount,
      netSignup: acc.netSignup + row.netSignup,
      grossTotal: acc.grossTotal + row.grossTotal,
      orderCount: acc.orderCount + row.orderCount,
      visitCount: acc.visitCount + row.visitCount,
      actualConsultCount: acc.actualConsultCount + row.actualConsultCount,
      partnerCost: acc.partnerCost + row.partnerCost,
    }),
    {
      partnerActualIncome: 0,
      refundCount: 0,
      netSignup: 0,
      grossTotal: 0,
      orderCount: 0,
      visitCount: 0,
      actualConsultCount: 0,
      partnerCost: 0,
    },
  )

  return {
    key: 'summary',
    weekday: '',
    dateText: '汇总',
    partnerActualIncome: totals.partnerActualIncome,
    partnerSignupConversionRate: calcSignupConversionRate(totals.netSignup, totals.actualConsultCount),
    refundCount: totals.refundCount,
    netSignup: totals.netSignup,
    grossTotal: totals.grossTotal,
    orderCount: totals.orderCount,
    visitCount: totals.visitCount,
    actualConsultCount: totals.actualConsultCount,
    consultCost: calcConsultCost(totals.partnerCost, totals.actualConsultCount),
    partnerCost: totals.partnerCost,
  }
}

const applyBackendItemsToMonthRows = (monthRows: PartnerDailyRow[], items: any[]): PartnerDailyRow[] => {
  const itemMap = new Map<string, any>()
  items.forEach((it) => {
    if (it?.date) itemMap.set(String(it.date).slice(0, 10), it)
  })

  const updatedRows = monthRows.map((r) => {
    if (r.key === 'summary') return r
    const it = itemMap.get(r.key)
    if (!it) return r

    const next: PartnerDailyRow = {
      ...r,
      partnerActualIncome: Number(it.partner_actual_income ?? 0),
      refundCount: Number(it.refund_count ?? 0),
      netSignup: Number(it.net_signup ?? 0),
      grossTotal: Number(it.gross_total ?? 0),
      orderCount: Number(it.order_count ?? 0),
      visitCount: Number(it.visit_count ?? 0),
      actualConsultCount: Number(it.actual_consult_count ?? 0),
      partnerCost: Number(it.partner_cost ?? 0),
      partnerSignupConversionRate: calcSignupConversionRate(
        Number(it.net_signup ?? 0),
        Number(it.actual_consult_count ?? 0),
      ),
      consultCost: calcConsultCost(Number(it.partner_cost ?? 0), Number(it.actual_consult_count ?? 0)),
    }

    return next
  })

  // 重新计算汇总行
  const summaryRow = calculateSummaryRow(updatedRows)
  return [summaryRow, ...updatedRows.filter((r) => r.key !== 'summary')]
}

const MarketingOnlinePartnerDailyDataPage: React.FC = () => {
  const { message } = App.useApp()
  const { getAllCampuses, loadCampusesFromConfig } = useCampusStore()
  
  // 获取排序后的神殿列表 - 使用 useMemo 避免无限循环
  const campuses = useMemo(() => getAllCampuses(), [getAllCampuses])

  const [activeCampusId, setActiveCampusId] = useState<string | undefined>(undefined)
  const [activePartnerKey, setActivePartnerKey] = useState<string>('summary')
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(() => dayjs().startOf('month'))

  // 数据结构：{ campusId: { partnerKey: rows[] } }
  const [campusPartnerTableData, setCampusPartnerTableData] = useState<
    Record<string, Record<string, PartnerDailyRow[]>>
  >({})
  const [loadingByKey, setLoadingByKey] = useState<Record<string, boolean>>({})
  const [savingByKey, setSavingByKey] = useState<Record<string, boolean>>({})
  const [dirtyByKey, setDirtyByKey] = useState<Record<string, boolean>>({})
  const [importedKeys, setImportedKeys] = useState<Set<string>>(new Set()) // 跟踪已导入的数据

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

  // 月份变化：为所有神殿和合作伙伴重建当月行（尽量保留已有输入）
  useEffect(() => {
    setCampusPartnerTableData((prev) => {
      const next: Record<string, Record<string, PartnerDailyRow[]>> = {}
      campuses.forEach((c) => {
        next[c.id] = {}
        PARTNERS.forEach((p) => {
          const newRows = buildMonthRows(selectedMonth)
          // 只有当前月份的数据存在时才合并，否则使用新的空行
          const existingData = prev[c.id]?.[p.key]
          if (existingData && existingData.length > 0) {
            // 检查现有数据的月份是否与选中月份一致
            const firstDataRow = existingData.find(r => r.key !== 'summary')
            if (firstDataRow && firstDataRow.key.startsWith(selectedMonth.format('YYYY-MM'))) {
              // 月份一致，保留数据
              next[c.id][p.key] = existingData
            } else {
              // 月份不一致，使用新的空行
              next[c.id][p.key] = newRows
            }
          } else {
            next[c.id][p.key] = newRows
          }
        })
      })
      return next
    })
    
    // 月份变化时，清空导入标记
    setImportedKeys(new Set())
  }, [selectedMonth, campuses])

  // 神殿列表加载后：确保每个神殿和合作伙伴都有数据
  useEffect(() => {
    if (!campuses.length) return

    setCampusPartnerTableData((prev) => {
      const next: Record<string, Record<string, PartnerDailyRow[]>> = { ...prev }
      campuses.forEach((c) => {
        if (!next[c.id]) next[c.id] = {}
        PARTNERS.forEach((p) => {
          if (!next[c.id][p.key] || next[c.id][p.key].length === 0) {
            next[c.id][p.key] = buildMonthRows(selectedMonth)
          }
        })
      })
      return next
    })
  }, [campuses, selectedMonth])

  const activeCampus = useMemo(
    () => campuses.find((c) => c.id === activeCampusId),
    [campuses, activeCampusId],
  )

  const activeTableData = useMemo(
    () => (activeCampusId ? campusPartnerTableData[activeCampusId]?.[activePartnerKey] || [] : []),
    [activeCampusId, activePartnerKey, campusPartnerTableData],
  )

  const selectedMonthStr = useMemo(() => selectedMonth.format('YYYY-MM'), [selectedMonth])

  // 重新计算汇总数据（从其他5个合作伙伴汇总）
  const recalculateSummaryData = async (campusId: string) => {
    const campus = campuses.find((c) => c.id === campusId)
    if (!campus) return

    try {
      // 加载其他5个合作伙伴的数据
      const partnerKeys = ['baijiao', 'zhiliao', 'tantu', 'houxue', 'jiuyisouke']
      const allPartnerData: Record<string, PartnerDailyRow[]> = {}

      for (const partnerKey of partnerKeys) {
        try {
          // 使用中文名称查询
          const partnerName = PARTNERS.find((p) => p.key === partnerKey)?.name || partnerKey
          const res = await marketOnlinePartnerDailyService.list(campus.name, partnerName, selectedMonthStr)
          const items = (res as any)?.items || []
          const baseRows = buildMonthRows(selectedMonth)
          allPartnerData[partnerKey] = applyBackendItemsToMonthRows(baseRows, items)
        } catch (e) {
          console.error(`加载${partnerKey}数据失败:`, e)
        }
      }

      // 按日期汇总所有合作伙伴的数据
      const baseRows = buildMonthRows(selectedMonth)
      const summaryRows = baseRows.map((row) => {
        if (row.key === 'summary') {
          // 汇总行稍后计算
          return row
        }

        // 汇总当天所有合作伙伴的数据
        let dayTotal = {
          partnerActualIncome: 0,
          refundCount: 0,
          netSignup: 0,
          grossTotal: 0,
          orderCount: 0,
          visitCount: 0,
          actualConsultCount: 0,
          partnerCost: 0,
        }

        partnerKeys.forEach((partnerKey) => {
          const partnerRows = allPartnerData[partnerKey] || []
          const dayRow = partnerRows.find((r) => r.key === row.key)
          if (dayRow) {
            dayTotal.partnerActualIncome += dayRow.partnerActualIncome
            dayTotal.refundCount += dayRow.refundCount
            dayTotal.netSignup += dayRow.netSignup
            dayTotal.grossTotal += dayRow.grossTotal
            dayTotal.orderCount += dayRow.orderCount
            dayTotal.visitCount += dayRow.visitCount
            dayTotal.actualConsultCount += dayRow.actualConsultCount
            dayTotal.partnerCost += dayRow.partnerCost
          }
        })

        return {
          ...row,
          ...dayTotal,
          partnerSignupConversionRate: calcSignupConversionRate(dayTotal.netSignup, dayTotal.actualConsultCount),
          consultCost: calcConsultCost(dayTotal.partnerCost, dayTotal.actualConsultCount),
        }
      })

      // 计算汇总行
      const summaryRow = calculateSummaryRow(summaryRows)
      const finalRows = [summaryRow, ...summaryRows.filter((r) => r.key !== 'summary')]

      // 更新汇总页面数据
      setCampusPartnerTableData((prev) => ({
        ...prev,
        [campusId]: {
          ...prev[campusId],
          summary: finalRows,
        },
      }))
    } catch (e) {
      console.error('计算汇总数据失败:', e)
    }
  }

  const loadOneCampusPartnerMonth = async (campusId: string, partnerKey: string) => {
    const campus = campuses.find((c) => c.id === campusId)
    if (!campus) return

    const loadKey = `${campusId}-${partnerKey}`
    
    // 如果数据是刚导入的，不重新加载
    if (importedKeys.has(loadKey)) {
      console.log('数据是刚导入的，跳过加载:', loadKey)
      return
    }
    
    setLoadingByKey((prev) => ({ ...prev, [loadKey]: true }))
    try {
      // 如果是汇总页面，重新计算汇总数据
      if (partnerKey === 'summary') {
        await recalculateSummaryData(campusId)
      } else {
        // 加载具体合作伙伴的数据，使用中文名称查询
        const partnerName = PARTNERS.find((p) => p.key === partnerKey)?.name || partnerKey
        const res = await marketOnlinePartnerDailyService.list(campus.name, partnerName, selectedMonthStr)
        const items = (res as any)?.items || []

        setCampusPartnerTableData((prev) => {
          const baseRows = buildMonthRows(selectedMonth)
          const merged = applyBackendItemsToMonthRows(baseRows, items)
          return {
            ...prev,
            [campusId]: {
              ...prev[campusId],
              [partnerKey]: merged,
            },
          }
        })
      }
      setDirtyByKey((prev) => ({ ...prev, [loadKey]: false }))
    } catch (e) {
      console.error('加载网络合作伙伴日度数据失败:', e)
      message.error('加载数据失败')
    } finally {
      setLoadingByKey((prev) => ({ ...prev, [loadKey]: false }))
    }
  }

  // 切换神殿/合作伙伴/月份时：加载当前数据
  useEffect(() => {
    if (!activeCampusId || !activeCampus) return
    loadOneCampusPartnerMonth(activeCampusId, activePartnerKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCampusId, activePartnerKey, selectedMonthStr])

  const weekdayHeaderStyle: React.CSSProperties = {
    backgroundColor: '#00B050',
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  const dateHeaderStyle: React.CSSProperties = {
    backgroundColor: '#92D050',
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  const metricHeaderStyle: React.CSSProperties = {
    backgroundColor: '#FCE4D6',
    color: '#C00000',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  const updateRowField = (
    campusId: string,
    partnerKey: string,
    rowKey: string,
    field: EditableField,
    value: number,
  ) => {
    setCampusPartnerTableData((prev) => {
      const current = prev[campusId]?.[partnerKey] || []
      const nextRows = current.map((r) => {
        if (r.key !== rowKey) return r
        const next = { ...r, [field]: value }

        if (rowKey !== 'summary') {
          next.partnerSignupConversionRate = calcSignupConversionRate(next.netSignup, next.actualConsultCount)
          next.consultCost = calcConsultCost(next.partnerCost, next.actualConsultCount)
        }

        return next
      })

      // 重新计算汇总行
      const summaryRow = calculateSummaryRow(nextRows)
      const finalRows = [summaryRow, ...nextRows.filter((r) => r.key !== 'summary')]

      return {
        ...prev,
        [campusId]: {
          ...prev[campusId],
          [partnerKey]: finalRows,
        },
      }
    })

    const loadKey = `${campusId}-${partnerKey}`
    setDirtyByKey((prev) => ({ ...prev, [loadKey]: true }))
  }

  const renderEditableNumber = (
    campusId: string,
    partnerKey: string,
    record: PartnerDailyRow,
    field: EditableField,
  ) => {
    const value = record[field]
    const isZero = value === 0
    
    // 汇总行始终只读
    if (record.key === 'summary') {
      return (
        <span style={{ fontWeight: 'bold', color: isZero ? '#999' : 'inherit' }}>
          {value}
        </span>
      )
    }

    // 汇总页面（summary）所有字段只读
    if (partnerKey === 'summary') {
      return (
        <span style={{ color: isZero ? '#999' : 'inherit' }}>
          {value}
        </span>
      )
    }

    return (
      <InputNumber
        value={value}
        min={0}
        precision={field === 'partnerCost' ? 2 : 0}
        style={{ width: '100%' }}
        onChange={(val) =>
          updateRowField(campusId, partnerKey, record.key, field, typeof val === 'number' ? val : 0)
        }
      />
    )
  }

  const handleSave = async () => {
    if (!activeCampusId || !activeCampus) return

    // 汇总页面不允许保存
    if (activePartnerKey === 'summary') {
      message.warning('汇总页面数据为只读，无法保存')
      return
    }

    const loadKey = `${activeCampusId}-${activePartnerKey}`
    setSavingByKey((prev) => ({ ...prev, [loadKey]: true }))
    try {
      const rows = (campusPartnerTableData[activeCampusId]?.[activePartnerKey] || [])
        .filter((r) => r.key !== 'summary')
        .map((r) => ({
          date: r.key,
          partner_actual_income: r.partnerActualIncome,
          partner_signup_conversion_rate: r.partnerSignupConversionRate,
          refund_count: r.refundCount,
          net_signup: r.netSignup,
          gross_total: r.grossTotal,
          order_count: r.orderCount,
          visit_count: r.visitCount,
          actual_consult_count: r.actualConsultCount,
          consult_cost: r.consultCost,
          partner_cost: r.partnerCost,
        }))

      // 获取合作伙伴的中文名称，而不是拼音key
      const partnerName = PARTNERS.find((p) => p.key === activePartnerKey)?.name || activePartnerKey

      const res = await marketOnlinePartnerDailyService.bulkSave(
        activeCampus.name,
        partnerName,
        selectedMonthStr,
        rows,
      )
      const items = (res as any)?.items || []

      setCampusPartnerTableData((prev) => {
        const baseRows = buildMonthRows(selectedMonth)
        const merged = applyBackendItemsToMonthRows(baseRows, items)
        return {
          ...prev,
          [activeCampusId]: {
            ...prev[activeCampusId],
            [activePartnerKey]: merged,
          },
        }
      })
      setDirtyByKey((prev) => ({ ...prev, [loadKey]: false }))
      message.success('保存成功')
      
      // 保存成功后，重新计算汇总页面数据
      await recalculateSummaryData(activeCampusId)
    } catch (e) {
      console.error('保存失败:', e)
      message.error('保存失败')
    } finally {
      setSavingByKey((prev) => ({ ...prev, [loadKey]: false }))
    }
  }

  const columns: ColumnsType<PartnerDailyRow> = useMemo(
    () => [
      {
        title: '星期',
        dataIndex: 'weekday',
        width: 90,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ style: weekdayHeaderStyle }),
        render: (val: string, record: PartnerDailyRow) => {
          if (record.key === 'summary') return ''
          return val
        },
      },
      {
        title: '日期',
        dataIndex: 'dateText',
        width: 90,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ style: dateHeaderStyle }),
        render: (val: string, record: PartnerDailyRow) => {
          if (record.key === 'summary') {
            return <span style={{ fontWeight: 'bold' }}>{val}</span>
          }
          return val
        },
      },
      {
        title: '合作伙伴实际收入',
        dataIndex: 'partnerActualIncome',
        width: 130,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: PartnerDailyRow) => {
          const campusId = activeCampusId
          if (!campusId) return ''
          return renderEditableNumber(campusId, activePartnerKey, record, 'partnerActualIncome')
        },
      },
      {
        title: '合作伙伴报名转化率',
        dataIndex: 'partnerSignupConversionRate',
        width: 140,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (val: string, record: PartnerDailyRow) => {
          const isZero = val === '0%' || val === '0.00%'
          const displayVal = isZero ? (
            <span style={{ color: '#999' }}>{val}</span>
          ) : val
          
          if (record.key === 'summary') {
            return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
          }
          return displayVal
        },
      },
      {
        title: '退费数',
        dataIndex: 'refundCount',
        width: 90,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: PartnerDailyRow) => {
          const campusId = activeCampusId
          if (!campusId) return ''
          return renderEditableNumber(campusId, activePartnerKey, record, 'refundCount')
        },
      },
      {
        title: '净报名',
        dataIndex: 'netSignup',
        width: 90,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: PartnerDailyRow) => {
          const campusId = activeCampusId
          if (!campusId) return ''
          return renderEditableNumber(campusId, activePartnerKey, record, 'netSignup')
        },
      },
      {
        title: '毛报总数',
        dataIndex: 'grossTotal',
        width: 100,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: PartnerDailyRow) => {
          const campusId = activeCampusId
          if (!campusId) return ''
          return renderEditableNumber(campusId, activePartnerKey, record, 'grossTotal')
        },
      },
      {
        title: '订座数',
        dataIndex: 'orderCount',
        width: 90,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: PartnerDailyRow) => {
          const campusId = activeCampusId
          if (!campusId) return ''
          return renderEditableNumber(campusId, activePartnerKey, record, 'orderCount')
        },
      },
      {
        title: '上门人数',
        dataIndex: 'visitCount',
        width: 100,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: PartnerDailyRow) => {
          const campusId = activeCampusId
          if (!campusId) return ''
          return renderEditableNumber(campusId, activePartnerKey, record, 'visitCount')
        },
      },
      {
        title: '实际总咨询量',
        dataIndex: 'actualConsultCount',
        width: 120,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: PartnerDailyRow) => {
          const campusId = activeCampusId
          if (!campusId) return ''
          return renderEditableNumber(campusId, activePartnerKey, record, 'actualConsultCount')
        },
      },
      {
        title: '咨询量成本',
        dataIndex: 'consultCost',
        width: 110,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (val: string, record: PartnerDailyRow) => {
          const isZero = val === '¥0.00' || val === '¥0'
          const displayVal = isZero ? (
            <span style={{ color: '#999' }}>{val}</span>
          ) : val
          
          if (record.key === 'summary') {
            return <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
          }
          return displayVal
        },
      },
      {
        title: '合作伙伴消费',
        dataIndex: 'partnerCost',
        width: 120,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: PartnerDailyRow) => {
          const campusId = activeCampusId
          if (!campusId) return ''
          return renderEditableNumber(campusId, activePartnerKey, record, 'partnerCost')
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCampusId, activePartnerKey, selectedMonthStr],
  )

  const campusTabItems = useMemo(
    () =>
      campuses.map((c) => ({
        label: c.name,
        key: c.id,
      })),
    [campuses],
  )

  const partnerTabItems = useMemo(
    () =>
      PARTNERS.map((p) => ({
        label: p.name,
        key: p.key,
      })),
    [],
  )

  const loadKey = useMemo(
    () => (activeCampusId ? `${activeCampusId}-${activePartnerKey}` : ''),
    [activeCampusId, activePartnerKey],
  )

  const activePartner = useMemo(
    () => PARTNERS.find((p) => p.key === activePartnerKey),
    [activePartnerKey],
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
      const importedKeysList: string[] = []
      let totalSaved = 0
      
      // 处理各个合作伙伴的数据并保存到数据库
      const partnerKeys = ['baijiao', 'zhiliao', 'tantu', 'houxue', 'jiuyisouke'] as const
      
      for (const partnerKey of partnerKeys) {
        const partnerData = importedData[partnerKey]
        if (partnerData && Array.isArray(partnerData) && partnerData.length > 0) {
          try {
            // 获取合作伙伴的中文名称
            const partnerName = PARTNERS.find((p) => p.key === partnerKey)?.name || partnerKey
            
            // 准备要保存的数据
            const rows = partnerData.map((item) => ({
              date: item.date,
              partner_actual_income: item.partnerActualIncome,
              partner_signup_conversion_rate: calcSignupConversionRate(item.netSignup, item.actualConsultCount),
              refund_count: item.refundCount,
              net_signup: item.netSignup,
              gross_total: item.grossTotal,
              order_count: item.orderCount,
              visit_count: item.visitCount,
              actual_consult_count: item.actualConsultCount,
              consult_cost: calcConsultCost(item.partnerCost, item.actualConsultCount),
              partner_cost: item.partnerCost,
            }))
            
            // 保存到数据库
            console.log(`正在保存${partnerName}数据到数据库...`)
            await marketOnlinePartnerDailyService.bulkSave(
              campus.name,
              partnerName,
              monthStr,
              rows,
            )
            
            totalSaved += rows.length
            console.log(`${partnerName}数据保存成功`)
            
            // 记录已导入的key
            const loadKey = `${activeCampusId}-${partnerKey}`
            importedKeysList.push(loadKey)
            
          } catch (error) {
            console.error(`保存${partnerKey}数据失败:`, error)
            message.error(`保存${PARTNERS.find((p) => p.key === partnerKey)?.name}数据失败`)
          }
        }
      }
      
      // 标记这些数据为已导入，防止重新加载
      setImportedKeys(new Set(importedKeysList))
      
      // 从数据库重新加载数据以确保显示最新的保存结果
      setCampusPartnerTableData((prev) => {
        const newData = { ...prev }
        
        // 确保当前神殿有基础数据结构
        if (!newData[activeCampusId]) {
          newData[activeCampusId] = {}
          PARTNERS.forEach((p) => {
            newData[activeCampusId][p.key] = buildMonthRows(importMonth)
          })
        }
        
        return newData
      })
      
      // 重新加载所有导入的合作伙伴数据
      for (const partnerKey of partnerKeys) {
        const partnerData = importedData[partnerKey]
        if (partnerData && Array.isArray(partnerData) && partnerData.length > 0) {
          try {
            const partnerName = PARTNERS.find((p) => p.key === partnerKey)?.name || partnerKey
            const res = await marketOnlinePartnerDailyService.list(campus.name, partnerName, monthStr)
            const items = (res as any)?.items || []
            
            setCampusPartnerTableData((prev) => {
              const baseRows = buildMonthRows(importMonth)
              const merged = applyBackendItemsToMonthRows(baseRows, items)
              return {
                ...prev,
                [activeCampusId]: {
                  ...prev[activeCampusId],
                  [partnerKey]: merged,
                },
              }
            })
            
            // 清除dirty标记，因为数据已保存
            const loadKey = `${activeCampusId}-${partnerKey}`
            setDirtyByKey((prev) => ({ ...prev, [loadKey]: false }))
          } catch (error) {
            console.error(`重新加载${partnerKey}数据失败:`, error)
          }
        }
      }
      
      message.success(`成功导入并保存 ${totalSaved} 条数据`)
      
      // 导入完成后，重新计算汇总数据
      if (activeCampusId) {
        setTimeout(() => {
          recalculateSummaryData(activeCampusId)
        }, 200)
      }
    }, 100)
  }

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          6 市场部网络合作伙伴日度数据表
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
          activeKey={activePartnerKey}
          onChange={(key) => setActivePartnerKey(key)}
          items={partnerTabItems}
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
          <Button
            onClick={() => {
              if (activeCampusId) loadOneCampusPartnerMonth(activeCampusId, activePartnerKey)
            }}
            loading={!!(loadKey && loadingByKey[loadKey])}
          >
            刷新
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            disabled={!loadKey || !dirtyByKey[loadKey] || activePartnerKey === 'summary'}
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
            {activePartner?.name} - 市场部{activeCampus?.name || ''}网络合作伙伴数据看板
          </div>

          <Table
            columns={columns}
            dataSource={activeTableData}
            rowKey="key"
            pagination={false}
            bordered
            size="small"
            loading={!!(loadKey && loadingByKey[loadKey])}
            scroll={{ x: 1400, y: 600 }}
            rowClassName={(record) => (record.key === 'summary' ? 'summary-row' : '')}
            title={() => (
              <div
                style={{
                  backgroundColor: '#FCE4D6',
                  padding: '6px 12px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  border: '1px solid #000',
                  borderBottom: 'none',
                }}
              >
                网络合作伙伴 全平台核心数据汇总
              </div>
            )}
          />
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

export default MarketingOnlinePartnerDailyDataPage

