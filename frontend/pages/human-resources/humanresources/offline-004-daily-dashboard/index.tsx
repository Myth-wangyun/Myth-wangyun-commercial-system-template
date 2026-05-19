import React from 'react'

import DailyDashboardPage from '../hq-004-daily-dashboard'

const OfflineDailyDashboard: React.FC = () => (
  <DailyDashboardPage
    scope="offline"
    businessLabel="线下事业部"
    pageTitle="清美教育集团日度核心数据看板-线下事业部"
    showSalary={false}
    showInsurance={false}
  />
)

export default OfflineDailyDashboard
