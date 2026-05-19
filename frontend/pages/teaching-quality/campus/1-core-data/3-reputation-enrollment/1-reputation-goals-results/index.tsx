import React from 'react'
import { Card } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import CampusReputationEnrollmentGoalsResults from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/4-reputation-enrollment/1-campus-reputation-enrollment-goals-results'
import PersonalReputationEnrollmentSummary from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/4-reputation-enrollment/2-campus-personal-reputation-enrollment-goals-results'
import MonthlyPersonalReputationEnrollmentSummary from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/4-reputation-enrollment/3-campus-monthly-personal-reputation-enrollment-goals-results'

const ReputationGoalsResultsAllPage: React.FC = () => {
  const { currentCampus } = useCampusStore()
  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`04${currentCampus || ''}教化司口碑招生目标与结果汇总表 · 分表汇总`}
        bordered={false}
        style={{ marginBottom: 16 }}
      >
        <p style={{ marginBottom: 0 }}>
          下方依次为：口碑招生目标与结果汇总表、口碑招生个人目标与结果汇总表、口碑招生月度个人目标与结果汇总表三张表。
        </p>
      </Card>

      <div style={{ marginBottom: 32 }}>
        <CampusReputationEnrollmentGoalsResults />
      </div>

      <div style={{ marginBottom: 32 }}>
        <PersonalReputationEnrollmentSummary />
      </div>

      <div>
        <MonthlyPersonalReputationEnrollmentSummary />
      </div>
    </div>
  )
}

export default ReputationGoalsResultsAllPage
