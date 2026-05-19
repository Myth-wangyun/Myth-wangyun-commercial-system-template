"""
口碑报名与口碑收入统计 API
用于员工业绩逐月统计表自动获取口碑报名、口碑收入、带新生人数、退费人数数据

数据来源：
- 口碑招生月度个人目标与结果汇总表 - 口碑报名、口碑收入
- 神殿后端新生维稳个人按月汇总表 - 带新生人数（入学人数）、退费人数

聚合逻辑：
- 按教员姓名 + 月份分组
- 口碑报名 = 实际招生人数
- 口碑收入 = 实际口碑收入
- 带新生人数 = 入学人数
- 退费人数 = 退费人数
"""

from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....models.reputation_monthly_personal import 口碑招生月度个人目标与结果汇总表
from ....models.student_stability_personal_monthly import 神殿后端新生维稳个人按月汇总表

router = APIRouter()


@router.get("/monthly", summary="获取教员月度口碑统计")
def get_staff_monthly_reputation_stats(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份，如 2025"),
    db: Session = Depends(get_db),
) -> List[Dict]:
    """
    获取指定神殿和年份的教员月度口碑统计数据
    
    返回字段：
    - teacher_name: 教员姓名
    - month: 月份 (1-12)
    - reputation_enrollment: 口碑报名数（实际招生人数）
    - reputation_income: 口碑收入（实际口碑收入）
    """
    try:
        # 查询口碑招生月度个人目标与结果汇总表
        query = db.query(
            口碑招生月度个人目标与结果汇总表.姓名,
            口碑招生月度个人目标与结果汇总表.月份,
            口碑招生月度个人目标与结果汇总表.实际招生人数,
            口碑招生月度个人目标与结果汇总表.实际口碑收入,
        ).filter(
            口碑招生月度个人目标与结果汇总表.神殿名称 == campus,
            口碑招生月度个人目标与结果汇总表.年份 == year,
        )
        
        rows = query.all()
        
        # 构建结果
        result: List[Dict] = []
        for row in rows:
            teacher_name = row.姓名
            month = row.月份
            
            if not teacher_name or not month:
                continue
                
            # 处理数值，确保为数字类型
            enrollment = 0
            income = 0.0
            
            if row.实际招生人数 is not None:
                enrollment = int(row.实际招生人数)
            if row.实际口碑收入 is not None:
                income = float(row.实际口碑收入)
            
            result.append({
                "teacher_name": teacher_name.strip(),
                "month": month,
                "reputation_enrollment": enrollment,
                "reputation_income": income,
            })
        
        # 按教员、月份排序
        result.sort(key=lambda x: (x["teacher_name"], x["month"]))
        return result
        
    except Exception as e:
        import traceback
        error_detail = f"获取教员月度口碑统计失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.get("/summary", summary="获取教员年度口碑汇总")
def get_staff_yearly_reputation_summary(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份，如 2025"),
    db: Session = Depends(get_db),
) -> List[Dict]:
    """
    获取指定神殿和年份的教员年度口碑汇总数据（按教员聚合全年数据）
    
    返回字段：
    - teacher_name: 教员姓名
    - total_reputation_enrollment: 全年口碑报名总数
    - total_reputation_income: 全年口碑收入总额
    """
    try:
        # 按教员聚合全年数据
        query = db.query(
            口碑招生月度个人目标与结果汇总表.姓名,
            func.sum(口碑招生月度个人目标与结果汇总表.实际招生人数).label('total_enrollment'),
            func.sum(口碑招生月度个人目标与结果汇总表.实际口碑收入).label('total_income'),
        ).filter(
            口碑招生月度个人目标与结果汇总表.神殿名称 == campus,
            口碑招生月度个人目标与结果汇总表.年份 == year,
        ).group_by(
            口碑招生月度个人目标与结果汇总表.姓名
        )
        
        rows = query.all()
        
        result: List[Dict] = []
        for row in rows:
            teacher_name = row.姓名
            if not teacher_name:
                continue
                
            result.append({
                "teacher_name": teacher_name.strip(),
                "total_reputation_enrollment": int(row.total_enrollment or 0),
                "total_reputation_income": float(row.total_income or 0),
            })
        
        # 按教员姓名排序
        result.sort(key=lambda x: x["teacher_name"])
        return result
        
    except Exception as e:
        import traceback
        error_detail = f"获取教员年度口碑汇总失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.get("/new-students-monthly", summary="获取教员月度带新生人数")
def get_staff_monthly_new_students(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份，如 2025"),
    db: Session = Depends(get_db),
) -> List[Dict]:
    """
    获取指定神殿和年份的教员月度带新生人数统计
    
    数据来源：神殿后端新生维稳个人按月汇总表
    
    返回字段：
    - teacher_name: 教员姓名
    - month: 月份 (1-12)
    - new_student_count: 带新生人数（入学人数）
    """
    try:
        # 查询神殿后端新生维稳个人按月汇总表，按教员姓名和月份分组聚合
        query = db.query(
            神殿后端新生维稳个人按月汇总表.教员姓名,
            神殿后端新生维稳个人按月汇总表.月份,
            func.sum(神殿后端新生维稳个人按月汇总表.入学人数).label('入学人数'),
        ).filter(
            神殿后端新生维稳个人按月汇总表.神殿名称 == campus,
            神殿后端新生维稳个人按月汇总表.年份 == year,
        ).group_by(
            神殿后端新生维稳个人按月汇总表.教员姓名,
            神殿后端新生维稳个人按月汇总表.月份,
        )
        
        rows = query.all()
        
        result: List[Dict] = []
        for row in rows:
            teacher_name = row.教员姓名
            month = row.月份
            
            if not teacher_name or not month:
                continue
            
            result.append({
                "teacher_name": teacher_name.strip(),
                "month": month,
                "new_student_count": int(row.入学人数 or 0),
            })
        
        # 按教员、月份排序
        result.sort(key=lambda x: (x["teacher_name"], x["month"]))
        return result
        
    except Exception as e:
        import traceback
        error_detail = f"获取教员月度带新生人数失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)


@router.get("/refunds-monthly", summary="获取教员月度退费人数")
def get_staff_monthly_refunds(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份，如 2025"),
    db: Session = Depends(get_db),
) -> List[Dict]:
    """
    获取指定神殿和年份的教员月度退费人数统计
    
    数据来源：神殿后端新生维稳个人按月汇总表
    
    返回字段：
    - teacher_name: 教员姓名
    - month: 月份 (1-12)
    - refund_count: 退费人数
    """
    try:
        # 查询神殿后端新生维稳个人按月汇总表，按教员姓名和月份分组聚合
        query = db.query(
            神殿后端新生维稳个人按月汇总表.教员姓名,
            神殿后端新生维稳个人按月汇总表.月份,
            func.sum(神殿后端新生维稳个人按月汇总表.退费人数).label('退费人数'),
        ).filter(
            神殿后端新生维稳个人按月汇总表.神殿名称 == campus,
            神殿后端新生维稳个人按月汇总表.年份 == year,
        ).group_by(
            神殿后端新生维稳个人按月汇总表.教员姓名,
            神殿后端新生维稳个人按月汇总表.月份,
        )
        
        rows = query.all()
        
        result: List[Dict] = []
        for row in rows:
            teacher_name = row.教员姓名
            month = row.月份
            
            if not teacher_name or not month:
                continue
            
            result.append({
                "teacher_name": teacher_name.strip(),
                "month": month,
                "refund_count": int(row.退费人数 or 0),
            })
        
        # 按教员、月份排序
        result.sort(key=lambda x: (x["teacher_name"], x["month"]))
        return result
        
    except Exception as e:
        import traceback
        error_detail = f"获取教员月度退费人数失败: {str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail)
