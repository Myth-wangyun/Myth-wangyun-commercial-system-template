/**
 * 神殿教化司月度班级升学目标与结果汇总表组件
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
  MonthlyClassPromotionTargetTableProps,
  MonthlyClassPromotionTargetRecord,
} from '@/types/monthly-class-promotion-target'

const MonthlyClassPromotionTargetTable: React.FC<MonthlyClassPromotionTargetTableProps> = ({
  data,
  loading,
  onRefresh,
  onEdit,
  onDelete,
  onExport,
}) => {
  const handleEdit = (record: MonthlyClassPromotionTargetRecord) => {
    onEdit(record)
  }

  const handleDelete = (record: MonthlyClassPromotionTargetRecord) => {
    onDelete(record)
  }

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
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
    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalClasses: dataRows.length,
      totalStudents: totalRow?.totalStudents || 0,
      totalEstimatedPromotionCount: totalRow?.estimatedPromotionCount || 0,
      totalActualPromotionCount: totalRow?.actualPromotionCount || 0,
      totalReceivables: totalRow?.receivables || 0,
      totalEstimatedPromotionIncome: totalRow?.estimatedPromotionIncome || 0,
      totalActualPromotionIncome: totalRow?.actualPromotionIncome || 0,
    }
  }, [data])

  const columns: ColumnsType<MonthlyClassPromotionTargetRecord> = [
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
      title: '班主任',
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
      title: '升学班级名称',
      dataIndex: 'className',
      key: 'className',
      width: 150,
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value
      },
    },
    {
      title: '升学周期',
      dataIndex: 'promotionPeriod',
      key: 'promotionPeriod',
      width: 120,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return ''
        }
        return value
      },
    },
    {
      title: '在档总人数',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
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
      title: '预计升学总人数',
      dataIndex: 'estimatedPromotionCount',
      key: 'estimatedPromotionCount',
      width: 140,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
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
        if (record.rowType === 'total') {
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
        if (record.rowType === 'total') {
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
        if (record.rowType === 'total') {
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
        if (record.rowType === 'total') {
          return ''
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
        if (record.rowType === 'total') {
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
        if (record.rowType === 'total') {
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
        if (record.rowType === 'total') {
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
        if (record.rowType === 'total') {
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
      render: (_: any, record: MonthlyClassPromotionTargetRecord) => {
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
                title="总班级数"
                value={stats.totalClasses}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总在档人数"
                value={stats.totalStudents}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总预计升学人数"
                value={stats.totalEstimatedPromotionCount}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总实际升学人数"
                value={stats.totalActualPromotionCount}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总预计升学收入"
                value={stats.totalEstimatedPromotionIncome}
                precision={0}
                prefix="¥"
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
        title="神殿教化司月度班级升学目标与结果汇总表"
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
          scroll={{ x: 2200 }}
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

export default MonthlyClassPromotionTargetTable
