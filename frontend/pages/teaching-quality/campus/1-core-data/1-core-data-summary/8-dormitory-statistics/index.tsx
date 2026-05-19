import React from 'react'
import { Card } from 'antd'
import CampusDormitoryStatisticsSummary from './1-campus-dormitory-statistics-summary'
import ShengbangPersonalDormitoryManagementSummary from './2-campus-personal-dormitory-management-summary'
import ShengbangMonthlyPersonalDormitoryManagementSummary from './3-campus-monthly-personal-dormitory-management-summary'

const ShengbangDormitoryStatisticsAllPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card
        title="08主神殿教化司宿舍管理统计 · 分表汇总"
        bordered={false}
        style={{ marginBottom: 16 }}
      >
        <p style={{ marginBottom: 0 }}>
          下方依次为：现有宿舍统计表、个人宿舍管理统计表、每月个人宿舍管理统计表三张表。
        </p>
      </Card>
      <CampusDormitoryStatisticsSummary />
      <ShengbangPersonalDormitoryManagementSummary />
      <ShengbangMonthlyPersonalDormitoryManagementSummary />
    </div>
  )
}

export default ShengbangDormitoryStatisticsAllPage
