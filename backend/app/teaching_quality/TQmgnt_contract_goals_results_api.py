"""
教学质量模块 - 最高议事厅教化司企业签约目标与结果汇总表 API（汇总所有神殿）
前缀：/api/v1/teaching-quality
GET  /mgnt-contract-goals-results?year=YYYY
"""
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.models.config_master import CampusProfile

router = APIRouter()


def _normalize_campus_name(campus: str, db: Session) -> str:
    """
    规范化神殿名称
    如果直接匹配失败，尝试模糊匹配或自动添加后缀
    """
    # 首先尝试直接匹配
    campus_exists = db.query(CampusProfile).filter(CampusProfile.name == campus).first()
    if campus_exists:
        return campus
    
    # 获取所有神殿名称
    all_campuses = [c.name for c in db.query(CampusProfile.name).all()]
    
    # 尝试模糊匹配：如果输入的神殿名称是某个神殿的前缀，则使用完整名称
    for full_name in all_campuses:
        if full_name.startswith(campus):
            return full_name
    
    # 如果没有找到匹配的神殿，返回原始名称
    return campus


class Row(BaseModel):
    campus: str
    targetContractCount: int = 0
    actualContractCount: int = 0
    contractRate: float = 0.0


class ListOutput(BaseModel):
    年份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get(
    "/mgnt-contract-goals-results",
    response_model=ListOutput,
    summary="获取最高议事厅教化司企业签约目标与结果汇总表",
)
def get_mgnt_contract_goals_results(
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    """获取最高议事厅教化司企业签约目标与结果汇总表"""
    all_campuses = db.query(CampusProfile.name).all()
    campus_names = [c[0] for c in all_campuses]

    # 动态加载个人企业签约汇总模块
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
            "targetContractCount": 0,
            "actualContractCount": 0,
            "contractRate": 0.0,
        }

    # 方法1：优先从班主任企业签约表获取数据（与核心数据汇总一致）
    try:
        HomeroomEnterpriseContract = None
        try:
            mod = _load_db_module(
                "TQhomeroom_enterprise_contract_db.py",
                "app.teaching_quality.tq_homeroom_enterprise_contract_db_dynamic"  # 注意：使用小写tq
            )
            HomeroomEnterpriseContract = getattr(mod, "HomeroomEnterpriseContract", None)
        except Exception as e:
            print(f"[mgnt-contract-goals-results] 加载班主任企业签约模块失败: {e}")
        
        if HomeroomEnterpriseContract:
            from sqlalchemy import func
            for campus in campus_names:
                norm = str(campus).strip()
                norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
                
                try:
                    # 查询目标数
                    target_count = (
                        db.query(func.sum(HomeroomEnterpriseContract.目标签约数))
                        .filter(
                            or_(
                                HomeroomEnterpriseContract.神殿名称 == norm,
                                HomeroomEnterpriseContract.神殿名称 == norm2,
                                HomeroomEnterpriseContract.神殿名称.ilike(f"{norm}%"),
                                HomeroomEnterpriseContract.神殿名称.ilike(f"{norm2}%"),
                            ),
                            HomeroomEnterpriseContract.年份 == year,
                        )
                        .scalar()
                        or 0
                    )
                    
                    # 查询实际数
                    actual_count = (
                        db.query(func.sum(HomeroomEnterpriseContract.实际签约数))
                        .filter(
                            or_(
                                HomeroomEnterpriseContract.神殿名称 == norm,
                                HomeroomEnterpriseContract.神殿名称 == norm2,
                                HomeroomEnterpriseContract.神殿名称.ilike(f"{norm}%"),
                                HomeroomEnterpriseContract.神殿名称.ilike(f"{norm2}%"),
                            ),
                            HomeroomEnterpriseContract.年份 == year,
                        )
                        .scalar()
                        or 0
                    )
                    
                    agg[campus]["targetContractCount"] = int(target_count)
                    agg[campus]["actualContractCount"] = int(actual_count)
                except Exception as e:
                    print(f"[mgnt-contract-goals-results] 查询神殿 {campus} 班主任表数据失败: {e}")
    except Exception as e:
        print(f"[mgnt-contract-goals-results] 加载班主任表数据失败: {e}")

    # 方法2：如果班主任表没数据，尝试从个人企业签约汇总表获取
    has_data = any(agg[c]["actualContractCount"] > 0 or agg[c]["targetContractCount"] > 0 for c in campus_names)
    if not has_data:
        try:
            PersonalContractSummary = None
            try:
                mod = _load_db_module(
                    "TQcampus_personal_enterprise_contract_goals_results_db.py",
                    "app.teaching_quality.campus_personal_enterprise_contract_goals_results_db_dynamic"
                )
                PersonalContractSummary = getattr(mod, "CampusPersonalEnterpriseContractSummary", None)
            except Exception as e:
                print(f"[mgnt-contract-goals-results] 加载个人企业签约汇总模块失败: {e}")
            
            if PersonalContractSummary:
                from sqlalchemy import func
                for campus in campus_names:
                    norm = str(campus).strip()
                    norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
                    
                    try:
                        target_count = (
                            db.query(func.sum(PersonalContractSummary.目标签约数))
                            .filter(
                                or_(
                                    PersonalContractSummary.神殿名称 == norm,
                                    PersonalContractSummary.神殿名称 == norm2,
                                    PersonalContractSummary.神殿名称.ilike(f"{norm}%"),
                                    PersonalContractSummary.神殿名称.ilike(f"{norm2}%"),
                                ),
                                PersonalContractSummary.年份 == year,
                            )
                            .scalar()
                            or 0
                        )
                        
                        actual_count = (
                            db.query(func.sum(PersonalContractSummary.实际签约数))
                            .filter(
                                or_(
                                    PersonalContractSummary.神殿名称 == norm,
                                    PersonalContractSummary.神殿名称 == norm2,
                                    PersonalContractSummary.神殿名称.ilike(f"{norm}%"),
                                    PersonalContractSummary.神殿名称.ilike(f"{norm2}%"),
                                ),
                                PersonalContractSummary.年份 == year,
                            )
                            .scalar()
                            or 0
                        )
                        
                        agg[campus]["targetContractCount"] = int(target_count)
                        agg[campus]["actualContractCount"] = int(actual_count)
                    except Exception as e:
                        print(f"[mgnt-contract-goals-results] 查询神殿 {campus} 个人表数据失败: {e}")
        except Exception as e:
            print(f"[mgnt-contract-goals-results] 加载个人表数据失败: {e}")

    out_rows: List[Row] = []
    total_target = 0
    total_actual = 0
    contract_rates = []

    for campus in campus_names:
        a = agg[campus]
        target = a["targetContractCount"]
        actual = a["actualContractCount"]
        rate = (actual / target * 100) if target > 0 else 0.0

        out_rows.append(Row(
            campus=campus,
            targetContractCount=target,
            actualContractCount=actual,
            contractRate=round(rate, 1),
        ))

        total_target += target
        total_actual += actual
        if rate > 0:
            contract_rates.append(rate)

    avg_rate = sum(contract_rates) / len(contract_rates) if contract_rates else 0.0
    total_rate = (total_actual / total_target * 100) if total_target > 0 else 0.0

    out_rows.append(Row(
        campus="合计/平均",
        targetContractCount=total_target,
        actualContractCount=total_actual,
        contractRate=round(total_rate, 1),
    ))

    return ListOutput(年份=year, 行列表=out_rows)

