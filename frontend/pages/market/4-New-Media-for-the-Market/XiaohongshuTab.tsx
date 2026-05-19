import React, { useMemo, useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { App, Button, InputNumber, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { xiaohongshuDailyDataService } from '@/services/market/marketXiaohongshuDailyData'
import type { TabRef } from './index'

interface XiaohongshuTabProps {
  campusId: string
  selectedMonth: Dayjs
}

interface XiaohongshuRow {
  key: string
  weekday: string
  dateText: string
  // 小红书-汇总数据
  actualIncome: number
  signupConversionRate: string
  refundCount: number
  netSignup: number
  grossTotal: number
  orderCount: number
  visitCount: number
  consultCount: number
  consultCost: string
  consumption: number
  // 小红书-基础数据
  displayCount: number
  clickCount: number
  clickRate: string
  avgClickPrice: string
  // 小红书-转化数据
  tableCount: number
  privateMessageCount: number
  privateMessageCost: string
  effectiveConsultCount: number
  effectiveConsultCost: string
  // 小红书-额外字段
  exposureCount: number
  singleClickPrice: string
  conversionCount: number
  conversionRate: string
}

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const XiaohongshuTab = forwardRef<TabRef, XiaohongshuTabProps>(({ campusId, selectedMonth }, ref) => {
  const { message } = App.useApp()
  const [data, setData] = useState<XiaohongshuRow[]>([])
  const [loading, setLoading] = useState(false)

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    setMonth: (month: string) => {
      console.log('XiaohongshuTab setMonth被调用:', month)
      // 月份由父组件管理，这里不需要做任何事
    },
    importData: async (importedData: any[], month: string) => {
      console.log('XiaohongshuTab importData被调用，数据条数:', importedData.length, '月份:', month)
      
      if (!campusId) {
        message.error('请先选择神殿')
        return
      }

      // 准备要保存的数据
      const rows = importedData.map(item => ({
        date: item.date,
        actual_income: item.actual_income || 0,
        refund_count: (item.gross_total || 0) - (item.net_signup || 0),
        net_signup: item.net_signup || 0,
        gross_total: item.gross_total || 0,
        order_count: item.order_count || 0,
        visit_count: item.visit_count || 0,
        consult_count: item.consult_count || 0,
        consumption: item.consumption || 0,
        display_count: item.display_count || 0,
        click_count: item.click_count || 0,
        table_count: item.table_count || 0,
        private_message_count: item.private_message_count || 0,
        effective_consult_count: item.consult_count || 0,
      }))

      try {
        // 直接保存到后端
        const response = await xiaohongshuDailyDataService.bulkSave(campusId, month, rows)
        const savedCount = (response as any).saved_count ?? (response as any).data?.saved_count ?? 0
        message.success(`小红书数据导入并保存成功，共保存 ${savedCount} 条记录`)
        
        // 导入成功后重新加载数据
        await loadData()
      } catch (error) {
        console.error('保存小红书数据失败:', error)
        message.error('小红书数据导入失败')
      }
    },
  }))

  const buildMonthData = (month: Dayjs): XiaohongshuRow[] => {
    const start = month.startOf('month')
    const daysInMonth = start.daysInMonth()
    const rows: XiaohongshuRow[] = []

    rows.push({
      key: 'summary',
      weekday: '',
      dateText: '汇总',
      actualIncome: 0,
      signupConversionRate: '0%',
      refundCount: 0,
      netSignup: 0,
      grossTotal: 0,
      orderCount: 0,
      visitCount: 0,
      consultCount: 0,
      consultCost: '0',
      consumption: 0,
      displayCount: 0,
      clickCount: 0,
      clickRate: '0%',
      avgClickPrice: '0',
      tableCount: 0,
      privateMessageCount: 0,
      privateMessageCost: '0',
      effectiveConsultCount: 0,
      effectiveConsultCost: '0',
      exposureCount: 0,
      singleClickPrice: '0',
      conversionCount: 0,
      conversionRate: '0%',
    })

    for (let i = 0; i < daysInMonth; i++) {
      const d = start.add(i, 'day')
      rows.push({
        key: d.format('YYYY-MM-DD'),
        weekday: weekdayMap[d.day()],
        dateText: `${d.month() + 1}月${d.date()}日`,
        actualIncome: 0,
        signupConversionRate: '0%',
        refundCount: 0,
        netSignup: 0,
        grossTotal: 0,
        orderCount: 0,
        visitCount: 0,
        consultCount: 0,
        consultCost: '0',
        consumption: 0,
        displayCount: 0,
        clickCount: 0,
        clickRate: '0%',
        avgClickPrice: '0',
        tableCount: 0,
        privateMessageCount: 0,
        privateMessageCost: '0',
        effectiveConsultCount: 0,
        effectiveConsultCost: '0',
        exposureCount: 0,
        singleClickPrice: '0',
        conversionCount: 0,
        conversionRate: '0%',
      })
    }

    return rows
  }

  // 加载数据
  const loadData = async () => {
    if (!campusId) return
    
    setLoading(true)
    try {
      const month = selectedMonth.format('YYYY-MM')
      const response = await xiaohongshuDailyDataService.list(campusId, month)
      
      const items = response.data?.items || (response as any).items
      if (items && items.length > 0) {
        const apiData = items
        const monthData = buildMonthData(selectedMonth)
        
        const mergedData = monthData.map(row => {
          if (row.key === 'summary') return row
          
          const apiRow = apiData.find(item => item.date === row.key)
          if (apiRow) {
            const actualIncome = parseFloat(apiRow.actual_income as unknown as string) || 0
            const consumption = parseFloat(apiRow.consumption as unknown as string) || 0
            const effectiveConsultCount = apiRow.effective_consult_count || 0
            const consultCount = effectiveConsultCount // 小红书总量 = 有效咨询量
            const displayCount = apiRow.display_count || 0
            const clickCount = apiRow.click_count || 0
            const privateMessageCount = apiRow.private_message_count || 0
            
            // 计算派生字段
            let signupConversionRate = '0%'
            if (consultCount > 0) {
              signupConversionRate = ((apiRow.net_signup / consultCount) * 100).toFixed(2) + '%'
            }
            
            let consultCost = '0'
            if (consultCount > 0) {
              consultCost = (consumption / consultCount).toFixed(2)
            }
            
            let clickRate = '0%'
            if (displayCount > 0) {
              clickRate = ((clickCount / displayCount) * 100).toFixed(2) + '%'
            }
            
            let avgClickPrice = '0'
            if (clickCount > 0) {
              avgClickPrice = (consumption / clickCount).toFixed(2)
            }
            
            let avgDisplayPrice = '0'
            if (displayCount > 0) {
              avgDisplayPrice = ((consumption / displayCount) * 1000).toFixed(2)
            }
            
            let privateMessageCost = '0'
            if (privateMessageCount > 0) {
              privateMessageCost = (consumption / privateMessageCount).toFixed(2)
            }
            
            let effectiveConsultCost = '0'
            if (effectiveConsultCount > 0) {
              effectiveConsultCost = (consumption / effectiveConsultCount).toFixed(2)
            }
            
            return {
              ...row,
              actualIncome,
              signupConversionRate,
              refundCount: apiRow.refund_count,
              netSignup: apiRow.net_signup,
              grossTotal: apiRow.gross_total,
              orderCount: apiRow.order_count,
              visitCount: apiRow.visit_count,
              consultCount,
              consultCost,
              consumption,
              displayCount,
              clickCount,
              clickRate,
              avgClickPrice,
              singleClickPrice: avgClickPrice, // 使用平均点击价格
              tableCount: apiRow.table_count,
              privateMessageCount,
              privateMessageCost,
              effectiveConsultCount,
              effectiveConsultCost,
              exposureCount: displayCount, // 曝光量等于展现量
              conversionCount: 0, // 小红书没有转化数字段
              conversionRate: '0%',
            }
          }
          return row
        })
        
        const dataWithoutSummary = mergedData.filter(row => row.key !== 'summary')
        const summary = calculateSummary(dataWithoutSummary)
        setData([summary, ...dataWithoutSummary])
      } else {
        setData(buildMonthData(selectedMonth))
      }
    } catch (error) {
      console.error('加载小红书数据失败:', error)
      message.error('加载数据失败')
      setData(buildMonthData(selectedMonth))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth, campusId])

  const handleUpdate = (rowKey: string, field: keyof XiaohongshuRow, value: number) => {
    setData((prev) => {
      const updated = prev.map((row) => {
        if (row.key === rowKey) {
          const updatedRow = { ...row, [field]: value }
          
          // 自动计算派生字段
          if (row.key !== 'summary') {
            // 小红书总量 = 有效咨询量（同步）
            if (field === 'effectiveConsultCount') {
              updatedRow.consultCount = updatedRow.effectiveConsultCount
            }
            if (field === 'consultCount') {
              updatedRow.effectiveConsultCount = updatedRow.consultCount
            }
            
            // 退费数 = 毛报总数 - 净报名
            if (field === 'grossTotal' || field === 'netSignup') {
              updatedRow.refundCount = updatedRow.grossTotal - updatedRow.netSignup
            }
            
            // 小红书报名转化率 = 净报名 / 小红书咨询量 * 100%
            if (field === 'netSignup' || field === 'consultCount' || field === 'effectiveConsultCount') {
              if (updatedRow.consultCount > 0) {
                updatedRow.signupConversionRate = ((updatedRow.netSignup / updatedRow.consultCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.signupConversionRate = '0%'
              }
            }
            
            // 咨询量成本 = 小红书消费 / 小红书咨询量
            if (field === 'consumption' || field === 'consultCount' || field === 'effectiveConsultCount') {
              if (updatedRow.consultCount > 0) {
                updatedRow.consultCost = (updatedRow.consumption / updatedRow.consultCount).toFixed(2)
              } else {
                updatedRow.consultCost = '0'
              }
            }
            
            // 点击率 = 点击量 / 曝光量 * 100%
            if (field === 'clickCount' || field === 'exposureCount') {
              if (updatedRow.exposureCount > 0) {
                updatedRow.clickRate = ((updatedRow.clickCount / updatedRow.exposureCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.clickRate = '0%'
              }
            }
            
            // 单次点击价格 = 小红书消费 / 点击量
            if (field === 'consumption' || field === 'clickCount') {
              if (updatedRow.clickCount > 0) {
                updatedRow.singleClickPrice = (updatedRow.consumption / updatedRow.clickCount).toFixed(2)
              } else {
                updatedRow.singleClickPrice = '0'
              }
            }
            
            // 转化率% = 转化数 / 点击量 * 100%
            if (field === 'conversionCount' || field === 'clickCount') {
              if (updatedRow.clickCount > 0) {
                updatedRow.conversionRate = ((updatedRow.conversionCount / updatedRow.clickCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.conversionRate = '0%'
              }
            }
            
            // 有效咨询量成本 = 小红书消费 / 有效咨询量
            if (field === 'consumption' || field === 'effectiveConsultCount' || field === 'consultCount') {
              if (updatedRow.effectiveConsultCount > 0) {
                updatedRow.effectiveConsultCost = (updatedRow.consumption / updatedRow.effectiveConsultCount).toFixed(2)
              } else {
                updatedRow.effectiveConsultCost = '0'
              }
            }
          }
          
          return updatedRow
        }
        return row
      })
      
      // 重新计算汇总行
      const dataWithoutSummary = updated.filter(row => row.key !== 'summary')
      const summary = calculateSummary(dataWithoutSummary)
      return [summary, ...dataWithoutSummary]
    })
  }

  // 计算汇总行
  const calculateSummary = (dataRows: XiaohongshuRow[]): XiaohongshuRow => {
    const summary: XiaohongshuRow = {
      key: 'summary',
      weekday: '',
      dateText: '汇总',
      actualIncome: 0,
      signupConversionRate: '0%',
      refundCount: 0,
      netSignup: 0,
      grossTotal: 0,
      orderCount: 0,
      visitCount: 0,
      consultCount: 0,
      consultCost: '0',
      consumption: 0,
      displayCount: 0,
      clickCount: 0,
      clickRate: '0%',
      avgClickPrice: '0',
      tableCount: 0,
      privateMessageCount: 0,
      privateMessageCost: '0',
      effectiveConsultCount: 0,
      effectiveConsultCost: '0',
      exposureCount: 0,
      singleClickPrice: '0',
      conversionCount: 0,
      conversionRate: '0%',
    }
    
    // 汇总数值字段
    dataRows.forEach(row => {
      summary.actualIncome += row.actualIncome
      summary.refundCount += row.refundCount
      summary.netSignup += row.netSignup
      summary.grossTotal += row.grossTotal
      summary.orderCount += row.orderCount
      summary.visitCount += row.visitCount
      summary.consultCount += row.consultCount
      summary.consumption += row.consumption
      summary.displayCount += row.displayCount
      summary.clickCount += row.clickCount
      summary.tableCount += row.tableCount
      summary.privateMessageCount += row.privateMessageCount
      summary.effectiveConsultCount += row.effectiveConsultCount
      summary.exposureCount += row.exposureCount
      summary.conversionCount += row.conversionCount
    })
    
    // 计算汇总的派生字段
    if (summary.consultCount > 0) {
      summary.signupConversionRate = ((summary.netSignup / summary.consultCount) * 100).toFixed(2) + '%'
      summary.consultCost = (summary.consumption / summary.consultCount).toFixed(2)
    } else {
      summary.signupConversionRate = '0%'
      summary.consultCost = '0'
    }
    
    if (summary.displayCount > 0) {
      summary.clickRate = ((summary.clickCount / summary.displayCount) * 100).toFixed(2) + '%'
    } else if (summary.exposureCount > 0) {
      summary.clickRate = ((summary.clickCount / summary.exposureCount) * 100).toFixed(2) + '%'
    } else {
      summary.clickRate = '0%'
    }
    
    if (summary.clickCount > 0) {
      summary.avgClickPrice = (summary.consumption / summary.clickCount).toFixed(2)
      summary.singleClickPrice = (summary.consumption / summary.clickCount).toFixed(2)
      summary.conversionRate = ((summary.conversionCount / summary.clickCount) * 100).toFixed(2) + '%'
    } else {
      summary.avgClickPrice = '0'
      summary.singleClickPrice = '0'
      summary.conversionRate = '0%'
    }
    
    if (summary.privateMessageCount > 0) {
      summary.privateMessageCost = (summary.consumption / summary.privateMessageCount).toFixed(2)
    } else {
      summary.privateMessageCost = '0'
    }
    
    if (summary.effectiveConsultCount > 0) {
      summary.effectiveConsultCost = (summary.consumption / summary.effectiveConsultCount).toFixed(2)
    } else {
      summary.effectiveConsultCost = '0'
    }
    
    return summary
  }

  const renderEditableNumber = (record: XiaohongshuRow, field: keyof XiaohongshuRow) => {
    // 判断是否需要显示两位小数
    const needDecimal = field === 'consumption'
    const displayValue = needDecimal ? (typeof record[field] === 'number' ? (record[field] as number).toFixed(2) : record[field]) : record[field]
    
    if (record.key === 'summary') {
      return <span style={{ fontWeight: 'bold' }}>{displayValue}</span>
    }

    return (
      <InputNumber
        value={record[field] as number}
        min={0}
        controls={false}
        precision={needDecimal ? 2 : 0}
        style={{ width: '100%' }}
        onChange={(val) => handleUpdate(record.key, field, typeof val === 'number' ? val : 0)}
      />
    )
  }

  const columns: ColumnsType<XiaohongshuRow> = useMemo(
    () => [
      {
        title: '日期',
        dataIndex: 'dateText',
        width: 70,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#92D050', color: '#000', fontWeight: 'bold' },
        }),
        render: (val: string, record: XiaohongshuRow) =>
          record.key === 'summary' ? <span style={{ fontWeight: 'bold' }}>{val}</span> : val,
      },
      {
        title: '新媒体-小红书汇总数据',
        children: [
          {
            title: '小红书实际收入',
            dataIndex: 'actualIncome',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: XiaohongshuRow) =>
              renderEditableNumber(record, 'actualIncome'),
          },
          {
            title: '小红书报名转化率',
            dataIndex: 'signupConversionRate',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (text: string, record: XiaohongshuRow) => (
              <span style={{ color: text === '0%' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '退费数',
            dataIndex: 'refundCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: XiaohongshuRow) =>
              renderEditableNumber(record, 'refundCount'),
          },
          {
            title: '净报名',
            dataIndex: 'netSignup',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: XiaohongshuRow) => renderEditableNumber(record, 'netSignup'),
          },
          {
            title: '毛报总数',
            dataIndex: 'grossTotal',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: XiaohongshuRow) =>
              renderEditableNumber(record, 'grossTotal'),
          },
          {
            title: '订座数',
            dataIndex: 'orderCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: XiaohongshuRow) =>
              renderEditableNumber(record, 'orderCount'),
          },
          {
            title: '上门人数',
            dataIndex: 'visitCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: XiaohongshuRow) =>
              renderEditableNumber(record, 'visitCount'),
          },
          {
            title: '小红书总量',
            dataIndex: 'consultCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: XiaohongshuRow) =>
              renderEditableNumber(record, 'consultCount'),
          },
          {
            title: '咨询量成本',
            dataIndex: 'consultCost',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (text: string, record: XiaohongshuRow) => (
              <span style={{ color: text === '0' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '小红书消费',
            dataIndex: 'consumption',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: XiaohongshuRow) =>
              renderEditableNumber(record, 'consumption'),
          },
        ],
      },
      {
        title: '小红书-基础数据',
        children: [
          {
            title: '展现量',
            dataIndex: 'displayCount',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: XiaohongshuRow) =>
              renderEditableNumber(record, 'displayCount'),
          },
          {
            title: '点击量',
            dataIndex: 'clickCount',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: XiaohongshuRow) =>
              renderEditableNumber(record, 'clickCount'),
          },
          {
            title: '点击率',
            dataIndex: 'clickRate',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (text: string, record: XiaohongshuRow) => (
              <span style={{ color: text === '0%' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '平均点击成本',
            dataIndex: 'avgClickPrice',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (text: string, record: XiaohongshuRow) => (
              <span style={{ color: text === '0' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
        ],
      },
      {
        title: '小红书-转化数据',
        children: [
          {
            title: '表单',
            dataIndex: 'tableCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: XiaohongshuRow) =>
              renderEditableNumber(record, 'tableCount'),
          },
          {
            title: '私信留资数',
            dataIndex: 'privateMessageCount',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: XiaohongshuRow) =>
              renderEditableNumber(record, 'privateMessageCount'),
          },
          {
            title: '私信留资成本',
            dataIndex: 'privateMessageCost',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (text: string, record: XiaohongshuRow) => (
              <span style={{ color: text === '0' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '有效咨询量',
            dataIndex: 'effectiveConsultCount',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: XiaohongshuRow) =>
              renderEditableNumber(record, 'effectiveConsultCount'),
          },
          {
            title: '有效咨询量成本',
            dataIndex: 'effectiveConsultCost',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (text: string, record: XiaohongshuRow) => (
              <span style={{ color: text === '0' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
        ],
      },
    ],
    []
  )

  const handleSave = async () => {
    if (!campusId) {
      message.error('请先选择神殿')
      return
    }

    setLoading(true)
    try {
      const month = selectedMonth.format('YYYY-MM')
      
      const rows = data
        .filter(row => row.key !== 'summary')
        .map(row => ({
          date: row.key,
          actual_income: row.actualIncome,
          refund_count: row.refundCount,
          net_signup: row.netSignup,
          gross_total: row.grossTotal,
          order_count: row.orderCount,
          visit_count: row.visitCount,
          consult_count: row.consultCount,
          consumption: row.consumption,
          display_count: row.displayCount,
          click_count: row.clickCount,
          table_count: row.tableCount,
          private_message_count: row.privateMessageCount,
          effective_consult_count: row.effectiveConsultCount,
        }))

      const response = await xiaohongshuDailyDataService.bulkSave(campusId, month, rows)
      const savedCount = (response as any).saved_count ?? (response as any).data?.saved_count ?? 0
      message.success(`小红书数据保存成功，共保存 ${savedCount} 条记录`)
      await loadData()
    } catch (error) {
      console.error('保存小红书数据失败:', error)
      message.error('保存数据失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        scroll={{ y: 600 }}
        bordered
        size="small"
      />
    </div>
  )
})

XiaohongshuTab.displayName = 'XiaohongshuTab'

export default XiaohongshuTab
