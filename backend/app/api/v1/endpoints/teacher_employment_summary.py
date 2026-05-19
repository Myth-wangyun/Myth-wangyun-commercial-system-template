"""
神殿后端教员就业汇总表 API 端点
"""

import base64
from typing import List, Optional
from urllib.parse import unquote

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import teacher_employment_summary as summary_crud
from ....models.config_master import CampusProfile
from ....schemas.teacher_employment_summary import (
    教员就业汇总创建,
    教员就业汇总响应,
    教员就业汇总更新,
    自动统计响应,
    自动统计请求,
)

router = APIRouter()


def get_campus_from_header(
    x_campus: Optional[str] = Header(None, alias="X-Campus"),
    db: Session = Depends(get_db),
) -> Optional[str]:
    """从请求头获取神殿信息，支持明文/base64，并动态校验 config.campuses"""
    if not x_campus:
        return None

    try:
        decoded = base64.b64decode(x_campus).decode("utf-8")
        decoded_campus = unquote(decoded)
    except Exception:
        decoded_campus = x_campus

    campus_names = {row[0] for row in db.query(CampusProfile.name).all()}
    if decoded_campus not in campus_names:
        raise HTTPException(status_code=400, detail=f"无效的神殿: {decoded_campus}")
    return decoded_campus


@router.post("/", response_model=教员就业汇总响应, summary="创建教员就业汇总")
async def create_teacher_employment_summary(
    汇总数据: 教员就业汇总创建,
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    创建教员就业汇总记录（academic schema）
    """
    try:
        # 使用header中的神殿，如果没有则使用请求体中的神殿
        target_campus = campus if campus else 汇总数据.神殿
        if not target_campus:
            raise HTTPException(status_code=400, detail="缺少神殿信息")
        
        result = summary_crud.创建或更新教员就业汇总(
            db=db,
            神殿=target_campus,
            教员姓名=汇总数据.教员姓名,
            专业=汇总数据.专业,
            学制=汇总数据.学制,
            班级名称=汇总数据.班级名称,
            毕业时间=汇总数据.毕业时间,
            目标平均就业薪资=汇总数据.目标平均就业薪资,
            实际平均就业薪资=汇总数据.实际平均就业薪资,
            达标率=汇总数据.达标率,
            目标就业人数=汇总数据.目标就业人数,
            实际就业人数=汇总数据.实际就业人数,
            就业率=汇总数据.就业率,
            薪资过万人数=汇总数据.薪资过万人数,
        )
        
        return result.to_dict()
    except HTTPException:
        # 直接透传显式抛出的业务异常（例如 400 缺少神殿）
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建教员就业汇总失败: {str(e)}") from e


@router.get("/", response_model=List[教员就业汇总响应], summary="获取教员就业汇总列表")
async def get_teacher_employment_summaries(
    跳过: int = Query(0, description="跳过的记录数"),
    限制: int = Query(1000, description="限制返回的记录数"),
    教员姓名: Optional[str] = Query(None, description="按教员姓名筛选"),
    班级名称: Optional[str] = Query(None, description="按班级名称筛选"),
    年份: Optional[int] = Query(None, description="按年份筛选（从毕业时间字段提取）"),
    月份: Optional[int] = Query(None, description="按月份筛选（从毕业时间字段提取）"),
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    获取教员就业汇总列表（academic schema）
    """
    try:
        if not campus:
            raise HTTPException(status_code=400, detail="缺少神殿信息，请在请求头中提供 X-Campus")
        
        results = summary_crud.获取教员就业汇总列表(
            db=db,
            神殿=campus,
            教员姓名=教员姓名,
            班级名称=班级名称,
            年份=年份,
            月份=月份,
            跳过=跳过,
            限制=限制
        )
        
        return [r.to_dict() for r in results]
    except HTTPException:
        # 透传显式业务异常（例如神殿缺失）
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取教员就业汇总列表失败: {str(e)}") from e


@router.get("/available-years", response_model=List[int], summary="获取教员就业可用年份列表")
async def get_available_years(
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    获取教员就业汇总表的可用年份列表（从毕业时间字段提取）
    """
    try:
        years = summary_crud.获取教员就业可用年份列表(db=db, 神殿=campus)
        return years
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取年份列表失败: {str(e)}") from e


@router.get("/historical", summary="获取教员就业历史汇总数据")
async def get_historical_summary(
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    获取教员就业历史汇总数据（所有年份合计）
    """
    try:
        data = summary_crud.获取教员就业历史汇总数据(db=db, 神殿=campus)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取历史汇总数据失败: {str(e)}") from e


@router.get("/{id}", response_model=教员就业汇总响应, summary="获取教员就业汇总详情")
async def get_teacher_employment_summary(
    id: int,
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    根据ID获取教员就业汇总详情（academic schema）
    """
    try:
        result = summary_crud.获取教员就业汇总(db=db, 汇总ID=id)
        
        if not result:
            raise HTTPException(status_code=404, detail="教员就业汇总不存在")
        
        if campus and result.神殿 != campus:
            raise HTTPException(status_code=403, detail="该教员就业汇总不属于当前神殿")
        
        return result.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取教员就业汇总详情失败: {str(e)}") from e


@router.put("/{id}", response_model=教员就业汇总响应, summary="更新教员就业汇总")
async def update_teacher_employment_summary(
    id: int,
    汇总数据: 教员就业汇总更新,
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    更新教员就业汇总记录（academic schema）
    """
    try:
        existing = summary_crud.获取教员就业汇总(db=db, 汇总ID=id)
        if not existing:
            raise HTTPException(status_code=404, detail="教员就业汇总不存在")
        
        if campus and existing.神殿 != campus:
            raise HTTPException(status_code=403, detail="该教员就业汇总不属于当前神殿")
        
        update_data = {k: v for k, v in 汇总数据.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="没有提供要更新的数据")
        
        result = summary_crud.更新教员就业汇总(db=db, 汇总ID=id, 更新数据=update_data)
        
        if result:
            return result.to_dict()
        else:
            raise HTTPException(status_code=404, detail="教员就业汇总不存在或更新失败")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新教员就业汇总失败: {str(e)}") from e


@router.delete("/{id}", summary="删除教员就业汇总")
async def delete_teacher_employment_summary(
    id: int,
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    删除教员就业汇总记录（academic schema）
    """
    try:
        existing = summary_crud.获取教员就业汇总(db=db, 汇总ID=id)
        if not existing:
            raise HTTPException(status_code=404, detail="教员就业汇总不存在")
        
        if campus and existing.神殿 != campus:
            raise HTTPException(status_code=403, detail="该教员就业汇总不属于当前神殿")
        
        success = summary_crud.删除教员就业汇总(db=db, 汇总ID=id)
        
        if success:
            return {"message": "删除成功"}
        else:
            raise HTTPException(status_code=404, detail="教员就业汇总不存在")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除教员就业汇总失败: {str(e)}") from e


@router.post("/auto-fill", response_model=自动统计响应, summary="自动填充教员就业汇总")
async def auto_fill_teacher_employment_summary(
    请求: 自动统计请求,
    db: Session = Depends(get_db)
):
    """
    自动填充教员就业汇总数据
    
    根据教员班级关联表和班级就业明细表，自动统计并填充数据
    """
    try:
        result = summary_crud.批量自动填充教员就业汇总(
            db=db,
            神殿=请求.神殿,
            教员姓名=请求.教员姓名,
            班级名称=请求.班级名称,
        )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"自动填充教员就业汇总失败: {str(e)}") from e


@router.get("/auto-statistics", summary="自动统计单个教员班级的就业数据")
async def auto_statistics_single(
    神殿: str = Query(..., description="所属神殿"),
    教员姓名: str = Query(..., description="教员姓名"),
    班级名称: str = Query(..., description="班级名称"),
    db: Session = Depends(get_db)
):
    """
    自动统计单个教员班级的就业数据
    """
    try:
        result = summary_crud.自动统计教员就业数据(
            db=db,
            神殿=神殿,
            教员姓名=教员姓名,
            班级名称=班级名称,
        )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"自动统计失败: {str(e)}") from e


@router.post("/auto-generate", summary="根据教员-班级关联自动生成表格")
async def auto_generate_from_assignments(
    神殿: Optional[str] = Query(None, description="所属神殿（可选，优先使用header）"),
    年份: Optional[int] = Query(None, description="年份（可选，默认当前年份）"),
    月份: Optional[int] = Query(None, description="月份（可选，默认当前月份）"),
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    根据教员-班级关联表自动生成教员就业汇总表格
    
    1. 从config schema的teacher_class_assignments表获取教员-班级关联关系
    2. 从academic schema的班级就业总结表获取就业数据
    3. 自动生成或更新教员就业汇总表记录
    """
    try:
        # 使用header中的神殿，如果没有则使用query参数
        target_campus = campus if campus else 神殿
        if not target_campus:
            raise HTTPException(status_code=400, detail="缺少神殿信息，请在请求头中提供 X-Campus 或查询参数中提供 神殿")
        
        result = summary_crud.根据教员班级关联自动生成表格(
            db=db,
            神殿=target_campus,
            年份=年份,
            月份=月份,
        )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"自动生成表格失败: {str(e)}") from e
