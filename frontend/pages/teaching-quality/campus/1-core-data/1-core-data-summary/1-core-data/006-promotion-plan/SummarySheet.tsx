import React from 'react'
import CampusPromotionPlanPage from '@/pages/teaching-quality/mgnt/campus-level/6-promotion-plan'
import CampusPersonalPromotionTargetPage from '@/pages/campus/personal-promotion-target'
import CampusMonthlyPersonalPromotionTargetPage from '@/pages/campus/monthly-personal-promotion-target'
import CampusMonthlyClassPromotionTargetPage from '@/pages/campus/monthly-class-promotion-target'

const summaryTables = [
  {
    key: 'promotion-plan',
    component: CampusPromotionPlanPage,
    props: { hideCampusSelector: true },
  },
  {
    key: 'personal-promotion',
    component: CampusPersonalPromotionTargetPage,
    props: { hideCampusSelector: true },
  },
  {
    key: 'monthly-personal-promotion',
    component: CampusMonthlyPersonalPromotionTargetPage,
    props: { hideCampusSelector: true },
  },
  {
    key: 'monthly-class-promotion',
    component: CampusMonthlyClassPromotionTargetPage,
    props: { hideCampusSelector: true },
  },
]

const PromotionSummarySheet: React.FC = () => (
  <>
    {summaryTables.map((table, index) => {
      const Component = table.component
      const props = table.props || {}
      return (
        <div
          key={table.key}
          className="campus-summary-table-wrapper"
          style={{
            marginBottom: index < summaryTables.length - 1 ? 32 : 0,
            order: index + 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Component {...props} />
        </div>
      )
    })}
  </>
)

export default PromotionSummarySheet
