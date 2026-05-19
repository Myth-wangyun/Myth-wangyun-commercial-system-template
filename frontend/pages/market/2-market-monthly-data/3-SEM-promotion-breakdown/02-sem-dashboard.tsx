import React, { useEffect, useMemo, useState } from 'react'
import { App, Card, InputNumber, Table, Spin } from 'antd'
import { FileTextOutlined, LoadingOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import { useMarketMonthlyDataStore } from '@/stores/marketMonthlyDataStore'
import { marketSemDailyDataService, type YearlySummaryItem } from '@/services/market/marketSemDailyData'
import { getSEMYearlyPlan } from '@/services/market/monthlyDetailPlanService'

/**
 * 02市场部 {神殿}神殿-{year}年度SEM推广数据看板
 * - 神殿：全局神殿选择器（useCampusStore.currentCampus）
 * - 年份：顶部年份选择器（useMarketMonthlyDataStore.year，默认当前年，可切换）
 *
 * 行结构（按截图）：
 * - 合计：总计 + 百度/神殿网站/GEO
 * - 全年：总计 + 百度/神殿网站/GEO
 * - 1月..12月：总计 + 百度/神殿网站/GEO（仅这些行可编辑，其他汇总行自动计算）
 */
export default function SemPromotionDashboard02() {
  const { message } = App.useApp()
  const currentCampus = useCampusStore((s) => s.currentCampus)
  const year = useMarketMonthlyDataStore((s) => s.year)

  const campusLabel = useMemo(() => {
    const name = currentCampus || '主神殿'
    const withSuffix = name.includes('神殿') ? name : `${name}神殿`
    return withSuffix
  }, [currentCampus])

  const SOURCES = useMemo(() => ['百度', '神殿网站', 'GEO'], [])
  const MONTHS = useMemo(() => Array.from({ length: 12 }, (_, i) => `${i + 1}月`), [])
  const GROUPS = useMemo(() => ['全年', ...MONTHS], [MONTHS])

  type NumericFields = {
    planIncome: number | null
    actualIncome: number | null
    refundCount: number | null
    planEnrollment: number | null
    grossEnrollment: number | null
    netEnrollment: number | null
    orderCount: number | null
    visitCount: number | null
    planConsultVolume: number | null
    actualConsultVolume: number | null
    planCost: number | null
    actualCost: number | null
  }

  type Row = {
    key: string
    month: string
    project: string
    isTotal: boolean
    monthRowSpan: number

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

  const emptyNumeric = (): NumericFields => ({
    planIncome: null,
    actualIncome: null,
    refundCount: null,
    planEnrollment: null,
    grossEnrollment: null,
    netEnrollment: null,
    orderCount: null,
    visitCount: null,
    planConsultVolume: null,
    actualConsultVolume: null,
    planCost: null,
    actualCost: null,
  })

  const [values, setValues] = useState<Record<string, NumericFields>>(() => {
    // 仅允许编辑：1月..12月 + 来源（百度/神殿网站/GEO）
    const map: Record<string, NumericFields> = {}
    for (const m of MONTHS) {
      for (const s of SOURCES) {
        map[`${m}__${s}`] = emptyNumeric()
      }
    }
    return map
  })

  const [loading, setLoading] = useState(false)

  // 从API加载年度数据
  const loadYearlyData = async () => {
    if (!currentCampus || !year) return
    
    setLoading(true)
    try {
      // 同时获取SEM日度数据汇总和月度详细计划
      const [response, monthlyPlanData] = await Promise.all([
        marketSemDailyDataService.getYearlySummary(currentCampus, parseInt(year, 10)),
        getSEMYearlyPlan(year, currentCampus),
      ])
      
      // SEM渠道名称映射：月度详细计划渠道名 -> API来源名
      const channelMap: Record<string, string> = {
        '百度推广': '百度',
        '神殿网站/直接访问': '神殿网站',
        'GEO': 'GEO',
      }
      
      if (response.items && response.items.length > 0) {
        setValues((prev) => {
          const next = { ...prev }
          
          // 映射API来源名称到前端来源名称
          const sourceMap: Record<string, keyof YearlySummaryItem> = {
            '百度': 'baidu',
            '神殿网站': 'campus_website',
            'GEO': 'geo',
          }
          
          for (const item of response.items) {
            const monthKey = `${item.month}月`
            // 获取该月份的SEM月度详细计划
            const monthPlan = monthlyPlanData[item.month] || {}
            
            for (const source of SOURCES) {
              const key = `${monthKey}__${source}`
              const apiSourceKey = sourceMap[source]
              const sourceData = item[apiSourceKey] as typeof item.baidu
              
              // 根据来源名称找到对应的月度详细计划渠道
              let channelPlanKey = source
              for (const [planKey, apiSource] of Object.entries(channelMap)) {
                if (apiSource === source) {
                  channelPlanKey = planKey
                  break
                }
              }
              const channelPlan = monthPlan[channelPlanKey] || null
              
              if (sourceData && next[key]) {
                next[key] = {
                  ...next[key],
                  // 计划数据从月度详细计划获取（每个渠道独立的计划数据）
                  planIncome: channelPlan?.plan_income || null,
                  planEnrollment: channelPlan?.plan_enrollment || null,
                  planConsultVolume: channelPlan?.plan_consult_volume || null,
                  planCost: channelPlan?.plan_cost || null,
                  // 实际数据（来自SEM日常数据表）
                  actualIncome: sourceData.actual_income || null,
                  refundCount: sourceData.refund_count || null,
                  netEnrollment: sourceData.net_signup || null,
                  grossEnrollment: sourceData.gross_total || null,
                  orderCount: sourceData.order_count || null,
                  visitCount: sourceData.visit_count || null,
                  actualConsultVolume: sourceData.consult_count || null,
                  actualCost: sourceData.consumption || null,
                }
              }
            }
          }
          
          return next
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

  const calcRate = (numerator: number, denominator: number): string => {
    if (!denominator || denominator === 0) return '0%'
    return ((numerator / denominator) * 100).toFixed(2) + '%'
  }

  const calcInvestmentRatio = (income: number, cost: number): string => {
    if (!cost || cost === 0) return '1:0'
    return `1:${(income / cost).toFixed(1)}`
  }

  const computeDerived = (n: NumericFields) => {
    const investmentRatio =
      n.actualIncome && n.actualCost ? calcInvestmentRatio(n.actualIncome, n.actualCost) : ''
    const enrollmentConversionRate =
      n.netEnrollment && n.actualConsultVolume ? calcRate(n.netEnrollment, n.actualConsultVolume) : ''
    const refundRate =
      n.refundCount && n.grossEnrollment ? calcRate(n.refundCount, n.grossEnrollment) : ''
    const enrollmentProgress =
      n.netEnrollment && n.planEnrollment ? calcRate(n.netEnrollment, n.planEnrollment) : ''
    const visitRate =
      n.visitCount && n.actualConsultVolume ? calcRate(n.visitCount, n.actualConsultVolume) : ''
    const consultCompletionProgress =
      n.actualConsultVolume && n.planConsultVolume ? calcRate(n.actualConsultVolume, n.planConsultVolume) : ''
    const consultCost =
      n.actualCost && n.actualConsultVolume
        ? parseFloat((n.actualCost / n.actualConsultVolume).toFixed(2))
        : null
    const netCost =
      n.actualCost && n.netEnrollment ? parseFloat((n.actualCost / n.netEnrollment).toFixed(2)) : null

    return {
      investmentRatio,
      enrollmentConversionRate,
      refundRate,
      enrollmentProgress,
      visitRate,
      consultCompletionProgress,
      consultCost,
      netCost,
    }
  }

  const sumNumerics = (items: NumericFields[]): NumericFields => {
    const sumField = (k: keyof NumericFields) =>
      items.reduce((acc, it) => acc + (it[k] ?? 0), 0) || null
    return {
      planIncome: sumField('planIncome'),
      actualIncome: sumField('actualIncome'),
      refundCount: sumField('refundCount'),
      planEnrollment: sumField('planEnrollment'),
      grossEnrollment: sumField('grossEnrollment'),
      netEnrollment: sumField('netEnrollment'),
      orderCount: sumField('orderCount'),
      visitCount: sumField('visitCount'),
      planConsultVolume: sumField('planConsultVolume'),
      actualConsultVolume: sumField('actualConsultVolume'),
      planCost: sumField('planCost'),
      actualCost: sumField('actualCost'),
    }
  }

  const getMonthSourceNumeric = (month: string, source: string): NumericFields =>
    values[`${month}__${source}`] || emptyNumeric()

  const computeMonthTotal = (month: string): NumericFields =>
    sumNumerics(SOURCES.map((s) => getMonthSourceNumeric(month, s)))

  const computeYearSource = (source: string): NumericFields =>
    sumNumerics(MONTHS.map((m) => getMonthSourceNumeric(m, source)))

  const computeYearTotal = (): NumericFields => sumNumerics(SOURCES.map((s) => computeYearSource(s)))

  const computeOverallTotal = (): NumericFields => computeYearTotal()

  const buildRow = (
    month: string,
    project: string,
    isTotal: boolean,
    monthRowSpan: number,
    n: NumericFields,
  ): Row => {
    const d = computeDerived(n)
    return {
      key: `${month}__${project}`,
      month,
      project,
      isTotal,
      monthRowSpan,
      planIncome: n.planIncome,
      actualIncome: n.actualIncome,
      investmentRatio: d.investmentRatio,
      enrollmentConversionRate: d.enrollmentConversionRate,
      refundCount: n.refundCount,
      refundRate: d.refundRate,
      planEnrollment: n.planEnrollment,
      grossEnrollment: n.grossEnrollment,
      netEnrollment: n.netEnrollment,
      orderCount: n.orderCount,
      enrollmentProgress: d.enrollmentProgress,
      netCost: d.netCost,
      visitCount: n.visitCount,
      visitRate: d.visitRate,
      planConsultVolume: n.planConsultVolume,
      actualConsultVolume: n.actualConsultVolume,
      consultCompletionProgress: d.consultCompletionProgress,
      consultCost: d.consultCost,
      planCost: n.planCost,
      actualCost: n.actualCost,
    }
  }

  const dataSource = useMemo<Row[]>(() => {
    const rows: Row[] = []

    // 先添加独立的"合计"行
    const totalNumeric = computeOverallTotal()
    rows.push(buildRow('合计', '', true, 1, totalNumeric))

    // 然后添加全年和各月的数据
    for (const g of GROUPS) {
      const monthRowSpan = 1 + SOURCES.length

      // 该月/年的合计行
      let groupTotalNumeric: NumericFields
      if (g === '全年') {
        groupTotalNumeric = computeOverallTotal()
      } else {
        groupTotalNumeric = computeMonthTotal(g)
      }
      rows.push(buildRow(g, '合计', true, monthRowSpan, groupTotalNumeric))

      // 来源行
      for (let i = 0; i < SOURCES.length; i++) {
        const s = SOURCES[i]
        const span = 0
        let n: NumericFields
        let editable = true
        if (g === '全年') {
          n = computeYearSource(s)
          editable = false
        } else {
          n = getMonthSourceNumeric(g, s)
          editable = true
        }
        rows.push(buildRow(g, s, !editable, span, n))
      }
    }

    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, GROUPS, MONTHS, SOURCES])

  const update = (month: string, source: string, field: keyof NumericFields, value: number | null) => {
    setValues((prev) => ({
      ...prev,
      [`${month}__${source}`]: {
        ...prev[`${month}__${source}`],
        [field]: value,
      },
    }))
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

  const renderNumber = (record: Row, month: string, project: string, field: keyof NumericFields) => {
    return renderValue((record as any)[field], record.isTotal)
  }

  const columns = useMemo(() => {
    return [
      {
        title: '月份',
        dataIndex: 'month',
        key: 'month',
        width: 42,
        align: 'center' as const,
        render: (text: string, record: Row) => {
          return {
            children: <span style={{ fontWeight: record.isTotal ? 'bold' : 'normal' }}>{text}</span>,
            props: { rowSpan: record.monthRowSpan },
          }
        },
      },
      {
        title: '项目',
        dataIndex: 'project',
        key: 'project',
        width: 58,
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
            render: (_: any, record: Row) => renderNumber(record, record.month, record.project, 'planIncome'),
          },
          {
            title: 'SEM实际收入',
            dataIndex: 'actualIncome',
            key: 'actualIncome',
            width: 72,
            align: 'center' as const,
            render: (_: any, record: Row) => renderNumber(record, record.month, record.project, 'actualIncome'),
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
            render: (_: any, record: Row) => renderNumber(record, record.month, record.project, 'refundCount'),
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
            render: (_: any, record: Row) => renderNumber(record, record.month, record.project, 'planEnrollment'),
          },
          {
            title: '毛报总数',
            dataIndex: 'grossEnrollment',
            key: 'grossEnrollment',
            width: 55,
            align: 'center' as const,
            render: (_: any, record: Row) =>
              renderNumber(record, record.month, record.project, 'grossEnrollment'),
          },
          {
            title: '净报名',
            dataIndex: 'netEnrollment',
            key: 'netEnrollment',
            width: 50,
            align: 'center' as const,
            render: (_: any, record: Row) => renderNumber(record, record.month, record.project, 'netEnrollment'),
          },
          {
            title: '订座数',
            dataIndex: 'orderCount',
            key: 'orderCount',
            width: 48,
            align: 'center' as const,
            render: (_: any, record: Row) => renderNumber(record, record.month, record.project, 'orderCount'),
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
            render: (_: any, record: Row) => renderNumber(record, record.month, record.project, 'visitCount'),
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
            render: (_: any, record: Row) =>
              renderNumber(record, record.month, record.project, 'planConsultVolume'),
          },
          {
            title: '实际总量',
            dataIndex: 'actualConsultVolume',
            key: 'actualConsultVolume',
            width: 55,
            align: 'center' as const,
            render: (_: any, record: Row) =>
              renderNumber(record, record.month, record.project, 'actualConsultVolume'),
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
            align: 'right' as const,
            render: (val: number | null, record: Row) => renderValue(val, record.isTotal),
          },
          {
            title: 'SEM计划消费',
            dataIndex: 'planCost',
            key: 'planCost',
            width: 82,
            align: 'center' as const,
            render: (_: any, record: Row) => renderNumber(record, record.month, record.project, 'planCost'),
          },
          {
            title: '实际消费',
            dataIndex: 'actualCost',
            key: 'actualCost',
            width: 55,
            align: 'center' as const,
            render: (_: any, record: Row) => renderNumber(record, record.month, record.project, 'actualCost'),
          },
        ],
      },
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values])

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
        02市场部 {campusLabel}-{year}年度SEM推广数据看板
        {loading && <LoadingOutlined style={{ marginLeft: 8 }} />}
      </div>

      <Spin spinning={loading}>
        <Card className="sem-breakdown-dashboard-table" style={{ overflowX: 'auto' }}>
          <Table<Row>
            columns={columns as any}
            dataSource={dataSource}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: 'max-content', y: 600 }}
            sticky
            rowClassName={(record) => (record.isTotal ? 'total-row' : '')}
          />

          <style>{`
            .sem-breakdown-dashboard-table .ant-table-thead > tr > th {
              background-color: #fce4d6 !important;
              text-align: center !important;
              font-weight: bold !important;
              border: 1px solid #000 !important;
              padding: 6px 2px !important;
              font-size: 12px !important;
            }
            .sem-breakdown-dashboard-table .ant-table-tbody > tr > td {
              border: 1px solid #000 !important;
              padding: 4px 4px !important;
              font-size: 12px !important;
            }
            .sem-breakdown-dashboard-table .ant-table-tbody > tr.total-row > td {
              background-color: #fff2cc !important;
              font-weight: bold !important;
            }
          `}</style>
        </Card>
      </Spin>
    </div>
  )
}

