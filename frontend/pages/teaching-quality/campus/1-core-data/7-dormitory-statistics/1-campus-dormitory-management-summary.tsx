import React, { Suspense } from 'react'

// 懒加载三个大表，同时渲染（不再使用标签切换）
const CampusDormitoryStatisticsSummary = React.lazy(() => import('@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/8-dormitory-statistics/1-campus-dormitory-statistics-summary'))
const ShengbangPersonalDormitoryManagementSummary = React.lazy(() => import('@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/8-dormitory-statistics/2-campus-personal-dormitory-management-summary'))
const ShengbangMonthlyPersonalDormitoryManagementSummary = React.lazy(() => import('@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/8-dormitory-statistics/3-campus-monthly-personal-dormitory-management-summary'))

const CampusDormitoryManagementAllPage: React.FC = () => {
  return (
    <div style={{ padding: 0 }}>
      <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
        <CampusDormitoryStatisticsSummary />
      </Suspense>

      <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
        <ShengbangPersonalDormitoryManagementSummary />
      </Suspense>

      <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
        <ShengbangMonthlyPersonalDormitoryManagementSummary />
      </Suspense>
    </div>
  )
}

export default CampusDormitoryManagementAllPage
