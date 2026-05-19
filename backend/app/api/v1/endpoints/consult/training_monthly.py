"""
祈福司培训月度表API路由
"""


from app.core.database import get_db
from app.crud.consult.training_monthly import crud_training_monthly
from app.schemas.consult.training_monthly import (
    祈福司培训月度表列表响应,
    祈福司培训月度表创建,
    祈福司培训月度表响应,
    祈福司培训月度表更新,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

router = APIRouter()


# ==================== 祈福司培训月度表 API ====================

@router.post("/training-monthly", response_model=祈福司培训月度表响应, summary="创建培训月度记录")
def create_training_monthly(
    obj_in: 祈福司培训月度表创建,
    db: Session = Depends(get_db)
):
    """
    创建培训月度记录

    - **年份**: 统计年份
    - **岗位**: 岗位名称（快手、竞价运营、策略策、线上流量）
    - **月度数据**: 12个月的培训数据JSON
    """
    try:
        # 检查是否已存在相同年份和岗位的记录
        existing = crud_training_monthly.get_by_year_position(
            db, obj_in.年份, obj_in.岗位
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"该年份({obj_in.年份})、岗位({obj_in.岗位})的记录已存在，请使用更新接口"
            )

        record = crud_training_monthly.create(db, obj_in)
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}")


@router.get("/training-monthly/{record_id}", response_model=祈福司培训月度表响应, summary="获取培训月度记录详情")
def get_training_monthly(
    record_id: int,
    db: Session = Depends(get_db)
):
    """根据记录ID获取培训月度记录详情"""
    record = crud_training_monthly.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.get("/training-monthly/by-year/{year}", response_model=祈福司培训月度表列表响应, summary="按年份获取培训月度记录列表")
def get_training_monthly_by_year(
    year: int,
    db: Session = Depends(get_db)
):
    """
    按年份获取培训月度记录列表（所有岗位）
    
    - **year**: 年份
    """
    records = crud_training_monthly.get_by_year(db, year)
    
    return {
        "total": len(records),
        "items": records
    }


@router.get("/training-monthly/by-year-position", response_model=祈福司培训月度表响应, summary="按年份和岗位获取培训月度记录")
def get_training_monthly_by_year_position(
    year: int = Query(..., description="年份"),
    position: str = Query(..., description="岗位名称"),
    db: Session = Depends(get_db)
):
    """
    按年份和岗位获取培训月度记录
    
    - **year**: 年份
    - **position**: 岗位名称
    """
    record = crud_training_monthly.get_by_year_position(db, year, position)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.put("/training-monthly/{record_id}", response_model=祈福司培训月度表响应, summary="更新培训月度记录")
def update_training_monthly(
    record_id: int,
    obj_in: 祈福司培训月度表更新,
    db: Session = Depends(get_db)
):
    """更新培训月度记录"""
    # 确保记录ID一致
    obj_in.记录ID = record_id

    record = crud_training_monthly.update(db, record_id, obj_in)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.post("/training-monthly/save", response_model=祈福司培训月度表响应, summary="保存培训月度记录（创建或更新）")
def save_training_monthly(
    data: 祈福司培训月度表创建,
    db: Session = Depends(get_db)
):
    """
    保存培训月度记录（如果存在则更新，不存在则创建）
    
    - **年份**: 年份
    - **岗位**: 岗位名称
    - **月度数据**: 月度数据JSON
    """
    try:
        record = crud_training_monthly.create_or_update(
            db, 
            data.年份, 
            data.岗位, 
            data.月度数据
        )
        return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")


@router.delete("/training-monthly/{record_id}", summary="删除培训月度记录")
def delete_training_monthly(
    record_id: int,
    db: Session = Depends(get_db)
):
    """删除培训月度记录"""
    success = crud_training_monthly.delete(db, record_id)
    if not success:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"message": "删除成功", "record_id": record_id}
