/**
 * 神殿教化司月度个人升学目标与结果汇总表组件
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
  MonthlyPersonalPromotionTargetTableProps,
  MonthlyPersonalPromotionTargetRecord,
} from '@/types/monthly-personal-promotion-target'

const MonthlyPersonalPromotionTargetTable: React.FC<MonthlyPersonalPromotionTargetTableProps> = ({
  data,
  loading,
  onRefresh,
  onEdit,
  onDelete,
  onExport,
}) => {
  const handleEdit = (record: MonthlyPersonalPromotionTargetRecord) => {
    onEdit(record)
  }

  const handleDelete = (record: MonthlyPersonalPromotionTargetRecord) => {
    onDelete(record)
  }

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalMonths: 0,
        totalPersons: 0,
        totalClasses: 0,
        totalStudents: 0,
        totalEstimatedPromotionCount: 0,
        totalActualPromotionCount: 0,
        totalReceivables: 0,
        totalEstimatedPromotionIncome: 0,
        totalActualPromotionIncome: 0,
      }
    }

    const dataRows = data.filter((r) => r.rowType === 'data')
    const grandTotalRow = data.find((r) => r.rowType === 'grand-total')

    return {
      totalMonths: 12,
      totalPersons: dataRows.length / 12,
      totalClasses: grandTotalRow?.totalClasses || 0,
      totalStudents: grandTotalRow?.totalStudents || 0,
      totalEstimatedPromotionCount: grandTotalRow?.estimatedPromotionCount || 0,
      totalActualPromotionCount: grandTotalRow?.actualPromotionCount || 0,
      totalReceivables: grandTotalRow?.receivables || 0,
      totalEstimatedPromotionIncome: grandTotalRow?.estimatedPromotionIncome || 0,
      totalActualPromotionIncome: grandTotalRow?.actualPromotionIncome || 0,
    }
  }, [data])

  // 计算月份列的rowSpan
  const getMonthRowSpan = (record: MonthlyPersonalPromotionTargetRecord) => {
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

  const columns: ColumnsType<MonthlyPersonalPromotionTargetRecord> = [
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
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
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
      title: '升学班级总数',
      dataIndex: 'totalClasses',
      key: 'totalClasses',
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
      title: '在档总人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
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
      title: '预计升学总人数',
      dataIndex: 'estimatedPromotionCount',
      key: 'estimatedPromotionCount',
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
      title: '实际升学总人数',
      dataIndex: 'actualPromotionCount',
      key: 'actualPromotionCount',
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
      title: '预计升学率（人数）',
      dataIndex: 'estimatedPromotionRateByCount',
      key: 'estimatedPromotionRateByCount',
      width: 150,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return `${value.toFixed(2)}%`
      },
    },
    {
      title: '实际升学率（人数）',
      dataIndex: 'actualPromotionRateByCount',
      key: 'actualPromotionRateByCount',
      width: 150,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return `${value.toFixed(2)}%`
      },
    },
    {
      title: '应收',
      dataIndex: 'receivables',
      key: 'receivables',
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
      title: '预计升学收入',
      dataIndex: 'estimatedPromotionIncome',
      key: 'estimatedPromotionIncome',
      width: 140,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
          return <span style={{ fontWeight: 'bold' }}>¥{value.toLocaleString()}</span>
        }
        return value ? `¥${value.toLocaleString()}` : '¥0'
      },
    },
    {
      title: '实际升学收入',
      dataIndex: 'actualPromotionIncome',
      key: 'actualPromotionIncome',
      width: 140,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
          return <span style={{ fontWeight: 'bold' }}>¥{value.toLocaleString()}</span>
        }
        return value ? `¥${value.toLocaleString()}` : '¥0'
      },
    },
    {
      title: '预计升学率（金额）',
      dataIndex: 'estimatedPromotionRateByAmount',
      key: 'estimatedPromotionRateByAmount',
      width: 150,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'monthly-total' || record.rowType === 'grand-total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return `${value.toFixed(2)}%`
      },
    },
    {
      title: '实际升学率（金额）',
      dataIndex: 'actualPromotionRateByAmount',
      key: 'actualPromotionRateByAmount',
      width: 150,
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
      render: (_: any, record: MonthlyPersonalPromotionTargetRecord) => {
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
                title="总人数"
                value={stats.totalPersons}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总在档人数"
                value={stats.totalStudents}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总预计升学人数"
                value={stats.totalEstimatedPromotionCount}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总实际升学人数"
                value={stats.totalActualPromotionCount}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总实际升学收入"
                value={stats.totalActualPromotionIncome}
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
        title="神殿教化司月度个人升学目标与结果汇总表"
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
          scroll={{ x: 2000 }}
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

export default MonthlyPersonalPromotionTargetTable
