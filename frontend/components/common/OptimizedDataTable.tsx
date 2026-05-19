import React, { memo, useCallback, useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType, TableProps } from 'antd/es/table'

interface OptimizedDataTableProps<T> extends Omit<TableProps<T>, 'onChange'> {
  columns: ColumnsType<T>
  data: T[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
  }
  onChange?: NonNullable<TableProps<T>['onChange']>
  onEdit?: (record: T) => void
  onDelete?: (record: T) => void
  rowKey?: string | ((record: T) => string)
  scroll?: { x?: number; y?: number }
  size?: 'small' | 'middle' | 'large'
  showActions?: boolean
  actionWidth?: number
}

const OptimizedDataTable = <T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  pagination,
  onChange,
  onEdit,
  onDelete,
  rowKey = 'id',
  scroll = { x: 1000 },
  size = 'small',
  showActions = true,
  actionWidth = 120,
  ...restProps
}: OptimizedDataTableProps<T>) => {
  const actionColumn = useMemo(
    () => ({
      title: '操作',
      key: 'action',
      width: actionWidth,
      fixed: 'right' as const,
      render: (_: unknown, record: T) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {onEdit && <a onClick={() => onEdit(record)}>编辑</a>}
          {onDelete && (
            <a onClick={() => onDelete(record)} style={{ color: '#ff4d4f' }}>
              删除
            </a>
          )}
        </div>
      ),
    }),
    [onEdit, onDelete, actionWidth],
  )

  const finalColumns = useMemo(() => {
    return showActions ? [...columns, actionColumn] : columns
  }, [columns, actionColumn, showActions])

  const handleTableChange = useCallback(
    (...args: Parameters<NonNullable<TableProps<T>['onChange']>>) => {
      onChange?.(...args)
    },
    [onChange],
  )

  const tablePagination = useMemo(() => {
    if (!pagination) return false

    return {
      current: pagination.current,
      pageSize: pagination.pageSize,
      total: pagination.total,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number, range: [number, number]) =>
        `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
    }
  }, [pagination])

  return (
    <Table
      columns={finalColumns}
      dataSource={data}
      rowKey={rowKey}
      loading={loading}
      pagination={tablePagination}
      onChange={handleTableChange}
      scroll={scroll}
      size={size}
      {...restProps}
    />
  )
}

export default memo(OptimizedDataTable) as typeof OptimizedDataTable
