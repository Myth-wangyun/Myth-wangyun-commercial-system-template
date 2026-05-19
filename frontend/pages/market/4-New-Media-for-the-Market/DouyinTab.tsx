import React, { useMemo, useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { App, Button, InputNumber, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { douyinDailyDataService } from '@/services/market/marketDouyinDailyData'
import type { TabRef } from './index'

interface DouyinTabProps {
  campusId: string
  selectedMonth: Dayjs
}

interface DouyinRow {
  key: string
  weekday: string
  dateText: string
  // 抖音-汇总数据
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
  // 抖音-基础数据
  displayCount: number
  clickCount: number
  clickRate: string
  avgClickPrice: string
  avgDisplayPrice: string
  // 抖音-转化数据
  conversionCount: number
  conversionCost: string
  conversionRate: string
  avgConsultCost: string
  // 抖音-额外字段
  phoneCallCount: number
  tableCount: number
  privateMessageCount: number
  privateMessageCost: string
  exposureCount: number
  effectiveConsultCost: string
}

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const DouyinTab = forwardRef<TabRef, DouyinTabProps>(({ campusId, selectedMonth }, ref) => {
  const { message } = App.useApp()
  const [data, setData] = useState<DouyinRow[]>([])
  const [loading, setLoading] = useState(false)

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    setMonth: (month: string) => {
      console.log('DouyinTab setMonth被调用:', month)
      // 月份由父组件管理，这里不需要做任何事
    },
    importData: async (importedData: any[], month: string) => {
      console.log('DouyinTab importData被调用，数据条数:', importedData.length, '月份:', month)
      console.log('导入的第一条数据示例:', importedData[0])
      
      if (!campusId) {
        message.error('请先选择神殿')
        return
      }

      // 准备要保存的数据 - 直接使用Excel导入的原始值
      const rows = importedData.map(item => {
        const phoneCallCount = item.phone_call_count || 0
        const formSubmitCount = item.form_submit_count || 0
        const privateMessageCount = item.private_message_count || 0
        // 优先使用Excel中直接解析的抖音咨询量，仅在缺失时才从组件字段计算
        const consultCount = item.consult_count || item.effective_consult_count || (phoneCallCount + formSubmitCount + privateMessageCount)
        
        return {
          date: item.date,
          actual_income: item.actual_income || 0,
          refund_count: item.refund_count || 0, // 从Excel导入退费数
          net_signup: item.net_signup || 0,
          gross_total: item.gross_total || 0,
          order_count: item.order_count || 0,
          visit_count: item.visit_count || 0,
          consult_count: consultCount, // 使用Excel原始值
          consumption: item.consumption || 0,
          display_count: item.display_count || 0,
          click_count: item.click_count || 0,
          conversion_count: item.conversion_count || 0,
          form_submit_count: formSubmitCount,
          private_message_count: privateMessageCount,
          phone_call_count: phoneCallCount,
          online_consult_count: 0,
          coupon_receive_count: 0,
          smart_phone_count: 0,
          effective_consult_count: consultCount,
          avg_display_price: item.avg_display_price || 0,
        }
      })

      console.log('准备保存的数据示例:', rows[0])

      try {
        // 直接保存到后端
        const response = await douyinDailyDataService.bulkSave(campusId, month, rows)
        const savedCount = (response as any).saved_count ?? (response as any).data?.saved_count ?? 0
        message.success(`抖音数据导入并保存成功，共保存 ${savedCount} 条记录`)
        
        // 导入成功后重新加载数据
        await loadData()
      } catch (error) {
        console.error('保存抖音数据失败:', error)
        message.error('抖音数据导入失败')
      }
    },
  }))

  const buildMonthData = (month: Dayjs): DouyinRow[] => {
    const start = month.startOf('month')
    const daysInMonth = start.daysInMonth()
    const rows: DouyinRow[] = []

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
      avgDisplayPrice: '0',
      conversionCount: 0,
      conversionCost: '0',
      conversionRate: '0%',
      avgConsultCost: '0',
      phoneCallCount: 0,
      tableCount: 0,
      privateMessageCount: 0,
      privateMessageCost: '0',
      exposureCount: 0,
      effectiveConsultCost: '0',
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
        avgDisplayPrice: '0',
        conversionCount: 0,
        conversionCost: '0',
        conversionRate: '0%',
        avgConsultCost: '0',
        phoneCallCount: 0,
        tableCount: 0,
        privateMessageCount: 0,
        privateMessageCost: '0',
        exposureCount: 0,
        effectiveConsultCost: '0',
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
      const response = await douyinDailyDataService.list(campusId, month)
      
      const items = response.data?.items || (response as any).items
      if (items && items.length > 0) {
        const apiData = items
        const monthData = buildMonthData(selectedMonth)
        
        const mergedData = monthData.map(row => {
          if (row.key === 'summary') return row

          const apiRow = apiData.find(item => item.date === row.key)
          if (apiRow) {
            // 直接使用后端存储的值，而不是重新计算
            const phoneCallCount = (apiRow as any).phone_call_count || 0
            const formSubmitCount = (apiRow as any).form_submit_count || 0
            const privateMessageCount = apiRow.private_message_count || 0
            // 优先使用DB存储的咨询量，其次从组件求和
            const consultCount = (apiRow as any).consult_count || (apiRow as any).effective_consult_count || (phoneCallCount + formSubmitCount + privateMessageCount)
            const consumption = parseFloat(apiRow.consumption as unknown as string) || 0
            const displayCount = apiRow.display_count || 0
            const clickCount = apiRow.click_count || 0
            const conversionCount = apiRow.conversion_count || 0
            const netSignup = apiRow.net_signup || 0
            const grossTotal = apiRow.gross_total || 0
            // 退费数：优先使用DB存储值，其次计算
            const refundCount = (apiRow as any).refund_count ?? (grossTotal - netSignup)

            const newRow = {
              ...row,
              actualIncome: parseFloat(apiRow.actual_income as unknown as string) || 0,
              refundCount,
              netSignup,
              grossTotal,
              orderCount: apiRow.order_count || 0,
              visitCount: apiRow.visit_count || 0,
              phoneCallCount,
              tableCount: formSubmitCount,
              privateMessageCount,
              consultCount,
              consumption,
              displayCount,
              clickCount,
              conversionCount,
              exposureCount: displayCount,
              // avgDisplayPrice 从后端加载
              avgDisplayPrice: (apiRow as any).avg_display_price || 0,
            }

            // 计算派生字段
            newRow.signupConversionRate = newRow.consultCount > 0 ? ((newRow.netSignup / newRow.consultCount) * 100).toFixed(2) + '%' : '0%'
            newRow.consultCost = newRow.consultCount > 0 ? (consumption / newRow.consultCount).toFixed(2) : '0'
            newRow.privateMessageCost = newRow.privateMessageCount > 0 ? (consumption / newRow.privateMessageCount).toFixed(2) : '0'
            newRow.clickRate = newRow.displayCount > 0 ? ((newRow.clickCount / newRow.displayCount) * 100).toFixed(2) + '%' : '0%'
            newRow.avgClickPrice = newRow.clickCount > 0 ? (consumption / newRow.clickCount).toFixed(2) : '0'
            newRow.conversionCost = newRow.conversionCount > 0 ? (consumption / newRow.conversionCount).toFixed(2) : '0'
            newRow.conversionRate = newRow.clickCount > 0 ? ((newRow.conversionCount / newRow.clickCount) * 100).toFixed(2) + '%' : '0%'
            newRow.effectiveConsultCost = newRow.consultCount > 0 ? (consumption / newRow.consultCount).toFixed(2) : '0'
            newRow.avgConsultCost = newRow.consultCount > 0 ? (consumption / newRow.consultCount).toFixed(2) : '0'

            return newRow
          }
          return row
        })

        // Recalculate summary row
        const dataWithoutSummary = mergedData.filter(row => row.key !== 'summary')
        const summary = calculateSummary(dataWithoutSummary)
        setData([summary, ...dataWithoutSummary])
      } else {
        setData(buildMonthData(selectedMonth))
      }
    } catch (error) {
      console.error('加载抖音数据失败:', error)
      message.error('加载数据失败')
      setData(buildMonthData(selectedMonth))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth, campusId])

  const handleUpdate = (rowKey: string, field: keyof DouyinRow, value: number) => {
  const { message } = App.useApp()
    setData((prev) => {
      const updated = prev.map((row) => {
        if (row.key === rowKey) {
          const updatedRow = { ...row, [field]: value }
          
          // 自动计算派生字段
          if (row.key !== 'summary') {
            // 退费数 = 毛报总数 - 净报名
            if (field === 'grossTotal' || field === 'netSignup') {
              updatedRow.refundCount = updatedRow.grossTotal - updatedRow.netSignup
            }
            
            // 抖音咨询量 = 抖音来电 + 抖音表单 + 抖音私信
            if (field === 'phoneCallCount' || field === 'tableCount' || field === 'privateMessageCount') {
              updatedRow.consultCount = updatedRow.phoneCallCount + updatedRow.tableCount + updatedRow.privateMessageCount
            }
            
            // 抖音报名转化率 = 净报名 / 抖音咨询量 * 100%
            if (field === 'netSignup' || field === 'consultCount' || field === 'phoneCallCount' || field === 'tableCount' || field === 'privateMessageCount') {
              if (updatedRow.consultCount > 0) {
                updatedRow.signupConversionRate = ((updatedRow.netSignup / updatedRow.consultCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.signupConversionRate = '0%'
              }
            }
            
            // 咨询量成本 = 抖音消费 / 抖音咨询量
            if (field === 'consumption' || field === 'consultCount' || field === 'phoneCallCount' || field === 'tableCount' || field === 'privateMessageCount') {
              if (updatedRow.consultCount > 0) {
                updatedRow.consultCost = (updatedRow.consumption / updatedRow.consultCount).toFixed(2)
              } else {
                updatedRow.consultCost = '0'
              }
            }
            
            // 私信留资成本 = 抖音消费 / 私信留资数
            if (field === 'consumption' || field === 'privateMessageCount') {
              if (updatedRow.privateMessageCount > 0) {
                updatedRow.privateMessageCost = (updatedRow.consumption / updatedRow.privateMessageCount).toFixed(2)
              } else {
                updatedRow.privateMessageCost = '0'
              }
            }
            
            // 点击率 = 点击次数 / 展示次数 * 100%
            if (field === 'clickCount' || field === 'displayCount') {
              if (updatedRow.displayCount > 0) {
                updatedRow.clickRate = ((updatedRow.clickCount / updatedRow.displayCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.clickRate = '0%'
              }
            }
            
            // 点击均价 = 抖音消费 / 点击次数
            if (field === 'consumption' || field === 'clickCount') {
              if (updatedRow.clickCount > 0) {
                updatedRow.avgClickPrice = (updatedRow.consumption / updatedRow.clickCount).toFixed(2)
              } else {
                updatedRow.avgClickPrice = '0'
              }
            }
            
            // 注意：平均千次展示费用(avgDisplayPrice)现在是手动输入的，不再自动计算

            // 转化成本 = 抖音消耗 / 转化数
            if (field === 'consumption' || field === 'conversionCount') {
              if (updatedRow.conversionCount > 0) {
                updatedRow.conversionCost = (updatedRow.consumption / updatedRow.conversionCount).toFixed(2)
              } else {
                updatedRow.conversionCost = '0'
              }
            }

            // 转化率% = 转化数 / 点击次数 * 100%
            if (field === 'conversionCount' || field === 'clickCount') {
              if (updatedRow.clickCount > 0) {
                updatedRow.conversionRate = ((updatedRow.conversionCount / updatedRow.clickCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.conversionRate = '0%'
              }
            }
            
            // 有效咨询量成本 = 抖音消费 / 抖音咨询量
            if (field === 'consumption' || field === 'consultCount' || field === 'phoneCallCount' || field === 'tableCount' || field === 'privateMessageCount') {
              if (updatedRow.consultCount > 0) {
                updatedRow.effectiveConsultCost = (updatedRow.consumption / updatedRow.consultCount).toFixed(2)
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
  const calculateSummary = (dataRows: DouyinRow[]): DouyinRow => {
    const summary: DouyinRow = {
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
      avgDisplayPrice: '0',
      conversionCount: 0,
      conversionCost: '0',
      conversionRate: '0%',
      avgConsultCost: '0',
      phoneCallCount: 0,
      tableCount: 0,
      privateMessageCount: 0,
      privateMessageCost: '0',
      exposureCount: 0,
      effectiveConsultCost: '0',
    }
    
    // 汇总数值字段
    let avgDisplayPriceSum = 0
    let avgDisplayPriceCount = 0
    
    dataRows.forEach(row => {
      summary.actualIncome += row.actualIncome
      summary.refundCount += row.refundCount
      summary.netSignup += row.netSignup
      summary.grossTotal += row.grossTotal
      summary.orderCount += row.orderCount
      summary.visitCount += row.visitCount
      summary.phoneCallCount += row.phoneCallCount
      summary.tableCount += row.tableCount
      summary.privateMessageCount += row.privateMessageCount
      summary.consultCount += row.consultCount
      summary.consumption += row.consumption
      summary.exposureCount += row.exposureCount
      summary.displayCount += row.displayCount
      summary.clickCount += row.clickCount
      summary.conversionCount += row.conversionCount
      
      // 计算平均千次展示费用的平均值（只统计有效数值）
      if (typeof row.avgDisplayPrice === 'number' && row.avgDisplayPrice > 0) {
        avgDisplayPriceSum += row.avgDisplayPrice
        avgDisplayPriceCount++
      } else if (typeof row.avgDisplayPrice === 'string' && row.avgDisplayPrice !== '') {
        const val = parseFloat(row.avgDisplayPrice)
        if (!isNaN(val) && val > 0) {
          avgDisplayPriceSum += val
          avgDisplayPriceCount++
        }
      }
    })
    
    // 退费数和净报名使用公式而不是简单求和（与Excel一致）
    // 退费数 = 毛报总数 - 净报名
    summary.refundCount = summary.grossTotal - summary.netSignup
    
    // 计算汇总的派生字段
    if (summary.consultCount > 0) {
      summary.signupConversionRate = ((summary.netSignup / summary.consultCount) * 100).toFixed(2) + '%'
      summary.consultCost = (summary.consumption / summary.consultCount).toFixed(2)
    } else {
      summary.signupConversionRate = '0%'
      summary.consultCost = '0'
    }
    
    if (summary.privateMessageCount > 0) {
      summary.privateMessageCost = (summary.consumption / summary.privateMessageCount).toFixed(2)
    } else {
      summary.privateMessageCost = '0'
    }
    
    if (summary.displayCount > 0) {
      summary.clickRate = ((summary.clickCount / summary.displayCount) * 100).toFixed(2) + '%'
    } else {
      summary.clickRate = '0%'
    }
    
    // 平均千次展示费用：计算所有日期的平均值
    if (avgDisplayPriceCount > 0) {
      summary.avgDisplayPrice = (avgDisplayPriceSum / avgDisplayPriceCount).toFixed(2)
    } else {
      summary.avgDisplayPrice = '0'
    }
    
    if (summary.clickCount > 0) {
      summary.avgClickPrice = (summary.consumption / summary.clickCount).toFixed(2)
      summary.conversionRate = ((summary.conversionCount / summary.clickCount) * 100).toFixed(2) + '%'
    } else {
      summary.avgClickPrice = '0'
      summary.conversionRate = '0%'
    }
    
    if (summary.conversionCount > 0) {
      summary.conversionCost = (summary.consumption / summary.conversionCount).toFixed(2)
    } else {
      summary.conversionCost = '0'
    }
    
    if (summary.consultCount > 0) {
      summary.effectiveConsultCost = (summary.consumption / summary.consultCount).toFixed(2)
      summary.avgConsultCost = (summary.consumption / summary.consultCount).toFixed(2)
    } else {
      summary.effectiveConsultCost = '0'
      summary.avgConsultCost = '0'
    }
    
    return summary
  }

  const renderEditableNumber = (record: DouyinRow, field: keyof DouyinRow) => {
    // 判断是否需要显示两位小数
    const needDecimal = field === 'consumption' || field === 'avgDisplayPrice'
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

  const columns: ColumnsType<DouyinRow> = useMemo(
    () => [
      {
        title: '星期',
        dataIndex: 'weekday',
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#00B050', color: '#000', fontWeight: 'bold' },
        }),
      },
      {
        title: '日期',
        dataIndex: 'dateText',
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#92D050', color: '#000', fontWeight: 'bold' },
        }),
        render: (val: string, record: DouyinRow) =>
          record.key === 'summary' ? <span style={{ fontWeight: 'bold' }}>{val}</span> : val,
      },
      {
        title: '新媒体-抖音汇总数据',
        children: [
          {
            title: '抖音实际收入',
            dataIndex: 'actualIncome',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) => renderEditableNumber(record, 'actualIncome'),
          },
          {
            title: '抖音报名转化率',
            dataIndex: 'signupConversionRate',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (text: string, record: DouyinRow) => (
              <span style={{ color: text === '0%' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '退费数',
            dataIndex: 'refundCount',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) => renderEditableNumber(record, 'refundCount'),
          },
          {
            title: '净报名',
            dataIndex: 'netSignup',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) => renderEditableNumber(record, 'netSignup'),
          },
          {
            title: '毛报总数',
            dataIndex: 'grossTotal',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) => renderEditableNumber(record, 'grossTotal'),
          },
          {
            title: '订座数',
            dataIndex: 'orderCount',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) => renderEditableNumber(record, 'orderCount'),
          },
          {
            title: '上门人数',
            dataIndex: 'visitCount',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) => renderEditableNumber(record, 'visitCount'),
          },
          {
            title: '抖音咨询量',
            dataIndex: 'consultCount',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) => renderEditableNumber(record, 'consultCount'),
          },
          {
            title: '咨询量成本',
            dataIndex: 'consultCost',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (text: string, record: DouyinRow) => (
              <span style={{ color: text === '0' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '抖音消耗',
            dataIndex: 'consumption',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) => renderEditableNumber(record, 'consumption'),
          },
        ],
      },
      {
        title: '抖音-基础数据',
        children: [
          {
            title: '展示次数',
            dataIndex: 'displayCount',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) => renderEditableNumber(record, 'displayCount'),
          },
          {
            title: '点击次数',
            dataIndex: 'clickCount',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) => renderEditableNumber(record, 'clickCount'),
          },
          {
            title: '点击率',
            dataIndex: 'clickRate',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (text: string, record: DouyinRow) => (
              <span style={{ color: text === '0%' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '平均千次展示费用',
            dataIndex: 'avgDisplayPrice',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) => renderEditableNumber(record, 'avgDisplayPrice'),
          },
          {
            title: '点击均价',
            dataIndex: 'avgClickPrice',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (text: string, record: DouyinRow) => (
              <span style={{ color: text === '0' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
        ],
      },
      {
        title: '抖音-转化数据',
        children: [
          {
            title: '转化数',
            dataIndex: 'conversionCount',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) =>
              renderEditableNumber(record, 'conversionCount'),
          },
          {
            title: '转化成本',
            dataIndex: 'conversionCost',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (text: string, record: DouyinRow) => (
              <span style={{ color: text === '0' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '转化率%',
            dataIndex: 'conversionRate',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (text: string, record: DouyinRow) => (
              <span style={{ color: text === '0%' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '抖音来电',
            dataIndex: 'phoneCallCount',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) => renderEditableNumber(record, 'phoneCallCount'),
          },
          {
            title: '抖音表单',
            dataIndex: 'tableCount',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) => renderEditableNumber(record, 'tableCount'),
          },
          {
            title: '抖音私信',
            dataIndex: 'privateMessageCount',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: DouyinRow) => renderEditableNumber(record, 'privateMessageCount'),
          },
          {
            title: '咨询量成本',
            dataIndex: 'effectiveConsultCost',
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (text: string, record: DouyinRow) => (
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
      
      // 准备要保存的数据（排除汇总行）
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
          conversion_count: row.conversionCount,
          form_submit_count: row.tableCount,
          private_message_count: row.privateMessageCount,
          phone_call_count: row.phoneCallCount,
          online_consult_count: 0,
          coupon_receive_count: 0,
          smart_phone_count: 0,
          effective_consult_count: 0,
          avg_display_price: typeof row.avgDisplayPrice === 'string' 
            ? parseFloat(row.avgDisplayPrice) || 0 
            : row.avgDisplayPrice || 0,
        }))

      const response = await douyinDailyDataService.bulkSave(campusId, month, rows)
      const savedCount = (response as any).saved_count ?? (response as any).data?.saved_count ?? 0
      message.success(`抖音数据保存成功，共保存 ${savedCount} 条记录`)
      
      // 重新加载数据
      await loadData()
    } catch (error) {
      console.error('保存抖音数据失败:', error)
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
        tableLayout="auto"
      />
    </div>
  )
})

DouyinTab.displayName = 'DouyinTab'

export default DouyinTab
