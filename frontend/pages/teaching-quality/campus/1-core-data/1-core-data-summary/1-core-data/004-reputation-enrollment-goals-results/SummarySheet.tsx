import React from 'react'
import CampusReputationEnrollmentGoalsResultsPage from '@/pages/teaching-quality/mgnt/campus-level/4-reputation-summary'
import CampusPersonalReputationEnrollmentPage from '@/pages/campus/personal-reputation-enrollment'
import CampusMonthlyPersonalReputationEnrollmentPage from '@/pages/campus/monthly-personal-reputation-enrollment'

const summaryTables = [
  {
    key: 'reputation-enrollment-goals-results',
    component: CampusReputationEnrollmentGoalsResultsPage,
    props: { hideCampusSelector: true },
  },
  {
    key: 'personal-reputation-enrollment',
    component: CampusPersonalReputationEnrollmentPage,
    props: { hideCampusSelector: true },
  },
  {
    key: 'monthly-personal-reputation-enrollment',
    component: CampusMonthlyPersonalReputationEnrollmentPage,
    props: { hideCampusSelector: true },
  },
]

const ReputationSummarySheet: React.FC = () => (
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

export default ReputationSummarySheet
