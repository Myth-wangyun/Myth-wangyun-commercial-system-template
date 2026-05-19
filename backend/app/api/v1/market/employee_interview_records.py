from app.core.database import get_db
from app.schemas.market.employee_interview_records import (
    EmployeeInterviewRecordBulkSaveRequest,
    EmployeeInterviewRecordBulkSaveResponse,
    EmployeeInterviewRecordListResponse,
    EmployeeInterviewRecordRowOut,
)
from app.services.market.employee_interview_records import bulk_save, delete_row, list_rows
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()


@router.get('/employee-interview-records', response_model=EmployeeInterviewRecordListResponse, summary='获取市场部员工访谈记录表')
def get_employee_interview_records(year: int, db: Session = Depends(get_db)):
    items = list_rows(db, year)
    return {
        'items': [EmployeeInterviewRecordRowOut.model_validate(i) for i in items],
    }


@router.post(
    '/employee-interview-records/bulk-save',
    response_model=EmployeeInterviewRecordBulkSaveResponse,
    summary='整表保存市场部员工访谈记录表（覆盖/更新）',
)
def bulk_save_employee_interview_records(payload: EmployeeInterviewRecordBulkSaveRequest, db: Session = Depends(get_db)):
    items = bulk_save(db, payload.rows)
    return {
        'saved_count': len(items),
        'items': [EmployeeInterviewRecordRowOut.model_validate(i) for i in items],
    }


@router.delete('/employee-interview-records/{record_id}', summary='删除市场部员工访谈记录表行')
def delete_employee_interview_record(record_id: int, db: Session = Depends(get_db)):
    ok = delete_row(db, record_id)
    if not ok:
        raise HTTPException(status_code=404, detail='记录不存在')
    return {'success': True}

