import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { App, Card, InputNumber, Spin, Table, Tooltip, Button } from 'antd'
import { FileTextOutlined, SyncOutlined } from '@ant-design/icons'
import { useMarketMonthlyDataStore } from '@/stores/marketMonthlyDataStore'
import { useCampusStore } from '@/stores/campusStore'
import { marketDailyReputationDataService } from '@/services/market/marketDailyReputationData'
import type { MonthlySummaryData } from '@/services/market/marketDailyReputationData'
import axios from 'axios'

/**
 * 05最高议事厅 市场部-市场口碑招生汇总表
 * - 年份来自年份选择器（useMarketMonthlyDataStore.year）
 * - 汇总所有神殿的市场口碑数据
 * - 部分数据从7 市场部口碑日度数据表自动获取
 */
export default function MarketReputationSummaryTable() {
  const { message } = App.useApp()
  const year = useMarketMonthlyDataStore((s) => s.year)
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)

  type Row = {
    key: string
    campus: string
    isTotal: boolean

    // 市场口碑计划收入
    planIncome: number | null
    standardIncome: number | null

    // 投产比
    investmentRatio: string

    // 报名转化率
    enrollmentConversionRate: string
    // 退客数
    refundCount: number | null
    // 退客率
    refundRate: string

    // 市场口碑计划报名
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

    // 市场口碑计划咨询量
    planConsultVolume: number | null

    // 市场口碑数据
    actualConsultVolume: number | null
    consultCompletionProgress: string
    consultCost: number | null

    // 市场口碑计划消费和实际消费
    planExpense: number | null
    actualExpense: number | null
  }

  const calcRate = (numerator: number, denominator: number): string => {
    if (!denominator || denominator === 0) return '0%'
    return ((numerator / denominator) * 100).toFixed(2) + '%'
  }

  const calcInvestmentRatio = (income: number, cost: number): string => {
    if (!cost || cost === 0) return '1:0'
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
    consultCost: null,
    planExpense: null,
    actualExpense: null,
  })

  const initialRows = useMemo<Row[]>(() => {
    const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
    return ['总计', ...months].map((m) => makeEmptyRow(m, m === '总计'))
  }, [])

  const [rows, setRows] = useState<Row[]>(initialRows)

  // 从日度数据表自动获取数据
  const loadDailyReputationData = async () => {
    if (!currentCampus) {
      console.log('没有选择神殿，无法加载数据')
      return
    }
    
    setLoading(true)
    try {
      const yearNum = parseInt(year, 10)
      console.log('开始加载日度数据汇总:', { campus: currentCampus, year: yearNum })
      const res = await marketDailyReputationDataService.getYearlySummary(currentCampus, yearNum)
      console.log('API响应:', res)
      
      // 注意：这个API直接返回数据对象，不是包装在 ApiResponse.data 中
      const data = (res?.data || res) as any
      console.log('提取的data:', data)
      
      if (data?.months && Array.isArray(data.months)) {
        console.log('开始更新行数据，月份数据:', data.months)
        setRows((prev) => {
          const next = prev.map((r) => ({ ...r }))
          
          // 更新每个月的数据
          data.months.forEach((monthData: any) => {
            const monthKey = `${monthData.month}月`
            const idx = next.findIndex((r) => r.key === monthKey)
            console.log(`处理月份 ${monthData.month}:`, { monthKey, idx, monthData })
            if (idx !== -1 && !next[idx].isTotal) {
              // 从日度数据获取的字段（只读，自动填充）
              next[idx].standardIncome = monthData.partner_income || null
              next[idx].refundCount = monthData.refund_count || null
              next[idx].netEnrollment = monthData.net_signup || null
              next[idx].grossEnrollment = monthData.gross_count || null
              next[idx].orderCount = monthData.order_count || null
              next[idx].visitCount = monthData.visit_count || null
              next[idx].actualConsultVolume = monthData.actual_consult_count || null
              
              console.log(`更新后的行 ${idx}:`, next[idx])
              
              // 重新计算派生字段
              recalcRow(next[idx])
            }
          })
          
          const result = recomputeTotal(next)
          console.log('最终返回的rows:', result)
          return result
        })
      } else {
        console.warn('数据格式不正确:', { data, hasMonths: data?.months, isArray: Array.isArray(data?.months) })
      }
    } catch (e) {
      console.error('加载日度汇总数据失败:', e)
    } finally {
      setLoading(false)
    }
  }

  // 加载计划数据
  const loadPlanData = useCallback(async () => {
    if (!currentCampus) return
    try {
      const res = await axios.get('/api/v1/market/monthly-plan/reputation/list', {
        params: { campus: currentCampus, year }
      })
      const planData = res.data?.data || {}
      
      setRows((prev) => {
        const next = prev.map((r) => ({ ...r }))
        for (const row of next) {
          if (row.isTotal) continue
          const monthNum = parseInt(row.campus) // "1月" -> 1
          // 先清空计划字段，再填充新数据
          row.planIncome = null
          row.planEnrollment = null
          row.planConsultVolume = null
          row.planExpense = null
          row.actualExpense = null
          if (planData[monthNum]) {
            row.planIncome = planData[monthNum].plan_income || null
            row.planEnrollment = planData[monthNum].plan_enrollment || null
            row.planConsultVolume = planData[monthNum].plan_consult_volume || null
            row.planExpense = planData[monthNum].plan_cost || null
            row.actualExpense = planData[monthNum].actual_expense || null
          }
          recalcRow(row)
        }
        return recomputeTotal(next)
      })
    } catch (err) {
      console.warn('加载计划数据失败:', err)
    }
  }, [currentCampus, year])

  // 保存计划数据
  const savePlanData = useCallback(async () => {
    if (!currentCampus) {
      message.warning('请先选择神殿')
      return
    }
    setLoading(true)
    try {
      const planItems = rows
        .filter((r) => !r.isTotal)
        .map((r) => ({
          month: parseInt(r.campus),
          plan_income: r.planIncome || 0,
          plan_enrollment: r.planEnrollment || 0,
          plan_consult_volume: r.planConsultVolume || 0,
          plan_cost: r.planExpense || 0,
          actual_expense: r.actualExpense || 0,
        }))
      
      await axios.post('/api/v1/market/monthly-plan/reputation/save', {
        campus: currentCampus,
        year: year,
        data: planItems
      })
      message.success('数据保存成功')
    } catch (err) {
      console.error('保存数据失败:', err)
      message.error('保存数据失败')
    } finally {
      setLoading(false)
    }
  }, [rows, currentCampus, year])

  // 当年份或神殿变化时，自动加载日度数据和计划数据
  useEffect(() => {
    loadDailyReputationData()
    loadPlanData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, currentCampus])

  const recalcRow = (row: Row) => {
    // 投产比：使用标准收入和实际消费计算
    if (row.standardIncome && row.actualExpense && row.actualExpense > 0) {
      row.investmentRatio = calcInvestmentRatio(row.standardIncome, row.actualExpense)
    } else {
      row.investmentRatio = ''
    }

    // 报名转化率：用"净报名 / 实际总量"
    if (row.netEnrollment && row.actualConsultVolume) {
      row.enrollmentConversionRate = calcRate(row.netEnrollment, row.actualConsultVolume)
    } else {
      row.enrollmentConversionRate = ''
    }

    // 退客率：用"退客数 / 毛报总数"
    if (row.refundCount && row.grossEnrollment) {
      row.refundRate = calcRate(row.refundCount, row.grossEnrollment)
    } else {
      row.refundRate = ''
    }

    // 报名进度：用"净报名 / 市场口碑计划报名"
    if (row.netEnrollment && row.planEnrollment) {
      row.enrollmentProgress = calcRate(row.netEnrollment, row.planEnrollment)
    } else {
      row.enrollmentProgress = ''
    }

    // 上门率：用"上门人数 / 实际总量"
    if (row.visitCount && row.actualConsultVolume) {
      row.visitRate = calcRate(row.visitCount, row.actualConsultVolume)
    } else {
      row.visitRate = ''
    }

    // 咨询量完成进度：用"实际总量 / 市场口碑计划咨询量"
    if (row.actualConsultVolume && row.planConsultVolume) {
      row.consultCompletionProgress = calcRate(row.actualConsultVolume, row.planConsultVolume)
    } else {
      row.consultCompletionProgress = ''
    }

    // 咨询量成本：实际消费 ÷ 实际总量
    if (row.actualExpense && row.actualConsultVolume && row.actualConsultVolume > 0) {
      row.consultCost = Math.round(row.actualExpense / row.actualConsultVolume)
    } else {
      row.consultCost = null
    }

    // 净成本：实际消费 ÷ 净报名
    if (row.actualExpense && row.netEnrollment && row.netEnrollment > 0) {
      row.netCost = Math.round(row.actualExpense / row.netEnrollment)
    } else {
      row.netCost = null
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
    total.standardIncome = sum('standardIncome') || null
    total.refundCount = sum('refundCount') || null
    total.planEnrollment = sum('planEnrollment') || null
    total.grossEnrollment = sum('grossEnrollment') || null
    total.netEnrollment = sum('netEnrollment') || null
    total.orderCount = sum('orderCount') || null
    total.visitCount = sum('visitCount') || null
    total.planConsultVolume = sum('planConsultVolume') || null
    total.actualConsultVolume = sum('actualConsultVolume') || null
    total.netCost = sum('netCost') || null
    total.consultCost = sum('consultCost') || null
    total.planExpense = sum('planExpense') || null
    total.actualExpense = sum('actualExpense') || null

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
    return (
      <span
        style={{
          fontWeight: isTotal ? 'bold' : 'normal',
        }}
      >
        {value}
      </span>
    )
  }

  // 渲染从日度数据自动获取的只读数值
  const renderAutoFilledNumber = (record: Row, field: keyof Row) => {
    const value = (record as any)[field] as number | null
    return renderValue(value, record.isTotal)
  }

  const renderEditableNumber = (record: Row, field: keyof Row) => {
    if (record.isTotal) return renderValue((record as any)[field], true)
    // 只有 actualExpense 字段可编辑，其他字段都只读
    if (field !== 'actualExpense') {
      return renderValue((record as any)[field], false)
    }
    return (
      <InputNumber
        value={(record as any)[field] as number | null}
        onChange={(val) => updateValue(record.key, field, val)}
        style={{ width: '100%' }}
        size="small"
        min={0}
      />
    )
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
            width: 45,
            align: 'center' as const,
            render: (text: string, record: Row) => (
              <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal' }}>{text}</span>
            ),
          },
        ],
      },
      {
        title: '市场口碑计划收入',
        children: [
          {
            title: '计划收入',
            dataIndex: 'planIncome',
            key: 'planIncome',
            width: 60,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'planIncome'),
          },
          {
            title: '实际收入',
            dataIndex: 'standardIncome',
            key: 'standardIncome',
            width: 60,
            align: 'center' as const,
            render: (_: any, record: Row) => renderAutoFilledNumber(record, 'standardIncome'),
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
            render: (_: any, record: Row) => renderAutoFilledNumber(record, 'refundCount'),
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
        title: '市场口碑计划报名',
        dataIndex: 'planEnrollment',
        key: 'planEnrollment',
        width: 60,
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
            width: 60,
            align: 'center' as const,
            render: (_: any, record: Row) => renderAutoFilledNumber(record, 'grossEnrollment'),
          },
          {
            title: '净报名',
            dataIndex: 'netEnrollment',
            key: 'netEnrollment',
            width: 50,
            align: 'center' as const,
            render: (_: any, record: Row) => renderAutoFilledNumber(record, 'netEnrollment'),
          },
          {
            title: '订座数',
            dataIndex: 'orderCount',
            key: 'orderCount',
            width: 48,
            align: 'center' as const,
            render: (_: any, record: Row) => renderAutoFilledNumber(record, 'orderCount'),
          },
          {
            title: '报名进度',
            dataIndex: 'enrollmentProgress',
            key: 'enrollmentProgress',
            width: 60,
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
            width: 60,
            align: 'center' as const,
            render: (_: any, record: Row) => renderAutoFilledNumber(record, 'visitCount'),
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
        title: '市场口碑计划咨询量',
        dataIndex: 'planConsultVolume',
        key: 'planConsultVolume',
        width: 60,
        align: 'center' as const,
        render: (_: any, record: Row) => renderEditableNumber(record, 'planConsultVolume'),
      },
      {
        title: '市场口碑数据',
        children: [
          {
            title: '实际总量',
            dataIndex: 'actualConsultVolume',
            key: 'actualConsultVolume',
            width: 60,
            align: 'center' as const,
            render: (_: any, record: Row) => renderAutoFilledNumber(record, 'actualConsultVolume'),
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
            title: '市场口碑计划消费',
            dataIndex: 'planExpense',
            key: 'planExpense',
            width: 60,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'planExpense'),
          },
          {
            title: '实际消费',
            dataIndex: 'actualExpense',
            key: 'actualExpense',
            width: 60,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'actualExpense'),
          },
        ],
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
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
          gap: 8,
        }}
      >
        <FileTextOutlined style={{ marginRight: 8 }} />
        05最高议事厅 市场部-{year}年市场口碑招生汇总表
        <Tooltip title="从日度数据表刷新数据">
          <SyncOutlined
            spin={loading}
            style={{ marginLeft: 12, cursor: 'pointer', fontSize: 16 }}
            onClick={loadDailyReputationData}
          />
        </Tooltip>
        <Button
          type="primary"
          onClick={savePlanData}
          loading={loading}
          size="small"
          style={{ marginLeft: 12, backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          保存数据
        </Button>
      </div>

      <Spin spinning={loading} tip="正在从日度数据表获取数据...">
        <Card bodyStyle={{ padding: 0, overflow: 'visible' }} className="market-reputation-table-wrapper" style={{ overflowX: 'auto' }}>
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
            .market-reputation-table-wrapper .ant-table-thead > tr > th {
              background-color: #fce4d6 !important;
              text-align: center !important;
              font-weight: bold !important;
              border: 1px solid #000 !important;
              padding: 4px 2px !important;
              white-space: nowrap !important;
              font-size: 12px !important;
            }
            .market-reputation-table-wrapper .ant-table-tbody > tr > td {
              border: 1px solid #000 !important;
              padding: 4px 4px !important;
              white-space: nowrap !important;
              font-size: 12px !important;
            }
            .market-reputation-table-wrapper .ant-table-tbody > tr.total-row > td {
              background-color: #fff2cc !important;
              font-weight: bold !important;
            }
            .market-reputation-table-wrapper .ant-input-number {
              font-size: 12px !important;
            }
            .market-reputation-table-wrapper .ant-input-number-input {
              padding: 2px 4px !important;
            }
          `}</style>
        </Card>
      </Spin>
    </div>
  )
}
