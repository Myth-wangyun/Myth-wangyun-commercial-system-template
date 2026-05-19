"""
教学质量模块 - 最高议事厅教化司宿舍统计表 API（汇总所有神殿）
前缀：/api/v1/teaching-quality
GET  /mgnt-dormitory-statistics?year=YYYY
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
    totalStudents: int = 0
    totalDormitories: int = 0
    totalResidents: int = 0
    occupancyRate: float = 0.0
    maleDormitories: int = 0
    maleResidents: int = 0
    maleVacantBeds: int = 0
    maleNewStudentBeds: int = 0
    femaleDormitories: int = 0
    femaleResidents: int = 0
    femaleVacantBeds: int = 0
    femaleNewStudentBeds: int = 0
    plannedRentDormitories: int = 0
    actualRentDormitories: int = 0
    plannedReturnDormitories: int = 0
    actualReturnDormitories: int = 0
    remarks: str = ""


class ListOutput(BaseModel):
    年份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get(
    "/mgnt-dormitory-statistics",
    response_model=ListOutput,
    summary="获取最高议事厅教化司宿舍统计表",
)
def get_mgnt_dormitory_statistics(
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    """获取最高议事厅教化司宿舍统计表（读取各神殿当年最新月份数据）"""
    # 读取所有神殿
    all_campuses = db.query(CampusProfile.name).all()
    campus_names = [c[0] for c in all_campuses]

    # 动态加载 宿舍统计月汇总表 模块
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

    DormSummary = None
    try:
        mod = _load_db_module(
            "campus_dormitory_statistics_summary_db.py",
            "app.teaching_quality.campus_dormitory_statistics_summary_db_dynamic",
        )
        DormSummary = getattr(mod, "宿舍统计月汇总表", None)
    except Exception as e:
        print(f"[mgnt-dormitory-statistics] 加载 宿舍统计月汇总表 失败: {e}")

    out_rows: List[Row] = []

    # 汇总总计
    total_students = 0
    total_dorms = 0
    total_residents = 0
    total_male_dorms = 0
    total_male_residents = 0
    total_male_empty = 0
    total_male_newbeds = 0
    total_female_dorms = 0
    total_female_residents = 0
    total_female_empty = 0
    total_female_newbeds = 0
    total_plan_rent = 0
    total_actual_rent = 0
    total_plan_quit = 0
    total_actual_quit = 0

    if DormSummary:
        for campus in campus_names:
            norm = str(campus).strip()
            norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
            try:
                # 取当年最新月份的一条数据
                row = (
                    db.query(DormSummary)
                    .filter(
                        or_(
                            DormSummary.神殿名称 == norm,
                            DormSummary.神殿名称 == norm2,
                            DormSummary.神殿名称.ilike(f"{norm}%"),
                            DormSummary.神殿名称.ilike(f"{norm2}%"),
                        ),
                        DormSummary.年份 == year,
                    )
                    .order_by(DormSummary.月份.desc())
                    .first()
                )
                if row:
                    totalStudents = int(row.在校生数 or 0)
                    totalDormitories = int(row.宿舍总数量 or 0)
                    totalResidents = int(row.住宿总人数 or 0)
                    maleDormitories = int(row.男宿总数量 or 0)
                    maleResidents = int(row.男宿总人数 or 0)
                    maleVacantBeds = int(row.男宿空床位总数量 or 0)
                    maleNewStudentBeds = int(row.适合男新生床位数 or 0)
                    femaleDormitories = int(row.女宿总数量 or 0)
                    femaleResidents = int(row.女宿总人数 or 0)
                    femaleVacantBeds = int(row.女宿空床位总数量 or 0)
                    femaleNewStudentBeds = int(row.适合女新生住宿床位 or 0)
                    plannedRentDormitories = int(row.计划租宿舍数量 or 0)
                    actualRentDormitories = int(row.实际租宿舍数量 or 0)
                    plannedReturnDormitories = int(row.计划退宿舍数量 or 0)
                    actualReturnDormitories = int(row.实际退宿舍数量 or 0)
                    remarks = str(row.备注 or "")
                else:
                    totalStudents = totalDormitories = totalResidents = 0
                    maleDormitories = maleResidents = maleVacantBeds = maleNewStudentBeds = 0
                    femaleDormitories = femaleResidents = femaleVacantBeds = femaleNewStudentBeds = 0
                    plannedRentDormitories = actualRentDormitories = plannedReturnDormitories = actualReturnDormitories = 0
                    remarks = ""

                occupancyRate = round((totalResidents / totalStudents * 100), 1) if totalStudents > 0 else 0.0

                out_rows.append(
                    Row(
                        campus=campus,
                        totalStudents=totalStudents,
                        totalDormitories=totalDormitories,
                        totalResidents=totalResidents,
                        occupancyRate=occupancyRate,
                        maleDormitories=maleDormitories,
                        maleResidents=maleResidents,
                        maleVacantBeds=maleVacantBeds,
                        maleNewStudentBeds=maleNewStudentBeds,
                        femaleDormitories=femaleDormitories,
                        femaleResidents=femaleResidents,
                        femaleVacantBeds=femaleVacantBeds,
                        femaleNewStudentBeds=femaleNewStudentBeds,
                        plannedRentDormitories=plannedRentDormitories,
                        actualRentDormitories=actualRentDormitories,
                        plannedReturnDormitories=plannedReturnDormitories,
                        actualReturnDormitories=actualReturnDormitories,
                        remarks=remarks,
                    )
                )

                # 汇总
                total_students += totalStudents
                total_dorms += totalDormitories
                total_residents += totalResidents
                total_male_dorms += maleDormitories
                total_male_residents += maleResidents
                total_male_empty += maleVacantBeds
                total_male_newbeds += maleNewStudentBeds
                total_female_dorms += femaleDormitories
                total_female_residents += femaleResidents
                total_female_empty += femaleVacantBeds
                total_female_newbeds += femaleNewStudentBeds
                total_plan_rent += plannedRentDormitories
                total_actual_rent += actualRentDormitories
                total_plan_quit += plannedReturnDormitories
                total_actual_quit += actualReturnDormitories
            except Exception as e:
                print(f"[mgnt-dormitory-statistics] 处理神殿 {campus} 失败: {e}")
    else:
        print("[mgnt-dormitory-statistics] 未能加载宿舍统计月汇总表模块，返回空数据")

    # 合计/平均行
    total_occupancy = round((total_residents / total_students * 100), 1) if total_students > 0 else 0.0
    out_rows.append(
        Row(
            campus="合计/平均",
            totalStudents=total_students,
            totalDormitories=total_dorms,
            totalResidents=total_residents,
            occupancyRate=total_occupancy,
            maleDormitories=total_male_dorms,
            maleResidents=total_male_residents,
            maleVacantBeds=total_male_empty,
            maleNewStudentBeds=total_male_newbeds,
            femaleDormitories=total_female_dorms,
            femaleResidents=total_female_residents,
            femaleVacantBeds=total_female_empty,
            femaleNewStudentBeds=total_female_newbeds,
            plannedRentDormitories=total_plan_rent,
            actualRentDormitories=total_actual_rent,
            plannedReturnDormitories=total_plan_quit,
            actualReturnDormitories=total_actual_quit,
            remarks="",
        )
    )

    return ListOutput(年份=year, 行列表=out_rows)

