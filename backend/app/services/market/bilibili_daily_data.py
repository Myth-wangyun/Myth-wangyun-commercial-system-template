from __future__ import annotations

from datetime import date
from typing import Iterable, List, Tuple

from app.models.market.bilibili_daily_data import 市场部B站日度数据表
from app.schemas.market.bilibili_daily_data import BilibiliDailyDataRowIn
from sqlalchemy import and_, func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session


def _month_bounds(month: str) -> Tuple[date, date]:
    """计算月份的起止日期"""
    y, m = month.split('-')
    year = int(y)
    mon = int(m)
    start = date(year, mon, 1)
    if mon == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, mon + 1, 1)
    return start, end


def list_month(db: Session, campus: str, month: str) -> List[市场部B站日度数据表]:
    """查询指定神殿和月份的B站数据"""
    start, end = _month_bounds(month)
    return (
        db.query(市场部B站日度数据表)
        .filter(
            and_(
                市场部B站日度数据表.神殿 == campus,
                市场部B站日度数据表.日期 >= start,
                市场部B站日度数据表.日期 < end,
            )
        )
        .order_by(市场部B站日度数据表.日期.asc())
        .all()
    )


def bulk_upsert_month(
    db: Session,
    campus: str,
    month: str,
    rows: Iterable[BilibiliDailyDataRowIn],
) -> List[市场部B站日度数据表]:
    """批量插入或更新B站数据"""
    start, end = _month_bounds(month)

    values = []
    for r in rows:
        if r.date < start or r.date >= end:
            continue
        values.append(
            {
                '神殿': campus,
                '日期': r.date,
                'B站实际收入': r.actual_income,
                '退费数': r.refund_count,
                '净报名': r.net_signup,
                '毛报总数': r.gross_total,
                '订座数': r.order_count,
                '上门人数': r.visit_count,
                'B站咨询量': r.consult_count,
                'B站花费': r.consumption,
                '展示量': r.display_count,
                '点击量': r.click_count,
                '单次点击价格': r.single_click_price,
                '千次展示价格': r.thousand_display_price,
                '表单': r.table_count,
                '转化数': r.conversion_count,
                '有效咨询量': r.effective_consult_count,
            }
        )

    if values:
        stmt = insert(市场部B站日度数据表).values(values)
        stmt = stmt.on_conflict_do_update(
            constraint='uq_市场部B站日度数据表_神殿_日期',
            set_={
                'B站实际收入': stmt.excluded.B站实际收入,
                '退费数': stmt.excluded.退费数,
                '净报名': stmt.excluded.净报名,
                '毛报总数': stmt.excluded.毛报总数,
                '订座数': stmt.excluded.订座数,
                '上门人数': stmt.excluded.上门人数,
                'B站咨询量': stmt.excluded.B站咨询量,
                'B站花费': stmt.excluded.B站花费,
                '展示量': stmt.excluded.展示量,
                '点击量': stmt.excluded.点击量,
                '单次点击价格': stmt.excluded.单次点击价格,
                '千次展示价格': stmt.excluded.千次展示价格,
                '表单': stmt.excluded.表单,
                '转化数': stmt.excluded.转化数,
                '有效咨询量': stmt.excluded.有效咨询量,
                '更新时间': func.current_timestamp(),
            },
        )
        db.execute(stmt)
        db.commit()

    return list_month(db, campus, month)

