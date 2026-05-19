"""
教学质量模块 - 班主任标准化检查表 API（FastAPI Router）
放置于 teaching-quality 目录（包含连字符），使用 app/api/v1/__init__.py 中的动态加载机制挂载。
"""
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQhomeroom_teacher_standardization_db import (
    fetch_homeroom_teachers,
    fetch_rows,
    fetch_rows_by_homeroom_and_date,
    init_standardization_tables,
    upsert_rows,
)

router = APIRouter()


class RowInput(BaseModel):
    序号: int = Field(..., ge=1)
    项目: str
    天数: Dict[str, bool] = Field(default_factory=dict)


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    班主任: Optional[str] = None
    日期: Optional[str] = None
    行列表: List[RowInput] = Field(default_factory=list)


class RowOutput(BaseModel):
    记录ID: int
    序号: int
    项目: str
    班主任: Optional[str] = None
    日期: Optional[str] = None
    天数: Dict[str, bool]


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    班主任: Optional[str] = None
    日期: Optional[str] = None
    行列表: List[RowOutput]


class HomeroomTeacherListOutput(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    班主任列表: List[str] = Field(default_factory=list)


@router.get(
    "/homeroom-standardization",
    response_model=ListOutput,
    summary="按神殿+年月获取班主任标准化检查表（支持按班主任和日期过滤）",
)
def list_standardization(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    homeroom_teacher: Optional[str] = Query(None, alias="homeroom_teacher"),
    date: Optional[str] = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    """
    查询班主任标准化检查表
    
    参数：
    - campus: 神殿名称（必填）
    - year: 年份（必填）
    - month: 月份（必填）
    - homeroom_teacher: 班主任名称（可选）
    - date: 日期，格式 YYYY-MM-DD（可选）
    """
    init_standardization_tables()
    rows = fetch_rows(
        db,
        神殿名称=campus,
        年份=year,
        月份=month,
        班主任=homeroom_teacher,
        日期=date,
    )
    return ListOutput(
        神殿名称=campus,
        年份=year,
        月份=month,
        班主任=homeroom_teacher,
        日期=date,
        行列表=[
            RowOutput(
                记录ID=r.记录ID,
                序号=r.序号,
                项目=r.项目,
                班主任=r.班主任,
                日期=r.日期.isoformat() if r.日期 else None,
                天数=r.天数 or {},
            )
            for r in rows
        ],
    )


@router.get(
    "/homeroom-standardization/by-homeroom-and-date",
    response_model=ListOutput,
    summary="按班主任和日期查询班主任标准化检查表",
)
def list_by_homeroom_and_date(
    campus: str = Query(..., alias="campus"),
    homeroom_teacher: str = Query(..., alias="homeroom_teacher"),
    date: str = Query(..., alias="date"),
    db: Session = Depends(get_db),
):
    """
    按班主任和日期查询班主任标准化检查表
    
    参数：
    - campus: 神殿名称（必填）
    - homeroom_teacher: 班主任名称（必填）
    - date: 日期，格式 YYYY-MM-DD（必填）
    """
    init_standardization_tables()
    rows = fetch_rows_by_homeroom_and_date(
        db,
        神殿名称=campus,
        班主任=homeroom_teacher,
        日期=date,
    )
    
    # 从日期提取年份和月份
    from datetime import datetime
    date_obj = datetime.strptime(date, "%Y-%m-%d")
    
    return ListOutput(
        神殿名称=campus,
        年份=date_obj.year,
        月份=date_obj.month,
        班主任=homeroom_teacher,
        日期=date,
        行列表=[
            RowOutput(
                记录ID=r.记录ID,
                序号=r.序号,
                项目=r.项目,
                班主任=r.班主任,
                日期=r.日期.isoformat() if r.日期 else None,
                天数=r.天数 or {},
            )
            for r in rows
        ],
    )


@router.get(
    "/homeroom-standardization/homeroom-teachers",
    response_model=HomeroomTeacherListOutput,
    summary="获取班主任标准化检查表已填写的班主任列表",
)
def list_homeroom_teachers(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: int = Query(..., alias="month"),
    db: Session = Depends(get_db),
):
    init_standardization_tables()
    teachers = fetch_homeroom_teachers(db, 神殿名称=campus, 年份=year, 月份=month)
    return HomeroomTeacherListOutput(神殿名称=campus, 年份=year, 月份=month, 班主任列表=teachers)


@router.post(
    "/homeroom-standardization",
    response_model=ListOutput,
    summary="保存某神殿某月的标准化检查表（覆盖写入，支持班主任和日期）",
)
def save_standardization(payload: SavePayload, db: Session = Depends(get_db)):
    """
    保存班主任标准化检查表数据
    
    参数：
    - 神殿名称: 神殿名称（必填）
    - 年份: 年份（必填）
    - 月份: 月份（必填）
    - 班主任: 班主任名称（可选）
    - 日期: 日期，格式 YYYY-MM-DD（可选）
    - 行列表: 行数据列表（必填）
    """
    init_standardization_tables()
    upsert_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        班主任=payload.班主任,
        日期=payload.日期,
        行列表=[row.model_dump() for row in payload.行列表],
    )
    db.commit()
    rows = fetch_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        班主任=payload.班主任,
        日期=payload.日期,
    )
    return ListOutput(
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        月份=payload.月份,
        班主任=payload.班主任,
        日期=payload.日期,
        行列表=[
            RowOutput(
                记录ID=r.记录ID,
                序号=r.序号,
                项目=r.项目,
                班主任=r.班主任,
                日期=r.日期.isoformat() if r.日期 else None,
                天数=r.天数 or {},
            )
            for r in rows
        ],
    )
