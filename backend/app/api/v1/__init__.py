"""
API v1路由
"""

from app.api.v1.endpoints.consult import consultant_assignment as consult_consultant_assignment
from app.api.v1.endpoints.consult import consultant_data_summary as consult_consultant_data_summary
from app.api.v1.endpoints.consult import (
    consultant_data_summary_v2 as consult_consultant_data_summary_v2,
)
from app.api.v1.endpoints.consult import (
    consultant_data_summary_v3 as consult_consultant_data_summary_v3,
)
from app.api.v1.endpoints.consult import consultant_list as consult_consultant_list
from app.api.v1.endpoints.consult import consultant_monthly_plan as consult_consultant_monthly_plan
from app.api.v1.endpoints.consult import consultant_transfer as consult_consultant_transfer
from app.api.v1.endpoints.consult import (
    consultation_communication as consult_consultation_communication,
)
from app.api.v1.endpoints.consult import consultation_record as consult_consultation_record
from app.api.v1.endpoints.consult import consultation_stats as consult_consultation_stats
from app.api.v1.endpoints.consult import (
    daily_consulting_summary as consult_daily_consulting_summary,
)
from app.api.v1.endpoints.consult import entry_exit_detail as consult_entry_exit_detail
from app.api.v1.endpoints.consult import export_approval as consult_export_approval
from app.api.v1.endpoints.consult import financial_income_refund as consult_financial_income_refund
from app.api.v1.endpoints.consult import handover as consult_handover
from app.api.v1.endpoints.consult import hr_basic as consult_hr_basic
from app.api.v1.endpoints.consult import meeting_record as consult_meeting_record
from app.api.v1.endpoints.consult import (
    my_channel_consultations as consult_my_channel_consultations,
)
from app.api.v1.endpoints.consult import my_consultations as consult_my_consultations
from app.api.v1.endpoints.consult import payment_record as consult_payment_record
from app.api.v1.endpoints.consult import phone_location as consult_phone_location
from app.api.v1.endpoints.consult import population_analysis as consult_population_analysis
from app.api.v1.endpoints.consult import protection_period as consult_protection_period
from app.api.v1.endpoints.consult import staff_function as consult_staff_function
from app.api.v1.endpoints.consult import staff_interview as consult_staff_interview
from app.api.v1.endpoints.consult import staffing as consult_staffing
from app.api.v1.endpoints.consult import training_monthly as consult_training_monthly
from app.api.v1.endpoints.consult import training_weekly as consult_training_weekly
from app.api.v1.endpoints.consult import transfer as consult_transfer
from app.api.v1.endpoints.consult import (
    transfer_approval_config as consult_transfer_approval_config,
)
from app.api.v1.market import router as market_router

# 祈福司相关模块
from app.services.consult import entry_exit_summary, face_to_face_check, phone_check

# 百度营销API（直接注册到 /api/v1 下，回调地址不带 /market）
from app.services.market.baidu_marketing.routes import router as baidu_marketing_router
from fastapi import APIRouter

from .endpoints import (
    academic_daily_work_summary,
    academic_dashboard,
    academic_meeting_record,
    academic_staff_interview,
    academic_standardization_check,
    approval_center,
    assignment_stats,
    audit_log,
    # market,
    # partner,
    auth,
    campus_core_data_summary,
    campus_core_stats,
    campus_employment,
    campus_info,
    campus_management,
    campus_market,
    campus_project_plan,
    channel_agent_data,
    class_assignment_grade,
    class_course_schedule,
    class_employment_summary,
    class_exam_score,
    config_master,
    courseware_writing_summary,
    culture_exam,
    culture_presentation,
    employment_star,
    # employment,
    employment_unified,
    enterprise_survey_summary,
    exam_stats,
    health,
    kpi_teachers,
    manager_function_evaluation,
    network_survey_summary,
    new_student_arrangement,
    new_student_loss_detail,
    onboarding_offboarding_summary,
    permission_management,
    position_analysis_summary,
    press_interview_header_config,
    press_interview_score,
    project_grade_register,
    project_stats,
    questionbank_writing_summary,
    reputation_aggregation,
    reputation_campus_summary,
    reputation_key_point,
    reputation_monthly_personal,
    reputation_personal,
    reputation_registration,
    reputation_self_check,
    reputation_stats,
    salary_prediction,
    satisfaction_stats,
    staff_employment_stats,
    staff_function_analysis,
    staff_monthly_performance,
    staff_performance_reward,
    student_interview,
    student_satisfaction_detail,
    student_satisfaction_summary,
    student_stability_monthly_summary,
    student_stability_personal_monthly,
    student_stability_personal_summary,
    teacher_class_exam_pass,
    teacher_employment_summary,
    teacher_function_analysis,
    teacher_function_subtable,
    teacher_hour_stats,
    teacher_kpi,
    teacher_kpi_auto,
    teacher_lecture_score_sheet,
    teacher_project_pass,
    teacher_project_submission,
    teacher_staffing_ratio,
    teacher_superior_audit,
    teacher_teacher_exam_pass,
    teacher_violation,
    teacher_yearly_lecture_score,
    teacher_yearly_lecture_score_summary,
    training_plan_summary,
    violation_stats,
)
from .endpoints.human_resources import (
    appointment_interview_record,
    approval_workflow,
    dashboard,
    employee_archive,
    interview_registration,
    management_center_daily_recruitment_manual,
    promotion_application,
    promotion_interview,
    recruitment_request,
    regularization_application,
    resignation_approval,
    social_insurance_application,
    social_insurance_cost_summary,
    training_application,
    training_goal,
    training_result,
    training_satisfaction,
    transfer_application,
    unpaid_leave_application,
    work_report,
    work_handover,
)

api_router = APIRouter()

api_router.include_router(
    market_router,
    prefix="/market",
    tags=["市场部"],
)

# 百度营销API（回调地址: /api/v1/baidu-marketing/oauth/callback）
api_router.include_router(
    baidu_marketing_router,
    tags=["百度营销API"],
)

# 注册各个模块的路由
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["认证模块"]
)

api_router.include_router(
    campus_management.router,
    prefix="/campus",
    tags=["神殿表管理"]
)

api_router.include_router(
    campus_market.router,
    prefix="/campus-market",
    tags=["神殿市场数据"]
)

api_router.include_router(
    campus_employment.router,
    prefix="/campus-employment",
    tags=["神殿就业数据"]
)

# 就业信息管理（融合版：智慧司+教化司）
api_router.include_router(
    employment_unified.router,
    prefix="/employment",
    tags=["就业信息管理（融合版）"]
)

api_router.include_router(
    campus_core_stats.router,
    prefix="/campus-core-stats",
    tags=["神殿核心数据统计"]
)

api_router.include_router(
    channel_agent_data.router,
    prefix="/channel-agent-data",
    tags=["渠道代理数据"]
)

api_router.include_router(
    academic_dashboard.router,
    prefix="/academic-dashboard",
    tags=["智慧司核心数据"]
)

api_router.include_router(
    culture_presentation.router,
    prefix="/culture-presentation",
    tags=["企业文化宣讲计划"]
)

api_router.include_router(
    culture_exam.router,
    prefix="/culture-exam",
    tags=["企业文化考试计划"]
)

api_router.include_router(
    staff_function_analysis.router,
    prefix="/staff-function-analysis",
    tags=["神殿智慧司员工功能分析"],
)
api_router.include_router(
    staff_employment_stats.router,
    prefix="/staff-employment-stats",
    tags=["神殿教员就业月度统计"],
)
api_router.include_router(
    staff_monthly_performance.router,
    prefix="/staff-monthly-performance",
    tags=["神殿智慧司员工业绩逐月统计表"],
)

api_router.include_router(
    training_plan_summary.router,
    prefix="/training-plan-summary",
    tags=["神殿智慧司培训计划与成绩汇总表"],
)

api_router.include_router(
    onboarding_offboarding_summary.router,
    prefix="/onboarding-offboarding-summary",
    tags=["神殿智慧司入职离职汇总表"],
)

api_router.include_router(
    teacher_staffing_ratio.router,
    prefix="/teacher-staffing-ratio",
    tags=["神殿智慧司师资配比表"],
)

api_router.include_router(
    questionbank_writing_summary.router,
    prefix="/questionbank-writing-summary",
    tags=["神殿智慧司题库编写汇总表"],
)

api_router.include_router(
    courseware_writing_summary.router,
    prefix="/courseware-writing-summary",
    tags=["神殿智慧司课件编写汇总表"],
)

api_router.include_router(
    position_analysis_summary.router,
    prefix="/position-analysis-summary",
    tags=["智慧司岗位分析报告汇总表"],
)

api_router.include_router(
    enterprise_survey_summary.router,
    prefix="/enterprise-survey-summary",
    tags=["企业调研汇总表"],
)

api_router.include_router(
    network_survey_summary.router,
    prefix="/network-survey-summary",
    tags=["网络调查汇总表"],
)

api_router.include_router(
    assignment_stats.router,
    prefix="/assignment-stats",
    tags=["作业成绩汇总"],
)

api_router.include_router(
    exam_stats.router,
    prefix="/exam-stats",
    tags=["考试成绩汇总"],
)

api_router.include_router(
    project_stats.router,
    prefix="/project-stats",
    tags=["项目成绩汇总"],
)

api_router.include_router(
    satisfaction_stats.router,
    prefix="/satisfaction-stats",
    tags=["学员满意度汇总"],
)

api_router.include_router(
    violation_stats.router,
    prefix="/violation-stats",
    tags=["学员违纪汇总"],
)

api_router.include_router(
    teacher_function_analysis.router,
    prefix="/teacher-function-analysis",
    tags=["教员功能分析总表"]
)

api_router.include_router(
    teacher_function_subtable.router,
    prefix="/teacher-function-subtable",
    tags=["教员功能分析子表"]
)

api_router.include_router(
    student_satisfaction_summary.router,
    prefix="/student-satisfaction-summary",
    tags=["学员满意度汇总表"]
)

api_router.include_router(
    teacher_superior_audit.router,
    prefix="/teacher-superior-audit",
    tags=["教员功能分析上级听课表"]
)

api_router.include_router(
    teacher_violation.router,
    prefix="/teacher-violation",
    tags=["教员功能分析学员违纪表"]
)

api_router.include_router(
    teacher_project_submission.router,
    prefix="/teacher-project-submission",
    tags=["教员功能分析项目提交率表"]
)

api_router.include_router(
    teacher_project_pass.router,
    prefix="/teacher-project-pass",
    tags=["教员功能分析项目合格率表"]
)

api_router.include_router(
    teacher_class_exam_pass.router,
    prefix="/teacher-class-exam-pass",
    tags=["教员功能分析班级考试合格率表"]
)

api_router.include_router(
    teacher_teacher_exam_pass.router,
    prefix="/teacher-teacher-exam-pass",
    tags=["教员功能分析教员考试合格率表"]
)

api_router.include_router(
    academic_meeting_record.router,
    prefix="/academic-meeting-record",
    tags=["神殿学术管理数据会议记录表"]
)

api_router.include_router(
    academic_daily_work_summary.router,
    prefix="/academic-daily-work-summary",
    tags=["智慧司日工作总结表"]
)

api_router.include_router(
    academic_standardization_check.router,
    prefix="/academic-standardization-check",
    tags=["智慧司标准化检查表"]
)

api_router.include_router(
    academic_staff_interview.router,
    prefix="/academic-staff-interview",
    tags=["智慧司教员访谈记录表"]
)
api_router.include_router(
    kpi_teachers.router,
    prefix="/kpi-teachers",
    tags=["教员名单"]
)
api_router.include_router(
    config_master.router,
    prefix="/config",
    tags=["基础配置"]
)
api_router.include_router(
    consult_transfer_approval_config.router,
    prefix="/config",
    tags=["祈福司转量审批配置"]
)
api_router.include_router(
    teacher_kpi.router,
    prefix="/kpi-results",
    tags=["教员KPI"]
)

# 教员KPI自动计算
api_router.include_router(
    teacher_kpi_auto.router,
    prefix="/academic",
    tags=["教员KPI自动计算"]
)
api_router.include_router(
    teacher_hour_stats.router,
    prefix="/teacher-hour-stats",
    tags=["教员课时统计"]
)
api_router.include_router(
    campus_project_plan.router,
    prefix="/campus-project-plan",
    tags=["智慧司项目计划表"]
)
api_router.include_router(
    student_interview.router,
    prefix="/student-interview-records",
    tags=["学员访谈记录"]
)
api_router.include_router(
    reputation_key_point.router,
    prefix="/reputation-key-points",
    tags=["口碑关键点结果明细"]
)
api_router.include_router(
    reputation_self_check.router,
    prefix="/reputation-self-check",
    tags=["口碑工作自查表"]
)
api_router.include_router(
    new_student_arrangement.router,
    prefix="/new-student-arrangements",
    tags=["每日新生安排"]
)
api_router.include_router(
    press_interview_score.router,
    prefix="/press-interview-scores",
    tags=["压力面试成绩"]
)
api_router.include_router(
    press_interview_header_config.router,
    prefix="/press-interview-header-configs",
    tags=["压力面试表头配置"]
)
api_router.include_router(
    class_exam_score.router,
    prefix="/class-exam-scores",
    tags=["班考试成绩"]
)
api_router.include_router(
    project_grade_register.router,
    prefix="/project-grade-registers",
    tags=["项目成绩表"]
)
api_router.include_router(
    student_satisfaction_detail.router,
    prefix="/student-satisfaction",
    tags=["学员满意度详情"]
)
api_router.include_router(
    salary_prediction.router,
    prefix="/salary",
    tags=["薪资预估表"]
)
api_router.include_router(
    class_assignment_grade.router,
    prefix="/class-assignment",
    tags=["班作业成绩表"]
)
api_router.include_router(
    teacher_yearly_lecture_score.router,
    prefix="/teacher-yearly-lecture-score",
    tags=["教员年度听课打分表"]
)
api_router.include_router(
    teacher_yearly_lecture_score_summary.router,
    prefix="/teacher-yearly-lecture-score",
    tags=["教员年度听课打分汇总表"]
)
api_router.include_router(
    teacher_lecture_score_sheet.router,
    prefix="/teacher-lecture-score",
    tags=["听课成绩表"]
)
api_router.include_router(
    reputation_personal.router,
    prefix="/reputation-personal",
    tags=["神殿口碑招生个人目标与结果汇总表"]
)
api_router.include_router(
    reputation_monthly_personal.router,
    prefix="/reputation-monthly-personal",
    tags=["口碑招生月度个人目标与结果汇总表"]
)
api_router.include_router(
    reputation_campus_summary.router,
    prefix="/reputation-campus-summary",
    tags=["神殿智慧司口碑招生汇总表"]
)
api_router.include_router(
    reputation_registration.router,
    prefix="/reputation-registration",
    tags=["口碑报名明细表"]
)
api_router.include_router(
    reputation_aggregation.router,
    prefix="/reputation-aggregation",
    tags=["口碑招生数据聚合"]
)
api_router.include_router(
    reputation_stats.router,
    prefix="/reputation-stats",
    tags=["教员口碑统计"]
)
api_router.include_router(
    student_stability_personal_monthly.router,
    prefix="/student-stability-personal-monthly",
    tags=["神殿后端新生维稳个人按月汇总表"]
)
api_router.include_router(
    student_stability_personal_summary.router,
    prefix="/student-stability-personal-summary",
    tags=["神殿后端新生维稳个人汇总表"]
)
api_router.include_router(
    student_stability_monthly_summary.router,
    prefix="/student-stability-monthly-summary",
    tags=["神殿后端新生维稳月度汇总表"]
)
api_router.include_router(
    teacher_employment_summary.router,
    prefix="/teacher-employment-summary",
    tags=["神殿后端教员就业汇总表"]
)
api_router.include_router(
    class_employment_summary.router,
    prefix="/class-employment-summary",
    tags=["班级就业总结表"]
)

api_router.include_router(
    class_course_schedule.router,
    prefix="/class-course-schedule",
    tags=["班排课表"]
)

api_router.include_router(
    employment_star.router,
    prefix="/employment-stars",
    tags=["神殿后端就业明星汇总表"]
)
api_router.include_router(
    campus_core_data_summary.router,
    prefix="/campus-core-data-summary",
    tags=["神殿智慧司核心数据汇总表"]
)

api_router.include_router(
    manager_function_evaluation.router,
    prefix="/manager-function-evaluation",
    tags=["最高议事厅学术经理功能评价表"]
)

api_router.include_router(
    staff_performance_reward.router,
    prefix="/staff-performance-reward",
    tags=["神殿智慧司教员业绩奖惩表"]
)

api_router.include_router(
    audit_log.router,
    prefix="/logs",
    tags=["审计日志"]
)

api_router.include_router(
    new_student_loss_detail.router,
    prefix="/new-student-loss-detail",
    tags=["新生流失明细表"]
)

api_router.include_router(
    health.router,
    prefix="/health",
    tags=["健康检查"]
)

# 祈福司模块
api_router.include_router(
    face_to_face_check.router,
    prefix="/consult/face-to-face",
    tags=["当面标准化检查表"]
)

api_router.include_router(
    phone_check.router,
    prefix="/consult/phone",
    tags=["电话标准化检查表"]
)

api_router.include_router(
    entry_exit_summary.router,
    prefix="/consult",
    tags=["祈福司入职离职汇总表"]
)

api_router.include_router(
    consult_entry_exit_detail.router,
    prefix="/consult/entry-exit-detail",
    tags=["祈福司入职离职明细表"]
)

api_router.include_router(
    consult_staff_interview.router,
    prefix="/consult/staff-interview",
    tags=["祈福司员工访谈记录表"]
)

api_router.include_router(
    consult_meeting_record.router,
    prefix="/consult/meeting-record",
    tags=["祈福司会议记录表"]
)

api_router.include_router(
    consult_consultation_record.router,
    prefix="/consult",
    tags=["咨询量录入系统"]
)

api_router.include_router(
    consult_consultation_stats.router,
    prefix="/consult",
    tags=["咨询量统计系统"]
)

api_router.include_router(    consult_daily_consulting_summary.router,
    prefix="/consult",
    tags=["005神殿每日咨询量汇总"]
)

api_router.include_router(    consult_protection_period.router,
    prefix="/consult",
    tags=["咨询量保护期管理"]
)

api_router.include_router(
    consult_my_consultations.router,
    prefix="/consult",
    tags=["我的咨询量"]
)

api_router.include_router(
    consult_my_channel_consultations.router,
    prefix="/consult",
    tags=["我的渠道咨询量"]
)

api_router.include_router(
    consult_transfer.router,
    prefix="/consult",
    tags=["咨询量转量管理"]
)

api_router.include_router(
    consult_consultant_transfer.router,
    prefix="/consult",
    tags=["咨询师转量管理"]
)

api_router.include_router(
    consult_consultation_communication.router,
    prefix="/consult",
    tags=["咨询沟通记录与电话量统计"]
)

api_router.include_router(
    consult_payment_record.router,
    prefix="/consult",
    tags=["缴费记录管理"]
)

api_router.include_router(
    consult_training_weekly.router,
    prefix="/consult",
    tags=["祈福司培训周度表"]
)

api_router.include_router(
    consult_training_monthly.router,
    prefix="/consult",
    tags=["祈福司培训月度表"]
)

api_router.include_router(
    consult_staffing.router,
    prefix="/consult",
    tags=["祈福司职数管理"]
)

api_router.include_router(
    consult_staff_function.router,
    prefix="/consult",
    tags=["祈福司员工功能分析"]
)

api_router.include_router(
    consult_hr_basic.router,
    prefix="/consult",
    tags=["祈福司人力资源基础信息"]
)

api_router.include_router(
    consult_consultant_list.router,
    prefix="/consult",
    tags=["咨询师列表"]
)

api_router.include_router(
    consult_phone_location.router,
    prefix="/consult",
    tags=["电话归属地查询"]
)

api_router.include_router(
    consult_financial_income_refund.router,
    prefix="/consult/financial",
    tags=["财务收入和退费"]
)

api_router.include_router(
    consult_population_analysis.router,
    prefix="/consult/population",
    tags=["004神殿各类人群数据汇总"]
)

api_router.include_router(
    consult_consultant_monthly_plan.router,
    prefix="/consult/consultant-plan",
    tags=["咨询师月度计划"]
)

api_router.include_router(
    consult_consultant_data_summary.router,
    prefix="/consult/consultant-data-summary",
    tags=["003神殿各咨询师数据汇总新"]
)

api_router.include_router(
    consult_consultant_data_summary_v2.router,
    prefix="/consult/consultant-data-summary-v2",
    tags=["003神殿各咨询师数据汇总V2"]
)

api_router.include_router(
    consult_consultant_assignment.router,
    prefix="/consult/consultant-assignment",
    tags=["咨询师月度归属管理"]
)

api_router.include_router(
    consult_consultant_data_summary_v3.router,
    prefix="/consult/consultant-data-summary-v3",
    tags=["003神殿各咨询师数据汇总V3"]
)

api_router.include_router(
    consult_export_approval.router,
    prefix="/consult/export",
    tags=["咨询量导出审批"]
)

api_router.include_router(
    consult_handover.router,
    prefix="/consult/handover",
    tags=["咨询量交接"]
)

# 市场咨询配置
from app.api.v1.endpoints import media_source_config

api_router.include_router(
    media_source_config.router,
    prefix="/config",
    tags=["市场咨询配置"]
)

# 咨询量计算时段配置
from app.api.v1.endpoints import consultation_schedule_config

api_router.include_router(
    consultation_schedule_config.router,
    prefix="/config",
    tags=["咨询量计算时段配置"]
)

# 神殿信息管理
api_router.include_router(
    campus_info.router,
    prefix="/campus-info",
    tags=["神殿信息管理"]
)

# 权限划分管理
api_router.include_router(
    permission_management.router,
    prefix="/permission-management",
    tags=["权限划分管理"]
)

api_router.include_router(
    approval_center.router,
    prefix="/approvals",
    tags=["审批中心"]
)

api_router.include_router(
    approval_workflow.router,
    prefix="/human-resources",
    tags=["集团人资基础-审批规则配置"]
)

api_router.include_router(
    employee_archive.router,
    prefix="/human-resources",
    tags=["集团人资基础-员工档案表"]
)
api_router.include_router(
    dashboard.router,
    prefix="/human-resources",
    tags=["人资看板聚合"]
)

api_router.include_router(
    recruitment_request.router,
    prefix="/human-resources",
    tags=["集团人资基础-招聘需求申请"]
)

api_router.include_router(
    interview_registration.router,
    prefix="/human-resources",
    tags=["集团人资基础-面试登记表"]
)

api_router.include_router(
    management_center_daily_recruitment_manual.router,
    prefix="/human-resources",
    tags=["最高议事厅日度核心数据看板-招聘及入职手填数据"]
)

api_router.include_router(
    training_goal.router,
    prefix="/human-resources",
    tags=["集团人资基础-培训目标"]
)

api_router.include_router(
    training_application.router,
    prefix="/human-resources",
    tags=["集团人资基础-培训申请表"]
)

api_router.include_router(
    training_result.router,
    prefix="/human-resources",
    tags=["集团人资基础-培训成绩汇总表"]
)

api_router.include_router(
    training_satisfaction.router,
    prefix="/human-resources",
    tags=["集团人资基础-培训满意度调查"]
)

api_router.include_router(
    regularization_application.router,
    prefix="/human-resources",
    tags=["集团人资基础-转正申请"]
)

api_router.include_router(
    promotion_application.router,
    prefix="/human-resources",
    tags=["集团人资基础-晋升申请"]
)

api_router.include_router(
    promotion_interview.router,
    prefix="/human-resources",
    tags=["集团人资基础-晋升面试评价表"]
)

api_router.include_router(
    appointment_interview_record.router,
    prefix="/human-resources",
    tags=["集团人资基础-任命访谈记录表"]
)

api_router.include_router(
    social_insurance_application.router,
    prefix="/human-resources",
    tags=["集团人资基础-社保申请"]
)

api_router.include_router(
    social_insurance_cost_summary.router,
    prefix="/human-resources",
    tags=["集团人资基础-社保费用汇总表"]
)

api_router.include_router(
    transfer_application.router,
    prefix="/human-resources",
    tags=["集团人资基础-调岗申请"]
)

api_router.include_router(
    unpaid_leave_application.router,
    prefix="/human-resources",
    tags=["集团人资基础-停薪留职申请"]
)

api_router.include_router(
    work_report.router,
    prefix="/human-resources",
    tags=["集团人资基础-转正述职报告"]
)

api_router.include_router(
    work_handover.router,
    prefix="/human-resources",
    tags=["集团人资基础-工作交接表"]
)

api_router.include_router(
    resignation_approval.router,
    prefix="/human-resources",
    tags=["集团人资基础-离职审批单"]
)

# 神祇管理API
from app.api.v1.endpoints import god

# 直接注册，不添加额外prefix（god.py中已有prefix="/god"）
api_router.include_router(
    god.router,
    tags=["神祇管理"]
)

api_router.include_router(
    god.admin_router,
    prefix="/admin-auth",
    tags=["管理员认证"]
)

__all__ = ["api_router"]
