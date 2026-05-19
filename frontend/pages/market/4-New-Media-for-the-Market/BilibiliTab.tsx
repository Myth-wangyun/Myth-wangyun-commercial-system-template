import React, { useMemo, useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { App, Button, InputNumber, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { bilibiliDailyDataService } from '@/services/market/marketBilibiliDailyData'
import type { TabRef } from './index'

interface BilibiliTabProps {
  campusId: string
  selectedMonth: Dayjs
}

interface BilibiliRow {
  key: string
  weekday: string
  dateText: string
  // B站-汇总数据
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
  // B站-基础数据
  displayCount: number
  clickCount: number
  clickRate: string
  singleClickPrice: string
  thousandDisplayPrice: string
  // B站-转化数据
  tableCount: number
  conversionCount: number
  conversionCost: string
  avgConversionRate: string
  effectiveConsultCount: number
  effectiveConsultCost: string
}

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const BilibiliTab = forwardRef<TabRef, BilibiliTabProps>(({ campusId, selectedMonth }, ref) => {
  const { message } = App.useApp()
  const [data, setData] = useState<BilibiliRow[]>([])
  const [loading, setLoading] = useState(false)

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    setMonth: (month: string) => {
      console.log('BilibiliTab setMonth被调用:', month)
      // 月份由父组件管理，这里不需要做任何事
    },
    importData: async (importedData: any[], month: string) => {
      console.log('BilibiliTab importData被调用，数据条数:', importedData.length, '月份:', month)
      
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
        single_click_price: 0,
        thousand_display_price: item.thousand_display_price || 0,
        table_count: item.table_count || 0,
        conversion_count: item.conversion_count || 0,
        effective_consult_count: item.consult_count || 0,
      }))

      try {
        // 直接保存到后端
        const response = await bilibiliDailyDataService.bulkSave(campusId, month, rows)
        const savedCount = (response as any).saved_count ?? (response as any).data?.saved_count ?? 0
        message.success(`B站数据导入并保存成功，共保存 ${savedCount} 条记录`)
        
        // 导入成功后重新加载数据
        await loadData()
      } catch (error) {
        console.error('保存B站数据失败:', error)
        message.error('B站数据导入失败')
      }
    },
  }))

  const buildMonthData = (month: Dayjs): BilibiliRow[] => {
    const start = month.startOf('month')
    const daysInMonth = start.daysInMonth()
    const rows: BilibiliRow[] = []

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
      singleClickPrice: '0',
      thousandDisplayPrice: '0',
      tableCount: 0,
      conversionCount: 0,
      conversionCost: '0',
      avgConversionRate: '0%',
      effectiveConsultCount: 0,
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
        singleClickPrice: '0',
        thousandDisplayPrice: '0',
        tableCount: 0,
        conversionCount: 0,
        conversionCost: '0',
        avgConversionRate: '0%',
        effectiveConsultCount: 0,
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
      const response = await bilibiliDailyDataService.list(campusId, month)
      
      const items = response.data?.items || (response as any).items
      if (items && items.length > 0) {
        // 将API数据转换为表格数据
        const apiData = items
        const monthData = buildMonthData(selectedMonth)
        
        // 合并API数据到月度数据
        const mergedData = monthData.map(row => {
          if (row.key === 'summary') return row
          
          const apiRow = apiData.find(item => item.date === row.key)
          if (apiRow) {
            const actualIncome = parseFloat(apiRow.actual_income as unknown as string) || 0
            const consumption = parseFloat(apiRow.consumption as unknown as string) || 0
            const effectiveConsultCount = apiRow.effective_consult_count || 0
            const consultCount = effectiveConsultCount // B站咨询量 = 有效咨询量
            const displayCount = apiRow.display_count || 0
            const clickCount = apiRow.click_count || 0
            const conversionCount = apiRow.conversion_count || 0
            
            // 计算派生字段
            let signupConversionRate = ''
            if (consultCount > 0) {
              signupConversionRate = ((apiRow.net_signup / consultCount) * 100).toFixed(2) + '%'
            }
            
            let consultCost = ''
            if (consultCount > 0) {
              consultCost = (consumption / consultCount).toFixed(2)
            }
            
            let clickRate = ''
            if (displayCount > 0) {
              clickRate = ((clickCount / displayCount) * 100).toFixed(2) + '%'
            }
            
            let singleClickPrice = ''
            if (clickCount > 0) {
              singleClickPrice = (consumption / clickCount).toFixed(2)
            }
            
            // 千次展示价格现在从后端加载或手动输入
            const thousandDisplayPrice = (apiRow as any).thousand_display_price || 0
            
            let conversionCost = ''
            if (conversionCount > 0) {
              conversionCost = (consumption / conversionCount).toFixed(2)
            }
            
            // 转化率% = 转化数 / 点击量 * 100%
            let conversionRate = ''
            if (clickCount > 0) {
              conversionRate = ((conversionCount / clickCount) * 100).toFixed(2) + '%'
            }
            
            let effectiveConsultCost = ''
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
              singleClickPrice,
              thousandDisplayPrice,
              tableCount: apiRow.table_count,
              conversionCount,
              conversionCost,
              conversionRate,
              effectiveConsultCount,
              effectiveConsultCost,
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
      console.error('加载B站数据失败:', error)
      message.error('加载数据失败')
      setData(buildMonthData(selectedMonth))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth, campusId])

  const handleUpdate = (rowKey: string, field: keyof BilibiliRow, value: number) => {
    setData((prev) => {
      const updated = prev.map((row) => {
        if (row.key === rowKey) {
          const updatedRow = { ...row, [field]: value }
          
          // 自动计算派生字段
          if (row.key !== 'summary') {
            // B站咨询量 = 有效咨询量（同步）
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
            
            // B站报名转化率 = 净报名 / B站咨询量 * 100%
            if (field === 'netSignup' || field === 'consultCount' || field === 'effectiveConsultCount') {
              if (updatedRow.consultCount > 0) {
                updatedRow.signupConversionRate = ((updatedRow.netSignup / updatedRow.consultCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.signupConversionRate = '0%'
              }
            }
            
            // 咨询量成本 = B站花费 / B站咨询量
            if (field === 'consumption' || field === 'consultCount' || field === 'effectiveConsultCount') {
              if (updatedRow.consultCount > 0) {
                updatedRow.consultCost = (updatedRow.consumption / updatedRow.consultCount).toFixed(2)
              } else {
                updatedRow.consultCost = '0'
              }
            }
            
            // 点击率 = 点击量 / 展示量 * 100%
            if (field === 'clickCount' || field === 'displayCount') {
              if (updatedRow.displayCount > 0) {
                updatedRow.clickRate = ((updatedRow.clickCount / updatedRow.displayCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.clickRate = '0%'
              }
            }
            
            // 单次点击价格 = B站花费 / 点击量
            if (field === 'consumption' || field === 'clickCount') {
              if (updatedRow.clickCount > 0) {
                updatedRow.singleClickPrice = (updatedRow.consumption / updatedRow.clickCount).toFixed(2)
              } else {
                updatedRow.singleClickPrice = '0'
              }
            }
            
            // 注意：千次展示价格(thousandDisplayPrice)现在是手动输入的，不再自动计算
            
            // 平均转化成本 = B站花费 / 转化数
            if (field === 'consumption' || field === 'conversionCount') {
              if (updatedRow.conversionCount > 0) {
                updatedRow.conversionCost = (updatedRow.consumption / updatedRow.conversionCount).toFixed(2)
              } else {
                updatedRow.conversionCost = '0'
              }
            }
            
            // 转化率% = 转化数 / 点击量 * 100%
            if (field === 'conversionCount' || field === 'clickCount') {
              if (updatedRow.clickCount > 0) {
                updatedRow.avgConversionRate = ((updatedRow.conversionCount / updatedRow.clickCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.avgConversionRate = '0%'
              }
            }
            
            // 有效咨询量成本 = B站花费 / 有效咨询量
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
  const calculateSummary = (dataRows: BilibiliRow[]): BilibiliRow => {
    const summary: BilibiliRow = {
      key: 'summary',
      weekday: '',
      dateText: '汇总',
      actualIncome: 0,
      signupConversionRate: '',
      refundCount: 0,
      netSignup: 0,
      grossTotal: 0,
      orderCount: 0,
      visitCount: 0,
      consultCount: 0,
      consultCost: '',
      consumption: 0,
      displayCount: 0,
      clickCount: 0,
      clickRate: '',
      singleClickPrice: '',
      thousandDisplayPrice: '',
      tableCount: 0,
      conversionCount: 0,
      conversionCost: '',
      avgConversionRate: '',
      effectiveConsultCount: 0,
      effectiveConsultCost: '',
    }
    
    // 汇总数值字段
    let thousandDisplayPriceSum = 0
    let thousandDisplayPriceCount = 0
    
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
      summary.conversionCount += row.conversionCount
      summary.effectiveConsultCount += row.effectiveConsultCount
      
      // 计算千次展示价格的平均值（只统计有效数值）
      if (typeof row.thousandDisplayPrice === 'number' && row.thousandDisplayPrice > 0) {
        thousandDisplayPriceSum += row.thousandDisplayPrice
        thousandDisplayPriceCount++
      } else if (typeof row.thousandDisplayPrice === 'string' && row.thousandDisplayPrice !== '') {
        const val = parseFloat(row.thousandDisplayPrice)
        if (!isNaN(val) && val > 0) {
          thousandDisplayPriceSum += val
          thousandDisplayPriceCount++
        }
      }
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
    } else {
      summary.clickRate = '0%'
    }
    
    // 千次展示价格：计算所有日期的平均值
    if (thousandDisplayPriceCount > 0) {
      summary.thousandDisplayPrice = (thousandDisplayPriceSum / thousandDisplayPriceCount).toFixed(2)
    } else {
      summary.thousandDisplayPrice = '0'
    }
    
    if (summary.clickCount > 0) {
      summary.singleClickPrice = (summary.consumption / summary.clickCount).toFixed(2)
      // 转化率% = 转化数 / 点击量 * 100%
      summary.avgConversionRate = ((summary.conversionCount / summary.clickCount) * 100).toFixed(2) + '%'
    } else {
      summary.singleClickPrice = '0'
      summary.avgConversionRate = '0%'
    }
    
    if (summary.conversionCount > 0) {
      summary.conversionCost = (summary.consumption / summary.conversionCount).toFixed(2)
    } else {
      summary.conversionCost = '0'
    }
    
    if (summary.effectiveConsultCount > 0) {
      summary.effectiveConsultCost = (summary.consumption / summary.effectiveConsultCount).toFixed(2)
    } else {
      summary.effectiveConsultCost = '0'
    }
    
    return summary
  }

  const renderEditableNumber = (record: BilibiliRow, field: keyof BilibiliRow) => {
    // 判断是否需要显示两位小数
    const needDecimal = field === 'consumption' || field === 'thousandDisplayPrice'
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

  const columns: ColumnsType<BilibiliRow> = useMemo(
    () => [
      {
        title: '星期',
        dataIndex: 'weekday',
        width: 50,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#00B050', color: '#000', fontWeight: 'bold' },
        }),
      },
      {
        title: '日期',
        dataIndex: 'dateText',
        width: 70,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#92D050', color: '#000', fontWeight: 'bold' },
        }),
        render: (val: string, record: BilibiliRow) =>
          record.key === 'summary' ? <span style={{ fontWeight: 'bold' }}>{val}</span> : val,
      },
      {
        title: '新媒体-B站汇总数据',
        children: [
          {
            title: 'B站实际收入',
            dataIndex: 'actualIncome',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: BilibiliRow) =>
              renderEditableNumber(record, 'actualIncome'),
          },
          {
            title: 'B站报名转化率',
            dataIndex: 'signupConversionRate',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (text: string, record: BilibiliRow) => (
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
            render: (_: unknown, record: BilibiliRow) => renderEditableNumber(record, 'refundCount'),
          },
          {
            title: '净报名',
            dataIndex: 'netSignup',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: BilibiliRow) => renderEditableNumber(record, 'netSignup'),
          },
          {
            title: '毛报总数',
            dataIndex: 'grossTotal',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: BilibiliRow) => renderEditableNumber(record, 'grossTotal'),
          },
          {
            title: '订座数',
            dataIndex: 'orderCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: BilibiliRow) => renderEditableNumber(record, 'orderCount'),
          },
          {
            title: '上门人数',
            dataIndex: 'visitCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: BilibiliRow) => renderEditableNumber(record, 'visitCount'),
          },
          {
            title: 'B站咨询量',
            dataIndex: 'consultCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: BilibiliRow) =>
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
            render: (text: string, record: BilibiliRow) => (
              <span style={{ color: text === '0' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: 'B站花费',
            dataIndex: 'consumption',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: BilibiliRow) => renderEditableNumber(record, 'consumption'),
          },
        ],
      },
      {
        title: 'B站-基础数据',
        children: [
          {
            title: '展示量',
            dataIndex: 'displayCount',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: BilibiliRow) =>
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
            render: (_: unknown, record: BilibiliRow) => renderEditableNumber(record, 'clickCount'),
          },
          {
            title: '点击率',
            dataIndex: 'clickRate',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (text: string, record: BilibiliRow) => (
              <span style={{ color: text === '0%' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '单次点击价格',
            dataIndex: 'singleClickPrice',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (text: string, record: BilibiliRow) => (
              <span style={{ color: text === '0' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '千次展示价格',
            dataIndex: 'thousandDisplayPrice',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: BilibiliRow) =>
              renderEditableNumber(record, 'thousandDisplayPrice'),
          },
        ],
      },
      {
        title: 'B站-转化数据',
        children: [
          {
            title: '表单',
            dataIndex: 'tableCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: BilibiliRow) => renderEditableNumber(record, 'tableCount'),
          },
          {
            title: '转化数',
            dataIndex: 'conversionCount',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: BilibiliRow) =>
              renderEditableNumber(record, 'conversionCount'),
          },
          {
            title: '平均转化成本',
            dataIndex: 'conversionCost',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (text: string, record: BilibiliRow) => (
              <span style={{ color: text === '0' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '转化率%',
            dataIndex: 'avgConversionRate',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (text: string, record: BilibiliRow) => (
              <span style={{ color: text === '0%' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
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
            render: (_: unknown, record: BilibiliRow) =>
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
            render: (text: string, record: BilibiliRow) => (
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
          single_click_price: typeof row.singleClickPrice === 'string' ? parseFloat(row.singleClickPrice) || 0 : row.singleClickPrice || 0,
          thousand_display_price: typeof row.thousandDisplayPrice === 'number' ? row.thousandDisplayPrice : 0,
          table_count: row.tableCount,
          conversion_count: row.conversionCount,
          effective_consult_count: row.effectiveConsultCount,
        }))

      const response = await bilibiliDailyDataService.bulkSave(campusId, month, rows)
      const savedCount = (response as any).saved_count ?? (response as any).data?.saved_count ?? 0
      message.success(`B站数据保存成功，共保存 ${savedCount} 条记录`)
      
      // 重新加载数据
      await loadData()
    } catch (error) {
      console.error('保存B站数据失败:', error)
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

BilibiliTab.displayName = 'BilibiliTab'

export default BilibiliTab
