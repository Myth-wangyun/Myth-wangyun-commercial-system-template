"""
教学质量模块 - 最高议事厅教化司口碑招生目标与结果汇总表 API（汇总所有神殿）
前缀：/api/v1/teaching-quality
GET  /mgnt-reputation-enrollment-goals-results?year=YYYY
"""
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.models.config_master import CampusProfile

router = APIRouter()


class Row(BaseModel):
    campus: str
    targetReputationCount: int = 0
    actualReputationCount: int = 0
    targetVisitCount: int = 0
    actualVisitCount: int = 0
    targetEnrollmentCount: int = 0
    actualEnrollmentCount: int = 0
    targetRevenue: int = 0
    actualRevenue: int = 0


class ListOutput(BaseModel):
    年份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get(
    "/mgnt-reputation-enrollment-goals-results",
    response_model=ListOutput,
    summary="获取最高议事厅教化司口碑招生目标与结果汇总表",
)
def get_mgnt_reputation_enrollment_goals_results(
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    """获取最高议事厅教化司口碑招生目标与结果汇总表"""
    all_campuses = db.query(CampusProfile.name).all()
    campus_names = [c[0] for c in all_campuses]

    # 动态加载个人口碑招生目标与结果汇总表模块
    import importlib.util
    import sys
    from pathlib import Path
    
    _tq_dir = Path(__file__).resolve().parent
    
    def _load_db_module(filename: str, mod_name: str):
        """动态加载数据库模块"""
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

    agg: Dict[str, Dict[str, Any]] = {}
    for campus in campus_names:
        agg[campus] = {
            "targetReputationCount": 0,
            "actualReputationCount": 0,
            "targetVisitCount": 0,
            "actualVisitCount": 0,
            "targetEnrollmentCount": 0,
            "actualEnrollmentCount": 0,
            "targetRevenue": 0,
            "actualRevenue": 0,
        }

    # 尝试从个人口碑招生目标与结果汇总表加载数据
    try:
        PersonalReputationEnrollment = None
        try:
            mod = _load_db_module(
                "TQcampus_personal_reputation_enrollment_goals_results_db.py",
                "app.teaching_quality.TQcampus_personal_reputation_enrollment_goals_results_db_dynamic"
            )
            PersonalReputationEnrollment = getattr(mod, "神殿个人口碑招生目标结果汇总表", None)
        except Exception as e:
            print(f"[mgnt-reputation-enrollment-goals-results] 加载个人口碑招生汇总模块失败: {e}")
        
        if PersonalReputationEnrollment:
            for campus in campus_names:
                # 规范化神殿名称以支持"盛邦"和"主神殿"等变体
                norm = str(campus).strip()
                norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
                
                try:
                    # 查询该神殿所有个人的数据并汇总
                    results = db.query(
                        func.sum(PersonalReputationEnrollment.目标口碑量).label('target_reputation'),
                        func.sum(PersonalReputationEnrollment.实际口碑量).label('actual_reputation'),
                        func.sum(PersonalReputationEnrollment.目标上门量).label('target_visit'),
                        func.sum(PersonalReputationEnrollment.实际上门量).label('actual_visit'),
                        func.sum(PersonalReputationEnrollment.目标招生人数).label('target_enrollment'),
                        func.sum(PersonalReputationEnrollment.实际招生人数).label('actual_enrollment'),
                        func.sum(PersonalReputationEnrollment.目标收入).label('target_revenue'),
                        func.sum(PersonalReputationEnrollment.实际收入).label('actual_revenue'),
                    ).filter(
                        or_(
                            PersonalReputationEnrollment.神殿名称 == norm,
                            PersonalReputationEnrollment.神殿名称 == norm2,
                            PersonalReputationEnrollment.神殿名称.ilike(f"{norm}%"),
                            PersonalReputationEnrollment.神殿名称.ilike(f"{norm2}%"),
                        ),
                        PersonalReputationEnrollment.年份 == year,
                    ).first()
                    
                    if results:
                        agg[campus]["targetReputationCount"] = int(results.target_reputation or 0)
                        agg[campus]["actualReputationCount"] = int(results.actual_reputation or 0)
                        agg[campus]["targetVisitCount"] = int(results.target_visit or 0)
                        agg[campus]["actualVisitCount"] = int(results.actual_visit or 0)
                        agg[campus]["targetEnrollmentCount"] = int(results.target_enrollment or 0)
                        agg[campus]["actualEnrollmentCount"] = int(results.actual_enrollment or 0)
                        agg[campus]["targetRevenue"] = int(results.target_revenue or 0)
                        agg[campus]["actualRevenue"] = int(results.actual_revenue or 0)
                except Exception as e:
                    print(f"[mgnt-reputation-enrollment-goals-results] 查询神殿 {campus} 数据失败: {e}")
    except Exception as e:
        print(f"[mgnt-reputation-enrollment-goals-results] 加载数据失败: {e}")

    out_rows: List[Row] = []
    total_target_reputation = 0
    total_actual_reputation = 0
    total_target_visit = 0
    total_actual_visit = 0
    total_target_enrollment = 0
    total_actual_enrollment = 0
    total_target_revenue = 0
    total_actual_revenue = 0

    for campus in campus_names:
        a = agg[campus]
        
        out_rows.append(Row(
            campus=campus,
            targetReputationCount=a["targetReputationCount"],
            actualReputationCount=a["actualReputationCount"],
            targetVisitCount=a["targetVisitCount"],
            actualVisitCount=a["actualVisitCount"],
            targetEnrollmentCount=a["targetEnrollmentCount"],
            actualEnrollmentCount=a["actualEnrollmentCount"],
            targetRevenue=a["targetRevenue"],
            actualRevenue=a["actualRevenue"],
        ))

        total_target_reputation += a["targetReputationCount"]
        total_actual_reputation += a["actualReputationCount"]
        total_target_visit += a["targetVisitCount"]
        total_actual_visit += a["actualVisitCount"]
        total_target_enrollment += a["targetEnrollmentCount"]
        total_actual_enrollment += a["actualEnrollmentCount"]
        total_target_revenue += a["targetRevenue"]
        total_actual_revenue += a["actualRevenue"]

    # 合计行
    out_rows.append(Row(
        campus="合计",
        targetReputationCount=total_target_reputation,
        actualReputationCount=total_actual_reputation,
        targetVisitCount=total_target_visit,
        actualVisitCount=total_actual_visit,
        targetEnrollmentCount=total_target_enrollment,
        actualEnrollmentCount=total_actual_enrollment,
        targetRevenue=total_target_revenue,
        actualRevenue=total_actual_revenue,
    ))

    return ListOutput(年份=year, 行列表=out_rows)

