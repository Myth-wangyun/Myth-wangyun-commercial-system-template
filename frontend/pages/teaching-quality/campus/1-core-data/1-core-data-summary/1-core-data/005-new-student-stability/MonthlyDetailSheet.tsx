import React, { useState } from 'react'
import { Card, Select } from 'antd'
import OutstandingFeesDetailPage from '@/pages/campus/outstanding-fees-detail'
import CampusMonthlyNewStudentStabilityDetailTable from '@/pages/campus/monthly-new-student-stability-detail'

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1} 月`,
}))

const NewStudentStabilityMonthlyDetailSheet: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)

  const detailTables = [
    {
      key: 'outstanding-fees-detail-month',
      component: OutstandingFeesDetailPage,
      props: { hideCampusSelector: true, selectedMonth },
    },
    {
      key: 'monthly-new-student-stability-detail',
      component: CampusMonthlyNewStudentStabilityDetailTable,
      props: { selectedMonth },
    },
  ]

  return (
    <>
      <Card
        style={{
          marginBottom: 24,
          backgroundColor: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 600 }}>选择月份：</span>
          <Select
            value={selectedMonth}
            onChange={setSelectedMonth}
            style={{ width: 160 }}
            options={monthOptions}
          />
        </div>
      </Card>

      {detailTables.map((table, index) => {
        const Component = table.component
        const props = table.props || {}
        return (
          <div
            key={table.key}
            className="campus-detail-table-wrapper"
            style={{
              marginBottom: index === 0 ? 32 : 0,
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
}

export default NewStudentStabilityMonthlyDetailSheet
