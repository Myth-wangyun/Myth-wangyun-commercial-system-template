import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  DatePicker,
  Select,
  Button,
  Space,
  Statistic,
} from 'antd'
import {
  ReloadOutlined,
  DownloadOutlined,
  BarChartOutlined,
  DollarOutlined,
  AimOutlined,
  MessageOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { marketMockService } from '@/services/mock/marketMock'
import type { MarketSummary as MarketSummaryType, StatsQueryParams } from '@/types/market'
import { MEDIA_SOURCE_OPTIONS } from '@/types/market'
import { marketUtils } from '@/services/market/market'

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const MarketSummary: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<MarketSummaryType[]>([])
  const [totalStats, setTotalStats] = useState({
    totalSpend: 0,
    totalClicks: 0,
    totalConversations: 0,
    totalLeads: 0,
    avgClickRate: 0,
    avgConversionRate: 0,
    avgLeadRate: 0,
    avgClickPrice: 0,
  })
  const [queryParams, setQueryParams] = useState<StatsQueryParams>({})

  // 加载数据
  const loadData = async (params: StatsQueryParams = {}) => {
    setLoading(true)
    try {
      const query = { ...queryParams, ...params }
      const response = await marketMockService.stats.getMarketSummary(
        query,
        currentCampus || undefined,
      )

      setData(response.data)

      // 计算总计数据
      const totals = response.data.reduce(
        (acc: any, item: MarketSummaryType) => ({
          totalSpend: acc.totalSpend + item.totalSpend,
          totalClicks: acc.totalClicks + item.totalClicks,
          totalConversations: acc.totalConversations + item.totalConversations,
          totalLeads: acc.totalLeads + item.totalLeads,
          avgClickRate: acc.avgClickRate + item.clickRate,
          avgConversionRate: acc.avgConversionRate + item.conversionRate,
          avgLeadRate: acc.avgLeadRate + item.leadRate,
          avgClickPrice: acc.avgClickPrice + item.avgClickPrice,
        }),
        {
          totalSpend: 0,
          totalClicks: 0,
          totalConversations: 0,
          totalLeads: 0,
          avgClickRate: 0,
          avgConversionRate: 0,
          avgLeadRate: 0,
          avgClickPrice: 0,
        },
      )

      // 计算平均值
      const count = response.data.length
      setTotalStats({
        ...totals,
        avgClickRate: count > 0 ? totals.avgClickRate / count : 0,
        avgConversionRate: count > 0 ? totals.avgConversionRate / count : 0,
        avgLeadRate: count > 0 ? totals.avgLeadRate / count : 0,
        avgClickPrice: count > 0 ? totals.avgClickPrice / count : 0,
      })

      setQueryParams(query)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentCampus])

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

    loadData(params)
  }

  // 处理导出
  const handleExport = () => {
    // 导出功能
    console.log('导出汇总数据')
  }

  // 表格列定义
  const columns: ColumnsType<MarketSummaryType> = [
    {
      title: '媒体来源',
      dataIndex: 'mediaSource',
      key: 'mediaSource',
      width: 120,
      fixed: 'left',
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount',
      width: 100,
      sorter: (a, b) => a.recordCount - b.recordCount,
      render: (value: number) => marketUtils.formatNumber(value),
    },
    {
      title: '总消费金额(元)',
      dataIndex: 'totalSpend',
      key: 'totalSpend',
      width: 140,
      sorter: (a, b) => a.totalSpend - b.totalSpend,
      render: (value: number) => marketUtils.formatCurrency(value),
    },
    {
      title: '总点击量',
      dataIndex: 'totalClicks',
      key: 'totalClicks',
      width: 120,
      sorter: (a, b) => a.totalClicks - b.totalClicks,
      render: (value: number) => marketUtils.formatNumber(value),
    },
    {
      title: '总对话量',
      dataIndex: 'totalConversations',
      key: 'totalConversations',
      width: 120,
      sorter: (a, b) => a.totalConversations - b.totalConversations,
      render: (value: number) => marketUtils.formatNumber(value),
    },
    {
      title: '总有效对话',
      dataIndex: 'totalValidConv',
      key: 'totalValidConv',
      width: 120,
      sorter: (a, b) => a.totalValidConv - b.totalValidConv,
      render: (value: number) => marketUtils.formatNumber(value),
    },
    {
      title: '总咨询量',
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
          网络投放效果汇总
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => loadData()}>
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

      {/* 平均指标统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="平均点击率"
              value={totalStats.avgClickRate}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: 'white' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card success">
            <Statistic
              title="平均对话率"
              value={totalStats.avgConversionRate}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: 'white' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card warning">
            <Statistic
              title="平均咨询率"
              value={totalStats.avgLeadRate}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: 'white' }}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card purple">
            <Statistic
              title="平均点击成本"
              value={totalStats.avgClickPrice}
              prefix={<DollarOutlined />}
              valueStyle={{ color: 'white' }}
              formatter={(value) => marketUtils.formatCurrency(Number(value))}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索筛选 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
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
              onClick={() => loadData()}
              style={{ width: '100%' }}
            >
              查询汇总
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 汇总数据表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="mediaSource"
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
          size="small"
          summary={(pageData) => {
            if (pageData.length === 0) return null

            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={1}>
                  <Text strong>合计</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text strong>
                    {marketUtils.formatNumber(totalStats.totalClicks > 0 ? data.length : 0)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <Text strong>{marketUtils.formatCurrency(totalStats.totalSpend)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <Text strong>{marketUtils.formatNumber(totalStats.totalClicks)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <Text strong>{marketUtils.formatNumber(totalStats.totalConversations)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5}>
                  <Text strong>
                    {marketUtils.formatNumber(
                      data.reduce((sum, item) => sum + item.totalValidConv, 0),
                    )}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6}>
                  <Text strong>{marketUtils.formatNumber(totalStats.totalLeads)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7}>
                  <Text strong>{marketUtils.formatPercentage(totalStats.avgClickRate)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8}>
                  <Text strong>{marketUtils.formatPercentage(totalStats.avgConversionRate)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9}>
                  <Text strong>{marketUtils.formatPercentage(totalStats.avgLeadRate)}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10}>
                  <Text strong>{marketUtils.formatCurrency(totalStats.avgClickPrice)}</Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )
          }}
        />
      </Card>
    </div>
  )
}

export default MarketSummary
