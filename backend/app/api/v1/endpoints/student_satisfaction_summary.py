"""
学员满意度汇总表 API
"""

from fastapi import APIRouter, Body, Depends, HTTPException, Path
from pydantic import ValidationError
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import student_satisfaction_summary as crud
from ....schemas.student_satisfaction_summary import (
    满意度列表响应,
    满意度创建,
    满意度更新,
    满意度行响应,
)

router = APIRouter()


def _normalize_payload(raw: dict, campus: str | None = None, year: int | None = None) -> 满意度创建:
    """
    兼容老版本（月为行、教师分数为列）的请求体，转为“教员为行、m1..m12 为月”的结构。
    """
    if not isinstance(raw, dict):
        raise HTTPException(status_code=422, detail="请求体格式错误")

    # 已是新结构，直接校验
    if raw.get("行数据") and isinstance(raw["行数据"], list) and raw["行数据"]:
        first = raw["行数据"][0]
        if "序号" in first or "姓名" in first:
            # 填充路径参数
            if campus:
                raw["神殿名称"] = campus
            if year is not None:
                raw["年份"] = year
            return 满意度创建(**raw)

    # 老结构：行包含“月份”“教师分数”
    if raw.get("行数据") and isinstance(raw["行数据"], list):
        month_rows = raw["行数据"]
        teacher_names = raw.get("教师名称列表") or (month_rows[0].get("教师名称列表") if month_rows else []) or []
        teacher_names = [n for n in teacher_names if n]
        teacher_rows = []
        for idx, name in enumerate(teacher_names):
            row = {"序号": idx + 1, "姓名": name}
            for mr in month_rows:
                month = mr.get("月份")
                if not month:
                    continue
                score = (mr.get("教师分数") or {}).get(name)
                if score is not None:
                    row[f"m{month}"] = score
            teacher_rows.append(row)
        normalized = {
            "神殿名称": campus or raw.get("神殿名称"),
            "年份": year if year is not None else raw.get("年份"),
            "行数据": teacher_rows,
        }
        return 满意度创建(**normalized)

    raise HTTPException(status_code=422, detail="请求体缺少行数据")


@router.get("/", summary="学员满意度汇总表根路径")
async def root():
    return {"message": "学员满意度汇总表 API"}


@router.get(
    "/{campus}/{year}",
    response_model=满意度列表响应,
    summary="获取学员满意度汇总表",
)
async def get_satisfaction(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    try:
        行列表 = crud.获取满意度(db, campus, year)
        行数据 = [满意度行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 满意度列表响应(
            神殿名称=campus,
            年份=year,
            行数据=行数据,
            创建时间=创建时间,
            更新时间=更新时间,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取失败: {str(e)}") from e


@router.post(
    "/",
    response_model=满意度列表响应,
    summary="创建学员满意度汇总表（全量覆盖指定年份）",
)
async def create_satisfaction(
    数据: dict = Body(..., description="满意度数据"),
    db: Session = Depends(get_db),
):
    try:
        payload = _normalize_payload(数据)
        行列表 = crud.创建满意度(db, payload)
        行数据 = [满意度行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 满意度列表响应(
            神殿名称=payload.神殿名称,
            年份=payload.年份,
            行数据=行数据,
            创建时间=创建时间,
            更新时间=更新时间,
        )
    except HTTPException:
        raise
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors()) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}") from e


@router.put(
    "/{campus}/{year}",
    response_model=满意度列表响应,
    summary="更新学员满意度汇总表",
)
async def update_satisfaction(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    数据: dict = Body(..., description="满意度行数据"),
    db: Session = Depends(get_db),
):
    try:
        normalized = _normalize_payload(数据, campus=campus, year=year)
        行列表 = crud.更新满意度(db, campus, year, 满意度更新(行数据=normalized.行数据))
        行数据 = [满意度行响应.model_validate(行) for 行 in 行列表]
        创建时间 = 行列表[0].创建时间 if 行列表 else None
        更新时间 = max((行.更新时间 for 行 in 行列表), default=None) if 行列表 else None
        return 满意度列表响应(
            神殿名称=campus,
            年份=year,
            行数据=行数据,
            创建时间=创建时间,
            更新时间=更新时间,
        )
    except HTTPException:
        raise
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors()) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}") from e


@router.delete(
    "/{campus}/{year}",
    summary="删除学员满意度汇总表",
)
async def delete_satisfaction(
    campus: str = Path(..., description="神殿名称"),
    year: int = Path(..., ge=2000, le=2100, description="年份"),
    db: Session = Depends(get_db),
):
    try:
        deleted = crud.删除满意度(db, campus, year)
        return {"success": True, "deleted": deleted}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}") from e
