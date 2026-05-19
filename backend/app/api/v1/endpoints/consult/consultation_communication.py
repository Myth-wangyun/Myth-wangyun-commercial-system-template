"""
咨询沟通记录与电话量统计API路由
"""

from datetime import date, datetime
from typing import Optional, TypedDict

from app.crud.consult.consultation_communication import 咨询沟通记录CRUD, 电话量统计服务
from app.models.consult.consultation_communication import 咨询沟通记录表
from app.models.consult.consultation_record import 咨询量明细表
from app.models.user import User
from app.schemas.consult.consultation_communication import (
    咨询沟通记录分页响应,
    咨询沟通记录创建,
    咨询沟通记录响应,
    咨询沟通记录更新,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Date, cast
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db

router = APIRouter()


class 沟通量统计汇总(TypedDict):
    电话量: int
    网聊量: int
    当面量: int
    总沟通量: int
    联系成功量: int
    联系失败量: int
    平均用时: float


class 年度沟通量统计汇总(沟通量统计汇总):
    年份: int


# ==================== 咨询沟通记录CRUD ====================

@router.post("/communication/record", summary="新增咨询沟通记录")
def create_communication_record(
    obj_in: 咨询沟通记录创建,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    新增咨询沟通记录
    
    - 与咨询量明细深度绑定
    - 记录咨询方式（网聊、电话、当面）
    - 记录咨询内容、咨询结果
    - 记录报名意愿评估
    """
    try:
        # 验证咨询量明细记录存在
        detail = db.query(咨询量明细表).filter(咨询量明细表.记录ID == obj_in.记录ID).first()
        if not detail:
            raise HTTPException(status_code=404, detail="咨询量明细记录不存在")
        
        # 设置对象ID（从明细记录获取）
        obj_in.对象ID = detail.对象ID
        
        # 创建记录
        record = 咨询沟通记录CRUD.create(db, obj_in, 创建人=current_user.real_name)
        
        # 同步更新咨询量明细的咨询结果字段
        if obj_in.咨询结果:
            detail.咨询结果 = obj_in.咨询结果
            db.commit()
        
        return {
            "success": True,
            "message": "沟通记录创建成功",
            "data": record.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}") from e


@router.get("/communication/by-record/{record_id}", summary="获取咨询量的所有沟通记录")
def get_communications_by_record(
    record_id: int,
    db: Session = Depends(get_db)
):
    """
    根据咨询量明细记录ID获取所有沟通记录
    用于展示咨询记录历史
    """
    records = 咨询沟通记录CRUD.get_by_record_id(db, record_id)
    return {
        "success": True,
        "data": [r.to_dict() for r in records],
        "total": len(records)
    }


@router.get("/communication/record/{communication_id}", response_model=咨询沟通记录响应, summary="获取沟通记录详情")
def get_communication_record(
    communication_id: int,
    db: Session = Depends(get_db)
):
    """根据沟通ID获取沟通记录详情"""
    record = 咨询沟通记录CRUD.get_by_id(db, communication_id)
    if not record:
        raise HTTPException(status_code=404, detail="沟通记录不存在")
    return record


@router.get("/communication/by-object/{object_id}", summary="获取咨询对象的所有沟通记录")
def get_communications_by_object(
    object_id: int,
    db: Session = Depends(get_db)
):
    """
    根据咨询对象ID获取所有沟通记录
    用于展示该咨询者的全部沟通历史
    """
    records = 咨询沟通记录CRUD.get_by_object_id(db, object_id)
    return {
        "success": True,
        "data": [r.to_dict() for r in records],
        "total": len(records)
    }


@router.get("/communication/records", response_model=咨询沟通记录分页响应, summary="获取沟通记录列表")
def get_communication_records(
    记录ID: Optional[int] = Query(None, description="咨询量明细记录ID"),
    对象ID: Optional[int] = Query(None, description="咨询对象ID"),
    咨询师: Optional[str] = Query(None, description="咨询师"),
    沟通方式: Optional[str] = Query(None, description="沟通方式：网聊、电话、当面"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db)
):
    """获取咨询沟通记录列表（支持分页和筛选）"""
    start_date_obj = None
    end_date_obj = None
    
    if start_date:
        start_date_obj = datetime.strptime(start_date[:10], "%Y-%m-%d")
    if end_date:
        end_date_obj = datetime.strptime(end_date[:10], "%Y-%m-%d").replace(hour=23, minute=59, second=59)
    
    skip = (page - 1) * page_size
    
    records, total = 咨询沟通记录CRUD.get_multi(
        db,
        记录ID=记录ID,
        对象ID=对象ID,
        咨询师=咨询师,
        沟通方式=沟通方式,
        start_date=start_date_obj,
        end_date=end_date_obj,
        skip=skip,
        limit=page_size
    )
    
    return {
        "success": True,
        "data": records,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.put("/communication/record/{communication_id}", summary="更新沟通记录")
def update_communication_record(
    communication_id: int,
    obj_in: 咨询沟通记录更新,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新咨询沟通记录"""
    record = 咨询沟通记录CRUD.update(db, communication_id, obj_in)
    if not record:
        raise HTTPException(status_code=404, detail="沟通记录不存在")
    return {
        "success": True,
        "message": "更新成功",
        "data": record.to_dict()
    }


@router.delete("/communication/record/{communication_id}", summary="删除沟通记录")
def delete_communication_record(
    communication_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除咨询沟通记录"""
    success = 咨询沟通记录CRUD.delete(db, communication_id)
    if not success:
        raise HTTPException(status_code=404, detail="沟通记录不存在")
    return {
        "success": True,
        "message": "删除成功"
    }


# ==================== 咨询量带沟通记录 ====================

@router.get("/consultation/record-with-communications/{record_id}", summary="获取咨询量明细及其沟通记录")
def get_consultation_with_communications(
    record_id: int,
    db: Session = Depends(get_db)
):
    """
    获取咨询量明细及其所有沟通记录
    用于在咨询量明细页面展示沟通历史
    """
    # 获取咨询量明细
    detail = db.query(咨询量明细表).filter(咨询量明细表.记录ID == record_id).first()
    if not detail:
        raise HTTPException(status_code=404, detail="咨询量明细不存在")
    
    # 获取沟通记录
    communications = 咨询沟通记录CRUD.get_by_record_id(db, record_id)
    
    return {
        "success": True,
        "data": {
            "咨询量明细": detail.to_dict(),
            "沟通记录列表": [c.to_dict() for c in communications],
            "沟通记录数": len(communications)
        }
    }


# ==================== 电话量统计 ====================

@router.get("/phone-call/stats/by-date", summary="按日期统计电话量")
def get_phone_stats_by_date(
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    咨询师: Optional[str] = Query(None, description="咨询师"),
    神殿: Optional[str] = Query(None, description="神殿"),
    db: Session = Depends(get_db)
):
    """
    按日期统计电话量/沟通量
    
    返回每日的电话量、网聊量、当面量、总沟通量等
    """
    start_date_obj = None
    end_date_obj = None
    
    if start_date:
        start_date_obj = datetime.strptime(start_date[:10], "%Y-%m-%d").date()
    if end_date:
        end_date_obj = datetime.strptime(end_date[:10], "%Y-%m-%d").date()
    
    data = 电话量统计服务.按日期统计(db, start_date_obj, end_date_obj, 咨询师, 神殿)
    
    # 计算汇总
    summary: 沟通量统计汇总 = {
        '电话量': sum(d['电话量'] for d in data),
        '网聊量': sum(d['网聊量'] for d in data),
        '当面量': sum(d['当面量'] for d in data),
        '总沟通量': sum(d['总沟通量'] for d in data),
        '联系成功量': sum(d['联系成功量'] for d in data),
        '联系失败量': sum(d['联系失败量'] for d in data),
        '平均用时': 0.0,
    }
    total_time = sum(d.get('总用时', 0) for d in data)
    if summary['总沟通量'] > 0:
        summary['平均用时'] = round(total_time / summary['总沟通量'], 2)
    
    return {
        "success": True,
        "data": data,
        "summary": summary
    }


@router.get("/phone-call/stats/by-consultant", summary="按咨询师统计电话量")
def get_phone_stats_by_consultant(
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    神殿: Optional[str] = Query(None, description="神殿"),
    db: Session = Depends(get_db)
):
    """
    按咨询师统计电话量/沟通量
    
    返回每个咨询师的电话量、网聊量、当面量、总沟通量等
    """
    start_date_obj = None
    end_date_obj = None
    
    if start_date:
        start_date_obj = datetime.strptime(start_date[:10], "%Y-%m-%d").date()
    if end_date:
        end_date_obj = datetime.strptime(end_date[:10], "%Y-%m-%d").date()
    
    data = 电话量统计服务.按咨询师统计(db, start_date_obj, end_date_obj, 神殿)
    
    # 计算汇总
    summary: 沟通量统计汇总 = {
        '电话量': sum(d['电话量'] for d in data),
        '网聊量': sum(d['网聊量'] for d in data),
        '当面量': sum(d['当面量'] for d in data),
        '总沟通量': sum(d['总沟通量'] for d in data),
        '联系成功量': sum(d['联系成功量'] for d in data),
        '联系失败量': sum(d['联系失败量'] for d in data),
        '平均用时': 0.0,
    }
    total_time = sum(d.get('总用时', 0) for d in data)
    if summary['总沟通量'] > 0:
        summary['平均用时'] = round(total_time / summary['总沟通量'], 2)
    
    return {
        "success": True,
        "data": data,
        "summary": summary
    }


@router.get("/phone-call/stats/by-month", summary="按月份统计电话量")
def get_phone_stats_by_month(
    year: int = Query(..., description="年份"),
    咨询师: Optional[str] = Query(None, description="咨询师"),
    神殿: Optional[str] = Query(None, description="神殿"),
    db: Session = Depends(get_db)
):
    """
    按月份统计电话量/沟通量
    
    返回指定年份每月的电话量、网聊量、当面量、总沟通量等
    用于接入表1-6的电话量字段
    """
    data = 电话量统计服务.按月份统计(db, year, 咨询师, 神殿)
    
    # 计算年度汇总
    summary: 年度沟通量统计汇总 = {
        '年份': year,
        '电话量': sum(d['电话量'] for d in data),
        '网聊量': sum(d['网聊量'] for d in data),
        '当面量': sum(d['当面量'] for d in data),
        '总沟通量': sum(d['总沟通量'] for d in data),
        '联系成功量': sum(d['联系成功量'] for d in data),
        '联系失败量': sum(d['联系失败量'] for d in data),
        '平均用时': 0.0,
    }
    total_time = sum(d.get('总用时', 0) for d in data)
    if summary['总沟通量'] > 0:
        summary['平均用时'] = round(total_time / summary['总沟通量'], 2)
    
    return {
        "success": True,
        "data": data,
        "summary": summary
    }


@router.get("/phone-call/stats/by-campus", summary="按神殿统计年度电话量")
def get_phone_stats_by_campus(
    year: int = Query(..., description="年份"),
    db: Session = Depends(get_db)
):
    """
    按神殿统计年度电话量/沟通量
    
    返回每个神殿的年度电话量、网聊量、当面量、总沟通量等
    用于接入表0的神殿年度汇总
    """
    data = 电话量统计服务.按神殿年度统计(db, year)
    
    # 计算汇总
    campus_summary: 年度沟通量统计汇总 = {
        '年份': year,
        '电话量': sum(d['电话量'] for d in data),
        '网聊量': sum(d['网聊量'] for d in data),
        '当面量': sum(d['当面量'] for d in data),
        '总沟通量': sum(d['总沟通量'] for d in data),
        '联系成功量': sum(d['联系成功量'] for d in data),
        '联系失败量': sum(d['联系失败量'] for d in data),
        '平均用时': 0.0,
    }
    total_time = sum(d.get('总用时', 0) for d in data)
    if campus_summary['总沟通量'] > 0:
        campus_summary['平均用时'] = round(total_time / campus_summary['总沟通量'], 2)
    
    return {
        "success": True,
        "data": data,
        "summary": campus_summary
    }


# ==================== 今日沟通记录（带咨询者信息） ====================

@router.get("/communication/my-today", summary="获取我的今日沟通记录（带咨询者信息）")
def get_my_today_communications(
    target_date: Optional[str] = Query(None, description="查询日期 YYYY-MM-DD，默认今天"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取当前咨询师今天（或指定日期）的所有沟通记录，
    JOIN 咨询量明细表以返回咨询者姓名、电话等信息。
    """
    try:
        咨询师名 = current_user.real_name or current_user.username
        
        if target_date:
            query_date = datetime.strptime(target_date[:10], "%Y-%m-%d").date()
        else:
            query_date = date.today()
        
        # JOIN 查询
        results = (
            db.query(咨询沟通记录表, 咨询量明细表)
            .join(咨询量明细表, 咨询沟通记录表.记录ID == 咨询量明细表.记录ID)
            .filter(咨询沟通记录表.咨询师 == 咨询师名)
            .filter(cast(咨询沟通记录表.沟通时间, Date) == query_date)
            .order_by(咨询沟通记录表.沟通时间.desc())
            .all()
        )
        
        data = []
        for comm, detail in results:
            item = comm.to_dict()
            item["咨询者姓名"] = getattr(detail, "咨询者姓名", None) or ""
            item["电话"] = getattr(detail, "电话", None) or ""
            item["量来源"] = getattr(detail, "量来源", None) or ""
            item["状态"] = getattr(detail, "状态", None) or ""
            item["报名意向"] = getattr(detail, "报名意向", None) or ""
            data.append(item)
        
        return {
            "success": True,
            "data": data,
            "total": len(data),
            "date": str(query_date),
            "咨询师": 咨询师名,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查询失败: {str(e)}") from e
