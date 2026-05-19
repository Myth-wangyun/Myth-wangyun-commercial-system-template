/**
 * 神殿教化司新生维稳个人统计表组件
 */

import React from 'react'
import { Card, Table, Button, Space, Row, Col, Statistic } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type {
  NewStudentStabilityPersonalTableProps,
  NewStudentStabilityPersonalRecord,
} from '@/types/new-student-stability-personal'

const NewStudentStabilityPersonalTable: React.FC<NewStudentStabilityPersonalTableProps> = ({
  data,
  loading,
  onRefresh,
  onEdit,
  onDelete,
  onExport,
}) => {
  const handleEdit = (record: NewStudentStabilityPersonalRecord) => {
    onEdit(record)
  }

  const handleDelete = (record: NewStudentStabilityPersonalRecord) => {
    onDelete(record)
  }

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalTeachers: 0,
        totalHandoverCount: 0,
        totalReportedCount: 0,
        totalStableClassHoursCount: 0,
        totalUnstableClassHoursCount: 0,
        totalFullPaymentCount: 0,
        totalOutstandingFeesCount: 0,
        totalOutstandingFeesAmount: 0,
        totalRefundCount: 0,
        averageRefundRate: 0,
      }
    }

    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalTeachers: dataRows.length,
      totalHandoverCount: totalRow?.handoverCount || 0,
      totalReportedCount: totalRow?.reportedCount || 0,
      totalStableClassHoursCount: totalRow?.stableClassHoursCount || 0,
      totalUnstableClassHoursCount: totalRow?.unstableClassHoursCount || 0,
      totalFullPaymentCount: totalRow?.fullPaymentCount || 0,
      totalOutstandingFeesCount: totalRow?.outstandingFeesCount || 0,
      totalOutstandingFeesAmount: totalRow?.outstandingFeesAmount || 0,
      totalRefundCount: totalRow?.refundCount || 0,
      averageRefundRate: totalRow?.refundRate || 0,
    }
  }, [data])

  const columns: ColumnsType<NewStudentStabilityPersonalRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      fixed: 'left',
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
        }
        return value
      },
    },
    {
      title: '班主任姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 120,
      fixed: 'left',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value
      },
    },
    {
      title: '交接人数',
      dataIndex: 'handoverCount',
      key: 'handoverCount',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '报道人数',
      dataIndex: 'reportedCount',
      key: 'reportedCount',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '稳定过课时人数',
      dataIndex: 'stableClassHoursCount',
      key: 'stableClassHoursCount',
      width: 130,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '未过课时人数',
      dataIndex: 'unstableClassHoursCount',
      key: 'unstableClassHoursCount',
      width: 130,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '回全款人数',
      dataIndex: 'fullPaymentCount',
      key: 'fullPaymentCount',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '仍欠费人数',
      dataIndex: 'outstandingFeesCount',
      key: 'outstandingFeesCount',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '欠费总金额',
      dataIndex: 'outstandingFeesAmount',
      key: 'outstandingFeesAmount',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>¥{value.toLocaleString()}</span>
        }
        return value ? `¥${value.toLocaleString()}` : '¥0'
      },
    },
    {
      title: '退费人数',
      dataIndex: 'refundCount',
      key: 'refundCount',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '新生退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return `${value.toFixed(2)}%`
      },
    },
    {
      title: '退费学员情况说明',
      dataIndex: 'refundExplanation',
      key: 'refundExplanation',
      width: 200,
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value || '-'
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_: any, record: NewStudentStabilityPersonalRecord) => {
        if (record.rowType === 'total') {
          return null
        }
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              删除
            </Button>
          </Space>
        )
      },
    },
  ]

  return (
    <div>
      {/* 统计卡片 */}
      {data.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={4}>
              <Statistic
                title="总班主任数"
                value={stats.totalTeachers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总交接人数"
                value={stats.totalHandoverCount}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总报道人数"
                value={stats.totalReportedCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总稳定过课时人数"
                value={stats.totalStableClassHoursCount}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总仍欠费人数"
                value={stats.totalOutstandingFeesCount}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总欠费金额"
                value={stats.totalOutstandingFeesAmount}
                precision={0}
                prefix="¥"
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title="神殿教化司新生维稳个人统计表"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
              刷新
            </Button>
            <Button icon={<DownloadOutlined />} onClick={onExport} disabled={data.length === 0}>
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
          scroll={{ x: 1600 }}
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
          background-color: #fff7e6;
          font-weight: bold;
        }
      `}</style>
    </div>
  )
}

export default NewStudentStabilityPersonalTable
