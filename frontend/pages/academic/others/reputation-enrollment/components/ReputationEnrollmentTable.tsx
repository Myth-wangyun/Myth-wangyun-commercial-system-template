/**
 * 神殿教化司口碑招生目标与结果汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Row, Col, Statistic, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, DollarOutlined } from '@ant-design/icons'
import type {
  ReputationEnrollmentTableProps,
  ReputationEnrollmentRecord,
} from '@/types/reputation-enrollment'
import { teachingQualityCampusReputationEnrollmentGoalsResultsService } from '@/services/teachingQualityCampusReputationEnrollmentGoalsResults'

const ReputationEnrollmentTable: React.FC<ReputationEnrollmentTableProps> = ({
  campus,
  data,
  loading,
  onRefresh,
  onExport,
}) => {
  const { message } = App.useApp()
  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob =
        await teachingQualityCampusReputationEnrollmentGoalsResultsService.exportReputationEnrollmentData(
          campus,
        )
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

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalTargetReputationVolume: 0,
        totalActualReputationVolume: 0,
        reputationAchievementRate: 0,
        totalActualRevenue: 0,
      }
    }

    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    const totalTargetReputationVolume = totalRow?.targetReputationVolume || 0
    const totalActualReputationVolume = totalRow?.actualReputationVolume || 0
    const reputationAchievementRate =
      totalTargetReputationVolume > 0
        ? Math.floor((totalActualReputationVolume / totalTargetReputationVolume) * 100)
        : 0
    const totalActualRevenue = totalRow?.actualRevenue || 0

    return {
      totalTargetReputationVolume,
      totalActualReputationVolume,
      reputationAchievementRate,
      totalActualRevenue,
    }
  }, [data])

  const columns: ColumnsType<ReputationEnrollmentRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
        }
        return value
      },
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      align: 'center',
      render: (value, record, index) => {
        // 只在第一行显示神殿，其他行为空
        if (index === 0 && record.rowType === 'data') {
          return value
        }
        if (record.rowType === 'total') {
          return null
        }
        return ''
      },
    },
    {
      title: '口碑量',
      children: [
        {
          title: '目标口碑量',
          dataIndex: 'targetReputationVolume',
          key: 'targetReputationVolume',
          width: 120,
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'total') {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
          },
        },
        {
          title: '实际口碑量',
          dataIndex: 'actualReputationVolume',
          key: 'actualReputationVolume',
          width: 120,
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'total') {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
          },
        },
      ],
    },
    {
      title: '上门量',
      children: [
        {
          title: '目标上门量',
          dataIndex: 'targetWalkInVolume',
          key: 'targetWalkInVolume',
          width: 120,
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'total') {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
          },
        },
        {
          title: '实际上门量',
          dataIndex: 'actualWalkInVolume',
          key: 'actualWalkInVolume',
          width: 120,
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'total') {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
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
          width: 100,
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'total') {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
          },
        },
        {
          title: '实际人数',
          dataIndex: 'actualEnrollmentCount',
          key: 'actualEnrollmentCount',
          width: 100,
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'total') {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value
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
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'total') {
              return <span style={{ fontWeight: 'bold' }}>¥{value.toLocaleString()}</span>
            }
            return `¥${value.toLocaleString()}`
          },
        },
        {
          title: '实际收入',
          dataIndex: 'actualRevenue',
          key: 'actualRevenue',
          width: 120,
          align: 'center',
          render: (value, record) => {
            if (record.rowType === 'total') {
              return (
                <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                  ¥{value.toLocaleString()}
                </span>
              )
            }
            return `¥${value.toLocaleString()}`
          },
        },
      ],
    },
  ]

  return (
    <div>
      {/* 统计卡片 */}
      {data.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="总目标口碑量"
                value={stats.totalTargetReputationVolume}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总实际口碑量"
                value={stats.totalActualReputationVolume}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="口碑量达成率"
                value={stats.reputationAchievementRate}
                suffix="%"
                valueStyle={{
                  color: stats.reputationAchievementRate >= 100 ? '#52c41a' : '#faad14',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总实际收入"
                value={stats.totalActualRevenue}
                precision={0}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={`${campus || '请选择神殿'}神殿教化司口碑招生目标与结果汇总表`}
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
          scroll={{ x: 1400 }}
          rowKey="key"
          size="small"
          rowClassName={(record) => {
            if (record.rowType === 'total') {
              return 'table-row-total'
            }
            return ''
          }}
        />
      </Card>

      <style>{`
        .table-row-total {
          background-color: #f0f0f0;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}

export default ReputationEnrollmentTable
