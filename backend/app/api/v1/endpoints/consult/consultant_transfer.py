"""
咨询师转量API接口

实现咨询师之间批量转量功能：
1. 批量把某个咨询师的所有咨询量转给另一个咨询师
2. 标记转量来源，方便后续分析数据指标
3. 跨神殿转量需要审批
"""

from datetime import datetime
from typing import List, Optional

from app.crud.consult import transfer_approval_config as transfer_approval_config_crud
from app.models.consult.consultation_record import 咨询量明细表
from app.models.user import User
from app.services.approvals import approval_stream_broker
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db

router = APIRouter(prefix="/consultant-transfer", tags=["咨询师转量"])


# ==================== 请求/响应模型 ====================

class ConsultantInfo(BaseModel):
    """咨询师信息"""
    name: str = Field(..., description="咨询师姓名")
    campus: str = Field(..., description="所属神殿")
    record_count: int = Field(..., description="当前咨询量数量")


class BatchTransferRequest(BaseModel):
    """批量转量请求"""
    source_consultant: str = Field(..., description="原咨询师")
    target_consultant: str = Field(..., description="目标咨询师")
    target_campus: Optional[str] = Field(None, description="目标神殿（跨神殿转量时需要）")
    reason: str = Field(..., description="转量原因")
    record_ids: Optional[List[int]] = Field(None, description="指定转量的记录ID列表（可选，为空则转全部）")


class BatchTransferResponse(BaseModel):
    """批量转量响应"""
    success: bool
    message: str
    total_count: int = Field(..., description="总记录数")
    transferred_count: int = Field(..., description="已转量数")
    pending_approval_count: int = Field(0, description="待审批数（跨神殿）")
    failed_count: int = Field(0, description="失败数")
    is_cross_campus: bool = Field(False, description="是否跨神殿转量")
    approval_required: bool = Field(False, description="是否需要审批")


class TransferApprovalRequest(BaseModel):
    """转量审批请求"""
    record_ids: List[int] = Field(..., description="待审批的记录ID列表")
    approved: bool = Field(..., description="是否批准")
    opinion: str = Field(..., description="审批意见")


class TransferApprovalResponse(BaseModel):
    """转量审批响应"""
    success: bool
    message: str
    approved_count: int = Field(0, description="批准数量")
    rejected_count: int = Field(0, description="拒绝数量")


class PendingApprovalRecord(BaseModel):
    """待审批记录"""
    record_id: int
    phone: Optional[str]
    name: Optional[str]
    source_consultant: str
    target_consultant: str
    source_campus: str
    target_campus: str
    apply_time: str
    applicant: str
    reason: str


class TransferRecordHistory(BaseModel):
    """转量历史记录"""
    record_id: int
    phone: Optional[str]
    name: Optional[str]
    original_consultant: str
    target_consultant: str
    transfer_time: str
    operator: str
    transfer_type: str
    reason: Optional[str]


# ==================== API接口 ====================

@router.get("/consultants", response_model=List[ConsultantInfo], summary="获取咨询师列表")
def get_consultants(
    campus: Optional[str] = Query(None, description="神殿筛选"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取咨询师列表及其当前咨询量数量
    """
    query = db.query(
        咨询量明细表.咨询师,
        咨询量明细表.神殿,
    ).filter(
        咨询量明细表.咨询师.isnot(None),
        咨询量明细表.咨询师 != '',
        咨询量明细表.是否无效量 != 1,
    )
    
    if campus:
        query = query.filter(咨询量明细表.神殿 == campus)
    
    # 按咨询师和神殿分组统计
    from sqlalchemy import func
    results_query = db.query(
        咨询量明细表.咨询师,
        咨询量明细表.神殿,
        func.count(咨询量明细表.记录ID).label('count')
    ).filter(
        咨询量明细表.咨询师.isnot(None),
        咨询量明细表.咨询师 != '',
        咨询量明细表.是否无效量 != 1,
    )
    
    if campus:
        results_query = results_query.filter(咨询量明细表.神殿 == campus)
    
    results = results_query.group_by(
        咨询量明细表.咨询师,
        咨询量明细表.神殿
    ).all()
    
    return [
        ConsultantInfo(
            name=r[0],
            campus=r[1] or "未知神殿",
            record_count=r[2]
        )
        for r in results
    ]


@router.get("/preview", summary="预览转量数据")
def preview_transfer(
    source_consultant: str = Query(..., description="原咨询师"),
    target_consultant: str = Query(..., description="目标咨询师"),
    target_campus: Optional[str] = Query(None, description="目标神殿"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    预览转量操作会影响的数据
    """
    # 查询原咨询师的咨询量
    records = db.query(咨询量明细表).filter(
        咨询量明细表.咨询师 == source_consultant,
        咨询量明细表.是否无效量 != 1,
    ).all()
    
    if not records:
        return {
            "success": True,
            "total_count": 0,
            "records": [],
            "is_cross_campus": False,
            "approval_required": False,
        }
    
    # 判断是否跨神殿
    source_campuses = set(r.神殿 for r in records if r.神殿)
    is_cross_campus = bool(target_campus and target_campus not in source_campuses)
    
    return {
        "success": True,
        "total_count": len(records),
        "records": [
            {
                "记录ID": r.记录ID,
                "电话": r.电话,
                "咨询者姓名": r.咨询者姓名,
                "神殿": r.神殿,
                "登记日期": r.登记日期.isoformat() if r.登记日期 else None,
                "状态": r.状态,
            }
            for r in records[:100]  # 最多返回100条预览
        ],
        "is_cross_campus": is_cross_campus,
        "approval_required": is_cross_campus,  # 跨神殿需要审批
    }


@router.post("/batch", response_model=BatchTransferResponse, summary="批量转量")
def batch_transfer(
    request: BatchTransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    批量把某个咨询师的咨询量转给另一个咨询师
    
    - 同神殿转量：直接执行
    - 跨神殿转量：需要审批
    """
    operator = current_user.real_name or current_user.username
    now = datetime.now()
    
    # 构建查询条件
    query = db.query(咨询量明细表).filter(
        咨询量明细表.咨询师 == request.source_consultant,
        咨询量明细表.是否无效量 != 1,
    )
    
    # 如果指定了记录ID，则只转这些记录
    if request.record_ids:
        query = query.filter(咨询量明细表.记录ID.in_(request.record_ids))
    
    records = query.all()
    
    if not records:
        raise HTTPException(status_code=400, detail="没有找到可转量的记录")
    
    # 判断是否跨神殿
    source_campuses = set(r.神殿 for r in records if r.神殿)
    target_campus = request.target_campus
    is_cross_campus = bool(target_campus and target_campus not in source_campuses)

    if is_cross_campus:
        approvers = transfer_approval_config_crud.resolve_approver_users(db, target_campus)
        if not approvers:
            raise HTTPException(status_code=400, detail=f"目标神殿“{target_campus}”未配置转量审批人")
    
    transferred_count = 0
    pending_approval_count = 0
    failed_count = 0
    
    for record in records:
        try:
            # 检查该条记录是否跨神殿
            record_is_cross = target_campus and record.神殿 != target_campus
            
            if record_is_cross:
                if target_campus is None:
                    raise HTTPException(status_code=400, detail="跨神殿转量缺少目标神殿")
                # 跨神殿转量 - 需要审批
                record.转量审批状态 = "待审批"
                record.原咨询师 = request.source_consultant
                record.转自咨询师 = request.source_consultant
                record.原神殿 = record.神殿
                record.目标神殿 = target_campus
                record.转量原因 = request.reason
                record.转量操作人 = operator
                record.转量时间 = now
                # 暂时不更新咨询师和神殿，等审批通过后再更新
                pending_approval_count += 1
            else:
                # 同神殿转量 - 直接执行
                record.原咨询师 = request.source_consultant
                record.转自咨询师 = request.source_consultant
                record.咨询师 = request.target_consultant
                record.是否已转量 = 1
                record.转量类型 = "咨询师转量"
                record.转量时间 = now
                record.转量操作人 = operator
                record.转量原因 = request.reason
                record.咨询师转量次数 = (record.咨询师转量次数 or 0) + 1
                
                if target_campus:
                    record.原神殿 = record.神殿
                    record.目标神殿 = target_campus
                    record.神殿 = target_campus
                
                transferred_count += 1
                
        except Exception as e:
            failed_count += 1
            print(f"转量记录 {record.记录ID} 失败: {e}")
    
    db.commit()

    if pending_approval_count > 0:
        approval_stream_broker.touch()
    
    return BatchTransferResponse(
        success=True,
        message="批量转量完成",
        total_count=len(records),
        transferred_count=transferred_count,
        pending_approval_count=pending_approval_count,
        failed_count=failed_count,
        is_cross_campus=is_cross_campus,
        approval_required=pending_approval_count > 0,
    )


@router.get("/pending-approvals", response_model=List[PendingApprovalRecord], summary="获取待审批的转量记录")
def get_pending_approvals(
    campus: Optional[str] = Query(None, description="目标神殿筛选"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取待审批的跨神殿转量记录
    """
    query = db.query(咨询量明细表).filter(咨询量明细表.转量审批状态 == "待审批")
    approver_campuses = transfer_approval_config_crud.get_user_approver_campuses(
        db, current_user.user_id
    )
    if campus:
        if campus not in approver_campuses:
            return []
        query = query.filter(咨询量明细表.目标神殿 == campus)
    else:
        if not approver_campuses:
            return []
        query = query.filter(咨询量明细表.目标神殿.in_(approver_campuses))
    
    records = query.all()
    
    return [
        PendingApprovalRecord(
            record_id=r.记录ID,
            phone=r.电话,
            name=r.咨询者姓名,
            source_consultant=r.原咨询师 or "",
            target_consultant="",  # 待审批状态时目标咨询师可能未定
            source_campus=r.原神殿 or r.神殿 or "",
            target_campus=r.目标神殿 or "",
            apply_time=r.转量时间.isoformat() if r.转量时间 else "",
            applicant=r.转量操作人 or "",
            reason=r.转量原因 or "",
        )
        for r in records
    ]


@router.post("/approve", response_model=TransferApprovalResponse, summary="审批转量申请")
def approve_transfer(
    request: TransferApprovalRequest,
    target_consultant: str = Query(..., description="目标咨询师"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    审批跨神殿转量申请
    """
    approver = current_user.real_name or current_user.username
    now = datetime.now()
    
    records = db.query(咨询量明细表).filter(
        咨询量明细表.记录ID.in_(request.record_ids),
        咨询量明细表.转量审批状态 == "待审批"
    ).all()

    if not records:
        raise HTTPException(status_code=400, detail="没有找到待审批的转量记录")

    unauthorized_campuses = sorted(
        {
            record.目标神殿
            for record in records
            if record.目标神殿
            and not transfer_approval_config_crud.is_user_campus_approver(
                db, record.目标神殿, current_user.user_id
            )
        }
    )
    if unauthorized_campuses:
        raise HTTPException(
            status_code=403,
            detail=f"当前用户不是以下神殿的转量审批人：{'、'.join(unauthorized_campuses)}",
        )
    
    approved_count = 0
    rejected_count = 0
    
    for record in records:
        record.转量审批人 = approver
        record.转量审批时间 = now
        record.转量审批意见 = request.opinion
        
        if request.approved:
            target_campus = record.目标神殿
            if not target_campus:
                raise HTTPException(status_code=400, detail="待审批记录缺少目标神殿")
            # 审批通过 - 执行转量
            record.转量审批状态 = "已通过"
            record.咨询师 = target_consultant
            record.神殿 = target_campus
            record.是否已转量 = 1
            record.转量类型 = "跨神殿咨询师转量"
            record.咨询师转量次数 = (record.咨询师转量次数 or 0) + 1
            approved_count += 1
        else:
            # 审批拒绝 - 恢复原状
            record.转量审批状态 = "已拒绝"
            # 清除转量相关字段
            record.目标神殿 = ""
            record.原神殿 = ""
            rejected_count += 1
    
    db.commit()

    approval_stream_broker.touch()

    return TransferApprovalResponse(
        success=True,
        message=f"审批完成，通过 {approved_count} 条，拒绝 {rejected_count} 条",
        approved_count=approved_count,
        rejected_count=rejected_count,
    )


@router.get("/history", response_model=List[TransferRecordHistory], summary="获取转量历史")
def get_transfer_history(
    consultant: Optional[str] = Query(None, description="咨询师筛选"),
    campus: Optional[str] = Query(None, description="神殿筛选"),
    start_date: Optional[str] = Query(None, description="开始日期"),
    end_date: Optional[str] = Query(None, description="结束日期"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取咨询师转量历史记录
    """
    query = db.query(咨询量明细表).filter(
        咨询量明细表.转自咨询师.isnot(None)
    )
    
    if consultant:
        query = query.filter(
            (咨询量明细表.转自咨询师 == consultant) | 
            (咨询量明细表.咨询师 == consultant)
        )
    
    if campus:
        query = query.filter(
            (咨询量明细表.神殿 == campus) |
            (咨询量明细表.原神殿 == campus)
        )
    
    if start_date:
        query = query.filter(咨询量明细表.转量时间 >= start_date)
    
    if end_date:
        query = query.filter(咨询量明细表.转量时间 <= end_date)
    
    # 分页
    offset = (page - 1) * page_size
    records = query.order_by(咨询量明细表.转量时间.desc()).offset(offset).limit(page_size).all()
    
    return [
        TransferRecordHistory(
            record_id=r.记录ID,
            phone=r.电话,
            name=r.咨询者姓名,
            original_consultant=r.转自咨询师 or "",
            target_consultant=r.咨询师 or "",
            transfer_time=r.转量时间.isoformat() if r.转量时间 else "",
            operator=r.转量操作人 or "",
            transfer_type=r.转量类型 or "咨询师转量",
            reason=r.转量原因,
        )
        for r in records
    ]


@router.get("/statistics", summary="获取转量统计")
def get_transfer_statistics(
    campus: Optional[str] = Query(None, description="神殿筛选"),
    start_date: Optional[str] = Query(None, description="开始日期"),
    end_date: Optional[str] = Query(None, description="结束日期"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取咨询师转量统计数据
    """
    from sqlalchemy import func
    
    query = db.query(咨询量明细表).filter(
        咨询量明细表.转自咨询师.isnot(None)
    )
    
    if campus:
        query = query.filter(咨询量明细表.神殿 == campus)
    
    if start_date:
        query = query.filter(咨询量明细表.转量时间 >= start_date)
    
    if end_date:
        query = query.filter(咨询量明细表.转量时间 <= end_date)
    
    # 转出统计（按原咨询师分组）
    transfer_out_query = db.query(
        咨询量明细表.转自咨询师,
        func.count(咨询量明细表.记录ID).label('count')
    ).filter(
        咨询量明细表.转自咨询师.isnot(None)
    )
    if campus:
        transfer_out_query = transfer_out_query.filter(咨询量明细表.原神殿 == campus)
    transfer_out = transfer_out_query.group_by(咨询量明细表.转自咨询师).all()
    
    # 转入统计（按当前咨询师分组）
    transfer_in_query = db.query(
        咨询量明细表.咨询师,
        func.count(咨询量明细表.记录ID).label('count')
    ).filter(
        咨询量明细表.转自咨询师.isnot(None)
    )
    if campus:
        transfer_in_query = transfer_in_query.filter(咨询量明细表.神殿 == campus)
    transfer_in = transfer_in_query.group_by(咨询量明细表.咨询师).all()
    
    return {
        "success": True,
        "transfer_out": [
            {"consultant": r[0], "count": r[1]} for r in transfer_out
        ],
        "transfer_in": [
            {"consultant": r[0], "count": r[1]} for r in transfer_in
        ],
        "total_transfers": query.count(),
    }
