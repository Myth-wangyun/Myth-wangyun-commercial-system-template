import React, { useMemo } from 'react'
import { Table } from 'antd'
import { useVirtualScroll } from '../../hooks/useVirtualScroll'
import type { ColumnsType } from 'antd/es/table'

interface VirtualTableProps<T> {
  columns: ColumnsType<T>
  data: T[]
  loading?: boolean
  height?: number
  itemHeight?: number
  overscan?: number
  rowKey?: string | ((record: T) => string)
  onScroll?: (scrollTop: number) => void
  style?: React.CSSProperties
  className?: string
}

const VirtualTable = <T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  height = 400,
  itemHeight = 54,
  overscan = 5,
  rowKey = 'id',
  onScroll,
  style,
  className,
}: VirtualTableProps<T>) => {
  const virtualScroll = useVirtualScroll(data.length, {
    itemHeight,
    containerHeight: height,
    overscan,
  })

  const visibleData = useMemo(() => {
    return data.slice(virtualScroll.startIndex, virtualScroll.endIndex + 1)
  }, [data, virtualScroll.startIndex, virtualScroll.endIndex])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop
    onScroll?.(scrollTop)
  }

  return (
    <div
      style={{
        height,
        overflow: 'auto',
        ...style,
      }}
      className={className}
      onScroll={handleScroll}
    >
      <div style={{ height: virtualScroll.totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${virtualScroll.offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <Table
            columns={columns}
            dataSource={visibleData}
            loading={loading}
            rowKey={rowKey}
            pagination={false}
            scroll={{ y: height }}
            size="small"
          />
        </div>
      </div>
    </div>
  )
}

export default VirtualTable
