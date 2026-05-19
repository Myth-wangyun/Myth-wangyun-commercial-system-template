"""
神殿智慧司员工业绩逐月统计表 API
"""

from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import staff_monthly_performance as crud

router = APIRouter()


class StaffMonthlyPerformanceRecord(BaseModel):
    """员工业绩逐月统计记录"""
    id: str
    month: int
    teacher: str
    homeworkSubmissionRate: float = 0
    homeworkPassRate: float = 0
    examPassRate: float = 0
    projectPassRate: float = 0
    studentSatisfaction: float = 0
    studentViolations: int = 0
    employmentRate: float = 0
    employmentSalary: float = 0
    reputationEnrollment: int = 0
    reputationIncome: float = 0
    newStudentCount: int = 0
    refundCount: int = 0


class BatchSaveRequest(BaseModel):
    """批量保存请求"""
    records: List[StaffMonthlyPerformanceRecord]


@router.get("", summary="获取员工业绩逐月统计数据")
def get_staff_monthly_performance(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    month: Optional[int] = Query(None, description="月份 (1-12)，不传则返回全年数据"),
    teacher: Optional[str] = Query(None, description="教员姓名"),
    db: Session = Depends(get_db),
):
    """
    获取指定神殿和年份的员工业绩逐月统计数据
    """
    try:
        records = crud.get_records(
            db,
            campus=campus,
            year=year,
            month=month,
            teacher_name=teacher,
        )
        
        return [crud.record_to_dict(r) for r in records]
        
    except Exception as e:
        import traceback
        error_detail = f"获取员工业绩逐月统计数据失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail) from e


@router.post("", summary="批量保存员工业绩逐月统计数据")
def save_staff_monthly_performance(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    request: BatchSaveRequest = Body(...),
    db: Session = Depends(get_db),
):
    """
    批量保存员工业绩逐月统计数据（创建或更新）
    """
    try:
        records_data = []
        for item in request.records:
            records_data.append({
                "month": item.month,
                "teacher": item.teacher,
                "homeworkSubmissionRate": item.homeworkSubmissionRate,
                "homeworkPassRate": item.homeworkPassRate,
                "examPassRate": item.examPassRate,
                "projectPassRate": item.projectPassRate,
                "studentSatisfaction": item.studentSatisfaction,
                "studentViolations": item.studentViolations,
                "employmentRate": item.employmentRate,
                "employmentSalary": item.employmentSalary,
                "reputationEnrollment": item.reputationEnrollment,
                "reputationIncome": item.reputationIncome,
                "newStudentCount": item.newStudentCount,
                "refundCount": item.refundCount,
            })
        
        results = crud.batch_upsert_records(
            db,
            campus=campus,
            year=year,
            records_data=records_data,
        )
        
        return {
            "success": True,
            "message": f"成功保存 {len(results)} 条记录",
            "count": len(results),
        }
        
    except Exception as e:
        import traceback
        error_detail = f"保存员工业绩逐月统计数据失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail) from e


@router.put("/{record_id}", summary="更新单条记录")
def update_staff_monthly_performance_record(
    record_id: int,
    request: StaffMonthlyPerformanceRecord,
    db: Session = Depends(get_db),
):
    """
    更新单条员工业绩逐月统计记录
    """
    try:
        record = crud.get_record_by_id(db, record_id)
        if not record:
            raise HTTPException(status_code=404, detail="记录不存在")
        
        data = {
            "homeworkSubmissionRate": request.homeworkSubmissionRate,
            "homeworkPassRate": request.homeworkPassRate,
            "examPassRate": request.examPassRate,
            "projectPassRate": request.projectPassRate,
            "studentSatisfaction": request.studentSatisfaction,
            "studentViolations": request.studentViolations,
            "employmentRate": request.employmentRate,
            "employmentSalary": request.employmentSalary,
            "reputationEnrollment": request.reputationEnrollment,
            "reputationIncome": request.reputationIncome,
            "newStudentCount": request.newStudentCount,
            "refundCount": request.refundCount,
        }
        
        updated = crud.update_record(db, record, data)
        
        return {
            "success": True,
            "data": crud.record_to_dict(updated),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"更新记录失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail) from e


@router.delete("/{record_id}", summary="删除单条记录")
def delete_staff_monthly_performance_record(
    record_id: int,
    db: Session = Depends(get_db),
):
    """
    删除单条员工业绩逐月统计记录
    """
    try:
        success = crud.delete_record(db, record_id)
        if not success:
            raise HTTPException(status_code=404, detail="记录不存在")
        
        return {
            "success": True,
            "message": "删除成功",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"删除记录失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail) from e


@router.delete("", summary="删除指定神殿年份的所有记录")
def delete_staff_monthly_performance_by_campus_year(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    db: Session = Depends(get_db),
):
    """
    删除指定神殿和年份的所有员工业绩逐月统计记录
    """
    try:
        count = crud.delete_records_by_campus_year(db, campus, year)
        
        return {
            "success": True,
            "message": f"成功删除 {count} 条记录",
            "count": count,
        }
        
    except Exception as e:
        import traceback
        error_detail = f"删除记录失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail) from e
