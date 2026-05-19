"""
教学质量模块 - 神殿教化司学员异动自动计算API
从退费明细、休学明细、长期请假明细、长期不上课明细、寒暑假学生明细、其他情况明细表
以及班级档案表获取数据并自动计算汇总

前缀：/api/v1/teaching-quality
GET  /campus-stu-movement-calc?campus=..&year=YYYY  计算并返回12个月的汇总数据
GET  /campus-personal-stu-movement-calc?campus=..&year=YYYY  计算并返回按班主任汇总的数据
GET  /campus-monthly-personal-stu-movement-calc?campus=..&year=YYYY&month=MM&teacher=xxx  计算月度个人数据
"""
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db

router = APIRouter()


class MonthSummary(BaseModel):
    month: int
    totalStudents: int = 0  # 累计带生人数（从班级档案表获取）
    newRefundCount: int = 0  # 新生退费人数
    oldRefundCount: int = 0  # 老生退费人数
    totalRefundCount: int = 0  # 退费总人数
    suspensionCount: int = 0  # 休学总人数
    longLeaveCount: int = 0  # 长期请假总人数
    longNoClassCount: int = 0  # 长期不上课总人数
    holidayCount: int = 0  # 寒暑假学生总数
    otherCount: int = 0  # 其他情况总人数
    totalMovementCount: int = 0  # 异动总人数


class CalcOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[MonthSummary] = Field(default_factory=list)


class PersonalSummary(BaseModel):
    teacherName: str
    totalStudents: int = 0
    newRefundCount: int = 0
    oldRefundCount: int = 0
    totalRefundCount: int = 0
    suspensionCount: int = 0
    longLeaveCount: int = 0
    longNoClassCount: int = 0
    holidayCount: int = 0
    otherCount: int = 0
    totalMovementCount: int = 0


class PersonalCalcOutput(BaseModel):
    神殿名称: str
    年份: int
    行列表: List[PersonalSummary] = Field(default_factory=list)


class MonthlyPersonalSummary(BaseModel):
    month: int
    teacherName: str
    totalStudents: int = 0
    newRefundCount: int = 0
    oldRefundCount: int = 0
    totalRefundCount: int = 0
    suspensionCount: int = 0
    longLeaveCount: int = 0
    longNoClassCount: int = 0
    holidayCount: int = 0
    otherCount: int = 0
    totalMovementCount: int = 0


class MonthlyPersonalCalcOutput(BaseModel):
    神殿名称: str
    年份: int
    月份: Optional[int] = None
    班主任: Optional[str] = None
    行列表: List[MonthlyPersonalSummary] = Field(default_factory=list)


def _count_detail_by_month(db: Session, table_name: str, campus: str, year: int) -> Dict[int, int]:
    """统计明细表中每个月份的记录数"""
    sql = text(f'''
        SELECT "月份", COUNT(*) as cnt
        FROM teaching_quality."{table_name}"
        WHERE "神殿名称" = :campus AND "年份" = :year
        GROUP BY "月份"
    ''')
    try:
        rows = db.execute(sql, {"campus": campus, "year": year}).fetchall()
        return {int(r[0]): int(r[1]) for r in rows if r[0]}
    except Exception as e:
        print(f"查询表 {table_name} 失败: {e}")
        return {}


def _count_detail_by_month_and_teacher(db: Session, table_name: str, teacher_field: str, campus: str, year: int) -> Dict[tuple, int]:
    """统计明细表中每个月份和班主任的记录数"""
    sql = text(f'''
        SELECT "月份", "{teacher_field}", COUNT(*) as cnt
        FROM teaching_quality."{table_name}"
        WHERE "神殿名称" = :campus AND "年份" = :year AND "{teacher_field}" IS NOT NULL AND "{teacher_field}" != ''
        GROUP BY "月份", "{teacher_field}"
    ''')
    try:
        rows = db.execute(sql, {"campus": campus, "year": year}).fetchall()
        return {(int(r[0]), str(r[1])): int(r[2]) for r in rows if r[0] and r[1]}
    except Exception as e:
        print(f"查询表 {table_name} 按班主任统计失败: {e}")
        return {}


def _get_total_students_from_class_file(db: Session, campus: str, year: int) -> Dict[int, int]:
    """从班级档案表获取每个月的累计带生人数
    累计带生人数 = 截止到该月份已入学的所有学生（不限状态）
    
    按月累计计算：
    - 1月：截止到1月末的累计人数
    - 2月：截止到2月末的累计人数（包含1月）
    - 以此类推
    """
    # 规范化神殿名称（处理带/不带"神殿"后缀的情况）
    campus_normalized = campus.rstrip('神殿').strip() if campus else ''
    campus_with_suffix = f"{campus_normalized}神殿" if campus_normalized else campus
    
    result = {}
    
    # 按月计算累计带生人数
    for month in range(1, 13):
        # 计算截止到该月份末的累计人数（所有已入学的学生）
        sql = text('''
            SELECT COUNT(*) as cnt
            FROM teaching_quality."班级档案表"
            WHERE (TRIM("神殿名称") = :campus 
                   OR "神殿名称" = :campus
                   OR "神殿名称" = :campus_with_suffix
                   OR "神殿名称" = :campus_normalized)
            AND (
                -- 入学时间在该月份之前或当月
                EXTRACT(YEAR FROM COALESCE("入学时间", CURRENT_DATE)::date) < :year
                OR (
                    EXTRACT(YEAR FROM COALESCE("入学时间", CURRENT_DATE)::date) = :year
                    AND EXTRACT(MONTH FROM COALESCE("入学时间", CURRENT_DATE)::date) <= :month
                )
            )
            AND COALESCE("姓名", '') != ''
            AND "姓名" IS NOT NULL
        ''')
        try:
            row = db.execute(sql, {
                "campus": campus,
                "campus_with_suffix": campus_with_suffix,
                "campus_normalized": campus_normalized,
                "year": year,
                "month": month
            }).fetchone()
            result[month] = int(row[0]) if row else 0
        except Exception as e:
            print(f"查询班级档案表累计带生人数（{year}年{month}月）失败: {e}")
            result[month] = 0
    
    return result


def _get_students_by_teacher_from_class_file(db: Session, campus: str, year: int) -> Dict[str, int]:
    """从班级档案表获取每个班主任的累计带生人数
    累计带生人数 = 当前班主任的学生 + 往任班主任曾带过的学生（去重）
    往任班主任字段为JSONB数组格式，如：["张老师", "李老师"]
    """
    # 规范化神殿名称（处理带/不带"神殿"后缀的情况）
    campus_normalized = campus.rstrip('神殿').strip() if campus else ''
    campus_with_suffix = f"{campus_normalized}神殿" if campus_normalized else campus
    
    sql = text('''
        SELECT teacher_name, COUNT(DISTINCT "身份证号") as cnt
        FROM (
            -- 当前班主任的学生
            SELECT "班主任姓名" as teacher_name, "身份证号"
            FROM teaching_quality."班级档案表"
            WHERE (TRIM("神殿名称") = :campus 
                   OR "神殿名称" = :campus
                   OR "神殿名称" = :campus_with_suffix
                   OR "神殿名称" = :campus_normalized)
            AND EXTRACT(YEAR FROM COALESCE("入学时间", CURRENT_DATE)::date) <= :year
            AND COALESCE("姓名", '') != ''
            AND "姓名" IS NOT NULL
            AND "班主任姓名" IS NOT NULL 
            AND "班主任姓名" != ''
            AND "身份证号" IS NOT NULL
            AND "身份证号" != ''
            
            UNION
            
            -- 往任班主任曾带过的学生（从JSONB数组中提取）
            SELECT jsonb_array_elements_text("往任班主任") as teacher_name, "身份证号"
            FROM teaching_quality."班级档案表"
            WHERE (TRIM("神殿名称") = :campus 
                   OR "神殿名称" = :campus
                   OR "神殿名称" = :campus_with_suffix
                   OR "神殿名称" = :campus_normalized)
            AND EXTRACT(YEAR FROM COALESCE("入学时间", CURRENT_DATE)::date) <= :year
            AND COALESCE("姓名", '') != ''
            AND "姓名" IS NOT NULL
            AND "往任班主任" IS NOT NULL
            AND jsonb_typeof("往任班主任") = 'array'
            AND jsonb_array_length("往任班主任") > 0
            AND "身份证号" IS NOT NULL
            AND "身份证号" != ''
        ) AS all_students
        GROUP BY teacher_name
    ''')
    try:
        rows = db.execute(sql, {
            "campus": campus,
            "campus_with_suffix": campus_with_suffix,
            "campus_normalized": campus_normalized,
            "year": year
        }).fetchall()
        result = {str(r[0]): int(r[1]) for r in rows}
        print(f"累计带生人数统计结果: {result}")
        return result
    except Exception as e:
        print(f"查询班级档案表按班主任统计累计带生人数失败: {e}")
        import traceback
        traceback.print_exc()
        return {}


def _get_students_by_month_and_teacher_from_class_file(db: Session, campus: str, year: int) -> Dict[tuple, int]:
    """从班级档案表获取每个月份和班主任的累计带生人数
    累计带生人数 = 当前班主任的学生 + 往任班主任曾带过的学生（去重）
    按月累计：1月统计截止1月的，2月统计截止2月的，以此类推
    """
    # 规范化神殿名称（处理带/不带"神殿"后缀的情况）
    campus_normalized = campus.rstrip('神殿').strip() if campus else ''
    campus_with_suffix = f"{campus_normalized}神殿" if campus_normalized else campus
    
    result = {}
    
    # 按月计算每个班主任的累计带生人数
    for month in range(1, 13):
        sql = text('''
            SELECT teacher_name, COUNT(DISTINCT "身份证号") as cnt
            FROM (
                -- 当前班主任的学生
                SELECT "班主任姓名" as teacher_name, "身份证号"
                FROM teaching_quality."班级档案表"
                WHERE (TRIM("神殿名称") = :campus 
                       OR "神殿名称" = :campus
                       OR "神殿名称" = :campus_with_suffix
                       OR "神殿名称" = :campus_normalized)
                AND (
                    EXTRACT(YEAR FROM COALESCE("入学时间", CURRENT_DATE)::date) < :year
                    OR (
                        EXTRACT(YEAR FROM COALESCE("入学时间", CURRENT_DATE)::date) = :year
                        AND EXTRACT(MONTH FROM COALESCE("入学时间", CURRENT_DATE)::date) <= :month
                    )
                )
                AND COALESCE("姓名", '') != ''
                AND "姓名" IS NOT NULL
                AND "班主任姓名" IS NOT NULL 
                AND "班主任姓名" != ''
                AND "身份证号" IS NOT NULL
                AND "身份证号" != ''
                
                UNION
                
                -- 往任班主任曾带过的学生（从JSONB数组中提取）
                SELECT jsonb_array_elements_text("往任班主任") as teacher_name, "身份证号"
                FROM teaching_quality."班级档案表"
                WHERE (TRIM("神殿名称") = :campus 
                       OR "神殿名称" = :campus
                       OR "神殿名称" = :campus_with_suffix
                       OR "神殿名称" = :campus_normalized)
                AND (
                    EXTRACT(YEAR FROM COALESCE("入学时间", CURRENT_DATE)::date) < :year
                    OR (
                        EXTRACT(YEAR FROM COALESCE("入学时间", CURRENT_DATE)::date) = :year
                        AND EXTRACT(MONTH FROM COALESCE("入学时间", CURRENT_DATE)::date) <= :month
                    )
                )
                AND COALESCE("姓名", '') != ''
                AND "姓名" IS NOT NULL
                AND "往任班主任" IS NOT NULL
                AND jsonb_typeof("往任班主任") = 'array'
                AND jsonb_array_length("往任班主任") > 0
                AND "身份证号" IS NOT NULL
                AND "身份证号" != ''
            ) AS all_students
            GROUP BY teacher_name
        ''')
        try:
            rows = db.execute(sql, {
                "campus": campus,
                "campus_with_suffix": campus_with_suffix,
                "campus_normalized": campus_normalized,
                "year": year,
                "month": month
            }).fetchall()
            for r in rows:
                result[(month, str(r[0]))] = int(r[1])
        except Exception as e:
            print(f"查询班级档案表按月份和班主任统计累计带生人数失败（{year}年{month}月）: {e}")
            import traceback
            traceback.print_exc()
    
    return result


def _count_new_old_refunds(db: Session, campus: str, year: int) -> Dict[int, tuple]:
    """统计新生/老生退费人数
    新生退费：退费时间 - 入学时间 <= 1个月
    老生退费：退费时间 - 入学时间 > 1个月
    如果入学时间为空，则按老生退费计算
    
    注意：优先使用退费时间的月份来统计，如果退费时间为空则使用月份字段
    """
    result = {m: (0, 0) for m in range(1, 13)}  # (新生退费, 老生退费)
    
    # 规范化神殿名称（处理带/不带"神殿"后缀的情况）
    campus_normalized = campus.rstrip('神殿').strip() if campus else ''
    campus_with_suffix = f"{campus_normalized}神殿" if campus_normalized else campus
    
    # 使用COALESCE，优先使用退费时间的月份，如果为空则使用月份字段
    sql = text('''
        SELECT COALESCE(EXTRACT(MONTH FROM "退费时间")::INTEGER, "月份") as refund_month,
               SUM(CASE 
                   WHEN "入学时间" IS NOT NULL 
                   AND TRIM("入学时间") != ''
                   AND "退费时间" IS NOT NULL
                   AND ("退费时间"::date - "入学时间"::date) <= 30 
                   THEN 1 
                   ELSE 0 
               END) as new_count,
               SUM(CASE 
                   WHEN "入学时间" IS NULL 
                        OR TRIM("入学时间") = ''
                        OR "退费时间" IS NULL
                        OR ("退费时间"::date - "入学时间"::date) > 30
                   THEN 1 
                   ELSE 0 
               END) as old_count
        FROM teaching_quality."退费明细表"
        WHERE (TRIM("神殿名称") = :campus 
               OR "神殿名称" = :campus
               OR "神殿名称" = :campus_with_suffix
               OR "神殿名称" = :campus_normalized)
          AND "年份" = :year
          AND COALESCE("姓名", '') != ''
          AND "姓名" IS NOT NULL
        GROUP BY COALESCE(EXTRACT(MONTH FROM "退费时间")::INTEGER, "月份")
    ''')
    try:
        rows = db.execute(sql, {
            "campus": campus,
            "campus_with_suffix": campus_with_suffix,
            "campus_normalized": campus_normalized,
            "year": year
        }).fetchall()
        for r in rows:
            if r[0]:
                result[int(r[0])] = (int(r[1] or 0), int(r[2] or 0))
    except Exception as e:
        print(f"统计新生/老生退费失败: {e}")
        import traceback
        traceback.print_exc()
    
    return result


def _count_new_old_refunds_by_teacher(db: Session, campus: str, year: int) -> Dict[tuple, tuple]:
    """统计每个班主任的新生/老生退费人数
    新生退费：退费时间 - 入学时间 <= 1个月
    老生退费：退费时间 - 入学时间 > 1个月
    如果入学时间为空，则按老生退费计算
    
    注意：优先使用退费时间的月份来统计，如果退费时间为空则使用月份字段
    """
    result = {}
    
    # 规范化神殿名称（处理带/不带"神殿"后缀的情况）
    campus_normalized = campus.rstrip('神殿').strip() if campus else ''
    campus_with_suffix = f"{campus_normalized}神殿" if campus_normalized else campus
    
    # 先查询所有退费记录，用于调试
    debug_sql = text('''
        SELECT "月份", "姓名", "班主任姓名", "退费时间", "入学时间", "年份"
        FROM teaching_quality."退费明细表"
        WHERE (TRIM("神殿名称") = :campus 
               OR "神殿名称" = :campus
               OR "神殿名称" = :campus_with_suffix
               OR "神殿名称" = :campus_normalized)
          AND "年份" = :year
        LIMIT 10
    ''')
    try:
        debug_rows = db.execute(debug_sql, {
            "campus": campus,
            "campus_with_suffix": campus_with_suffix,
            "campus_normalized": campus_normalized,
            "year": year
        }).fetchall()
        print("=== 退费明细表调试信息 ===")
        print(f"神殿: {campus}, 年份: {year}")
        print(f"查询到 {len(debug_rows)} 条记录:")
        for r in debug_rows:
            print(f"  月份={r[0]}, 姓名={r[1]}, 班主任={r[2]}, 退费时间={r[3]}, 入学时间={r[4]}, 年份={r[5]}")
    except Exception as e:
        print(f"调试查询失败: {e}")
    
    # 使用COALESCE，优先使用退费时间的月份，如果为空则使用月份字段
    sql = text('''
        SELECT COALESCE(EXTRACT(MONTH FROM "退费时间")::INTEGER, "月份") as refund_month, "班主任姓名",
               SUM(CASE 
                   WHEN "入学时间" IS NOT NULL 
                   AND TRIM("入学时间") != ''
                   AND "退费时间" IS NOT NULL
                   AND ("退费时间"::date - "入学时间"::date) <= 30 
                   THEN 1 
                   ELSE 0 
               END) as new_count,
               SUM(CASE 
                   WHEN "入学时间" IS NULL 
                        OR TRIM("入学时间") = ''
                        OR "退费时间" IS NULL
                        OR ("退费时间"::date - "入学时间"::date) > 30
                   THEN 1 
                   ELSE 0 
               END) as old_count
        FROM teaching_quality."退费明细表"
        WHERE (TRIM("神殿名称") = :campus 
               OR "神殿名称" = :campus
               OR "神殿名称" = :campus_with_suffix
               OR "神殿名称" = :campus_normalized)
          AND "年份" = :year 
          AND "班主任姓名" IS NOT NULL 
          AND "班主任姓名" != ''
          AND COALESCE("姓名", '') != ''
          AND "姓名" IS NOT NULL
        GROUP BY COALESCE(EXTRACT(MONTH FROM "退费时间")::INTEGER, "月份"), "班主任姓名"
    ''')
    try:
        rows = db.execute(sql, {
            "campus": campus,
            "campus_with_suffix": campus_with_suffix,
            "campus_normalized": campus_normalized,
            "year": year
        }).fetchall()
        print(f"统计结果: {len(rows)} 条")
        for r in rows:
            print(f"  月份={r[0]}, 班主任={r[1]}, 新生退费={r[2]}, 老生退费={r[3]}")
            if r[0] and r[1]:
                result[(int(r[0]), str(r[1]))] = (int(r[2] or 0), int(r[3] or 0))
    except Exception as e:
        print(f"按班主任统计新生/老生退费失败: {e}")
        import traceback
        traceback.print_exc()
    
    return result


@router.get("/campus-stu-movement-calc", response_model=CalcOutput, summary="自动计算神殿学员异动汇总（按月）")
def calc_campus_movement_summary(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    """从各明细表自动计算每月的学员异动汇总数据"""
    
    # 获取累计带生人数（从班档案表）
    total_students = _get_total_students_from_class_file(db, campus, year)
    
    # 获取新生/老生退费人数
    new_old_refunds = _count_new_old_refunds(db, campus, year)
    
    # 获取各类异动人数
    suspension_counts = _count_detail_by_month(db, "休学明细表", campus, year)
    long_leave_counts = _count_detail_by_month(db, "长期请假明细表", campus, year)
    long_absence_counts = _count_detail_by_month(db, "长期不上课明细表", campus, year)
    vacation_counts = _count_detail_by_month(db, "寒暑假学生明细表", campus, year)
    other_counts = _count_detail_by_month(db, "其他情况明细表", campus, year)
    
    # 构建结果
    rows = []
    for month in range(1, 13):
        new_refund, old_refund = new_old_refunds.get(month, (0, 0))
        total_refund = new_refund + old_refund
        suspension = suspension_counts.get(month, 0)
        long_leave = long_leave_counts.get(month, 0)
        long_absence = long_absence_counts.get(month, 0)
        vacation = vacation_counts.get(month, 0)
        other = other_counts.get(month, 0)
        total_movement = total_refund + suspension + long_leave + long_absence + vacation + other
        
        rows.append(MonthSummary(
            month=month,
            totalStudents=total_students.get(month, 0),
            newRefundCount=new_refund,
            oldRefundCount=old_refund,
            totalRefundCount=total_refund,
            suspensionCount=suspension,
            longLeaveCount=long_leave,
            longNoClassCount=long_absence,
            holidayCount=vacation,
            otherCount=other,
            totalMovementCount=total_movement,
        ))
    
    return CalcOutput(神殿名称=campus, 年份=year, 行列表=rows)


@router.get("/campus-personal-stu-movement-calc", response_model=PersonalCalcOutput, summary="自动计算神殿个人学员异动汇总（年汇总）")
def calc_campus_personal_movement_summary(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    db: Session = Depends(get_db),
):
    """从各明细表自动计算按班主任汇总的学员异动数据"""
    
    # 获取每个班主任的累计带生人数
    teacher_students = _get_students_by_teacher_from_class_file(db, campus, year)
    
    # 获取所有班主任名单
    all_teachers = set(teacher_students.keys())
    
    # 获取各类异动按班主任统计
    refund_by_teacher = _count_new_old_refunds_by_teacher(db, campus, year)
    suspension_by_teacher = _count_detail_by_month_and_teacher(db, "休学明细表", "原班主任", campus, year)
    long_leave_by_teacher = _count_detail_by_month_and_teacher(db, "长期请假明细表", "原班主任", campus, year)
    long_absence_by_teacher = _count_detail_by_month_and_teacher(db, "长期不上课明细表", "原班主任", campus, year)
    vacation_by_teacher = _count_detail_by_month_and_teacher(db, "寒暑假学生明细表", "原班主任", campus, year)
    other_by_teacher = _count_detail_by_month_and_teacher(db, "其他情况明细表", "班主任姓名", campus, year)
    
    # 收集所有涉及到的班主任
    for key in refund_by_teacher.keys():
        all_teachers.add(key[1])
    for counts in [suspension_by_teacher, long_leave_by_teacher, long_absence_by_teacher, vacation_by_teacher, other_by_teacher]:
        for key in counts.keys():
            all_teachers.add(key[1])
    
    # 按班主任汇总
    teacher_summary = {}
    for teacher in all_teachers:
        summary = {
            'totalStudents': teacher_students.get(teacher, 0),
            'newRefundCount': 0,
            'oldRefundCount': 0,
            'totalRefundCount': 0,
            'suspensionCount': 0,
            'longLeaveCount': 0,
            'longNoClassCount': 0,
            'holidayCount': 0,
            'otherCount': 0,
        }
        
        # 汇总12个月的数据
        for month in range(1, 13):
            if (month, teacher) in refund_by_teacher:
                new_r, old_r = refund_by_teacher[(month, teacher)]
                summary['newRefundCount'] += new_r
                summary['oldRefundCount'] += old_r
            summary['suspensionCount'] += suspension_by_teacher.get((month, teacher), 0)
            summary['longLeaveCount'] += long_leave_by_teacher.get((month, teacher), 0)
            summary['longNoClassCount'] += long_absence_by_teacher.get((month, teacher), 0)
            summary['holidayCount'] += vacation_by_teacher.get((month, teacher), 0)
            summary['otherCount'] += other_by_teacher.get((month, teacher), 0)
        
        summary['totalRefundCount'] = summary['newRefundCount'] + summary['oldRefundCount']
        summary['totalMovementCount'] = (
            summary['totalRefundCount'] + summary['suspensionCount'] + 
            summary['longLeaveCount'] + summary['longNoClassCount'] + 
            summary['holidayCount'] + summary['otherCount']
        )
        teacher_summary[teacher] = summary
    
    # 构建结果
    rows = [
        PersonalSummary(teacherName=teacher, **summary)
        for teacher, summary in sorted(teacher_summary.items())
    ]
    
    return PersonalCalcOutput(神殿名称=campus, 年份=year, 行列表=rows)


@router.get("/campus-monthly-personal-stu-movement-calc", response_model=MonthlyPersonalCalcOutput, summary="自动计算神殿月度个人学员异动")
def calc_campus_monthly_personal_movement_summary(
    campus: str = Query(..., alias="campus"),
    year: int = Query(..., alias="year"),
    month: Optional[int] = Query(None, alias="month"),
    teacher: Optional[str] = Query(None, alias="teacher"),
    db: Session = Depends(get_db),
):
    """从各明细表自动计算月度个人学员异动数据，支持按月份和班主任筛选"""
    
    # 获取每个月份和班主任的累计带生人数
    students_by_month_teacher = _get_students_by_month_and_teacher_from_class_file(db, campus, year)
    
    # 获取所有班主任名单
    all_teachers = set()
    for key in students_by_month_teacher.keys():
        all_teachers.add(key[1])
    
    # 获取各类异动按月份和班主任统计
    refund_by_mt = _count_new_old_refunds_by_teacher(db, campus, year)
    suspension_by_mt = _count_detail_by_month_and_teacher(db, "休学明细表", "原班主任", campus, year)
    long_leave_by_mt = _count_detail_by_month_and_teacher(db, "长期请假明细表", "原班主任", campus, year)
    long_absence_by_mt = _count_detail_by_month_and_teacher(db, "长期不上课明细表", "原班主任", campus, year)
    vacation_by_mt = _count_detail_by_month_and_teacher(db, "寒暑假学生明细表", "原班主任", campus, year)
    other_by_mt = _count_detail_by_month_and_teacher(db, "其他情况明细表", "班主任姓名", campus, year)
    
    # 收集所有涉及到的班主任
    for key in refund_by_mt:
        all_teachers.add(key[1])
    for counts in [suspension_by_mt, long_leave_by_mt, long_absence_by_mt, vacation_by_mt, other_by_mt]:
        for key in counts:
            all_teachers.add(key[1])
    
    # 确定要处理的月份范围
    months_to_process = [month] if month else range(1, 13)
    
    # 确定要处理的班主任范围
    teachers_to_process = [teacher] if teacher else sorted(all_teachers)
    
    # 构建结果
    rows = []
    for m in months_to_process:
        for t in teachers_to_process:
            if teacher and t != teacher:
                continue
            
            new_refund, old_refund = refund_by_mt.get((m, t), (0, 0))
            total_refund = new_refund + old_refund
            suspension = suspension_by_mt.get((m, t), 0)
            long_leave = long_leave_by_mt.get((m, t), 0)
            long_absence = long_absence_by_mt.get((m, t), 0)
            vacation = vacation_by_mt.get((m, t), 0)
            other = other_by_mt.get((m, t), 0)
            total_movement = total_refund + suspension + long_leave + long_absence + vacation + other
            
            rows.append(MonthlyPersonalSummary(
                month=m,
                teacherName=t,
                totalStudents=students_by_month_teacher.get((m, t), 0),
                newRefundCount=new_refund,
                oldRefundCount=old_refund,
                totalRefundCount=total_refund,
                suspensionCount=suspension,
                longLeaveCount=long_leave,
                longNoClassCount=long_absence,
                holidayCount=vacation,
                otherCount=other,
                totalMovementCount=total_movement,
            ))
    
    return MonthlyPersonalCalcOutput(
        神殿名称=campus, 
        年份=year, 
        月份=month,
        班主任=teacher,
        行列表=rows
    )
