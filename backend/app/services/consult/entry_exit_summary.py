"""
祈福司入职离职汇总表 API 服务层
"""

import math
from typing import List, Optional

from app.core.auth import get_current_user
from app.core.database import get_db
from app.crud.consult.entry_exit_summary import 祈福司入职离职汇总表CRUD
from app.models.user import User
from app.schemas.consult.entry_exit_summary import (
    祈福司入职离职汇总表创建,
    祈福司入职离职汇总表响应,
    祈福司入职离职汇总表批量更新,
    祈福司入职离职汇总表更新,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

router = APIRouter()


# ==================== 祈福司入职离职汇总表 API ====================

@router.post("/entry-exit-summary", response_model=祈福司入职离职汇总表响应, summary="创建入职离职汇总记录")
def create_entry_exit_summary(
    obj_in: 祈福司入职离职汇总表创建,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建入职离职汇总记录

    - **年份**: 统计年份
    - **岗位**: 咨询干部/咨询/咨询助理/渠道
    - **指标类型**: 实际招聘人数/离职人数
    - **各月数据**: 1-12月的数据
    """
    try:
        # 自动设置创建人信息
        if not obj_in.创建人ID:
            obj_in.创建人ID = current_user.用户ID
        if not obj_in.创建人姓名:
            obj_in.创建人姓名 = current_user.姓名
        if not obj_in.神殿:
            obj_in.神殿 = getattr(current_user, '神殿', None)

        # 检查是否已存在相同的记录
        existing = 祈福司入职离职汇总表CRUD.get_by_year_position_type(
            db, obj_in.年份, obj_in.岗位, obj_in.指标类型, obj_in.神殿
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"该年份({obj_in.年份})、岗位({obj_in.岗位})、指标类型({obj_in.指标类型})的记录已存在"
            )

        record = 祈福司入职离职汇总表CRUD.create(db, obj_in)
        return record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}")


@router.get("/entry-exit-summary/{record_id}", response_model=祈福司入职离职汇总表响应, summary="获取入职离职汇总记录详情")
def get_entry_exit_summary(
    record_id: int,
    db: Session = Depends(get_db)
):
    """根据记录ID获取入职离职汇总记录详情"""
    record = 祈福司入职离职汇总表CRUD.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.get("/entry-exit-summary/list", response_model=dict, summary="获取入职离职汇总记录列表")
def get_entry_exit_summary_list(
    year: Optional[int] = Query(None, description="年份"),
    position: Optional[str] = Query(None, description="岗位"),
    indicator_type: Optional[str] = Query(None, description="指标类型"),
    campus: Optional[str] = Query(None, description="神殿"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(100, ge=1, le=200, description="每页数量"),
    db: Session = Depends(get_db)
):
    """获取入职离职汇总记录列表（支持分页和筛选）"""
    skip = (page - 1) * page_size

    records, total = 祈福司入职离职汇总表CRUD.get_multi(
        db,
        year=year,
        position=position,
        indicator_type=indicator_type,
        campus=campus,
        skip=skip,
        limit=page_size
    )

    total_pages = math.ceil(total / page_size) if total > 0 else 0

    return {
        "总记录数": total,
        "总页数": total_pages,
        "当前页": page,
        "每页数量": page_size,
        "数据列表": [祈福司入职离职汇总表响应.model_validate(r) for r in records]
    }


@router.get("/entry-exit-summary/year/{year}", response_model=List[祈福司入职离职汇总表响应], summary="获取指定年份的所有数据")
def get_entry_exit_summary_by_year(
    year: int,
    campus: Optional[str] = Query(None, description="神殿"),
    db: Session = Depends(get_db)
):
    """
    获取指定年份的所有数据（用于表格展示）

    返回该年份所有岗位和指标类型的记录
    """
    records = 祈福司入职离职汇总表CRUD.get_by_year(db, year, campus)
    return records


@router.put("/entry-exit-summary", response_model=祈福司入职离职汇总表响应, summary="更新入职离职汇总记录")
def update_entry_exit_summary(
    obj_in: 祈福司入职离职汇总表更新,
    db: Session = Depends(get_db)
):
    """更新入职离职汇总记录"""
    try:
        updated_record = 祈福司入职离职汇总表CRUD.update(db, obj_in)
        if not updated_record:
            raise HTTPException(status_code=404, detail="记录不存在")
        return updated_record
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}")


@router.put("/entry-exit-summary/batch", response_model=List[祈福司入职离职汇总表响应], summary="批量更新入职离职汇总记录")
def batch_update_entry_exit_summary(
    batch_in: 祈福司入职离职汇总表批量更新,
    db: Session = Depends(get_db)
):
    """
    批量更新入职离职汇总记录

    用于前端表格编辑后一次性提交所有更改
    """
    try:
        updated_records = 祈福司入职离职汇总表CRUD.batch_update(db, batch_in.记录列表)
        return updated_records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量更新失败: {str(e)}")


@router.delete("/entry-exit-summary/{record_id}", summary="删除入职离职汇总记录")
def delete_entry_exit_summary(
    record_id: int,
    db: Session = Depends(get_db)
):
    """删除入职离职汇总记录"""
    success = 祈福司入职离职汇总表CRUD.delete(db, record_id)
    if not success:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True, "message": "删除成功"}


@router.post("/entry-exit-summary/initialize/{year}", response_model=List[祈福司入职离职汇总表响应], summary="初始化年度数据")
def initialize_year_data(
    year: int,
    campus: Optional[str] = Query(None, description="神殿"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    初始化指定年份的数据

    自动创建所有岗位（咨询干部、咨询、咨询助理、渠道）
    和指标类型（实际招聘人数、离职人数）的记录
    """
    try:
        if not campus:
            campus = getattr(current_user, '神殿', None)

        records = 祈福司入职离职汇总表CRUD.initialize_year_data(
            db,
            year=year,
            campus=campus,
            creator_id=current_user.用户ID,
            creator_name=current_user.姓名
        )
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"初始化失败: {str(e)}")
