/**
 * 神殿教化司口碑招生目标与结果汇总表组件
 */

import React from 'react'
import { App, Card, Table, Button, Space, Tooltip, Statistic, Row, Col } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined, DownloadOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import type {
  CampusReputationEnrollmentGoalsResultsTableProps,
  CampusReputationEnrollmentGoalsResultsRecord,
} from '@/types/campus-reputation-enrollment-goals-results'
import { campusReputationEnrollmentGoalsResultsService } from '@/services/campusReputationEnrollmentGoalsResults'

const CampusReputationEnrollmentGoalsResultsTable: React.FC<
  CampusReputationEnrollmentGoalsResultsTableProps
> = ({ campus, data, loading, onRefresh, onExport, onEdit, onAdd }) => {
  const { message } = App.useApp()
  const handleExport = async () => {
    if (!campus) {
      message.warning('请先选择神殿')
      return
    }

    try {
      const blob =
        await campusReputationEnrollmentGoalsResultsService.exportCampusReputationEnrollmentGoalsResultsData(
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

  const columns: ColumnsType<CampusReputationEnrollmentGoalsResultsRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      align: 'center',
      render: (value, record, index) => {
        // 合计行显示"合计"
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
      width: 100,
      align: 'center',
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
          dataIndex: 'targetReputationVolume',
          key: 'targetReputationVolume',
          width: 120,
          align: 'center',
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value || 0
          },
        },
        {
          title: '实际口碑量',
          dataIndex: 'actualReputationVolume',
          key: 'actualReputationVolume',
          width: 120,
          align: 'center',
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
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
          dataIndex: 'targetWalkInVolume',
          key: 'targetWalkInVolume',
          width: 120,
          align: 'center',
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value || 0
          },
        },
        {
          title: '实际上门量',
          dataIndex: 'actualWalkInVolume',
          key: 'actualWalkInVolume',
          width: 120,
          align: 'center',
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
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
          width: 100,
          align: 'center',
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
            }
            return value || 0
          },
        },
        {
          title: '实际人数',
          dataIndex: 'actualEnrollmentCount',
          key: 'actualEnrollmentCount',
          width: 100,
          align: 'center',
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>{value}</span>
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
          align: 'center',
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>¥{value?.toLocaleString()}</span>
            }
            return value ? `¥${value.toLocaleString()}` : '¥0'
          },
        },
        {
          title: '实际收入',
          dataIndex: 'actualRevenue',
          key: 'actualRevenue',
          width: 120,
          align: 'center',
          render: (value, record, index) => {
            // 合计行显示总和
            if (index === data.length - 1) {
              return <span style={{ fontWeight: 'bold' }}>¥{value?.toLocaleString()}</span>
            }
            return value ? `¥${value.toLocaleString()}` : '¥0'
          },
        },
      ],
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      fixed: 'right',
      align: 'center',
      render: (_, record, index) => {
        // 合计行不显示操作按钮
        if (index === data.length - 1) {
          return ''
        }
        return (
          <Space size="small">
            <Tooltip title="编辑">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => onEdit(record)}
                size="small"
              />
            </Tooltip>
          </Space>
        )
      },
    },
  ]

  // 计算汇总数据
  const summaryData = data.length > 0 ? data[0] : null
  const monthlyData = data.filter((item) => item.month > 0)
  const totalTargetReputationVolume = monthlyData.reduce(
    (sum, item) => sum + item.targetReputationVolume,
    0,
  )
  const totalActualReputationVolume = monthlyData.reduce(
    (sum, item) => sum + item.actualReputationVolume,
    0,
  )
  const totalTargetWalkInVolume = monthlyData.reduce(
    (sum, item) => sum + item.targetWalkInVolume,
    0,
  )
  const totalActualWalkInVolume = monthlyData.reduce(
    (sum, item) => sum + item.actualWalkInVolume,
    0,
  )
  const totalTargetEnrollmentCount = monthlyData.reduce(
    (sum, item) => sum + item.targetEnrollmentCount,
    0,
  )
  const totalActualEnrollmentCount = monthlyData.reduce(
    (sum, item) => sum + item.actualEnrollmentCount,
    0,
  )
  const totalTargetRevenue = monthlyData.reduce((sum, item) => sum + item.targetRevenue, 0)
  const totalActualRevenue = monthlyData.reduce((sum, item) => sum + item.actualRevenue, 0)

  const reputationCompletionRate =
    totalTargetReputationVolume > 0
      ? (totalActualReputationVolume / totalTargetReputationVolume) * 100
      : 0
  const walkInCompletionRate =
    totalTargetWalkInVolume > 0 ? (totalActualWalkInVolume / totalTargetWalkInVolume) * 100 : 0
  const enrollmentCompletionRate =
    totalTargetEnrollmentCount > 0
      ? (totalActualEnrollmentCount / totalTargetEnrollmentCount) * 100
      : 0
  const revenueCompletionRate =
    totalTargetRevenue > 0 ? (totalActualRevenue / totalTargetRevenue) * 100 : 0

  return (
    <div>
      {/* 关键统计指标 */}
      {summaryData && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="总目标口碑量" value={totalTargetReputationVolume} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic title="总实际口碑量" value={totalActualReputationVolume} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic
                title="口碑完成率"
                value={reputationCompletionRate}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    reputationCompletionRate >= 80
                      ? 'green'
                      : reputationCompletionRate >= 60
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic title="总目标收入" value={totalTargetRevenue} precision={0} prefix="¥" />
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={6}>
              <Statistic title="总实际上门量" value={totalActualWalkInVolume} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic title="总实际招生人数" value={totalActualEnrollmentCount} suffix="人" />
            </Col>
            <Col span={6}>
              <Statistic
                title="招生完成率"
                value={enrollmentCompletionRate}
                precision={1}
                suffix="%"
                valueStyle={{
                  color:
                    enrollmentCompletionRate >= 80
                      ? 'green'
                      : enrollmentCompletionRate >= 60
                        ? 'orange'
                        : 'red',
                }}
              />
            </Col>
            <Col span={6}>
              <Statistic title="总实际收入" value={totalActualRevenue} precision={0} prefix="¥" />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
              📢 {campus || '请选择神殿'}教化司口碑招生目标与结果汇总表
            </span>
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={onAdd} disabled={!campus}>
                新增
              </Button>
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
          </div>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          bordered
          scroll={{ x: 'max-content', y: 600 }}
          rowKey="key"
          size="small"
          style={{
            fontSize: '12px',
          }}
          rowClassName={(record, index) =>
            index === data.length - 1
              ? 'table-row-total'
              : index % 2 === 0
                ? 'table-row-light'
                : 'table-row-dark'
          }
        />

        <style>{`
          .table-row-light {
            background-color: #fafafa;
          }
          .table-row-dark {
            background-color: #ffffff;
          }
          .table-row-total {
            background-color: #e6f7ff !important;
            font-weight: bold;
          }
          .table-row-light:hover,
          .table-row-dark:hover {
            background-color: #e6f7ff !important;
          }
        `}</style>
      </Card>
    </div>
  )
}

export default CampusReputationEnrollmentGoalsResultsTable
