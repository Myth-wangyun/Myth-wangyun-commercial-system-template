import React, { Suspense, lazy, useMemo, useState } from 'react'
import { Card, Tabs, Typography, Collapse, Spin } from 'antd'
import { useCampusStore } from '@/stores/campusStore'

const { Title } = Typography
const Panel = Collapse.Panel

const MonthlyGoals = lazy(
  () =>
    import(
      '@/pages/academic/campus/01-core-data/1-core-data-summary/others/B-campus-reputaion-stats/1monthly-goals'
    ),
)
const PersonalGoals = lazy(
  () =>
    import(
      '@/pages/academic/campus/01-core-data/1-core-data-summary/others/B-campus-reputaion-stats/2personal-goals'
    ),
)
const MonthlyPersonal = lazy(
  () =>
    import(
      '@/pages/academic/campus/01-core-data/1-core-data-summary/others/B-campus-reputaion-stats/3monthly-personal'
    ),
)
const ReputationRegistration = lazy(
  () =>
    import(
      '@/pages/academic/campus/01-core-data/3-campus-reputation-goals-results/reputation-registration'
    ),
)

const renderLazy = (node: React.ReactNode) => (
  <Suspense fallback={<Spin style={{ margin: '24px 0' }} />}>{node}</Suspense>
)

const ReputationStatsTab: React.FC = () => {
  const { currentCampus, getAllCampuses } = useCampusStore()
  const activeCampus = currentCampus || getAllCampuses()[0]?.name || '主神殿'
  const [activePanels, setActivePanels] = useState<string[]>(['monthly'])

  const panels = useMemo(
    () => [
      {
        key: 'monthly',
        title: `${activeCampus}智慧司口碑招生目标与结果汇总表`,
        content: renderLazy(<MonthlyGoals />),
      },
      {
        key: 'personal',
        title: `${activeCampus}智慧司口碑招生个人目标与结果汇总表`,
        content: renderLazy(<PersonalGoals />),
      },
      {
        key: 'personal-monthly',
        title: `${activeCampus}智慧司口碑招生月度个人目标与结果汇总表`,
        content: renderLazy(<MonthlyPersonal />),
      },
    ],
    [activeCampus],
  )

  return (
    <Collapse
      activeKey={activePanels}
      onChange={(key) => setActivePanels(Array.isArray(key) ? key : [key])}
      style={{ background: '#fff' }}
    >
      {panels.map((panel) => (
        <Panel header={panel.title} key={panel.key}>
          {activePanels.includes(panel.key) ? panel.content : <Spin />}
        </Panel>
      ))}
    </Collapse>
  )
}

const CampusReputationGoalsResultsPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 16 }}>
          口碑招生目标与结果汇总表
        </Title>
        <Tabs
          destroyInactiveTabPane
          items={[
            {
              key: 'reputation-stats',
              label: '口碑统计',
              children: <ReputationStatsTab />,
            },
            {
              key: 'reputation-registration',
              label: '口碑报名明细',
              children: renderLazy(<ReputationRegistration />),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default CampusReputationGoalsResultsPage
