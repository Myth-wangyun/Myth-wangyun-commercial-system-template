import React from 'react'
import { Card } from 'antd'
import CampusNewStuStabilitySummary from './1-campus-new-stu-stability-summary'
import ShengbangNewStuArrearsDetailTable from './2-campus-new-stu-arrears-detail'
import ShengbangNewStuStabilityPersonalSummary from './3-campus-new-stu-stability-personal-summary'
import ShengbangNewStuStabilityMonthlyPersonalSummary from './4-campus-new-stu-stability-monthly-personal-summary'

const ShengbangNewStuStabilityAllPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card
        title="05主神殿教化司新生当月维稳统计表 · 分表汇总"
        bordered={false}
        style={{ marginBottom: 16 }}
      >
        <p style={{ marginBottom: 0 }}>
          下方依次为：神殿新生当月维稳统计、新生仍欠费明细、新生维稳个人统计、新生维稳月度个人统计四张表。
        </p>
      </Card>
      <CampusNewStuStabilitySummary />
      <ShengbangNewStuArrearsDetailTable />
      <ShengbangNewStuStabilityPersonalSummary />
      <ShengbangNewStuStabilityMonthlyPersonalSummary />
    </div>
  )
}

export default ShengbangNewStuStabilityAllPage
