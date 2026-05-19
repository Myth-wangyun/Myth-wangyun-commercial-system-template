import React, { useMemo, useState } from 'react'
import { Card, Row, Col, Tabs, Statistic, Checkbox, Empty } from 'antd'
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DollarOutlined,
  TeamOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'

// 图表颜色配置
const CHART_COLORS = [
  '#1890ff', // 蓝色
  '#52c41a', // 绿色
  '#faad14', // 橙色
  '#f5222d', // 红色
  '#722ed1', // 紫色
  '#13c2c2', // 青色
  '#eb2f96', // 粉色
  '#fa8c16', // 深橙色
]

/**
 * 解析百分比字符串为数字
 */
const parsePercent = (str: string): number => {
  if (!str || str === '-' || str === '') return 0
  return parseFloat(str.replace('%', '')) || 0
}

/**
 * 格式化货币
 */
const formatCurrency = (value: number): string => {
  return `¥${value.toLocaleString()}`
}

// 神殿月度数据行类型
export interface CampusMonthlyDataRow {
  key: string
  month: string
  isTotal: boolean
  planIncome: number | null
  actualIncome?: number | null
  standardIncome?: number | null
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
  consultCost?: number | null
  planCost?: number | null
  actualCost?: number | null
}

interface CampusMonthlyChartViewProps {
  data: CampusMonthlyDataRow[]
  year: string
  campusName: string
  title: string // 图表标题，如"网络数据"、"新媒体数据"等
}

/**
 * 计算汇总统计数据
 */
const calculateSummaryStats = (data: CampusMonthlyDataRow[]) => {
  const monthData = data.filter((item) => !item.isTotal)

  const sum = (arr: (number | null | undefined)[]) =>
    arr.reduce((s, v) => (s || 0) + (v || 0), 0) || 0

  return {
    planIncome: sum(monthData.map((item) => item.planIncome)),
    actualIncome: sum(monthData.map((item) => item.actualIncome || item.standardIncome)),
    planEnrollment: sum(monthData.map((item) => item.planEnrollment)),
    netEnrollment: sum(monthData.map((item) => item.netEnrollment)),
    grossEnrollment: sum(monthData.map((item) => item.grossEnrollment)),
    planConsultVolume: sum(monthData.map((item) => item.planConsultVolume)),
    actualConsultVolume: sum(monthData.map((item) => item.actualConsultVolume)),
    visitCount: sum(monthData.map((item) => item.visitCount)),
    planCost: sum(monthData.map((item) => item.planCost)),
    actualCost: sum(monthData.map((item) => item.actualCost)),
  }
}

const CampusMonthlyChartView: React.FC<CampusMonthlyChartViewProps> = ({
  data,
  year,
  campusName,
  title,
}) => {
  // 过滤掉总计行，只展示各月数据
  const monthData = useMemo(() => data.filter((item) => !item.isTotal), [data])

  // 综合指标分析的数据项筛选状态
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    '报名进度',
    '咨询量完成进度',
    '上门率',
    '报名转化率',
  ])

  // 可选的指标列表
  const availableMetrics = [
    { key: '报名进度', label: '报名进度', color: CHART_COLORS[0] },
    { key: '咨询量完成进度', label: '咨询量完成进度', color: CHART_COLORS[1] },
    { key: '上门率', label: '上门率', color: CHART_COLORS[2] },
    { key: '报名转化率', label: '报名转化率', color: CHART_COLORS[4] },
    { key: '退费率', label: '退费率', color: CHART_COLORS[3] },
  ]

  // 汇总统计数据
  const summaryStats = useMemo(() => calculateSummaryStats(data), [data])

  // 报名数据图表 - 月度趋势
  const enrollmentChartData = useMemo(() => {
    return monthData.map((item) => ({
      name: item.month,
      计划报名: item.planEnrollment || 0,
      毛报总数: item.grossEnrollment || 0,
      净报名: item.netEnrollment || 0,
      订座数: item.orderCount || 0,
    }))
  }, [monthData])

  // 咨询量数据图表 - 月度趋势
  const consultChartData = useMemo(() => {
    return monthData.map((item) => ({
      name: item.month,
      计划咨询量: item.planConsultVolume || 0,
      实际总量: item.actualConsultVolume || 0,
      上门人数: item.visitCount || 0,
    }))
  }, [monthData])

  // 消费数据图表 - 月度趋势
  const costChartData = useMemo(() => {
    return monthData.map((item) => ({
      name: item.month,
      计划消费: item.planCost || 0,
      实际消费: item.actualCost || 0,
    }))
  }, [monthData])

  // 收入数据图表 - 月度趋势
  const incomeChartData = useMemo(() => {
    return monthData.map((item) => ({
      name: item.month,
      计划收入: item.planIncome || 0,
      实际收入: item.actualIncome || item.standardIncome || 0,
    }))
  }, [monthData])

  // 进度百分比数据图表 - 月度趋势
  const progressChartData = useMemo(() => {
    return monthData.map((item) => ({
      name: item.month,
      报名进度: parsePercent(item.enrollmentProgress),
      咨询量完成进度: parsePercent(item.consultCompletionProgress),
      上门率: parsePercent(item.visitRate),
      报名转化率: parsePercent(item.enrollmentConversionRate),
      退费率: parsePercent(item.refundRate),
    }))
  }, [monthData])

  // 累计数据图表
  const cumulativeData = useMemo(() => {
    let cumNetEnrollment = 0
    let cumActualConsult = 0
    let cumVisit = 0
    return monthData.map((item) => {
      cumNetEnrollment += item.netEnrollment || 0
      cumActualConsult += item.actualConsultVolume || 0
      cumVisit += item.visitCount || 0
      return {
        name: item.month,
        累计净报名: cumNetEnrollment,
        累计咨询量: cumActualConsult,
        累计上门: cumVisit,
      }
    })
  }, [monthData])

  // 处理指标选择变化
  const handleMetricChange = (checkedValues: string[]) => {
    setSelectedMetrics(checkedValues)
  }

  // 如果没有数据，显示空状态
  if (monthData.length === 0) {
    return (
      <Card>
        <Empty description="暂无数据" />
      </Card>
    )
  }

  return (
    <div>
      {/* 关键指标统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card size="small" style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
            <Statistic
              title="净报名 / 计划"
              value={summaryStats.netEnrollment}
              suffix={`/ ${summaryStats.planEnrollment}`}
              valueStyle={{ color: '#1890ff', fontSize: 16 }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <Statistic
              title="咨询量 / 计划"
              value={summaryStats.actualConsultVolume}
              suffix={`/ ${summaryStats.planConsultVolume}`}
              valueStyle={{ color: '#52c41a', fontSize: 16 }}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: '#fff7e6', borderColor: '#ffd591' }}>
            <Statistic
              title="上门 / 毛报"
              value={summaryStats.visitCount}
              suffix={`/ ${summaryStats.grossEnrollment}`}
              valueStyle={{ color: '#fa8c16', fontSize: 16 }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: '#fff1f0', borderColor: '#ffa39e' }}>
            <Statistic
              title="消费(万)"
              value={((summaryStats.actualCost || 0) / 10000).toFixed(1)}
              suffix={`/ ${((summaryStats.planCost || 0) / 10000).toFixed(1)}`}
              valueStyle={{ color: '#f5222d', fontSize: 16 }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: '#f9f0ff', borderColor: '#d3adf7' }}>
            <Statistic
              title="计划收入(万)"
              value={(summaryStats.planIncome / 10000).toFixed(1)}
              valueStyle={{ color: '#722ed1', fontSize: 16 }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: '#e6fffb', borderColor: '#87e8de' }}>
            <Statistic
              title="实际收入(万)"
              value={((summaryStats.actualIncome || 0) / 10000).toFixed(1)}
              valueStyle={{ color: '#13c2c2', fontSize: 16 }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="enrollment" type="card" items={[
        { key: 'enrollment', label: (
            <span>
              <BarChartOutlined /> 报名月度趋势
            </span>
          ), children: (
          <>
          <Row gutter={16}>
            <Col span={12}>
              <Card title={`${year}年${campusName}${title} - 月度报名数据`} size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={enrollmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="计划报名" fill={CHART_COLORS[0]} name="计划报名" />
                    <Bar dataKey="毛报总数" fill={CHART_COLORS[1]} name="毛报总数" />
                    <Line
                      type="monotone"
                      dataKey="净报名"
                      stroke={CHART_COLORS[3]}
                      strokeWidth={2}
                      name="净报名"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="累计数据趋势" size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={cumulativeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="累计净报名"
                      stackId="1"
                      stroke={CHART_COLORS[0]}
                      fill={CHART_COLORS[0]}
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="累计上门"
                      stackId="2"
                      stroke={CHART_COLORS[2]}
                      fill={CHART_COLORS[2]}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
        ), },
        { key: 'consult', label: (
            <span>
              <LineChartOutlined /> 咨询量月度趋势
            </span>
          ), children: (
          <>
          <Row gutter={16}>
            <Col span={24}>
              <Card title={`${year}年${campusName}${title} - 月度咨询量数据`} size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={consultChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="计划咨询量" fill={CHART_COLORS[0]} name="计划咨询量" />
                    <Bar dataKey="实际总量" fill={CHART_COLORS[1]} name="实际总量" />
                    <Line
                      type="monotone"
                      dataKey="上门人数"
                      stroke={CHART_COLORS[3]}
                      name="上门人数"
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
        ), },
        { key: 'cost', label: (
            <span>
              <DollarOutlined /> 消费与收入趋势
            </span>
          ), children: (
          <>
          <Row gutter={16}>
            <Col span={12}>
              <Card title={`${year}年${campusName} - 月度消费对比`} size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={costChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="计划消费" fill={CHART_COLORS[0]} name="计划消费" />
                    <Bar dataKey="实际消费" fill={CHART_COLORS[3]} name="实际消费" />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card title={`${year}年${campusName} - 月度收入对比`} size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={incomeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="计划收入" fill={CHART_COLORS[0]} name="计划收入" />
                    <Bar dataKey="实际收入" fill={CHART_COLORS[1]} name="实际收入" />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
        ), },
        { key: 'overall', label: (
            <span>
              <PieChartOutlined /> 综合指标趋势
            </span>
          ), children: (
          <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card title="选择要显示的指标" size="small">
                <Checkbox.Group
                  options={availableMetrics.map((m) => ({
                    label: m.label,
                    value: m.key,
                  }))}
                  value={selectedMetrics}
                  onChange={handleMetricChange}
                  style={{ width: '100%' }}
                />
              </Card>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Card title="关键比率月度趋势" size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={progressChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 'auto']} unit="%" />
                    <RechartsTooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    {selectedMetrics.includes('报名进度') && (
                      <Line
                        type="monotone"
                        dataKey="报名进度"
                        stroke={CHART_COLORS[0]}
                        strokeWidth={2}
                        name="报名进度"
                      />
                    )}
                    {selectedMetrics.includes('咨询量完成进度') && (
                      <Line
                        type="monotone"
                        dataKey="咨询量完成进度"
                        stroke={CHART_COLORS[1]}
                        strokeWidth={2}
                        name="咨询量完成进度"
                      />
                    )}
                    {selectedMetrics.includes('上门率') && (
                      <Line
                        type="monotone"
                        dataKey="上门率"
                        stroke={CHART_COLORS[2]}
                        strokeWidth={2}
                        name="上门率"
                      />
                    )}
                    {selectedMetrics.includes('报名转化率') && (
                      <Line
                        type="monotone"
                        dataKey="报名转化率"
                        stroke={CHART_COLORS[4]}
                        strokeWidth={2}
                        name="报名转化率"
                      />
                    )}
                    {selectedMetrics.includes('退费率') && (
                      <Line
                        type="monotone"
                        dataKey="退费率"
                        stroke={CHART_COLORS[3]}
                        strokeWidth={2}
                        name="退费率"
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
        ), },
      ]} />
    </div>
  )
}

export default CampusMonthlyChartView
