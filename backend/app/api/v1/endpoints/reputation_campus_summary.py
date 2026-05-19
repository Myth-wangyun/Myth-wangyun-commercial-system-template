"""
神殿智慧司口碑招生汇总表 API
路由：/api/v1/reputation-campus-summary
"""

from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import reputation_campus_summary as crud
from ....schemas.reputation_campus_summary import (
    可用年份响应,
    所有神殿年度汇总响应,
    神殿历史汇总响应,
    神殿年度汇总项,
    神殿汇总保存请求,
    神殿汇总列表响应,
    神殿汇总行数据,
)

router = APIRouter()


@router.get(
    "/available-years",
    response_model=可用年份响应,
    summary="获取可用的年份列表"
)
def get_available_years(
    campus: Optional[str] = Query(None, alias="campus", description="神殿名称（可选，不传则获取所有年份）"),
    db: Session = Depends(get_db),
):
    """获取可用的年份列表"""
    try:
        年份列表 = crud.获取可用年份列表(db, 神殿名称=campus)
        return 可用年份响应(年份列表=年份列表)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")


@router.get(
    "/historical",
    response_model=神殿历史汇总响应,
    summary="获取神殿历史汇总（所有年份合计）"
)
def get_campus_historical_summary(
    campus: str = Query(..., alias="campus", description="神殿名称"),
    db: Session = Depends(get_db),
):
    """获取神殿历史汇总数据（所有年份的数据合计）"""
    try:
        data = crud.获取神殿历史汇总数据(db, 神殿名称=campus)
        return 神殿历史汇总响应(
            神殿名称=campus,
            目标口碑量=data["目标口碑量"],
            实际口碑量=data["实际口碑量"],
            目标上门量=data["目标上门量"],
            实际上门量=data["实际上门量"],
            目标招生人数=data["目标招生人数"],
            实际招生人数=data["实际招生人数"],
            目标口碑收入=data["目标口碑收入"],
            实际口碑收入=data["实际口碑收入"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")


@router.get(
    "/all-campuses",
    response_model=所有神殿年度汇总响应,
    summary="获取所有神殿的年度口碑招生汇总（最高议事厅用）"
)
def get_all_campuses_yearly_summary(
    year: int = Query(..., alias="year", description="年份"),
    db: Session = Depends(get_db),
):
    """获取所有神殿的年度口碑招生汇总数据（按神殿聚合全年数据）"""
    try:
        rows = crud.获取所有神殿年度汇总(db, 年份=year)
        数据列表 = [
            神殿年度汇总项(
                神殿名称=r["神殿名称"],
                目标口碑量=r["目标口碑量"],
                实际口碑量=r["实际口碑量"],
                目标上门量=r["目标上门量"],
                实际上门量=r["实际上门量"],
                目标招生人数=r["目标招生人数"],
                实际招生人数=r["实际招生人数"],
                目标口碑收入=r["目标口碑收入"],
                实际口碑收入=r["实际口碑收入"],
            )
            for r in rows
        ]
        return 所有神殿年度汇总响应(年份=year, 数据列表=数据列表)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")


@router.get(
    "/",
    response_model=神殿汇总列表响应,
    summary="获取神殿智慧司口碑招生汇总表"
)
def get_campus_summary(
    campus: str = Query(..., alias="campus", description="神殿名称"),
    year: int = Query(..., alias="year", description="年份"),
    db: Session = Depends(get_db),
):
    """获取神殿智慧司口碑招生汇总表"""
    try:
        rows = crud.获取神殿汇总数据(db, 神殿名称=campus, 年份=year)
        out = [
            神殿汇总行数据(
                月份=r.月份,
                目标口碑量=r.目标口碑量 or 0,
                实际口碑量=r.实际口碑量 or 0,
                目标上门量=r.目标上门量 or 0,
                实际上门量=r.实际上门量 or 0,
                目标招生人数=r.目标招生人数 or 0,
                实际招生人数=r.实际招生人数 or 0,
                目标口碑收入=Decimal(str(r.目标口碑收入 or 0)),
                实际口碑收入=Decimal(str(r.实际口碑收入 or 0)),
            )
            for r in rows
        ]
        return 神殿汇总列表响应(神殿名称=campus, 年份=year, 行列表=out)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")


@router.post(
    "/",
    response_model=神殿汇总列表响应,
    summary="保存神殿智慧司口碑招生汇总表（按年份覆盖写入）"
)
def save_campus_summary(
    payload: 神殿汇总保存请求,
    db: Session = Depends(get_db),
):
    """保存神殿智慧司口碑招生汇总表"""
    try:
        rows = crud.保存神殿汇总数据(
            db,
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            行列表=payload.行列表,
        )
        out = [
            神殿汇总行数据(
                月份=r.月份,
                目标口碑量=r.目标口碑量 or 0,
                实际口碑量=r.实际口碑量 or 0,
                目标上门量=r.目标上门量 or 0,
                实际上门量=r.实际上门量 or 0,
                目标招生人数=r.目标招生人数 or 0,
                实际招生人数=r.实际招生人数 or 0,
                目标口碑收入=Decimal(str(r.目标口碑收入 or 0)),
                实际口碑收入=Decimal(str(r.实际口碑收入 or 0)),
            )
            for r in rows
        ]
        return 神殿汇总列表响应(
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            行列表=out,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")

