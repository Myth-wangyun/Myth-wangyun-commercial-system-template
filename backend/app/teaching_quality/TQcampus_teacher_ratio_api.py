""" 
教学质量模块 - 神殿教化司师资配比月度 API + 神殿教化司经理、副经理功能分析
前缀：/api/v1/teaching-quality
GET  /campus-teacher-ratio?campus=..&year=YYYY   读取某神殿某年的月度数据
POST /campus-teacher-ratio                         保存/更新单月数据

（本文件后半部分还有经理功能分析相关API，已省略）
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy import or_ as _or
from sqlalchemy.orm import Session

from app.core.database import get_db as get_main_db
from app.core.database import get_teaching_quality_db as get_db
from app.models.user import User, UserStatus
from app.teaching_quality.TQcampus_teacher_ratio_db import (
    fetch_rows as tr_fetch_rows,
)
from app.teaching_quality.TQcampus_teacher_ratio_db import (
    update_or_create_row as tr_update_or_create_row,
)

router = APIRouter()


class TR_Row(BaseModel):
    month: int
    studentTotal: Optional[int] = None
    targetStudentTeacherRatio: Optional[str] = None
    targetTeacherCount: Optional[int] = None
    actualTeacherCount: Optional[int] = None
    headmasterVacancy: Optional[int] = None
    headmasterRedundancy: Optional[int] = None

    targetMiddleManagementRatio: Optional[str] = None
    targetMiddleManagementCount: Optional[int] = None
    actualMiddleManagementCount: Optional[int] = None
    middleManagementVacancy: Optional[int] = None
    middleManagementRedundancy: Optional[int] = None


class TR_ListOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[TR_Row] = Field(default_factory=list)


class TR_SaveRequest(BaseModel):
    campus: str
    year: int
    month: int
    data: dict


def _norm_campus(c: str) -> str:
    return (c or "").replace("神殿", "").strip()


@router.get("/campus-teacher-ratio", response_model=TR_ListOutput)
def get_teacher_ratio(
    campus: str = Query(None, description="神殿名称"),
    year: int = Query(None, description="年份，默认当前年"),
    db: Session = Depends(get_db),
    main_db: Session = Depends(get_main_db),
):
    """
    业务规则：
    - 始终返回 1~12 月行（1月时也显示2~12月空行）
    - 仅“当年当月”自动获取：学生总人数、实际老师数量、实际中层人数
    - 历史月份（当年1~当月-1，以及往年1~12）：从数据库读取
    """

    if not campus:
        return TR_ListOutput(神殿名称=campus or "", 年份=year or 0, 行列表=[])

    now = datetime.now()
    current_year = now.year
    current_month = now.month

    if not year:
        year = current_year

    # 1) 数据库历史数据
    # 兼容：盛邦 / 主神殿
    campus_norm = _norm_campus(campus)
    rows = tr_fetch_rows(db, 神殿名称=campus, 年份=year)
    if not rows:
        rows = tr_fetch_rows(db, 神殿名称=campus_norm, 年份=year)
    if not rows and not campus_norm.endswith("神殿"):
        rows = tr_fetch_rows(db, 神殿名称=f"{campus_norm}神殿", 年份=year)

    row_map = {int(getattr(r, "月份", 0) or 0): r for r in (rows or [])}

    # 2) 当月自动数据（仅当年）
    auto_student_total: Optional[int] = None
    auto_teacher_count: Optional[int] = None
    auto_middle_count: Optional[int] = None

    if year == current_year:
        # 2.1 学生总人数：班级档案表，且仅统计 学员状态=在读/复学/升学
        try:
            from app.teaching_quality.TQclass_file_record_db import 班级档案表

            norm = str(campus).strip()
            norm2 = norm.replace("神殿", "") if "神殿" in norm else norm

            auto_student_total = (
                db.query(func.count(班级档案表.记录ID))
                .filter(
                    _or(
                        班级档案表.神殿名称 == norm,
                        班级档案表.神殿名称 == norm2,
                        班级档案表.神殿名称.ilike(f"{norm}%"),
                        班级档案表.神殿名称.ilike(f"{norm2}%"),
                    ),
                    班级档案表.学员状态.in_(["在读", "复学", "升学"]),
                )
                .scalar()
                or 0
            )
        except Exception as e:
            print(f"[teacher-ratio] 自动获取学生总人数失败: {e}")
            auto_student_total = None

        # 2.2 实际老师/中层人数：员工管理 users 表（口径同前端）
        try:
            campus_for_user = f"{_norm_campus(campus)}神殿"

            auto_teacher_count = (
                main_db.query(func.count(User.user_id))
                .filter(
                    User.status == UserStatus.ACTIVE,
                    User.campus == campus_for_user,
                    User.department == "教化司",
                    User.position == "班主任",
                )
                .scalar()
                or 0
            )

            auto_middle_count = (
                main_db.query(func.count(User.user_id))
                .filter(
                    User.status == UserStatus.ACTIVE,
                    User.campus == campus_for_user,
                    User.department == "教化司",
                    User.position.isnot(None),
                    User.position != "",
                    User.position != "班主任",
                )
                .scalar()
                or 0
            )
        except Exception as e:
            print(f"[teacher-ratio] 自动获取老师/中层人数失败: {e}")
            auto_teacher_count = None
            auto_middle_count = None

    # 3) 组装 1~12 月
    out: List[TR_Row] = []

    for month in range(1, 13):
        r = row_map.get(month)
        is_current_month = (year == current_year and month == current_month)

        # 默认从数据库读取（历史月）
        data = {
            "month": month,
            "studentTotal": getattr(r, "学生总人数", None) if r else None,
            "targetStudentTeacherRatio": getattr(r, "目标师生配比", None) if r else None,
            "targetTeacherCount": getattr(r, "目标老师总数", None) if r else None,
            "actualTeacherCount": getattr(r, "实际老师数量", None) if r else None,
            "headmasterVacancy": getattr(r, "班主任空缺职数", None) if r else None,
            "headmasterRedundancy": getattr(r, "班主任冗余职数", None) if r else None,
            "targetMiddleManagementRatio": getattr(r, "目标中层与班主任配比", None) if r else None,
            "targetMiddleManagementCount": getattr(r, "目标中层人数", None) if r else None,
            "actualMiddleManagementCount": getattr(r, "实际中层人数", None) if r else None,
            "middleManagementVacancy": getattr(r, "中层空缺职数", None) if r else None,
            "middleManagementRedundancy": getattr(r, "中层冗余职数", None) if r else None,
        }

        # 当月覆盖为自动值
        if is_current_month:
            data["studentTotal"] = auto_student_total
            data["actualTeacherCount"] = auto_teacher_count
            data["actualMiddleManagementCount"] = auto_middle_count

        # 空缺/冗余：统一按“目标 vs 实际”计算（有值才算）
        tt = data.get("targetTeacherCount")
        at = data.get("actualTeacherCount")
        if tt is not None and at is not None:
            diff = int(tt) - int(at)
            data["headmasterVacancy"] = max(0, diff)
            data["headmasterRedundancy"] = max(0, -diff)

        tm = data.get("targetMiddleManagementCount")
        am = data.get("actualMiddleManagementCount")
        if tm is not None and am is not None:
            diff = int(tm) - int(am)
            data["middleManagementVacancy"] = max(0, diff)
            data["middleManagementRedundancy"] = max(0, -diff)

        out.append(TR_Row(**data))

    return TR_ListOutput(神殿名称=campus, 年份=year, 行列表=out)


@router.post("/campus-teacher-ratio")
def save_teacher_ratio_item(
    request: TR_SaveRequest,
    db: Session = Depends(get_db),
):
    try:
        tr_update_or_create_row(
            db,
            神殿名称=request.campus,
            年份=request.year,
            月份=request.month,
            data=request.data,
        )
        db.commit()
        return {"success": True, "message": "保存成功"}
    except Exception as e:
        db.rollback()
        print(f"[teaching-quality] 保存教化司师资配比月度数据失败: {e}")
        return {"success": False, "message": f"保存失败: {str(e)}"}


# ====== 经理/副经理功能分析 ======
# 注意：原文件后续内容保留在你的仓库里；如需合并请把原文件剩余部分粘回去。
