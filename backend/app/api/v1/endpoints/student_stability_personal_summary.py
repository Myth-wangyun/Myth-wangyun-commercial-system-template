"""
神殿后端新生维稳个人汇总表 API
数据来源：从教化司「当月新生维稳明细表」聚合（按班主任姓名全年汇总）
"""

from app.teaching_quality.TQcampus_monthly_new_stu_stability_detail_db import (
    当月新生维稳明细表 as TQDetailModel,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_ as _or
from sqlalchemy.orm import Session

from ....core.database import get_db, get_teaching_quality_db
from ....crud import student_stability_personal_summary as crud
from ....schemas.student_stability_personal_summary import (
    个人汇总保存请求,
    个人汇总列表响应,
    个人汇总行数据,
)

router = APIRouter()


@router.get(
    "/",
    response_model=个人汇总列表响应,
    summary="获取神殿后端新生维稳个人汇总表",
)
def get_personal_summary(
    campus: str = Query(..., alias="campus", description="神殿名称"),
    year: int = Query(..., alias="year", description="年份"),
    tq_db: Session = Depends(get_teaching_quality_db),
):
    try:
        # 从教化司「当月新生维稳明细表」聚合数据（按班主任姓名全年汇总）
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

        # 按班主任姓名聚合
        teacher_agg = {}
        for r in detail_rows:
            name = (r.班主任姓名 or "").strip()
            if not name:
                continue
            if name not in teacher_agg:
                teacher_agg[name] = {"交接人数": 0, "入学人数": 0, "退费人数": 0}
            # 交接人数：该班主任的学生总数
            teacher_agg[name]["交接人数"] += 1
            # 入学人数：报道时间不为空的学生数
            if r.报道时间 and str(r.报道时间).strip():
                teacher_agg[name]["入学人数"] += 1
            # 退费人数：是否退费='是' 的学生数
            if r.是否退费 and str(r.是否退费).strip() == '是':
                teacher_agg[name]["退费人数"] += 1

        # 按教员姓名排序并添加序号
        sorted_names = sorted(teacher_agg.keys())
        rows = [
            个人汇总行数据(
                教员序号=idx + 1,
                教员姓名=name,
                交接人数=teacher_agg[name]["交接人数"],
                入学人数=teacher_agg[name]["入学人数"],
                退费人数=teacher_agg[name]["退费人数"],
            )
            for idx, name in enumerate(sorted_names)
        ]
        
        return 个人汇总列表响应(神殿名称=campus, 年份=year, 行列表=rows, 总数=len(rows))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")


@router.post(
    "/",
    response_model=个人汇总列表响应,
    summary="保存神殿后端新生维稳个人汇总表（覆盖写入）",
)
def save_personal_summary(
    payload: 个人汇总保存请求,
    db: Session = Depends(get_db),
):
    try:
        if not payload.神殿名称:
            raise HTTPException(status_code=400, detail="神殿名称不能为空")
        if not payload.年份 or payload.年份 < 2000 or payload.年份 > 3000:
            raise HTTPException(status_code=400, detail="年份无效")

        rows = crud.保存个人汇总数据(
            db,
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            行列表=payload.行列表,
        )
        out = [
            个人汇总行数据(
                教员序号=r.教员序号,
                教员姓名=r.教员姓名,
                交接人数=r.交接人数 or 0,
                入学人数=r.入学人数 or 0,
                退费人数=r.退费人数 or 0,
            )
            for r in rows
        ]
        return 个人汇总列表响应(
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            行列表=out,
            总数=len(out),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"输入数据无效: {str(e)}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")
