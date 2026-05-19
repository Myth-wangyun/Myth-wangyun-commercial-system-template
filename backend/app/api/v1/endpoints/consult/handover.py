"""
咨询量交接API
处理祈福司向教化司交接报名和订座学员的功能
交接后自动同步数据到教化司当月新生维稳明细表和新生仍欠费明细表
"""

from datetime import datetime
from typing import List, Optional

from app.core.database import get_db
from app.logs.context import get_audit_logger
from app.models.consult.consultation_record import 咨询量明细表
from app.models.consult.handover import 咨询量交接记录
from app.services.handover_sync_service import sync_handover_to_teaching_quality
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

router = APIRouter()


def _campus_variants(campus: str) -> List[str]:
    """生成神殿名称的多种写法，便于匹配历史数据。"""
    base = (campus or "").strip()
    if not base:
        return []
    trimmed = base[:-2] if base.endswith("神殿") else base
    variants = {base, trimmed, f"{trimmed}神殿"}
    return [v for v in variants if v]


def _pick_existing_campus_name(db: Session, campus: str, class_name: str) -> str:
    """优先沿用班档案表中已存在的神殿写法，避免重复分组。"""
    variants = _campus_variants(campus)
    if not variants:
        return (campus or "").strip()
    pick_query = text("""
        SELECT "神殿名称"
        FROM teaching_quality."班级档案表"
        WHERE TRIM("神殿名称") = ANY(:campus_variants)
          AND "班级名称" = :class_name
        ORDER BY LENGTH(TRIM("神殿名称")) DESC
        LIMIT 1
    """)
    picked = db.execute(pick_query, {
        "campus_variants": variants,
        "class_name": class_name,
    }).fetchone()
    return (picked[0] if picked and picked[0] else campus).strip()


class HandoverRequest(BaseModel):
    """交接请求"""
    记录ID列表: List[int]  # 咨询量明细表的记录ID列表
    交接备注: Optional[str] = None


class HandoverResponse(BaseModel):
    """交接响应"""
    success: bool
    message: str
    交接数量: int = 0
    失败数量: int = 0
    失败原因: List[str] = []


class AssignClassRequest(BaseModel):
    """分配班级请求"""
    交接ID: int
    班级名称: str
    班主任: str


@router.post("/handover", response_model=HandoverResponse)
async def create_handover(
    request: HandoverRequest,
    user_id: int = Query(..., description="当前用户ID"),
    user_name: str = Query(..., description="当前用户姓名"),
    db: Session = Depends(get_db)
):
    """
    创建交接记录
    将选中的报名/订座状态的咨询量交接给教化司
    """
    成功数量 = 0
    失败原因 = []
    
    for 记录ID in request.记录ID列表:
        try:
            # 查询咨询量明细记录
            record = db.query(咨询量明细表).filter(咨询量明细表.记录ID == 记录ID).first()
            
            if not record:
                失败原因.append(f"记录ID {记录ID} 不存在")
                continue
            
            # 检查是否为报名或订座
            if record.是否报名 != 1 and record.是否订座 != 1:
                失败原因.append(f"记录ID {记录ID} 不是报名或订座记录，无法交接")
                continue
            
            # 检查是否已交接
            if record.是否已交接 == 1:
                失败原因.append(f"记录ID {记录ID} 已经交接过了")
                continue
            
            # 确定状态（报名优先）
            状态 = "报名" if record.是否报名 == 1 else "订座"
            
            # 创建交接记录
            handover = 咨询量交接记录(
                咨询记录ID=记录ID,
                姓名=record.咨询者姓名,
                性别=record.性别,
                电话=record.电话,
                学历=record.学历,
                报名专业=record.报名专业,
                已交学费=record.已交学费,
                量来源=record.量来源,
                媒体来源=record.媒体来源,
                咨询师=record.咨询师,
                状态=状态,  # 使用确定的状态（报名/订座）
                神殿=record.神殿,
                交接人=user_name,
                交接人ID=user_id,
                交接备注=request.交接备注,
                处理状态="待分配"
            )
            db.add(handover)
            
            # 更新咨询量明细表的交接状态
            record.是否已交接 = 1
            record.交接时间 = datetime.now()
            record.交接人 = user_name
            
            成功数量 += 1
            
        except Exception as e:
            失败原因.append(f"记录ID {记录ID} 交接失败: {str(e)}")
    
    db.commit()
    
    return HandoverResponse(
        success=成功数量 > 0,
        message=f"成功交接 {成功数量} 条记录" + (f"，{len(失败原因)} 条失败" if 失败原因 else ""),
        交接数量=成功数量,
        失败数量=len(失败原因),
        失败原因=失败原因
    )


@router.get("/handover/list")
async def get_handover_list(
    神殿: Optional[str] = Query(None, description="神殿筛选"),
    处理状态: Optional[str] = Query(None, description="处理状态筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(20, ge=1, le=100, description="每页数量"),
    db: Session = Depends(get_db)
):
    """
    获取交接记录列表（教化司使用）
    """
    query = db.query(咨询量交接记录)
    
    if 神殿:
        query = query.filter(咨询量交接记录.神殿 == 神殿)
    if 处理状态:
        query = query.filter(咨询量交接记录.处理状态 == 处理状态)
    
    # 统计总数
    total = query.count()
    
    # 分页
    records = query.order_by(咨询量交接记录.交接时间.desc())\
        .offset((page - 1) * page_size)\
        .limit(page_size)\
        .all()
    
    return {
        "success": True,
        "total": total,
        "page": page,
        "page_size": page_size,
        "data": [r.to_dict() for r in records]
    }


@router.get("/handover/pending")
async def get_pending_handover(
    神殿: Optional[str] = Query(None, description="神殿筛选"),
    db: Session = Depends(get_db)
):
    """
    获取待分配的交接记录（教化司班主任分配使用）
    """
    query = db.query(咨询量交接记录).filter(咨询量交接记录.处理状态 == "待分配")
    
    if 神殿:
        query = query.filter(咨询量交接记录.神殿 == 神殿)
    
    records = query.order_by(咨询量交接记录.交接时间.desc()).all()
    
    return {
        "success": True,
        "data": [r.to_dict() for r in records]
    }


@router.post("/handover/assign-class")
async def assign_class(
    request: AssignClassRequest,
    http_request: Request,
    user_id: int = Query(..., description="当前用户ID"),
    user_name: str = Query(..., description="当前用户姓名"),
    db: Session = Depends(get_db)
):
    """
    分配班级（教化司使用）
    将交接记录分配到指定班级，并自动插入到班档案表
    """
    # 查询交接记录
    handover = db.query(咨询量交接记录).filter(咨询量交接记录.交接ID == request.交接ID).first()
    
    if not handover:
        raise HTTPException(status_code=404, detail="交接记录不存在")
    
    if handover.处理状态 != "待分配":
        raise HTTPException(status_code=400, detail=f"该记录状态为 {handover.处理状态}，不能重复分配")
    
    try:
        # 更新交接记录
        handover.分配班级 = request.班级名称
        handover.分配班主任 = request.班主任
        handover.分配时间 = datetime.now()
        handover.分配人 = user_name
        handover.分配人ID = user_id
        handover.处理状态 = "已分配"
        
        # 使用班档案表已存在的神殿写法，避免序号重复
        target_campus = _pick_existing_campus_name(db, handover.神殿, request.班级名称)
        campus_variants = _campus_variants(target_campus)

        # 获取班档案表当前最大序号（按神殿多写法匹配）
        max_seq_result = db.execute(text("""
            SELECT COALESCE(MAX("序号"), 0) as max_seq 
            FROM teaching_quality."班级档案表" 
            WHERE TRIM("神殿名称") = ANY(:campus_variants)
              AND "班级名称" = :class_name
        """), {"campus_variants": campus_variants, "class_name": request.班级名称}).fetchone()

        next_seq = (max_seq_result.max_seq if max_seq_result else 0) + 1
        
        # 插入到班档案表
        db.execute(text("""
            INSERT INTO teaching_quality."班级档案表" (
                "神殿名称", "班级名称", "序号", "姓名", "性别", 
                "学历", "所报专业", "应收学费金额", "班主任姓名",
                "联系电话", "神殿来源", "咨询师", "学员状态", "创建时间"
            ) VALUES (
                :campus, :class_name, :seq, :name, :gender,
                :education, :major, :fee, :teacher,
                :phone, :source, :consultant, :status, :create_time
            )
        """), {
            "campus": target_campus,
            "class_name": request.班级名称,
            "seq": next_seq,
            "name": handover.姓名,
            "gender": handover.性别,
            "education": handover.学历,
            "major": handover.报名专业,
            "fee": handover.已交学费,
            "teacher": request.班主任,
            "phone": handover.电话,
            "source": handover.量来源,
            "consultant": handover.咨询师,
            "status": "在读",
            "create_time": datetime.now()
        })
        
        # 同步到教化司当月新生维稳明细表和新生仍欠费明细表
        sync_result = sync_handover_to_teaching_quality(
            db,
            handover=handover,
            班主任姓名=request.班主任,
        )
        
        if not sync_result["success"]:
            print(f"[handover] 同步到教化司失败: {sync_result['message']}")
        else:
            print(f"[handover] 同步到教化司成功: 维稳={sync_result['stability_synced']}, 欠费={sync_result['arrears_synced']}")
        
        db.commit()
        
        audit_logger = get_audit_logger(http_request)
        audit_logger.set_action(
            action="handover.assign_class",
            action_display="分配班级",
            action_category="write",
            module="consult_handover",
            extra={"handover_id": request.交接ID, "class": request.班级名称, "teacher": request.班主任},
        )
        audit_logger.add_resource(
            schema_name="teaching_quality", table_name="班级档案表",
            op="CREATE", biz_key=f"assign-{handover.姓名}",
            after={"campus": target_campus, "class": request.班级名称, "student": handover.姓名},
        )
        
        return {
            "success": True,
            "message": f"已将 {handover.姓名} 分配到 {request.班级名称}，班主任：{request.班主任}",
            "sync_result": sync_result,
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"分配失败: {str(e)}")


@router.post("/handover/batch-assign")
async def batch_assign_class(
    交接ID列表: List[int],
    班级名称: str = Query(..., description="班级名称"),
    班主任: str = Query(..., description="班主任姓名"),
    user_id: int = Query(..., description="当前用户ID"),
    user_name: str = Query(..., description="当前用户姓名"),
    db: Session = Depends(get_db),
    http_request: Request = None,  # type: ignore[assignment]
):
    """
    批量分配班级
    """
    成功数量 = 0
    失败原因 = []
    
    for 交接ID in 交接ID列表:
        try:
            handover = db.query(咨询量交接记录).filter(咨询量交接记录.交接ID == 交接ID).first()
            
            if not handover:
                失败原因.append(f"交接ID {交接ID} 不存在")
                continue
            
            if handover.处理状态 != "待分配":
                失败原因.append(f"交接ID {交接ID} 状态为 {handover.处理状态}，不能重复分配")
                continue
            
            # 更新交接记录
            handover.分配班级 = 班级名称
            handover.分配班主任 = 班主任
            handover.分配时间 = datetime.now()
            handover.分配人 = user_name
            handover.分配人ID = user_id
            handover.处理状态 = "已分配"
            
            # 使用班档案表已存在的神殿写法，避免序号重复
            target_campus = _pick_existing_campus_name(db, handover.神殿, 班级名称)
            campus_variants = _campus_variants(target_campus)

            # 获取班档案表当前最大序号（按神殿多写法匹配）
            max_seq_result = db.execute(text("""
                SELECT COALESCE(MAX("序号"), 0) as max_seq 
                FROM teaching_quality."班级档案表" 
                WHERE TRIM("神殿名称") = ANY(:campus_variants)
                  AND "班级名称" = :class_name
            """), {"campus_variants": campus_variants, "class_name": 班级名称}).fetchone()

            next_seq = (max_seq_result.max_seq if max_seq_result else 0) + 1
            
            # 插入到班档案表
            db.execute(text("""
                INSERT INTO teaching_quality."班级档案表" (
                    "神殿名称", "班级名称", "序号", "姓名", "性别", 
                    "学历", "所报专业", "应收学费金额", "班主任姓名",
                    "联系电话", "神殿来源", "咨询师", "学员状态", "创建时间"
                ) VALUES (
                    :campus, :class_name, :seq, :name, :gender,
                    :education, :major, :fee, :teacher,
                    :phone, :source, :consultant, :status, :create_time
                )
            """), {
                "campus": target_campus,
                "class_name": 班级名称,
                "seq": next_seq,
                "name": handover.姓名,
                "gender": handover.性别,
                "education": handover.学历,
                "major": handover.报名专业,
                "fee": handover.已交学费,
                "teacher": 班主任,
                "phone": handover.电话,
                "source": handover.量来源,
                "consultant": handover.咨询师,
                "status": "在读",
                "create_time": datetime.now()
            })
            
            # 同步到教化司当月新生维稳明细表和新生仍欠费明细表
            sync_result = sync_handover_to_teaching_quality(
                db,
                handover=handover,
                班主任姓名=班主任,
            )
            
            if sync_result["success"]:
                print(f"[batch-handover] 同步成功: {handover.姓名}")
            else:
                print(f"[batch-handover] 同步失败: {handover.姓名} - {sync_result['message']}")
            
            成功数量 += 1
            
        except Exception as e:
            失败原因.append(f"交接ID {交接ID} 分配失败: {str(e)}")
    
    db.commit()
    
    if http_request and 成功数量 > 0:
        audit_logger = get_audit_logger(http_request)
        audit_logger.set_action(
            action="handover.batch_assign_class",
            action_display="批量分配班级",
            action_category="write",
            module="consult_handover",
            extra={"count": 成功数量, "class": 班级名称, "teacher": 班主任},
        )
        audit_logger.add_resource(
            schema_name="teaching_quality", table_name="班级档案表",
            op="CREATE", biz_key="batch-assign",
            after={"count": 成功数量, "class": 班级名称},
        )
    
    return {
        "success": 成功数量 > 0,
        "message": f"成功分配 {成功数量} 条记录" + (f"，{len(失败原因)} 条失败" if 失败原因 else ""),
        "成功数量": 成功数量,
        "失败数量": len(失败原因),
        "失败原因": 失败原因
    }


@router.get("/handover/stats")
async def get_handover_stats(
    神殿: Optional[str] = Query(None, description="神殿筛选"),
    db: Session = Depends(get_db)
):
    """
    获取交接统计数据
    """
    # 基础查询
    base_query = db.query(咨询量交接记录)
    if 神殿:
        base_query = base_query.filter(咨询量交接记录.神殿 == 神殿)
    
    # 统计各状态数量
    待分配 = base_query.filter(咨询量交接记录.处理状态 == "待分配").count()
    已分配 = base_query.filter(咨询量交接记录.处理状态 == "已分配").count()
    总数 = base_query.count()
    
    return {
        "success": True,
        "data": {
            "总数": 总数,
            "待分配": 待分配,
            "已分配": 已分配
        }
    }


@router.post("/handover/sync/{handover_id}")
async def sync_handover_to_tq(
    handover_id: int,
    http_request: Request,
    db: Session = Depends(get_db)
):
    """
    手动触发同步交接记录到教化司
    将交接记录同步到当月新生维稳明细表和新生仍欠费明细表
    """
    handover = db.query(咨询量交接记录).filter(咨询量交接记录.交接ID == handover_id).first()
    
    if not handover:
        raise HTTPException(status_code=404, detail="交接记录不存在")
    
    if handover.处理状态 != "已分配":
        raise HTTPException(status_code=400, detail="只有已分配的交接记录才能同步")
    
    sync_result = sync_handover_to_teaching_quality(
        db,
        handover=handover,
        班主任姓名=handover.分配班主任 or "",
    )
    
    db.commit()
    
    audit_logger = get_audit_logger(http_request)
    audit_logger.set_action(
        action="handover.sync_to_tq",
        action_display="同步交接到教化司",
        action_category="write",
        module="consult_handover",
        extra={"handover_id": handover_id, "result": sync_result},
    )
    
    return {
        "success": sync_result["success"],
        "message": sync_result["message"],
        "stability_synced": sync_result["stability_synced"],
        "arrears_synced": sync_result["arrears_synced"],
    }


@router.post("/handover/batch-sync")
async def batch_sync_handover_to_tq(
    http_request: Request,
    神殿: Optional[str] = Query(None, description="神殿筛选"),
    db: Session = Depends(get_db)
):
    """
    批量同步所有已分配的交接记录到教化司
    用于补充同步历史数据
    """
    query = db.query(咨询量交接记录).filter(咨询量交接记录.处理状态 == "已分配")
    
    if 神殿:
        query = query.filter(咨询量交接记录.神殿 == 神殿)
    
    handovers = query.all()
    
    success_count = 0
    fail_count = 0
    fail_reasons = []
    
    for handover in handovers:
        try:
            sync_result = sync_handover_to_teaching_quality(
                db,
                handover=handover,
                班主任姓名=handover.分配班主任 or "",
            )
            
            if sync_result["success"]:
                success_count += 1
            else:
                fail_count += 1
                fail_reasons.append(f"{handover.姓名}: {sync_result['message']}")
        except Exception as e:
            fail_count += 1
            fail_reasons.append(f"{handover.姓名}: {str(e)}")
    
    db.commit()
    
    if success_count > 0:
        audit_logger = get_audit_logger(http_request)
        audit_logger.set_action(
            action="handover.batch_sync_to_tq",
            action_display="批量同步交接到教化司",
            action_category="write",
            module="consult_handover",
            extra={"神殿": 神殿, "success_count": success_count, "fail_count": fail_count},
        )
    
    return {
        "success": success_count > 0 or fail_count == 0,
        "message": f"同步完成: 成功 {success_count} 条，失败 {fail_count} 条",
        "success_count": success_count,
        "fail_count": fail_count,
        "fail_reasons": fail_reasons[:20],  # 最多返回20条失败原因
    }
