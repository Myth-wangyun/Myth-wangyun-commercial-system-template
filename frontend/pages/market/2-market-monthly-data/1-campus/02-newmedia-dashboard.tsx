import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { App, Card, Table } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { useMarketMonthlyDataStore } from '@/stores/marketMonthlyDataStore'
import axios from 'axios'
import { getNetworkPlanData } from '@/services/market/newmediaBreakdownService'

/**
 * 02市场部 {神殿}-{年份}年度新媒体数据看板表
 * - 神殿来自全局神殿选择器（useCampusStore.currentCampus）
 * - 年份来自年份选择器（useMarketMonthlyDataStore.year）
 */
export default function MarketMonthlyNewMediaDashboard() {
  const { message } = App.useApp()
  const currentCampus = useCampusStore((s) => s.currentCampus)
  const year = useMarketMonthlyDataStore((s) => s.year)

  const campusLabel = useMemo(() => {
    const name = currentCampus || '主神殿'
    return name.includes('神殿') ? name : `${name}神殿`
  }, [currentCampus])

  type Row = {
    key: string
    month: string
    isTotal: boolean

    // 神殿收入
    planIncome: number | null
    actualIncome: number | null
    investmentRatio: string // 投产比 1:x

    // 神殿运营
    enrollmentConversionRate: string // 报名转化率
    refundCount: number | null
    refundRate: string

    // 神殿报名
    planEnrollment: number | null
    grossEnrollment: number | null
    netEnrollment: number | null
    orderCount: number | null
    enrollmentProgress: string
    netCost: number | null

    // 神殿上门
    visitCount: number | null
    visitRate: string

    // 市场网推数据（新媒体）
    planConsultVolume: number | null
    actualConsultVolume: number | null
    consultCompletionProgress: string
    consultCost: number | null
    planCost: number | null
    actualCost: number | null
  }

  const calcRate = (numerator: number, denominator: number): string => {
    if (!denominator || denominator === 0) return '0%'
    return ((numerator / denominator) * 100).toFixed(2) + '%'
  }

  const calcInvestmentRatio = (income: number, cost: number): string => {
    if (!cost || cost === 0) return '1:0'
    return `1:${(income / cost).toFixed(1)}`
  }

  const makeEmptyRow = (month: string, isTotal = false): Row => ({
    key: month,
    month,
    isTotal,
    planIncome: null,
    actualIncome: null,
    investmentRatio: '',
    enrollmentConversionRate: '',
    refundCount: null,
    refundRate: '',
    planEnrollment: null,
    grossEnrollment: null,
    netEnrollment: null,
    orderCount: null,
    enrollmentProgress: '',
    netCost: null,
    visitCount: null,
    visitRate: '',
    planConsultVolume: null,
    actualConsultVolume: null,
    consultCompletionProgress: '',
    consultCost: null,
    planCost: null,
    actualCost: null,
  })

  const initialRows = useMemo<Row[]>(() => {
    const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
    return ['总计', ...months].map((m) => makeEmptyRow(m, m === '总计'))
  }, [])

  const [rows, setRows] = useState<Row[]>(initialRows)

  // 从API加载实际数据
  const loadData = useCallback(async () => {
    if (!currentCampus || !year) return
    try {
      const res = await axios.get('/api/v1/market/campus-annual/newmedia-dashboard', {
        params: { campus: currentCampus, year }
      })
      const apiData = res.data?.data || {}
      
      setRows((prev) => {
        const next = prev.map((r) => ({ ...r }))
        for (const row of next) {
          if (row.isTotal) continue
          const monthNum = parseInt(row.month)
          row.actualIncome = null
          row.refundCount = null
          row.grossEnrollment = null
          row.netEnrollment = null
          row.orderCount = null
          row.visitCount = null
          row.actualConsultVolume = null
          row.actualCost = null
          if (apiData[monthNum]) {
            row.actualIncome = apiData[monthNum].actual_income || null
            row.refundCount = apiData[monthNum].refund_count || null
            row.grossEnrollment = apiData[monthNum].gross_enrollment || null
            row.netEnrollment = apiData[monthNum].net_enrollment || null
            row.orderCount = apiData[monthNum].order_count || null
            row.visitCount = apiData[monthNum].visit_count || null
            row.actualConsultVolume = apiData[monthNum].actual_consult_volume || null
            row.actualCost = apiData[monthNum].actual_cost || null
          }
          recalcRow(row)
        }
        return recomputeTotal(next)
      })
    } catch (err) {
      console.error('加载新媒体数据看板失败:', err)
      message.error('加载数据失败')
    }
  }, [currentCampus, year])

  // 从年度网络计划表加载新媒体计划数据
  const loadPlanData = useCallback(async () => {
    if (!currentCampus || !year) return
    try {
      const planData = await getNetworkPlanData(year, currentCampus)
      setRows((prev) => {
        const next = prev.map((r) => ({ ...r }))
        for (const row of next) {
          if (row.isTotal) continue
          const monthNum = parseInt(row.month)
          // 先清空计划字段
          row.planIncome = null
          row.planEnrollment = null
          row.planConsultVolume = null
          row.planCost = null
          const planItem = planData.find((p) => p.month === monthNum)
          if (planItem) {
            row.planIncome = planItem.newmedia_plan_income || null
            row.planEnrollment = planItem.newmedia_plan_signup || null
            row.planConsultVolume = planItem.newmedia_plan_consult || null
            row.planCost = planItem.newmedia_plan_cost || null
          }
          recalcRow(row)
        }
        return recomputeTotal(next)
      })
    } catch (err) {
      console.error('加载新媒体计划数据失败:', err)
    }
  }, [currentCampus, year])

  useEffect(() => {
    loadData()
    loadPlanData()
  }, [loadData, loadPlanData])

  const recalcRow = (row: Row) => {
    // 投产比：用“新媒体实际收入 / 实际消费”
    if (row.actualIncome && row.actualCost) {
      row.investmentRatio = calcInvestmentRatio(row.actualIncome, row.actualCost)
    } else {
      row.investmentRatio = ''
    }

    // 报名转化率：用“净报名 / 实际总量”
    if (row.netEnrollment && row.actualConsultVolume) {
      row.enrollmentConversionRate = calcRate(row.netEnrollment, row.actualConsultVolume)
    } else {
      row.enrollmentConversionRate = ''
    }

    // 退费率：用“退费数 / 毛报总数”
    if (row.refundCount && row.grossEnrollment) {
      row.refundRate = calcRate(row.refundCount, row.grossEnrollment)
    } else {
      row.refundRate = ''
    }

    // 报名进度：用“毛报总数 / 新媒体计划报名”
    if (row.grossEnrollment && row.planEnrollment) {
      row.enrollmentProgress = calcRate(row.grossEnrollment, row.planEnrollment)
    } else {
      row.enrollmentProgress = ''
    }

    // 上门率：用“上门人数 / 实际总量”
    if (row.visitCount && row.actualConsultVolume) {
      row.visitRate = calcRate(row.visitCount, row.actualConsultVolume)
    } else {
      row.visitRate = ''
    }

    // 咨询量完成进度：用“实际总量 / 新媒体计划咨询量”
    if (row.actualConsultVolume && row.planConsultVolume) {
      row.consultCompletionProgress = calcRate(row.actualConsultVolume, row.planConsultVolume)
    } else {
      row.consultCompletionProgress = ''
    }

    // 咨询量成本：用“实际消费 / 实际总量”
    if (row.actualCost && row.actualConsultVolume) {
      row.consultCost = parseFloat((row.actualCost / row.actualConsultVolume).toFixed(2))
    } else {
      row.consultCost = null
    }

    // 净成本：用“实际消费 / 净报名”
    if (row.actualCost && row.netEnrollment) {
      row.netCost = parseFloat((row.actualCost / row.netEnrollment).toFixed(2))
    } else {
      row.netCost = null
    }
  }

  const recomputeTotal = (next: Row[]): Row[] => {
    const monthRows = next.filter((r) => !r.isTotal)
    const total = makeEmptyRow('总计', true)

    const sum = (field: keyof Row) =>
      monthRows.reduce((acc, r) => acc + (typeof r[field] === 'number' ? (r[field] as number) : 0), 0)

    total.planIncome = sum('planIncome') || null
    total.actualIncome = sum('actualIncome') || null
    total.refundCount = sum('refundCount') || null
    total.planEnrollment = sum('planEnrollment') || null
    total.grossEnrollment = sum('grossEnrollment') || null
    total.netEnrollment = sum('netEnrollment') || null
    total.orderCount = sum('orderCount') || null
    total.visitCount = sum('visitCount') || null
    total.planConsultVolume = sum('planConsultVolume') || null
    total.actualConsultVolume = sum('actualConsultVolume') || null
    total.planCost = sum('planCost') || null
    total.actualCost = sum('actualCost') || null

    recalcRow(total)
    return [total, ...monthRows]
  }

  const renderValue = (value: any, isTotal: boolean) => {
    const empty = value === null || value === undefined || value === ''
    if (empty) return '-'
    // 判断是否为零值
    const isZero = (typeof value === 'number' && value === 0) || value === '0' || value === '0%' || value === '1:0'
    return (
      <span style={{ fontWeight: isTotal ? 'bold' : 'normal', color: isZero ? '#999' : (isTotal ? '#c00000' : 'inherit') }}>
        {value}
      </span>
    )
  }

  const renderReadOnlyNumber = (record: Row, field: keyof Row) => {
    return renderValue((record as any)[field], record.isTotal)
  }

  const columns = useMemo(() => {
    return [
      {
        title: '月份',
        dataIndex: 'month',
        key: 'month',
        width: 50,
        align: 'center' as const,
        render: (text: string, record: Row) => (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal' }}>{text}</span>
          </div>
        ),
      },
      {
        title: '神殿收入',
        children: [
          {
            title: '新媒体计划收入',
            dataIndex: 'planIncome',
            key: 'planIncome',
            width: 85,
            align: 'center' as const,
            render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderReadOnlyNumber(record, 'planIncome')}</div>,
          },
          {
            title: '新媒体实际收入',
            dataIndex: 'actualIncome',
            key: 'actualIncome',
            width: 85,
            align: 'center' as const,
            render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderReadOnlyNumber(record, 'actualIncome')}</div>,
          },
          {
            title: '投产比',
            dataIndex: 'investmentRatio',
            key: 'investmentRatio',
            width: 65,
            align: 'center' as const,
            render: (val: string, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div>,
          },
        ],
      },
      {
        title: '神殿运营',
        children: [
          {
            title: '报名转化率',
            dataIndex: 'enrollmentConversionRate',
            key: 'enrollmentConversionRate',
            width: 75,
            align: 'center' as const,
            render: (val: string, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div>,
          },
          {
            title: '退费数',
            dataIndex: 'refundCount',
            key: 'refundCount',
            width: 60,
            align: 'center' as const,
            render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderReadOnlyNumber(record, 'refundCount')}</div>,
          },
          {
            title: '退费率',
            dataIndex: 'refundRate',
            key: 'refundRate',
            width: 65,
            align: 'center' as const,
            render: (val: string, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div>,
          },
        ],
      },
      {
        title: '神殿报名',
        children: [
          {
            title: '新媒体计划报名',
            dataIndex: 'planEnrollment',
            key: 'planEnrollment',
            width: 85,
            align: 'center' as const,
            render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderReadOnlyNumber(record, 'planEnrollment')}</div>,
          },
          {
            title: '毛报总数',
            dataIndex: 'grossEnrollment',
            key: 'grossEnrollment',
            width: 70,
            align: 'center' as const,
            render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderReadOnlyNumber(record, 'grossEnrollment')}</div>,
          },
          {
            title: '净报名',
            dataIndex: 'netEnrollment',
            key: 'netEnrollment',
            width: 60,
            align: 'center' as const,
            render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderReadOnlyNumber(record, 'netEnrollment')}</div>,
          },
          {
            title: '订座数',
            dataIndex: 'orderCount',
            key: 'orderCount',
            width: 60,
            align: 'center' as const,
            render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderReadOnlyNumber(record, 'orderCount')}</div>,
          },
          {
            title: '报名进度',
            dataIndex: 'enrollmentProgress',
            key: 'enrollmentProgress',
            width: 70,
            align: 'center' as const,
            render: (val: string, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div>,
          },
          {
            title: '净成本',
            dataIndex: 'netCost',
            key: 'netCost',
            width: 65,
            align: 'center' as const,
            render: (val: number | null, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div>,
          },
        ],
      },
      {
        title: '神殿上门',
        children: [
          {
            title: '上门人数',
            dataIndex: 'visitCount',
            key: 'visitCount',
            width: 70,
            align: 'center' as const,
            render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderReadOnlyNumber(record, 'visitCount')}</div>,
          },
          {
            title: '上门率',
            dataIndex: 'visitRate',
            key: 'visitRate',
            width: 65,
            align: 'center' as const,
            render: (val: string, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div>,
          },
        ],
      },
      {
        title: '市场网推数据',
        children: [
          {
            title: '新媒体计划咨询量',
            dataIndex: 'planConsultVolume',
            key: 'planConsultVolume',
            width: 95,
            align: 'center' as const,
            render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderReadOnlyNumber(record, 'planConsultVolume')}</div>,
          },
          {
            title: '实际总量',
            dataIndex: 'actualConsultVolume',
            key: 'actualConsultVolume',
            width: 70,
            align: 'center' as const,
            render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderReadOnlyNumber(record, 'actualConsultVolume')}</div>,
          },
          {
            title: '咨询量完成进度',
            dataIndex: 'consultCompletionProgress',
            key: 'consultCompletionProgress',
            width: 95,
            align: 'center' as const,
            render: (val: string, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div>,
          },
          {
            title: '咨询量成本',
            dataIndex: 'consultCost',
            key: 'consultCost',
            width: 75,
            align: 'center' as const,
            render: (val: number | null, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div>,
          },
          {
            title: '新媒体计划消费',
            dataIndex: 'planCost',
            key: 'planCost',
            width: 95,
            align: 'center' as const,
            render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderReadOnlyNumber(record, 'planCost')}</div>,
          },
          {
            title: '实际消费',
            dataIndex: 'actualCost',
            key: 'actualCost',
            width: 70,
            align: 'center' as const,
            render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderReadOnlyNumber(record, 'actualCost')}</div>,
          },
        ],
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          02市场部 {campusLabel}-{year}年度新媒体数据看板表
        </div>
      </Card>

      <Card className="campus-newmedia-dashboard-table">
        <Table<Row>
          columns={columns as any}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          rowClassName={(record) => (record.isTotal ? 'total-row' : '')}
        />

        <style>{`
          .campus-newmedia-dashboard-table .ant-table-thead > tr > th {
            background-color: #fce4d6 !important;
            text-align: center !important;
            font-weight: bold !important;
            border: 1px solid #d0d0d0 !important;
            padding: 2px 1px !important;
            font-size: 11px !important;
            line-height: 1.1 !important;
            vertical-align: middle !important;
            white-space: normal !important;
          }
          .campus-newmedia-dashboard-table .ant-table-tbody > tr > td {
            border: 1px solid #d0d0d0 !important;
            padding: 1px 1px !important;
            font-size: 11px !important;
            text-align: center !important;
          }
          .campus-newmedia-dashboard-table .ant-table-tbody > tr.total-row > td {
            background-color: #fff2cc !important;
            font-weight: bold !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

