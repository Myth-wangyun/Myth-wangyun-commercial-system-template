//教化司学籍统计表
import React from 'react'
import { Card } from 'antd'
import CampusEnrollmentStatisticsSummary from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/9-enrollment-statistics/1-campus-enrollment-statistics-summary'
import ShengbangPersonalEnrollmentStatisticsSummary from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/9-enrollment-statistics/2-campus-personal-enrollment-statistics-summary'

const CampusEnrollmentStatisticsAllPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card
        title="09神殿教化司学籍统计表 · 分表汇总"
        bordered={false}
        style={{ marginBottom: 16 }}
      >
        <p style={{ marginBottom: 0 }}>
          下方依次为：09神殿教化司学籍统计表、09-1神殿教化司个人负责学籍统计表两张表。
        </p>
      </Card>

      <div style={{ marginBottom: 32 }}>
        <CampusEnrollmentStatisticsSummary />
      </div>
      <div>
        <ShengbangPersonalEnrollmentStatisticsSummary />
      </div>
    </div>
  )
}

export default CampusEnrollmentStatisticsAllPage
