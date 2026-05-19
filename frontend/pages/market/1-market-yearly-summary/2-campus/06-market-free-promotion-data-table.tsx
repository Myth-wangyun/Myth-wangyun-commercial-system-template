import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { App, Card, DatePicker, InputNumber, Space, Table, Button } from 'antd'
import { FileTextOutlined, TableOutlined, BarChartOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import axios from 'axios'
import { CampusMonthlyChartView } from './charts'

/**
 * 06最高议事厅 年度神殿市场免费推广表
 * - 年份默认显示当前年份，允许用户手动选择年份
 * - 神殿来自全局神殿选择器
 * - 按月份展示该神殿的市场免费推广数据
 */
export default function MarketFreePromotionDataTable() {
  const { message } = App.useApp()
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')
  const currentCampus = useCampusStore((s) => s.currentCampus)

  const campusLabel = useMemo(() => {
    const name = currentCampus || '主神殿'
    return name.includes('神殿') ? name : `${name}神殿`
  }, [currentCampus])

  type Row = {
    key: string
    month: string
    isTotal: boolean

    // 市场免费推广收入
    planIncome: number | null
    actualIncome: number | null
    investmentRatio: string // 投产比 1:x

    // 神殿运营
    enrollmentConversionRate: string // 报名转化率
    refundCount: number | null
    refundRate: string

    // 市场免费推广计划报名
    planEnrollment: number | null

    // 神殿报名
    grossEnrollment: number | null
    netEnrollment: number | null
    orderCount: number | null
    enrollmentProgress: string
    netCost: number | null

    // 神殿上门
    visitCount: number | null
    visitRate: string

    // 市场免费推广计划咨询量
    planConsultVolume: number | null

    // 市场免费推广数据
    actualConsultVolume: number | null
    consultCompletionProgress: string
    consultCost: number | null

    // 市场免费推广计划消费
    planCost: number | null

    // 实际消费
    actualCost: number | null
  }

  const calcRate = (numerator: number, denominator: number): string => {
    if (!denominator || denominator === 0) return ''
    return ((numerator / denominator) * 100).toFixed(2) + '%'
  }

  const calcInvestmentRatio = (income: number, cost: number): string => {
    if (!cost || cost === 0) return ''
    return `1:${(income / cost).toFixed(1)}`
  }

  const makeEmptyRow = (month: string, isTotal = false): Row => ({
    key: month,
    month,
    isTotal,
    planIncome: null,
    actualIncome: null,
    investmentRatio: '1:0',
    enrollmentConversionRate: '',
    refundCount: 0,
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

  const recalcRow = (row: Row) => {
    // 投产比：用"市场免费推广实际收入 / 实际消费"
    if (row.actualIncome && row.actualCost) {
      row.investmentRatio = calcInvestmentRatio(row.actualIncome, row.actualCost)
    } else {
      row.investmentRatio = '1:0'
    }

    // 报名转化率：用"净报名 / 实际总量"
    if (row.netEnrollment && row.actualConsultVolume) {
      row.enrollmentConversionRate = calcRate(row.netEnrollment, row.actualConsultVolume)
    } else {
      row.enrollmentConversionRate = ''
    }

    // 退费率：用"退费数 / 毛报总数"
    if (row.refundCount && row.grossEnrollment) {
      row.refundRate = calcRate(row.refundCount, row.grossEnrollment)
    } else {
      row.refundRate = ''
    }

    // 报名进度：用"净报名 / 市场免费推广计划报名"
    if (row.netEnrollment && row.planEnrollment) {
      row.enrollmentProgress = calcRate(row.netEnrollment, row.planEnrollment)
    } else {
      row.enrollmentProgress = ''
    }

    // 净成本：用"实际消费 / 净报名"
    if (row.actualCost && row.netEnrollment) {
      row.netCost = parseFloat((row.actualCost / row.netEnrollment).toFixed(2))
    } else {
      row.netCost = null
    }

    // 上门率：用"上门人数 / 实际总量"
    if (row.visitCount && row.actualConsultVolume) {
      row.visitRate = calcRate(row.visitCount, row.actualConsultVolume)
    } else {
      row.visitRate = ''
    }

    // 咨询量完成进度：用"实际总量 / 市场免费推广计划咨询量"
    if (row.actualConsultVolume && row.planConsultVolume) {
      row.consultCompletionProgress = calcRate(row.actualConsultVolume, row.planConsultVolume)
    } else {
      row.consultCompletionProgress = ''
    }

    // 咨询量成本：用"实际消费 / 实际总量"
    if (row.actualCost && row.actualConsultVolume) {
      row.consultCost = parseFloat((row.actualCost / row.actualConsultVolume).toFixed(2))
    } else {
      row.consultCost = null
    }
  }

  const recomputeTotal = (next: Row[]): Row[] => {
    const monthRows = next.filter((r) => !r.isTotal)
    const total = makeEmptyRow('总计', true)

    const sum = (field: keyof Row) =>
      monthRows.reduce(
        (acc, r) => acc + (typeof r[field] === 'number' ? (r[field] as number) : 0),
        0,
      )

    total.planIncome = sum('planIncome') || null
    total.actualIncome = sum('actualIncome') || null
    total.refundCount = sum('refundCount') || 0
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

  // 从API加载实际数据
  const loadActualData = useCallback(async () => {
    if (!currentCampus || !year) return
    try {
      const res = await axios.get('/api/v1/market/campus-annual/free-promotion-dashboard', {
        params: { campus: currentCampus, year }
      })
      const apiData = res.data?.data || {}
      
      setRows((prev) => {
        const next = prev.map((r) => ({ ...r }))
        for (const row of next) {
          if (row.isTotal) continue
          const monthNum = parseInt(row.month)
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
      console.error('加载免费推广数据看板失败:', err)
      message.error('加载数据失败')
    }
  }, [currentCampus, year])

  // 从月度计划API加载计划数据
  const loadPlanData = useCallback(async () => {
    if (!currentCampus || !year) return
    try {
      const res = await axios.get('/api/v1/market/monthly-plan/free-promotion/list', {
        params: { campus: currentCampus, year }
      })
      const planData = res.data?.data || {}
      
      setRows((prev) => {
        const next = prev.map((r) => ({ ...r }))
        for (const row of next) {
          if (row.isTotal) continue
          const monthNum = parseInt(row.month)
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
      console.error('加载免费推广计划数据失败:', err)
    }
  }, [currentCampus, year])

  // 当神殿或年份变化时重新加载数据
  useEffect(() => {
    loadActualData()
    loadPlanData()
  }, [loadActualData, loadPlanData])

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
    if (empty) return <div style={{ textAlign: 'center' }}>-</div>
    return (
      <div style={{ textAlign: 'center' }}>
        <span
          style={{
            fontWeight: isTotal ? 'bold' : 'normal',
            color: isTotal ? '#c00000' : 'inherit',
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
    )
  }

  const renderEditableNumber = (record: Row, field: keyof Row) => {
    // 所有数据都改为只读，不允许编辑
    return renderValue((record as any)[field], record.isTotal)
  }

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (!date) return
    setYear(date.format('YYYY'))
  }

  const columns = useMemo(() => {
    return [
      {
        title: '项目\n神殿',
        children: [
          {
            title: '月份',
            dataIndex: 'month',
            key: 'month',
            fixed: 'left' as const,
            width: 40,
            render: (text: string, record: Row) => (
              <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal' }}>{text}</span>
            ),
          },
        ],
      },
      {
        title: '市场免费推广收入',
        children: [
          {
            title: '市场免费推广计划收入',
            dataIndex: 'planIncome',
            key: 'planIncome',
            width: 50,
            align: 'right' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'planIncome'),
          },
          {
            title: '市场免费推广实际收入',
            dataIndex: 'actualIncome',
            key: 'actualIncome',
            width: 50,
            align: 'right' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'actualIncome'),
          },
          {
            title: '投产比',
            dataIndex: 'investmentRatio',
            key: 'investmentRatio',
            width: 45,
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
            width: 45,
            align: 'center' as const,
            render: (val: string, record: Row) => renderValue(val, record.isTotal),
          },
          {
            title: '退费数',
            dataIndex: 'refundCount',
            key: 'refundCount',
            width: 40,
            align: 'right' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'refundCount'),
          },
          {
            title: '退费率',
            dataIndex: 'refundRate',
            key: 'refundRate',
            width: 45,
            align: 'center' as const,
            render: (val: string, record: Row) => renderValue(val, record.isTotal),
          },
        ],
      },
      {
        title: '市场免费推广计划报名',
        dataIndex: 'planEnrollment',
        key: 'planEnrollment',
        width: 50,
        align: 'right' as const,
        render: (_: any, record: Row) => renderEditableNumber(record, 'planEnrollment'),
      },
      {
        title: '神殿报名',
        children: [
          {
            title: '毛报总数',
            dataIndex: 'grossEnrollment',
            key: 'grossEnrollment',
            width: 45,
            align: 'right' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'grossEnrollment'),
          },
          {
            title: '净报名',
            dataIndex: 'netEnrollment',
            key: 'netEnrollment',
            width: 45,
            align: 'right' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'netEnrollment'),
          },
          {
            title: '订座数',
            dataIndex: 'orderCount',
            key: 'orderCount',
            width: 45,
            align: 'right' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'orderCount'),
          },
          {
            title: '报名进度',
            dataIndex: 'enrollmentProgress',
            key: 'enrollmentProgress',
            width: 45,
            align: 'center' as const,
            render: (val: string, record: Row) => renderValue(val, record.isTotal),
          },
          {
            title: '净成本',
            dataIndex: 'netCost',
            key: 'netCost',
            width: 45,
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
            width: 45,
            align: 'right' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'visitCount'),
          },
          {
            title: '上门率',
            dataIndex: 'visitRate',
            key: 'visitRate',
            width: 45,
            align: 'center' as const,
            render: (val: string, record: Row) => renderValue(val, record.isTotal),
          },
        ],
      },
      {
        title: '市场免费推广计划咨询量',
        dataIndex: 'planConsultVolume',
        key: 'planConsultVolume',
        width: 50,
        align: 'right' as const,
        render: (_: any, record: Row) => renderEditableNumber(record, 'planConsultVolume'),
      },
      {
        title: '市场免费推广数据',
        children: [
          {
            title: '实际总量',
            dataIndex: 'actualConsultVolume',
            key: 'actualConsultVolume',
            width: 45,
            align: 'right' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'actualConsultVolume'),
          },
          {
            title: '咨询量完成进度',
            dataIndex: 'consultCompletionProgress',
            key: 'consultCompletionProgress',
            width: 50,
            align: 'center' as const,
            render: (val: string, record: Row) => renderValue(val, record.isTotal),
          },
          {
            title: '咨询量成本',
            dataIndex: 'consultCost',
            key: 'consultCost',
            width: 45,
            align: 'right' as const,
            render: (val: number | null, record: Row) => renderValue(val, record.isTotal),
          },
        ],
      },
      {
        title: '市场免费推广计划消费',
        dataIndex: 'planCost',
        key: 'planCost',
        width: 50,
        align: 'right' as const,
        render: (_: any, record: Row) => renderEditableNumber(record, 'planCost'),
      },
      {
        title: '实际消费',
        dataIndex: 'actualCost',
        key: 'actualCost',
        width: 45,
        align: 'right' as const,
        render: (_: any, record: Row) => renderEditableNumber(record, 'actualCost'),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            textAlign: 'center',
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 16,
          }}
        >
          <FileTextOutlined style={{ marginRight: 8 }} />
          06最高议事厅 {year}年度{campusLabel}市场免费推广表
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span>选择年份：</span>
            <DatePicker
              picker="year"
              value={dayjs(year, 'YYYY')}
              onChange={handleYearChange}
              allowClear={false}
              style={{ width: 140 }}
              format="YYYY年"
            />
          </Space>
          <Space>
            <Button
              type={viewMode === 'table' ? 'primary' : 'default'}
              icon={<TableOutlined />}
              onClick={() => setViewMode('table')}
            >
              表格视图
            </Button>
            <Button
              type={viewMode === 'chart' ? 'primary' : 'default'}
              icon={<BarChartOutlined />}
              onClick={() => setViewMode('chart')}
            >
              图表视图
            </Button>
          </Space>
        </div>
      </Card>

      {viewMode === 'table' ? (
      <Card>
        <Table<Row>
          columns={columns as any}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={undefined}
          rowClassName={(record) => (record.isTotal ? 'total-row' : '')}
        />

        <style>{`
          .ant-table-thead > tr > th {
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
          .ant-table-tbody > tr > td {
            border: 1px solid #d0d0d0 !important;
            padding: 1px 1px !important;
            font-size: 11px !important;
          }
          .ant-table-tbody > tr.total-row > td {
            background-color: #fff2cc !important;
            font-weight: bold !important;
          }
          .ant-input-number {
             width: 100% !important;
             font-size: 11px !important;
          }
          .ant-input-number-input {
             padding: 0 2px !important;
             height: 20px !important;
             text-align: right;
          }
        `}</style>
      </Card>
      ) : (
        <CampusMonthlyChartView
          data={rows}
          year={year}
          campusName={campusLabel}
          title="市场免费推广数据"
        />
      )}
    </div>
  )
}

