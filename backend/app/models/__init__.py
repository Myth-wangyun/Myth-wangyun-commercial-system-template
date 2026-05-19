"""
数据库模型包
"""

from .academic_daily_work_summary import 智慧司日工作总结表
from .academic_meeting_record import 神殿学术管理数据会议记录表
from .academic_staff_interview import 智慧司访谈记录表
from .academic_standardization_check import 智慧司标准化检查表
from .audit_log import LogEntry, LogResource
from .campus_core_summary import 神殿核心数据汇总表
from .class_assignment_grade import ClassAssignmentGrade
from .class_course_schedule import 班排课表
from .class_employment_summary import 班级就业总结表
from .class_exam_score import ClassExamScore
from .config_master import (
    CampusProfile,
    ClassProfile,
    CourseProfile,
    HomeroomTeacherProfile,
    MajorProfile,
    TeacherClassAssignment,
    TeacherProfile,
)
from .consult import (
    TransferApprovalConfig,
    TransferApprovalConfigApprover,
)
from .courseware_writing_summary import 神殿智慧司课件编写汇总表
from .culture_exam import 企业文化考试计划表
from .culture_presentation import 企业文化宣讲计划表
from .employment import 班级就业明细表
from .employment_star_summary import 神殿后端就业明星汇总表
from .enterprise_survey_summary import 企业调研汇总表
from .human_resources import (
    DashboardDailyAggregate,
    DashboardManualRecruitmentDaily,
    DashboardMonthlyAggregate,
    DashboardRefreshState,
    DashboardYearlyAggregate,
    EmployeeArchiveChangeLog,
    EmployeeArchiveSnapshot,
    EmployeeProfile,
    InterviewRegistration,
    ManagementCenterDailyRecruitmentManual,
    PerformanceFact,
    PromotionApplication,
    PromotionApplicationApprovalAction,
    PromotionApplicationNotification,
    PromotionApprovalConfig,
    PromotionApprovalConfigApprover,
    RecruitmentApprovalConfig,
    RecruitmentApprovalConfigApprover,
    RecruitmentRequest,
    RecruitmentRequestApprovalAction,
    RecruitmentRequestNotification,
    RegularizationApplication,
    RegularizationApplicationApprovalAction,
    RegularizationApplicationNotification,
    ResignationApproval,
    ResignationApprovalAction,
    ResignationApprovalNotification,
    SalaryWelfareFact,
    SocialInsuranceApplication,
    SocialInsuranceApplicationApprovalAction,
    SocialInsuranceApplicationNotification,
    SocialInsuranceApprovalConfig,
    SocialInsuranceApprovalConfigApprover,
    SocialInsuranceCostSummary,
    TrainingApplication,
    TrainingApplicationApprovalAction,
    TrainingApplicationNotification,
    TrainingGoal,
    TrainingSatisfactionSurvey,
    UnpaidLeaveApplication,
    UnpaidLeaveApplicationApprovalAction,
    UnpaidLeaveApplicationNotification,
    WorkHandover,
    WorkHandoverApprovalAction,
    WorkHandoverNotification,
)
from .manager_function_evaluation import 最高议事厅学术经理功能评价表
from .market import *
from .new_student_arrangement import NewStudentArrangement
from .onboarding_offboarding_summary import 神殿智慧司入职离职汇总表
from .permission import Permission
from .position_analysis_summary import 智慧司岗位分析报告汇总表
from .press_interview_score import PressInterviewScore
from .project_grade_register import ProjectGradeRegister
from .project_plan import CampusProjectPlan
from .questionbank_writing_summary import 神殿智慧司题库编写汇总表
from .reputation_campus_goals_results import 神殿智慧司口碑招生目标与结果汇总表
from .reputation_campus_summary import 神殿智慧司口碑招生汇总表
from .reputation_key_point import ReputationKeyPointDetail
from .reputation_monthly_personal import 口碑招生月度个人目标与结果汇总表
from .reputation_personal import 神殿口碑招生个人目标与结果汇总表
from .reputation_registration import 口碑报名明细表
from .reputation_self_check import ReputationSelfCheck
from .role import Role
from .role_permission import RolePermission
from .salary_prediction import SalaryPrediction
from .staff_function_analysis import 神殿智慧司员工功能分析表
from .staff_monthly_performance import 神殿智慧司员工业绩逐月统计表
from .staff_performance_reward import 神殿智慧司教员业绩奖惩表
from .student_interview import StudentInterviewRecord
from .student_satisfaction_avg import StudentSatisfactionAvg
from .student_satisfaction_detail import StudentSatisfactionDetail
from .student_satisfaction_summary import 学员满意度汇总表
from .student_stability_monthly_summary import 神殿后端新生维稳月度汇总表
from .student_stability_personal_monthly import 神殿后端新生维稳个人按月汇总表
from .student_stability_personal_summary import 神殿后端新生维稳个人汇总表
from .teacher_class_exam_pass import 教员功能分析班级考试合格率表
from .teacher_employment_summary import 神殿后端教员就业汇总表
from .teacher_function_analysis import 教员功能分析总表
from .teacher_function_subtable import 教员功能分析子表
from .teacher_hour_stats import TeacherHourMonthlyStat
from .teacher_kpi import TeacherKPIAssessment, TeacherKPIResult, TeacherKPITemplate
from .teacher_lecture_score_sheet import TeacherLectureScoreSheet
from .teacher_project_pass import 教员功能分析项目合格率表
from .teacher_project_submission import 教员功能分析项目提交率表
from .teacher_staffing_ratio import 神殿智慧司师资配比表
from .teacher_superior_audit import 教员功能分析上级听课表
from .teacher_teacher_exam_pass import 教员功能分析教员考试合格率表
from .teacher_violation import 教员功能分析学员违纪表
from .teacher_yearly_lecture_score import TeacherYearlyLectureScore
from .teacher_yearly_lecture_score_summary import TeacherYearlyLectureScoreSummary
from .training_plan_summary import 神殿智慧司培训计划与成绩汇总表
from .user import Base as AccountBase
from .user import User
from .user_permission import UserPermissionDirect
from .permission_route_map import PermissionRouteMap
from .user_role import UserRole

__all__ = [
    "User", "AccountBase",
    "LogEntry", "LogResource",
    "Permission", "Role", "RolePermission", "UserRole",
    "UserPermissionDirect",
    "企业文化宣讲计划表", "企业文化考试计划表",
    "教员功能分析总表", "教员功能分析子表",
    "学员满意度汇总表", "教员功能分析上级听课表", "教员功能分析学员违纪表",
    "教员功能分析项目提交率表", "教员功能分析项目合格率表",
    "教员功能分析班级考试合格率表", "教员功能分析教员考试合格率表",
    "神殿学术管理数据会议记录表", "智慧司日工作总结表", "智慧司标准化检查表",
    "智慧司访谈记录表",
    "CampusProfile", "MajorProfile", "CourseProfile", "ClassProfile", "TeacherProfile", "HomeroomTeacherProfile", "TeacherClassAssignment",
    "TeacherKPITemplate", "TeacherKPIResult", "TeacherKPIAssessment",
    "TeacherHourMonthlyStat",
    "CampusProjectPlan",
    "StudentInterviewRecord",
    "ReputationKeyPointDetail",
    "ReputationSelfCheck",
    "NewStudentArrangement",
    "SalaryPrediction",
    "PressInterviewScore",
    "ClassExamScore",
    "ProjectGradeRegister",
    "StudentSatisfactionDetail",
    "StudentSatisfactionAvg",
    "ClassAssignmentGrade",
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
    "PromotionApprovalConfig",
    "PromotionApprovalConfigApprover",
    "PromotionApplication",
    "PromotionApplicationApprovalAction",
    "PromotionApplicationNotification",
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
    "TrainingSatisfactionSurvey",
    "UnpaidLeaveApplication",
    "UnpaidLeaveApplicationApprovalAction",
    "UnpaidLeaveApplicationNotification",
    "WorkHandover",
    "WorkHandoverApprovalAction",
    "WorkHandoverNotification",
    "TransferApprovalConfig",
    "TransferApprovalConfigApprover",
    "口碑招生月度个人目标与结果汇总表",
    "神殿口碑招生个人目标与结果汇总表",
    "神殿智慧司口碑招生汇总表",
    "神殿智慧司口碑招生目标与结果汇总表",
    "口碑报名明细表",
    "神殿后端新生维稳个人按月汇总表",
    "神殿后端新生维稳个人汇总表",
    "神殿后端新生维稳月度汇总表",
    "班级就业明细表",
    "神殿后端教员就业汇总表",
    "班级就业总结表",
    "神殿后端就业明星汇总表",
    "班排课表",
    "神殿智慧司员工业绩逐月统计表",
    "神殿智慧司培训计划与成绩汇总表",
    "神殿智慧司员工功能分析表",
    "神殿智慧司入职离职汇总表",
    "神殿智慧司师资配比表",
    "神殿智慧司题库编写汇总表",
    "神殿智慧司课件编写汇总表",
    "智慧司岗位分析报告汇总表",
    "企业调研汇总表",
    "最高议事厅学术经理功能评价表",
    "神殿智慧司教员业绩奖惩表",
    "神殿核心数据汇总表",
    "TeacherLectureScoreSheet",
    "TeacherYearlyLectureScore",
    "TeacherYearlyLectureScoreSummary",
    "MarketAccountSentimentRegister",
]
