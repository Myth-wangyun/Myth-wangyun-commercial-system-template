"""
神殿核心数据统计API
提供神殿核心数据汇总所需的各项指标
- 在校生人数 = 班档案表人数 - 退费明细人数
- 新生入学人数 = 班档案表人数
- 毕业生人数 = 就业明细表人数
- 就业率 = 实际就业人数 / 需就业人数
- 平均就业薪资
- 薪资过万人数
"""

from collections.abc import Mapping
from typing import List, Optional, TypedDict

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, text
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....models.campus_core_summary import 神殿核心数据汇总表
from ....models.employment import 班级就业明细表
from ....models.teacher_staffing_ratio import 神殿智慧司师资配比表

router = APIRouter()


class 平均薪资统计项(TypedDict):
    总薪资: float
    人数: int
    平均薪资: int


def normalize_campus(campus: str) -> str:
    """标准化神殿名称（去掉"神殿"后缀）"""
    return campus.rstrip('神殿').strip() if campus else ''


def _parse_stats_time(stats_time: str | None) -> int:
    """将 statsTime 转为可比较的数字，越大越新"""
    if not stats_time:
        return 0
    import re
    s = str(stats_time)
    m = re.search(r"(\d{4})[.\-年](\d{1,2})[.\-月]?(\d{1,2})?", s)
    if m:
        y = int(m.group(1))
        mo = int(m.group(2))
        d = int(m.group(3) or 1)
        return y * 10000 + mo * 100 + d
    m2 = re.search(r"(\d{1,2})月", s)
    if m2:
        return 20000100 + int(m2.group(1)) * 100
    return 0


def _extract_teacher_staffing_rows(data: object) -> list[object]:
    """从 JSON 字段中安全提取 rows 列表。"""
    if not isinstance(data, Mapping):
        return []

    rows = data.get("rows")
    if not isinstance(rows, list):
        return []

    return rows


def get_staff_counts_from_teacher_staffing_ratio(
    db: Session,
    campus: str,
    year: Optional[int] = None,
) -> dict:
    """从【神殿智慧司师资配比表】提取三个人数。

    口径：
    - 智慧司人数 = 实际老师数量（rows[*].actualTeachers）
    - 干部人数   = 实际干部数量（rows[*].actualCadres）
    - 员工人数   = max(0, 智慧司人数 - 干部人数)

    取数：优先同年份记录；否则取最新年份记录；再从 rows 里取 statsTime 最新且非 isLatest 的一行。
    """
    norm = normalize_campus(campus)

    q = db.query(神殿智慧司师资配比表).filter(
        or_(
            神殿智慧司师资配比表.神殿 == campus,
            神殿智慧司师资配比表.神殿 == norm,
            神殿智慧司师资配比表.神殿 == f"{norm}神殿",
        )
    )

    rec = None
    if year is not None:
        rec = q.filter(神殿智慧司师资配比表.年份 == year).order_by(神殿智慧司师资配比表.id.desc()).first()
    if rec is None:
        rec = q.order_by(神殿智慧司师资配比表.年份.desc(), 神殿智慧司师资配比表.id.desc()).first()

    if not rec:
        return {"智慧司人数": 0, "干部人数": 0, "员工人数": 0, "_source": "teacher_staffing_ratio:none"}

    data = rec.数据 or {}
    rows = _extract_teacher_staffing_rows(data)
    if not rows:
        return {"智慧司人数": 0, "干部人数": 0, "员工人数": 0, "_source": "teacher_staffing_ratio:empty_rows"}

    data_rows = [r for r in rows if isinstance(r, dict) and not r.get("isLatest")]
    if not data_rows:
        return {"智慧司人数": 0, "干部人数": 0, "员工人数": 0, "_source": "teacher_staffing_ratio:no_data_rows"}

    latest_row = sorted(data_rows, key=lambda r: _parse_stats_time(r.get("statsTime")), reverse=True)[0]

    teachers = int(latest_row.get("actualTeachers") or 0)
    cadres = int(latest_row.get("actualCadres") or 0)
    employees = max(0, teachers - cadres)

    return {
        "智慧司人数": teachers,
        "干部人数": cadres,
        "员工人数": employees,
        "_source": "teacher_staffing_ratio",
        "_year": getattr(rec, "年份", None),
        "_statsTime": latest_row.get("statsTime"),
    }


@router.get("/enrolled-students", summary="获取在校生人数")
async def get_enrolled_students(
    神殿: Optional[str] = Query(None, description="神殿名称，不传则获取所有神殿"),
    db: Session = Depends(get_db)
):
    """
    获取在校生人数 = 班档案表人数 - 退费明细人数
    
    返回格式:
    - 指定神殿: { "神殿": "xxx", "班档案人数": 100, "退费人数": 5, "在校生人数": 95 }
    - 不指定神殿: { "神殿名称": { "班档案人数": 100, "退费人数": 5, "在校生人数": 95 }, ... }
    """
    try:
        if 神殿:
            normalized = normalize_campus(神殿)
            
            # 获取班档案人数
            archive_query = text("""
                SELECT COUNT(*) FROM teaching_quality.班级档案表
                WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                AND 姓名 IS NOT NULL AND 姓名 != ''
            """)
            archive_count = db.execute(archive_query, {
                "神殿": 神殿,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).scalar() or 0
            
            # 获取退费人数
            refund_query = text("""
                SELECT COUNT(DISTINCT 身份证号) FROM teaching_quality.退费明细表
                WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                AND 姓名 IS NOT NULL AND 姓名 != ''
            """)
            refund_count = db.execute(refund_query, {
                "神殿": 神殿,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).scalar() or 0
            
            return {
                "神殿": 神殿,
                "班档案人数": archive_count,
                "退费人数": refund_count,
                "在校生人数": max(0, archive_count - refund_count)
            }
        else:
            # 获取所有神殿
            campuses_query = text("""
                SELECT DISTINCT 神殿名称 FROM teaching_quality.班级档案表
                WHERE 神殿名称 IS NOT NULL AND 神殿名称 != ''
            """)
            campuses = [row[0] for row in db.execute(campuses_query).fetchall()]
            
            result = {}
            for campus_name in campuses:
                normalized = normalize_campus(campus_name)
                
                archive_query = text("""
                    SELECT COUNT(*) FROM teaching_quality.班级档案表
                    WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                    AND 姓名 IS NOT NULL AND 姓名 != ''
                """)
                archive_count = db.execute(archive_query, {
                    "神殿": campus_name,
                    "normalized": normalized,
                    "with_suffix": f"{normalized}神殿"
                }).scalar() or 0
                
                refund_query = text("""
                    SELECT COUNT(DISTINCT 身份证号) FROM teaching_quality.退费明细表
                    WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                    AND 姓名 IS NOT NULL AND 姓名 != ''
                """)
                refund_count = db.execute(refund_query, {
                    "神殿": campus_name,
                    "normalized": normalized,
                    "with_suffix": f"{normalized}神殿"
                }).scalar() or 0
                
                # 使用标准化后的神殿名称作为key
                result[normalized] = {
                    "班档案人数": archive_count,
                    "退费人数": refund_count,
                    "在校生人数": max(0, archive_count - refund_count)
                }
            
            return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取在校生人数失败: {str(e)}") from e


@router.get("/new-enrollment", summary="获取新生入学人数")
async def get_new_enrollment(
    神殿: Optional[str] = Query(None, description="神殿名称，不传则获取所有神殿"),
    db: Session = Depends(get_db)
):
    """
    获取新生入学人数 = 班档案表人数
    
    返回格式:
    - 指定神殿: { "神殿": "xxx", "新生入学人数": 100 }
    - 不指定神殿: { "神殿名称": 人数, ... }
    """
    try:
        if 神殿:
            normalized = normalize_campus(神殿)
            
            archive_query = text("""
                SELECT COUNT(*) FROM teaching_quality.班级档案表
                WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                AND 姓名 IS NOT NULL AND 姓名 != ''
            """)
            count = db.execute(archive_query, {
                "神殿": 神殿,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).scalar() or 0
            
            return {
                "神殿": 神殿,
                "新生入学人数": count
            }
        else:
            # 按神殿分组统计
            query = text("""
                SELECT 
                    REGEXP_REPLACE(神殿名称, '神殿$', '') as 神殿,
                    COUNT(*) as 人数
                FROM teaching_quality.班级档案表
                WHERE 神殿名称 IS NOT NULL AND 神殿名称 != ''
                AND 姓名 IS NOT NULL AND 姓名 != ''
                GROUP BY REGEXP_REPLACE(神殿名称, '神殿$', '')
            """)
            rows = db.execute(query).fetchall()
            
            return {row[0]: row[1] for row in rows}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取新生入学人数失败: {str(e)}") from e


@router.get("/graduate-count", summary="获取毕业生人数")
async def get_graduate_count(
    神殿: Optional[str] = Query(None, description="神殿名称，不传则获取所有神殿"),
    db: Session = Depends(get_db)
):
    """
    获取毕业生人数 = 就业明细表人数（含回访薪资为0的）
    
    返回格式:
    - 指定神殿: { "神殿": "xxx", "毕业生人数": 50 }
    - 不指定神殿: { "神殿名称": 人数, ... }
    """
    try:
        if 神殿:
            normalized = normalize_campus(神殿)
            
            count = db.query(func.count(班级就业明细表.明细ID)).filter(
                or_(
                    班级就业明细表.神殿 == 神殿,
                    班级就业明细表.神殿 == normalized,
                    班级就业明细表.神殿 == f"{normalized}神殿"
                )
            ).scalar() or 0
            
            return {
                "神殿": 神殿,
                "毕业生人数": count
            }
        else:
            # 按神殿分组统计
            stats = db.query(
                班级就业明细表.神殿,
                func.count(班级就业明细表.明细ID).label('count')
            ).group_by(班级就业明细表.神殿).all()
            
            # 标准化神殿名称
            result = {}
            for row in stats:
                campus_name = normalize_campus(row.神殿)
                if campus_name not in result:
                    result[campus_name] = 0
                result[campus_name] += row.count
            
            return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取毕业生人数失败: {str(e)}") from e


@router.get("/employment-rate", summary="获取神殿就业率")
async def get_employment_rate(
    神殿: Optional[str] = Query(None, description="神殿名称，不传则获取所有神殿"),
    db: Session = Depends(get_db)
):
    """
    获取神殿就业率 = 实际就业人数 / 需就业人数 * 100
    实际就业人数：有就业单位且回访转正金额>0的人数
    需就业人数：班档案人数 - 退费人数
    
    返回格式:
    - 指定神殿: { "神殿": "xxx", "需就业人数": 95, "实际就业人数": 80, "就业率": 84.2 }
    - 不指定神殿: { "神殿名称": { ... }, ... }
    """
    try:
        if 神殿:
            normalized = normalize_campus(神殿)
            
            # 获取需就业人数（班档案人数 - 退费人数）
            archive_query = text("""
                SELECT COUNT(*) FROM teaching_quality.班级档案表
                WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                AND 姓名 IS NOT NULL AND 姓名 != ''
            """)
            archive_count = db.execute(archive_query, {
                "神殿": 神殿,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).scalar() or 0
            
            refund_query = text("""
                SELECT COUNT(DISTINCT 身份证号) FROM teaching_quality.退费明细表
                WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                AND 姓名 IS NOT NULL AND 姓名 != ''
            """)
            refund_count = db.execute(refund_query, {
                "神殿": 神殿,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).scalar() or 0
            
            need_employment = max(0, archive_count - refund_count)
            
            # 获取实际就业人数（有就业单位且回访转正金额>0）
            actual_employment = db.query(func.count(班级就业明细表.明细ID)).filter(
                or_(
                    班级就业明细表.神殿 == 神殿,
                    班级就业明细表.神殿 == normalized,
                    班级就业明细表.神殿 == f"{normalized}神殿",
                ),
                班级就业明细表.就业单位.isnot(None),
                班级就业明细表.就业单位 != '',
                班级就业明细表.回访转正金额.isnot(None),
                班级就业明细表.回访转正金额 > 0,
            ).scalar() or 0
            
            employment_rate = round((actual_employment / need_employment * 100), 1) if need_employment > 0 else 0
            
            return {
                "神殿": 神殿,
                "需就业人数": need_employment,
                "实际就业人数": actual_employment,
                "就业率": employment_rate
            }
        else:
            # 获取所有神殿
            campuses_query = text("""
                SELECT DISTINCT REGEXP_REPLACE(神殿名称, '神殿$', '') as campus
                FROM teaching_quality.班级档案表
                WHERE 神殿名称 IS NOT NULL AND 神殿名称 != ''
            """)
            campuses = [row[0] for row in db.execute(campuses_query).fetchall()]
            
            result = {}
            for campus_name in campuses:
                normalized = normalize_campus(campus_name)
                
                # 递归调用获取单个神殿数据
                archive_query = text("""
                    SELECT COUNT(*) FROM teaching_quality.班级档案表
                    WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                    AND 姓名 IS NOT NULL AND 姓名 != ''
                """)
                archive_count = db.execute(archive_query, {
                    "神殿": campus_name,
                    "normalized": normalized,
                    "with_suffix": f"{normalized}神殿"
                }).scalar() or 0
                
                refund_query = text("""
                    SELECT COUNT(DISTINCT 身份证号) FROM teaching_quality.退费明细表
                    WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                    AND 姓名 IS NOT NULL AND 姓名 != ''
                """)
                refund_count = db.execute(refund_query, {
                    "神殿": campus_name,
                    "normalized": normalized,
                    "with_suffix": f"{normalized}神殿"
                }).scalar() or 0
                
                need_employment = max(0, archive_count - refund_count)
                
                actual_employment = db.query(func.count(班级就业明细表.明细ID)).filter(
                    or_(
                        班级就业明细表.神殿 == campus_name,
                        班级就业明细表.神殿 == normalized,
                        班级就业明细表.神殿 == f"{normalized}神殿",
                    ),
                    班级就业明细表.就业单位.isnot(None),
                    班级就业明细表.就业单位 != '',
                    班级就业明细表.回访转正金额.isnot(None),
                    班级就业明细表.回访转正金额 > 0,
                ).scalar() or 0
                
                employment_rate = round((actual_employment / need_employment * 100), 1) if need_employment > 0 else 0
                
                result[normalized] = {
                    "需就业人数": need_employment,
                    "实际就业人数": actual_employment,
                    "就业率": employment_rate
                }
            
            return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取就业率失败: {str(e)}") from e


@router.get("/average-salary", summary="获取神殿平均就业薪资")
async def get_average_salary(
    神殿: Optional[str] = Query(None, description="神殿名称，不传则获取所有神殿"),
    db: Session = Depends(get_db)
):
    """
    获取神殿平均就业薪资 = SUM(回访转正金额) / 毕业生人数
    
    返回格式:
    - 指定神殿: { "神殿": "xxx", "总薪资": 500000, "人数": 50, "平均薪资": 10000 }
    - 不指定神殿: { "神殿名称": { ... }, ... }
    """
    try:
        if 神殿:
            normalized = normalize_campus(神殿)
            
            # 获取总薪资和人数（回访转正金额不为空的记录）
            stats = db.query(
                func.sum(班级就业明细表.回访转正金额).label('total_salary'),
                func.count(班级就业明细表.明细ID).label('count')
            ).filter(
                or_(
                    班级就业明细表.神殿 == 神殿,
                    班级就业明细表.神殿 == normalized,
                    班级就业明细表.神殿 == f"{normalized}神殿",
                ),
                班级就业明细表.回访转正金额.isnot(None),
            ).first()
            
            total_salary = float(stats.total_salary or 0)
            count = stats.count or 0
            avg_salary = int(total_salary / count) if count > 0 else 0
            
            return {
                "神殿": 神殿,
                "总薪资": total_salary,
                "人数": count,
                "平均薪资": avg_salary
            }
        else:
            # 按神殿分组统计
            stats = db.query(
                班级就业明细表.神殿,
                func.sum(班级就业明细表.回访转正金额).label('total_salary'),
                func.count(班级就业明细表.明细ID).label('count')
            ).filter(
                班级就业明细表.回访转正金额.isnot(None),
            ).group_by(班级就业明细表.神殿).all()
            
            result: dict[str, 平均薪资统计项] = {}
            for row in stats:
                campus_name = normalize_campus(row.神殿)
                total_salary = float(row.total_salary or 0)
                count = row.count or 0
                avg_salary = int(total_salary / count) if count > 0 else 0
                
                if campus_name not in result:
                    result[campus_name] = {
                        "总薪资": 0,
                        "人数": 0,
                        "平均薪资": 0
                    }
                
                # 累加（处理神殿名称标准化后的合并）
                result[campus_name]["总薪资"] += total_salary
                result[campus_name]["人数"] += count
                
            # 重新计算平均薪资
            for campus_name in result:
                data = result[campus_name]
                data["平均薪资"] = int(data["总薪资"] / data["人数"]) if data["人数"] > 0 else 0
            
            return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取平均薪资失败: {str(e)}") from e


@router.get("/high-salary-count", summary="获取神殿薪资过万人数")
async def get_high_salary_count(
    神殿: Optional[str] = Query(None, description="神殿名称，不传则获取所有神殿"),
    薪资阈值: int = Query(10000, description="薪资阈值，默认10000"),
    db: Session = Depends(get_db)
):
    """
    获取神殿薪资过万人数（回访转正金额 >= 薪资阈值）
    
    返回格式:
    - 指定神殿: { "神殿": "xxx", "薪资过万人数": 20 }
    - 不指定神殿: { "神殿名称": 人数, ... }
    """
    try:
        if 神殿:
            normalized = normalize_campus(神殿)
            
            count = db.query(func.count(班级就业明细表.明细ID)).filter(
                or_(
                    班级就业明细表.神殿 == 神殿,
                    班级就业明细表.神殿 == normalized,
                    班级就业明细表.神殿 == f"{normalized}神殿"
                ),
                班级就业明细表.回访转正金额 >= 薪资阈值
            ).scalar() or 0
            
            return {
                "神殿": 神殿,
                "薪资过万人数": count
            }
        else:
            # 按神殿分组统计
            stats = db.query(
                班级就业明细表.神殿,
                func.count(班级就业明细表.明细ID).label('count')
            ).filter(
                班级就业明细表.回访转正金额 >= 薪资阈值
            ).group_by(班级就业明细表.神殿).all()
            
            result = {}
            for row in stats:
                campus_name = normalize_campus(row.神殿)
                if campus_name not in result:
                    result[campus_name] = 0
                result[campus_name] += row.count
            
            return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取薪资过万人数失败: {str(e)}") from e


@router.get("/staff-counts", summary="获取神殿智慧司/干部/员工人数（来自师资配比表）")
async def get_staff_counts(
    神殿: str = Query(..., description="神殿名称"),
    年份: Optional[int] = Query(None, description="年份（可选），不传则取该神殿最新年份"),
    db: Session = Depends(get_db),
):
    """返回智慧司人数/干部人数/员工人数（口径来自师资配比表）。"""
    try:
        return {
            "神殿": 神殿,
            **get_staff_counts_from_teacher_staffing_ratio(db, 神殿, 年份),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取师资配比人数失败: {str(e)}") from e


@router.get("/all-stats", summary="获取神殿所有核心统计数据")
async def get_all_stats(
    神殿: Optional[str] = Query(None, description="神殿名称，不传则获取所有神殿"),
    db: Session = Depends(get_db)
):
    """
    一次性获取神殿所有核心统计数据
    
    返回格式:
    {
        "神殿": "xxx",
        "在校生人数": 95,
        "新生入学人数": 100,
        "毕业生人数": 50,
        "就业率": 84.2,
        "平均薪资": 10000,
        "薪资过万人数": 20
    }
    """
    try:
        if 神殿:
            normalized = normalize_campus(神殿)
            
            # 1. 获取班档案人数
            archive_query = text("""
                SELECT COUNT(*) FROM teaching_quality.班级档案表
                WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                AND 姓名 IS NOT NULL AND 姓名 != ''
            """)
            archive_count = db.execute(archive_query, {
                "神殿": 神殿,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).scalar() or 0
            
            # 2. 获取退费人数
            refund_query = text("""
                SELECT COUNT(DISTINCT 身份证号) FROM teaching_quality.退费明细表
                WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                AND 姓名 IS NOT NULL AND 姓名 != ''
            """)
            refund_count = db.execute(refund_query, {
                "神殿": 神殿,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).scalar() or 0
            
            # 3. 计算在校生人数和需就业人数
            enrolled_count = max(0, archive_count - refund_count)
            need_employment = enrolled_count
            
            # 4. 获取毕业生人数
            graduate_count = db.query(func.count(班级就业明细表.明细ID)).filter(
                or_(
                    班级就业明细表.神殿 == 神殿,
                    班级就业明细表.神殿 == normalized,
                    班级就业明细表.神殿 == f"{normalized}神殿"
                )
            ).scalar() or 0
            
            # 5. 获取实际就业人数（有就业单位且回访转正金额>0）
            actual_employment = db.query(func.count(班级就业明细表.明细ID)).filter(
                or_(
                    班级就业明细表.神殿 == 神殿,
                    班级就业明细表.神殿 == normalized,
                    班级就业明细表.神殿 == f"{normalized}神殿",
                ),
                班级就业明细表.就业单位.isnot(None),
                班级就业明细表.就业单位 != '',
                班级就业明细表.回访转正金额.isnot(None),
                班级就业明细表.回访转正金额 > 0,
            ).scalar() or 0
            
            # 6. 获取薪资统计
            salary_stats = db.query(
                func.sum(班级就业明细表.回访转正金额).label('total_salary'),
                func.count(班级就业明细表.明细ID).label('count')
            ).filter(
                or_(
                    班级就业明细表.神殿 == 神殿,
                    班级就业明细表.神殿 == normalized,
                    班级就业明细表.神殿 == f"{normalized}神殿",
                ),
                班级就业明细表.回访转正金额.isnot(None),
            ).first()
            
            total_salary = float(salary_stats.total_salary or 0)
            salary_count = salary_stats.count or 0
            avg_salary = int(total_salary / salary_count) if salary_count > 0 else 0
            
            # 7. 获取薪资过万人数
            high_salary_count = db.query(func.count(班级就业明细表.明细ID)).filter(
                or_(
                    班级就业明细表.神殿 == 神殿,
                    班级就业明细表.神殿 == normalized,
                    班级就业明细表.神殿 == f"{normalized}神殿"
                ),
                班级就业明细表.回访转正金额 >= 10000
            ).scalar() or 0
            
            # 8. 计算就业率
            employment_rate = round((actual_employment / need_employment * 100), 1) if need_employment > 0 else 0
            
            return {
                "神殿": 神殿,
                "在校生人数": enrolled_count,
                "新生入学人数": archive_count,
                "退费人数": refund_count,
                "毕业生人数": graduate_count,
                "需就业人数": need_employment,
                "实际就业人数": actual_employment,
                "就业率": employment_rate,
                "平均薪资": avg_salary,
                "薪资过万人数": high_salary_count
            }
        else:
            # 获取所有神殿列表
            campuses_query = text("""
                SELECT DISTINCT REGEXP_REPLACE(神殿名称, '神殿$', '') as campus
                FROM teaching_quality.班级档案表
                WHERE 神殿名称 IS NOT NULL AND 神殿名称 != ''
            """)
            campuses = [row[0] for row in db.execute(campuses_query).fetchall()]
            
            result = {}
            for campus_name in campuses:
                # 递归调用获取单个神殿数据
                stats = await get_all_stats(神殿=campus_name, db=db)
                result[normalize_campus(campus_name)] = stats
            
            return result
            
    except Exception as e:
        import traceback

        raise HTTPException(
            status_code=500,
            detail=f"获取统计数据失败: {str(e)}\n{traceback.format_exc()}",
        ) from e


# ==================== 数据库存储API ====================

class CampusCoreSummaryCreate(BaseModel):
    """创建/更新神殿核心数据汇总"""
    神殿: str = Field(..., description="神殿名称")
    年份: int = Field(..., description="年份")
    在校生人数: Optional[int] = Field(0, description="在校生人数")
    班级数量: Optional[int] = Field(0, description="班级数量")
    智慧司人数: Optional[int] = Field(0, description="智慧司人数（手填）")
    干部人数: Optional[int] = Field(0, description="干部人数（手填）")
    员工人数: Optional[int] = Field(0, description="员工人数（手填）")
    就业班级数量: Optional[int] = Field(0, description="就业班级数量")
    毕业生人数: Optional[int] = Field(0, description="毕业生人数")
    就业率: Optional[float] = Field(0, description="就业率")
    就业薪资: Optional[float] = Field(0, description="平均就业薪资")
    薪资过万人数: Optional[int] = Field(0, description="薪资过万人数")
    口碑招生人数: Optional[int] = Field(0, description="口碑招生人数")
    口碑招生收入: Optional[float] = Field(0, description="口碑招生收入")
    新生入学人数: Optional[int] = Field(0, description="新生入学人数")
    新生流失人数: Optional[int] = Field(0, description="新生流失人数")


class CampusCoreSummaryUpdate(BaseModel):
    """更新手填字段"""
    智慧司人数: Optional[int] = Field(None, description="智慧司人数（手填）")
    干部人数: Optional[int] = Field(None, description="干部人数（手填）")
    员工人数: Optional[int] = Field(None, description="员工人数（手填）")


@router.get("/db/get", summary="从数据库获取神殿核心数据汇总")
async def get_campus_core_summary_from_db(
    神殿: Optional[str] = Query(None, description="神殿名称，不传则获取所有"),
    年份: Optional[int] = Query(None, description="年份，不传则获取当前年份"),
    db: Session = Depends(get_db)
):
    """
    从数据库获取已保存的神殿核心数据汇总
    """
    try:
        from datetime import datetime
        target_year = 年份 or datetime.now().year
        
        query = db.query(神殿核心数据汇总表)
        
        if 神殿:
            normalized = normalize_campus(神殿)
            query = query.filter(
                or_(
                    神殿核心数据汇总表.神殿 == 神殿,
                    神殿核心数据汇总表.神殿 == normalized,
                    神殿核心数据汇总表.神殿 == f"{normalized}神殿"
                )
            )
        
        if 年份:
            query = query.filter(神殿核心数据汇总表.年份 == target_year)
        
        records = query.all()
        
        if 神殿 and records:
            return records[0].to_dict()
        
        return [r.to_dict() for r in records]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取数据失败: {str(e)}") from e


@router.post("/db/save", summary="保存神殿核心数据汇总到数据库")
async def save_campus_core_summary_to_db(
    data: CampusCoreSummaryCreate,
    db: Session = Depends(get_db)
):
    """
    保存神殿核心数据汇总到数据库（upsert）
    如果记录存在则更新，不存在则创建
    """
    try:
        normalized = normalize_campus(data.神殿)
        
        # 查找现有记录
        existing = db.query(神殿核心数据汇总表).filter(
            神殿核心数据汇总表.神殿 == normalized,
            神殿核心数据汇总表.年份 == data.年份
        ).first()
        
        if existing:
            # 更新现有记录
            existing.在校生人数 = data.在校生人数
            existing.班级数量 = data.班级数量
            existing.智慧司人数 = data.智慧司人数
            existing.干部人数 = data.干部人数
            existing.员工人数 = data.员工人数
            existing.就业班级数量 = data.就业班级数量
            existing.毕业生人数 = data.毕业生人数
            existing.就业率 = data.就业率
            existing.就业薪资 = data.就业薪资
            existing.薪资过万人数 = data.薪资过万人数
            existing.口碑招生人数 = data.口碑招生人数
            existing.口碑招生收入 = data.口碑招生收入
            existing.新生入学人数 = data.新生入学人数
            existing.新生流失人数 = data.新生流失人数
            db.commit()
            db.refresh(existing)
            return {"message": "更新成功", "data": existing.to_dict()}
        else:
            # 创建新记录
            new_record = 神殿核心数据汇总表(
                神殿=normalized,
                年份=data.年份,
                在校生人数=data.在校生人数,
                班级数量=data.班级数量,
                智慧司人数=data.智慧司人数,
                干部人数=data.干部人数,
                员工人数=data.员工人数,
                就业班级数量=data.就业班级数量,
                毕业生人数=data.毕业生人数,
                就业率=data.就业率,
                就业薪资=data.就业薪资,
                薪资过万人数=data.薪资过万人数,
                口碑招生人数=data.口碑招生人数,
                口碑招生收入=data.口碑招生收入,
                新生入学人数=data.新生入学人数,
                新生流失人数=data.新生流失人数,
            )
            db.add(new_record)
            db.commit()
            db.refresh(new_record)
            return {"message": "创建成功", "data": new_record.to_dict()}
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"保存数据失败: {str(e)}") from e


@router.put("/db/update-manual", summary="更新手填字段")
async def update_manual_fields(
    神殿: str = Query(..., description="神殿名称"),
    年份: int = Query(..., description="年份"),
    data: CampusCoreSummaryUpdate = Body(...),
    db: Session = Depends(get_db)
):
    """
    仅更新手填字段（智慧司人数、干部人数、员工人数）
    """
    try:
        normalized = normalize_campus(神殿)
        
        existing = db.query(神殿核心数据汇总表).filter(
            or_(
                神殿核心数据汇总表.神殿 == 神殿,
                神殿核心数据汇总表.神殿 == normalized,
                神殿核心数据汇总表.神殿 == f"{normalized}神殿"
            ),
            神殿核心数据汇总表.年份 == 年份
        ).first()
        
        if not existing:
            # 创建新记录
            existing = 神殿核心数据汇总表(
                神殿=normalized,
                年份=年份,
            )
            db.add(existing)
        
        # 只更新非空字段
        if data.智慧司人数 is not None:
            existing.智慧司人数 = data.智慧司人数
        if data.干部人数 is not None:
            existing.干部人数 = data.干部人数
        if data.员工人数 is not None:
            existing.员工人数 = data.员工人数
        
        db.commit()
        db.refresh(existing)
        return {"message": "更新成功", "data": existing.to_dict()}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新数据失败: {str(e)}") from e


@router.post("/db/batch-save", summary="批量保存神殿核心数据汇总")
async def batch_save_campus_core_summary(
    records: List[CampusCoreSummaryCreate],
    db: Session = Depends(get_db)
):
    """
    批量保存多个神殿的核心数据汇总
    """
    try:
        results = []
        for data in records:
            normalized = normalize_campus(data.神殿)
            
            existing = db.query(神殿核心数据汇总表).filter(
                神殿核心数据汇总表.神殿 == normalized,
                神殿核心数据汇总表.年份 == data.年份
            ).first()
            
            if existing:
                existing.在校生人数 = data.在校生人数
                existing.班级数量 = data.班级数量
                existing.智慧司人数 = data.智慧司人数
                existing.干部人数 = data.干部人数
                existing.员工人数 = data.员工人数
                existing.就业班级数量 = data.就业班级数量
                existing.毕业生人数 = data.毕业生人数
                existing.就业率 = data.就业率
                existing.就业薪资 = data.就业薪资
                existing.薪资过万人数 = data.薪资过万人数
                existing.口碑招生人数 = data.口碑招生人数
                existing.口碑招生收入 = data.口碑招生收入
                existing.新生入学人数 = data.新生入学人数
                existing.新生流失人数 = data.新生流失人数
                results.append({"神殿": normalized, "status": "updated"})
            else:
                new_record = 神殿核心数据汇总表(
                    神殿=normalized,
                    年份=data.年份,
                    在校生人数=data.在校生人数,
                    班级数量=data.班级数量,
                    智慧司人数=data.智慧司人数,
                    干部人数=data.干部人数,
                    员工人数=data.员工人数,
                    就业班级数量=data.就业班级数量,
                    毕业生人数=data.毕业生人数,
                    就业率=data.就业率,
                    就业薪资=data.就业薪资,
                    薪资过万人数=data.薪资过万人数,
                    口碑招生人数=data.口碑招生人数,
                    口碑招生收入=data.口碑招生收入,
                    新生入学人数=data.新生入学人数,
                    新生流失人数=data.新生流失人数,
                )
                db.add(new_record)
                results.append({"神殿": normalized, "status": "created"})
        
        db.commit()
        return {"message": f"成功保存 {len(results)} 条记录", "results": results}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"批量保存失败: {str(e)}") from e
