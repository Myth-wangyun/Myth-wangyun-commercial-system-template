// 教员功能分析总表 - 主入口
import React, { Suspense, lazy } from 'react'
import { Card, Tabs, Typography, Empty } from 'antd'
import type { TabsProps } from 'antd'

const { Title } = Typography

// 懒加载各个TAB组件
const DataSummary = lazy(() => import('./8-teacher-exam-pass-rate'))
const HomeworkTab = lazy(() => import('./8-teacher-homework-tab'))
const ExamTab = lazy(() => import('./8-teacher-exam-tab'))
const ProjectTab = lazy(() => import('./8-teacher-project-tab'))
const SatisfactionTab = lazy(() => import('./8-teacher-satisfaction-tab'))
const ViolationTab = lazy(() => import('./8-teacher-violation-tab'))
const SuperiorAuditTab = lazy(() => import('./8-teacher-superior-audit-tab'))

const renderLazy = (Component: React.LazyExoticComponent<React.FC>) => (
  <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
    <Component />
  </Suspense>
)

const Placeholder: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ padding: 48 }}>
    <Empty description={<span>{label}模块待开发</span>} />
  </div>
)

const TeacherFunctionAnalysisPage: React.FC = () => {
  const tabItems: TabsProps['items'] = [
    {
      key: 'data-summary',
      label: '数据汇总',
      children: renderLazy(DataSummary),
    },
    {
      key: 'homework',
      label: '作业',
      children: renderLazy(HomeworkTab),
    },
    {
      key: 'exam',
      label: '考试',
      children: renderLazy(ExamTab),
    },
    {
      key: 'project',
      label: '项目',
      children: renderLazy(ProjectTab),
    },
    {
      key: 'satisfaction',
      label: '学员满意度',
      children: renderLazy(SatisfactionTab),
    },
    {
      key: 'violation',
      label: '学员违纪',
      children: renderLazy(ViolationTab),
    },
    {
      key: 'superior-audit',
      label: '上级听课',
      children: renderLazy(SuperiorAuditTab),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Title level={4} style={{ marginBottom: 16 }}>
          教员功能分析总表
        </Title>
        <Tabs defaultActiveKey="data-summary" type="card" items={tabItems} />
      </Card>
    </div>
  )
}

export default TeacherFunctionAnalysisPage
