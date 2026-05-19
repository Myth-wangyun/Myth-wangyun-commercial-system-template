"""
教学质量模块 - 神殿教化司企业签约目标手填 API
用途：为神殿企业签约总汇总表提供可手填、可持久化的“目标数量/目标收入”。
实际签约数量与实际签约收入依然来自班主任明细表的聚合。
"""

# 动态按路径加载 DB 模块，避免 teaching-quality 目录名的连字符导致相对导入失败
import importlib.util as _importlib_util
import sys as _sys
from pathlib import Path as _Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db

_tq_dir = _Path(__file__).resolve().parent
_db_file = _tq_dir / "TQcampus_enterprise_contract_goal_db.py"
_mod_name = "app.teaching_quality.campus_enterprise_contract_goal_db_dynamic"
if _mod_name in _sys.modules:
    db_model = _sys.modules[_mod_name]
else:
    _spec = _importlib_util.spec_from_file_location(_mod_name, str(_db_file))
    db_model = _importlib_util.module_from_spec(_spec)  # type: ignore
    assert _spec and _spec.loader
    _spec.loader.exec_module(db_model)  # type: ignore[attr-defined]
    _sys.modules[_mod_name] = db_model

router = APIRouter()


class GoalRecordBase(BaseModel):
    神殿名称: str
    年份: int
    月份: int
    目标签约数: int = 0
    目标签约收入: float = 0.0
    实际签约收入: float = 0.0
    备注: Optional[str] = None


class GoalRecord(GoalRecordBase):
    id: int
    model_config = ConfigDict(
        from_attributes=True,
    )


# 初始化表
try:
    db_model.init_db_table()
except Exception as e:
    print(f"[警告] 初始化 神殿教化司企业签约目标手填表 失败: {e}")


@router.get(
    "/campus-enterprise-contract-goals",
    response_model=List[GoalRecord],
    summary="获取某神殿某年的企业签约手填目标(12个月)",
)
def get_goals(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    db: Session = Depends(get_db),
):
    return db_model.get_goals_for_year(db, campus, year)


@router.get(
    "/campus-enterprise-contract-goals/detail",
    response_model=GoalRecord,
    summary="获取某神殿某年月的企业签约手填目标",
)
def get_goal_detail(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    month: int = Query(..., ge=1, le=12, description="月份"),
    db: Session = Depends(get_db),
):
    obj = db_model.get_goal(db, campus, year, month)
    if not obj:
        raise HTTPException(status_code=404, detail="未找到记录")
    return obj


@router.post(
    "/campus-enterprise-contract-goals",
    response_model=GoalRecord,
    summary="新增/更新某神殿某年月的企业签约手填目标",
)
def upsert_goal(
    data: GoalRecordBase,
    db: Session = Depends(get_db),
):
    return db_model.upsert_goal(db, data.model_dump())
