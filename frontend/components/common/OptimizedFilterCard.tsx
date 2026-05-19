import React, { memo, useCallback } from 'react'
import { Card, Row, Col, Button, Space } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

interface FilterItem {
  label: string
  component: React.ReactNode
  span?: number
}

interface OptimizedFilterCardProps {
  title?: string
  filters: FilterItem[]
  onReset?: () => void
  showReset?: boolean
  resetText?: string
  style?: React.CSSProperties
  className?: string
}

const OptimizedFilterCard: React.FC<OptimizedFilterCardProps> = memo(
  ({
    title = '筛选条件',
    filters,
    onReset,
    showReset = true,
    resetText = '重置',
    style,
    className,
  }) => {
    const handleReset = useCallback(() => {
      onReset?.()
    }, [onReset])

    const renderFilter = useCallback((filter: FilterItem, index: number) => {
      return (
        <Col key={index} span={filter.span || 6}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>{filter.label}</div>
            {filter.component}
          </div>
        </Col>
      )
    }, [])

    return (
      <Card title={title} style={style} className={className}>
        <Row gutter={16}>
          {filters.map(renderFilter)}
          {showReset && (
            <Col span={24}>
              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    {resetText}
                  </Button>
                </Space>
              </div>
            </Col>
          )}
        </Row>
      </Card>
    )
  },
)

OptimizedFilterCard.displayName = 'OptimizedFilterCard'

export default OptimizedFilterCard
