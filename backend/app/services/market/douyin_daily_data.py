from __future__ import annotations

from datetime import date
from typing import Iterable, List, Tuple

from app.models.market.douyin_daily_data import 市场部抖音日度数据表
from app.schemas.market.douyin_daily_data import DouyinDailyDataRowIn
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


def list_month(db: Session, campus: str, month: str) -> List[市场部抖音日度数据表]:
    """查询指定神殿和月份的抖音数据"""
    start, end = _month_bounds(month)
    return (
        db.query(市场部抖音日度数据表)
        .filter(
            and_(
                市场部抖音日度数据表.神殿 == campus,
                市场部抖音日度数据表.日期 >= start,
                市场部抖音日度数据表.日期 < end,
            )
        )
        .order_by(市场部抖音日度数据表.日期.asc())
        .all()
    )


def bulk_upsert_month(
    db: Session,
    campus: str,
    month: str,
    rows: Iterable[DouyinDailyDataRowIn],
) -> List[市场部抖音日度数据表]:
    """批量插入或更新抖音数据"""
    start, end = _month_bounds(month)

    values = []
    for r in rows:
        if r.date < start or r.date >= end:
            continue
        values.append(
            {
                '神殿': campus,
                '日期': r.date,
                '抖音实际收入': r.actual_income,
                '退费数': r.refund_count,
                '净报名': r.net_signup,
                '毛报总数': r.gross_total,
                '订座数': r.order_count,
                '上门人数': r.visit_count,
                '抖音咨询量': r.consult_count,
                '抖音花费': r.consumption,
                '展示次数': r.display_count,
                '点击次数': r.click_count,
                '平均千次展示费用': r.avg_display_price,
                '转化数': r.conversion_count,
                '表单提交数': r.form_submit_count,
                '私信咨询数': r.private_message_count,
                '电话拨打数': r.phone_call_count,
                '在线咨询数': r.online_consult_count,
                '卡券领取数': r.coupon_receive_count,
                '智能电话数': r.smart_phone_count,
                '有效咨询量': r.effective_consult_count,
            }
        )

    if values:
        print(f"准备保存 {len(values)} 条抖音数据到数据库")
        print(f"神殿: {campus}, 月份: {month}")
        print(f"第一条数据示例: {values[0] if values else 'None'}")
        
        stmt = insert(市场部抖音日度数据表).values(values)
        stmt = stmt.on_conflict_do_update(
            constraint='uq_市场部抖音日度数据表_神殿_日期',
            set_={
                '抖音实际收入': stmt.excluded.抖音实际收入,
                '退费数': stmt.excluded.退费数,
                '净报名': stmt.excluded.净报名,
                '毛报总数': stmt.excluded.毛报总数,
                '订座数': stmt.excluded.订座数,
                '上门人数': stmt.excluded.上门人数,
                '抖音咨询量': stmt.excluded.抖音咨询量,
                '抖音花费': stmt.excluded.抖音花费,
                '展示次数': stmt.excluded.展示次数,
                '点击次数': stmt.excluded.点击次数,
                '平均千次展示费用': stmt.excluded.平均千次展示费用,
                '转化数': stmt.excluded.转化数,
                '表单提交数': stmt.excluded.表单提交数,
                '私信咨询数': stmt.excluded.私信咨询数,
                '电话拨打数': stmt.excluded.电话拨打数,
                '在线咨询数': stmt.excluded.在线咨询数,
                '卡券领取数': stmt.excluded.卡券领取数,
                '智能电话数': stmt.excluded.智能电话数,
                '有效咨询量': stmt.excluded.有效咨询量,
                '更新时间': func.current_timestamp(),
            },
        )
        db.execute(stmt)
        print("SQL执行完成，准备提交事务")
        db.commit()
        print("事务提交成功")

    result = list_month(db, campus, month)
    print(f"查询结果: 找到 {len(result)} 条数据")
    return result

