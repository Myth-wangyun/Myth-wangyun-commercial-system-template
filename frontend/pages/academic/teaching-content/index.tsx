/**
 * 教学内容管理入口页面
 * 根据 URL 参数动态加载对应的子页面
 */
import React from 'react'
import { useSearchParams } from 'react-router-dom'

// 导入各个子页面组件
const PositionAnalysis = React.lazy(() => import('./010-position-analysis.tsx'))
const CoursewareWriting = React.lazy(() => import('./011-courseware-writing.tsx'))
const QuestionbankWriting = React.lazy(() => import('./012-questionbank-writing.tsx'))
const ReputationRegistration = React.lazy(() => import('./013-reputation-registration.tsx'))
const TeacherStaffingRatio = React.lazy(() => import('./013-teacher-staffing-ratio.tsx'))

const TeachingContentPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab') || '010'

  // 根据 tab 参数渲染对应组件
  const renderContent = () => {
    switch (tab) {
      case '010':
        return <PositionAnalysis />
      case '011':
        return <CoursewareWriting />
      case '012':
        return <QuestionbankWriting />
      case '013':
        return <ReputationRegistration />
      case 'staffing':
        return <TeacherStaffingRatio />
      default:
        return <PositionAnalysis />
    }
  }

  return <React.Suspense fallback={<div>加载中...</div>}>{renderContent()}</React.Suspense>
}

export default TeachingContentPage
