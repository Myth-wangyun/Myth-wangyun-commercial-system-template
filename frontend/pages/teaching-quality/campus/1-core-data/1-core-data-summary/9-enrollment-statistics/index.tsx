import React from 'react'
import { Card } from 'antd'
import CampusEnrollmentStatisticsSummary from './1-campus-enrollment-statistics-summary'
import ShengbangPersonalEnrollmentStatisticsSummary from './2-campus-personal-enrollment-statistics-summary'

const ShengbangEnrollmentStatisticsAllPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card
        title="09主神殿教化司学籍统计 · 分表汇总"
        bordered={false}
        style={{ marginBottom: 16 }}
      >
        <p style={{ marginBottom: 0 }}>下方依次为：神殿学籍统计表、个人负责学籍统计表两张表。</p>
      </Card>
      <CampusEnrollmentStatisticsSummary />
      <ShengbangPersonalEnrollmentStatisticsSummary />
    </div>
  )
}

export default ShengbangEnrollmentStatisticsAllPage
