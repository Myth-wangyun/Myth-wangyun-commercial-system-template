import React from 'react'
import CampusDormitoryStatisticsPage from '@/pages/teaching-quality/campus/1-core-data/7-dormitory-statistics/TAB-index'
import PersonalDormitoryManagementPage from '@/pages/campus/personal-dormitory-management'

const summaryTables = [
  {
    key: 'campus-dormitory-statistics',
    component: CampusDormitoryStatisticsPage,
    props: { hideCampusSelector: true },
  },
  {
    key: 'personal-dormitory-management',
    component: PersonalDormitoryManagementPage,
    props: { hideCampusSelector: true },
  },
  {
    key: 'monthly-personal-dormitory-management',
    component: undefined as any,
    props: {},
  },
]

const DormitorySummarySheet: React.FC = () => (
  <>
    {summaryTables
      .filter((t) => t.component)
      .map((table, index) => {
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

export default DormitorySummarySheet
