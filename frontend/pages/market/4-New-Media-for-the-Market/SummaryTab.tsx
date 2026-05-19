import React, { useMemo, useState, useEffect } from 'react'
import { App, Button, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { type Dayjs } from 'dayjs'
import { douyinDailyDataService } from '@/services/market/marketDouyinDailyData'
import { kuaishouDailyDataService } from '@/services/market/marketKuaishouDailyData'
import { bilibiliDailyDataService } from '@/services/market/marketBilibiliDailyData'
import { xiaohongshuDailyDataService } from '@/services/market/marketXiaohongshuDailyData'
import { wechatVideoDailyDataService } from '@/services/market/marketWechatVideoDailyData'

interface SummaryTabProps {
  campusId: string
  selectedMonth: Dayjs
}

interface SummaryRow {
  key: string
  weekday: string
  dateText: string
  actualIncome: number
  signupConversionRate: string
  refundCount: number
  netSignup: number
  grossTotal: number
  orderCount: number
  visitCount: number
  actualConsultCount: number
  consultCost: string
  consumption: number
}

const weekdayMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

const SummaryTab: React.FC<SummaryTabProps> = ({ campusId, selectedMonth }) => {
  const { message } = App.useApp()
  const [data, setData] = useState<SummaryRow[]>([])
  const [loading, setLoading] = useState(false)

  // 构建月度数据
  const buildMonthData = (month: Dayjs): SummaryRow[] => {
    const start = month.startOf('month')
    const daysInMonth = start.daysInMonth()
    const rows: SummaryRow[] = []

    // 汇总行
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
      actualConsultCount: 0,
      consultCost: '0',
      consumption: 0,
    })

    // 每日数据行
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
        actualConsultCount: 0,
        consultCost: '0',
        consumption: 0,
      })
    }

    return rows
  }

  // 加载所有平台数据并汇总
  const loadData = async () => {
    if (!campusId) return
    
    setLoading(true)
    try {
      const month = selectedMonth.format('YYYY-MM')
      
      // 并行加载所有平台数据
      const [douyinRes, kuaishouRes, bilibiliRes, xiaohongshuRes, wechatVideoRes] = await Promise.all([
        douyinDailyDataService.list(campusId, month),
        kuaishouDailyDataService.list(campusId, month),
        bilibiliDailyDataService.list(campusId, month),
        xiaohongshuDailyDataService.list(campusId, month),
        wechatVideoDailyDataService.list(campusId, month),
      ])
      
      // 修复：兼容不同的响应结构
      const douyinItems = douyinRes.data?.items || (douyinRes as any).items || []
      const kuaishouItems = kuaishouRes.data?.items || (kuaishouRes as any).items || []
      const bilibiliItems = bilibiliRes.data?.items || (bilibiliRes as any).items || []
      const xiaohongshuItems = xiaohongshuRes.data?.items || (xiaohongshuRes as any).items || []
      const wechatVideoItems = wechatVideoRes.data?.items || (wechatVideoRes as any).items || []
      
      const monthData = buildMonthData(selectedMonth)
      
      // 按日期汇总各平台数据
      const mergedData = monthData.map(row => {
        if (row.key === 'summary') return row
        
        const date = row.key
        let totalIncome = 0
        let totalRefund = 0
        let totalNetSignup = 0
        let totalGrossTotal = 0
        let totalOrderCount = 0
        let totalVisitCount = 0
        let totalConsultCount = 0
        let totalConsumption = 0
        
        // 抖音数据
        const douyinItem = douyinItems.find((item: any) => item.date === date)
        if (douyinItem) {
          totalIncome += parseFloat(douyinItem.actual_income as any) || 0
          totalRefund += douyinItem.refund_count || 0
          totalNetSignup += douyinItem.net_signup || 0
          totalGrossTotal += douyinItem.gross_total || 0
          totalOrderCount += douyinItem.order_count || 0
          totalVisitCount += douyinItem.visit_count || 0
          totalConsultCount += douyinItem.consult_count || 0
          totalConsumption += parseFloat(douyinItem.consumption as any) || 0
        }
        
        // 快手数据
        const kuaishouItem = kuaishouItems.find((item: any) => item.date === date)
        if (kuaishouItem) {
          totalIncome += parseFloat(kuaishouItem.actual_income as any) || 0
          totalRefund += kuaishouItem.refund_count || 0
          totalNetSignup += kuaishouItem.net_signup || 0
          totalGrossTotal += kuaishouItem.gross_total || 0
          totalOrderCount += kuaishouItem.order_count || 0
          totalVisitCount += kuaishouItem.visit_count || 0
          totalConsultCount += kuaishouItem.consult_count || 0
          totalConsumption += parseFloat(kuaishouItem.consumption as any) || 0
        }
        
        // B站数据
        const bilibiliItem = bilibiliItems.find((item: any) => item.date === date)
        if (bilibiliItem) {
          totalIncome += parseFloat(bilibiliItem.actual_income as any) || 0
          totalRefund += bilibiliItem.refund_count || 0
          totalNetSignup += bilibiliItem.net_signup || 0
          totalGrossTotal += bilibiliItem.gross_total || 0
          totalOrderCount += bilibiliItem.order_count || 0
          totalVisitCount += bilibiliItem.visit_count || 0
          totalConsultCount += bilibiliItem.consult_count || 0
          totalConsumption += parseFloat(bilibiliItem.consumption as any) || 0
        }
        
        // 小红书数据
        const xiaohongshuItem = xiaohongshuItems.find((item: any) => item.date === date)
        if (xiaohongshuItem) {
          totalIncome += parseFloat(xiaohongshuItem.actual_income as any) || 0
          totalRefund += xiaohongshuItem.refund_count || 0
          totalNetSignup += xiaohongshuItem.net_signup || 0
          totalGrossTotal += xiaohongshuItem.gross_total || 0
          totalOrderCount += xiaohongshuItem.order_count || 0
          totalVisitCount += xiaohongshuItem.visit_count || 0
          totalConsultCount += xiaohongshuItem.consult_count || 0
          totalConsumption += parseFloat(xiaohongshuItem.consumption as any) || 0
        }
        
        // 微信视频号数据
        const wechatVideoItem = wechatVideoItems.find((item: any) => item.date === date)
        if (wechatVideoItem) {
          totalIncome += parseFloat(wechatVideoItem.actual_income as any) || 0
          totalRefund += wechatVideoItem.refund_count || 0
          totalNetSignup += wechatVideoItem.net_signup || 0
          totalGrossTotal += wechatVideoItem.gross_total || 0
          totalOrderCount += wechatVideoItem.order_count || 0
          totalVisitCount += wechatVideoItem.visit_count || 0
          totalConsultCount += wechatVideoItem.consult_count || 0
          totalConsumption += parseFloat(wechatVideoItem.consumption as any) || 0
        }
        
        // 计算派生字段
        let signupConversionRate = '0'
        let consultCost = '0'
        
        if (totalConsultCount > 0) {
          signupConversionRate = ((totalNetSignup / totalConsultCount) * 100).toFixed(2) + '%'
          consultCost = (totalConsumption / totalConsultCount).toFixed(2)
        }
        
        return {
          ...row,
          actualIncome: totalIncome,
          signupConversionRate,
          refundCount: totalRefund,
          netSignup: totalNetSignup,
          grossTotal: totalGrossTotal,
          orderCount: totalOrderCount,
          visitCount: totalVisitCount,
          actualConsultCount: totalConsultCount,
          consultCost,
          consumption: totalConsumption,
        }
      })
      
      // 重新计算汇总行
      const dataWithoutSummary = mergedData.filter(row => row.key !== 'summary')
      const summary = calculateSummary(dataWithoutSummary)
      setData([summary, ...dataWithoutSummary])
      
    } catch (error) {
      console.error('加载新媒体汇总数据失败:', error)
      message.error('加载数据失败')
      setData(buildMonthData(selectedMonth))
    } finally {
      setLoading(false)
    }
  }

  // 计算汇总行
  const calculateSummary = (dataRows: SummaryRow[]): SummaryRow => {
    const summary: SummaryRow = {
      key: 'summary',
      weekday: '',
      dateText: '汇总',
      actualIncome: 0,
      signupConversionRate: '0',
      refundCount: 0,
      netSignup: 0,
      grossTotal: 0,
      orderCount: 0,
      visitCount: 0,
      actualConsultCount: 0,
      consultCost: '0',
      consumption: 0,
    }
    
    // 汇总数值字段
    dataRows.forEach(row => {
      summary.actualIncome += row.actualIncome
      summary.refundCount += row.refundCount
      summary.netSignup += row.netSignup
      summary.grossTotal += row.grossTotal
      summary.orderCount += row.orderCount
      summary.visitCount += row.visitCount
      summary.actualConsultCount += row.actualConsultCount
      summary.consumption += row.consumption
    })
    
    // 计算汇总的派生字段
    // 新媒体报名转化率 = 净报名 / 实际总咨询量 * 100%
    if (summary.actualConsultCount > 0) {
      summary.signupConversionRate = ((summary.netSignup / summary.actualConsultCount) * 100).toFixed(2) + '%'
      // 咨询量成本 = 新媒体消费 / 实际总咨询量
      summary.consultCost = (summary.consumption / summary.actualConsultCount).toFixed(2)
    } else {
      summary.signupConversionRate = '0%'
      summary.consultCost = '0'
    }
    
    return summary
  }

  // 初始化数据
  useEffect(() => {
    loadData()
  }, [selectedMonth, campusId])


  // 更新单元格数据（汇总页面为只读，不需要编辑功能）
  // const handleUpdate = (rowKey: string, field: keyof SummaryRow, value: number) => {
  //   setData((prev) =>
  //     prev.map((row) => {
  //       if (row.key === rowKey) {
  //         return { ...row, [field]: value }
  //       }
  //       return row
  //     })
  //   )
  // }

  // 渲染数字（只读显示）
  const renderNumber = (record: SummaryRow, field: keyof SummaryRow) => {
    const value = record[field]
    const isSummary = record.key === 'summary'
    
    return (
      <span style={{ fontWeight: isSummary ? 'bold' : 'normal' }}>
        {typeof value === 'number' ? value.toFixed(0) : value}
      </span>
    )
  }

  const columns: ColumnsType<SummaryRow> = useMemo(
    () => [
      {
        title: '星期',
        dataIndex: 'weekday',
        width: 60,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#00B050', color: '#000', fontWeight: 'bold' },
        }),
      },
      {
        title: '日期',
        dataIndex: 'dateText',
        width: 80,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#92D050', color: '#000', fontWeight: 'bold' },
        }),
        render: (val: string, record: SummaryRow) =>
          record.key === 'summary' ? <span style={{ fontWeight: 'bold' }}>{val}</span> : val,
      },
      {
        title: '实际收入',
        dataIndex: 'actualIncome',
        width: 90,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
        }),
        render: (_: unknown, record: SummaryRow) => renderNumber(record, 'actualIncome'),
      },
      {
        title: '报名转化率',
        dataIndex: 'signupConversionRate',
        width: 100,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
        }),
        render: (_: unknown, record: SummaryRow) => (
          <span style={{ fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
            {record.signupConversionRate}
          </span>
        ),
      },
      {
        title: '退费',
        dataIndex: 'refundCount',
        width: 60,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
        }),
        render: (_: unknown, record: SummaryRow) => renderNumber(record, 'refundCount'),
      },
      {
        title: '净报名',
        dataIndex: 'netSignup',
        width: 70,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
        }),
        render: (_: unknown, record: SummaryRow) => renderNumber(record, 'netSignup'),
      },
      {
        title: '毛报数',
        dataIndex: 'grossTotal',
        width: 70,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
        }),
        render: (_: unknown, record: SummaryRow) => renderNumber(record, 'grossTotal'),
      },
      {
        title: '订座',
        dataIndex: 'orderCount',
        width: 60,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
        }),
        render: (_: unknown, record: SummaryRow) => renderNumber(record, 'orderCount'),
      },
      {
        title: '上门',
        dataIndex: 'visitCount',
        width: 60,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
        }),
        render: (_: unknown, record: SummaryRow) => renderNumber(record, 'visitCount'),
      },
      {
        title: '咨询量',
        dataIndex: 'actualConsultCount',
        width: 70,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
        }),
        render: (_: unknown, record: SummaryRow) =>
          renderNumber(record, 'actualConsultCount'),
      },
      {
        title: '咨询成本',
        dataIndex: 'consultCost',
        width: 90,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
        }),
        render: (_: unknown, record: SummaryRow) => (
          <span style={{ fontWeight: record.key === 'summary' ? 'bold' : 'normal' }}>
            {record.consultCost}
          </span>
        ),
      },
      {
        title: '消费',
        dataIndex: 'consumption',
        width: 80,
        align: 'center',
        onHeaderCell: () => ({
          style: { backgroundColor: '#FCE4D6', color: '#C00000', fontWeight: 'bold' },
        }),
        render: (_: unknown, record: SummaryRow) => renderNumber(record, 'consumption'),
      },
    ],
    []
  )

  const handleRefresh = () => {
    loadData()
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleRefresh} loading={loading}>
          刷新数据
        </Button>
        <span style={{ color: '#999', fontSize: '12px' }}>
          （此页面数据自动汇总自抖音、快手、B站、小红书、微信视频号）
        </span>
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
}

export default SummaryTab

