import { lazyWithRetry } from '../../utils/lazyWithRetry'

export const CampusContractGoalsResultsPage = lazyWithRetry(
  () => import('../../pages/teaching-quality/mgnt/campus-level/3-contract-goals-results'),
)
export const CampusNewStudentStabilityPage = lazyWithRetry(
  () => import('../../pages/teaching-quality/mgnt/campus-level/5-new-student-stability'),
)
export const CampusOutstandingFeesDetailPage = lazyWithRetry(
  () => import('../../pages/campus/outstanding-fees-detail'),
)
export const CampusNewStudentStabilityPersonalPage = lazyWithRetry(
  () => import('../../pages/campus/new-student-stability-personal'),
)
export const CampusNewStudentStabilityMonthlyPersonalPage = lazyWithRetry(
  () => import('../../pages/campus/new-student-stability-monthly-personal'),
)
export const CampusPromotionPlanPage = lazyWithRetry(
  () => import('../../pages/teaching-quality/mgnt/campus-level/6-promotion-plan'),
)
export const CampusPersonalPromotionTargetPage = lazyWithRetry(
  () => import('../../pages/campus/personal-promotion-target'),
)
export const CampusMonthlyPersonalPromotionTargetPage = lazyWithRetry(
  () => import('../../pages/campus/monthly-personal-promotion-target'),
)
export const CampusMonthlyClassPromotionTargetPage = lazyWithRetry(
  () => import('../../pages/campus/monthly-class-promotion-target'),
)
export const CampusPersonalStudentFluctuationPage = lazyWithRetry(
  () => import('../../pages/campus/personal-student-fluctuation'),
)
export const CampusMonthlyPersonalStudentFluctuationPage = lazyWithRetry(
  () => import('../../pages/campus/monthly-personal-student-fluctuation'),
)
export const CampusDormitoryStatisticsPage = lazyWithRetry(
  () => import('../../pages/teaching-quality/mgnt/campus-level/8-dormitory-statistics'),
)
export const CampusPersonalDormitoryManagementPage = lazyWithRetry(
  () => import('../../pages/campus/personal-dormitory-management'),
)
export const CampusStudentFluctuationPage = lazyWithRetry(
  () => import('../../pages/teaching-quality/mgnt/campus-level/7-student-fluctuation'),
)
export const CampusDormitoryManagementPage = lazyWithRetry(
  () => import('../../pages/teaching-quality/mgnt/campus-level/8-dormitory-statistics'),
)
export const CampusStudentStatusPage = lazyWithRetry(
  () => import('../../pages/campus/student-status'),
)
export const CampusManagerAnalysisPage = lazyWithRetry(
  () => import('../../pages/teaching-quality/mgnt/campus-level/10-manager-analysis'),
)
export const CampusTrainingPlanPage = lazyWithRetry(
  () => import('../../pages/campus/training-plan'),
)
export const CampusTeacherRatioPage = lazyWithRetry(
  () => import('../../pages/teaching-quality/mgnt/campus-level/12-teacher-ratio'),
)
export const CampusRecruitmentSummaryPage = lazyWithRetry(
  () => import('../../pages/teaching-quality/mgnt/campus-level/13-recruitment-summary'),
)
export const CampusTeacherEmploymentSummaryPage = lazyWithRetry(
  () =>
    import(
      '../../pages/teaching-quality/campus/1-core-data/2-student-employment/TAB1class-employment-summary/3-teacher-employment-summary'
    ),
)
export const CampusContractSigningSummaryPage = lazyWithRetry(
  () => import('../../pages/campus/contract-signing-summary'),
)
export const CampusPersonalContractSigningPage = lazyWithRetry(
  () => import('../../pages/campus/personal-contract-signing'),
)
export const CampusTeacherContractSigningPage = lazyWithRetry(
  () => import('../../pages/campus/teacher-contract-signing'),
)
export const CampusPersonalReputationEnrollmentPage = lazyWithRetry(
  () => import('../../pages/campus/personal-reputation-enrollment'),
)
export const CampusMonthlyPersonalReputationEnrollmentPage = lazyWithRetry(
  () => import('../../pages/campus/monthly-personal-reputation-enrollment'),
)
export const EnrollmentArchive = lazyWithRetry(() => import('../../pages/service/EnrollmentArchive'))
export const StudentProfile = lazyWithRetry(() => import('../../pages/service/StudentProfile'))
export const StudentProfileInput = lazyWithRetry(
  () => import('../../pages/service/StudentProfileInput'),
)
export const EmployeeInterview = lazyWithRetry(
  () => import('../../pages/service/EmployeeInterview'),
)
export const NewStudentArrangement = lazyWithRetry(
  () =>
    import(
      '../../pages/academic/campus/04-stu-stability/18-new-student-schedule/NewStudentArrangement'
    ),
)
export const StressInterview = lazyWithRetry(() => import('../../pages/service/StressInterview'))
export const DailyWork = lazyWithRetry(() => import('../../pages/service/DailyWork'))
export const StandardizationCheck = lazyWithRetry(
  () => import('../../pages/service/StandardizationCheck'),
)
export const MeetingRecord = lazyWithRetry(() => import('../../pages/service/MeetingRecord'))
export const StudentStatus = lazyWithRetry(() => import('../../pages/service/StudentStatus'))
export const EmploymentInfo = lazyWithRetry(() => import('../../pages/service/EmploymentInfo'))
export const EmploymentStats = lazyWithRetry(() => import('../../pages/service/EmploymentStats'))
export const EmploymentSummary = lazyWithRetry(
  () => import('../../pages/service/EmploymentSummary'),
)
export const EmploymentSummaryTable = lazyWithRetry(
  () => import('../../pages/service/EmploymentSummaryTable'),
)
export const EmploymentStar = lazyWithRetry(() => import('../../pages/service/EmploymentStar'))
export const TeacherEmployment = lazyWithRetry(
  () => import('../../pages/service/TeacherEmployment'),
)
export const DormitoryManagement = lazyWithRetry(
  () => import('../../pages/service/DormitoryManagement'),
)
