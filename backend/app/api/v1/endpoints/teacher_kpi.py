"""
Teacher KPI template & result APIs
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....core.permissions import PermissionContext, require_permission
from ....crud import teacher_kpi as crud
from ....schemas.teacher_kpi import (
    KPIAssessmentList,
    KPIAssessmentSavePayload,
    KPIResultList,
    KPIResultSavePayload,
    KPITemplateList,
)

router = APIRouter()


@router.get("/templates", response_model=KPITemplateList, summary="获取KPI模板")
def get_templates(
    role: str | None = Query(None, description="过滤角色"),
    db: Session = Depends(get_db),
    perm_ctx: PermissionContext = Depends(require_permission("academic.teacher.kpi.view")),
):
    """
    获取KPI模板
    
    权限要求: academic.teacher.kpi.view
    """
    templates = crud.get_templates(db, role=role)
    return KPITemplateList(templates=templates)


@router.get("/", response_model=KPIResultList, summary="获取KPI考核结果")
def get_results(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    perm_ctx: PermissionContext = Depends(require_permission("academic.teacher.kpi.view")),
):
    """
    获取KPI考核结果
    
    权限要求:
    - 董事长/学术总监: 可查看所有神殿
    - 校长/学术经理/学术副经理: 只能查看本神殿
    - 学术教员: 只能查看自己的数据（通过teacher_name字段过滤）
    """
    # 数据范围检查
    if perm_ctx.data_scope == "campus":
        # 神殿级权限：只能查看本神殿
        if perm_ctx.campus and campus != perm_ctx.campus:
            raise HTTPException(
                status_code=403,
                detail=f"您只能查看 {perm_ctx.campus} 神殿的数据"
            )
    elif perm_ctx.data_scope == "self":
        # 个人级权限：只能查看自己，需要在crud层过滤
        # 这里先检查神殿
        if perm_ctx.campus and campus != perm_ctx.campus:
            raise HTTPException(
                status_code=403,
                detail=f"您只能查看 {perm_ctx.campus} 神殿的数据"
            )
    
    entries = crud.list_results(db, campus, year, month)
    
    # 如果是self范围，只返回自己的数据
    if perm_ctx.data_scope == "self":
        entries = [
            entry for entry in entries
            if entry.get("teacher_name") == perm_ctx.user.real_name
        ]
    
    return KPIResultList(campus=campus, year=year, month=month, entries=entries)


@router.post("/", response_model=KPIResultList, summary="保存KPI考核结果")
def save_results(
    payload: KPIResultSavePayload,
    db: Session = Depends(get_db),
    perm_ctx: PermissionContext = Depends(require_permission("academic.teacher.kpi.edit")),
):
    """
    保存KPI考核结果
    
    权限要求:
    - 董事长/学术总监: 可编辑所有神殿
    - 校长/学术经理/学术副经理: 只能编辑本神殿
    - 学术教员: 只能编辑自己的数据
    """
    # 数据范围检查
    if perm_ctx.data_scope == "campus":
        # 神殿级权限：只能编辑本神殿
        if perm_ctx.campus and payload.campus_name != perm_ctx.campus:
            raise HTTPException(
                status_code=403,
                detail=f"您只能编辑 {perm_ctx.campus} 神殿的数据"
            )
    elif perm_ctx.data_scope == "self":
        # 个人级权限：只能编辑自己
        for entry in payload.entries:
            if entry.teacher_name != perm_ctx.user.real_name:
                raise HTTPException(
                    status_code=403,
                    detail="您只能编辑自己的KPI数据"
                )
        # 同时限制神殿
        if perm_ctx.campus and payload.campus_name != perm_ctx.campus:
            raise HTTPException(
                status_code=403,
                detail=f"您只能编辑 {perm_ctx.campus} 神殿的数据"
            )
    
    try:
        entries = crud.save_results(
            db,
            payload.campus_name,
            payload.year,
            payload.month,
            [
                entry.model_dump(by_alias=False, exclude_none=False)
                for entry in payload.entries
            ],
        )
        return KPIResultList(
            campus=payload.campus_name,
            year=payload.year,
            month=payload.month,
            entries=entries,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"保存失败: {exc}")


@router.post("/assessment", summary="保存KPI考核数据")
def save_assessment(
    payload: KPIAssessmentSavePayload,
    db: Session = Depends(get_db),
    perm_ctx: PermissionContext = Depends(require_permission("academic.teacher.kpi.edit")),
):
    """
    保存KPI考核数据
    
    权限要求: academic.teacher.kpi.edit
    """
    # 数据范围检查
    if perm_ctx.data_scope == "campus":
        if perm_ctx.campus and payload.campus != perm_ctx.campus:
            raise HTTPException(
                status_code=403,
                detail=f"您只能编辑 {perm_ctx.campus} 神殿的数据"
            )
    elif perm_ctx.data_scope == "self":
        for record in payload.records:
            if record.teacher_name != perm_ctx.user.real_name:
                raise HTTPException(
                    status_code=403,
                    detail="您只能编辑自己的KPI考核数据"
                )
        if perm_ctx.campus and payload.campus != perm_ctx.campus:
            raise HTTPException(
                status_code=403,
                detail=f"您只能编辑 {perm_ctx.campus} 神殿的数据"
            )
    
    try:
        crud.save_assessments(
            db,
            payload.campus,
            payload.year,
            payload.month,
            [
                record.model_dump(by_alias=False, exclude_none=False)
                for record in payload.records
            ],
        )
        return {"message": "保存成功"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"保存失败: {exc}")


@router.get("/assessment", response_model=KPIAssessmentList, summary="获取KPI考核数据")
def get_assessment(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    perm_ctx: PermissionContext = Depends(require_permission("academic.teacher.kpi.view")),
):
    """
    获取KPI考核数据
    
    权限要求: academic.teacher.kpi.view
    """
    # 数据范围检查
    if perm_ctx.data_scope == "campus":
        if perm_ctx.campus and campus != perm_ctx.campus:
            raise HTTPException(
                status_code=403,
                detail=f"您只能查看 {perm_ctx.campus} 神殿的数据"
            )
    elif perm_ctx.data_scope == "self":
        if perm_ctx.campus and campus != perm_ctx.campus:
            raise HTTPException(
                status_code=403,
                detail=f"您只能查看 {perm_ctx.campus} 神殿的数据"
            )
    
    records = crud.list_assessments(db, campus, year, month)
    
    # 如果是self范围，只返回自己的数据
    if perm_ctx.data_scope == "self":
        records = [
            record for record in records
            if record.get("teacher_name") == perm_ctx.user.real_name
        ]
    
    return KPIAssessmentList(campus=campus, year=year, month=month, records=records)

