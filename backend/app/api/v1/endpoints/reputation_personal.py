"""
神殿口碑招生个人目标与结果汇总表 API
路由：/api/v1/reputation-personal
"""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import reputation_personal as crud
from ....schemas.reputation_personal import (
    个人保存请求,
    个人列表响应,
    个人行数据,
)

router = APIRouter()


@router.get(
    "/",
    response_model=个人列表响应,
    summary="获取神殿口碑招生个人目标与结果汇总表"
)
def get_personal(
    campus: str = Query(..., alias="campus", description="神殿名称"),
    year: int = Query(..., alias="year", description="年份"),
    db: Session = Depends(get_db),
):
    """获取神殿口碑招生个人目标与结果汇总表"""
    try:
        rows = crud.获取个人数据(db, 神殿名称=campus, 年份=year)
        out = [
            个人行数据(
                姓名=r.姓名,
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
        return 个人列表响应(神殿名称=campus, 年份=year, 行列表=out)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")


@router.post(
    "/",
    response_model=个人列表响应,
    summary="保存神殿口碑招生个人目标与结果汇总表（按年份覆盖写入）"
)
def save_personal(
    payload: 个人保存请求,
    db: Session = Depends(get_db),
):
    """保存神殿口碑招生个人目标与结果汇总表"""
    try:
        rows = crud.保存个人数据(
            db,
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            行列表=payload.行列表,
        )
        out = [
            个人行数据(
                姓名=r.姓名,
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
        return 个人列表响应(
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            行列表=out,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")

