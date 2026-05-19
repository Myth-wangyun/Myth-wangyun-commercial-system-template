// 教员管理主入口页面
import React, { useState } from 'react'
import { Tabs, Card } from 'antd'
import TeacherKPI from './kpi'
import TeacherDailyWork from './daily-work'
import TeacherFunctionAnalysis from './function-analysis'
import StudentInterviewRecord from './student-interview'
import TeachingActivityPlan from './teaching-activity-plan'
import StandardizationCheck from '../campus/05-manage-data/24-academic-staff-standard-check/standardization-check'
import MeetingRecord from './meeting-record'
import FacultyRatio from './faculty-ratio'
import ManagerEvaluationPage from './manager-evaluation'
import StaffFunctionAnalysisPage from './staff-function-analysis'
import EmploymentSummariesPage from './employment-summaries'
import EmploymentTrackingPage from './employment-tracking'
import StudentStabilityTrackingPage from './student-stability-tracking'
import StaffPerformanceSummaryPage from './staff-performance-summary'
import StaffMonthlyStatsPage from './staff-monthly-stats'
import ProjectScoresHorizontalPage from './project-scores-horizontal'
import EmploymentStarsPage from './employment-stars'

const TeacherManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('kpi')

  const tabItems = [
    {
      key: 'kpi',
      label: '教员KPI管理',
      children: <TeacherKPI />,
    },
    {
      key: 'daily-work',
      label: '教员日工单',
      children: <TeacherDailyWork />,
    },
    {
      key: 'function-analysis',
      label: '教员功能分析',
      children: <TeacherFunctionAnalysis />,
    },
    {
      key: 'manager-evaluation',
      label: '经理功能评价表',
      children: <ManagerEvaluationPage />,
    },
    {
      key: 'staff-function',
      label: '员工功能分析表',
      children: <StaffFunctionAnalysisPage />,
    },
    {
      key: 'employment-summaries',
      label: '后端就业汇总',
      children: <EmploymentSummariesPage />,
    },
    {
      key: 'employment-tracking',
      label: '就业跟踪台账',
      children: <EmploymentTrackingPage />,
    },
    {
      key: 'stability-tracking',
      label: '新生维稳台账',
      children: <StudentStabilityTrackingPage />,
    },
    {
      key: 'staff-performance',
      label: '员工业绩汇总',
      children: <StaffPerformanceSummaryPage />,
    },
    {
      key: 'staff-monthly',
      label: '员工逐月统计',
      children: <StaffMonthlyStatsPage />,
    },
    {
      key: 'project-scores-horizontal',
      label: '项目成绩横向表',
      children: <ProjectScoresHorizontalPage />,
    },
    {
      key: 'employment-stars',
      label: '就业明星汇总',
      children: <EmploymentStarsPage />,
    },
    {
      key: 'student-interview',
      label: '学员访谈记录',
      children: <StudentInterviewRecord />,
    },
    {
      key: 'teaching-activity',
      label: '教学活动计划',
      children: <TeachingActivityPlan />,
    },
    {
      key: 'standardization',
      label: '标准化检查',
      children: <StandardizationCheck />,
    },
    {
      key: 'meeting-record',
      label: '会议记录',
      children: <MeetingRecord />,
    },
    {
      key: 'faculty-ratio',
      label: '师资配比表',
      children: <FacultyRatio />,
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          type="card"
          size="large"
          items={tabItems}
        />
      </Card>
    </div>
  )
}

export default TeacherManagement
