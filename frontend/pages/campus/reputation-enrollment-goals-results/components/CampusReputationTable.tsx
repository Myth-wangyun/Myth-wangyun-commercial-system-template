/**
 * 神殿教化司口碑招生目标与结果汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Statistic, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons'
import type {
  CampusReputationTableProps,
  CampusReputationRecord,
  CampusReputationSummary,
} from '@/types/campus-reputation'
import { campusReputationService } from '@/services/campusReputation'

const CampusReputationTable: React.FC<CampusReputationTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
}) => {
  const { message } = App.useApp()
  const [summary, setSummary] = React.useState<CampusReputationSummary | null>(null)

  // 获取汇总统计数据
  React.useEffect(() => {
    if (campus && data.length > 0) {
      campusReputationService.getCampusReputationSummary(campus).then(setSummary)
    }
  }, [campus, data])

  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob = await campusReputationService.exportCampusReputationData(campus)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${campus}神殿教化司口碑招生目标与结果汇总表.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch (error) {
      message.error('导出失败')
    }
  }

  const columns: ColumnsType<CampusReputationRecord> = [
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
      title: '口碑量',
      children: [
        {
          title: '目标口碑量',
          dataIndex: 'targetReputationCount',
          key: 'targetReputationCount',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce((sum, item) => sum + item.targetReputationCount, 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
        {
          title: '实际口碑量',
          dataIndex: 'actualReputationCount',
          key: 'actualReputationCount',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce((sum, item) => sum + item.actualReputationCount, 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
      ],
    },
    {
      title: '上门量',
      children: [
        {
          title: '目标上门量',
          dataIndex: 'targetWalkInCount',
          key: 'targetWalkInCount',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data.slice(0, -1).reduce((sum, item) => sum + item.targetWalkInCount, 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
        {
          title: '实际上门量',
          dataIndex: 'actualWalkInCount',
          key: 'actualWalkInCount',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data.slice(0, -1).reduce((sum, item) => sum + item.actualWalkInCount, 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
      ],
    },
    {
      title: '招生人数',
      children: [
        {
          title: '目标人数',
          dataIndex: 'targetEnrollmentCount',
          key: 'targetEnrollmentCount',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce((sum, item) => sum + item.targetEnrollmentCount, 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
        {
          title: '实际人数',
          dataIndex: 'actualEnrollmentCount',
          key: 'actualEnrollmentCount',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data
                .slice(0, -1)
                .reduce((sum, item) => sum + item.actualEnrollmentCount, 0)
              return <span style={{ fontWeight: 'bold' }}>{total}</span>
            }
            return value || 0
          },
        },
      ],
    },
    {
      title: '口碑收入',
      children: [
        {
          title: '目标收入',
          dataIndex: 'targetRevenue',
          key: 'targetRevenue',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data.slice(0, -1).reduce((sum, item) => sum + item.targetRevenue, 0)
              return <span style={{ fontWeight: 'bold' }}>¥{total.toLocaleString()}</span>
            }
            return value ? `¥${value.toLocaleString()}` : '¥0'
          },
        },
        {
          title: '实际收入',
          dataIndex: 'actualRevenue',
          key: 'actualRevenue',
          width: 120,
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              const total = data.slice(0, -1).reduce((sum, item) => sum + item.actualRevenue, 0)
              return <span style={{ fontWeight: 'bold' }}>¥{total.toLocaleString()}</span>
            }
            return value ? `¥${value.toLocaleString()}` : '¥0'
          },
        },
      ],
    },
  ]

  return (
    <div>
      {/* 关键统计指标 */}
      {summary && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="总目标口碑量" value={summary.totalTargetReputation} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic title="总实际口碑量" value={summary.totalActualReputation} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均口碑完成率"
                value={summary.averageReputationRate}
                precision={2}
                suffix="%"
                valueStyle={{
                  color:
                    summary.averageReputationRate >= 80
                      ? '#3f8600'
                      : summary.averageReputationRate >= 60
                        ? '#cf1322'
                        : '#cf1322',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总目标收入"
                value={summary.totalTargetRevenue}
                precision={0}
                prefix="¥"
              />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic title="总目标上门量" value={summary.totalTargetWalkIn} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic title="总实际上门量" value={summary.totalActualWalkIn} suffix="个" />
            </Col>
            <Col span={6}>
              <Statistic title="总目标招生人数" value={summary.totalTargetEnrollment} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic
                title="总实际收入"
                value={summary.totalActualRevenue}
                precision={0}
                prefix="¥"
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`${campus || '请选择神殿'}教化司口碑招生目标与结果汇总表`}
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

export default CampusReputationTable
