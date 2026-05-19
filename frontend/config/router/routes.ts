/**
 * 路由路径配置
 * 定义所有路由的路径、类型和元数据
 *
 * 注意：此文件仅保留与菜单项绑定的路由
 * 参考菜单配置：config/ui/menuItems.tsx
 */

export type RouteType = 'standalone' | 'core-data' | 'external'

export interface RouteConfig {
  key: string // 路由唯一标识
  path: string // 路由路径
  type: RouteType // 路由类型
  menuKey?: string // 如果是 core-data 类型，指定 menu 参数
  meta: {
    title: string // 页面标题
    requiresAuth?: boolean // 是否需要认证
    icon?: string // 图标名称（可选）
    permission?: string // 需要的权限代码（可选）
    roles?: string[] // 需要的角色代码列表（可选）
    hidden?: boolean // 是否隐藏（可选）
  }
}

// 独立路由（与菜单绑定）
export const STANDALONE_ROUTES: RouteConfig[] = [
  {
    key: 'approval-center',
    path: '/approvals',
    type: 'standalone',
    meta: { title: '审批中心', requiresAuth: true },
  },

  // ==================== 测试页面 ====================
  {
    key: 'campus-selector-demo',
    path: '/test/campus-selector-demo',
    type: 'standalone',
    meta: { title: 'CampusSelector 示例', requiresAuth: false },
  },
  {
    key: 'baidu-api-test',
    path: '/test/baidu-api',
    type: 'standalone',
    meta: { title: '百度API测试', requiresAuth: false },
  },

  // ==================== 最高议事厅 ====================
  // 最高议事厅 -> 智慧司
  {
    key: 'academic-mgnt-core-business-summary-all',
    path: '/academic-mgnt-core-business-summary-all',
    type: 'standalone',
    meta: {
      title: '最高议事厅·智慧司·核心业务数据汇总',
      requiresAuth: true,
      permission: 'academic.core_dashboard.view',
    },
  },
  // 最高议事厅 -> 教化司
  {
    key: 'teaching-quality-mgnt-core-business-summary-all',
    path: '/teaching-quality-mgnt-core-business-summary-all',
    type: 'standalone',
    meta: { title: '最高议事厅·教化司·核心业务数据汇总', requiresAuth: true },
  },

  // 最高议事厅 -> 市场部
  {
    key: 'market-online-promotion-stage-report',
    path: '/market/online-promotion-stage-report',
    type: 'standalone',
    meta: { title: '市场部-网推阶段业务汇报表', requiresAuth: true },
  },
  {
    key: 'market-newmedia-phase-report',
    path: '/market/newmedia-phase-report',
    type: 'standalone',
    meta: { title: '003市场部-新媒体阶段业务汇报表', requiresAuth: true },
  },
  {
    key: 'market-account-sentiment',
    path: '/market/account-sentiment',
    type: 'standalone',
    meta: { title: '市场部各校新媒体账号舆情登记表', requiresAuth: true },
  },
  {
    key: 'market-meeting-record',
    path: '/market/meeting-record',
    type: 'standalone',
    meta: { title: '市场部会议记录表', requiresAuth: true },
  },
  {
    key: 'market-partner-contacts',
    path: '/market/partner-contacts',
    type: 'standalone',
    meta: { title: '市场部合作方联系信息', requiresAuth: true },
  },
  {
    key: 'market-employee-interview-records',
    path: '/market/employee-interview-records',
    type: 'standalone',
    meta: { title: '市场部员工访谈记录表', requiresAuth: true },
  },
  {
    key: 'market-training-summary',
    path: '/market/training-summary',
    type: 'standalone',
    meta: { title: '市场部培训汇总表', requiresAuth: true },
  },
  {
    key: 'market-staff-function-analysis',
    path: '/market/staff-function-analysis',
    type: 'standalone',
    meta: { title: '市场部全员功能分析', requiresAuth: true },
  },
  {
    key: 'market-network-plan',
    path: '/market/network-plan',
    type: 'standalone',
    meta: { title: '市场部网络计划表', requiresAuth: true },
  },
  {
    key: 'market-monthly-detail-plan',
    path: '/market/monthly-detail-plan',
    type: 'standalone',
    meta: { title: '市场部月度详细计划', requiresAuth: true },
  },
  {
    key: 'market-network-consultant-report',
    path: '/market/network-consultant-report',
    type: 'standalone',
    meta: { title: '网络咨询师汇报表', requiresAuth: true },
  },
  {
    key: 'market-newmedia-edit-report',
    path: '/market/newmedia-edit-report',
    type: 'standalone',
    meta: { title: '新媒体剪辑汇报表', requiresAuth: true },
  },
  {
    key: 'market-monthly-business-progress',
    path: '/market/monthly-business-progress',
    type: 'standalone',
    meta: { title: '市场部本月业务推进表', requiresAuth: true },
  },
  {
    key: 'market-sem-daily-data',
    path: '/market/sem-daily-data',
    type: 'standalone',
    meta: { title: '市场部SEM日常数据表', requiresAuth: true },
  },
  {
    key: 'market-online-partner-daily-data',
    path: '/market/online-partner-daily-data',
    type: 'standalone',
    meta: { title: '市场部网络合作伙伴日度数据表', requiresAuth: true },
  },
  {
    key: 'market-free-promotion-daily-data',
    path: '/market/free-promotion-daily-data',
    type: 'standalone',
    meta: { title: '市场部免费推广日度数据表', requiresAuth: true },
  },
  {
    key: 'market-daily-reputation-data',
    path: '/market/daily-reputation-data',
    type: 'standalone',
    meta: { title: '市场部口碑日度数据表', requiresAuth: true },
  },
  {
    key: 'market-newmedia-daily-data',
    path: '/market/newmedia-daily-data',
    type: 'standalone',
    meta: { title: '市场部新媒体日度数据表', requiresAuth: true },
  },
  {
    key: 'market-monthly-data',
    path: '/market/monthly-data',
    type: 'standalone',
    meta: { title: '市场部月度数据表', requiresAuth: true },
  },
  {
    key: 'market-yearly-summary',
    path: '/market/yearly-summary',
    type: 'standalone',
    meta: { title: '最高议事厅市场部年度汇总表', requiresAuth: true },
  },

  {
    key: 'consult-mgnt-center-dashboard',
    path: '/consult/mgnt-center-dashboard',
    type: 'standalone',
    meta: { title: '001最高议事厅祈福司核心业务数据汇总', requiresAuth: true },
  },
  {
    key: 'consult-campus-yearly-monthly-media',
    path: '/consult/campus-yearly-monthly-media',
    type: 'standalone',
    meta: { title: '002神殿祈福司核心业务（月度）数据汇总', requiresAuth: true },
  },
  {
    key: 'consult-daily-consulting-summary-new',
    path: '/consult/campus-core-data/daily-consulting-summary',
    type: 'standalone',
    meta: { title: '005神殿祈福司前台数据汇总表', requiresAuth: true },
  },
  {
    key: 'consult-consultant-data-summary-v3',
    path: '/consult/campus-core-data/consultant-data-summary-v3',
    type: 'standalone',
    meta: { title: '003神殿祈福司个人业务数据汇总', requiresAuth: true },
  },
  {
    key: 'consult-population-data-summary',
    path: '/consult/campus-basic-data/population-data-summary',
    type: 'standalone',
    meta: { title: '004神殿各类人群转化数据表', requiresAuth: true },
  },
  {
    key: 'consult-mgnt-center-core-data',
    path: '/consulting/mgnt-center-core-data',
    type: 'standalone',
    meta: { title: '007神殿祈福司财务收入和退费', requiresAuth: true },
  },
  {
    key: 'consult-hr-basic-table',
    path: '/consulting/hr-basic-table',
    type: 'standalone',
    meta: { title: '008前端人力资源基础表（以人资为主）', requiresAuth: true },
  },
  {
    key: 'consult-staff-function',
    path: '/consulting/staff-function',
    type: 'standalone',
    meta: { title: '009员工职数和功能分析（以人资为主）', requiresAuth: true },
  },
  {
    key: 'consult-channel-staffing',
    path: '/consulting/channel-staffing',
    type: 'standalone',
    meta: { title: '010咨询和渠道职数（以人资为主）', requiresAuth: true },
  },
  {
    key: 'consult-entry-exit-summary',
    path: '/consult/entry-exit-summary',
    type: 'standalone',
    meta: { title: '011祈福司入职离职汇总表（以人资为主）', requiresAuth: true },
  },
  {
    key: 'consult-type-count-system',
    path: '/consult/type-count-system',
    type: 'standalone',
    meta: { title: '咨询量录入系统', requiresAuth: true },
  },
  {
    key: 'consult-my-consultations',
    path: '/consult/my-consultations',
    type: 'standalone',
    meta: { title: '017我的咨询量', requiresAuth: true },
  },
  {
    key: 'consult-my-channel-consultations',
    path: '/consult/my-channel-consultations',
    type: 'standalone',
    meta: { title: '我的渠道咨询量', requiresAuth: true },
  },
  {
    key: 'consult-consultation-records',
    path: '/consult/consultation-records',
    type: 'standalone',
    meta: { title: '018咨询记录', requiresAuth: true },
  },
  {
    key: 'consult-export-approval',
    path: '/consult/export-approval',
    type: 'standalone',
    meta: {
      title: '咨询量导出审批',
      requiresAuth: true,
      permission: 'consult.export.approve', // 需要审批权限
    },
  },
  {
    key: 'consult-culture-training-summary',
    path: '/consult/culture-training/consulting-training-summary',
    type: 'standalone',
    meta: { title: '016祈福司培训汇总表', requiresAuth: true },
  },
  {
    key: 'consult-daily-consulting-register',
    path: '/consult/campus-basic-data/daily-consulting-register',
    type: 'standalone',
    meta: { title: '006神殿每日咨询量登记表', requiresAuth: true },
  },
  // 最高议事厅 -> 祈福司 -> 04.管理数据
  {
    key: 'consult-staff-interview',
    path: '/consult/mgmt-data/staff-interview',
    type: 'standalone',
    meta: { title: '012祈福司员工访谈记录表', requiresAuth: true },
  },
  {
    key: 'consult-meeting-record',
    path: '/consult/mgmt-data/meeting-record',
    type: 'standalone',
    meta: { title: '013祈福司会议记录表', requiresAuth: true },
  },
  {
    key: 'consult-mgmt-data-phone-check',
    path: '/consult/mgmt-data/phone-check',
    type: 'standalone',
    meta: { title: '014电话标准化检查', requiresAuth: true },
  },
  {
    key: 'consult-mgmt-data-face-to-face-check',
    path: '/consult/mgmt-data/face-to-face-check',
    type: 'standalone',
    meta: { title: '015当面标准化检查', requiresAuth: true },
  },

  // ==================== 最高议事厅 -> 人事部 ====================
  // 人事部 -> 核心数据
  {
    key: 'humanresources-000-personal-info-dashboard',
    path: '/humanresources/core/personal-info-dashboard',
    type: 'standalone',
    meta: { title: '人事部·000集团个人信息数据看板', requiresAuth: true },
  },
  {
    key: 'humanresources-001-annual-comprehensive-dashboard',
    path: '/humanresources/core/annual-comprehensive-dashboard',
    type: 'standalone',
    meta: { title: '人事部·001集团人力资源年度综合看板', requiresAuth: true },
  },

  // 人事部 -> 集团总部
  {
    key: 'humanresources-hq-002-annual-dashboard',
    path: '/humanresources/hq/annual-dashboard',
    type: 'standalone',
    meta: { title: '人事部·002最高议事厅年度核心数据看板', requiresAuth: true },
  },
  {
    key: 'humanresources-hq-003-monthly-dashboard',
    path: '/humanresources/hq/monthly-dashboard',
    type: 'standalone',
    meta: { title: '人事部·003最高议事厅月度核心数据看板', requiresAuth: true },
  },
  {
    key: 'humanresources-hq-004-daily-dashboard',
    path: '/humanresources/hq/daily-dashboard',
    type: 'standalone',
    meta: { title: '人事部·004最高议事厅日度核心数据看板', requiresAuth: true },
  },
  {
    key: 'humanresources-hq-005-employee-archive',
    path: '/humanresources/hq/employee-archive',
    type: 'standalone',
    meta: { title: '人事部·005最高议事厅-员工档案表', requiresAuth: true },
  },

  // 人事部 -> 线上事业部
  {
    key: 'humanresources-online-002-annual-dashboard',
    path: '/humanresources/online/annual-dashboard',
    type: 'standalone',
    meta: { title: '人事部·002线上-年度核心数据看板', requiresAuth: true },
  },
  {
    key: 'humanresources-online-003-monthly-dashboard',
    path: '/humanresources/online/monthly-dashboard',
    type: 'standalone',
    meta: { title: '人事部·003线上-月度核心数据看板', requiresAuth: true },
  },
  {
    key: 'humanresources-online-004-daily-dashboard',
    path: '/humanresources/online/daily-dashboard',
    type: 'standalone',
    meta: { title: '人事部·004线上-日度核心数据看板', requiresAuth: true },
  },
  {
    key: 'humanresources-online-005-employee-archive',
    path: '/humanresources/online/employee-archive',
    type: 'standalone',
    meta: { title: '人事部·005线上-员工档案表', requiresAuth: true },
  },

  // 人事部 -> 线下事业部
  {
    key: 'humanresources-offline-002-annual-dashboard',
    path: '/humanresources/offline/annual-dashboard',
    type: 'standalone',
    meta: { title: '人事部·002线下-年度核心数据看板', requiresAuth: true },
  },
  {
    key: 'humanresources-offline-003-monthly-dashboard',
    path: '/humanresources/offline/monthly-dashboard',
    type: 'standalone',
    meta: { title: '人事部·003线下-月度核心数据看板', requiresAuth: true },
  },
  {
    key: 'humanresources-offline-004-daily-dashboard',
    path: '/humanresources/offline/daily-dashboard',
    type: 'standalone',
    meta: { title: '人事部·004线下-日度核心数据看板', requiresAuth: true },
  },
  {
    key: 'humanresources-offline-005-employee-archive',
    path: '/humanresources/offline/employee-archive',
    type: 'standalone',
    meta: { title: '人事部·005线下-员工档案表', requiresAuth: true },
  },

  // 人事部 -> 基础数据
  {
    key: 'humanresources-base-006-training-management',
    path: '/humanresources/base/training-management',
    type: 'standalone',
    meta: { title: '人事部·006集团人资基础-培训管理', requiresAuth: true },
  },
  {
    key: 'humanresources-base-006-hr-planning',
    path: '/humanresources/base/hr-planning',
    type: 'standalone',
    meta: { title: '人事部·006集团人资基础-人力资源规划', requiresAuth: true },
  },
  {
    key: 'humanresources-base-006-social-insurance',
    path: '/humanresources/base/social-insurance',
    type: 'standalone',
    meta: { title: '人事部·006集团人资基础-社保', requiresAuth: true },
  },
  {
    key: 'humanresources-base-006-recruitment-onboarding',
    path: '/humanresources/base/recruitment-onboarding',
    type: 'standalone',
    meta: { title: '人事部·006集团人资基础-招聘入职', requiresAuth: true },
  },
  {
    key: 'system-config-master',
    path: '/system/config/master-data',
    type: 'standalone',
    meta: { title: '系统配置·神殿/班级配置', requiresAuth: true },
  },
  {
    key: 'system-config-employee',
    path: '/system/config/employee-manage',
    type: 'standalone',
    meta: { title: '系统配置·员工管理', requiresAuth: true },
  },
  {
    key: 'system-config-media-source',
    path: '/system/config/media-source',
    type: 'standalone',
    meta: { title: '系统配置·咨询配置', requiresAuth: true },
  },
  {
    key: 'system-config-permission',
    path: '/system/config/permission',
    type: 'standalone',
    meta: { title: '系统配置·权限划分', requiresAuth: true },
  },
  {
    key: 'system-logs',
    path: '/logs',
    type: 'standalone',
    meta: { title: '日志中心', requiresAuth: true },
  },

  // ==================== 神殿 -> 智慧司 ====================
  // 核心数据
  {
    key: 'campus-core-data-summary',
    path: '/academic/campus/core-data-summary',
    type: 'standalone',
    meta: {
      title: '神殿·智慧司·核心业务数据汇总',
      requiresAuth: true,
      permission: 'academic.core_dashboard.view',
    },
  },
  {
    key: 'campus-employment-goals-results-tabs',
    path: '/campus-employment-goals-results-tabs',
    type: 'standalone',
    meta: { title: '就业目标与结果汇总', requiresAuth: true },
  },
  {
    key: 'campus-reputation-goals-results',
    path: '/campus-reputation-goals-results',
    type: 'standalone',
    meta: { title: '口碑招生目标与结果汇总表', requiresAuth: true },
  },
  {
    key: 'campus-stability-stats',
    path: '/campus-stability-stats',
    type: 'standalone',
    meta: { title: '新生维稳统计表', requiresAuth: true },
  },

  // 学员就业
  {
    key: 'campus-class-employment-detail',
    path: '/campus-class-employment-detail',
    type: 'standalone',
    meta: { title: '班级就业明细表', requiresAuth: true },
  },
  {
    key: 'campus-project-plan',
    path: '/campus-project-plan',
    type: 'standalone',
    meta: { title: '智慧司项目计划表', requiresAuth: true },
  },
  {
    key: 'campus-class-salary-estimate',
    path: '/campus-class-salary-estimate',
    type: 'standalone',
    meta: { title: '班薪资预估表', requiresAuth: true },
  },
  {
    key: 'campus-class-course-schedule',
    path: '/campus-class-course-schedule',
    type: 'standalone',
    meta: { title: '班排课表', requiresAuth: true },
  },
  {
    key: 'campus-class-assignment-score',
    path: '/campus-class-assignment-score',
    type: 'standalone',
    meta: { title: '班作业成绩表', requiresAuth: true },
  },
  {
    key: 'campus-class-exam-score',
    path: '/campus-class-exam-score',
    type: 'standalone',
    meta: { title: '班考试成绩表', requiresAuth: true },
  },
  {
    key: 'campus-class-project-score',
    path: '/campus-class-project-score',
    type: 'standalone',
    meta: { title: '班项目成绩表', requiresAuth: true },
  },
  {
    key: 'campus-class-pressure-interview-score',
    path: '/campus-class-pressure-interview-score',
    type: 'standalone',
    meta: { title: '班压力面试成绩表', requiresAuth: true },
  },
  {
    key: 'campus-student-satisfaction-score',
    path: '/campus-student-satisfaction-score',
    type: 'standalone',
    meta: { title: '学员满意度成绩表', requiresAuth: true },
  },
  {
    key: 'campus-class-lecture-score',
    path: '/campus-class-lecture-score',
    type: 'standalone',
    meta: { title: '听课成绩表', requiresAuth: true },
  },

  // 口碑招生
  {
    key: 'campus-reputation-work-self-check',
    path: '/campus-reputation-work-self-check',
    type: 'standalone',
    meta: { title: '口碑招生计划与执行统计表', requiresAuth: true },
  },
  {
    key: 'campus-reputation-keypoint-summary',
    path: '/campus-reputation-keypoint-summary',
    type: 'standalone',
    meta: { title: '口碑关键点结果汇总/明细', requiresAuth: true },
  },
  {
    key: 'campus-student-interview-record',
    path: '/campus-student-interview-record',
    type: 'standalone',
    meta: { title: '学员访谈记录表', requiresAuth: true },
  },

  // 新生维稳
  {
    key: 'campus-daily-new-student-schedule',
    path: '/campus-daily-new-student-schedule',
    type: 'standalone',
    meta: { title: '后端每日新生安排表', requiresAuth: true },
  },

  // 管理数据
  {
    key: 'campus-academic-staff-kpi-plan',
    path: '/campus-academic-staff-kpi-plan',
    type: 'standalone',
    meta: { title: '教员KPI计划表', requiresAuth: true },
  },
  {
    key: 'campus-academic-staff-performance-reward-punishment',
    path: '/campus-academic-staff-performance-reward-punishment',
    type: 'standalone',
    meta: { title: '教员业绩奖惩表', requiresAuth: true },
  },
  {
    key: 'academic-campus-05-manage-data-21-academic-staff-class-hour-summary',
    path: '/academic/campus/05-manage-data/21-academic-staff-class-hour-summary',
    type: 'standalone',
    meta: { title: '教员课时汇总表', requiresAuth: true },
  },
  {
    key: 'academic-campus-05-manage-data-22-academic-staff-class-hour-stats-4-teacher-hour-stats',
    path: '/academic/campus/05-manage-data/22-academic-staff-class-hour-stats/4-teacher-hour-stats',
    type: 'standalone',
    meta: { title: '教员课时统计表', requiresAuth: true },
  },
  {
    key: 'academic-campus-05-manage-data-23-academic-staff-interview-record',
    path: '/academic/campus/05-manage-data/23-academic-staff-interview-record',
    type: 'standalone',
    meta: { title: '教员访谈记录表', requiresAuth: true },
  },
  {
    key: 'campus-academic-staff-standard-check',
    path: '/campus/academic-staff-standard-check',
    type: 'standalone',
    meta: { title: '教员标准化检查表', requiresAuth: true },
  },
  {
    key: 'academic-campus-05-manage-data-25-academic-staff-daily-work-order-7-daily-work-summary',
    path: '/academic/campus/05-manage-data/25-academic-staff-daily-work-order/7-daily-work-summary',
    type: 'standalone',
    meta: { title: '教员日工单', requiresAuth: true },
  },
  {
    key: 'academic-campus-05-manage-data-26-academic-metting-record',
    path: '/academic/campus/05-manage-data/26-academic-metting-record',
    type: 'standalone',
    meta: { title: '会议记录表', requiresAuth: true },
  },
  {
    key: 'academic-campus-05-manage-data-27-academic-teacher-function-analysis',
    path: '/academic/campus/05-manage-data/27-academic-teacher-function-analysis',
    type: 'standalone',
    meta: { title: '教员功能分析总表', requiresAuth: true },
  },

  // 企业文化
  {
    key: 'academic-campus-06-enterprise-culture-1-culture-presentation-plan',
    path: '/academic/campus/06-enterprise-culture/1-culture-presentation-plan',
    type: 'standalone',
    meta: {
      title: '企业文化宣讲计划表',
      requiresAuth: true,
      permission: 'academic.enterprise_culture.presentation.view',
    },
  },
  {
    key: 'academic-campus-06-enterprise-culture-2-culture-exam-plan',
    path: '/academic/campus/06-enterprise-culture/2-culture-exam-plan',
    type: 'standalone',
    meta: {
      title: '企业文化考试计划表',
      requiresAuth: true,
      permission: 'academic.enterprise_culture.exam.view',
    },
  },

  // ==================== 神殿 -> 测试（教化司核心数据 Excel） ====================
  {
    key: 'campus-test-core-data-002',
    path: '/teaching-quality/core-data',
    type: 'standalone',
    meta: { title: '测试1 - 教化司核心业务数据汇总表', requiresAuth: true },
  },
  {
    key: 'campus-test-employment-star',
    path: '/test/employment-star',
    type: 'standalone',
    meta: { title: '测试 - 神殿后端就业明星汇总表', requiresAuth: true },
  },

  // 神殿 -> 教化司（学员就业目标与结果汇总）
  {
    key: 'campus-tq-employment-goals-results',
    path: '/teaching-quality/campus/employment-goals-results',
    type: 'standalone',
    meta: { title: '神殿·教化司·学员就业目标与结果汇总表', requiresAuth: true },
  },

  // 神殿 -> 教化司（学员就业）- 班级就业汇总表
  {
    key: 'campus-tq-class-employment-summary',
    path: '/teaching-quality/campus/1-core-data/2-student-employment/class-employment-summary',
    type: 'standalone',
    meta: { title: '神殿·教化司·班级就业汇总表', requiresAuth: true },
  },

  // 神殿 -> 教化司（学员就业）- 班级就业汇总表页面（1-campusBacnkendEmploymentClassSummary）
  {
    key: 'campus-tq-class-employment-summary-page',
    path: '/teaching-quality/campus/1-core-data/2-student-employment/class-employment-summary-page',
    type: 'standalone',
    meta: { title: '神殿·教化司·班级就业汇总表页面', requiresAuth: true },
  },

  // 神殿 -> 教化司（学员就业）- 班级就业汇总表入口（TAB1class-employment-summary/index）
  {
    key: 'campus-tq-class-employment-summary-index',
    path: '/teaching-quality/campus/1-core-data/2-student-employment/class-employment-summary-index',
    type: 'standalone',
    meta: { title: '神殿·教化司·班级就业汇总表入口', requiresAuth: true },
  },

  // 神殿 -> 教化司（学员就业）- 就业明星表格
  {
    key: 'campus-tq-employment-star-table',
    path: '/teaching-quality/campus/1-core-data/2-student-employment/employment-star-table',
    type: 'standalone',
    meta: { title: '神殿·教化司·就业明星汇总表', requiresAuth: true },
  },

  // 神殿 -> 教化司（学员就业）- 班级就业汇总表格
  {
    key: 'campus-tq-class-employment-summary-table',
    path: '/teaching-quality/campus/1-core-data/2-student-employment/class-employment-summary-table',
    type: 'standalone',
    meta: { title: '神殿·教化司·班级就业汇总表格', requiresAuth: true },
  },

  // 神殿 -> 教化司（学员就业）- 班级就业信息表入口
  {
    key: 'campus-tq-class-employment-info-index',
    path: '/teaching-quality/campus/1-core-data/2-student-employment/class-employment-info-index',
    type: 'standalone',
    meta: { title: '神殿·教化司·班级就业信息表', requiresAuth: true },
  },

  // 神殿 -> 教化司（学员就业）- 班级就业信息表格
  {
    key: 'campus-tq-class-employment-info-table',
    path: '/teaching-quality/campus/1-core-data/2-student-employment/class-employment-info-table',
    type: 'standalone',
    meta: { title: '神殿·教化司·班级就业信息表格', requiresAuth: true },
  },

  // 神殿 -> 教化司（学员就业）- 班级就业信息汇总
  {
    key: 'campus-tq-class-employment-info-summary',
    path: '/teaching-quality/campus/1-core-data/2-student-employment/class-employment-info-summary',
    type: 'standalone',
    meta: { title: '神殿·教化司·班级就业信息汇总', requiresAuth: true },
  },

  // 神殿 -> 教化司（口碑招生目标与结果汇总）
  {
    key: 'campus-tq-reputation-goals-results',
    path: '/teaching-quality/campus/reputation-goals-results',
    type: 'standalone',
    meta: { title: '神殿·教化司·口碑招生目标与结果汇总表', requiresAuth: true },
  },

  // 神殿 -> 教化司（新生维稳统计表）
  {
    key: 'campus-tq-stability-stats',
    path: '/teaching-quality/campus/new-student-stability',
    type: 'standalone',
    meta: { title: '神殿·教化司·新生维稳统计表', requiresAuth: true },
  },

  // 神殿 -> 教化司（升学计划表）
  {
    key: 'campus-tq-promotion-plan',
    path: '/teaching-quality/campus/promotion-education',
    type: 'standalone',
    meta: { title: '神殿·教化司·升学计划表', requiresAuth: true },
  },

  // 神殿 -> 教化司（学员异动表）
  {
    key: 'campus-tq-student-movement',
    path: '/teaching-quality/campus/student-movement',
    type: 'standalone',
    meta: { title: '神殿·教化司·学员异动表', requiresAuth: true },
  },

  // 神殿 -> 教化司（学员异动申请表）
  {
    key: 'campus-tq-student-movement-application',
    path: '/teaching-quality/campus/student-movement-application',
    type: 'standalone',
    meta: { title: '神殿·教化司·学员异动申请表', requiresAuth: true },
  },

  // 神殿 -> 教化司（宿舍统计表）
  {
    key: 'campus-tq-dormitory-statistics',
    path: '/teaching-quality/campus/dormitory-statistics',
    type: 'standalone',
    meta: { title: '神殿·教化司·宿舍统计表', requiresAuth: true },
  },

  // 神殿 -> 教化司（学籍管理表）
  {
    key: 'campus-tq-enrollment-statistics',
    path: '/teaching-quality/campus/enrollment-statistics',
    type: 'standalone',
    meta: { title: '神殿·教化司·学籍管理表', requiresAuth: true },
  },

  // 神殿 -> 教化司（管理数据 · 023-028）
  {
    key: 'campus-tq-employee-function-analysis',
    path: '/teaching-quality/campus/management-data/employee-function-analysis',
    type: 'standalone',
    meta: { title: '神殿·教化司·员工功能分析表（023）', requiresAuth: true },
  },
  {
    key: 'campus-tq-employee-kpi-plan',
    path: '/teaching-quality/campus/management-data/employee-kpi-plan',
    type: 'standalone',
    meta: { title: '神殿·教化司·员工KPI计划表（024）', requiresAuth: true },
  },
  {
    key: 'campus-tq-employee-interview-form',
    path: '/teaching-quality/campus/management-data/employee-interview-form',
    type: 'standalone',
    meta: { title: '神殿·教化司·员工访谈表（025）', requiresAuth: true },
  },
  {
    key: 'campus-tq-meeting-record',
    path: '/teaching-quality/campus/management-data/meeting-record',
    type: 'standalone',
    meta: { title: '神殿·教化司·会议记录表（026）', requiresAuth: true },
  },
  {
    key: 'campus-tq-homeroom-teacher-standardization',
    path: '/teaching-quality/campus/management-data/homeroom-teacher-standardization',
    type: 'standalone',
    meta: { title: '神殿·教化司·班主任标准化检查表（027）', requiresAuth: true },
  },
  {
    key: 'campus-tq-homeroom-teacher-daily-work',
    path: '/teaching-quality/campus/management-data/homeroom-teacher-daily-work',
    type: 'standalone',
    meta: { title: '神殿·教化司·班主任日工单（028）', requiresAuth: true },
  },
  {
    key: 'campus-tq-training-plan-score-detail',
    path: '/teaching-quality/campus/management-data/training-plan-score-detail',
    type: 'standalone',
    meta: { title: '神殿·教化司·教化司培训计划与成绩明细表（029）', requiresAuth: true },
  },

  // 神殿 -> 教化司（班级就业明细表）
  {
    key: 'campus-tq-class-employment-detail',
    path: '/teaching-quality/campus/class-employment-detail',
    type: 'standalone',
    meta: { title: '神殿·教化司·班级就业明细表', requiresAuth: true },
  },

  // 神殿 -> 教化司（就业期计划与监督表）
  {
    key: 'campus-tq-employment-period-plan-supervision',
    path: '/teaching-quality/campus/employment-period-plan-supervision',
    type: 'standalone',
    meta: { title: '神殿·教化司·就业期计划与监督表', requiresAuth: true },
  },

  // 神殿 -> 教化司（强化期计划与监督表）
  {
    key: 'campus-tq-intensify-period-plan-supervision',
    path: '/teaching-quality/campus/intensify-period-plan-supervision',
    type: 'standalone',
    meta: { title: '神殿·教化司·强化期计划与监督表', requiresAuth: true },
  },

  // 神殿 -> 教化司（班薪资预估表）
  {
    key: 'campus-tq-class-salary-estimate',
    path: '/teaching-quality/campus/class-salary-estimate',
    type: 'standalone',
    meta: { title: '神殿·教化司·班薪资预估表', requiresAuth: true },
  },

  // 神殿 -> 教化司（班档案表）
  {
    key: 'campus-tq-class-file-record',
    path: '/teaching-quality/campus/class-file-record',
    type: 'standalone',
    meta: { title: '神殿·教化司·班档案信息表', requiresAuth: true },
  },

  // 神殿 -> 教化司（交接列表）
  {
    key: 'campus-tq-handover-list',
    path: '/teaching-quality/campus/handover-list',
    type: 'standalone',
    meta: { title: '神殿·教化司·咨询量交接列表', requiresAuth: true },
  },

  // 神殿 -> 教化司（班千分制）
  {
    key: 'campus-tq-class-thousand-score',
    path: '/teaching-quality/campus/class-thousand-score-system',
    type: 'standalone',
    meta: { title: '神殿·教化司·班千分制每月累计统计', requiresAuth: true },
  },

  // 神殿 -> 教化司（班级情况表）
  {
    key: 'campus-tq-class-status',
    path: '/teaching-quality/campus/class-status-summary',
    type: 'standalone',
    meta: { title: '神殿·教化司·班级情况表', requiresAuth: true },
  },

  // 神殿 -> 教化司（压力面试成绩表）
  {
    key: 'campus-tq-pressure-interview-score',
    path: '/teaching-quality/campus/pressure-interview-score',
    type: 'standalone',
    meta: { title: '神殿·教化司·压力面试成绩表', requiresAuth: true },
  },
  // 神殿 -> 教化司（压力面试打分表）
  {
    key: 'campus-tq-pressure-interview-rating',
    path: '/teaching-quality/campus/pressure-interview-rating',
    type: 'standalone',
    meta: { title: '神殿·教化司·压力面试打分表', requiresAuth: true },
  },

  // 神殿 -> 教化司（企业文化宣讲计划表）
  {
    key: 'campus-tq-culture-presentation-plan',
    path: '/teaching-quality/campus/culture-presentation-plan',
    type: 'standalone',
    meta: { title: '神殿·教化司·企业文化宣讲计划表', requiresAuth: true },
  },

  // 神殿 -> 教化司（企业文化考试计划表）
  {
    key: 'campus-tq-culture-exam-score',
    path: '/teaching-quality/campus/culture-exam-score',
    type: 'standalone',
    meta: { title: '神殿·教化司·企业文化考试计划表', requiresAuth: true },
  },

  // 神殿 -> 教化司（住宿费交款通知及自查表）
  {
    key: 'campus-tq-dorm-fee-notice-self-check',
    path: '/teaching-quality/campus/dorm-fee-notice-self-check',
    type: 'standalone',
    meta: { title: '神殿·教化司·住宿费交款通知及自查表', requiresAuth: true },
  },

  // 神殿 -> 教化司（口碑招生计划与执行统计表）
  {
    key: 'campus-tq-reputation-work-self-check',
    path: '/teaching-quality/campus/reputation-work-self-check',
    type: 'standalone',
    meta: { title: '神殿·教化司·口碑招生计划与执行统计表', requiresAuth: true },
  },

  // 神殿 -> 教化司（口碑关键点结果汇总/明细）
  {
    key: 'campus-tq-reputation-keypoint-summary',
    path: '/teaching-quality/campus/reputation-keypoint-summary',
    type: 'standalone',
    meta: { title: '神殿·教化司·口碑关键点结果汇总/明细', requiresAuth: true },
  },

  // 神殿 -> 教化司（活动计划安排表）
  {
    key: 'campus-tq-activity-plan-arrangement',
    path: '/teaching-quality/campus/activity-plan-arrangement',
    type: 'standalone',
    meta: { title: '神殿·教化司·活动计划安排表', requiresAuth: true },
  },

  // 神殿 -> 教化司（后端每日新生安排表）
  {
    key: 'campus-tq-daily-new-student-schedule',
    path: '/teaching-quality/campus/daily-new-student-schedule',
    type: 'standalone',
    meta: { title: '神殿·教化司·后端每日新生安排表', requiresAuth: true },
  },

  // 神殿 -> 教化司（学员访谈记录表）
  {
    key: 'campus-tq-student-interview-record',
    path: '/teaching-quality/campus/student-interview-record',
    type: 'standalone',
    meta: { title: '神殿·教化司·学员访谈记录表', requiresAuth: true },
  },

  // 神殿 -> 教化司（提升升学 - 升学计划表）
  {
    key: 'campus-tq-promotion-upgrade-plan',
    path: '/teaching-quality/campus/promotion-upgrade-plan',
    type: 'standalone',
    meta: { title: '神殿·教化司·升学计划表', requiresAuth: true },
  },

  // ==================== 诸神殿页面 ====================
  {
    key: 'god-temple',
    path: '/god-temple',
    type: 'standalone',
    meta: { title: '诸神殿', requiresAuth: false, icon: 'crown' },
  },

  // ==================== 原始数据管理页面 ====================
  {
    key: 'raw-data',
    path: '/raw-data',
    type: 'standalone',
    meta: { title: '原始数据', requiresAuth: false, icon: 'database', hidden: true },
  },
]

// Core-data 路由（如果有通过 /academic/teaching-content?menu=xxx 访问的，在这里定义）
export const CORE_DATA_ROUTES: RouteConfig[] = []

// 合并所有路由
export const ALL_ROUTES: RouteConfig[] = [...STANDALONE_ROUTES, ...CORE_DATA_ROUTES]

// 根据 key 查找路由配置
export const getRouteByKey = (key: string): RouteConfig | undefined => {
  return ALL_ROUTES.find((route) => route.key === key)
}

// 根据 menuKey 查找路由配置（用于 core-data）
export const getRouteByMenuKey = (menuKey: string): RouteConfig | undefined => {
  return CORE_DATA_ROUTES.find((route) => route.menuKey === menuKey)
}

// 生成完整路径（包含 menu 参数）
export const getFullPath = (route: RouteConfig): string => {
  if (route.type === 'core-data' && route.menuKey) {
    return `${route.path}?menu=${route.menuKey}`
  }
  return route.path
}
