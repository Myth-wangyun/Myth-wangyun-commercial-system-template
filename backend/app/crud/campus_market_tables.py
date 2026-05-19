"""
各神殿投放明细表 CRUD 操作
根据用户选择的神殿操作对应的投放明细表
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import TypeAlias, TypedDict, cast

from sqlalchemy import func, select
from sqlalchemy.engine import RowMapping
from sqlalchemy.orm import Session

from ..core.database import get_market_db
from ..models.market import (
    冀美投放明细表,
    原美投放明细表,
    太美投放明细表,
    投放明细模型基类,
    晋美投放明细表,
    桂美投放明细表,
    盛邦投放明细表,
    石美投放明细表,
)

更新字段值: TypeAlias = date | str | Decimal | int | None


class 投放明细记录(TypedDict, total=False):
    明细ID: int
    日期: date | str | None
    媒体来源: str | None
    消费金额: Decimal | float | int | None
    展现量: int | None
    点击量: int | None
    IP: int | None
    PV: int | None
    对话量: int | None
    有效对话: int | None
    咨询量: int | None
    创建时间: datetime | str | None
    更新时间: datetime | str | None


class 投放统计结果(TypedDict):
    总记录数: int
    总展现量: int
    总点击量: int
    总消费金额: float
    总咨询量: int
    总对话量: int
    总有效对话: int
    总IP: int
    总PV: int
    平均消费金额: float
    最高消费金额: float
    最低消费金额: float


CAMPUS_MODEL_MAP: dict[str, type[投放明细模型基类]] = {
    "主神殿": 盛邦投放明细表,
    "永恒殿": 冀美投放明细表,
    "慈悲殿": 石美投放明细表,
    "李大殿": 晋美投放明细表,
    "智慧阁": 原美投放明细表,
    "光明殿": 太美投放明细表,
    "神恩殿": 桂美投放明细表,
}


def _get_market_session() -> Session:
    return next(get_market_db())


def _close_session(db: Session | None) -> None:
    if db is not None:
        db.close()


def get_campus_model(campus: str) -> type[投放明细模型基类]:
    """获取神殿对应的模型类。"""
    model = CAMPUS_MODEL_MAP.get(campus)
    if model is None:
        raise ValueError(f"不支持的神殿: {campus}")
    return model


def _record_to_dict(record: 投放明细模型基类 | None) -> 投放明细记录 | None:
    if record is None:
        return None
    return cast(投放明细记录, record.to_dict())


def _empty_stats() -> 投放统计结果:
    return {
        "总记录数": 0,
        "总展现量": 0,
        "总点击量": 0,
        "总消费金额": 0.0,
        "总咨询量": 0,
        "总对话量": 0,
        "总有效对话": 0,
        "总IP": 0,
        "总PV": 0,
        "平均消费金额": 0.0,
        "最高消费金额": 0.0,
        "最低消费金额": 0.0,
    }


def _to_int(value: object) -> int:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, Decimal):
        return int(value)
    if isinstance(value, float):
        return int(value)
    return 0


def _to_float(value: object) -> float:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, float):
        return value
    if isinstance(value, int):
        return float(value)
    return 0.0


def _stats_from_row(row: RowMapping | None) -> 投放统计结果:
    if row is None:
        return _empty_stats()
    return {
        "总记录数": _to_int(row.get("总记录数")),
        "总展现量": _to_int(row.get("总展现量")),
        "总点击量": _to_int(row.get("总点击量")),
        "总消费金额": _to_float(row.get("总消费金额")),
        "总咨询量": _to_int(row.get("总咨询量")),
        "总对话量": _to_int(row.get("总对话量")),
        "总有效对话": _to_int(row.get("总有效对话")),
        "总IP": _to_int(row.get("总IP")),
        "总PV": _to_int(row.get("总PV")),
        "平均消费金额": _to_float(row.get("平均消费金额")),
        "最高消费金额": _to_float(row.get("最高消费金额")),
        "最低消费金额": _to_float(row.get("最低消费金额")),
    }


def _apply_updates(record: 投放明细模型基类, updates: dict[str, 更新字段值]) -> bool:
    updated = False

    日期值 = updates.get("日期")
    if isinstance(日期值, date):
        record.日期 = 日期值
        updated = True

    媒体来源值 = updates.get("媒体来源")
    if isinstance(媒体来源值, str):
        record.媒体来源 = 媒体来源值
        updated = True

    消费金额值 = updates.get("消费金额")
    if isinstance(消费金额值, Decimal):
        record.消费金额 = 消费金额值
        updated = True

    展现量值 = updates.get("展现量")
    if isinstance(展现量值, int) and not isinstance(展现量值, bool):
        record.展现量 = 展现量值
        updated = True

    点击量值 = updates.get("点击量")
    if isinstance(点击量值, int) and not isinstance(点击量值, bool):
        record.点击量 = 点击量值
        updated = True

    IP值 = updates.get("IP")
    if isinstance(IP值, int) and not isinstance(IP值, bool):
        record.IP = IP值
        updated = True

    PV值 = updates.get("PV")
    if isinstance(PV值, int) and not isinstance(PV值, bool):
        record.PV = PV值
        updated = True

    对话量值 = updates.get("对话量")
    if isinstance(对话量值, int) and not isinstance(对话量值, bool):
        record.对话量 = 对话量值
        updated = True

    有效对话值 = updates.get("有效对话")
    if isinstance(有效对话值, int) and not isinstance(有效对话值, bool):
        record.有效对话 = 有效对话值
        updated = True

    咨询量值 = updates.get("咨询量")
    if isinstance(咨询量值, int) and not isinstance(咨询量值, bool):
        record.咨询量 = 咨询量值
        updated = True

    return updated


def 创建投放明细_神殿表(
    campus: str,
    日期: date,
    媒体来源: str,
    消费金额: Decimal = Decimal("0.00"),
    展现量: int = 0,
    点击量: int = 0,
    IP: int = 0,
    PV: int = 0,
    对话量: int = 0,
    有效对话: int = 0,
    咨询量: int = 0,
) -> 投放明细记录 | None:
    """创建投放明细记录。"""
    db: Session | None = None
    try:
        db = _get_market_session()
        model_class = get_campus_model(campus)
        new_record = model_class(
            日期=日期,
            媒体来源=媒体来源,
            消费金额=消费金额,
            展现量=展现量,
            点击量=点击量,
            IP=IP,
            PV=PV,
            对话量=对话量,
            有效对话=有效对话,
            咨询量=咨询量,
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        return _record_to_dict(new_record)
    except Exception:
        if db is not None:
            db.rollback()
        raise
    finally:
        _close_session(db)


def 获取投放明细列表_神殿表(
    campus: str,
    跳过: int = 0,
    限制: int = 100,
    日期_开始: date | None = None,
    日期_结束: date | None = None,
    媒体来源: str | None = None,
) -> list[投放明细记录]:
    """获取投放明细列表。"""
    db: Session | None = None
    try:
        db = _get_market_session()
        model_class = get_campus_model(campus)
        stmt = select(model_class)

        if 日期_开始 is not None:
            stmt = stmt.where(model_class.日期 >= 日期_开始)
        if 日期_结束 is not None:
            stmt = stmt.where(model_class.日期 <= 日期_结束)
        if 媒体来源:
            stmt = stmt.where(model_class.媒体来源.like(f"%{媒体来源}%"))

        stmt = stmt.order_by(model_class.日期.desc(), model_class.明细ID.desc()).offset(跳过).limit(限制)
        records = db.scalars(stmt).all()
        return [cast(投放明细记录, record.to_dict()) for record in records]
    finally:
        _close_session(db)


def 获取投放明细_神殿表(campus: str, 投放ID: int) -> 投放明细记录 | None:
    """根据 ID 获取投放明细。"""
    db: Session | None = None
    try:
        db = _get_market_session()
        model_class = get_campus_model(campus)
        stmt = select(model_class).where(model_class.明细ID == 投放ID)
        record = db.scalars(stmt).first()
        return _record_to_dict(record)
    finally:
        _close_session(db)


def 更新投放明细_神殿表(
    campus: str,
    投放ID: int,
    **kwargs: 更新字段值,
) -> 投放明细记录 | None:
    """更新投放明细记录。"""
    db: Session | None = None
    try:
        db = _get_market_session()
        model_class = get_campus_model(campus)
        stmt = select(model_class).where(model_class.明细ID == 投放ID)
        record = db.scalars(stmt).first()
        if record is None:
            return None

        if not _apply_updates(record, kwargs):
            return None

        db.commit()
        db.refresh(record)
        return _record_to_dict(record)
    except Exception:
        if db is not None:
            db.rollback()
        raise
    finally:
        _close_session(db)


def 删除投放明细_神殿表(campus: str, 投放ID: int) -> bool:
    """删除投放明细记录。"""
    db: Session | None = None
    try:
        db = _get_market_session()
        model_class = get_campus_model(campus)
        stmt = select(model_class).where(model_class.明细ID == 投放ID)
        record = db.scalars(stmt).first()
        if record is None:
            return False

        db.delete(record)
        db.commit()
        return True
    except Exception:
        if db is not None:
            db.rollback()
        raise
    finally:
        _close_session(db)


def 获取投放统计_神殿表(
    campus: str,
    日期_开始: date | None = None,
    日期_结束: date | None = None,
) -> 投放统计结果:
    """获取投放统计信息。"""
    db: Session | None = None
    try:
        db = _get_market_session()
        model_class = get_campus_model(campus)
        stmt = select(
            func.count(model_class.明细ID).label("总记录数"),
            func.sum(model_class.展现量).label("总展现量"),
            func.sum(model_class.点击量).label("总点击量"),
            func.sum(model_class.消费金额).label("总消费金额"),
            func.sum(model_class.咨询量).label("总咨询量"),
            func.sum(model_class.对话量).label("总对话量"),
            func.sum(model_class.有效对话).label("总有效对话"),
            func.sum(model_class.IP).label("总IP"),
            func.sum(model_class.PV).label("总PV"),
            func.avg(model_class.消费金额).label("平均消费金额"),
            func.max(model_class.消费金额).label("最高消费金额"),
            func.min(model_class.消费金额).label("最低消费金额"),
        )

        if 日期_开始 is not None:
            stmt = stmt.where(model_class.日期 >= 日期_开始)
        if 日期_结束 is not None:
            stmt = stmt.where(model_class.日期 <= 日期_结束)

        stats_row = db.execute(stmt).mappings().one_or_none()
        return _stats_from_row(stats_row)
    finally:
        _close_session(db)
