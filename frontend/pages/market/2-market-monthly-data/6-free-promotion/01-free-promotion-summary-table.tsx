import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { App, Card, InputNumber, Table, Button, Spin } from 'antd'
import { FileTextOutlined, SyncOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { useMarketMonthlyDataStore } from '@/stores/marketMonthlyDataStore'
import axios from 'axios'

/**
 * 06市场部 {神殿}-{年份}年度免费推广数据看板表
 * - 神殿来自全局神殿选择器（useCampusStore.currentCampus）
 * - 年份来自年份选择器（useMarketMonthlyDataStore.year）
 * - 实际数据自动从020市场部免费推广日度数据表API获取
 */
export default function FreePromotionSummaryTable() {
  const { message } = App.useApp()
  const currentCampus = useCampusStore((s) => s.currentCampus)
  const year = useMarketMonthlyDataStore((s) => s.year)
  const [loading, setLoading] = useState(false)

  const campusLabel = useMemo(() => {
    const name = currentCampus || '主神殿'
    return name.includes('神殿') ? name : `${name}神殿`
  }, [currentCampus])

  // 获取用于API调用的神殿名称
  const campusName = useMemo(() => {
    return currentCampus || '河北主神殿'
  }, [currentCampus])

  type Row = {
    key: string
    month: string
    isTotal: boolean

    // 市场免费推广收入
    planIncome: number | null
    actualIncome: number | null

    // 投产比
    investmentRatio: string

    // 神殿运营
    enrollmentConversionRate: string
    refundCount: number | null
    refundRate: string

    // 市场免费推广计划报名
    planEnrollment: number | null

    // 神殿报名
    grossEnrollment: number | null
    netEnrollment: number | null
    orderCount: number | null
    enrollmentProgress: string
    netCost: string

    // 神殿上门
    visitCount: number | null
    visitRate: string

    // 市场免费推广计划咨询量
    planConsultVolume: number | null

    // 市场免费推广数据
    actualConsultVolume: number | null
    consultCompletionProgress: string
    consultCost: string

    // 市场免费推广计划消费
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

  const calcCost = (cost: number, volume: number): string => {
    if (!volume || volume === 0) return '0'
    return (cost / volume).toFixed(2)
  }

  const makeEmptyRow = (month: string, isTotal = false): Row => ({
    key: month,
    month,
    isTotal,
    planIncome: isTotal ? 0 : null,
    actualIncome: isTotal ? 0 : null,
    investmentRatio: '1:0',
    enrollmentConversionRate: '0%',
    refundCount: isTotal ? 0 : null,
    refundRate: '0%',
    planEnrollment: isTotal ? 0 : null,
    grossEnrollment: isTotal ? 0 : null,
    netEnrollment: isTotal ? 0 : null,
    orderCount: isTotal ? 0 : null,
    enrollmentProgress: '0%',
    netCost: '0',
    visitCount: isTotal ? 0 : null,
    visitRate: '0%',
    planConsultVolume: isTotal ? 0 : null,
    actualConsultVolume: isTotal ? 0 : null,
    consultCompletionProgress: '0%',
    consultCost: '0',
    planCost: isTotal ? 0 : null,
    actualCost: isTotal ? 0 : null,
  })

  const initialRows = useMemo<Row[]>(() => {
    const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
    return ['总计', ...months].map((m) => makeEmptyRow(m, m === '总计'))
  }, [])

  const [rows, setRows] = useState<Row[]>(initialRows)

  // 从日度数据表API获取年度汇总数据（优化版：1个请求代替72个请求）
  const loadDailyData = useCallback(async () => {
    setLoading(true)
    try {
      // 调用优化后的年度汇总API，一次获取所有6个平台12个月的汇总数据
      const res = await axios.get('/api/v1/market/free-promotion-daily/yearly-summary', {
        params: { campus: campusName, year }
      })
      const monthlyData = res.data?.data || {}

      // 更新rows中的实际数据字段
      setRows((prev) => {
        const next = prev.map((r) => ({ ...r }))
        for (const row of next) {
          if (row.isTotal) continue
          const monthNum = parseInt(row.month) // "1月" -> 1
          if (monthlyData[monthNum]) {
            row.actualIncome = monthlyData[monthNum].actualIncome || null
            row.refundCount = monthlyData[monthNum].refundCount || null
            row.grossEnrollment = monthlyData[monthNum].grossEnrollment || null
            row.netEnrollment = monthlyData[monthNum].netEnrollment || null
            row.orderCount = monthlyData[monthNum].orderCount || null
            row.visitCount = monthlyData[monthNum].visitCount || null
            row.actualConsultVolume = monthlyData[monthNum].actualConsultVolume || null
            row.actualCost = monthlyData[monthNum].actualCost || null
            recalcRow(row)
          }
        }
        return recomputeTotal(next)
      })

      message.success('已从日度数据表刷新实际数据')
    } catch (err) {
      console.error('加载日度数据失败:', err)
      message.error('加载日度数据失败')
    } finally {
      setLoading(false)
    }
  }, [campusName, year])

  // 加载计划数据
  const loadPlanData = useCallback(async () => {
    try {
      const res = await axios.get('/api/v1/market/monthly-plan/free-promotion/list', {
        params: { campus: campusName, year }
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
  }, [campusName, year])

  // 保存计划数据
  const savePlanData = useCallback(async () => {
    setLoading(true)
    try {
      const planItems = rows
        .filter((r) => !r.isTotal)
        .map((r) => ({
          month: parseInt(r.month),
          plan_income: r.planIncome || 0,
          plan_enrollment: r.planEnrollment || 0,
          plan_consult_volume: r.planConsultVolume || 0,
          plan_cost: r.planCost || 0,
        }))
      
      await axios.post('/api/v1/market/monthly-plan/free-promotion/save', {
        campus: campusName,
        year: year,
        data: planItems
      })
      message.success('计划数据保存成功')
    } catch (err) {
      console.error('保存计划数据失败:', err)
      message.error('保存计划数据失败')
    } finally {
      setLoading(false)
    }
  }, [rows, campusName, year])

  // 初始加载时自动获取日度数据和计划数据
  useEffect(() => {
    loadDailyData()
    loadPlanData()
  }, [loadDailyData, loadPlanData])

  const recalcRow = (row: Row) => {
    // 投产比：用"实际收入 / 实际消费"
    if (row.actualIncome && row.actualCost) {
      row.investmentRatio = calcInvestmentRatio(row.actualIncome, row.actualCost)
    } else {
      row.investmentRatio = '1:0'
    }

    // 报名转化率：用"净报名 / 实际总量"
    if (row.netEnrollment && row.actualConsultVolume) {
      row.enrollmentConversionRate = calcRate(row.netEnrollment, row.actualConsultVolume)
    } else {
      row.enrollmentConversionRate = '0%'
    }

    // 退费率：用"退费数 / 毛报总数"
    if (row.refundCount && row.grossEnrollment) {
      row.refundRate = calcRate(row.refundCount, row.grossEnrollment)
    } else {
      row.refundRate = '0%'
    }

    // 报名进度：用"净报名 / 计划报名"
    if (row.netEnrollment && row.planEnrollment) {
      row.enrollmentProgress = calcRate(row.netEnrollment, row.planEnrollment)
    } else {
      row.enrollmentProgress = '0%'
    }

    // 净成本：用"实际消费 / 净报名"
    if (row.actualCost && row.netEnrollment) {
      row.netCost = calcCost(row.actualCost, row.netEnrollment)
    } else {
      row.netCost = '0'
    }

    // 上门率：用"上门人数 / 实际总量"
    if (row.visitCount && row.actualConsultVolume) {
      row.visitRate = calcRate(row.visitCount, row.actualConsultVolume)
    } else {
      row.visitRate = '0%'
    }

    // 咨询量完成进度：用"实际总量 / 计划咨询量"
    if (row.actualConsultVolume && row.planConsultVolume) {
      row.consultCompletionProgress = calcRate(row.actualConsultVolume, row.planConsultVolume)
    } else {
      row.consultCompletionProgress = '0%'
    }

    // 咨询量成本：用"实际消费 / 实际总量"
    if (row.actualCost && row.actualConsultVolume) {
      row.consultCost = calcCost(row.actualCost, row.actualConsultVolume)
    } else {
      row.consultCost = '0'
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

    total.planIncome = sum('planIncome')
    total.actualIncome = sum('actualIncome')
    total.refundCount = sum('refundCount')
    total.planEnrollment = sum('planEnrollment')
    total.grossEnrollment = sum('grossEnrollment')
    total.netEnrollment = sum('netEnrollment')
    total.orderCount = sum('orderCount')
    total.visitCount = sum('visitCount')
    total.planConsultVolume = sum('planConsultVolume')
    total.actualConsultVolume = sum('actualConsultVolume')
    total.planCost = sum('planCost')
    total.actualCost = sum('actualCost')

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
      <span
        style={{
          fontWeight: isTotal ? 'bold' : 'normal',
          color: isZero ? '#999' : (isTotal ? '#c00000' : 'inherit'),
        }}
      >
        {value}
      </span>
    )
  }

  const renderEditableNumber = (record: Row, field: keyof Row) => {
    return renderValue((record as any)[field], record.isTotal)
  }

  // 只读数字渲染（用于从API自动获取的实际数据）
  const renderReadonlyNumber = (record: Row, field: keyof Row) => {
    const value = (record as any)[field]
    if (value === null || value === undefined) return '-'
    return (
      <span
        style={{
          fontWeight: record.isTotal ? 'bold' : 'normal',
          color: record.isTotal ? '#c00000' : '#1890ff',
          fontStyle: 'normal',
        }}
      >
        {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
    )
  }

  const columns = useMemo(() => {
    return [
      {
        title: '项目',
        children: [
          {
            title: '神殿',
            dataIndex: 'month',
            key: 'month',
            width: 45,
            align: 'center' as const,
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
            width: 95,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'planIncome'),
          },
          {
            title: '市场免费推广实际收入',
            dataIndex: 'actualIncome',
            key: 'actualIncome',
            width: 95,
            align: 'center' as const,
            render: (_: any, record: Row) => renderReadonlyNumber(record, 'actualIncome'),
          },
        ],
      },
      {
        title: '投产比',
        dataIndex: 'investmentRatio',
        key: 'investmentRatio',
        width: 50,
        align: 'center' as const,
        render: (val: string, record: Row) => renderValue(val, record.isTotal),
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
            render: (_: any, record: Row) => renderReadonlyNumber(record, 'refundCount'),
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
        title: '市场免费推广计划报名',
        dataIndex: 'planEnrollment',
        key: 'planEnrollment',
        width: 95,
        align: 'center' as const,
        render: (_: any, record: Row) => renderEditableNumber(record, 'planEnrollment'),
      },
      {
        title: '神殿报名',
        children: [
          {
            title: '毛报总数',
            dataIndex: 'grossEnrollment',
            key: 'grossEnrollment',
            width: 55,
            align: 'center' as const,
            render: (_: any, record: Row) => renderReadonlyNumber(record, 'grossEnrollment'),
          },
          {
            title: '净报名',
            dataIndex: 'netEnrollment',
            key: 'netEnrollment',
            width: 50,
            align: 'center' as const,
            render: (_: any, record: Row) => renderReadonlyNumber(record, 'netEnrollment'),
          },
          {
            title: '订座数',
            dataIndex: 'orderCount',
            key: 'orderCount',
            width: 48,
            align: 'center' as const,
            render: (_: any, record: Row) => renderReadonlyNumber(record, 'orderCount'),
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
            render: (val: string, record: Row) => renderValue(val, record.isTotal),
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
            render: (_: any, record: Row) => renderReadonlyNumber(record, 'visitCount'),
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
        title: '市场免费推广计划咨询量',
        dataIndex: 'planConsultVolume',
        key: 'planConsultVolume',
        width: 95,
        align: 'center' as const,
        render: (_: any, record: Row) => renderEditableNumber(record, 'planConsultVolume'),
      },
      {
        title: '市场免费推广数据',
        children: [
          {
            title: '实际总量',
            dataIndex: 'actualConsultVolume',
            key: 'actualConsultVolume',
            width: 55,
            align: 'center' as const,
            render: (_: any, record: Row) => renderReadonlyNumber(record, 'actualConsultVolume'),
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
            render: (val: string, record: Row) => renderValue(val, record.isTotal),
          },
        ],
      },
      {
        title: '市场免费推广计划消费',
        dataIndex: 'planCost',
        key: 'planCost',
        width: 95,
        align: 'center' as const,
        render: (_: any, record: Row) => renderEditableNumber(record, 'planCost'),
      },
      {
        title: '实际消费',
        dataIndex: 'actualCost',
        key: 'actualCost',
        width: 55,
        align: 'center' as const,
        render: (_: any, record: Row) => renderReadonlyNumber(record, 'actualCost'),
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
          06市场部 {campusLabel}-{year}年度免费推广数据看板表
        </span>
        <Button
          type="primary"
          icon={<SyncOutlined spin={loading} />}
          onClick={loadDailyData}
          loading={loading}
          size="small"
        >
          从日度数据刷新
        </Button>
        <Button
          type="primary"
          onClick={savePlanData}
          loading={loading}
          size="small"
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          保存计划数据
        </Button>
      </div>

      <Card className="free-promotion-table-wrapper">
        <Spin spinning={loading} tip="正在从日度数据表加载...">
          <Table<Row>
            columns={columns as any}
            dataSource={rows}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => (record.isTotal ? 'total-row' : '')}
          />
        </Spin>

          <style>{`
            .free-promotion-table-wrapper .ant-table-thead > tr > th {
              background-color: #fce4d6 !important;
              text-align: center !important;
              font-weight: bold !important;
              border: 1px solid #000 !important;
              padding: 6px 2px !important;
              font-size: 12px !important;
            }
            .free-promotion-table-wrapper .ant-table-tbody > tr > td {
              border: 1px solid #000 !important;
              padding: 4px 4px !important;
              font-size: 12px !important;
            }
            .free-promotion-table-wrapper .ant-table-tbody > tr.total-row > td {
              background-color: #fff2cc !important;
              font-weight: bold !important;
            }
          `}</style>
      </Card>
    </div>
  )
}

