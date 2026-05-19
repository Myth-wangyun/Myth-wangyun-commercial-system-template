import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Table,
  Space,
  DatePicker,
  Select,
  Tabs,
  Statistic,
  Progress,
} from 'antd'
import {
  ReloadOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { consultingMockService } from '@/services/mock/consultingMock'
import type {
  ConsultingStats as ConsultingStatsType,
  ConsultingSummary,
  ConsultingTimeSeriesStats,
  ConsultingStatsQueryParams,
} from '@/types/consulting'
import { CONSULTING_TYPE_OPTIONS, CONSULTING_STATUS_OPTIONS } from '@/types/consulting'
import { consultingUtils } from '@/services/consulting'
import { NoCopyContainer } from '@/components/common'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select


const ConsultingStats: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<ConsultingStatsType | null>(null)
  const [summary, setSummary] = useState<ConsultingSummary[]>([])
  const [timeSeries, setTimeSeries] = useState<ConsultingTimeSeriesStats[]>([])
  const [queryParams, setQueryParams] = useState<ConsultingStatsQueryParams>({
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  })

  // 加载统计数据
  const loadStats = async () => {
    setLoading(true)
    try {
      const [statsResponse, summaryResponse, timeSeriesResponse] = await Promise.all([
        consultingMockService.stats.getConsultingStats(queryParams, currentCampus || undefined),
        consultingMockService.stats.getConsultingSummary(queryParams, currentCampus || undefined),
        consultingMockService.stats.getTimeSeriesStats(queryParams, currentCampus || undefined),
      ])

      setStats(statsResponse.data)
      setSummary(summaryResponse.data || [])
      setTimeSeries(timeSeriesResponse.data || [])
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [currentCampus, queryParams])

  // 处理查询参数变化
  const handleQueryChange = (field: string, value: any) => {
    setQueryParams((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // 处理日期范围变化
  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setQueryParams((prev) => ({
        ...prev,
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      }))
    } else {
      setQueryParams((prev) => ({
        ...prev,
        startDate: undefined,
        endDate: undefined,
      }))
    }
  }

  // 汇总表格列定义
  const summaryColumns: ColumnsType<ConsultingSummary> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date: string) => consultingUtils.formatDate(date),
    },
    {
      title: '总咨询量',
      dataIndex: 'totalCount',
      key: 'totalCount',
      width: 100,
      sorter: (a, b) => a.totalCount - b.totalCount,
    },
    {
      title: '电话咨询',
      dataIndex: ['byType', '电话咨询'],
      key: 'phone',
      width: 100,
    },
    {
      title: '在线咨询',
      dataIndex: ['byType', '在线咨询'],
      key: 'online',
      width: 100,
    },
    {
      title: '微信咨询',
      dataIndex: ['byType', '微信咨询'],
      key: 'wechat',
      width: 100,
    },
    {
      title: 'QQ咨询',
      dataIndex: ['byType', 'QQ咨询'],
      key: 'qq',
      width: 100,
    },
    {
      title: '现场咨询',
      dataIndex: ['byType', '现场咨询'],
      key: 'onsite',
      width: 100,
    },
    {
      title: '其他',
      dataIndex: ['byType', '其他'],
      key: 'other',
      width: 100,
    },
    {
      title: '待处理',
      dataIndex: ['byStatus', '待处理'],
      key: 'pending',
      width: 100,
    },
    {
      title: '处理中',
      dataIndex: ['byStatus', '处理中'],
      key: 'processing',
      width: 100,
    },
    {
      title: '已处理',
      dataIndex: ['byStatus', '已处理'],
      key: 'completed',
      width: 100,
    },
    {
      title: '已关闭',
      dataIndex: ['byStatus', '已关闭'],
      key: 'closed',
      width: 100,
    },
    {
      title: '平均响应时间(小时)',
      dataIndex: 'avgResponseTime',
      key: 'avgResponseTime',
      width: 150,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: '完成率(%)',
      dataIndex: 'completionRate',
      key: 'completionRate',
      width: 120,
      render: (value: number) => (
        <Progress percent={value} size="small" format={(percent) => `${percent?.toFixed(1)}%`} />
      ),
    },
  ]

  // 时间序列表格列定义
  const timeSeriesColumns: ColumnsType<ConsultingTimeSeriesStats> = [
    {
      title: '日期',
      dataIndex: 'period',
      key: 'period',
      width: 120,
      render: (period: string) => consultingUtils.formatDate(period),
    },
    {
      title: '总咨询量',
      dataIndex: 'totalCount',
      key: 'totalCount',
      width: 100,
      sorter: (a, b) => a.totalCount - b.totalCount,
    },
    {
      title: '已完成',
      dataIndex: 'completedCount',
      key: 'completedCount',
      width: 100,
      sorter: (a, b) => a.completedCount - b.completedCount,
    },
    {
      title: '平均响应时间(小时)',
      dataIndex: 'avgResponseTime',
      key: 'avgResponseTime',
      width: 150,
      render: (value: number) => value.toFixed(2),
      sorter: (a, b) => a.avgResponseTime - b.avgResponseTime,
    },
    {
      title: '完成率(%)',
      dataIndex: 'completionRate',
      key: 'completionRate',
      width: 120,
      render: (value: number) => (
        <Progress percent={value} size="small" format={(percent) => `${percent?.toFixed(1)}%`} />
      ),
      sorter: (a, b) => a.completionRate - b.completionRate,
    },
  ]

  // 简单图表组件
  const SimpleChart: React.FC<{ data: any[]; type: 'bar' | 'line' | 'pie' }> = ({ data, type }) => {
    if (!data || data.length === 0) {
      return (
        <div
          style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          暂无数据
        </div>
      )
    }

    if (type === 'bar') {
      const maxValue = Math.max(...data.map((item) => item.value))
      return (
        <div style={{ height: 200, padding: '20px 0' }}>
          {data.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ width: 80, fontSize: '12px' }}>{item.name}</div>
              <div style={{ flex: 1, margin: '0 10px' }}>
                <div
                  style={{
                    height: 20,
                    backgroundColor: item.color || '#1890ff',
                    width: `${(item.value / maxValue) * 100}%`,
                    borderRadius: 2,
                  }}
                />
              </div>
              <div style={{ width: 40, fontSize: '12px', textAlign: 'right' }}>{item.value}</div>
            </div>
          ))}
        </div>
      )
    }

    if (type === 'line') {
      return (
        <div style={{ height: 200, padding: '20px 0' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 10 }}>趋势图（模拟）</div>
          <div
            style={{
              height: 150,
              border: '1px solid #f0f0f0',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text type="secondary">趋势图表区域</Text>
          </div>
        </div>
      )
    }

    return (
      <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text type="secondary">图表区域</Text>
      </div>
    )
  }

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      {/* 页面标题和操作按钮 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          咨询统计分析
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadStats}>
            刷新
          </Button>
          <Button icon={<DownloadOutlined />}>导出数据</Button>
        </Space>
      </div>

      {/* 查询筛选 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Text strong>日期范围：</Text>
            <RangePicker
              style={{ width: '100%', marginTop: 4 }}
              value={
                queryParams.startDate && queryParams.endDate
                  ? [dayjs(queryParams.startDate), dayjs(queryParams.endDate)]
                  : undefined
              }
              onChange={handleDateRangeChange}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Text strong>咨询类型：</Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              placeholder="选择咨询类型"
              allowClear
              value={queryParams.type}
              onChange={(value) => handleQueryChange('type', value)}
            >
              {CONSULTING_TYPE_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Text strong>处理状态：</Text>
            <Select
              style={{ width: '100%', marginTop: 4 }}
              placeholder="选择处理状态"
              allowClear
              value={queryParams.status}
              onChange={(value) => handleQueryChange('status', value)}
            >
              {CONSULTING_STATUS_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 统计概览 */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总咨询量"
                value={stats.totalRecords}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="平均响应时间"
                value={stats.avgResponseTime}
                suffix="小时"
                prefix={<LineChartOutlined />}
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="完成率"
                value={stats.completionRate}
                suffix="%"
                prefix={<PieChartOutlined />}
                precision={1}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待处理"
                value={stats.totalByStatus['待处理']}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 图表和表格 */}
      <Tabs defaultActiveKey="summary" items={[
        {
          key: 'summary',
          label: '汇总统计',
          children: (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card title="咨询类型分布" size="small">
                    {stats && (
                      <SimpleChart
                        data={Object.entries(stats.totalByType).map(([name, value]) => ({
                          name,
                          value,
                          color: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'][
                            Object.keys(stats.totalByType).indexOf(name) % 6
                          ],
                        }))}
                        type="bar"
                      />
                    )}
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title="处理状态分布" size="small">
                    {stats && (
                      <SimpleChart
                        data={Object.entries(stats.totalByStatus).map(([name, value]) => ({
                          name,
                          value,
                          color:
                            name === '待处理'
                              ? '#faad14'
                              : name === '处理中'
                                ? '#1890ff'
                                : name === '已处理'
                                  ? '#52c41a'
                                  : '#8c8c8c',
                        }))}
                        type="bar"
                      />
                    )}
                  </Card>
                </Col>
              </Row>

              <Card title="汇总数据表格" style={{ marginTop: 16 }}>
                <Table
                  columns={summaryColumns}
                  dataSource={summary}
                  rowKey="date"
                  loading={loading}
                  pagination={{
                    defaultPageSize: 20,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                  }}
                  scroll={{ x: 1200 }}
                  size="small"
                />
              </Card>
            </>
          ),
        },
        {
          key: 'trend',
          label: '趋势分析',
          children: (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={24}>
                  <Card title="咨询量趋势" size="small">
                    <SimpleChart
                      data={timeSeries.map((item) => ({
                        name: item.period,
                        value: item.totalCount,
                      }))}
                      type="line"
                    />
                  </Card>
                </Col>
              </Row>

              <Card title="时间序列数据" style={{ marginTop: 16 }}>
                <Table
                  columns={timeSeriesColumns}
                  dataSource={timeSeries}
                  rowKey="period"
                  loading={loading}
                  pagination={{
                    defaultPageSize: 20,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                  }}
                  scroll={{ x: 600 }}
                  size="small"
                />
              </Card>
            </>
          ),
        },
      ]} />
    </NoCopyContainer>
  )
}

export default ConsultingStats
