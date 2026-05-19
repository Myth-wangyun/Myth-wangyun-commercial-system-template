"""
教学质量模块 - 神殿教化司口碑招生个人目标与结果汇总表 API（单表）
前缀：/api/v1/teaching-quality
GET  /campus-personal-reputation-enrollment-goals-results?campus=..&year=YYYY
POST /campus-personal-reputation-enrollment-goals-results/sync  { 神殿名称, 年份 }
说明：
- 数据来源于月度个人目标与结果表的汇总
- GET 请求时自动从月度数据同步更新
- POST 请求用于手动触发同步
- 前端只读展示
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQcampus_monthly_personal_reputation_enrollment_goals_results_db import (
    fetch_rows as fetch_monthly_rows,
)
from app.teaching_quality.TQcampus_personal_reputation_enrollment_goals_results_db import (
    fetch_rows,
    replace_rows,
)
from app.teaching_quality.TQcampus_personal_reputation_enrollment_goals_results_db import (
    init_campus_personal_reputation_enrollment_tables as init_tables,
)

router = APIRouter()


class Row(BaseModel):
    serialNumber: int
    name: str
    targetReputation: Optional[int] = None
    actualReputation: Optional[int] = None
    targetVisits: Optional[int] = None
    actualVisits: Optional[int] = None
    targetStudents: Optional[int] = None
    actualStudents: Optional[int] = None
    targetRevenue: Optional[int] = None
    actualRevenue: Optional[int] = None


class ListOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


class SavePayload(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[Row] = Field(default_factory=list)


def _aggregate_monthly_to_personal(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
) -> List[Dict[str, Any]]:
    """
    从月度个人数据汇总到个人年度数据。
    按照姓名分组，对所有月份的数据进行求和。
    """
    monthly_rows = fetch_monthly_rows(db, 神殿名称=神殿名称, 年份=年份)
    
    # 按姓名分组汇总
    aggregated: Dict[str, Dict[str, Any]] = {}
    
    for row in monthly_rows:
        name = row.姓名
        if name not in aggregated:
            aggregated[name] = {
                "name": name,
                "targetReputation": 0,
                "actualReputation": 0,
                "targetVisits": 0,
                "actualVisits": 0,
                "targetStudents": 0,
                "actualStudents": 0,
                "targetRevenue": 0,
                "actualRevenue": 0,
            }
        
        aggregated[name]["targetReputation"] += row.目标口碑量 or 0
        aggregated[name]["actualReputation"] += row.实际口碑量 or 0
        aggregated[name]["targetVisits"] += row.目标上门量 or 0
        aggregated[name]["actualVisits"] += row.实际上门量 or 0
        aggregated[name]["targetStudents"] += row.目标招生人数 or 0
        aggregated[name]["actualStudents"] += row.实际招生人数 or 0
        aggregated[name]["targetRevenue"] += row.目标收入 or 0
        aggregated[name]["actualRevenue"] += row.实际收入 or 0
    
    # 转换为列表，按姓名排序
    result = sorted(aggregated.values(), key=lambda x: x["name"])
    return result


def _startup_init():
    try:
        init_tables()
    except Exception as e:
        print(f"[teaching-quality] 初始化神殿个人口碑招生目标与结果汇总表失败: {e}")


def _sync_personal_data_from_monthly(db: Session, *, 神殿名称: str, 年份: int):
    """从月度数据同步到个人汇总表"""
    aggregated_data = _aggregate_monthly_to_personal(db, 神殿名称=神殿名称, 年份=年份)
    
    行列表 = []
    for idx, data in enumerate(aggregated_data, start=1):
        行列表.append({
            "序号": idx,
            "姓名": data["name"],
            "目标口碑量": data["targetReputation"],
            "实际口碑量": data["actualReputation"],
            "目标上门量": data["targetVisits"],
            "实际上门量": data["actualVisits"],
            "目标招生人数": data["targetStudents"],
            "实际招生人数": data["actualStudents"],
            "目标收入": data["targetRevenue"],
            "实际收入": data["actualRevenue"],
        })
    
    replace_rows(db, 神殿名称=神殿名称, 年份=年份, 行列表=行列表)
    db.commit()


@router.get(
    "/campus-personal-reputation-enrollment-goals-results",
    response_model=ListOutput,
    summary="获取口碑招生个人目标与结果汇总表",
)
def get_rows(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    init_tables()
    # GET 时自动按月度数据同步一次，确保展示为最新聚合结果
    try:
        _sync_personal_data_from_monthly(db, 神殿名称=campus, 年份=year)
    except Exception as e:
        print(f"[campus-personal-reputation] GET 自动同步失败: {e}")
    rows = fetch_rows(db, 神殿名称=campus, 年份=year)

    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                serialNumber=r.序号,
                name=r.姓名,
                targetReputation=r.目标口碑量,
                actualReputation=r.实际口碑量,
                targetVisits=r.目标上门量,
                actualVisits=r.实际上门量,
                targetStudents=r.目标招生人数,
                actualStudents=r.实际招生人数,
                targetRevenue=r.目标收入,
                actualRevenue=r.实际收入,
            )
        )

    return ListOutput(神殿名称=campus, 年份=year, 行列表=out_rows)


@router.post(
    "/campus-personal-reputation-enrollment-goals-results/sync",
    response_model=ListOutput,
    summary="手动触发同步 - 从月度数据重新计算个人汇总表",
)
def sync_rows(payload: SavePayload, db: Session = Depends(get_db)):
    init_tables()
    
    try:
        _sync_personal_data_from_monthly(db, 神殿名称=payload.神殿名称, 年份=payload.年份)
    except Exception as e:
        print(f"[campus-personal-reputation] 同步失败: {e}")
        raise
    
    rows = fetch_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份)
    
    out_rows: List[Row] = []
    for r in rows:
        out_rows.append(
            Row(
                serialNumber=r.序号,
                name=r.姓名,
                targetReputation=r.目标口碑量,
                actualReputation=r.实际口碑量,
                targetVisits=r.目标上门量,
                actualVisits=r.实际上门量,
                targetStudents=r.目标招生人数,
                actualStudents=r.实际招生人数,
                targetRevenue=r.目标收入,
                actualRevenue=r.实际收入,
            )
        )
    
    return ListOutput(神殿名称=payload.神殿名称, 年份=payload.年份, 行列表=out_rows)

