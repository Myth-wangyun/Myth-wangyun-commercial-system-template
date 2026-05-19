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
import { CHART_COLORS, parsePercent, formatCurrency } from './chartUtils'
import type { CoreDataRow, SummaryStats } from './types'

interface CoreDataChartViewProps {
  data: CoreDataRow[]
  year: string
}

/**
 * 计算汇总统计数据
 */
const calculateSummaryStats = (data: CoreDataRow[]): SummaryStats => {
  const campusData = data.filter((item) => !item.isTotal)

  const sum = (arr: (number | null)[]) =>
    arr.reduce((s, v) => (s || 0) + (v || 0), 0) || 0

  return {
    planIncome: sum(campusData.map((item) => item.planIncome)),
    standardIncome: sum(campusData.map((item) => item.standardIncome)),
    planEnrollment: sum(campusData.map((item) => item.planEnrollment)),
    netEnrollment: sum(campusData.map((item) => item.netEnrollment)),
    grossEnrollment: sum(campusData.map((item) => item.grossEnrollment)),
    planConsultVolume: sum(campusData.map((item) => item.planConsultVolume)),
    actualConsultVolume: sum(campusData.map((item) => item.actualConsultVolume)),
    visitCount: sum(campusData.map((item) => item.visitCount)),
    refundCount: sum(campusData.map((item) => item.refundCount)),
  }
}

const CoreDataChartView: React.FC<CoreDataChartViewProps> = ({ data, year }) => {
  // 过滤掉总计行，只展示各神殿数据
  const campusData = useMemo(() => data.filter((item) => !item.isTotal), [data])

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

  // 报名数据图表
  const enrollmentChartData = useMemo(() => {
    return campusData.map((item) => ({
      name: item.campus,
      计划报名: item.planEnrollment || 0,
      毛报总数: item.grossEnrollment || 0,
      净报名: item.netEnrollment || 0,
      订座数: item.orderCount || 0,
    }))
  }, [campusData])

  // 咨询量数据图表
  const consultChartData = useMemo(() => {
    return campusData.map((item) => ({
      name: item.campus,
      计划咨询量: item.planConsultVolume || 0,
      实际总量: item.actualConsultVolume || 0,
      上门人数: item.visitCount || 0,
    }))
  }, [campusData])

  // 收入数据图表
  const incomeChartData = useMemo(() => {
    return campusData.map((item) => ({
      name: item.campus,
      计划收入: item.planIncome || 0,
      标准实收入: item.standardIncome || 0,
    }))
  }, [campusData])

  // 进度百分比数据图表
  const progressChartData = useMemo(() => {
    return campusData.map((item) => ({
      name: item.campus,
      报名进度: parsePercent(item.enrollmentProgress),
      咨询量完成进度: parsePercent(item.consultCompletionProgress),
      上门率: parsePercent(item.visitRate),
      报名转化率: parsePercent(item.enrollmentConversionRate),
      退费率: parsePercent(item.refundRate),
    }))
  }, [campusData])

  // 报名构成饼图数据
  const enrollmentPieData = useMemo(() => {
    return campusData
      .map((item) => ({
        name: item.campus,
        value: item.netEnrollment || 0,
      }))
      .filter((item) => item.value > 0)
  }, [campusData])

  // 咨询量构成饼图数据
  const consultPieData = useMemo(() => {
    return campusData
      .map((item) => ({
        name: item.campus,
        value: item.actualConsultVolume || 0,
      }))
      .filter((item) => item.value > 0)
  }, [campusData])

  // 退费数据图表
  const refundChartData = useMemo(() => {
    return campusData.map((item) => ({
      name: item.campus,
      毛报总数: item.grossEnrollment || 0,
      退费数: item.refundCount || 0,
      退费率: parsePercent(item.refundRate),
    }))
  }, [campusData])

  // 处理指标选择变化
  const handleMetricChange = (checkedValues: string[]) => {
    setSelectedMetrics(checkedValues)
  }

  // 如果没有数据，显示空状态
  if (campusData.length === 0) {
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
              title="净报名 / 计划报名"
              value={summaryStats.netEnrollment}
              suffix={`/ ${summaryStats.planEnrollment}`}
              valueStyle={{ color: '#1890ff', fontSize: 18 }}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: '#f6ffed', borderColor: '#b7eb8f' }}>
            <Statistic
              title="咨询量 / 计划量"
              value={summaryStats.actualConsultVolume}
              suffix={`/ ${summaryStats.planConsultVolume}`}
              valueStyle={{ color: '#52c41a', fontSize: 18 }}
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
              valueStyle={{ color: '#fa8c16', fontSize: 18 }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: '#fff1f0', borderColor: '#ffa39e' }}>
            <Statistic
              title="退费数"
              value={summaryStats.refundCount}
              valueStyle={{ color: '#f5222d', fontSize: 18 }}
              prefix={<PieChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: '#f9f0ff', borderColor: '#d3adf7' }}>
            <Statistic
              title="计划收入(万)"
              value={(summaryStats.planIncome / 10000).toFixed(1)}
              valueStyle={{ color: '#722ed1', fontSize: 18 }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ background: '#e6fffb', borderColor: '#87e8de' }}>
            <Statistic
              title="实际收入(万)"
              value={(summaryStats.standardIncome / 10000).toFixed(1)}
              valueStyle={{ color: '#13c2c2', fontSize: 18 }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="enrollment" type="card" items={[
        {
          key: 'enrollment',
          label: (
            <span>
              <BarChartOutlined /> 报名数据分析
            </span>
          ), children: (
          <>
          <Row gutter={16}>
            <Col span={16}>
              <Card title={`${year}年各神殿报名数据对比`} size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={enrollmentChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="计划报名" fill={CHART_COLORS[0]} name="计划报名" />
                    <Bar dataKey="毛报总数" fill={CHART_COLORS[1]} name="毛报总数" />
                    <Bar dataKey="净报名" fill={CHART_COLORS[2]} name="净报名" />
                    <Bar dataKey="订座数" fill={CHART_COLORS[5]} name="订座数" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={8}>
              <Card title="各神殿净报名占比" size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={enrollmentPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(1)}%`
                      }
                    >
                      {enrollmentPieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card title="各神殿报名进度完成情况" size="small">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progressChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 'auto']} unit="%" />
                    <YAxis type="category" dataKey="name" width={80} />
                    <RechartsTooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar
                      dataKey="报名进度"
                      fill={CHART_COLORS[0]}
                      name="报名进度(%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
        ), },
        { key: 'consult', label: (
            <span>
              <LineChartOutlined /> 咨询量分析
            </span>
          ), children: (
          <>
          <Row gutter={16}>
            <Col span={16}>
              <Card title={`${year}年各神殿咨询量数据对比`} size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={consultChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar
                      dataKey="计划咨询量"
                      fill={CHART_COLORS[0]}
                      name="计划咨询量"
                    />
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
            <Col span={8}>
              <Card title="各神殿咨询量占比" size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={consultPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(1)}%`
                      }
                    >
                      {consultPieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card title="各神殿咨询量完成进度" size="small">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progressChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 'auto']} unit="%" />
                    <YAxis type="category" dataKey="name" width={80} />
                    <RechartsTooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar
                      dataKey="咨询量完成进度"
                      fill={CHART_COLORS[1]}
                      name="咨询量完成进度(%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
        ), },
        { key: 'income', label: (
            <span>
              <DollarOutlined /> 收入与退费分析
            </span>
          ), children: (
          <>
          <Row gutter={16}>
            <Col span={12}>
              <Card title={`${year}年各神殿收入对比`} size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={incomeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Legend />
                    <Bar dataKey="计划收入" fill={CHART_COLORS[0]} name="计划收入" />
                    <Bar
                      dataKey="标准实收入"
                      fill={CHART_COLORS[1]}
                      name="标准实收入"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card title={`${year}年各神殿退费情况`} size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={refundChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" unit="%" />
                    <RechartsTooltip />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="毛报总数"
                      fill={CHART_COLORS[0]}
                      name="毛报总数"
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="退费数"
                      fill={CHART_COLORS[3]}
                      name="退费数"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="退费率"
                      stroke={CHART_COLORS[4]}
                      name="退费率(%)"
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </>
        ), },
        { key: 'overall', label: (
            <span>
              <PieChartOutlined /> 综合指标分析
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
            <Col span={12}>
              <Card title="各神殿关键比率对比" size="small">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={progressChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} />
                    <YAxis domain={[0, 'auto']} unit="%" />
                    <RechartsTooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    {selectedMetrics.includes('报名进度') && (
                      <Bar
                        dataKey="报名进度"
                        fill={CHART_COLORS[0]}
                        name="报名进度"
                      />
                    )}
                    {selectedMetrics.includes('咨询量完成进度') && (
                      <Bar
                        dataKey="咨询量完成进度"
                        fill={CHART_COLORS[1]}
                        name="咨询量完成进度"
                      />
                    )}
                    {selectedMetrics.includes('上门率') && (
                      <Bar dataKey="上门率" fill={CHART_COLORS[2]} name="上门率" />
                    )}
                    {selectedMetrics.includes('报名转化率') && (
                      <Bar
                        dataKey="报名转化率"
                        fill={CHART_COLORS[4]}
                        name="报名转化率"
                      />
                    )}
                    {selectedMetrics.includes('退费率') && (
                      <Bar dataKey="退费率" fill={CHART_COLORS[3]} name="退费率" />
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
                    <PolarRadiusAxis domain={[0, 'auto']} />
                    {selectedMetrics.includes('报名进度') && (
                      <Radar
                        name="报名进度"
                        dataKey="报名进度"
                        stroke={CHART_COLORS[0]}
                        fill={CHART_COLORS[0]}
                        fillOpacity={0.3}
                      />
                    )}
                    {selectedMetrics.includes('咨询量完成进度') && (
                      <Radar
                        name="咨询量完成进度"
                        dataKey="咨询量完成进度"
                        stroke={CHART_COLORS[1]}
                        fill={CHART_COLORS[1]}
                        fillOpacity={0.3}
                      />
                    )}
                    {selectedMetrics.includes('上门率') && (
                      <Radar
                        name="上门率"
                        dataKey="上门率"
                        stroke={CHART_COLORS[2]}
                        fill={CHART_COLORS[2]}
                        fillOpacity={0.3}
                      />
                    )}
                    {selectedMetrics.includes('报名转化率') && (
                      <Radar
                        name="报名转化率"
                        dataKey="报名转化率"
                        stroke={CHART_COLORS[4]}
                        fill={CHART_COLORS[4]}
                        fillOpacity={0.3}
                      />
                    )}
                    {selectedMetrics.includes('退费率') && (
                      <Radar
                        name="退费率"
                        dataKey="退费率"
                        stroke={CHART_COLORS[3]}
                        fill={CHART_COLORS[3]}
                        fillOpacity={0.3}
                      />
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

export default CoreDataChartView
