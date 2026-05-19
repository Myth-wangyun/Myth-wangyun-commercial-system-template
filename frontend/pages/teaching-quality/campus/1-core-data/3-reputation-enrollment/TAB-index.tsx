import React, { useEffect } from 'react'
import { Card, Tabs } from 'antd'
import { SoundOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import ReputationGoalsResultsAllPage from './1-reputation-goals-results'
import ReputationRegistrationDetailTable from './2-reputation-registration-detail'

const TeachingQualityReputationTabsPage: React.FC = () => {
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()

  useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      setCampus(campuses[0].name)
    }
  }, [currentCampus, campuses, setCampus])

  if (!currentCampus) {
    return null
  }

  return (
    <div
      style={{
        padding: 24,
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Card style={{ marginBottom: 24, backgroundColor: '#fff' }}>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <SoundOutlined style={{ marginRight: 8 }} />
          {currentCampus} · 口碑招生
        </h1>
      </Card>

      <Tabs
        defaultActiveKey="goals-results"
        items={[
          {
            key: 'goals-results',
            label: '口碑招生目标及结果汇总表',
            children: <ReputationGoalsResultsAllPage />,
          },
          {
            key: 'registration-detail',
            label: '口碑量上门报名登记明细',
            children: <ReputationRegistrationDetailTable />,
          },
        ]}
      />
    </div>
  )
}

export default TeachingQualityReputationTabsPage
