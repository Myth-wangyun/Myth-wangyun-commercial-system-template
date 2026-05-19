"""
Endpoints for class press interview scores
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import press_interview_score as crud
from ....schemas.press_interview_score import (
    PressInterviewScoreCreate,
    PressInterviewScoreListResponse,
    PressInterviewScoreResponse,
    PressInterviewScoreUpdate,
)


class HeaderConfigPayload(BaseModel):
    campus_name: str
    class_name: str
    header_config: dict

router = APIRouter()


@router.get("/", response_model=PressInterviewScoreListResponse, summary="获取压力面试成绩列表")
def list_press_scores(
    campus_name: str | None = Query(None, description="神殿名称"),
    class_name: str | None = Query(None, description="班级名称"),
    major_name: str | None = Query(None, description="专业名称"),
    course_name: str | None = Query(None, description="课程名称"),
    instructor_name: str | None = Query(None, description="教员姓名"),
    year: int | None = Query(None, description="年份"),
    month: int | None = Query(None, description="月份"),
    search: str | None = Query(None, description="搜索学员名/学号"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    try:
        records, total = crud.list_scores(
            db,
            campus_name=campus_name,
            class_name=class_name,
            major_name=major_name,
            course_name=course_name,
            instructor_name=instructor_name,
            year=year,
            month=month,
            search=search,
            page=page,
            page_size=page_size,
        )
        # 确保 header_config 始终是字典类型
        response_records = []
        for r in records:
            record_dict = {
                "id": r.id,
                "campus_name": r.campus_name,
                "major_name": r.major_name,
                "class_name": r.class_name,
                "course_name": r.course_name,
                "instructor_name": r.instructor_name,
                "student_id": r.student_id,
                "student_name": r.student_name,
                "project_scores": r.project_scores or {},
                "header_config": r.header_config if r.header_config is not None else {},
                "year": r.year,
                "month": r.month,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
            }
            response_records.append(PressInterviewScoreResponse.model_validate(record_dict))
        
        return PressInterviewScoreListResponse(
            records=response_records,
            total=total,
            page=page,
            page_size=page_size,
        )
    except Exception as e:
        import traceback
        print(f"❌ 获取压力面试成绩列表时出错: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}")


@router.post("/", response_model=PressInterviewScoreResponse, summary="创建压力面试成绩")
def create_press_score(payload: PressInterviewScoreCreate, db: Session = Depends(get_db)):
    record = crud.create_score(db, payload.model_dump())
    return PressInterviewScoreResponse.model_validate(record)


@router.put("/", response_model=PressInterviewScoreResponse, summary="更新压力面试成绩")
def update_press_score(payload: PressInterviewScoreUpdate, db: Session = Depends(get_db)):
    # update_score 内部已经处理了 header_config 的同步
    update_data = payload.model_dump(exclude={"id"})
    record = crud.update_score(db, payload.id, update_data)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return PressInterviewScoreResponse.model_validate(record)


@router.delete("/", summary="删除压力面试成绩")
def delete_press_score(id: int, db: Session = Depends(get_db)):
    ok = crud.delete_score(db, id)
    if not ok:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}


@router.get("/header-config", summary="获取表头配置")
def get_header_config(
    campus_name: str = Query(..., description="神殿名称"),
    class_name: str = Query(..., description="班级名称"),
    db: Session = Depends(get_db),
):
    """获取指定神殿和班级的表头配置（从第一条记录获取）"""
    try:
        header_config = crud.get_header_config(db, campus_name, class_name)
        return {"header_config": header_config if header_config is not None else {}}
    except Exception as e:
        import traceback
        print(f"❌ 获取表头配置时出错: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取表头配置失败: {str(e)}")


@router.post("/header-config", summary="保存表头配置")
def save_header_config(
    payload: HeaderConfigPayload,
    db: Session = Depends(get_db),
):
    """保存表头配置（更新所有相同神殿+班级的记录）"""
    try:
        updated_count = crud.update_header_config(
            db,
            payload.campus_name,
            payload.class_name,
            payload.header_config or {},
        )
        return {"success": True, "updated_count": updated_count}
    except Exception as e:
        import traceback
        print(f"❌ 保存表头配置时出错: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"保存表头配置失败: {str(e)}")
