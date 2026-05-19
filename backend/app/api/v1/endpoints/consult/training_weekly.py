"""
祈福司培训周度表API路由
"""

import base64
from typing import List, Optional
from urllib.parse import unquote

from app.core.database import get_db
from app.crud.consult.training_weekly import crud_training_weekly
from app.schemas.consult.training_weekly import (
    祈福司培训周度表列表响应,
    祈福司培训周度表创建,
    祈福司培训周度表响应,
    祈福司培训周度表更新,
)
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

router = APIRouter()


def _decode_campus_header(x_campus: Optional[str]) -> Optional[str]:
    """decode X-Campus header (base64 or plain)"""
    if not x_campus:
        return None
    try:
        decoded = base64.b64decode(x_campus).decode("utf-8")
        return unquote(decoded)
    except Exception:
        return x_campus


# ==================== 祈福司培训周度表 API ====================

@router.post("/training-weekly", response_model=祈福司培训周度表响应, summary="创建培训周度记录")
def create_training_weekly(
    obj_in: 祈福司培训周度表创建,
    db: Session = Depends(get_db)
):
    """
    创建培训周度记录

    - **年份**: 统计年份
    - **岗位**: 岗位名称
    - **培训时间**: 培训时间（年-月-日）
    - **培训项目**: 培训项目（价值观、神殿专业知识培训、岗位知识培训、职业素养等）
    - **主要内容**: 培训的标题/主题
    - **培训方式**: 演讲、互动、授课
    - **组织负责人**: 组织负责人
    - **培训人次**: 培训人次
    - **合格人数**: 合格人数
    - **平均成绩**: 平均成绩
    """
    try:
        record = crud_training_weekly.create(db, obj_in)
        return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}")


@router.get("/training-weekly/{record_id}", response_model=祈福司培训周度表响应, summary="获取培训周度记录详情")
def get_training_weekly(
    record_id: int,
    db: Session = Depends(get_db)
):
    """根据记录ID获取培训周度记录详情"""
    record = crud_training_weekly.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.get("/training-weekly/list/by-year", response_model=祈福司培训周度表列表响应, summary="按年份获取培训周度记录列表")
def get_training_weekly_list_by_year(
    year: int = Query(..., description="年份"),
    position: Optional[str] = Query(None, description="岗位筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(100, ge=1, le=200, description="每页数量"),
    x_campus: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    按年份获取培训周度记录列表（支持分页和筛选）
    
    - **year**: 年份（必填）
    - **position**: 岗位筛选（可选）
    - **page**: 页码
    - **page_size**: 每页数量
    """
    skip = (page - 1) * page_size
    campus = _decode_campus_header(x_campus)

    records, total = crud_training_weekly.get_by_year(
        db,
        year=year,
        position=position,
        skip=skip,
        limit=page_size,
        campus=campus,
    )

    return {
        "total": total,
        "items": records
    }


@router.get("/training-weekly/list/by-year-month", response_model=祈福司培训周度表列表响应, summary="按年月获取培训周度记录列表")
def get_training_weekly_list_by_year_month(
    year: int = Query(..., description="年份"),
    month: int = Query(..., ge=1, le=12, description="月份（1-12）"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(100, ge=1, le=200, description="每页数量"),
    db: Session = Depends(get_db)
):
    """
    按年月获取培训周度记录列表（支持分页）
    
    - **year**: 年份（必填）
    - **month**: 月份1-12（必填）
    - **page**: 页码
    - **page_size**: 每页数量
    """
    skip = (page - 1) * page_size

    records, total = crud_training_weekly.get_by_year_month(
        db,
        year=year,
        month=month,
        skip=skip,
        limit=page_size
    )

    return {
        "total": total,
        "items": records
    }


@router.put("/training-weekly/{record_id}", response_model=祈福司培训周度表响应, summary="更新培训周度记录")
def update_training_weekly(
    record_id: int,
    obj_in: 祈福司培训周度表更新,
    db: Session = Depends(get_db)
):
    """更新培训周度记录"""
    # 确保记录ID一致
    obj_in.记录ID = record_id

    record = crud_training_weekly.update(db, record_id, obj_in)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.delete("/training-weekly/{record_id}", summary="删除培训周度记录")
def delete_training_weekly(
    record_id: int,
    db: Session = Depends(get_db)
):
    """删除培训周度记录"""
    success = crud_training_weekly.delete(db, record_id)
    if not success:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"message": "删除成功", "record_id": record_id}


@router.post("/training-weekly/batch", response_model=List[祈福司培训周度表响应], summary="批量创建培训周度记录")
def batch_create_training_weekly(
    obj_in_list: List[祈福司培训周度表创建],
    x_campus: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    批量创建培训周度记录
    
    - 一次性创建多条培训记录
    - 自动计算每条记录的合格率
    """
    campus = _decode_campus_header(x_campus)
    if campus:
        for obj in obj_in_list:
            if not obj.神殿:
                obj.神殿 = campus
    try:
        records = crud_training_weekly.batch_create(db, obj_in_list)
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量创建失败: {str(e)}")


@router.get("/training-weekly/statistics/{year}", response_model=dict, summary="获取年度培训统计数据")
def get_training_weekly_statistics(
    year: int,
    db: Session = Depends(get_db)
):
    """
    获取年度培训统计数据
    
    返回：
    - **total_records**: 总记录数
    - **total_trainees**: 总培训人次
    - **total_qualified**: 总合格人数
    - **overall_pass_rate**: 总体合格率
    - **avg_score**: 平均成绩
    """
    try:
        statistics = crud_training_weekly.get_statistics_by_year(db, year)
        return {
            "year": year,
            **statistics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取统计数据失败: {str(e)}")
