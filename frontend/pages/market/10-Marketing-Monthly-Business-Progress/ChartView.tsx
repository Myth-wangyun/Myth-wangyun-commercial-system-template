import React, { useMemo, useState } from 'react'
import { Card, Row, Col, Tabs, Statistic, Checkbox } from 'antd'
import { BarChartOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'

// 图表颜色配置
const CHART_COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16']

// 数据类型定义
export interface BusinessProgressData {
  key: string
  campus: string
  planIncome: number | null
  actualIncome: number | null
  incomeCompletionRate: string
  investmentRatio: string
  roi: number | null
  consultConversionRate: string
  refundCount: number | null
  refundRate: string
  planEnrollment: number | null
  grossEnrollment: number | null
  netEnrollment: number | null
  orderCount: number | null
  enrollmentProgress: string
  netCost: string
  visitCount: number | null
  visitRate: string
  planConsultVolume: number | null
  deadline30ConsultVolume: number | null
  actualConsultVolume: number | null
  baiduVolume: number | null
  newMediaVolume: number | null
  consultCompletionProgress: string
  monthlyConsultCost: number | null
  actualCost: number | null
  consultCostRate: string
  isTotal?: boolean
}

interface ChartViewProps {
  data: BusinessProgressData[]
}

// 计算合计
const calculateTotal = (data: BusinessProgressData[]) => {
  if (data.length === 0) return null

  const sum = (arr: (number | null)[]) => arr.reduce((s, v) => (s || 0) + (v || 0), 0) || 0

  return {
    planEnrollment: sum(data.map((item) => item.planEnrollment)),
    netEnrollment: sum(data.map((item) => item.netEnrollment)),
    planConsultVolume: sum(data.map((item) => item.planConsultVolume)),
    actualConsultVolume: sum(data.map((item) => item.actualConsultVolume)),
    monthlyConsultCost: sum(data.map((item) => item.monthlyConsultCost)),
    actualCost: sum(data.map((item) => item.actualCost)),
    visitCount: sum(data.map((item) => item.visitCount)),
    grossEnrollment: sum(data.map((item) => item.grossEnrollment)),
  }
}

const ChartView: React.FC<ChartViewProps> = ({ data }) => {
  // 综合指标分析的数据项筛选状态
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    '报名进度',
    '咨询量完成进度',
    '上门率',
    '咨询转化率',
  ])

  // 可选的指标列表
  const availableMetrics = [
    { key: '报名进度', label: '报名进度', color: CHART_COLORS[0] },
    { key: '咨询量完成进度', label: '咨询量完成进度', color: CHART_COLORS[1] },
    { key: '上门率', label: '上门率', color: CHART_COLORS[2] },
    { key: '咨询转化率', label: '咨询转化率', color: CHART_COLORS[4] },
  ]

  // 处理指标选择变化
  const handleMetricChange = (checkedValues: string[]) => {
    setSelectedMetrics(checkedValues)
  }
  // 图表数据 - 报名数据对比
  const enrollmentChartData = useMemo(() => {
    return data.map(item => ({
      name: item.campus,
      计划报名: item.planEnrollment || 0,
      毛报总数: item.grossEnrollment || 0,
      净报名: item.netEnrollment || 0,
      订座数: item.orderCount || 0,
    }))
  }, [data])

  // 图表数据 - 咨询量数据对比
  const consultChartData = useMemo(() => {
    return data.map(item => ({
      name: item.campus,
      计划咨询量: item.planConsultVolume || 0,
      应完成: item.deadline30ConsultVolume || 0,
      实际总量: item.actualConsultVolume || 0,
      百度量: item.baiduVolume || 0,
      新媒体量: item.newMediaVolume || 0,
    }))
  }, [data])

  // 图表数据 - 消费数据对比
  const costChartData = useMemo(() => {
    return data.map(item => ({
      name: item.campus,
      月计划消费: item.monthlyConsultCost || 0,
      实际消费: item.actualCost || 0,
    }))
  }, [data])

  // 图表数据 - 完成进度对比（百分比）
  const progressChartData = useMemo(() => {
    return data.map(item => {
      const parsePercent = (str: string) => {
        if (!str || str === '-') return 0
        return parseFloat(str.replace('%', '')) || 0
      }
      return {
        name: item.campus,
        报名进度: parsePercent(item.enrollmentProgress),
        咨询量完成进度: parsePercent(item.consultCompletionProgress),
        上门率: parsePercent(item.visitRate),
        咨询转化率: parsePercent(item.consultConversionRate),
      }
    })
  }, [data])

  // 图表数据 - 收入与成本
  const incomeChartData = useMemo(() => {
    return data.map(item => ({
      name: item.campus,
      计划收入: item.planIncome || 0,
      实际收入: item.actualIncome || 0,
    }))
  }, [data])

  // 图表数据 - 渠道来源占比（饼图）
  const channelPieData = useMemo(() => {
    const totalBaidu = data.reduce((sum, item) => sum + (item.baiduVolume || 0), 0)
    const totalNewMedia = data.reduce((sum, item) => sum + (item.newMediaVolume || 0), 0)
    return [
      { name: '百度量', value: totalBaidu },
      { name: '新媒体量', value: totalNewMedia },
    ].filter(item => item.value > 0)
  }, [data])

  // 汇总统计数据
  const summaryStats = useMemo(() => {
    const total = calculateTotal(data)
    return {
      planEnrollment: total?.planEnrollment || 0,
      netEnrollment: total?.netEnrollment || 0,
      planConsultVolume: total?.planConsultVolume || 0,
      actualConsultVolume: total?.actualConsultVolume || 0,
      monthlyConsultCost: total?.monthlyConsultCost || 0,
      actualCost: total?.actualCost || 0,
      visitCount: total?.visitCount || 0,
      grossEnrollment: total?.grossEnrollment || 0,
    }
  }, [data])

  return (
    <div>
      {/* 关键指标统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small" style={{ background: '#e6f7ff', borderColor: '#91d5ff' }}>
            <Statistic
              title="计划报名 / 净报名"
              value={summaryStats.netEnrollment}
              suffix={`/ ${summaryStats.planEnrollment}`}
              valueStyle={{ color: '#1890ff' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <Statistic
              title="计划咨询量 / 实际总量"
              value={summaryStats.actualConsultVolume}
              suffix={`/ ${summaryStats.planConsultVolume}`}
              valueStyle={{ color: '#52c41a' }}
              prefix={<LineChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ background: '#fff7e6', borderColor: '#ffd591' }}>
            <Statistic
              title="月计划消费 / 实际消费"
              value={summaryStats.actualCost?.toFixed(0)}
              suffix={`/ ${summaryStats.monthlyConsultCost?.toFixed(0)}`}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<PieChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ background: '#f9f0ff', borderColor: '#d3adf7' }}>
            <Statistic
              title="上门总数 / 毛报总数"
              value={summaryStats.visitCount}
              suffix={`/ ${summaryStats.grossEnrollment}`}
              valueStyle={{ color: '#722ed1' }}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="enrollment" type="card" items={[
        { key: 'enrollment', label: (<span><BarChartOutlined /> 报名数据分析</span>), children: (
          <>
          <Row gutter={16}>
            <Col span={16}>
              <Card title="各神殿报名数据对比" size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={enrollmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="计划报名" fill={CHART_COLORS[0]} name="计划报名" />
                    <Bar dataKey="毛报总数" fill={CHART_COLORS[1]} name="毛报总数" />
                    <Bar dataKey="净报名" fill={CHART_COLORS[2]} name="净报名" />
                    <Bar dataKey="订座数" fill={CHART_COLORS[3]} name="订座数" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="报名进度完成情况" size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={progressChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <RechartsTooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar dataKey="报名进度" fill={CHART_COLORS[4]} name="报名进度(%)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
        ), },
        { key: 'consult', label: (<span><LineChartOutlined /> 咨询量分析</span>), children: (
          <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card title="各神殿咨询量数据对比" size="small">
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={consultChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="计划咨询量" fill={CHART_COLORS[0]} name="计划咨询量" />
                    <Bar dataKey="应完成" fill={CHART_COLORS[5]} name="应完成" />
                    <Bar dataKey="实际总量" fill={CHART_COLORS[1]} name="实际总量" />
                    <Line type="monotone" dataKey="百度量" stroke={CHART_COLORS[3]} name="百度量" strokeWidth={2} />
                    <Line type="monotone" dataKey="新媒体量" stroke={CHART_COLORS[4]} name="新媒体量" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Card title="咨询量渠道来源占比" size="small">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    >
                      {channelPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="咨询量完成进度" size="small">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progressChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="name" width={100} />
                    <RechartsTooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar dataKey="咨询量完成进度" fill={CHART_COLORS[1]} name="咨询量完成进度(%)" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
        ), },
        { key: 'cost', label: (<span><PieChartOutlined /> 消费与成本分析</span>), children: (
          <>
          <Row gutter={16}>
            <Col span={12}>
              <Card title="各神殿消费对比" size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={costChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="月计划消费" fill={CHART_COLORS[0]} name="月计划消费" />
                    <Bar dataKey="实际消费" fill={CHART_COLORS[3]} name="实际消费" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="各神殿收入对比" size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={incomeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="计划收入" fill={CHART_COLORS[0]} name="计划收入" />
                    <Bar dataKey="实际收入" fill={CHART_COLORS[1]} name="实际收入" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
        ), },
        { key: 'overall', label: (<span><BarChartOutlined /> 综合指标分析</span>), children: (
          <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Card title="选择要显示的指标" size="small">
                <Checkbox.Group
                  options={availableMetrics.map(m => ({ label: m.label, value: m.key }))}
                  value={selectedMetrics}
                  onChange={handleMetricChange}
                  style={{ width: '100%' }}
                />
              </Card>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Card title="各神殿关键比率对比" size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={progressChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[0, 100]} unit="%" />
                    <RechartsTooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    {selectedMetrics.includes('报名进度') && (
                      <Bar dataKey="报名进度" fill={CHART_COLORS[0]} name="报名进度" />
                    )}
                    {selectedMetrics.includes('咨询量完成进度') && (
                      <Bar dataKey="咨询量完成进度" fill={CHART_COLORS[1]} name="咨询量完成进度" />
                    )}
                    {selectedMetrics.includes('上门率') && (
                      <Bar dataKey="上门率" fill={CHART_COLORS[2]} name="上门率" />
                    )}
                    {selectedMetrics.includes('咨询转化率') && (
                      <Bar dataKey="咨询转化率" fill={CHART_COLORS[4]} name="咨询转化率" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="神殿综合能力雷达图" size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={progressChartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    {selectedMetrics.includes('报名进度') && (
                      <Radar name="报名进度" dataKey="报名进度" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.3} />
                    )}
                    {selectedMetrics.includes('咨询量完成进度') && (
                      <Radar name="咨询量完成进度" dataKey="咨询量完成进度" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.3} />
                    )}
                    {selectedMetrics.includes('上门率') && (
                      <Radar name="上门率" dataKey="上门率" stroke={CHART_COLORS[2]} fill={CHART_COLORS[2]} fillOpacity={0.3} />
                    )}
                    {selectedMetrics.includes('咨询转化率') && (
                      <Radar name="咨询转化率" dataKey="咨询转化率" stroke={CHART_COLORS[4]} fill={CHART_COLORS[4]} fillOpacity={0.3} />
                    )}
                    <Legend />
                  </RadarChart>
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

export default ChartView

