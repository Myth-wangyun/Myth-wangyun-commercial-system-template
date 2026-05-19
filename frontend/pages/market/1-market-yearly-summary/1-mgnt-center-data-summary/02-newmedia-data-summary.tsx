import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { App, Card, DatePicker, InputNumber, Space, Table, Button } from 'antd'
import { FileTextOutlined, TableOutlined, BarChartOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampusName } from '@/utils/campusSort'
import axios from 'axios'
import { getNetworkPlanData } from '@/services/market/newmediaBreakdownService'
import { NewMediaChartView } from './charts'

/**
 * 02最高议事厅 市场部-年度新媒体数据看板汇总
 * - 年份默认显示当前年份，允许用户手动选择年份
 * - 汇总所有神殿的新媒体数据
 */
export default function NewMediaDataSummary() {
  const { message } = App.useApp()
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table')

  type Row = {
    key: string
    campus: string
    isTotal: boolean

    // 神殿收入
    planIncome: number | null
    standardIncome: number | null
    investmentRatio: string // 投产比 1:x

    // 神殿运营
    enrollmentConversionRate: string // 报名转化率
    refundCount: number | null
    refundRate: string

    // 新媒体计划报名
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

    // 新媒体计划咨询量
    planConsultVolume: number | null

    // 市场网推数据
    actualConsultVolume: number | null
    consultCompletionProgress: string

    // 新媒体计划消费
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
    planIncome: null,
    standardIncome: null,
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
    planCost: null,
    actualCost: null,
  })

  const initialRows = useMemo<Row[]>(() => {
    // 使用 getAllCampuses 获取排序后的神殿列表
    const allCampuses = useCampusStore.getState().getAllCampuses()
    const campusNames = allCampuses.map(c => normalizeCampusName(c.name))
    return ['总计', ...campusNames].map((c) => makeEmptyRow(c, c === '总计'))
  }, [])

  const [rows, setRows] = useState<Row[]>(initialRows)

  const recalcRow = (row: Row) => {
    // 投产比：用"标准实收入 / 实际消费"
    if (row.standardIncome && row.actualCost) {
      row.investmentRatio = calcInvestmentRatio(row.standardIncome, row.actualCost)
    } else {
      row.investmentRatio = ''
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

    // 报名进度：用"毛报总数 / 新媒体计划报名"
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

    // 咨询量完成进度：用"实际总量 / 新媒体计划咨询量"
    if (row.actualConsultVolume && row.planConsultVolume) {
      row.consultCompletionProgress = calcRate(row.actualConsultVolume, row.planConsultVolume)
    } else {
      row.consultCompletionProgress = ''
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

    total.planIncome = sum('planIncome') || null
    total.standardIncome = sum('standardIncome') || null
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
          row.standardIncome = null
          row.refundCount = null
          row.grossEnrollment = null
          row.netEnrollment = null
          row.orderCount = null
          row.visitCount = null
          row.actualConsultVolume = null
          row.actualCost = null
        }
        return next
      })
      
      for (const campusInfo of allCampuses) {
        const campusName = campusInfo.name
        const normalizedName = normalizeCampusName(campusName)
        
        try {
          const res = await axios.get('/api/v1/market/campus-annual/newmedia-dashboard', {
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
              next[idx].standardIncome = totalIncome || null
              next[idx].refundCount = totalRefund || null
              next[idx].grossEnrollment = totalGross || null
              next[idx].netEnrollment = totalNet || null
              next[idx].orderCount = totalOrder || null
              next[idx].visitCount = totalVisit || null
              next[idx].actualConsultVolume = totalConsult || null
              next[idx].actualCost = totalCost || null
              recalcRow(next[idx])
            }
            return recomputeTotal(next)
          })
        } catch (err) {
          console.error(`加载神殿 ${campusName} 新媒体数据失败:`, err)
        }
      }
    } catch (err) {
      console.error('加载新媒体数据汇总失败:', err)
      message.error('加载数据失败')
    }
  }, [year])

  // 从API加载所有神殿的计划数据
  const loadPlanData = useCallback(async () => {
    if (!year) return
    try {
      const allCampuses = useCampusStore.getState().getAllCampuses()
      
      for (const campusInfo of allCampuses) {
        const campusName = campusInfo.name
        const normalizedName = normalizeCampusName(campusName)
        
        try {
          const planData = await getNetworkPlanData(year, campusName)
          
          let totalPlanIncome = 0, totalPlanEnrollment = 0, totalPlanConsult = 0, totalPlanCost = 0
          
          for (const item of planData) {
            if (item.month >= 1 && item.month <= 12) {
              totalPlanIncome += item.newmedia_plan_income || 0
              totalPlanEnrollment += item.newmedia_plan_signup || 0
              totalPlanConsult += item.newmedia_plan_consult || 0
              totalPlanCost += item.newmedia_plan_cost || 0
            }
          }
          
          setRows((prev) => {
            const next = prev.map((r) => ({ ...r }))
            const idx = next.findIndex((r) => r.key === normalizedName)
            if (idx !== -1 && !next[idx].isTotal) {
              next[idx].planIncome = totalPlanIncome || null
              next[idx].planEnrollment = totalPlanEnrollment || null
              next[idx].planConsultVolume = totalPlanConsult || null
              next[idx].planCost = totalPlanCost || null
              recalcRow(next[idx])
            }
            return recomputeTotal(next)
          })
        } catch (err) {
          console.error(`加载神殿 ${campusName} 新媒体计划数据失败:`, err)
        }
      }
    } catch (err) {
      console.error('加载新媒体计划数据汇总失败:', err)
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
        title: '项目',
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
        title: '神殿收入',
        children: [
          {
            title: '新媒体计划收入',
            dataIndex: 'planIncome',
            key: 'planIncome',
            width: 50,
            align: 'right' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'planIncome'),
          },
          {
            title: '标准实收入',
            dataIndex: 'standardIncome',
            key: 'standardIncome',
            width: 50,
            align: 'right' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'standardIncome'),
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
        title: '新媒体计划报名',
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
        title: '新媒体计划咨询量',
        dataIndex: 'planConsultVolume',
        key: 'planConsultVolume',
        width: 50,
        align: 'right' as const,
        render: (_: any, record: Row) => renderEditableNumber(record, 'planConsultVolume'),
      },
      {
        title: '市场网推数据',
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
        ],
      },
      {
        title: '新媒体计划消费',
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
            02最高议事厅 市场部-{year}年度新媒体数据看板汇总
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
        <NewMediaChartView data={rows} year={year} />
      )}
    </Card>
  )
}
