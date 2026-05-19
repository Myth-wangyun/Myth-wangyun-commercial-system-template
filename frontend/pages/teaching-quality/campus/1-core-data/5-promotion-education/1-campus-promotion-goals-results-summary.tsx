import React from 'react'
import { Card } from 'antd'
import CampusPromotionPlanSummary from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/6-promotion-plan/1-campus-promotion-plan-summary'
import CampusPersonalPromotionGoalsResults from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/6-promotion-plan/2-campus-personal-promotion-goals-results'
import CampusMonthlyPersonalPromotionGoalsResults from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/6-promotion-plan/3-campus-monthly-personal-promotion-goals-results'
import CampusMonthlyClassPromotionGoalsResults from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/6-promotion-plan/4-campus-monthly-class-promotion-goals-results'

const CampusPromotionGoalsResultsSummaryPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card
        title="06XX神殿教化司升学目标与结果汇总 · 分表汇总"
        bordered={false}
        style={{ marginBottom: 16 }}
      >
        <p style={{ marginBottom: 0 }}>
          下方依次为：神殿教化司升学计划、教化司个人升学目标与结果汇总表、教化司月度个人升学目标与结果汇总表、教化司月度班级升学目标与结果汇总表四张表。
        </p>
      </Card>

      <div style={{ marginBottom: 32 }}>
        <CampusPromotionPlanSummary />
      </div>
      <div style={{ marginBottom: 32 }}>
        <CampusPersonalPromotionGoalsResults />
      </div>
      <div style={{ marginBottom: 32 }}>
        <CampusMonthlyPersonalPromotionGoalsResults />
      </div>
      <div>
        <CampusMonthlyClassPromotionGoalsResults />
      </div>
    </div>
  )
}

export default CampusPromotionGoalsResultsSummaryPage
