"""
教学质量模块 - 班主任日工单 API（FastAPI Router）

班主任日工单管理接口，包含组表、明细表和备注表的增删改查操作。
"""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_teaching_quality_db as get_db

# 静态导入模型
from app.teaching_quality.TQhomeroom_daily_work import (
    班主任日工单备注表,
    班主任日工单明细表,
    班主任日工单组表,
)

# 静态导入 DB 初始化模块
from app.teaching_quality.TQhomeroom_daily_work_db import init_homeroom_daily_work_tables


# ==========================
# Helper Functions
# ==========================
def get_chinese_day_of_week(date_obj: date) -> str:
    """根据日期获取中文星期"""
    week_days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    return week_days[date_obj.weekday()]

router = APIRouter()

def _startup_init():
    try:
        init_homeroom_daily_work_tables()
    except Exception:
        pass


# ==========================
# Pydantic Schemas
# ==========================
class DetailItem(BaseModel):
    序号: int = Field(..., ge=1)
    任务名称: Optional[str] = None
    任务描述: Optional[str] = None
    任务目标: Optional[str] = None
    执行时间: Optional[str] = None
    权重: Optional[str] = None
    结果: Optional[str] = None


class GroupInput(BaseModel):
    神殿名称: str
    日期: date
    执行人: str
    星期: Optional[str] = None
    班主任: Optional[str] = None
    备注: Optional[str] = None
    明细列表: List[DetailItem] = Field(default_factory=list)


class DetailOutput(DetailItem):
    明细ID: int


class GroupOutput(BaseModel):
    组ID: int
    神殿名称: str
    日期: date
    执行人: str
    星期: Optional[str] = None
    班主任: Optional[str] = None
    备注: Optional[str] = None
    明细列表: List[DetailOutput] = Field(default_factory=list)


class RemarkInput(BaseModel):
    神殿名称: str
    日期: date
    备注: Optional[str] = None


class RemarkOutput(BaseModel):
    神殿名称: str
    日期: date
    备注: Optional[str] = None


# ==========================
# Helpers
# ==========================

def _group_to_output(db: Session, group: 班主任日工单组表) -> GroupOutput:
    details = (
        db.query(班主任日工单明细表)
        .filter(班主任日工单明细表.组ID == group.组ID)
        .order_by(班主任日工单明细表.序号)
        .all()
    )
    return GroupOutput(
        组ID=group.组ID,
        神殿名称=group.神殿名称,
        日期=group.日期,
        执行人=group.执行人,
        星期=group.星期,
        班主任=group.班主任,
        备注=group.备注,
        明细列表=[
            DetailOutput(
                明细ID=d.明细ID,
                序号=d.序号,
                任务名称=d.任务名称,
                任务描述=d.任务描述,
                任务目标=d.任务目标,
                执行时间=d.执行时间,
                权重=d.权重,
                结果=d.结果,
            )
            for d in details
        ],
    )


def _upsert_daily_remark(
    db: Session,
    *,
    神殿名称: str,
    日期: date,
    备注: Optional[str],
) -> None:
    if 备注 is None:
        return
    remark_row = (
        db.query(班主任日工单备注表)
        .filter(班主任日工单备注表.神殿名称 == 神殿名称, 班主任日工单备注表.日期 == 日期)
        .first()
    )
    if remark_row:
        remark_row.备注 = 备注
    else:
        db.add(班主任日工单备注表(神殿名称=神殿名称, 日期=日期, 备注=备注))
    db.query(班主任日工单组表).filter(
        班主任日工单组表.神殿名称 == 神殿名称,
        班主任日工单组表.日期 == 日期,
    ).update({班主任日工单组表.备注: 备注}, synchronize_session=False)


# ==========================
# Routes
# ==========================
@router.get("/homeroom-daily-work/remark", response_model=RemarkOutput, summary="按神殿与日期获取日工单备注")
def get_daily_remark(
    campus: str = Query(...),
    work_date: date = Query(..., alias="date"),
    db: Session = Depends(get_db),
):
    remark_row = (
        db.query(班主任日工单备注表)
        .filter(班主任日工单备注表.神殿名称 == campus, 班主任日工单备注表.日期 == work_date)
        .first()
    )
    if remark_row:
        return RemarkOutput(神殿名称=remark_row.神殿名称, 日期=remark_row.日期, 备注=remark_row.备注)
    # 兼容旧数据：如果备注表没有记录，回退到组表中的备注
    group = (
        db.query(班主任日工单组表)
        .filter(班主任日工单组表.神殿名称 == campus, 班主任日工单组表.日期 == work_date)
        .order_by(班主任日工单组表.组ID)
        .first()
    )
    return RemarkOutput(神殿名称=campus, 日期=work_date, 备注=group.备注 if group else None)


@router.post("/homeroom-daily-work/remark", response_model=RemarkOutput, summary="新增/更新日工单备注")
def upsert_daily_remark(payload: RemarkInput, db: Session = Depends(get_db)):
    try:
        _upsert_daily_remark(db, 神殿名称=payload.神殿名称, 日期=payload.日期, 备注=payload.备注)
        db.commit()
        return RemarkOutput(神殿名称=payload.神殿名称, 日期=payload.日期, 备注=payload.备注)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"保存备注失败: {str(e)}")


@router.get("/homeroom-daily-work", response_model=List[GroupOutput], summary="按神殿与日期获取日工单组及明细")
def list_groups(
    campus: str = Query(...),
    work_date: date = Query(..., alias="date"),
    db: Session = Depends(get_db),
):
    groups = (
        db.query(班主任日工单组表)
        .filter(班主任日工单组表.神殿名称 == campus, 班主任日工单组表.日期 == work_date)
        .order_by(班主任日工单组表.组ID)
        .all()
    )
    return [_group_to_output(db, g) for g in groups]


@router.get("/homeroom-daily-work/group/{group_id}", response_model=GroupOutput, summary="获取单个组及明细")
def get_group(group_id: int, db: Session = Depends(get_db)):
    group = db.get(班主任日工单组表, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="组不存在")
    return _group_to_output(db, group)


@router.post("/homeroom-daily-work", response_model=GroupOutput, summary="新增/覆盖保存某个组及其明细")
def upsert_group(payload: GroupInput, db: Session = Depends(get_db)):
    try:
        # 自动计算星期（如果没有提供）
        day_of_week = payload.星期 or get_chinese_day_of_week(payload.日期)
        
        # 查是否存在该组
        group = (
            db.query(班主任日工单组表)
            .filter(
                班主任日工单组表.神殿名称 == payload.神殿名称,
                班主任日工单组表.日期 == payload.日期,
                班主任日工单组表.执行人 == payload.执行人,
            )
            .first()
        )
        if group:
            group.星期 = day_of_week
            group.班主任 = payload.班主任
            group.备注 = payload.备注
        else:
            group = 班主任日工单组表(
                神殿名称=payload.神殿名称,
                日期=payload.日期,
                执行人=payload.执行人,
                星期=day_of_week,
                班主任=payload.班主任,
                备注=payload.备注,
            )
            db.add(group)
            db.flush()

        _upsert_daily_remark(db, 神殿名称=payload.神殿名称, 日期=payload.日期, 备注=payload.备注)

        # 先清空旧明细
        db.query(班主任日工单明细表).filter(班主任日工单明细表.组ID == group.组ID).delete()

        # 重新写入
        for item in sorted(payload.明细列表, key=lambda x: x.序号):
            db.add(
                班主任日工单明细表(
                    组ID=group.组ID,
                    序号=item.序号,
                    任务名称=item.任务名称,
                    任务描述=item.任务描述,
                    任务目标=item.任务目标,
                    执行时间=item.执行时间,
                    权重=item.权重,
                    结果=item.结果,
                )
            )

        db.commit()
        db.refresh(group)
        return _group_to_output(db, group)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"保存失败: {str(e)}")


@router.delete("/homeroom-daily-work/{group_id}", summary="删除整个组（级联删除明细）")
def delete_group(group_id: int, db: Session = Depends(get_db)):
    group = db.get(班主任日工单组表, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="组不存在")
    try:
        db.delete(group)
        db.commit()
        return {"success": True, "message": "删除成功"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}")
