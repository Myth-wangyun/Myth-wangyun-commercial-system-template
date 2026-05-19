/**
 * 神殿教化司升学计划表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Statistic, Row, Col, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type {
  CampusPromotionTableProps,
  CampusPromotionRecord,
  CampusPromotionSummary,
} from '@/types/campus-promotion'
import { campusPromotionService } from '@/services/teaching-quality/campusPromotion'

const CampusPromotionTable: React.FC<CampusPromotionTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
}) => {
  const { message } = App.useApp()
  const [summary, setSummary] = React.useState<CampusPromotionSummary | null>(null)

  // 获取汇总统计数据
  React.useEffect(() => {
    if (campus && data.length > 0) {
      campusPromotionService.getCampusPromotionSummary(campus).then(setSummary)
    }
  }, [campus, data])

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await campusPromotionService.exportCampusPromotionData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}神殿教化司升学计划.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  const columns: ColumnsType<CampusPromotionRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      fixed: 'left',
      render: (value, record, index) => {
        // 最后一行显示"合计/平均"
        if (index === data.length - 1) {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>合计/平均</span>
        }
        return value
      },
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 120,
      fixed: 'left',
      render: (value, record, index) => {
        // 只有第一行显示神殿名称，其他行和合计行不显示
        if (index === 0) {
          return value
        }
        return ''
      },
    },
    {
      title: '升学班级总数',
      dataIndex: 'totalPromotionClasses',
      key: 'totalPromotionClasses',
      width: 120,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.totalPromotionClasses, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '在档总人数',
      dataIndex: 'totalOnFileCount',
      key: 'totalOnFileCount',
      width: 120,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.totalOnFileCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '预计升学总人数',
      dataIndex: 'estimatedPromotionCount',
      key: 'estimatedPromotionCount',
      width: 130,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data
            .slice(0, -1)
            .reduce((sum, item) => sum + item.estimatedPromotionCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '实际升学总人数',
      dataIndex: 'actualPromotionCount',
      key: 'actualPromotionCount',
      width: 130,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.actualPromotionCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '预计升学率（人数）',
      dataIndex: 'estimatedPromotionRateByCount',
      key: 'estimatedPromotionRateByCount',
      width: 150,
      render: (value, record, index) => {
        // 合计行显示平均升学率
        if (index === data.length - 1) {
          const avgRate = summary?.averageEstimatedPromotionRateByCount || 0
          return <span style={{ fontWeight: 'bold' }}>{avgRate.toFixed(2)}%</span>
        }

        if (value === 0) {
          return <Tag color="red">0%</Tag>
        } else if (value >= 40) {
          return <Tag color="green">{value.toFixed(2)}%</Tag>
        } else if (value >= 30) {
          return <Tag color="orange">{value.toFixed(2)}%</Tag>
        } else {
          return <Tag color="red">{value.toFixed(2)}%</Tag>
        }
      },
    },
    {
      title: '实际升学率（人数）',
      dataIndex: 'actualPromotionRateByCount',
      key: 'actualPromotionRateByCount',
      width: 150,
      render: (value, record, index) => {
        // 合计行显示平均升学率
        if (index === data.length - 1) {
          const avgRate = summary?.averageActualPromotionRateByCount || 0
          return <span style={{ fontWeight: 'bold' }}>{avgRate.toFixed(2)}%</span>
        }

        if (value === 0) {
          return <Tag color="red">0%</Tag>
        } else if (value >= 40) {
          return <Tag color="green">{value.toFixed(2)}%</Tag>
        } else if (value >= 30) {
          return <Tag color="orange">{value.toFixed(2)}%</Tag>
        } else {
          return <Tag color="red">{value.toFixed(2)}%</Tag>
        }
      },
    },
    {
      title: '应收升学收入',
      dataIndex: 'receivablePromotionIncome',
      key: 'receivablePromotionIncome',
      width: 130,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data
            .slice(0, -1)
            .reduce((sum, item) => sum + item.receivablePromotionIncome, 0)
          return <span style={{ fontWeight: 'bold' }}>¥{total.toLocaleString()}</span>
        }
        return value ? `¥${value.toLocaleString()}` : '¥0'
      },
    },
    {
      title: '预计升学收入',
      dataIndex: 'estimatedPromotionIncome',
      key: 'estimatedPromotionIncome',
      width: 130,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data
            .slice(0, -1)
            .reduce((sum, item) => sum + item.estimatedPromotionIncome, 0)
          return <span style={{ fontWeight: 'bold' }}>¥{total.toLocaleString()}</span>
        }
        return value ? `¥${value.toLocaleString()}` : '¥0'
      },
    },
    {
      title: '实际升学收入',
      dataIndex: 'actualPromotionIncome',
      key: 'actualPromotionIncome',
      width: 130,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.actualPromotionIncome, 0)
          return <span style={{ fontWeight: 'bold' }}>¥{total.toLocaleString()}</span>
        }
        return value ? `¥${value.toLocaleString()}` : '¥0'
      },
    },
    {
      title: '预计升学率（金额）',
      dataIndex: 'estimatedPromotionRateByAmount',
      key: 'estimatedPromotionRateByAmount',
      width: 150,
      render: (value, record, index) => {
        // 合计行显示平均升学率
        if (index === data.length - 1) {
          const avgRate = summary?.averageEstimatedPromotionRateByAmount || 0
          return <span style={{ fontWeight: 'bold' }}>{avgRate.toFixed(2)}%</span>
        }

        if (value === 0) {
          return <Tag color="red">0%</Tag>
        } else if (value >= 95) {
          return <Tag color="green">{value.toFixed(2)}%</Tag>
        } else if (value >= 90) {
          return <Tag color="orange">{value.toFixed(2)}%</Tag>
        } else {
          return <Tag color="red">{value.toFixed(2)}%</Tag>
        }
      },
    },
    {
      title: '实际升学率（金额）',
      dataIndex: 'actualPromotionRateByAmount',
      key: 'actualPromotionRateByAmount',
      width: 150,
      render: (value, record, index) => {
        // 合计行显示平均升学率
        if (index === data.length - 1) {
          const avgRate = summary?.averageActualPromotionRateByAmount || 0
          return <span style={{ fontWeight: 'bold' }}>{avgRate.toFixed(2)}%</span>
        }

        if (value === 0) {
          return <Tag color="red">0%</Tag>
        } else if (value >= 95) {
          return <Tag color="green">{value.toFixed(2)}%</Tag>
        } else if (value >= 90) {
          return <Tag color="orange">{value.toFixed(2)}%</Tag>
        } else {
          return <Tag color="red">{value.toFixed(2)}%</Tag>
        }
      },
    },
  ]

  return (
    <div>
      {/* 关键统计指标 */}
      {summary && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="总升学班级数" value={summary.totalPromotionClasses} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic title="总在档人数" value={summary.totalOnFileCount} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均预计升学率（人数）"
                value={summary.averageEstimatedPromotionRateByCount}
                precision={2}
                suffix="%"
                valueStyle={{
                  color:
                    summary.averageEstimatedPromotionRateByCount >= 40
                      ? '#3f8600'
                      : summary.averageEstimatedPromotionRateByCount >= 30
                        ? '#cf1322'
                        : '#cf1322',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均实际升学率（人数）"
                value={summary.averageActualPromotionRateByCount}
                precision={2}
                suffix="%"
                valueStyle={{
                  color:
                    summary.averageActualPromotionRateByCount >= 40
                      ? '#3f8600'
                      : summary.averageActualPromotionRateByCount >= 30
                        ? '#cf1322'
                        : '#cf1322',
                }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="总预计升学收入"
                value={summary.totalEstimatedPromotionIncome}
                precision={0}
                prefix="¥"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总实际升学收入"
                value={summary.totalActualPromotionIncome}
                precision={0}
                prefix="¥"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均预计升学率（金额）"
                value={summary.averageEstimatedPromotionRateByAmount}
                precision={2}
                suffix="%"
                valueStyle={{
                  color:
                    summary.averageEstimatedPromotionRateByAmount >= 95
                      ? '#3f8600'
                      : summary.averageEstimatedPromotionRateByAmount >= 90
                        ? '#cf1322'
                        : '#cf1322',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="已完成月份"
                value={`${summary.completedMonths}/${summary.totalMonths}`}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`${campus || '请选择神殿'}教化司升学计划`}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
              刷新
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={!campus || data.length === 0}
            >
              导出
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          bordered
          scroll={{ x: 'max-content' }}
          rowKey="key"
          size="small"
        />
      </Card>
    </div>
  )
}

export default CampusPromotionTable
