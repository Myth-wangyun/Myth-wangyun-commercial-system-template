"""
教学质量模块 - 升学计划（虚拟升学班）API
路径前缀：/api/v1/teaching-quality/promotion

注意：仅在 teaching_quality 下实现，不修改智慧司相关文件。
"""
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi import Path as FPath
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQpromotion_virtual_class_db import (
    add_students,
    create_virtual_class,
    list_students,
    list_virtual_classes,
    region_summary,
    remove_student,
    update_virtual_class,
)
from app.teaching_quality.TQpromotion_virtual_class_db import (
    init_promotion_tables as init_tables,
)

router = APIRouter(prefix="/promotion", tags=["promotion"])


class CreateVC(BaseModel):
    campus: str
    year: int
    month: int
    virtualClassName: str
    region: Optional[str] = None
    campusCode: Optional[str] = None
    fromClassCode: Optional[str] = None
    targetCount: Optional[int] = 0
    remark: Optional[str] = None


class UpdateVC(BaseModel):
    virtualClassName: Optional[str] = None
    fromClassCode: Optional[str] = None
    targetCount: Optional[int] = None
    remark: Optional[str] = None


class AddStudentsPayload(BaseModel):
    studentKeys: List[str] = Field(default_factory=list)  # 使用班级档案里的身份证号
    studentIds: Optional[List[int]] = Field(default=None)  # 兼容旧格式（忽略）


def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[promotion] init tables failed: {e}")


@router.get("/virtual-classes")
def api_list_virtual_classes(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_tables()
    return list_virtual_classes(db, campus_name=campus, year=year, month=month)


@router.post("/virtual-classes")
def api_create_virtual_class(payload: CreateVC, db: Session = Depends(get_db)):
    init_tables()
    row = create_virtual_class(
        db,
        campus_name=payload.campus,
        year=payload.year,
        month=payload.month,
        virtual_class_name=payload.virtualClassName,
        region_code=payload.region,
        campus_code=payload.campusCode,
        from_class_code=payload.fromClassCode,
        target_count=payload.targetCount or 0,
        remark=payload.remark,
    )
    db.commit()
    return {"id": row.id}


@router.put("/virtual-classes/{id}")
def api_update_virtual_class(
    id: int = FPath(...),
    payload: UpdateVC = None,  # type: ignore
    db: Session = Depends(get_db),
):
    init_tables()
    row = update_virtual_class(
        db,
        id=id,
        virtual_class_name=payload.virtualClassName if payload else None,
        from_class_code=payload.fromClassCode if payload else None,
        target_count=payload.targetCount if payload else None,
        remark=payload.remark if payload else None,
    )
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    db.commit()
    return {"success": True}


@router.get("/virtual-classes/{id}/students")
def api_list_students(id: int = FPath(...), db: Session = Depends(get_db)):
    init_tables()
    return list_students(db, virtual_class_id=id)


@router.post("/virtual-classes/{id}/students")
def api_add_students(id: int = FPath(...), payload: Optional[AddStudentsPayload] = Body(None), db: Session = Depends(get_db)):
    init_tables()
    items = payload.studentKeys if payload and payload.studentKeys else []
    added = add_students(
        db,
        virtual_class_id=id,
        students=[{"studentKey": skey} for skey in items],
    )
    db.commit()
    return {"added": added}


@router.delete("/virtual-classes/{id}/students/{studentKey}")
def api_remove_student(
    id: int = FPath(...), studentKey: str = FPath(...), db: Session = Depends(get_db)
):
    init_tables()
    removed = remove_student(db, virtual_class_id=id, student_key=studentKey)
    db.commit()
    return {"removed": removed}


@router.get("/region-summary")
def api_region_summary(region: str = Query(...), year: int = Query(...), db: Session = Depends(get_db)):
    init_tables()
    return region_summary(db, region_code=region, year=year)

