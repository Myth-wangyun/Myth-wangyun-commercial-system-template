import React from 'react'
import CampusStudentMovementPage from '@/pages/teaching-quality/mgnt/campus-level/7-student-fluctuation'
import PersonalStudentFluctuationPage from '@/pages/campus/personal-student-fluctuation'
import MonthlyPersonalStudentFluctuationPage from '@/pages/campus/monthly-personal-student-fluctuation'

const summaryTables = [
  {
    key: 'student-movement',
    component: CampusStudentMovementPage,
    props: { hideCampusSelector: true },
  },
  {
    key: 'personal-student-fluctuation',
    component: PersonalStudentFluctuationPage,
    props: { hideCampusSelector: true },
  },
  {
    key: 'monthly-personal-student-fluctuation',
    component: MonthlyPersonalStudentFluctuationPage,
    props: { hideCampusSelector: true },
  },
]

const StudentFluctuationSummarySheet: React.FC = () => (
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

export default StudentFluctuationSummarySheet
