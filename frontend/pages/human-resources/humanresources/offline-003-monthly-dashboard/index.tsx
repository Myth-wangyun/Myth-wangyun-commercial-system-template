import React from 'react'

import MonthlyDashboardPage from '../hq-003-monthly-dashboard'

const OfflineMonthlyDashboard: React.FC = () => (
  <MonthlyDashboardPage
    scope="offline"
    businessLabel="线下事业部"
    pageTitle="003 线下事业部月度核心数据看板"
  />
)

export default OfflineMonthlyDashboard
