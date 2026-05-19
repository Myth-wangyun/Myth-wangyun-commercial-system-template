import React from 'react'
import { Card, Table, Space, Button } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType, TableProps } from 'antd/es/table'

interface DataTableProps<T> {
  columns: ColumnsType<T>
  data: T[]
  loading: boolean
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  onTableChange: NonNullable<TableProps<T>['onChange']>
  onEdit?: (record: T) => void
  onDelete?: (record: T) => void
  rowKey?: string | ((record: T) => string)
  scroll?: { x?: number; y?: number }
  size?: 'small' | 'middle' | 'large'
  showActions?: boolean
  actionWidth?: number
}

const DataTable = <T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  pagination,
  onTableChange,
  onEdit,
  onDelete,
  rowKey = 'id',
  scroll = { x: 1000 },
  size = 'small',
  showActions = true,
  actionWidth = 120,
}: DataTableProps<T>) => {
  const actionColumn = {
    title: '操作',
    key: 'action',
    width: actionWidth,
    fixed: 'right' as const,
    render: (_: unknown, record: T) => (
      <Space size="small">
        {onEdit && (
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>
            编辑
          </Button>
        )}
        {onDelete && (
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record)}
          >
            删除
          </Button>
        )}
      </Space>
    ),
  }

  const finalColumns = showActions ? [...columns, actionColumn] : columns

  return (
    <Card>
      <Table
        columns={finalColumns}
        dataSource={data}
        rowKey={rowKey}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
        }}
        onChange={onTableChange}
        scroll={scroll}
        size={size}
      />
    </Card>
  )
}

export default DataTable
