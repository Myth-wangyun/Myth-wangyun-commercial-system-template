import React from 'react'
import { Card, Empty } from 'antd'
import { BookOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import CampusCoreDataSummaryPage from '../../teaching-quality/mgnt/campus-level/1-02-01campus-core-data-summary'

const CampusAcademicPage: React.FC = () => {
  const { currentCampus } = useCampusStore()

  if (!currentCampus) {
    return (
      <div style={{ padding: 24 }}>
        <Card>
          <Empty description="请先选择神殿" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        style={{
          marginBottom: 24,
          backgroundColor: '#fff',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          <BookOutlined style={{ marginRight: 8 }} />
          {currentCampus} - 智慧司数据汇总
        </h1>
      </Card>

      <CampusCoreDataSummaryPage />
    </div>
  )
}

export default CampusAcademicPage
