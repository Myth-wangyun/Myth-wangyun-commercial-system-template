import React from 'react'
import { Typography, Tabs } from 'antd'
import LazySection from '@/pages/academic/mgnt/LazySection'

const { Title } = Typography

// 懒加载各子页面
const P1 = React.lazy(() => import('./1-core-data-summary'))
const P2 = React.lazy(() => import('./2-employment-summary'))
// 注意：3 和 4 是同级文件，使用相对路径 './'
const P3 = React.lazy(() => import('./3-enrollment-summary'))
const P4 = React.lazy(() => import('./4-student-stability'))
const P5 = React.lazy(() => import('./5-teacher-staffing-ratio'))
const P6 = React.lazy(() => import('./6-onboarding-offboarding'))
const P7 = React.lazy(() => import('./7-training-plan-performance'))
const P8 = React.lazy(() => import('./8-staff-function-analysis'))

// 其他统计板块
const EmploymentClassSummary = React.lazy(
  () => import('./others/A-campus-backend-employment-summary/class-summary'),
)
const EmploymentStarSummary = React.lazy(
  () => import('./others/A-campus-backend-employment-summary/star-summary'),
)
const EmploymentTeacherSummary = React.lazy(
  () => import('./others/A-campus-backend-employment-summary/teacher-summary'),
)

const ReputationMonthlyGoals = React.lazy(
  () => import('./others/B-campus-reputaion-stats/1monthly-goals'),
)
const ReputationPersonalGoals = React.lazy(
  () => import('./others/B-campus-reputaion-stats/2personal-goals'),
)
const ReputationMonthlyPersonal = React.lazy(
  () => import('./others/B-campus-reputaion-stats/3monthly-personal'),
)

const StabilityMonthly = React.lazy(
  () => import('./others/C-stu-stability/1-student-stability-monthly'),
)
const StabilityPersonal = React.lazy(
  () => import('./others/C-stu-stability/2-student-stability-personal'),
)
const StabilityPersonalMonthly = React.lazy(
  () => import('./others/C-stu-stability/3-student-stability-personal-monthly'),
)

const StaffFunction = React.lazy(
  () => import('./others/D-staff-function-analysis/1-staff-function-analysis'),
)
const StaffPerformanceSummary = React.lazy(
  () => import('./others/D-staff-function-analysis/2-staff-performance-summary'),
)
const StaffMonthlyPerformance = React.lazy(
  () => import('./others/D-staff-function-analysis/3-staff-monthly-performance'),
)

const TABS = [
  {
    key: 'campus',
    label: '神殿',
    sections: [
      { id: 'campus-1', title: '1. 核心数据汇总表', component: P1 },
      { id: 'campus-2', title: '2. 后端学员就业汇总表', component: P2 },
      { id: 'campus-3', title: '3. 口碑招生汇总表', component: P3 },
      { id: 'campus-4', title: '4. 新生维稳汇总表', component: P4 },
      { id: 'campus-5', title: '5. 智慧司师资配比表', component: P5 },
      { id: 'campus-6', title: '6. 入职离职汇总表', component: P6 },
      { id: 'campus-7', title: '7. 培训计划与成绩汇总表', component: P7 },
      { id: 'campus-8', title: '8. 智慧司员工功能分析表', component: P8 },
    ],
  },
  {
    key: 'employment',
    label: '就业统计',
    sections: [
      { id: 'employment-1', title: '就业班级汇总表', component: EmploymentClassSummary },
      { id: 'employment-2', title: '就业明星汇总表', component: EmploymentStarSummary },
      { id: 'employment-3', title: '教员就业汇总表', component: EmploymentTeacherSummary },
    ],
  },
  {
    key: 'reputation',
    label: '口碑统计',
    sections: [
      { id: 'reputation-1', title: '口碑招生月度目标与结果', component: ReputationMonthlyGoals },
      { id: 'reputation-2', title: '口碑招生个人目标与结果', component: ReputationPersonalGoals },
      {
        id: 'reputation-3',
        title: '口碑招生月度个人目标与结果',
        component: ReputationMonthlyPersonal,
      },
    ],
  },
  {
    key: 'stability',
    label: '新生维稳统计',
    sections: [
      { id: 'stability-1', title: '新生维稳月度汇总表', component: StabilityMonthly },
      { id: 'stability-2', title: '新生维稳个人汇总表', component: StabilityPersonal },
      { id: 'stability-3', title: '新生维稳个人按月汇总表', component: StabilityPersonalMonthly },
    ],
  },
  {
    key: 'staff',
    label: '教员功能分析',
    sections: [
      { id: 'staff-5', title: '智慧司员工功能分析', component: StaffFunction },
      { id: 'staff-6', title: '员工业绩汇总表', component: StaffPerformanceSummary },
      { id: 'staff-7', title: '员工业绩逐月统计表', component: StaffMonthlyPerformance },
    ],
  },
]

const AllCampusCoreBusiness: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ margin: 0, marginBottom: 16 }}>
        神殿 · 智慧司 · 核心业务数据汇总
      </Title>
      <Tabs
        defaultActiveKey="campus"
        destroyInactiveTabPane
        items={TABS.map((tab) => ({
          key: tab.key,
          label: tab.label,
          children: (
            <div>
              {tab.sections.map((section) => (
                <LazySection
                  key={section.id}
                  id={section.id}
                  title={section.title}
                  component={section.component}
                />
              ))}
            </div>
          ),
        }))}
      />
    </div>
  )
}

export default AllCampusCoreBusiness
