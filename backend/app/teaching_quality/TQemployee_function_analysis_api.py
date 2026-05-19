"""
教学质量模块 - 员工功能分析 API（班主任业务功能分析表 + 班主任功能分析表）
路由前缀：/api/v1/teaching-quality
"""
import calendar
import logging
import re
from collections import defaultdict
from datetime import date as pydate
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy import text as sql_text
from sqlalchemy.orm import Session

import app.teaching_quality.TQ_class_employment_info_db as qt_employment_db
import app.teaching_quality.TQactivity_plan_arrangement_db as campus_activity_plan_db
import app.teaching_quality.TQcampus_monthly_personal_dormitory_mgmt_db as monthly_personal_dorm_db
import app.teaching_quality.TQcampus_monthly_personal_promotion_goals_results_db as monthly_personal_promotion_db
import app.teaching_quality.TQcampus_monthly_personal_stu_movement_db as monthly_personal_movement_db
import app.teaching_quality.TQclass_activity_plan_db as class_activity_plan_db
import app.teaching_quality.TQclass_attendance_db as class_attendance_db
import app.teaching_quality.TQclass_file_record_db as class_file_db
import app.teaching_quality.TQclass_list_db as class_list_db
import app.teaching_quality.TQparent_interview_record_db as parent_interview_db
import app.teaching_quality.TQquality_training_db as quality_training_db
import app.teaching_quality.TQreputation_registration_detail_db as reputation_registration_db
import app.teaching_quality.TQstudent_interview_record_db as student_interview_db
from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQemployee_function_analysis_db import (
    fetch_business_rows,
    fetch_function_flat,
    init_employee_function_tables,
    replace_business_rows,
    replace_function_flat,
)

logger = logging.getLogger(__name__)

_qt_employment_inited = False
_monthly_personal_movement_inited = False
_monthly_personal_promotion_inited = False

def _ensure_qt_employment_tables():
    global _qt_employment_inited
    if _qt_employment_inited:
        return
    try:
        qt_employment_db.init_qt_class_employment_tables()
    except Exception as e:
        print(f"[employee-function-business] 初始化QT班就业信息表失败: {e}")
    _qt_employment_inited = True


def _ensure_monthly_personal_movement_tables():
    global _monthly_personal_movement_inited
    if _monthly_personal_movement_inited:
        return
    try:
        monthly_personal_movement_db.init_monthly_personal_stu_movement_tables()
    except Exception as e:
        print(f"[employee-function-business] 初始化每月个人学员异动统计表失败: {e}")
    _monthly_personal_movement_inited = True


def _ensure_monthly_personal_promotion_tables():
    global _monthly_personal_promotion_inited
    if _monthly_personal_promotion_inited:
        return
    try:
        monthly_personal_promotion_db.init_monthly_personal_promotion_tables()
    except Exception as e:
        print(f"[employee-function-business] 初始化每月个人升学目标与结果表失败: {e}")
    _monthly_personal_promotion_inited = True

router = APIRouter()

def _normalize_campus_name(campus: str) -> str:
    return str(campus or "").replace("神殿", "").strip()

def _campus_variants(campus: str) -> List[str]:
    norm = _normalize_campus_name(campus)
    variants = {str(campus or "").strip(), norm}
    if norm:
        variants.add(f"{norm}神殿")
    return [v for v in variants if v]

def _campus_filter(column, campus: str):
    variants = _campus_variants(campus)
    if not variants:
        return None
    clauses = []
    for name in variants:
        clauses.append(column == name)
        clauses.append(column.ilike(f"{name}%"))
    return or_(*clauses)

def _campus_matches(value: Any, campus: str) -> bool:
    target = _normalize_campus_name(campus)
    if not target:
        return True
    current = _normalize_campus_name(value or "")
    if not current:
        return False
    if current == target:
        return True
    return target in current or current in target

def _row_get(row: Any, key: str):
    if isinstance(row, dict):
        return row.get(key)
    if hasattr(row, "get"):
        try:
            return row.get(key)
        except Exception:
            pass
    return getattr(row, key, None)

def _coerce_date(value) -> Optional[pydate]:
    if isinstance(value, pydate):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str) and value:
        try:
            return datetime.fromisoformat(value).date()
        except Exception:
            return None
    return None

def _fetch_class_list_rows(db: Session, campus: str) -> List[Dict[str, Any]]:
    try:
        class_list_db.init_class_list_tables()
    except Exception:
        pass

    rows = class_list_db.fetch_class_list(db, campus=campus)
    if rows:
        return [
            {
                "班级名称": getattr(r, "班级名称", None),
                "神殿": getattr(r, "神殿", None),
                "班主任": getattr(r, "班主任", None),
                "开班时间": getattr(r, "开班时间", None),
                "学生人数": getattr(r, "学生人数", None),
            }
            for r in rows
        ]

    # ORM 为空时，回退 RAW SQL（兼容 academic schema）
    norm = str(campus or "").strip()
    norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
    base_sql = 'select "班级名称", "神殿", "班主任", "开班时间", "学生人数" from teaching_quality."班级列表"'
    params: Dict[str, Any] = {}
    where = ""
    if norm:
        where = ' where "神殿" = :norm or "神殿" = :norm2 or "神殿" ilike :p1 or "神殿" ilike :p2'
        params = {"norm": norm, "norm2": norm2, "p1": f"{norm}%", "p2": f"{norm2}%"}
        sql = base_sql + where
    else:
        sql = base_sql
    res = db.execute(sql_text(sql), params).mappings().all()
    if not res:
        base_sql2 = 'select "班级名称", "神殿", "班主任", "开班时间", "学生人数" from academic."班级列表"'
        sql2 = base_sql2 + (where if norm else "")
        try:
            res = db.execute(sql_text(sql2), params).mappings().all()
        except Exception:
            res = []
    return [dict(r) for r in res]

def _build_class_teacher_map(class_rows: List[Dict[str, Any]]) -> Dict[str, str]:
    mapping: Dict[str, str] = {}
    for row in class_rows:
        class_name = str(_row_get(row, "班级名称") or "").strip()
        teacher = str(_row_get(row, "班主任") or "").strip()
        if class_name and teacher:
            mapping[class_name] = teacher
    return mapping

def _fetch_class_file_counts(db: Session, campus: str, class_names: List[str]) -> Dict[str, int]:
    if not class_names:
        return {}
    try:
        class_file_db.init_class_file_tables()
    except Exception:
        pass

    table = class_file_db.班级档案表
    campus_cond = _campus_filter(table.神殿名称, campus)
    query = db.query(
        table.班级名称,
        func.count(table.记录ID).label("row_count"),
        func.max(table.序号).label("max_serial"),
    ).filter(table.班级名称.in_(class_names))
    if campus_cond is not None:
        query = query.filter(campus_cond)

    counts: Dict[str, int] = {}
    for name, row_count, max_serial in query.group_by(table.班级名称).all():
        count = int(row_count or 0)
        max_seq = int(max_serial or 0)
        counts[name] = max(count, max_seq)
    return counts

def _build_teacher_student_totals_by_month(
    class_rows: List[Dict[str, Any]],
    class_counts: Dict[str, int],
    year: int,
) -> Dict[Tuple[int, str], int]:
    totals: Dict[Tuple[int, str], int] = defaultdict(int)
    for row in class_rows:
        class_name = str(_row_get(row, "班级名称") or "").strip()
        teacher = str(_row_get(row, "班主任") or "").strip()
        if not class_name or not teacher:
            continue
        count = int(class_counts.get(class_name, 0) or _row_get(row, "学生人数") or 0)
        if count <= 0:
            continue
        open_date = _coerce_date(_row_get(row, "开班时间"))
        if open_date and open_date.year > year:
            continue
        start_month = 1
        if open_date:
            start_month = 1 if open_date.year < year else max(1, int(open_date.month or 1))
        for month in range(start_month, 13):
            totals[(month, teacher)] += count
    return totals

def _build_student_teacher_map(
    db: Session,
    campus: str,
    student_names: List[str],
    class_teacher_map: Dict[str, str],
) -> Dict[str, str]:
    if not student_names:
        return {}
    try:
        class_file_db.init_class_file_tables()
    except Exception:
        pass

    table = class_file_db.班级档案表
    query = db.query(table).filter(table.姓名.in_(student_names))
    campus_cond = _campus_filter(table.神殿名称, campus)
    if campus_cond is not None:
        query = query.filter(campus_cond)
    rows = query.all()

    candidates: Dict[str, List[Tuple[str, Optional[pydate]]]] = defaultdict(list)
    for row in rows:
        name = str(getattr(row, "姓名", None) or "").strip()
        if not name:
            continue
        class_name = str(getattr(row, "班级名称", None) or "").strip()
        teacher = str(getattr(row, "班主任姓名", None) or "").strip()
        if not teacher and class_name:
            teacher = class_teacher_map.get(class_name, "")
        enroll_date = _coerce_date(getattr(row, "入学时间", None)) or _coerce_date(getattr(row, "开班时间", None))
        candidates[name].append((teacher, enroll_date))

    result: Dict[str, str] = {}
    for name, items in candidates.items():
        if not items:
            continue
        items.sort(key=lambda x: (1 if x[0] else 0, x[1] or pydate.min), reverse=True)
        teacher = items[0][0]
        if teacher:
            result[name] = teacher
    return result

def _fetch_monthly_personal_dorm_rows(db: Session, campus: str, year: int):
    try:
        monthly_personal_dorm_db.init_campus_monthly_personal_dorm_tables()
    except Exception:
        pass

    for variant in _campus_variants(campus):
        rows = monthly_personal_dorm_db.fetch_rows(db, 神殿名称=variant, 年份=year)
        if rows:
            return rows
    return []

def _compute_dormitory_metrics(
    db: Session, campus: str, year: int
) -> Optional[Dict[Tuple[int, str], Dict[str, int]]]:
    try:
        dorm_rows = _fetch_monthly_personal_dorm_rows(db, campus, year)
        if not dorm_rows:
            return {}

        metrics: Dict[Tuple[int, str], Dict[str, int]] = defaultdict(
            lambda: {"dormitoryLoad": 0, "dormitoryStudentCount": 0}
        )

        for row in dorm_rows:
            month = int(getattr(row, "月份") or 0)
            name = str(getattr(row, "姓名") or "").strip()
            if not month or not name:
                continue
            metrics[(month, name)]["dormitoryLoad"] += int(getattr(row, "宿舍管理总数量") or 0)
            metrics[(month, name)]["dormitoryStudentCount"] += int(getattr(row, "住宿总人数") or 0)

        return metrics
    except Exception as e:
        print(f"[employee-function-business] 计算宿舍管理数据失败: {e}")
        return None

_absent_markers = ['请假', '旷课', '缺勤', '病假', '事假', '早退', '迟到']

def _is_present_value(value: Any) -> bool:
    text = str(value or '').strip()
    if not text:
        return False
    if text == '√':
        return True
    if any(marker in text for marker in _absent_markers):
        return False
    return True

def _has_attendance_value(value: Any) -> bool:
    return bool(str(value or '').strip())

def _days_in_month(year: int, month: int) -> int:
    return calendar.monthrange(year, month)[1]

_lesson_count_map = {
    "一": 1,
    "二": 2,
    "两": 2,
    "三": 3,
    "四": 4,
    "五": 5,
    "六": 6,
    "七": 7,
    "八": 8,
    "九": 9,
    "十": 10,
}
_lesson_count_pattern = re.compile(r"(一|二|两|三|四|五|六|七|八|九|十)节")

def _parse_lesson_count(value: Any) -> int:
    text = str(value or "").strip()
    if not text:
        return 0
    digit = re.search(r"\d+", text)
    if digit:
        return int(digit.group(0))
    match = _lesson_count_pattern.search(text)
    if match:
        return _lesson_count_map.get(match.group(1), 0)
    return 0

def _activity_row_has_content(row: Any) -> bool:
    fields = ("时间", "地点", "活动形式", "主要内容", "负责人", "预期结果", "过程关键点", "实标结果")
    for field in fields:
        if str(_row_get(row, field) or "").strip():
            return True
    return False

_month_pattern = re.compile(r"(1[0-2]|0?[1-9])")

def _parse_month_value(value: Any) -> int:
    if value is None:
        return 0
    if isinstance(value, int):
        return value
    text = str(value).strip()
    if not text:
        return 0
    # 兼容 “12月” / “2025-12-23” / “12”
    if "月" in text:
        text = text.split("月")[0]
    if "-" in text:
        parts = text.split("-")
        if len(parts) >= 2 and parts[1].isdigit():
            return int(parts[1])
    match = _month_pattern.search(text)
    return int(match.group(1)) if match else 0

def _split_responsible_names(text: str) -> List[str]:
    cleaned = str(text or "").strip()
    if not cleaned or cleaned in ("无", "暂无", "-"):
        return []
    parts = re.split(r"[、,，/;；\\s]+", cleaned)
    return [p.strip() for p in parts if p and p.strip() and p.strip() not in ("无", "暂无", "-")]

def _fetch_class_attendance_rows(db: Session, campus: str, year: int, class_names: List[str]):
    if not class_names:
        return []
    try:
        class_attendance_db.init_class_attendance_tables()
    except Exception:
        pass

    table = class_attendance_db.班级出勤表
    query = db.query(table).filter(table.年份 == year, table.班级名称.in_(class_names))
    campus_cond = _campus_filter(table.神殿名称, campus)
    if campus_cond is not None:
        query = query.filter(campus_cond)
    return query.all()

def _fetch_campus_activity_plan_rows(db: Session, campus: str, year: int):
    try:
        campus_activity_plan_db.init_activity_plan_tables()
    except Exception:
        pass

    table = campus_activity_plan_db.神殿活动计划安排表
    query = db.query(table).filter(table.年份 == year)
    campus_cond = _campus_filter(table.神殿名称, campus)
    if campus_cond is not None:
        query = query.filter(campus_cond)
    rows = query.all()
    if rows:
        return rows

    variants = _campus_variants(campus)
    base_sql = (
        'select "神殿名称","年份","月份","时间","地点","活动形式","主要内容","负责人","预期结果","过程关键点","实标结果" '
        'from teaching_quality."神殿活动计划安排表" where "年份" = :year'
    )
    params: Dict[str, Any] = {"year": year}
    if variants:
        clauses: List[str] = []
        for i, name in enumerate(variants):
            clauses.append(f'("神殿名称" = :c{i} or "神殿名称" ilike :p{i})')
            params[f"c{i}"] = name
            params[f"p{i}"] = f"{name}%"
        base_sql += " and (" + " or ".join(clauses) + ")"
    res = db.execute(sql_text(base_sql), params).mappings().all()
    rows = [dict(r) for r in res]
    if rows:
        return rows

    # 兜底：按年份查询后再做神殿名称宽松匹配
    fallback_sql = (
        'select "神殿名称","年份","月份","时间","地点","活动形式","主要内容","负责人","预期结果","过程关键点","实标结果" '
        'from teaching_quality."神殿活动计划安排表" where "年份" = :year'
    )
    res = db.execute(sql_text(fallback_sql), {"year": year}).mappings().all()
    return [dict(r) for r in res if _campus_matches(r.get("神殿名称"), campus)]

def _fetch_class_activity_plan_rows(db: Session, campus: str, year: int, class_names: Optional[List[str]] = None):
    try:
        class_activity_plan_db.init_class_activity_plan_tables()
    except Exception:
        pass

    table = class_activity_plan_db.班级活动计划安排表
    base_query = db.query(table).filter(table.年份 == year)
    campus_cond = _campus_filter(table.神殿名称, campus)
    if campus_cond is not None:
        base_query = base_query.filter(campus_cond)
    query = base_query
    if class_names:
        query = query.filter(table.班级名称.in_(class_names))
    rows = query.all()
    if rows:
        return rows

    # 兜底：放宽班级过滤
    rows = base_query.all()
    if rows:
        return rows

    variants = _campus_variants(campus)
    base_sql = (
        'select "神殿名称","班级名称","年份","月份","时间","地点","活动形式","主要内容","负责人","预期结果","过程关键点","实标结果" '
        'from teaching_quality."班级活动计划安排表" where "年份" = :year'
    )
    params: Dict[str, Any] = {"year": year}
    if class_names:
        placeholders: List[str] = []
        for i, name in enumerate(class_names):
            key = f"cls{i}"
            placeholders.append(f":{key}")
            params[key] = name
        base_sql += f' and "班级名称" in ({",".join(placeholders)})'
    if variants:
        clauses: List[str] = []
        for i, name in enumerate(variants):
            clauses.append(f'("神殿名称" = :c{i} or "神殿名称" ilike :p{i})')
            params[f"c{i}"] = name
            params[f"p{i}"] = f"{name}%"
        base_sql += " and (" + " or ".join(clauses) + ")"
    res = db.execute(sql_text(base_sql), params).mappings().all()
    rows = [dict(r) for r in res]
    if rows:
        return rows

    # 兜底：按年份查询后再做神殿名称宽松匹配
    fallback_sql = (
        'select "神殿名称","班级名称","年份","月份","时间","地点","活动形式","主要内容","负责人","预期结果","过程关键点","实标结果" '
        'from teaching_quality."班级活动计划安排表" where "年份" = :year'
    )
    res = db.execute(sql_text(fallback_sql), {"year": year}).mappings().all()
    rows = [dict(r) for r in res if _campus_matches(r.get("神殿名称"), campus)]
    if class_names:
        return [r for r in rows if str(r.get("班级名称") or "") in class_names]
    return rows

def _fetch_quality_training_rows(db: Session, campus: str, year: int, class_names: List[str]):
    if not class_names:
        return []
    try:
        quality_training_db.init_quality_training_tables()
    except Exception:
        pass

    table = quality_training_db.素质训练登记表
    query = db.query(table).filter(table.年份 == year, table.班级名称.in_(class_names))
    campus_cond = _campus_filter(table.神殿名称, campus)
    if campus_cond is not None:
        query = query.filter(campus_cond)
    return query.all()

def _fetch_student_interview_rows(db: Session, campus: str, year: int):
    try:
        student_interview_db.init_student_interview_tables()
    except Exception:
        pass

    table = student_interview_db.学员访谈记录表
    query = db.query(table).filter(table.年份 == year)
    campus_cond = _campus_filter(table.神殿名称, campus)
    if campus_cond is not None:
        query = query.filter(campus_cond)
    if hasattr(table, "访谈类型"):
        query = query.filter(or_(table.访谈类型 == "学员访谈", table.访谈类型 == None))  # noqa: E711
    return query.all()

def _fetch_parent_interview_rows(db: Session, campus: str, year: int):
    try:
        parent_interview_db.init_parent_interview_tables()
    except Exception:
        pass

    table = parent_interview_db.家长访谈记录表
    query = db.query(table).filter(table.年份 == year)
    campus_cond = _campus_filter(table.神殿名称, campus)
    if campus_cond is not None:
        query = query.filter(campus_cond)
    return query.all()

def _to_float(value: Any) -> float:
    try:
        if value in (None, ""):
            return 0.0
        return float(value)
    except Exception:
        try:
            return float(str(value).replace(",", ""))
        except Exception:
            return 0.0

def _is_yes_value(value: Any) -> bool:
    if value is None:
        return False
    text = str(value).strip()
    if not text:
        return False
    lower = text.lower()
    if lower in {"是", "y", "yes", "true", "1", "已报名", "报名", "已"}:
        return True
    if text.startswith("是") or "已报名" in text:
        return True
    return False

def _reputation_row_has_content(row: Any) -> bool:
    fields = (
        "班主任姓名",
        "口碑量姓名",
        "口碑量电话",
        "是否上门",
        "是否报名",
        "报名时间",
        "报名专业",
        "报名学制",
        "应收学费",
        "实交学费",
        "咨询师",
        "介绍人姓名",
        "口碑介绍关系",
        "口碑来源",
    )
    for field in fields:
        if str(_row_get(row, field) or "").strip():
            return True
    return False

def _fetch_reputation_registration_rows(db: Session, campus: str, year: int):
    try:
        reputation_registration_db.init_reputation_registration_tables()
    except Exception:
        pass

    table = reputation_registration_db.口碑报名登记明细表
    query = db.query(table).filter(table.年份 == year)
    campus_cond = _campus_filter(table.神殿名称, campus)
    if campus_cond is not None:
        query = query.filter(campus_cond)
    return query.all()

def _fetch_monthly_personal_movement_rows(db: Session, campus: str, year: int):
    _ensure_monthly_personal_movement_tables()
    try:
        table = monthly_personal_movement_db.每月个人学员异动统计表
    except Exception as e:
        print(f"[employee-function-business] 加载每月个人学员异动统计表失败: {e}")
        return []
    try:
        query = db.query(table).filter(table.年份 == year)
        campus_cond = _campus_filter(table.神殿名称, campus)
        if campus_cond is not None:
            query = query.filter(campus_cond)
        return query.all()
    except Exception as e:
        print(f"[employee-function-business] 查询每月个人学员异动统计表失败: {e}")
        return []

def _fetch_monthly_personal_promotion_rows(db: Session, campus: str, year: int):
    _ensure_monthly_personal_promotion_tables()
    try:
        table = monthly_personal_promotion_db.每月个人升学目标与结果表
    except Exception as e:
        print(f"[employee-function-business] 加载每月个人升学目标与结果表失败: {e}")
        return []
    try:
        query = db.query(table).filter(table.年份 == year)
        campus_cond = _campus_filter(table.神殿名称, campus)
        if campus_cond is not None:
            query = query.filter(campus_cond)
        return query.all()
    except Exception as e:
        print(f"[employee-function-business] 查询每月个人升学目标与结果表失败: {e}")
        return []

def _fetch_qt_employment_rows(db: Session, campus: str, year: int):
    _ensure_qt_employment_tables()
    try:
        table = qt_employment_db.QT班就业信息表
    except Exception as e:
        print(f"[employee-function-business] 加载QT班就业信息表失败: {e}")
        return []
    try:
        query = db.query(table).filter(table.年份 == year)
        campus_cond = _campus_filter(table.神殿名称, campus)
        if campus_cond is not None:
            query = query.filter(campus_cond)
        return query.all()
    except Exception as e:
        print(f"[employee-function-business] 查询QT班就业信息表失败: {e}")
        return []

def _build_interview_rate_metrics(
    counts: Dict[Tuple[int, str], set],
    totals: Dict[Tuple[int, str], int],
) -> Dict[Tuple[int, str], float]:
    metrics: Dict[Tuple[int, str], float] = {}
    for key, total in totals.items():
        if total <= 0:
            continue
        count = len(counts.get(key, set()))
        metrics[key] = round((count / total) * 100, 2)
    return metrics

def _compute_daily_interview_metrics(
    db: Session, campus: str, year: int
) -> Optional[Dict[Tuple[int, str], float]]:
    try:
        class_rows = _fetch_class_list_rows(db, campus)
        if not class_rows:
            return None
        class_teacher_map = _build_class_teacher_map(class_rows)
        class_names = sorted({
            str(_row_get(r, "班级名称") or "").strip()
            for r in class_rows
            if _row_get(r, "班级名称")
        })
        class_counts = _fetch_class_file_counts(db, campus, class_names)
        totals = _build_teacher_student_totals_by_month(class_rows, class_counts, year)

        interview_rows = _fetch_student_interview_rows(db, campus, year)
        counts: Dict[Tuple[int, str], set] = defaultdict(set)
        missing_names: set[str] = set()

        for row in interview_rows:
            month = _parse_month_value(getattr(row, "月份", None))
            if not month:
                month = _parse_month_value(getattr(row, "访谈时间", None))
            if not month:
                continue
            student_name = str(getattr(row, "姓名", None) or "").strip()
            if not student_name:
                continue
            interview_log = str(getattr(row, "访谈记录", None) or "").strip()
            if not interview_log:
                continue
            class_name = str(getattr(row, "班级", None) or "").strip()
            teacher = class_teacher_map.get(class_name, "")
            if teacher:
                counts[(int(month), teacher)].add(student_name)
            else:
                missing_names.add(student_name)

        if missing_names:
            name_map = _build_student_teacher_map(db, campus, list(missing_names), class_teacher_map)
            if name_map:
                for row in interview_rows:
                    month = _parse_month_value(getattr(row, "月份", None))
                    if not month:
                        month = _parse_month_value(getattr(row, "访谈时间", None))
                    if not month:
                        continue
                    student_name = str(getattr(row, "姓名", None) or "").strip()
                    if not student_name or student_name not in name_map:
                        continue
                    interview_log = str(getattr(row, "访谈记录", None) or "").strip()
                    if not interview_log:
                        continue
                    class_name = str(getattr(row, "班级", None) or "").strip()
                    if class_teacher_map.get(class_name, ""):
                        continue
                    teacher = name_map.get(student_name, "")
                    if teacher:
                        counts[(int(month), teacher)].add(student_name)

        return _build_interview_rate_metrics(counts, totals)
    except Exception as e:
        print(f"[employee-function-business] 计算日常访谈率失败: {e}")
        return None

def _compute_parent_interview_metrics(
    db: Session, campus: str, year: int
) -> Optional[Dict[Tuple[int, str], float]]:
    try:
        class_rows = _fetch_class_list_rows(db, campus)
        if not class_rows:
            return None
        class_teacher_map = _build_class_teacher_map(class_rows)
        class_names = sorted({
            str(_row_get(r, "班级名称") or "").strip()
            for r in class_rows
            if _row_get(r, "班级名称")
        })
        class_counts = _fetch_class_file_counts(db, campus, class_names)
        totals = _build_teacher_student_totals_by_month(class_rows, class_counts, year)

        interview_rows = _fetch_parent_interview_rows(db, campus, year)
        if not interview_rows:
            return _build_interview_rate_metrics(defaultdict(set), totals)

        names = {
            str(getattr(row, "姓名", None) or "").strip()
            for row in interview_rows
            if str(getattr(row, "姓名", None) or "").strip()
        }
        name_map = _build_student_teacher_map(db, campus, list(names), class_teacher_map)

        counts: Dict[Tuple[int, str], set] = defaultdict(set)
        for row in interview_rows:
            month = _parse_month_value(getattr(row, "月份", None))
            if not month:
                month = _parse_month_value(getattr(row, "访谈时间", None))
            if not month:
                continue
            student_name = str(getattr(row, "姓名", None) or "").strip()
            if not student_name:
                continue
            interview_log = str(getattr(row, "访谈记录", None) or "").strip()
            visit_date = getattr(row, "访谈时间", None)
            if not interview_log and not visit_date:
                continue
            teacher = name_map.get(student_name, "")
            if teacher:
                counts[(int(month), teacher)].add(student_name)

        return _build_interview_rate_metrics(counts, totals)
    except Exception as e:
        print(f"[employee-function-business] 计算家长访谈率失败: {e}")
        return None

def _compute_reputation_metrics(
    db: Session, campus: str, year: int
) -> Optional[Dict[Tuple[int, str], Dict[str, float]]]:
    try:
        class_rows = _fetch_class_list_rows(db, campus)
        valid_teachers = {
            str(_row_get(r, "班主任") or "").strip()
            for r in class_rows
            if str(_row_get(r, "班主任") or "").strip()
        }

        detail_rows = _fetch_reputation_registration_rows(db, campus, year)
        metrics: Dict[Tuple[int, str], Dict[str, float]] = defaultdict(
            lambda: {"count": 0.0, "revenue": 0.0}
        )

        for row in detail_rows:
            if not _reputation_row_has_content(row):
                continue
            month = _parse_month_value(_row_get(row, "月份") or _row_get(row, "报名时间") or 0)
            if not month:
                continue
            teacher = str(_row_get(row, "班主任姓名") or "").strip()
            if not teacher:
                continue
            if valid_teachers and teacher not in valid_teachers:
                continue
            key = (int(month), teacher)
            if _is_yes_value(_row_get(row, "是否报名")):
                metrics[key]["count"] += 1
            metrics[key]["revenue"] += _to_float(_row_get(row, "实交学费"))

        return metrics
    except Exception as e:
        print(f"[employee-function-business] 计算口碑报名人数/收入失败: {e}")
        return None

def _compute_movement_metrics(
    db: Session, campus: str, year: int, movement_rows: Optional[List[Any]] = None
) -> Optional[Dict[Tuple[int, str], Dict[str, float]]]:
    try:
        if movement_rows is None:
            movement_rows = _fetch_monthly_personal_movement_rows(db, campus, year)
        if not movement_rows:
            return {}

        summary_names = {"合计/平均", "合计", "平均"}
        metrics: Dict[Tuple[int, str], Dict[str, float]] = {}

        for row in movement_rows:
            month = _parse_month_value(_row_get(row, "月份") or _row_get(row, "month") or 0)
            if not month:
                continue
            name = str(
                _row_get(row, "姓名")
                or _row_get(row, "name")
                or _row_get(row, "班主任姓名")
                or ""
            ).strip()
            if not name or name in summary_names:
                continue
            total_students = _to_float(
                _row_get(row, "累计带生人数") or _row_get(row, "totalStudents") or 0
            )
            movement_total = _to_float(
                _row_get(row, "异动总人数") or _row_get(row, "totalMovementCount") or 0
            )
            rate = round((movement_total / total_students) * 100, 2) if total_students > 0 else 0.0
            metrics[(int(month), name)] = {
                "count": float(int(round(movement_total))),
                "rate": rate,
            }

        return metrics
    except Exception as e:
        print(f"[employee-function-business] 计算异动人数/异动率失败: {e}")
        return None

def _compute_refund_metrics(
    db: Session, campus: str, year: int, movement_rows: Optional[List[Any]] = None
) -> Optional[Dict[Tuple[int, str], Dict[str, float]]]:
    try:
        if movement_rows is None:
            movement_rows = _fetch_monthly_personal_movement_rows(db, campus, year)
        if not movement_rows:
            return {}

        summary_names = {"合计/平均", "合计", "平均"}
        metrics: Dict[Tuple[int, str], Dict[str, float]] = {}

        for row in movement_rows:
            month = _parse_month_value(_row_get(row, "月份") or _row_get(row, "month") or 0)
            if not month:
                continue
            name = str(
                _row_get(row, "姓名")
                or _row_get(row, "name")
                or _row_get(row, "班主任姓名")
                or ""
            ).strip()
            if not name or name in summary_names:
                continue

            total_students = _row_get(row, "累计带生人数")
            if total_students in (None, ""):
                total_students = _row_get(row, "totalStudents")
            total_students_value = _to_float(total_students)

            refund_total = _row_get(row, "退费总人数")
            if refund_total in (None, ""):
                refund_total = _row_get(row, "totalRefundCount")
            if refund_total in (None, ""):
                new_refund = _row_get(row, "新生退费人数")
                if new_refund in (None, ""):
                    new_refund = _row_get(row, "newRefundCount")
                old_refund = _row_get(row, "老生退费人数")
                if old_refund in (None, ""):
                    old_refund = _row_get(row, "oldRefundCount")
                refund_total_value = _to_float(new_refund) + _to_float(old_refund)
            else:
                refund_total_value = _to_float(refund_total)

            rate = (
                round((refund_total_value / total_students_value) * 100, 2)
                if total_students_value > 0
                else 0.0
            )
            metrics[(int(month), name)] = {
                "count": float(int(round(refund_total_value))),
                "rate": rate,
            }

        return metrics
    except Exception as e:
        print(f"[employee-function-business] 计算退费人数/退费率失败: {e}")
        return None

def _compute_promotion_rate_metrics(
    db: Session, campus: str, year: int, promotion_rows: Optional[List[Any]] = None
) -> Optional[Dict[Tuple[int, str], float]]:
    try:
        if promotion_rows is None:
            promotion_rows = _fetch_monthly_personal_promotion_rows(db, campus, year)
        if not promotion_rows:
            return {}

        summary_names = {"合计/平均", "合计", "平均"}
        totals: Dict[Tuple[int, str], Dict[str, float]] = defaultdict(lambda: {"actual": 0.0, "total": 0.0})

        for row in promotion_rows:
            month = _parse_month_value(_row_get(row, "月份") or _row_get(row, "month") or 0)
            if not month:
                continue
            name = str(_row_get(row, "姓名") or _row_get(row, "name") or "").strip()
            if not name or name in summary_names:
                continue
            actual = _to_float(
                _row_get(row, "实际升学总人数") or _row_get(row, "actualPromotionCount") or 0
            )
            total = _to_float(
                _row_get(row, "在档总人数") or _row_get(row, "fileCount") or 0
            )
            key = (int(month), name)
            totals[key]["actual"] += actual
            totals[key]["total"] += total

        metrics: Dict[Tuple[int, str], float] = {}
        for key, values in totals.items():
            denominator = values["total"]
            rate = round((values["actual"] / denominator) * 100, 2) if denominator > 0 else 0.0
            metrics[key] = rate

        return metrics
    except Exception as e:
        print(f"[employee-function-business] 计算升学率失败: {e}")
        return None

def _compute_employment_metrics(
    db: Session, campus: str, year: int, employment_rows: Optional[List[Any]] = None
) -> Optional[Dict[Tuple[int, str], Dict[str, float]]]:
    """
    从 QT班就业信息表 计算班主任的就业率、就业平均薪资、就业人数
    数据源：teaching_quality.QT班就业信息表（与神殿后端班主任就业汇总表使用相同数据源）
    Returns: {(month, teacher_name): {"rate": 就业率, "avg_salary": 就业平均薪资, "count": 就业人数}}
    
    注意：根据 创建时间 字段的月份来确定数据属于哪个月份，只在对应月份显示数据。
    """
    try:
        from datetime import datetime

        from sqlalchemy import or_
        

        
        # 确保表存在
        _ensure_qt_employment_tables()
        
        QT班就业信息表 = qt_employment_db.QT班就业信息表
        
        # 查询该神殿和年份的所有就业信息
        norm = str(campus).strip()
        norm2 = norm.replace("神殿", "") if "神殿" in norm else norm
        
        employment_records = (
            db.query(QT班就业信息表)
            .filter(
                QT班就业信息表.年份 == year,
                or_(
                    QT班就业信息表.神殿名称 == norm,
                    QT班就业信息表.神殿名称 == norm2,
                    QT班就业信息表.神殿名称.ilike(f"{norm}%"),
                    QT班就业信息表.神殿名称.ilike(f"{norm2}%"),
                ),
            )
            .all()
        )
        
        if not employment_records:
            logger.warning(f"[employment-metrics] 未找到就业数据: campus={campus}, year={year}")
            return {}
        
        logger.info(f"[employment-metrics] 找到 {len(employment_records)} 条就业记录")
        
        # 先获取班级列表，构建 班级名称 -> 班主任 的映射
        class_rows = _fetch_class_list_rows(db, campus)
        class_teacher_map = _build_class_teacher_map(class_rows)
        logger.info(f"[employment-metrics] 班级-班主任映射: {class_teacher_map}")
        
        # 按 (月份, 班级名称) 分组统计就业数据
        # Key: (month, class_name), Value: {总人数, 薪资总和, 有薪资人数}
        month_class_stats: Dict[Tuple[int, str], Dict[str, float]] = defaultdict(
            lambda: {"总人数": 0, "薪资总和": 0.0, "有薪资人数": 0}
        )
        
        for record in employment_records:
            class_name = str(getattr(record, "班级名称", "") or "").strip()
            if not class_name:
                continue
            
            # 从创建时间获取月份
            created_time = getattr(record, "创建时间", None)
            if created_time:
                if isinstance(created_time, datetime):
                    month = created_time.month
                elif isinstance(created_time, str):
                    try:
                        month = datetime.fromisoformat(created_time.replace('Z', '+00:00')).month
                    except ValueError:
                        month = 12  # 默认12月
                else:
                    month = 12
            else:
                month = 12  # 如果没有创建时间，默认12月
            
            key = (month, class_name)
            stats = month_class_stats[key]
            stats["总人数"] += 1
            
            # 统计薪资（优先使用回访考核薪资，其次转正薪资，最后试用期薪资）
            salary = (
                getattr(record, "回访考核薪资", None) or 
                getattr(record, "转正薪资", None) or 
                getattr(record, "试用期薪资", None) or 0
            )
            if salary and salary > 0:
                stats["薪资总和"] += float(salary)
                stats["有薪资人数"] += 1
            
            logger.debug(f"[employment-metrics] 记录: 班级={class_name}, 月份={month}, 薪资={salary}")
        
        logger.info(f"[employment-metrics] 按月份班级统计: {dict(month_class_stats)}")
        
        # 按 (月份, 班主任) 汇总就业数据
        # Key: (month, teacher), Value: {total_employment_count, salary_sum, salary_weight}
        month_teacher_data: Dict[Tuple[int, str], Dict[str, float]] = defaultdict(
            lambda: {"total_employment_count": 0.0, "salary_sum": 0.0, "salary_weight": 0.0}
        )
        
        for (month, class_name), stats in month_class_stats.items():
            # 从班级列表获取班主任
            teacher = class_teacher_map.get(class_name, "")
            if not teacher:
                logger.debug(f"[employment-metrics] 班级 {class_name} 没有找到班主任")
                continue
            
            key = (month, teacher)
            employment_count = stats["总人数"]
            avg_salary = stats["薪资总和"] / stats["有薪资人数"] if stats["有薪资人数"] > 0 else 0
            
            month_teacher_data[key]["total_employment_count"] += employment_count
            if avg_salary > 0 and employment_count > 0:
                month_teacher_data[key]["salary_sum"] += avg_salary * employment_count
                month_teacher_data[key]["salary_weight"] += employment_count
            
            logger.debug(f"[employment-metrics] 月份={month}, 班级={class_name}, 班主任={teacher}, "
                        f"就业人数={employment_count}, 平均薪资={avg_salary:.2f}")
        
        # 计算最终指标（只在对应月份显示数据）
        metrics: Dict[Tuple[int, str], Dict[str, float]] = {}
        for (month, teacher), data in month_teacher_data.items():
            employment_count = data["total_employment_count"]
            
            # 就业率：假设 100%（因为 QT班就业信息表 只存储已就业人员）
            employment_rate = 100.0 if employment_count > 0 else 0.0
            
            # 计算加权平均薪资
            avg_salary = round(data["salary_sum"] / data["salary_weight"], 2) if data["salary_weight"] > 0 else 0.0
            
            logger.info(f"[employment-metrics] 月份={month}, 班主任={teacher}: 就业率={employment_rate}%, 平均薪资={avg_salary}, 就业人数={int(employment_count)}")
            
            # 只在该月份显示数据
            metrics[(month, teacher)] = {
                "rate": employment_rate,
                "avg_salary": avg_salary,
                "count": employment_count,
            }
        
        return metrics
    except Exception as e:
        print(f"[employee-function-business] 计算就业率/薪资/人数失败: {e}")
        import traceback
        traceback.print_exc()
        return None

def _compute_attendance_metrics(
    db: Session, campus: str, year: int
) -> Optional[Dict[Tuple[int, str], float]]:
    try:
        class_rows = _fetch_class_list_rows(db, campus)
        if not class_rows:
            return {}

        class_teacher_map: Dict[str, str] = {}
        for row in class_rows:
            class_name = str(_row_get(row, '班级名称') or '').strip()
            teacher = str(_row_get(row, '班主任') or '').strip()
            if class_name and teacher:
                class_teacher_map[class_name] = teacher

        if not class_teacher_map:
            return {}

        class_names = sorted(class_teacher_map.keys())
        class_counts = _fetch_class_file_counts(db, campus, class_names)
        attendance_rows = _fetch_class_attendance_rows(db, campus, year, class_names)

        present_counts: Dict[Tuple[str, int], int] = defaultdict(int)
        active_columns: Dict[Tuple[str, int], set[Tuple[int, str]]] = defaultdict(set)
        for row in attendance_rows:
            class_name = str(getattr(row, '班级名称', None) or "").strip()
            if not class_name or class_name not in class_teacher_map:
                continue
            dt = getattr(row, '日期', None)
            half = getattr(row, '上下半天', None)
            if dt is None or half not in ('am', 'pm'):
                continue
            value = getattr(row, '值', None)
            if _has_attendance_value(value):
                active_columns[(class_name, dt.month)].add((dt.day, half))
            if _is_present_value(value):
                present_counts[(class_name, dt.month)] += 1

        totals: Dict[Tuple[int, str], Dict[str, float]] = defaultdict(
            lambda: {"present": 0.0, "total": 0.0}
        )
        for class_name, teacher in class_teacher_map.items():
            class_size = int(class_counts.get(class_name, 0) or 0)
            if class_size <= 0:
                continue
            for month in range(1, 13):
                active_total = len(active_columns.get((class_name, month), set()))
                total = class_size * active_total
                present = present_counts.get((class_name, month), 0)
                totals[(month, teacher)]['present'] += present
                totals[(month, teacher)]['total'] += total

        metrics: Dict[Tuple[int, str], float] = {}
        for key, data in totals.items():
            total_slots = data["total"]
            rate = (data["present"] / total_slots * 100) if total_slots > 0 else 0
            metrics[key] = round(rate, 2)

        return metrics
    except Exception as e:
        print(f"[employee-function-business] 计算出勤率失败: {e}")
        return None

def _compute_quality_training_metrics(
    db: Session, campus: str, year: int
) -> Optional[Dict[Tuple[int, str], int]]:
    try:
        class_rows = _fetch_class_list_rows(db, campus)
        if not class_rows:
            return {}

        class_teacher_map: Dict[str, str] = {}
        for row in class_rows:
            class_name = str(_row_get(row, '班级名称') or '').strip()
            teacher = str(_row_get(row, '班主任') or '').strip()
            if class_name and teacher:
                class_teacher_map[class_name] = teacher

        if not class_teacher_map:
            return {}

        class_names = sorted(class_teacher_map.keys())
        training_rows = _fetch_quality_training_rows(db, campus, year, class_names)

        metrics: Dict[Tuple[int, str], int] = defaultdict(int)
        for row in training_rows:
            class_name = str(getattr(row, '班级名称', None) or "").strip()
            month = getattr(row, '月份', None)
            if not class_name or not month:
                continue
            teacher = class_teacher_map.get(class_name, "")
            if not teacher:
                continue
            count = _parse_lesson_count(getattr(row, '几节课', None))
            if count:
                metrics[(int(month), teacher)] += count

        return metrics
    except Exception as e:
        print(f"[employee-function-business] 计算素质课次数失败: {e}")
        return None

def _compute_activity_metrics(
    db: Session, campus: str, year: int, employee_names: Optional[List[str]] = None
) -> Optional[Dict[Tuple[int, str], int]]:
    # 移除 try-except 让错误暴露
    campus_rows = _fetch_campus_activity_plan_rows(db, campus, year)
    class_plan_rows = _fetch_class_activity_plan_rows(db, campus, year)

    metrics: Dict[Tuple[int, str], int] = defaultdict(int)

    name_pool = None
    if employee_names:
        name_pool = {str(name or "").strip() for name in employee_names if str(name or "").strip()}

    buckets: Dict[str, Dict[int, List[Any]]] = defaultdict(lambda: defaultdict(list))

    def _count_rows(rows: List[Any], require_class_name: bool = False):
        for row in rows:
            if not _campus_matches(_row_get(row, '神殿名称'), campus):
                continue
            month = _parse_month_value(_row_get(row, '月份') or 0)
            if not month:
                month = _parse_month_value(_row_get(row, '时间') or '')
            if not month:
                continue
            if require_class_name:
                class_name = str(_row_get(row, '班级名称') or '').strip()
                if not class_name:
                    continue
            responsible = str(_row_get(row, '负责人') or '').strip()
            names = _split_responsible_names(responsible)
            if not names:
                continue
            for name in dict.fromkeys(names):
                if name_pool is not None and name not in name_pool:
                    continue
                buckets[name][month].append(row)

    _count_rows(campus_rows, require_class_name=False)
    _count_rows(class_plan_rows, require_class_name=True)

    for name, month_map in buckets.items():
        for month, items in month_map.items():
            metrics[(month, name)] = len(items)

    return metrics

def _compute_class_metrics(
    db: Session, campus: str, year: int
) -> Optional[Dict[Tuple[int, str], Dict[str, int]]]:
    """
    计算带班量和带班人数:
    - 带班量: 从班级档案表中，统计每个班级的班主任（按人数最多的班主任算），按开班月份统计
    - 带班人数: 从班级档案表中，直接按班主任姓名统计学生数，按开班月份统计
    """
    try:
        # 初始化班级档案表
        try:
            class_file_db.init_class_file_tables()
        except Exception:
            pass

        # 从班级档案表获取所有学生数据（包含开班时间）
        table = class_file_db.班级档案表
        campus_cond = _campus_filter(table.神殿名称, campus)
        
        # 获取每个班级+班主任的学生数和开班时间（开班时间为空时使用入学时间）
        query = db.query(
            table.班级名称,
            table.班主任姓名,
            func.coalesce(table.开班时间, table.入学时间).label("effective_open_time"),
            func.count(table.记录ID).label("student_count")
        )
        if campus_cond is not None:
            query = query.filter(campus_cond)
        
        # 按班级名称、班主任姓名、有效开班时间分组统计
        class_teacher_students = query.filter(
            table.班主任姓名.isnot(None),
            table.班主任姓名 != ''
        ).group_by(table.班级名称, table.班主任姓名, func.coalesce(table.开班时间, table.入学时间)).all()

        if not class_teacher_students:
            logger.warning(f"[class-metrics] 没有找到班级档案数据: campus={campus}, year={year}")
            return {}

        # 构建班级到(主要班主任, 开班时间)的映射
        class_info: Dict[str, Tuple[str, Optional[pydate], int]] = {}  # 班级 -> (主要班主任, 开班时间, 学生数)
        
        # 1. 计算带班量：每个班级归属于学生数最多的班主任
        for class_name, teacher_name, open_time, student_count in class_teacher_students:
            class_name_str = str(class_name or "").strip()
            teacher_name_str = str(teacher_name or "").strip()
            if not class_name_str or not teacher_name_str:
                continue
            
            open_date = _coerce_date(open_time)
            
            if class_name_str not in class_info:
                class_info[class_name_str] = (teacher_name_str, open_date, student_count)
            else:
                # 如果当前班主任的学生数更多，更新主要班主任
                if student_count > class_info[class_name_str][2]:
                    class_info[class_name_str] = (teacher_name_str, open_date, student_count)

        # 2. 计算每个班主任的带班量和带班人数（按月份统计）
        metrics: Dict[Tuple[int, str], Dict[str, int]] = defaultdict(lambda: {"classLoad": 0, "classStudentCount": 0})
        
        # 带班量统计：根据班级的主要班主任
        for class_name, (main_teacher, open_date, _) in class_info.items():
            if not open_date or open_date.year != year:
                continue
            
            key = (open_date.month, main_teacher)
            metrics[key]["classLoad"] += 1

        # 带班人数统计：直接按班主任姓名汇总学生数
        for class_name, teacher_name, open_time, student_count in class_teacher_students:
            class_name_str = str(class_name or "").strip()
            teacher_name_str = str(teacher_name or "").strip()
            if not class_name_str or not teacher_name_str:
                continue
            
            open_date = _coerce_date(open_time)
            if not open_date or open_date.year != year:
                continue
            
            key = (open_date.month, teacher_name_str)
            metrics[key]["classStudentCount"] += student_count

        logger.info(f"[class-metrics] Computed metrics for campus={campus}, year={year}: {len(metrics)} entries")
        return metrics
    except Exception as e:
        import traceback
        logger.error(f"[employee-function-business] 计算带班数据失败: {e}")
        logger.error(traceback.format_exc())
        return None

def _compose_business_rows(
    rows: List[Any],
    class_metrics: Optional[Dict[Tuple[int, str], Dict[str, int]]],
    dormitory_metrics: Optional[Dict[Tuple[int, str], Dict[str, int]]],
    attendance_metrics: Optional[Dict[Tuple[int, str], float]],
    daily_interview_metrics: Optional[Dict[Tuple[int, str], float]],
    parent_interview_metrics: Optional[Dict[Tuple[int, str], float]],
    reputation_metrics: Optional[Dict[Tuple[int, str], Dict[str, float]]],
    movement_metrics: Optional[Dict[Tuple[int, str], Dict[str, float]]],
    refund_metrics: Optional[Dict[Tuple[int, str], Dict[str, float]]],
    promotion_rate_metrics: Optional[Dict[Tuple[int, str], float]],
    quality_metrics: Optional[Dict[Tuple[int, str], int]],
    activity_metrics: Optional[Dict[Tuple[int, str], int]],
    employment_metrics: Optional[Dict[Tuple[int, str], Dict[str, float]]] = None,
) -> List["BusinessRow"]:
    logger.warning(f"[COMPOSE DEBUG] activity_metrics is None: {activity_metrics is None}")
    if activity_metrics is not None:
        logger.warning(f"[COMPOSE DEBUG] activity_metrics keys: {list(activity_metrics.keys())}")
    existing_map: Dict[Tuple[int, str], Any] = {(r.月份, r.员工姓名): r for r in rows}
    key_set = set(existing_map.keys())
    if class_metrics is not None:
        key_set.update(class_metrics.keys())
    if dormitory_metrics is not None:
        key_set.update(dormitory_metrics.keys())
    if attendance_metrics is not None:
        key_set.update(attendance_metrics.keys())
    if daily_interview_metrics is not None:
        key_set.update(daily_interview_metrics.keys())
    if parent_interview_metrics is not None:
        key_set.update(parent_interview_metrics.keys())
    if reputation_metrics is not None:
        key_set.update(reputation_metrics.keys())
    if movement_metrics is not None:
        key_set.update(movement_metrics.keys())
    if refund_metrics is not None:
        key_set.update(refund_metrics.keys())
    if promotion_rate_metrics is not None:
        key_set.update(promotion_rate_metrics.keys())
    if quality_metrics is not None:
        key_set.update(quality_metrics.keys())
    if activity_metrics is not None:
        key_set.update(activity_metrics.keys())
    if employment_metrics is not None:
        key_set.update(employment_metrics.keys())

    def _get_value(obj: Any, attr: str):
        return getattr(obj, attr, None) if obj is not None else None

    out: List[BusinessRow] = []
    for month, name in sorted(key_set, key=lambda k: (k[0], k[1] or "")):
        name_key = str(name or "").strip()
        existing = existing_map.get((month, name))
        class_load = _get_value(existing, "带班量")
        class_students = _get_value(existing, "带班人数")
        dorm_load = _get_value(existing, "带宿舍量")
        dorm_students = _get_value(existing, "带宿舍人数")
        attendance_rate = _get_value(existing, "学生平均出勤率")
        daily_rate = _get_value(existing, "日常访谈率")
        parent_rate = _get_value(existing, "家长访谈率")
        reputation_count = _get_value(existing, "口碑报名人数")
        reputation_revenue = _get_value(existing, "口碑收入")
        movement_count = _get_value(existing, "异动人数")
        movement_rate = _get_value(existing, "异动率")
        refund_count = _get_value(existing, "退费人数")
        refund_rate = _get_value(existing, "退费率")
        promotion_rate = _get_value(existing, "升学率")
        quality_count = _get_value(existing, "素质课次数")
        activity_count = _get_value(existing, "活动组织次数")

        if class_metrics is not None:
            values = class_metrics.get((month, name_key))
            class_load = values["classLoad"] if values else 0
            class_students = values["classStudentCount"] if values else 0

        if dormitory_metrics is not None:
            values = dormitory_metrics.get((month, name_key))
            dorm_load = values["dormitoryLoad"] if values else 0
            dorm_students = values["dormitoryStudentCount"] if values else 0

        if attendance_metrics is not None:
            attendance_rate = attendance_metrics.get((month, name_key), 0)

        if daily_interview_metrics is not None and (month, name_key) in daily_interview_metrics:
            daily_rate = daily_interview_metrics.get((month, name_key), daily_rate)

        if parent_interview_metrics is not None and (month, name_key) in parent_interview_metrics:
            parent_rate = parent_interview_metrics.get((month, name_key), parent_rate)

        if reputation_metrics is not None:
            reputation_values = reputation_metrics.get((month, name_key))
            reputation_count = int(reputation_values["count"]) if reputation_values else 0
            reputation_revenue = float(reputation_values["revenue"]) if reputation_values else 0

        if movement_metrics is not None:
            movement_values = movement_metrics.get((month, name_key))
            movement_count = int(movement_values["count"]) if movement_values else 0
            movement_rate = float(movement_values["rate"]) if movement_values else 0

        if refund_metrics is not None:
            refund_values = refund_metrics.get((month, name_key))
            refund_count = int(refund_values["count"]) if refund_values else 0
            refund_rate = float(refund_values["rate"]) if refund_values else 0

        if promotion_rate_metrics is not None:
            promotion_rate = promotion_rate_metrics.get((month, name_key), 0)

        if quality_metrics is not None:
            quality_count = quality_metrics.get((month, name_key), 0)

        if activity_metrics is not None:
            activity_count = activity_metrics.get((month, name_key), 0)

        # 从班级就业总结表获取就业数据
        employment_rate = _get_value(existing, "就业率")
        employment_salary = _get_value(existing, "就业平均薪资")
        employment_count = _get_value(existing, "就业人数")
        
        if employment_metrics is not None:
            employment_values = employment_metrics.get((month, name_key))
            if employment_values:
                employment_rate = employment_values.get("rate", 0)
                employment_salary = employment_values.get("avg_salary", 0)
                employment_count = employment_values.get("count", 0)

        out.append(
            BusinessRow(
                月份=month,
                员工姓名=name,
                带班量=class_load,
                带班人数=class_students,
                带宿舍量=dorm_load,
                带宿舍人数=dorm_students,
                学生平均出勤率=attendance_rate,
                日常访谈率=daily_rate,
                家长访谈率=parent_rate,
                素质课次数=quality_count,
                活动组织次数=activity_count,
                就业率=employment_rate,
                就业平均薪资=employment_salary,
                就业人数=employment_count,
                口碑报名人数=reputation_count,
                口碑收入=reputation_revenue,
                异动人数=movement_count,
                异动率=movement_rate,
                退费人数=refund_count,
                退费率=refund_rate,
                升学率=promotion_rate,
            )
        )

    return out





# ===== Schemas =====
# 业务功能分析
class BusinessRow(BaseModel):
    月份: int
    员工姓名: str
    带班量: int | None = None
    带班人数: int | None = None
    带宿舍量: int | None = None
    带宿舍人数: int | None = None
    学生平均出勤率: float | None = None
    日常访谈率: float | None = None
    家长访谈率: float | None = None
    素质课次数: int | None = None
    活动组织次数: int | None = None
    就业率: float | None = None
    就业平均薪资: float | None = None
    就业人数: int | None = None
    口碑报名人数: int | None = None
    口碑收入: float | None = None
    异动人数: int | None = None
    异动率: float | None = None
    退费人数: int | None = None
    退费率: float | None = None
    升学率: float | None = None


class BusinessList(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[BusinessRow] = Field(default_factory=list)


@router.get("/employee-function-business", response_model=BusinessList, summary="获取班主任业务功能分析（按年）")
def get_business(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    def _default_if_none(value, default, label: str):
        if value is not None:
            return value
        try:
            db.rollback()
        except Exception:
            pass
        logger.warning(f"[employee-function-business] {label} failed; rolled back session and using default")
        return default

    init_employee_function_tables()
    rows = fetch_business_rows(db, 神殿名称=campus, 年份=year)
    class_metrics = _default_if_none(_compute_class_metrics(db, campus, year), {}, "class_metrics")
    dorm_metrics = _default_if_none(_compute_dormitory_metrics(db, campus, year), {}, "dorm_metrics")
    attendance_metrics = _default_if_none(_compute_attendance_metrics(db, campus, year), {}, "attendance_metrics")
    daily_interview_metrics = _default_if_none(_compute_daily_interview_metrics(db, campus, year), {}, "daily_interview_metrics")
    parent_interview_metrics = _default_if_none(_compute_parent_interview_metrics(db, campus, year), {}, "parent_interview_metrics")
    reputation_metrics = _default_if_none(_compute_reputation_metrics(db, campus, year), {}, "reputation_metrics")
    movement_rows = _fetch_monthly_personal_movement_rows(db, campus, year)
    movement_metrics = _default_if_none(_compute_movement_metrics(db, campus, year, movement_rows), {}, "movement_metrics")
    refund_metrics = _default_if_none(_compute_refund_metrics(db, campus, year, movement_rows), {}, "refund_metrics")
    promotion_rows = _fetch_monthly_personal_promotion_rows(db, campus, year)
    promotion_rate_metrics = _default_if_none(
        _compute_promotion_rate_metrics(db, campus, year, promotion_rows), {}, "promotion_rate_metrics"
    )
    quality_metrics = _default_if_none(_compute_quality_training_metrics(db, campus, year), {}, "quality_metrics")
    employee_names = sorted({str(r.员工姓名).strip() for r in rows if getattr(r, "员工姓名", None)})
    logger.warning(f"[ACTIVITY DEBUG] campus={campus}, year={year}, employee_names={employee_names}")
    try:
        activity_metrics = _compute_activity_metrics(db, campus, year, employee_names or None)
    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        logger.error(f"[employee-function-business] activity_metrics failed: {e}")
        activity_metrics = {}
    activity_metrics = _default_if_none(activity_metrics, {}, "activity_metrics")
    logger.warning(f"[ACTIVITY DEBUG] activity_metrics={activity_metrics}")
    # 计算就业指标（从班级就业总结表）
    employment_metrics = _default_if_none(_compute_employment_metrics(db, campus, year), {}, "employment_metrics")
    out = _compose_business_rows(
        rows,
        class_metrics,
        dorm_metrics,
        attendance_metrics,
        daily_interview_metrics,
        parent_interview_metrics,
        reputation_metrics,
        movement_metrics,
        refund_metrics,
        promotion_rate_metrics,
        quality_metrics,
        activity_metrics,
        employment_metrics,
    )
    # 检查活动组织次数是否正确填充
    for row in out:
        if row.月份 == 12:
            logger.warning(f"[ACTIVITY DEBUG] 月份=12, 员工={row.员工姓名}, 活动组织次数={row.活动组织次数}")
    return BusinessList(神殿名称=campus, 年份=year, 行列表=out)


class BusinessSavePayload(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[BusinessRow] = Field(default_factory=list)


@router.post("/employee-function-business", response_model=BusinessList, summary="保存班主任业务功能分析（按年覆盖写入）")
def save_business(payload: BusinessSavePayload, db: Session = Depends(get_db)):
    def _default_if_none(value, default, label: str):
        if value is not None:
            return value
        try:
            db.rollback()
        except Exception:
            pass
        logger.warning(f"[employee-function-business] {label} failed; rolled back session and using default")
        return default

    init_employee_function_tables()
    print(f"[business.save] campus={payload.神殿名称}, year={payload.年份}, rows={len(payload.行列表)}")
    class_metrics = _default_if_none(_compute_class_metrics(db, payload.神殿名称, payload.年份), {}, "class_metrics")
    dorm_metrics = _default_if_none(_compute_dormitory_metrics(db, payload.神殿名称, payload.年份), {}, "dorm_metrics")
    attendance_metrics = _default_if_none(_compute_attendance_metrics(db, payload.神殿名称, payload.年份), {}, "attendance_metrics")
    daily_interview_metrics = _default_if_none(
        _compute_daily_interview_metrics(db, payload.神殿名称, payload.年份), {}, "daily_interview_metrics"
    )
    parent_interview_metrics = _default_if_none(
        _compute_parent_interview_metrics(db, payload.神殿名称, payload.年份), {}, "parent_interview_metrics"
    )
    reputation_metrics = _default_if_none(_compute_reputation_metrics(db, payload.神殿名称, payload.年份), {}, "reputation_metrics")
    movement_rows = _fetch_monthly_personal_movement_rows(db, payload.神殿名称, payload.年份)
    movement_metrics = _default_if_none(
        _compute_movement_metrics(db, payload.神殿名称, payload.年份, movement_rows), {}, "movement_metrics"
    )
    refund_metrics = _default_if_none(
        _compute_refund_metrics(db, payload.神殿名称, payload.年份, movement_rows), {}, "refund_metrics"
    )
    promotion_rows = _fetch_monthly_personal_promotion_rows(db, payload.神殿名称, payload.年份)
    promotion_rate_metrics = _default_if_none(
        _compute_promotion_rate_metrics(db, payload.神殿名称, payload.年份, promotion_rows), {}, "promotion_rate_metrics"
    )
    quality_metrics = _default_if_none(
        _compute_quality_training_metrics(db, payload.神殿名称, payload.年份), {}, "quality_metrics"
    )
    payload_names = sorted({str(r.员工姓名).strip() for r in payload.行列表 if getattr(r, "员工姓名", None)})
    try:
        activity_metrics = _compute_activity_metrics(db, payload.神殿名称, payload.年份, payload_names or None)
    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        logger.error(f"[employee-function-business] activity_metrics failed: {e}")
        activity_metrics = {}
    activity_metrics = _default_if_none(activity_metrics, {}, "activity_metrics")
    # 计算就业指标（从班级就业总结表）
    employment_metrics = _default_if_none(
        _compute_employment_metrics(db, payload.神殿名称, payload.年份), {}, "employment_metrics"
    )
    rows_to_save: List[Dict[str, Any]] = []
    for row in payload.行列表:
        row_data = row.model_dump()
        if class_metrics is not None:
            key = (row_data.get("月份"), row_data.get("员工姓名"))
            values = class_metrics.get(key)
            row_data["带班量"] = values["classLoad"] if values else 0
            row_data["带班人数"] = values["classStudentCount"] if values else 0
        if dorm_metrics is not None:
            key = (row_data.get("月份"), row_data.get("员工姓名"))
            values = dorm_metrics.get(key)
            row_data["带宿舍量"] = values["dormitoryLoad"] if values else 0
            row_data["带宿舍人数"] = values["dormitoryStudentCount"] if values else 0
        if attendance_metrics is not None:
            key = (row_data.get("月份"), row_data.get("员工姓名"))
            row_data["学生平均出勤率"] = attendance_metrics.get(key, 0)
        if daily_interview_metrics is not None:
            key = (row_data.get("月份"), row_data.get("员工姓名"))
            if key in daily_interview_metrics:
                row_data["日常访谈率"] = daily_interview_metrics.get(key)
        if parent_interview_metrics is not None:
            key = (row_data.get("月份"), row_data.get("员工姓名"))
            if key in parent_interview_metrics:
                row_data["家长访谈率"] = parent_interview_metrics.get(key)
        if reputation_metrics is not None:
            key = (row_data.get("月份"), row_data.get("员工姓名"))
            values = reputation_metrics.get(key)
            row_data["口碑报名人数"] = int(values["count"]) if values else 0
            row_data["口碑收入"] = float(values["revenue"]) if values else 0
        if movement_metrics is not None:
            key = (row_data.get("月份"), row_data.get("员工姓名"))
            values = movement_metrics.get(key)
            row_data["异动人数"] = int(values["count"]) if values else 0
            row_data["异动率"] = float(values["rate"]) if values else 0
        if refund_metrics is not None:
            key = (row_data.get("月份"), row_data.get("员工姓名"))
            values = refund_metrics.get(key)
            row_data["退费人数"] = int(values["count"]) if values else 0
            row_data["退费率"] = float(values["rate"]) if values else 0
        if promotion_rate_metrics is not None:
            key = (row_data.get("月份"), row_data.get("员工姓名"))
            row_data["升学率"] = float(promotion_rate_metrics.get(key, 0))
        if quality_metrics is not None:
            key = (row_data.get("月份"), row_data.get("员工姓名"))
            row_data["素质课次数"] = quality_metrics.get(key, 0)
        if activity_metrics is not None:
            key = (row_data.get("月份"), row_data.get("员工姓名"))
            row_data["活动组织次数"] = activity_metrics.get(key, 0)
        # 从班级就业总结表自动填充就业指标
        if employment_metrics is not None:
            key = (row_data.get("月份"), row_data.get("员工姓名"))
            values = employment_metrics.get(key)
            if values:
                row_data["就业率"] = float(values.get("rate", 0))
                row_data["就业平均薪资"] = float(values.get("avg_salary", 0))
                row_data["就业人数"] = int(values.get("count", 0))
        rows_to_save.append(row_data)
    replace_business_rows(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        行列表=rows_to_save,
    )
    db.commit()
    rows = fetch_business_rows(db, 神殿名称=payload.神殿名称, 年份=payload.年份)
    out = _compose_business_rows(
        rows,
        class_metrics,
        dorm_metrics,
        attendance_metrics,
        daily_interview_metrics,
        parent_interview_metrics,
        reputation_metrics,
        movement_metrics,
        refund_metrics,
        promotion_rate_metrics,
        quality_metrics,
        activity_metrics,
        employment_metrics,
    )
    print(f"[business.saved] rows_in_db={len(out)}")
    return BusinessList(神殿名称=payload.神殿名称, 年份=payload.年份, 行列表=out)


# 功能分析（单表 + 扁平保存/聚合返回）
class FunctionRow(BaseModel):
    序号: int
    类别: str | None = None
    功能项目: str | None = None
    详细要求: str | None = None
    满分: float | None = None
    员工得分: Dict[str, float | None] = Field(default_factory=dict)


class FunctionList(BaseModel):
    神殿名称: str
    年份: int
    员工列表: List[str] = Field(default_factory=list)
    行列表: List[FunctionRow] = Field(default_factory=list)


@router.get("/employee-function-ability", response_model=FunctionList, summary="获取班主任功能分析（按年）")
def get_function(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    init_employee_function_tables()
    flat_rows = fetch_function_flat(db, 神殿名称=campus, 年份=year)

    # 员工列表
    employees = sorted({r.员工姓名 for r in flat_rows})

    # 聚合为每个序号一行（带 员工得分）

    by_serial: Dict[int, Dict] = {}
    for r in flat_rows:
        if r.序号 not in by_serial:
            by_serial[r.序号] = {
                "序号": r.序号,
                "类别": r.类别,
                "功能项目": r.功能项目,
                "详细要求": r.详细要求,
                "满分": r.满分,
                "员工得分": {},
            }
        by_serial[r.序号]["员工得分"][r.员工姓名] = r.得分

    rows: List[FunctionRow] = []
    for sn in sorted(by_serial.keys()):
        base = by_serial[sn]
        row = FunctionRow(
            序号=sn,
            类别=base.get("类别"),
            功能项目=base.get("功能项目"),
            详细要求=base.get("详细要求"),
            满分=base.get("满分"),
            员工得分={emp: base["员工得分"].get(emp) for emp in employees},
        )
        rows.append(row)

    return FunctionList(神殿名称=campus, 年份=year, 员工列表=employees, 行列表=rows)


class FunctionSavePayload(BaseModel):
    神殿名称: str
    年份: int
    员工列表: List[str] = Field(default_factory=list)
    行列表: List[FunctionRow] = Field(default_factory=list)


@router.post("/employee-function-ability", response_model=FunctionList, summary="保存班主任功能分析（按年覆盖写入）")
def save_function(payload: FunctionSavePayload, db: Session = Depends(get_db)):
    init_employee_function_tables()
    # 扁平化行列表（每个序号 × 每个员工 → 一条记录）
    flat_to_save: List[Dict] = []
    for r in payload.行列表:
        for emp in payload.员工列表:
            flat_to_save.append({
                "员工姓名": emp,
                "序号": r.序号,
                "类别": r.类别,
                "功能项目": r.功能项目,
                "详细要求": r.详细要求,
                "满分": r.满分,
                "得分": (r.员工得分 or {}).get(emp),
            })
    print(f"[function.save] campus={payload.神殿名称}, year={payload.年份}, rows={len(flat_to_save)}, employees={len(payload.员工列表)}")

    replace_function_flat(
        db,
        神殿名称=payload.神殿名称,
        年份=payload.年份,
        行列表=flat_to_save,
    )
    db.commit()

    # 取回并按 GET 的格式返回
    flat_rows = fetch_function_flat(db, 神殿名称=payload.神殿名称, 年份=payload.年份)
    employees = sorted({r.员工姓名 for r in flat_rows})

    by_serial: Dict[int, Dict] = {}
    for r in flat_rows:
        if r.序号 not in by_serial:
            by_serial[r.序号] = {
                "序号": r.序号,
                "类别": r.类别,
                "功能项目": r.功能项目,
                "详细要求": r.详细要求,
                "满分": r.满分,
                "员工得分": {},
            }
        by_serial[r.序号]["员工得分"][r.员工姓名] = r.得分

    rows: List[FunctionRow] = []
    for sn in sorted(by_serial.keys()):
        base = by_serial[sn]
        rows.append(FunctionRow(
            序号=sn,
            类别=base.get("类别"),
            功能项目=base.get("功能项目"),
            详细要求=base.get("详细要求"),
            满分=base.get("满分"),
            员工得分={emp: base["员工得分"].get(emp) for emp in employees},
        ))

    print(f"[function.saved] rows_in_db={len(flat_rows)}")
    return FunctionList(神殿名称=payload.神殿名称, 年份=payload.年份, 员工列表=employees, 行列表=rows)


# ===== 每日数据查询 API =====
class DailyBusinessRow(BaseModel):
    """每日业务数据行"""
    日期: str  # YYYY-MM-DD 格式
    员工姓名: str
    出勤人数: int | None = None
    应出勤人数: int | None = None
    出勤率: float | None = None
    学员访谈人数: int | None = None
    家长访谈人数: int | None = None
    素质课次数: int | None = None
    活动组织次数: int | None = None


class DailyBusinessList(BaseModel):
    """每日业务数据列表"""
    神殿名称: str
    日期: str  # YYYY-MM-DD 格式
    行列表: List[DailyBusinessRow] = Field(default_factory=list)


def _compute_daily_attendance_metrics(
    db: Session, campus: str, target_date: pydate
) -> Dict[str, Dict[str, int]]:
    """
    计算指定日期的出勤数据
    Returns: {员工姓名: {"present": 出勤人数, "total": 应出勤人数}}
    """
    try:
        class_rows = _fetch_class_list_rows(db, campus)
        if not class_rows:
            return {}

        class_teacher_map: Dict[str, str] = {}
        for row in class_rows:
            class_name = str(_row_get(row, '班级名称') or '').strip()
            teacher = str(_row_get(row, '班主任') or '').strip()
            if class_name and teacher:
                class_teacher_map[class_name] = teacher

        if not class_teacher_map:
            return {}

        class_names = sorted(class_teacher_map.keys())
        class_counts = _fetch_class_file_counts(db, campus, class_names)

        # 查询指定日期的出勤记录
        try:
            class_attendance_db.init_class_attendance_tables()
        except Exception:
            pass

        table = class_attendance_db.班级出勤表
        query = db.query(table).filter(
            table.年份 == target_date.year,
            table.日期 == target_date,
            table.班级名称.in_(class_names)
        )
        campus_cond = _campus_filter(table.神殿名称, campus)
        if campus_cond is not None:
            query = query.filter(campus_cond)
        attendance_rows = query.all()

        # 统计每个班级的出勤情况
        present_counts: Dict[str, int] = defaultdict(int)  # 班级 -> 出勤人数
        active_slots: Dict[str, set] = defaultdict(set)  # 班级 -> 有记录的时段

        for row in attendance_rows:
            class_name = str(getattr(row, '班级名称', None) or "").strip()
            if not class_name or class_name not in class_teacher_map:
                continue
            half = getattr(row, '上下半天', None)
            if half not in ('am', 'pm'):
                continue
            value = getattr(row, '值', None)
            if _has_attendance_value(value):
                active_slots[class_name].add(half)
            if _is_present_value(value):
                present_counts[class_name] += 1

        # 按班主任汇总
        metrics: Dict[str, Dict[str, int]] = defaultdict(lambda: {'present': 0, 'total': 0})
        for class_name, teacher in class_teacher_map.items():
            class_size = int(class_counts.get(class_name, 0) or 0)
            if class_size <= 0:
                continue
            active_count = len(active_slots.get(class_name, set()))
            total = class_size * active_count
            present = present_counts.get(class_name, 0)
            metrics[teacher]['present'] += present
            metrics[teacher]['total'] += total

        return dict(metrics)
    except Exception as e:
        print(f"[daily-attendance] 计算每日出勤数据失败: {e}")
        return {}


def _compute_daily_student_interview_metrics(
    db: Session, campus: str, target_date: pydate
) -> Dict[str, int]:
    """
    计算指定日期的学员访谈人数
    根据学员访谈记录表的访谈时间字段筛选
    Returns: {员工姓名: 访谈人数}
    """
    try:
        class_rows = _fetch_class_list_rows(db, campus)
        class_teacher_map = _build_class_teacher_map(class_rows)

        try:
            student_interview_db.init_student_interview_tables()
        except Exception:
            pass

        table = student_interview_db.学员访谈记录表
        
        # 根据访谈时间字段查询指定日期的记录
        query = db.query(table).filter(
            table.年份 == target_date.year,
            table.访谈时间 == target_date
        )
        campus_cond = _campus_filter(table.神殿名称, campus)
        if campus_cond is not None:
            query = query.filter(campus_cond)
        if hasattr(table, "访谈类型"):
            query = query.filter(or_(table.访谈类型 == "学员访谈", table.访谈类型 == None))  # noqa: E711
        interview_rows = query.all()

        logger.info(f"[daily-student-interview] 查询到 {len(interview_rows)} 条学员访谈记录, 日期={target_date}")

        # 按班主任统计访谈人数
        counts: Dict[str, set] = defaultdict(set)  # 班主任 -> 访谈学生集合
        missing_names: set = set()

        for row in interview_rows:
            student_name = str(getattr(row, "姓名", None) or "").strip()
            if not student_name:
                continue
            
            # 优先使用记录中的班主任字段
            teacher = str(getattr(row, "班主任", None) or "").strip()
            if teacher:
                counts[teacher].add(student_name)
                continue
            
            # 其次通过班级查找班主任
            class_name = str(getattr(row, "班级", None) or "").strip()
            teacher = class_teacher_map.get(class_name, "")
            if teacher:
                counts[teacher].add(student_name)
            else:
                missing_names.add(student_name)

        # 查找缺失班主任的学生
        if missing_names:
            name_map = _build_student_teacher_map(db, campus, list(missing_names), class_teacher_map)
            for row in interview_rows:
                student_name = str(getattr(row, "姓名", None) or "").strip()
                if student_name not in missing_names:
                    continue
                # 跳过已经有班主任的记录
                if str(getattr(row, "班主任", None) or "").strip():
                    continue
                class_name = str(getattr(row, "班级", None) or "").strip()
                if class_teacher_map.get(class_name, ""):
                    continue
                teacher = name_map.get(student_name, "")
                if teacher:
                    counts[teacher].add(student_name)

        result = {teacher: len(students) for teacher, students in counts.items()}
        logger.info(f"[daily-student-interview] 统计结果: {result}")
        return result
    except Exception as e:
        print(f"[daily-student-interview] 计算每日学员访谈数据失败: {e}")
        import traceback
        traceback.print_exc()
        return {}


def _compute_daily_parent_interview_metrics(
    db: Session, campus: str, target_date: pydate
) -> Dict[str, int]:
    """
    计算指定日期的家长访谈人数
    根据家长访谈记录表的访谈时间字段筛选
    Returns: {员工姓名: 访谈人数}
    """
    try:
        class_rows = _fetch_class_list_rows(db, campus)
        class_teacher_map = _build_class_teacher_map(class_rows)

        try:
            parent_interview_db.init_parent_interview_tables()
        except Exception:
            pass

        table = parent_interview_db.家长访谈记录表
        
        # 根据访谈时间字段查询指定日期的记录
        query = db.query(table).filter(
            table.年份 == target_date.year,
            table.访谈时间 == target_date
        )
        campus_cond = _campus_filter(table.神殿名称, campus)
        if campus_cond is not None:
            query = query.filter(campus_cond)
        interview_rows = query.all()

        logger.info(f"[daily-parent-interview] 查询到 {len(interview_rows)} 条家长访谈记录, 日期={target_date}")

        # 按班主任统计访谈人数
        counts: Dict[str, set] = defaultdict(set)  # 班主任 -> 访谈学生集合
        missing_names: set = set()

        for row in interview_rows:
            student_name = str(getattr(row, "姓名", None) or "").strip()
            if not student_name:
                continue
            
            # 优先使用记录中的班主任字段
            teacher = str(getattr(row, "班主任", None) or "").strip()
            if teacher:
                counts[teacher].add(student_name)
                continue
            
            # 否则需要通过学生姓名查找班主任
            missing_names.add(student_name)

        # 查找缺失班主任的学生
        if missing_names:
            name_map = _build_student_teacher_map(db, campus, list(missing_names), class_teacher_map)
            for row in interview_rows:
                student_name = str(getattr(row, "姓名", None) or "").strip()
                if student_name not in missing_names:
                    continue
                # 跳过已经有班主任的记录
                if str(getattr(row, "班主任", None) or "").strip():
                    continue
                teacher = name_map.get(student_name, "")
                if teacher:
                    counts[teacher].add(student_name)

        result = {teacher: len(students) for teacher, students in counts.items()}
        logger.info(f"[daily-parent-interview] 统计结果: {result}")
        return result
    except Exception as e:
        print(f"[daily-parent-interview] 计算每日家长访谈数据失败: {e}")
        import traceback
        traceback.print_exc()
        return {}


def _compute_daily_quality_training_metrics(
    db: Session, campus: str, target_date: pydate
) -> Dict[str, int]:
    """
    计算指定日期的素质课次数
    Returns: {员工姓名: 素质课次数}
    """
    try:
        class_rows = _fetch_class_list_rows(db, campus)
        if not class_rows:
            return {}

        class_teacher_map: Dict[str, str] = {}
        for row in class_rows:
            class_name = str(_row_get(row, '班级名称') or '').strip()
            teacher = str(_row_get(row, '班主任') or '').strip()
            if class_name and teacher:
                class_teacher_map[class_name] = teacher

        if not class_teacher_map:
            return {}

        class_names = sorted(class_teacher_map.keys())

        try:
            quality_training_db.init_quality_training_tables()
        except Exception:
            pass

        table = quality_training_db.素质训练登记表
        query = db.query(table).filter(
            table.年份 == target_date.year,
            table.月份 == target_date.month,
            table.班级名称.in_(class_names)
        )
        campus_cond = _campus_filter(table.神殿名称, campus)
        if campus_cond is not None:
            query = query.filter(campus_cond)

        # 检查是否有日期字段
        if hasattr(table, '日期'):
            query = query.filter(table.日期 == target_date)

        training_rows = query.all()

        metrics: Dict[str, int] = defaultdict(int)
        for row in training_rows:
            class_name = str(getattr(row, '班级名称', None) or "").strip()
            if not class_name:
                continue
            teacher = class_teacher_map.get(class_name, "")
            if not teacher:
                continue
            count = _parse_lesson_count(getattr(row, '几节课', None))
            if count:
                metrics[teacher] += count

        return dict(metrics)
    except Exception as e:
        print(f"[daily-quality-training] 计算每日素质课数据失败: {e}")
        return {}


def _compute_daily_activity_metrics(
    db: Session, campus: str, target_date: pydate, employee_names: Optional[List[str]] = None
) -> Dict[str, int]:
    """
    计算指定日期的活动组织次数
    Returns: {员工姓名: 活动次数}
    """
    try:
        # 获取神殿活动计划
        campus_rows = _fetch_campus_activity_plan_rows(db, campus, target_date.year)
        class_plan_rows = _fetch_class_activity_plan_rows(db, campus, target_date.year)

        metrics: Dict[str, int] = defaultdict(int)
        name_pool = None
        if employee_names:
            name_pool = {str(name or "").strip() for name in employee_names if str(name or "").strip()}

        def _count_rows(rows: List[Any], require_class_name: bool = False):
            for row in rows:
                if not _campus_matches(_row_get(row, '神殿名称'), campus):
                    continue
                # 检查日期是否匹配
                time_value = _row_get(row, '时间')
                if time_value:
                    row_date = _coerce_date(time_value)
                    if row_date and row_date != target_date:
                        continue
                else:
                    # 如果没有具体日期，检查月份是否匹配
                    month = _parse_month_value(_row_get(row, '月份') or 0)
                    if month != target_date.month:
                        continue

                if require_class_name:
                    class_name = str(_row_get(row, '班级名称') or '').strip()
                    if not class_name:
                        continue

                responsible = str(_row_get(row, '负责人') or '').strip()
                names = _split_responsible_names(responsible)
                if not names:
                    continue
                for name in dict.fromkeys(names):
                    if name_pool is not None and name not in name_pool:
                        continue
                    metrics[name] += 1

        _count_rows(campus_rows, require_class_name=False)
        _count_rows(class_plan_rows, require_class_name=True)

        return dict(metrics)
    except Exception as e:
        print(f"[daily-activity] 计算每日活动数据失败: {e}")
        return {}


@router.get("/employee-function-business-daily", response_model=DailyBusinessList, summary="获取班主任业务功能分析（按日）")
def get_business_daily(
    campus: str = Query(..., alias="campus"),
    date: str = Query(..., alias="date", description="日期，格式：YYYY-MM-DD"),
    db: Session = Depends(get_db),
):
    """
    获取指定日期的班主任业务功能分析数据
    
    可查看的每日数据包括：
    - 出勤人数/应出勤人数/出勤率
    - 学员访谈人数
    - 家长访谈人数
    - 素质课次数
    - 活动组织次数
    """
    # 解析日期
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="日期格式错误，请使用 YYYY-MM-DD 格式") from e

    # 获取班主任列表
    class_rows = _fetch_class_list_rows(db, campus)
    teacher_names = sorted({
        str(_row_get(r, "班主任") or "").strip()
        for r in class_rows
        if _row_get(r, "班主任")
    })

    # 计算各项指标
    attendance_metrics = _compute_daily_attendance_metrics(db, campus, target_date)
    student_interview_metrics = _compute_daily_student_interview_metrics(db, campus, target_date)
    parent_interview_metrics = _compute_daily_parent_interview_metrics(db, campus, target_date)
    quality_metrics = _compute_daily_quality_training_metrics(db, campus, target_date)
    activity_metrics = _compute_daily_activity_metrics(db, campus, target_date, teacher_names)

    # 合并所有有数据的员工
    all_employees = set(teacher_names)
    all_employees.update(attendance_metrics.keys())
    all_employees.update(student_interview_metrics.keys())
    all_employees.update(parent_interview_metrics.keys())
    all_employees.update(quality_metrics.keys())
    all_employees.update(activity_metrics.keys())

    # 构建返回数据
    rows: List[DailyBusinessRow] = []
    for employee in sorted(all_employees):
        if not employee:
            continue
        attendance = attendance_metrics.get(employee, {})
        present = attendance.get('present', 0)
        total = attendance.get('total', 0)
        rate = round((present / total * 100), 2) if total > 0 else None

        rows.append(DailyBusinessRow(
            日期=date,
            员工姓名=employee,
            出勤人数=present if total > 0 else None,
            应出勤人数=total if total > 0 else None,
            出勤率=rate,
            学员访谈人数=student_interview_metrics.get(employee),
            家长访谈人数=parent_interview_metrics.get(employee),
            素质课次数=quality_metrics.get(employee),
            活动组织次数=activity_metrics.get(employee),
        ))

    return DailyBusinessList(神殿名称=campus, 日期=date, 行列表=rows)
