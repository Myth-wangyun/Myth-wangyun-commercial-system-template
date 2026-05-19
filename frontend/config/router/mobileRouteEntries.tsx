import { lazyWithRetry } from '../../utils/lazyWithRetry'

export const MobileTypeCountSystem = lazyWithRetry(
  () => import('../../pages/consult/type-count-system/mobile/MobileIndex'),
)
export const MobileHomePage = lazyWithRetry(() => import('../../pages/mobile/MobileHome'))
export const MobileProfilePage = lazyWithRetry(() => import('../../pages/mobile/MobileProfile'))
export const MobileStatsPage = lazyWithRetry(() => import('../../pages/mobile/MobileStats'))
export const MobileStaffPage = lazyWithRetry(() => import('../../pages/mobile/MobileStaff'))
export const MobileNotificationsPage = lazyWithRetry(
  () => import('../../pages/mobile/MobileNotifications'),
)
export const MobileApprovalsPage = lazyWithRetry(
  () => import('../../pages/mobile/MobileApprovals'),
)
export const MobileMyConsultationsPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileMyConsultations'),
)
export const MobileConsultationRecordsPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileConsultationRecords'),
)
export const MobileConsultationDetailPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileConsultationDetail'),
)
export const MobileDailyConsultingSummaryPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileDailyConsultingSummary'),
)
export const MobileConsultantDataSummaryPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileConsultantDataSummary'),
)
export const MobileStaffInterviewPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileStaffInterview'),
)
export const MobileMeetingRecordPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileMeetingRecord'),
)
export const MobilePhoneCheckPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobilePhoneCheck'),
)
export const MobileFaceToFaceCheckPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileFaceToFaceCheck'),
)
export const MobileEmploymentGoalsPage = lazyWithRetry(
  () => import('../../pages/mobile/employment/MobileEmploymentGoals'),
)
export const MobileTeacherDailyWorkPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileTeacherDailyWork'),
)
export const MobileHomeroomDailyWorkPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileHomeroomDailyWork'),
)
export const MobileStudentMovementPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileStudentMovement'),
)
export const MobileNewStudentStabilityPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileNewStudentStability'),
)
export const MobileDormitoryStatsPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileDormitoryStats'),
)
export const MobileEnrollmentStatsPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileEnrollmentStats'),
)
export const MobileStudentInterviewsPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileStudentInterviews'),
)
export const MobileStandardizationCheckPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileStandardizationCheck'),
)
export const MobilePopulationDataSummaryPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobilePopulationDataSummary'),
)
export const MobileDailyConsultingRegisterPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileDailyConsultingRegister'),
)
export const MobileFinancialIncomePage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileFinancialIncome'),
)
export const MobileConsultHrBasicPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileConsultHrBasic'),
)
export const MobileConsultStaffFunctionPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileConsultStaffFunction'),
)
export const MobileExportApprovalPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileExportApproval'),
)
export const MobileConsultTrainingPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileConsultTraining'),
)
export const MobileMgntCenterDashboardPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileMgntCenterDashboard'),
)
export const MobileCampusYearlyMediaPage = lazyWithRetry(
  () => import('../../pages/mobile/consult/MobileCampusYearlyMedia'),
)
export const MobileClassEmploymentDetailPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileClassEmploymentDetail'),
)
export const MobileProjectPlanPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileProjectPlan'),
)
export const MobileCourseSchedulePage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileCourseSchedule'),
)
export const MobileSalaryEstimatePage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileSalaryEstimate'),
)
export const MobileScorePagesModule = {
  AssignmentScore: lazyWithRetry(() =>
    import('../../pages/mobile/academic/MobileScorePages').then((m) => ({
      default: m.MobileAssignmentScore,
    })),
  ),
  ExamScore: lazyWithRetry(() =>
    import('../../pages/mobile/academic/MobileScorePages').then((m) => ({
      default: m.MobileExamScore,
    })),
  ),
  ProjectScore: lazyWithRetry(() =>
    import('../../pages/mobile/academic/MobileScorePages').then((m) => ({
      default: m.MobileProjectScore,
    })),
  ),
  PressureInterviewScore: lazyWithRetry(() =>
    import('../../pages/mobile/academic/MobileScorePages').then((m) => ({
      default: m.MobilePressureInterviewScore,
    })),
  ),
  StudentSatisfaction: lazyWithRetry(() =>
    import('../../pages/mobile/academic/MobileScorePages').then((m) => ({
      default: m.MobileStudentSatisfaction,
    })),
  ),
  LectureScore: lazyWithRetry(() =>
    import('../../pages/mobile/academic/MobileScorePages').then((m) => ({
      default: m.MobileLectureScore,
    })),
  ),
}
export const MobileReputationGoalsPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileReputationGoals'),
)
export const MobileReputationSelfCheckPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileReputationSelfCheck'),
)
export const MobileReputationKeyPointsPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileReputationKeyPoints'),
)
export const MobileNewStudentSchedulePage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileNewStudentSchedule'),
)
export const MobileAcademicStaffInterviewPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileAcademicStaffInterview'),
)
export const MobileAcademicMeetingRecordPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileAcademicMeetingRecord'),
)
export const MobileKpiPlanPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileKpiPlan'),
)
export const MobilePerformanceRewardPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobilePerformanceReward'),
)
export const MobileClassHourStatsPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileClassHourStats'),
)
export const MobileTeacherFunctionAnalysisPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileTeacherFunctionAnalysis'),
)
export const MobileCulturePresentationPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileCulturePresentation'),
)
export const MobileCultureExamPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileCultureExam'),
)
export const MobileAcademicCoreSummaryPage = lazyWithRetry(
  () => import('../../pages/mobile/academic/MobileAcademicCoreSummary'),
)
export const MobileTQCoreSummaryPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileTQCoreSummary'),
)
export const MobileClassEmploymentSummaryPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileClassEmploymentSummary'),
)
export const MobileEmploymentStarPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileEmploymentStar'),
)
export const MobileTQGenericPagesModule = {
  ClassEmploymentInfo: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQGenericPages').then((m) => ({
      default: m.MobileTQClassEmploymentInfo,
    })),
  ),
  ClassEmploymentDetail: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQGenericPages').then((m) => ({
      default: m.MobileTQClassEmploymentDetail,
    })),
  ),
  EmploymentPeriodPlan: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQGenericPages').then((m) => ({
      default: m.MobileEmploymentPeriodPlan,
    })),
  ),
  IntensifyPeriodPlan: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQGenericPages').then((m) => ({
      default: m.MobileIntensifyPeriodPlan,
    })),
  ),
  SalaryEstimate: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQGenericPages').then((m) => ({
      default: m.MobileTQSalaryEstimate,
    })),
  ),
  ClassFileRecord: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQGenericPages').then((m) => ({
      default: m.MobileClassFileRecord,
    })),
  ),
  ThousandScore: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQGenericPages').then((m) => ({
      default: m.MobileThousandScore,
    })),
  ),
  ClassStatusSummary: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQGenericPages').then((m) => ({
      default: m.MobileClassStatusSummary,
    })),
  ),
  PressureInterview: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQGenericPages').then((m) => ({
      default: m.MobileTQPressureInterview,
    })),
  ),
  PressureInterviewRating: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQGenericPages').then((m) => ({
      default: m.MobilePressureInterviewRating,
    })),
  ),
}
export const MobileTQReputationPlanPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileTQReputationPlan'),
)
export const MobileTQReputationKeyPointsPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileTQReputationKeyPoints'),
)
export const MobileActivityPlanPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileActivityPlan'),
)
export const MobileTQNewStudentSchedulePage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileTQNewStudentSchedule'),
)
export const MobilePromotionPlanPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobilePromotionPlan'),
)
export const MobileStudentMovementApplicationPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileStudentMovementApplication'),
)
export const MobileDormFeeNoticePage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileDormFeeNotice'),
)
export const MobileTQManagementModule = {
  EmployeeFunction: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQManagementPages').then((m) => ({
      default: m.MobileTQEmployeeFunctionAnalysis,
    })),
  ),
  EmployeeKpi: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQManagementPages').then((m) => ({
      default: m.MobileTQEmployeeKpiPlan,
    })),
  ),
  EmployeeInterview: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQManagementPages').then((m) => ({
      default: m.MobileTQEmployeeInterview,
    })),
  ),
  MeetingRecord: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQManagementPages').then((m) => ({
      default: m.MobileTQMeetingRecord,
    })),
  ),
  TrainingPlanScore: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQManagementPages').then((m) => ({
      default: m.MobileTQTrainingPlanScore,
    })),
  ),
}
export const MobileTQCultureModule = {
  Presentation: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQCulturePages').then((m) => ({
      default: m.MobileTQCulturePresentation,
    })),
  ),
  Exam: lazyWithRetry(() =>
    import('../../pages/mobile/teaching-quality/MobileTQCulturePages').then((m) => ({
      default: m.MobileTQCultureExam,
    })),
  ),
}
export const MobileHandoverListPage = lazyWithRetry(
  () => import('../../pages/mobile/teaching-quality/MobileHandoverList'),
)
export const MobileMarketSemDailyPage = lazyWithRetry(
  () => import('../../pages/mobile/market/MobileMarketSemDaily'),
)
export const MobileMarketReputationDailyPage = lazyWithRetry(
  () => import('../../pages/mobile/market/MobileMarketReputationDaily'),
)
export const MobileMarketMonthlyProgressPage = lazyWithRetry(
  () => import('../../pages/mobile/market/MobileMarketMonthlyProgress'),
)
export const MobileMarketPartnerContactsPage = lazyWithRetry(
  () => import('../../pages/mobile/market/MobileMarketPartnerContacts'),
)
export const MobileMarketOnlinePartnerDailyPage = lazyWithRetry(
  () => import('../../pages/mobile/market/MobileMarketOnlinePartnerDaily'),
)
export const MobileMarketStaffFunctionPage = lazyWithRetry(
  () => import('../../pages/mobile/market/MobileMarketStaffFunction'),
)
export const MobileMarketMonthlyPlanPage = lazyWithRetry(
  () => import('../../pages/mobile/market/MobileMarketMonthlyPlan'),
)
export const MobileMarketGenericModule = {
  NewMediaSummary: lazyWithRetry(() =>
    import('../../pages/mobile/market/MobileMarketGenericPages').then((m) => ({
      default: m.MobileMarketNewMediaSummary,
    })),
  ),
  NewMediaPlatformDetail: lazyWithRetry(() =>
    import('../../pages/mobile/market/MobileMarketGenericPages').then((m) => ({
      default: m.MobileMarketNewMediaPlatformDetail,
    })),
  ),
  NetworkSummary: lazyWithRetry(() =>
    import('../../pages/mobile/market/MobileMarketGenericPages').then((m) => ({
      default: m.MobileMarketNetworkSummary,
    })),
  ),
  NetworkPartnerMonthly: lazyWithRetry(() =>
    import('../../pages/mobile/market/MobileMarketGenericPages').then((m) => ({
      default: m.MobileMarketNetworkPartnerMonthly,
    })),
  ),
  NetworkPartnerAnnual: lazyWithRetry(() =>
    import('../../pages/mobile/market/MobileMarketGenericPages').then((m) => ({
      default: m.MobileMarketNetworkPartnerAnnual,
    })),
  ),
  ChannelExpense: lazyWithRetry(() =>
    import('../../pages/mobile/market/MobileMarketGenericPages').then((m) => ({
      default: m.MobileMarketChannelExpense,
    })),
  ),
  ChannelConsultant: lazyWithRetry(() =>
    import('../../pages/mobile/market/MobileMarketGenericPages').then((m) => ({
      default: m.MobileMarketChannelConsultant,
    })),
  ),
  SemPlan: lazyWithRetry(() =>
    import('../../pages/mobile/market/MobileMarketGenericPages').then((m) => ({
      default: m.MobileMarketSemPlan,
    })),
  ),
  SemMonthly: lazyWithRetry(() =>
    import('../../pages/mobile/market/MobileMarketGenericPages').then((m) => ({
      default: m.MobileMarketSemMonthly,
    })),
  ),
  SemAnnual: lazyWithRetry(() =>
    import('../../pages/mobile/market/MobileMarketGenericPages').then((m) => ({
      default: m.MobileMarketSemAnnual,
    })),
  ),
  TrainingSummary: lazyWithRetry(() =>
    import('../../pages/mobile/market/MobileMarketGenericPages').then((m) => ({
      default: m.MobileMarketTrainingSummary,
    })),
  ),
  MeetingRecord: lazyWithRetry(() =>
    import('../../pages/mobile/market/MobileMarketGenericPages').then((m) => ({
      default: m.MobileMarketMeetingRecord,
    })),
  ),
  CoreSummary: lazyWithRetry(() =>
    import('../../pages/mobile/market/MobileMarketGenericPages').then((m) => ({
      default: m.MobileMarketCoreSummary,
    })),
  ),
}
export const MobileAuditLogPage = lazyWithRetry(
  () => import('../../pages/mobile/system/MobileAuditLog'),
)
export const MobileFunctionsPage = lazyWithRetry(
  () => import('../../pages/mobile/MobileFunctions'),
)
