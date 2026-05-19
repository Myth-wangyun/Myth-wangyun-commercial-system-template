import React, { useEffect } from 'react'
import { Card, Tabs } from 'antd'
import { RiseOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import CampusPromotionGoalsResultsSummaryPage from './1-campus-promotion-goals-results-summary'
import CampusClassPromotionDetailPage from './2-classPromotionDetail'

const CampusPromotionEducationTabsPage: React.FC = () => {
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
          <RiseOutlined style={{ marginRight: 8 }} />
          {currentCampus} · 升学
        </h1>
      </Card>

      <Tabs
        defaultActiveKey="promotion-summary"
        items={[
          {
            key: 'promotion-summary',
            label: '神殿教化司升学目标与结果汇总表',
            children: <CampusPromotionGoalsResultsSummaryPage />,
          },
          {
            key: 'class-promotion-detail',
            label: '班升学明细表',
            children: <CampusClassPromotionDetailPage />,
          },
        ]}
      />
    </div>
  )
}

export default CampusPromotionEducationTabsPage
