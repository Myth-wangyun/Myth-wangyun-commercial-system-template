import React from 'react'
import { Card } from 'antd'
import CampusStuMovementSummary from './1-campus-stu-movement-summary'
import ShengbangPersonalStuMovementSummary from './2-campus-personal-stu-movement-summary'
import ShengbangMonthlyPersonalStuMovementSummary from './3-campus-monthly-personal-stu-movement-summary'

const ShengbangStuMovementAllPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card
        title="07主神殿教化司学员异动表 · 分表汇总"
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

export default ShengbangStuMovementAllPage
