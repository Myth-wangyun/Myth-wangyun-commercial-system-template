import React, { useEffect, useRef, useState } from 'react'
import { Card, Tabs } from 'antd'
import { MonitorOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCampusStore } from '@/stores/campusStore'

// 导入13个神殿教化司表格页面组件
import CampusCoreDataSummaryPage from '../../teaching-quality/mgnt/campus-level/1-02-01campus-core-data-summary'
import CampusEmploymentGoalsResultsPage from '../../teaching-quality/mgnt/campus-level/2-employment-goals-results'
import CampusContractGoalsResultsPage from '../../teaching-quality/mgnt/campus-level/3-contract-goals-results'
import CampusReputationEnrollmentGoalsResultsPage from '../reputation-enrollment-goals-results'
import CampusNewStudentStabilityPage from '../../teaching-quality/mgnt/campus-level/5-new-student-stability'
import CampusPromotionPlanPage from '../../teaching-quality/mgnt/campus-level/6-promotion-plan'
import CampusStudentFluctuationPage from '../../teaching-quality/mgnt/campus-level/7-student-fluctuation'
import CampusDormitoryStatisticsCorePage from '../../teaching-quality/mgnt/campus-level/8-dormitory-statistics'
import CampusEnrollmentStatisticsPage from '../../teaching-quality/mgnt/campus-level/9-enrollment-statistics'
import CampusManagerAnalysisPage from '../../teaching-quality/mgnt/campus-level/10-manager-analysis'
import CampusTrainingPlanPage from '../training-plan'
import CampusTeacherRatioPage from '../../teaching-quality/mgnt/campus-level/12-teacher-ratio'
import CampusRecruitmentSummaryPage from '../../teaching-quality/mgnt/campus-level/13-recruitment-summary'

const CampusTeachingQualitySummaryPage: React.FC = () => {
  const navigate = useNavigate()
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()
  const wrapperRef = useRef<HTMLDivElement>(null)
  // 标签独立状态，用于导航
  const [selectedCampusForNavigation, setSelectedCampusForNavigation] = useState<string>(
    currentCampus || '',
  )

  // 初始化：如果当前没有选择神殿，选择第一个神殿
  useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      const firstCampus = campuses[0].name
      setCampus(firstCampus)
      setSelectedCampusForNavigation(firstCampus)
    } else if (currentCampus) {
      setSelectedCampusForNavigation(currentCampus)
    }
  }, [currentCampus, campuses, setCampus])

  // 处理标签切换 - 切换不同神殿的汇总数据
  // 注意：这里更新currentCampus是为了让表格组件能获取到正确的数据
  // 但标签的状态是独立的，不受顶部选择器影响
  const handleTabChange = (key: string) => {
    if (key === 'summary') {
      // 汇总标签：返回最高议事厅教化司页面
      navigate('/management-center/teaching-quality')
      return
    }
    setSelectedCampusForNavigation(key)
    // 更新神殿以获取对应神殿的数据（但不影响顶部选择器的状态）
    setCampus(key)
  }

  // 生成标签项 - 包含汇总标签和所有神殿标签
  const tabItems = [
    {
      key: 'summary',
      label: '汇总',
    },
    ...campuses.map((campus) => ({
      key: campus.name,
      label: campus.name.replace('神殿', ''),
    })),
  ]

  // 定义13个表格组件（按照用户指定的顺序）
  const tables = [
    {
      key: '001',
      title: '01神殿教化司核心数据汇总表',
      component: CampusCoreDataSummaryPage,
      props: { hideCampusSelector: true },
    },
    {
      key: '002',
      title: '02神殿后端学员就业目标与结果汇总表',
      component: CampusEmploymentGoalsResultsPage,
      props: { hideCampusSelector: true },
    },
    {
      key: '003',
      title: '03神殿教化司企业签约目标与结果汇总表',
      component: CampusContractGoalsResultsPage,
      props: { hideCampusSelector: true },
    },
    {
      key: '004',
      title: '04神殿教化司口碑招生目标与结果汇总表',
      component: CampusReputationEnrollmentGoalsResultsPage,
      props: { hideCampusSelector: true },
    },
    {
      key: '005',
      title: '05神殿教化司新生当月维稳统计表',
      component: CampusNewStudentStabilityPage,
      props: { hideCampusSelector: true },
    },
    {
      key: '006',
      title: '06神殿教化司升学计划',
      component: CampusPromotionPlanPage,
      props: { hideCampusSelector: true },
    },
    {
      key: '007',
      title: '07神殿教化司学员异动表',
      component: CampusStudentFluctuationPage,
      props: { hideCampusSelector: true },
    },
    {
      key: '008',
      title: '08神殿教化司现有宿舍统计表',
      component: CampusDormitoryStatisticsCorePage,
      props: { hideCampusSelector: true },
    },
    {
      key: '009',
      title: '09神殿教化司学籍统计表',
      component: CampusEnrollmentStatisticsPage,
      props: { hideCampusSelector: true },
    },
    {
      key: '010',
      title: '10神殿教化司经理、副经理功能分析表',
      component: CampusManagerAnalysisPage,
      props: { hideCampusSelector: true },
    },
    {
      key: '011',
      title: '11教化司培训计划与成绩汇总表',
      component: CampusTrainingPlanPage,
      props: { hideCampusSelector: true },
    },
    {
      key: '012',
      title: '12教化司师资配比表',
      component: CampusTeacherRatioPage,
      props: { hideCampusSelector: true },
    },
    {
      key: '013',
      title: '13神殿教化司招聘计划与总结汇总表',
      component: CampusRecruitmentSummaryPage,
      props: { hideCampusSelector: true },
    },
  ]

  // 隐藏所有神殿选择器和搜索栏
  useEffect(() => {
    const hideSelectors = () => {
      if (!wrapperRef.current) return

      // 方法1: 直接查找并隐藏所有Card的extra区域中包含"全部神殿"的Select组件
      const allCards = wrapperRef.current.querySelectorAll('.ant-card')
      allCards.forEach((card) => {
        const cardElement = card as HTMLElement
        const cardExtra = cardElement.querySelector('.ant-card-extra')

        if (cardExtra) {
          // 查找extra中的所有Select组件
          const selects = cardExtra.querySelectorAll('.ant-select')
          selects.forEach((select) => {
            const selectElement = select as HTMLElement
            const selectText = selectElement.textContent || ''

            // 如果包含"全部神殿"文本，隐藏包含它的Space item或父元素
            if (selectText.includes('全部神殿')) {
              const spaceItem = selectElement.closest('.ant-space-item')
              if (spaceItem) {
                ;(spaceItem as HTMLElement).style.display = 'none'
              } else {
                selectElement.style.display = 'none'
              }
            }
          })

          // 也查找包含"选择神殿"的Select（排除搜索框）
          const selectsWithCampus = cardExtra.querySelectorAll('.ant-select')
          selectsWithCampus.forEach((select) => {
            const selectElement = select as HTMLElement
            const selectText = selectElement.textContent || ''
            if (selectText.includes('选择神殿') && !selectText.includes('选择神殿/专业/班级')) {
              const spaceItem = selectElement.closest('.ant-space-item')
              if (spaceItem) {
                ;(spaceItem as HTMLElement).style.display = 'none'
              } else {
                selectElement.style.display = 'none'
              }
            }
          })
        }
      })

      // 方法2: 查找所有独立的神殿选择器Card（包含Select但不包含表格）
      const allElements = wrapperRef.current.querySelectorAll('.ant-card')
      allElements.forEach((card) => {
        const cardElement = card as HTMLElement
        const hasSelect = card.querySelector('.ant-select')
        const hasTable = cardElement.querySelector('.ant-table') !== null
        const hasStatistics = cardElement.querySelector('.ant-statistic') !== null

        // 如果包含选择器但不包含表格和统计数据，隐藏整个Card
        if (hasSelect && !hasTable && !hasStatistics) {
          const cardText = cardElement.textContent || ''
          if (cardText.includes('选择神殿') || cardText.includes('全部神殿')) {
            cardElement.style.display = 'none'
          }
        }
      })
    }

    // 多次执行以确保所有元素都被处理（包括动态渲染的）
    const timers = [
      setTimeout(hideSelectors, 100),
      setTimeout(hideSelectors, 300),
      setTimeout(hideSelectors, 500),
      setTimeout(hideSelectors, 1000),
      setTimeout(hideSelectors, 2000),
    ]

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [currentCampus, tables])

  if (!currentCampus) {
    return null
  }

  return (
    <div
      ref={wrapperRef}
      style={{
        padding: '24px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column', // 确保垂直顺序
      }}
    >
      <Card
        style={{
          marginBottom: 24,
          backgroundColor: '#fff',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <MonitorOutlined style={{ marginRight: 8 }} />
          {currentCampus} - 教化司数据汇总
        </h1>
      </Card>

      {/* 神殿标签栏 - 包含汇总标签和所有神殿标签 */}
      <Card style={{ backgroundColor: '#fff', marginBottom: 24 }}>
        <Tabs
          activeKey={selectedCampusForNavigation}
          onChange={handleTabChange}
          type="card"
          size="large"
          items={tabItems}
        />
      </Card>

      {/* 显示所有13个表格 - 严格按照数组顺序渲染 */}
      {tables.map((table, index) => {
        const Component = table.component
        const props = table.props || {}
        return (
          <div
            key={table.key}
            className="campus-summary-table-wrapper"
            style={{
              marginBottom: index < tables.length - 1 ? 32 : 0,
              order: index + 1, // 显式设置顺序
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Component {...props} />
          </div>
        )
      })}
    </div>
  )
}

export default CampusTeachingQualitySummaryPage
