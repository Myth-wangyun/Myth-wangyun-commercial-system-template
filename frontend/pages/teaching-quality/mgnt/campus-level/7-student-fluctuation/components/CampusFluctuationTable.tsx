/**
 * 神殿教化司学员异动表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Statistic, Row, Col, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type {
  CampusFluctuationTableProps,
  CampusFluctuationRecord,
  CampusFluctuationSummary,
} from '@/types/campus-fluctuation'
import { campusFluctuationService } from '@/services/teaching-quality/campusFluctuation'

const CampusFluctuationTable: React.FC<CampusFluctuationTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
}) => {
  const { message } = App.useApp()
  const [summary, setSummary] = React.useState<CampusFluctuationSummary | null>(null)

  // 获取汇总统计数据
  React.useEffect(() => {
    if (campus && data.length > 0) {
      campusFluctuationService.getCampusFluctuationSummary(campus).then(setSummary)
    }
  }, [campus, data])

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await campusFluctuationService.exportCampusFluctuationData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}神殿教化司学员异动表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  const columns: ColumnsType<CampusFluctuationRecord> = [
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
      title: '累计带生人数',
      dataIndex: 'cumulativeStudentCount',
      key: 'cumulativeStudentCount',
      width: 120,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data
            .slice(0, -1)
            .reduce((sum, item) => sum + item.cumulativeStudentCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '新生退费人数',
      dataIndex: 'newStudentRefundCount',
      key: 'newStudentRefundCount',
      width: 120,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.newStudentRefundCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '老生退费人数',
      dataIndex: 'oldStudentRefundCount',
      key: 'oldStudentRefundCount',
      width: 120,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.oldStudentRefundCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '退费总人数',
      dataIndex: 'totalRefundCount',
      key: 'totalRefundCount',
      width: 120,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.totalRefundCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 100,
      render: (value, record, index) => {
        // 合计行显示平均退费率
        if (index === data.length - 1) {
          const avgRate = summary?.averageRefundRate || 0
          return <span style={{ fontWeight: 'bold' }}>{avgRate.toFixed(2)}%</span>
        }

        if (value === 0) {
          return <Tag color="green">0%</Tag>
        } else if (value <= 5) {
          return <Tag color="green">{value.toFixed(2)}%</Tag>
        } else if (value <= 10) {
          return <Tag color="orange">{value.toFixed(2)}%</Tag>
        } else {
          return <Tag color="red">{value.toFixed(2)}%</Tag>
        }
      },
    },
    {
      title: '休学总人数',
      dataIndex: 'totalLeaveCount',
      key: 'totalLeaveCount',
      width: 120,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.totalLeaveCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '长期请假总人数',
      dataIndex: 'longTermLeaveCount',
      key: 'longTermLeaveCount',
      width: 130,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.longTermLeaveCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '长期不上课总人数',
      dataIndex: 'longTermAbsentCount',
      key: 'longTermAbsentCount',
      width: 140,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.longTermAbsentCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '寒暑假学生总数',
      dataIndex: 'holidayStudentCount',
      key: 'holidayStudentCount',
      width: 130,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.holidayStudentCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '其他情况总人数',
      dataIndex: 'otherSituationCount',
      key: 'otherSituationCount',
      width: 130,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.otherSituationCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '异动总人数',
      dataIndex: 'totalFluctuationCount',
      key: 'totalFluctuationCount',
      width: 120,
      render: (value, record, index) => {
        // 合计行显示总和
        if (index === data.length - 1) {
          const total = data.slice(0, -1).reduce((sum, item) => sum + item.totalFluctuationCount, 0)
          return <span style={{ fontWeight: 'bold' }}>{total}</span>
        }
        return value || 0
      },
    },
    {
      title: '异动率',
      dataIndex: 'fluctuationRate',
      key: 'fluctuationRate',
      width: 100,
      render: (value, record, index) => {
        // 合计行显示平均异动率
        if (index === data.length - 1) {
          const avgRate = summary?.averageFluctuationRate || 0
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
  ]

  return (
    <div>
      {/* 关键统计指标 */}
      {summary && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总累计带生人数"
                value={summary.totalCumulativeStudentCount}
                suffix="人"
              />
            </Col>
            <Col span={6}>
              <Statistic title="总退费人数" value={summary.totalRefundCount} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均退费率"
                value={summary.averageRefundRate}
                precision={2}
                suffix="%"
                valueStyle={{
                  color:
                    summary.averageRefundRate <= 5
                      ? '#3f8600'
                      : summary.averageRefundRate <= 10
                        ? '#cf1322'
                        : '#cf1322',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic title="总异动人数" value={summary.totalFluctuationCount} suffix="人" />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic
                title="平均异动率"
                value={summary.averageFluctuationRate}
                precision={2}
                suffix="%"
                valueStyle={{
                  color:
                    summary.averageFluctuationRate <= 10
                      ? '#3f8600'
                      : summary.averageFluctuationRate <= 20
                        ? '#cf1322'
                        : '#cf1322',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic title="总休学人数" value={summary.totalLeaveCount} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic
                title="总长期请假人数"
                value={summary.totalLongTermLeaveCount}
                suffix="人"
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
        title={`${campus || '请选择神殿'}教化司学员异动表`}
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

export default CampusFluctuationTable
