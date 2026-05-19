from app.core.database import get_db
from app.schemas.market.account_sentiment import (
    AccountSentimentBulkSaveRequest,
    AccountSentimentBulkSaveResponse,
    AccountSentimentListResponse,
    AccountSentimentRowOut,
)
from app.services.market.account_sentiment import bulk_save, list_rows
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

router = APIRouter()


@router.get('/account-sentiment', response_model=AccountSentimentListResponse, summary='获取舆情登记表（按神殿）')
def get_account_sentiment(
    campus_name: str = Query(..., description='神殿名称（最高议事厅使用：最高议事厅）'),
    db: Session = Depends(get_db),
):
    items = list_rows(db, campus_name)
    return {
        'campus_name': campus_name,
        'items': [AccountSentimentRowOut.model_validate(i) for i in items],
    }


@router.post(
    '/account-sentiment/bulk-save',
    response_model=AccountSentimentBulkSaveResponse,
    summary='整表保存舆情登记表（按神殿覆盖）',
)
def bulk_save_account_sentiment(
    payload: AccountSentimentBulkSaveRequest,
    db: Session = Depends(get_db),
):
    items = bulk_save(db, payload.campus_name, payload.rows)
    return {
        'campus_name': payload.campus_name,
        'saved_count': len(items),
        'items': [AccountSentimentRowOut.model_validate(i) for i in items],
    }

