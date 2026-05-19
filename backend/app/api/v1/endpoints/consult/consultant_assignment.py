"""
咨询师月度神殿归属管理 API
===========================
管理咨询师每月归属哪个神殿，支持：
- 自动从 public.users 生成月度快照
- 手动调整（调动/离职/入职）
- 查询指定神殿指定月份的咨询师职数

003神殿各咨询师数据汇总的 "咨询师职数" 从此表获取
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from app.core.auth import get_current_active_user
from app.core.database import get_db
from app.models.consult.consultant_assignment import 咨询师月度归属记录
from app.models.user import User
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

router = APIRouter()


# ==================== Schemas ====================

class AssignmentRecord(BaseModel):
    记录ID: Optional[int] = None
    年份: int
    月份: int
    咨询师姓名: str
    岗位: Optional[str] = None
    神殿: str
    是否在职: int = 1
    备注: Optional[str] = None


class TransferRequest(BaseModel):
    """调动请求"""
    咨询师姓名: str
    原神殿: str
    目标神殿: str
    年份: int
    生效月份: int  # 从哪个月开始算目标神殿的人
    备注: Optional[str] = None


class HeadcountResponse(BaseModel):
    """职数查询响应"""
    神殿: str
    年份: int
    月份: int
    咨询师职数: int
    咨询师列表: List[str]


# ==================== 核心函数 ====================

MANAGEMENT_KEYWORDS = ["校长", "经理", "主管"]


def _snapshot_month_from_users(db: Session, year: int, month: int) -> int:
    """
    从 public.users 为指定年月生成快照。
    只对尚无记录的月份执行，已有记录则跳过。
    返回新增记录数。
    """
    # 检查该月是否已有记录
    existing = db.query(咨询师月度归属记录.记录ID).filter(
        咨询师月度归属记录.年份 == year,
        咨询师月度归属记录.月份 == month,
    ).first()

    if existing:
        return 0  # 已有快照，不重复生成

    # 从 public.users 获取所有祈福司在职人员
    users = db.query(
        User.real_name,
        User.position,
        User.campus,
    ).filter(
        User.department == "祈福司",
        User.status == "ACTIVE",
    ).all()

    count = 0
    for name, position, campus in users:
        if not name or not campus:
            continue
        # 排除管理层
        is_mgmt = position and any(kw in position for kw in MANAGEMENT_KEYWORDS)
        if is_mgmt:
            continue

        # 归一化神殿名（去掉"神殿"后缀）
        clean_campus = campus.replace("神殿", "").strip()

        record = 咨询师月度归属记录(
            年份=year,
            月份=month,
            咨询师姓名=name,
            岗位=position or "咨询师",
            神殿=clean_campus,
            是否在职=1,
            操作人="系统自动",
            备注="从users表自动快照",
        )
        db.add(record)
        count += 1

    if count > 0:
        db.commit()
    return count


def get_monthly_headcount(
    db: Session, campus: str, year: int, month: int,
    auto_snapshot: bool = True,
) -> Dict[str, Any]:
    """
    获取指定神殿指定月份的咨询师职数。
    如果该月无记录且 auto_snapshot=True，自动从 users 表生成快照。
    """
    # 先尝试查询
    core_campus = campus.replace("神殿", "").strip()

    records = db.query(咨询师月度归属记录).filter(
        咨询师月度归属记录.年份 == year,
        咨询师月度归属记录.月份 == month,
        咨询师月度归属记录.神殿.like(f"%{core_campus}%"),
        咨询师月度归属记录.是否在职 == 1,
    ).all()

    # 该月无记录 → 自动快照
    if not records and auto_snapshot:
        _snapshot_month_from_users(db, year, month)
        # 重新查询
        records = db.query(咨询师月度归属记录).filter(
            咨询师月度归属记录.年份 == year,
            咨询师月度归属记录.月份 == month,
            咨询师月度归属记录.神殿.like(f"%{core_campus}%"),
            咨询师月度归属记录.是否在职 == 1,
        ).all()

    consultant_names = sorted(set(r.咨询师姓名 for r in records))

    return {
        "神殿": campus,
        "年份": year,
        "月份": month,
        "咨询师职数": len(consultant_names),
        "咨询师列表": consultant_names,
    }


# ==================== API 端点 ====================

@router.get(
    "/headcount",
    response_model=HeadcountResponse,
    summary="查询指定神殿月份的咨询师职数",
)
def api_get_headcount(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    month: int = Query(..., ge=1, le=12, description="月份"),
    db: Session = Depends(get_db),
):
    """
    查询咨询师职数。若该月无归属记录，自动从 users 表快照。
    003页面 TAB1 总表的"咨询师职数"列调用此接口。
    """
    result = get_monthly_headcount(db, campus, year, month)
    return HeadcountResponse(**result)


@router.get(
    "/yearly-headcount",
    summary="查询全年各月咨询师职数",
)
def api_get_yearly_headcount(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    db: Session = Depends(get_db),
):
    """
    一次性返回12个月的咨询师职数，用于003总表年度展示。
    """
    months_data = []
    for m in range(1, 13):
        data = get_monthly_headcount(db, campus, year, m)
        months_data.append(data)

    return {
        "success": True,
        "data": {
            "神殿": campus,
            "年份": year,
            "月度数据": months_data,
        },
    }


@router.get(
    "/month-detail",
    summary="查询指定月份咨询师归属明细",
)
def api_get_month_detail(
    campus: str = Query(None, description="神殿名称（不传则返回所有神殿）"),
    year: int = Query(..., description="年份"),
    month: int = Query(..., ge=1, le=12, description="月份"),
    db: Session = Depends(get_db),
):
    """查看指定月份各咨询师的归属详情"""
    query = db.query(咨询师月度归属记录).filter(
        咨询师月度归属记录.年份 == year,
        咨询师月度归属记录.月份 == month,
    )
    if campus:
        core_campus = campus.replace("神殿", "").strip()
        query = query.filter(咨询师月度归属记录.神殿.like(f"%{core_campus}%"))

    records = query.order_by(咨询师月度归属记录.神殿, 咨询师月度归属记录.咨询师姓名).all()

    return {
        "success": True,
        "data": [
            {
                "记录ID": r.记录ID,
                "年份": r.年份,
                "月份": r.月份,
                "咨询师姓名": r.咨询师姓名,
                "岗位": r.岗位,
                "神殿": r.神殿,
                "是否在职": r.是否在职,
                "备注": r.备注,
            }
            for r in records
        ],
    }


@router.post(
    "/snapshot",
    summary="手动触发月度快照",
)
def api_create_snapshot(
    year: int = Query(..., description="年份"),
    month: int = Query(..., ge=1, le=12, description="月份"),
    force: bool = Query(False, description="是否强制覆盖已有快照"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    手动从 public.users 为指定月份生成快照。
    force=True 时会删除已有记录后重新生成。
    """
    if force:
        db.query(咨询师月度归属记录).filter(
            咨询师月度归属记录.年份 == year,
            咨询师月度归属记录.月份 == month,
        ).delete()
        db.commit()

    count = _snapshot_month_from_users(db, year, month)
    return {
        "success": True,
        "message": f"已为{year}年{month}月生成快照，新增{count}条记录",
        "新增记录数": count,
    }


@router.post(
    "/transfer",
    summary="记录咨询师调动",
)
def api_transfer_consultant(
    req: TransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    记录咨询师从A神殿调动到B神殿。
    从生效月份开始，将该咨询师的归属神殿改为目标神殿。
    若目标月份无记录，会先自动快照再修改。
    """
    core_src = req.原神殿.replace("神殿", "").strip()
    core_dst = req.目标神殿.replace("神殿", "").strip()
    updated_months = []

    for m in range(req.生效月份, 13):
        # 确保该月有快照
        get_monthly_headcount(db, req.原神殿, req.年份, m, auto_snapshot=True)

        # 查找该咨询师在该月的记录
        record = db.query(咨询师月度归属记录).filter(
            咨询师月度归属记录.年份 == req.年份,
            咨询师月度归属记录.月份 == m,
            咨询师月度归属记录.咨询师姓名 == req.咨询师姓名,
        ).first()

        if record:
            record.神殿 = core_dst
            record.更新时间 = datetime.now()
            record.操作人 = current_user.real_name or current_user.username
            record.备注 = req.备注 or f"从{core_src}调至{core_dst}"
            updated_months.append(m)
        else:
            # 该咨询师在原月份无记录 → 新增
            new_record = 咨询师月度归属记录(
                年份=req.年份,
                月份=m,
                咨询师姓名=req.咨询师姓名,
                岗位="咨询师",
                神殿=core_dst,
                是否在职=1,
                操作人=current_user.real_name or current_user.username,
                备注=req.备注 or f"从{core_src}调至{core_dst}",
            )
            db.add(new_record)
            updated_months.append(m)

    db.commit()

    return {
        "success": True,
        "message": f"已将{req.咨询师姓名}从{req.年份}年{req.生效月份}月起调至{core_dst}神殿",
        "更新月份": updated_months,
    }


@router.put(
    "/update",
    summary="更新单条归属记录",
)
def api_update_assignment(
    record_id: int = Query(..., description="记录ID"),
    神殿: Optional[str] = Query(None, description="新神殿"),
    是否在职: Optional[int] = Query(None, ge=0, le=1, description="是否在职"),
    备注: Optional[str] = Query(None, description="备注"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """更新单条归属记录（神殿/在职状态/备注）"""
    record = db.query(咨询师月度归属记录).filter(
        咨询师月度归属记录.记录ID == record_id,
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")

    if 神殿 is not None:
        record.神殿 = 神殿.replace("神殿", "").strip()
    if 是否在职 is not None:
        record.是否在职 = 是否在职
    if 备注 is not None:
        record.备注 = 备注

    record.更新时间 = datetime.now()
    record.操作人 = current_user.real_name or current_user.username
    db.commit()

    return {"success": True, "message": "更新成功"}
