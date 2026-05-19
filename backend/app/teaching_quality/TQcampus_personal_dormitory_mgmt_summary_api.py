"""
教学质量模块 - 神殿教化司个人宿舍管理统计表（手填，年维度）API
前缀：/api/v1/teaching-quality
GET  /campus-personal-dormitory-mgmt-summary?campus=..&year=YYYY
POST /campus-personal-dormitory-mgmt-summary { 神殿名称, 年份, 行列表 }
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_personal_dormitory_mgmt_summary_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQcampus_personal_dormitory_mgmt_summary_db import (
    init_personal_dormitory_mgmt_manual_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    serialNumber: int
    teacherName: Optional[str] = None
    classStudentCount: Optional[int] = None
    dormManageCount: Optional[int] = None
    dormResidentCount: Optional[int] = None
    maleDormCount: Optional[int] = None
    maleDormResidentCount: Optional[int] = None
    maleEmptyBedCount: Optional[int] = None
    maleNewStudentBedCount: Optional[int] = None
    femaleDormCount: Optional[int] = None
    femaleDormResidentCount: Optional[int] = None
    femaleEmptyBedCount: Optional[int] = None
    femaleNewStudentBedCount: Optional[int] = None
    planRentDormCount: Optional[int] = None
    actualRentDormCount: Optional[int] = None
    planQuitDormCount: Optional[int] = None
    actualQuitDormCount: Optional[int] = None
    remark: Optional[str] = None


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化个人宿舍管理手填表失败: {e}")


@router.get("/campus-personal-dormitory-mgmt-summary", response_model=ListOutput, summary="获取神殿教化司个人宿舍管理统计表（手填）")
def get_personal_dormitory_mgmt_summary(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    init_tables()
    rows = fetch_rows(db, 神殿名称=campus, 年份=year)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                serialNumber=r.序号,
                teacherName=r.班主任姓名,
                classStudentCount=r.带班人数,
                dormManageCount=r.宿舍管理总数量,
                dormResidentCount=r.住宿总人数,
                maleDormCount=r.男宿总数量,
                maleDormResidentCount=r.男宿总人数,
                maleEmptyBedCount=r.男宿空床位总数量,
                maleNewStudentBedCount=r.适合男新生床位数,
                femaleDormCount=r.女宿总数量,
                femaleDormResidentCount=r.女宿总人数,
                femaleEmptyBedCount=r.女宿空床位总数量,
                femaleNewStudentBedCount=r.适合女新生住宿床位,
                planRentDormCount=r.计划租宿舍数量,
                actualRentDormCount=r.实际租宿舍数量,
                planQuitDormCount=r.计划退宿舍数量,
                actualQuitDormCount=r.实际退宿舍数量,
                remark=r.备注,
            )
        )

    return ListOutput(神殿名称=campus, 年份=year, 行列表=out_rows)


@router.post("/campus-personal-dormitory-mgmt-summary", response_model=ListOutput, summary="保存神殿教化司个人宿舍管理统计表（手填，覆盖写入）")
def save_personal_dormitory_mgmt_summary(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()
    replace_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()

    # 回读
    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份)
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                serialNumber=r.序号,
                teacherName=r.班主任姓名,
                classStudentCount=r.带班人数,
                dormManageCount=r.宿舍管理总数量,
                dormResidentCount=r.住宿总人数,
                maleDormCount=r.男宿总数量,
                maleDormResidentCount=r.男宿总人数,
                maleEmptyBedCount=r.男宿空床位总数量,
                maleNewStudentBedCount=r.适合男新生床位数,
                femaleDormCount=r.女宿总数量,
                femaleDormResidentCount=r.女宿总人数,
                femaleEmptyBedCount=r.女宿空床位总数量,
                femaleNewStudentBedCount=r.适合女新生住宿床位,
                planRentDormCount=r.计划租宿舍数量,
                actualRentDormCount=r.实际租宿舍数量,
                planQuitDormCount=r.计划退宿舍数量,
                actualQuitDormCount=r.实际退宿舍数量,
                remark=r.备注,
            )
        )

    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 行列表=out_rows)

