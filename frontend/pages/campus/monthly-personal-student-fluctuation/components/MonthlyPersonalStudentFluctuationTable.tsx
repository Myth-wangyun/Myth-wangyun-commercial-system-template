/**
 * 神殿教化司月度个人统计学员异动表组件
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
  UserOutlined,
} from '@ant-design/icons'
import type {
  MonthlyPersonalStudentFluctuationTableProps,
  MonthlyPersonalStudentFluctuationRecord,
} from '@/types/monthly-personal-student-fluctuation'

const MonthlyPersonalStudentFluctuationTable: React.FC<
  MonthlyPersonalStudentFluctuationTableProps
> = ({ data, loading, onRefresh, onEdit, onDelete, onExport }) => {
  const handleEdit = (record: MonthlyPersonalStudentFluctuationRecord) => {
    onEdit(record)
  }

  const handleDelete = (record: MonthlyPersonalStudentFluctuationRecord) => {
    onDelete(record)
  }

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalMonths: 0,
        totalTeachers: 0,
        totalCumulativeStudentCount: 0,
        totalRefundCount: 0,
        averageRefundRate: 0,
        totalFluctuationCount: 0,
        averageFluctuationRate: 0,
      }
    }

    const dataRows = data.filter((r) => r.rowType === 'data')
    const grandTotalRow = data.find((r) => r.rowType === 'grand-total')

    return {
      totalMonths: 12,
      totalTeachers: dataRows.length / 12,
      totalCumulativeStudentCount: grandTotalRow?.cumulativeStudentCount || 0,
      totalRefundCount: grandTotalRow?.totalRefundCount || 0,
      averageRefundRate: grandTotalRow?.refundRate || 0,
      totalFluctuationCount: grandTotalRow?.totalFluctuationCount || 0,
      averageFluctuationRate: grandTotalRow?.fluctuationRate || 0,
    }
  }, [data])

  // 计算月份列的rowSpan
  const getMonthRowSpan = (record: MonthlyPersonalStudentFluctuationRecord) => {
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

  const columns: ColumnsType<MonthlyPersonalStudentFluctuationRecord> = [
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
            children: <span style={{ color: 'red', fontWeight: 'bold' }}>合计/平均</span>,
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
      title: '累计带生人数',
      dataIndex: 'cumulativeStudentCount',
      key: 'cumulativeStudentCount',
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
      title: '新生退费人数',
      dataIndex: 'newStudentRefundCount',
      key: 'newStudentRefundCount',
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
      title: '老生退费人数',
      dataIndex: 'oldStudentRefundCount',
      key: 'oldStudentRefundCount',
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
      title: '退费总人数',
      dataIndex: 'totalRefundCount',
      key: 'totalRefundCount',
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
      title: '退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return `${value.toFixed(2)}%`
      },
    },
    {
      title: '休学总人数',
      dataIndex: 'totalSuspensionCount',
      key: 'totalSuspensionCount',
      width: 140,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '长期请假总人数',
      dataIndex: 'totalLongTermLeaveCount',
      key: 'totalLongTermLeaveCount',
      width: 160,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '长期不上课总人数',
      dataIndex: 'totalLongTermAbsenteeCount',
      key: 'totalLongTermAbsenteeCount',
      width: 170,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '寒暑假学生总数',
      dataIndex: 'winterSummerBreakCount',
      key: 'winterSummerBreakCount',
      width: 160,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '其他情况总人数',
      dataIndex: 'otherSituationsCount',
      key: 'otherSituationsCount',
      width: 160,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '异动总人数',
      dataIndex: 'totalFluctuationCount',
      key: 'totalFluctuationCount',
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
      title: '异动率',
      dataIndex: 'fluctuationRate',
      key: 'fluctuationRate',
      width: 100,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return `${value.toFixed(2)}%`
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      align: 'center',
      render: (_: any, record: MonthlyPersonalStudentFluctuationRecord) => {
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
            <Col span={6}>
              <Statistic
                title="总月数"
                value={stats.totalMonths}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总班主任数"
                value={stats.totalTeachers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总累计带生人数"
                value={stats.totalCumulativeStudentCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均退费率"
                value={stats.averageRefundRate}
                precision={2}
                suffix="%"
                valueStyle={{ color: stats.averageRefundRate > 5 ? '#cf1322' : '#3f8600' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title="神殿教化司月度个人统计学员异动表"
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
          scroll={{ x: 2100 }}
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
      `}</style>
    </div>
  )
}

export default MonthlyPersonalStudentFluctuationTable
