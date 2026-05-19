"""
Campus academic training plan summary APIs
神殿智慧司培训计划与成绩汇总表 API 接口
"""

from typing import List, Optional

from app.core.database import get_db
from app.crud import training_plan_summary as crud
from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

router = APIRouter()


class TrainingPlanRecordCreate(BaseModel):
    神殿名称: str
    年份: int
    月份: str
    培训目标: Optional[str] = None
    主要内容: Optional[str] = None
    培训方式: Optional[str] = None
    负责人: Optional[str] = None
    培训人数: int = 0
    合格人数: int = 0
    考试合格率: float = 0
    平均成绩: float = 0


class TrainingPlanRecordUpdate(BaseModel):
    神殿名称: Optional[str] = None
    年份: Optional[int] = None
    月份: Optional[str] = None
    培训目标: Optional[str] = None
    主要内容: Optional[str] = None
    培训方式: Optional[str] = None
    负责人: Optional[str] = None
    培训人数: Optional[int] = None
    合格人数: Optional[int] = None
    考试合格率: Optional[float] = None
    平均成绩: Optional[float] = None


class TrainingPlanRecordOut(BaseModel):
    id: int
    神殿名称: str
    年份: int
    月份: str
    培训目标: Optional[str]
    主要内容: Optional[str]
    培训方式: Optional[str]
    负责人: Optional[str]
    培训人数: int
    合格人数: int
    考试合格率: float
    平均成绩: float
    创建时间: Optional[str]
    更新时间: Optional[str]

    model_config = ConfigDict(
        from_attributes=True,
    )


class BatchSaveRequest(BaseModel):
    神殿名称: str
    年份: int
    records: List[dict]


@router.get(
    "/",
    response_model=List[TrainingPlanRecordOut],
    summary="列表-神殿智慧司培训计划与成绩汇总表",
)
def list_items(
    campus: str = Query(..., description="神殿名称"),
    year: Optional[int] = Query(None, description="年份，可选"),
    month: Optional[str] = Query(None, description="月份，可选，格式 YYYY-MM"),
    db: Session = Depends(get_db),
):
    records = crud.list_records(db, 神殿名称=campus, 年份=year, 月份=month)
    return [
        TrainingPlanRecordOut(
            id=r.id,
            神殿名称=r.神殿名称,
            年份=r.年份,
            月份=r.月份,
            培训目标=r.培训目标,
            主要内容=r.主要内容,
            培训方式=r.培训方式,
            负责人=r.负责人,
            培训人数=r.培训人数,
            合格人数=r.合格人数,
            考试合格率=r.考试合格率,
            平均成绩=r.平均成绩,
            创建时间=r.创建时间.isoformat() if r.创建时间 else None,
            更新时间=r.更新时间.isoformat() if r.更新时间 else None,
        )
        for r in records
    ]


@router.post("/", response_model=TrainingPlanRecordOut, summary="创建培训计划记录")
def create_item(
    payload: TrainingPlanRecordCreate,
    db: Session = Depends(get_db),
):
    record = crud.create_record(db, payload.model_dump())
    return TrainingPlanRecordOut(
        id=record.id,
        神殿名称=record.神殿名称,
        年份=record.年份,
        月份=record.月份,
        培训目标=record.培训目标,
        主要内容=record.主要内容,
        培训方式=record.培训方式,
        负责人=record.负责人,
        培训人数=record.培训人数,
        合格人数=record.合格人数,
        考试合格率=record.考试合格率,
        平均成绩=record.平均成绩,
        创建时间=record.创建时间.isoformat() if record.创建时间 else None,
        更新时间=record.更新时间.isoformat() if record.更新时间 else None,
    )


@router.put(
    "/{record_id}", response_model=TrainingPlanRecordOut, summary="更新培训计划记录"
)
def update_item(
    record_id: int = Path(..., description="记录ID"),
    payload: TrainingPlanRecordUpdate = Body(...),
    db: Session = Depends(get_db),
):
    record = crud.update_record(db, record_id, payload.model_dump(exclude_unset=True))
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return TrainingPlanRecordOut(
        id=record.id,
        神殿名称=record.神殿名称,
        年份=record.年份,
        月份=record.月份,
        培训目标=record.培训目标,
        主要内容=record.主要内容,
        培训方式=record.培训方式,
        负责人=record.负责人,
        培训人数=record.培训人数,
        合格人数=record.合格人数,
        考试合格率=record.考试合格率,
        平均成绩=record.平均成绩,
        创建时间=record.创建时间.isoformat() if record.创建时间 else None,
        更新时间=record.更新时间.isoformat() if record.更新时间 else None,
    )


@router.delete("/{record_id}", summary="删除培训计划记录")
def delete_item(record_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_record(db, record_id)
    if not ok:
        raise HTTPException(status_code=404, detail="记录不存在")
    return {"success": True}


@router.post("/batch", summary="批量保存培训计划记录")
def batch_save(
    payload: BatchSaveRequest,
    db: Session = Depends(get_db),
):
    records = crud.batch_upsert_records(
        db, 神殿名称=payload.神殿名称, 年份=payload.年份, records=payload.records
    )
    return {
        "success": True,
        "count": len(records),
        "data": [r.to_dict() for r in records],
    }
