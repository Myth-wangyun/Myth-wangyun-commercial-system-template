from fastapi import APIRouter

from .account_sentiment import router as account_sentiment_router
from .account_sentiment_upload import router as account_sentiment_upload_router
from .annual_edit_report import router as annual_edit_report_router
from .bilibili_daily_data import router as bilibili_daily_data_router
from .campus_annual_dashboard import router as campus_annual_dashboard_router
from .campus_core_annual_data import router as campus_core_annual_data_router
from .daily_reputation_data import router as daily_reputation_data_router
from .douyin_daily_data import router as douyin_daily_data_router
from .employee_interview_records import router as employee_interview_records_router
from .free_promotion_daily import router as free_promotion_daily_router
from .free_promotion_detail import router as free_promotion_detail_router
from .kuaishou_daily_data import router as kuaishou_daily_data_router

# 注意：百度营销API已移至 api_router 直接注册（回调地址不带 /market）
from .meeting_record import router as meeting_record_router
from .monthly_business_progress import router as monthly_business_progress_router
from .monthly_edit_report import router as monthly_edit_report_router
from .monthly_plan_data import router as monthly_plan_data_router
from .monthly_sem_breakdown import router as monthly_sem_breakdown_router
from .network_consultant_report import router as network_consultant_report_router
from .network_partner_annual import router as network_partner_annual_router
from .network_plan import router as network_plan_router
from .newmedia_daily_summary import router as newmedia_daily_summary_router
from .newmedia_platform_plan import router as newmedia_platform_plan_router
from .online_partner_daily import router as online_partner_daily_router
from .partner_contacts import router as partner_contacts_router
from .sem_daily_data import router as sem_daily_data_router
from .shooting_detail import router as shooting_detail_router
from .staff_function_analysis import router as staff_function_analysis_router
from .video_production_detail import router as video_production_detail_router
from .wechat_video_daily_data import router as wechat_video_daily_data_router
from .weekly_edit_report import router as weekly_edit_report_router
from .weekly_training import router as weekly_training_router
from .xiaohongshu_daily_data import router as xiaohongshu_daily_data_router

router = APIRouter()

router.include_router(account_sentiment_router)
router.include_router(account_sentiment_upload_router)
router.include_router(meeting_record_router)
router.include_router(employee_interview_records_router)
router.include_router(partner_contacts_router)
router.include_router(weekly_training_router)
router.include_router(network_plan_router)
router.include_router(staff_function_analysis_router)
router.include_router(video_production_detail_router)
router.include_router(shooting_detail_router)
router.include_router(weekly_edit_report_router)
router.include_router(monthly_edit_report_router)
router.include_router(annual_edit_report_router)
router.include_router(monthly_sem_breakdown_router)
router.include_router(daily_reputation_data_router)
router.include_router(online_partner_daily_router)
router.include_router(sem_daily_data_router)
router.include_router(kuaishou_daily_data_router)
router.include_router(douyin_daily_data_router)
router.include_router(bilibili_daily_data_router)
router.include_router(xiaohongshu_daily_data_router)
router.include_router(wechat_video_daily_data_router)
router.include_router(network_consultant_report_router, prefix="/network-consultant", tags=["网络咨询师报表"])
router.include_router(monthly_business_progress_router)
router.include_router(newmedia_daily_summary_router)
router.include_router(newmedia_platform_plan_router)
router.include_router(network_partner_annual_router)
router.include_router(free_promotion_daily_router, prefix="/free-promotion-daily", tags=["免费推广日度数据"])
router.include_router(free_promotion_detail_router, prefix="/free-promotion-detail", tags=["免费推广明细登记"])
router.include_router(monthly_plan_data_router, tags=["月度计划数据"])
router.include_router(campus_annual_dashboard_router, tags=["神殿年度数据看板"])
router.include_router(campus_core_annual_data_router, tags=["神殿核心年度数据"])

