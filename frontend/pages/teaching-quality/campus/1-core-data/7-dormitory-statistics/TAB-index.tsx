import React, { useEffect, Suspense } from 'react'
import { Card, Tabs } from 'antd'
import { HomeOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
// Lazy-load heavy tab panes to avoid mounting everything at once
const CampusDormitoryManagementAllPage = React.lazy(() => import('./1-campus-dormitory-management-summary'))
const DormitoryRentPaymentInfoTable = React.lazy(() => import('./2-campus-dormitory-rent-payment-info'))
const CampusMaleDormitoryDetailPage = React.lazy(() => import('./3-campus-male-dormitory-detail'))
const CampusFemaleDormitoryDetailPage = React.lazy(() => import('./4-campus-female-dormitory-detail'))

const CampusDormitoryStatisticsTabsPage: React.FC = () => {
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
          <HomeOutlined style={{ marginRight: 8 }} />
          {currentCampus} · 宿舍管理
        </h1>
      </Card>

      <Tabs
        defaultActiveKey="dormitory-management"
        destroyInactiveTabPane
        animated={false}
        items={[
          {
            key: 'dormitory-management',
            label: '宿舍管理统计表',
            children: (
              <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
                <CampusDormitoryManagementAllPage />
              </Suspense>
            ),
          },
          {
            key: 'dormitory-rent-payment',
            label: '宿舍租赁及缴费信息',
            children: (
              <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
                <DormitoryRentPaymentInfoTable />
              </Suspense>
            ),
          },
          {
            key: 'male-dormitory-detail',
            label: '男宿住宿明细',
            children: (
              <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
                <CampusMaleDormitoryDetailPage />
              </Suspense>
            ),
          },
          {
            key: 'female-dormitory-detail',
            label: '女宿住宿明细',
            children: (
              <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
                <CampusFemaleDormitoryDetailPage />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  )
}

export default CampusDormitoryStatisticsTabsPage
