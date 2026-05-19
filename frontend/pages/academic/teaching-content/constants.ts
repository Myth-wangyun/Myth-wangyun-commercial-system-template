// 全局常量定义
export const CAMPUS_LIST = [
  '盛邦',
  '冀英',
  '石英',
  '源美',
  '原美',
  '大美',
  '桂美',
  '石美',
  '晋美',
  '太美',
  '冀美',
] as const

export const MAJOR_LIST = [
  '云计算',
  '网络工程',
  '服务器运维',
  '人工智能',
  'AIGC',
  'AI数媒',
  '后期短视频',
  '室内外效果',
  '游戏动漫',
  '网络云运维',
] as const

export const CITIES = ['北京', '上海', '广州', '石家庄', '太原', '南宁', '大梁', '衡宁'] as const

export const MONTHS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
] as const

export const PROGRAM_LENGTHS = ['6个月', '20个月', '两年制', '三年制'] as const

export const TRAINING_METHODS = ['线上培训', '线下培训', '混合培训', '实践培训'] as const

export const SURVEY_PLATFORMS = ['Boss直聘', '智联招聘'] as const

// 存储键名
export const STORAGE_KEYS = {
  CORE_DATA_SUMMARY: 'coreDataSummary',
  EMPLOYMENT_SUMMARY: 'employmentSummary',
  ENROLLMENT_SUMMARY: 'enrollmentSummary',
  STUDENT_STABILITY: 'studentStability',
  STAFFING_RATIO: 'staffingRatio',
  ONBOARDING_OFFBOARDING: 'onboardingOffboarding',
  TRAINING_PLAN: 'trainingPlan',
  TEACHER_STAFFING_RATIO: 'teacherStaffingRatio',
  ONLINE_SURVEY: 'onlineSurvey',
  ENTERPRISE_SURVEY: 'enterpriseSurvey',
  JOB_ANALYSIS: 'jobAnalysis',
  JOB_ANALYSIS_DETAILS: 'jobAnalysisDetails',
  JOB_ANALYSIS_SUMMARY: 'jobAnalysisSummary',
  COURSEWARE_WRITING: 'coursewareWriting',
  QUESTION_BANK: 'questionBank',
  MANAGER_FUNCTION: 'managerFunction',
  CAMPUS_EMPLOYMENT_CLASS_SUMMARY: 'campusEmploymentClassSummary',
  CAMPUS_EMPLOYMENT_STAR_SUMMARY: 'campusEmploymentStarSummary',
  CAMPUS_TEACHER_EMPLOYMENT_SUMMARY: 'campusTeacherEmploymentSummary',
  CAMPUS_REPUTATION_PERSONAL_GOALS: 'campusReputationPersonalGoals',
  CAMPUS_REPUTATION_MONTHLY_PERSONAL: 'campusReputationMonthlyPersonal',
  CAMPUS_STABILITY_MONTHLY_SUMMARY: 'campusStabilityMonthlySummary',
  CAMPUS_STABILITY_PERSONAL_SUMMARY: 'campusStabilityPersonalSummary',
  CAMPUS_STABILITY_PERSONAL_MONTHLY: 'campusStabilityPersonalMonthly',
  CAMPUS_STAFF_MONTHLY_PERFORMANCE: 'campusStaffMonthlyPerformance',
  CAMPUS_STAFF_FUNCTION_ANALYSIS: 'campusStaffFunctionAnalysis',
  CAMPUS_STAFF_PERFORMANCE_SUMMARY: 'campusStaffPerformanceSummary',
} as const
