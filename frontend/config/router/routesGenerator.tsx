/**
 * 路由生成器
 * 从配置生成路由定义
 */
import React, { Suspense } from 'react'
import type { RouteObject } from 'react-router-dom'
import { STANDALONE_ROUTES } from './routes'
import { CoreDataPage, getRouteComponent } from './routeComponents'
import AppRouteError from '../../components/error/AppRouteError'
import AuthGuard from '../../components/auth/AuthGuard'
import PermissionGuard from '../../components/auth/PermissionGuard'
import { DesktopGuard, MobileGuard } from '../../components/layout/MobileRedirect'
import { lazyWithRetry } from '../../utils/lazyWithRetry'
import NotFoundPage from '../../pages/error/NotFoundPage'

// 移动端页面（从拆分文件导入）
import {
  MobileTypeCountSystem, MobileHomePage, MobileProfilePage, MobileStatsPage,
  MobileStaffPage, MobileNotificationsPage, MobileApprovalsPage,
  MobileMyConsultationsPage, MobileConsultationRecordsPage, MobileConsultationDetailPage,
  MobileDailyConsultingSummaryPage, MobileConsultantDataSummaryPage,
  MobileStaffInterviewPage, MobileMeetingRecordPage, MobilePhoneCheckPage,
  MobileFaceToFaceCheckPage, MobileEmploymentGoalsPage, MobileTeacherDailyWorkPage,
  MobileHomeroomDailyWorkPage, MobileStudentMovementPage, MobileNewStudentStabilityPage,
  MobileDormitoryStatsPage, MobileEnrollmentStatsPage, MobileStudentInterviewsPage,
  MobileStandardizationCheckPage, MobilePopulationDataSummaryPage,
  MobileDailyConsultingRegisterPage, MobileFinancialIncomePage,
  MobileConsultHrBasicPage, MobileConsultStaffFunctionPage, MobileExportApprovalPage,
  MobileConsultTrainingPage, MobileMgntCenterDashboardPage, MobileCampusYearlyMediaPage,
  MobileClassEmploymentDetailPage, MobileProjectPlanPage, MobileCourseSchedulePage,
  MobileSalaryEstimatePage, MobileScorePagesModule,
  MobileReputationGoalsPage, MobileReputationSelfCheckPage, MobileReputationKeyPointsPage,
  MobileNewStudentSchedulePage, MobileAcademicStaffInterviewPage,
  MobileAcademicMeetingRecordPage, MobileKpiPlanPage, MobilePerformanceRewardPage,
  MobileClassHourStatsPage, MobileTeacherFunctionAnalysisPage,
  MobileCulturePresentationPage, MobileCultureExamPage, MobileAcademicCoreSummaryPage,
  MobileTQCoreSummaryPage, MobileClassEmploymentSummaryPage, MobileEmploymentStarPage,
  MobileTQGenericPagesModule, MobileTQReputationPlanPage, MobileTQReputationKeyPointsPage,
  MobileActivityPlanPage, MobileTQNewStudentSchedulePage, MobilePromotionPlanPage,
  MobileStudentMovementApplicationPage, MobileDormFeeNoticePage,
  MobileTQManagementModule, MobileTQCultureModule, MobileHandoverListPage,
  MobileMarketSemDailyPage, MobileMarketReputationDailyPage,
  MobileMarketMonthlyProgressPage, MobileMarketPartnerContactsPage,
  MobileMarketOnlinePartnerDailyPage, MobileMarketStaffFunctionPage,
  MobileMarketMonthlyPlanPage, MobileMarketGenericModule,
  MobileAuditLogPage, MobileFunctionsPage,
} from './mobileRouteEntries'

// 神殿模块 + 学员服务模块（从拆分文件导入）
import {
  CampusContractGoalsResultsPage, CampusNewStudentStabilityPage,
  CampusOutstandingFeesDetailPage, CampusNewStudentStabilityPersonalPage,
  CampusNewStudentStabilityMonthlyPersonalPage, CampusPromotionPlanPage,
  CampusPersonalPromotionTargetPage, CampusMonthlyPersonalPromotionTargetPage,
  CampusMonthlyClassPromotionTargetPage, CampusPersonalStudentFluctuationPage,
  CampusMonthlyPersonalStudentFluctuationPage, CampusDormitoryStatisticsPage,
  CampusPersonalDormitoryManagementPage, CampusStudentFluctuationPage,
  CampusDormitoryManagementPage, CampusStudentStatusPage, CampusManagerAnalysisPage,
  CampusTrainingPlanPage, CampusTeacherRatioPage, CampusRecruitmentSummaryPage,
  CampusTeacherEmploymentSummaryPage, CampusContractSigningSummaryPage,
  CampusPersonalContractSigningPage, CampusTeacherContractSigningPage,
  CampusPersonalReputationEnrollmentPage, CampusMonthlyPersonalReputationEnrollmentPage,
  EnrollmentArchive, StudentProfile, StudentProfileInput, EmployeeInterview,
  NewStudentArrangement, StressInterview, DailyWork, StandardizationCheck,
  MeetingRecord, StudentStatus, EmploymentInfo, EmploymentStats,
  EmploymentSummary, EmploymentSummaryTable, EmploymentStar, TeacherEmployment,
  DormitoryManagement,
} from './campusRouteEntries'

// 懒加载布局组件（减小 router-generator chunk 体积）
const MainLayout = lazyWithRetry(() => import('../../components/layout/MainLayout'))
const MobileLayout = lazyWithRetry(() => import('../../components/layout/MobileLayout'))

// 加载中组件
const LoadingSpinner = () => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
      }}
    >
      <div>加载中...</div>
    </div>
  )
}

// 懒加载页面组件
const Login = lazyWithRetry(() => import('../../pages/auth/Login'))
const CampusInfo = lazyWithRetry(() => import('../../pages/campus/CampusInfo'))

// 市场模块
const MarketDaily = lazyWithRetry(() => import('../../pages/market/MarketDaily'))
const MarketSummary = lazyWithRetry(() => import('../../pages/market/MarketSummary'))
const MarketStatistics = lazyWithRetry(() => import('../../pages/market/MarketStatistics'))
const PartnerManagement = lazyWithRetry(() => import('../../pages/market/PartnerManagement'))
const AccountSentimentPage = lazyWithRetry(
  () => import('../../pages/market/19-market-dept-campus-newmedia-account-sentiment-register'),
)
const MeetingRecordPage = lazyWithRetry(
  () => import('../../pages/market/18-market-dept-meeting-record'),
)

const MarketingMonthlyDataPage = lazyWithRetry(
  () => import('../../pages/market/2-market-monthly-data/TAB-index'),
)

const MarketYearlySummaryPage = lazyWithRetry(
  () => import('../../pages/market/1-market-yearly-summary/TAB-index'),
)


const ConsultingType = lazyWithRetry(() => import('../../pages/consult/004mgmt-data/014-phone-check/consulting/ConsultingType'))
const ConsultingStats = lazyWithRetry(() => import('../../pages/consult/004mgmt-data/014-phone-check/consulting/ConsultingStats'))

// 学术模块
const ManagementCenterPage = lazyWithRetry(() => import('../../pages/academic/management-center'))

// 教员管理模块
const TeacherManagement = lazyWithRetry(() => import('../../pages/academic/teacher/TeacherManagement'))
const ManagerEvaluationPage = lazyWithRetry(
  () => import('../../pages/academic/mgnt/14-manager-evaluation/index'),
)

// 教质模块
const TrainingPlanPerformancePage = lazyWithRetry(
  () => import('../../pages/teaching-quality/mgnt/campus-level/11-training-plan-performance'),
)

/**
 * 生成所有路由配置
 */
export const generateRoutes = (): RouteObject[] => {
  // 从配置生成的独立路由
  const standaloneRouteObjects = STANDALONE_ROUTES.map((route) => {
    const Component = getRouteComponent(route.key)
    if (!Component) return null

    // 获取路由的权限要求
    const requiredPermission = route.meta?.permission

    // 创建路由元素，根据是否需要权限进行包装
    const element = requiredPermission ? (
      <Suspense fallback={<LoadingSpinner />}>
        <PermissionGuard permission={requiredPermission} routeKey={route.key}>
          {React.createElement(Component as React.ComponentType)}
        </PermissionGuard>
      </Suspense>
    ) : (
      <Suspense fallback={<LoadingSpinner />}>
        {React.createElement(Component as React.ComponentType)}
      </Suspense>
    )

    return {
      path: route.path.replace(/^\//, ''), // 移除前导斜杠
      element,
    }
  }).filter(Boolean) as RouteObject[]

  return [
    {
      path: '/login',
      element: (
        <Suspense fallback={<LoadingSpinner />}>
          <Login />
        </Suspense>
      ),
      errorElement: <AppRouteError />,
    },
    {
      path: '/',
      element: (
        <AuthGuard>
          <DesktopGuard>
            <Suspense fallback={<LoadingSpinner />}>
              <MainLayout />
            </Suspense>
          </DesktopGuard>
        </AuthGuard>
      ),
      errorElement: <AppRouteError />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusInfo />
            </Suspense>
          ),
        },
        // 市场模块路由
        {
          path: 'market/daily',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MarketDaily />
            </Suspense>
          ),
        },
        {
          path: 'market/summary',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MarketSummary />
            </Suspense>
          ),
        },
        {
          path: 'market/statistics',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MarketStatistics />
            </Suspense>
          ),
        },
        {
          path: 'market/partner',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <PartnerManagement />
            </Suspense>
          ),
        },
        {
          path: 'market/account-sentiment',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <AccountSentimentPage />
            </Suspense>
          ),
        },
        {
          path: 'market/meeting-record',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MeetingRecordPage />
            </Suspense>
          ),
        },
        {
          path: 'market/monthly-data',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MarketingMonthlyDataPage />
            </Suspense>
          ),
        },
        {
          path: 'market/yearly-summary',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MarketYearlySummaryPage />
            </Suspense>
          ),
        },
        // 咨询模块路由
        {
          path: 'consulting/type',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <ConsultingType />
            </Suspense>
          ),
        },
        {
          path: 'consulting/stats',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <ConsultingStats />
            </Suspense>
          ),
        },
        // 学术模块路由
        {
          path: 'academic/management-center',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <ManagementCenterPage />
            </Suspense>
          ),
        },
        {
          path: 'academic/teaching-content',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CoreDataPage />
            </Suspense>
          ),
        },
        // 从配置生成的独立路由
        ...standaloneRouteObjects,
        {
          path: 'academic/teacher',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <TeacherManagement />
            </Suspense>
          ),
        },
        {
          path: 'academic/manager-evaluation',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <ManagerEvaluationPage />
            </Suspense>
          ),
        },
        {
          path: 'training-plan-performance',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <TrainingPlanPerformancePage />
            </Suspense>
          ),
        },
        // 神殿模块路由（部分已迁移到配置，这里保留非配置的路由）
        {
          path: 'campus/contract-goals-results',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusContractGoalsResultsPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/new-student-stability',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusNewStudentStabilityPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/promotion-plan',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusPromotionPlanPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/student-fluctuation',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusStudentFluctuationPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/dormitory-management',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusDormitoryManagementPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/student-status',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusStudentStatusPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/manager-analysis',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusManagerAnalysisPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/training-plan',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusTrainingPlanPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/teacher-ratio',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusTeacherRatioPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/recruitment-summary',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusRecruitmentSummaryPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/teacher-employment-summary',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusTeacherEmploymentSummaryPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/contract-signing-summary',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusContractSigningSummaryPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/personal-contract-signing',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusPersonalContractSigningPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/teacher-contract-signing',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusTeacherContractSigningPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/personal-reputation-enrollment',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusPersonalReputationEnrollmentPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/monthly-personal-reputation-enrollment',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusMonthlyPersonalReputationEnrollmentPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/outstanding-fees-detail',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusOutstandingFeesDetailPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/new-student-stability-personal',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusNewStudentStabilityPersonalPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/new-student-stability-monthly-personal',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusNewStudentStabilityMonthlyPersonalPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/personal-promotion-target',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusPersonalPromotionTargetPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/monthly-personal-promotion-target',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusMonthlyPersonalPromotionTargetPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/monthly-class-promotion-target',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusMonthlyClassPromotionTargetPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/personal-student-fluctuation',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusPersonalStudentFluctuationPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/monthly-personal-student-fluctuation',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusMonthlyPersonalStudentFluctuationPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/dormitory-statistics',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusDormitoryStatisticsPage />
            </Suspense>
          ),
        },
        {
          path: 'campus/personal-dormitory-management',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <CampusPersonalDormitoryManagementPage />
            </Suspense>
          ),
        },
        // 教学质量-学员服务模块路由
        {
          path: 'service/enrollment',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <EnrollmentArchive />
            </Suspense>
          ),
        },
        {
          path: 'service/profile',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <StudentProfile />
            </Suspense>
          ),
        },
        {
          path: 'service/profile-input',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <StudentProfileInput />
            </Suspense>
          ),
        },
        {
          path: 'service/employee-interview',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <EmployeeInterview />
            </Suspense>
          ),
        },
        {
          path: 'service/new-student',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <NewStudentArrangement />
            </Suspense>
          ),
        },
        {
          path: 'service/stress-interview',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <StressInterview />
            </Suspense>
          ),
        },
        {
          path: 'service/daily-work',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <DailyWork />
            </Suspense>
          ),
        },
        {
          path: 'service/standardization-check',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <StandardizationCheck />
            </Suspense>
          ),
        },
        {
          path: 'service/meeting-record',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MeetingRecord />
            </Suspense>
          ),
        },
        {
          path: 'service/student-status',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <StudentStatus />
            </Suspense>
          ),
        },
        {
          path: 'service/employment-info',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <EmploymentInfo />
            </Suspense>
          ),
        },
        {
          path: 'service/employment-stats',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <EmploymentStats />
            </Suspense>
          ),
        },
        {
          path: 'service/employment-summary',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <EmploymentSummary />
            </Suspense>
          ),
        },
        {
          path: 'service/employment-summary-table',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <EmploymentSummaryTable />
            </Suspense>
          ),
        },
        {
          path: 'service/employment-star',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <EmploymentStar />
            </Suspense>
          ),
        },
        {
          path: 'service/teacher-employment',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <TeacherEmployment />
            </Suspense>
          ),
        },
        {
          path: 'service/dormitory-management',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <DormitoryManagement />
            </Suspense>
          ),
        },
      ],
    },
    // ===== 移动端路由 =====
    {
      path: '/m',
      element: (
        <AuthGuard>
          <MobileGuard>
            <Suspense fallback={<LoadingSpinner />}>
              <MobileLayout />
            </Suspense>
          </MobileGuard>
        </AuthGuard>
      ),
      errorElement: <AppRouteError />,
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileHomePage />
            </Suspense>
          ),
        },
        {
          path: 'consult',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileTypeCountSystem />
            </Suspense>
          ),
        },
        {
          path: 'consult/my',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileMyConsultationsPage />
            </Suspense>
          ),
        },
        {
          path: 'consult/records',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileConsultationRecordsPage />
            </Suspense>
          ),
        },
        {
          path: 'consult/record/:id',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileConsultationDetailPage />
            </Suspense>
          ),
        },
        {
          path: 'consult/daily-summary',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileDailyConsultingSummaryPage />
            </Suspense>
          ),
        },
        {
          path: 'consult/data-summary',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileConsultantDataSummaryPage />
            </Suspense>
          ),
        },
        {
          path: 'consult/staff-interview',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileStaffInterviewPage />
            </Suspense>
          ),
        },
        {
          path: 'consult/meeting-record',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileMeetingRecordPage />
            </Suspense>
          ),
        },
        {
          path: 'consult/phone-check',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobilePhoneCheckPage />
            </Suspense>
          ),
        },
        {
          path: 'consult/face-to-face-check',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileFaceToFaceCheckPage />
            </Suspense>
          ),
        },
        {
          path: 'employment/goals',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileEmploymentGoalsPage />
            </Suspense>
          ),
        },
        {
          path: 'academic/teacher-daily-work',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileTeacherDailyWorkPage />
            </Suspense>
          ),
        },
        {
          path: 'teaching-quality/homeroom-daily-work',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileHomeroomDailyWorkPage />
            </Suspense>
          ),
        },
        {
          path: 'teaching-quality/student-movement',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileStudentMovementPage />
            </Suspense>
          ),
        },
        {
          path: 'teaching-quality/new-student-stability',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileNewStudentStabilityPage />
            </Suspense>
          ),
        },
        {
          path: 'teaching-quality/dormitory-stats',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileDormitoryStatsPage />
            </Suspense>
          ),
        },
        {
          path: 'teaching-quality/enrollment-stats',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileEnrollmentStatsPage />
            </Suspense>
          ),
        },
        {
          path: 'teaching-quality/student-interviews',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileStudentInterviewsPage />
            </Suspense>
          ),
        },
        {
          path: 'teaching-quality/standardization-check',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileStandardizationCheckPage />
            </Suspense>
          ),
        },
        // ===== 祈福司新增路由 =====
        { path: 'consult/population-summary', element: <Suspense fallback={<LoadingSpinner />}><MobilePopulationDataSummaryPage /></Suspense> },
        { path: 'consult/daily-register', element: <Suspense fallback={<LoadingSpinner />}><MobileDailyConsultingRegisterPage /></Suspense> },
        { path: 'consult/financial-income', element: <Suspense fallback={<LoadingSpinner />}><MobileFinancialIncomePage /></Suspense> },
        { path: 'consult/hr-basic', element: <Suspense fallback={<LoadingSpinner />}><MobileConsultHrBasicPage /></Suspense> },
        { path: 'consult/staff-function', element: <Suspense fallback={<LoadingSpinner />}><MobileConsultStaffFunctionPage /></Suspense> },
        { path: 'consult/export-approval', element: <Suspense fallback={<LoadingSpinner />}><MobileExportApprovalPage /></Suspense> },
        { path: 'consult/training', element: <Suspense fallback={<LoadingSpinner />}><MobileConsultTrainingPage /></Suspense> },
        { path: 'consult/mgnt-dashboard', element: <Suspense fallback={<LoadingSpinner />}><MobileMgntCenterDashboardPage /></Suspense> },
        { path: 'consult/yearly-media', element: <Suspense fallback={<LoadingSpinner />}><MobileCampusYearlyMediaPage /></Suspense> },
        // ===== 智慧司新增路由 =====
        { path: 'academic/class-employment-detail', element: <Suspense fallback={<LoadingSpinner />}><MobileClassEmploymentDetailPage /></Suspense> },
        { path: 'academic/project-plan', element: <Suspense fallback={<LoadingSpinner />}><MobileProjectPlanPage /></Suspense> },
        { path: 'academic/course-schedule', element: <Suspense fallback={<LoadingSpinner />}><MobileCourseSchedulePage /></Suspense> },
        { path: 'academic/salary-estimate', element: <Suspense fallback={<LoadingSpinner />}><MobileSalaryEstimatePage /></Suspense> },
        { path: 'academic/assignment-score', element: <Suspense fallback={<LoadingSpinner />}><MobileScorePagesModule.AssignmentScore /></Suspense> },
        { path: 'academic/exam-score', element: <Suspense fallback={<LoadingSpinner />}><MobileScorePagesModule.ExamScore /></Suspense> },
        { path: 'academic/project-score', element: <Suspense fallback={<LoadingSpinner />}><MobileScorePagesModule.ProjectScore /></Suspense> },
        { path: 'academic/pressure-interview-score', element: <Suspense fallback={<LoadingSpinner />}><MobileScorePagesModule.PressureInterviewScore /></Suspense> },
        { path: 'academic/student-satisfaction', element: <Suspense fallback={<LoadingSpinner />}><MobileScorePagesModule.StudentSatisfaction /></Suspense> },
        { path: 'academic/lecture-score', element: <Suspense fallback={<LoadingSpinner />}><MobileScorePagesModule.LectureScore /></Suspense> },
        { path: 'academic/reputation-goals', element: <Suspense fallback={<LoadingSpinner />}><MobileReputationGoalsPage /></Suspense> },
        { path: 'academic/reputation-self-check', element: <Suspense fallback={<LoadingSpinner />}><MobileReputationSelfCheckPage /></Suspense> },
        { path: 'academic/reputation-key-points', element: <Suspense fallback={<LoadingSpinner />}><MobileReputationKeyPointsPage /></Suspense> },
        { path: 'academic/new-student-schedule', element: <Suspense fallback={<LoadingSpinner />}><MobileNewStudentSchedulePage /></Suspense> },
        { path: 'academic/staff-interview', element: <Suspense fallback={<LoadingSpinner />}><MobileAcademicStaffInterviewPage /></Suspense> },
        { path: 'academic/meeting-record', element: <Suspense fallback={<LoadingSpinner />}><MobileAcademicMeetingRecordPage /></Suspense> },
        { path: 'academic/kpi-plan', element: <Suspense fallback={<LoadingSpinner />}><MobileKpiPlanPage /></Suspense> },
        { path: 'academic/performance-reward', element: <Suspense fallback={<LoadingSpinner />}><MobilePerformanceRewardPage /></Suspense> },
        { path: 'academic/class-hour-stats', element: <Suspense fallback={<LoadingSpinner />}><MobileClassHourStatsPage /></Suspense> },
        { path: 'academic/teacher-function-analysis', element: <Suspense fallback={<LoadingSpinner />}><MobileTeacherFunctionAnalysisPage /></Suspense> },
        { path: 'academic/culture-presentation', element: <Suspense fallback={<LoadingSpinner />}><MobileCulturePresentationPage /></Suspense> },
        { path: 'academic/culture-exam', element: <Suspense fallback={<LoadingSpinner />}><MobileCultureExamPage /></Suspense> },
        { path: 'academic/core-summary', element: <Suspense fallback={<LoadingSpinner />}><MobileAcademicCoreSummaryPage /></Suspense> },
        // ===== 教化司新增路由 =====
        { path: 'teaching-quality/core-summary', element: <Suspense fallback={<LoadingSpinner />}><MobileTQCoreSummaryPage /></Suspense> },
        { path: 'teaching-quality/class-employment-summary', element: <Suspense fallback={<LoadingSpinner />}><MobileClassEmploymentSummaryPage /></Suspense> },
        { path: 'teaching-quality/employment-star', element: <Suspense fallback={<LoadingSpinner />}><MobileEmploymentStarPage /></Suspense> },
        { path: 'teaching-quality/class-employment-info', element: <Suspense fallback={<LoadingSpinner />}><MobileTQGenericPagesModule.ClassEmploymentInfo /></Suspense> },
        { path: 'teaching-quality/class-employment-detail', element: <Suspense fallback={<LoadingSpinner />}><MobileTQGenericPagesModule.ClassEmploymentDetail /></Suspense> },
        { path: 'teaching-quality/employment-period-plan', element: <Suspense fallback={<LoadingSpinner />}><MobileTQGenericPagesModule.EmploymentPeriodPlan /></Suspense> },
        { path: 'teaching-quality/intensify-period-plan', element: <Suspense fallback={<LoadingSpinner />}><MobileTQGenericPagesModule.IntensifyPeriodPlan /></Suspense> },
        { path: 'teaching-quality/salary-estimate', element: <Suspense fallback={<LoadingSpinner />}><MobileTQGenericPagesModule.SalaryEstimate /></Suspense> },
        { path: 'teaching-quality/class-file-record', element: <Suspense fallback={<LoadingSpinner />}><MobileTQGenericPagesModule.ClassFileRecord /></Suspense> },
        { path: 'teaching-quality/thousand-score', element: <Suspense fallback={<LoadingSpinner />}><MobileTQGenericPagesModule.ThousandScore /></Suspense> },
        { path: 'teaching-quality/class-status-summary', element: <Suspense fallback={<LoadingSpinner />}><MobileTQGenericPagesModule.ClassStatusSummary /></Suspense> },
        { path: 'teaching-quality/pressure-interview', element: <Suspense fallback={<LoadingSpinner />}><MobileTQGenericPagesModule.PressureInterview /></Suspense> },
        { path: 'teaching-quality/pressure-interview-rating', element: <Suspense fallback={<LoadingSpinner />}><MobileTQGenericPagesModule.PressureInterviewRating /></Suspense> },
        { path: 'teaching-quality/reputation-plan', element: <Suspense fallback={<LoadingSpinner />}><MobileTQReputationPlanPage /></Suspense> },
        { path: 'teaching-quality/reputation-key-points', element: <Suspense fallback={<LoadingSpinner />}><MobileTQReputationKeyPointsPage /></Suspense> },
        { path: 'teaching-quality/activity-plan', element: <Suspense fallback={<LoadingSpinner />}><MobileActivityPlanPage /></Suspense> },
        { path: 'teaching-quality/new-student-schedule', element: <Suspense fallback={<LoadingSpinner />}><MobileTQNewStudentSchedulePage /></Suspense> },
        { path: 'teaching-quality/promotion-plan', element: <Suspense fallback={<LoadingSpinner />}><MobilePromotionPlanPage /></Suspense> },
        { path: 'teaching-quality/student-movement-application', element: <Suspense fallback={<LoadingSpinner />}><MobileStudentMovementApplicationPage /></Suspense> },
        { path: 'teaching-quality/dorm-fee-notice', element: <Suspense fallback={<LoadingSpinner />}><MobileDormFeeNoticePage /></Suspense> },
        { path: 'teaching-quality/employee-function', element: <Suspense fallback={<LoadingSpinner />}><MobileTQManagementModule.EmployeeFunction /></Suspense> },
        { path: 'teaching-quality/employee-kpi', element: <Suspense fallback={<LoadingSpinner />}><MobileTQManagementModule.EmployeeKpi /></Suspense> },
        { path: 'teaching-quality/employee-interview', element: <Suspense fallback={<LoadingSpinner />}><MobileTQManagementModule.EmployeeInterview /></Suspense> },
        { path: 'teaching-quality/tq-meeting-record', element: <Suspense fallback={<LoadingSpinner />}><MobileTQManagementModule.MeetingRecord /></Suspense> },
        { path: 'teaching-quality/training-plan-score', element: <Suspense fallback={<LoadingSpinner />}><MobileTQManagementModule.TrainingPlanScore /></Suspense> },
        { path: 'teaching-quality/culture-presentation', element: <Suspense fallback={<LoadingSpinner />}><MobileTQCultureModule.Presentation /></Suspense> },
        { path: 'teaching-quality/culture-exam', element: <Suspense fallback={<LoadingSpinner />}><MobileTQCultureModule.Exam /></Suspense> },
        { path: 'teaching-quality/handover-list', element: <Suspense fallback={<LoadingSpinner />}><MobileHandoverListPage /></Suspense> },
        // ===== 市场部新增路由 =====
        { path: 'market/sem-daily', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketSemDailyPage /></Suspense> },
        { path: 'market/reputation-daily', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketReputationDailyPage /></Suspense> },
        { path: 'market/monthly-progress', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketMonthlyProgressPage /></Suspense> },
        { path: 'market/partner-contacts', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketPartnerContactsPage /></Suspense> },
        { path: 'market/online-partner-daily', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketOnlinePartnerDailyPage /></Suspense> },
        { path: 'market/staff-function', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketStaffFunctionPage /></Suspense> },
        { path: 'market/monthly-plan', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketMonthlyPlanPage /></Suspense> },
        { path: 'market/new-media-summary', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketGenericModule.NewMediaSummary /></Suspense> },
        { path: 'market/new-media-platform-detail', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketGenericModule.NewMediaPlatformDetail /></Suspense> },
        { path: 'market/network-summary', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketGenericModule.NetworkSummary /></Suspense> },
        { path: 'market/network-partner-monthly', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketGenericModule.NetworkPartnerMonthly /></Suspense> },
        { path: 'market/network-partner-annual', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketGenericModule.NetworkPartnerAnnual /></Suspense> },
        { path: 'market/channel-expense', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketGenericModule.ChannelExpense /></Suspense> },
        { path: 'market/channel-consultant', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketGenericModule.ChannelConsultant /></Suspense> },
        { path: 'market/sem-plan', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketGenericModule.SemPlan /></Suspense> },
        { path: 'market/sem-monthly', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketGenericModule.SemMonthly /></Suspense> },
        { path: 'market/sem-annual', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketGenericModule.SemAnnual /></Suspense> },
        { path: 'market/training-summary', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketGenericModule.TrainingSummary /></Suspense> },
        { path: 'market/meeting-record', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketGenericModule.MeetingRecord /></Suspense> },
        { path: 'market/core-summary', element: <Suspense fallback={<LoadingSpinner />}><MobileMarketGenericModule.CoreSummary /></Suspense> },
        // ===== 系统日志路由 =====
        { path: 'system/audit-log', element: <Suspense fallback={<LoadingSpinner />}><MobileAuditLogPage /></Suspense> },
        // ===== 功能导航路由 =====
        { path: 'functions', element: <Suspense fallback={<LoadingSpinner />}><MobileFunctionsPage /></Suspense> },
        {
          path: 'stats',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileStatsPage />
            </Suspense>
          ),
        },
        {
          path: 'staff',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileStaffPage />
            </Suspense>
          ),
        },
        {
          path: 'notifications',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileNotificationsPage />
            </Suspense>
          ),
        },
        {
          path: 'approvals',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileApprovalsPage />
            </Suspense>
          ),
        },
        {
          path: 'me',
          element: (
            <Suspense fallback={<LoadingSpinner />}>
              <MobileProfilePage />
            </Suspense>
          ),
        },
      ],
    },
    // ===== 404 兜底路由 =====
    {
      path: '*',
      element: (
        <AuthGuard>
          <Suspense fallback={<LoadingSpinner />}>
            <MainLayout />
          </Suspense>
        </AuthGuard>
      ),
      errorElement: <AppRouteError />,
      children: [
        {
          path: '*',
          element: <NotFoundPage />,
        },
      ],
    },
  ]
}
