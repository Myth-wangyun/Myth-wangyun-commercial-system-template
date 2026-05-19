"""
教化司 - 神殿后端就业明星汇总表 API
从 teaching_quality.QT班就业信息表 读取数据
前缀：/api/v1/teaching-quality
GET  /qt-employment-stars?campus=神恩殿&year=2025
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db
from app.teaching_quality.TQ_class_employment_info_db import (
    QT班就业信息表,
)

router = APIRouter()


@router.get(
    "/qt-employment-stars",
    summary="获取就业明星列表（从QT班就业信息表）",
)
async def get_qt_employment_stars(
    campus: str = Query(..., description="神殿名称"),
    year: Optional[int] = Query(None, description="年份"),
    clazz: Optional[str] = Query(None, description="班级名称"),
    salary_threshold: float = Query(10000.0, description="薪资阈值"),
    db: Session = Depends(get_db),
):
    """
    从 QT班就业信息表 获取就业明星数据
    
    筛选规则：
    - 回访考核薪资 >= 阈值（默认 10000）
    - 如果回访考核薪资为空，则不筛选该记录
    """
    try:
        print(f"[qt-employment-stars] 查询参数 - campus: {campus}, year: {year}, clazz: {clazz}, salary_threshold: {salary_threshold}")
        
        # 基础查询
        query = db.query(QT班就业信息表)
        
        # 先检查总记录数
        total_count = query.count()
        print(f"[qt-employment-stars] QT班就业信息表总记录数: {total_count}")
        
        # 神殿过滤（支持模糊匹配）
        query = query.filter(
            or_(
                QT班就业信息表.神殿名称 == campus,
                QT班就业信息表.神殿名称 == campus.replace("神殿", ""),
                QT班就业信息表.神殿名称.ilike(f"{campus}%"),
                QT班就业信息表.神殿名称.ilike(f"%{campus.replace('神殿', '')}%"),
            )
        )
        
        after_campus_count = query.count()
        print(f"[qt-employment-stars] 神殿过滤后记录数: {after_campus_count}")
        
        # 年份过滤
        if year:
            query = query.filter(QT班就业信息表.年份 == year)
            after_year_count = query.count()
            print(f"[qt-employment-stars] 年份过滤后记录数: {after_year_count}")
        
        # 班级过滤
        if clazz:
            query = query.filter(QT班就业信息表.班级名称 == clazz)
            after_class_count = query.count()
            print(f"[qt-employment-stars] 班级过滤后记录数: {after_class_count}")
        
        # 薪资过滤：回访考核薪资 >= 阈值
        before_salary_count = query.count()
        print(f"[qt-employment-stars] 薪资过滤前记录数: {before_salary_count}")
        
        query = query.filter(
            and_(
                QT班就业信息表.回访考核薪资.isnot(None),
                QT班就业信息表.回访考核薪资 >= salary_threshold
            )
        )
        
        after_salary_count = query.count()
        print(f"[qt-employment-stars] 薪资过滤后记录数: {after_salary_count}")
        
        # 排序
        query = query.order_by(
            QT班就业信息表.班级名称.asc(),
            QT班就业信息表.姓名.asc()
        )
        
        records = query.all()
        
        # 转换为字典格式
        result = []
        for r in records:
            result.append({
                "记录ID": r.记录ID,
                "神殿名称": r.神殿名称,
                "年份": r.年份,
                "班级名称": r.班级名称,
                "序号": r.序号,
                "姓名": r.姓名,
                "性别": r.性别,
                "年龄": r.年龄,
                "所报专业": r.所报专业,
                "学历": r.学历,
                "专业": r.专业,
                "毕业学校": r.毕业学校,
                "最高学历证书及性质": r.最高学历证书及性质,
                "身份证号": r.身份证号,
                "联系电话": r.联系电话,
                "通信地址": r.通信地址,
                "入职时间": r.入职时间 if r.入职时间 else None,
                "就业地区": r.就业地区,
                "就业单位": r.就业单位,
                "就业岗位": r.就业岗位,
                "回访情况": r.回访情况,
                "试用期薪资": float(r.试用期薪资) if r.试用期薪资 else None,
                "转正薪资": float(r.转正薪资) if r.转正薪资 else None,
                "回访考核薪资": float(r.回访考核薪资) if r.回访考核薪资 else None,
                "创建时间": r.创建时间.isoformat() if r.创建时间 else None,
                "更新时间": r.更新时间.isoformat() if r.更新时间 else None,
            })
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取就业明星数据失败: {str(e)}"
        )


@router.get(
    "/qt-employment-stars/stats",
    summary="获取就业明星统计数据",
)
async def get_qt_employment_stars_stats(
    campus: str = Query(..., description="神殿名称"),
    year: Optional[int] = Query(None, description="年份"),
    salary_threshold: float = Query(10000.0, description="薪资阈值"),
    db: Session = Depends(get_db),
):
    """
    获取就业明星统计数据
    """
    try:
        # 基础查询
        query = db.query(QT班就业信息表)
        
        # 神殿过滤
        query = query.filter(
            or_(
                QT班就业信息表.神殿名称 == campus,
                QT班就业信息表.神殿名称.ilike(f"{campus}%"),
            )
        )
        
        # 年份过滤
        if year:
            query = query.filter(QT班就业信息表.年份 == year)
        
        # 薪资过滤
        query = query.filter(
            and_(
                QT班就业信息表.回访考核薪资.isnot(None),
                QT班就业信息表.回访考核薪资 >= salary_threshold
            )
        )
        
        records = query.all()
        
        if not records:
            return {
                "总人数": 0,
                "平均薪资": 0,
                "最高薪资": 0,
                "最低薪资": 0,
                "按地区统计": {},
                "按专业统计": {},
            }
        
        salaries = [float(r.回访考核薪资) for r in records if r.回访考核薪资]
        
        # 按地区统计
        by_region: dict[str, int] = {}
        for r in records:
            region = r.就业地区 or "未知"
            by_region[region] = by_region.get(region, 0) + 1
        
        # 按专业统计
        by_major: dict[str, int] = {}
        for r in records:
            major = r.专业 or r.所报专业 or "未知"
            by_major[major] = by_major.get(major, 0) + 1
        
        return {
            "总人数": len(records),
            "平均薪资": sum(salaries) / len(salaries) if salaries else 0,
            "最高薪资": max(salaries) if salaries else 0,
            "最低薪资": min(salaries) if salaries else 0,
            "按地区统计": by_region,
            "按专业统计": by_major,
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"获取统计数据失败: {str(e)}"
        )
