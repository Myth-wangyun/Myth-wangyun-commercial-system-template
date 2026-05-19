import React from 'react'
import { Pagination } from 'antd'

interface PaginationProps {
  current: number
  pageSize: number
  total: number
  onChange: (page: number, pageSize: number) => void
  showSizeChanger?: boolean
  showQuickJumper?: boolean
  showTotal?: boolean
  pageSizeOptions?: string[]
  size?: 'small' | 'default'
  simple?: boolean
  style?: React.CSSProperties
  className?: string
}

const CustomPagination: React.FC<PaginationProps> = ({
  current,
  pageSize,
  total,
  onChange,
  showSizeChanger = true,
  showQuickJumper = true,
  showTotal = true,
  pageSizeOptions = ['10', '20', '50', '100'],
  size = 'default',
  simple = false,
  style,
  className,
}) => {
  const handleChange = (page: number, size: number) => {
    onChange(page, size)
  }

  const handleShowTotal = (total: number, range: [number, number]) => {
    return `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginTop: 16,
        ...style,
      }}
      className={className}
    >
      <Pagination
        current={current}
        pageSize={pageSize}
        total={total}
        onChange={handleChange}
        onShowSizeChange={handleChange}
        showSizeChanger={showSizeChanger}
        showQuickJumper={showQuickJumper}
        showTotal={showTotal ? handleShowTotal : undefined}
        pageSizeOptions={pageSizeOptions}
        size={size}
        simple={simple}
      />
    </div>
  )
}

export default CustomPagination
