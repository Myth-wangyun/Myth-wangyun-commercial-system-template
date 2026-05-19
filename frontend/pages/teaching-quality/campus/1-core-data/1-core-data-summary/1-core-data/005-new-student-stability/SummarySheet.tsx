import React from 'react'
import CampusNewStudentStabilityPage from '@/pages/teaching-quality/mgnt/campus-level/5-new-student-stability'
import OutstandingFeesDetailPage from '@/pages/campus/outstanding-fees-detail'
import CampusNewStudentStabilityPersonalPage from '@/pages/campus/new-student-stability-personal'
import CampusNewStudentStabilityMonthlyPersonalPage from '@/pages/campus/new-student-stability-monthly-personal'

const summaryTables = [
  {
    key: 'new-student-stability',
    component: CampusNewStudentStabilityPage,
    props: { hideCampusSelector: true },
  },
  {
    key: 'outstanding-fees-detail',
    component: OutstandingFeesDetailPage,
    props: { hideCampusSelector: true },
  },
  {
    key: 'new-student-stability-personal',
    component: CampusNewStudentStabilityPersonalPage,
    props: { hideCampusSelector: true },
  },
  {
    key: 'new-student-stability-monthly-personal',
    component: CampusNewStudentStabilityMonthlyPersonalPage,
    props: { hideCampusSelector: true },
  },
]

const NewStudentStabilitySummarySheet: React.FC = () => (
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

export default NewStudentStabilitySummarySheet
