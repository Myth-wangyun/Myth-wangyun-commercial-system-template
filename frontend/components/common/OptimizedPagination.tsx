import React, { memo, useCallback, useMemo } from 'react'
import { Pagination } from 'antd'

interface OptimizedPaginationProps {
  current?: number
  defaultCurrent?: number
  pageSize?: number
  defaultPageSize?: number
  total?: number
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: (total: number, range: [number, number]) => React.ReactNode
  pageSizeOptions?: string[]
  size?: 'default' | 'small'
  simple?: boolean
  disabled?: boolean
  onChange?: (page: number, pageSize: number) => void
  onShowSizeChange?: (current: number, size: number) => void
  style?: React.CSSProperties
  className?: string
}

const OptimizedPagination: React.FC<OptimizedPaginationProps> = memo(
  ({
    current,
    defaultCurrent = 1,
    pageSize = 20,
    defaultPageSize = 20,
    total = 0,
    showSizeChanger = true,
    showQuickJumper = true,
    showTotal,
    pageSizeOptions = ['10', '20', '50', '100'],
    size = 'default',
    simple = false,
    disabled = false,
    onChange,
    onShowSizeChange,
    style,
    className,
  }) => {
    const handleChange = useCallback(
      (page: number, pageSize: number) => {
        onChange?.(page, pageSize)
      },
      [onChange],
    )

    const handleShowSizeChange = useCallback(
      (current: number, size: number) => {
        onShowSizeChange?.(current, size)
      },
      [onShowSizeChange],
    )

    const paginationProps = useMemo(
      () => ({
        current,
        defaultCurrent,
        pageSize,
        defaultPageSize,
        total,
        showSizeChanger,
        showQuickJumper,
        showTotal,
        pageSizeOptions,
        size,
        simple,
        disabled,
        onChange: handleChange,
        onShowSizeChange: handleShowSizeChange,
        style,
        className,
      }),
      [
        current,
        defaultCurrent,
        pageSize,
        defaultPageSize,
        total,
        showSizeChanger,
        showQuickJumper,
        showTotal,
        pageSizeOptions,
        size,
        simple,
        disabled,
        handleChange,
        handleShowSizeChange,
        style,
        className,
      ],
    )

    return <Pagination {...paginationProps} />
  },
)

OptimizedPagination.displayName = 'OptimizedPagination'

export default OptimizedPagination
