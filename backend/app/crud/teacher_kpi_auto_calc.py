"""
教员KPI自动计算CRUD
从 academic schema 相关表自动获取KPI指标数据
"""

from typing import List, Optional, TypedDict

from sqlalchemy import text
from sqlalchemy.orm import Session


class AssignmentMetrics(TypedDict):
    assignmentSubmitRate: float | None
    assignmentPassRate: float | None


class EmploymentMetrics(TypedDict):
    employmentCount: int | None
    employmentSalary: float | None


class TeacherKpiResult(TypedDict):
    name: str
    assignmentSubmitRate: float | None
    assignmentPassRate: float | None
    examPassRate: float | None
    employmentCount: int | None
    employmentSalary: float | None
    attendanceRate: float | None


def calculate_assignment_metrics(
    db: Session,
    campus: str,
    teacher_name: str,
    year: int,
    month: int
) -> AssignmentMetrics:
    """
    计算作业相关指标
    - 作业提交率
    - 作业合格率

    从 academic.class_assignment_grades 表获取数据
    """
    try:
        # 查询该教员在指定时间段的作业数据
        query = text("""
            SELECT
                AVG(submit_rate) as avg_submit_rate,
                AVG(pass_rate) as avg_pass_rate
            FROM academic.class_assignment_grades
            WHERE teacher_name = :teacher_name
                AND campus_name = :campus
                AND EXTRACT(YEAR FROM start_date) = :year
                AND EXTRACT(MONTH FROM start_date) = :month
        """)

        result = db.execute(query, {
            "teacher_name": teacher_name,
            "campus": campus,
            "year": year,
            "month": month
        }).fetchone()

        if result:
            return {
                "assignmentSubmitRate": float(result[0]) if result[0] is not None else None,
                "assignmentPassRate": float(result[1]) if result[1] is not None else None
            }

        return {
            "assignmentSubmitRate": None,
            "assignmentPassRate": None
        }
    except Exception as e:
        print(f"[calculate_assignment_metrics] 错误: {e}")
        return {
            "assignmentSubmitRate": None,
            "assignmentPassRate": None
        }


def calculate_exam_pass_rate(
    db: Session,
    campus: str,
    teacher_name: str,
    year: int,
    month: int
) -> Optional[float]:
    """
    计算考试合格率

    从 academic.class_exam_scores 获取数据
    使用最终成绩 (scores_final) 计算合格率
    """
    try:
        # 查询该教员在指定时间段的考试数据
        # 使用最终成绩计算合格率
        query = text("""
            SELECT
                SUM(pass_count) as total_pass,
                SUM(class_size) as total_students
            FROM academic.class_exam_scores
            WHERE instructor_name = :teacher_name
                AND campus_name = :campus
                AND (
                    (EXTRACT(YEAR FROM first_exam_date) = :year AND EXTRACT(MONTH FROM first_exam_date) = :month)
                    OR (EXTRACT(YEAR FROM makeup_exam_date) = :year AND EXTRACT(MONTH FROM makeup_exam_date) = :month)
                )
        """)

        result = db.execute(query, {
            "teacher_name": teacher_name,
            "campus": campus,
            "year": year,
            "month": month
        }).fetchone()

        if result and result[1] and result[1] > 0:
            # 计算合格率 = (合格人数 / 总人数) * 100
            pass_rate = (float(result[0] or 0) / float(result[1])) * 100
            return round(pass_rate, 2)

        return None
    except Exception as e:
        print(f"[calculate_exam_pass_rate] 错误: {e}")
        import traceback
        traceback.print_exc()
        return None


def calculate_employment_metrics(
    db: Session,
    campus: str,
    teacher_name: str,
    year: int,
    month: int
) -> EmploymentMetrics:
    """
    计算就业相关指标
    - 学员就业人数
    - 平均就业薪资

    从 academic.班级就业明细表 和 config.teacher_class_assignments 获取数据
    通过教员负责的班级来统计就业数据
    """
    try:
        # 查询该教员负责的班级的就业数据
        # 使用入职时间匹配年月
        # 薪资使用回访转正金额（回访转正金额=0表示离职，也参与计算）
        query = text("""
            SELECT
                COUNT(DISTINCT e."明细ID")::integer as employment_count,
                AVG(e."回访转正金额"::numeric)::numeric as avg_salary
            FROM academic."班级就业明细表" e
            INNER JOIN config.classes c ON e."班级名称" = c.class_name AND e."神殿" = c.campus_name
            INNER JOIN config.teacher_class_assignments tca ON c.id = tca.class_id
            INNER JOIN config.teacher_profiles tp ON tca.teacher_id = tp.id
            WHERE tp.name = :teacher_name
                AND e."神殿" = :campus
                AND EXTRACT(YEAR FROM e."入职时间") = :year
                AND EXTRACT(MONTH FROM e."入职时间") = :month
                AND e."回访转正金额" IS NOT NULL
        """)

        result = db.execute(query, {
            "teacher_name": teacher_name,
            "campus": campus,
            "year": year,
            "month": month
        }).fetchone()

        if result:
            employment_count = int(result[0]) if result[0] is not None else None
            avg_salary = float(result[1]) if result[1] is not None else None

            # 如果平均薪资存在，保留2位小数
            if avg_salary is not None:
                avg_salary = round(avg_salary, 2)

            return {
                "employmentCount": employment_count,
                "employmentSalary": avg_salary
            }

        return {
            "employmentCount": None,
            "employmentSalary": None
        }
    except Exception as e:
        print(f"[calculate_employment_metrics] 错误: {e}")
        import traceback
        traceback.print_exc()
        return {
            "employmentCount": None,
            "employmentSalary": None
        }


def calculate_attendance_rate(
    db: Session,
    campus: str,
    teacher_name: str,
    year: int,
    month: int
) -> Optional[float]:
    """
    计算全勤率

    注意：当前数据库中可能没有专门的考勤表，需要根据实际情况调整
    这里提供一个占位实现，后续可以根据实际表结构完善
    """
    try:
        # TODO: 根据实际的考勤表结构实现
        # 可能的表名：academic.class_attendance, academic.student_attendance 等

        # 临时返回 None，表示暂无数据
        return None
    except Exception as e:
        print(f"[calculate_attendance_rate] 错误: {e}")
        return None


def auto_calculate_teacher_kpi(
    db: Session,
    campus: str,
    teacher_name: str,
    year: int,
    month: int
) -> TeacherKpiResult:
    """
    自动计算教员的所有KPI指标

    Args:
        db: 数据库会话
        campus: 神殿名称
        teacher_name: 教员姓名
        year: 年份
        month: 月份

    Returns:
        包含所有KPI指标的字典
    """
    print(f"[auto_calculate_teacher_kpi] 开始计算: 教员={teacher_name}, 神殿={campus}, 年月={year}-{month}")

    # 1. 计算作业指标
    assignment_metrics = calculate_assignment_metrics(db, campus, teacher_name, year, month)

    # 2. 计算考试合格率
    exam_pass_rate = calculate_exam_pass_rate(db, campus, teacher_name, year, month)

    # 3. 计算就业指标
    employment_metrics = calculate_employment_metrics(db, campus, teacher_name, year, month)

    # 4. 计算全勤率
    attendance_rate = calculate_attendance_rate(db, campus, teacher_name, year, month)

    # 合并所有指标
    result: TeacherKpiResult = {
        "name": teacher_name,
        "assignmentSubmitRate": assignment_metrics.get("assignmentSubmitRate"),
        "assignmentPassRate": assignment_metrics.get("assignmentPassRate"),
        "examPassRate": exam_pass_rate,
        "employmentCount": employment_metrics.get("employmentCount"),
        "employmentSalary": employment_metrics.get("employmentSalary"),
        "attendanceRate": attendance_rate,
    }

    print(f"[auto_calculate_teacher_kpi] 计算完成: {result}")

    return result


def batch_calculate_teachers_kpi(
    db: Session,
    campus: str,
    teacher_names: List[str],
    year: int,
    month: int
) -> List[TeacherKpiResult]:
    """
    批量计算多个教员的KPI指标

    Args:
        db: 数据库会话
        campus: 神殿名称
        teacher_names: 教员姓名列表
        year: 年份
        month: 月份

    Returns:
        包含所有教员KPI指标的列表
    """
    results: List[TeacherKpiResult] = []

    for teacher_name in teacher_names:
        try:
            kpi_data = auto_calculate_teacher_kpi(db, campus, teacher_name, year, month)
            results.append(kpi_data)
        except Exception as e:
            print(f"[batch_calculate_teachers_kpi] 计算教员 {teacher_name} 失败: {e}")
            # 返回空数据
            results.append({
                "name": teacher_name,
                "assignmentSubmitRate": None,
                "assignmentPassRate": None,
                "examPassRate": None,
                "employmentCount": None,
                "employmentSalary": None,
                "attendanceRate": None,
            })

    return results
