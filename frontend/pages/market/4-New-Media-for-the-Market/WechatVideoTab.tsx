import React, { useMemo, useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import { App, Button, InputNumber, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { wechatVideoDailyDataService } from '@/services/market/marketWechatVideoDailyData'
import type { TabRef } from './index'

interface WechatVideoTabProps {
  campusId: string
  selectedMonth: Dayjs
}

interface WechatVideoRow {
  key: string
  weekday: string
  dateText: string
  // 微信视频号-汇总数据
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
  // 微信视频号-基础数据
  displayCount: number
  thousandDisplayPrice: number | string  // 改为可以是数字或字符串
  clickCount: number
  clickRate: string
  clickPrice: string
  // 微信视频号-转化数据
  targetConversionCount: number
  targetConversionRate: string
  tableCount: number
  effectiveConsultCount: number
  effectiveConsultCost: string
  // 微信视频号-额外字段
  singleClickPrice: string
  conversionCount: number
  conversionCost: string
  conversionRate: string
}

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const WechatVideoTab = forwardRef<TabRef, WechatVideoTabProps>(({ campusId, selectedMonth }, ref) => {
  const { message } = App.useApp()
  const [data, setData] = useState<WechatVideoRow[]>([])
  const [loading, setLoading] = useState(false)

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    setMonth: (month: string) => {
      console.log('WechatVideoTab setMonth被调用:', month)
      // 月份由父组件管理，这里不需要做任何事
    },
    importData: async (importedData: any[], month: string) => {
      console.log('WechatVideoTab importData被调用，数据条数:', importedData.length, '月份:', month)
      
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
        thousand_display_price: item.thousand_display_price || 0,
        click_count: item.click_count || 0,
        target_conversion_count: item.target_conversion_count || 0,
        table_count: item.table_count || 0,
        effective_consult_count: item.consult_count || 0,
      }))

      try {
        // 直接保存到后端
        const response = await wechatVideoDailyDataService.bulkSave(campusId, month, rows)
        const savedCount = (response as any).saved_count ?? (response as any).data?.saved_count ?? 0
        message.success(`微信视频号数据导入并保存成功，共保存 ${savedCount} 条记录`)
        
        // 导入成功后重新加载数据
        await loadData()
      } catch (error) {
        console.error('保存微信视频号数据失败:', error)
        message.error('微信视频号数据导入失败')
      }
    },
  }))

  const buildMonthData = (month: Dayjs): WechatVideoRow[] => {
    const start = month.startOf('month')
    const daysInMonth = start.daysInMonth()
    const rows: WechatVideoRow[] = []

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
      thousandDisplayPrice: 0,
      clickCount: 0,
      clickRate: '0%',
      clickPrice: '0',
      targetConversionCount: 0,
      targetConversionRate: '0%',
      tableCount: 0,
      effectiveConsultCount: 0,
      effectiveConsultCost: '0',
      singleClickPrice: '0',
      conversionCount: 0,
      conversionCost: '0',
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
        thousandDisplayPrice: 0,
        clickCount: 0,
        clickRate: '0%',
        clickPrice: '0',
        targetConversionCount: 0,
        targetConversionRate: '0%',
        tableCount: 0,
        effectiveConsultCount: 0,
        effectiveConsultCost: '0',
        singleClickPrice: '0',
        conversionCount: 0,
        conversionCost: '0',
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
      const response = await wechatVideoDailyDataService.list(campusId, month)
      
      const items = response.data?.items || (response as any).items
      if (items && items.length > 0) {
        const apiData = items
        const monthData = buildMonthData(selectedMonth)
        
        const mergedData = monthData.map(row => {
          if (row.key === 'summary') return row

          const apiRow = apiData.find(item => item.date === row.key)
          if (apiRow) {
            const newRow = {
              ...row,
              actualIncome: parseFloat(apiRow.actual_income as unknown as string) || 0,
              // refundCount: apiRow.refund_count, // calculated
              netSignup: apiRow.net_signup,
              grossTotal: apiRow.gross_total,
              orderCount: apiRow.order_count,
              visitCount: apiRow.visit_count,
              effectiveConsultCount: apiRow.effective_consult_count,
              consultCount: apiRow.effective_consult_count, // 微信视频号总量 = 有效咨询量
              consumption: parseFloat(apiRow.consumption as unknown as string) || 0,
              displayCount: apiRow.display_count,
              clickCount: apiRow.click_count,
              targetConversionCount: apiRow.target_conversion_count,
              tableCount: apiRow.table_count,
              // 从后端加载千次展现均价（如果有的话）
              thousandDisplayPrice: (apiRow as any).thousand_display_price || 0,
            }

            // derived
            newRow.refundCount = newRow.grossTotal - newRow.netSignup

            newRow.signupConversionRate = newRow.consultCount > 0 ? ((newRow.netSignup / newRow.consultCount) * 100).toFixed(2) + '%' : '0%'
            newRow.consultCost = newRow.consultCount > 0 ? (newRow.consumption / newRow.consultCount).toFixed(2) : '0'
            newRow.clickRate = newRow.displayCount > 0 ? ((newRow.clickCount / newRow.displayCount) * 100).toFixed(2) + '%' : '0%'
            // 注意：千次展现均价现在从后端加载或手动输入，不再自动计算
            newRow.clickPrice = newRow.clickCount > 0 ? (newRow.consumption / newRow.clickCount).toFixed(2) : '0'
            newRow.singleClickPrice = newRow.clickCount > 0 ? (newRow.consumption / newRow.clickCount).toFixed(2) : '0'

            // WechatVideo conversionCount is not loaded/saved in current code (no apiRow.conversion_count)
            newRow.conversionCount = 0
            newRow.conversionCost = '0'
            newRow.conversionRate = '0%'

            newRow.targetConversionRate = newRow.clickCount > 0 ? ((newRow.targetConversionCount / newRow.clickCount) * 100).toFixed(2) + '%' : '0%'
            newRow.effectiveConsultCost = newRow.effectiveConsultCount > 0 ? (newRow.consumption / newRow.effectiveConsultCount).toFixed(2) : '0'

            return newRow
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
      console.error('加载微信视频号数据失败:', error)
      message.error('加载数据失败')
      setData(buildMonthData(selectedMonth))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth, campusId])

  const handleUpdate = (rowKey: string, field: keyof WechatVideoRow, value: number) => {
    setData((prev) => {
      const updated = prev.map((row) => {
        if (row.key === rowKey) {
          const updatedRow = { ...row, [field]: value }
          
          // 自动计算派生字段
          if (row.key !== 'summary') {
            // 微信视频号总量 = 有效咨询量（同步）
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
            
            // 微信视频号报名转化率 = 净报名 / 微信视频号咨询量 * 100%
            if (field === 'netSignup' || field === 'consultCount' || field === 'effectiveConsultCount') {
              if (updatedRow.consultCount > 0) {
                updatedRow.signupConversionRate = ((updatedRow.netSignup / updatedRow.consultCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.signupConversionRate = '0%'
              }
            }
            
            // 咨询量成本 = 微信视频号消费 / 微信视频号咨询量
            if (field === 'consumption' || field === 'consultCount' || field === 'effectiveConsultCount') {
              if (updatedRow.consultCount > 0) {
                updatedRow.consultCost = (updatedRow.consumption / updatedRow.consultCount).toFixed(2)
              } else {
                updatedRow.consultCost = '0'
              }
            }
            
            // 点击率 = 点击量 / 曝光次数(displayCount) * 100%
            if (field === 'clickCount' || field === 'displayCount') {
              if (updatedRow.displayCount > 0) {
                updatedRow.clickRate = ((updatedRow.clickCount / updatedRow.displayCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.clickRate = '0%'
              }
            }
            
            // 点击均价 = 微信视频号消费 / 点击次数
            if (field === 'consumption' || field === 'clickCount') {
              if (updatedRow.clickCount > 0) {
                updatedRow.clickPrice = (updatedRow.consumption / updatedRow.clickCount).toFixed(2)
              } else {
                updatedRow.clickPrice = '0'
              }
            }
            
            // 单次点击价格 = 微信视频号消费 / 点击量
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
            
            // 目标转化率 = 目标转化量 / 点击次数 * 100%
            if (field === 'targetConversionCount' || field === 'clickCount') {
              if (updatedRow.clickCount > 0) {
                updatedRow.targetConversionRate = ((updatedRow.targetConversionCount / updatedRow.clickCount) * 100).toFixed(2) + '%'
              } else {
                updatedRow.targetConversionRate = '0%'
              }
            }
            
            // 有效咨询量成本 = 微信视频号消费 / 有效咨询量
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

  const calculateSummary = (dataRows: WechatVideoRow[]): WechatVideoRow => {
    const summary: WechatVideoRow = {
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
      thousandDisplayPrice: 0,
      clickCount: 0,
      clickRate: '0%',
      clickPrice: '0',
      targetConversionCount: 0,
      targetConversionRate: '0%',
      tableCount: 0,
      effectiveConsultCount: 0,
      effectiveConsultCost: '0',
      singleClickPrice: '0',
      conversionCount: 0,
      conversionCost: '0',
      conversionRate: '0%',
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
      summary.targetConversionCount += row.targetConversionCount
      summary.tableCount += row.tableCount
      summary.effectiveConsultCount += row.effectiveConsultCount
      // summary.exposureCount += row.exposureCount
      summary.conversionCount += row.conversionCount
      
      // 计算千次展现均价的平均值（只统计有效数值）
      if (typeof row.thousandDisplayPrice === 'number' && row.thousandDisplayPrice > 0) {
        thousandDisplayPriceSum += row.thousandDisplayPrice
        thousandDisplayPriceCount++
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
    
    // 千次展现均价：计算所有日期的平均值
    if (thousandDisplayPriceCount > 0) {
      summary.thousandDisplayPrice = parseFloat((thousandDisplayPriceSum / thousandDisplayPriceCount).toFixed(2))
    } else {
      summary.thousandDisplayPrice = 0
    }
    
    if (summary.clickCount > 0) {
      summary.clickPrice = (summary.consumption / summary.clickCount).toFixed(2)
      summary.singleClickPrice = (summary.consumption / summary.clickCount).toFixed(2)
      summary.conversionRate = ((summary.conversionCount / summary.clickCount) * 100).toFixed(2) + '%'
      summary.targetConversionRate = ((summary.targetConversionCount / summary.clickCount) * 100).toFixed(2) + '%'
    } else {
      summary.clickPrice = '0'
      summary.singleClickPrice = '0'
      summary.conversionRate = '0%'
      summary.targetConversionRate = '0%'
    }
    
    if (summary.effectiveConsultCount > 0) {
      summary.effectiveConsultCost = (summary.consumption / summary.effectiveConsultCount).toFixed(2)
    } else {
      summary.effectiveConsultCost = '0'
    }
    
    return summary
  }

  const renderEditableNumber = (record: WechatVideoRow, field: keyof WechatVideoRow) => {
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

  const columns: ColumnsType<WechatVideoRow> = useMemo(
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
        render: (val: string, record: WechatVideoRow) =>
          record.key === 'summary' ? <span style={{ fontWeight: 'bold' }}>{val}</span> : val,
      },
      {
        title: '新媒体-微信视频号汇总数据',
        children: [
          {
            title: '微信视频号实际收入',
            dataIndex: 'actualIncome',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: WechatVideoRow) =>
              renderEditableNumber(record, 'actualIncome'),
          },
          {
            title: '微信视频号报名转化率',
            dataIndex: 'signupConversionRate',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (text: string, record: WechatVideoRow) => (
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
            render: (_: unknown, record: WechatVideoRow) =>
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
            render: (_: unknown, record: WechatVideoRow) =>
              renderEditableNumber(record, 'netSignup'),
          },
          {
            title: '毛报总数',
            dataIndex: 'grossTotal',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: WechatVideoRow) =>
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
            render: (_: unknown, record: WechatVideoRow) =>
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
            render: (_: unknown, record: WechatVideoRow) =>
              renderEditableNumber(record, 'visitCount'),
          },
          {
            title: '微信视频号总量',
            dataIndex: 'consultCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: WechatVideoRow) =>
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
            render: (text: string, record: WechatVideoRow) => (
              <span style={{ color: text === '0' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '微信视频号消费',
            dataIndex: 'consumption',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: WechatVideoRow) =>
              renderEditableNumber(record, 'consumption'),
          },
        ],
      },
      {
        title: '微信视频号-基础数据',
        children: [
          {
            title: '曝光次数',
            dataIndex: 'displayCount',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: WechatVideoRow) =>
              renderEditableNumber(record, 'displayCount'),
          },
          {
            title: '千次展现均价',
            dataIndex: 'thousandDisplayPrice',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: WechatVideoRow) =>
              renderEditableNumber(record, 'thousandDisplayPrice'),
          },
          {
            title: '点击次数',
            dataIndex: 'clickCount',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: WechatVideoRow) =>
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
            render: (text: string, record: WechatVideoRow) => (
              <span style={{ color: text === '0%' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '点击均价',
            dataIndex: 'clickPrice',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#00B050', color: '#FFF', fontWeight: 'bold' },
            }),
            render: (text: string, record: WechatVideoRow) => (
              <span style={{ color: text === '0' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
        ],
      },
      {
        title: '微信视频号-转化数据',
        children: [
          {
            title: '目标转化量',
            dataIndex: 'targetConversionCount',
            width: 60,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: WechatVideoRow) =>
              renderEditableNumber(record, 'targetConversionCount'),
          },
          {
            title: '目标转化率',
            dataIndex: 'targetConversionRate',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (text: string, record: WechatVideoRow) => (
              <span style={{ color: text === '0%' ? '#999' : 'inherit', fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
                {text}
              </span>
            ),
          },
          {
            title: '表单',
            dataIndex: 'tableCount',
            width: 50,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: WechatVideoRow) =>
              renderEditableNumber(record, 'tableCount'),
          },
          {
            title: '有效咨询量',
            dataIndex: 'effectiveConsultCount',
            width: 70,
            align: 'center',
            onHeaderCell: () => ({
              style: { backgroundColor: '#FFC000', color: '#000', fontWeight: 'bold' },
            }),
            render: (_: unknown, record: WechatVideoRow) =>
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
            render: (text: string, record: WechatVideoRow) => (
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
          target_conversion_count: row.targetConversionCount,
          table_count: row.tableCount,
          effective_consult_count: row.effectiveConsultCount,
          thousand_display_price: typeof row.thousandDisplayPrice === 'number' ? row.thousandDisplayPrice : 0,
        }))

      const response = await wechatVideoDailyDataService.bulkSave(campusId, month, rows)
      const savedCount = (response as any).saved_count ?? (response as any).data?.saved_count ?? 0
      message.success(`微信视频号数据保存成功，共保存 ${savedCount} 条记录`)
      await loadData()
    } catch (error) {
      console.error('保存微信视频号数据失败:', error)
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

WechatVideoTab.displayName = 'WechatVideoTab'

export default WechatVideoTab
