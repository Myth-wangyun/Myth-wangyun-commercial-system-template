from __future__ import annotations

from datetime import date
from typing import Dict, Iterable, List, Tuple

from app.models.market.daily_reputation_data import 市场部口碑日度数据表
from app.schemas.market.daily_reputation_data import DailyReputationDataRowIn
from sqlalchemy import and_, extract, func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session


def _month_bounds(month: str) -> Tuple[date, date]:
    # month: YYYY-MM
    y, m = month.split('-')
    year = int(y)
    mon = int(m)
    start = date(year, mon, 1)
    if mon == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, mon + 1, 1)
    return start, end


def list_month(db: Session, campus: str, month: str) -> List[市场部口碑日度数据表]:
    start, end = _month_bounds(month)
    return (
        db.query(市场部口碑日度数据表)
        .filter(
            and_(
                市场部口碑日度数据表.神殿 == campus,
                市场部口碑日度数据表.日期 >= start,
                市场部口碑日度数据表.日期 < end,
            )
        )
        .order_by(市场部口碑日度数据表.日期.asc())
        .all()
    )


def bulk_upsert_month(
    db: Session,
    campus: str,
    month: str,
    rows: Iterable[DailyReputationDataRowIn],
) -> List[市场部口碑日度数据表]:
    start, end = _month_bounds(month)

    values = []
    for r in rows:
        # only accept rows inside selected month
        if r.date < start or r.date >= end:
            continue
        values.append(
            {
                '神殿': campus,
                '日期': r.date,
                '合作伙伴实际收入': r.partner_income,
                '退费数': r.refund_count,
                '净报名': r.net_signup,
                '毛报总数': r.gross_count,
                '订单数': r.order_count,
                '上门人数': r.visit_count,
                '实际口碑咨询量': r.actual_consult_count,
            }
        )

    if values:
        stmt = insert(市场部口碑日度数据表).values(values)
        stmt = stmt.on_conflict_do_update(
            constraint='uq_市场部口碑日度数据表_神殿_日期',
            set_={
                '合作伙伴实际收入': stmt.excluded.合作伙伴实际收入,
                '退费数': stmt.excluded.退费数,
                '净报名': stmt.excluded.净报名,
                '毛报总数': stmt.excluded.毛报总数,
                '订单数': stmt.excluded.订单数,
                '上门人数': stmt.excluded.上门人数,
                '实际口碑咨询量': stmt.excluded.实际口碑咨询量,
                '更新时间': func.current_timestamp(),
            },
        )
        db.execute(stmt)
        db.commit()

    return list_month(db, campus, month)


def get_yearly_summary(db: Session, campus: str, year: int) -> Dict[int, Dict[str, int]]:
    """
    获取某神殿某年度的日度数据按月汇总
    返回字典: {month: {partner_income, refund_count, net_signup, gross_count, order_count, visit_count, actual_consult_count}}
    """
    start_date = date(year, 1, 1)
    end_date = date(year + 1, 1, 1)

    results = (
        db.query(
            extract('month', 市场部口碑日度数据表.日期).label('month'),
            func.sum(市场部口碑日度数据表.合作伙伴实际收入).label('partner_income'),
            func.sum(市场部口碑日度数据表.退费数).label('refund_count'),
            func.sum(市场部口碑日度数据表.净报名).label('net_signup'),
            func.sum(市场部口碑日度数据表.毛报总数).label('gross_count'),
            func.sum(市场部口碑日度数据表.订单数).label('order_count'),
            func.sum(市场部口碑日度数据表.上门人数).label('visit_count'),
            func.sum(市场部口碑日度数据表.实际口碑咨询量).label('actual_consult_count'),
        )
        .filter(
            and_(
                市场部口碑日度数据表.神殿 == campus,
                市场部口碑日度数据表.日期 >= start_date,
                市场部口碑日度数据表.日期 < end_date,
            )
        )
        .group_by(extract('month', 市场部口碑日度数据表.日期))
        .all()
    )

    summary_dict: Dict[int, Dict[str, int]] = {}
    for row in results:
        month = int(row.month)
        summary_dict[month] = {
            'partner_income': int(row.partner_income or 0),
            'refund_count': int(row.refund_count or 0),
            'net_signup': int(row.net_signup or 0),
            'gross_count': int(row.gross_count or 0),
            'order_count': int(row.order_count or 0),
            'visit_count': int(row.visit_count or 0),
            'actual_consult_count': int(row.actual_consult_count or 0),
        }

    return summary_dict
