"""
教学质量模块 - 女宿住宿明细表（年维度，手填）
Schema: teaching_quality

维度：神殿名称 + 年份 + 序号（唯一）
"""
import json
from datetime import datetime
from typing import Any, Dict, List, Optional, Sequence, cast

from sqlalchemy import Column, DateTime, Index, Integer, String, Table, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 女宿住宿明细表(AccountBase):
    __tablename__ = "女宿住宿明细表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    序号: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    宿舍名称: Mapped[str | None] = mapped_column(String(200), nullable=True)
    管理老师: Mapped[str | None] = mapped_column(String(100), nullable=True)
    往任管理老师列表: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)  # JSONB格式存储往任管理老师列表
    月份缴费数据: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)  # JSONB格式存储月份缴费数据，格式：{"2025-12": {"amount": 300, "period": "...", "heating": 30, "nextAmount": 300, "nextTime": "..."}, ...}
    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    学生电话: Mapped[str | None] = mapped_column(String(50), nullable=True)
    家长电话: Mapped[str | None] = mapped_column(String(50), nullable=True)
    性别: Mapped[str | None] = mapped_column(String(10), nullable=True)
    对应班主任: Mapped[str | None] = mapped_column(String(100), nullable=True)
    入住日期: Mapped[str | None] = mapped_column(String(50), nullable=True)
    搬出时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    房间床位数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    已住宿人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    剩余床位数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    适合新生床位数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    入住房型: Mapped[str | None] = mapped_column(String(200), nullable=True)  # 入住房型（X人间/上铺/下铺）
    是否住宿: Mapped[str | None] = mapped_column(String(10), nullable=True)
    缴费单价: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际缴纳押金: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 22年12月
    y22DecAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y22DecPeriod: Mapped[str | None] = mapped_column(String(200), nullable=True)
    y22DecHeating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y22DecNextAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y22DecNextTime: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # 23年 1-12 月
    y23JanAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23JanPeriod: Mapped[str | None] = mapped_column(String(200), nullable=True)
    y23JanHeating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23JanNextAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23JanNextTime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    y23FebAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23FebPeriod: Mapped[str | None] = mapped_column(String(200), nullable=True)
    y23FebHeating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23FebNextAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23FebNextTime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    y23MarAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23MarPeriod: Mapped[str | None] = mapped_column(String(200), nullable=True)
    y23MarHeating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23MarNextAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23MarNextTime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    y23AprAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23AprPeriod: Mapped[str | None] = mapped_column(String(200), nullable=True)
    y23AprHeating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23AprNextAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23AprNextTime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    y23MayAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23MayPeriod: Mapped[str | None] = mapped_column(String(200), nullable=True)
    y23MayHeating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23MayNextAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23MayNextTime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    y23JunAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23JunPeriod: Mapped[str | None] = mapped_column(String(200), nullable=True)
    y23JunHeating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23JunNextAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23JunNextTime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    y23JulAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23JulPeriod: Mapped[str | None] = mapped_column(String(200), nullable=True)
    y23JulHeating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23JulNextAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23JulNextTime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    y23AugAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23AugPeriod: Mapped[str | None] = mapped_column(String(200), nullable=True)
    y23AugHeating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23AugNextAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23AugNextTime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    y23SepAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23SepPeriod: Mapped[str | None] = mapped_column(String(200), nullable=True)
    y23SepHeating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23SepNextAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23SepNextTime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    y23OctAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23OctPeriod: Mapped[str | None] = mapped_column(String(200), nullable=True)
    y23OctHeating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23OctNextAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23OctNextTime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    y23NovAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23NovPeriod: Mapped[str | None] = mapped_column(String(200), nullable=True)
    y23NovHeating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23NovNextAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23NovNextTime: Mapped[str | None] = mapped_column(String(100), nullable=True)
    y23DecAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23DecPeriod: Mapped[str | None] = mapped_column(String(200), nullable=True)
    y23DecHeating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23DecNextAmount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    y23DecNextTime: Mapped[str | None] = mapped_column(String(100), nullable=True)

    住宿费小计: Mapped[int | None] = mapped_column(Integer, nullable=True)
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "序号"),
        Index(None, "神殿名称", "年份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

_MIGRATED = False

def _migrate():
    global _MIGRATED
    if _MIGRATED:
        return
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        _MIGRATED = True
        return
    ensure_teaching_quality_schema()
    tables = cast(Sequence[Table], [女宿住宿明细表.__table__])
    AccountBase.metadata.create_all(bind=engine, tables=tables, checkfirst=True)
    _MIGRATED = True

def init_female_dormitory_detail_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[女宿住宿明细表]:
    _migrate()
    return (
        db.query(女宿住宿明细表)
        .filter(女宿住宿明细表.神殿名称 == 神殿名称, 女宿住宿明细表.年份 == 年份)
        .order_by(女宿住宿明细表.序号)
        .all()
    )

def replace_rows(db: Session, *, 神殿名称: str, 年份: int, 行列表: List[Dict[str, Any]]):
    _migrate()
    db.query(女宿住宿明细表).filter(女宿住宿明细表.神殿名称 == 神殿名称, 女宿住宿明细表.年份 == 年份).delete()

    def _to_int(val) -> Optional[int]:
        try:
            if val in (None, ""):
                return None
            return int(str(val))
        except Exception:
            try:
                return int(float(val))
            except Exception:
                return None

    def _get(d: Dict[str, Any], *keys: str, text_only: bool = False):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return str(d[k]) if text_only else d[k]
        return None

    def _convert_monthly_payments_to_jsonb(r: Dict[str, Any], year: int) -> Optional[Dict[str, Any]]:
        """将月份缴费数据转换为JSONB格式"""
        monthly_data = {}
        month_mapping = [
            ("y22Dec", year - 1, 12),
            ("y23Jan", year, 1), ("y23Feb", year, 2), ("y23Mar", year, 3), ("y23Apr", year, 4),
            ("y23May", year, 5), ("y23Jun", year, 6), ("y23Jul", year, 7), ("y23Aug", year, 8),
            ("y23Sep", year, 9), ("y23Oct", year, 10), ("y23Nov", year, 11), ("y23Dec", year, 12),
        ]
        for prefix, y, m in month_mapping:
            amount = _to_int(_get(r, f"{prefix}Amount"))
            period = _get(r, f"{prefix}Period", text_only=True)
            heating = _to_int(_get(r, f"{prefix}Heating"))
            next_amount = _to_int(_get(r, f"{prefix}NextAmount"))
            next_time = _get(r, f"{prefix}NextTime", text_only=True)
            if amount is not None or period or heating is not None or next_amount is not None or next_time:
                month_key = f"{y}-{m:02d}"
                monthly_data[month_key] = {
                    "amount": amount,
                    "period": period,
                    "heating": heating,
                    "nextAmount": next_amount,
                    "nextTime": next_time,
                }
        return monthly_data if monthly_data else None

    def _convert_past_managers_to_jsonb(r: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
        """将往任管理老师列表转换为JSONB格式"""
        past_managers = _get(r, "往任管理老师列表", "pastManagers")
        if not past_managers:
            return None
        if isinstance(past_managers, (list, dict)):
            if isinstance(past_managers, list):
                return past_managers
            return [past_managers]
        if isinstance(past_managers, str):
            try:
                parsed = json.loads(past_managers)
                if isinstance(parsed, list):
                    return parsed
                elif isinstance(parsed, dict):
                    return [parsed]
            except (json.JSONDecodeError, TypeError):
                pass
        return None

    for r in sorted(行列表, key=lambda x: _to_int(_get(x, "序号", "serialNumber")) or 0):
        row = 女宿住宿明细表(
            神殿名称=神殿名称,
            年份=int(年份 or 0),
            序号=_to_int(_get(r, "序号", "serialNumber")) or 0,
            宿舍名称=_get(r, "宿舍名称", "dormName", text_only=True),
            管理老师=_get(r, "管理老师", "manager", text_only=True),
            往任管理老师列表=_convert_past_managers_to_jsonb(r),
            月份缴费数据=_convert_monthly_payments_to_jsonb(r, 年份),
            姓名=_get(r, "姓名", "studentName", text_only=True),
            学生电话=_get(r, "学生电话", "studentPhone", text_only=True),
            家长电话=_get(r, "家长电话", "parentPhone", text_only=True),
            性别=_get(r, "性别", "gender", text_only=True),
            对应班主任=_get(r, "对应班主任", "headTeacher", text_only=True),
            入住日期=_get(r, "入住日期", "checkInDate", text_only=True),
            搬出时间=_get(r, "搬出时间", "checkOutDate", text_only=True),
            房间床位数=_to_int(_get(r, "房间床位数", "roomBedCount")),
            已住宿人数=_to_int(_get(r, "已住宿人数", "occupiedCount")),
            剩余床位数=_to_int(_get(r, "剩余床位数", "remainingBeds")),
            适合新生床位数=_to_int(_get(r, "适合新生床位数", "suitableNewBeds")),
            入住房型=_get(r, "入住房型", "roomType", text_only=True),
            是否住宿=_get(r, "是否住宿", "isLiving", text_only=True),
            缴费单价=_to_int(_get(r, "缴费单价", "unitPrice")),
            实际缴纳押金=_to_int(_get(r, "实际缴纳押金", "deposit")),
            y22DecAmount=_to_int(_get(r, "y22DecAmount", "y22DecAmount")),
            y22DecPeriod=_get(r, "y22DecPeriod", "y22DecPeriod", text_only=True),
            y22DecHeating=_to_int(_get(r, "y22DecHeating", "y22DecHeating")),
            y22DecNextAmount=_to_int(_get(r, "y22DecNextAmount", "y22DecNextAmount")),
            y22DecNextTime=_get(r, "y22DecNextTime", "y22DecNextTime", text_only=True),
            y23JanAmount=_to_int(_get(r, "y23JanAmount", "y23JanAmount")), y23JanPeriod=_get(r, "y23JanPeriod", "y23JanPeriod", text_only=True), y23JanHeating=_to_int(_get(r, "y23JanHeating", "y23JanHeating")), y23JanNextAmount=_to_int(_get(r, "y23JanNextAmount", "y23JanNextAmount")), y23JanNextTime=_get(r, "y23JanNextTime", "y23JanNextTime", text_only=True),
            y23FebAmount=_to_int(_get(r, "y23FebAmount", "y23FebAmount")), y23FebPeriod=_get(r, "y23FebPeriod", "y23FebPeriod", text_only=True), y23FebHeating=_to_int(_get(r, "y23FebHeating", "y23FebHeating")), y23FebNextAmount=_to_int(_get(r, "y23FebNextAmount", "y23FebNextAmount")), y23FebNextTime=_get(r, "y23FebNextTime", "y23FebNextTime", text_only=True),
            y23MarAmount=_to_int(_get(r, "y23MarAmount", "y23MarAmount")), y23MarPeriod=_get(r, "y23MarPeriod", "y23MarPeriod", text_only=True), y23MarHeating=_to_int(_get(r, "y23MarHeating", "y23MarHeating")), y23MarNextAmount=_to_int(_get(r, "y23MarNextAmount", "y23MarNextAmount")), y23MarNextTime=_get(r, "y23MarNextTime", "y23MarNextTime", text_only=True),
            y23AprAmount=_to_int(_get(r, "y23AprAmount", "y23AprAmount")), y23AprPeriod=_get(r, "y23AprPeriod", "y23AprPeriod", text_only=True), y23AprHeating=_to_int(_get(r, "y23AprHeating", "y23AprHeating")), y23AprNextAmount=_to_int(_get(r, "y23AprNextAmount", "y23AprNextAmount")), y23AprNextTime=_get(r, "y23AprNextTime", "y23AprNextTime", text_only=True),
            y23MayAmount=_to_int(_get(r, "y23MayAmount", "y23MayAmount")), y23MayPeriod=_get(r, "y23MayPeriod", "y23MayPeriod", text_only=True), y23MayHeating=_to_int(_get(r, "y23MayHeating", "y23MayHeating")), y23MayNextAmount=_to_int(_get(r, "y23MayNextAmount", "y23MayNextAmount")), y23MayNextTime=_get(r, "y23MayNextTime", "y23MayNextTime", text_only=True),
            y23JunAmount=_to_int(_get(r, "y23JunAmount", "y23JunAmount")), y23JunPeriod=_get(r, "y23JunPeriod", "y23JunPeriod", text_only=True), y23JunHeating=_to_int(_get(r, "y23JunHeating", "y23JunHeating")), y23JunNextAmount=_to_int(_get(r, "y23JunNextAmount", "y23JunNextAmount")), y23JunNextTime=_get(r, "y23JunNextTime", "y23JunNextTime", text_only=True),
            y23JulAmount=_to_int(_get(r, "y23JulAmount", "y23JulAmount")), y23JulPeriod=_get(r, "y23JulPeriod", "y23JulPeriod", text_only=True), y23JulHeating=_to_int(_get(r, "y23JulHeating", "y23JulHeating")), y23JulNextAmount=_to_int(_get(r, "y23JulNextAmount", "y23JulNextAmount")), y23JulNextTime=_get(r, "y23JulNextTime", "y23JulNextTime", text_only=True),
            y23AugAmount=_to_int(_get(r, "y23AugAmount", "y23AugAmount")), y23AugPeriod=_get(r, "y23AugPeriod", "y23AugPeriod", text_only=True), y23AugHeating=_to_int(_get(r, "y23AugHeating", "y23AugHeating")), y23AugNextAmount=_to_int(_get(r, "y23AugNextAmount", "y23AugNextAmount")), y23AugNextTime=_get(r, "y23AugNextTime", "y23AugNextTime", text_only=True),
            y23SepAmount=_to_int(_get(r, "y23SepAmount", "y23SepAmount")), y23SepPeriod=_get(r, "y23SepPeriod", "y23SepPeriod", text_only=True), y23SepHeating=_to_int(_get(r, "y23SepHeating", "y23SepHeating")), y23SepNextAmount=_to_int(_get(r, "y23SepNextAmount", "y23SepNextAmount")), y23SepNextTime=_get(r, "y23SepNextTime", "y23SepNextTime", text_only=True),
            y23OctAmount=_to_int(_get(r, "y23OctAmount", "y23OctAmount")), y23OctPeriod=_get(r, "y23OctPeriod", "y23OctPeriod", text_only=True), y23OctHeating=_to_int(_get(r, "y23OctHeating", "y23OctHeating")), y23OctNextAmount=_to_int(_get(r, "y23OctNextAmount", "y23OctNextAmount")), y23OctNextTime=_get(r, "y23OctNextTime", "y23OctNextTime", text_only=True),
            y23NovAmount=_to_int(_get(r, "y23NovAmount", "y23NovAmount")), y23NovPeriod=_get(r, "y23NovPeriod", "y23NovPeriod", text_only=True), y23NovHeating=_to_int(_get(r, "y23NovHeating", "y23NovHeating")), y23NovNextAmount=_to_int(_get(r, "y23NovNextAmount", "y23NovNextAmount")), y23NovNextTime=_get(r, "y23NovNextTime", "y23NovNextTime", text_only=True),
            y23DecAmount=_to_int(_get(r, "y23DecAmount", "y23DecAmount")), y23DecPeriod=_get(r, "y23DecPeriod", "y23DecPeriod", text_only=True), y23DecHeating=_to_int(_get(r, "y23DecHeating", "y23DecHeating")), y23DecNextAmount=_to_int(_get(r, "y23DecNextAmount", "y23DecNextAmount")), y23DecNextTime=_get(r, "y23DecNextTime", "y23DecNextTime", text_only=True),
            住宿费小计=_to_int(_get(r, "住宿费小计", "subtotal")),
            备注=_get(r, "备注", "remarks", text_only=True),
        )
        db.add(row)

    db.flush()

