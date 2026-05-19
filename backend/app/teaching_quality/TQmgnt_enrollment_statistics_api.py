"""
教学质量模块 - 最高议事厅教化司学籍统计表 API（汇总所有神殿）
前缀：/api/v1/teaching-quality
GET  /mgnt-enrollment-statistics?year=YYYY
"""
from typing import List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.models.config_master import CampusProfile

router = APIRouter()


class Row(BaseModel):
    campus: str
    # 中专层次
    vocational3YearRegistered: int = 0
    vocational1YearCount: int = 0
    vocationalOtherRegistered: int = 0
    vocationalTargetCount: int = 0
    vocationalTargetTime: str = ""
    vocationalActualCount: int = 0
    # 大学层次
    adultExamRegistered: int = 0
    openUniversityRegistered: int = 0
    universityOtherRegistered: int = 0
    universityTargetCount: int = 0
    universityTargetTime: str = ""
    universityActualCount: int = 0


class ListOutput(BaseModel):
    年份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get(
    "/mgnt-enrollment-statistics",
    response_model=ListOutput,
    summary="获取最高议事厅教化司学籍统计表",
)
def get_mgnt_enrollment_statistics(
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    """获取最高议事厅教化司学籍统计表（各神殿按当年最新月份汇总）"""
    all_campuses = db.query(CampusProfile.name).all()
    campus_names = [c[0] for c in all_campuses]

    # 动态加载 神殿教化司学籍统计表
    import importlib.util
    import sys
    from pathlib import Path
    _tq_dir = Path(__file__).resolve().parent

    def _load_db_module(filename: str, mod_name: str):
        if mod_name in sys.modules:
            return sys.modules[mod_name]
        file = _tq_dir / filename
        spec = importlib.util.spec_from_file_location(mod_name, str(file))
        module = importlib.util.module_from_spec(spec)  # type: ignore
        assert spec and spec.loader
        module.__package__ = "app.teaching_quality"
        module.__file__ = str(file)
        sys.modules[mod_name] = module
        spec.loader.exec_module(module)  # type: ignore
        return module

    EnrollStats = None
    try:
        mod = _load_db_module(
            "campus_enrollment_statistics_db.py",
            "app.teaching_quality.campus_enrollment_statistics_db_dynamic",
        )
        EnrollStats = getattr(mod, "神殿教化司学籍统计表", None)
    except Exception as e:
        print(f"[mgnt-enrollment-statistics] 加载 学籍统计表 模块失败: {e}")

    out_rows: List[Row] = []

    if EnrollStats:
        for campus in campus_names:
            norm = str(campus).strip()
            norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
            try:
                row = (
                    db.query(EnrollStats)
                    .filter(
                        or_(
                            EnrollStats.神殿名称 == norm,
                            EnrollStats.神殿名称 == norm2,
                            EnrollStats.神殿名称.ilike(f"{norm}%"),
                            EnrollStats.神殿名称.ilike(f"{norm2}%"),
                        ),
                        EnrollStats.年份 == year,
                    )
                    .order_by(EnrollStats.月份.desc())
                    .first()
                )
                if row:
                    out_rows.append(
                        Row(
                            campus=campus,
                            vocational3YearRegistered=int(row.中专3年学籍注册人数 or 0),
                            vocational1YearCount=int(row.中专1年制人数 or 0),
                            vocationalOtherRegistered=int(row.中专其他已注册人数 or 0),
                            vocationalTargetCount=int(row.中专目标注册人数 or 0),
                            vocationalTargetTime=str(row.中专目标注册时间 or ""),
                            vocationalActualCount=int(row.中专实际注册人数 or 0),
                            adultExamRegistered=int(row.大学成考注册人数 or 0),
                            openUniversityRegistered=int(row.大学国开注册人数 or 0),
                            universityOtherRegistered=int(row.大学其他已注册人数 or 0),
                            universityTargetCount=int(row.大学目标注册人数 or 0),
                            universityTargetTime=str(row.大学目标注册时间 or ""),
                            universityActualCount=int(row.大学实际注册人数 or 0),
                        )
                    )
                else:
                    out_rows.append(Row(campus=campus))
            except Exception as e:
                print(f"[mgnt-enrollment-statistics] 处理神殿 {campus} 失败: {e}")
    else:
        print("[mgnt-enrollment-statistics] 未能加载 学籍统计表 模块，返回空数据")

    return ListOutput(年份=year, 行列表=out_rows)

