/**
 * 神殿教化司新生当月维稳统计表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Statistic, Row, Col, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type {
  CampusStabilityTableProps,
  CampusStabilityRecord,
  CampusStabilitySummary,
} from '@/types/campus-stability'
import { campusStabilityService } from '@/services/teaching-quality/campusStability'

const CampusStabilityTable: React.FC<CampusStabilityTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
}) => {
  const { message } = App.useApp()
  const [summary, setSummary] = React.useState<CampusStabilitySummary | null>(null)

  // 获取汇总统计数据
  React.useEffect(() => {
    if (campus && data.length > 0) {
      campusStabilityService.getCampusStabilitySummary(campus).then(setSummary)
    }
  }, [campus, data])

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await campusStabilityService.exportCampusStabilityData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}神殿教化司新生当月维稳统计表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  const columns: ColumnsType<CampusStabilityRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      fixed: 'left',
      render: (value, record, index) => {
        // 最后一行显示"合计"
        if (index === data.length - 1) {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
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
      title: '交接人数',
      dataIndex: 'handoverCount',
      key: 'handoverCount',
      width: 100,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.handoverCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '报道新生',
      children: [
        {
          title: '报道人数',
          dataIndex: 'reportedCount',
          key: 'reportedCount',
          width: 100,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data.slice(0, -1).reduce((sum, item) => sum + item.reportedCount, 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
        {
          title: '稳定过课时人数',
          dataIndex: 'stableCourseCount',
          key: 'stableCourseCount',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data.slice(0, -1).reduce((sum, item) => sum + item.stableCourseCount, 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
        {
          title: '未过课时人数',
          dataIndex: 'unstableCourseCount',
          key: 'unstableCourseCount',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce((sum, item) => sum + item.unstableCourseCount, 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
        {
          title: '回全款人数',
          dataIndex: 'fullRefundCount',
          key: 'fullRefundCount',
          width: 100,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data.slice(0, -1).reduce((sum, item) => sum + item.fullRefundCount, 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
        {
          title: '仍欠费人数',
          dataIndex: 'outstandingFeeCount',
          key: 'outstandingFeeCount',
          width: 100,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce((sum, item) => sum + item.outstandingFeeCount, 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
        {
          title: '欠费总金额',
          dataIndex: 'outstandingFeeAmount',
          key: 'outstandingFeeAmount',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce((sum, item) => sum + item.outstandingFeeAmount, 0)
              return <span style={{ fontWeight: 'bold' }}>¥{total.toLocaleString()}</span>
            }
            return value ? `¥${value.toLocaleString()}` : '¥0'
          },
        },
        {
          title: '退费人数',
          dataIndex: 'refundCount',
          key: 'refundCount',
          width: 100,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data.slice(0, -1).reduce((sum, item) => sum + item.refundCount, 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
      ],
    },
    {
      title: '新生退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 120,
      render: (value, record, index) => {
        // 合计行显示平均退费率
        if (index === data.length - 1) {
          const avgRate = summary?.averageRefundRate || 0
          return <span style={{ fontWeight: 'bold' }}>{avgRate.toFixed(2)}%</span>
        }

        if (value === 0) {
          return <Tag color="green">0%</Tag>
        } else if (value <= 10) {
          return <Tag color="green">{value.toFixed(2)}%</Tag>
        } else if (value <= 20) {
          return <Tag color="orange">{value.toFixed(2)}%</Tag>
        } else {
          return <Tag color="red">{value.toFixed(2)}%</Tag>
        }
      },
    },
    {
      title: '退费学员情况说明',
      dataIndex: 'refundSituationDescription',
      key: 'refundSituationDescription',
      width: 300,
      render: (value, record, index) => {
        // 合计行不显示说明
        if (index === data.length - 1) {
          return ''
        }
        return value || '无退费情况'
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
              <Statistic title="总交接人数" value={summary.totalHandoverCount} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic title="总报道人数" value={summary.totalReportedCount} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic
                title="稳定率"
                value={summary.stabilityRate}
                precision={2}
                suffix="%"
                valueStyle={{
                  color:
                    summary.stabilityRate >= 80
                      ? '#3f8600'
                      : summary.stabilityRate >= 60
                        ? '#cf1322'
                        : '#cf1322',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均退费率"
                value={summary.averageRefundRate}
                precision={2}
                suffix="%"
                valueStyle={{
                  color:
                    summary.averageRefundRate <= 10
                      ? '#3f8600'
                      : summary.averageRefundRate <= 20
                        ? '#cf1322'
                        : '#cf1322',
                }}
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="总稳定过课时人数"
                value={summary.totalStableCourseCount}
                suffix="人"
              />
            </Col>
            <Col span={6}>
              <Statistic title="总退费人数" value={summary.totalRefundCount} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic
                title="总欠费金额"
                value={summary.totalOutstandingFeeAmount}
                precision={0}
                prefix="¥"
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
        title={`${campus || '请选择神殿'}教化司新生当月维稳统计表`}
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

export default CampusStabilityTable
