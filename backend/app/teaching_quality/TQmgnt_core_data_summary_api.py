"""
教学质量模块 - 最高议事厅教化司核心数据汇总表 API（汇总所有神殿）
前缀：/api/v1/teaching-quality
GET  /mgnt-core-data-summary?year=YYYY
说明：从所有神殿的核心数据汇总表汇总得到
"""
# 动态加载神殿核心数据汇总API模块
import importlib.util
import sys
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.models.config_master import CampusProfile

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

router = APIRouter()


class Row(BaseModel):
    campus: str
    totalStudents: int = 0
    totalClasses: int = 0
    totalTeachingQualityStaff: int = 0
    totalCadreStaff: int = 0
    totalEmployees: int = 0
    totalEmployedClasses: int = 0
    totalEmployedStudents: int = 0
    employmentRate: float = 0.0
    averageEmploymentSalary: int = 0
    salaryOver10kCount: int = 0
    totalEnterpriseContracts: int = 0
    totalWordOfMouthRegistrations: int = 0
    totalWordOfMouthRevenue: int = 0
    totalFurtherEducationStudents: int = 0
    totalFurtherEducationRevenue: int = 0
    furtherEducationRateAmount: float = 0.0
    totalNewStudentEnrollments: int = 0
    totalNewStudentRefunds: int = 0
    totalOldStudentRefunds: int = 0
    refundRate: float = 0.0
    changeRate: float = 0.0
    totalDormitories: int = 0
    totalDormitoryResidents: int = 0
    secondaryVocationalTargetRegistrations: int = 0
    universityTargetRegistrations: int = 0


class ListOutput(BaseModel):
    年份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get(
    "/mgnt-core-data-summary",
    response_model=ListOutput,
    summary="获取最高议事厅教化司核心数据汇总表（汇总所有神殿）",
)
def get_mgnt_core_data_summary(
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    """
    获取最高议事厅教化司核心数据汇总表
    汇总所有神殿的核心数据
    """
    # 获取所有神殿
    all_campuses = db.query(CampusProfile.name).all()
    campus_names = [c[0] for c in all_campuses]

    # 初始化每个神殿的汇总容器
    agg: Dict[str, Dict[str, Any]] = {}
    for campus in campus_names:
        agg[campus] = {
            "totalStudents": 0,
            "totalClasses": 0,
            "totalTeachingQualityStaff": 0,
            "totalCadreStaff": 0,
            "totalEmployees": 0,
            "totalEmployedClasses": 0,
            "totalEmployedStudents": 0,
            "employmentRate": 0.0,
            "averageEmploymentSalary": 0,
            "salaryOver10kCount": 0,
            "totalEnterpriseContracts": 0,
            "totalWordOfMouthRegistrations": 0,
            "totalWordOfMouthRevenue": 0,
            "totalFurtherEducationStudents": 0,
            "totalFurtherEducationRevenue": 0,
            "furtherEducationRateAmount": 0.0,
            "totalNewStudentEnrollments": 0,
            "totalNewStudentRefunds": 0,
            "totalOldStudentRefunds": 0,
            "refundRate": 0.0,
            "changeRate": 0.0,
            "totalDormitories": 0,
            "totalDormitoryResidents": 0,
            "secondaryVocationalTargetRegistrations": 0,
            "universityTargetRegistrations": 0,
        }

    # 尝试从各个数据源加载数据
    # 这里我们使用神殿核心数据汇总API来获取数据
    try:
        # 动态加载神殿核心数据汇总API模块，避免静态导入失败
        campus_core_data_module = _load_db_module(
            "TQcampus_core_data_summary_api.py",
            "app.teaching_quality.TQcampus_core_data_summary_api_dynamic"
        )
        get_campus_core_data_summary = getattr(campus_core_data_module, "get_campus_core_data_summary", None)
        
        if get_campus_core_data_summary:
            for campus in campus_names:
                try:
                    result = get_campus_core_data_summary(campus=campus, year=year, db=db)
                    if result:
                        # 使用实际返回的字段名（可能是中文）
                        agg[campus]["totalStudents"] = int(result.get("学生总人数", 0) or 0)
                        agg[campus]["totalClasses"] = int(result.get("班级数量", 0) or 0)
                        agg[campus]["totalTeachingQualityStaff"] = int(result.get("智慧司人数", 0) or 0)
                        agg[campus]["totalCadreStaff"] = int(result.get("干部人数", 0) or 0)
                        agg[campus]["totalEmployees"] = int(result.get("员工人数", 0) or 0)
                        agg[campus]["totalEmployedClasses"] = int(result.get("就业班级数量", 0) or 0)
                        agg[campus]["totalEmployedStudents"] = int(result.get("就业总人数", 0) or result.get("totalEmployedStudents", 0) or 0)
                        agg[campus]["employmentRate"] = float(result.get("就业率", 0) or 0)
                        agg[campus]["averageEmploymentSalary"] = int(result.get("就业薪资", 0) or 0)
                        agg[campus]["salaryOver10kCount"] = int(result.get("薪资过万人数", 0) or 0)
                        agg[campus]["totalEnterpriseContracts"] = int(result.get("企业签约总数", 0) or 0)
                        agg[campus]["totalWordOfMouthRegistrations"] = int(result.get("口碑招生人数", 0) or 0)
                        agg[campus]["totalWordOfMouthRevenue"] = int(result.get("口碑招生收入", 0) or 0)
                        agg[campus]["totalFurtherEducationStudents"] = int(result.get("升学总人数", 0) or 0)
                        agg[campus]["totalFurtherEducationRevenue"] = int(result.get("升学总收入", 0) or 0)
                        agg[campus]["furtherEducationRateAmount"] = float(result.get("升学率（金额）", 0) or 0)
                        agg[campus]["totalNewStudentEnrollments"] = int(result.get("新生入学人数", 0) or 0)
                        agg[campus]["totalNewStudentRefunds"] = int(result.get("新生流失人数", 0) or 0)
                        agg[campus]["totalOldStudentRefunds"] = int(result.get("老生流失人数", 0) or 0)
                        agg[campus]["refundRate"] = float(result.get("退费率", 0) or 0)
                        agg[campus]["changeRate"] = float(result.get("异动率", 0) or 0)
                        agg[campus]["totalDormitories"] = int(result.get("宿舍总个数", 0) or 0)
                        agg[campus]["totalDormitoryResidents"] = int(result.get("宿舍总人数", 0) or 0)
                        agg[campus]["secondaryVocationalTargetRegistrations"] = int(result.get("中专层次目标注册总人数", 0) or 0)
                        agg[campus]["universityTargetRegistrations"] = int(result.get("大学层次目标注册总人数", 0) or 0)
                except Exception as e:
                    print(f"[mgnt-core-data-summary] 获取神殿 {campus} 数据失败: {e}")
                    import traceback
                    traceback.print_exc()
                    continue
        else:
            print("[mgnt-core-data-summary] 无法从模块中获取 get_campus_core_data_summary 函数")
    except Exception as e:
        print(f"[mgnt-core-data-summary] 加载神殿核心数据汇总API失败: {e}")
        import traceback
        traceback.print_exc()

    # 构建输出行
    out_rows: List[Row] = []
    total_students = 0
    total_classes = 0
    total_tq_staff = 0
    total_cadre_staff = 0
    total_employees = 0
    total_employed_classes = 0
    total_employed_students = 0
    total_salary_over_10k = 0
    total_contracts = 0
    total_wom_registrations = 0
    total_wom_revenue = 0
    total_fe_students = 0
    total_fe_revenue = 0
    total_new_enrollments = 0
    total_new_refunds = 0
    total_old_refunds = 0
    total_dormitories = 0
    total_dormitory_residents = 0
    total_secondary_registrations = 0
    total_university_registrations = 0
    employment_rates = []
    fe_rates = []
    refund_rates = []
    change_rates = []

    for campus in campus_names:
        a = agg[campus]
        out_rows.append(Row(
            campus=campus,
            totalStudents=a["totalStudents"],
            totalClasses=a["totalClasses"],
            totalTeachingQualityStaff=a["totalTeachingQualityStaff"],
            totalCadreStaff=a["totalCadreStaff"],
            totalEmployees=a["totalEmployees"],
            totalEmployedClasses=a["totalEmployedClasses"],
            totalEmployedStudents=a["totalEmployedStudents"],
            employmentRate=a["employmentRate"],
            averageEmploymentSalary=a["averageEmploymentSalary"],
            salaryOver10kCount=a["salaryOver10kCount"],
            totalEnterpriseContracts=a["totalEnterpriseContracts"],
            totalWordOfMouthRegistrations=a["totalWordOfMouthRegistrations"],
            totalWordOfMouthRevenue=a["totalWordOfMouthRevenue"],
            totalFurtherEducationStudents=a["totalFurtherEducationStudents"],
            totalFurtherEducationRevenue=a["totalFurtherEducationRevenue"],
            furtherEducationRateAmount=a["furtherEducationRateAmount"],
            totalNewStudentEnrollments=a["totalNewStudentEnrollments"],
            totalNewStudentRefunds=a["totalNewStudentRefunds"],
            totalOldStudentRefunds=a["totalOldStudentRefunds"],
            refundRate=a["refundRate"],
            changeRate=a["changeRate"],
            totalDormitories=a["totalDormitories"],
            totalDormitoryResidents=a["totalDormitoryResidents"],
            secondaryVocationalTargetRegistrations=a["secondaryVocationalTargetRegistrations"],
            universityTargetRegistrations=a["universityTargetRegistrations"],
        ))

        total_students += a["totalStudents"]
        total_classes += a["totalClasses"]
        total_tq_staff += a["totalTeachingQualityStaff"]
        total_cadre_staff += a["totalCadreStaff"]
        total_employees += a["totalEmployees"]
        total_employed_classes += a["totalEmployedClasses"]
        total_employed_students += a["totalEmployedStudents"]
        total_salary_over_10k += a["salaryOver10kCount"]
        total_contracts += a["totalEnterpriseContracts"]
        total_wom_registrations += a["totalWordOfMouthRegistrations"]
        total_wom_revenue += a["totalWordOfMouthRevenue"]
        total_fe_students += a["totalFurtherEducationStudents"]
        total_fe_revenue += a["totalFurtherEducationRevenue"]
        total_new_enrollments += a["totalNewStudentEnrollments"]
        total_new_refunds += a["totalNewStudentRefunds"]
        total_old_refunds += a["totalOldStudentRefunds"]
        total_dormitories += a["totalDormitories"]
        total_dormitory_residents += a["totalDormitoryResidents"]
        total_secondary_registrations += a["secondaryVocationalTargetRegistrations"]
        total_university_registrations += a["universityTargetRegistrations"]

        if a["employmentRate"] > 0:
            employment_rates.append(a["employmentRate"])
        if a["furtherEducationRateAmount"] > 0:
            fe_rates.append(a["furtherEducationRateAmount"])
        if a["refundRate"] > 0:
            refund_rates.append(a["refundRate"])
        if a["changeRate"] > 0:
            change_rates.append(a["changeRate"])

    # 计算平均值
    avg_employment_rate = sum(employment_rates) / len(employment_rates) if employment_rates else 0.0
    avg_fe_rate = sum(fe_rates) / len(fe_rates) if fe_rates else 0.0
    avg_refund_rate = sum(refund_rates) / len(refund_rates) if refund_rates else 0.0
    avg_change_rate = sum(change_rates) / len(change_rates) if change_rates else 0.0
    avg_salary = int(sum(a["averageEmploymentSalary"] for a in agg.values()) / len(agg)) if agg else 0

    # 合计行
    out_rows.append(Row(
        campus="合计/平均",
        totalStudents=total_students,
        totalClasses=total_classes,
        totalTeachingQualityStaff=total_tq_staff,
        totalCadreStaff=total_cadre_staff,
        totalEmployees=total_employees,
        totalEmployedClasses=total_employed_classes,
        totalEmployedStudents=total_employed_students,
        employmentRate=round(avg_employment_rate, 1),
        averageEmploymentSalary=avg_salary,
        salaryOver10kCount=total_salary_over_10k,
        totalEnterpriseContracts=total_contracts,
        totalWordOfMouthRegistrations=total_wom_registrations,
        totalWordOfMouthRevenue=total_wom_revenue,
        totalFurtherEducationStudents=total_fe_students,
        totalFurtherEducationRevenue=total_fe_revenue,
        furtherEducationRateAmount=round(avg_fe_rate, 1),
        totalNewStudentEnrollments=total_new_enrollments,
        totalNewStudentRefunds=total_new_refunds,
        totalOldStudentRefunds=total_old_refunds,
        refundRate=round(avg_refund_rate, 1),
        changeRate=round(avg_change_rate, 1),
        totalDormitories=total_dormitories,
        totalDormitoryResidents=total_dormitory_residents,
        secondaryVocationalTargetRegistrations=total_secondary_registrations,
        universityTargetRegistrations=total_university_registrations,
    ))

    return ListOutput(年份=year, 行列表=out_rows)

