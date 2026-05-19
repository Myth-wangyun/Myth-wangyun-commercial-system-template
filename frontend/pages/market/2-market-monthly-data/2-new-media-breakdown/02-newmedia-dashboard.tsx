import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { App, Card, Table, Spin } from 'antd'
import { FileTextOutlined, LoadingOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { useMarketMonthlyDataStore } from '@/stores/marketMonthlyDataStore'
import {
  getNewMediaMonthlyPlatformSummary,
  type NewMediaMonthlyPlatformData,
} from '@/services/market/newmediaBreakdownService'
import {
  getNewMediaYearlyPlan,
  type NewMediaMonthlyPlanData,
} from '@/services/market/monthlyDetailPlanService'

export default function NewMediaDashboard02() {
  const { message } = App.useApp()
  const currentCampus = useCampusStore((s) => s.currentCampus)
  const year = useMarketMonthlyDataStore((s) => s.year)
  const [loading, setLoading] = useState(false)

  const campusFullName = useMemo(() => {
    const name = currentCampus || '河北主神殿'
    return name.includes('神殿') ? name : name + '神殿'
  }, [currentCampus])

  const campusLabel = campusFullName

  const PLATFORMS = useMemo(() => ['抖音', '快手', 'B站', '小红书', '微信视频号'], [])
  const MONTHS = useMemo(() => Array.from({ length: 12 }, (_, i) => (i + 1) + '月'), [])
  const GROUPS = useMemo(() => ['全年', ...MONTHS], [MONTHS])

  type NumericFields = {
    planIncome: number | null
    actualIncome: number | null
    refundCount: number | null
    planEnrollment: number | null
    grossEnrollment: number | null
    netEnrollment: number | null
    orderCount: number | null
    visitCount: number | null
    planConsultVolume: number | null
    actualConsultVolume: number | null
    planCost: number | null
    actualCost: number | null
  }

  type Row = {
    key: string
    month: string
    project: string
    isTotal: boolean
    monthRowSpan: number
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

  const emptyNumeric = (): NumericFields => ({
    planIncome: null, actualIncome: null, refundCount: null, planEnrollment: null,
    grossEnrollment: null, netEnrollment: null, orderCount: null, visitCount: null,
    planConsultVolume: null, actualConsultVolume: null, planCost: null, actualCost: null,
  })

  const [platformData, setPlatformData] = useState<Record<string, NumericFields>>({})

  const calcRate = (numerator: number, denominator: number): string => {
    if (!denominator || denominator === 0) return '0%'
    return ((numerator / denominator) * 100).toFixed(2) + '%'
  }

  const calcInvestmentRatio = (income: number, cost: number): string => {
    if (!cost || cost === 0) return '1:0'
    return '1:' + (income / cost).toFixed(1)
  }

  const computeDerived = (n: NumericFields) => ({
    investmentRatio: n.actualIncome && n.actualCost ? calcInvestmentRatio(n.actualIncome, n.actualCost) : '',
    enrollmentConversionRate: n.netEnrollment && n.actualConsultVolume ? calcRate(n.netEnrollment, n.actualConsultVolume) : '',
    refundRate: n.refundCount && n.grossEnrollment ? calcRate(n.refundCount, n.grossEnrollment) : '',
    enrollmentProgress: n.netEnrollment && n.planEnrollment ? calcRate(n.netEnrollment, n.planEnrollment) : '',
    visitRate: n.visitCount && n.actualConsultVolume ? calcRate(n.visitCount, n.actualConsultVolume) : '',
    consultCompletionProgress: n.actualConsultVolume && n.planConsultVolume ? calcRate(n.actualConsultVolume, n.planConsultVolume) : '',
    consultCost: n.actualCost && n.actualConsultVolume ? parseFloat((n.actualCost / n.actualConsultVolume).toFixed(2)) : null,
    netCost: n.actualCost && n.netEnrollment ? parseFloat((n.actualCost / n.netEnrollment).toFixed(2)) : null,
  })

  const sumNumerics = (items: NumericFields[]): NumericFields => {
    const sumField = (k: keyof NumericFields) => items.reduce((acc, it) => acc + (it[k] ?? 0), 0) || null
    return {
      planIncome: sumField('planIncome'), actualIncome: sumField('actualIncome'), refundCount: sumField('refundCount'),
      planEnrollment: sumField('planEnrollment'), grossEnrollment: sumField('grossEnrollment'), netEnrollment: sumField('netEnrollment'),
      orderCount: sumField('orderCount'), visitCount: sumField('visitCount'), planConsultVolume: sumField('planConsultVolume'),
      actualConsultVolume: sumField('actualConsultVolume'), planCost: sumField('planCost'), actualCost: sumField('actualCost'),
    }
  }

  const getMonthPlatformNumeric = (month: string, platform: string): NumericFields => platformData[month + '__' + platform] || emptyNumeric()
  const computeMonthTotal = (month: string): NumericFields => sumNumerics(PLATFORMS.map((p) => getMonthPlatformNumeric(month, p)))
  const computeYearPlatform = (platform: string): NumericFields => sumNumerics(MONTHS.map((m) => getMonthPlatformNumeric(m, platform)))
  const computeYearTotal = (): NumericFields => sumNumerics(PLATFORMS.map((p) => computeYearPlatform(p)))
  const computeOverallTotal = (): NumericFields => computeYearTotal()

  const buildRow = (month: string, project: string, isTotal: boolean, monthRowSpan: number, n: NumericFields): Row => {
    const d = computeDerived(n)
    return {
      key: month + '__' + project, month, project, isTotal, monthRowSpan,
      planIncome: n.planIncome, actualIncome: n.actualIncome, investmentRatio: d.investmentRatio,
      enrollmentConversionRate: d.enrollmentConversionRate, refundCount: n.refundCount, refundRate: d.refundRate,
      planEnrollment: n.planEnrollment, grossEnrollment: n.grossEnrollment, netEnrollment: n.netEnrollment,
      orderCount: n.orderCount, enrollmentProgress: d.enrollmentProgress, netCost: d.netCost,
      visitCount: n.visitCount, visitRate: d.visitRate, planConsultVolume: n.planConsultVolume,
      actualConsultVolume: n.actualConsultVolume, consultCompletionProgress: d.consultCompletionProgress,
      consultCost: d.consultCost, planCost: n.planCost, actualCost: n.actualCost,
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 从月度详细计划获取计划数据，从平台汇总获取实际数据
      const [platformSummaryRes, monthlyPlanData] = await Promise.all([
        getNewMediaMonthlyPlatformSummary(year, campusFullName),
        getNewMediaYearlyPlan(year, campusFullName),
      ])

      const newPlatformData: Record<string, NumericFields> = {}

      if (platformSummaryRes.success && platformSummaryRes.data) {
        platformSummaryRes.data.forEach((item) => {
          const monthStr = item.month + '月'
          const key = monthStr + '__' + item.platform
          // 从月度详细计划获取对应月份和平台的计划数据
          const monthPlan = monthlyPlanData[item.month] || {}
          const platformPlan = monthPlan[item.platform] || null
          
          newPlatformData[key] = {
            // 计划数据从月度详细计划获取（每个平台独立的计划数据）
            planIncome: platformPlan?.plan_income || null,
            actualIncome: item.actual_income || null,
            refundCount: item.refund_count || null,
            planEnrollment: platformPlan?.plan_enrollment || null,
            grossEnrollment: item.gross_enrollment || null,
            netEnrollment: item.net_enrollment || null,
            orderCount: item.order_count || null,
            visitCount: item.visit_count || null,
            planConsultVolume: platformPlan?.plan_consult_volume || null,
            actualConsultVolume: item.actual_consult_volume || null,
            planCost: platformPlan?.plan_cost || null,
            actualCost: item.actual_cost || null,
          }
        })
      }

      setPlatformData(newPlatformData)
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
    
    // 先添加独立的"合计"行
    const totalNumeric = computeOverallTotal()
    rows.push(buildRow('合计', '', true, 1, totalNumeric))
    
    // 然后添加全年和各月的数据
    for (const g of GROUPS) {
      if (g === '全年') {
        // 全年：只显示各平台，不显示总计行
        const monthRowSpan = PLATFORMS.length
        for (let i = 0; i < PLATFORMS.length; i++) {
          const p = PLATFORMS[i]
          const n = computeYearPlatform(p)
          const span = i === 0 ? monthRowSpan : 0
          rows.push(buildRow(g, p, false, span, n))
        }
      } else {
        // 各月：显示总计 + 各平台
        const monthRowSpan = 1 + PLATFORMS.length
        const groupTotalNumeric = computeMonthTotal(g)
        rows.push(buildRow(g, '总计', true, monthRowSpan, groupTotalNumeric))

        for (let i = 0; i < PLATFORMS.length; i++) {
          const p = PLATFORMS[i]
          const n = getMonthPlatformNumeric(g, p)
          rows.push(buildRow(g, p, false, 0, n))
        }
      }
    }
    return rows
  }, [platformData, GROUPS, PLATFORMS, MONTHS])

  const renderValue = (value: unknown, isTotal: boolean) => {
    if (value === null || value === undefined || value === '') return '-'
    const displayValue = typeof value === 'number' ? value.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) : value
    // 判断是否为零值
    const isZero = (typeof value === 'number' && value === 0) || value === '0' || value === '0%' || value === '1:0'
    return <span style={{ fontWeight: isTotal ? 'bold' : 'normal', color: isZero ? '#999' : (isTotal ? '#c00000' : 'inherit') }}>{String(displayValue)}</span>
  }

  const columns = useMemo(() => [
    { title: '月份', dataIndex: 'month', key: 'month', width: 42, align: 'center' as const, render: (text: string, record: Row) => ({ children: <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal' }}>{text}</span>, props: { rowSpan: record.monthRowSpan } }) },
    { title: '项目', dataIndex: 'project', key: 'project', width: 58, align: 'center' as const, render: (text: string, record: Row) => <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal' }}>{text}</span> },
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
  ], [year, campusLabel])

  return (
    <div>
      <div style={{ marginBottom: 16, textAlign: 'center', fontSize: '20px', fontWeight: 'bold', padding: '10px 16px', color: '#000', borderRadius: 0, border: '1px solid #000', backgroundColor: '#fff2cc' }}>
        <FileTextOutlined style={{ marginRight: 8 }} />
        02市场部 {campusLabel}-{year}年度新媒体数据看板
        <span style={{ color: '#999', marginLeft: 16, fontSize: 12, fontWeight: 'normal' }}>数据自动从新媒体日度数据表和年度网络计划表获取</span>
      </div>

      <Card className="newmedia-breakdown-dashboard-table">
        <Spin spinning={loading} indicator={<LoadingOutlined />}>
          <Table<Row> columns={columns as never} dataSource={dataSource} pagination={false} bordered size="small" scroll={{ x: 'max-content' }} rowClassName={(record) => (record.isTotal ? 'total-row' : '')} />
        </Spin>

        <style>{`
          .newmedia-breakdown-dashboard-table .ant-table-thead > tr > th { background-color: #fce4d6 !important; text-align: center !important; font-weight: bold !important; border: 1px solid #000 !important; padding: 6px 2px !important; font-size: 12px !important; }
          .newmedia-breakdown-dashboard-table .ant-table-tbody > tr > td { border: 1px solid #000 !important; padding: 4px 4px !important; font-size: 12px !important; }
          .newmedia-breakdown-dashboard-table .ant-table-tbody > tr.total-row > td { background-color: #fff2cc !important; font-weight: bold !important; }
        `}</style>
      </Card>
    </div>
  )
}
