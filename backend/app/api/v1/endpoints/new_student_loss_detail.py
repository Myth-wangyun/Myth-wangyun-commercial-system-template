"""
新生流失明细表 API 端点
按年份、月份、教员姓名存储
"""


from app.core.database import get_db
from app.crud.new_student_loss_detail import crud_new_student_loss_detail
from app.models.new_student_loss_detail import init_new_student_loss_detail_tables
from app.schemas.new_student_loss_detail import (
    NewStudentLossDetailCreate,
    NewStudentLossDetailListResponse,
    NewStudentLossDetailResponse,
    StudentInfo,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

router = APIRouter()

# 初始化表（如果不存在则创建）
init_new_student_loss_detail_tables()


@router.get(
    "",
    response_model=NewStudentLossDetailListResponse,
    summary="获取新生流失明细列表",
    description="根据神殿、年份、月份获取新生流失明细列表"
)
def get_new_student_loss_detail(
    campus: str = Query(..., description="神殿名称", example="主神殿"),
    year: int = Query(..., description="年份", example=2025),
    month: int = Query(..., ge=1, le=12, description="月份", example=1),
    db: Session = Depends(get_db),
):
    """获取新生流失明细列表"""
    try:
        records = crud_new_student_loss_detail.get_by_campus_year_month(
            db=db,
            campus=campus,
            year=year,
            month=month
        )

        # 转换为响应格式
        response_records = []
        for record in records:
            # 将JSONB数组转换为StudentInfo列表
            student_list = [
                StudentInfo(**student_dict)
                for student_dict in (record.学生列表 or [])
            ]
            response_records.append(
                NewStudentLossDetailResponse(
                    id=record.id,
                    神殿名称=record.神殿名称,
                    年份=record.年份,
                    月份=record.月份,
                    教员姓名=record.教员姓名,
                    学生列表=student_list,
                )
            )

        return NewStudentLossDetailListResponse(
            神殿名称=campus,
            年份=year,
            月份=month,
            数据=response_records,
            总数=len(response_records)
        )
    except Exception as e:
        import traceback
        error_detail = f"获取新生流失明细失败: {str(e)}\n{traceback.format_exc()}"
        print(f"[get_new_student_loss_detail] 错误: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)


@router.post(
    "",
    response_model=NewStudentLossDetailListResponse,
    summary="保存新生流失明细",
    description="批量保存新生流失明细（会覆盖该神殿、年份、月份的所有旧数据）"
)
def save_new_student_loss_detail(
    data: NewStudentLossDetailCreate,
    db: Session = Depends(get_db),
):
    """保存新生流失明细"""
    try:
        print(f"[save_new_student_loss_detail] 保存数据: 神殿={data.神殿名称}, 年份={data.年份}, 月份={data.月份}, 教员数={len(data.教员记录列表)}")

        records = crud_new_student_loss_detail.batch_create_or_update(
            db=db,
            campus=data.神殿名称,
            year=data.年份,
            month=data.月份,
            teacher_records=data.教员记录列表
        )

        # 转换为响应格式
        response_records = []
        for record in records:
            student_list = [
                StudentInfo(**student_dict)
                for student_dict in (record.学生列表 or [])
            ]
            response_records.append(
                NewStudentLossDetailResponse(
                    id=record.id,
                    神殿名称=record.神殿名称,
                    年份=record.年份,
                    月份=record.月份,
                    教员姓名=record.教员姓名,
                    学生列表=student_list,
                )
            )

        return NewStudentLossDetailListResponse(
            神殿名称=data.神殿名称,
            年份=data.年份,
            月份=data.月份,
            数据=response_records,
            总数=len(response_records)
        )
    except Exception as e:
        import traceback
        error_detail = f"保存新生流失明细失败: {str(e)}\n{traceback.format_exc()}"
        print(f"[save_new_student_loss_detail] 错误: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)


@router.delete(
    "",
    summary="删除新生流失明细",
    description="删除指定神殿、年份、月份的所有新生流失明细"
)
def delete_new_student_loss_detail(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    month: int = Query(..., ge=1, le=12, description="月份"),
    db: Session = Depends(get_db),
):
    """删除新生流失明细"""
    try:
        count = crud_new_student_loss_detail.delete_by_campus_year_month(
            db=db,
            campus=campus,
            year=year,
            month=month
        )
        return {"message": f"成功删除 {count} 条记录"}
    except Exception as e:
        import traceback
        error_detail = f"删除新生流失明细失败: {str(e)}\n{traceback.format_exc()}"
        print(f"[delete_new_student_loss_detail] 错误: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)


@router.delete(
    "/{record_id}",
    summary="删除单条新生流失明细",
    description="根据ID删除单条新生流失明细记录"
)
def delete_new_student_loss_detail_by_id(
    record_id: int,
    db: Session = Depends(get_db),
):
    """删除单条新生流失明细"""
    try:
        success = crud_new_student_loss_detail.delete_by_id(db=db, record_id=record_id)
        if success:
            return {"message": "删除成功"}
        else:
            raise HTTPException(status_code=404, detail="记录不存在")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"删除新生流失明细失败: {str(e)}\n{traceback.format_exc()}"
        print(f"[delete_new_student_loss_detail_by_id] 错误: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)