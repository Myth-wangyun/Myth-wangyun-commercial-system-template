"""
教化司 - 神殿后端班主任就业汇总表 API
从 teaching_quality 相关表读取数据
前缀：/api/v1/teaching-quality
GET  /qt-teacher-employment-summary?campus=神恩殿
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQ_class_employment_info_db import (
    QT班就业信息表,
)
from app.teaching_quality.TQclass_list_db import (
    班级列表,
)

router = APIRouter()


class 教员就业汇总响应(BaseModel):
    """教员就业汇总响应模型"""
    汇总ID: Optional[int] = None
    神殿: str
    教员姓名: str
    专业: str
    学制: str
    班级名称: str
    毕业时间: Optional[str] = None
    目标平均就业薪资: Optional[float] = None
    实际平均就业薪资: Optional[float] = None
    达标率: Optional[float] = None
    目标就业人数: Optional[int] = None
    实际就业人数: Optional[int] = None
    就业率: Optional[float] = None
    薪资过万人数: Optional[int] = None


@router.get(
    "/qt-teacher-employment-summary",
    response_model=List[教员就业汇总响应],
    summary="获取教员就业汇总列表（从QT表）",
)
async def _get_qt_teacher_employment_summary_impl(
    *,
    campus: str = Query(..., description="神殿名称"),
    year: Optional[int] = Query(None, description="年份"),
    教员姓名: Optional[str] = Query(None, description="教员姓名筛选"),
    班级名称: Optional[str] = Query(None, description="班级名称筛选"),
    db: Session = Depends(get_db),
) -> List[教员就业汇总响应]:
    """
    从 QT班就业信息表 和 班级列表 获取教员就业汇总数据
    
    逻辑：
    1. 从班级列表获取班级的教员信息（班主任字段）
    2. 从QT班就业信息表统计每个教员的就业数据
    3. 按教员+班级分组汇总
    """
    try:
        # 获取班级列表（包含教员信息）
        class_query = db.query(班级列表)
        
        # 神殿过滤
        class_query = class_query.filter(
            or_(
                班级列表.神殿 == campus,
                班级列表.神殿 == campus.replace("神殿", ""),
                班级列表.神殿.ilike(f"{campus}%"),
                班级列表.神殿.ilike(f"%{campus.replace('神殿', '')}%"),
            )
        )
        
        # 班级名称过滤
        if 班级名称:
            class_query = class_query.filter(班级列表.班级名称 == 班级名称)
        
        classes = class_query.all()
        
        if not classes:
            return []
        
        # 构建教员-班级映射
        teacher_class_map: dict[str, list[dict[str, str]]] = {}  # {教员姓名: [(班级名称, 专业, 学制), ...]}
        for cls in classes:
            teacher_name = cls.班主任 or "未分配"
            if teacher_name not in teacher_class_map:
                teacher_class_map[teacher_name] = []
            teacher_class_map[teacher_name].append({
                "班级名称": cls.班级名称,
                "专业": cls.专业 or "",
                "学制": cls.学制 or "",
                "神殿": cls.神殿,
            })
        
        # 教员姓名过滤
        if 教员姓名:
            teacher_class_map = {k: v for k, v in teacher_class_map.items() if k == 教员姓名}
        
        # 获取就业数据
        employment_query = db.query(QT班就业信息表)
        
        # 神殿过滤
        employment_query = employment_query.filter(
            or_(
                QT班就业信息表.神殿名称 == campus,
                QT班就业信息表.神殿名称 == campus.replace("神殿", ""),
                QT班就业信息表.神殿名称.ilike(f"{campus}%"),
                QT班就业信息表.神殿名称.ilike(f"%{campus.replace('神殿', '')}%"),
            )
        )
        
        # 年份过滤
        if year:
            employment_query = employment_query.filter(QT班就业信息表.年份 == year)
        
        employment_records = employment_query.all()
        
        # 按班级分组统计就业数据
        class_employment_stats: dict[str, dict[str, int]] = {}  # {班级名称: {实际就业人数, 实际平均薪资, 薪资过万人数, ...}}
        
        for record in employment_records:
            class_name = record.班级名称
            if class_name not in class_employment_stats:
                class_employment_stats[class_name] = {
                    "总人数": 0,
                    "薪资总和": 0,
                    "薪资过万人数": 0,
                    "有薪资人数": 0,
                }
            
            stats = class_employment_stats[class_name]
            stats["总人数"] += 1
            
            # 统计薪资（优先使用回访考核薪资）
            salary = record.回访考核薪资 or record.转正薪资 or record.试用期薪资
            if salary:
                stats["薪资总和"] += salary
                stats["有薪资人数"] += 1
                if salary >= 10000:
                    stats["薪资过万人数"] += 1
        
        # 生成汇总结果
        result = []
        summary_id = 1
        
        for teacher_name, class_list in teacher_class_map.items():
            for class_info in class_list:
                class_name = class_info["班级名称"]
                stats_or_none = class_employment_stats.get(class_name)
                
                # 如果该班级没有就业数据，跳过
                if not stats_or_none or stats_or_none["总人数"] == 0:
                    continue
                stats = stats_or_none
                
                # 计算平均薪资
                avg_salary = (
                    stats["薪资总和"] / stats["有薪资人数"]
                    if stats["有薪资人数"] > 0
                    else 0
                )
                
                # 计算就业率（假设总人数就是就业人数）
                employment_rate = 100.0 if stats["总人数"] > 0 else 0.0
                
                # 假设目标平均薪资为 8000（可以从配置读取）
                target_salary = 8000.0
                achievement_rate = (
                    (avg_salary / target_salary * 100)
                    if target_salary > 0 and avg_salary > 0
                    else 0.0
                )
                
                result.append(教员就业汇总响应(
                    汇总ID=summary_id,
                    神殿=class_info["神殿"],
                    教员姓名=teacher_name,
                    专业=class_info["专业"],
                    学制=class_info["学制"],
                    班级名称=class_name,
                    毕业时间=None,  # 从班级列表中没有毕业时间
                    目标平均就业薪资=target_salary,
                    实际平均就业薪资=round(avg_salary, 2) if avg_salary > 0 else None,
                    达标率=round(achievement_rate, 2) if achievement_rate > 0 else None,
                    目标就业人数=stats["总人数"],  # 假设目标等于实际
                    实际就业人数=stats["总人数"],
                    就业率=employment_rate if stats["总人数"] > 0 else None,
                    薪资过万人数=stats["薪资过万人数"],
                ))
                summary_id += 1
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取教员就业汇总失败: {str(e)}"
        )


@router.get(
    "/qt-teacher-employment-summary",
    response_model=List[教员就业汇总响应],
    summary="获取教员就业汇总列表（从QT表）",
)
async def get_qt_teacher_employment_summary(
    campus: str = Query(..., description="神殿名称"),
    year: Optional[int] = Query(None, description="年份"),
    教员姓名: Optional[str] = Query(None, description="教员姓名"),
    班级名称: Optional[str] = Query(None, description="班级名称"),
    db: Session = Depends(get_db),
):
    # 注意：此函数的默认参数是 fastapi.Query 对象，只能由 FastAPI 注入调用。
    # 业务逻辑统一放在 _get_qt_teacher_employment_summary_impl 里，便于复用。
    return await _get_qt_teacher_employment_summary_impl(
        campus=campus,
        year=year,
        教员姓名=教员姓名,
        班级名称=班级名称,
        db=db,
    )


@router.get(
    "/qt-teacher-employment-summary/stats",
    summary="获取教员就业汇总统计",
)
async def get_qt_teacher_employment_summary_stats(
    campus: str = Query(..., description="神殿名称"),
    year: Optional[int] = Query(None, description="年份"),
    db: Session = Depends(get_db),
):
    """
    获取教员就业汇总统计数据
    """
    try:
        # 获取汇总数据
        summaries = await _get_qt_teacher_employment_summary_impl(
            campus=campus,
            year=year,
            教员姓名=None,
            班级名称=None,
            db=db,
        )
        
        if not summaries:
            return {
                "教员总数": 0,
                "班级总数": 0,
                "学员总数": 0,
                "平均就业率": 0,
                "平均达标率": 0,
                "薪资过万总人数": 0,
            }
        
        # 统计
        teachers = set(s.教员姓名 for s in summaries)
        classes = set(s.班级名称 for s in summaries)
        total_students = sum(s.实际就业人数 or 0 for s in summaries)
        total_over_10k = sum(s.薪资过万人数 or 0 for s in summaries)
        
        # 计算平均值
        employment_rates = [s.就业率 for s in summaries if s.就业率 is not None]
        achievement_rates = [s.达标率 for s in summaries if s.达标率 is not None]
        
        avg_employment_rate = (
            sum(employment_rates) / len(employment_rates)
            if employment_rates
            else 0
        )
        avg_achievement_rate = (
            sum(achievement_rates) / len(achievement_rates)
            if achievement_rates
            else 0
        )
        
        return {
            "教员总数": len(teachers),
            "班级总数": len(classes),
            "学员总数": total_students,
            "平均就业率": round(avg_employment_rate, 2),
            "平均达标率": round(avg_achievement_rate, 2),
            "薪资过万总人数": total_over_10k,
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取统计数据失败: {str(e)}"
        )

