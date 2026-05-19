"""
教学质量模块 - 最高议事厅教化司学员异动表 API（汇总所有神殿）
前缀：/api/v1/teaching-quality
GET  /mgnt-student-fluctuation?year=YYYY
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
    totalStudents: int = 0
    newStudentRefunds: int = 0
    oldStudentRefunds: int = 0
    totalRefunds: int = 0
    refundRate: float = 0.0
    totalLeaveStudents: int = 0
    longTermLeaveStudents: int = 0
    longTermAbsentStudents: int = 0
    vacationStudents: int = 0
    otherSituationStudents: int = 0
    totalFluctuationStudents: int = 0
    fluctuationRate: float = 0.0


class ListOutput(BaseModel):
    年份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get(
    "/mgnt-student-fluctuation",
    response_model=ListOutput,
    summary="获取最高议事厅教化司学员异动表",
)
def get_mgnt_student_fluctuation(
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    """获取最高议事厅教化司学员异动表（从每月个人学员异动统计表汇总）"""
    # 从配置中心获取所有神殿
    all_campuses = db.query(CampusProfile.name).all()
    campus_names = [c[0] for c in all_campuses]

    # 动态加载 每月个人学员异动统计表 模块
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

    MovementTable = None
    try:
        mod = _load_db_module(
            "campus_monthly_personal_stu_movement_db.py",
            "app.teaching_quality.campus_monthly_personal_stu_movement_db_dynamic",
        )
        MovementTable = getattr(mod, "每月个人学员异动统计表", None)
    except Exception as e:
        print(f"[mgnt-student-fluctuation] 加载学员异动明细模块失败: {e}")

    # 初始化汇总容器
    agg: Dict[str, Dict[str, Any]] = {}
    for campus in campus_names:
        agg[campus] = {
            "totalStudents": 0,
            "newStudentRefunds": 0,
            "oldStudentRefunds": 0,
            "totalRefunds": 0,
            "totalLeaveStudents": 0,
            "longTermLeaveStudents": 0,
            "longTermAbsentStudents": 0,
            "vacationStudents": 0,
            "otherSituationStudents": 0,
            "totalFluctuationStudents": 0,
        }

    # 聚合每个神殿
    if MovementTable:
        for campus in campus_names:
            norm = str(campus).strip()
            norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
            try:
                sums = db.query(
                    func.sum(MovementTable.累计带生人数).label("totalStudents"),
                    func.sum(MovementTable.新生退费人数).label("newStudentRefunds"),
                    func.sum(MovementTable.老生退费人数).label("oldStudentRefunds"),
                    func.sum(MovementTable.退费总人数).label("totalRefunds"),
                    func.sum(MovementTable.休学人数).label("totalLeaveStudents"),
                    func.sum(MovementTable.长期请假人数).label("longTermLeaveStudents"),
                    func.sum(MovementTable.长期不上课人数).label("longTermAbsentStudents"),
                    func.sum(MovementTable.寒暑假人数).label("vacationStudents"),
                    func.sum(MovementTable.其他情况人数).label("otherSituationStudents"),
                    func.sum(MovementTable.异动总人数).label("totalFluctuationStudents"),
                ).filter(
                    or_(
                        MovementTable.神殿名称 == norm,
                        MovementTable.神殿名称 == norm2,
                        MovementTable.神殿名称.ilike(f"{norm}%"),
                        MovementTable.神殿名称.ilike(f"{norm2}%"),
                    ),
                    MovementTable.年份 == year,
                ).first()

                if sums:
                    agg[campus]["totalStudents"] = int(sums.totalStudents or 0)
                    agg[campus]["newStudentRefunds"] = int(sums.newStudentRefunds or 0)
                    agg[campus]["oldStudentRefunds"] = int(sums.oldStudentRefunds or 0)
                    agg[campus]["totalRefunds"] = int(sums.totalRefunds or 0)
                    agg[campus]["totalLeaveStudents"] = int(sums.totalLeaveStudents or 0)
                    agg[campus]["longTermLeaveStudents"] = int(sums.longTermLeaveStudents or 0)
                    agg[campus]["longTermAbsentStudents"] = int(sums.longTermAbsentStudents or 0)
                    agg[campus]["vacationStudents"] = int(sums.vacationStudents or 0)
                    agg[campus]["otherSituationStudents"] = int(sums.otherSituationStudents or 0)
                    agg[campus]["totalFluctuationStudents"] = int(sums.totalFluctuationStudents or 0)
            except Exception as e:
                print(f"[mgnt-student-fluctuation] 汇总神殿 {campus} 数据失败: {e}")

    # 组装输出
    out_rows: List[Row] = []
    total_students = 0
    total_new_refund = 0
    total_old_refund = 0
    total_refund = 0
    total_leave = 0
    total_long_leave = 0
    total_absent = 0
    total_vacation = 0
    total_other = 0
    total_movement = 0

    for campus in campus_names:
        a = agg[campus]
        ts = a["totalStudents"]
        refund_rate = (a["totalRefunds"] / ts * 100) if ts > 0 else 0.0
        movement_rate = (a["totalFluctuationStudents"] / ts * 100) if ts > 0 else 0.0

        out_rows.append(Row(
            campus=campus,
            totalStudents=ts,
            newStudentRefunds=a["newStudentRefunds"],
            oldStudentRefunds=a["oldStudentRefunds"],
            totalRefunds=a["totalRefunds"],
            refundRate=round(refund_rate, 1),
            totalLeaveStudents=a["totalLeaveStudents"],
            longTermLeaveStudents=a["longTermLeaveStudents"],
            longTermAbsentStudents=a["longTermAbsentStudents"],
            vacationStudents=a["vacationStudents"],
            otherSituationStudents=a["otherSituationStudents"],
            totalFluctuationStudents=a["totalFluctuationStudents"],
            fluctuationRate=round(movement_rate, 1),
        ))

        total_students += ts
        total_new_refund += a["newStudentRefunds"]
        total_old_refund += a["oldStudentRefunds"]
        total_refund += a["totalRefunds"]
        total_leave += a["totalLeaveStudents"]
        total_long_leave += a["longTermLeaveStudents"]
        total_absent += a["longTermAbsentStudents"]
        total_vacation += a["vacationStudents"]
        total_other += a["otherSituationStudents"]
        total_movement += a["totalFluctuationStudents"]

    total_refund_rate = (total_refund / total_students * 100) if total_students > 0 else 0.0
    total_movement_rate = (total_movement / total_students * 100) if total_students > 0 else 0.0

    out_rows.append(Row(
        campus="合计/平均",
        totalStudents=total_students,
        newStudentRefunds=total_new_refund,
        oldStudentRefunds=total_old_refund,
        totalRefunds=total_refund,
        refundRate=round(total_refund_rate, 1),
        totalLeaveStudents=total_leave,
        longTermLeaveStudents=total_long_leave,
        longTermAbsentStudents=total_absent,
        vacationStudents=total_vacation,
        otherSituationStudents=total_other,
        totalFluctuationStudents=total_movement,
        fluctuationRate=round(total_movement_rate, 1),
    ))

    return ListOutput(年份=year, 行列表=out_rows)
