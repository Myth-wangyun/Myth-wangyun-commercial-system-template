import React, { Suspense, lazy, useMemo, useState } from 'react'
import { Card, Tabs, Typography, Collapse, Spin } from 'antd'
import { useCampusStore } from '@/stores/campusStore'

const { Title } = Typography
const Panel = Collapse.Panel

const ClassSummary = lazy(
  () => import('../1-core-data-summary/others/A-campus-backend-employment-summary/class-summary'),
)
const StarSummary = lazy(
  () => import('../1-core-data-summary/others/A-campus-backend-employment-summary/star-summary'),
)
const TeacherSummary = lazy(
  () => import('../1-core-data-summary/others/A-campus-backend-employment-summary/teacher-summary'),
)
const CampusClassEmploymentInfo = lazy(() => import('./campusClassEmploymentInfo'))

const renderLazy = (component: React.ReactNode) => (
  <Suspense fallback={<Spin style={{ margin: '1px 0' }} />}>{component}</Suspense>
)

const EmploymentStatsTab: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const [activePanels, setActivePanels] = useState<string[]>(['class'])

  const items = useMemo(
    () => [
      {
        key: 'class',
        header: `${currentCampus || '主神殿'}后端就业班级汇总表`,
        content: renderLazy(<ClassSummary />),
      },
      {
        key: 'star',
        header: `${currentCampus || '主神殿'}后端就业明星汇总表`,
        content: renderLazy(<StarSummary />),
      },
      {
        key: 'teacher',
        header: `${currentCampus || '主神殿'}后端教员就业汇总表`,
        content: renderLazy(<TeacherSummary />),
      },
    ],
    [currentCampus],
  )

  return (
    <Collapse
      accordion={false}
      activeKey={activePanels}
      onChange={(key) => setActivePanels(Array.isArray(key) ? key : [key])}
      style={{ background: '#fff' }}
    >
      {items.map((item) => (
        <Panel header={item.header} key={item.key}>
          {activePanels.includes(item.key) ? item.content : <Spin />}
        </Panel>
      ))}
    </Collapse>
  )
}

const EmploymentGoalsResultsTabs: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 16 }}>
          就业目标与结果汇总
        </Title>
        <Tabs
          destroyInactiveTabPane
          items={[
            {
              key: 'employment-stats',
              label: '就业统计',
              children: <EmploymentStatsTab />,
            },
            {
              key: 'class-employment-info',
              label: '班就业信息表',
              children: renderLazy(<CampusClassEmploymentInfo />),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default EmploymentGoalsResultsTabs
