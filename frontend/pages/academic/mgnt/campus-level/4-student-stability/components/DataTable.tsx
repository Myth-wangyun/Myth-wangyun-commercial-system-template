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

const DataTable: React.FC<DataTableProps> = ({ data, loading, onEdit, onDelete, onView }) => {
  const columns: ColumnsType<IStudentStability> = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      fixed: 'left',
      render: (_, record, index) => {
        if (record.isTotal || record.key === 'summary') {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
        }
        return index + 1
      },
    },
    {
      title: '神殿',
      dataIndex: 'campus',
      key: 'campus',
      width: 100,
      fixed: 'left',
      render: (campus, record) => {
        if (record.isTotal || record.key === 'summary') {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>合计</span>
        }
        return <Tag color="blue">{campus}</Tag>
      },
    },
    {
      title: '交接人数',
      dataIndex: 'handoverCount',
      key: 'handoverCount',
      width: 120,
      sorter: (a, b) => a.handoverCount - b.handoverCount,
      render: (value, record) => {
        if (record.isTotal || record.key === 'summary') {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>{value || 0}</span>
        }
        return value || 0
      },
    },
    {
      title: '入学人数',
      dataIndex: 'enrollmentCount',
      key: 'enrollmentCount',
      width: 120,
      sorter: (a, b) => a.enrollmentCount - b.enrollmentCount,
      render: (value, record) => {
        if (record.isTotal || record.key === 'summary') {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>{value || 0}</span>
        }
        return value || 0
      },
    },
    {
      title: '退费人数',
      dataIndex: 'refundCount',
      key: 'refundCount',
      width: 120,
      render: (value, record) => {
        if (record.isTotal || record.key === 'summary') {
          return <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>{value || 0}</span>
        }
        return <span style={{ color: value > 0 ? '#ff4d4f' : '#52c41a' }}>{value || 0}</span>
      },
      sorter: (a, b) => a.refundCount - b.refundCount,
    },
    {
      title: '退费率',
      dataIndex: 'refundRate',
      key: 'refundRate',
      width: 120,
      render: (value, record) => {
        // 合计行特殊处理
        if (record.isTotal || record.key === 'summary') {
          if (record.enrollmentCount === 0) {
            return <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>#DIV/0!</span>
          }
          const calculatedRate = (record.refundCount / record.enrollmentCount) * 100
          return (
            <span
              style={{
                color:
                  calculatedRate === 0 ? '#52c41a' : calculatedRate <= 5 ? '#faad14' : '#ff4d4f',
                fontWeight: 'bold',
              }}
            >
              {calculatedRate.toFixed(2)}%
            </span>
          )
        }

        // 处理除零错误和无效值
        if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
          // 普通行：如果入学人数为0，显示 #DIV/0!
          if (record.enrollmentCount === 0) {
            return <span style={{ color: '#ff4d4f' }}>#DIV/0!</span>
          }
          // 重新计算退费率
          const calculatedRate =
            record.enrollmentCount > 0 ? (record.refundCount / record.enrollmentCount) * 100 : 0
          return (
            <span
              style={{
                color:
                  calculatedRate === 0 ? '#52c41a' : calculatedRate <= 5 ? '#faad14' : '#ff4d4f',
              }}
            >
              {calculatedRate.toFixed(2)}%
            </span>
          )
        }
        return (
          <span
            style={{
              color: value === 0 ? '#52c41a' : value <= 5 ? '#faad14' : '#ff4d4f',
            }}
          >
            {value.toFixed(2)}%
          </span>
        )
      },
      sorter: (a, b) => {
        const rateA = typeof a.refundRate === 'number' && !isNaN(a.refundRate) ? a.refundRate : 0
        const rateB = typeof b.refundRate === 'number' && !isNaN(b.refundRate) ? b.refundRate : 0
        return rateA - rateB
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        // 合计行不显示操作按钮
        if (record.isTotal || record.key === 'summary') {
          return ''
        }
        return (
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
      },
    },
  ]

  // 计算合计行数据
  const getSummaryRow = () => {
    if (data.length === 0) return null

    const totalHandoverCount = data.reduce((sum, item) => sum + (item.handoverCount || 0), 0)
    const totalEnrollmentCount = data.reduce((sum, item) => sum + (item.enrollmentCount || 0), 0)
    const totalRefundCount = data.reduce((sum, item) => sum + (item.refundCount || 0), 0)
    const avgRefundRate =
      totalEnrollmentCount > 0 ? (totalRefundCount / totalEnrollmentCount) * 100 : 0

    return {
      id: 'summary',
      key: 'summary',
      campus: '合计' as any,
      handoverCount: totalHandoverCount,
      enrollmentCount: totalEnrollmentCount,
      refundCount: totalRefundCount,
      refundRate: isNaN(avgRefundRate) || !isFinite(avgRefundRate) ? 0 : avgRefundRate,
      createdAt: '',
      updatedAt: '',
      isTotal: true,
    }
  }

  const summaryRow = getSummaryRow()
  const dataWithSummary = summaryRow ? [...data, summaryRow] : data

  return (
    <Table
      columns={columns}
      dataSource={dataWithSummary}
      loading={loading}
      rowKey={(record) => record.key || record.id}
      scroll={{ x: 800 }}
      pagination={{
        total: data.length,
        defaultPageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
      }}
      size="small"
      rowClassName={(record) => (record.isTotal || record.key === 'summary' ? 'summary-row' : '')}
    />
  )
}

export default DataTable
