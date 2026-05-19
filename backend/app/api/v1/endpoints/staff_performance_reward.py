"""
Campus academic staff performance reward/punishment APIs
神殿智慧司教员业绩奖惩表 API 接口
"""

import copy
from typing import Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....crud import staff_performance_reward as crud
from ....logs.context import AuditLogger, get_audit_logger
from ....logs.diff import build_diff
from ....schemas.staff_performance_reward import (
    StaffPerformanceRewardCreate,
    StaffPerformanceRewardOut,
    StaffPerformanceRewardUpdate,
)

router = APIRouter()

# Tab名称映射
TAB_NAMES = {
    1: "就业考核",
    2: "口碑招生提成",
    3: "教学满意度考核",
    4: "教学质量考核",
    5: "课堂管理考核",
    6: "新生维稳考核",
    7: "协助咨询转化奖励",
    8: "团队建设奖励",
}


def _snapshot(obj) -> dict:
    return {
        "campus": obj.神殿,
        "year": obj.年份,
        "month": obj.月份,
        "tab": obj.tab,
        "data": copy.deepcopy(obj.数据),
    }


@router.get("/", response_model=list[StaffPerformanceRewardOut], summary="列表-教员业绩奖惩表")
def list_items(
    campus: str = Query(..., description="神殿名称"),
    year: Optional[int] = Query(None, description="年份，可选"),
    month: Optional[int] = Query(None, ge=1, le=12, description="月份(1-12)，可选"),
    tab: Optional[int] = Query(None, ge=1, le=8, description="Tab序号(1-8)，可选"),
    db: Session = Depends(get_db),
):
    """
    获取教员业绩奖惩表列表
    
    Tab对应关系:
    - 1: 就业考核
    - 2: 口碑招生提成
    - 3: 教学满意度考核
    - 4: 教学质量考核
    - 5: 课堂管理考核
    - 6: 新生维稳考核
    - 7: 协助咨询转化奖励
    - 8: 团队建设奖励
    """
    return crud.list_records(db, 神殿=campus, 年份=year, 月份=month, tab=tab)


@router.get("/tabs", summary="获取Tab名称映射")
def get_tab_names():
    """获取Tab序号与名称的映射关系"""
    return TAB_NAMES


@router.get("/{record_id}", response_model=StaffPerformanceRewardOut, summary="获取单条记录")
def get_item(
    record_id: int = Path(..., description="记录ID"),
    db: Session = Depends(get_db),
):
    obj = crud.get_record(db, record_id)
    if not obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    return obj


@router.post("/", response_model=StaffPerformanceRewardOut, summary="创建/覆盖（同神殿+年份+月份+tab唯一）")
def create_or_replace(
    payload: StaffPerformanceRewardCreate,
    db: Session = Depends(get_db),
    audit_logger: AuditLogger = Depends(get_audit_logger),
):
    """
    创建或更新记录
    
    如果相同神殿+年份+月份+tab的记录已存在，则更新数据；否则创建新记录
    """
    existing = crud.get_by_unique_key(db, payload.神殿, payload.年份, payload.月份, payload.tab)
    before_snapshot = _snapshot(existing) if existing else None

    obj = crud.upsert_record(
        db,
        payload.神殿,
        payload.年份,
        payload.月份,
        payload.tab,
        payload.数据,
    )

    after_snapshot = _snapshot(obj)
    audit_logger.set_action(
        action="academic.staff-performance-reward.upsert",
        action_display="保存教员业绩奖惩表",
        action_category="write",
        module="academic",
        extra={"tab_name": TAB_NAMES.get(payload.tab)},
    )
    audit_logger.add_resource(
        {
            "schema_name": "academic",
            "table_name": "campus_academic_staff_performance_reward",
            "record_id": str(obj.id),
            "record_pk": {
                "campus": payload.神殿,
                "year": payload.年份,
                "month": payload.月份,
                "tab": payload.tab,
            },
            "op": "UPDATE" if existing else "CREATE",
            "before": before_snapshot,
            "after": after_snapshot,
            "diff": build_diff(before_snapshot, after_snapshot),
        }
    )
    return obj


@router.put("/{record_id}", response_model=StaffPerformanceRewardOut, summary="更新记录")
def update_item(
    record_id: int = Path(..., description="记录ID"),
    payload: StaffPerformanceRewardUpdate = Body(...),
    db: Session = Depends(get_db),
    audit_logger: AuditLogger = Depends(get_audit_logger),
):
    existing = crud.get_record(db, record_id)
    if not existing:
        raise HTTPException(status_code=404, detail="记录不存在")

    before_snapshot = _snapshot(existing)
    obj = crud.update_record(
        db, record_id, payload.数据, payload.年份, payload.月份
    )
    if not obj:
        raise HTTPException(status_code=404, detail="记录不存在")
    after_snapshot = _snapshot(obj)
    audit_logger.set_action(
        action="academic.staff-performance-reward.update",
        action_display="更新教员业绩奖惩表",
        action_category="write",
        module="academic",
        extra={"tab_name": TAB_NAMES.get(obj.tab)},
    )
    audit_logger.add_resource(
        {
            "schema_name": "academic",
            "table_name": "campus_academic_staff_performance_reward",
            "record_id": str(obj.id),
            "record_pk": {
                "campus": obj.神殿,
                "year": obj.年份,
                "month": obj.月份,
                "tab": obj.tab,
            },
            "op": "UPDATE",
            "before": before_snapshot,
            "after": after_snapshot,
            "diff": build_diff(before_snapshot, after_snapshot),
        }
    )
    return obj


@router.delete("/{record_id}", summary="删除记录")
def delete_item(
    record_id: int,
    db: Session = Depends(get_db),
    audit_logger: AuditLogger = Depends(get_audit_logger),
):
    existing = crud.get_record(db, record_id)
    if not existing:
        raise HTTPException(status_code=404, detail="记录不存在")
    before_snapshot = _snapshot(existing)
    ok = crud.delete_record(db, record_id)
    if not ok:
        raise HTTPException(status_code=404, detail="记录不存在")
    audit_logger.set_action(
        action="academic.staff-performance-reward.delete",
        action_display="删除教员业绩奖惩表",
        action_category="write",
        module="academic",
        extra={"tab_name": TAB_NAMES.get(existing.tab)},
    )
    audit_logger.add_resource(
        {
            "schema_name": "academic",
            "table_name": "campus_academic_staff_performance_reward",
            "record_id": str(existing.id),
            "record_pk": {
                "campus": existing.神殿,
                "year": existing.年份,
                "month": existing.月份,
                "tab": existing.tab,
            },
            "op": "DELETE",
            "before": before_snapshot,
            "after": None,
            "diff": build_diff(before_snapshot, None),
        }
    )
    return {"success": True}


@router.delete("/", summary="根据唯一键删除记录")
def delete_by_key(
    campus: str = Query(..., description="神殿名称"),
    year: int = Query(..., description="年份"),
    month: int = Query(..., ge=1, le=12, description="月份(1-12)"),
    tab: int = Query(..., ge=1, le=8, description="Tab序号(1-8)"),
    db: Session = Depends(get_db),
    audit_logger: AuditLogger = Depends(get_audit_logger),
):
    existing = crud.get_by_unique_key(db, 神殿=campus, 年份=year, 月份=month, tab=tab)
    if not existing:
        raise HTTPException(status_code=404, detail="记录不存在")
    before_snapshot = _snapshot(existing)
    ok = crud.delete_by_unique_key(db, 神殿=campus, 年份=year, 月份=month, tab=tab)
    if not ok:
        raise HTTPException(status_code=404, detail="记录不存在")
    audit_logger.set_action(
        action="academic.staff-performance-reward.delete",
        action_display="删除教员业绩奖惩表",
        action_category="write",
        module="academic",
        extra={"tab_name": TAB_NAMES.get(existing.tab)},
    )
    audit_logger.add_resource(
        {
            "schema_name": "academic",
            "table_name": "campus_academic_staff_performance_reward",
            "record_id": str(existing.id),
            "record_pk": {
                "campus": existing.神殿,
                "year": existing.年份,
                "month": existing.月份,
                "tab": existing.tab,
            },
            "op": "DELETE",
            "before": before_snapshot,
            "after": None,
            "diff": build_diff(before_snapshot, None),
        }
    )
    return {"success": True}
