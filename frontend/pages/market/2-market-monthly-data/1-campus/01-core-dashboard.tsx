import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { App, Card, DatePicker, Space, Table, Spin, Button } from 'antd'
import { FileTextOutlined, SaveOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import axios from 'axios'
import { getNetworkPlanData } from '@/services/market/newmediaBreakdownService'
import { getCoreAnnualData, saveCoreAnnualData } from '@/services/market/campusCoreAnnualService'

/**
 * 01核心数据看板 - 河北主神殿年度市场网络中心数据表
 * 数据来源：汇总自新媒体、SEM、网络合作伙伴、口碑、免费推广5个表
 * 计划数据：来自年度网络计划表
 */
export default function CoreDashboard() {
  const { message } = App.useApp()
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)
  const [loading, setLoading] = useState(false)
  const currentCampus = useCampusStore((s) => s.currentCampus)

  const campusLabel = useMemo(() => {
    const name = currentCampus || '主神殿'
    return name.includes('神殿') ? name : `${name}神殿`
  }, [currentCampus])

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
    if (row.actualIncome && row.actualCost) {
      row.investmentRatio = calcInvestmentRatio(row.actualIncome, row.actualCost)
    } else {
      row.investmentRatio = '1:0'
    }
    if (row.netEnrollment && row.actualConsultVolume) {
      row.enrollmentConversionRate = calcRate(row.netEnrollment, row.actualConsultVolume)
    } else {
      row.enrollmentConversionRate = ''
    }
    if (row.refundCount && row.grossEnrollment) {
      row.refundRate = calcRate(row.refundCount, row.grossEnrollment)
    } else {
      row.refundRate = ''
    }
    // 报名进度 = 净报名 / 计划报名
    if (row.netEnrollment && row.planEnrollment) {
      row.enrollmentProgress = calcRate(row.netEnrollment, row.planEnrollment)
    } else {
      row.enrollmentProgress = ''
    }
    if (row.actualCost && row.netEnrollment) {
      row.netCost = parseFloat((row.actualCost / row.netEnrollment).toFixed(2))
    } else {
      row.netCost = null
    }
    if (row.visitCount && row.actualConsultVolume) {
      row.visitRate = calcRate(row.visitCount, row.actualConsultVolume)
    } else {
      row.visitRate = ''
    }
    if (row.actualConsultVolume && row.planConsultVolume) {
      row.consultCompletionProgress = calcRate(row.actualConsultVolume, row.planConsultVolume)
    } else {
      row.consultCompletionProgress = ''
    }
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
      monthRows.reduce((acc, r) => acc + (typeof r[field] === 'number' ? (r[field] as number) : 0), 0)
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

  const loadActualData = useCallback(async () => {
    if (!currentCampus || !year) return
    setLoading(true)
    try {
      // 从5个看板并行获取数据，然后汇总
      const [newmediaRes, semRes, partnerRes, reputationRes, freePromotionRes] = await Promise.all([
        axios.get('/api/v1/market/campus-annual/newmedia-dashboard', { params: { campus: currentCampus, year } }).catch(() => ({ data: { data: {} } })),
        axios.get('/api/v1/market/campus-annual/sem-dashboard', { params: { campus: currentCampus, year } }).catch(() => ({ data: { data: {} } })),
        axios.get('/api/v1/market/campus-annual/online-partner-dashboard', { params: { campus: currentCampus, year } }).catch(() => ({ data: { data: {} } })),
        axios.get('/api/v1/market/campus-annual/reputation-dashboard', { params: { campus: currentCampus, year } }).catch(() => ({ data: { data: {} } })),
        axios.get('/api/v1/market/campus-annual/free-promotion-dashboard', { params: { campus: currentCampus, year } }).catch(() => ({ data: { data: {} } })),
      ])
      
      const newmediaData = newmediaRes.data?.data || {}
      const semData = semRes.data?.data || {}
      const partnerData = partnerRes.data?.data || {}
      const reputationData = reputationRes.data?.data || {}
      const freePromotionData = freePromotionRes.data?.data || {}
      
      setRows((prev) => {
        const next = prev.map((r) => ({ ...r }))
        for (const row of next) {
          if (row.isTotal) continue
          const monthNum = parseInt(row.month)
          
          // 汇总各表的数据
          const nm = newmediaData[monthNum] || {}
          const sem = semData[monthNum] || {}
          const partner = partnerData[monthNum] || {}
          const reputation = reputationData[monthNum] || {}
          const free = freePromotionData[monthNum] || {}
          
          // 汇总实际收入
          row.actualIncome = (nm.actual_income || 0) + (sem.actual_income || 0) + (partner.actual_income || 0) + (reputation.actual_income || 0) + (free.actual_income || 0) || null
          // 汇总退费数
          row.refundCount = (nm.refund_count || 0) + (sem.refund_count || 0) + (partner.refund_count || 0) + (reputation.refund_count || 0) + (free.refund_count || 0) || null
          // 汇总毛报名
          row.grossEnrollment = (nm.gross_enrollment || 0) + (sem.gross_enrollment || 0) + (partner.gross_enrollment || 0) + (reputation.gross_enrollment || 0) + (free.gross_enrollment || 0) || null
          // 汇总净报名
          row.netEnrollment = (nm.net_enrollment || 0) + (sem.net_enrollment || 0) + (partner.net_enrollment || 0) + (reputation.net_enrollment || 0) + (free.net_enrollment || 0) || null
          // 汇总订座数
          row.orderCount = (nm.order_count || 0) + (sem.order_count || 0) + (partner.order_count || 0) + (reputation.order_count || 0) + (free.order_count || 0) || null
          // 汇总上门人数
          row.visitCount = (nm.visit_count || 0) + (sem.visit_count || 0) + (partner.visit_count || 0) + (reputation.visit_count || 0) + (free.visit_count || 0) || null
          // 汇总实际咨询量
          row.actualConsultVolume = (nm.actual_consult_volume || 0) + (sem.actual_consult_volume || 0) + (partner.actual_consult_volume || 0) + (reputation.actual_consult_volume || 0) + (free.actual_consult_volume || 0) || null
          // 汇总实际消费
          row.actualCost = (nm.actual_cost || 0) + (sem.actual_cost || 0) + (partner.actual_cost || 0) + (reputation.actual_cost || 0) + (free.actual_cost || 0) || null
          
          recalcRow(row)
        }
        return recomputeTotal(next)
      })
    } catch (err) {
      console.error('加载核心数据看板失败:', err)
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }, [currentCampus, year])

  const loadPlanData = useCallback(async () => {
    if (!currentCampus || !year) return
    try {
      const planData = await getNetworkPlanData(year, currentCampus)
      setRows((prev) => {
        const next = prev.map((r) => ({ ...r }))
        for (const row of next) {
          if (row.isTotal) continue
          const monthNum = parseInt(row.month)
          const planItem = planData.find((p) => p.month === monthNum)
          if (planItem) {
            row.planIncome = planItem.network_plan_income || null
            row.planEnrollment = planItem.network_plan_signup || null
            row.planConsultVolume = planItem.network_plan_total || null
            row.planCost = planItem.network_plan_cost || null
          }
          recalcRow(row)
        }
        return recomputeTotal(next)
      })
    } catch (err) {
      console.error('加载计划数据失败:', err)
    }
  }, [currentCampus, year])

  useEffect(() => {
    loadActualData()
    loadPlanData()
    loadSavedData()
  }, [loadActualData, loadPlanData])

  // 加载已保存的数据
  const loadSavedData = useCallback(async () => {
    if (!currentCampus || !year) return
    try {
      const savedData = await getCoreAnnualData(currentCampus, year)
      if (Object.keys(savedData).length > 0) {
        setRows((prev) => {
          const next = prev.map((r) => ({ ...r }))
          for (const row of next) {
            if (row.isTotal) continue
            const monthNum = parseInt(row.month)
            const saved = savedData[monthNum]
            if (saved) {
              // 使用保存的数据覆盖计算的数据
              row.planIncome = saved.plan_income ?? row.planIncome
              row.actualIncome = saved.actual_income ?? row.actualIncome
              row.investmentRatio = saved.investment_ratio || row.investmentRatio
              row.enrollmentConversionRate = saved.enrollment_conversion_rate || row.enrollmentConversionRate
              row.refundCount = saved.refund_count ?? row.refundCount
              row.refundRate = saved.refund_rate || row.refundRate
              row.planEnrollment = saved.plan_enrollment ?? row.planEnrollment
              row.grossEnrollment = saved.gross_enrollment ?? row.grossEnrollment
              row.netEnrollment = saved.net_enrollment ?? row.netEnrollment
              row.orderCount = saved.order_count ?? row.orderCount
              row.enrollmentProgress = saved.enrollment_progress || row.enrollmentProgress
              row.netCost = saved.net_cost ?? row.netCost
              row.visitCount = saved.visit_count ?? row.visitCount
              row.visitRate = saved.visit_rate || row.visitRate
              row.planConsultVolume = saved.plan_consult_volume ?? row.planConsultVolume
              row.actualConsultVolume = saved.actual_consult_volume ?? row.actualConsultVolume
              row.consultCompletionProgress = saved.consult_completion_progress || row.consultCompletionProgress
              row.consultCost = saved.consult_cost ?? row.consultCost
              row.planCost = saved.plan_cost ?? row.planCost
              row.actualCost = saved.actual_cost ?? row.actualCost
            }
          }
          return recomputeTotal(next)
        })
      }
    } catch (err) {
      console.error('加载已保存数据失败:', err)
    }
  }, [currentCampus, year])

  // 保存数据到数据库
  const handleSaveData = async () => {
    if (!currentCampus || !year) {
      message.warning('请选择神殿和年份')
      return
    }

    try {
      setLoading(true)
      
      // 准备要保存的数据（排除总计行）
      const monthsData = rows
        .filter(row => !row.isTotal)
        .map(row => {
          const monthNum = parseInt(row.month)
          return {
            month: monthNum,
            plan_income: row.planIncome,
            actual_income: row.actualIncome,
            investment_ratio: row.investmentRatio,
            enrollment_conversion_rate: row.enrollmentConversionRate,
            refund_count: row.refundCount,
            refund_rate: row.refundRate,
            plan_enrollment: row.planEnrollment,
            gross_enrollment: row.grossEnrollment,
            net_enrollment: row.netEnrollment,
            order_count: row.orderCount,
            enrollment_progress: row.enrollmentProgress,
            net_cost: row.netCost,
            visit_count: row.visitCount,
            visit_rate: row.visitRate,
            plan_consult_volume: row.planConsultVolume,
            actual_consult_volume: row.actualConsultVolume,
            consult_completion_progress: row.consultCompletionProgress,
            consult_cost: row.consultCost,
            plan_cost: row.planCost,
            actual_cost: row.actualCost,
          }
        })

      const result = await saveCoreAnnualData(currentCampus, year, monthsData)
      message.success(result.message || '保存成功')
    } catch (err) {
      console.error('保存数据失败:', err)
      message.error('保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const renderValue = (value: any, isTotal: boolean) => {
    const empty = value === null || value === undefined || value === ''
    if (empty) return '-'
    // 格式化数字显示
    const displayValue = typeof value === 'number' ? value.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) : value
    // 判断是否为零值
    const isZero = (typeof value === 'number' && value === 0) || value === '0' || value === '0%' || value === '1:0'
    return (
      <span style={{ fontWeight: isTotal ? 'bold' : 'normal', color: isZero ? '#999' : (isTotal ? '#c00000' : 'inherit') }}>
        {displayValue}
      </span>
    )
  }

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (!date) return
    setYear(date.format('YYYY'))
  }

  const columns = useMemo(() => [
    {
      title: '项目\n神殿',
      children: [{
        title: '月份',
        dataIndex: 'month',
        key: 'month',
        width: 40,
        align: 'center' as const,
        render: (text: string, record: Row) => (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal' }}>{text}</span>
          </div>
        ),
      }],
    },
    {
      title: '网络中心收入',
      children: [
        { title: '网络中心计划收入', dataIndex: 'planIncome', key: 'planIncome', width: 50, align: 'center' as const, render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(record.planIncome, record.isTotal)}</div> },
        { title: '网络中心实际收入', dataIndex: 'actualIncome', key: 'actualIncome', width: 50, align: 'center' as const, render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(record.actualIncome, record.isTotal)}</div> },
        { title: '投产比', dataIndex: 'investmentRatio', key: 'investmentRatio', width: 45, align: 'center' as const, render: (val: string, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div> },
      ],
    },
    {
      title: '神殿运营',
      children: [
        { title: '报名转化率', dataIndex: 'enrollmentConversionRate', key: 'enrollmentConversionRate', width: 45, align: 'center' as const, render: (val: string, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div> },
        { title: '退费数', dataIndex: 'refundCount', key: 'refundCount', width: 40, align: 'center' as const, render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(record.refundCount, record.isTotal)}</div> },
        { title: '退费率', dataIndex: 'refundRate', key: 'refundRate', width: 45, align: 'center' as const, render: (val: string, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div> },
      ],
    },
    { title: '网络中心计划报名', dataIndex: 'planEnrollment', key: 'planEnrollment', width: 50, align: 'center' as const, render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(record.planEnrollment, record.isTotal)}</div> },
    {
      title: '神殿报名',
      children: [
        { title: '毛报总数', dataIndex: 'grossEnrollment', key: 'grossEnrollment', width: 45, align: 'center' as const, render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(record.grossEnrollment, record.isTotal)}</div> },
        { title: '净报名', dataIndex: 'netEnrollment', key: 'netEnrollment', width: 45, align: 'center' as const, render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(record.netEnrollment, record.isTotal)}</div> },
        { title: '订座数', dataIndex: 'orderCount', key: 'orderCount', width: 45, align: 'center' as const, render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(record.orderCount, record.isTotal)}</div> },
        { title: '报名进度', dataIndex: 'enrollmentProgress', key: 'enrollmentProgress', width: 45, align: 'center' as const, render: (val: string, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div> },
        { title: '净成本', dataIndex: 'netCost', key: 'netCost', width: 45, align: 'center' as const, render: (val: number | null, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div> },
      ],
    },
    {
      title: '神殿上门',
      children: [
        { title: '上门人数', dataIndex: 'visitCount', key: 'visitCount', width: 45, align: 'center' as const, render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(record.visitCount, record.isTotal)}</div> },
        { title: '上门率', dataIndex: 'visitRate', key: 'visitRate', width: 45, align: 'center' as const, render: (val: string, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div> },
      ],
    },
    { title: '网络中心计划咨询量', dataIndex: 'planConsultVolume', key: 'planConsultVolume', width: 50, align: 'center' as const, render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(record.planConsultVolume, record.isTotal)}</div> },
    {
      title: '网络中心数据',
      children: [
        { title: '实际总量', dataIndex: 'actualConsultVolume', key: 'actualConsultVolume', width: 45, align: 'center' as const, render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(record.actualConsultVolume, record.isTotal)}</div> },
        { title: '咨询量完成进度', dataIndex: 'consultCompletionProgress', key: 'consultCompletionProgress', width: 50, align: 'center' as const, render: (val: string, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div> },
        { title: '咨询量成本', dataIndex: 'consultCost', key: 'consultCost', width: 45, align: 'center' as const, render: (val: number | null, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(val, record.isTotal)}</div> },
      ],
    },
    { title: '网络中心计划消费', dataIndex: 'planCost', key: 'planCost', width: 50, align: 'center' as const, render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(record.planCost, record.isTotal)}</div> },
    { title: '实际消费', dataIndex: 'actualCost', key: 'actualCost', width: 45, align: 'center' as const, render: (_: any, record: Row) => <div style={{ textAlign: 'center' }}>{renderValue(record.actualCost, record.isTotal)}</div> },
  ], [])

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          01核心数据看板 {year}年度{campusLabel}市场网络中心数据表
        </div>
        <Space>
          <span>选择年份：</span>
          <DatePicker picker="year" value={dayjs(year, 'YYYY')} onChange={handleYearChange} allowClear={false} style={{ width: 140 }} format="YYYY年" />
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveData} loading={loading}>
            保存数据
          </Button>
        </Space>
      </Card>
      <Card className="campus-core-dashboard-table">
        <Table<Row> columns={columns as any} dataSource={rows} pagination={false} bordered size="small" scroll={{ x: 'max-content' }} rowClassName={(record) => (record.isTotal ? 'total-row' : '')} />
        <style>{`
          .campus-core-dashboard-table .ant-table-wrapper { overflow-x: auto; }
          .campus-core-dashboard-table .ant-table-thead > tr > th { background-color: #fce4d6 !important; text-align: center !important; font-weight: bold !important; border: 1px solid #d0d0d0 !important; padding: 2px 1px !important; font-size: 11px !important; line-height: 1.1 !important; vertical-align: middle !important; white-space: normal !important; }
          .campus-core-dashboard-table .ant-table-tbody > tr > td { border: 1px solid #d0d0d0 !important; padding: 1px 1px !important; font-size: 11px !important; text-align: center !important; }
          .campus-core-dashboard-table .ant-table-tbody > tr.total-row > td { background-color: #fff2cc !important; font-weight: bold !important; }
        `}</style>
      </Card>
    </div>
  )
}
