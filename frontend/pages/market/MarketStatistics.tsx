import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  DatePicker,
  Button,
  Space,
  Statistic,
  Table,
  Tabs,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  BarChartOutlined,
  LineChartOutlined,
  DollarOutlined,
  AimOutlined,
  MessageOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { marketMockService } from '@/services/mock/marketMock'
import type { TimeSeriesStats, StatsQueryParams } from '@/types/market'
import { MEDIA_SOURCE_OPTIONS } from '@/types/market'
import { marketUtils } from '@/services/market/market'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const MarketStatistics: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesStats[]>([])
  const [statsType, setStatsType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily')
  const [queryParams, setQueryParams] = useState<StatsQueryParams>({})

  // 加载时间序列数据
  const loadTimeSeriesData = async (params: StatsQueryParams = {}) => {
    setLoading(true)
    try {
      const query = {
        ...queryParams,
        ...params,
        statsType,
      }
      const response = await marketMockService.stats.getTimeSeriesStats(
        query,
        currentCampus || undefined,
      )
      setTimeSeriesData(response.data)
      setQueryParams(query)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTimeSeriesData()
  }, [currentCampus, statsType])

  // 处理搜索
  const handleSearch = (values: any) => {
    const params: StatsQueryParams = {}

    if (values.dateRange && values.dateRange.length === 2) {
      params.startDate = values.dateRange[0].format('YYYY-MM-DD')
      params.endDate = values.dateRange[1].format('YYYY-MM-DD')
    }

    if (values.mediaSource) {
      params.mediaSource = values.mediaSource
    }

    loadTimeSeriesData(params)
  }

  // 处理统计类型切换
  const handleStatsTypeChange = (type: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setStatsType(type)
  }

  // 处理导出
  const handleExport = () => {
    console.log('导出统计数据')
  }

  // 计算总计数据
  const totalStats = timeSeriesData.reduce(
    (acc, item) => ({
      totalSpend: acc.totalSpend + item.totalSpend,
      totalClicks: acc.totalClicks + item.totalClicks,
      totalConversations: acc.totalConversations + item.totalConversations,
      totalLeads: acc.totalLeads + item.totalLeads,
    }),
    {
      totalSpend: 0,
      totalClicks: 0,
      totalConversations: 0,
      totalLeads: 0,
    },
  )

  // 表格列定义
  const columns: ColumnsType<TimeSeriesStats> = [
    {
      title: '时间',
      dataIndex: 'period',
      key: 'period',
      width: 120,
      fixed: 'left',
    },
    {
      title: '消费金额(元)',
      dataIndex: 'totalSpend',
      key: 'totalSpend',
      width: 140,
      sorter: (a, b) => a.totalSpend - b.totalSpend,
      render: (value: number) => marketUtils.formatCurrency(value),
    },
    {
      title: '点击量',
      dataIndex: 'totalClicks',
      key: 'totalClicks',
      width: 120,
      sorter: (a, b) => a.totalClicks - b.totalClicks,
      render: (value: number) => marketUtils.formatNumber(value),
    },
    {
      title: '对话量',
      dataIndex: 'totalConversations',
      key: 'totalConversations',
      width: 120,
      sorter: (a, b) => a.totalConversations - b.totalConversations,
      render: (value: number) => marketUtils.formatNumber(value),
    },
    {
      title: '咨询量',
      dataIndex: 'totalLeads',
      key: 'totalLeads',
      width: 120,
      sorter: (a, b) => a.totalLeads - b.totalLeads,
      render: (value: number) => marketUtils.formatNumber(value),
    },
    {
      title: '点击率(%)',
      dataIndex: 'clickRate',
      key: 'clickRate',
      width: 120,
      sorter: (a, b) => a.clickRate - b.clickRate,
      render: (value: number) => marketUtils.formatPercentage(value),
    },
    {
      title: '对话率(%)',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      width: 120,
      sorter: (a, b) => a.conversionRate - b.conversionRate,
      render: (value: number) => marketUtils.formatPercentage(value),
    },
    {
      title: '咨询率(%)',
      dataIndex: 'leadRate',
      key: 'leadRate',
      width: 120,
      sorter: (a, b) => a.leadRate - b.leadRate,
      render: (value: number) => marketUtils.formatPercentage(value),
    },
    {
      title: '平均点击成本(元)',
      dataIndex: 'avgClickPrice',
      key: 'avgClickPrice',
      width: 140,
      sorter: (a, b) => a.avgClickPrice - b.avgClickPrice,
      render: (value: number) => marketUtils.formatCurrency(value),
    },
  ]

  // 简单的图表组件（使用CSS模拟）
  const SimpleChart = ({ data }: { data: TimeSeriesStats[] }) => {
    const maxValue = Math.max(...data.map((item) => item.totalSpend))

    return (
      <div style={{ height: '300px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'end', height: '200px', gap: '4px' }}>
          {data.slice(0, 10).map((item, index) => {
            const height = (item.totalSpend / maxValue) * 180
            return (
              <div
                key={index}
                style={{
                  flex: 1,
                  height: `${height}px`,
                  backgroundColor: '#1890ff',
                  borderRadius: '2px 2px 0 0',
                  position: 'relative',
                  minHeight: '4px',
                }}
                title={`${item.period}: ${marketUtils.formatCurrency(item.totalSpend)}`}
              />
            )
          })}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '10px',
            fontSize: '12px',
          }}
        >
          {data.slice(0, 10).map((item, index) => (
            <div key={index} style={{ flex: 1, textAlign: 'center' }}>
              {item.period}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
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
          统计分析
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadTimeSeriesData()}>
            刷新
          </Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出Excel
          </Button>
        </Space>
      </div>

      {/* 总计统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="总消费金额"
              value={totalStats.totalSpend}
              prefix={<DollarOutlined />}
              valueStyle={{ color: 'white' }}
              formatter={(value) => marketUtils.formatCurrency(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card success">
            <Statistic
              title="总点击量"
              value={totalStats.totalClicks}
              prefix={<AimOutlined />}
              valueStyle={{ color: 'white' }}
              formatter={(value) => marketUtils.formatNumber(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card warning">
            <Statistic
              title="总对话量"
              value={totalStats.totalConversations}
              prefix={<MessageOutlined />}
              valueStyle={{ color: 'white' }}
              formatter={(value) => marketUtils.formatNumber(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card purple">
            <Statistic
              title="总咨询量"
              value={totalStats.totalLeads}
              prefix={<UserOutlined />}
              valueStyle={{ color: 'white' }}
              formatter={(value) => marketUtils.formatNumber(Number(value))}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索筛选 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Text strong>统计类型：</Text>
            <Select style={{ width: '100%' }} value={statsType} onChange={handleStatsTypeChange}>
              <Option value="daily">按日统计</Option>
              <Option value="weekly">按周统计</Option>
              <Option value="monthly">按月统计</Option>
              <Option value="yearly">按年统计</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Text strong>日期范围：</Text>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
              onChange={(dates) => {
                if (dates) {
                  handleSearch({
                    dateRange: dates,
                    mediaSource: queryParams.mediaSource,
                  })
                }
              }}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Text strong>媒体来源：</Text>
            <Select
              style={{ width: '100%' }}
              placeholder="请选择媒体来源"
              allowClear
              onChange={(value) => {
                handleSearch({
                  dateRange:
                    queryParams.startDate && queryParams.endDate
                      ? [dayjs(queryParams.startDate), dayjs(queryParams.endDate)]
                      : undefined,
                  mediaSource: value,
                })
              }}
            >
              {MEDIA_SOURCE_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              onClick={() => loadTimeSeriesData()}
              style={{ width: '100%' }}
            >
              查询统计
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 图表和表格 */}
      <Tabs defaultActiveKey="chart" type="card" items={[
        {
          key: 'chart',
          label: (
            <span>
              <LineChartOutlined />
              趋势图表
            </span>
          ),
          children: (
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card title="消费金额趋势" size="small">
                  <SimpleChart data={timeSeriesData} />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="点击量趋势" size="small">
                  <SimpleChart data={timeSeriesData} />
                </Card>
              </Col>
            </Row>
          ),
        },
        {
          key: 'table',
          label: (
            <span>
              <BarChartOutlined />
              数据表格
            </span>
          ),
          children: (
            <Card>
              <Table
                columns={columns}
                dataSource={timeSeriesData}
                rowKey="period"
                loading={loading}
                pagination={{
                  defaultPageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                }}
                scroll={{ x: 1000 }}
                size="small"
                summary={(pageData) => {
                  if (pageData.length === 0) return null

                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={1}>
                        <Text strong>合计</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Text strong>{marketUtils.formatCurrency(totalStats.totalSpend)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <Text strong>{marketUtils.formatNumber(totalStats.totalClicks)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong>{marketUtils.formatNumber(totalStats.totalConversations)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <Text strong>{marketUtils.formatNumber(totalStats.totalLeads)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={5} colSpan={4}>
                        <Text strong></Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )
                }}
              />
            </Card>
          ),
        },
      ]} />
    </div>
  )
}

export default MarketStatistics
