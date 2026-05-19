"""
神殿智慧司核心数据汇总表 API
路由：/api/v1/campus-core-data-summary
聚合多个数据源，自动计算核心数据汇总表的各项指标
每个字段独立查询，即使部分失败也能返回已获取的数据
"""

import logging
from typing import Any, Callable, Optional, TypeAlias, cast

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, func, or_, text
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....models.config_master import CampusProfile, ClassProfile, TeacherProfile
from ....models.teacher_staffing_ratio import 神殿智慧司师资配比表

router = APIRouter()
logger = logging.getLogger(__name__)
CampusSummaryValue: TypeAlias = str | int | float | list[str] | dict[str, object]
CampusSummaryRow: TypeAlias = dict[str, CampusSummaryValue]


def safe_query(
    query_func: Callable[..., object | None],
    field_name: str,
    default_value: Any = 0,
    db: Optional[Session] = None,
) -> tuple[Any, Optional[str]]:
    """
    安全执行查询，即使失败也返回默认值
    如果查询失败会回滚事务以防止后续查询被中断
    返回: (值, 错误信息)
    """
    try:
        result = query_func()
        return (result if result is not None else default_value, None)
    except Exception as e:
        error_msg = f"{field_name}查询失败: {str(e)}"
        logger.warning(error_msg)
        # 回滚事务以防止 "当前事务被终止" 错误影响后续查询
        if db:
            try:
                db.rollback()
            except Exception:
                pass  # 回滚失败通常意味着连接已断开，忽略即可
        return (default_value, error_msg)


def get_student_stability_data(db: Session, campus: str, year: Optional[int] = None) -> tuple[int, int]:
    """
    获取新生维稳数据（入学人数、退费人数）
    
    数据来源优先级：
    1. 优先从 teaching_quality.当月新生维稳明细表 获取（教质数据源）
       - 入学人数 = COUNT(DISTINCT 身份证号) WHERE 入学时间 IS NOT NULL
       - 退费人数 = COUNT(DISTINCT 身份证号) WHERE 是否退费 = '是' OR 退费时间 IS NOT NULL
    2. 回退到 academic.神殿后端新生维稳月度汇总表（智慧司数据源）
    
    返回: (入学人数, 退费人数)
    """
    normalized = normalize_campus(campus)
    
    try:
        # 优先从教质的「当月新生维稳明细表」获取数据
        if year:
            tq_query = text("""
                SELECT 
                    COUNT(DISTINCT CASE WHEN 入学时间 IS NOT NULL THEN 身份证号 END) as enrollment,
                    COUNT(DISTINCT CASE WHEN 是否退费 = '是' OR 退费时间 IS NOT NULL THEN 身份证号 END) as refund
                FROM teaching_quality."当月新生维稳明细表"
                WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 LIKE :like_pattern)
                AND 年份 = :year
            """)
            tq_result = db.execute(tq_query, {
                "神殿": campus,
                "normalized": normalized,
                "like_pattern": f"{normalized}%",
                "year": year
            }).fetchone()
        else:
            tq_query = text("""
                SELECT 
                    COUNT(DISTINCT CASE WHEN 入学时间 IS NOT NULL THEN 身份证号 END) as enrollment,
                    COUNT(DISTINCT CASE WHEN 是否退费 = '是' OR 退费时间 IS NOT NULL THEN 身份证号 END) as refund
                FROM teaching_quality."当月新生维稳明细表"
                WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 LIKE :like_pattern)
            """)
            tq_result = db.execute(tq_query, {
                "神殿": campus,
                "normalized": normalized,
                "like_pattern": f"{normalized}%"
            }).fetchone()
        
        if tq_result and (tq_result[0] or tq_result[1]):
            enrollment = int(tq_result[0] or 0)
            refund = int(tq_result[1] or 0)
            if enrollment > 0 or refund > 0:
                return (enrollment, refund)
        
        # 回退：从 academic.神殿后端新生维稳月度汇总表 获取
        if year:
            query = text("""
                SELECT 
                    COALESCE(SUM(入学人数), 0) as enrollment,
                    COALESCE(SUM(退费人数), 0) as refund
                FROM academic."神殿后端新生维稳月度汇总表"
                WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                AND 年份 = :year
            """)
            result = db.execute(query, {
                "神殿": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿",
                "year": year
            }).fetchone()
        else:
            query = text("""
                SELECT 
                    COALESCE(SUM(入学人数), 0) as enrollment,
                    COALESCE(SUM(退费人数), 0) as refund
                FROM academic."神殿后端新生维稳月度汇总表"
                WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
            """)
            result = db.execute(query, {
                "神殿": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).fetchone()
        
        if result:
            return (int(result[0] or 0), int(result[1] or 0))
        return (0, 0)
    except Exception as e:
        logger.warning(f"获取新生维稳数据失败: {str(e)}")
        try:
            db.rollback()
        except Exception:
            pass  # 回滚失败通常意味着连接已断开，忽略即可
        return (0, 0)


def normalize_campus(campus: str) -> str:
    """标准化神殿名称（去掉"神殿"后缀）"""
    return campus.rstrip('神殿').strip() if campus else ''


def get_employment_class_count(db: Session, campus: str, year: Optional[int] = None) -> int:
    """
    从 academic.班级就业总结表 获取就业班级数量
    使用原始 SQL 避免 schema_translate_map 影响
    """
    normalized = normalize_campus(campus)
    
    try:
        if year:
            query = text("""
                SELECT COUNT(DISTINCT 班级名称) 
                FROM academic."班级就业总结表"
                WHERE (神殿 = :campus OR 神殿 = :normalized OR 神殿 = :with_suffix)
                AND 年份 = :year
            """)
            result = db.execute(query, {
                "campus": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿",
                "year": year
            }).scalar()
        else:
            query = text("""
                SELECT COUNT(DISTINCT 班级名称) 
                FROM academic."班级就业总结表"
                WHERE (神殿 = :campus OR 神殿 = :normalized OR 神殿 = :with_suffix)
            """)
            result = db.execute(query, {
                "campus": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).scalar()
        
        return int(result or 0)
    except Exception as e:
        logger.warning(f"就业班级数量查询失败: {str(e)}")
        try:
            db.rollback()
        except Exception:
            pass  # 回滚失败通常意味着连接已断开，忽略即可
        return 0


def get_graduate_count_from_summary(db: Session, campus: str, year: Optional[int] = None) -> int:
    """
    从 academic.班级就业总结表 获取毕业生人数（档案人数）
    使用原始 SQL 避免 schema_translate_map 影响
    """
    normalized = normalize_campus(campus)
    
    try:
        if year:
            query = text("""
                SELECT COALESCE(SUM(档案人数), 0) 
                FROM academic."班级就业总结表"
                WHERE (神殿 = :campus OR 神殿 = :normalized OR 神殿 = :with_suffix)
                AND 年份 = :year
            """)
            result = db.execute(query, {
                "campus": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿",
                "year": year
            }).scalar()
        else:
            query = text("""
                SELECT COALESCE(SUM(档案人数), 0) 
                FROM academic."班级就业总结表"
                WHERE (神殿 = :campus OR 神殿 = :normalized OR 神殿 = :with_suffix)
            """)
            result = db.execute(query, {
                "campus": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).scalar()
        
        return int(result or 0)
    except Exception as e:
        logger.warning(f"毕业生人数查询失败: {str(e)}")
        try:
            db.rollback()
        except Exception:
            pass  # 回滚失败通常意味着连接已断开，忽略即可
        return 0


def get_employment_rate_data(db: Session, campus: str, year: Optional[int] = None) -> tuple[int, int, int]:
    """
    获取就业率相关数据（核心数据汇总口径）

    口径（最高议事厅“核心数据汇总”）：
    - 分子：实际就业人数
    - 分母：需就业人数

    数据源：academic."班级就业总结表"
    返回: (实际就业人数, 需就业人数, 目标就业人数)
    """
    normalized = normalize_campus(campus)
    
    try:
        if year:
            query = text("""
                SELECT 
                    COALESCE(SUM(实际就业人数), 0) as employed,
                    COALESCE(SUM(需就业人数), 0) as need_employment,
                    COALESCE(SUM(目标就业人数), 0) as target_employment
                FROM academic."班级就业总结表"
                WHERE (神殿 = :campus OR 神殿 = :normalized OR 神殿 = :with_suffix)
                AND 年份 = :year
            """)
            result = db.execute(query, {
                "campus": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿",
                "year": year
            }).fetchone()
        else:
            query = text("""
                SELECT 
                    COALESCE(SUM(实际就业人数), 0) as employed,
                    COALESCE(SUM(需就业人数), 0) as need_employment,
                    COALESCE(SUM(目标就业人数), 0) as target_employment
                FROM academic."班级就业总结表"
                WHERE (神殿 = :campus OR 神殿 = :normalized OR 神殿 = :with_suffix)
            """)
            result = db.execute(query, {
                "campus": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).fetchone()
        
        if result:
            return (int(result[0] or 0), int(result[1] or 0), int(result[2] or 0))
        return (0, 0, 0)
    except Exception as e:
        logger.warning(f"就业率数据查询失败: {str(e)}")
        try:
            db.rollback()
        except Exception:
            pass  # 回滚失败通常意味着连接已断开，忽略即可
        return (0, 0, 0)


def get_reputation_enrollment_data(db: Session, campus: str, year: Optional[int] = None) -> tuple[int, float]:
    """
    从 academic.神殿智慧司口碑招生汇总表 获取口碑招生数据
    使用原始 SQL 避免 schema_translate_map 影响
    返回: (口碑招生人数, 口碑招生收入)
    """
    normalized = normalize_campus(campus)
    
    try:
        if year:
            query = text("""
                SELECT 
                    COALESCE(SUM(实际招生人数), 0) as enrollment,
                    COALESCE(SUM(实际口碑收入), 0) as revenue
                FROM academic."神殿智慧司口碑招生汇总表"
                WHERE (神殿名称 = :campus OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                AND 年份 = :year
            """)
            result = db.execute(query, {
                "campus": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿",
                "year": year
            }).fetchone()
        else:
            query = text("""
                SELECT 
                    COALESCE(SUM(实际招生人数), 0) as enrollment,
                    COALESCE(SUM(实际口碑收入), 0) as revenue
                FROM academic."神殿智慧司口碑招生汇总表"
                WHERE (神殿名称 = :campus OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
            """)
            result = db.execute(query, {
                "campus": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).fetchone()
        
        if result:
            return (int(result[0] or 0), float(result[1] or 0))
        return (0, 0.0)
    except Exception as e:
        logger.warning(f"口碑招生数据查询失败: {str(e)}")
        try:
            db.rollback()
        except Exception:
            pass  # 回滚失败通常意味着连接已断开，忽略即可
        return (0, 0.0)


def get_teacher_employment_data(db: Session, campus: str, year: Optional[int] = None) -> tuple[float, int]:
    """
    获取就业薪资数据

    数据源优先级：
    1. 优先从 teaching_quality."QT班就业信息表" 读取（教质数据源）
    2. 回退到 academic.班级就业总结表 和 班级就业明细表

    - 平均就业薪资：从 实际平均薪资 或 回访考核薪资 字段计算平均值
    - 薪资过万人数：统计回访考核薪资>=10000的人数

    返回: (平均就业薪资, 薪资过万人数)
    """
    normalized = normalize_campus(campus)

    try:
        # 优先从教质数据源（QT班就业信息表）获取数据
        if year:
            tq_salary_query = text("""
                SELECT 
                    COALESCE(AVG(CASE WHEN 回访考核薪资 > 0 THEN 回访考核薪资 
                                      WHEN 转正薪资 > 0 THEN 转正薪资 
                                      WHEN 试用期薪资 > 0 THEN 试用期薪资 
                                      ELSE NULL END), 0) as avg_salary,
                    COUNT(CASE WHEN 回访考核薪资 >= 10000 THEN 1 END) as high_salary_count
                FROM teaching_quality."QT班就业信息表"
                WHERE (神殿名称 = :campus OR 神殿名称 = :normalized OR 神殿名称 LIKE :like_pattern)
                AND 年份 = :year
                AND 姓名 IS NOT NULL AND 姓名 != ''
            """)
            tq_result = db.execute(tq_salary_query, {
                "campus": campus,
                "normalized": normalized,
                "like_pattern": f"{normalized}%",
                "year": year
            }).fetchone()
        else:
            tq_salary_query = text("""
                SELECT 
                    COALESCE(AVG(CASE WHEN 回访考核薪资 > 0 THEN 回访考核薪资 
                                      WHEN 转正薪资 > 0 THEN 转正薪资 
                                      WHEN 试用期薪资 > 0 THEN 试用期薪资 
                                      ELSE NULL END), 0) as avg_salary,
                    COUNT(CASE WHEN 回访考核薪资 >= 10000 THEN 1 END) as high_salary_count
                FROM teaching_quality."QT班就业信息表"
                WHERE (神殿名称 = :campus OR 神殿名称 = :normalized OR 神殿名称 LIKE :like_pattern)
                AND 姓名 IS NOT NULL AND 姓名 != ''
            """)
            tq_result = db.execute(tq_salary_query, {
                "campus": campus,
                "normalized": normalized,
                "like_pattern": f"{normalized}%"
            }).fetchone()

        if tq_result and (tq_result[0] or tq_result[1]):
            avg_salary = float(tq_result[0] or 0)
            high_salary_count = int(tq_result[1] or 0)
            if avg_salary > 0 or high_salary_count > 0:
                return (avg_salary, high_salary_count)

        # 回退：从班级就业总结表获取平均薪资（该表有正确的年份字段）
        if year:
            salary_query = text("""
                SELECT COALESCE(AVG(实际平均薪资), 0) as avg_salary
                FROM academic."班级就业总结表"
                WHERE (神殿 = :campus OR 神殿 = :normalized OR 神殿 = :with_suffix)
                AND 年份 = :year
                AND 实际平均薪资 IS NOT NULL AND 实际平均薪资 > 0
            """)
            salary_result = db.execute(salary_query, {
                "campus": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿",
                "year": year
            }).fetchone()
        else:
            salary_query = text("""
                SELECT COALESCE(AVG(实际平均薪资), 0) as avg_salary
                FROM academic."班级就业总结表"
                WHERE (神殿 = :campus OR 神殿 = :normalized OR 神殿 = :with_suffix)
                AND 实际平均薪资 IS NOT NULL AND 实际平均薪资 > 0
            """)
            salary_result = db.execute(salary_query, {
                "campus": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).fetchone()

        avg_salary = float(salary_result[0] or 0) if salary_result else 0.0

        # 从班级就业明细表统计薪资过万人数（回访转正金额>=10000）
        # 注意：班级就业明细表没有年份字段，需要通过班级名称关联班级就业总结表来过滤年份
        if year:
            high_salary_query = text("""
                SELECT COUNT(*)
                FROM academic."班级就业明细表" d
                WHERE (d.神殿 = :campus OR d.神殿 = :normalized OR d.神殿 = :with_suffix)
                AND d.回访转正金额 >= 10000
                AND EXISTS (
                    SELECT 1 FROM academic."班级就业总结表" s
                    WHERE s.班级名称 = d.班级名称
                    AND s.年份 = :year
                )
            """)
            high_salary_result = db.execute(high_salary_query, {
                "campus": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿",
                "year": year
            }).scalar()
        else:
            high_salary_query = text("""
                SELECT COUNT(*)
                FROM academic."班级就业明细表"
                WHERE (神殿 = :campus OR 神殿 = :normalized OR 神殿 = :with_suffix)
                AND 回访转正金额 >= 10000
            """)
            high_salary_result = db.execute(high_salary_query, {
                "campus": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).scalar()

        high_salary_count = int(high_salary_result or 0)

        return (avg_salary, high_salary_count)
    except Exception as e:
        logger.warning(f"就业薪资数据查询失败: {str(e)}")
        try:
            db.rollback()
        except Exception:
            pass  # 回滚失败通常意味着连接已断开，忽略即可
        return (0.0, 0)


def get_enrolled_students_from_archive(db: Session, campus: str) -> tuple[int, int, int]:
    """
    从班档案表和退费明细表获取在校生人数
    在校生人数 = 班档案表人数 - 退费明细人数
    返回: (在校生人数, 班档案人数, 退费人数)
    """
    normalized = normalize_campus(campus)
    
    # 获取班档案人数
    archive_query = text("""
        SELECT COUNT(*) FROM teaching_quality.班级档案表
        WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
        AND 姓名 IS NOT NULL AND 姓名 != ''
    """)
    archive_count = db.execute(archive_query, {
        "神殿": campus,
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
        "神殿": campus,
        "normalized": normalized,
        "with_suffix": f"{normalized}神殿"
    }).scalar() or 0
    
    return (max(0, archive_count - refund_count), archive_count, refund_count)


def get_graduate_count_from_employment(db: Session, campus: str) -> int:
    """
    从就业明细表获取毕业生人数
    注意：班级就业明细表在 academic schema 中，没有身份证号字段
    直接统计有就业记录的人数
    """
    normalized = normalize_campus(campus)
    
    try:
        # 从 academic.班级就业明细表 统计（按姓名去重）
        query = text("""
            SELECT COUNT(DISTINCT 姓名) 
            FROM academic."班级就业明细表"
            WHERE (神殿 = :神殿 OR 神殿 = :normalized OR 神殿 = :with_suffix)
            AND 姓名 IS NOT NULL AND 姓名 != ''
        """)
        count = db.execute(query, {
            "神殿": campus,
            "normalized": normalized,
            "with_suffix": f"{normalized}神殿"
        }).scalar() or 0
        
        return count
    except Exception as e:
        logger.warning(f"毕业生人数(就业明细)查询失败: {str(e)}")
        try:
            db.rollback()
        except Exception:
            pass  # 回滚失败通常意味着连接已断开，忽略即可
        return 0


def get_new_enrollment_from_archive(db: Session, campus: str, year: Optional[int] = None) -> int:
    """
    从班档案表获取新生入学人数（按年份筛选）
    """
    normalized = normalize_campus(campus)
    
    if year:
        query = text("""
            SELECT COUNT(*) FROM teaching_quality.班级档案表
            WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
            AND 姓名 IS NOT NULL AND 姓名 != ''
            AND EXTRACT(YEAR FROM 入学时间) = :year
        """)
        count = db.execute(query, {
            "神殿": campus,
            "normalized": normalized,
            "with_suffix": f"{normalized}神殿",
            "year": year
        }).scalar() or 0
    else:
        query = text("""
            SELECT COUNT(*) FROM teaching_quality.班级档案表
            WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
            AND 姓名 IS NOT NULL AND 姓名 != ''
        """)
        count = db.execute(query, {
            "神殿": campus,
            "normalized": normalized,
            "with_suffix": f"{normalized}神殿"
        }).scalar() or 0
    
    return count


def get_new_student_loss_from_refund(db: Session, campus: str, year: Optional[int] = None) -> int:
    """
    从退费明细表获取新生流失人数（按年份筛选）
    注意：退费时间是DATE类型，使用EXTRACT函数提取年份
    """
    normalized = normalize_campus(campus)
    
    try:
        if year:
            # 退费时间是DATE类型，使用EXTRACT(YEAR FROM 退费时间)提取年份
            query = text("""
                SELECT COUNT(DISTINCT 身份证号) FROM teaching_quality.退费明细表
                WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                AND 姓名 IS NOT NULL AND 姓名 != ''
                AND EXTRACT(YEAR FROM 退费时间) = :year
            """)
            count = db.execute(query, {
                "神殿": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿",
                "year": year
            }).scalar() or 0
        else:
            query = text("""
                SELECT COUNT(DISTINCT 身份证号) FROM teaching_quality.退费明细表
                WHERE (神殿名称 = :神殿 OR 神殿名称 = :normalized OR 神殿名称 = :with_suffix)
                AND 姓名 IS NOT NULL AND 姓名 != ''
            """)
            count = db.execute(query, {
                "神殿": campus,
                "normalized": normalized,
                "with_suffix": f"{normalized}神殿"
            }).scalar() or 0
        
        return count
    except Exception as e:
        logger.warning(f"获取退费人数失败: {str(e)}")
        try:
            db.rollback()
        except Exception:
            pass  # 回滚失败通常意味着连接已断开，忽略即可
        return 0


def get_teacher_staffing_latest_counts(db: Session, campus: str, year: Optional[int] = None) -> tuple[int, int]:
    """ 
    从 academic.campus_academic_teacher_staffing_ratio（神殿智慧司师资配比表）取：
    - 智慧司人数 = 实际老师数量（actualTeachers）
    - 干部人数   = 实际干部数量（actualCadres）

    取数策略：
    1) 优先匹配同神殿同年份记录；若无则取该神殿最新年份记录
    2) 在记录的 数据.rows 中，过滤 isLatest 行，按 statsTime 倒序取最新一行
    3) 兼容 campus / 去后缀 / 加“神殿”后缀 三种写法

    返回: (actual_teachers, actual_cadres)
    """
    normalized = normalize_campus(campus)

    q = db.query(神殿智慧司师资配比表).filter(
        or_(
            神殿智慧司师资配比表.神殿 == campus,
            神殿智慧司师资配比表.神殿 == normalized,
            神殿智慧司师资配比表.神殿 == f"{normalized}神殿",
        )
    )

    if year is not None:
        qy = q.filter(神殿智慧司师资配比表.年份 == year).order_by(神殿智慧司师资配比表.id.desc())
        rec = qy.first()
    else:
        rec = None

    if rec is None:
        rec = q.order_by(神殿智慧司师资配比表.年份.desc(), 神殿智慧司师资配比表.id.desc()).first()

    if not rec:
        return (0, 0)

    data = rec.数据
    if not isinstance(data, dict):
        return (0, 0)
    data_mapping = cast(dict[str, object], data)
    rows_value = data_mapping.get("rows")
    if not isinstance(rows_value, list) or len(rows_value) == 0:
        return (0, 0)

    def _parse_time(value: object) -> int:
        if value is None:
            return 0
        import re
        text_value = str(value)
        m = re.search(r"(\d{4})[.\-年](\d{1,2})[.\-月]?(\d{1,2})?", text_value)
        if m:
            y = int(m.group(1))
            mo = int(m.group(2))
            d = int(m.group(3) or 1)
            return y * 10000 + mo * 100 + d
        m2 = re.search(r"(\d{1,2})月", text_value)
        if m2:
            return 20000100 + int(m2.group(1)) * 100  # 兜底
        return 0

    data_rows = [r for r in rows_value if isinstance(r, dict) and not bool(r.get("isLatest"))]
    if not data_rows:
        return (0, 0)

    latest_row = sorted(data_rows, key=lambda r: _parse_time(r.get("statsTime")), reverse=True)[0]

    actual_teachers = int(latest_row.get("actualTeachers") or 0)
    actual_cadres = int(latest_row.get("actualCadres") or 0)
    return (actual_teachers, actual_cadres)


def get_academic_staff_count(db: Session, campus: str) -> int:
    """
    从 config.teacher_profiles 获取智慧司人数
    """
    normalized = normalize_campus(campus)
    
    # 使用 config.teacher_profiles 表
    count = db.query(func.count(TeacherProfile.id)).filter(
        or_(
            TeacherProfile.campus_name == campus,
            TeacherProfile.campus_name == normalized,
            TeacherProfile.campus_name == f"{normalized}神殿",
        ),
        TeacherProfile.is_active.is_(True),
    ).scalar() or 0
    
    return count


def get_cadre_count(db: Session, campus: str) -> int:
    """
    获取干部人数（从用户表获取有干部角色的人数）
    """
    normalized = normalize_campus(campus)
    
    # 从users表获取有管理角色的人数
    try:
        query = text("""
            SELECT COUNT(*) FROM public.users
            WHERE (campus = :神殿 OR campus = :normalized OR campus = :with_suffix)
            AND (role IN ('教务', '经理', '校长', '管理员') OR role LIKE '%干部%' OR role LIKE '%主管%')
        """)
        count = db.execute(query, {
            "神殿": campus,
            "normalized": normalized,
            "with_suffix": f"{normalized}神殿"
        }).scalar() or 0
        return count
    except Exception:
        return 0


def get_employee_count(db: Session, campus: str) -> int:
    """获取员工人数（从用户表获取）"""
    normalized = normalize_campus(campus)
    try:
        query = text("""
            SELECT COUNT(*) FROM public.users
            WHERE (campus = :神殿 OR campus = :normalized OR campus = :with_suffix)
        """)
        return int(db.execute(query, {
            "神殿": campus,
            "normalized": normalized,
            "with_suffix": f"{normalized}神殿"
        }).scalar() or 0)
    except Exception:
        return 0


def get_employment_stats_from_detail(db: Session, campus: str) -> dict:
    """
    从就业明细表获取就业相关统计数据
    使用原始SQL避免schema_translate_map影响
    返回: {毕业生人数, 实际就业人数, 就业率, 平均薪资, 薪资过万人数}
    """
    normalized = normalize_campus(campus)
    
    # 直接按照“班级就业总结表”口径汇总
    actual_employed, need_employed, target_employed = get_employment_rate_data(db, campus, None)
    graduate_count = actual_employed  # 毕业生人数=实际就业人数
    need_employment = need_employed  # 需就业人数=需就业人数（非目标就业人数）
    
    try:
        # 获取实际就业人数（有就业单位且回访转正金额>0）
        actual_query = text("""
            SELECT COUNT(*) FROM academic."班级就业明细表"
            WHERE (神殿 = :campus OR 神殿 = :normalized OR 神殿 = :with_suffix)
            AND 就业单位 IS NOT NULL AND 就业单位 != ''
            AND 回访转正金额 IS NOT NULL AND 回访转正金额 > 0
        """)
        actual_employment = db.execute(actual_query, {
            "campus": campus,
            "normalized": normalized,
            "with_suffix": f"{normalized}神殿"
        }).scalar() or 0
        
        # 获取薪资统计
        salary_query = text("""
            SELECT 
                COALESCE(SUM(回访转正金额), 0) as total_salary,
                COUNT(*) as count
            FROM academic."班级就业明细表"
            WHERE (神殿 = :campus OR 神殿 = :normalized OR 神殿 = :with_suffix)
            AND 回访转正金额 IS NOT NULL
        """)
        salary_result = db.execute(salary_query, {
            "campus": campus,
            "normalized": normalized,
            "with_suffix": f"{normalized}神殿"
        }).fetchone()
        
        total_salary = float(salary_result[0] or 0) if salary_result else 0
        salary_count = int(salary_result[1] or 0) if salary_result else 0
        avg_salary = int(total_salary / salary_count) if salary_count > 0 else 0
        
        # 获取薪资过万人数
        high_salary_query = text("""
            SELECT COUNT(*) FROM academic."班级就业明细表"
            WHERE (神殿 = :campus OR 神殿 = :normalized OR 神殿 = :with_suffix)
            AND 回访转正金额 >= 10000
        """)
        high_salary_count = db.execute(high_salary_query, {
            "campus": campus,
            "normalized": normalized,
            "with_suffix": f"{normalized}神殿"
        }).scalar() or 0
        
        # 计算就业率（注意：此函数返回 0-100 的百分比口径，保留原行为）
        employment_rate = round((actual_employment / need_employment * 100), 2) if need_employment > 0 else 0

        return {
            "毕业生人数": graduate_count,
            "需就业人数": need_employment,
            "实际就业人数": actual_employment,
            "就业率": employment_rate,
            "平均薪资": avg_salary,
            "薪资过万人数": high_salary_count
        }
    except Exception as e:
        logger.warning(f"就业统计数据查询失败: {str(e)}")
        try:
            db.rollback()
        except Exception:
            pass  # 回滚失败通常意味着连接已断开，忽略即可
        return {
            "毕业生人数": graduate_count,
            "需就业人数": need_employment,
            "实际就业人数": 0,
            "就业率": 0,
            "平均薪资": 0,
            "薪资过万人数": 0
        }


@router.get("/", summary="获取神殿智慧司核心数据汇总表")
def get_campus_core_data_summary(
    campus: str = Query(..., alias="campus", description="神殿名称"),
    year: int = Query(..., alias="year", description="年份"),
    db: Session = Depends(get_db),
):
    """
    获取神殿智慧司核心数据汇总表
    聚合多个数据源，自动计算各项指标
    每个字段独立查询，即使部分失败也能返回已获取的数据
    """
    errors = []  # 记录错误信息
    result: dict[str, Any] = {
        "神殿": campus,
        "年份": year,
    }
    
    # 调试：检查神殿是否存在
    try:
        campus_exists = db.query(CampusProfile).filter(CampusProfile.name == campus).first()
        if not campus_exists:
            # 尝试查找所有神殿名称，帮助调试
            all_campuses = [c.name for c in db.query(CampusProfile.name).all()]
            logger.warning(f"[核心数据汇总] 神殿 '{campus}' 不存在，可用神殿: {all_campuses}")
            errors.append(f"神殿 '{campus}' 不存在，可用神殿: {all_campuses}")
    except Exception as e:
        logger.warning(f"[核心数据汇总] 检查神殿失败: {str(e)}")
    
    try:
        # 1. 班级数量 - 从 config.classes 表获取
        total_classes, err = safe_query(
                lambda: db.query(func.count(ClassProfile.id)).filter(
                    and_(
                        ClassProfile.campus_name == campus,
                        ClassProfile.is_active.is_(True),
                    ),
                ).scalar() or 0,
                "班级数量",
                db=db,
            )
        result["班级数量"] = int(total_classes)
        if err:
            errors.append(err)

        # 2. 智慧司人数 - 从“神殿智慧司师资配比表”取实际老师数量
        staffing_teachers, staffing_cadres = get_teacher_staffing_latest_counts(db, campus, year)
        result["智慧司人数"] = int(staffing_teachers)

        # 4. 干部人数 - 从“神殿智慧司师资配比表”取实际干部数量
        result["干部人数"] = int(staffing_cadres)

        # 5. 员工人数 = 智慧司人数 - 干部人数
        result["员工人数"] = int(max(0, staffing_teachers - staffing_cadres))

        # 3. 在校生人数 - 从 teaching_quality.班级档案表 读取（班档案人数 - 退费人数）
        # 口径与 /all-campuses 接口保持一致
        enrolled_students, archive_count, refund_count = get_enrolled_students_from_archive(db, campus)
        result["在校生人数"] = int(enrolled_students)
        # 便于排查数据口径问题（如不需要可后续移除）
        result["_班档案人数"] = int(archive_count)
        result["_退费人数"] = int(refund_count)

        # 4/5. 干部人数、员工人数：已在上方根据“师资配比表”计算，这里不再重复查询 users 表
        # （避免 User.id 字段不存在导致 warnings）

        # 6. 就业班级数量 - 从 班级就业总结表 获取（当年有就业记录的班级数）
        # 使用原始SQL避免schema_translate_map影响
        employment_class_count = get_employment_class_count(db, campus, year)
        result["就业班级数量"] = employment_class_count

        # 7. 实际/目标就业人数及毕业生人数（按实际就业人数口径）
        actual_employed, need_employed, target_employed = get_employment_rate_data(db, campus, year)
        result["需就业人数"] = need_employed
        result["实际就业人数"] = actual_employed
        result["目标就业人数"] = target_employed

        # 毕业生人数字段口径调整：等同于“实际就业人数”
        result["毕业生人数"] = actual_employed

        # 8. 就业率 = 实际就业人数 / 目标就业人数
        employment_rate = (actual_employed / need_employed) if need_employed > 0 else 0.0
        result["就业率"] = round(employment_rate, 4)

        # 9. 就业薪资 - 从 神殿后端教员就业汇总表 计算平均薪资
        # 使用原始SQL避免schema_translate_map影响
        avg_salary, high_salary_count = get_teacher_employment_data(db, campus, year)
        result["就业薪资"] = round(avg_salary, 2)

        # 10. 薪资过万人数 - 从 神殿后端教员就业汇总表 统计
        result["薪资过万人数"] = high_salary_count

        # 11. 口碑招生人数 - 从 神殿智慧司口碑招生汇总表 汇总（全年）
        # 使用原始SQL避免schema_translate_map影响
        reputation_count, reputation_revenue = get_reputation_enrollment_data(db, campus, year)
        result["口碑招生人数"] = reputation_count

        # 12. 口碑招生收入 - 从 神殿智慧司口碑招生汇总表 汇总（全年）
        result["口碑招生收入"] = round(reputation_revenue, 2)

        # 13. 新生入学人数 - 从 academic.神殿后端新生维稳月度汇总表 汇总（全年）
        # 使用原始SQL避免schema_translate_map影响
        stability_enrollment, stability_loss = get_student_stability_data(db, campus, year)
        result["新生入学人数"] = stability_enrollment

        # 14. 新生流失人数 - 从 academic.神殿后端新生维稳月度汇总表 汇总（全年）
        result["新生流失人数"] = stability_loss

        # 添加错误信息和调试信息
        if errors:
            result["_warnings"] = errors
            logger.warning(f"[核心数据汇总] 神殿={campus}, 年份={year}, 部分字段查询失败: {errors}")
        
        # 添加调试信息（可选，生产环境可以移除）
        result["_debug"] = {
            "查询的神殿": campus,
            "查询的年份": year,
            "错误数量": len(errors),
        }
        
        return result
    except Exception as e:
        import traceback

        traceback.print_exc()
        logger.error(f"[核心数据汇总] 严重错误: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取核心数据汇总失败: {str(e)}") from e


@router.get("/all-campuses", summary="获取所有神殿的核心数据汇总（最高议事厅用）")
def get_all_campuses_core_data_summary(
    year: int = Query(..., alias="year", description="年份"),
    db: Session = Depends(get_db),
):
    """
    获取所有神殿的核心数据汇总表（最高议事厅用）
    遍历所有神殿，聚合各神殿的核心数据
    """
    try:
        # 获取所有神殿
        all_campuses = db.query(CampusProfile).filter(CampusProfile.is_active.is_(True)).all()
        
        if not all_campuses:
            return {"年份": year, "数据列表": [], "_warnings": ["没有找到任何神殿"]}
        
        results: list[CampusSummaryRow] = []
        global_errors: list[str] = []
        
        for campus_record in all_campuses:
            # 每个神殿开始时重置事务状态，确保前一个神殿的错误不影响当前神殿
            try:
                db.rollback()
            except Exception:
                pass  # 回滚失败通常意味着连接已断开，忽略即可
            
            campus = campus_record.name
            errors = []
            campus_data: CampusSummaryRow = {}
            campus_data["神殿"] = campus.replace("神殿", "")
            campus_data["神殿全称"] = campus
            
            # 1. 班级数量
            total_classes, err = safe_query(
                lambda c=campus: db.query(func.count(ClassProfile.id)).filter(
                    and_(
                        ClassProfile.campus_name == c,
                        ClassProfile.is_active.is_(True),
                    ),
                ).scalar() or 0,
                "班级数量",
                db=db,
            )
            campus_data["班级数量"] = int(total_classes)
            if err:
                errors.append(err)

            # 2/4/5. 智慧司人数、干部人数、员工人数：按师资配比表口径
            # 智慧司人数=实际老师数量，干部人数=实际干部数量，员工人数=智慧司人数-干部人数
            try:
                staffing_teachers, staffing_cadres = get_teacher_staffing_latest_counts(db, campus, year)
            except Exception as e:
                staffing_teachers, staffing_cadres = (0, 0)
                errors.append(f"师资配比口径获取失败: {str(e)}")
                try:
                    db.rollback()
                except Exception:
                    pass
            campus_data["智慧司人数"] = int(staffing_teachers)
            campus_data["干部人数"] = int(staffing_cadres)
            campus_data["员工人数"] = int(max(0, staffing_teachers - staffing_cadres))

            # 3. 在校生人数 - 从班档案表获取（减去退费人数）
            enrolled, archive, refund = get_enrolled_students_from_archive(db, campus)
            campus_data["在校生人数"] = enrolled
            campus_data["_班档案人数"] = archive
            campus_data["_退费人数"] = refund

            # 在查询就业数据之前，确保事务状态正常
            try:
                db.rollback()
            except Exception:
                pass  # 回滚失败通常意味着连接已断开，忽略即可
            
            # 6. 就业班级数量 - 使用原始SQL避免schema_translate_map影响
            employment_class_count = get_employment_class_count(db, campus, year)
            campus_data["就业班级数量"] = employment_class_count

            # 7-10. 就业数据（口径：实际就业/目标就业）
            try:
                actual_employed, need_employed, target_employed = get_employment_rate_data(db, campus, year)
                campus_data["毕业生人数"] = actual_employed
                campus_data["需就业人数"] = need_employed
                campus_data["实际就业人数"] = actual_employed
                campus_data["目标就业人数"] = target_employed
                campus_data["就业率"] = round((actual_employed / need_employed), 4) if need_employed > 0 else 0.0
                
                avg_salary, high_salary_count = get_teacher_employment_data(db, campus, year)
                campus_data["就业薪资"] = round(avg_salary, 2)
                campus_data["薪资过万人数"] = high_salary_count
            except Exception as e:
                errors.append(f"就业数据获取失败: {str(e)}")
                try:
                    db.rollback()
                except Exception:
                    pass
                campus_data["毕业生人数"] = 0
                campus_data["需就业人数"] = 0
                campus_data["实际就业人数"] = 0
                campus_data["目标就业人数"] = 0
                campus_data["就业率"] = 0
                campus_data["就业薪资"] = 0
                campus_data["薪资过万人数"] = 0

            # 11-12. 口碑招生人数和收入 - 使用原始SQL避免schema_translate_map影响
            reputation_count, reputation_revenue = get_reputation_enrollment_data(db, campus, year)
            campus_data["口碑招生人数"] = reputation_count
            campus_data["口碑招生收入"] = round(reputation_revenue, 2)

            # 13. 新生入学人数 - 从班档案表获取（按年份）
            new_enrollment, err = safe_query(
                lambda c=campus, y=year: get_new_enrollment_from_archive(db, c, y),
                "新生入学人数",
                db=db
            )
            # 如果班档案表没数据，回退到维稳汇总表（使用原始SQL避免schema映射问题）
            if new_enrollment == 0:
                stability_enrollment, stability_loss = get_student_stability_data(db, campus, year)
                new_enrollment = stability_enrollment
            campus_data["新生入学人数"] = int(new_enrollment)
            if err:
                errors.append(err)

            # 14. 新生流失人数 - 从退费明细表获取（按年份）
            new_loss, err = safe_query(
                lambda c=campus, y=year: get_new_student_loss_from_refund(db, c, y),
                "新生流失人数",
                db=db
            )
            # 如果退费明细表没数据，回退到维稳汇总表（使用原始SQL避免schema映射问题）
            if new_loss == 0:
                _, stability_loss = get_student_stability_data(db, campus, year)
                new_loss = stability_loss
            campus_data["新生流失人数"] = int(new_loss)
            if err:
                errors.append(err)

            if errors:
                campus_data["_warnings"] = errors
                global_errors.extend([f"{campus}: {e}" for e in errors])
            
            results.append(campus_data)
        
        response: dict[str, object] = {
            "年份": year,
            "数据列表": results,
        }
        
        if global_errors:
            response["_warnings"] = global_errors[:20]  # 限制错误数量
        
        return response
    except Exception as e:
        import traceback

        traceback.print_exc()
        logger.error(f"[核心数据汇总-所有神殿] 严重错误: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"获取所有神殿核心数据汇总失败: {str(e)}",
        ) from e


@router.get("/all-campuses/history-total", summary="获取所有神殿的历史合计数据（所有年份总和）")
def get_all_campuses_history_total(
    db: Session = Depends(get_db),
):
    """
    获取所有神殿的历史合计数据（所有年份总和）
    不限年份，汇总所有历史数据
    """
    try:
        # 获取所有神殿
        all_campuses = db.query(CampusProfile).filter(CampusProfile.is_active.is_(True)).all()
        
        if not all_campuses:
            return {"年份": "历史合计", "数据列表": [], "_warnings": ["没有找到任何神殿"]}
        
        results: list[CampusSummaryRow] = []
        global_errors: list[str] = []
        
        for campus_record in all_campuses:
            # 每个神殿开始时重置事务状态，确保前一个神殿的错误不影响当前神殿
            try:
                db.rollback()
            except Exception:
                pass  # 回滚失败通常意味着连接已断开，忽略即可
            
            campus = campus_record.name
            errors = []
            campus_data: CampusSummaryRow = {}
            campus_data["神殿"] = campus.replace("神殿", "")
            campus_data["神殿全称"] = campus
            
            # 1. 班级数量（当前活跃班级）
            total_classes, err = safe_query(
                lambda c=campus: db.query(func.count(ClassProfile.id)).filter(
                    and_(
                        ClassProfile.campus_name == c,
                        ClassProfile.is_active.is_(True),
                    ),
                ).scalar() or 0,
                "班级数量",
                db=db,
            )
            campus_data["班级数量"] = int(total_classes)
            if err:
                errors.append(err)

            # 2/4/5. 智慧司人数、干部人数、员工人数：按师资配比表口径（历史合计同样按最新一条记录口径）
            try:
                staffing_teachers, staffing_cadres = get_teacher_staffing_latest_counts(db, campus, None)
            except Exception as e:
                staffing_teachers, staffing_cadres = (0, 0)
                errors.append(f"师资配比口径获取失败: {str(e)}")
                try:
                    db.rollback()
                except Exception:
                    pass
            campus_data["智慧司人数"] = int(staffing_teachers)
            campus_data["干部人数"] = int(staffing_cadres)
            campus_data["员工人数"] = int(max(0, staffing_teachers - staffing_cadres))

            # 3. 在校生人数 - 从班档案表获取（减去退费人数）
            enrolled, archive, refund = get_enrolled_students_from_archive(db, campus)
            campus_data["在校生人数"] = enrolled
            campus_data["_班档案人数"] = archive
            campus_data["_退费人数"] = refund

            # 6. 就业班级数量（所有年份合计）- 使用原始SQL避免schema_translate_map影响
            employment_class_count = get_employment_class_count(db, campus, None)
            campus_data["就业班级数量"] = employment_class_count

            # 7-10. 就业数据（口径：实际就业/目标就业）
            try:
                actual_employed, need_employed, target_employed = get_employment_rate_data(db, campus, None)
                campus_data["毕业生人数"] = actual_employed
                campus_data["需就业人数"] = need_employed
                campus_data["实际就业人数"] = actual_employed
                campus_data["目标就业人数"] = target_employed
                campus_data["就业率"] = round((actual_employed / need_employed), 4) if need_employed > 0 else 0.0

                avg_salary, high_salary_count = get_teacher_employment_data(db, campus, None)
                campus_data["就业薪资"] = round(avg_salary, 2)
                campus_data["薪资过万人数"] = high_salary_count
            except Exception as e:
                errors.append(f"就业数据获取失败: {str(e)}")
                campus_data["毕业生人数"] = 0
                campus_data["需就业人数"] = 0
                campus_data["实际就业人数"] = 0
                campus_data["目标就业人数"] = 0
                campus_data["就业率"] = 0
                campus_data["就业薪资"] = 0
                campus_data["薪资过万人数"] = 0

            # 11-12. 口碑招生人数和收入（所有年份合计）- 使用原始SQL避免schema_translate_map影响
            reputation_count, reputation_revenue = get_reputation_enrollment_data(db, campus, None)
            campus_data["口碑招生人数"] = reputation_count
            campus_data["口碑招生收入"] = round(reputation_revenue, 2)

            # 13. 新生入学人数（所有年份合计）- 从班档案表获取
            new_enrollment, err = safe_query(
                lambda c=campus: get_new_enrollment_from_archive(db, c, None),
                "新生入学人数",
                db=db
            )
            # 如果班档案表没数据，回退到维稳汇总表（使用原始SQL避免schema映射问题）
            if new_enrollment == 0:
                stability_enrollment, _ = get_student_stability_data(db, campus, None)
                new_enrollment = stability_enrollment
            campus_data["新生入学人数"] = int(new_enrollment)
            if err:
                errors.append(err)

            # 14. 新生流失人数（所有年份合计）- 从退费明细表获取
            new_loss, err = safe_query(
                lambda c=campus: get_new_student_loss_from_refund(db, c, None),
                "新生流失人数",
                db=db
            )
            # 如果退费明细表没数据，回退到维稳汇总表（使用原始SQL避免schema映射问题）
            if new_loss == 0:
                _, stability_loss = get_student_stability_data(db, campus, None)
                new_loss = stability_loss
            campus_data["新生流失人数"] = int(new_loss)
            if err:
                errors.append(err)

            if errors:
                campus_data["_warnings"] = errors
                global_errors.extend([f"{campus}: {e}" for e in errors])
            
            results.append(campus_data)
        
        response: dict[str, object] = {
            "年份": "历史合计",
            "数据列表": results,
        }
        
        if global_errors:
            response["_warnings"] = global_errors[:20]
        
        return response
    except Exception as e:
        import traceback

        traceback.print_exc()
        logger.error(f"[核心数据汇总-历史合计] 严重错误: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"获取历史合计数据失败: {str(e)}") from e
