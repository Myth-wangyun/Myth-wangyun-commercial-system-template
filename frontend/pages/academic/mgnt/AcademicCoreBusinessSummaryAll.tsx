import React, { lazy, useMemo, useState } from 'react'
import { Typography, Select, Space, Tabs } from 'antd'
import AllCampusLevelPages from './campus-level/AllCampusLevelPages'
import LazySection from './LazySection'
import { useCampusStore } from '@/stores/campusStore'
import { getCampusNamesWithFallback } from '@/stores/campusStore'

// 使用按需加载 + 可见时挂载，避免一次性加载所有页面
const CoreSummary = lazy(() => import('./1-core-summary'))
const EmploymentSummary = lazy(() => import('./2-employment-summary'))
const EnrollmentSummary = lazy(() => import('./3-enrollment-summary'))
const StudentStability = lazy(() => import('./4-student-stability'))
const TeacherStaffingRatio = lazy(() => import('./5-teacher-staffing-ratio'))
const OnboardingOffboarding = lazy(() => import('./6-onboarding-offboarding'))
const TrainingSummary = lazy(() => import('./7-training-summary'))
const ManagerAnalysis = lazy(() => import('./8-manager-analysis/index.tsx'))
const NetworkSurvey = lazy(() => import('./9-network-survey'))
const EnterpriseSurvey = lazy(() => import('./10-enterprise-survey'))
const PositionAnalysis = lazy(() => import('./11-position-analysis'))
const CoursewareWriting = lazy(() => import('./12-courseware-writing'))
const QuestionbankWriting = lazy(() => import('./13-questionbank-writing'))
const ManagerEvaluation = lazy(() => import('./14-manager-evaluation'))

const { Title } = Typography

const AcademicCoreBusinessSummaryAll: React.FC = () => {
  const [view, setView] = useState<'core' | 'campus' | 'manager-eval'>('core')
  const { setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()
  
  // 神殿排序顺序（按照指定顺序）
  // 1.河北盛邦 2.河北冀美 3.河北石美 4.山西晋美 5.山西原美 6.山西太美 7.广西桂美 8.广西邕美 9.贵州黔美
  const campusOrder = useMemo(() => {
    const order = [
      '河北盛邦', '盛邦',
      '河北冀美', '冀美',
      '河北石美', '石美',
      '山西晋美', '晋美',
      '山西原美', '原美',
      '山西太美', '太美',
      '广西桂美', '桂美',
      '广西邕美', '邕美',
      '贵州黔美', '黔美',
    ]
    const orderMap = new Map<string, number>()
    // 每两个为一组（全称和简称），使用相同的排序值
    for (let i = 0; i < order.length; i += 2) {
      const sortValue = Math.floor(i / 2)
      orderMap.set(order[i], sortValue)
      orderMap.set(order[i + 1], sortValue)
      orderMap.set(order[i] + '神殿', sortValue)
      orderMap.set(order[i + 1] + '神殿', sortValue)
    }
    return orderMap
  }, [])
  
  const campusTabs = useMemo(() => {
    const names = campuses.length ? campuses.map((c) => c.name) : getCampusNamesWithFallback()
    const tabs = names.map((name) => ({
      key: name,
      label: name.replace(/神殿$/, '') || name,
      fullName: name, // 保留完整名称用于排序
    }))
    
    // 按照指定顺序排序
    tabs.sort((a, b) => {
      const orderA = campusOrder.get(a.fullName) ?? campusOrder.get(a.label) ?? 999
      const orderB = campusOrder.get(b.fullName) ?? campusOrder.get(b.label) ?? 999
      if (orderA !== orderB) {
        return orderA - orderB
      }
      // 如果都不在排序列表中，按字母顺序排序
      return a.label.localeCompare(b.label, 'zh-CN')
    })
    
    // 返回时只保留 key 和 label
    return tabs.map(({ key, label }) => ({ key, label }))
  }, [campuses, campusOrder])
  
  // 在"黔美"右侧插入一个专用 TAB：经理评估
  const tabsWithManagerEval = useMemo(() => {
    const items = [...campusTabs]
    // 在最后一个神殿（黔美）之后插入
    const qmIndex = items.findIndex((x) => x.label.includes('黔美') || x.label.includes('贵州黔美'))
    const insertIndex = qmIndex >= 0 ? qmIndex + 1 : items.length
    items.splice(insertIndex, 0, { key: 'manager-eval', label: '经理评估' } as any)
    return items
  }, [campusTabs])

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 8 }}>
        <Title level={3} style={{ margin: 0 }}>
          <Space size="middle" align="center">
            <span>最高议事厅 · 智慧司 · 核心业务数据汇总</span>
            <Select
              value={view}
              onChange={(v) => setView(v)}
              style={{ minWidth: 180 }}
              options={[
                { value: 'core', label: '核心业务汇总' },
                { value: 'campus', label: '神殿层级（整合）' },
              ]}
            />
          </Space>
        </Title>
      </div>

      {/* 置顶的“累计核心数据/神殿”切换 Tabs */}
      <Tabs
        style={{ marginBottom: 16, marginTop: 8 }}
        activeKey={
          view === 'core' ? 'core-total' : view === 'manager-eval' ? 'manager-eval' : undefined
        }
        onChange={(key) => {
          if (key === 'core-total') {
            setView('core')
          } else if (key === 'manager-eval') {
            setView('manager-eval')
          } else {
            setView('campus')
            setCampus(key)
          }
        }}
        items={[{ key: 'core-total', label: '累计核心数据' }, ...tabsWithManagerEval]}
      />

      {view === 'campus' ? (
        <AllCampusLevelPages />
      ) : view === 'manager-eval' ? (
        <LazySection id="manager-evaluation" title="经理评估" component={ManagerEvaluation} />
      ) : (
        <>
          <LazySection id="core-summary" title="1. 核心数据汇总" component={CoreSummary} />
          <LazySection id="employment-summary" title="2. 就业汇总" component={EmploymentSummary} />
          <LazySection
            id="enrollment-summary"
            title="3. 口碑招生汇总表"
            component={EnrollmentSummary}
          />
          <LazySection id="student-stability" title="4. 新生维稳" component={StudentStability} />
          <LazySection
            id="teacher-staffing-ratio"
            title="5. 教员配比"
            component={TeacherStaffingRatio}
          />
          <LazySection
            id="onboarding-offboarding"
            title="6. 入职离职汇总"
            component={OnboardingOffboarding}
          />
          <LazySection id="training-summary" title="7. 培训汇总" component={TrainingSummary} />
          <LazySection id="manager-analysis" title="8. 经理功能分析" component={ManagerAnalysis} />
          <LazySection id="network-survey" title="9. 网络调研" component={NetworkSurvey} />
          <LazySection id="enterprise-survey" title="10. 企业调研" component={EnterpriseSurvey} />
          <LazySection id="position-analysis" title="11. 岗位分析" component={PositionAnalysis} />
          <LazySection id="courseware-writing" title="12. 课件编写" component={CoursewareWriting} />
          <LazySection
            id="questionbank-writing"
            title="13. 题库编写"
            component={QuestionbankWriting}
          />
        </>
      )}
    </div>
  )
}

export default AcademicCoreBusinessSummaryAll
