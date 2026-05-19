import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { App, Card, InputNumber, Table, Select, Button } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { useMarketMonthlyDataStore } from '@/stores/marketMonthlyDataStore'
import { networkPartnerAnnualService } from '@/services/market/networkPartnerAnnual'
import { useRefreshEventStore } from '@/stores/refreshEventStore'
import axios from 'axios'

/**
 * 02市场部 {神殿}-{年份}年度网络合作伙伴数据看板明细
 * - 神殿来自全局神殿选择器（useCampusStore.currentCampus）
 * - 年份来自年份选择器（默认当前年份，允许用户选择年份）
 *
 * 数据结构：
 * - 总合计
 * - 全年（包含5个合作伙伴）
 * - 1-12月（每月包含合计 + 5个合作伙伴）
 */
export default function NetworkPartnerDashboard() {
  const { message } = App.useApp()
  const currentCampus = useCampusStore((s) => s.currentCampus)
  const { year, setYear } = useMarketMonthlyDataStore()
  const triggerNetworkPartnerPlanRefresh = useRefreshEventStore((s) => s.triggerNetworkPartnerPlanRefresh)

  const campusLabel = useMemo(() => {
    const name = currentCampus || '主神殿'
    return name.includes('神殿') ? name : `${name}神殿`
  }, [currentCampus])

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const years: number[] = []
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i)
    }
    return years.map((y) => ({ label: `${y}年`, value: String(y) }))
  }, [])

  // 固定的5个合作伙伴
  const partners = ['知了好学', '坦途网', '百教网', '厚学网', '91搜客']

  type Row = {
    key: string
    period: string // 时间周期：总合计/全年/1月-12月
    projectName: string // 项目名称：合计/合作伙伴名称
    isTotal: boolean // 是否是总计行
    isSummary: boolean // 是否是合计行

    // 网络合作伙伴收入
    partnerPlanIncome: number | null
    partnerActualIncome: number | null
    investmentRatio: string

    // 神殿运营
    enrollmentConversionRate: string
    refundCount: number | null
    refundRate: string

    // 神殿报名
    partnerPlanEnrollment: number | null
    grossEnrollment: number | null
    netEnrollment: number | null
    orderCount: number | null
    enrollmentProgress: string
    netCost: number | null

    // 神殿上门
    visitCount: number | null
    visitRate: string

    // 市场网络合作伙伴数据
    partnerPlanConsultVolume: number | null
    actualConsultVolume: number | null
    consultCompletionProgress: string
    consultCost: number | null
    partnerPlanCost: number | null
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

  const makeEmptyRow = (
    period: string,
    projectName: string,
    isTotal = false,
    isSummary = false
  ): Row => ({
    key: `${period}-${projectName}`,
    period,
    projectName,
    isTotal,
    isSummary,
    partnerPlanIncome: null,
    partnerActualIncome: null,
    investmentRatio: '1:0',
    enrollmentConversionRate: '',
    refundCount: null,
    refundRate: '',
    partnerPlanEnrollment: null,
    grossEnrollment: null,
    netEnrollment: null,
    orderCount: null,
    enrollmentProgress: '',
    netCost: null,
    visitCount: null,
    visitRate: '',
    partnerPlanConsultVolume: null,
    actualConsultVolume: null,
    consultCompletionProgress: '',
    consultCost: null,
    partnerPlanCost: null,
    actualCost: null,
  })

  const initialRows = useMemo<Row[]>(() => {
    const rows: Row[] = []

    // 总合计
    rows.push(makeEmptyRow('总合计', '', true, false))

    // 全年
    rows.push(makeEmptyRow('全年', '合计', false, true))
    partners.forEach((partner) => {
      rows.push(makeEmptyRow('全年', partner, false, false))
    })

    // 1-12月
    for (let i = 1; i <= 12; i++) {
      const month = `${i}月`
      rows.push(makeEmptyRow(month, '合计', false, true))
      partners.forEach((partner) => {
        rows.push(makeEmptyRow(month, partner, false, false))
      })
    }

    return rows
  }, [])

  const [rows, setRows] = useState<Row[]>(initialRows)

  // 从API加载数据
  useEffect(() => {
    const loadData = async () => {
      if (!currentCampus || !year) return

      try {
        const res = await networkPartnerAnnualService.getDashboardDetail(currentCampus, year)
        if (res.data) {
          const apiData = res.data
          setRows((prev) => {
            const next = prev.map((r) => ({ ...r }))

            // 遍历所有月份（包括全年）
            const periods = ['全年', ...Array.from({ length: 12 }, (_, i) => `${i + 1}月`)]

            for (const period of periods) {
              let periodData: Record<string, any> | null = null

              if (period === '全年') {
                // 全年数据：汇总所有月份的数据
                periodData = {}
                partners.forEach((partner) => {
                  periodData![partner] = {
                    partner_actual_income: 0,
                    refund_count: 0,
                    net_enrollment: 0,
                    gross_enrollment: 0,
                    order_count: 0,
                    visit_count: 0,
                    actual_consult_volume: 0,
                    actual_cost: 0,
                  }
                })

                // 汇总所有月份数据
                for (let month = 1; month <= 12; month++) {
                  const monthData = apiData[month]
                  if (!monthData) continue

                  partners.forEach((partner) => {
                    const partnerData = monthData[partner]
                    if (!partnerData) return

                    periodData![partner].partner_actual_income += partnerData.partner_actual_income || 0
                    periodData![partner].refund_count += partnerData.refund_count || 0
                    periodData![partner].net_enrollment += partnerData.net_enrollment || 0
                    periodData![partner].gross_enrollment += partnerData.gross_enrollment || 0
                    periodData![partner].order_count += partnerData.order_count || 0
                    periodData![partner].visit_count += partnerData.visit_count || 0
                    periodData![partner].actual_consult_volume += partnerData.actual_consult_volume || 0
                    periodData![partner].actual_cost += partnerData.actual_cost || 0
                  })
                }
              } else {
                // 月度数据
                const monthNum = parseInt(period)
                periodData = apiData[monthNum] || null
              }

              if (!periodData) continue

              // 更新每个合作伙伴的行
              partners.forEach((partner) => {
                const partnerRow = next.find((r) => r.period === period && r.projectName === partner)
                if (!partnerRow) return

                const data = periodData![partner]
                if (!data) return

                partnerRow.partnerActualIncome = data.partner_actual_income || null
                partnerRow.refundCount = data.refund_count || null
                partnerRow.netEnrollment = data.net_enrollment || null
                partnerRow.grossEnrollment = data.gross_enrollment || null
                partnerRow.orderCount = data.order_count || null
                partnerRow.visitCount = data.visit_count || null
                partnerRow.actualConsultVolume = data.actual_consult_volume || null
                partnerRow.actualCost = data.actual_cost || null

                // 重新计算该行的计算字段
                recalcRow(partnerRow)
              })
            }

            // 重新计算所有合计行
            recalcSummaries(next)

            return next
          })
        }
      } catch (error) {
        console.error('加载网络合作伙伴年度明细数据失败:', error)
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
      const res = await axios.get('/api/v1/market/monthly-plan/network-partner/detail/list', {
        params: { campus: currentCampus, year }
      })
      const planData = res.data?.data || {}
      
      setRows((prev) => {
        const next = prev.map((r) => ({ ...r }))
        
        // 首先加载1-12月的计划数据
        for (const row of next) {
          if (row.isTotal || row.isSummary) continue
          if (row.period === '全年') continue // 全年数据稍后汇总
          
          const monthNum = parseInt(row.period) // "1月" -> 1
          const monthData = planData[monthNum]
          if (monthData && monthData[row.projectName]) {
            const partnerData = monthData[row.projectName]
            row.partnerPlanIncome = partnerData.plan_income || null
            row.partnerPlanEnrollment = partnerData.plan_enrollment || null
            row.partnerPlanConsultVolume = partnerData.plan_consult_volume || null
            row.partnerPlanCost = partnerData.plan_cost || null
            recalcRow(row)
          }
        }
        
        // 然后汇总全年的计划数据（从1-12月汇总）
        for (const row of next) {
          if (row.period !== '全年' || row.isSummary || row.isTotal) continue
          
          // 汇总该合作伙伴所有月份的计划数据
          let totalPlanIncome = 0
          let totalPlanEnrollment = 0
          let totalPlanConsultVolume = 0
          let totalPlanCost = 0
          
          for (let month = 1; month <= 12; month++) {
            const monthData = planData[month]
            if (monthData && monthData[row.projectName]) {
              const partnerData = monthData[row.projectName]
              totalPlanIncome += partnerData.plan_income || 0
              totalPlanEnrollment += partnerData.plan_enrollment || 0
              totalPlanConsultVolume += partnerData.plan_consult_volume || 0
              totalPlanCost += partnerData.plan_cost || 0
            }
          }
          
          row.partnerPlanIncome = totalPlanIncome || null
          row.partnerPlanEnrollment = totalPlanEnrollment || null
          row.partnerPlanConsultVolume = totalPlanConsultVolume || null
          row.partnerPlanCost = totalPlanCost || null
          recalcRow(row)
        }
        
        recalcSummaries(next)
        return next
      })
    } catch (err) {
      console.warn('加载计划数据失败:', err)
    }
  }, [currentCampus, year])

  // 保存计划数据
  const [saving, setSaving] = useState(false)
  const savePlanData = useCallback(async () => {
    if (!currentCampus) {
      message.warning('请先选择神殿')
      return
    }
    setSaving(true)
    try {
      // 只保存每月每个合作伙伴的数据（排除全年和合计行）
      const planItems = rows
        .filter((r) => !r.isTotal && !r.isSummary && r.period !== '全年')
        .map((r) => ({
          month: parseInt(r.period),
          partner: r.projectName,
          plan_income: r.partnerPlanIncome || 0,
          plan_enrollment: r.partnerPlanEnrollment || 0,
          plan_consult_volume: r.partnerPlanConsultVolume || 0,
          plan_cost: r.partnerPlanCost || 0,
        }))
      
      await axios.post('/api/v1/market/monthly-plan/network-partner/detail/save', {
        campus: currentCampus,
        year: year,
        data: planItems
      })
      message.success('计划数据保存成功')
      // 通知01页面刷新计划数据
      triggerNetworkPartnerPlanRefresh()
    } catch (err) {
      console.error('保存计划数据失败:', err)
      message.error('保存计划数据失败')
    } finally {
      setSaving(false)
    }
  }, [rows, currentCampus, year, triggerNetworkPartnerPlanRefresh])

  // 加载计划数据
  useEffect(() => {
    loadPlanData()
  }, [loadPlanData])

  const recalcRow = (row: Row) => {
    // 投产比：合作伙伴实际收入 / 实际消费
    if (row.partnerActualIncome && row.actualCost) {
      row.investmentRatio = calcInvestmentRatio(row.partnerActualIncome, row.actualCost)
    } else {
      row.investmentRatio = '1:0'
    }

    // 报名转化率：净报名 / 实际总量
    if (row.netEnrollment && row.actualConsultVolume) {
      row.enrollmentConversionRate = calcRate(row.netEnrollment, row.actualConsultVolume)
    } else {
      row.enrollmentConversionRate = ''
    }

    // 退费率：退费数 / 毛报总数
    if (row.refundCount && row.grossEnrollment) {
      row.refundRate = calcRate(row.refundCount, row.grossEnrollment)
    } else {
      row.refundRate = ''
    }

    // 报名进度：净报名 / 合作伙伴计划报名
    if (row.netEnrollment && row.partnerPlanEnrollment) {
      row.enrollmentProgress = calcRate(row.netEnrollment, row.partnerPlanEnrollment)
    } else {
      row.enrollmentProgress = ''
    }

    // 净成本：实际消费 / 净报名
    if (row.actualCost && row.netEnrollment) {
      row.netCost = parseFloat((row.actualCost / row.netEnrollment).toFixed(2))
    } else {
      row.netCost = null
    }

    // 上门率：上门人数 / 实际总量
    if (row.visitCount && row.actualConsultVolume) {
      row.visitRate = calcRate(row.visitCount, row.actualConsultVolume)
    } else {
      row.visitRate = ''
    }

    // 咨询量完成进度：实际总量 / 合作伙伴计划咨询量
    if (row.actualConsultVolume && row.partnerPlanConsultVolume) {
      row.consultCompletionProgress = calcRate(
        row.actualConsultVolume,
        row.partnerPlanConsultVolume
      )
    } else {
      row.consultCompletionProgress = ''
    }

    // 咨询量成本：实际消费 / 实际总量
    if (row.actualCost && row.actualConsultVolume) {
      row.consultCost = parseFloat((row.actualCost / row.actualConsultVolume).toFixed(2))
    } else {
      row.consultCost = null
    }
  }

  // 更新单个值并重新计算
  const updateValue = (key: string, field: keyof Row, value: number | null) => {
    setRows((prev) => {
      const next = prev.map((r) => ({ ...r }))
      const idx = next.findIndex((r) => r.key === key)
      if (idx === -1) return prev
      if (next[idx].isTotal) return prev

      ;(next[idx] as any)[field] = value
      recalcRow(next[idx])

      // 重新计算合计行
      recalcSummaries(next)

      return next
    })
  }

  // 重新计算所有合计行
  const recalcSummaries = (data: Row[]) => {
    // 先计算1-12月合计
    for (let i = 1; i <= 12; i++) {
      const month = `${i}月`
      const monthSummary = data.find((r) => r.period === month && r.isSummary)
      if (monthSummary) {
        const monthPartners = data.filter(
          (r) => r.period === month && !r.isSummary && !r.isTotal
        )
        sumRows(monthPartners, monthSummary)
        recalcRow(monthSummary)
      }
    }

    // 计算全年合计（汇总全年的5个合作伙伴）
    const annualSummary = data.find((r) => r.period === '全年' && r.isSummary)
    if (annualSummary) {
      const annualPartners = data.filter(
        (r) => r.period === '全年' && !r.isSummary && !r.isTotal
      )
      sumRows(annualPartners, annualSummary)
      recalcRow(annualSummary)
    }

    // 计算总合计（汇总1-12月的合计行，不包括全年）
    const grandTotal = data.find((r) => r.isTotal)
    if (grandTotal) {
      const monthlySummaries = data.filter((r) => {
        if (r.isTotal || !r.isSummary) return false
        if (r.period === '全年') return false // 排除全年合计
        return true // 只包括1-12月的合计行
      })
      sumRows(monthlySummaries, grandTotal)
      recalcRow(grandTotal)
    }
  }

  // 汇总多行数据到目标行
  const sumRows = (sourceRows: Row[], targetRow: Row) => {
    const sum = (field: keyof Row) =>
      sourceRows.reduce(
        (acc, r) => acc + (typeof r[field] === 'number' ? (r[field] as number) : 0),
        0
      )

    targetRow.partnerPlanIncome = sum('partnerPlanIncome') || null
    targetRow.partnerActualIncome = sum('partnerActualIncome') || null
    targetRow.refundCount = sum('refundCount') || null
    targetRow.partnerPlanEnrollment = sum('partnerPlanEnrollment') || null
    targetRow.grossEnrollment = sum('grossEnrollment') || null
    targetRow.netEnrollment = sum('netEnrollment') || null
    targetRow.orderCount = sum('orderCount') || null
    targetRow.visitCount = sum('visitCount') || null
    targetRow.partnerPlanConsultVolume = sum('partnerPlanConsultVolume') || null
    targetRow.actualConsultVolume = sum('actualConsultVolume') || null
    targetRow.partnerPlanCost = sum('partnerPlanCost') || null
    targetRow.actualCost = sum('actualCost') || null
  }

  const renderEditableNumber = (record: Row, field: keyof Row) => {
    return renderValue((record as any)[field], record.isTotal || record.isSummary)
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

  const columns = useMemo(() => {
    return [
      {
        title: '项目',
        dataIndex: 'period',
        key: 'period',
        width: 50,
        align: 'center' as const,
        render: (text: string, record: Row) => (
          <span
            style={{
              fontWeight: record.isTotal || record.isSummary ? 'bold' : 'normal',
              fontSize: '14px',
            }}
          >
            {text}
          </span>
        ),
      },
      {
        title: '神殿',
        dataIndex: 'projectName',
        key: 'projectName',
        width: 70,
        align: 'center' as const,
        render: (text: string, record: Row) => (
          <span
            style={{
              fontWeight: record.isTotal || record.isSummary ? 'bold' : 'normal',
              fontSize: '14px',
            }}
          >
            {text || (record.isTotal ? '' : '-')}
          </span>
        ),
      },
      {
        title: '网络合作伙伴收入',
        children: [
          {
            title: '合作伙伴计划收入',
            dataIndex: 'partnerPlanIncome',
            key: 'partnerPlanIncome',
            width: 85,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'partnerPlanIncome'),
          },
          {
            title: '合作伙伴实际收入',
            dataIndex: 'partnerActualIncome',
            key: 'partnerActualIncome',
            width: 85,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'partnerActualIncome'),
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
            title: '网络合作伙伴计划报名',
            dataIndex: 'partnerPlanEnrollment',
            key: 'partnerPlanEnrollment',
            width: 105,
            align: 'center' as const,
            render: (_: any, record: Row) =>
              renderEditableNumber(record, 'partnerPlanEnrollment'),
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
            title: '网络合作伙伴计划咨询量',
            dataIndex: 'partnerPlanConsultVolume',
            key: 'partnerPlanConsultVolume',
            width: 115,
            align: 'center' as const,
            render: (_: any, record: Row) =>
              renderEditableNumber(record, 'partnerPlanConsultVolume'),
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
            title: '网络合作伙伴计划消费',
            dataIndex: 'partnerPlanCost',
            key: 'partnerPlanCost',
            width: 115,
            align: 'center' as const,
            render: (_: any, record: Row) => renderEditableNumber(record, 'partnerPlanCost'),
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: 'bold',
            padding: '10px 16px',
            color: '#000',
            borderRadius: 0,
            border: '1px solid #000',
            backgroundColor: '#fff2cc',
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span>
            <FileTextOutlined style={{ marginRight: 8 }} />
            02市场部 {campusLabel}-{year}年度网络合作伙伴数据看板明细
          </span>
          <Button
            type="primary"
            onClick={savePlanData}
            loading={saving}
            size="small"
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            保存计划数据
          </Button>
        </div>

        <div
          style={{
            marginLeft: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontWeight: 'bold' }}>选择年份:</span>
          <Select value={year} onChange={setYear} options={yearOptions} style={{ width: 120 }} size="large" />
        </div>
      </div>

      <Card className="network-partner-02-dashboard-table">
        <Table<Row>
          columns={columns as any}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: 'max-content' }}
          rowClassName={(record) => {
            if (record.isTotal) return 'total-row'
            if (record.isSummary) return 'summary-row'
            return ''
          }}
        />

        <style>{`
          .network-partner-02-dashboard-table .ant-table-thead > tr > th {
            background-color: #fce4d6 !important;
            text-align: center !important;
            font-weight: bold !important;
            border: 1px solid #000 !important;
            padding: 6px 2px !important;
            font-size: 12px !important;
          }
          .network-partner-02-dashboard-table .ant-table-tbody > tr > td {
            border: 1px solid #000 !important;
            padding: 4px 4px !important;
            font-size: 12px !important;
          }
          .network-partner-02-dashboard-table .ant-table-tbody > tr.total-row > td {
            background-color: #fff2cc !important;
            font-weight: bold !important;
          }
          .network-partner-02-dashboard-table .ant-table-tbody > tr.summary-row > td {
            background-color: #e7e6e6 !important;
            font-weight: bold !important;
          }
          /* 固定表头样式优化 */
          .network-partner-02-dashboard-table .ant-table-sticky-holder {
            background-color: #fce4d6 !important;
          }
          .network-partner-02-dashboard-table .ant-table-cell-fix-left,
          .network-partner-02-dashboard-table .ant-table-cell-fix-right {
            background-color: inherit !important;
          }
        `}</style>
      </Card>
    </div>
  )
}
