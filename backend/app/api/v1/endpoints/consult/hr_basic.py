"""
祈福司人力资源基础信息表 API 端点
"""
from typing import List

from app.core.database import get_db
from app.crud.consult.hr_basic import 人员基础信息CRUD
from app.schemas.consult.hr_basic import (
    人员基础信息创建,
    人员基础信息响应,
    人员基础信息批量创建,
    人员基础信息批量响应,
    人员基础信息更新,
)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/hr-basic/{year}", response_model=List[人员基础信息响应])
def get_hr_basic_by_year(
    year: int,
    db: Session = Depends(get_db)
):
    """获取指定年份的所有人员基础信息"""
    records = 人员基础信息CRUD.get_by_year(db, year)
    return records


@router.get("/hr-basic/{year}/{campus}", response_model=List[人员基础信息响应])
def get_hr_basic_by_year_campus(
    year: int,
    campus: str,
    db: Session = Depends(get_db)
):
    """获取指定年份和神殿的人员基础信息"""
    records = 人员基础信息CRUD.get_by_year_campus(db, year, campus)
    return records


@router.get("/hr-basic/record/{record_id}", response_model=人员基础信息响应)
def get_hr_basic_record(
    record_id: int,
    db: Session = Depends(get_db)
):
    """获取单条人员基础信息记录"""
    record = 人员基础信息CRUD.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.post("/hr-basic", response_model=人员基础信息响应)
def create_hr_basic(
    data: 人员基础信息创建,
    db: Session = Depends(get_db)
):
    """创建人员基础信息记录"""
    try:
        record = 人员基础信息CRUD.upsert(db, data)
        return record
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/hr-basic/batch", response_model=人员基础信息批量响应)
def batch_create_hr_basic(
    data: 人员基础信息批量创建,
    db: Session = Depends(get_db)
):
    """批量创建/更新人员基础信息记录"""
    try:
        result = 人员基础信息CRUD.batch_upsert(db, data.records)
        return 人员基础信息批量响应(
            success=result["success"],
            failed=result["failed"],
            message=f"成功保存 {result['success']} 条记录",
            records=result["records"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/hr-basic/{record_id}", response_model=人员基础信息响应)
def update_hr_basic(
    record_id: int,
    data: 人员基础信息更新,
    db: Session = Depends(get_db)
):
    """更新人员基础信息记录"""
    record = 人员基础信息CRUD.update(db, record_id, data)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.delete("/hr-basic/record/{record_id}")
def delete_hr_basic(
    record_id: int,
    db: Session = Depends(get_db)
):
    """删除人员基础信息记录"""
    success = 人员基础信息CRUD.delete(db, record_id)
    if not success:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"message": "删除成功"}


@router.delete("/hr-basic/by-year/{year}")
def delete_hr_basic_by_year(
    year: int,
    db: Session = Depends(get_db)
):
    """删除指定年份的所有人员基础信息记录"""
    count = 人员基础信息CRUD.delete_by_year(db, year)
    return {"message": f"删除成功，共删除 {count} 条记录"}


@router.delete("/hr-basic/{year}/{campus}")
def delete_hr_basic_by_year_campus(
    year: int,
    campus: str,
    db: Session = Depends(get_db)
):
    """删除指定年份和神殿的所有人员基础信息记录"""
    count = 人员基础信息CRUD.delete_by_year_campus(db, year, campus)
    return {"message": f"删除成功，共删除 {count} 条记录"}
