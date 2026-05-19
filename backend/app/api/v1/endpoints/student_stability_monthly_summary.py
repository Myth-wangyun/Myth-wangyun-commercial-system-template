"""
神殿后端新生维稳月度汇总表 API
数据来源：从教化司「当月新生维稳明细表」聚合（交接人数/入学人数/退费人数）
"""

from app.teaching_quality.TQcampus_monthly_new_stu_stability_detail_db import (
    当月新生维稳明细表 as TQDetailModel,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_ as _or
from sqlalchemy.orm import Session

from ....core.database import get_db, get_teaching_quality_db
from ....crud import student_stability_monthly_summary as crud
from ....schemas.student_stability_monthly_summary import (
    月度汇总保存请求,
    月度汇总列表响应,
    月度汇总行数据,
)

router = APIRouter()


@router.get(
    "/stats/yearly",
    summary="获取神殿年度统计数据",
)
def get_yearly_stats(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    db: Session = Depends(get_db),
):
    """获取指定神殿指定年份的汇总统计数据"""
    try:
        return crud.获取神殿年度统计(db, 神殿名称=campus, 年份=year)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}") from e


@router.get(
    "/stats/cumulative",
    summary="获取神殿累计统计数据",
)
def get_cumulative_stats(
    campus: str = Query(..., description="神殿名称"),
    db: Session = Depends(get_db),
):
    """获取指定神殿所有年份的累计统计数据"""
    try:
        return crud.获取神殿累计统计(db, 神殿名称=campus)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}") from e


@router.get(
    "/",
    response_model=月度汇总列表响应,
    summary="获取神殿后端新生维稳月度汇总表",
)
def get_monthly_summary(
    campus: str = Query(..., alias="campus", description="神殿名称"),
    year: int = Query(..., alias="year", description="年份"),
    tq_db: Session = Depends(get_teaching_quality_db),
):
    try:
        # 从教化司「当月新生维稳明细表」聚合数据
        norm = (campus or "").strip()
        norm2 = norm[:-2] if norm.endswith("神殿") else norm

        detail_rows = (
            tq_db.query(TQDetailModel)
            .filter(
                _or(
                    TQDetailModel.神殿名称 == norm,
                    TQDetailModel.神殿名称 == norm2,
                    TQDetailModel.神殿名称.ilike(f"{norm}%"),
                    TQDetailModel.神殿名称.ilike(f"{norm2}%"),
                ),
                TQDetailModel.年份 == year,
            )
            .all()
        )

        # 按月聚合
        month_agg = {m: {"交接人数": 0, "入学人数": 0, "退费人数": 0} for m in range(1, 13)}
        for r in detail_rows:
            m = int(r.月份 or 0)
            if m < 1 or m > 12:
                continue
            # 交接人数：该月的学生总数
            month_agg[m]["交接人数"] += 1
            # 入学人数：报道时间不为空的学生数
            if r.报道时间 and str(r.报道时间).strip():
                month_agg[m]["入学人数"] += 1
            # 退费人数：是否退费='是' 的学生数
            if r.是否退费 and str(r.是否退费).strip() == '是':
                month_agg[m]["退费人数"] += 1

        out = [
            月度汇总行数据(
                月份=m,
                交接人数=month_agg[m]["交接人数"],
                入学人数=month_agg[m]["入学人数"],
                退费人数=month_agg[m]["退费人数"],
            )
            for m in range(1, 13)
        ]
        
        return 月度汇总列表响应(神殿名称=campus, 年份=year, 行列表=out, 总数=len(out))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}") from e


@router.get(
    "/all-campuses",
    summary="获取所有神殿的年度新生维稳汇总（最高议事厅用）",
)
def get_all_campuses_yearly_summary(
    year: int = Query(..., alias="year", description="年份"),
    db: Session = Depends(get_db),
):
    """获取所有神殿的年度新生维稳汇总数据（按神殿聚合全年数据）"""
    try:
        data = crud.获取所有神殿年度汇总(db, 年份=year)
        return {"年份": year, "数据列表": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}") from e


@router.post(
    "/",
    response_model=月度汇总列表响应,
    summary="保存神殿后端新生维稳月度汇总表（覆盖写入）",
)
def save_monthly_summary(
    payload: 月度汇总保存请求,
    db: Session = Depends(get_db),
):
    try:
        if not payload.神殿名称:
            raise HTTPException(status_code=400, detail="神殿名称不能为空")
        if not payload.年份 or payload.年份 < 2000 or payload.年份 > 3000:
            raise HTTPException(status_code=400, detail="年份无效")

        rows = crud.保存月度汇总数据(
            db,
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            行列表=payload.行列表,
        )
        out = [
            月度汇总行数据(
                月份=r.月份,
                交接人数=r.交接人数 or 0,
                入学人数=r.入学人数 or 0,
                退费人数=r.退费人数 or 0,
            )
            for r in rows
        ]
        return 月度汇总列表响应(
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            行列表=out,
            总数=len(out),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"输入数据无效: {str(e)}") from e
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}") from e
