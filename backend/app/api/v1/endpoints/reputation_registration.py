"""
口碑报名明细表 API
路由：/api/v1/reputation-registration
"""

from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import reputation_registration as crud
from ....schemas.reputation_registration import (
    报名明细保存请求,
    报名明细列表响应,
    报名明细行数据,
)

router = APIRouter()


@router.get(
    "/",
    response_model=报名明细列表响应,
    summary="获取口碑报名明细表"
)
def get_registration(
    campus: str = Query(..., alias="campus", description="神殿名称"),
    year: int = Query(..., alias="year", description="年份"),
    month: Optional[int] = Query(None, alias="month", ge=1, le=12, description="月份 (可选，不传则获取全年数据)"),
    db: Session = Depends(get_db),
):
    """获取口碑报名明细表"""
    try:
        rows = crud.获取报名明细数据(db, 神殿名称=campus, 年份=year, 月份=month)
        out = [
            报名明细行数据(
                月份=r.月份,
                教员姓名=r.教员姓名,
                报名者姓名=r.报名者姓名,
                报名时间=r.报名时间,
                报名专业=r.报名专业,
                报名学制=r.报名学制,
                应收学费=Decimal(str(r.应收学费 or 0)),
                实交学费=Decimal(str(r.实交学费 or 0)),
                是否过课时=r.是否过课时 or '否',
                是否稳定=r.是否稳定 or '稳定',
                咨询师=r.咨询师,
                介绍人姓名=r.介绍人姓名,
                口碑介绍关系=r.口碑介绍关系,
                口碑来源=r.口碑来源,
            )
            for r in rows
        ]
        return 报名明细列表响应(神殿名称=campus, 年份=year, 月份=month, 行列表=out, 总数=len(out))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")


@router.post(
    "/",
    response_model=报名明细列表响应,
    summary="保存口碑报名明细表（按月份覆盖写入）"
)
def save_registration(
    payload: 报名明细保存请求,
    db: Session = Depends(get_db),
):
    """保存口碑报名明细表"""
    try:
        rows = crud.保存报名明细数据(
            db,
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            月份=payload.月份,
            行列表=payload.行列表,
        )
        out = [
            报名明细行数据(
                月份=r.月份,
                教员姓名=r.教员姓名,
                报名者姓名=r.报名者姓名,
                报名时间=r.报名时间,
                报名专业=r.报名专业,
                报名学制=r.报名学制,
                应收学费=Decimal(str(r.应收学费 or 0)),
                实交学费=Decimal(str(r.实交学费 or 0)),
                是否过课时=r.是否过课时 or '否',
                是否稳定=r.是否稳定 or '稳定',
                咨询师=r.咨询师,
                介绍人姓名=r.介绍人姓名,
                口碑介绍关系=r.口碑介绍关系,
                口碑来源=r.口碑来源,
            )
            for r in rows
        ]
        return 报名明细列表响应(
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            月份=payload.月份,
            行列表=out,
            总数=len(out),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")


@router.delete(
    "/{record_id}",
    summary="删除口碑报名明细记录"
)
def delete_registration(
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
):
    """删除口碑报名明细记录"""
    try:
        deleted = crud.删除报名明细记录(db, 记录ID=record_id)
        if deleted:
            return {"success": True, "message": "删除成功"}
        else:
            raise HTTPException(status_code=404, detail="记录不存在")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")

