import React from 'react'
import { Card } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import CampusReputationEnrollmentGoalsResults from './1-campus-reputation-enrollment-goals-results'
import ShengbangPersonalReputationEnrollmentSummary from './2-campus-personal-reputation-enrollment-goals-results'
import ShengbangMonthlyPersonalReputationEnrollmentSummary from './3-campus-monthly-personal-reputation-enrollment-goals-results'

const ShengbangReputationEnrollmentAllPage: React.FC = () => {
  const { currentCampus } = useCampusStore()
  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`04${currentCampus || ''}教化司口碑招生目标与结果汇总表 · 分表汇总`}
        bordered={false}
        style={{ marginBottom: 16 }}
      >
        <p style={{ marginBottom: 0 }}>
          下方依次为：神殿口碑招生汇总、个人口碑招生汇总、月度个人口碑招生汇总三张表。
        </p>
      </Card>
      <CampusReputationEnrollmentGoalsResults />
      <ShengbangPersonalReputationEnrollmentSummary />
      <ShengbangMonthlyPersonalReputationEnrollmentSummary />
    </div>
  )
}

export default ShengbangReputationEnrollmentAllPage
