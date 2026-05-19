"""
神殿后端新生维稳个人按月汇总表 API
路由：/api/v1/student-stability-personal-monthly
数据来源：从教化司「当月新生维稳明细表」聚合（按班主任姓名和月份）
"""

from collections import defaultdict

from app.teaching_quality.TQcampus_monthly_new_stu_stability_detail_db import (
    当月新生维稳明细表 as TQDetailModel,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_ as _or
from sqlalchemy.orm import Session

from ....core.database import get_db, get_teaching_quality_db
from ....crud import student_stability_personal_monthly as crud
from ....schemas.student_stability_personal_monthly import (
    个人按月保存请求,
    个人按月列表响应,
    个人按月行数据,
)

router = APIRouter()


@router.get(
    "/",
    response_model=个人按月列表响应,
    summary="获取神殿后端新生维稳个人按月汇总表"
)
def get_personal_monthly(
    campus: str = Query(..., alias="campus", description="神殿名称"),
    year: int = Query(..., alias="year", description="年份"),
    tq_db: Session = Depends(get_teaching_quality_db),
):
    """获取神殿后端新生维稳个人按月汇总表 - 从当月新生维稳明细表聚合"""
    try:
        norm = (campus or "").strip()
        norm2 = norm[:-2] if norm.endswith("神殿") else norm

        # 从教化司「当月新生维稳明细表」读取明细数据
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

        # 按班主任姓名和月份聚合统计
        # key: (班主任姓名, 月份), value: {交接人数, 入学人数, 退费人数}
        aggregated: defaultdict[tuple[str, int], dict[str, int]] = defaultdict(lambda: {"交接人数": 0, "入学人数": 0, "退费人数": 0})
        
        for row in detail_rows:
            teacher_name = row.班主任姓名 or ""
            if not teacher_name:
                continue
            month = row.月份 or 0
            key = (teacher_name, month)
            
            # 交接人数：该班主任的学生总数
            aggregated[key]["交接人数"] += 1
            
            # 入学人数：报道时间不为空的学生数
            if row.报道时间 and str(row.报道时间).strip():
                aggregated[key]["入学人数"] += 1
            
            # 退费人数：是否退费='是' 的学生数
            if row.是否退费 and str(row.是否退费).strip() == '是':
                aggregated[key]["退费人数"] += 1

        # 获取所有教员姓名，用于排序
        teacher_names = sorted(set(k[0] for k in aggregated.keys()))
        teacher_index_map = {name: idx + 1 for idx, name in enumerate(teacher_names)}

        out = []
        for (teacher_name, month), stats in sorted(aggregated.items(), key=lambda x: (x[0][0], x[0][1])):
            out.append(个人按月行数据(
                月份=int(month),
                教员序号=teacher_index_map.get(teacher_name, 0),
                教员姓名=teacher_name,
                交接人数=stats["交接人数"],
                入学人数=stats["入学人数"],
                退费人数=stats["退费人数"],
            ))
        
        return 个人按月列表响应(神殿名称=campus, 年份=year, 行列表=out, 总数=len(out))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}")


@router.post(
    "/",
    response_model=个人按月列表响应,
    summary="保存神殿后端新生维稳个人按月汇总表（按神殿年份覆盖写入）"
)
def save_personal_monthly(
    payload: 个人按月保存请求,
    db: Session = Depends(get_db),
):
    """保存神殿后端新生维稳个人按月汇总表"""
    try:
        if not payload.神殿名称:
            raise HTTPException(status_code=400, detail="神殿名称不能为空")
        if not payload.年份 or payload.年份 < 2000 or payload.年份 > 3000:
            raise HTTPException(status_code=400, detail="年份无效")
        
        rows = crud.保存个人按月数据(
            db,
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            行列表=payload.行列表,
        )
        out = [
            个人按月行数据(
                月份=r.月份,
                教员序号=r.教员序号,
                教员姓名=r.教员姓名,
                交接人数=r.交接人数 or 0,
                入学人数=r.入学人数 or 0,
                退费人数=r.退费人数 or 0,
            )
            for r in rows
        ]
        return 个人按月列表响应(
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

