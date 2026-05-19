"""
咨询量录入系统API路由
"""

from datetime import datetime
from typing import List, Optional, TypedDict

from app.crud.consult.consultation_record import (
    咨询量主表CRUD,
    咨询量明细表CRUD,
    咨询量服务,
)
from app.models.consult.consultation_record import 咨询量明细表
from app.models.consult.payment_record import 咨询缴费记录表
from app.models.user import User
from app.schemas.consult.consultation_record import (
    咨询量主表分页响应,
    咨询量主表响应,
    咨询量批量导入响应,
    咨询量批量导入请求,
    咨询量明细表分页响应,
    咨询量明细表创建,
    咨询量明细表响应,
    咨询量明细表更新,
    导入结果项,
    重量检查响应,
)
from app.utils.consultation_date_utils import get_business_day_range
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from .....core.auth import get_current_active_user
from .....core.database import get_db

# 注意：表初始化已移至 app/core/database.py 的 init_db() 函数中
# 通过 ConsultBase.metadata.create_all() 在启动时自动创建

router = APIRouter()


class 媒体来源节点(TypedDict):
    name: str
    children: list[str]


class 媒体来源分类节点(TypedDict):
    name: str
    children: list[媒体来源节点]


# ==================== 录入咨询量 ====================

@router.post("/consultation/record", summary="录入咨询量")
def create_consultation_record(
    obj_in: 咨询量明细表创建,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    录入咨询量
    
    - 自动检查重量（通过电话号码）
    - 如果是重复咨询，自动关联到已有对象并增加咨询次数
    - 如果是新咨询，创建新的对象记录
    - 支持添加第二电话号码
    - 自动设置录量人为当前登录用户的real_name
    
    注意：登记日期精确到秒，用于防止抢量
    """
    try:
        # 自动设置录量人为当前登录用户的real_name
        obj_in.录量人 = current_user.real_name
        obj_in.创建人ID = current_user.user_id
        obj_in.创建人姓名 = current_user.real_name
        
        主表, 明细, is_repeat = 咨询量服务.录入咨询量(db, obj_in)
        return {
            "success": True,
            "message": "重复咨询录入成功" if is_repeat else "新咨询录入成功",
            "is_repeat": is_repeat,
            "对象ID": 主表.对象ID,
            "记录ID": 明细.记录ID,
            "咨询次数": 主表.咨询次数,
            "录量人": 明细.录量人,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"录入失败: {str(e)}") from e


# ==================== 重量检查 ====================

@router.get("/consultation/check-duplicate", response_model=重量检查响应, summary="检查重量")
def check_duplicate(
    phone: Optional[str] = Query(None, description="主电话号码"),
    second_phone: Optional[str] = Query(None, description="第二电话号码"),
    wechat: Optional[str] = Query(None, description="微信号"),
    db: Session = Depends(get_db)
):
    """
    检查是否重量
    
    在录入前调用此接口检查电话号码和微信号是否已存在
    - 电话和第二电话联合查重，任意一个存在即为重量
    - 微信号单独查重，已存在即为重量
    """
    result = 咨询量服务.检查重量(db, phone or '', second_phone, wechat)
    
    # 转换为响应格式
    return 重量检查响应(
        是否重量=result["是否重量"],
        对象ID=result["对象ID"],
        咨询次数=result["咨询次数"],
        最新咨询信息=result["最新咨询信息"],
        电话列表=result["电话列表"],
        咨询日期列表=result["咨询日期列表"],
        重量神殿=result["重量神殿"],
        重量类型=result.get("重量类型"),
        重量微信=result.get("重量微信"),
    )


# ==================== 获取咨询量列表 ====================

@router.get("/consultation/records", response_model=咨询量明细表分页响应, summary="获取咨询量明细列表")
def get_consultation_records(
    phone: Optional[str] = Query(None, description="电话号码"),
    name: Optional[str] = Query(None, description="咨询者姓名"),
    distributor: Optional[str] = Query(None, description="分量人"),
    consultant: Optional[str] = Query(None, description="咨询师"),
    recorder: Optional[str] = Query(None, description="录量人"),
    status: Optional[str] = Query(None, description="状态"),
    source: Optional[str] = Query(None, description="量来源"),
    media_source: Optional[str] = Query(None, description="媒体来源"),
    specific_source: Optional[str] = Query(None, description="具体来源"),
    category: Optional[str] = Query(None, description="咨询类别"),
    campus: Optional[str] = Query(None, description="神殿"),
    education: Optional[str] = Query(None, description="学历"),
    is_invalid: Optional[int] = Query(None, ge=0, le=1, description="是否无效量 0-有效 1-无效"),
    is_signup_or_reserve: Optional[int] = Query(None, ge=0, le=1, description="是否报名或订座 1-是"),
    is_handovered: Optional[int] = Query(None, ge=0, le=1, description="是否已交接 0-未交接 1-已交接"),
    is_unassigned: Optional[int] = Query(None, ge=0, le=1, description="是否未分配咨询师 1-未分配"),
    keyword: Optional[str] = Query(None, description="全文搜索关键字（模糊匹配电话、姓名、备注、位置等多字段）"),
    referrer: Optional[str] = Query(None, description="口碑提供人（模糊匹配）"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD 或 YYYY-MM-DD HH:mm"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD 或 YYYY-MM-DD HH:mm"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=1000, description="每页数量"),
    db: Session = Depends(get_db)
):
    """获取咨询量明细列表（支持分页和筛选）"""
    # 转换日期格式，使用咨询量截止时间配置
    start_date_obj = None
    end_date_obj = None
    if start_date:
        if len(start_date) == 10:  # YYYY-MM-DD
            parsed_date = datetime.strptime(start_date, "%Y-%m-%d").date()
            start_date_obj, _ = get_business_day_range(parsed_date, db)
        elif len(start_date) == 16:  # YYYY-MM-DD HH:mm
            start_date_obj = datetime.strptime(start_date, "%Y-%m-%d %H:%M")
        else:
            parsed_date = datetime.strptime(start_date[:10], "%Y-%m-%d").date()
            start_date_obj, _ = get_business_day_range(parsed_date, db)
    if end_date:
        if len(end_date) == 10:  # YYYY-MM-DD
            parsed_date = datetime.strptime(end_date, "%Y-%m-%d").date()
            _, end_date_obj = get_business_day_range(parsed_date, db)
        elif len(end_date) == 16:  # YYYY-MM-DD HH:mm
            end_date_obj = datetime.strptime(end_date, "%Y-%m-%d %H:%M").replace(second=59)
        else:
            parsed_date = datetime.strptime(end_date[:10], "%Y-%m-%d").date()
            _, end_date_obj = get_business_day_range(parsed_date, db)
    
    skip = (page - 1) * page_size
    
    records, total = 咨询量明细表CRUD.get_multi(
        db,
        phone=phone,
        name=name,
        distributor=distributor,
        consultant=consultant,
        recorder=recorder,
        status=status,
        source=source,
        media_source=media_source,
        specific_source=specific_source,
        category=category,
        campus=campus,
        education=education,
        is_invalid=is_invalid,
        is_signup_or_reserve=is_signup_or_reserve,
        is_handovered=is_handovered,
        is_unassigned=is_unassigned,
        keyword=keyword,
        referrer=referrer,
        start_date=start_date_obj,
        end_date=end_date_obj,
        skip=skip,
        limit=page_size
    )
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return 咨询量明细表分页响应(
        总记录数=total,
        总页数=total_pages,
        当前页=page,
        每页数量=page_size,
        数据列表=[
            咨询量明细表响应.model_validate(record)
            for record in records
        ],
    )


# ==================== 获取咨询量主表列表 ====================

@router.get("/consultation/objects", response_model=咨询量主表分页响应, summary="获取咨询量主表列表")
def get_consultation_objects(
    phone: Optional[str] = Query(None, description="电话号码"),
    name: Optional[str] = Query(None, description="咨询者姓名"),
    campus: Optional[str] = Query(None, description="神殿"),
    start_date: Optional[str] = Query(None, description="开始日期 YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="结束日期 YYYY-MM-DD"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=1000, description="每页数量"),
    db: Session = Depends(get_db)
):
    """获取咨询量主表列表（按对象汇总）"""
    # 转换日期格式
    start_date_obj = datetime.strptime(start_date, "%Y-%m-%d") if start_date else None
    end_date_obj = datetime.strptime(end_date, "%Y-%m-%d") if end_date else None
    
    skip = (page - 1) * page_size
    
    records, total = 咨询量主表CRUD.get_multi(
        db,
        phone=phone,
        name=name,
        campus=campus,
        start_date=start_date_obj,
        end_date=end_date_obj,
        skip=skip,
        limit=page_size
    )
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    
    return 咨询量主表分页响应(
        总记录数=total,
        总页数=total_pages,
        当前页=page,
        每页数量=page_size,
        数据列表=[
            咨询量主表响应.model_validate(record)
            for record in records
        ],
    )


# ==================== 获取单个咨询对象详情 ====================

@router.get("/consultation/object/{object_id}", summary="获取咨询对象完整信息")
def get_consultation_object(
    object_id: int,
    db: Session = Depends(get_db)
):
    """获取咨询对象的完整信息（包含所有咨询记录）"""
    result = 咨询量服务.获取完整咨询信息(db, object_id)
    if not result:
        raise HTTPException(status_code=404, detail="对象不存在")
    
    return {
        "success": True,
        "data": {
            "主表信息": result["主表信息"].to_dict(),
            "明细列表": [r.to_dict() for r in result["明细列表"]],
        }
    }


# ==================== 获取单条明细记录 ====================

@router.get("/consultation/record/{record_id}", response_model=咨询量明细表响应, summary="获取咨询明细记录")
def get_consultation_record(
    record_id: int,
    db: Session = Depends(get_db)
):
    """根据记录ID获取咨询明细"""
    record = 咨询量明细表CRUD.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


def _sync_payment_from_consultation(db: Session, 记录ID: int, obj_in):
    """
    从咨询量明细同步缴费信息到缴费记录表
    当在编辑咨询量时更新了已交学费或缴费金额，同步到缴费记录表
    """
    try:
        # 获取缴费记录
        payment = db.query(咨询缴费记录表).filter(咨询缴费记录表.记录ID == 记录ID).first()
        
        # 获取更新的缴费金额
        已交学费 = getattr(obj_in, '已交学费', None)
        缴费金额 = getattr(obj_in, '缴费金额', None)
        
        # 解析金额（可能是字符串或整数）
        金额 = 0
        if 缴费金额 is not None:
            金额 = int(缴费金额) if 缴费金额 else 0
        elif 已交学费 is not None:
            try:
                金额 = int(已交学费) if 已交学费 else 0
            except (ValueError, TypeError):
                金额 = 0
        
        if 金额 == 0:
            return  # 没有有效金额，不同步
        
        if payment:
            # 更新已有记录：将金额设为首款金额
            if payment.首款金额 != 金额:
                payment.首款金额 = 金额
                payment.首款时间 = payment.首款时间 or datetime.now()
                # 重新计算
                from app.crud.consult.payment_record import 缴费记录CRUD
                缴费记录CRUD._recalculate(db, payment)
                db.flush()
                print(f"[consult-sync] 已同步到缴费记录表: 记录ID={记录ID}, 首款金额={金额}")
        else:
            # 创建新记录
            consultation = db.query(咨询量明细表).filter(咨询量明细表.记录ID == 记录ID).first()
            if consultation:
                new_payment = 咨询缴费记录表(
                    记录ID=记录ID,
                    对象ID=consultation.对象ID or 0,
                    首款金额=金额,
                    首款时间=datetime.now(),
                    已交总额=金额,
                    欠费金额=0,
                    缴费状态='部分缴费' if 金额 > 0 else '未缴费',
                )
                db.add(new_payment)
                db.flush()
                print(f"[consult-sync] 已创建缴费记录: 记录ID={记录ID}, 首款金额={金额}")
    except Exception as e:
        db.rollback()
        print(f"[consult-sync] 同步到缴费记录表失败: {e}")


# ==================== 更新咨询明细 ====================

@router.put("/consultation/record", response_model=咨询量明细表响应, summary="更新咨询明细记录")
def update_consultation_record(
    obj_in: 咨询量明细表更新,
    db: Session = Depends(get_db)
):
    """
    更新咨询量明细记录
    
    当数据发生变化时，会自动：
    - 增加咨询次数
    - 记录修改时间到咨询日期列表
    
    注意：录入超过20分钟后，电话号码不允许修改
    """
    record = 咨询量明细表CRUD.get_by_id(db, obj_in.记录ID)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    # 检查电话是否允许修改：超过20分钟后禁止修改已有电话，但允许从空补录
    if obj_in.电话 and obj_in.电话 != record.电话:
        from datetime import datetime, timedelta
        has_existing_phone = bool(record.电话 and str(record.电话).strip())
        if has_existing_phone and record.创建时间:
            time_diff = datetime.now() - record.创建时间
            if time_diff > timedelta(minutes=20):
                raise HTTPException(
                    status_code=400,
                    detail="录入超过20分钟，电话号码不允许修改"
                )
    
    try:
        # 获取更新前的数据快照，用于检测是否有变化
        update_data = obj_in.model_dump(exclude_unset=True, exclude={'记录ID', '第二电话'})
        
        # 检测咨询师是否变更（转量逻辑）
        if '咨询师' in update_data and update_data['咨询师']:
            新咨询师 = update_data['咨询师']
            原咨询师 = record.咨询师
            if 原咨询师 and 原咨询师 != 新咨询师:
                # 这是一个转量操作：记录原咨询师
                record.原咨询师 = 原咨询师
                record.转自咨询师 = 原咨询师
                record.咨询师转量次数 = (record.咨询师转量次数 or 0) + 1
                record.是否已转量 = 1
                record.转量类型 = "编辑转量"
        
        # 检测是否有实际数据变化
        has_changes = False
        for field, new_value in update_data.items():
            old_value = getattr(record, field, None)
            # 比较值（处理 None 和空字符串的情况）
            if old_value != new_value:
                # 排除两者都是"空"的情况
                if not (old_value in (None, '', 0) and new_value in (None, '', 0)):
                    has_changes = True
                    break
        
        # 如果更新了电话，需要同步更新主表的电话列表
        if obj_in.电话 or obj_in.第二电话:
            主表 = 咨询量主表CRUD.get_by_id(db, record.对象ID)
            if 主表:
                if obj_in.电话:
                    咨询量主表CRUD.add_phone(db, 主表, obj_in.电话)
                if obj_in.第二电话:
                    咨询量主表CRUD.add_phone(db, 主表, obj_in.第二电话)
        
        # 更新明细记录
        updated_record = 咨询量明细表CRUD.update(db, record, obj_in)
        
        # 同步缴费信息到缴费记录表（如果更新了已交学费或缴费金额）
        if hasattr(obj_in, '已交学费') or hasattr(obj_in, '缴费金额'):
            _sync_payment_from_consultation(db, obj_in.记录ID, obj_in)
        
        # 更新主表的最新信息
        主表 = 咨询量主表CRUD.get_by_id(db, record.对象ID)
        if 主表:
            if obj_in.咨询者姓名 or obj_in.状态:
                咨询量主表CRUD.update_latest_info(db, 主表, obj_in.咨询者姓名, obj_in.状态)
            
            # 如果有数据变化，增加咨询历史记录
            if has_changes:
                from datetime import datetime
                # 增加咨询次数
                咨询量主表CRUD.increment_count(db, 主表)
                # 添加修改时间到咨询日期列表
                咨询量主表CRUD.add_consultation_date(db, 主表, datetime.now())
        
        return updated_record
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"更新失败: {str(e)}") from e


# ==================== 删除咨询明细 ====================

@router.delete("/consultation/record/{record_id}", summary="删除咨询明细记录")
def delete_consultation_record(
    record_id: int,
    db: Session = Depends(get_db)
):
    """删除咨询量明细记录"""
    record = 咨询量明细表CRUD.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    对象ID = record.对象ID
    
    try:
        # 删除明细
        咨询量明细表CRUD.delete(db, record_id)
        
        # 更新主表的咨询次数
        主表 = 咨询量主表CRUD.get_by_id(db, 对象ID)
        if 主表:
            count = 咨询量明细表CRUD.count_by_object_id(db, 对象ID)
            if count == 0:
                # 如果没有明细了，删除主表
                咨询量主表CRUD.delete(db, 对象ID)
            else:
                # 更新咨询次数
                主表.咨询次数 = count
                # 重新计算所有明细的咨询次数（保持顺序一致）
                咨询量明细表CRUD.recalculate_consultation_count(db, 对象ID)
                # 更新最新信息
                latest = 咨询量明细表CRUD.get_latest_by_object_id(db, 对象ID)
                if latest:
                    咨询量主表CRUD.update_latest_info(db, 主表, latest.咨询者姓名, latest.状态)
        
        return {"success": True, "message": "删除成功"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}") from e


# ==================== 分量（分配咨询师） =====================

@router.put("/consultation/record/{record_id}/distribute", summary="分量-分配咨询师")
def distribute_consultation(
    record_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    分量 - 为咨询记录分配咨询师
    
    - 咨询师: 必填，要分配的咨询师姓名
    - 分量人: 可选，默认为当前用户的 real_name
    
    如果记录已有咨询师且新咨询师不同，则视为转量：
    - 将原咨询师赋值给"原咨询师"字段
    - 新咨询师成为"咨询师"的值
    """
    record = 咨询量明细表CRUD.get_by_id(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    
    新咨询师 = data.get('咨询师')
    分量人 = data.get('分量人') or getattr(current_user, 'real_name', None) or '未知'
    
    if not 新咨询师:
        raise HTTPException(status_code=400, detail="咨询师不能为空")
    
    try:
        # 检查是否已有咨询师，如果有且与新咨询师不同，则视为转量
        原咨询师 = record.咨询师
        if 原咨询师 and 原咨询师 != 新咨询师:
            # 这是一个转量操作：记录原咨询师
            record.原咨询师 = 原咨询师
            record.转自咨询师 = 原咨询师
            record.咨询师转量次数 = (record.咨询师转量次数 or 0) + 1
            record.是否已转量 = 1
            record.转量类型 = "分量转量"
        
        # 更新咨询师和分量人
        record.咨询师 = 新咨询师
        record.分量人 = 分量人
        db.commit()
        db.refresh(record)
        
        # 根据是否转量返回不同消息
        if 原咨询师 and 原咨询师 != 新咨询师:
            return {"success": True, "message": f"转量成功，原咨询师：{原咨询师} → 现咨询师：{新咨询师}"}
        else:
            return {"success": True, "message": "分量成功"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"分量失败: {str(e)}") from e


# ==================== 添加电话号码 ====================

@router.post("/consultation/object/{object_id}/phone", summary="添加电话号码")
def add_phone_to_object(
    object_id: int,
    phone: str = Query(..., description="新电话号码"),
    db: Session = Depends(get_db)
):
    """为咨询对象添加新电话号码"""
    主表 = 咨询量主表CRUD.get_by_id(db, object_id)
    if not 主表:
        raise HTTPException(status_code=404, detail="对象不存在")
    
    try:
        # 检查电话是否已经被其他对象使用
        existing = 咨询量主表CRUD.get_by_phone(db, phone)
        if existing and existing.对象ID != object_id:
            raise HTTPException(
                status_code=400, 
                detail=f"该电话号码已被对象ID {existing.对象ID} 使用"
            )
        
        咨询量主表CRUD.add_phone(db, 主表, phone)
        return {
            "success": True,
            "message": "电话号码添加成功",
            "电话列表": 主表.电话列表
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"添加失败: {str(e)}") from e


# ==================== 选项数据 ====================

@router.get("/consultation/options/status", summary="获取状态选项")
def get_status_options():
    """获取咨询状态选项列表"""
    return {
        "data": [
            "应届", "在读", "在职", "待业", "其他"
        ]
    }


@router.get("/consultation/options/education", summary="获取学历选项")
def get_education_options():
    """获取学历选项列表"""
    return {
        "data": [
            "初中", "高中", "三校生", "大专", "本科", "硕士", "博士", "其他"
        ]
    }


@router.get("/consultation/options/intention", summary="获取报名意向选项")
def get_intention_options():
    """获取报名意向选项列表"""
    return {
        "data": [
            "强意向", "中意向", "弱意向", "无意向", "已报名"
        ]
    }


@router.get("/consultation/options/category", summary="获取咨询类别选项")
def get_category_options():
    """获取咨询类别选项列表"""
    return {
        "data": [
            "首次咨询", "二次跟进", "三次跟进", "多次跟进", "上门咨询", "电话回访"
        ]
    }


@router.get("/consultation/options/source", summary="获取量来源选项")
def get_source_options(db: Session = Depends(get_db)):
    """获取量来源选项列表（从数据库读取）"""
    from .....models.media_source_config import MediaCategory
    
    categories = db.query(MediaCategory).filter(
        MediaCategory.is_active
    ).order_by(MediaCategory.sort_order, MediaCategory.id).all()
    
    return {
        "data": [c.name for c in categories]
    }


@router.get("/consultation/options/region", summary="获取地区选项")
def get_region_options(db: Session = Depends(get_db)):
    """获取地区选项列表（从数据库动态读取已有地区）"""
    regions = db.query(咨询量明细表.地区).filter(
        咨询量明细表.地区.isnot(None),
        咨询量明细表.地区 != ''
    ).distinct().order_by(咨询量明细表.地区).all()
    return {
        "data": [r[0] for r in regions]
    }


@router.get("/consultation/options/media-source-hierarchy", summary="获取媒体来源层级结构")
def get_media_source_hierarchy(db: Session = Depends(get_db)):
    """
    获取媒体来源层级结构：
    [
        {
            "name": "量来源名称",
            "children": [
                 {
                     "name": "来源类别名称",
                     "children": ["具体来源1", "具体来源2"]
                 }
            ]
        }
    ]
    """
    from .....models.media_source_config import MediaCategory
    
    categories = db.query(MediaCategory).filter(
        MediaCategory.is_active
    ).order_by(MediaCategory.sort_order, MediaCategory.id).all()
    
    result: list[媒体来源分类节点] = []
    
    for category in categories:
        cat_children: list[媒体来源节点] = []
        cat_node: 媒体来源分类节点 = {
            "name": category.name,
            "children": cat_children,
        }
        
        # Sort sources
        sorted_sources = sorted(category.media_sources, key=lambda x: (x.sort_order, x.id))
        
        for source in sorted_sources:
            if not source.is_active:
                continue
                
            source_children: list[str] = []
            source_node: 媒体来源节点 = {
                "name": source.name,
                "children": source_children,
            }
            
            # Sort details
            sorted_details = sorted(source.media_details, key=lambda x: (x.sort_order, x.id))
            
            for detail in sorted_details:
                if not detail.is_active:
                    continue
                source_children.append(detail.name)
            
            cat_children.append(source_node)
            
        result.append(cat_node)
        
    return {
        "data": result
    }


@router.get("/consultation/options/media-source", summary="获取媒体来源选项")
def get_media_source_options(db: Session = Depends(get_db)):
    """获取媒体来源选项列表（从数据库读取，按media_sources分组，media_details作为选项）"""
    from .....models.media_source_config import MediaDetail, MediaSource
    
    # 获取所有启用的媒体来源
    media_sources = db.query(MediaSource).filter(
        MediaSource.is_active
    ).order_by(MediaSource.sort_order, MediaSource.id).all()
    
    # 获取所有启用的细分媒体
    media_details = db.query(MediaDetail).filter(
        MediaDetail.is_active
    ).order_by(MediaDetail.sort_order, MediaDetail.id).all()
    
    # 构建分组数据：media_source作为分组，media_details作为选项
    result: dict[str, list[str]] = {}
    detail_map: dict[int | None, list[str]] = {}
    for detail in media_details:
        if detail.media_source_id not in detail_map:
            detail_map[detail.media_source_id] = []
        detail_map[detail.media_source_id].append(detail.name)
    
    for source in media_sources:
        result[source.name] = detail_map.get(source.id, [])
    
    return {"data": result}


# ==================== 批量导入咨询量 ====================

def _validate_import_operator(import_data: 咨询量批量导入请求, current_user: User) -> None:
    expected_user = {
        "user_id": current_user.user_id,
        "real_name": current_user.real_name,
    }
    actual_user = {
        "user_id": import_data.导入人ID,
        "real_name": import_data.导入人姓名,
    }
    if import_data.导入人ID is not None and import_data.导入人ID != current_user.user_id:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "IMPORT_USER_MISMATCH",
                "message": "导入人ID与当前登录用户不一致，请刷新登录信息后重试",
                "expected_user": expected_user,
                "actual_user": actual_user,
            },
        )
    if import_data.导入人姓名 and import_data.导入人姓名 != current_user.real_name:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "IMPORT_USER_MISMATCH",
                "message": "导入人姓名与当前登录用户不一致，请刷新登录信息后重试",
                "expected_user": expected_user,
                "actual_user": actual_user,
            },
        )

@router.post("/consultation/import", response_model=咨询量批量导入响应, summary="批量导入咨询量")
def import_consultation_records(
    import_data: 咨询量批量导入请求,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    批量导入咨询量
    
    支持导入七种类型的咨询量：
    - 口碑来源：需要填写口碑提供人
    - 渠道来源：需要填写渠道专员
    - 网络来源：需要填写网聊专员
    - 任意来源：自由格式导入，支持所有字段
    - 旧量导入：导入历史数据
    - 报名旧量导入：导入历史报名数据，自动标记是否报名=1
    - 订座旧量导入：导入历史订座数据，自动标记是否订座=1
    - 上门旧量导入：导入历史上门数据，自动标记是否上门=1
    
    Excel导入字段说明：
    - 必填：登记日期、电话或微信（至少一项）
    - 口碑来源建议填：口碑提供人
    - 渠道来源建议填：渠道专员
    - 网络来源建议填：网聊专员
    - 任意来源：可指定量来源字段，支持咨询师、分量人等所有字段
    - 报名旧量：支持报名时间、长期短期、课程、全款/分期等报名字段
    - 订座旧量：支持订座时间、订座金额、缴费金额等订座字段
    - 上门旧量：支持上门时间、代咨、各类上门统计字段
    - 可选：咨询者姓名、年龄、性别、学历、位置、报名意向、咨询类别、来源类别、具体来源、关键字、备注
    """
    import logging
    logger = logging.getLogger(__name__)
    
    _validate_import_operator(import_data, current_user)
    results: List[导入结果项] = []
    success_count = 0
    fail_count = 0
    repeat_count = 0
    
    量来源 = import_data.量来源
    神殿 = import_data.神殿 or current_user.campus
    total_count = len(import_data.数据列表)
    
    logger.info(f"开始导入咨询量：类型={量来源}, 总数={total_count}, 神殿={神殿}, 操作人={current_user.real_name}")
    
    # 报名/订座/上门旧量统一使用旧量处理逻辑
    是旧量类 = 量来源 in ('旧量', '报名旧量', '订座旧量', '上门旧量')
    
    for idx, row in enumerate(import_data.数据列表, start=1):
        try:
            # 确定登记日期
            if 是旧量类 and row.旧量日期:
                # 旧量导入：解析用户提供的日期，兼容多种格式
                date_str = row.旧量日期.strip()
                登记日期 = None
                for fmt in [
                    # YYYY-MM-DD 系列（前端 dateNF 转换后的标准格式）
                    "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d",
                    # YYYY/M/D 系列（文本日期或 Excel 原始格式）
                    "%Y/%m/%d %H:%M:%S", "%Y/%m/%d %H:%M", "%Y/%m/%d",
                    # M/D/YYYY 系列（英文区域格式）
                    "%m/%d/%Y %H:%M:%S", "%m/%d/%Y %H:%M", "%m/%d/%Y",
                    # YYYY.M.D 系列
                    "%Y.%m.%d %H:%M:%S", "%Y.%m.%d %H:%M", "%Y.%m.%d",
                    # 12小时制 AM/PM
                    "%Y-%m-%d %I:%M:%S %p", "%m/%d/%Y %I:%M:%S %p",
                    "%Y-%m-%d %I:%M %p", "%m/%d/%Y %I:%M %p",
                ]:
                    try:
                        登记日期 = datetime.strptime(date_str, fmt)
                        break
                    except ValueError:
                        continue
                if 登记日期 is None:
                    # 日期解析失败时回退到系统时间，不导致导入失败
                    import logging
                    logging.warning(f"旧量导入日期解析失败，使用系统时间: {date_str}")
                    登记日期 = datetime.now()
            else:
                # 其他导入类型或旧量日期缺失：使用系统当前时间
                登记日期 = datetime.now()
            
            # 确定实际量来源（任意/旧量类导入时使用行数据中的量来源，否则使用请求的量来源）
            if 量来源 in ('任意', '旧量', '报名旧量', '订座旧量', '上门旧量') and row.量来源:
                实际量来源 = row.量来源
            elif 量来源 not in ('任意', '旧量', '报名旧量', '订座旧量', '上门旧量'):
                实际量来源 = 量来源
            else:
                实际量来源 = None
            
            # 旧量导入时：映射旧系统来源到新系统层级
            映射后的来源类别 = row.来源类别
            映射后的媒体来源 = row.具体来源
            if 是旧量类 and 实际量来源:
                旧量来源映射 = {
                    '百度': ('网络', '常规SEM平台'),
                    '其他网络': ('网络', '新媒体平台'),
                    '其它网络': ('网络', '新媒体平台'),
                }
                if 实际量来源 in 旧量来源映射:
                    实际量来源, 映射后的来源类别 = 旧量来源映射[实际量来源]

            if not 映射后的媒体来源 and 映射后的来源类别:
                # 保持旧数据兼容：无具体来源时使用来源类别占位
                映射后的媒体来源 = 映射后的来源类别
            
            # 构建创建对象
            obj_in = 咨询量明细表创建.model_validate(
                {
                    "登记日期": 登记日期,
                    "咨询者姓名": row.咨询者姓名,
                    "电话": row.电话,
                    "微信": row.微信,
                    "年龄": row.年龄,
                    "性别": row.性别,
                    "学历": row.学历,
                    "位置": row.位置,
                    "报名意向": row.报名意向,
                    "咨询类别": row.咨询类别,
                    "量来源": 实际量来源,
                    "来源类别": 映射后的来源类别,
                    "媒体来源": 映射后的媒体来源,
                    "关键字": row.关键字,
                    "备注": row.备注,
                    "神殿": 神殿,
                    "录量人": current_user.real_name,
                    "创建人ID": current_user.user_id,
                    "创建人姓名": current_user.real_name,
                }
            )
            
            # 分量人始终为当前导入操作人
            obj_in.分量人 = current_user.real_name
            
            # 所有导入类型都支持咨询师字段
            if row.咨询师:
                obj_in.咨询师 = row.咨询师
            
            # 根据来源类型设置特定字段
            if 量来源 == '口碑':
                obj_in.口碑提供人 = row.口碑提供人
            elif 量来源 == '渠道':
                obj_in.渠道专员 = row.渠道专员
                if row.县办:
                    obj_in.县办 = row.县办
                if row.乡办:
                    obj_in.乡办 = row.乡办
                if row.信息员:
                    obj_in.信息员 = row.信息员
            elif 量来源 == '网络':
                obj_in.网聊专员 = row.网聊专员
            elif 量来源 == '任意':
                # 任意导入模式：设置所有提供的额外字段
                if row.口碑提供人:
                    obj_in.口碑提供人 = row.口碑提供人
                if row.渠道专员:
                    obj_in.渠道专员 = row.渠道专员
                if row.县办:
                    obj_in.县办 = row.县办
                if row.乡办:
                    obj_in.乡办 = row.乡办
                if row.信息员:
                    obj_in.信息员 = row.信息员
                if row.网聊专员:
                    obj_in.网聊专员 = row.网聊专员
                # 分量人始终使用当前用户，不从Excel读取
                if row.状态:
                    obj_in.状态 = row.状态
                if row.QQ:
                    obj_in.QQ = row.QQ
                if row.抖音:
                    obj_in.抖音 = row.抖音
                if row.快手:
                    obj_in.快手 = row.快手
                if row.就读学校:
                    obj_in.就读学校 = row.就读学校
                if row.目前状态:
                    obj_in.目前状态 = row.目前状态
                if row.地区:
                    obj_in.地区 = row.地区
                if row.报名专业:
                    obj_in.报名专业 = row.报名专业
                if row.咨询结果:
                    obj_in.咨询结果 = row.咨询结果
                if row.是否上门 is not None:
                    obj_in.是否上门 = row.是否上门
                if row.是否报名 is not None:
                    obj_in.是否报名 = row.是否报名
                if row.是否订座 is not None:
                    obj_in.是否订座 = row.是否订座
            elif 是旧量类:
                # 旧量/报名旧量/订座旧量/上门旧量 导入模式：设置旧量共有字段
                if row.状态:
                    obj_in.状态 = row.状态
                if row.QQ:
                    obj_in.QQ = row.QQ
                if row.位置:
                    obj_in.位置 = row.位置
                if row.报名意向:
                    # 旧量ABCD映射到新系统意向值
                    abcd_map = {'A': '强意向', 'B': '中意向', 'C': '弱意向', 'D': '无意向'}
                    obj_in.报名意向 = abcd_map.get(row.报名意向.strip().upper(), row.报名意向)
                if row.网聊专员:
                    obj_in.网聊专员 = row.网聊专员
                if row.口碑提供人:
                    obj_in.口碑提供人 = row.口碑提供人
                if row.县办:
                    obj_in.县办 = row.县办
                if row.乡办:
                    obj_in.乡办 = row.乡办
                if row.信息员:
                    obj_in.信息员 = row.信息员
                if row.渠道专员:
                    obj_in.渠道专员 = row.渠道专员
                if row.就读学校:
                    obj_in.就读学校 = row.就读学校
                if row.地区:
                    obj_in.地区 = row.地区
                if row.县:
                    obj_in.县 = row.县
                if row.报名专业:
                    obj_in.报名专业 = row.报名专业
                if row.目前状态:
                    obj_in.目前状态 = row.目前状态
                if row.已交学费:
                    obj_in.已交学费 = row.已交学费
                
                # ---- 报名旧量导入特有字段 ----
                if 量来源 == '报名旧量':
                    obj_in.是否报名 = 1
                    if row.是否上门 is not None:
                        obj_in.是否上门 = row.是否上门
                    if row.是否订座 is not None:
                        obj_in.是否订座 = row.是否订座
                    # 报名时间解析
                    if row.报名时间:
                        报名dt = None
                        for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d",
                                    "%Y/%m/%d %H:%M:%S", "%Y/%m/%d %H:%M", "%Y/%m/%d",
                                    "%m/%d/%Y %H:%M:%S", "%m/%d/%Y", "%Y.%m.%d"]:
                            try:
                                报名dt = datetime.strptime(row.报名时间.strip(), fmt)
                                break
                            except ValueError:
                                continue
                        obj_in.报名时间 = 报名dt or 登记日期
                    else:
                        obj_in.报名时间 = 登记日期
                    if row.长期短期:
                        obj_in.长期短期 = row.长期短期
                    if row.课程:
                        obj_in.课程 = row.课程
                    if row.全款 is not None:
                        obj_in.全款 = row.全款
                    if row.分期 is not None:
                        obj_in.分期 = row.分期
                    if row.分期备注:
                        obj_in.分期备注 = row.分期备注
                    if row.注册 is not None:
                        obj_in.注册 = row.注册
                    if row.贷款 is not None:
                        obj_in.贷款 = row.贷款
                    if row.详细地址:
                        obj_in.详细地址 = row.详细地址
                    if row.缴费金额 is not None:
                        obj_in.缴费金额 = row.缴费金额
                
                # ---- 订座旧量导入特有字段 ----
                elif 量来源 == '订座旧量':
                    obj_in.是否订座 = 1
                    if row.是否上门 is not None:
                        obj_in.是否上门 = row.是否上门
                    if row.是否报名 is not None:
                        obj_in.是否报名 = row.是否报名
                    # 订座时间解析
                    if row.订座时间:
                        订座dt = None
                        for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d",
                                    "%Y/%m/%d %H:%M:%S", "%Y/%m/%d %H:%M", "%Y/%m/%d",
                                    "%m/%d/%Y %H:%M:%S", "%m/%d/%Y", "%Y.%m.%d"]:
                            try:
                                订座dt = datetime.strptime(row.订座时间.strip(), fmt)
                                break
                            except ValueError:
                                continue
                        obj_in.订座时间 = 订座dt or 登记日期
                    else:
                        obj_in.订座时间 = 登记日期
                    if row.订座金额 is not None:
                        obj_in.订座金额 = row.订座金额
                    if row.缴费金额 is not None:
                        obj_in.缴费金额 = row.缴费金额
                
                # ---- 上门旧量导入特有字段 ----
                elif 量来源 == '上门旧量':
                    obj_in.是否上门 = 1
                    if row.是否报名 is not None:
                        obj_in.是否报名 = row.是否报名
                    if row.是否订座 is not None:
                        obj_in.是否订座 = row.是否订座
                    # 上门时间解析
                    if row.上门时间:
                        上门dt = None
                        for fmt in ["%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d",
                                    "%Y/%m/%d %H:%M:%S", "%Y/%m/%d %H:%M", "%Y/%m/%d",
                                    "%m/%d/%Y %H:%M:%S", "%m/%d/%Y", "%Y.%m.%d"]:
                            try:
                                上门dt = datetime.strptime(row.上门时间.strip(), fmt)
                                break
                            except ValueError:
                                continue
                        obj_in.上门时间 = 上门dt or 登记日期
                    else:
                        obj_in.上门时间 = 登记日期
                    if row.网转上门 is not None:
                        obj_in.网转上门 = row.网转上门
                    if row.口碑上门 is not None:
                        obj_in.口碑上门 = row.口碑上门
                    if row.渠道上门 is not None:
                        obj_in.渠道上门 = row.渠道上门
                    if row.校园新渠道 is not None:
                        obj_in.校园新渠道 = row.校园新渠道
                    if row.新媒体来源 is not None:
                        obj_in.新媒体来源 = row.新媒体来源
                    if row.网络新媒体 is not None:
                        obj_in.网络新媒体 = row.网络新媒体
            
            # 所有导入类型都支持代咨字段
            if row.代咨:
                obj_in.代咨 = row.代咨
            
            # 调用录入服务
            主表, 明细, is_repeat = 咨询量服务.录入咨询量(db, obj_in)
            
            if is_repeat:
                repeat_count += 1
            success_count += 1
            
            # 每处理100条记录输出一次进度日志
            if idx % 100 == 0:
                logger.info(f"导入进度: {idx}/{total_count} ({idx*100//total_count}%)")
            
            results.append(导入结果项(
                行号=idx,
                成功=True,
                消息="重量导入成功" if is_repeat else "新咨询导入成功",
                记录ID=明细.记录ID,
                对象ID=主表.对象ID,
                是否重量=is_repeat
            ))
            
        except Exception as e:
            fail_count += 1
            results.append(导入结果项(
                行号=idx,
                成功=False,
                消息=f"导入失败: {str(e)}",
                记录ID=None,
                对象ID=None,
                是否重量=False
            ))
    
    logger.info(f"导入完成: 成功={success_count}, 失败={fail_count}, 重量={repeat_count}")
    
    return 咨询量批量导入响应(
        成功数量=success_count,
        失败数量=fail_count,
        重量数量=repeat_count,
        结果列表=results
    )


@router.get("/consultation/import/template", summary="获取导入模板字段")
def get_import_template(
    source_type: str = Query(..., description="量来源类型：口碑、渠道、网络 或 任意")
):
    """
    获取导入模板字段说明
    
    返回Excel导入模板需要的字段列表和说明
    """
    if source_type not in ['口碑', '渠道', '网络', '任意', '旧量', '报名旧量', '订座旧量', '上门旧量']:
        raise HTTPException(status_code=400, detail="量来源类型必须是'口碑'、'渠道'、'网络'、'任意'、'旧量'、'报名旧量'、'订座旧量'或'上门旧量'")
    
    # 旧量系列导入有独立的模板结构
    if source_type == '旧量':
        return {
            "source_type": source_type,
            "fields": [
                {"field": "咨询师", "required": False, "description": "咨询师"},
                {"field": "咨询者", "required": False, "description": "咨询者姓名"},
                {"field": "年龄", "required": False, "description": "年龄"},
                {"field": "性别", "required": False, "description": "性别"},
                {"field": "电话", "required": False, "description": "电话（电话和微信至少填一个）"},
                {"field": "QQ", "required": False, "description": "QQ"},
                {"field": "微信", "required": False, "description": "微信"},
                {"field": "学历", "required": False, "description": "学历"},
                {"field": "状态", "required": False, "description": "状态"},
                {"field": "位置", "required": False, "description": "位置/家庭住址"},
                {"field": "报名意向", "required": False, "description": "报名意向"},
                {"field": "量来源", "required": False, "description": "量来源"},
                {"field": "来源类别", "required": False, "description": "来源类别（第二级分类）"},
                {"field": "细分媒体", "required": False, "description": "细分媒体/媒体来源（第三级分类）"},
                {"field": "关键字", "required": False, "description": "关键字"},
                {"field": "登记时间", "required": True, "description": "登记时间，支持Excel日期格式、YYYY/M/D、YYYY-MM-DD等"},
                {"field": "网聊专员", "required": False, "description": "网聊专员"},
                {"field": "口碑提供人", "required": False, "description": "口碑提供人"},
                {"field": "县办", "required": False, "description": "县办"},
                {"field": "乡办", "required": False, "description": "乡办"},
                {"field": "信息员", "required": False, "description": "信息员"},
                {"field": "渠道专员", "required": False, "description": "渠道专员"},
            ]
        }
    
    # 旧量系列共用的基础字段列表
    旧量基础字段 = [
        {"field": "咨询师", "required": False, "description": "咨询师"},
        {"field": "咨询者", "required": False, "description": "咨询者姓名"},
        {"field": "年龄", "required": False, "description": "年龄"},
        {"field": "性别", "required": False, "description": "性别"},
        {"field": "电话", "required": False, "description": "电话（电话和微信至少填一个）"},
        {"field": "QQ", "required": False, "description": "QQ"},
        {"field": "微信", "required": False, "description": "微信"},
        {"field": "学历", "required": False, "description": "学历"},
        {"field": "状态", "required": False, "description": "状态"},
        {"field": "位置", "required": False, "description": "位置/家庭住址"},
        {"field": "报名意向", "required": False, "description": "报名意向"},
        {"field": "量来源", "required": False, "description": "量来源"},
        {"field": "来源类别", "required": False, "description": "来源类别（第二级分类）"},
        {"field": "细分媒体", "required": False, "description": "细分媒体/媒体来源（第三级分类）"},
        {"field": "关键字", "required": False, "description": "关键字"},
        {"field": "登记时间", "required": True, "description": "登记时间，支持Excel日期格式、YYYY/M/D、YYYY-MM-DD等"},
        {"field": "网聊专员", "required": False, "description": "网聊专员"},
        {"field": "口碑提供人", "required": False, "description": "口碑提供人"},
        {"field": "县办", "required": False, "description": "县办"},
        {"field": "乡办", "required": False, "description": "乡办"},
        {"field": "信息员", "required": False, "description": "信息员"},
        {"field": "渠道专员", "required": False, "description": "渠道专员"},
    ]
    
    if source_type == '报名旧量':
        extra = [
            {"field": "报名时间", "required": False, "description": "报名时间（留空则使用登记时间）"},
            {"field": "长期短期", "required": False, "description": "长期/短期"},
            {"field": "课程", "required": False, "description": "课程"},
            {"field": "全款", "required": False, "description": "是否全款：0-否，1-是"},
            {"field": "分期", "required": False, "description": "是否分期：0-否，1-是"},
            {"field": "分期备注", "required": False, "description": "分期备注"},
            {"field": "注册", "required": False, "description": "是否注册：0-否，1-是"},
            {"field": "贷款", "required": False, "description": "是否贷款：0-否，1-是"},
            {"field": "已交学费", "required": False, "description": "已交学费金额"},
            {"field": "缴费金额", "required": False, "description": "缴费金额"},
            {"field": "详细地址", "required": False, "description": "详细地址"},
            {"field": "报名专业", "required": False, "description": "报名专业"},
        ]
        return {"source_type": source_type, "fields": 旧量基础字段 + extra}
    
    if source_type == '订座旧量':
        extra = [
            {"field": "订座时间", "required": False, "description": "订座时间（留空则使用登记时间）"},
            {"field": "订座金额", "required": False, "description": "订座金额"},
            {"field": "缴费金额", "required": False, "description": "缴费金额"},
            {"field": "已交学费", "required": False, "description": "已交学费金额"},
        ]
        return {"source_type": source_type, "fields": 旧量基础字段 + extra}
    
    if source_type == '上门旧量':
        extra = [
            {"field": "上门时间", "required": False, "description": "上门时间（留空则使用登记时间）"},
            {"field": "代咨", "required": False, "description": "代咨"},
            {"field": "网转上门", "required": False, "description": "网转上门：0-否，1-是"},
            {"field": "口碑上门", "required": False, "description": "口碑上门：0-否，1-是"},
            {"field": "渠道上门", "required": False, "description": "渠道上门：0-否，1-是"},
            {"field": "校园新渠道", "required": False, "description": "校园新渠道：0-否，1-是"},
            {"field": "新媒体来源", "required": False, "description": "新媒体来源：0-否，1-是"},
            {"field": "网络新媒体", "required": False, "description": "网络新媒体：0-否，1-是"},
        ]
        return {"source_type": source_type, "fields": 旧量基础字段 + extra}
    
    common_fields = [
        {"field": "咨询者姓名", "required": False, "description": "咨询者姓名"},
                {"field": "电话", "required": False, "description": "电话（电话和微信至少填一个）"},
        {"field": "微信", "required": False, "description": "微信"},
        {"field": "咨询师", "required": False, "description": "咨询师（可在导入时直接分配）"},
        {"field": "年龄", "required": False, "description": "年龄"},
        {"field": "性别", "required": False, "description": "性别：男/女"},
        {"field": "学历", "required": False, "description": "学历"},
        {"field": "位置", "required": False, "description": "家庭住址"},
        {"field": "报名意向", "required": False, "description": "报名意向"},
        {"field": "咨询类别", "required": False, "description": "咨询类别"},
        {"field": "来源类别", "required": False, "description": "来源类别（第二级分类）"},
        {"field": "具体来源", "required": False, "description": "具体来源/媒体来源（第三级分类）"},
        {"field": "关键字", "required": False, "description": "关键字"},
        {"field": "备注", "required": False, "description": "备注"},
    ]
    
    if source_type == '口碑':
        specific_fields = [
            {"field": "口碑提供人", "required": False, "description": "口碑提供人姓名（口碑来源建议填写）"},
        ]
    elif source_type == '渠道':
        # 渠道导入使用独立字段列表，顺序与前端模板一致
        return {
            "source_type": source_type,
            "fields": [
                {"field": "咨询者姓名", "required": False, "description": "咨询者姓名"},
                {"field": "电话", "required": False, "description": "电话（电话和微信至少填一个）"},
                {"field": "微信", "required": False, "description": "微信"},
                {"field": "咨询师", "required": False, "description": "咨询师（可在导入时直接分配）"},
                {"field": "县办", "required": False, "description": "县办（渠道来源建议填写）"},
                {"field": "乡办", "required": False, "description": "乡办（渠道来源建议填写）"},
                {"field": "信息员", "required": False, "description": "信息员（渠道来源建议填写）"},
                {"field": "渠道专员", "required": False, "description": "渠道专员姓名（渠道来源建议填写）"},
                {"field": "年龄", "required": False, "description": "年龄"},
                {"field": "性别", "required": False, "description": "性别：男/女"},
                {"field": "学历", "required": False, "description": "学历"},
                {"field": "位置", "required": False, "description": "家庭住址"},
                {"field": "报名意向", "required": False, "description": "报名意向"},
                {"field": "咨询类别", "required": False, "description": "咨询类别"},
                {"field": "来源类别", "required": False, "description": "来源类别（第二级分类）"},
                {"field": "具体来源", "required": False, "description": "具体来源/媒体来源（第三级分类）"},
                {"field": "关键字", "required": False, "description": "关键字"},
                {"field": "备注", "required": False, "description": "备注"},
            ]
        }
    elif source_type == '网络':
        specific_fields = [
            {"field": "网聊专员", "required": False, "description": "网聊专员姓名（网络来源建议填写）"},
        ]
    else:  # 任意 - 返回完整的自定义字段列表（不使用common_fields拼接，避免重复和顺序问题）
        all_fields = [
            {"field": "咨询者姓名", "required": False, "description": "咨询者姓名"},
            {"field": "电话", "required": False, "description": "电话（电话和微信至少填一个）"},
            {"field": "微信", "required": False, "description": "微信"},
            {"field": "量来源", "required": False, "description": "量来源（可自定义，如：口碑、渠道、网络、SEM等）"},
            {"field": "来源类别", "required": False, "description": "来源类别（第二级分类）"},
            {"field": "具体来源", "required": False, "description": "具体来源/媒体来源（第三级分类）"},
            {"field": "咨询师", "required": False, "description": "咨询师"},
            {"field": "分量人", "required": False, "description": "分量人"},
            {"field": "口碑提供人", "required": False, "description": "口碑提供人"},
            {"field": "县办", "required": False, "description": "县办"},
            {"field": "乡办", "required": False, "description": "乡办"},
            {"field": "信息员", "required": False, "description": "信息员"},
            {"field": "渠道专员", "required": False, "description": "渠道专员"},
            {"field": "网聊专员", "required": False, "description": "网聊专员"},
            {"field": "年龄", "required": False, "description": "年龄"},
            {"field": "性别", "required": False, "description": "性别：男/女"},
            {"field": "学历", "required": False, "description": "学历"},
            {"field": "状态", "required": False, "description": "状态"},
            {"field": "位置", "required": False, "description": "家庭住址"},
            {"field": "报名意向", "required": False, "description": "报名意向"},
            {"field": "咨询类别", "required": False, "description": "咨询类别"},
            {"field": "关键字", "required": False, "description": "关键字"},
            {"field": "QQ", "required": False, "description": "QQ"},
            {"field": "抖音", "required": False, "description": "抖音"},
            {"field": "快手", "required": False, "description": "快手"},
            {"field": "就读学校", "required": False, "description": "就读学校"},
            {"field": "目前状态", "required": False, "description": "目前状态"},
            {"field": "地区", "required": False, "description": "地区"},
            {"field": "报名专业", "required": False, "description": "报名专业"},
            {"field": "咨询结果", "required": False, "description": "咨询结果"},
            {"field": "是否上门", "required": False, "description": "是否上门：0或1"},
            {"field": "是否报名", "required": False, "description": "是否报名：0或1"},
            {"field": "是否订座", "required": False, "description": "是否订座：0或1"},
            {"field": "备注", "required": False, "description": "备注"},
        ]
        return {
            "source_type": source_type,
            "fields": all_fields
        }
    
    return {
        "source_type": source_type,
        "fields": common_fields + specific_fields
    }


# ==================== 渠道专员下拉选项 ====================

@router.get("/consultation/options/channel-staff", summary="获取渠道部员工列表")
def get_channel_staff_options(
    campus: Optional[str] = Query(None, description="神殿名称，传入时按神殿过滤"),
    db: Session = Depends(get_db),
):
    """
    获取渠道部员工姓名列表（用于渠道专员下拉选择）
    筛选条件：department='渠道部' 且 position!='渠道部新媒体' 且状态为在职
    可选按神殿过滤
    """
    from sqlalchemy import text
    sql = """
        SELECT DISTINCT real_name
        FROM public.users
        WHERE department = '渠道部'
          AND (position IS NULL OR position != '渠道部新媒体')
          AND status = 'ACTIVE'
    """
    params = {}
    if campus:
        sql += "  AND campus = :campus\n"
        params["campus"] = campus
    sql += "  ORDER BY real_name"
    result = db.execute(text(sql), params).fetchall()
    return {"data": [row[0] for row in result if row[0]]}
