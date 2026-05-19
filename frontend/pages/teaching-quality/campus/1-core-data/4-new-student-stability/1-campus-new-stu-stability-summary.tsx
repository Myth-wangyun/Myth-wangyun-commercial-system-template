import React from 'react'
import { Card } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import CampusNewStuStabilitySummary from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/5-new-stu-stability/1-campus-new-stu-stability-summary'
import ShengbangNewStuArrearsDetailTable from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/5-new-stu-stability/2-campus-new-stu-arrears-detail'
import ShengbangNewStuStabilityPersonalSummary from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/5-new-stu-stability/3-campus-new-stu-stability-personal-summary'
import ShengbangNewStuStabilityMonthlyPersonalSummary from '@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/5-new-stu-stability/4-campus-new-stu-stability-monthly-personal-summary'

const CampusNewStudentStabilityAllPage: React.FC = () => {
  const { currentCampus } = useCampusStore()

  const tableTitle = currentCampus
    ? `${currentCampus}教化司新生当月维稳统计表 · 分表汇总`
    : '教化司新生当月维稳统计表 · 分表汇总'

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={tableTitle}
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

export default CampusNewStudentStabilityAllPage
