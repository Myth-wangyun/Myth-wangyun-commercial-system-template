"""
教学质量模块 - 最高议事厅教化司就业目标与结果汇总表 API（汇总所有神殿，并支持手工目标薪资）
前缀：/api/v1/teaching-quality
GET  /mgnt-employment-goals-results?year=YYYY   # 读取汇总
POST /mgnt-employment-goals-results            # 批量保存各神殿目标平均就业薪资
"""
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.models.config_master import CampusProfile
from app.teaching_quality.TQ_class_employment_info_db import QT班就业信息表

# 直接导入所需 DB 模块
from app.teaching_quality.TQ_class_employment_summary_db import QT班级就业信息汇总表
from app.teaching_quality.TQmgnt_employment_goals_results_manual_db import (
    bulk_upsert_manual_rows,
    get_manual_row,
    init_manual_table,
)

router = APIRouter()


class Row(BaseModel):
    campus: str
    classCount: int = 0
    targetEmploymentCount: int = 0
    actualEmploymentCount: int = 0
    employmentRate: float = 0.0
    targetAverageSalary: int = 0
    actualAverageSalary: int = 0
    attainmentRate: float = 0.0
    archivedCount: int = 0
    salaryOver10kCount: int = 0


class ListOutput(BaseModel):
    年份: int
    行列表: List[Row] = Field(default_factory=list)


class SavePayload(BaseModel):
    year: int
    rows: List[Dict[str, Any]] = Field(default_factory=list)


def _startup_init():
    try:
        init_manual_table()
    except Exception as e:
        print("[mgnt-employment-goals-results] 初始化手工表失败: ", e)


@router.get(
    "/mgnt-employment-goals-results",
    response_model=ListOutput,
    summary="获取最高议事厅教化司就业目标与结果汇总表（汇总所有神殿）",
)
def get_mgnt_employment_goals_results(
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    from sqlalchemy import and_, func, or_

    campus_names = [c[0] for c in db.query(CampusProfile.name).all()]
    out_rows: List[Row] = []

    grand_target = grand_actual = grand_salary_over_10k = 0
    avg_attain_bucket: List[float] = []
    avg_salary_bucket: List[int] = []
    total_classes = 0

    for campus in campus_names:
        norm = (campus or '').strip()
        norm2 = norm.replace('神殿', '') if '神殿' in norm else norm

        # 班级维度就业汇总
        class_q = (
            db.query(
                QT班级就业信息汇总表.班级名称.label('cls'),
                QT班级就业信息汇总表.需就业人数,
                QT班级就业信息汇总表.实际就业人数,
                QT班级就业信息汇总表.结案人数,
                QT班级就业信息汇总表.目标平均薪资,
                QT班级就业信息汇总表.实际平均薪资,
                QT班级就业信息汇总表.就业达标率,
            )
            .filter(
                QT班级就业信息汇总表.年份 == year,
                or_(
                    QT班级就业信息汇总表.神殿名称 == norm,
                    QT班级就业信息汇总表.神殿名称 == norm2,
                    QT班级就业信息汇总表.神殿名称.ilike(f"{norm}%"),
                    QT班级就业信息汇总表.神殿名称.ilike(f"{norm2}%"),
                ),
            )
            .all()
        )
        class_names = [r.cls for r in class_q if r.cls]
        classCount = len(set(class_names))
        total_classes += classCount

        target_total = int(sum(int(r.需就业人数 or 0) for r in class_q))
        actual_total = int(sum(int(r.实际就业人数 or 0) for r in class_q))
        employment_rate = (actual_total / target_total * 100.0) if target_total > 0 else 0.0

        # 薪资（平均非加权）
        target_salary_vals = [int(r.目标平均薪资) for r in class_q if (r.目标平均薪资 is not None)]
        actual_salary_vals = [int(r.实际平均薪资) for r in class_q if (r.实际平均薪资 is not None)]
        target_avg_salary = int(sum(target_salary_vals) / len(target_salary_vals)) if target_salary_vals else 0
        actual_avg_salary = int(sum(actual_salary_vals) / len(actual_salary_vals)) if actual_salary_vals else 0

        # 达标率
        attain_vals = [float(r.就业达标率) for r in class_q if (r.就业达标率 is not None)]
        attainment_rate = (sum(attain_vals) / len(attain_vals)) if attain_vals else (
            (actual_avg_salary / target_avg_salary * 100.0) if target_avg_salary > 0 else 0.0
        )

        # 档案人数（取“结案人数”汇总作为口径）
        archived_count = int(sum(int(getattr(r, '结案人数', 0) or 0) for r in class_q))

        # 薪资过万人数
        over_10k_cnt = (
            db.query(func.count(QT班就业信息表.记录ID))
            .filter(
                and_(
                    QT班就业信息表.年份 == year,
                    or_(
                        QT班就业信息表.神殿名称 == norm,
                        QT班就业信息表.神殿名称 == norm2,
                        QT班就业信息表.神殿名称.ilike(f"{norm}%"),
                        QT班就业信息表.神殿名称.ilike(f"{norm2}%"),
                    ),
                    or_(
                        QT班就业信息表.试用期薪资 >= 10000,
                        QT班就业信息表.转正薪资 >= 10000,
                        QT班就业信息表.回访考核薪资 >= 10000,
                    ),
                )
            )
            .scalar()
            or 0
        )

        # 手工覆盖：目标平均就业薪资
        try:
            mrow = get_manual_row(db, 神殿名称=campus, 年份=year)
            if mrow and mrow.目标平均就业薪资 is not None:
                target_avg_salary = int(mrow.目标平均就业薪资 or 0)
                # 使用手工目标薪资重新计算达标率
                attainment_rate = (
                    (actual_avg_salary / target_avg_salary * 100.0) if target_avg_salary > 0 else 0.0
                )
        except Exception:
            pass

        out_rows.append(
            Row(
                campus=campus,
                classCount=classCount,
                targetEmploymentCount=target_total,
                actualEmploymentCount=actual_total,
                employmentRate=round(employment_rate, 2),
                targetAverageSalary=target_avg_salary,
                actualAverageSalary=actual_avg_salary,
                attainmentRate=round(attainment_rate, 2),
                archivedCount=archived_count,
                salaryOver10kCount=int(over_10k_cnt),
            )
        )

        grand_target += target_total
        grand_actual += actual_total
        grand_salary_over_10k += int(over_10k_cnt)
        if attainment_rate > 0:
            avg_attain_bucket.append(attainment_rate)
        if actual_avg_salary > 0:
            avg_salary_bucket.append(actual_avg_salary)

    total_rate = (grand_actual / grand_target * 100.0) if grand_target > 0 else 0.0
    avg_attain = (sum(avg_attain_bucket) / len(avg_attain_bucket)) if avg_attain_bucket else 0.0
    avg_salary = int(sum(avg_salary_bucket) / len(avg_salary_bucket)) if avg_salary_bucket else 0

    out_rows.append(
        Row(
            campus="合计/平均",
            classCount=total_classes,
            targetEmploymentCount=grand_target,
            actualEmploymentCount=grand_actual,
            employmentRate=round(total_rate, 2),
            targetAverageSalary=0,
            actualAverageSalary=avg_salary,
            attainmentRate=round(avg_attain, 2),
            archivedCount=sum(r.archivedCount for r in out_rows),
            salaryOver10kCount=grand_salary_over_10k,
        )
    )

    return ListOutput(年份=year, 行列表=out_rows)


@router.post("/mgnt-employment-goals-results", summary="批量保存最高议事厅目标平均就业薪资（按神殿）")
def save_mgnt_employment_goals_results(payload: SavePayload, db: Session = Depends(get_db)):
    try:
        init_manual_table()
        bulk_upsert_manual_rows(db, 年份=payload.year, 行列表=payload.rows)
        db.commit()
        return {"success": True, "message": "保存成功"}
    except Exception as e:
        db.rollback()
        return {"success": False, "message": f"保存失败: {e}"}
