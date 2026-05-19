import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { App, Card, InputNumber, Table } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { useMarketMonthlyDataStore } from '@/stores/marketMonthlyDataStore'
import { useRefreshEventStore } from '@/stores/refreshEventStore'
import { networkPartnerAnnualService } from '@/services/market/networkPartnerAnnual'
import axios from 'axios'

/**
 * 01市场部 {神殿}-{year}年度网络合作伙伴数据看板
 * - 神殿：全局神殿选择器（useCampusStore.currentCampus）
 * - 年份：顶部年份选择器（useMarketMonthlyDataStore.year，默认当前年，可切换）
 * - 计划数据：从02明细页面的汇总数据自动获取（只读）
 */
export default function NetworkPartnerDashboard01() {
  const { message } = App.useApp()
  const currentCampus = useCampusStore((s) => s.currentCampus)
  const year = useMarketMonthlyDataStore((s) => s.year)
  const networkPartnerPlanRefreshKey = useRefreshEventStore((s) => s.networkPartnerPlanRefreshKey)

  const campusLabel = useMemo(() => {
    const name = currentCampus || '主神殿'
    return name.includes('神殿') ? name : `${name}神殿`
  }, [currentCampus])

  type Row = {
    key: string
    month: string
    isTotal: boolean

    // 网络合作伙伴收入
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

    // 市场网络合作伙伴数据
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

  // 从API加载数据
  useEffect(() => {
    const loadData = async () => {
      if (!currentCampus || !year) return

      try {
        const res = await networkPartnerAnnualService.getDashboard(currentCampus, year)
        if (res.data) {
          const apiData = res.data
          setRows((prev) => {
            const next = prev.map((r) => ({ ...r }))

            // 遍历1-12月的数据
            for (let i = 1; i <= 12; i++) {
              const monthData = apiData[i]
              if (!monthData) continue

              const monthRow = next.find((r) => r.key === `${i}月`)
              if (!monthRow) continue

              // 填充从API获取的数据
              monthRow.actualIncome = monthData.actual_income || null
              monthRow.refundCount = monthData.refund_count || null
              monthRow.grossEnrollment = monthData.gross_enrollment || null
              monthRow.netEnrollment = monthData.net_enrollment || null
              monthRow.orderCount = monthData.order_count || null
              monthRow.visitCount = monthData.visit_count || null
              monthRow.actualConsultVolume = monthData.actual_consult_volume || null
              monthRow.actualCost = monthData.actual_cost || null

              // 重新计算该行的计算字段
              recalcRow(monthRow)
            }

            // 重新计算总计
            return recomputeTotal(next)
          })
        }
      } catch (error) {
        console.error('加载网络合作伙伴年度数据失败:', error)
        message.error('加载数据失败')
      }
    }

    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampus, year])

  // 加载计划数据
  const loadPlanData = useCallback(async () => {
    if (!currentCampus) return
    try {
      const res = await axios.get('/api/v1/market/monthly-plan/network-partner/list', {
        params: { campus: currentCampus, year }
      })
      const planData = res.data?.data || {}
      
      setRows((prev) => {
        const next = prev.map((r) => ({ ...r }))
        for (const row of next) {
          if (row.isTotal) continue
          const monthNum = parseInt(row.month) // "1月" -> 1
          // 先清空计划字段，再填充新数据
          row.planIncome = null
          row.planEnrollment = null
          row.planConsultVolume = null
          row.planCost = null
          if (planData[monthNum]) {
            row.planIncome = planData[monthNum].plan_income || null
            row.planEnrollment = planData[monthNum].plan_enrollment || null
            row.planConsultVolume = planData[monthNum].plan_consult_volume || null
            row.planCost = planData[monthNum].plan_cost || null
          }
          recalcRow(row)
        }
        return recomputeTotal(next)
      })
    } catch (err) {
      console.warn('加载计划数据失败:', err)
    }
  }, [currentCampus, year])

  // 加载计划数据（当02页面保存后通过store触发刷新）
  useEffect(() => {
    loadPlanData()
  }, [loadPlanData, networkPartnerPlanRefreshKey])

  const recalcRow = (row: Row) => {
    // 投产比：用“合作伙伴实际收入 / 实际消费”
    row.investmentRatio =
      row.actualIncome && row.actualCost ? calcInvestmentRatio(row.actualIncome, row.actualCost) : ''

    // 报名转化率：用“净报名 / 实际总量”
    row.enrollmentConversionRate =
      row.netEnrollment && row.actualConsultVolume ? calcRate(row.netEnrollment, row.actualConsultVolume) : ''

    // 退费率：用“退费数 / 毛报总数”
    row.refundRate =
      row.refundCount && row.grossEnrollment ? calcRate(row.refundCount, row.grossEnrollment) : ''

    // 报名进度：用“毛报总数 / 合作伙伴计划报名”
    row.enrollmentProgress =
      row.netEnrollment && row.planEnrollment ? calcRate(row.netEnrollment, row.planEnrollment) : ''

    // 上门率：用“上门人数 / 实际总量”
    row.visitRate =
      row.visitCount && row.actualConsultVolume ? calcRate(row.visitCount, row.actualConsultVolume) : ''

    // 咨询量完成进度：用“实际总量 / 合作伙伴计划咨询量”
    row.consultCompletionProgress =
      row.actualConsultVolume && row.planConsultVolume
        ? calcRate(row.actualConsultVolume, row.planConsultVolume)
        : ''

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
        title: '网络合作伙伴收入',
        children: [
          {
            title: '合作伙伴计划收入',
            dataIndex: 'planIncome',
            key: 'planIncome',
            width: 85,
            align: 'center' as const,
            render: (val: number | null, record: Row) => renderValue(val, record.isTotal),
          },
          {
            title: '合作伙伴实际收入',
            dataIndex: 'actualIncome',
            key: 'actualIncome',
            width: 85,
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
            title: '合作伙伴计划报名',
            dataIndex: 'planEnrollment',
            key: 'planEnrollment',
            width: 85,
            align: 'center' as const,
            render: (val: number | null, record: Row) => renderValue(val, record.isTotal),
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
            align: 'right' as const,
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
        title: '市场网络合作伙伴数据',
        children: [
          {
            title: '合作伙伴计划咨询量',
            dataIndex: 'planConsultVolume',
            key: 'planConsultVolume',
            width: 95,
            align: 'center' as const,
            render: (val: number | null, record: Row) => renderValue(val, record.isTotal),
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
            width: 80,
            align: 'center' as const,
            render: (val: string, record: Row) => renderValue(val, record.isTotal),
          },
          {
            title: '咨询量成本',
            dataIndex: 'consultCost',
            key: 'consultCost',
            width: 65,
            align: 'right' as const,
            render: (val: number | null, record: Row) => renderValue(val, record.isTotal),
          },
          {
            title: '合作伙伴计划消费',
            dataIndex: 'planCost',
            key: 'planCost',
            width: 95,
            align: 'center' as const,
            render: (val: number | null, record: Row) => renderValue(val, record.isTotal),
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
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span>
          <FileTextOutlined style={{ marginRight: 8 }} />
          01市场部 {campusLabel}-{year}年度网络合作伙伴数据看板
        </span>
        <span style={{ fontSize: '12px', color: '#666' }}>
          （计划数据来自02明细页面汇总）
        </span>
      </div>

      <Card className="network-partner-01-dashboard-table">
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
          .network-partner-01-dashboard-table .ant-table-thead > tr > th {
            background-color: #fce4d6 !important;
            text-align: center !important;
            font-weight: bold !important;
            border: 1px solid #000 !important;
            padding: 6px 2px !important;
            font-size: 12px !important;
          }
          .network-partner-01-dashboard-table .ant-table-tbody > tr > td {
            border: 1px solid #000 !important;
            padding: 4px 4px !important;
            font-size: 12px !important;
          }
          .network-partner-01-dashboard-table .ant-table-tbody > tr.total-row > td {
            background-color: #fff2cc !important;
            font-weight: bold !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

