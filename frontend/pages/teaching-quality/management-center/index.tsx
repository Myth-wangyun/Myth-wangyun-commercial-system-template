// 教化司核心数据汇总主入口页面
import React, { useEffect, useMemo } from 'react'
import { Tabs } from 'antd'
import { useSearchParams } from 'react-router-dom'

// 导入13个教化司最高议事厅表格页面
import CoreSummary from '../mgnt/001-teaching-quality-summary'
import AllPages from '../mgnt/AllPages'
import EmploymentSummary from '../mgnt/002-backend-employment-goals-results'
import ContractSigningSummary from '../mgnt/003-enterprise-contract-goals-results'
import ReputationEnrollmentSummary from '../mgnt/004-reputation-enrollment-goals-results'
import NewStudentStability from '../mgnt/005-new-student-stability'
import PromotionPlan from '../mgnt/006-enrollment-plan'
import StudentFluctuation from '../mgnt/007-student-fluctuation'
import DormitoryStatistics from '../mgnt/008-dormitory-management'
import EnrollmentStatistics from '../mgnt/009-student-status'
import ManagerAnalysis from '../mgnt/010-manager-function-analysis'
import TrainingPlanPerformance from '../mgnt/011-training-plan-performance'
import TeacherStaffingRatio from '../mgnt/012-teacher-staffing-ratio'
import RecruitmentSummary from '../mgnt/013-recruitment-plan-summary'
import AllCampusLevelPagesATQ from '../mgnt/campus-level/AllCampusLevelPages'

// 菜单键到组件的映射
const menuComponentMap: Record<string, React.ComponentType> = {
  'tq-mgmt-core-summary': CoreSummary,
  'tq-mgmt-employment-summary': EmploymentSummary,
  'tq-mgmt-contract-signing-summary': ContractSigningSummary,
  'tq-mgmt-reputation-enrollment-summary': ReputationEnrollmentSummary,
  'tq-mgmt-new-student-stability': NewStudentStability,
  'tq-mgmt-promotion-plan': PromotionPlan,
  'tq-mgmt-student-fluctuation': StudentFluctuation,
  'tq-mgmt-dormitory-statistics': DormitoryStatistics,
  'tq-mgmt-enrollment-statistics': EnrollmentStatistics,
  'tq-mgmt-manager-analysis': ManagerAnalysis,
  'tq-mgmt-training-plan-performance': TrainingPlanPerformance,
  'tq-mgmt-teacher-staffing-ratio': TeacherStaffingRatio,
  'tq-mgmt-recruitment-summary': RecruitmentSummary,
}

const TeachingQualityCoreDataPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const menu = searchParams.get('menu') || 'tq-mgmt-core-summary'

  // 根据menu参数获取对应的组件
  const Component = useMemo(() => {
    return menuComponentMap[menu] || CoreSummary
  }, [menu])

  useEffect(() => {
    // 更新页面标题
    const titles: Record<string, string> = {
      'tq-mgmt-core-summary': '教化司核心业务数据汇总',
      'tq-mgmt-employment-summary': '后端学员就业汇总表',
      'tq-mgmt-contract-signing-summary': '企业签约汇总表',
      'tq-mgmt-reputation-enrollment-summary': '口碑招生汇总表',
      'tq-mgmt-new-student-stability': '新生维稳统计表',
      'tq-mgmt-promotion-plan': '升学计划',
      'tq-mgmt-student-fluctuation': '学员异动表',
      'tq-mgmt-dormitory-statistics': '宿舍管理统计表',
      'tq-mgmt-enrollment-statistics': '学籍统计表',
      'tq-mgmt-manager-analysis': '经理功能分析表',
      'tq-mgmt-training-plan-performance': '培训计划与成绩汇总表',
      'tq-mgmt-teacher-staffing-ratio': '班主任师资配比表',
      'tq-mgmt-recruitment-summary': '招聘计划与总结表',
    }
    document.title = titles[menu] || '教化司数据管理'
  }, [menu])

  // 当处于“教化司核心业务数据汇总”入口时，显示双 TAB：累计核心数据 / 神殿层级（整合）
  if (menu === 'tq-mgmt-core-summary') {
    return (
      <Tabs
        type="card"
        size="large"
        defaultActiveKey="core"
        items={[
          // 将“累计核心数据”展示为整合页（包含约10+个表），恢复原有多表视图
          { key: 'core', label: '累计核心数据', children: <AllPages /> },
          { key: 'campus', label: '神殿层级（整合）', children: <AllCampusLevelPagesATQ /> },
        ]}
      />
    )
  }

  // 其他菜单仍按原映射渲染
  return <Component key={menu} />
}

export default TeachingQualityCoreDataPage
