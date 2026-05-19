import React, { useEffect } from 'react'
import { Card, Tabs } from 'antd'
import { SafetyOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import CampusNewStudentStabilityAllPage from './1-campus-new-stu-stability-summary'
import CampusNewStuArrearsDetailTable from './2-monthly-new-stu-stability-detail/1-campus-new-stu-arrears-detail'
import CampusMonthlyNewStuStabilityDetailTable from './2-monthly-new-stu-stability-detail/2-campus-monthly-new-stu-stability-detail'

const TeachingQualityNewStudentStabilityTabsPage: React.FC = () => {
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
          <SafetyOutlined style={{ marginRight: 8 }} />
          {currentCampus} · 新生维稳
        </h1>
      </Card>

      <Tabs
        defaultActiveKey="stability-summary"
        items={[
          {
            key: 'stability-summary',
            label: '教化司新生维稳统计表',
            children: <CampusNewStudentStabilityAllPage />,
          },
          {
            key: 'monthly-detail',
            label: '月新生维稳明细表',
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <CampusNewStuArrearsDetailTable />
                <CampusMonthlyNewStuStabilityDetailTable />
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}

export default TeachingQualityNewStudentStabilityTabsPage
