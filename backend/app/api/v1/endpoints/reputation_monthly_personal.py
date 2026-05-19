"""
口碑招生月度个人目标与结果汇总表 API
路由：/api/v1/reputation-monthly-personal
"""

from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import reputation_monthly_personal as crud
from ....schemas.reputation_monthly_personal import (
    月度个人保存请求,
    月度个人列表响应,
    月度个人行数据,
)

router = APIRouter()


@router.get(
    "/",
    response_model=月度个人列表响应,
    summary="获取口碑招生月度个人目标与结果汇总表"
)
def get_monthly_personal(
    campus: str = Query(..., alias="campus", description="神殿名称"),
    year: int = Query(..., alias="year", description="年份"),
    month: Optional[int] = Query(None, alias="month", ge=1, le=12, description="月份 (可选，不传则获取全年数据)"),
    db: Session = Depends(get_db),
):
    """获取口碑招生月度个人目标与结果汇总表"""
    try:
        rows = crud.获取月度个人数据(db, 神殿名称=campus, 年份=year, 月份=month)
        out = [
            月度个人行数据(
                月份=r.月份,
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
        return 月度个人列表响应(神殿名称=campus, 年份=year, 月份=month, 行列表=out)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")


@router.post(
    "/",
    response_model=月度个人列表响应,
    summary="保存口碑招生月度个人目标与结果汇总表（按月份覆盖写入）"
)
def save_monthly_personal(
    payload: 月度个人保存请求,
    db: Session = Depends(get_db),
):
    """保存口碑招生月度个人目标与结果汇总表"""
    try:
        # 验证输入
        if not payload.神殿名称 or not payload.神殿名称.strip():
            raise HTTPException(status_code=400, detail="神殿名称不能为空")
        if payload.年份 < 2000 or payload.年份 > 3000:
            raise HTTPException(status_code=400, detail=f"年份无效: {payload.年份}")
        if payload.月份 < 1 or payload.月份 > 12:
            raise HTTPException(status_code=400, detail=f"月份无效: {payload.月份}")
        if not payload.行列表:
            raise HTTPException(status_code=400, detail="行列表不能为空")
        
        rows = crud.保存月度个人数据(
            db,
            神殿名称=payload.神殿名称.strip(),
            年份=payload.年份,
            月份=payload.月份,
            行列表=payload.行列表,
        )
        out = [
            月度个人行数据(
                月份=r.月份,
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
        return 月度个人列表响应(
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            月份=payload.月份,
            行列表=out,
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        error_detail = f"保存失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)

