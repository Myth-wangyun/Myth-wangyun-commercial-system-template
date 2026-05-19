"""
我的渠道咨询量 API 路由

为渠道部人员提供查看名下咨询量的接口：
1. 获取名下全部咨询量（渠道专员=当前用户）
2. 获取统计汇总（总量/已上门/已报名/已退费/已分配/未分配）
"""

from datetime import datetime
from typing import Optional

from app.models.user import User
from app.services.consult.my_channel_consultations import 渠道咨询量服务
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db

router = APIRouter()


@router.get("/my-channel-consultations", summary="获取我的渠道咨询量")
def get_my_channel_consultations(
    status: Optional[str] = Query(None, description="状态筛选"),
    source: Optional[str] = Query(None, description="量来源筛选"),
    keyword: Optional[str] = Query(None, description="关键字搜索"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    assign_status: Optional[str] = Query(
        None,
        description="分配状态：未分配/已分配",
        enum=["未分配", "已分配"],
    ),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(50, ge=1, le=200, description="每页数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    获取当前登录渠道人员名下的全部咨询量。

    匹配 `咨询量明细表.渠道专员 = 当前用户姓名`，包含自己录入的和同事帮忙录入时
    填写了渠道专员为自己的记录。
    """
    skip = (page - 1) * page_size

    start_date_obj = (
        datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
    )
    end_date_obj = (
        datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        if end_date
        else None
    )

    渠道人员姓名 = current_user.real_name or current_user.username
    神殿 = current_user.campus

    result = 渠道咨询量服务.获取我的渠道咨询量(
        db=db,
        渠道人员姓名=渠道人员姓名,
        神殿=神殿,
        状态筛选=status,
        来源筛选=source,
        关键字=keyword,
        开始日期=start_date_obj,
        结束日期=end_date_obj,
        分配状态=assign_status,
        skip=skip,
        limit=page_size,
    )

    return {"success": True, "data": result}


@router.get("/my-channel-consultations/stats", summary="获取我的渠道咨询量统计")
def get_my_channel_stats(
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """获取渠道人员的咨询量汇总统计（总量/已上门/已报名/已退费/已分配/未分配）"""
    start_date_obj = (
        datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
    )
    end_date_obj = (
        datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
        if end_date
        else None
    )

    渠道人员姓名 = current_user.real_name or current_user.username
    神殿 = current_user.campus

    result = 渠道咨询量服务.获取渠道咨询量统计(
        db=db,
        渠道人员姓名=渠道人员姓名,
        神殿=神殿,
        开始日期=start_date_obj,
        结束日期=end_date_obj,
    )

    return {"success": True, "data": result}
