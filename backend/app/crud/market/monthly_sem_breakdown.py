"""市场部月度SEM推广分解表 - CRUD

数据库操作层
"""

from typing import Protocol, Sequence, TypeAlias, cast

from sqlalchemy.orm import Session

from app.models.market.monthly_sem_breakdown import 市场部月度SEM推广分解表
from app.schemas.market.monthly_sem_breakdown import SEMBreakdownBase

MetricValue: TypeAlias = int | None


class SEMBreakdownRowLike(Protocol):
    campus: str
    baidu_plan_consult: MetricValue
    baidu_deadline_consult: MetricValue
    baidu_actual_consult: MetricValue
    baidu_plan_cost: MetricValue
    baidu_actual_cost: MetricValue
    baidu_consult_cost: MetricValue
    so360_plan_consult: MetricValue
    so360_deadline_consult: MetricValue
    so360_actual_consult: MetricValue
    so360_plan_cost: MetricValue
    so360_actual_cost: MetricValue
    so360_consult_cost: MetricValue
    sogou_plan_consult: MetricValue
    sogou_deadline_consult: MetricValue
    sogou_actual_consult: MetricValue
    sogou_plan_cost: MetricValue
    sogou_actual_cost: MetricValue
    sogou_consult_cost: MetricValue
    shenma_plan_consult: MetricValue
    shenma_deadline_consult: MetricValue
    shenma_actual_consult: MetricValue
    shenma_plan_cost: MetricValue
    shenma_actual_cost: MetricValue
    shenma_consult_cost: MetricValue
    total_plan_consult: MetricValue
    total_deadline_consult: MetricValue
    total_actual_consult: MetricValue
    total_plan_cost: MetricValue
    total_actual_cost: MetricValue
    total_consult_cost: MetricValue


def _serialize_row(record: SEMBreakdownRowLike) -> SEMBreakdownBase:
    return SEMBreakdownBase(
        key=record.campus,
        campus=record.campus,
        isTotal=False,
        baiduPlanConsult=record.baidu_plan_consult,
        baiduDeadlineConsult=record.baidu_deadline_consult,
        baiduActualConsult=record.baidu_actual_consult,
        baiduPlanCost=record.baidu_plan_cost,
        baiduActualCost=record.baidu_actual_cost,
        baiduConsultCost=record.baidu_consult_cost,
        so360PlanConsult=record.so360_plan_consult,
        so360DeadlineConsult=record.so360_deadline_consult,
        so360ActualConsult=record.so360_actual_consult,
        so360PlanCost=record.so360_plan_cost,
        so360ActualCost=record.so360_actual_cost,
        so360ConsultCost=record.so360_consult_cost,
        sogouPlanConsult=record.sogou_plan_consult,
        sogouDeadlineConsult=record.sogou_deadline_consult,
        sogouActualConsult=record.sogou_actual_consult,
        sogouPlanCost=record.sogou_plan_cost,
        sogouActualCost=record.sogou_actual_cost,
        sogouConsultCost=record.sogou_consult_cost,
        shenmaPlanConsult=record.shenma_plan_consult,
        shenmaDeadlineConsult=record.shenma_deadline_consult,
        shenmaActualConsult=record.shenma_actual_consult,
        shenmaPlanCost=record.shenma_plan_cost,
        shenmaActualCost=record.shenma_actual_cost,
        shenmaConsultCost=record.shenma_consult_cost,
        totalPlanConsult=record.total_plan_consult,
        totalDeadlineConsult=record.total_deadline_consult,
        totalActualConsult=record.total_actual_consult,
        totalPlanCost=record.total_plan_cost,
        totalActualCost=record.total_actual_cost,
        totalConsultCost=record.total_consult_cost,
    )


def get_sem_breakdown_list(
    db: Session,
    year: int,
    month: int
) -> list[SEMBreakdownBase]:
    """获取SEM推广分解列表"""
    records = cast(
        Sequence[SEMBreakdownRowLike],
        db.query(市场部月度SEM推广分解表).filter(
            市场部月度SEM推广分解表.year == year,
            市场部月度SEM推广分解表.month == month,
        ).all(),
    )

    return [_serialize_row(record) for record in records]


def save_sem_breakdown_list(
    db: Session,
    year: int,
    month: int,
    data: list[SEMBreakdownBase]
) -> bool:
    """保存SEM推广分解数据"""
    # 1. 删除旧数据
    db.query(市场部月度SEM推广分解表).filter(
        市场部月度SEM推广分解表.year == year,
        市场部月度SEM推广分解表.month == month
    ).delete()
    
    # 2. 插入新数据（只保存神殿数据，不保存合计行）
    for item in data:
        if item.isTotal:
            continue
            
        db_obj = 市场部月度SEM推广分解表(
            year=year,
            month=month,
            campus=item.campus,
            baidu_plan_consult=item.baiduPlanConsult,
            baidu_deadline_consult=item.baiduDeadlineConsult,
            baidu_actual_consult=item.baiduActualConsult,
            baidu_plan_cost=item.baiduPlanCost,
            baidu_actual_cost=item.baiduActualCost,
            baidu_consult_cost=item.baiduConsultCost,
            so360_plan_consult=item.so360PlanConsult,
            so360_deadline_consult=item.so360DeadlineConsult,
            so360_actual_consult=item.so360ActualConsult,
            so360_plan_cost=item.so360PlanCost,
            so360_actual_cost=item.so360ActualCost,
            so360_consult_cost=item.so360ConsultCost,
            sogou_plan_consult=item.sogouPlanConsult,
            sogou_deadline_consult=item.sogouDeadlineConsult,
            sogou_actual_consult=item.sogouActualConsult,
            sogou_plan_cost=item.sogouPlanCost,
            sogou_actual_cost=item.sogouActualCost,
            sogou_consult_cost=item.sogouConsultCost,
            shenma_plan_consult=item.shenmaPlanConsult,
            shenma_deadline_consult=item.shenmaDeadlineConsult,
            shenma_actual_consult=item.shenmaActualConsult,
            shenma_plan_cost=item.shenmaPlanCost,
            shenma_actual_cost=item.shenmaActualCost,
            shenma_consult_cost=item.shenmaConsultCost,
            total_plan_consult=item.totalPlanConsult,
            total_deadline_consult=item.totalDeadlineConsult,
            total_actual_consult=item.totalActualConsult,
            total_plan_cost=item.totalPlanCost,
            total_actual_cost=item.totalActualCost,
            total_consult_cost=item.totalConsultCost,
        )
        db.add(db_obj)
    
    db.commit()
    return True
