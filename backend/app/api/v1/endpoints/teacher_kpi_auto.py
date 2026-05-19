"""
教员KPI自动计算API
从 academic schema 相关表自动获取KPI指标数据
"""

from typing import List, Optional

from app.core.database import get_db
from app.crud.teacher_kpi_auto_calc import (
    auto_calculate_teacher_kpi,
    batch_calculate_teachers_kpi,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

router = APIRouter()


class AutoKPIMetrics(BaseModel):
    """自动计算的KPI指标"""

    name: str = Field(..., description="教员姓名")
    assignmentSubmitRate: Optional[float] = Field(
        None, description="作业/项目提交率 (%)"
    )
    assignmentPassRate: Optional[float] = Field(None, description="作业/项目合格率 (%)")
    examPassRate: Optional[float] = Field(None, description="考试合格率 (%)")
    employmentCount: Optional[int] = Field(None, description="学员就业人数")
    employmentSalary: Optional[float] = Field(None, description="平均就业薪资 (元)")
    attendanceRate: Optional[float] = Field(None, description="全勤率 (%)")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "张老师",
                "assignmentSubmitRate": 95.5,
                "assignmentPassRate": 88.3,
                "examPassRate": 92.0,
                "employmentCount": 15,
                "employmentSalary": 8500.0,
                "attendanceRate": 98.5,
            }
        },
    )


class AutoKPIResponse(BaseModel):
    """自动计算KPI响应"""

    campus: str
    year: int
    month: int
    metrics: List[AutoKPIMetrics]


@router.get(
    "/teacher-kpi/auto-calculate",
    response_model=AutoKPIResponse,
    summary="自动计算教员KPI指标",
    description="""
    从 academic schema 相关数据库表自动获取教员KPI指标数据

    **自动计算的指标包括：**
    - 作业/项目提交率：从 academic.class_assignment_grades 表获取
    - 作业/项目合格率：从 academic.class_assignment_grades 表获取
    - 考试合格率：从 academic.教员功能分析班级考试合格率表 获取
    - 学员就业人数：从 academic.神殿后端教员就业汇总表 获取
    - 平均就业薪资：从 academic.神殿后端教员就业汇总表 获取
    - 全勤率：待实现（需要考勤表）

    **数据来源：**
    - 以教员为中心进行统计
    - 通过 config.teacher_class_assignments 关联教员和班级
    - 自动聚合该教员负责的所有班级数据
    """,
)
def auto_calculate_kpi(
    campus: str = Query(..., description="神殿名称", example="主神殿"),
    year: int = Query(..., description="年份", example=2025),
    month: int = Query(..., ge=1, le=12, description="月份 (1-12)", example=1),
    teacher_name: Optional[str] = Query(
        None, description="教员姓名（可选，不传则计算所有教员）"
    ),
    db: Session = Depends(get_db),
):
    """
    自动计算教员KPI指标

    如果指定了 teacher_name，则只计算该教员的指标
    如果未指定，则计算该神殿所有教员的指标
    """
    try:
        print(
            f"[auto_calculate_kpi] 请求参数: campus={campus}, year={year}, month={month}, teacher_name={teacher_name}"
        )

        if teacher_name:
            # 计算单个教员
            metrics_data = auto_calculate_teacher_kpi(
                db=db, campus=campus, teacher_name=teacher_name, year=year, month=month
            )
            metrics = [AutoKPIMetrics(**metrics_data)]
        else:
            # 获取该神殿所有教员
            from sqlalchemy import text

            # 从 config.teacher_profiles 表获取该神殿的所有教员
            # role 字段在 teacher_class_assignments 表中
            query = text(
                """
                SELECT DISTINCT tp.name
                FROM config.teacher_profiles tp
                INNER JOIN config.teacher_class_assignments tca ON tp.id = tca.teacher_id
                INNER JOIN config.classes c ON tca.class_id = c.id
                WHERE c.campus_name = :campus
                    AND tca.role IN ('教员', '学术教员', 'teacher')
                ORDER BY tp.name
            """
            )

            result = db.execute(query, {"campus": campus})
            teacher_names = [row[0] for row in result.fetchall()]

            print(f"[auto_calculate_kpi] 找到 {len(teacher_names)} 个教员")

            if not teacher_names:
                # 如果没有找到教员，返回空列表
                metrics = []
            else:
                # 批量计算所有教员
                metrics_data_list = batch_calculate_teachers_kpi(
                    db=db,
                    campus=campus,
                    teacher_names=teacher_names,
                    year=year,
                    month=month,
                )
                metrics = [AutoKPIMetrics(**data) for data in metrics_data_list]

        return AutoKPIResponse(campus=campus, year=year, month=month, metrics=metrics)

    except Exception as e:
        import traceback

        error_detail = f"自动计算KPI指标失败: {str(e)}\n{traceback.format_exc()}"
        print(f"[auto_calculate_kpi] 错误: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)


@router.get(
    "/teacher-kpi/auto-calculate/single",
    response_model=AutoKPIMetrics,
    summary="自动计算单个教员KPI指标",
    description="从 academic schema 相关数据库表自动获取单个教员的KPI指标数据",
)
def auto_calculate_single_teacher_kpi(
    campus: str = Query(..., description="神殿名称", example="主神殿"),
    teacher_name: str = Query(..., description="教员姓名", example="张老师"),
    year: int = Query(..., description="年份", example=2025),
    month: int = Query(..., ge=1, le=12, description="月份 (1-12)", example=1),
    db: Session = Depends(get_db),
):
    """
    自动计算单个教员的KPI指标

    返回该教员在指定年月的所有KPI指标
    """
    try:
        print(
            f"[auto_calculate_single_teacher_kpi] 请求参数: campus={campus}, teacher_name={teacher_name}, year={year}, month={month}"
        )

        metrics_data = auto_calculate_teacher_kpi(
            db=db, campus=campus, teacher_name=teacher_name, year=year, month=month
        )

        return AutoKPIMetrics(**metrics_data)

    except Exception as e:
        import traceback

        error_detail = (
            f"自动计算单个教员KPI指标失败: {str(e)}\n{traceback.format_exc()}"
        )
        print(f"[auto_calculate_single_teacher_kpi] 错误: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)
