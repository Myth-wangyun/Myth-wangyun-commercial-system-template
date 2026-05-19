"""
教学质量模块 - 最高议事厅教化司升学计划 API（汇总所有神殿）
前缀：/api/v1/teaching-quality
GET  /mgnt-promotion-plan?year=YYYY
"""
# 复用“神殿升学计划汇总视图”（来源于 每月个人升学目标与结果表）来做年度汇总
# 该视图文件位于同目录下，包含 init_campus_promotion_plan_summary_tables / fetch_rows
import importlib.util
import sys
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.models.config_master import CampusProfile

router = APIRouter()


class Row(BaseModel):
    campus: str

    # 基础数据（应与前端表格列一一对应）
    totalClasses: int = 0          # 升学班级总数
    totalStudents: int = 0         # 在档总人数
    accountsReceivable: int = 0    # 应收（升学收入口径）

    # 目标/结果（人数/金额）
    targetPromotionCount: int = 0  # 预计升学总人数
    actualPromotionCount: int = 0  # 实际升学总人数
    targetRevenue: int = 0         # 预计升学收入
    actualRevenue: int = 0         # 实际升学收入

    # 比率（百分比，0~100+）
    promotionRate: float = 0.0     # 实际/预计（人数）
    revenueRate: float = 0.0       # 实际/预计（金额）


class ListOutput(BaseModel):
    年份: int
    行列表: List[Row] = Field(default_factory=list)


@router.get(
    "/mgnt-promotion-plan",
    response_model=ListOutput,
    summary="获取最高议事厅教化司升学计划",
)
def get_mgnt_promotion_plan(
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    """获取最高议事厅教化司升学计划（按神殿做年度汇总）

    数据来源：teaching_quality."v_campus_promotion_plan_summary" 视图
    （由“每月个人升学目标与结果表”按 神殿/年份/月 汇总得到）

    之前此接口只枚举了神殿但未从任何业务表取数，导致永远为 0。
    """

    # 动态加载汇总视图的 db helper（避免循环导入/包路径差异）
    _tq_dir = Path(__file__).resolve().parent
    _db_file = _tq_dir / "TQcampus_promotion_plan_summary_db.py"
    _mod_name = "app.teaching_quality.campus_promotion_plan_summary_db_dynamic_mgnt"
    if _mod_name in sys.modules:
        _db_module = sys.modules[_mod_name]
    else:
        _spec = importlib.util.spec_from_file_location(_mod_name, str(_db_file))
        _db_module = importlib.util.module_from_spec(_spec)  # type: ignore
        assert _spec and _spec.loader
        _spec.loader.exec_module(_db_module)  # type: ignore
        sys.modules[_mod_name] = _db_module

    init_tables = getattr(_db_module, "init_campus_promotion_plan_summary_tables")
    fetch_rows = getattr(_db_module, "fetch_rows")

    # 确保视图存在/已更新
    init_tables()

    all_campuses = db.query(CampusProfile.name).all()
    campus_names = [c[0] for c in all_campuses]

    out_rows: List[Row] = []

    total_classes_sum = 0
    total_students_sum = 0
    total_accounts_receivable_sum = 0

    total_expected_count = 0
    total_actual_count = 0
    total_expected_rev = 0
    total_actual_rev = 0

    for campus in campus_names:
        # 该视图按“月份”出多行，这里做年度求和
        month_rows = fetch_rows(db, 神殿名称=campus, 年份=year)

        # 从视图中按“月份”汇总为年度
        total_classes = sum((getattr(r, "升学班级总数", 0) or 0) for r in month_rows)
        total_students = sum((getattr(r, "在档总人数", 0) or 0) for r in month_rows)
        accounts_receivable = sum((getattr(r, "应收升学收入", 0) or 0) for r in month_rows)

        expected_count = sum((getattr(r, "预计升学总人数", 0) or 0) for r in month_rows)
        actual_count = sum((getattr(r, "实际升学总人数", 0) or 0) for r in month_rows)
        expected_rev = sum((getattr(r, "预计升学收入", 0) or 0) for r in month_rows)
        actual_rev = sum((getattr(r, "实际升学收入", 0) or 0) for r in month_rows)

        # 比率按“实际/预计”口径（百分比 0~100+）
        promo_rate = (actual_count / expected_count * 100) if expected_count > 0 else 0.0
        rev_rate = (actual_rev / expected_rev * 100) if expected_rev > 0 else 0.0

        out_rows.append(
            Row(
                campus=campus,
                totalClasses=int(total_classes),
                totalStudents=int(total_students),
                accountsReceivable=int(accounts_receivable),
                targetPromotionCount=int(expected_count),
                actualPromotionCount=int(actual_count),
                promotionRate=round(promo_rate, 1),
                targetRevenue=int(expected_rev),
                actualRevenue=int(actual_rev),
                revenueRate=round(rev_rate, 1),
            )
        )

        total_classes_sum += int(total_classes)
        total_students_sum += int(total_students)
        total_accounts_receivable_sum += int(accounts_receivable)

        total_expected_count += int(expected_count)
        total_actual_count += int(actual_count)
        total_expected_rev += int(expected_rev)
        total_actual_rev += int(actual_rev)

    total_promo_rate = (total_actual_count / total_expected_count * 100) if total_expected_count > 0 else 0.0
    total_rev_rate = (total_actual_rev / total_expected_rev * 100) if total_expected_rev > 0 else 0.0

    out_rows.append(
        Row(
            campus="合计/平均",
            totalClasses=total_classes_sum,
            totalStudents=total_students_sum,
            accountsReceivable=total_accounts_receivable_sum,
            targetPromotionCount=total_expected_count,
            actualPromotionCount=total_actual_count,
            promotionRate=round(total_promo_rate, 1),
            targetRevenue=total_expected_rev,
            actualRevenue=total_actual_rev,
            revenueRate=round(total_rev_rate, 1),
        )
    )

    return ListOutput(年份=year, 行列表=out_rows)

