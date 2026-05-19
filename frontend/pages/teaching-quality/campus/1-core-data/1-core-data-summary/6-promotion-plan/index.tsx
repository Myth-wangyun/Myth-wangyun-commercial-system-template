import React from 'react'
import { Card } from 'antd'
import CampusPromotionPlanSummary from './1-campus-promotion-plan-summary'
import ShengbangPersonalPromotionGoalsResults from './2-campus-personal-promotion-goals-results'
import ShengbangMonthlyPersonalPromotionGoalsResults from './3-campus-monthly-personal-promotion-goals-results'
import ShengbangMonthlyClassPromotionGoalsResults from './4-campus-monthly-class-promotion-goals-results'

const ShengbangPromotionPlanAllPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card title="06XX神殿教化司升学计划 · 分表汇总" bordered={false} style={{ marginBottom: 16 }}>
        <p style={{ marginBottom: 0 }}>
          下方依次为：神殿升学计划汇总、个人升学目标与结果汇总、月度个人升学目标与结果汇总、月度班级升学目标与结果汇总四张表。
        </p>
      </Card>
      <CampusPromotionPlanSummary />
      <ShengbangPersonalPromotionGoalsResults />
      <ShengbangMonthlyPersonalPromotionGoalsResults />
      <ShengbangMonthlyClassPromotionGoalsResults />
    </div>
  )
}

export default ShengbangPromotionPlanAllPage
