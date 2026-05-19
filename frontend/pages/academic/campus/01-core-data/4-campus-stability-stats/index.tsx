import React, { Suspense, lazy, useState } from 'react'
import { Card, Spin, Typography, Tabs } from 'antd'
import MonthlyStabilityDetailReadOnly from './components/MonthlyStabilityDetailReadOnly'

const { Title } = Typography

const MonthlySummary = lazy(
  () =>
    import(
      '@/pages/academic/campus/01-core-data/1-core-data-summary/others/C-stu-stability/1-student-stability-monthly'
    ),
)
const PersonalSummary = lazy(
  () =>
    import(
      '@/pages/academic/campus/01-core-data/1-core-data-summary/others/C-stu-stability/2-student-stability-personal'
    ),
)
const PersonalMonthlySummary = lazy(
  () =>
    import(
      '@/pages/academic/campus/01-core-data/1-core-data-summary/others/C-stu-stability/3-student-stability-personal-monthly'
    ),
)

const renderLazy = (node: React.ReactNode) => (
  <Suspense fallback={<Spin style={{ margin: '20px 0' }} />}>{node}</Suspense>
)

const CampusStabilityStatsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('monthly')

  const tabItems = [
    {
      key: 'monthly',
      label: '月度汇总表',
      children: renderLazy(<MonthlySummary />),
    },
    {
      key: 'personal',
      label: '个人汇总表',
      children: renderLazy(<PersonalSummary />),
    },
    {
      key: 'personal-monthly',
      label: '个人按月汇总表',
      children: renderLazy(<PersonalMonthlySummary />),
    },
    {
      key: 'stability-detail',
      label: '月新生维稳明细表',
      children: <MonthlyStabilityDetailReadOnly />,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 16 }}>
          新生维稳统计
        </Title>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
        />
      </Card>
    </div>
  )
}

export default CampusStabilityStatsPage
