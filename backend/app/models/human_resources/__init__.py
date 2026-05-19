"""
人力资源相关数据模型
"""

from .appointment_interview_record import (
    AppointmentInterviewRecord,
    AppointmentInterviewRecordApprovalAction,
    AppointmentInterviewRecordNotification,
)
from .approval_workflow import (
    ApprovalFlowTemplate,
    ApprovalFlowTemplateNode,
    OrgResponsibilityBinding,
)
from .employee import EmployeeProfile
from .employee_archive_change_log import EmployeeArchiveChangeLog
from .hr_dashboard import (
    DashboardDailyAggregate,
    DashboardManualRecruitmentDaily,
    DashboardMonthlyAggregate,
    DashboardRefreshState,
    DashboardYearlyAggregate,
    EmployeeArchiveSnapshot,
    PerformanceFact,
    SalaryWelfareFact,
)
from .interview_registration import InterviewRegistration
from .management_center_daily_recruitment_manual import (
    ManagementCenterDailyRecruitmentManual,
)
from .promotion_application import (
    PromotionApplication,
    PromotionApplicationApprovalAction,
    PromotionApplicationNotification,
    PromotionApprovalConfig,
    PromotionApprovalConfigApprover,
)
from .promotion_interview import PromotionInterview
from .recruitment_request import (
    RecruitmentApprovalConfig,
    RecruitmentApprovalConfigApprover,
    RecruitmentRequest,
    RecruitmentRequestApprovalAction,
    RecruitmentRequestNotification,
)
from .regularization_application import (
    RegularizationApplication,
    RegularizationApplicationApprovalAction,
    RegularizationApplicationNotification,
    RegularizationApprovalConfig,
    RegularizationApprovalConfigApprover,
)
from .resignation_approval import (
    ResignationApproval,
    ResignationApprovalAction,
    ResignationApprovalNotification,
)
from .social_insurance_application import (
    SocialInsuranceApplication,
    SocialInsuranceApplicationApprovalAction,
    SocialInsuranceApplicationNotification,
    SocialInsuranceApprovalConfig,
    SocialInsuranceApprovalConfigApprover,
)
from .social_insurance_cost_summary import SocialInsuranceCostSummary
from .training_application import (
    TrainingApplication,
    TrainingApplicationApprovalAction,
    TrainingApplicationNotification,
)
from .training_goal import TrainingGoal
from .training_result import TrainingResult
from .training_satisfaction import TrainingSatisfactionSurvey
from .transfer_application import (
    TransferApplication,
    TransferApplicationApprovalAction,
    TransferApplicationNotification,
)
from .unpaid_leave_application import (
    UnpaidLeaveApplication,
    UnpaidLeaveApplicationApprovalAction,
    UnpaidLeaveApplicationNotification,
)
from .work_report import WorkReport
from .work_handover import (
    WorkHandover,
    WorkHandoverApprovalAction,
    WorkHandoverNotification,
)

__all__ = [
    "AppointmentInterviewRecord",
    "AppointmentInterviewRecordApprovalAction",
    "AppointmentInterviewRecordNotification",
    "ApprovalFlowTemplate",
    "ApprovalFlowTemplateNode",
    "EmployeeProfile",
    "EmployeeArchiveChangeLog",
    "DashboardDailyAggregate",
    "DashboardManualRecruitmentDaily",
    "DashboardMonthlyAggregate",
    "DashboardRefreshState",
    "DashboardYearlyAggregate",
    "EmployeeArchiveSnapshot",
    "InterviewRegistration",
    "ManagementCenterDailyRecruitmentManual",
    "PerformanceFact",
    "OrgResponsibilityBinding",
    "PromotionApprovalConfig",
    "PromotionApprovalConfigApprover",
    "PromotionApplication",
    "PromotionApplicationApprovalAction",
    "PromotionApplicationNotification",
    "PromotionInterview",
    "RecruitmentApprovalConfig",
    "RecruitmentApprovalConfigApprover",
    "RecruitmentRequest",
    "RecruitmentRequestApprovalAction",
    "RecruitmentRequestNotification",
    "ResignationApproval",
    "ResignationApprovalAction",
    "ResignationApprovalNotification",
    "RegularizationApplication",
    "RegularizationApplicationApprovalAction",
    "RegularizationApplicationNotification",
    "RegularizationApprovalConfig",
    "RegularizationApprovalConfigApprover",
    "SocialInsuranceApprovalConfig",
    "SocialInsuranceApprovalConfigApprover",
    "SocialInsuranceApplication",
    "SocialInsuranceApplicationApprovalAction",
    "SocialInsuranceApplicationNotification",
    "SocialInsuranceCostSummary",
    "SalaryWelfareFact",
    "TrainingApplication",
    "TrainingApplicationApprovalAction",
    "TrainingApplicationNotification",
    "TrainingGoal",
    "TrainingResult",
    "TrainingSatisfactionSurvey",
    "TransferApplication",
    "TransferApplicationApprovalAction",
    "TransferApplicationNotification",
    "UnpaidLeaveApplication",
    "UnpaidLeaveApplicationApprovalAction",
    "UnpaidLeaveApplicationNotification",
    "WorkReport",
    "WorkHandover",
    "WorkHandoverApprovalAction",
    "WorkHandoverNotification",
]
