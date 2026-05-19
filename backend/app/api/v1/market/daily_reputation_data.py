from app.core.database import get_db
from app.schemas.market.daily_reputation_data import (
    DailyReputationDataBulkSaveRequest,
    DailyReputationDataBulkSaveResponse,
    DailyReputationDataListResponse,
    DailyReputationDataRowOut,
    DailyReputationMonthlySummary,
    DailyReputationYearlySummaryResponse,
)
from app.services.market.daily_reputation_data import (
    bulk_upsert_month,
    get_yearly_summary,
    list_month,
)
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter()


@router.get(
    '/daily-reputation-data',
    response_model=DailyReputationDataListResponse,
    summary='获取市场部口碑日度数据（按神殿+月份）',
)
def get_daily_reputation_data(
    campus: str = Query(..., description='神殿名称'),
    month: str = Query(..., description='月份，格式 YYYY-MM'),
    db: Session = Depends(get_db),
):
    items = list_month(db, campus, month)
    return {
        'items': [
            DailyReputationDataRowOut(
                id=i.id,
                campus=i.神殿,
                date=i.日期,
                partner_income=i.合作伙伴实际收入,
                refund_count=i.退费数,
                net_signup=i.净报名,
                gross_count=i.毛报总数,
                order_count=i.订单数,
                visit_count=i.上门人数,
                actual_consult_count=i.实际口碑咨询量,
            )
            for i in items
        ],
    }


@router.post(
    '/daily-reputation-data/bulk-save',
    response_model=DailyReputationDataBulkSaveResponse,
    summary='批量保存市场部口碑日度数据（按神殿+月份 upsert）',
)
def bulk_save_daily_reputation_data(payload: DailyReputationDataBulkSaveRequest, db: Session = Depends(get_db)):
    items = bulk_upsert_month(db, payload.campus, payload.month, payload.rows)
    return {
        'saved_count': len(items),
        'items': [
            DailyReputationDataRowOut(
                id=i.id,
                campus=i.神殿,
                date=i.日期,
                partner_income=i.合作伙伴实际收入,
                refund_count=i.退费数,
                net_signup=i.净报名,
                gross_count=i.毛报总数,
                order_count=i.订单数,
                visit_count=i.上门人数,
                actual_consult_count=i.实际口碑咨询量,
            )
            for i in items
        ],
    }


@router.get(
    '/daily-reputation-data/yearly-summary',
    response_model=DailyReputationYearlySummaryResponse,
    summary='获取市场部口碑日度数据的年度月汇总（按神殿+年份）',
)
def get_yearly_reputation_summary(
    campus: str = Query(..., description='神殿名称'),
    year: int = Query(..., description='年份，如 2026'),
    db: Session = Depends(get_db),
):
    """
    获取某神殿某年度的日度数据，按月汇总返回12个月的数据
    用于市场口碑月度汇总表从日度数据自动获取
    """
    summary_dict = get_yearly_summary(db, campus, year)

    months = []
    for m in range(1, 13):
        data = summary_dict.get(m, {})
        months.append(DailyReputationMonthlySummary(
            month=m,
            partner_income=data.get('partner_income', 0),
            refund_count=data.get('refund_count', 0),
            net_signup=data.get('net_signup', 0),
            gross_count=data.get('gross_count', 0),
            order_count=data.get('order_count', 0),
            visit_count=data.get('visit_count', 0),
            actual_consult_count=data.get('actual_consult_count', 0),
        ))

    return DailyReputationYearlySummaryResponse(
        campus=campus,
        year=year,
        months=months,
    )

