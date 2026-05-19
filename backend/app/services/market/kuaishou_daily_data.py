from __future__ import annotations

from datetime import date
from typing import Iterable, List, Tuple

from app.models.market.kuaishou_daily_data import 市场部快手日度数据表
from app.schemas.market.kuaishou_daily_data import KuaishouDailyDataRowIn
from sqlalchemy import and_, func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session


def _month_bounds(month: str) -> Tuple[date, date]:
    """计算月份的起止日期"""
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


def list_month(db: Session, campus: str, month: str) -> List[市场部快手日度数据表]:
    """查询指定神殿和月份的快手数据"""
    start, end = _month_bounds(month)
    return (
        db.query(市场部快手日度数据表)
        .filter(
            and_(
                市场部快手日度数据表.神殿 == campus,
                市场部快手日度数据表.日期 >= start,
                市场部快手日度数据表.日期 < end,
            )
        )
        .order_by(市场部快手日度数据表.日期.asc())
        .all()
    )


def bulk_upsert_month(
    db: Session,
    campus: str,
    month: str,
    rows: Iterable[KuaishouDailyDataRowIn],
) -> List[市场部快手日度数据表]:
    """批量插入或更新快手数据"""
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
                '快手实际收入': r.actual_income,
                '退费数': r.refund_count,
                '净报名': r.net_signup,
                '毛报总数': r.gross_total,
                '订座数': r.order_count,
                '上门人数': r.visit_count,
                '快手咨询量': r.consult_count,
                '快手花费': r.consumption,
                '封面曝光数': r.seal_cover_count,
                '封面点击数': r.seal_click_count,
                '素材曝光数': r.material_display_count,
                '行为数': r.action_count,
                '素材点击率': r.material_action_rate,
                '转化数': r.conversion_count,
                '表单': r.table_count,
                '有效咨询量': r.effective_consult_count,
            }
        )

    if values:
        stmt = insert(市场部快手日度数据表).values(values)
        stmt = stmt.on_conflict_do_update(
            constraint='uq_市场部快手日度数据表_神殿_日期',
            set_={
                '快手实际收入': stmt.excluded.快手实际收入,
                '退费数': stmt.excluded.退费数,
                '净报名': stmt.excluded.净报名,
                '毛报总数': stmt.excluded.毛报总数,
                '订座数': stmt.excluded.订座数,
                '上门人数': stmt.excluded.上门人数,
                '快手咨询量': stmt.excluded.快手咨询量,
                '快手花费': stmt.excluded.快手花费,
                '封面曝光数': stmt.excluded.封面曝光数,
                '封面点击数': stmt.excluded.封面点击数,
                '素材曝光数': stmt.excluded.素材曝光数,
                '行为数': stmt.excluded.行为数,
                '素材点击率': stmt.excluded.素材点击率,
                '转化数': stmt.excluded.转化数,
                '表单': stmt.excluded.表单,
                '有效咨询量': stmt.excluded.有效咨询量,
                '更新时间': func.current_timestamp(),
            },
        )
        db.execute(stmt)
        db.commit()

    return list_month(db, campus, month)

