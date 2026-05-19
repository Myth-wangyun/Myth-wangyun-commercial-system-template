from app.core.database import get_db
from app.schemas.market.partner_contacts import (
    PartnerContactBulkSaveRequest,
    PartnerContactBulkSaveResponse,
    PartnerContactListResponse,
    PartnerContactRowOut,
)
from app.services.market.partner_contacts import bulk_save, delete_row, list_rows
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()


@router.get('/partner-contacts', response_model=PartnerContactListResponse, summary='获取市场部合作方联系信息（按神殿，可汇总）')
def get_partner_contacts(campus: str | None = None, summary: bool = False, db: Session = Depends(get_db)):
    # summary=true 时返回全部神殿数据；否则按 campus 过滤
    if summary:
        items = list_rows(db, None)
    else:
        if not campus:
            raise HTTPException(status_code=400, detail='缺少 campus 参数')
        items = list_rows(db, campus)

    return {
        'items': [PartnerContactRowOut.model_validate(i) for i in items],
    }


@router.post(
    '/partner-contacts/bulk-save',
    response_model=PartnerContactBulkSaveResponse,
    summary='整表保存市场部合作方联系信息（按神殿覆盖/更新）',
)
def bulk_save_partner_contacts(payload: PartnerContactBulkSaveRequest, db: Session = Depends(get_db)):
    if not payload.campus:
        raise HTTPException(status_code=400, detail='缺少 campus')

    items = bulk_save(db, payload.campus, [r.model_dump() for r in payload.rows])
    return {
        'saved_count': len(items),
        'items': [PartnerContactRowOut.model_validate(i) for i in items],
    }


@router.delete('/partner-contacts/{record_id}', summary='删除市场部合作方联系信息行')
def delete_partner_contact(record_id: int, db: Session = Depends(get_db)):
    ok = delete_row(db, record_id)
    if not ok:
        raise HTTPException(status_code=404, detail='记录不存在')
    return {'success': True}

