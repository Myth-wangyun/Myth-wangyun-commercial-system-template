/**
 * 神殿教化司个人统计学员异动表组件
 */

import React from 'react'
import { Card, Table, Button, Space, Row, Col, Statistic } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type {
  PersonalStudentFluctuationTableProps,
  PersonalStudentFluctuationRecord,
} from '@/types/personal-student-fluctuation'

const PersonalStudentFluctuationTable: React.FC<PersonalStudentFluctuationTableProps> = ({
  data,
  loading,
  onRefresh,
  onEdit,
  onDelete,
  onExport,
}) => {
  const handleEdit = (record: PersonalStudentFluctuationRecord) => {
    onEdit(record)
  }

  const handleDelete = (record: PersonalStudentFluctuationRecord) => {
    onDelete(record)
  }

  // 计算统计数据
  const stats = React.useMemo(() => {
    if (data.length === 0) {
      return {
        totalTeachers: 0,
        totalCumulativeStudentCount: 0,
        totalRefundCount: 0,
        averageRefundRate: 0,
        totalFluctuationCount: 0,
        averageFluctuationRate: 0,
      }
    }

    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalTeachers: dataRows.length,
      totalCumulativeStudentCount: totalRow?.cumulativeStudentCount || 0,
      totalRefundCount: totalRow?.totalRefundCount || 0,
      averageRefundRate: totalRow?.refundRate || 0,
      totalFluctuationCount: totalRow?.totalFluctuationCount || 0,
      averageFluctuationRate: totalRow?.fluctuationRate || 0,
    }
  }, [data])

  const columns: ColumnsType<PersonalStudentFluctuationRecord> = [
    {
      title: '序号',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 80,
      fixed: 'left',
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>合计/平均</span>
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
        if (record.rowType === 'total') {
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
        if (record.rowType === 'total') {
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
        if (record.rowType === 'total') {
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
        if (record.rowType === 'total') {
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
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value.toFixed(2)}%</span>
        }
        return `${value.toFixed(2)}%`
      },
    },
    {
      title: '休学总人数(累计)',
      dataIndex: 'totalSuspensionCount',
      key: 'totalSuspensionCount',
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
      title: '长期请假总人数(累计)',
      dataIndex: 'totalLongTermLeaveCount',
      key: 'totalLongTermLeaveCount',
      width: 160,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '长期不上课总人数(累计)',
      dataIndex: 'totalLongTermAbsenteeCount',
      key: 'totalLongTermAbsenteeCount',
      width: 170,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '寒暑假学生总数(累计)',
      dataIndex: 'winterSummerBreakCount',
      key: 'winterSummerBreakCount',
      width: 160,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '其他情况总人数(累计)',
      dataIndex: 'otherSituationsCount',
      key: 'otherSituationsCount',
      width: 160,
      align: 'center',
      render: (value, record) => {
        if (record.rowType === 'total') {
          return <span style={{ fontWeight: 'bold' }}>{value}</span>
        }
        return value || 0
      },
    },
    {
      title: '异动总人数(累计)',
      dataIndex: 'totalFluctuationCount',
      key: 'totalFluctuationCount',
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
      title: '异动率',
      dataIndex: 'fluctuationRate',
      key: 'fluctuationRate',
      width: 100,
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
      render: (_: any, record: PersonalStudentFluctuationRecord) => {
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
            <Col span={6}>
              <Statistic
                title="总班主任数"
                value={stats.totalTeachers}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总累计带生人数"
                value={stats.totalCumulativeStudentCount}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总退费人数"
                value={stats.totalRefundCount}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="平均退费率"
                value={stats.averageRefundRate}
                precision={2}
                suffix="%"
                valueStyle={{ color: stats.averageRefundRate > 5 ? '#cf1322' : '#52c41a' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* 数据表格 */}
      <Card
        title="神殿教化司个人统计学员异动表"
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

export default PersonalStudentFluctuationTable
