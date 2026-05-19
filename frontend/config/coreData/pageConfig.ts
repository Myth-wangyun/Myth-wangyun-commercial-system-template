/**
 * Core-data 页面配置
 * 定义页面的组件映射和元数据
 */
import React from 'react'
import { ALL_CORE_DATA_COMPONENTS } from '../components/coreDataComponents'

// 从配置导入组件映射，合并原有配置（保持向后兼容）
export const LAZY_COMPONENTS = {
  ...ALL_CORE_DATA_COMPONENTS,
  // 可以在这里添加其他尚未迁移到配置的组件
} as const

export type LazyComponentKey = keyof typeof LAZY_COMPONENTS
export type LazyComponent = React.LazyExoticComponent<React.FC<Record<string, unknown>>>

export type ComponentMeta = {
  tableKey: string
  label: string
  componentKey: LazyComponentKey | string // 允许字符串以兼容旧配置
}

export const COMPONENT_META = {
  'mgmt-core-summary': {
    tableKey: '001',
    label: '核心数据汇总表',
    componentKey: 'mgmt-core-summary',
  },
  'mgmt-employment-summary': {
    tableKey: '002',
    label: '后端学员就业汇总表',
    componentKey: 'mgmt-employment-summary',
  },
  'mgmt-reputation-enrollment': {
    tableKey: '003',
    label: '口碑招生汇总表',
    componentKey: 'mgmt-reputation-enrollment',
  },
  'mgmt-student-stability': {
    tableKey: '004',
    label: '新生维稳汇总表',
    componentKey: 'mgmt-student-stability',
  },
  'mgmt-teacher-staffing': {
    tableKey: '013',
    label: '智慧司师资配比表',
    componentKey: 'mgmt-teacher-staffing',
  },
  'mgmt-onboarding-offboarding': {
    tableKey: '005',
    label: '入职离职汇总表',
    componentKey: 'mgmt-onboarding-offboarding',
  },
  'mgmt-training-summary': {
    tableKey: '006',
    label: '培训计划与成绩汇总表',
    componentKey: 'mgmt-training-summary',
  },
  'mgmt-manager-analysis': {
    tableKey: '014',
    label: '经理、副经理功能分析表',
    componentKey: 'mgmt-manager-analysis',
  },
  'mgmt-network-survey': {
    tableKey: '008',
    label: '网络调查汇总表',
    componentKey: 'mgmt-network-survey',
  },
  'mgmt-enterprise-survey': {
    tableKey: '009',
    label: '企业调查汇总表',
    componentKey: 'mgmt-enterprise-survey',
  },
  'mgmt-position-analysis': {
    tableKey: '010',
    label: '岗位分析报告汇总表',
    componentKey: 'mgmt-position-analysis',
  },
  'mgmt-courseware-writing': {
    tableKey: '011',
    label: '课件编写汇总表',
    componentKey: 'mgmt-courseware-writing',
  },
  'mgmt-questionbank-writing': {
    tableKey: '012',
    label: '题库编写汇总表',
    componentKey: 'mgmt-questionbank-writing',
  },
  'campus-academic-core-data': {
    tableKey: '001',
    label: '核心数据汇总表',
    componentKey: 'mgmt-core-summary',
  },
  'campus-core-data-summary': {
    tableKey: '000',
    label: '核心业务数据汇总',
    componentKey: 'campus-academic-core-business-all',
  },
  'academic-mgnt-campus-core-summary': {
    tableKey: '001',
    label: '神殿核心数据汇总表',
    componentKey: 'academic-mgnt-campus-core-summary',
  },
  'campus-backend-employment': {
    tableKey: '002',
    label: '后端学员就业汇总表',
    componentKey: 'mgmt-employment-summary',
  },
  'academic-mgnt-campus-reputation-enrollment': {
    tableKey: 'academic-mgnt-campus-reputation-enrollment',
    label: '神殿智慧司口碑招生汇总表',
    componentKey: 'academic-mgnt-campus-reputation-enrollment-goals-results', // 智慧司表格
  },
  'academic-mgnt-campus-new-student-stability': {
    tableKey: 'academic-mgnt-campus-new-student-stability',
    label: '后端新生维稳汇总表',
    componentKey: 'academic-mgnt-campus-new-student-stability',
  },
  'campus-teacher-staffing-campus': {
    tableKey: '013',
    label: '神殿智慧司师资配比表',
    componentKey: 'campus-teacher-staffing-campus',
  },
  // 原来的师资配比表（已移到其他菜单）
  'campus-teacher-staffing-ratio-old': {
    tableKey: '013-old',
    label: '智慧司师资配比表（原）',
    componentKey: 'campus-teacher-staffing-ratio-old',
  },
  'campus-reputation-enrollment-campus': {
    tableKey: '003',
    label: '智慧司口碑招生汇总表',
    componentKey: 'academic-mgnt-campus-reputation-enrollment-goals-results', // 智慧司表格（保留，但菜单项已改为独立路由）
  },
  'campus-onboarding-offboarding-campus': {
    tableKey: 'academic-mgnt-campus-onboarding-offboarding',
    label: '智慧司入职离职汇总表',
    componentKey: 'academic-mgnt-campus-onboarding-offboarding',
  },
  'campus-training-summary-campus': {
    tableKey: '006',
    label: '智慧司培训计划与成绩汇总表',
    componentKey: 'campus-training-summary-campus',
  },
  'academic-mgnt-campus-onboarding-offboarding': {
    tableKey: 'academic-mgnt-campus-onboarding-offboarding',
    label: '神殿智慧司入职离职汇总表',
    componentKey: 'academic-mgnt-campus-onboarding-offboarding',
  },
  'academic-mgnt-campus-network-survey': {
    tableKey: 'academic-mgnt-campus-network-survey',
    label: '神殿智慧司网络调查汇总表',
    componentKey: 'academic-mgnt-campus-network-survey',
  },
  'academic-mgnt-campus-enterprise-survey': {
    tableKey: 'academic-mgnt-campus-enterprise-survey',
    label: '神殿智慧司企业调查汇总表',
    componentKey: 'academic-mgnt-campus-enterprise-survey',
  },
  'academic-mgnt-campus-position-analysis': {
    tableKey: 'academic-mgnt-campus-position-analysis',
    label: '神殿智慧司岗位分析报告汇总表',
    componentKey: 'academic-mgnt-campus-position-analysis',
  },
  'academic-mgnt-campus-courseware-writing': {
    tableKey: 'academic-mgnt-campus-courseware-writing',
    label: '神殿智慧司课件编写汇总表',
    componentKey: 'academic-mgnt-campus-courseware-writing',
  },
  'academic-mgnt-campus-questionbank-writing': {
    tableKey: 'academic-mgnt-campus-questionbank-writing',
    label: '神殿智慧司题库编写汇总表',
    componentKey: 'academic-mgnt-campus-questionbank-writing',
  },
  'academic-mgnt-campus-employment-class-summary': {
    tableKey: '017',
    label: '后端就业班级汇总表',
    componentKey: 'academic-mgnt-campus-employment-class-summary',
  },
  'academic-mgnt-campus-employment-star-summary': {
    tableKey: 'academic-mgnt-campus-employment-star-summary',
    label: '主神殿后端就业明星汇总表',
    componentKey: 'academic-mgnt-campus-employment-star-summary',
  },
  'academic-mgnt-campus-teacher-employment-summary': {
    tableKey: 'academic-mgnt-campus-teacher-employment-summary',
    label: '主神殿后端教员就业汇总表',
    componentKey: 'academic-mgnt-campus-teacher-employment-summary',
  },
  'campus-staff-analysis': {
    tableKey: '041',
    label: '智慧司员工功能分析表',
    componentKey: 'campus-staff-analysis',
  },
  'campus-employment-class-summary': {
    tableKey: 'campus-employment-class-summary',
    label: '后端就业班级汇总表',
    componentKey: 'campus-employment-class-summary',
  },
  'campus-employment-star-summary': {
    tableKey: 'campus-employment-star-summary',
    label: '后端就业明星汇总表',
    componentKey: 'campus-employment-star-summary',
  },
  'campus-teacher-employment-summary': {
    tableKey: '043',
    label: '后端教员就业汇总表',
    componentKey: 'campus-teacher-employment-summary',
  },
  'campus-reputation-monthly-goals': {
    tableKey: '048',
    label: '智慧司口碑招生月度目标与结果汇总表',
    componentKey: 'campus-reputation-monthly-goals',
  },
  'campus-reputation-personal-goals': {
    tableKey: '020',
    label: '神殿口碑招生个人目标与结果汇总表',
    componentKey: 'campus-reputation-personal-goals',
  },
  'campus-reputation-monthly-personal': {
    tableKey: '021',
    label: '神殿口碑招生月度个人目标与结果汇总表',
    componentKey: 'campus-reputation-monthly-personal',
  },
  'campus-new-student-stability-campus': {
    tableKey: '004',
    label: '后端新生维稳汇总表',
    componentKey: 'campus-new-student-stability-campus',
  },
  'campus-new-student-monthly-summary': {
    tableKey: '042',
    label: '月度汇总表',
    componentKey: 'campus-new-student-stability-monthly',
  },
  'campus-new-student-personal-summary': {
    tableKey: '015',
    label: '个人汇总表',
    componentKey: 'campus-new-student-stability-personal',
  },
  'campus-new-student-monthly-personal': {
    tableKey: '044',
    label: '个人按月汇总表',
    componentKey: 'campus-new-student-monthly-personal',
  },
  'campus-staff-function-analysis': {
    tableKey: '041',
    label: '智慧司员工功能分析表',
    componentKey: 'campus-staff-analysis',
  },
  'campus-staff-performance-summary': {
    tableKey: '045',
    label: '员工业绩汇总表',
    componentKey: 'campus-staff-performance-summary',
  },
  'campus-staff-monthly-performance': {
    tableKey: '046',
    label: '员工业绩逐月统计表',
    componentKey: 'campus-staff-monthly-performance',
  },
  'campus-class-employment-info': {
    tableKey: '047',
    label: '神殿班级就业信息表',
    componentKey: 'campus-class-employment-info',
  },
  'campus-reputation-registration-details': {
    tableKey: 'campus-reputation-registration-details',
    label: '口碑报名登记明细表',
    componentKey: 'campus-reputation-registration-details',
  },
  'academic-manager-dashboard': {
    tableKey: '049',
    label: '学术经理仪表板',
    componentKey: 'academic-manager-dashboard',
  },
  'academic-manager-kpi': {
    tableKey: '050',
    label: '学术经理KPI考核',
    componentKey: 'academic-manager-kpi',
  },
  'academic-manager-reports': {
    tableKey: '051',
    label: '学术经理报表',
    componentKey: 'academic-manager-reports',
  },
  'academic-manager-employment-class-detail': {
    tableKey: '047',
    label: '某神殿某班就业信息明细表',
    componentKey: 'academic-manager-employment-class-detail',
  },
  'academic-manager-employment-class-summary': {
    tableKey: '017',
    label: '某神殿某班就业总结',
    componentKey: 'academic-manager-employment-class-summary',
  },
  'academic-manager-employment-intensify-plan': {
    tableKey: '018',
    label: '某神殿某班强化项目计划表',
    componentKey: 'academic-manager-employment-intensify-plan',
  },
  'academic-manager-salary-prediction': {
    tableKey: 'academic-manager-salary-prediction',
    label: '班级薪资预估表',
    componentKey: 'academic-manager-salary-prediction',
  },
  'academic-manager-reputation-self-check': {
    tableKey: '031',
    label: '某神殿智慧司口碑工作自查表',
    componentKey: 'academic-manager-reputation-self-check',
  },
  'academic-manager-reputation-keypoint-summary-a': {
    tableKey: '032',
    label: 'XX神殿智慧司口碑招生关键点结果汇总表',
    componentKey: 'academic-manager-reputation-keypoint-summary-a',
  },
  'academic-manager-reputation-keypoint-summary-b': {
    tableKey: '032',
    label: 'XX神殿智慧司口碑招生关键点结果汇总表',
    componentKey: 'academic-manager-reputation-keypoint-summary-b',
  },
  'academic-manager-reputation-keypoint-detail': {
    tableKey: '032-detail',
    label: 'XX神殿智慧司口碑招生关键点结果明细表',
    componentKey: 'academic-manager-reputation-keypoint-detail',
  },
  'academic-manager-reputation-interview-record': {
    tableKey: '033',
    label: 'XX班级学员访谈情况记录表',
    componentKey: 'academic-manager-reputation-interview-record',
  },
  'academic-manager-stability-overview': {
    tableKey: '004',
    label: '新生维稳汇总',
    componentKey: 'academic-manager-stability-overview',
  },
  'academic-manager-stability-monthly-detail': {
    tableKey: '05-4',
    label: '05-4主神殿教化司当月新生维稳明细表',
    componentKey: 'academic-manager-stability-monthly-detail',
  },
  'academic-manager-stability-outstanding-fees': {
    tableKey: '05-1',
    label: '05-1主神殿教化司新生仍欠费明细表',
    componentKey: 'academic-manager-stability-outstanding-fees',
  },
  'academic-manager-stability-personal': {
    tableKey: '015',
    label: '新生维稳个人明细',
    componentKey: 'campus-new-student-stability-personal',
  },
  'academic-manager-management-kpi-data': {
    tableKey: '034',
    label: 'XX神殿智慧司教员KPI考核数据表',
    componentKey: 'academic-manager-management-kpi-data',
  },
  'academic-manager-management-kpi-result': {
    tableKey: '050',
    label: 'XX神殿智慧司教员KPI考核结果表',
    componentKey: 'academic-manager-management-kpi-result',
  },
  'academic-manager-management-teacher-exam-pass-rate': {
    tableKey: '040',
    label: '教员功能分析表',
    componentKey: 'academic-manager-management-teacher-exam-pass-rate',
  },
  'academic-manager-management-employment-reward-amount': {
    tableKey: 'employment-reward-amount',
    label: '就业奖惩金额',
    componentKey: 'academic-manager-management-employment-reward-amount',
  },
  'academic-manager-management-hours-stats': {
    tableKey: '037',
    label: '教员课时统计表',
    componentKey: 'academic-manager-management-hours-stats',
  },
  'academic-manager-management-hours-summary': {
    tableKey: '037-2',
    label: '教员课时汇总表',
    componentKey: 'academic-manager-management-hours-summary',
  },
  'academic-manager-management-monthly-hour-stats': {
    tableKey: '038',
    label: '月份课时统计表',
    componentKey: 'academic-manager-management-monthly-hour-stats',
  },
  // 以下两项不在 4management-forms 目录，暂从菜单移除但保留映射（如其他入口需要）
  'academic-manager-management-performance-reward': {
    tableKey: '035',
    label: 'XX神殿智慧司教员业绩奖惩表',
    componentKey: 'academic-manager-management-performance-reward',
  },
  'academic-manager-management-assessment-collection': {
    tableKey: '052',
    label:
      '1就业考核2口碑招生提成3教学满意度考核4教学质量考核5课堂管理考核6新生维稳考核7协助咨询转化奖励8团队建设奖励',
    componentKey: 'academic-manager-management-assessment-collection',
  },
  'academic-manager-management-interview-record': {
    tableKey: '033',
    label: '智慧司某班学员访谈情况表',
    componentKey: 'academic-manager-management-interview-record',
  },
  'academic-manager-management-daily-summary': {
    tableKey: '039',
    label: '清美教育XX神殿智慧司日工作总结',
    componentKey: 'academic-manager-management-daily-summary',
  },
  'academic-manager-management-function-analysis': {
    tableKey: '041',
    label: 'XX神殿智慧司教员功能分析表',
    componentKey: 'academic-manager-management-function-analysis',
  },
  'academic-teacher-homework-grade-register': {
    tableKey: '021',
    label: '清美教育学员作业成绩登记表',
    componentKey: 'academic-teacher-homework-grade-register',
  },
  'academic-teacher-exam-grade-register': {
    tableKey: '022',
    label: '清美教育学员考试成绩登记表',
    componentKey: 'academic-teacher-exam-grade-register',
  },
  'academic-teacher-project-grade-register': {
    tableKey: '023',
    label: '某神殿某班项目成绩表',
    componentKey: 'academic-teacher-project-grade-register',
  },
  'academic-teacher-student-satisfaction': {
    tableKey: '024',
    label: '学员满意度得分表',
    componentKey: 'academic-teacher-student-satisfaction',
  },
  'academic-teacher-student-satisfaction-survey': {
    tableKey: '025',
    label: '学员对教员满意度调查表',
    componentKey: 'academic-teacher-student-satisfaction-survey',
  },
  'academic-teacher-lecture-observation-score': {
    tableKey: '026',
    label: '听课打分表',
    componentKey: 'academic-teacher-lecture-observation-score',
  },
  'academic-teacher-yearly-lecture-scores': {
    tableKey: '027',
    label: '年份听课成绩表',
    componentKey: 'academic-teacher-yearly-lecture-scores',
  },
  'academic-teacher-lecture-monthly-score': {
    tableKey: '028',
    label: '听课成绩表（月度）',
    componentKey: 'academic-teacher-lecture-monthly-score',
  },
  'academic-teacher-stress-interview-scores': {
    tableKey: '029',
    label: '压力面试成绩表',
    componentKey: 'academic-teacher-stress-interview-scores',
  },
  'academic-culture-presentation-plan': {
    tableKey: '030',
    label: '企业文化宣讲计划表',
    componentKey: 'academic-culture-presentation-plan',
  },
  'academic-culture-exam-plan': {
    tableKey: '031',
    label: '企业文化考试成绩表',
    componentKey: 'academic-culture-exam-plan',
  },
} as const satisfies Record<string, ComponentMeta>

export type MenuKey = keyof typeof COMPONENT_META

export const DEFAULT_MENU_KEY: MenuKey = 'mgmt-core-summary'

export type ComponentConfig = {
  tableKey: string
  label: string
  component: LazyComponent
}

/**
 * 生成组件配置映射
 */
export const generateComponentConfigs = (): Record<MenuKey, ComponentConfig> => {
  return Object.entries(COMPONENT_META).reduce(
    (acc, [key, meta]) => {
      const componentKey = meta.componentKey as LazyComponentKey
      const component = LAZY_COMPONENTS[componentKey]
      if (component) {
        acc[key as MenuKey] = {
          tableKey: meta.tableKey,
          label: meta.label,
          component,
        }
      }
      return acc
    },
    {} as Record<MenuKey, ComponentConfig>,
  )
}
