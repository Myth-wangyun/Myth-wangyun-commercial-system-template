import React, { useState } from 'react'
import { Table, Button, Space, Tag, Popconfirm, Tooltip } from 'antd'
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { IStudentStability } from '../types'
import './DataTable.css'

interface DataTableProps {
  data: IStudentStability[]
  loading: boolean
  onEdit: (record: IStudentStability) => void
  onDelete: (id: string) => void
  onView: (record: IStudentStability) => void
}

interface StudentStabilitySummaryRow {
  key: 'summary'
  campus: string
  handoverCount: number
  enrollmentCount: number
  refundCount: number
  refundRate: number
}

type StudentStabilityTableRow = IStudentStability | StudentStabilitySummaryRow

const isSummaryRow = (record: StudentStabilityTableRow): record is StudentStabilitySummaryRow =>
  'key' in record

const DataTable: React.FC<DataTableProps> = ({ data, loading, onEdit, onDelete, onView }) => {
  const columns: ColumnsType<StudentStabilityTableRow> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      fixed: 'left',
      render: (_, __, index) => index + 1,
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      fixed: 'left',
      render: (campus) => <Tag color="blue">{campus}</Tag>,
    },
    {
      title: '交接人数',
      dataIndex: 'handoverCount',
      key: 'handoverCount',
      width: 120,
      sorter: (a, b) => a.handoverCount - b.handoverCount,
    },
    {
      title: '入学人数',
      dataIndex: 'enrollmentCount',
      key: 'enrollmentCount',
      width: 120,
      sorter: (a, b) => a.enrollmentCount - b.enrollmentCount,
    },
    {
      title: '退费人数',
      dataIndex: 'refundCount',
      key: 'refundCount',
      width: 120,
      render: (value) => <span style={{ color: value > 0 ? '#ff4d4f' : '#52c41a' }}>{value}</span>,
      sorter: (a, b) => a.refundCount - b.refundCount,
    },
    {
      title: '退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 120,
      render: (value) => (
        <span
          style={{
            color: value === 0 ? '#52c41a' : value <= 5 ? '#faad14' : '#ff4d4f',
          }}
        >
          {value.toFixed(2)}%
        </span>
      ),
      sorter: (a, b) => a.refundRate - b.refundRate,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        isSummaryRow(record) ? null : (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" icon={<EyeOutlined />} onClick={() => onView(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这条记录吗？"
              onConfirm={() => onDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
        )
      ),
    },
  ]

  // 计算合计行数据
  const getSummaryRow = (): StudentStabilitySummaryRow | null => {
    if (data.length === 0) return null

    const totalHandoverCount = data.reduce((sum, item) => sum + item.handoverCount, 0)
    const totalEnrollmentCount = data.reduce((sum, item) => sum + item.enrollmentCount, 0)
    const totalRefundCount = data.reduce((sum, item) => sum + item.refundCount, 0)
    const avgRefundRate =
      totalEnrollmentCount > 0 ? (totalRefundCount / totalEnrollmentCount) * 100 : 0

    return {
      key: 'summary',
      campus: '合计',
      handoverCount: totalHandoverCount,
      enrollmentCount: totalEnrollmentCount,
      refundCount: totalRefundCount,
      refundRate: avgRefundRate,
    }
  }

  const summaryRow = getSummaryRow()
  const dataWithSummary: StudentStabilityTableRow[] = summaryRow ? [...data, summaryRow] : data

  return (
    <Table
      columns={columns}
      dataSource={dataWithSummary}
      loading={loading}
      rowKey={(record) => (isSummaryRow(record) ? record.key : record.id)}
      scroll={{ x: 800 }}
      pagination={{
        total: data.length,
        defaultPageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
      }}
      size="small"
      rowClassName={(record) => (isSummaryRow(record) ? 'summary-row' : '')}
    />
  )
}

export default DataTable
