/**
 * 路由组件懒加载配置
 * 统一管理所有路由对应的组件导入
 *
 * 注意：此文件仅保留与菜单项绑定的路由组件
 * 参考菜单配置：config/ui/menuItems.tsx
 */
import { lazyWithRetry } from '../../utils/lazyWithRetry'

// 独立路由组件（与菜单绑定）
export const routeComponents = {
  'approval-center': lazyWithRetry(() => import('../../pages/approvals')),

  // ==================== 测试页面 ====================
  'campus-selector-demo': lazyWithRetry(() => import('../../pages/test/CampusSelectorDemo')),
  'baidu-api-test': lazyWithRetry(() => import('../../pages/test/BaiduApiTest')),

  // ==================== 最高议事厅 ====================
  // 最高议事厅 -> 智慧司（核心业务数据汇总）
  'academic-mgnt-core-business-summary-all': lazyWithRetry(
    () => import('../../pages/academic/mgnt/AcademicCoreBusinessSummaryAll'),
  ),
  // 最高议事厅 -> 教化司（核心业务数据汇总）
  'teaching-quality-mgnt-core-business-summary-all': lazyWithRetry(
    () => import('../../pages/teaching-quality/mgnt/AllPages'),
  ),

  // 最高议事厅 -> 市场部
  'market-online-promotion-stage-report': lazyWithRetry(
    () => import('../../pages/market/3-Marketing-Online-Promotion-Stage-Report'),
  ),
  'market-newmedia-phase-report': lazyWithRetry(
    () => import('../../pages/market/3-new-media-phase-report'),
  ),
  'market-account-sentiment': lazyWithRetry(
    () => import('../../pages/market/19-market-dept-campus-newmedia-account-sentiment-register'),
  ),
  'market-meeting-record': lazyWithRetry(
    () => import('../../pages/market/18-market-dept-meeting-record'),
  ),
  'market-partner-contacts': lazyWithRetry(
    () => import('../../pages/market/16_Marketing_Partner_Contacts/index'),
  ),
  'market-employee-interview-records': lazyWithRetry(
    () => import('../../pages/market/17_Marketing_Employee_Interview_Records/index'),
  ),
  'market-training-summary': lazyWithRetry(
    () => import('../../pages/market/15_Marketing_Training_Summary/index'),
  ),
  'market-network-plan': lazyWithRetry(
    () => import('../../pages/market/12-Marketing-Network-Plan/index'),
  ),
  'market-monthly-detail-plan': lazyWithRetry(
    () => import('../../pages/market/Marketing-Monthly-Detail-Plan/index'),
  ),
  'market-network-consultant-report': lazyWithRetry(
    () => import('../../pages/market/9-market_network_consultant_report'),
  ),
  'market-newmedia-edit-report': lazyWithRetry(
    () => import('../../pages/market/8-marketing_newmedia_edit_report'),
  ),
  'market-staff-function-analysis': lazyWithRetry(
    () => import('../../pages/market/11-Marketing-Staff-Function-Analysis/index'),
  ),
  'market-monthly-business-progress': lazyWithRetry(
    () => import('../../pages/market/10-Marketing-Monthly-Business-Progress/index'),
  ),
  'market-sem-daily-data': lazyWithRetry(
    () => import('../../pages/market/5-Marketing-SEM-Daily-Data/index'),
  ),
  'market-online-partner-daily-data': lazyWithRetry(
    () => import('../../pages/market/6-Marketing-Online-Partner-Daily-Data/index'),
  ),
  'market-daily-reputation-data': lazyWithRetry(
    () => import('../../pages/market/7-Marketing-Department-Daily-Reputation-Data/index'),
  ),
  'market-newmedia-daily-data': lazyWithRetry(
    () => import('../../pages/market/4-New-Media-for-the-Market/index'),
  ),
  'market-free-promotion-daily-data': lazyWithRetry(
    () => import('../../pages/market/20-Marketing-Free Promotion-Daily-Data/index'),
  ),

  // 最高议事厅 -> 祈福司

  'consult-mgnt-center-dashboard': lazyWithRetry(
    () => import('../../pages/consult/001-mgnt-center-dashboard/index'),
  ),
  'consult-campus-yearly-monthly-media': lazyWithRetry(
    () => import('../../pages/consult/002-campus-yearly-monthly-media-source/index'),
  ),
  'consult-daily-consulting-summary-new': lazyWithRetry(
    () =>
      import('../../pages/consult/002-campus-yearly-monthly-media-source/005-daily-consulting-summary-new/index'),
  ),
  'consult-consultant-data-summary-v3': lazyWithRetry(
    () =>
      import('../../pages/consult/002-campus-yearly-monthly-media-source/003-consultant-data-summary-v3/index'),
  ),
  'consult-mgnt-center-core-data': lazyWithRetry(
    () => import('../../pages/consult/004mgmt-data/007-financial-income/index'),
  ),
  'consult-hr-basic-table': lazyWithRetry(
    () => import('../../pages/consult/004mgmt-data/008-hr-basic/index'),
  ),
  'consult-staff-function': lazyWithRetry(
    () => import('../../pages/consult/004mgmt-data/009-staff-function/index'),
  ),
  'consult-channel-staffing': lazyWithRetry(
    () => import('../../pages/consult/004mgmt-data/010-staffing/index'),
  ),
  'consult-entry-exit-summary': lazyWithRetry(
    () => import('../../pages/consult/004mgmt-data/011-entry-exit/1-EntryExitSummaryPage'),
  ),
  'consult-staff-interview': lazyWithRetry(
    () => import('../../pages/consult/004mgmt-data/012-staff-interview/index'),
  ),
  'consult-meeting-record': lazyWithRetry(
    () => import('../../pages/consult/004mgmt-data/013-meeting-record/index'),
  ),
  'consult-type-count-system': lazyWithRetry(
    () => import('../../pages/consult/type-count-system/index'),
  ),
  'consult-my-consultations': lazyWithRetry(
    () => import('../../pages/consult/type-count-system/MyConsultations'),
  ),
  'consult-my-channel-consultations': lazyWithRetry(
    () => import('../../pages/consult/type-count-system/MyChannelConsultations'),
  ),
  'consult-consultation-records': lazyWithRetry(
    () => import('../../pages/consult/type-count-system/ConsultationRecords'),
  ),
  'consult-export-approval': lazyWithRetry(
    () => import('../../pages/consult/export-approval/index'),
  ),
  'consult-culture-training-summary': lazyWithRetry(
    () => import('../../pages/consult/005-culture-training/consulting-training-summary/index'),
  ),
  'consult-daily-consulting-register': lazyWithRetry(
    () => import('../../pages/consult/003-campus-basic-data/006-daily-consulting-register/index'),
  ),
  'consult-population-data-summary': lazyWithRetry(
    () => import('../../pages/consult/003-campus-basic-data/004-population-data-summary/index'),
  ),
  // 最高议事厅 -> 祈福司 -> 04.管理数据
  'consult-mgmt-data-phone-check': lazyWithRetry(
    () => import('../../pages/consult/004mgmt-data/014-phone-check/PhoneCheck'),
  ),
  'consult-mgmt-data-face-to-face-check': lazyWithRetry(
    () => import('../../pages/consult/004mgmt-data/015-face-to-face-check/FaceToFaceCheck'),
  ),

  // 最高议事厅 -> 人事部
  // 核心数据
  'humanresources-000-personal-info-dashboard': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/000-personal-info-dashboard'),
  ),
  'humanresources-001-annual-comprehensive-dashboard': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/001-annual-comprehensive-dashboard'),
  ),
  // 集团总部
  'humanresources-hq-002-annual-dashboard': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/hq-002-annual-dashboard'),
  ),
  'humanresources-hq-003-monthly-dashboard': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/hq-003-monthly-dashboard'),
  ),
  'humanresources-hq-004-daily-dashboard': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/hq-004-daily-dashboard'),
  ),
  'humanresources-hq-005-employee-archive': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/hq-005-employee-archive'),
  ),
  // 线上事业部
  'humanresources-online-002-annual-dashboard': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/online-002-annual-dashboard'),
  ),
  'humanresources-online-003-monthly-dashboard': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/online-003-monthly-dashboard'),
  ),
  'humanresources-online-004-daily-dashboard': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/online-004-daily-dashboard'),
  ),
  'humanresources-online-005-employee-archive': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/online-005-employee-archive'),
  ),
  // 线下事业部
  'humanresources-offline-002-annual-dashboard': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/offline-002-annual-dashboard'),
  ),
  'humanresources-offline-003-monthly-dashboard': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/offline-003-monthly-dashboard'),
  ),
  'humanresources-offline-004-daily-dashboard': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/offline-004-daily-dashboard'),
  ),
  'humanresources-offline-005-employee-archive': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/offline-005-employee-archive'),
  ),
  // 基础数据
  'humanresources-base-006-training-management': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/base-006-training-management'),
  ),
  'humanresources-base-006-hr-planning': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/base-006-hr-planning'),
  ),
  'humanresources-base-006-social-insurance': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/base-006-social-insurance'),
  ),
  'humanresources-base-006-recruitment-onboarding': lazyWithRetry(
    () => import('../../pages/human-resources/humanresources/base-006-recruitment-onboarding'),
  ),
  'system-config-master': lazyWithRetry(() => import('../../pages/system/config/master-data')),
  'system-config-employee': lazyWithRetry(
    () => import('../../pages/system/config/employeer_mangage'),
  ),
  'system-config-media-source': lazyWithRetry(
    () => import('../../pages/system/config/media-source-config'),
  ),
  'system-config-permission': lazyWithRetry(
    () => import('../../pages/system/config/permission-management'),
  ),
  'system-logs': lazyWithRetry(() => import('../../pages/logs')),

  // ==================== 神殿 -> 智慧司 ====================
  // 核心数据
  'campus-core-data-summary': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/01-core-data/1-core-data-summary/AllCampusCoreBusiness'),
  ),
  'campus-employment-goals-results-tabs': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/01-core-data/2-campus-employment-goals-results/employment-goals-results-tabs'),
  ),
  'campus-reputation-goals-results': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/01-core-data/3-campus-reputation-goals-results/index'),
  ),
  'campus-stability-stats': lazyWithRetry(
    () => import('../../pages/academic/campus/01-core-data/4-campus-stability-stats/index'),
  ),

  // 学员就业
  'campus-class-employment-detail': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/02-stu-employment/5-camps-class-employment-detail/index'),
  ),
  'campus-project-plan': lazyWithRetry(
    () => import('../../pages/academic/campus/02-stu-employment/6-campus-project-plan.tsx/index'),
  ),
  'campus-class-salary-estimate': lazyWithRetry(
    () => import('../../pages/academic/campus/02-stu-employment/7-campus-salary-prediction/index'),
  ),
  'campus-class-course-schedule': lazyWithRetry(
    () => import('../../pages/academic/campus/02-stu-employment/8-course-schedule/index'),
  ),
  'campus-class-assignment-score': lazyWithRetry(
    () => import('../../pages/academic/campus/02-stu-employment/9-class-assignment-grades/index'),
  ),
  'campus-class-exam-score': lazyWithRetry(
    () => import('../../pages/academic/campus/02-stu-employment/10-class-exam-scores/index'),
  ),
  'campus-class-project-score': lazyWithRetry(
    () => import('../../pages/academic/campus/02-stu-employment/11-class-project-scores/index'),
  ),
  'campus-class-pressure-interview-score': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/02-stu-employment/12-class-press-interview-scores/index'),
  ),
  'campus-student-satisfaction-score': lazyWithRetry(
    () => import('../../pages/academic/campus/02-stu-employment/13-student-satisfaction.tsx/index'),
  ),
  'campus-class-lecture-score': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/02-stu-employment/14-campus-class-academic-lecture-score/index'),
  ),

  // 口碑招生
  'campus-reputation-work-self-check': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/03-reputation-enrollment/15-academic-reputation-work-self-check/index'),
  ),
  'campus-reputation-keypoint-summary': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/03-reputation-enrollment/16-reputation-enrollment-key-points'),
  ),
  'campus-student-interview-record': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/03-reputation-enrollment/17-class-student-interview-record/6-student-interview-table'),
  ),

  // 新生维稳
  'campus-daily-new-student-schedule': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/04-stu-stability/18-new-student-schedule/NewStudentArrangementReadOnly'),
  ),

  // 管理数据
  'campus-academic-staff-kpi-plan': lazyWithRetry(
    () => import('../../pages/academic/campus/05-manage-data/19-kpi-plan'),
  ),
  'campus-academic-staff-performance-reward-punishment': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/05-manage-data/20-academic-staff-performance-reward-punishment'),
  ),
  'academic-campus-05-manage-data-21-academic-staff-class-hour-summary': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/05-manage-data/21-academic-staff-class-hour-summary/index'),
  ),
  'academic-campus-05-manage-data-22-academic-staff-class-hour-stats-4-teacher-hour-stats':
    lazyWithRetry(
      () =>
        import('../../pages/academic/campus/05-manage-data/22-academic-staff-class-hour-stats/4-teacher-hour-stats'),
    ),
  'academic-campus-05-manage-data-23-academic-staff-interview-record': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/05-manage-data/23-academic-staff-interview-record/index'),
  ),
  'campus-academic-staff-standard-check': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/05-manage-data/24-academic-staff-standard-check/standardization-check'),
  ),
  'academic-campus-05-manage-data-25-academic-staff-daily-work-order-7-daily-work-summary':
    lazyWithRetry(
      () =>
        import('../../pages/academic/campus/05-manage-data/25-academic-staff-daily-work-order/7-daily-work-summary'),
    ),
  'academic-campus-05-manage-data-26-academic-metting-record': lazyWithRetry(
    () => import('../../pages/academic/campus/05-manage-data/26-academic-metting-record/index'),
  ),
  'academic-campus-05-manage-data-27-academic-teacher-function-analysis': lazyWithRetry(
    () =>
      import('../../pages/academic/campus/05-manage-data/27-academic-teacher-function-analysis/index'),
  ),

  // 企业文化
  'academic-campus-06-enterprise-culture-1-culture-presentation-plan': lazyWithRetry(
    () => import('../../pages/academic/campus/06-enterprise-culture/1-culture-presentation-plan'),
  ),
  'academic-campus-06-enterprise-culture-2-culture-exam-plan': lazyWithRetry(
    () => import('../../pages/academic/campus/06-enterprise-culture/2-culture-exam-plan'),
  ),

  // ==================== 神殿 -> 测试（教化司核心数据 Excel） ====================

  'campus-test-employment-star': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/1-core-data/2-student-employment/TAB1class-employment-summary/2-campusBackendEmploymentStar'),
  ),
  // 教化司核心数据汇总（测试入口） -> /teaching-quality/core-data
  'campus-test-core-data-002': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/1-core-data/1-core-data-summary/1-core-data/CampusCoreDataSummaryAllPage'),
  ),

  // 神殿 -> 教化司 · 学员就业目标与结果汇总
  'campus-tq-employment-goals-results': lazyWithRetry(
    () => import('../../pages/teaching-quality/campus/1-core-data/2-student-employment/TAB-index'),
  ),

  // 神殿 -> 教化司 · 学员就业 - 班级就业汇总表
  'campus-tq-class-employment-summary-page': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/1-core-data/2-student-employment/TAB1class-employment-summary/1-campusBackendEmploymentClassSummary'),
  ),

  // 神殿 -> 教化司 · 学员就业 - 就业明星表格
  'campus-tq-employment-star-table': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/1-core-data/2-student-employment/TAB1class-employment-summary/components/2-EmploymentStarTableComponent'),
  ),

  // 神殿 -> 教化司 · 学员就业 - 班级就业汇总表格
  'campus-tq-class-employment-summary-table': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/1-core-data/2-student-employment/TAB1class-employment-summary/components/1-ClassEmploymentSummaryTableCompent'),
  ),

  // 神殿 -> 教化司 · 学员就业 - 班级就业信息表入口
  'campus-tq-class-employment-info-index': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/1-core-data/2-student-employment/TAB2ClassEmploymentInfoTable/TAB2-index'),
  ),

  // 神殿 -> 教化司 · 学员就业 - 班级就业信息表格
  'campus-tq-class-employment-info-table': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/1-core-data/2-student-employment/TAB2ClassEmploymentInfoTable/1-ClassEmploymentInfoTable'),
  ),

  // 神殿 -> 教化司 · 学员就业 - 班级就业信息汇总
  'campus-tq-class-employment-info-summary': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/1-core-data/2-student-employment/TAB2ClassEmploymentInfoTable/2-summary'),
  ),

  // 神殿 -> 教化司 · 学员就业 - 班级就业汇总表（index页面）
  'campus-tq-class-employment-summary-index': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/1-core-data/2-student-employment/TAB1class-employment-summary/2-campusBackendEmploymentStar'),
  ),

  // 神殿 -> 教化司 · 口碑招生目标与结果汇总
  'campus-tq-reputation-goals-results': lazyWithRetry(
    () => import('@/pages/teaching-quality/campus/1-core-data/3-reputation-enrollment/TAB-index'),
  ),

  // 神殿 -> 教化司 · 新生维稳统计表
  'campus-tq-stability-stats': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/1-core-data/4-new-student-stability/TAB-index'),
  ),

  // 神殿 -> 教化司 · 升学计划表
  'campus-tq-promotion-plan': lazyWithRetry(
    () => import('../../pages/teaching-quality/campus/1-core-data/5-promotion-education/TAB-index'),
  ),

  // 神殿 -> 教化司 · 学员异动表
  'campus-tq-student-movement-application': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/2-stu-emmplyment/8-student-movement-application'),
  ),
  'campus-tq-student-movement': lazyWithRetry(
    () => import('../../pages/teaching-quality/campus/1-core-data/6-stu-movement/index'),
  ),

  // 神殿 -> 教化司 · 宿舍统计表
  'campus-tq-dormitory-statistics': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/1-core-data/7-dormitory-statistics/TAB-index'),
  ),

  // 神殿 -> 教化司 · 学籍管理表
  'campus-tq-enrollment-statistics': lazyWithRetry(
    () => import('../../pages/teaching-quality/campus/1-core-data/8-enrollment-statistics'),
  ),

  // 神殿 -> 教化司 · 管理数据（023-028）
  'campus-tq-employee-function-analysis': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/6-management-data/23-employee-function-analysis/index'),
  ),
  'campus-tq-employee-kpi-plan': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/6-management-data/24-employee-kpi-plan/index'),
  ),
  'campus-tq-employee-interview-form': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/6-management-data/25-Employee Interview Form/index'),
  ),
  'campus-tq-meeting-record': lazyWithRetry(
    () => import('../../pages/teaching-quality/campus/6-management-data/26-meeting-record/index'),
  ),
  'campus-tq-homeroom-teacher-standardization': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/6-management-data/27-homeroom-teacher-standardization/index'),
  ),
  'campus-tq-homeroom-teacher-daily-work': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/6-management-data/28-homeroom-teacher-daily-work/index'),
  ),
  'campus-tq-training-plan-score-detail': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/6-management-data/29-tq-training-plan-score-detail/index'),
  ),

  // 神殿 -> 教化司 · 班级就业明细表
  'campus-tq-class-employment-detail': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/2-stu-emmplyment/1-class-employment-detail/TAB-index'),
  ),

  // 神殿 -> 教化司 · 就业期计划与监督表
  'campus-tq-employment-period-plan-supervision': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/2-stu-emmplyment/2-class-employment-period-plan-supervision'),
  ),

  // 神殿 -> 教化司 · 强化期计划与监督表
  'campus-tq-intensify-period-plan-supervision': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/2-stu-emmplyment/3-class-intensify-period-plan-supervision'),
  ),

  // 神殿 -> 教化司 · 班薪资预估表
  'campus-tq-class-salary-estimate': lazyWithRetry(
    () => import('../../pages/teaching-quality/campus/2-stu-emmplyment/4-class-salary-estimate'),
  ),

  // 神殿 -> 教化司 · 班档案表
  'campus-tq-class-file-record': lazyWithRetry(
    () => import('../../pages/teaching-quality/campus/2-stu-emmplyment/5-class-file-record'),
  ),

  // 神殿 -> 教化司 · 交接列表
  'campus-tq-handover-list': lazyWithRetry(
    () => import('../../pages/teaching-quality/campus/2-stu-emmplyment/12-handover-list'),
  ),

  // 神殿 -> 教化司 · 班千分制
  'campus-tq-class-thousand-score': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/2-stu-emmplyment/6-class-thousand-score-system'),
  ),

  // 神殿 -> 教化司 · 班级情况表
  'campus-tq-class-status': lazyWithRetry(
    () => import('../../pages/teaching-quality/campus/2-stu-emmplyment/7-class-status-summary'),
  ),

  // 神殿 -> 教化司 · 压力面试成绩表
  'campus-tq-pressure-interview-score': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/2-stu-emmplyment/10-class-pressure-interview-score'),
  ),
  // 神殿 -> 教化司 · 压力面试打分表
  'campus-tq-pressure-interview-rating': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/2-stu-emmplyment/11-class-pressure-interview-rating/index'),
  ),

  // 神殿 -> 教化司 · 企业文化宣讲计划表
  'campus-tq-culture-presentation-plan': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/7-enterprise-culture/1-corporate-culture-presentation-plan'),
  ),

  // 神殿 -> 教化司 · 企业文化考试计划表
  'campus-tq-culture-exam-score': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/7-enterprise-culture/1-corporate-culture-exam'),
  ),

  // 神殿 -> 教化司 · 住宿费交款通知及自查表
  'campus-tq-dorm-fee-notice-self-check': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/2-stu-emmplyment/9-dormitory-fee-notice-and-self-check/DormitorySelfCheckSummarySheet'),
  ),

  // 神殿 -> 教化司 · 口碑招生计划与执行统计表
  'campus-tq-reputation-work-self-check': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/3-reputation-enrollment/1-ReputationEnrollmentPlanExecutionTable/index'),
  ),

  // 神殿 -> 教化司 · 口碑关键点结果汇总/明细
  'campus-tq-reputation-keypoint-summary': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/3-reputation-enrollment/2-reputation-keypoint-summary/index'),
  ),

  // 神殿 -> 教化司 · 活动计划安排表
  'campus-tq-activity-plan-arrangement': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/3-reputation-enrollment/3-activity-plan-arrangement-table/index'),
  ),

  // 神殿 -> 教化司 · 后端每日新生安排表
  'campus-tq-daily-new-student-schedule': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/4-stu-stability/1-daily-new-student-schedule/index'),
  ),

  // 神殿 -> 教化司 · 学员访谈记录表
  'campus-tq-student-interview-record': lazyWithRetry(
    () =>
      import('../../pages/teaching-quality/campus/3-reputation-enrollment/4-interview-record/index'),
  ),

  // 神殿 -> 教化司 · 提升升学 - 升学计划表
  'campus-tq-promotion-upgrade-plan': lazyWithRetry(
    () => import('../../pages/teaching-quality/campus/5-promotion/PromotionUpgradeMainPage'),
  ),

  // ==================== 诸神殿页面 ====================
  'god-temple': lazyWithRetry(
    () => import('../../pages/god/GodTemple'),
  ),

  // ==================== 原始数据管理页面 ====================
  'raw-data': lazyWithRetry(
    () => import('../../pages/admin/RawData'),
  ),
} as const

export const CoreDataPage = lazyWithRetry(
  () => import('../../pages/academic/teaching-content/index'),
)

// 合并所有路由组件
export const ALL_ROUTE_COMPONENTS = {
  ...routeComponents,
} as const

// 根据路由 key 获取组件
export const getRouteComponent = (key: string) => {
  return ALL_ROUTE_COMPONENTS[key as keyof typeof ALL_ROUTE_COMPONENTS]
}
