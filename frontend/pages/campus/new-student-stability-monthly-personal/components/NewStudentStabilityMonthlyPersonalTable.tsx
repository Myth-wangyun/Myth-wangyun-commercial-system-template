/**
 * 神殿教化司新生维稳月度个人统计表组件
 */

import React from 'react'
import { Card, Table, Button, Space, Row, Col, Statistic } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import type {
  NewStudentStabilityMonthlyPersonalTableProps,
  NewStudentStabilityMonthlyPersonalRecord,
} from '@/types/new-student-stability-monthly-personal'

const NewStudentStabilityMonthlyPersonalTable: React.FC<
  NewStudentStabilityMonthlyPersonalTableProps
> = ({ data, loading, onRefresh, onEdit, onDelete, onExport }) => {
  const handleEdit = (record: NewStudentStabilityMonthlyPersonalRecord) => {
    onEdit(record)
  }

  const handleDelete = (record: NewStudentStabilityMonthlyPersonalRecord) => {
    onDelete(record)
  }

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalMonths: 0,
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
    const grandTotalRow = data.find((r) => r.rowType === 'grand-total')

    return {
      totalMonths: 12,
      totalTeachers: dataRows.length / 12,
      totalHandoverCount: grandTotalRow?.handoverCount || 0,
      totalReportedCount: grandTotalRow?.reportedCount || 0,
      totalStableClassHoursCount: grandTotalRow?.stableClassHoursCount || 0,
      totalUnstableClassHoursCount: grandTotalRow?.unstableClassHoursCount || 0,
      totalFullPaymentCount: grandTotalRow?.fullPaymentCount || 0,
      totalOutstandingFeesCount: grandTotalRow?.outstandingFeesCount || 0,
      totalOutstandingFeesAmount: grandTotalRow?.outstandingFeesAmount || 0,
      totalRefundCount: grandTotalRow?.refundCount || 0,
      averageRefundRate: grandTotalRow?.refundRate || 0,
    }
  }, [data])

  // 计算月份列的rowSpan
  const getMonthRowSpan = (record: NewStudentStabilityMonthlyPersonalRecord) => {
    if (record.rowType === 'grand-total') {
      return 0
    }

    const currentIndex = data.indexOf(record)
    if (currentIndex > 0) {
      const prevRecord = data[currentIndex - 1]
      if (prevRecord.month === record.month && prevRecord.rowType !== 'monthly-total') {
        return 0
      }
    }

    let rowCount = 0
    for (let i = currentIndex; i < data.length; i++) {
      if (data[i].rowType === 'monthly-total') {
        rowCount++
        break
      }
      if (data[i].month !== record.month && i !== currentIndex) {
        break
      }
      rowCount++
    }
    return rowCount
  }

  const columns: ColumnsType<NewStudentStabilityMonthlyPersonalRecord> = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
      width: 80,
      fixed: 'left',
      align: 'center',
      render: (value, record) => {
        const rowSpan = getMonthRowSpan(record)

        if (record.rowType === 'grand-total') {
          return {
            children: <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>,
            props: { rowSpan: 1 },
          }
        }

        return {
          children: value,
          props: {
            rowSpan: rowSpan,
          },
        }
      },
    },
    {
      title: '班主任姓名',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 120,
      fixed: 'left',
      render: (value, record) => {
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>{value}</span>
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
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
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
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
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
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
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
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
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
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
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
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
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
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
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
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
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
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
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
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
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
      align: 'center',
      render: (_: any, record: NewStudentStabilityMonthlyPersonalRecord) => {
        // 合计行不显示操作按钮
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
          return ''
        }

        // 数据行显示操作按钮
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
                title="总月数"
                value={stats.totalMonths}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总班主任数"
                value={stats.totalTeachers}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总交接人数"
                value={stats.totalHandoverCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总报道人数"
                value={stats.totalReportedCount}
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
        title="神殿教化司新生维稳月度个人统计表"
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
          scroll={{ x: 1800, y: 600 }}
          rowKey="key"
          size="small"
          rowClassName={(record) => {
            if (record.rowType === 'monthly-total') {
              return 'table-row-monthly-total'
            }
            if (record.rowType === 'grand-total') {
              return 'table-row-grand-total'
            }
            return ''
          }}
        />
      </Card>

      <style>{`
        .table-row-monthly-total {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .table-row-grand-total {
          background-color: #fff7e6;
          font-weight: bold;
        }
        .ant-table-cell-fix-right {
          background: #fff !important;
        }
        .table-row-monthly-total .ant-table-cell-fix-right {
          background-color: #f0f0f0 !important;
        }
        .table-row-grand-total .ant-table-cell-fix-right {
          background-color: #fff7e6 !important;
        }
      `}</style>
    </div>
  )
}

export default NewStudentStabilityMonthlyPersonalTable
