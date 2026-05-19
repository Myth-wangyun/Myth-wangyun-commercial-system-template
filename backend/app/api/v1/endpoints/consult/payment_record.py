"""
咨询缴费记录API路由
与咨询量深度绑定，为教质班主任提供细节信息
缴费变更后自动同步到教化司当月新生维稳明细表和新生仍欠费明细表
"""

from datetime import datetime
from typing import Optional

from app.crud.consult.payment_record import 缴费明细CRUD, 缴费记录CRUD, 缴费服务
from app.models.consult.consultation_record import 咨询量明细表
from app.models.user import User
from app.schemas.consult.payment_record import (
    缴费明细创建,
    缴费记录创建,
    缴费记录更新,
)
from app.services.handover_sync_service import update_payment_sync
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db
from .....logs.context import get_audit_logger

router = APIRouter()


# ==================== 缴费记录CRUD ====================

@router.post("/payment/record", summary="新增缴费记录")
def create_payment_record(
    obj_in: 缴费记录创建,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    新增缴费记录（与咨询量一对一绑定）
    
    - 记录ID必须对应已存在的咨询量明细
    - 包含应交金额、首款信息
    - 支持分配班主任和班级
    """
    try:
        # 验证咨询量明细记录存在
        detail = db.query(咨询量明细表).filter(咨询量明细表.记录ID == obj_in.记录ID).first()
        if not detail:
            raise HTTPException(status_code=404, detail="咨询量明细记录不存在")
        
        # 检查是否已有缴费记录
        existing = 缴费记录CRUD.get_by_record_id(db, obj_in.记录ID)
        if existing:
            raise HTTPException(status_code=400, detail="该咨询量已有缴费记录，请使用更新接口")
        
        # 设置对象ID（从明细记录获取）
        if not obj_in.对象ID:
            obj_in.对象ID = detail.对象ID
        
        # 创建缴费记录
        record = 缴费记录CRUD.create(db, obj_in, current_user.real_name)
        
        return {
            "success": True,
            "message": "缴费记录创建成功",
            "data": record.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"创建失败: {str(e)}")


@router.get("/payment/by-record/{record_id}", summary="获取咨询量的完整缴费信息")
def get_payment_info(
    record_id: int,
    db: Session = Depends(get_db)
):
    """
    根据咨询量明细记录ID获取完整的缴费信息
    
    包括：
    - 缴费记录（应交、首款、已交、欠费）
    - 后续缴费明细列表
    - 咨询者信息（姓名、电话、专业、神殿等）
    
    为教质班主任提供完整视图
    """
    return 缴费服务.get_payment_info(db, record_id)


@router.get("/payment/record/{payment_id}", summary="获取缴费记录详情")
def get_payment_record(
    payment_id: int,
    db: Session = Depends(get_db)
):
    """根据缴费ID获取缴费记录详情"""
    record = 缴费记录CRUD.get_by_id(db, payment_id)
    if not record:
        raise HTTPException(status_code=404, detail="缴费记录不存在")
    return {
        "success": True,
        "data": record.to_dict()
    }


@router.put("/payment/record/{payment_id}", summary="更新缴费记录")
def update_payment_record(
    payment_id: int,
    obj_in: 缴费记录更新,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """更新缴费记录"""
    record = 缴费记录CRUD.get_by_id(db, payment_id)
    if not record:
        raise HTTPException(status_code=404, detail="缴费记录不存在")
    
    updated = 缴费记录CRUD.update(db, payment_id, obj_in, current_user.real_name)
    if updated is None:
        raise HTTPException(status_code=404, detail="缴费记录不存在")
    
    return {
        "success": True,
        "message": "更新成功",
        "data": updated.to_dict()
    }


@router.delete("/payment/record/{payment_id}", summary="删除缴费记录")
def delete_payment_record(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除缴费记录（同时删除所有后续缴费明细）"""
    result = 缴费服务.delete_payment(db, payment_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result


# ==================== 首款和应交金额管理 ====================

@router.put("/payment/amount/{record_id}", summary="设置应交金额")
def set_payment_amount(
    record_id: int,
    http_request: Request,
    应交金额: int = Query(..., ge=0, description="应交金额（元）"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    设置应交金额（如果不存在缴费记录会自动创建）
    """
    # 验证咨询量明细记录存在
    detail = db.query(咨询量明细表).filter(咨询量明细表.记录ID == record_id).first()
    if not detail:
        raise HTTPException(status_code=404, detail="咨询量明细记录不存在")
    
    record = 缴费记录CRUD.update_应交金额(
        db, record_id, 应交金额, detail.对象ID, current_user.real_name
    )
    
    # 同步到教化司（如果已交接）
    sync_result = update_payment_sync(db, record_id)
    if sync_result["success"]:
        print(f"[payment] 缴费信息同步成功: 记录ID={record_id}")
        audit_logger = get_audit_logger(http_request)
        audit_logger.set_action(
            action="payment.set_amount",
            action_display="设置应交金额并同步教质",
            action_category="write",
            module="consult_payment",
            extra={"record_id": record_id, "应交金额": 应交金额},
        )
    
    return {
        "success": True,
        "message": "应交金额设置成功",
        "data": record.to_dict(),
        "sync_result": sync_result,
    }


@router.put("/payment/first-payment/{record_id}", summary="设置首款信息")
def set_first_payment(
    record_id: int,
    http_request: Request,
    首款金额: int = Query(..., ge=0, description="首款金额（元）"),
    首款时间: Optional[datetime] = Query(None, description="首款时间"),
    首款方式: Optional[str] = Query(None, description="首款方式"),
    首款收款人: Optional[str] = Query(None, description="首款收款人"),
    首款凭证号: Optional[str] = Query(None, description="首款凭证号"),
    首款备注: Optional[str] = Query(None, description="首款备注"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    设置首款信息
    """
    # 验证咨询量明细记录存在
    detail = db.query(咨询量明细表).filter(咨询量明细表.记录ID == record_id).first()
    if not detail:
        raise HTTPException(status_code=404, detail="咨询量明细记录不存在")
    
    record = 缴费记录CRUD.update_首款(
        db=db,
        记录ID=record_id,
        首款金额=首款金额,
        首款时间=首款时间,
        首款方式=首款方式,
        首款收款人=首款收款人,
        首款凭证号=首款凭证号,
        首款备注=首款备注,
        对象ID=detail.对象ID,
        创建人=current_user.real_name
    )
    
    # 同步到教化司（如果已交接）
    sync_result = update_payment_sync(db, record_id)
    if sync_result["success"]:
        print(f"[payment] 首款信息同步成功: 记录ID={record_id}")
        audit_logger = get_audit_logger(http_request)
        audit_logger.set_action(
            action="payment.set_first_payment",
            action_display="设置首款信息并同步教质",
            action_category="write",
            module="consult_payment",
            extra={"record_id": record_id, "首款金额": 首款金额},
        )
    
    return {
        "success": True,
        "message": "首款信息设置成功",
        "data": record.to_dict(),
        "sync_result": sync_result,
    }


# ==================== 后续缴费明细管理 ====================

@router.post("/payment/detail", summary="添加后续缴费")
def add_payment_detail(
    obj_in: 缴费明细创建,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    添加后续缴费明细
    
    - 需要先有缴费记录
    - 自动更新已交总额和缴费状态
    """
    try:
        # 验证缴费记录存在
        record = 缴费记录CRUD.get_by_id(db, obj_in.缴费ID)
        if not record:
            raise HTTPException(status_code=404, detail="缴费记录不存在")
        
        detail = 缴费明细CRUD.create(db, obj_in, current_user.real_name)
        
        # 重新获取更新后的缴费记录
        record = 缴费记录CRUD.get_by_id(db, obj_in.缴费ID)
        if record is None:
            raise HTTPException(status_code=404, detail="缴费记录不存在")
        
        return {
            "success": True,
            "message": "后续缴费添加成功",
            "data": {
                "缴费明细": detail.to_dict(),
                "缴费记录": record.to_dict()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"添加失败: {str(e)}")


@router.post("/payment/subsequent/{record_id}", summary="根据记录ID添加后续缴费")
def add_subsequent_payment(
    record_id: int,
    http_request: Request,
    缴费金额: int = Query(..., gt=0, description="缴费金额（元）"),
    缴费时间: datetime = Query(..., description="缴费时间"),
    缴费方式: Optional[str] = Query(None, description="缴费方式"),
    收款人: Optional[str] = Query(None, description="收款人"),
    凭证号: Optional[str] = Query(None, description="凭证号"),
    备注: Optional[str] = Query(None, description="备注"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    根据咨询量记录ID添加后续缴费
    """
    result = 缴费服务.add_subsequent_payment(
        db=db,
        记录ID=record_id,
        缴费金额=缴费金额,
        缴费时间=缴费时间,
        缴费方式=缴费方式,
        收款人=收款人,
        凭证号=凭证号,
        备注=备注,
        创建人=current_user.real_name
    )
    
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    
    # 同步到教化司（如果已交接）
    sync_result = update_payment_sync(db, record_id)
    if sync_result["success"]:
        print(f"[payment] 后续缴费同步成功: 记录ID={record_id}")
        audit_logger = get_audit_logger(http_request)
        audit_logger.set_action(
            action="payment.add_subsequent",
            action_display="添加后续缴费并同步教质",
            action_category="write",
            module="consult_payment",
            extra={"record_id": record_id, "缴费金额": 缴费金额},
        )
    
    result["sync_result"] = sync_result
    return result


@router.get("/payment/details/{payment_id}", summary="获取后续缴费明细列表")
def get_payment_details(
    payment_id: int,
    db: Session = Depends(get_db)
):
    """获取指定缴费记录的所有后续缴费明细"""
    details = 缴费明细CRUD.get_by_payment_id(db, payment_id)
    return {
        "success": True,
        "data": [d.to_dict() for d in details],
        "total": len(details)
    }


@router.delete("/payment/detail/{detail_id}", summary="删除后续缴费明细")
def delete_payment_detail(
    detail_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """删除后续缴费明细（自动更新汇总）"""
    success = 缴费明细CRUD.delete(db, detail_id)
    if not success:
        raise HTTPException(status_code=404, detail="缴费明细不存在")
    return {
        "success": True,
        "message": "删除成功"
    }


# ==================== 教质班主任功能 ====================

@router.get("/payment/teacher/{teacher_name}", summary="获取班主任的学员缴费列表")
def get_teacher_payment_list(
    teacher_name: str,
    缴费状态: Optional[str] = Query(None, description="缴费状态筛选：未缴费、部分缴费、已缴清"),
    db: Session = Depends(get_db)
):
    """
    获取班主任的学员缴费列表
    
    用于教质班主任查看自己负责学员的缴费情况
    """
    records = 缴费记录CRUD.get_by_班主任(db, teacher_name, 缴费状态)
    
    # 获取咨询量信息
    result = []
    for record in records:
        detail = db.query(咨询量明细表).filter(咨询量明细表.记录ID == record.记录ID).first()
        item = record.to_dict()
        if detail:
            item["咨询者姓名"] = detail.咨询者姓名
            item["电话"] = detail.电话
            item["报名专业"] = detail.报名专业
            item["报名时间"] = detail.报名时间.isoformat() if detail.报名时间 else None
        result.append(item)
    
    return {
        "success": True,
        "data": result,
        "total": len(result)
    }


@router.get("/payment/teacher-stats/{teacher_name}", summary="获取班主任缴费统计")
def get_teacher_stats(
    teacher_name: str,
    db: Session = Depends(get_db)
):
    """
    获取班主任的缴费统计
    
    包括：总学员数、各状态人数、应收/已收/欠费金额
    """
    return 缴费服务.get_班主任统计(db, teacher_name)


@router.get("/payment/arrears", summary="获取欠费列表")
def get_arrears_list(
    班主任: Optional[str] = Query(None, description="按班主任筛选"),
    db: Session = Depends(get_db)
):
    """
    获取欠费列表
    
    可按班主任筛选，按欠费金额降序排列
    """
    records = 缴费记录CRUD.get_欠费列表(db, 班主任)
    
    # 获取咨询量信息
    result = []
    for record in records:
        detail = db.query(咨询量明细表).filter(咨询量明细表.记录ID == record.记录ID).first()
        item = record.to_dict()
        if detail:
            item["咨询者姓名"] = detail.咨询者姓名
            item["电话"] = detail.电话
            item["神殿"] = detail.神殿
        result.append(item)
    
    return {
        "success": True,
        "data": result,
        "total": len(result)
    }


@router.put("/payment/assign-teacher/{record_id}", summary="分配班主任")
def assign_teacher(
    record_id: int,
    班主任: str = Query(..., description="班主任姓名"),
    班级: Optional[str] = Query(None, description="班级"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    为缴费记录分配班主任
    """
    record = 缴费记录CRUD.get_by_record_id(db, record_id)
    if not record:
        # 自动创建缴费记录
        detail = db.query(咨询量明细表).filter(咨询量明细表.记录ID == record_id).first()
        if not detail:
            raise HTTPException(status_code=404, detail="咨询量明细记录不存在")
        record = 缴费记录CRUD.get_or_create(db, record_id, detail.对象ID, current_user.real_name)
    
    record.班主任 = 班主任
    if 班级:
        record.班级 = 班级
    db.commit()
    db.refresh(record)
    
    return {
        "success": True,
        "message": "班主任分配成功",
        "data": record.to_dict()
    }


# ==================== 兼容旧接口 ====================

@router.get("/payment/summary/{record_id}", summary="获取缴费汇总（兼容旧接口）")
def get_payment_summary(
    record_id: int,
    db: Session = Depends(get_db)
):
    """获取缴费汇总信息（兼容旧接口）"""
    record = 缴费记录CRUD.get_by_record_id(db, record_id)
    if not record:
        return {
            "success": True,
            "data": None,
            "message": "暂无缴费记录"
        }
    return {
        "success": True,
        "data": record.to_dict()
    }
