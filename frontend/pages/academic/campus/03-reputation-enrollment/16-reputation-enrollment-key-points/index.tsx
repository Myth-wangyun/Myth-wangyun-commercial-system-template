import React from 'react'
import { Tabs } from 'antd'
import type { TabsProps } from 'antd'

import ReputationEnrollmentKeyPointsPage from './summary'
import ReputationDetailsPage from './detail'

const tabItems: TabsProps['items'] = [
  {
    key: 'summary',
    label: '口碑关键点结果汇总',
    children: <ReputationEnrollmentKeyPointsPage />,
  },
  {
    key: 'detail',
    label: '口碑关键点结果明细',
    children: <ReputationDetailsPage />,
  },
]

const ReputationEnrollmentKeyPointsTabs: React.FC = () => (
  <Tabs defaultActiveKey="summary" destroyInactiveTabPane={false} items={tabItems} type="card" />
)

export default ReputationEnrollmentKeyPointsTabs
