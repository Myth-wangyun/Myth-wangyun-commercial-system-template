import React, { memo, useCallback, useMemo } from 'react'
import { Card, Row, Col, Statistic } from 'antd'

interface StatCard {
  title: string
  value: number | string
  suffix?: string
  prefix?: string
  precision?: number
  color?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

interface OptimizedStatsCardsProps {
  cards: StatCard[]
  columns?: number
  gutter?: number
  style?: React.CSSProperties
  className?: string
}

const OptimizedStatsCards: React.FC<OptimizedStatsCardsProps> = memo(
  ({ cards, columns = 4, gutter = 16, style, className }) => {
    const colSpan = useMemo(() => {
      return 24 / columns
    }, [columns])

    const renderCard = useCallback(
      (card: StatCard, index: number) => {
        return (
          <Col key={index} span={colSpan}>
            <Card>
              <Statistic
                title={card.title}
                value={card.value}
                suffix={card.suffix}
                prefix={card.prefix}
                precision={card.precision}
                valueStyle={{ color: card.color }}
              />
              {card.trend && (
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <span style={{ color: card.trend.isPositive ? '#52c41a' : '#ff4d4f' }}>
                    {card.trend.isPositive ? '+' : ''}
                    {card.trend.value}%
                  </span>
                  <span style={{ marginLeft: 8, color: '#999' }}>较上期</span>
                </div>
              )}
            </Card>
          </Col>
        )
      },
      [colSpan],
    )

    return (
      <Row gutter={gutter} style={style} className={className}>
        {cards.map(renderCard)}
      </Row>
    )
  },
)

OptimizedStatsCards.displayName = 'OptimizedStatsCards'

export default OptimizedStatsCards
