# -*- coding: utf-8 -*-
"""
教学质量模块统一路由
将所有 teaching_quality 模块的 API 路由统一注册（静态导入版本）
"""
# ==================== 静态导入所有 API 模块 ====================
# TQ 前缀的 API 模块（按字母顺序排列，TQcampus_manager_analysis_api 优先）
# TQ_ 前缀的 API 模块（下划线分隔）
from app.teaching_quality.TQ_campus_recruitment_plan_summary_api import (
    router as TQ_campus_recruitment_plan_summary_router,
)
from app.teaching_quality.TQ_class_employment_summary_api import (
    router as TQ_class_employment_summary_router,
)
from app.teaching_quality.TQactivity_plan_arrangement_api import (
    router as TQactivity_plan_arrangement_router,
)
from app.teaching_quality.TQadult_exam_registration_roster_api import (
    router as TQadult_exam_registration_roster_router,
)
from app.teaching_quality.TQadult_exam_to_register_roster_api import (
    router as TQadult_exam_to_register_roster_router,
)
from app.teaching_quality.TQcampus_core_data_summary_api import (
    router as TQcampus_core_data_summary_router,
)
from app.teaching_quality.TQcampus_dormitory_rent_payment_info_api import (
    router as TQcampus_dormitory_rent_payment_info_router,
)
from app.teaching_quality.TQcampus_dormitory_statistics_summary_api import (
    router as TQcampus_dormitory_statistics_summary_router,
)
from app.teaching_quality.TQcampus_enrollment_statistics_api import (
    router as TQcampus_enrollment_statistics_router,
)
from app.teaching_quality.TQcampus_enterprise_contract_goal_api import (
    router as TQcampus_enterprise_contract_goal_router,
)
from app.teaching_quality.TQcampus_female_dormitory_detail_api import (
    router as TQcampus_female_dormitory_detail_router,
)
from app.teaching_quality.TQcampus_long_absence_detail_api import (
    router as TQcampus_long_absence_detail_router,
)
from app.teaching_quality.TQcampus_long_leave_detail_api import (
    router as TQcampus_long_leave_detail_router,
)
from app.teaching_quality.TQcampus_male_dormitory_detail_api import (
    router as TQcampus_male_dormitory_detail_router,
)
from app.teaching_quality.TQcampus_manager_analysis_api import (
    router as TQcampus_manager_analysis_router,
)
from app.teaching_quality.TQcampus_monthly_class_promotion_goals_results_api import (
    router as TQcampus_monthly_class_promotion_goals_results_router,
)
from app.teaching_quality.TQcampus_monthly_new_stu_stability_detail_api import (
    router as TQcampus_monthly_new_stu_stability_detail_router,
)
from app.teaching_quality.TQcampus_monthly_new_stu_stability_summary_api import (
    router as TQcampus_monthly_new_stu_stability_summary_router,
)
from app.teaching_quality.TQcampus_monthly_personal_dormitory_mgmt_api import (
    router as TQcampus_monthly_personal_dormitory_mgmt_router,
)
from app.teaching_quality.TQcampus_monthly_personal_new_stu_stability_api import (
    router as TQcampus_monthly_personal_new_stu_stability_router,
)
from app.teaching_quality.TQcampus_monthly_personal_promotion_goals_results_api import (
    router as TQcampus_monthly_personal_promotion_goals_results_router,
)
from app.teaching_quality.TQcampus_monthly_personal_reputation_enrollment_goals_results_api import (
    router as TQcampus_monthly_personal_reputation_enrollment_goals_results_router,
)
from app.teaching_quality.TQcampus_monthly_personal_stu_movement_api import (
    router as TQcampus_monthly_personal_stu_movement_router,
)
from app.teaching_quality.TQcampus_new_stu_arrears_detail_api import (
    router as TQcampus_new_stu_arrears_detail_router,
)
from app.teaching_quality.TQcampus_other_situation_detail_api import (
    router as TQcampus_other_situation_detail_router,
)
from app.teaching_quality.TQcampus_personal_dormitory_mgmt_summary_api import (
    router as TQcampus_personal_dormitory_mgmt_summary_router,
)
from app.teaching_quality.TQcampus_personal_enrollment_statistics_api import (
    router as TQcampus_personal_enrollment_statistics_router,
)
from app.teaching_quality.TQcampus_personal_new_stu_stability_summary_api import (
    router as TQcampus_personal_new_stu_stability_summary_router,
)
from app.teaching_quality.TQcampus_personal_promotion_goals_results_api import (
    router as TQcampus_personal_promotion_goals_results_router,
)
from app.teaching_quality.TQcampus_personal_reputation_enrollment_goals_results_api import (
    router as TQcampus_personal_reputation_enrollment_goals_results_router,
)
from app.teaching_quality.TQcampus_personal_stu_movement_api import (
    router as TQcampus_personal_stu_movement_router,
)
from app.teaching_quality.TQcampus_promotion_plan_summary_api import (
    router as TQcampus_promotion_plan_summary_router,
)
from app.teaching_quality.TQcampus_refund_detail_api import router as TQcampus_refund_detail_router
from app.teaching_quality.TQcampus_reputation_enrollment_goals_results_api import (
    router as TQcampus_reputation_enrollment_goals_results_router,
)
from app.teaching_quality.TQcampus_stu_movement_calc_api import (
    router as TQcampus_stu_movement_calc_router,
)
from app.teaching_quality.TQcampus_stu_movement_summary_api import (
    router as TQcampus_stu_movement_summary_router,
)
from app.teaching_quality.TQcampus_suspension_detail_api import (
    router as TQcampus_suspension_detail_router,
)
from app.teaching_quality.TQcampus_teacher_ratio_api import router as TQcampus_teacher_ratio_router
from app.teaching_quality.TQcampus_training_plan_performance_api import (
    router as TQcampus_training_plan_performance_router,
)
from app.teaching_quality.TQcampus_training_plan_score_detail_api import (
    router as TQcampus_training_plan_score_detail_router,
)
from app.teaching_quality.TQcampus_vacation_students_detail_api import (
    router as TQcampus_vacation_students_detail_router,
)
from app.teaching_quality.TQclass_activity_plan_api import router as TQclass_activity_plan_router
from app.teaching_quality.TQclass_attendance_api import router as TQclass_attendance_router
from app.teaching_quality.TQclass_committee_meeting_status_api import (
    router as TQclass_committee_meeting_status_router,
)
from app.teaching_quality.TQclass_employment_info_api import (
    router as TQclass_employment_info_router,
)
from app.teaching_quality.TQclass_employment_period_plan_supervision_api import (
    router as TQclass_employment_period_plan_supervision_router,
)
from app.teaching_quality.TQclass_file_record_api import router as TQclass_file_record_router
from app.teaching_quality.TQclass_intensify_plan_supervision_api import (
    router as TQclass_intensify_plan_supervision_router,
)
from app.teaching_quality.TQclass_list_api import router as TQclass_list_router
from app.teaching_quality.TQclass_meeting_status_api import router as TQclass_meeting_status_router
from app.teaching_quality.TQclass_onboarding_plan_supervision_api import (
    router as TQclass_onboarding_plan_supervision_router,
)
from app.teaching_quality.TQclass_pressure_interview_score_api import (
    router as TQclass_pressure_interview_score_router,
)
from app.teaching_quality.TQclass_thousand_score_api import router as TQclass_thousand_score_router
from app.teaching_quality.TQcot_exam_score_api import router as TQcot_exam_score_router
from app.teaching_quality.TQculture_exam_plan_api import router as TQculture_exam_plan_router
from app.teaching_quality.TQculture_presentation_plan_api import (
    router as TQculture_presentation_plan_router,
)
from app.teaching_quality.TQdaily_new_student_schedule_api import (
    router as TQdaily_new_student_schedule_router,
)
from app.teaching_quality.TQdormitory_self_check_monthly_api import (
    router as TQdormitory_self_check_monthly_router,
)
from app.teaching_quality.TQemployee_function_analysis_api import (
    router as TQemployee_function_analysis_router,
)
from app.teaching_quality.TQemployee_interview_api import router as TQemployee_interview_router
from app.teaching_quality.TQemployment_star_api import router as TQemployment_star_router
from app.teaching_quality.TQenterprise_contract_api import router as TQenterprise_contract_router
from app.teaching_quality.TQevening_self_study_attendance_api import (
    router as TQevening_self_study_attendance_router,
)
from app.teaching_quality.TQfee_reminder_api import router as TQfee_reminder_router
from app.teaching_quality.TQgraduate_interview_record_api import (
    router as TQgraduate_interview_record_router,
)
from app.teaching_quality.TQgraduate_parent_interview_record_api import (
    router as TQgraduate_parent_interview_record_router,
)
from app.teaching_quality.TQhomeroom_daily_work_api import router as TQhomeroom_daily_work_router
from app.teaching_quality.TQhomeroom_teacher_standardization_api import (
    router as TQhomeroom_teacher_standardization_router,
)
from app.teaching_quality.TQhomework_api import router as TQhomework_router
from app.teaching_quality.TQmajor_exam_score_api import router as TQmajor_exam_score_router
from app.teaching_quality.TQmanager_kpi_plan_api import router as TQmanager_kpi_plan_router
from app.teaching_quality.TQmeeting_record_api import router as TQmeeting_record_router
from app.teaching_quality.TQmgnt_contract_goals_results_api import (
    router as TQmgnt_contract_goals_results_router,
)
from app.teaching_quality.TQmgnt_core_data_summary_api import (
    router as TQmgnt_core_data_summary_router,
)
from app.teaching_quality.TQmgnt_dormitory_statistics_api import (
    router as TQmgnt_dormitory_statistics_router,
)
from app.teaching_quality.TQmgnt_employment_goals_results_api import (
    router as TQmgnt_employment_goals_results_router,
)
from app.teaching_quality.TQmgnt_enrollment_statistics_api import (
    router as TQmgnt_enrollment_statistics_router,
)
from app.teaching_quality.TQmgnt_new_stu_stability_summary_api import (
    router as TQmgnt_new_stu_stability_summary_router,
)
from app.teaching_quality.TQmgnt_promotion_plan_api import router as TQmgnt_promotion_plan_router
from app.teaching_quality.TQmgnt_reputation_enrollment_goals_results_api import (
    router as TQmgnt_reputation_enrollment_goals_results_router,
)
from app.teaching_quality.TQmgnt_student_fluctuation_api import (
    router as TQmgnt_student_fluctuation_router,
)
from app.teaching_quality.TQopen_university_registration_roster_api import (
    router as TQopen_university_registration_roster_router,
)
from app.teaching_quality.TQopen_university_to_register_roster_api import (
    router as TQopen_university_to_register_roster_router,
)
from app.teaching_quality.TQother_higher_education_registration_roster_api import (
    router as TQother_higher_education_registration_roster_router,
)
from app.teaching_quality.TQother_higher_education_to_register_roster_api import (
    router as TQother_higher_education_to_register_roster_router,
)
from app.teaching_quality.TQother_interview_record_api import (
    router as TQother_interview_record_router,
)
from app.teaching_quality.TQother_secondary_registration_roster_api import (
    router as TQother_secondary_registration_roster_router,
)
from app.teaching_quality.TQother_secondary_to_register_roster_api import (
    router as TQother_secondary_to_register_roster_router,
)
from app.teaching_quality.TQparent_interview_record_api import (
    router as TQparent_interview_record_router,
)
from app.teaching_quality.TQpromotion_interview_api import router as TQpromotion_interview_router
from app.teaching_quality.TQpromotion_plan_api import router as TQpromotion_plan_router
from app.teaching_quality.TQpromotion_virtual_class_api import (
    router as TQpromotion_virtual_class_router,
)
from app.teaching_quality.TQquality_training_api import router as TQquality_training_router
from app.teaching_quality.TQreputation_keypoint_summary_api import (
    router as TQreputation_keypoint_summary_router,
)
from app.teaching_quality.TQreputation_keypoint_yearly_aggregate_api import (
    router as TQreputation_keypoint_yearly_aggregate_router,
)
from app.teaching_quality.TQreputation_keypoint_yearly_api import (
    router as TQreputation_keypoint_yearly_router,
)
from app.teaching_quality.TQreputation_registration_detail_api import (
    router as TQreputation_registration_detail_router,
)
from app.teaching_quality.TQreputation_self_check_api import (
    router as TQreputation_self_check_router,
)
from app.teaching_quality.TQsalary_estimate_api import router as TQsalary_estimate_router
from app.teaching_quality.TQsecondary_1year_registration_roster_api import (
    router as TQsecondary_1year_registration_roster_router,
)
from app.teaching_quality.TQsecondary_1year_to_register_roster_api import (
    router as TQsecondary_1year_to_register_roster_router,
)
from app.teaching_quality.TQsecondary_3year_registration_roster_api import (
    router as TQsecondary_3year_registration_roster_router,
)
from app.teaching_quality.TQsecondary_3year_to_register_roster_api import (
    router as TQsecondary_3year_to_register_roster_router,
)
from app.teaching_quality.TQself_study_signin_api import router as TQself_study_signin_router
from app.teaching_quality.TQspeech_score_api import router as TQspeech_score_router
from app.teaching_quality.TQstudent_interview_record_api import (
    router as TQstudent_interview_record_router,
)
from app.teaching_quality.TQstudent_movement_application_api import (
    router as TQstudent_movement_application_router,
)
from app.teaching_quality.TQteacher_employment_summary_api import (
    router as TQteacher_employment_summary_router,
)
from app.teaching_quality.TQteacher_kpi_plan_api import router as TQteacher_kpi_plan_router
from app.teaching_quality.TQtraining_plan_performance_mgnt_api import (
    router as TQtraining_plan_performance_mgnt_router,
)
from fastapi import APIRouter

router = APIRouter()

# ==================== 注册所有路由 ====================
# TQcampus_manager_analysis_api 必须排在最前面，因为其他文件也定义了相同的路由
router.include_router(TQcampus_manager_analysis_router)
router.include_router(TQactivity_plan_arrangement_router)
router.include_router(TQadult_exam_registration_roster_router)
router.include_router(TQadult_exam_to_register_roster_router)
router.include_router(TQcampus_core_data_summary_router)
router.include_router(TQcampus_dormitory_rent_payment_info_router)
router.include_router(TQcampus_dormitory_statistics_summary_router)
router.include_router(TQcampus_enrollment_statistics_router)
router.include_router(TQcampus_enterprise_contract_goal_router)
router.include_router(TQcampus_female_dormitory_detail_router)
router.include_router(TQcampus_long_absence_detail_router)
router.include_router(TQcampus_long_leave_detail_router)
router.include_router(TQcampus_male_dormitory_detail_router)
router.include_router(TQcampus_monthly_class_promotion_goals_results_router)
router.include_router(TQcampus_monthly_new_stu_stability_detail_router)
router.include_router(TQcampus_monthly_new_stu_stability_summary_router)
router.include_router(TQcampus_monthly_personal_dormitory_mgmt_router)
router.include_router(TQcampus_monthly_personal_new_stu_stability_router)
router.include_router(TQcampus_monthly_personal_promotion_goals_results_router)
router.include_router(TQcampus_monthly_personal_reputation_enrollment_goals_results_router)
router.include_router(TQcampus_monthly_personal_stu_movement_router)
router.include_router(TQcampus_new_stu_arrears_detail_router)
router.include_router(TQcampus_other_situation_detail_router)
router.include_router(TQcampus_personal_dormitory_mgmt_summary_router)
router.include_router(TQcampus_personal_enrollment_statistics_router)
router.include_router(TQcampus_personal_new_stu_stability_summary_router)
router.include_router(TQcampus_personal_promotion_goals_results_router)
router.include_router(TQcampus_personal_reputation_enrollment_goals_results_router)
router.include_router(TQcampus_personal_stu_movement_router)
router.include_router(TQcampus_promotion_plan_summary_router)
router.include_router(TQcampus_refund_detail_router)
router.include_router(TQcampus_reputation_enrollment_goals_results_router)
router.include_router(TQcampus_stu_movement_calc_router)
router.include_router(TQcampus_stu_movement_summary_router)
router.include_router(TQcampus_suspension_detail_router)
router.include_router(TQcampus_teacher_ratio_router)
router.include_router(TQcampus_training_plan_performance_router)
router.include_router(TQcampus_training_plan_score_detail_router)
router.include_router(TQcampus_vacation_students_detail_router)
router.include_router(TQclass_activity_plan_router)
router.include_router(TQclass_attendance_router)
router.include_router(TQclass_committee_meeting_status_router)
router.include_router(TQclass_employment_info_router)
router.include_router(TQclass_employment_period_plan_supervision_router)
router.include_router(TQclass_file_record_router)
router.include_router(TQclass_intensify_plan_supervision_router)
router.include_router(TQclass_list_router)
router.include_router(TQclass_meeting_status_router)
router.include_router(TQclass_onboarding_plan_supervision_router)
router.include_router(TQclass_pressure_interview_score_router)
router.include_router(TQclass_thousand_score_router)
router.include_router(TQcot_exam_score_router)
router.include_router(TQculture_exam_plan_router)
router.include_router(TQculture_presentation_plan_router)
router.include_router(TQdaily_new_student_schedule_router)
router.include_router(TQdormitory_self_check_monthly_router)
router.include_router(TQemployee_function_analysis_router)
router.include_router(TQemployee_interview_router)
router.include_router(TQemployment_star_router)
router.include_router(TQenterprise_contract_router)
router.include_router(TQevening_self_study_attendance_router)
router.include_router(TQfee_reminder_router)
router.include_router(TQgraduate_interview_record_router)
router.include_router(TQgraduate_parent_interview_record_router)
router.include_router(TQhomeroom_daily_work_router)
router.include_router(TQhomeroom_teacher_standardization_router)
router.include_router(TQhomework_router)
router.include_router(TQmajor_exam_score_router)
router.include_router(TQmanager_kpi_plan_router)
router.include_router(TQmeeting_record_router)
router.include_router(TQmgnt_contract_goals_results_router)
router.include_router(TQmgnt_core_data_summary_router)
router.include_router(TQmgnt_dormitory_statistics_router)
router.include_router(TQmgnt_employment_goals_results_router)
router.include_router(TQmgnt_enrollment_statistics_router)
router.include_router(TQmgnt_new_stu_stability_summary_router)
router.include_router(TQmgnt_promotion_plan_router)
router.include_router(TQmgnt_reputation_enrollment_goals_results_router)
router.include_router(TQmgnt_student_fluctuation_router)
router.include_router(TQopen_university_registration_roster_router)
router.include_router(TQopen_university_to_register_roster_router)
router.include_router(TQother_higher_education_registration_roster_router)
router.include_router(TQother_higher_education_to_register_roster_router)
router.include_router(TQother_interview_record_router)
router.include_router(TQother_secondary_registration_roster_router)
router.include_router(TQother_secondary_to_register_roster_router)
router.include_router(TQparent_interview_record_router)
router.include_router(TQpromotion_interview_router)
router.include_router(TQpromotion_plan_router)
router.include_router(TQpromotion_virtual_class_router)
router.include_router(TQquality_training_router)
router.include_router(TQreputation_keypoint_summary_router)
router.include_router(TQreputation_keypoint_yearly_router)
router.include_router(TQreputation_keypoint_yearly_aggregate_router)
router.include_router(TQreputation_registration_detail_router)
router.include_router(TQreputation_self_check_router)
router.include_router(TQsalary_estimate_router)
router.include_router(TQsecondary_1year_registration_roster_router)
router.include_router(TQsecondary_1year_to_register_roster_router)
router.include_router(TQsecondary_3year_registration_roster_router)
router.include_router(TQsecondary_3year_to_register_roster_router)
router.include_router(TQself_study_signin_router)
router.include_router(TQspeech_score_router)
router.include_router(TQstudent_interview_record_router)
router.include_router(TQstudent_movement_application_router)
router.include_router(TQteacher_employment_summary_router)
router.include_router(TQteacher_kpi_plan_router)
router.include_router(TQtraining_plan_performance_mgnt_router)

# TQ_ 前缀的路由
router.include_router(TQ_campus_recruitment_plan_summary_router)
router.include_router(TQ_class_employment_summary_router)

print("[完成] 教学质量模块路由静态注册完成")

