"""
我的咨询量 API 路由

提供咨询师和分量人员查看咨询量的接口：
1. 我的私域咨询量（当前分配给我的，15天保护期内）
2. 可再分配咨询量（校域内，过了15天私域保护期，标记"再"）
3. 可新分配咨询量（公域，过了180天+90天无追访，标记"新"）
"""

from typing import Optional

from app.models.user import User
from app.services.consult.my_consultations import 我的咨询量服务
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db

router = APIRouter()


# ==================== Pydantic 模型 ====================

class 权限检查请求(BaseModel):
    """权限检查请求"""
    对象ID: int = Field(..., description="咨询量对象ID")


# ==================== 我的咨询量接口 ====================

@router.get("/my-consultations", summary="获取我的全部咨询量（分门别类）")
def get_my_consultations(
    category: Optional[str] = Query(
        None, 
        description="分类筛选：我的私域/可再分配/可新分配",
        enum=["我的私域", "可再分配", "可新分配"]
    ),
    status: Optional[str] = Query(None, description="状态筛选"),
    source: Optional[str] = Query(None, description="量来源筛选"),
    region: Optional[str] = Query(None, description="地区筛选（按家庭住址地区）"),
    keyword: Optional[str] = Query(None, description="关键字搜索"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    today_followup: bool = Query(False, description="是否仅显示今日回访（预定回访时间在今天的）"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(50, ge=1, le=200, description="每页数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取当前登录咨询师可见的全部咨询量
    
    **分类说明：**
    
    | 分类 | 标记 | 说明 | 可操作人员 |
    |------|------|------|-----------|
    | 我的私域 | - | 当前分配给我的，在15天保护期内 | 仅本人 |
    | 可再分配 | "再" | 校域内过了私域保护期的 | 同神殿所有咨询师 |
    | 可新分配 | "新" | 公域过了180天+90天无追访的 | 所有神殿咨询师 |
    
    **权限说明：**
    - 私域保护期内：只有被分配的咨询师可以编辑和追访
    - 释放到校域后：同神殿咨询师可直接联系，无须同意
    - 释放到公域后：可重新加"新"字录入新神殿
    """
    from datetime import datetime
    
    skip = (page - 1) * page_size
    
    # 解析日期
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59) if end_date else None
    
    # 获取当前用户信息
    咨询师姓名 = current_user.real_name or current_user.username
    神殿 = current_user.campus or "未分配"
    
    result = 我的咨询量服务.获取我的全部咨询量(
        db=db,
        咨询师姓名=咨询师姓名,
        神殿=神殿,
        分类筛选=category,
        状态筛选=status,
        来源筛选=source,
        地区筛选=region,
        关键字=keyword,
        开始日期=start_date_obj,
        结束日期=end_date_obj,
        今日回访=today_followup,
        skip=skip,
        limit=page_size
    )
    
    return {"success": True, "data": result}


@router.get("/my-consultations/private", summary="获取我的私域咨询量")
def get_my_private_consultations(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(50, ge=1, le=200, description="每页数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取当前咨询师的私域咨询量
    
    **私域咨询量特点：**
    - 当前分配给我的咨询量
    - 在15天保护期内
    - 只有我可以编辑和追访
    - 其他咨询师不能操作
    
    **注意事项：**
    - 连续15天无追访记录将自动释放回校域
    - 追访后保护期重新计算15天
    """
    skip = (page - 1) * page_size
    
    咨询师姓名 = current_user.real_name or current_user.username
    神殿 = current_user.campus
    
    records, total = 我的咨询量服务.获取我的私域咨询量(
        db, 咨询师姓名, 神殿, skip, page_size
    )
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return {
        "success": True,
        "data": {
            "分类": "我的私域",
            "说明": "当前分配给我的咨询量，在15天保护期内，只有我可以编辑和追访",
            "总记录数": total,
            "总页数": total_pages,
            "当前页": page,
            "每页数量": page_size,
            "数据列表": records
        }
    }


@router.get("/my-consultations/redistributable", summary="获取可再分配咨询量（标记'再'）")
def get_redistributable_consultations(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(50, ge=1, le=200, description="每页数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取校域内可再分配的咨询量（系统自动标记"再"）
    
    **可再分配咨询量特点：**
    - 私域保护期（15天）已过
    - 仍在校域保护期（180天）内
    - 同神殿其他咨询师可以直接联系，无须原咨询师同意
    - 上门并成交后归属最后联系的咨询师
    
    **处理规则：**
    - 不录"新"字
    - 不重新计算咨询量和媒体来源
    - 可重新分配咨询老师
    
    **注意事项：**
    - 家长主动联系之前咨询师，若前咨询师不积极配合，罚款1000元
    """
    skip = (page - 1) * page_size
    
    神殿 = current_user.campus or "未分配"
    咨询师姓名 = current_user.real_name or current_user.username
    
    records, total = 我的咨询量服务.获取校域可再分配咨询量(
        db, 神殿, 咨询师姓名, skip, page_size
    )
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return {
        "success": True,
        "data": {
            "分类": "可再分配",
            "标记": "再",
            "说明": "私域保护期已过，校域内可重新分配的咨询量，同神殿咨询师可直接联系",
            "神殿": 神殿,
            "总记录数": total,
            "总页数": total_pages,
            "当前页": page,
            "每页数量": page_size,
            "数据列表": records
        }
    }


@router.get("/my-consultations/new-assignable", summary="获取可新分配咨询量（标记'新'）")
def get_new_assignable_consultations(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(50, ge=1, le=200, description="每页数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取公域内可新分配的咨询量（系统自动标记"新"）
    
    **可新分配咨询量特点：**
    - 登记超过180天
    - 过去90天内无追访记录
    - 已释放到公域
    - 可以重新加"新"字录入新神殿
    
    **处理规则：**
    - 可以重新加"新"字录入新神殿
    - 重新计算媒体来源和分配咨询师
    - 再分配后咨询师报价不得低于上一次咨询师的价格
    
    **跨省分配：**
    - 跨省咨询量由市场部经理负责
    """
    skip = (page - 1) * page_size
    
    records, total = 我的咨询量服务.获取公域可新分配咨询量(
        db, None, skip, page_size
    )
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return {
        "success": True,
        "data": {
            "分类": "可新分配",
            "标记": "新",
            "说明": "登记超过180天且90天无追访，可重新加'新'字录入新神殿，重新计算媒体来源",
            "总记录数": total,
            "总页数": total_pages,
            "当前页": page,
            "每页数量": page_size,
            "数据列表": records
        }
    }


# ==================== 权限检查接口 ====================

@router.get("/my-consultations/check-permission/{object_id}", summary="检查咨询量操作权限")
def check_consultation_permission(
    object_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    检查当前用户对指定咨询量的操作权限
    
    **权限规则：**
    
    | 保护期状态 | 可查看 | 可编辑 | 可追访 | 可重新分配 | 可跨神殿分配 |
    |------------|--------|--------|--------|------------|--------------|
    | 私域保护中 | ✓ | 仅本人 | 仅本人 | ✗ | ✗ |
    | 已释放到校域 | ✓ | ✗ | 同神殿 | 咨询助理/校长 | ✗ |
    | 已释放到公域 | ✓ | ✓ | ✓ | ✓ | 市场部经理 |
    """
    操作者姓名 = current_user.real_name or current_user.username
    操作者神殿 = current_user.campus or "未分配"
    操作者角色 = current_user.role or "咨询师"
    
    result = 我的咨询量服务.检查咨询量操作权限(
        db, object_id, 操作者姓名, 操作者神殿, 操作者角色
    )
    
    return {"success": True, "data": result}


# ==================== 分量人员视图接口 ====================

@router.get("/distribution-view", summary="获取分量人员视图")
def get_distribution_view(
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(50, ge=1, le=200, description="每页数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取分量人员（咨询助理/前台）的工作视图
    
    **视图内容：**
    1. 待再分配的咨询量（私域保护期已过，需标记"再"字重新分配）
    2. 可从公域获取的咨询量（可标记"新"字录入本神殿）
    3. 即将到期的私域咨询量（3天内到期，提醒咨询师追访）
    
    **分量流程：**
    
    | 范围 | 负责人 | 处理方式 |
    |------|--------|----------|
    | 校域内 | 咨询助理 | 每天搜集15天内未回访的，标记"再"字重新分配 |
    | 省域内 | 网聊/咨询助理 | 查看180天+90天无追访的，标记"新"字录入 |
    | 跨省 | 市场部经理 | 同上 |
    
    **权限要求：**
    - 咨询助理、前台、校长、管理员可访问此接口
    """
    # 检查权限（可选，根据实际需求决定是否限制）
    允许角色 = ["咨询助理", "前台", "校长", "管理员", "admin", "市场部经理"]
    用户角色 = current_user.role or "咨询师"
    
    # 如果角色不在允许列表中，仍然返回数据但给出提示
    is_authorized = 用户角色 in 允许角色
    
    神殿 = current_user.campus or "未分配"
    skip = (page - 1) * page_size
    
    result = 我的咨询量服务.获取分量人员视图(db, 神殿, skip, page_size)
    result["权限说明"] = "您有分量权限" if is_authorized else "此视图供分量人员使用，您可以查看但不能执行分配操作"
    result["可执行分配"] = is_authorized
    
    return {"success": True, "data": result}


# ==================== 规则说明接口 ====================

@router.get("/consultation-rules", summary="获取咨询量管理规则说明")
def get_consultation_rules():
    """
    获取咨询量保护期和再分配规则的详细说明
    """
    return {
        "success": True,
        "data": {
            "保护期规则": {
                "私域保护期": {
                    "期限": "15天",
                    "说明": "任何私域内的咨询量，连续15天无咨询记录，自动释放回校域",
                    "可操作人员": "仅被分配的咨询师本人",
                    "权限": ["查看", "编辑", "追访"]
                },
                "校域保护期": {
                    "期限": "180天",
                    "说明": "登记超过180天且过去90天内无追访记录，可释放给其他神殿",
                    "可操作人员": "同神殿所有咨询师 + 咨询助理",
                    "权限": {
                        "咨询师": ["查看", "追访", "直接联系（无须同意）"],
                        "咨询助理": ["查看", "重新分配（标记'再'字）"]
                    }
                },
                "省域保护期": {
                    "期限": "180天",
                    "说明": "同校域保护期规则",
                    "可操作人员": "同省区所有咨询师 + 市场部经理",
                    "权限": ["可重新加'新'字录入新神殿", "重新计算媒体来源"]
                }
            },
            "再分配规则": {
                "过了私域保护期（15天）": {
                    "同一神殿": [
                        "不录'新'字",
                        "不重新计算咨询量和媒体来源",
                        "可重新分配咨询老师",
                        "上门并成交后归属最后联系的咨询师"
                    ],
                    "注意事项": "家长主动联系之前咨询师，若前咨询师不积极配合，罚款1000元"
                },
                "过了校域保护期（180天）": {
                    "同一神殿": "不录'新'字，可重新分配咨询老师",
                    "不同神殿": "可以重新加'新'字录入新神殿，重新计算媒体来源和分配咨询师"
                }
            },
            "再分配流程": {
                "校域内咨询量": {
                    "负责人": "咨询助理",
                    "处理方式": "每天搜集15天内未回访的咨询量，标记'再'字重新分配"
                },
                "省域内咨询量": {
                    "负责人": "网聊或咨询助理",
                    "处理方式": "查看原留量神殿登记超过180天且90天内无追访，标记'新'字录入本神殿"
                },
                "跨省咨询量": {
                    "负责人": "市场部经理",
                    "处理方式": "同上"
                }
            },
            "再分配权益": [
                "咨询量再分配视同新量的权益",
                "全部归属再分配后实现报名转化的咨询师",
                "再分配后咨询师报价不得低于上一次咨询师的价格"
            ]
        }
    }
