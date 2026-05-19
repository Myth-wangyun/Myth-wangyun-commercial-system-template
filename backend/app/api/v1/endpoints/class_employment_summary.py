"""
班级就业总结API端点

数据来源：从教化司的 QT班级就业信息汇总表 和 QT班就业信息表 读取数据
"""

import base64
import logging
from datetime import datetime
from typing import Dict, List, Optional, TypedDict
from urllib.parse import unquote

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy import distinct, or_
from sqlalchemy import func as sql_func
from sqlalchemy.orm import Session

from ....core.database import get_db, get_teaching_quality_db
from ....crud import class_employment_summary as summary_crud
from ....crud import config_master as config_crud
from ....schemas.class_employment_summary import (
    班级就业总结Upsert,
    班级就业总结创建,
    班级就业总结响应,
    班级就业总结更新,
)

# 导入教质的数据模型
from ....teaching_quality.TQ_class_employment_info_db import QT班就业信息表
from ....teaching_quality.TQ_class_employment_summary_db import QT班级就业信息汇总表

logger = logging.getLogger(__name__)


router = APIRouter()


class 班级统计缓存(TypedDict):
    神殿: str
    班级名称: str
    年份: int
    毕业时间: str | None
    records: list[QT班就业信息表]


class 历史班级统计缓存(TypedDict):
    神殿: str
    班级名称: str
    毕业时间: str | None
    records: list[QT班就业信息表]


def get_campus_from_header(x_campus: Optional[str] = Header(None, alias="X-Campus")) -> Optional[str]:
    """从请求头获取神殿信息"""
    if not x_campus:
        return None
    try:
        decoded = base64.b64decode(x_campus).decode('utf-8')
        return unquote(decoded)
    except Exception:
        return None


def _normalize_campus(campus: str) -> str:
    """规范化神殿名称"""
    name = str(campus or "").strip()
    if name.endswith("神殿"):
        return name[:-2]
    return name


def _extract_salary(record: QT班就业信息表) -> int | None:
    return record.回访考核薪资 or record.转正薪资 or record.试用期薪资


def _get_class_config_map(db: Session, campus: str) -> Dict[str, Dict]:
    """
    从配置中心获取班级配置信息（专业、学制、教员、班主任）
    返回 { "班级名称": { "major": 专业, "programLength": 学制, "instructor": 教员, "classTeacher": 班主任 } }
    """
    try:
        classes = config_crud.list_classes(db, campus_name=campus)
        result = {}
        for c in classes:
            class_name = c.get("class_name") or c.get("class_code")
            if class_name:
                result[class_name] = {
                    "major": c.get("major_name") or "",
                    "programLength": c.get("program_length") or "",
                    "instructor": c.get("instructor_name") or "",
                    "classTeacher": c.get("homeroom_teacher_name") or "",
                }
        return result
    except Exception as e:
        logger.warning(f"获取班级配置失败: {e}")
        return {}


def _get_salary_over_10k_map(tq_db: Session, campus: str, year: int) -> Dict[str, int]:
    """
    从教质明细表统计各班级薪资过万人数（指定年份）
    返回 { "班级名称": 薪资过万人数 }
    """
    norm = _normalize_campus(campus)
    stats = tq_db.query(
        QT班就业信息表.班级名称,
        sql_func.count(QT班就业信息表.记录ID).label("record_count"),
    ).filter(
        QT班就业信息表.年份 == year,
        or_(
            QT班就业信息表.神殿名称 == norm,
            QT班就业信息表.神殿名称 == f"{norm}神殿",
            QT班就业信息表.神殿名称.ilike(f"{norm}%"),
        ),
        QT班就业信息表.回访考核薪资 >= 10000
    ).group_by(QT班就业信息表.班级名称).all()
    
    return {
        row.班级名称: int(row.record_count or 0)
        for row in stats
        if row.班级名称
    }


def _get_salary_over_10k_map_all_years(tq_db: Session, campus: str) -> Dict[str, int]:
    """
    从教质明细表统计各班级薪资过万人数（所有年份合计）
    返回 { "班级名称": 薪资过万人数 }
    """
    norm = _normalize_campus(campus)
    stats = tq_db.query(
        QT班就业信息表.班级名称,
        sql_func.count(QT班就业信息表.记录ID).label("record_count"),
    ).filter(
        or_(
            QT班就业信息表.神殿名称 == norm,
            QT班就业信息表.神殿名称 == f"{norm}神殿",
            QT班就业信息表.神殿名称.ilike(f"{norm}%"),
        ),
        QT班就业信息表.回访考核薪资 >= 10000
    ).group_by(QT班就业信息表.班级名称).all()
    
    return {
        row.班级名称: int(row.record_count or 0)
        for row in stats
        if row.班级名称
    }


def _get_from_academic_schema(db: Session, campus: str, year: Optional[int], class_name: Optional[str]) -> List[Dict]:
    """
    从 academic schema 的班级就业总结表读取数据（教质数据库无数据时的回退）
    """
    from ....models.class_employment_summary import 班级就业总结表
    
    norm = _normalize_campus(campus)
    
    # 如果没有指定年份，获取最大年份
    if year is None:
        max_year = (
            db.query(班级就业总结表.年份)
            .filter(
                or_(
                    班级就业总结表.神殿 == norm,
                    班级就业总结表.神殿 == f"{norm}神殿",
                    班级就业总结表.神殿.ilike(f"{norm}%"),
                )
            )
            .order_by(班级就业总结表.年份.desc())
            .limit(1)
            .scalar()
        )
        year = int(max_year) if max_year else 2025
    
    # 查询数据
    query = db.query(班级就业总结表).filter(
        or_(
            班级就业总结表.神殿 == norm,
            班级就业总结表.神殿 == f"{norm}神殿",
            班级就业总结表.神殿.ilike(f"{norm}%"),
        ),
        班级就业总结表.年份 == year
    )
    
    if class_name:
        query = query.filter(班级就业总结表.班级名称 == class_name)
    
    rows = query.order_by(班级就业总结表.班级名称).all()
    
    if not rows:
        return []
    
    # 获取班级配置信息
    class_config_map = _get_class_config_map(db, campus)
    
    result = []
    for s in rows:
        config = class_config_map.get(s.班级名称, {})
        
        result.append({
            # 英文字段名
            "id": str(s.总结ID),
            "classCode": s.班级名称,
            "campus": s.神殿,
            "major": config.get("major", ""),
            "programLength": config.get("programLength", ""),
            "instructor": config.get("instructor", ""),
            "classTeacher": config.get("classTeacher", ""),
            "graduationTime": f"{s.年份}-01-01",
            "archiveCount": s.档案人数 or 0,
            "needEmploymentCount": s.需就业人数 or 0,
            "targetEmploymentCount": s.目标就业人数 or 0,
            "actualEmploymentCount": s.实际就业人数 or 0,
            "targetEmploymentRate": float(s.目标就业率 or 100),
            "actualEmploymentRate": float(s.实际就业率 or 0),
            "targetNeedEmploymentRate": float(s.目标需就业率 or 100),
            "actualNeedEmploymentRate": float(s.实际需就业率 or 0),
            "targetAverageSalary": float(s.目标平均薪资 or 8000),
            "actualAverageSalary": float(s.实际平均薪资 or 0),
            "salaryOverTenThousand": 0,  # academic schema 没有此字段
            "year": s.年份,
            "month": s.月份 or 1,
            # 中文字段名
            "总结ID": s.总结ID,
            "神殿": s.神殿,
            "班级名称": s.班级名称,
            "年份": s.年份,
            "月份": s.月份 or 1,
            "档案人数": s.档案人数 or 0,
            "需就业人数": s.需就业人数 or 0,
            "目标就业人数": s.目标就业人数 or 0,
            "实际就业人数": s.实际就业人数 or 0,
            "目标就业率": float(s.目标就业率 or 100),
            "实际就业率": float(s.实际就业率 or 0),
            "目标需就业率": float(s.目标需就业率 or 100),
            "实际需就业率": float(s.实际需就业率 or 0),
            "目标平均薪资": float(s.目标平均薪资 or 8000),
            "实际平均薪资": float(s.实际平均薪资 or 0),
            "薪资过万人数": 0,
        })
    
    return result


def _select_latest_academic_target(current, candidate):
    """Choose the latest academic target row for the same class/year."""
    if current is None:
        return candidate

    current_month = int(getattr(current, "月份", 0) or 0)
    candidate_month = int(getattr(candidate, "月份", 0) or 0)
    current_updated = getattr(current, "更新时间", None) or getattr(current, "创建时间", None) or datetime.min
    candidate_updated = getattr(candidate, "更新时间", None) or getattr(candidate, "创建时间", None) or datetime.min

    if candidate_month != current_month:
        return candidate if candidate_month > current_month else current
    return candidate if candidate_updated >= current_updated else current


def _build_academic_target_map(
    db: Session,
    campus: str,
    year: Optional[int] = None,
    month: Optional[int] = None,
    class_name: Optional[str] = None,
) -> Dict[tuple[str, int], object]:
    """Load academic target records keyed by (class_name, year)."""

    rows = summary_crud.获取班级就业总结列表(
        db=db,
        神殿=campus,
        班级名称=class_name,
        年份=year,
        月份=month,
    )

    target_map: Dict[tuple[str, int], object] = {}
    for row in rows:
        key = (getattr(row, "班级名称", ""), int(getattr(row, "年份", 0) or 0))
        if not key[0] or not key[1]:
            continue
        target_map[key] = _select_latest_academic_target(target_map.get(key), row)

    return target_map


def _merge_academic_target_overrides(
    rows: List[Dict],
    db: Session,
    campus: str,
    year: Optional[int] = None,
    month: Optional[int] = None,
    class_name: Optional[str] = None,
) -> List[Dict]:
    """Overlay academic target values onto teaching-quality actual values."""

    if not rows:
        return rows

    target_map = _build_academic_target_map(
        db=db,
        campus=campus,
        year=year,
        month=month,
        class_name=class_name,
    )

    if not target_map:
        return rows

    merged_rows: List[Dict] = []
    for row in rows:
        class_code = str(row.get("班级名称") or row.get("classCode") or "")
        row_year = int(row.get("年份") or row.get("year") or 0)
        override = target_map.get((class_code, row_year))

        if not override:
            merged_rows.append(row)
            continue

        archive_count = int(row.get("档案人数") or row.get("archiveCount") or 0)
        need_count = int(row.get("需就业人数") or row.get("needEmploymentCount") or 0)
        target_count = int(getattr(override, "目标就业人数", 0) or 0)
        target_salary = float(getattr(override, "目标平均薪资", 0) or 0)
        notes = getattr(override, "备注", None)

        target_employment_rate = round(target_count / archive_count * 100, 2) if archive_count > 0 else 0.0
        target_need_rate = round(target_count / need_count * 100, 2) if need_count > 0 else 0.0

        merged = dict(row)
        merged.update(
            {
                "targetEmploymentCount": target_count,
                "targetEmploymentRate": target_employment_rate,
                "targetNeedEmploymentRate": target_need_rate,
                "targetAverageSalary": target_salary,
                "notes": notes or "",
                "目标就业人数": target_count,
                "目标就业率": target_employment_rate,
                "目标需就业率": target_need_rate,
                "目标平均薪资": target_salary,
                "备注": notes or "",
            }
        )
        merged_rows.append(merged)

    return merged_rows


def _generate_summary_from_detail(tq_db: Session, db: Session, campus: str, year: int) -> List[Dict]:
    """
    当汇总表没有数据时，从教质明细表（QT班就业信息表）动态生成班级就业汇总数据。
    同时从配置中心获取专业、学制、教员、班主任信息。
    """
    norm = _normalize_campus(campus)
    
    # 从教质明细表获取该神殿该年份的所有班级
    detail_rows = (
        tq_db.query(QT班就业信息表)
        .filter(
            QT班就业信息表.年份 == year,
            or_(
                QT班就业信息表.神殿名称 == norm,
                QT班就业信息表.神殿名称 == f"{norm}神殿",
                QT班就业信息表.神殿名称.ilike(f"{norm}%"),
            ),
        )
        .all()
    )
    
    if not detail_rows:
        return []
    
    # 获取班级配置信息（专业、学制、教员、班主任）
    class_config_map = _get_class_config_map(db, campus)
    
    # 按班级分组统计
    class_stats: dict[str, 班级统计缓存] = {}
    for row in detail_rows:
        class_name = row.班级名称
        if not class_name:
            continue
            
        if class_name not in class_stats:
            class_stats[class_name] = {
                "神殿": row.神殿名称,
                "班级名称": class_name,
                "年份": year,
                "毕业时间": row.毕业时间,
                "records": [],
            }
        class_stats[class_name]["records"].append(row)
    
    result = []
    for class_name, stats in class_stats.items():
        records = stats["records"]
        archive_count = sum(1 for record in records if record.姓名)
        
        # 计算实际就业人数：回访考核薪资不为0的人数
        employed_records = [
            record
            for record in records
            if record.姓名 and record.回访考核薪资 not in (None, 0)
        ]
        
        # 计算薪资统计
        salaries = [
            salary
            for record in records
            if (salary := _extract_salary(record)) is not None and salary > 0
        ]
        
        actual_avg_salary = int(sum(salaries) / len(salaries)) if salaries else 0
        over10k_count = len([s for s in salaries if s >= 10000])
        
        actual_employed = len(employed_records)
        target_avg_salary = 8000  # 默认目标薪资
        
        # 计算就业率和达标率
        actual_employment_rate = round(actual_employed / archive_count * 100, 2) if archive_count > 0 else 0
        
        # 从配置中心获取班级信息
        config = class_config_map.get(class_name, {})
        
        result.append({
            # 英文字段名
            "id": f"{stats['神殿']}-{class_name}-{year}",
            "classCode": class_name,
            "campus": stats["神殿"],
            "major": config.get("major", ""),
            "programLength": config.get("programLength", ""),
            "instructor": config.get("instructor", ""),
            "classTeacher": config.get("classTeacher", ""),
            "graduationTime": stats.get("毕业时间") or f"{year}-01-01",
            "archiveCount": archive_count,
            "needEmploymentCount": archive_count,
            "targetEmploymentCount": archive_count,
            "actualEmploymentCount": actual_employed,
            "targetEmploymentRate": 100.0,
            "actualEmploymentRate": actual_employment_rate,
            "targetNeedEmploymentRate": 100.0,
            "actualNeedEmploymentRate": actual_employment_rate,
            "targetAverageSalary": target_avg_salary,
            "actualAverageSalary": actual_avg_salary,
            "salaryOverTenThousand": over10k_count,
            "year": year,
            "month": 1,
            # 中文字段名
            "神殿": stats["神殿"],
            "班级名称": class_name,
            "年份": year,
            "月份": 1,
            "档案人数": archive_count,
            "需就业人数": archive_count,
            "目标就业人数": archive_count,
            "实际就业人数": actual_employed,
            "目标就业率": 100.0,
            "实际就业率": actual_employment_rate,
            "目标需就业率": 100.0,
            "实际需就业率": actual_employment_rate,
            "目标平均薪资": target_avg_salary,
            "实际平均薪资": actual_avg_salary,
            "薪资过万人数": over10k_count,
        })
    
    return result


def _generate_summary_from_detail_all_years(tq_db: Session, db: Session, campus: str) -> List[Dict]:
    """
    从教质明细表（QT班就业信息表）动态生成班级就业汇总数据（所有年份合计）。
    同时从配置中心获取专业、学制、教员、班主任信息。
    """
    norm = _normalize_campus(campus)
    
    # 从教质明细表获取该神殿所有年份的班级数据
    detail_rows = (
        tq_db.query(QT班就业信息表)
        .filter(
            or_(
                QT班就业信息表.神殿名称 == norm,
                QT班就业信息表.神殿名称 == f"{norm}神殿",
                QT班就业信息表.神殿名称.ilike(f"{norm}%"),
            ),
        )
        .all()
    )
    
    if not detail_rows:
        return []
    
    # 获取班级配置信息（专业、学制、教员、班主任）
    class_config_map = _get_class_config_map(db, campus)
    
    # 按班级分组统计（忽略年份，合计所有年份）
    class_stats: dict[str, 历史班级统计缓存] = {}
    for row in detail_rows:
        class_name = row.班级名称
        if not class_name:
            continue
            
        if class_name not in class_stats:
            class_stats[class_name] = {
                "神殿": row.神殿名称,
                "班级名称": class_name,
                "毕业时间": row.毕业时间,
                "records": [],
            }
        class_stats[class_name]["records"].append(row)
    
    result = []
    for class_name, stats in class_stats.items():
        records = stats["records"]
        archive_count = sum(1 for record in records if record.姓名)
        
        # 计算实际就业人数：回访考核薪资不为0的人数
        employed_records = [
            record
            for record in records
            if record.姓名 and record.回访考核薪资 not in (None, 0)
        ]
        
        # 计算薪资统计
        salaries = [
            salary
            for record in records
            if (salary := _extract_salary(record)) is not None and salary > 0
        ]
        
        actual_avg_salary = int(sum(salaries) / len(salaries)) if salaries else 0
        over10k_count = len([s for s in salaries if s >= 10000])
        
        actual_employed = len(employed_records)
        target_avg_salary = 8000  # 默认目标薪资
        
        # 计算就业率和达标率
        actual_employment_rate = round(actual_employed / archive_count * 100, 2) if archive_count > 0 else 0
        
        # 从配置中心获取班级信息
        config = class_config_map.get(class_name, {})
        
        result.append({
            # 英文字段名
            "id": f"{stats['神殿']}-{class_name}-all",
            "classCode": class_name,
            "campus": stats["神殿"],
            "major": config.get("major", ""),
            "programLength": config.get("programLength", ""),
            "instructor": config.get("instructor", ""),
            "classTeacher": config.get("classTeacher", ""),
            "graduationTime": stats.get("毕业时间") or "",
            "archiveCount": archive_count,
            "needEmploymentCount": archive_count,
            "targetEmploymentCount": archive_count,
            "actualEmploymentCount": actual_employed,
            "targetEmploymentRate": 100.0,
            "actualEmploymentRate": actual_employment_rate,
            "targetNeedEmploymentRate": 100.0,
            "actualNeedEmploymentRate": actual_employment_rate,
            "targetAverageSalary": target_avg_salary,
            "actualAverageSalary": actual_avg_salary,
            "salaryOverTenThousand": over10k_count,
            "year": 0,  # 历史合计时年份为0
            "month": 1,
            # 中文字段名
            "神殿": stats["神殿"],
            "班级名称": class_name,
            "年份": 0,  # 历史合计时年份为0
            "月份": 1,
            "档案人数": archive_count,
            "需就业人数": archive_count,
            "目标就业人数": archive_count,
            "实际就业人数": actual_employed,
            "目标就业率": 100.0,
            "实际就业率": actual_employment_rate,
            "目标需就业率": 100.0,
            "实际需就业率": actual_employment_rate,
            "目标平均薪资": target_avg_salary,
            "实际平均薪资": actual_avg_salary,
            "薪资过万人数": over10k_count,
        })
    
    return result


@router.put("/", response_model=班级就业总结响应, summary="创建或更新班级就业总结")
async def upsert_class_employment_summary(
    summary: 班级就业总结Upsert,
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    创建或更新班级就业总结（如果存在则更新，不存在则创建）
    支持英文字段格式（classCode, campus, year, month等）
    """
    try:
        # 使用header中的神殿，如果没有则使用请求体中的神殿
        target_campus = campus if campus else summary.campus
        
        # 查找是否已存在（根据神殿、班级名称、年份、月份）
        existing_summaries = summary_crud.获取班级就业总结列表(
            db=db,
            神殿=target_campus,
            班级名称=summary.classCode,
            年份=summary.year,
            月份=summary.month,
        )
        
        if existing_summaries and len(existing_summaries) > 0:
            # 更新现有记录
            existing = existing_summaries[0]
            update_data = {
                "神殿": target_campus,
                "班级名称": summary.classCode,
                "年份": summary.year,
                "月份": summary.month,
                "档案人数": summary.archiveCount,
                "需就业人数": summary.needEmploymentCount,
                "目标就业人数": summary.targetEmploymentCount,
                "实际就业人数": summary.actualEmploymentCount,
                "目标就业率": float(summary.targetEmploymentRate),
                "实际就业率": float(summary.actualEmploymentRate),
                "目标需就业率": float(summary.targetNeedEmploymentRate),
                "实际需就业率": float(summary.actualNeedEmploymentRate),
                "目标平均薪资": float(summary.targetAverageSalary),
                "实际平均薪资": float(summary.actualAverageSalary),
                "备注": summary.notes,
            }
            
            db_summary = summary_crud.更新班级就业总结(
                db=db,
                总结ID=existing.总结ID,
                更新数据=update_data
            )
            
            if not db_summary:
                raise HTTPException(status_code=404, detail="更新班级就业总结失败")
        else:
            # 创建新记录
            db_summary = summary_crud.创建班级就业总结(
                db=db,
                神殿=target_campus,
                班级名称=summary.classCode,
                年份=summary.year,
                月份=summary.month,
                档案人数=summary.archiveCount,
                需就业人数=summary.needEmploymentCount,
                目标就业人数=summary.targetEmploymentCount,
                实际就业人数=summary.actualEmploymentCount,
                目标就业率=float(summary.targetEmploymentRate),
                实际就业率=float(summary.actualEmploymentRate),
                目标需就业率=float(summary.targetNeedEmploymentRate),
                实际需就业率=float(summary.actualNeedEmploymentRate),
                目标平均薪资=float(summary.targetAverageSalary),
                实际平均薪资=float(summary.actualAverageSalary),
                备注=summary.notes,
            )
        
        return db_summary.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存班级就业总结失败: {str(e)}") from e


@router.post("/", response_model=班级就业总结响应, summary="创建班级就业总结")
async def create_class_employment_summary(
    summary: 班级就业总结创建,
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    创建班级就业总结记录
    """
    try:
        # 使用header中的神殿，如果没有则使用请求体中的神殿
        target_campus = campus if campus else summary.神殿
        
        db_summary = summary_crud.创建班级就业总结(
            db=db,
            神殿=target_campus,
            班级名称=summary.班级名称,
            年份=summary.年份,
            月份=summary.月份,
            档案人数=summary.档案人数,
            需就业人数=summary.需就业人数,
            目标就业人数=summary.目标就业人数,
            实际就业人数=summary.实际就业人数,
            目标就业率=float(summary.目标就业率),
            实际就业率=float(summary.实际就业率),
            目标需就业率=float(summary.目标需就业率),
            实际需就业率=float(summary.实际需就业率),
            目标平均薪资=float(summary.目标平均薪资),
            实际平均薪资=float(summary.实际平均薪资),
            备注=summary.备注,
        )
        
        return db_summary.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"创建班级就业总结失败: {str(e)}") from e


@router.get("/", summary="获取班级就业总结列表（从教质数据源读取）")
async def get_class_employment_summaries(
    神殿: Optional[str] = Query(None, description="神殿名称"),
    班级名称: Optional[str] = Query(None, description="班级名称"),
    年份: Optional[int] = Query(None, description="年份，不传表示获取所有年份（历史合计）"),
    月份: Optional[int] = Query(None, description="月份"),
    历史合计: bool = Query(False, description="是否返回所有年份的合计数据"),
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db),
    tq_db: Session = Depends(get_teaching_quality_db),
):
    """
    获取班级就业总结列表 - 从教化司的数据源读取
    
    数据来源：
    1. 优先从 teaching_quality.QT班级就业信息汇总表 读取
    2. 若汇总表无数据，则从 teaching_quality.QT班就业信息表 动态生成
    3. 专业、学制、教员、班主任从配置中心获取
    
    参数说明：
    - 年份：指定年份过滤数据
    - 历史合计：如果为 True，则返回所有年份的数据（不过滤年份）
    """
    try:
        # 使用header中的神殿，如果没有则使用query参数
        target_campus = campus if campus else 神殿
        if not target_campus:
            return []
        
        norm = _normalize_campus(target_campus)
        
        # 确定是否需要过滤年份
        # 如果 历史合计=True 或者 年份参数未传，则获取所有年份数据
        filter_by_year = not 历史合计 and 年份 is not None
        target_year = 年份
        
        # 如果需要过滤年份但未指定年份，获取最大年份
        if not 历史合计 and 年份 is None:
            # 不再自动获取最大年份，而是返回所有年份数据
            filter_by_year = False
        
        # 从教质汇总表查询
        query = tq_db.query(QT班级就业信息汇总表).filter(
            or_(
                QT班级就业信息汇总表.神殿名称 == norm,
                QT班级就业信息汇总表.神殿名称 == f"{norm}神殿",
                QT班级就业信息汇总表.神殿名称.ilike(f"{norm}%"),
            )
        )
        
        if filter_by_year and target_year:
            query = query.filter(QT班级就业信息汇总表.年份 == target_year)
        
        if 班级名称:
            query = query.filter(QT班级就业信息汇总表.班级名称 == 班级名称)
        
        summaries = query.order_by(QT班级就业信息汇总表.班级名称).all()
        
        # 若汇总表无数据，从明细表动态生成
        if not summaries:
            if filter_by_year and target_year:
                generated = _generate_summary_from_detail(tq_db, db, target_campus, target_year)
                if generated:
                    return _merge_academic_target_overrides(
                        generated,
                        db=db,
                        campus=target_campus,
                        year=target_year,
                        month=月份,
                        class_name=班级名称,
                    )
            else:
                # 历史合计模式：获取所有年份的数据
                generated = _generate_summary_from_detail_all_years(tq_db, db, target_campus)
                if generated:
                    return _merge_academic_target_overrides(
                        generated,
                        db=db,
                        campus=target_campus,
                        year=None,
                        month=月份,
                        class_name=班级名称,
                    )
        
        # 若教质数据库无数据，从 academic schema 的班级就业总结表获取
        if not summaries:
            return _get_from_academic_schema(db, target_campus, target_year if filter_by_year else None, 班级名称)
        
        # 获取班级配置信息（专业、学制、教员、班主任）
        class_config_map = _get_class_config_map(db, target_campus)
        
        # 从明细表统计薪资过万人数（如果是历史合计则不传年份）
        salary_over_10k_map = _get_salary_over_10k_map_all_years(tq_db, target_campus) if not filter_by_year else (
            _get_salary_over_10k_map(tq_db, target_campus, target_year) if target_year else {}
        )
        
        # 转换为前端期望的格式（同时返回中文和英文字段名以兼容不同前端页面）
        result = []
        for s in summaries:
            class_name = s.班级名称
            config = class_config_map.get(class_name, {})
            over_10k = salary_over_10k_map.get(class_name, 0)
            
            result.append({
                # 英文字段名（供 employment-summary 页面使用）
                "id": str(s.记录ID) if hasattr(s, '记录ID') else f"{s.神殿名称}-{class_name}-{s.年份}",
                "classCode": class_name,
                "campus": s.神殿名称,
                "major": config.get("major", ""),
                "programLength": config.get("programLength", ""),
                "instructor": getattr(s, "教员", None) or config.get("instructor", ""),
                "classTeacher": getattr(s, "班主任", None) or config.get("classTeacher", ""),
                "graduationTime": getattr(s, "毕业时间", None) or f"{s.年份}-01-01",
                "archiveCount": s.结案人数 or 0,
                "needEmploymentCount": s.需就业人数 or 0,
                "targetEmploymentCount": s.需就业人数 or 0,
                "actualEmploymentCount": s.实际就业人数 or 0,
                "targetEmploymentRate": 100.0,
                "actualEmploymentRate": float(s.实际就业率 or 0) * 100 if s.实际就业率 and s.实际就业率 < 1 else float(s.实际就业率 or 0),
                "targetNeedEmploymentRate": 100.0,
                "actualNeedEmploymentRate": float(s.实际需就业率 or 0) * 100 if s.实际需就业率 and s.实际需就业率 < 1 else float(s.实际需就业率 or 0),
                "targetAverageSalary": s.目标平均薪资 or 8000,
                "actualAverageSalary": s.实际平均薪资 or 0,
                "salaryOverTenThousand": over_10k,
                "year": s.年份,
                "month": 1,
                # 中文字段名（供 academic/mgnt/2-employment-summary 页面使用）
                "总结ID": s.记录ID if hasattr(s, '记录ID') else None,
                "神殿": s.神殿名称,
                "班级名称": class_name,
                "年份": s.年份,
                "月份": 1,
                "档案人数": s.结案人数 or 0,
                "需就业人数": s.需就业人数 or 0,
                "目标就业人数": s.需就业人数 or 0,
                "实际就业人数": s.实际就业人数 or 0,
                "目标就业率": 100.0,
                "实际就业率": float(s.实际就业率 or 0) * 100 if s.实际就业率 and s.实际就业率 < 1 else float(s.实际就业率 or 0),
                "目标需就业率": 100.0,
                "实际需就业率": float(s.实际需就业率 or 0) * 100 if s.实际需就业率 and s.实际需就业率 < 1 else float(s.实际需就业率 or 0),
                "目标平均薪资": s.目标平均薪资 or 8000,
                "实际平均薪资": s.实际平均薪资 or 0,
                "薪资过万人数": over_10k,
            })
        
        return _merge_academic_target_overrides(
            result,
            db=db,
            campus=target_campus,
            year=target_year if filter_by_year else None,
            month=月份,
            class_name=班级名称,
        )
    except Exception as e:
        logger.error(f"获取班级就业总结列表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"获取班级就业总结列表失败: {str(e)}") from e


@router.get("/high-salary-stats", summary="获取班级薪资过万人数统计（从教质数据源读取）")
async def get_high_salary_stats(
    神殿: Optional[str] = Query(None, description="神殿名称，不传则获取所有神殿"),
    campus: Optional[str] = Depends(get_campus_from_header),
    tq_db: Session = Depends(get_teaching_quality_db)
):
    """
    获取薪资过万人数统计 - 从教质的就业明细表读取
    - 如果指定神殿：返回 { "班级名称": 薪资过万人数 }
    - 如果不指定神殿：返回 { "神殿名称": { "班级名称": 薪资过万人数 } }
    """
    try:
        # 使用header中的神殿，如果没有则使用query参数
        target_campus = campus if campus else 神殿
        
        if target_campus:
            norm = _normalize_campus(target_campus)
            # 按班级分组统计指定神殿的薪资过万人数
            class_stats_rows = tq_db.query(
                QT班就业信息表.班级名称,
                sql_func.count(QT班就业信息表.记录ID).label("record_count")
            ).filter(
                or_(
                    QT班就业信息表.神殿名称 == norm,
                    QT班就业信息表.神殿名称 == f"{norm}神殿",
                    QT班就业信息表.神殿名称.ilike(f"{norm}%"),
                ),
                QT班就业信息表.回访考核薪资 >= 10000
            ).group_by(QT班就业信息表.班级名称).all()
            
            class_result = {
                row.班级名称: int(row.record_count or 0)
                for row in class_stats_rows
                if row.班级名称
            }
            return class_result
        else:
            # 按神殿和班级分组统计所有神殿的薪资过万人数
            campus_stats_rows = tq_db.query(
                QT班就业信息表.神殿名称,
                QT班就业信息表.班级名称,
                sql_func.count(QT班就业信息表.记录ID).label("record_count")
            ).filter(
                QT班就业信息表.回访考核薪资 >= 10000
            ).group_by(QT班就业信息表.神殿名称, QT班就业信息表.班级名称).all()
            
            campus_result: dict[str, dict[str, int]] = {}
            for row in campus_stats_rows:
                campus_name = row.神殿名称
                if campus_name and row.班级名称:
                    if campus_name not in campus_result:
                        campus_result[campus_name] = {}
                    campus_result[campus_name][row.班级名称] = int(row.record_count or 0)
            return campus_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取薪资过万统计失败: {str(e)}") from e


@router.get("/high-salary-stats-by-campus", summary="获取按神殿汇总的薪资过万人数")
async def get_high_salary_stats_by_campus(
    tq_db: Session = Depends(get_teaching_quality_db)
):
    """
    获取所有神殿的薪资过万人数汇总 - 从教质的就业明细表读取
    返回格式: { "神殿名称": 总薪资过万人数 }
    """
    try:
        # 按神殿分组统计薪资过万人数（回访考核薪资 >= 10000）
        stats = tq_db.query(
            QT班就业信息表.神殿名称,
            sql_func.count(QT班就业信息表.记录ID).label("record_count")
        ).filter(
            QT班就业信息表.回访考核薪资 >= 10000
        ).group_by(QT班就业信息表.神殿名称).all()
        
        result = {
            row.神殿名称: int(row.record_count or 0)
            for row in stats
            if row.神殿名称
        }
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取神殿薪资过万统计失败: {str(e)}") from e


@router.get("/available-years", summary="获取可用的年份列表（从教质数据源读取）")
async def get_available_years(
    神殿: Optional[str] = Query(None, description="神殿名称（可选）"),
    campus: Optional[str] = Depends(get_campus_from_header),
    tq_db: Session = Depends(get_teaching_quality_db),
    db: Session = Depends(get_db),
):
    """
    获取可用的年份列表 - 从教质数据源读取
    """
    try:
        target_campus = campus if campus else 神殿
        
        query = tq_db.query(distinct(QT班级就业信息汇总表.年份))
        
        if target_campus:
            norm = _normalize_campus(target_campus)
            query = query.filter(
                or_(
                    QT班级就业信息汇总表.神殿名称 == norm,
                    QT班级就业信息汇总表.神殿名称 == f"{norm}神殿",
                    QT班级就业信息汇总表.神殿名称.ilike(f"{norm}%"),
                )
            )
        
        years = query.order_by(QT班级就业信息汇总表.年份.desc()).all()
        年份列表 = [int(y[0]) for y in years if y[0] is not None]
        
        # 如果汇总表没有数据，从明细表获取
        if not 年份列表:
            detail_query = tq_db.query(distinct(QT班就业信息表.年份))
            if target_campus:
                norm = _normalize_campus(target_campus)
                detail_query = detail_query.filter(
                    or_(
                        QT班就业信息表.神殿名称 == norm,
                        QT班就业信息表.神殿名称 == f"{norm}神殿",
                        QT班就业信息表.神殿名称.ilike(f"{norm}%"),
                    )
                )
            detail_years = detail_query.order_by(QT班就业信息表.年份.desc()).all()
            年份列表 = [int(y[0]) for y in detail_years if y[0] is not None]
        
        academic_years = summary_crud.获取可用年份列表(db=db, 神殿=target_campus)
        for academic_year in academic_years:
            if academic_year not in 年份列表:
                年份列表.append(int(academic_year))

        # 确保当前年份在列表中
        import datetime
        current_year = datetime.datetime.now().year
        if current_year not in 年份列表:
            年份列表.insert(0, current_year)
        
        return {"年份列表": sorted(年份列表, reverse=True)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取年份列表失败: {str(e)}") from e


@router.get("/historical", summary="获取历史汇总数据（从教质数据源读取）")
async def get_historical_summary(
    神殿: Optional[str] = Query(None, description="神殿名称"),
    campus: Optional[str] = Depends(get_campus_from_header),
    tq_db: Session = Depends(get_teaching_quality_db),
    db: Session = Depends(get_db)
):
    """
    获取历史汇总数据（所有年份合计）- 从教质数据源读取
    """
    try:
        target_campus = campus if campus else 神殿

        rows = await get_class_employment_summaries(
            神殿=target_campus,
            班级名称=None,
            年份=None,
            月份=None,
            历史合计=True,
            campus=campus,
            db=db,
            tq_db=tq_db,
        )

        total_classes = len(rows)
        total_archive = sum(int(row.get("archiveCount") or row.get("档案人数") or 0) for row in rows)
        total_target = sum(int(row.get("targetEmploymentCount") or row.get("目标就业人数") or 0) for row in rows)
        total_employed = sum(int(row.get("actualEmploymentCount") or row.get("实际就业人数") or 0) for row in rows)
        total_salary_over10k = sum(int(row.get("salaryOverTenThousand") or row.get("薪资过万人数") or 0) for row in rows)
        avg_target_salary = (
            round(
                sum(float(row.get("targetAverageSalary") or row.get("目标平均薪资") or 0) for row in rows)
                / total_classes,
                2,
            )
            if total_classes > 0
            else 0.0
        )
        avg_actual_salary = (
            round(
                sum(float(row.get("actualAverageSalary") or row.get("实际平均薪资") or 0) for row in rows)
                / total_classes,
                2,
            )
            if total_classes > 0
            else 0.0
        )
        
        avg_employment_rate = round(total_employed / total_archive * 100, 2) if total_archive > 0 else 0
        avg_achievement_rate = round(avg_actual_salary / avg_target_salary * 100, 2) if avg_target_salary > 0 else 0
        
        return {
            "totalClasses": total_classes,
            "totalArchiveCount": total_archive,
            "totalTargetEmployment": total_target,
            "totalActualEmployment": total_employed,
            "avgTargetSalary": avg_target_salary,
            "avgActualSalary": avg_actual_salary,
            "avgEmploymentRate": avg_employment_rate,
            "avgAchievementRate": avg_achievement_rate,
            "totalSalaryOver10k": total_salary_over10k,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取历史汇总数据失败: {str(e)}") from e


@router.get("/{id}", response_model=班级就业总结响应, summary="获取班级就业总结详情")
async def get_class_employment_summary(
    id: int,
    db: Session = Depends(get_db)
):
    """
    根据ID获取班级就业总结详情
    """
    try:
        summary = summary_crud.获取班级就业总结(db=db, 总结ID=id)
        if not summary:
            raise HTTPException(status_code=404, detail="班级就业总结未找到")
        return summary.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取班级就业总结详情失败: {str(e)}") from e


@router.put("/{id}", response_model=班级就业总结响应, summary="更新或创建班级就业总结")
async def update_class_employment_summary(
    id: int,
    summary: 班级就业总结更新,
    campus: Optional[str] = Depends(get_campus_from_header),
    db: Session = Depends(get_db)
):
    """
    更新或创建班级就业总结（如果记录不存在则创建，存在则更新）
    支持upsert操作，避免404错误
    """
    try:
        # 使用header中的神殿，如果没有则使用请求体中的神殿
        target_campus = campus if campus else (summary.神殿 if summary.神殿 else None)

        logger.debug(f"[PUT /class-employment-summary/{id}] 开始处理")
        logger.debug(f"[PUT /class-employment-summary/{id}] 请求数据: 神殿={summary.神殿}, 班级名称={summary.班级名称}, 年份={summary.年份}, 月份={summary.月份}")
        logger.debug(f"[PUT /class-employment-summary/{id}] Header神殿: {campus}, 目标神殿: {target_campus}")
        
        # 准备更新数据并转换Decimal类型
        update_data = summary.model_dump(exclude_unset=True)
        decimal_fields = ['目标就业率', '实际就业率', '目标需就业率', '实际需就业率', '目标平均薪资', '实际平均薪资']
        for field in decimal_fields:
            if field in update_data and update_data[field] is not None:
                update_data[field] = float(update_data[field])
        
        # 1. 首先尝试根据总结ID查找
        existing = summary_crud.获取班级就业总结(db=db, 总结ID=id)
        
        if existing:
            logger.debug(f"[PUT /class-employment-summary/{id}] 根据ID找到记录")
            db_summary = summary_crud.更新班级就业总结(db=db, 总结ID=id, 更新数据=update_data)
            if not db_summary:
                raise HTTPException(status_code=500, detail="更新班级就业总结失败")
            return db_summary.to_dict()
        
        # 2. ID不存在，尝试根据业务键（神殿+班级名称+年份+月份）查找
        logger.debug(f"[PUT /class-employment-summary/{id}] 根据ID未找到，尝试业务键查找")
        
        if target_campus and summary.班级名称 and summary.年份 and summary.月份:
            existing_by_key = summary_crud.获取班级就业总结列表(
                db=db,
                神殿=target_campus,
                班级名称=summary.班级名称,
                年份=summary.年份,
                月份=summary.月份,
            )
            
            if existing_by_key and len(existing_by_key) > 0:
                logger.debug(f"[PUT /class-employment-summary/{id}] 根据业务键找到记录，更新")
                existing = existing_by_key[0]
                db_summary = summary_crud.更新班级就业总结(
                    db=db, 
                    总结ID=existing.总结ID, 
                    更新数据=update_data
                )
                if not db_summary:
                    raise HTTPException(status_code=500, detail="更新班级就业总结失败")
                return db_summary.to_dict()
        
        # 3. 都找不到，检查是否有足够的信息创建新记录
        if not target_campus or not summary.班级名称 or not summary.年份 or not summary.月份:
            # 记录详细的缺失字段信息
            missing_fields = []
            if not target_campus:
                missing_fields.append("神殿")
            if not summary.班级名称:
                missing_fields.append("班级名称")
            if not summary.年份:
                missing_fields.append("年份")
            if not summary.月份:
                missing_fields.append("月份")
            
            raise HTTPException(
                status_code=404, 
                detail=f"班级就业总结未找到（总结ID: {id}），且无法创建新记录（缺少必要字段：{', '.join(missing_fields)}）"
            )
        
        # 4. 创建新记录
        logger.debug(f"[PUT /class-employment-summary/{id}] 创建新记录: 神殿={target_campus}, 班级={summary.班级名称}")
        db_summary = summary_crud.创建班级就业总结(
            db=db,
            神殿=target_campus,
            班级名称=summary.班级名称,
            年份=summary.年份,
            月份=summary.月份,
            档案人数=summary.档案人数 or 0,
            需就业人数=summary.需就业人数 or 0,
            目标就业人数=summary.目标就业人数 or 0,
            实际就业人数=summary.实际就业人数 or 0,
            目标就业率=float(summary.目标就业率) if summary.目标就业率 is not None else 100.0,
            实际就业率=float(summary.实际就业率) if summary.实际就业率 is not None else 0.0,
            目标需就业率=float(summary.目标需就业率) if summary.目标需就业率 is not None else 100.0,
            实际需就业率=float(summary.实际需就业率) if summary.实际需就业率 is not None else 0.0,
            目标平均薪资=float(summary.目标平均薪资) if summary.目标平均薪资 is not None else 0.0,
            实际平均薪资=float(summary.实际平均薪资) if summary.实际平均薪资 is not None else 0.0,
            备注=summary.备注,
        )
        logger.debug(f"[PUT /class-employment-summary/{id}] 创建成功，新ID={db_summary.总结ID}")
        return db_summary.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"保存班级就业总结失败: {str(e)}\n{traceback.format_exc()}"
        logger.error(f"[PUT /class-employment-summary/{id}] 异常: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail) from e


@router.delete("/by-key", summary="根据业务键删除班级就业总结")
async def delete_class_employment_summary_by_key(
    神殿: str = Query(..., description="神殿名称"),
    班级名称: str = Query(..., description="班级名称"),
    年份: int = Query(..., description="年份"),
    月份: int = Query(..., description="月份"),
    db: Session = Depends(get_db)
):
    """
    根据业务键（神殿+班级名称+年份+月份）删除班级就业总结
    当前端没有可靠的数据库ID时使用此接口
    """
    try:
        logger.debug(f"[DELETE /by-key] 删除请求: 神殿={神殿}, 班级名称={班级名称}, 年份={年份}, 月份={月份}")
        
        success = summary_crud.根据业务键删除班级就业总结(
            db=db,
            神殿=神殿,
            班级名称=班级名称,
            年份=年份,
            月份=月份,
        )
        
        if not success:
            raise HTTPException(
                status_code=404, 
                detail=f"班级就业总结未找到（神殿: {神殿}, 班级: {班级名称}, 年份: {年份}, 月份: {月份}）"
            )
        
        return {"message": "删除成功", "神殿": 神殿, "班级名称": 班级名称, "年份": 年份, "月份": 月份}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"删除班级就业总结失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail) from e


@router.delete("/{id}", summary="删除班级就业总结")
async def delete_class_employment_summary(
    id: int,
    db: Session = Depends(get_db)
):
    """
    删除班级就业总结
    """
    try:
        # 先检查记录是否存在，提供更详细的错误信息
        existing = summary_crud.获取班级就业总结(db=db, 总结ID=id)
        if not existing:
            raise HTTPException(
                status_code=404, 
                detail=f"班级就业总结未找到（总结ID: {id}）"
            )
        
        # 执行删除
        success = summary_crud.删除班级就业总结(db=db, 总结ID=id)
        if not success:
            raise HTTPException(status_code=500, detail="删除操作失败")
        return {"message": "删除成功", "总结ID": id}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"删除班级就业总结失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail) from e
