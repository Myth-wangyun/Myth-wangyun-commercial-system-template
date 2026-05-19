"""
咨询量导出审批 API 路由
"""

from datetime import datetime, timedelta
from typing import Optional, TypedDict

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.models.consult.export_approval import 导出审批人, 导出申请, 导出筛选参数
from app.models.user import User
from app.services.approvals import approval_stream_broker
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

router = APIRouter()


class 导出查询筛选(TypedDict, total=False):
    campus: str
    start_date: str
    end_date: str
    source: str
    status: str
    media_source: str
    consultant: str
    name: str
    phone: str
    is_invalid: int
    keyword: str


# ==================== Pydantic 模型 ====================


class ExportApproverCreate(BaseModel):
    user_id: int


class ExportApproverResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    real_name: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class ExportRequestCreate(BaseModel):
    reason: str
    filters: 导出筛选参数 | None = None
    total_records: int = 0


class ApproveRequest(BaseModel):
    comment: str | None = None


class RejectRequest(BaseModel):
    comment: str


class ExportRequestResponse(BaseModel):
    id: int
    applicant_id: int
    applicant_name: str
    applicant_campus: str | None
    reason: str
    filters: 导出筛选参数 | None
    total_records: int
    status: str
    approver_id: int | None
    approver_name: str | None
    approval_time: datetime | None
    approval_comment: str | None
    download_url: str | None
    download_expires_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


class ExportRequestListResponse(BaseModel):
    data: list[ExportRequestResponse]
    total: int
    page: int
    page_size: int


# ==================== 辅助函数 ====================


def check_is_approver(db: Session, user_id: int) -> bool:
    """检查用户是否是审批人"""
    import logging

    logger = logging.getLogger(__name__)

    approver = (
        db.query(导出审批人)
        .filter(导出审批人.user_id == user_id, 导出审批人.is_active.is_(True))
        .first()
    )

    logger.info(
        f"检查审批人权限: user_id={user_id}, is_approver={approver is not None}"
    )
    if approver:
        logger.info(
            f"审批人信息: id={approver.id}, user_name={approver.user_name}, is_active={approver.is_active}"
        )

    return approver is not None


def _get_str_filter(filters: object, key: str) -> str | None:
    if not isinstance(filters, dict):
        return None
    value = filters.get(key)
    if isinstance(value, str) and value:
        return value
    return None


def _get_int_filter(filters: object, key: str) -> int | None:
    if not isinstance(filters, dict):
        return None
    value = filters.get(key)
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, str) and value.isdigit():
        return int(value)
    return None


def _normalize_export_filters(filters: object) -> 导出查询筛选:
    normalized: 导出查询筛选 = {}

    campus = _get_str_filter(filters, "campus")
    if campus is not None:
        normalized["campus"] = campus

    start_date = _get_str_filter(filters, "start_date")
    if start_date is not None:
        normalized["start_date"] = start_date

    end_date = _get_str_filter(filters, "end_date")
    if end_date is not None:
        normalized["end_date"] = end_date

    source = _get_str_filter(filters, "source")
    if source is not None:
        normalized["source"] = source

    status = _get_str_filter(filters, "status")
    if status is not None:
        normalized["status"] = status

    media_source = _get_str_filter(filters, "media_source")
    if media_source is not None:
        normalized["media_source"] = media_source

    consultant = _get_str_filter(filters, "consultant")
    if consultant is not None:
        normalized["consultant"] = consultant

    name = _get_str_filter(filters, "name")
    if name is not None:
        normalized["name"] = name

    phone = _get_str_filter(filters, "phone")
    if phone is not None:
        normalized["phone"] = phone

    is_invalid = _get_int_filter(filters, "is_invalid")
    if is_invalid is not None:
        normalized["is_invalid"] = is_invalid

    keyword = _get_str_filter(filters, "keyword")
    if keyword is not None:
        normalized["keyword"] = keyword

    return normalized


def _build_approval_comment(data: ApproveRequest | None) -> str:
    if data is not None and data.comment:
        return data.comment
    return "审批通过"


# ==================== 审批人管理 ====================


@router.get("/approvers", summary="获取导出审批人列表")
def get_export_approvers(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    """获取所有导出审批人"""
    approvers = db.query(导出审批人).filter(导出审批人.is_active.is_(True)).all()
    return {"data": [ExportApproverResponse.model_validate(a) for a in approvers]}


@router.post("/approvers", summary="添加导出审批人")
def add_export_approver(
    data: ExportApproverCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """添加导出审批人（需要管理员权限）"""
    # 检查是否已存在
    existing = db.query(导出审批人).filter(导出审批人.user_id == data.user_id).first()
    if existing:
        if existing.is_active:
            raise HTTPException(status_code=400, detail="该用户已是审批人")
        # 如果已存在但未激活，重新激活
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return {
            "success": True,
            "data": ExportApproverResponse.model_validate(existing),
        }

    # 获取用户信息
    user = db.query(User).filter(User.user_id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="用户不存在")

    # 创建审批人
    approver = 导出审批人(
        user_id=user.user_id,
        user_name=user.username,
        real_name=user.real_name,
        is_active=True,
        created_by=current_user.user_id,
    )
    db.add(approver)
    db.commit()
    db.refresh(approver)

    return {"success": True, "data": ExportApproverResponse.model_validate(approver)}


@router.delete("/approvers/{approver_id}", summary="移除导出审批人")
def remove_export_approver(
    approver_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """移除导出审批人"""
    approver = db.query(导出审批人).filter(导出审批人.id == approver_id).first()
    if not approver:
        raise HTTPException(status_code=404, detail="审批人不存在")

    approver.is_active = False
    db.commit()

    return {"success": True, "message": "已移除审批人"}


@router.get("/check-approver", summary="检查当前用户是否是审批人")
def check_approver(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)
):
    """检查当前用户是否是审批人"""
    is_approver = check_is_approver(db, current_user.user_id)
    return {"is_approver": is_approver}


# ==================== 导出申请管理 ====================


@router.post("/request", summary="创建导出申请")
def create_export_request(
    data: ExportRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """创建导出申请"""
    request = 导出申请(
        applicant_id=current_user.user_id,
        applicant_name=current_user.real_name,
        applicant_campus=current_user.campus,
        reason=data.reason,
        filters=data.filters,
        total_records=data.total_records,
        status="pending",
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    approval_stream_broker.touch()

    return {"success": True, "data": ExportRequestResponse.model_validate(request)}


@router.get("/my-requests", summary="获取我的导出申请")
def get_my_export_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """获取当前用户的导出申请列表"""
    query = db.query(导出申请).filter(导出申请.applicant_id == current_user.user_id)

    if status:
        query = query.filter(导出申请.status == status)

    total = query.count()
    requests = (
        query.order_by(导出申请.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ExportRequestListResponse(
        data=[ExportRequestResponse.model_validate(r) for r in requests],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/pending-requests", summary="获取待审批的导出申请")
def get_pending_export_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """获取待审批的导出申请（仅审批人可见）"""
    if not check_is_approver(db, current_user.user_id):
        raise HTTPException(status_code=403, detail="无审批权限")

    query = db.query(导出申请).filter(导出申请.status == "pending")
    total = query.count()
    requests = (
        query.order_by(导出申请.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ExportRequestListResponse(
        data=[ExportRequestResponse.model_validate(r) for r in requests],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/all-requests", summary="获取所有导出申请")
def get_all_export_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    applicant_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """获取所有导出申请（仅审批人可见）"""
    if not check_is_approver(db, current_user.user_id):
        raise HTTPException(status_code=403, detail="无审批权限")

    query = db.query(导出申请)

    if status:
        query = query.filter(导出申请.status == status)
    if applicant_name:
        query = query.filter(导出申请.applicant_name.contains(applicant_name))

    total = query.count()
    requests = (
        query.order_by(导出申请.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return ExportRequestListResponse(
        data=[ExportRequestResponse.model_validate(r) for r in requests],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/request/{request_id}", summary="获取导出申请详情")
def get_export_request_detail(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """获取导出申请详情"""
    request = db.query(导出申请).filter(导出申请.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="申请不存在")

    # 只有申请人或审批人可以查看
    is_approver = check_is_approver(db, current_user.user_id)
    if request.applicant_id != current_user.user_id and not is_approver:
        raise HTTPException(status_code=403, detail="无权限查看")

    return {"success": True, "data": ExportRequestResponse.model_validate(request)}


@router.post("/request/{request_id}/approve", summary="审批通过导出申请")
def approve_export_request(
    request_id: int,
    data: Optional[ApproveRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """审批通过导出申请"""
    if not check_is_approver(db, current_user.user_id):
        raise HTTPException(status_code=403, detail="无审批权限")

    request = db.query(导出申请).filter(导出申请.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="申请不存在")

    if request.status != "pending":
        raise HTTPException(status_code=400, detail="该申请已被处理")

    # 更新状态
    request.status = "approved"
    request.approver_id = current_user.user_id
    request.approver_name = current_user.real_name
    request.approval_time = datetime.now()
    request.approval_comment = _build_approval_comment(data)

    # 设置下载链接过期时间（7天后）
    request.download_expires_at = datetime.now() + timedelta(days=7)

    db.commit()
    db.refresh(request)
    approval_stream_broker.touch()

    return {"success": True, "data": ExportRequestResponse.model_validate(request)}


@router.post("/request/{request_id}/reject", summary="驳回导出申请")
def reject_export_request(
    request_id: int,
    data: RejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """驳回导出申请"""
    if not check_is_approver(db, current_user.user_id):
        raise HTTPException(status_code=403, detail="无审批权限")

    request = db.query(导出申请).filter(导出申请.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="申请不存在")

    if request.status != "pending":
        raise HTTPException(status_code=400, detail="该申请已被处理")

    # 更新状态
    request.status = "rejected"
    request.approver_id = current_user.user_id
    request.approver_name = current_user.real_name
    request.approval_time = datetime.now()
    request.approval_comment = data.comment

    db.commit()
    db.refresh(request)
    approval_stream_broker.touch()

    return {"success": True, "data": ExportRequestResponse.model_validate(request)}


@router.delete("/request/{request_id}", summary="撤销导出申请")
def cancel_export_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """撤销导出申请（仅限待审批状态且本人申请）"""
    request = db.query(导出申请).filter(导出申请.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="申请不存在")

    if request.applicant_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="只能撤销自己的申请")

    if request.status != "pending":
        raise HTTPException(status_code=400, detail="只能撤销待审批的申请")

    db.delete(request)
    db.commit()
    approval_stream_broker.touch()

    return {"success": True, "message": "申请已撤销"}


@router.get("/request/{request_id}/download", summary="下载导出文件")
def download_export_file(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """下载导出文件（需要审批通过且未过期）"""
    import io

    import openpyxl
    from app.models.consult.consultation_record import 咨询量明细表
    from fastapi.responses import StreamingResponse
    from openpyxl.utils import get_column_letter
    from openpyxl.worksheet.dimensions import ColumnDimension

    request = db.query(导出申请).filter(导出申请.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="申请不存在")

    # 只有申请人可以下载
    if request.applicant_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="只能下载自己申请的数据")

    if request.status != "approved":
        raise HTTPException(status_code=400, detail="申请未通过审批")

    if request.download_expires_at and request.download_expires_at < datetime.now():
        raise HTTPException(status_code=400, detail="下载链接已过期，请重新申请")

    # 根据 filters 查询数据
    query = db.query(咨询量明细表)
    filters = _normalize_export_filters(request.filters)

    campus = filters.get("campus")
    if campus is not None:
        query = query.filter(咨询量明细表.神殿 == campus)

    start_date = filters.get("start_date")
    if start_date is not None:
        # 支持精确到时分的日期格式 (YYYY-MM-DD HH:mm 或 YYYY-MM-DD)
        if len(start_date) == 10:  # YYYY-MM-DD 格式，补充时间
            start_date = start_date + " 00:00:00"
        query = query.filter(咨询量明细表.登记日期 >= start_date)

    end_date = filters.get("end_date")
    if end_date is not None:
        # 支持精确到时分的日期格式 (YYYY-MM-DD HH:mm 或 YYYY-MM-DD)
        if len(end_date) == 10:  # YYYY-MM-DD 格式，补充到当天结束
            end_date = end_date + " 23:59:59"
        elif len(end_date) == 16:  # YYYY-MM-DD HH:mm 格式，补充秒
            end_date = end_date + ":59"
        query = query.filter(咨询量明细表.登记日期 <= end_date)

    source = filters.get("source")
    if source is not None:
        query = query.filter(咨询量明细表.量来源 == source)

    status = filters.get("status")
    if status is not None:
        query = query.filter(咨询量明细表.状态 == status)

    media_source = filters.get("media_source")
    if media_source is not None:
        query = query.filter(咨询量明细表.媒体来源 == media_source)

    consultant = filters.get("consultant")
    if consultant is not None:
        query = query.filter(咨询量明细表.咨询师.contains(consultant))

    name = filters.get("name")
    if name is not None:
        query = query.filter(咨询量明细表.咨询者姓名.contains(name))

    phone = filters.get("phone")
    if phone is not None:
        query = query.filter(咨询量明细表.电话.contains(phone))

    is_invalid = filters.get("is_invalid")
    if is_invalid is not None:
        query = query.filter(咨询量明细表.是否无效量 == is_invalid)

    keyword = filters.get("keyword")
    if keyword is not None:
        query = query.filter(
            (咨询量明细表.电话.contains(keyword))
            | (咨询量明细表.咨询者姓名.contains(keyword))
            | (咨询量明细表.备注.contains(keyword))
            | (咨询量明细表.位置.contains(keyword))
        )

    records = query.order_by(咨询量明细表.登记日期.desc()).all()

    # 更新实际导出的记录数
    actual_count = len(records)
    if request.total_records != actual_count:
        request.total_records = actual_count
        db.commit()

    # 生成 Excel 文件
    wb = openpyxl.Workbook()
    ws = wb.active
    if ws is None:
        raise HTTPException(status_code=500, detail="导出文件创建失败")
    ws.title = "咨询量导出"

    # 定义导出列
    export_columns = [
        ("登记日期", "登记日期"),
        ("咨询者姓名", "咨询者姓名"),
        ("电话", "电话"),  # 显示完整电话号码
        ("咨询师", "咨询师"),
        ("分量人", "分量人"),
        ("状态", "状态"),
        ("量来源", "量来源"),
        ("媒体来源", "媒体来源"),
        ("报名意向", "报名意向"),
        ("神殿", "神殿"),
        ("性别", "性别"),
        ("年龄", "年龄"),
        ("学历", "学历"),
        ("咨询类别", "咨询类别"),
        ("是否无效量", "是否无效量"),
        ("无效原因", "无效原因"),
        ("是否上门", "是否上门"),
        ("是否报名", "是否报名"),
        ("备注", "备注"),
    ]

    # 写入表头
    for col_idx, (header, _) in enumerate(export_columns, 1):
        ws.cell(row=1, column=col_idx, value=header)

    # 写入数据
    for row_idx, record in enumerate(records, 2):
        for col_idx, (header, field) in enumerate(export_columns, 1):
            value = getattr(record, field, None)

            # 特殊处理
            if header in ["是否无效量", "是否上门", "是否报名"]:
                value = "是" if value == 1 else "否"
            elif field == "登记日期" and value:
                value = (
                    value.strftime("%Y-%m-%d %H:%M:%S")
                    if hasattr(value, "strftime")
                    else str(value)
                )

            ws.cell(row=row_idx, column=col_idx, value=value)

    # 调整列宽
    for col_idx in range(1, len(export_columns) + 1):
        column_letter = get_column_letter(col_idx)
        ws.column_dimensions[column_letter] = ColumnDimension(
            ws,
            index=column_letter,
            width=15,
        )

    # 保存到内存
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    # 标记已下载（可选：限制下载次数）
    # request.download_count = (request.download_count or 0) + 1
    # db.commit()

    from urllib.parse import quote

    filename = f"咨询量导出_{request_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.xlsx"
    # URL 编码文件名以支持中文
    encoded_filename = quote(filename)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
        },
    )
