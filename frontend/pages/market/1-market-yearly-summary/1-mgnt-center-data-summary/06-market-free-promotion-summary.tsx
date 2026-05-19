import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { App, Card, DatePicker, InputNumber, Space, Table, Button } from 'antd'
import { FileTextOutlined, TableOutlined, BarChartOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampusName } from '@/utils/campusSort'
import axios from 'axios'
import { GenericChartView } from './charts'

/**
 * 06最高议事厅 市场部-市场免费推广招生汇总表
 * - 年份默认显示当前年份，允许用户手动选择年份
 * - 汇总所有神殿的市场免费推广数据
 */
export default function MarketFreePromotionSummary() {
  const { message } = App.useApp()
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')

  type Row = {
    key: string
    campus: string
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

  const makeEmptyRow = (campus: string, isTotal = false): Row => ({
    key: campus,
    campus,
    isTotal,
    planIncome: 0,
    actualIncome: 0,
    investmentRatio: '1:0',
    enrollmentConversionRate: '',
    refundCount: 0,
    refundRate: '',
    planEnrollment: 0,
    grossEnrollment: 0,
    netEnrollment: 0,
    orderCount: 0,
    enrollmentProgress: '',
    netCost: null,
    visitCount: 0,
    visitRate: '',
    planConsultVolume: 0,
    actualConsultVolume: 0,
    consultCompletionProgress: '',
    consultCost: null,
    planCost: 0,
    actualCost: 0,
  })

  const initialRows = useMemo<Row[]>(() => {
    // 使用 getAllCampuses 获取排序后的神殿列表
    const allCampuses = useCampusStore.getState().getAllCampuses()
    const campusNames = allCampuses.map(c => normalizeCampusName(c.name))
    return ['总计', ...campusNames].map((c) => makeEmptyRow(c, c === '总计'))
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

    // 报名进度：用"毛报总数 / 市场免费推广计划报名"
    if (row.grossEnrollment && row.planEnrollment) {
      row.enrollmentProgress = calcRate(row.grossEnrollment, row.planEnrollment)
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
    const campusRows = next.filter((r) => !r.isTotal)
    const total = makeEmptyRow('总计', true)

    const sum = (field: keyof Row) =>
      campusRows.reduce(
        (acc, r) => acc + (typeof r[field] === 'number' ? (r[field] as number) : 0),
        0,
      )

    total.planIncome = sum('planIncome') || 0
    total.actualIncome = sum('actualIncome') || 0
    total.refundCount = sum('refundCount') || 0
    total.planEnrollment = sum('planEnrollment') || 0
    total.grossEnrollment = sum('grossEnrollment') || 0
    total.netEnrollment = sum('netEnrollment') || 0
    total.orderCount = sum('orderCount') || 0
    total.visitCount = sum('visitCount') || 0
    total.planConsultVolume = sum('planConsultVolume') || 0
    total.actualConsultVolume = sum('actualConsultVolume') || 0
    total.planCost = sum('planCost') || 0
    total.actualCost = sum('actualCost') || 0

    recalcRow(total)
    return [total, ...campusRows]
  }

  // 从API加载所有神殿的实际数据
  const loadActualData = useCallback(async () => {
    if (!year) return
    try {
      const allCampuses = useCampusStore.getState().getAllCampuses()
      
      setRows((prev) => {
        const next = prev.map((r) => ({ ...r }))
        for (const row of next) {
          if (row.isTotal) continue
          row.actualIncome = 0
          row.refundCount = 0
          row.grossEnrollment = 0
          row.netEnrollment = 0
          row.orderCount = 0
          row.visitCount = 0
          row.actualConsultVolume = 0
          row.actualCost = 0
        }
        return next
      })
      
      for (const campusInfo of allCampuses) {
        const campusName = campusInfo.name
        const normalizedName = normalizeCampusName(campusName)
        
        try {
          const res = await axios.get('/api/v1/market/campus-annual/free-promotion-dashboard', {
            params: { campus: campusName, year }
          })
          const apiData = res.data?.data || {}
          
          let totalIncome = 0, totalRefund = 0, totalGross = 0, totalNet = 0
          let totalOrder = 0, totalVisit = 0, totalConsult = 0, totalCost = 0
          
          for (let month = 1; month <= 12; month++) {
            if (apiData[month]) {
              totalIncome += apiData[month].actual_income || 0
              totalRefund += apiData[month].refund_count || 0
              totalGross += apiData[month].gross_enrollment || 0
              totalNet += apiData[month].net_enrollment || 0
              totalOrder += apiData[month].order_count || 0
              totalVisit += apiData[month].visit_count || 0
              totalConsult += apiData[month].actual_consult_volume || 0
              totalCost += apiData[month].actual_cost || 0
            }
          }
          
          setRows((prev) => {
            const next = prev.map((r) => ({ ...r }))
            const idx = next.findIndex((r) => r.key === normalizedName)
            if (idx !== -1 && !next[idx].isTotal) {
              next[idx].actualIncome = totalIncome || 0
              next[idx].refundCount = totalRefund || 0
              next[idx].grossEnrollment = totalGross || 0
              next[idx].netEnrollment = totalNet || 0
              next[idx].orderCount = totalOrder || 0
              next[idx].visitCount = totalVisit || 0
              next[idx].actualConsultVolume = totalConsult || 0
              next[idx].actualCost = totalCost || 0
              recalcRow(next[idx])
            }
            return recomputeTotal(next)
          })
        } catch (err) {
          console.error(`加载神殿 ${campusName} 免费推广数据失败:`, err)
        }
      }
    } catch (err) {
      console.error('加载免费推广数据汇总失败:', err)
      message.error('加载数据失败')
    }
  }, [year])

  // 从月度计划API加载计划数据
  const loadPlanData = useCallback(async () => {
    if (!year) return
    try {
      const allCampuses = useCampusStore.getState().getAllCampuses()
      
      for (const campusInfo of allCampuses) {
        const campusName = campusInfo.name
        const normalizedName = normalizeCampusName(campusName)
        
        try {
          const res = await axios.get('/api/v1/market/monthly-plan/free-promotion/list', {
            params: { campus: campusName, year }
          })
          const planData = res.data?.data || {}
          
          let totalPlanIncome = 0, totalPlanEnrollment = 0, totalPlanConsult = 0, totalPlanCost = 0
          
          for (let month = 1; month <= 12; month++) {
            if (planData[month]) {
              totalPlanIncome += planData[month].plan_income || 0
              totalPlanEnrollment += planData[month].plan_enrollment || 0
              totalPlanConsult += planData[month].plan_consult_volume || 0
              totalPlanCost += planData[month].plan_cost || 0
            }
          }
          
          setRows((prev) => {
            const next = prev.map((r) => ({ ...r }))
            const idx = next.findIndex((r) => r.key === normalizedName)
            if (idx !== -1 && !next[idx].isTotal) {
              next[idx].planIncome = totalPlanIncome || 0
              next[idx].planEnrollment = totalPlanEnrollment || 0
              next[idx].planConsultVolume = totalPlanConsult || 0
              next[idx].planCost = totalPlanCost || 0
              recalcRow(next[idx])
            }
            return recomputeTotal(next)
          })
        } catch (err) {
          console.error(`加载神殿 ${campusName} 免费推广计划数据失败:`, err)
        }
      }
    } catch (err) {
      console.error('加载免费推广计划数据汇总失败:', err)
    }
  }, [year])

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

      ;(next[idx] as any)[field] = value ?? 0
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
            title: '神殿',
            dataIndex: 'campus',
            key: 'campus',
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
            width: 35,
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
            width: 35,
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
            width: 50,
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
            width: 50,
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
        width: 50,
        align: 'right' as const,
        render: (_: any, record: Row) => renderEditableNumber(record, 'actualCost'),
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Card bodyStyle={{ padding: '8px 12px' }}>
      <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              marginRight: 16,
            }}
          >
            <FileTextOutlined style={{ marginRight: 6 }} />
            06最高议事厅 市场部-{year}年度市场免费推广招生汇总表
          </div>
          <Space size="small">
            <span style={{ fontSize: 12 }}>年份：</span>
            <DatePicker
              picker="year"
              value={dayjs(year, 'YYYY')}
              onChange={handleYearChange}
              allowClear={false}
              size="small"
              style={{ width: 100 }}
              format="YYYY年"
            />
          </Space>
        </div>
        <Space>
          <Button
            type={viewMode === 'table' ? 'primary' : 'default'}
            icon={<TableOutlined />}
            onClick={() => setViewMode('table')}
            size="small"
          >
            表格
          </Button>
          <Button
            type={viewMode === 'chart' ? 'primary' : 'default'}
            icon={<BarChartOutlined />}
            onClick={() => setViewMode('chart')}
            size="small"
          >
            图表
          </Button>
        </Space>
      </div>

      {viewMode === 'table' ? (
        <>
          <Table<Row>
            columns={columns as any}
            dataSource={rows}
            pagination={false}
            bordered
            size="small"
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
              white-space: normal !important;
              vertical-align: middle !important;
            }
            .ant-table-tbody > tr > td {
              border: 1px solid #d0d0d0 !important;
              padding: 1px 1px !important;
              font-size: 11px !important;
              line-height: 1.3 !important;
            }
            .ant-table-tbody > tr.total-row > td {
              background-color: #fff2cc !important;
              font-weight: bold !important;
            }
            .ant-input-number {
              font-size: 11px !important;
            }
            .ant-input-number-input {
              padding: 0 4px !important;
              height: 20px !important;
            }
          `}</style>
        </>
      ) : (
        <GenericChartView data={rows} year={year} title="市场免费推广" />
      )}
    </Card>
  )
}

