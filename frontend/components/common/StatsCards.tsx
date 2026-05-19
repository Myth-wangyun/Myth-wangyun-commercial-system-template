import React from 'react'
import { Row, Col, Card, Statistic } from 'antd'

interface StatCard {
  title: string
  value: number | string
  prefix?: React.ReactNode
  suffix?: string
  valueStyle?: React.CSSProperties
  formatter?: (value: number | string) => string
}

interface StatsCardsProps {
  stats: StatCard[]
  loading?: boolean
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading = false }) => {
  if (!stats || stats.length === 0) {
    return null
  }

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {stats.map((stat, index) => (
        <Col xs={24} sm={12} md={6} key={index}>
          <Card loading={loading}>
            <Statistic
              title={stat.title}
              value={stat.value}
              prefix={stat.prefix}
              suffix={stat.suffix}
              valueStyle={stat.valueStyle}
              formatter={stat.formatter}
            />
          </Card>
        </Col>
      ))}
    </Row>
  )
}

export default StatsCards
