import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, InputNumber, Table, Spin } from 'antd'
import { FileTextOutlined, LoadingOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { useMarketMonthlyDataStore } from '@/stores/marketMonthlyDataStore'
import { marketSemDailyDataService, type YearlySummaryItem } from '@/services/market/marketSemDailyData'

/**
 * 01市场部 {神殿}-{year}年度SEM推广数据看板
 * - 神殿来自全局神殿选择器（useCampusStore.currentCampus）
 * - 年份来自顶部年份选择器（useMarketMonthlyDataStore.year）
 */
export default function SemPromotionDashboard01() {
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

    // 市场网推数据（SEM）
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
  const [loading, setLoading] = useState(false)

  // 从API加载年度数据
  const loadYearlyData = async () => {
    if (!currentCampus || !year) return
    
    setLoading(true)
    try {
      const response = await marketSemDailyDataService.getYearlySummary(currentCampus, parseInt(year, 10))
      if (response.items && response.items.length > 0) {
        setRows((prev) => {
          const next = prev.map((r) => ({ ...r }))
          
          // 更新每月数据
          for (const item of response.items) {
            const monthKey = `${item.month}月`
            const idx = next.findIndex((r) => r.key === monthKey)
            if (idx !== -1 && !next[idx].isTotal) {
              // 从市场部年度网络计划表获取的计划数据
              next[idx].planIncome = item.plan.plan_income || null
              next[idx].planEnrollment = item.plan.plan_signup || null
              next[idx].planConsultVolume = item.plan.plan_consult || null
              next[idx].planCost = item.plan.plan_cost || null
              
              // 从SEM日常数据表获取的实际值
              next[idx].actualIncome = item.total.actual_income || null
              next[idx].refundCount = item.total.refund_count || null
              next[idx].netEnrollment = item.total.net_signup || null
              next[idx].grossEnrollment = item.total.gross_total || null
              next[idx].orderCount = item.total.order_count || null
              next[idx].visitCount = item.total.visit_count || null
              next[idx].actualConsultVolume = item.total.consult_count || null
              next[idx].actualCost = item.total.consumption || null
              
              // 重新计算派生字段
              recalcRow(next[idx])
            }
          }
          
          return recomputeTotal(next)
        })
        message.success('数据加载成功')
      }
    } catch (error: any) {
      console.error('加载年度数据失败:', error)
      message.error(`加载数据失败: ${error.message || '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  // 当神殿或年份变化时自动加载数据
  useEffect(() => {
    loadYearlyData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year])

  const recalcRow = (row: Row) => {
    // 投产比：用“SEM实际收入 / 实际消费”
    row.investmentRatio =
      row.actualIncome && row.actualCost ? calcInvestmentRatio(row.actualIncome, row.actualCost) : ''

    // 报名转化率：用“净报名 / 实际总量”
    row.enrollmentConversionRate =
      row.netEnrollment && row.actualConsultVolume ? calcRate(row.netEnrollment, row.actualConsultVolume) : ''

    // 退费率：用“退费数 / 毛报总数”
    row.refundRate =
      row.refundCount && row.grossEnrollment ? calcRate(row.refundCount, row.grossEnrollment) : ''

    // 报名进度：用“毛报总数 / SEM计划报名”
    row.enrollmentProgress =
      row.netEnrollment && row.planEnrollment ? calcRate(row.netEnrollment, row.planEnrollment) : ''

    // 上门率：用“上门人数 / 实际总量”
    row.visitRate =
      row.visitCount && row.actualConsultVolume ? calcRate(row.visitCount, row.actualConsultVolume) : ''

    // 咨询量完成进度：用“实际总量 / SEM计划咨询量”
    row.consultCompletionProgress =
      row.actualConsultVolume && row.planConsultVolume ? calcRate(row.actualConsultVolume, row.planConsultVolume) : ''

    // 咨询量成本：用“实际消费 / 实际总量”
    row.consultCost =
      row.actualCost && row.actualConsultVolume
        ? parseFloat((row.actualCost / row.actualConsultVolume).toFixed(2))
        : null

    // 净成本：用“实际消费 / 净报名”
    row.netCost =
      row.actualCost && row.netEnrollment ? parseFloat((row.actualCost / row.netEnrollment).toFixed(2)) : null
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

  const updateValue = (key: string, field: keyof Row, value: number | null) => {
    setRows((prev) => {
      const next = prev.map((r) => ({ ...r }))
      const idx = next.findIndex((r) => r.key === key)
      if (idx === -1) return prev
      if (next[idx].isTotal) return prev

      ;(next[idx] as any)[field] = value
      recalcRow(next[idx])
      return recomputeTotal(next)
    })
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

  const renderEditableNumber = (record: Row, field: keyof Row) => {
    return renderValue((record as any)[field], record.isTotal)
  }

  const columns = useMemo(() => {
    return [
      {
        title: '月份',
        dataIndex: 'month',
        key: 'month',
        width: 45,
        align: 'center' as const,
        render: (text: string, record: Row) => (
          <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal' }}>{text}</span>
        ),
      },
      {
        title: '神殿收入',
        children: [
          {
            title: 'SEM计划收入',
            dataIndex: 'planIncome',
            key: 'planIncome',
            width: 72,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'planIncome'),
          },
          {
            title: 'SEM实际收入',
            dataIndex: 'actualIncome',
            key: 'actualIncome',
            width: 72,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'actualIncome'),
          },
          {
            title: '投产比',
            dataIndex: 'investmentRatio',
            key: 'investmentRatio',
            width: 50,
            align: 'center' as const,
            render: (val: string, record: Row) => renderValue(val, record.isTotal),
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
            width: 65,
            align: 'center' as const,
            render: (val: string, record: Row) => renderValue(val, record.isTotal),
          },
          {
            title: '退费数',
            dataIndex: 'refundCount',
            key: 'refundCount',
            width: 48,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'refundCount'),
          },
          {
            title: '退费率',
            dataIndex: 'refundRate',
            key: 'refundRate',
            width: 50,
            align: 'center' as const,
            render: (val: string, record: Row) => renderValue(val, record.isTotal),
          },
        ],
      },
      {
        title: '神殿报名',
        children: [
          {
            title: 'SEM计划报名',
            dataIndex: 'planEnrollment',
            key: 'planEnrollment',
            width: 72,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'planEnrollment'),
          },
          {
            title: '毛报总数',
            dataIndex: 'grossEnrollment',
            key: 'grossEnrollment',
            width: 55,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'grossEnrollment'),
          },
          {
            title: '净报名',
            dataIndex: 'netEnrollment',
            key: 'netEnrollment',
            width: 50,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'netEnrollment'),
          },
          {
            title: '订座数',
            dataIndex: 'orderCount',
            key: 'orderCount',
            width: 48,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'orderCount'),
          },
          {
            title: '报名进度',
            dataIndex: 'enrollmentProgress',
            key: 'enrollmentProgress',
            width: 55,
            align: 'center' as const,
            render: (val: string, record: Row) => renderValue(val, record.isTotal),
          },
          {
            title: '净成本',
            dataIndex: 'netCost',
            key: 'netCost',
            width: 55,
            align: 'center' as const,
            render: (val: number | null, record: Row) => renderValue(val, record.isTotal),
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
            width: 55,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'visitCount'),
          },
          {
            title: '上门率',
            dataIndex: 'visitRate',
            key: 'visitRate',
            width: 50,
            align: 'center' as const,
            render: (val: string, record: Row) => renderValue(val, record.isTotal),
          },
        ],
      },
      {
        title: '市场网推数据',
        children: [
          {
            title: 'SEM计划咨询量',
            dataIndex: 'planConsultVolume',
            key: 'planConsultVolume',
            width: 82,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'planConsultVolume'),
          },
          {
            title: '实际总量',
            dataIndex: 'actualConsultVolume',
            key: 'actualConsultVolume',
            width: 55,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'actualConsultVolume'),
          },
          {
            title: '咨询量完成进度',
            dataIndex: 'consultCompletionProgress',
            key: 'consultCompletionProgress',
            width: 72,
            align: 'center' as const,
            render: (val: string, record: Row) => renderValue(val, record.isTotal),
          },
          {
            title: '咨询量成本',
            dataIndex: 'consultCost',
            key: 'consultCost',
            width: 65,
            align: 'center' as const,
            render: (val: number | null, record: Row) => renderValue(val, record.isTotal),
          },
          {
            title: 'SEM计划消费',
            dataIndex: 'planCost',
            key: 'planCost',
            width: 82,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'planCost'),
          },
          {
            title: '实际消费',
            dataIndex: 'actualCost',
            key: 'actualCost',
            width: 55,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'actualCost'),
          },
        ],
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '10px 16px',
          color: '#000',
          borderRadius: 0,
          border: '1px solid #000',
          backgroundColor: '#fff2cc',
        }}
      >
        <FileTextOutlined style={{ marginRight: 8 }} />
        01市场部 {campusLabel}-{year}年度SEM推广数据看板
        {loading && <LoadingOutlined style={{ marginLeft: 8 }} />}
      </div>

      <Spin spinning={loading}>
        <Card className="sem-breakdown-01-dashboard-table" style={{ overflowX: 'auto' }}>
          <Table<Row>
            columns={columns as any}
            dataSource={rows}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => (record.isTotal ? 'total-row' : '')}
          />

          <style>{`
            .sem-breakdown-01-dashboard-table .ant-table-thead > tr > th {
              background-color: #fce4d6 !important;
              text-align: center !important;
              font-weight: bold !important;
              border: 1px solid #000 !important;
              padding: 6px 2px !important;
              font-size: 12px !important;
            }
            .sem-breakdown-01-dashboard-table .ant-table-tbody > tr > td {
              border: 1px solid #000 !important;
              padding: 4px 4px !important;
              font-size: 12px !important;
            }
            .sem-breakdown-01-dashboard-table .ant-table-tbody > tr.total-row > td {
              background-color: #fff2cc !important;
              font-weight: bold !important;
            }
          `}</style>
        </Card>
      </Spin>
    </div>
  )
}

