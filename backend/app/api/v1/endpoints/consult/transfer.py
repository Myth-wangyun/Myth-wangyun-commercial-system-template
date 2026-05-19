"""
咨询量转量API接口

实现《清美教育咨询量管理规定》第八章的转量功能
"""

from datetime import datetime
from typing import List, Optional

from app.models.user import User
from app.services.consult.transfer import TransferService
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db

router = APIRouter()


# ==================== 请求/响应模型 ====================

class TransferRequest(BaseModel):
    """转量请求"""
    record_id: int = Field(..., description="咨询量明细记录ID")
    target_campus: str = Field(..., description="目标神殿")
    reason: Optional[str] = Field(None, description="转量原因")
    new_consultant: Optional[str] = Field(None, description="新分配的咨询师")


class TransferCheckResponse(BaseModel):
    """转量检查响应"""
    can_transfer: bool = Field(..., description="是否可以转量")
    message: str = Field(..., description="原因说明")


class TransferResponse(BaseModel):
    """转量响应"""
    success: bool
    message: str
    record_id: int
    transfer_type: str = Field(..., description="转量类型：同城转量/跨省转量")
    transfer_stage: str = Field(..., description="转量阶段：上门前/上门后/报名后")
    source_campus: str = Field(..., description="原神殿")
    target_campus: str = Field(..., description="目标神殿")
    transfer_time: str = Field(..., description="转量时间")
    operator: str = Field(..., description="操作人")
    benefit_info: dict = Field(..., description="权益分配说明")


class BenefitInfoResponse(BaseModel):
    """权益说明响应"""
    transfer_type: str = Field(..., description="转量类型")
    transfer_stage: str = Field(..., description="转量阶段")
    benefit_info: dict = Field(..., description="权益分配说明")


class TransferStatisticsResponse(BaseModel):
    """转量统计响应"""
    campus: str
    period: dict
    transfer_out_count: int = Field(..., description="转出数量")
    transfer_in_count: int = Field(..., description="转入数量")
    by_type: dict = Field(..., description="按转量类型统计")
    by_stage: dict = Field(..., description="按转量阶段统计")


class CampusInfo(BaseModel):
    """神殿信息"""
    campus_name: str
    city: str


# ==================== API接口 ====================

@router.get("/transfer/campuses", response_model=List[CampusInfo], summary="获取可用神殿列表")
def get_available_campuses():
    """
    获取可用于转量的神殿列表
    
    返回所有神殿及其所在城市，用于前端选择目标神殿
    """
    return TransferService.get_available_campuses()


@router.get("/transfer/check/{record_id}", response_model=TransferCheckResponse, summary="检查是否可转量")
def check_can_transfer(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    检查指定咨询量是否可以进行转量操作
    
    转量条件：
    - 记录必须存在
    - 记录未被标记为无效
    - 记录尚未被转量
    - 在保护期内
    """
    can_do, message = TransferService.can_transfer(db, record_id)
    return TransferCheckResponse(can_transfer=can_do, message=message)


@router.post("/transfer/execute", response_model=TransferResponse, summary="执行转量操作")
def execute_transfer(
    request: TransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    执行转量操作
    
    将咨询量从当前神殿转移到目标神殿：
    1. 检查转量条件
    2. 自动判断转量类型（同城/跨省）
    3. 自动判断转量阶段（上门前/上门后/报名后）
    4. 更新记录的神殿归属
    5. 返回权益分配说明
    
    转量类型判断：
    - 同城转量：原神殿和目标神殿在同一城市
    - 跨省转量：原神殿和目标神殿不在同一城市
    
    权益分配参见《清美教育咨询量管理规定》第八章
    """
    try:
        result = TransferService.transfer_consultation(
            db=db,
            record_id=request.record_id,
            target_campus=request.target_campus,
            operator=current_user.real_name or current_user.username,
            reason=request.reason,
            new_consultant=request.new_consultant,
        )
        return TransferResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"转量操作失败: {str(e)}")


@router.get("/transfer/benefit-preview", response_model=BenefitInfoResponse, summary="预览转量权益分配")
def preview_transfer_benefit(
    record_id: int = Query(..., description="咨询量明细记录ID"),
    target_campus: str = Query(..., description="目标神殿"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    预览转量后的权益分配
    
    在实际执行转量前，预先计算权益分配情况供用户确认
    """
    from app.models.consult.consultation_record import 咨询量明细表
    
    # 获取记录
    record = db.query(咨询量明细表).filter(咨询量明细表.记录ID == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    source_campus = record.神殿
    
    # 判断转量类型和阶段
    transfer_type = TransferService.determine_transfer_type(source_campus, target_campus)
    transfer_stage = TransferService.determine_transfer_stage(record)
    
    # 获取权益说明
    benefit_info = TransferService.get_benefit_info(transfer_type, transfer_stage)
    
    return BenefitInfoResponse(
        transfer_type=transfer_type,
        transfer_stage=transfer_stage,
        benefit_info=benefit_info,
    )


@router.get("/transfer/records", summary="查询转量记录")
def get_transfer_records(
    source_campus: Optional[str] = Query(None, description="原神殿"),
    target_campus: Optional[str] = Query(None, description="目标神殿"),
    transfer_type: Optional[str] = Query(None, description="转量类型：同城转量/跨省转量"),
    transfer_stage: Optional[str] = Query(None, description="转量阶段：上门前/上门后/报名后"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    查询转量记录列表
    
    支持按原神殿、目标神殿、转量类型、转量阶段、日期范围筛选
    """
    # 转换日期
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59) if end_date else None
    
    skip = (page - 1) * page_size
    
    records, total = TransferService.get_transfer_records(
        db=db,
        source_campus=source_campus,
        target_campus=target_campus,
        transfer_type=transfer_type,
        transfer_stage=transfer_stage,
        start_date=start_date_obj,
        end_date=end_date_obj,
        skip=skip,
        limit=page_size,
    )
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return {
        "总记录数": total,
        "总页数": total_pages,
        "当前页": page,
        "每页数量": page_size,
        "数据列表": [r.to_dict() for r in records],
    }


@router.get("/transfer/statistics", response_model=TransferStatisticsResponse, summary="获取转量统计")
def get_transfer_statistics(
    campus: Optional[str] = Query(None, description="神殿（作为原神殿或目标神殿）"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    获取转量统计数据
    
    统计内容：
    - 转出数量
    - 转入数量
    - 按转量类型统计（同城/跨省）
    - 按转量阶段统计（上门前/上门后/报名后）
    """
    # 转换日期
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59) if end_date else None
    
    stats = TransferService.get_transfer_statistics(
        db=db,
        campus=campus,
        start_date=start_date_obj,
        end_date=end_date_obj,
    )
    
    return TransferStatisticsResponse(**stats)


@router.get("/transfer/rules", summary="获取转量规则说明")
def get_transfer_rules():
    """
    获取转量规则说明
    
    根据《清美教育咨询量管理规定》第八章返回转量规则详情
    """
    return {
        "转量定义": "最先登记咨询量的A神殿在正常咨询保护期内把自己不能转化的咨询量转入B神殿进行咨询转化",
        "转量类型": {
            "同城转量": "同一城市内神殿之间的转量",
            "跨省转量": "不同省份神殿之间的转量",
        },
        "转量阶段": {
            "上门前": "咨询量尚未上门",
            "上门后": "咨询量已上门但未报名",
            "报名后": "咨询量已报名（送生）",
        },
        "同城转量权益": {
            "归属": "转量之后咨询量归属B神殿",
            "报名量": "归B神殿",
            "学费分配": "AB神殿5:5分配",
            "提成": "A神殿负责",
            "激励": "B神殿承担",
        },
        "跨省转量权益": {
            "上门前转量": {
                "归属": "转量后归属B神殿",
                "报名量": "归B神殿",
                "学费分配": "A神殿1万元，B神殿=学费-1万元",
                "提成和激励": "AB各50%",
            },
            "上门后转量": {
                "归属": "转量后归属B神殿",
                "报名量": "归B神殿",
                "学费分配": "AB 5:5分配",
                "提成": "A神殿负责",
                "激励": "B神殿承担",
            },
            "报名后转量": {
                "归属": "归属B神殿",
                "报名量": "归B神殿",
                "学费分配": "AB 5:5分配",
                "提成和激励": "AB各50%",
            },
        },
        "送生后扩科": {
            "说明1": "A神殿送生至B神殿后，学生在B神殿扩科与A神殿没有关系，后续扩科收入全部归属B神殿",
            "说明2": "分期缴费不是扩科，分期缴费自然归属原神殿",
            "说明3": "学费总收入增加属于扩科，降低则不属于扩科",
        },
    }
