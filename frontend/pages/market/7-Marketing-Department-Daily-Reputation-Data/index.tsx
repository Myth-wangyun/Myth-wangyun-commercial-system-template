import React, { useEffect, useMemo, useState } from 'react'
import { App, Button, Card, DatePicker, InputNumber, Space, Table, Tabs, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { marketDailyReputationDataService } from '@/services/market/marketDailyReputationData'
import ExcelImporter, { type ImportedData } from './ExcelImporter'
import styles from './index.module.css'

const { Title } = Typography

type ReputationDailyRow = {
  key: string
  weekday: string
  dateText: string
  partnerIncome: number
  partnerTransferRate: string
  refundCount: number
  netSignup: number
  grossCount: number
  orderCount: number
  visitCount: number
  actualConsultCount: number
}

type EditableField = keyof Omit<
  ReputationDailyRow,
  'key' | 'weekday' | 'dateText' | 'partnerTransferRate'
>

const formatMonthDay = (d: dayjs.Dayjs) => `${d.month() + 1}月${d.date()}日`

const emptyNumericRow = (
  d: Dayjs,
): Omit<ReputationDailyRow, 'weekday' | 'dateText' | 'partnerTransferRate'> => ({
  key: d.format('YYYY-MM-DD'),
  partnerIncome: 0,
  refundCount: 0,
  netSignup: 0,
  grossCount: 0,
  orderCount: 0,
  visitCount: 0,
  actualConsultCount: 0,
})

const calcTransferRate = (netSignup: number, actualConsultCount: number): string => {
  if (!actualConsultCount) return '0%'
  const v = (netSignup / actualConsultCount) * 100
  return `${v.toFixed(2)}%`
}

const buildMonthRows = (monthStart: Dayjs): ReputationDailyRow[] => {
  const start = monthStart.startOf('month')
  const daysInMonth = start.daysInMonth()

  const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

  const rows: ReputationDailyRow[] = []

  // 汇总行
  rows.push({
    key: 'summary',
    weekday: '',
    dateText: '汇总',
    partnerIncome: 0,
    partnerTransferRate: '0%',
    refundCount: 0,
    netSignup: 0,
    grossCount: 0,
    orderCount: 0,
    visitCount: 0,
    actualConsultCount: 0,
  })

  for (let i = 0; i < daysInMonth; i++) {
    const d = start.add(i, 'day')
    const base = emptyNumericRow(d)
    rows.push({
      ...base,
      weekday: weekdayMap[d.day()],
      dateText: formatMonthDay(d),
      partnerTransferRate: calcTransferRate(base.netSignup, base.actualConsultCount),
    })
  }

  return rows
}

const mergeRowsPreserveValues = (newRows: ReputationDailyRow[], oldRows?: ReputationDailyRow[]) => {
  if (!oldRows || oldRows.length === 0) return newRows

  const oldMap = new Map(oldRows.map((r) => [r.key, r]))

  return newRows.map((r) => {
    const old = oldMap.get(r.key)
    if (!old) return r

    if (r.key === 'summary') {
      return {
        ...r,
        partnerIncome: old.partnerIncome,
        refundCount: old.refundCount,
        netSignup: old.netSignup,
        grossCount: old.grossCount,
        orderCount: old.orderCount,
        visitCount: old.visitCount,
        actualConsultCount: old.actualConsultCount,
        partnerTransferRate: '0%',
      }
    }

    const next: ReputationDailyRow = {
      ...r,
      partnerIncome: old.partnerIncome,
      refundCount: old.refundCount,
      netSignup: old.netSignup,
      grossCount: old.grossCount,
      orderCount: old.orderCount,
      visitCount: old.visitCount,
      actualConsultCount: old.actualConsultCount,
      partnerTransferRate: calcTransferRate(old.netSignup, old.actualConsultCount),
    }

    return next
  })
}

const calculateSummaryRow = (rows: ReputationDailyRow[]): ReputationDailyRow => {
  const dataRows = rows.filter((r) => r.key !== 'summary')
  
  const totals = dataRows.reduce(
    (acc, row) => ({
      partnerIncome: acc.partnerIncome + row.partnerIncome,
      refundCount: acc.refundCount + row.refundCount,
      netSignup: acc.netSignup + row.netSignup,
      grossCount: acc.grossCount + row.grossCount,
      orderCount: acc.orderCount + row.orderCount,
      visitCount: acc.visitCount + row.visitCount,
      actualConsultCount: acc.actualConsultCount + row.actualConsultCount,
    }),
    {
      partnerIncome: 0,
      refundCount: 0,
      netSignup: 0,
      grossCount: 0,
      orderCount: 0,
      visitCount: 0,
      actualConsultCount: 0,
    }
  )

  return {
    key: 'summary',
    weekday: '',
    dateText: '汇总',
    partnerIncome: totals.partnerIncome,
    partnerTransferRate: calcTransferRate(totals.netSignup, totals.actualConsultCount),
    refundCount: totals.refundCount,
    netSignup: totals.netSignup,
    grossCount: totals.grossCount,
    orderCount: totals.orderCount,
    visitCount: totals.visitCount,
    actualConsultCount: totals.actualConsultCount,
  }
}

const applyBackendItemsToMonthRows = (monthRows: ReputationDailyRow[], items: any[]): ReputationDailyRow[] => {
  const itemMap = new Map<string, any>()
  items.forEach((it) => {
    if (it?.date) itemMap.set(String(it.date).slice(0, 10), it)
  })

  const updatedRows = monthRows.map((r) => {
    if (r.key === 'summary') return r
    const it = itemMap.get(r.key)
    if (!it) return r

    const next: ReputationDailyRow = {
      ...r,
      partnerIncome: Number(it.partner_income ?? 0),
      refundCount: Number(it.refund_count ?? 0),
      netSignup: Number(it.net_signup ?? 0),
      grossCount: Number(it.gross_count ?? 0),
      orderCount: Number(it.order_count ?? 0),
      visitCount: Number(it.visit_count ?? 0),
      actualConsultCount: Number(it.actual_consult_count ?? 0),
      partnerTransferRate: calcTransferRate(Number(it.net_signup ?? 0), Number(it.actual_consult_count ?? 0)),
    }

    return next
  })

  // 重新计算汇总行
  const summaryRow = calculateSummaryRow(updatedRows)
  return [summaryRow, ...updatedRows.filter((r) => r.key !== 'summary')]
}

const MarketingDepartmentDailyReputationDataPage: React.FC = () => {
  const { message } = App.useApp()
  const { getAllCampuses, loadCampusesFromConfig } = useCampusStore()
  
  // 获取排序后的神殿列表 - 使用 useMemo 避免无限循环
  const campuses = useMemo(() => getAllCampuses(), [getAllCampuses])

  const [activeCampusId, setActiveCampusId] = useState<string | undefined>(undefined)
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(() => dayjs().startOf('month'))

  const [campusTableData, setCampusTableData] = useState<Record<string, ReputationDailyRow[]>>({})
  const [loadingByCampus, setLoadingByCampus] = useState<Record<string, boolean>>({})
  const [savingByCampus, setSavingByCampus] = useState<Record<string, boolean>>({})
  const [dirtyByCampus, setDirtyByCampus] = useState<Record<string, boolean>>({})

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

  // 月份变化：为所有神殿重建当月行（尽量保留已有输入）
  useEffect(() => {
    setCampusTableData((prev) => {
      const next: Record<string, ReputationDailyRow[]> = { ...prev }
      campuses.forEach((c) => {
        const newRows = buildMonthRows(selectedMonth)
        next[c.id] = mergeRowsPreserveValues(newRows, prev[c.id])
      })
      return next
    })
  }, [selectedMonth, campuses])

  // 神殿列表加载后：确保每个神殿都有数据
  useEffect(() => {
    if (!campuses.length) return

    setCampusTableData((prev) => {
      const next: Record<string, ReputationDailyRow[]> = { ...prev }
      campuses.forEach((c) => {
        if (!next[c.id] || next[c.id].length === 0) {
          next[c.id] = buildMonthRows(selectedMonth)
        }
      })
      return next
    })
  }, [campuses, selectedMonth])

  const activeCampus = useMemo(
    () => campuses.find((c) => c.id === activeCampusId),
    [campuses, activeCampusId],
  )

  const activeTableData = useMemo(
    () => (activeCampusId ? campusTableData[activeCampusId] || [] : []),
    [activeCampusId, campusTableData],
  )

  const selectedMonthStr = useMemo(() => selectedMonth.format('YYYY-MM'), [selectedMonth])

  const loadOneCampusMonth = async (campusId: string) => {
    const campus = campuses.find((c) => c.id === campusId)
    if (!campus) return

    setLoadingByCampus((prev) => ({ ...prev, [campusId]: true }))
    try {
      const res = await marketDailyReputationDataService.list(campus.name, selectedMonthStr)
      const items = (res as any)?.items || []

      setCampusTableData((prev) => {
        const baseRows = buildMonthRows(selectedMonth)
        const merged = applyBackendItemsToMonthRows(baseRows, items)
        return { ...prev, [campusId]: merged }
      })
      setDirtyByCampus((prev) => ({ ...prev, [campusId]: false }))
    } catch (e) {
      console.error('加载口碑日度数据失败:', e)
      message.error('加载数据失败')
    } finally {
      setLoadingByCampus((prev) => ({ ...prev, [campusId]: false }))
    }
  }

  // 切换神殿/月份时：加载当前神殿数据
  useEffect(() => {
    if (!activeCampusId) return
    if (!activeCampus) return
    loadOneCampusMonth(activeCampusId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCampusId, selectedMonthStr])

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

  const groupHeaderStyle: React.CSSProperties = {
    backgroundColor: '#FCE4D6',
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
  }

  const updateRowField = (campusId: string, rowKey: string, field: EditableField, value: number) => {
    setCampusTableData((prev) => {
      const current = prev[campusId] || []
      const nextRows = current.map((r) => {
        if (r.key !== rowKey) return r
        const next = { ...r, [field]: value }

        if (rowKey !== 'summary') {
          next.partnerTransferRate = calcTransferRate(next.netSignup, next.actualConsultCount)
        }

        return next
      })

      // 重新计算汇总行
      const summaryRow = calculateSummaryRow(nextRows)
      const finalRows = [summaryRow, ...nextRows.filter((r) => r.key !== 'summary')]

      return {
        ...prev,
        [campusId]: finalRows,
      }
    })

    setDirtyByCampus((prev) => ({ ...prev, [campusId]: true }))
  }

  const renderEditableNumber = (campusId: string, record: ReputationDailyRow, field: EditableField) => {
    const value = record[field]
    const isZero = value === 0
    
    if (record.key === 'summary') {
      return (
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontWeight: 'bold', color: isZero ? '#999' : 'inherit' }}>
            {value}
          </span>
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <InputNumber
          value={value}
          min={0}
          precision={0}
          className={styles.centerInput}
          style={{ width: '100%' }}
          onChange={(val) => updateRowField(campusId, record.key, field, typeof val === 'number' ? val : 0)}
        />
      </div>
    )
  }

  const handleSave = async () => {
    if (!activeCampusId || !activeCampus) return

    setSavingByCampus((prev) => ({ ...prev, [activeCampusId]: true }))
    try {
      const rows = (campusTableData[activeCampusId] || [])
        .filter((r) => r.key !== 'summary')
        .map((r) => ({
          date: r.key,
          partner_income: r.partnerIncome,
          refund_count: r.refundCount,
          net_signup: r.netSignup,
          gross_count: r.grossCount,
          order_count: r.orderCount,
          visit_count: r.visitCount,
          actual_consult_count: r.actualConsultCount,
        }))

      const res = await marketDailyReputationDataService.bulkSave(activeCampus.name, selectedMonthStr, rows)
      const items = (res as any)?.items || []

      setCampusTableData((prev) => {
        const baseRows = buildMonthRows(selectedMonth)
        const merged = applyBackendItemsToMonthRows(baseRows, items)
        return { ...prev, [activeCampusId]: merged }
      })
      setDirtyByCampus((prev) => ({ ...prev, [activeCampusId]: false }))
      message.success('保存成功')
    } catch (e) {
      console.error('保存失败:', e)
      message.error('保存失败')
    } finally {
      setSavingByCampus((prev) => ({ ...prev, [activeCampusId]: false }))
    }
  }

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

    // 设置月份
    setSelectedMonth(importMonth)
    
    // 使用 setTimeout 确保在月份变化的 effect 执行后再保存数据
    setTimeout(async () => {
      try {
        // 准备要保存的数据
        const rows = importedData.data.map((item) => ({
          date: item.date,
          partner_income: item.partnerIncome,
          refund_count: item.refundCount,
          net_signup: item.netSignup,
          gross_count: item.grossCount,
          order_count: item.orderCount,
          visit_count: item.visitCount,
          actual_consult_count: item.actualConsultCount,
        }))

        // 保存到数据库
        console.log('正在保存口碑数据到数据库...')
        const res = await marketDailyReputationDataService.bulkSave(campus.name, monthStr, rows)
        const items = (res as any)?.items || []

        // 从数据库重新加载数据以确保显示最新的保存结果
        setCampusTableData((prev) => {
          const baseRows = buildMonthRows(importMonth)
          const merged = applyBackendItemsToMonthRows(baseRows, items)
          return { ...prev, [activeCampusId]: merged }
        })
        
        // 清除dirty标记，因为数据已保存
        setDirtyByCampus((prev) => ({ ...prev, [activeCampusId]: false }))
        
        message.success(`成功导入并保存 ${importedData.data.length} 条数据`)
        console.log('口碑数据保存成功')
      } catch (error) {
        console.error('保存口碑数据失败:', error)
        message.error('保存口碑数据失败')
      }
    }, 100)
  }

  const columns: ColumnsType<ReputationDailyRow> = useMemo(
    () => [
      {
        title: '星期',
        dataIndex: 'weekday',
        width: 90,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ style: weekdayHeaderStyle }),
        render: (val: string, record: ReputationDailyRow) => {
          if (record.key === 'summary') return ''
          return <div style={{ textAlign: 'center' }}>{val}</div>
        },
      },
      {
        title: '日期',
        dataIndex: 'dateText',
        width: 90,
        align: 'center',
        fixed: 'left',
        onHeaderCell: () => ({ style: dateHeaderStyle }),
        render: (val: string, record: ReputationDailyRow) => {
          if (record.key === 'summary') {
            return <div style={{ textAlign: 'center' }}><span style={{ fontWeight: 'bold' }}>{val}</span></div>
          }
          return <div style={{ textAlign: 'center' }}>{val}</div>
        },
      },
      {
        title: '口碑实际收入',
        dataIndex: 'partnerIncome',
        width: 130,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (_: unknown, record: ReputationDailyRow) => {
          const campusId = activeCampusId
          if (!campusId) return ''
          return renderEditableNumber(campusId, record, 'partnerIncome')
        },
      },
      {
        title: '口碑报名转化率',
        dataIndex: 'partnerTransferRate',
        width: 140,
        align: 'center',
        onHeaderCell: () => ({ style: metricHeaderStyle }),
        render: (val: string, record: ReputationDailyRow) => {
          const isZero = val === '0%' || val === '0.00%'
          const displayVal = isZero ? (
            <span style={{ color: '#999' }}>{val}</span>
          ) : val
          
          if (record.key === 'summary') {
            return (
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>{displayVal}</span>
              </div>
            )
          }
          return <div style={{ textAlign: 'center' }}>{displayVal}</div>
        },
      },
      {
        title: '市场部口碑数据汇总',
        onHeaderCell: () => ({ style: groupHeaderStyle }),
        children: [
          {
            title: '退费数',
            dataIndex: 'refundCount',
            width: 90,
            align: 'center',
            onHeaderCell: () => ({ style: metricHeaderStyle }),
            render: (_: unknown, record: ReputationDailyRow) => {
              const campusId = activeCampusId
              if (!campusId) return ''
              return renderEditableNumber(campusId, record, 'refundCount')
            },
          },
          {
            title: '净报名',
            dataIndex: 'netSignup',
            width: 90,
            align: 'center',
            onHeaderCell: () => ({ style: metricHeaderStyle }),
            render: (_: unknown, record: ReputationDailyRow) => {
              const campusId = activeCampusId
              if (!campusId) return ''
              return renderEditableNumber(campusId, record, 'netSignup')
            },
          },
          {
            title: '毛报总数',
            dataIndex: 'grossCount',
            width: 100,
            align: 'center',
            onHeaderCell: () => ({ style: metricHeaderStyle }),
            render: (_: unknown, record: ReputationDailyRow) => {
              const campusId = activeCampusId
              if (!campusId) return ''
              return renderEditableNumber(campusId, record, 'grossCount')
            },
          },
          {
            title: '订座数',
            dataIndex: 'orderCount',
            width: 90,
            align: 'center',
            onHeaderCell: () => ({ style: metricHeaderStyle }),
            render: (_: unknown, record: ReputationDailyRow) => {
              const campusId = activeCampusId
              if (!campusId) return ''
              return renderEditableNumber(campusId, record, 'orderCount')
            },
          },
          {
            title: '上门人数',
            dataIndex: 'visitCount',
            width: 100,
            align: 'center',
            onHeaderCell: () => ({ style: metricHeaderStyle }),
            render: (_: unknown, record: ReputationDailyRow) => {
              const campusId = activeCampusId
              if (!campusId) return ''
              return renderEditableNumber(campusId, record, 'visitCount')
            },
          },
          {
            title: '实际口碑咨询量',
            dataIndex: 'actualConsultCount',
            width: 130,
            align: 'center',
            onHeaderCell: () => ({ style: metricHeaderStyle }),
            render: (_: unknown, record: ReputationDailyRow) => {
              const campusId = activeCampusId
              if (!campusId) return ''
              return renderEditableNumber(campusId, record, 'actualConsultCount')
            },
          },
        ],
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeCampusId, selectedMonthStr],
  )

  const tabItems = useMemo(
    () =>
      campuses.map((c) => ({
        label: c.name,
        key: c.id,
      })),
    [campuses],
  )

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          7 市场部口碑日度数据表
        </Title>
        <ExcelImporter 
          campusId={activeCampusId || ''} 
          onImportSuccess={handleImportSuccess}
        />
      </div>

      <div style={{ paddingLeft: 12 }}>
        <Tabs
          activeKey={activeCampusId}
          onChange={(key) => setActiveCampusId(key)}
          items={tabItems}
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
              if (activeCampusId) loadOneCampusMonth(activeCampusId)
            }}
            loading={!!(activeCampusId && loadingByCampus[activeCampusId])}
          >
            刷新
          </Button>
          <Button
            type="primary"
            onClick={handleSave}
            disabled={!activeCampusId || !dirtyByCampus[activeCampusId]}
            loading={!!(activeCampusId && savingByCampus[activeCampusId])}
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
            01汇总 - 市场部{activeCampus?.name || ''} 口碑数据看板
          </div>

          <Table
            columns={columns}
            dataSource={activeTableData}
            rowKey="key"
            pagination={false}
            bordered
            size="small"
            loading={!!(activeCampusId && loadingByCampus[activeCampusId])}
            scroll={{ x: 950, y: 600 }}
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
                市场部口碑数据汇总
              </div>
            )}
          />
        </Card>
      </div>
    </div>
  )
}

export default MarketingDepartmentDailyReputationDataPage
