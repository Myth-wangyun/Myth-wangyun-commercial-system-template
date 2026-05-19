import React from 'react'
import CampusEnrollmentStatisticsPage from '@/pages/teaching-quality/mgnt/campus-level/9-enrollment-statistics'
import CampusPersonalEnrollmentStatisticsPage from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/9-enrollment-statistics/2-campus-personal-enrollment-statistics-summary'

const summaryTables = [
  {
    key: 'campus-enrollment-statistics',
    component: CampusEnrollmentStatisticsPage,
    props: { hideCampusSelector: true },
  },
  {
    key: 'personal-enrollment-statistics',
    component: CampusPersonalEnrollmentStatisticsPage,
    props: { hideCampusSelector: true },
  },
]

const StudentStatusSummarySheet: React.FC = () => (
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

export default StudentStatusSummarySheet
