import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { App, Card, DatePicker, Space, Table, Spin } from 'antd'
import { FileTextOutlined, LoadingOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { useMarketNewMediaBreakdownStore } from '@/stores/marketNewMediaBreakdownStore'
import {
  getNewMediaMonthlySummary,
  getNetworkPlanData,
  type NewMediaMonthlySummaryData,
  type NetworkPlanData,
} from '@/services/market/newmediaBreakdownService'

export default function NewMediaCoreDashboard01() {
  const { message } = App.useApp()
  const currentCampus = useCampusStore((s) => s.currentCampus)
  const { date, setDate } = useMarketNewMediaBreakdownStore()
  const [loading, setLoading] = useState(false)

  const selectedDate = useMemo(() => dayjs(date, 'YYYY-MM-DD'), [date])
  const year = selectedDate.format('YYYY')

  const campusFullName = useMemo(() => {
    const name = currentCampus || '河北主神殿'
    return name.includes('神殿') ? name : name + '神殿'
  }, [currentCampus])

  const campusLabel = campusFullName

  type Row = {
    key: string
    month: string
    isTotal: boolean
    planIncome: number | null
    actualIncome: number | null
    investmentRatio: string
    enrollmentConversionRate: string
    refundCount: number | null
    refundRate: string
    planEnrollment: number | null
    grossEnrollment: number | null
    netEnrollment: number | null
    orderCount: number | null
    enrollmentProgress: string
    netCost: number | null
    visitCount: number | null
    visitRate: string
    planConsultVolume: number | null
    actualConsultVolume: number | null
    consultCompletionProgress: string
    consultCost: number | null
    planCost: number | null
    actualCost: number | null
  }

  const MONTHS = useMemo(() => ['全年', ...Array.from({ length: 12 }, (_, i) => (i + 1) + '月')], [])

  const [monthlyData, setMonthlyData] = useState<Record<string, Partial<Row>>>({})

  const calcRate = (numerator: number, denominator: number): string => {
    if (!denominator || denominator === 0) return '0%'
    return ((numerator / denominator) * 100).toFixed(2) + '%'
  }

  const calcInvestmentRatio = (income: number, cost: number): string => {
    if (!cost || cost === 0) return '1:0'
    return '1:' + (income / cost).toFixed(1)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [summaryRes, networkPlanData] = await Promise.all([
        getNewMediaMonthlySummary(year, campusFullName),
        getNetworkPlanData(year, campusFullName),
      ])

      const planDataMap = new Map<number, NetworkPlanData>()
      if (networkPlanData) {
        networkPlanData.forEach((item) => planDataMap.set(item.month, item))
      }

      const newMonthlyData: Record<string, Partial<Row>> = {}

      if (summaryRes.success && summaryRes.data) {
        summaryRes.data.forEach((item) => {
          const monthStr = item.month + '月'
          const planData = planDataMap.get(item.month)
          
          newMonthlyData[monthStr] = {
            planIncome: planData?.newmedia_plan_income || null,
            actualIncome: item.actual_income || null,
            refundCount: item.refund_count || null,
            planEnrollment: planData?.newmedia_plan_signup || null,
            grossEnrollment: item.gross_enrollment || null,
            netEnrollment: item.net_enrollment || null,
            orderCount: item.order_count || null,
            visitCount: item.visit_count || null,
            planConsultVolume: planData?.newmedia_plan_consult || null,
            actualConsultVolume: item.actual_consult_volume || null,
            planCost: planData?.newmedia_plan_cost || null,
            actualCost: item.actual_cost || null,
          }
        })
      }

      setMonthlyData(newMonthlyData)
    } catch (error: unknown) {
      console.error('加载数据失败:', error)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [year, campusFullName])

  useEffect(() => { loadData() }, [loadData])

  const dataSource = useMemo<Row[]>(() => {
    const rows: Row[] = []
    let totalPlanIncome = 0, totalActualIncome = 0, totalRefund = 0
    let totalPlanEnroll = 0, totalGross = 0, totalNet = 0, totalOrder = 0
    let totalVisit = 0, totalPlanConsult = 0, totalActualConsult = 0
    let totalPlanCost = 0, totalActualCost = 0

    for (let m = 1; m <= 12; m++) {
      const monthStr = m + '月'
      const d = monthlyData[monthStr] || {}
      const planIncome = d.planIncome ?? null
      const actualIncome = d.actualIncome ?? null
      const refundCount = d.refundCount ?? null
      const planEnrollment = d.planEnrollment ?? null
      const grossEnrollment = d.grossEnrollment ?? null
      const netEnrollment = d.netEnrollment ?? null
      const orderCount = d.orderCount ?? null
      const visitCount = d.visitCount ?? null
      const planConsultVolume = d.planConsultVolume ?? null
      const actualConsultVolume = d.actualConsultVolume ?? null
      const planCost = d.planCost ?? null
      const actualCost = d.actualCost ?? null

      if (planIncome) totalPlanIncome += planIncome
      if (actualIncome) totalActualIncome += actualIncome
      if (refundCount) totalRefund += refundCount
      if (planEnrollment) totalPlanEnroll += planEnrollment
      if (grossEnrollment) totalGross += grossEnrollment
      if (netEnrollment) totalNet += netEnrollment
      if (orderCount) totalOrder += orderCount
      if (visitCount) totalVisit += visitCount
      if (planConsultVolume) totalPlanConsult += planConsultVolume
      if (actualConsultVolume) totalActualConsult += actualConsultVolume
      if (planCost) totalPlanCost += planCost
      if (actualCost) totalActualCost += actualCost

      rows.push({
        key: monthStr,
        month: monthStr,
        isTotal: false,
        planIncome, actualIncome,
        investmentRatio: actualIncome && actualCost ? calcInvestmentRatio(actualIncome, actualCost) : '',
        enrollmentConversionRate: netEnrollment && actualConsultVolume ? calcRate(netEnrollment, actualConsultVolume) : '',
        refundCount,
        refundRate: refundCount && grossEnrollment ? calcRate(refundCount, grossEnrollment) : '',
        planEnrollment, grossEnrollment, netEnrollment, orderCount,
        enrollmentProgress: netEnrollment && planEnrollment ? calcRate(netEnrollment, planEnrollment) : '',
        netCost: actualCost && netEnrollment ? parseFloat((actualCost / netEnrollment).toFixed(2)) : null,
        visitCount,
        visitRate: visitCount && actualConsultVolume ? calcRate(visitCount, actualConsultVolume) : '',
        planConsultVolume, actualConsultVolume,
        consultCompletionProgress: actualConsultVolume && planConsultVolume ? calcRate(actualConsultVolume, planConsultVolume) : '',
        consultCost: actualCost && actualConsultVolume ? parseFloat((actualCost / actualConsultVolume).toFixed(2)) : null,
        planCost, actualCost,
      })
    }

    const totalRow: Row = {
      key: '全年',
      month: '全年',
      isTotal: true,
      planIncome: totalPlanIncome || null,
      actualIncome: totalActualIncome || null,
      investmentRatio: totalActualIncome && totalActualCost ? calcInvestmentRatio(totalActualIncome, totalActualCost) : '',
      enrollmentConversionRate: totalNet && totalActualConsult ? calcRate(totalNet, totalActualConsult) : '',
      refundCount: totalRefund || null,
      refundRate: totalRefund && totalGross ? calcRate(totalRefund, totalGross) : '',
      planEnrollment: totalPlanEnroll || null,
      grossEnrollment: totalGross || null,
      netEnrollment: totalNet || null,
      orderCount: totalOrder || null,
      enrollmentProgress: totalNet && totalPlanEnroll ? calcRate(totalNet, totalPlanEnroll) : '',
      netCost: totalActualCost && totalNet ? parseFloat((totalActualCost / totalNet).toFixed(2)) : null,
      visitCount: totalVisit || null,
      visitRate: totalVisit && totalActualConsult ? calcRate(totalVisit, totalActualConsult) : '',
      planConsultVolume: totalPlanConsult || null,
      actualConsultVolume: totalActualConsult || null,
      consultCompletionProgress: totalActualConsult && totalPlanConsult ? calcRate(totalActualConsult, totalPlanConsult) : '',
      consultCost: totalActualCost && totalActualConsult ? parseFloat((totalActualCost / totalActualConsult).toFixed(2)) : null,
      planCost: totalPlanCost || null,
      actualCost: totalActualCost || null,
    }

    return [totalRow, ...rows]
  }, [monthlyData])

  const renderValue = (value: unknown, isTotal: boolean) => {
    if (value === null || value === undefined || value === '') return '-'
    const displayValue = typeof value === 'number' ? value.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) : value
    // 判断是否为零值
    const isZero = (typeof value === 'number' && value === 0) || value === '0' || value === '0%' || value === '1:0'
    return <span style={{ fontWeight: isTotal ? 'bold' : 'normal', color: isZero ? '#999' : (isTotal ? '#c00000' : 'inherit') }}>{String(displayValue)}</span>
  }

  const columns = useMemo(() => [
    { title: '月份', dataIndex: 'month', key: 'month', width: 45, align: 'center' as const, render: (text: string, record: Row) => <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal' }}>{text}</span> },
    { title: '神殿收入', children: [
      { title: '新媒体计划收入', dataIndex: 'planIncome', key: 'planIncome', width: 72, align: 'center' as const, render: (val: number | null, record: Row) => renderValue(val, record.isTotal) },
      { title: '新媒体实际收入', dataIndex: 'actualIncome', key: 'actualIncome', width: 72, align: 'center' as const, render: (val: number | null, record: Row) => renderValue(val, record.isTotal) },
      { title: '投产比', dataIndex: 'investmentRatio', key: 'investmentRatio', width: 50, align: 'center' as const, render: (val: string, record: Row) => renderValue(val, record.isTotal) },
    ]},
    { title: '神殿运营', children: [
      { title: '报名转化率', dataIndex: 'enrollmentConversionRate', key: 'enrollmentConversionRate', width: 65, align: 'center' as const, render: (val: string, record: Row) => renderValue(val, record.isTotal) },
      { title: '退费数', dataIndex: 'refundCount', key: 'refundCount', width: 48, align: 'center' as const, render: (val: number | null, record: Row) => renderValue(val, record.isTotal) },
      { title: '退费率', dataIndex: 'refundRate', key: 'refundRate', width: 50, align: 'center' as const, render: (val: string, record: Row) => renderValue(val, record.isTotal) },
    ]},
    { title: '神殿报名', children: [
      { title: '新媒体计划报名', dataIndex: 'planEnrollment', key: 'planEnrollment', width: 72, align: 'center' as const, render: (val: number | null, record: Row) => renderValue(val, record.isTotal) },
      { title: '毛报总数', dataIndex: 'grossEnrollment', key: 'grossEnrollment', width: 55, align: 'center' as const, render: (val: number | null, record: Row) => renderValue(val, record.isTotal) },
      { title: '净报名', dataIndex: 'netEnrollment', key: 'netEnrollment', width: 50, align: 'center' as const, render: (val: number | null, record: Row) => renderValue(val, record.isTotal) },
      { title: '订座数', dataIndex: 'orderCount', key: 'orderCount', width: 48, align: 'center' as const, render: (val: number | null, record: Row) => renderValue(val, record.isTotal) },
      { title: '报名进度', dataIndex: 'enrollmentProgress', key: 'enrollmentProgress', width: 55, align: 'center' as const, render: (val: string, record: Row) => renderValue(val, record.isTotal) },
      { title: '净成本', dataIndex: 'netCost', key: 'netCost', width: 55, align: 'center' as const, render: (val: number | null, record: Row) => renderValue(val, record.isTotal) },
    ]},
    { title: '神殿上门', children: [
      { title: '上门人数', dataIndex: 'visitCount', key: 'visitCount', width: 55, align: 'center' as const, render: (val: number | null, record: Row) => renderValue(val, record.isTotal) },
      { title: '上门率', dataIndex: 'visitRate', key: 'visitRate', width: 50, align: 'center' as const, render: (val: string, record: Row) => renderValue(val, record.isTotal) },
    ]},
    { title: '市场网推数据', children: [
      { title: '新媒体计划咨询量', dataIndex: 'planConsultVolume', key: 'planConsultVolume', width: 82, align: 'center' as const, render: (val: number | null, record: Row) => renderValue(val, record.isTotal) },
      { title: '实际总量', dataIndex: 'actualConsultVolume', key: 'actualConsultVolume', width: 55, align: 'center' as const, render: (val: number | null, record: Row) => renderValue(val, record.isTotal) },
      { title: '咨询量完成进度', dataIndex: 'consultCompletionProgress', key: 'consultCompletionProgress', width: 72, align: 'center' as const, render: (val: string, record: Row) => renderValue(val, record.isTotal) },
      { title: '咨询量成本', dataIndex: 'consultCost', key: 'consultCost', width: 65, align: 'center' as const, render: (val: number | null, record: Row) => renderValue(val, record.isTotal) },
      { title: '新媒体计划消费', dataIndex: 'planCost', key: 'planCost', width: 82, align: 'center' as const, render: (val: number | null, record: Row) => renderValue(val, record.isTotal) },
      { title: '实际消费', dataIndex: 'actualCost', key: 'actualCost', width: 55, align: 'center' as const, render: (val: number | null, record: Row) => renderValue(val, record.isTotal) },
    ]},
  ], [])

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'center', fontSize: '20px', fontWeight: 'bold', padding: '10px 16px', color: '#000', borderRadius: 0, border: '1px solid #000', backgroundColor: '#fff2cc' }}>
        <FileTextOutlined style={{ marginRight: 8 }} />
        01市场部 {campusLabel}-{year}年度新媒体核心数据综合数据看板
        <span style={{ color: '#999', marginLeft: 16, fontSize: 12, fontWeight: 'normal' }}>数据自动从新媒体日度数据表和年度网络计划表获取</span>
      </div>

      <Space style={{ marginBottom: 16 }}>
        <span>截止日期：</span>
        <DatePicker value={selectedDate} onChange={(d) => d && setDate(d.format('YYYY-MM-DD'))} allowClear={false} />
        <span style={{ marginLeft: 16 }}>数据截止{selectedDate.format('YYYY年MM月DD日')}，数据来源：年度网络计划表 + 新媒体日度数据表</span>
      </Space>

      <Card className="newmedia-core-dashboard-table">
        <Spin spinning={loading} indicator={<LoadingOutlined />}>
          <Table<Row> columns={columns as never} dataSource={dataSource} pagination={false} bordered size="small" scroll={{ x: 'max-content' }} rowClassName={(record) => (record.isTotal ? 'total-row' : '')} />
        </Spin>

        <style>{`
          .newmedia-core-dashboard-table .ant-table-thead > tr > th { background-color: #fce4d6 !important; text-align: center !important; font-weight: bold !important; border: 1px solid #000 !important; padding: 6px 2px !important; font-size: 12px !important; }
          .newmedia-core-dashboard-table .ant-table-tbody > tr > td { border: 1px solid #000 !important; padding: 4px 4px !important; font-size: 12px !important; }
          .newmedia-core-dashboard-table .ant-table-tbody > tr.total-row > td { background-color: #fff2cc !important; font-weight: bold !important; }
        `}</style>
      </Card>
    </div>
  )
}
