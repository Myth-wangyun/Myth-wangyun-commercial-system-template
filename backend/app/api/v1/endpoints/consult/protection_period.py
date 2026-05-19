"""
咨询量保护期管理API路由

保护期规则（根据《清美教育咨询量管理规定》）：
1. 咨询师私域保护期：15天
2. 校域/省域保护期：180天
3. 90天无追访记录可释放到公域
"""

from datetime import datetime
from typing import Optional

from app.models.user import User
from app.services.consult.protection_period import 保护期服务
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db

router = APIRouter()


# ==================== Pydantic 模型 ====================

class 追访记录请求(BaseModel):
    """追访记录请求"""
    对象ID: int = Field(..., description="咨询量对象ID")
    追访记录: Optional[str] = Field(None, description="追访记录内容")


class 重新分配请求(BaseModel):
    """重新分配请求"""
    对象ID: int = Field(..., description="咨询量对象ID")
    新咨询师: str = Field(..., description="新分配的咨询师姓名")
    新神殿: Optional[str] = Field(None, description="新神殿（跨神殿分配时使用）")
    是否跨神殿: bool = Field(False, description="是否跨神殿分配")


class 释放请求(BaseModel):
    """释放请求"""
    对象ID: int = Field(..., description="咨询量对象ID")


# ==================== 保护期状态查询 ====================

@router.get("/protection/check/{object_id}", summary="检查咨询量保护期状态")
def check_protection_status(
    object_id: int,
    db: Session = Depends(get_db)
):
    """
    检查指定咨询量的保护期状态
    
    返回：
    - 保护期状态（私域保护中/已释放到校域/已释放到公域）
    - 到期时间
    - 状态说明
    - 是否可重新分配
    - 是否可跨神殿分配
    """
    result = 保护期服务.检查私域保护期(db, object_id)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return {"success": True, "data": result}


@router.get("/protection/statistics", summary="获取保护期统计信息")
def get_protection_statistics(
    campus: Optional[str] = Query(None, description="神殿（可选）"),
    db: Session = Depends(get_db)
):
    """
    获取保护期统计信息
    
    返回：
    - 各状态的咨询量数量
    - 即将到期的咨询量数量（3天内）
    """
    result = 保护期服务.获取保护期统计(db, campus)
    return {"success": True, "data": result}


# ==================== 待释放咨询量列表 ====================

@router.get("/protection/pending-release/campus", summary="获取待释放到校域的咨询量")
def get_pending_release_to_campus(
    campus: Optional[str] = Query(None, description="神殿"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(50, ge=1, le=200, description="每页数量"),
    db: Session = Depends(get_db)
):
    """
    获取私域保护期已过、待释放到校域的咨询量列表
    
    规则：连续15天无追访记录
    
    这些咨询量可以在神殿内重新分配给其他咨询师
    """
    skip = (page - 1) * page_size
    records, total = 保护期服务.获取待释放到校域的咨询量(db, campus, skip, page_size)
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return {
        "success": True,
        "data": {
            "总记录数": total,
            "总页数": total_pages,
            "当前页": page,
            "每页数量": page_size,
            "数据列表": records
        }
    }


@router.get("/protection/pending-release/public", summary="获取待释放到公域的咨询量")
def get_pending_release_to_public(
    campus: Optional[str] = Query(None, description="神殿"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(50, ge=1, le=200, description="每页数量"),
    db: Session = Depends(get_db)
):
    """
    获取校域保护期已过、待释放到公域的咨询量列表
    
    规则：登记超过180天且过去90天内无追访记录
    
    这些咨询量可以跨神殿重新分配，需加"新"字重新录入
    """
    skip = (page - 1) * page_size
    records, total = 保护期服务.获取待释放到公域的咨询量(db, campus, skip, page_size)
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return {
        "success": True,
        "data": {
            "总记录数": total,
            "总页数": total_pages,
            "当前页": page,
            "每页数量": page_size,
            "数据列表": records
        }
    }


# ==================== 追访操作 ====================

@router.post("/protection/follow-up", summary="记录追访（延长保护期）")
def record_follow_up(
    request: 追访记录请求,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    记录追访，延长保护期
    
    追访后：
    - 更新最后追访时间为当前时间
    - 私域保护期重新开始计算15天
    - 校域保护期的90天无追访记录重新计算
    """
    try:
        保护期服务.更新追访时间(
            db,
            request.对象ID,
            追访时间=datetime.now(),
            追访记录=request.追访记录
        )
        
        # 重新获取保护期状态
        状态信息 = 保护期服务.检查私域保护期(db, request.对象ID)
        
        return {
            "success": True,
            "message": "追访记录成功，保护期已延长",
            "data": 状态信息
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"记录追访失败: {str(e)}") from e


# ==================== 释放操作 ====================

@router.post("/protection/release/campus", summary="释放咨询量到校域")
def release_to_campus(
    request: 释放请求,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    手动释放咨询量到校域
    
    适用于：私域保护期（15天）已过的咨询量
    释放后：神殿内其他咨询师可以重新分配追访
    """
    try:
        主表 = 保护期服务.释放咨询量到校域(
            db,
            request.对象ID,
            操作人=current_user.real_name
        )
        
        return {
            "success": True,
            "message": "已释放到校域，可在神殿内重新分配",
            "data": {
                "对象ID": 主表.对象ID,
                "保护期状态": 主表.保护期状态,
                "释放时间": 主表.释放时间.isoformat() if 主表.释放时间 else None
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"释放失败: {str(e)}") from e


@router.post("/protection/release/public", summary="释放咨询量到公域")
def release_to_public(
    request: 释放请求,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    手动释放咨询量到公域
    
    适用于：校域保护期（180天）已过且90天无追访的咨询量
    释放后：可跨神殿重新分配，其他神殿可加"新"字重新录入
    """
    try:
        主表 = 保护期服务.释放咨询量到公域(
            db,
            request.对象ID,
            操作人=current_user.real_name
        )
        
        return {
            "success": True,
            "message": "已释放到公域，可跨神殿重新分配",
            "data": {
                "对象ID": 主表.对象ID,
                "保护期状态": 主表.保护期状态,
                "释放时间": 主表.释放时间.isoformat() if 主表.释放时间 else None
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"释放失败: {str(e)}") from e


# ==================== 重新分配 ====================

@router.post("/protection/reassign", summary="重新分配咨询量")
def reassign_consultation(
    request: 重新分配请求,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    重新分配咨询量给新咨询师
    
    业务规则：
    - 私域保护期（15天）过期后：可在神殿内重新分配
    - 校域保护期（180天）过期且90天无追访后：可跨神殿分配
    
    分配后：
    - 创建新的咨询明细记录
    - 重置私域保护期（15天）
    - 跨神殿分配时会标记为"新（跨神殿再分配）"
    """
    try:
        主表, 新明细 = 保护期服务.重新分配咨询量(
            db,
            request.对象ID,
            request.新咨询师,
            新神殿=request.新神殿,
            操作人=current_user.real_name,
            是否跨神殿=request.是否跨神殿
        )
        
        return {
            "success": True,
            "message": "跨神殿重新分配成功" if request.是否跨神殿 else "重新分配成功",
            "data": {
                "对象ID": 主表.对象ID,
                "新记录ID": 新明细.记录ID,
                "新咨询师": request.新咨询师,
                "新神殿": request.新神殿 or 主表.神殿,
                "保护期状态": 主表.保护期状态,
                "最后追访时间": 主表.最后追访时间.isoformat() if 主表.最后追访时间 else None
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"重新分配失败: {str(e)}") from e


# ==================== 批量更新 ====================

@router.post("/protection/batch-update", summary="批量更新保护期状态")
def batch_update_protection_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    批量更新所有咨询量的保护期状态（定时任务或手动触发）
    
    自动处理：
    - 私域保护期过期（15天）→ 释放到校域
    - 校域保护期过期（180天）且90天无追访 → 释放到公域
    """
    # 检查权限（建议限制为管理员）
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="无权执行此操作")
    
    try:
        result = 保护期服务.批量更新保护期状态(db)
        
        return {
            "success": True,
            "message": "批量更新完成",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量更新失败: {str(e)}") from e


# ==================== 保护期规则说明 ====================

@router.get("/protection/rules", summary="获取保护期规则说明")
def get_protection_rules():
    """
    获取保护期规则说明
    
    返回保护期相关的业务规则配置
    """
    return {
        "success": True,
        "data": {
            "私域保护期": {
                "天数": 15,
                "说明": "咨询师对咨询量的独占追访期",
                "过期后": "释放到校域，神殿内其他咨询师可追访"
            },
            "校域保护期": {
                "天数": 180,
                "说明": "神殿对咨询量的保护期",
                "过期条件": "登记超过180天且90天内无追访",
                "过期后": "释放到公域，可跨神殿重新分配"
            },
            "无追访期限": {
                "天数": 90,
                "说明": "判断是否可释放到公域的追访记录检查期"
            },
            "再分配规则": {
                "神殿内再分配": "私域保护期过期后，标记\"再\"字重新分配",
                "跨神殿再分配": "校域保护期过期后，标记\"新\"字重新录入"
            },
            "处罚规则": {
                "追访保护期内咨询量": "罚款300元",
                "前咨询师不配合再分配": "罚款1000元"
            }
        }
    }

# ==================== 定时任务管理接口 ====================

@router.get("/protection/scheduler/status", summary="获取定时任务调度器状态")
def get_scheduler_status_api():
    """
    获取定时任务调度器的运行状态
    
    返回：
    - 调度器是否运行中
    - 已注册的任务列表
    - 各任务的下次执行时间
    """
    from app.core.scheduler import get_scheduler_status
    
    status = get_scheduler_status()
    return {"success": True, "data": status}


@router.post("/protection/scheduler/run-now", summary="立即执行保护期更新任务")
def run_protection_update_now(
    current_user: User = Depends(get_current_active_user)
):
    """
    手动触发保护期状态更新任务立即执行
    
    适用于：
    - 需要立即更新保护期状态
    - 测试定时任务是否正常工作
    
    注意：此操作会立即执行批量更新，可能需要几秒钟时间
    """
    from app.core.scheduler import run_job_now
    
    result = run_job_now("protection_period_update")
    return {"success": result["success"], "message": result["message"]}