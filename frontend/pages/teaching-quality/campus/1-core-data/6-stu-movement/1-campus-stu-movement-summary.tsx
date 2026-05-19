import React from 'react'
import { Card } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import CampusStuMovementSummary from '../1-core-data-summary/7-stu-movement/1-campus-stu-movement-summary'
import ShengbangPersonalStuMovementSummary from '../1-core-data-summary/7-stu-movement/2-campus-personal-stu-movement-summary'
import ShengbangMonthlyPersonalStuMovementSummary from '../1-core-data-summary/7-stu-movement/3-campus-monthly-personal-stu-movement-summary'

const CampusStuMovementAllPage: React.FC = () => {
  const { currentCampus } = useCampusStore()

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`07${currentCampus ?? ''}教化司学员异动表 · 分表汇总`}
        bordered={false}
        style={{ marginBottom: 16 }}
      >
        <p style={{ marginBottom: 0 }}>
          下方依次为：神殿学员异动表、个人统计学员异动表、月度个人统计学员异动表三张表。
        </p>
      </Card>
      <CampusStuMovementSummary />
      <ShengbangPersonalStuMovementSummary />
      <ShengbangMonthlyPersonalStuMovementSummary />
    </div>
  )
}

export default CampusStuMovementAllPage
