// 学术->学术经理->管理表格 教员功能分析表（含TAB：教员考试合格率）
import React, { Suspense } from 'react'
import { Card, Tabs, Typography } from 'antd'
import TeacherExamPassRate from './8-teacher-exam-pass-rate'
import TeacherHomeworkTab from './8-teacher-homework-tab'
import TeacherExamTab from './8-teacher-exam-tab'
import TeacherProjectTab from './8-teacher-project-tab'
import TeacherSatisfactionTab from './8-teacher-satisfaction-tab'
import TeacherViolationTab from './8-teacher-violation-tab'
import TeacherSuperiorAuditTab from './8-teacher-superior-audit-tab'

const { Title } = Typography

const TeacherFunctionAnalysisPage: React.FC = () => {
  return (
    <Card bordered={false} style={{ backgroundColor: '#f5f7fa' }}>
      <Title level={4} style={{ margin: 0, marginBottom: 12 }}>
        教员功能分析表
      </Title>
      <Tabs
        defaultActiveKey="exam-pass-rate"
        items={[
          {
            key: 'exam-pass-rate',
            label: '教员考试合格率',
            children: (
              <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
                <TeacherExamPassRate />
              </Suspense>
            ),
          },
          {
            key: 'exam',
            label: '考试',
            children: (
              <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
                <TeacherExamTab />
              </Suspense>
            ),
          },
          {
            key: 'homework',
            label: '作业',
            children: (
              <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
                <TeacherHomeworkTab />
              </Suspense>
            ),
          },
          {
            key: 'project',
            label: '项目',
            children: (
              <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
                <TeacherProjectTab />
              </Suspense>
            ),
          },
          {
            key: 'satisfaction',
            label: '学员满意度',
            children: (
              <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
                <TeacherSatisfactionTab />
              </Suspense>
            ),
          },
          {
            key: 'violation',
            label: '学员违纪',
            children: (
              <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
                <TeacherViolationTab />
              </Suspense>
            ),
          },
          {
            key: 'superior-audit',
            label: '上级听课',
            children: (
              <Suspense fallback={<div style={{ padding: 24 }}>加载中...</div>}>
                <TeacherSuperiorAuditTab />
              </Suspense>
            ),
          },
        ]}
      />
    </Card>
  )
}

export default TeacherFunctionAnalysisPage
