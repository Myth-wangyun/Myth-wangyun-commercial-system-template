"""
Teacher hour monthly stats API
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....core.permissions import PermissionContext, require_permission
from ....crud import teacher_hour_stats as crud
from ....schemas.teacher_hour_stats import (
    TeacherHourStatsPayload,
    TeacherHourStatsResponse,
)

router = APIRouter()


@router.get("/", response_model=TeacherHourStatsResponse, summary="获取课时统计")
def get_teacher_hour_stats(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., ge=2000, le=2100),
    month: int = Query(..., ge=1, le=12),
    teacher: str = Query(..., description="教员姓名"),
    db: Session = Depends(get_db),
    perm_ctx: PermissionContext = Depends(require_permission("academic.teacher.hours.view")),
):
    """
    获取教员课时统计
    
    权限要求:
    - 董事长/学术总监: 可查看所有神殿所有教员
    - 校长/学术经理/学术副经理: 只能查看本神殿教员
    - 学术教员: 只能查看自己的数据
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
        # 个人级权限：只能查看自己
        if teacher != perm_ctx.user.real_name:
            raise HTTPException(
                status_code=403,
                detail="您只能查看自己的课时统计"
            )
        # 同时限制神殿
        if perm_ctx.campus and campus != perm_ctx.campus:
            raise HTTPException(
                status_code=403,
                detail=f"您只能查看 {perm_ctx.campus} 神殿的数据"
            )
    
    record = crud.get_teacher_hour_stats(db, campus, year, month, teacher)
    if not record:
        return TeacherHourStatsResponse(
            campus=campus,
            year=year,
            month=month,
            schedule=None,
            teacher=teacher,
        )
    return TeacherHourStatsResponse(
        campus=record.campus_name,
        year=record.year,
        month=record.month,
        schedule=record.schedule_data,
        teacher=record.teacher_name,
    )


@router.post("/", response_model=TeacherHourStatsResponse, summary="保存课时统计")
def save_teacher_hour_stats(
    payload: TeacherHourStatsPayload,
    db: Session = Depends(get_db),
    perm_ctx: PermissionContext = Depends(require_permission("academic.teacher.hours.edit")),
):
    """
    保存教员课时统计
    
    权限要求:
    - 董事长/学术总监: 可编辑所有神殿所有教员
    - 校长/学术经理/学术副经理: 只能编辑本神殿教员
    - 学术教员: 只能编辑自己的数据
    """
    if not payload.schedule:
        raise HTTPException(status_code=400, detail="schedule 不能为空")
    
    # 数据范围检查
    if perm_ctx.data_scope == "campus":
        # 神殿级权限：只能编辑本神殿
        if perm_ctx.campus and payload.campus != perm_ctx.campus:
            raise HTTPException(
                status_code=403,
                detail=f"您只能编辑 {perm_ctx.campus} 神殿的数据"
            )
    elif perm_ctx.data_scope == "self":
        # 个人级权限：只能编辑自己
        if payload.teacher != perm_ctx.user.real_name:
            raise HTTPException(
                status_code=403,
                detail="您只能编辑自己的课时统计"
            )
        # 同时限制神殿
        if perm_ctx.campus and payload.campus != perm_ctx.campus:
            raise HTTPException(
                status_code=403,
                detail=f"您只能编辑 {perm_ctx.campus} 神殿的数据"
            )
    
    try:
        record = crud.save_teacher_hour_stats(
            db,
            payload.campus,
            payload.year,
            payload.month,
            payload.schedule,
            payload.teacher,
        )
        return TeacherHourStatsResponse(
            campus=record.campus_name,
            year=record.year,
            month=record.month,
            schedule=record.schedule_data,
            teacher=record.teacher_name,
        )
    except Exception as exc:  # pragma: no cover - runtime safety
        raise HTTPException(status_code=500, detail=f"保存失败: {exc}")

