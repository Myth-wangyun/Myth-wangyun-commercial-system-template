import React, { useEffect, useMemo, Suspense, useState, startTransition } from 'react'
import { Card, Tabs, Spin } from 'antd'
import { BarChartOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'

// 顶部各大 Tab 页面：按需加载，减少首屏体积与初始渲染
const LazyShengbangEmploymentAllPage = React.lazy(() => import('../2-employment'))
const LazyShengbangContractGoalsResultsAllPage = React.lazy(() => import('../3-contract-goals-results'))
const LazyShengbangReputationEnrollmentAllPage = React.lazy(() => import('../4-reputation-enrollment'))
const LazyShengbangNewStuStabilityAllPage = React.lazy(() => import('../5-new-stu-stability'))
const LazyShengbangPromotionPlanAllPage = React.lazy(() => import('../6-promotion-plan'))
const LazyShengbangStuMovementAllPage = React.lazy(() => import('../7-stu-movement'))
const LazyShengbangDormitoryStatisticsAllPage = React.lazy(() => import('../8-dormitory-statistics'))
const LazyShengbangEnrollmentStatisticsAllPage = React.lazy(() => import('../9-enrollment-statistics'))

// 13 个表格页面（统一指向 A-teaching-quality 下的新位置）按需加载
const LazyCampusCoreDataSummaryPage = React.lazy(() => import('@/pages/teaching-quality/mgnt/campus-level/1-02-01campus-core-data-summary'))
const LazyCampusEmploymentGoalsResultsPage = React.lazy(() => import('@/pages/teaching-quality/mgnt/campus-level/2-employment-goals-results'))
const LazyCampusContractGoalsResultsPage = React.lazy(() => import('@/pages/teaching-quality/mgnt/campus-level/3-contract-goals-results'))
const LazyCampusReputationEnrollmentGoalsResultsPage = React.lazy(() => import('@/pages/teaching-quality/mgnt/campus-level/4-reputation-summary'))
const LazyCampusNewStudentStabilityPage = React.lazy(() => import('@/pages/teaching-quality/mgnt/campus-level/5-new-student-stability'))
const LazyCampusPromotionPlanPage = React.lazy(() => import('@/pages/teaching-quality/mgnt/campus-level/6-promotion-plan'))
const LazyCampusStudentFluctuationPage = React.lazy(() => import('@/pages/teaching-quality/mgnt/campus-level/7-student-fluctuation'))
const LazyCampusDormitoryStatisticsCorePage = React.lazy(() => import('@/pages/teaching-quality/campus/1-core-data/1-core-data-summary/8-dormitory-statistics/1-campus-dormitory-statistics-summary'))
const LazyCampusEnrollmentStatisticsPage = React.lazy(() => import('@/pages/teaching-quality/mgnt/campus-level/9-enrollment-statistics'))
const LazyCampusManagerAnalysisPage = React.lazy(() => import('@/pages/teaching-quality/mgnt/campus-level/10-manager-analysis'))
const LazyCampusTrainingPlanPage = React.lazy(() => import('@/pages/teaching-quality/mgnt/campus-level/11-training-plan-performance'))
const LazyCampusTeacherRatioPage = React.lazy(() => import('@/pages/teaching-quality/mgnt/campus-level/12-teacher-ratio'))
const LazyCampusRecruitmentSummaryPage = React.lazy(() => import('@/pages/teaching-quality/mgnt/campus-level/13-recruitment-summary'))

const CampusCoreDataSummaryAllPage: React.FC = () => {
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()

  useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      // 优先选择名称包含"神殿"的神殿，避免选择简称导致API查询问题
      const campusWithSuffix = campuses.find((c) => c.name.includes('神殿'))
      const firstCampus = campusWithSuffix ? campusWithSuffix.name : campuses[0].name
      setCampus(firstCampus)
    }
  }, [currentCampus, campuses, setCampus])

  const tables = useMemo(() => (
    [
      {
        key: '001',
        tabKey: 'core-data',
        title: '神殿教化司核心数据汇总表',
        component: LazyCampusCoreDataSummaryPage,
      },
      {
        key: '002',
        tabKey: 'employment',
        title: '神殿后端学员就业目标与结果汇总表',
        component: LazyCampusEmploymentGoalsResultsPage,
      },
      {
        key: '003',
        tabKey: 'contract',
        title: '神殿教化司企业签约目标与结果汇总表',
        component: LazyCampusContractGoalsResultsPage,
      },
      {
        key: '004',
        tabKey: 'reputation',
        title: '神殿教化司口碑招生目标与结果汇总表',
        component: LazyCampusReputationEnrollmentGoalsResultsPage,
      },
      {
        key: '005',
        tabKey: 'stability',
        title: '神殿教化司新生当月维稳统计表',
        component: LazyCampusNewStudentStabilityPage,
      },
      {
        key: '006',
        tabKey: 'promotion',
        title: '神殿教化司升学计划',
        component: LazyCampusPromotionPlanPage,
      },
      {
        key: '007',
        tabKey: 'fluctuation',
        title: '神殿教化司学员异动表',
        component: LazyCampusStudentFluctuationPage,
      },
      {
        key: '008',
        tabKey: 'dormitory',
        title: '神殿教化司现有宿舍统计表',
        component: LazyCampusDormitoryStatisticsCorePage,
      },
      {
        key: '009',
        tabKey: 'enrollment',
        title: '神殿教化司学籍统计表',
        component: LazyCampusEnrollmentStatisticsPage,
      },
      { key: '010', title: '神殿教化司经理、副经理功能分析表', component: LazyCampusManagerAnalysisPage },
      { key: '011', title: '教化司培训计划与成绩汇总表', component: LazyCampusTrainingPlanPage },
      { key: '012', title: '教化司师资配比表', component: LazyCampusTeacherRatioPage },
      {
        key: '013',
        title: '神殿教化司招聘计划与总结汇总表',
        component: LazyCampusRecruitmentSummaryPage,
      },
    ].map((t) => ({ ...t, props: { hideCampusSelector: true } }))
  ), [])
  if (!currentCampus) return null

  // 固定 Suspense fallback，避免重复创建 style 对象与元素
  const smallFallback = useMemo(() => (
    <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: 24 }} />
  ), [])
  const bigFallback = useMemo(() => (
    <Spin size="large" style={{ display: 'flex', justifyContent: 'center', padding: '50px' }} />
  ), [])

  // 增量挂载：逐批渲染，减少一次性挂载造成的 JS 长任务与 ResizeObserver 风暴
  const [visibleCount, setVisibleCount] = useState(3)
  useEffect(() => {
    let cancelled = false
    const step = () => {
      startTransition(() => {
        setVisibleCount((c) => {
          const next = Math.min(c + 2, tables.length)
          if (!cancelled && next < tables.length) {
            if (typeof (window as any).requestIdleCallback === 'function') {
              ;(window as any).requestIdleCallback(step, { timeout: 200 })
            } else {
              setTimeout(step, 50)
            }
          }
          return next
        })
      })
    }
    // 初始调度
    step()
    return () => { cancelled = true }
  }, [tables.length])

  const visibleTables = useMemo(() => tables.slice(0, visibleCount), [tables, visibleCount])

  const summaryContent = useMemo(() => (
    <>
      {visibleTables.map((table, index) => {
        const Component = table.component as React.ComponentType<any>
        return (
          <div
            key={table.key}
            className="campus-summary-table-wrapper"
            style={{ marginBottom: index < visibleTables.length - 1 ? 32 : 0 }}
          >
            <h2
              style={{
                margin: '16px 0',
                fontSize: 20,
                fontWeight: 'bold',
              }}
            >
              {index + 1}. {table.title}
            </h2>
            <Suspense fallback={smallFallback}>
              <Component hideCampusSelector={true} />
            </Suspense>
          </div>
        )
      })}
    </>
  ), [visibleTables, smallFallback])

  return (
    <div
      style={{
        padding: '24px',
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
          <BarChartOutlined style={{ marginRight: 8 }} />
          {currentCampus}教化司核心业务数据汇总表
        </h1>
      </Card>

      {useMemo(() => {
        const tabsItems = [
          {
            key: 'summary',
            label: `${currentCampus}教质累计核心数据`,
            children: summaryContent,
          },
          {
            key: 'employment',
            label: '就业目标与结果汇总表',
            children: (
              <Suspense fallback={bigFallback}>
                <LazyShengbangEmploymentAllPage />
              </Suspense>
            ),
          },
          {
            key: 'contract',
            label: '企业签约',
            children: (
              <Suspense fallback={bigFallback}>
                <LazyShengbangContractGoalsResultsAllPage />
              </Suspense>
            ),
          },
          {
            key: 'reputation',
            label: '口碑统计',
            children: (
              <Suspense fallback={bigFallback}>
                <LazyShengbangReputationEnrollmentAllPage />
              </Suspense>
            ),
          },
          {
            key: 'new-stu-stability',
            label: '新生维稳',
            children: (
              <Suspense fallback={bigFallback}>
                <LazyShengbangNewStuStabilityAllPage />
              </Suspense>
            ),
          },
          {
            key: 'promotion',
            label: '升学',
            children: (
              <Suspense fallback={bigFallback}>
                <LazyShengbangPromotionPlanAllPage />
              </Suspense>
            ),
          },
          {
            key: 'stu-movement',
            label: '异动表',
            children: (
              <Suspense fallback={bigFallback}>
                <LazyShengbangStuMovementAllPage />
              </Suspense>
            ),
          },
          {
            key: 'dormitory-management',
            label: '宿舍管理',
            children: (
              <Suspense fallback={bigFallback}>
                <LazyShengbangDormitoryStatisticsAllPage />
              </Suspense>
            ),
          },
          {
            key: 'enrollment-management',
            label: '学籍管理',
            children: (
              <Suspense fallback={bigFallback}>
                <LazyShengbangEnrollmentStatisticsAllPage />
              </Suspense>
            ),
          },
        ]
        return (
          <Tabs
            defaultActiveKey="summary"
            destroyInactiveTabPane
            animated={{ tabPane: false }}
            items={tabsItems}
          />
        )
      }, [summaryContent, bigFallback, currentCampus])}

    </div>
  )
}

export default CampusCoreDataSummaryAllPage
