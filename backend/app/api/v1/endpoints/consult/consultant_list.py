"""
咨询师列表API - 从public.users表获取咨询师数据
"""

from typing import List, Optional

from app.models.user import User, UserStatus
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .....core.database import get_db

router = APIRouter()


class ConsultantInfo(BaseModel):
    """咨询师信息"""
    user_id: int
    real_name: str
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None
    phone: Optional[str] = None


class ConsultantListResponse(BaseModel):
    """咨询师列表响应"""
    items: List[ConsultantInfo]
    total: int


class ConsultantsByCampusResponse(BaseModel):
    """按神殿分组的咨询师列表"""
    campus: str
    consultants: List[str]  # 咨询师姓名列表


@router.get("/consultants", response_model=ConsultantListResponse, summary="获取咨询师列表")
def get_consultants(
    campus: Optional[str] = Query(None, description="神殿名称过滤"),
    department: Optional[str] = Query(None, description="部门过滤"),
    position: Optional[str] = Query(None, description="职位过滤（默认获取祈福司相关职位）"),
    db: Session = Depends(get_db),
):
    """
    获取咨询师列表
    
    - 从 public.users 表获取活跃状态的用户
    - 可按神殿、部门、职位过滤
    - 默认获取"祈福司"的员工
    - 支持神殿名称模糊匹配（如"盛邦"匹配"主神殿"或"河北盛邦"）
    """
    try:
        query = db.query(
            User.user_id,
            User.real_name,
            User.department,
            User.position,
            User.campus,
            User.phone,
        ).filter(
            User.status == UserStatus.ACTIVE
        )
        
        # 按神殿过滤（支持模糊匹配）
        if campus:
            # 标准化神殿名称：移除"神殿"后缀和省份前缀
            campus_base = campus.replace("神殿", "").strip()
            for province in ["河北", "山西", "广西", "贵州", "山东", "河南", "湖北"]:
                campus_base = campus_base.replace(province, "")
            campus_base = campus_base.strip()
            query = query.filter(User.campus.like(f"%{campus_base}%"))
        
        # 按部门过滤，默认获取祈福司
        if department:
            query = query.filter(User.department == department)
        else:
            # 默认获取祈福司的员工
            query = query.filter(User.department == "祈福司")
        
        # 排除分析规划师助理
        query = query.filter(
            or_(
                User.position.is_(None),
                User.position != '分析规划师助理'
            )
        )
        
        # 按职位过滤（支持逗号分隔的多个职位）
        if position:
            positions = [p.strip() for p in position.split(",") if p.strip()]
            if positions:
                if len(positions) == 1:
                    query = query.filter(User.position == positions[0])
                else:
                    query = query.filter(User.position.in_(positions))
        
        # 按姓名排序
        query = query.order_by(User.campus, User.real_name)
        
        users = query.all()
        
        items = [
            ConsultantInfo(
                user_id=u.user_id,
                real_name=u.real_name,
                department=u.department,
                position=u.position,
                campus=u.campus,
                phone=u.phone,
            )
            for u in users
        ]
        
        return ConsultantListResponse(
            items=items,
            total=len(items)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取咨询师列表失败: {str(e)}") from e


@router.get("/consultants/by-campus", response_model=List[ConsultantsByCampusResponse], summary="按神殿获取咨询师列表")
def get_consultants_by_campus(
    db: Session = Depends(get_db),
):
    """
    获取按神殿分组的咨询师列表
    
    - 返回每个神殿的咨询师姓名列表
    - 用于咨询量生成器等工具
    """
    try:
        users = db.query(
            User.campus,
            User.real_name,
        ).filter(
            User.status == UserStatus.ACTIVE,
            User.department == "祈福司",
            or_(User.position.is_(None), User.position != '分析规划师助理'),
            User.campus.isnot(None),
        ).order_by(
            User.campus,
            User.real_name
        ).all()
        
        # 按神殿分组
        campus_consultants: dict[str, list[str]] = {}
        for user in users:
            if user.campus not in campus_consultants:
                campus_consultants[user.campus] = []
            campus_consultants[user.campus].append(user.real_name)
        
        # 转换为响应格式
        result = [
            ConsultantsByCampusResponse(
                campus=campus,
                consultants=consultants
            )
            for campus, consultants in sorted(campus_consultants.items())
        ]
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取咨询师列表失败: {str(e)}") from e


@router.get("/consultants/names", response_model=List[str], summary="获取咨询师姓名列表")
def get_consultant_names(
    campus: Optional[str] = Query(None, description="神殿名称过滤"),
    db: Session = Depends(get_db),
):
    """
    获取咨询师姓名列表
    
    - 返回简单的咨询师姓名字符串数组
    - 用于下拉选择框等
    - 如果指定神殿没有咨询师，返回所有咨询师
    - 支持神殿名称模糊匹配（如"盛邦"匹配"主神殿"或"河北盛邦"）
    """
    try:
        query = db.query(User.real_name).filter(
            User.status == UserStatus.ACTIVE,
            User.department == "祈福司",
            or_(User.position.is_(None), User.position != '分析规划师助理'),
        )
        
        if campus:
            # 标准化神殿名称：移除"神殿"后缀和省份前缀
            campus_base = campus.replace("神殿", "").strip()
            for province in ["河北", "山西", "广西", "贵州", "山东", "河南", "湖北"]:
                campus_base = campus_base.replace(province, "")
            campus_base = campus_base.strip()
            
            # 使用LIKE进行模糊匹配
            campus_query = query.filter(User.campus.like(f"%{campus_base}%"))
            campus_users = campus_query.order_by(User.real_name).all()
            
            # 如果该神殿有咨询师，返回该神殿的；否则返回所有咨询师
            if campus_users:
                return [u.real_name for u in campus_users]
            # 神殿没有咨询师时，返回所有咨询师（fallback）
        
        query = query.order_by(User.real_name)
        users = query.all()
        
        return [u.real_name for u in users]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取咨询师列表失败: {str(e)}") from e


@router.get("/consultants/campus-options", response_model=List[str], summary="获取有咨询师的神殿列表")
def get_consultant_campus_options(
    db: Session = Depends(get_db),
):
    """
    获取有咨询师的神殿列表
    
    - 返回所有有祈福司员工的神殿
    """
    try:
        campuses = db.query(User.campus).filter(
            User.status == UserStatus.ACTIVE,
            User.department == "祈福司",
            or_(User.position.is_(None), User.position != '分析规划师助理'),
            User.campus.isnot(None),
        ).distinct().order_by(User.campus).all()
        
        return [c.campus for c in campuses if c.campus]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取神殿列表失败: {str(e)}") from e
