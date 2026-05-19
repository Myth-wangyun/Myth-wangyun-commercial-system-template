"""
教学质量模块 - 宿舍租赁及缴费信息（年维度，手填）
Schema: teaching_quality

维度：神殿名称 + 年份 + 序号（唯一）
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 宿舍租赁及缴费信息表(AccountBase):
    __tablename__ = "宿舍租赁及缴费信息表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    序号: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    宿舍简称: Mapped[str | None] = mapped_column(String(100), nullable=True)
    地址房号: Mapped[str | None] = mapped_column(String(200), nullable=True)
    房东姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    联系方式: Mapped[str | None] = mapped_column(String(100), nullable=True)
    平米: Mapped[str | None] = mapped_column(String(50), nullable=True)
    租期: Mapped[str | None] = mapped_column(String(100), nullable=True)
    付款方式: Mapped[str | None] = mapped_column(String(100), nullable=True)

    租金: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 元
    押金: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 元

    收款信息: Mapped[str | None] = mapped_column(Text, nullable=True)  # 账户、开户行、卡号

    电表号: Mapped[str | None] = mapped_column(String(100), nullable=True)
    取暖卡号: Mapped[str | None] = mapped_column(String(100), nullable=True)
    水卡: Mapped[str | None] = mapped_column(String(100), nullable=True)

    暖气费缴费方式: Mapped[str | None] = mapped_column(String(100), nullable=True)
    暖气费缴费金额: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 首租
    首租租金: Mapped[int | None] = mapped_column(Integer, nullable=True)
    首租租期: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # 1-12月
    一月租金: Mapped[int | None] = mapped_column(Integer, nullable=True)
    一月租期: Mapped[str | None] = mapped_column(String(200), nullable=True)
    二月租金: Mapped[int | None] = mapped_column(Integer, nullable=True)
    二月租期: Mapped[str | None] = mapped_column(String(200), nullable=True)
    三月租金: Mapped[int | None] = mapped_column(Integer, nullable=True)
    三月租期: Mapped[str | None] = mapped_column(String(200), nullable=True)
    四月租金: Mapped[int | None] = mapped_column(Integer, nullable=True)
    四月租期: Mapped[str | None] = mapped_column(String(200), nullable=True)
    五月租金: Mapped[int | None] = mapped_column(Integer, nullable=True)
    五月租期: Mapped[str | None] = mapped_column(String(200), nullable=True)
    六月租金: Mapped[int | None] = mapped_column(Integer, nullable=True)
    六月租期: Mapped[str | None] = mapped_column(String(200), nullable=True)
    七月租金: Mapped[int | None] = mapped_column(Integer, nullable=True)
    七月租期: Mapped[str | None] = mapped_column(String(200), nullable=True)
    八月租金: Mapped[int | None] = mapped_column(Integer, nullable=True)
    八月租期: Mapped[str | None] = mapped_column(String(200), nullable=True)
    九月租金: Mapped[int | None] = mapped_column(Integer, nullable=True)
    九月租期: Mapped[str | None] = mapped_column(String(200), nullable=True)
    十月租金: Mapped[int | None] = mapped_column(Integer, nullable=True)
    十月租期: Mapped[str | None] = mapped_column(String(200), nullable=True)
    十一月租金: Mapped[int | None] = mapped_column(Integer, nullable=True)
    十一月租期: Mapped[str | None] = mapped_column(String(200), nullable=True)
    十二月租金: Mapped[int | None] = mapped_column(Integer, nullable=True)
    十二月租期: Mapped[str | None] = mapped_column(String(200), nullable=True)
    其他月份: Mapped[str | None] = mapped_column(String(200), nullable=True)

    宿舍原始状态: Mapped[str | None] = mapped_column(String(200), nullable=True)
    签约人: Mapped[str | None] = mapped_column(String(100), nullable=True)
    宿舍管理老师: Mapped[str | None] = mapped_column(String(100), nullable=True)

    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        # 不显式命名，避免与历史对象或其他表的同名索引/约束冲突
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
    AccountBase.metadata.create_all(bind=engine, tables=[宿舍租赁及缴费信息表.__table__], checkfirst=True)
    # 轻量迁移：补齐缺失列
    _MIGRATED = True

def init_dormitory_rent_payment_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[宿舍租赁及缴费信息表]:
    _migrate()
    return (
        db.query(宿舍租赁及缴费信息表)
        .filter(
            宿舍租赁及缴费信息表.神殿名称 == 神殿名称,
            宿舍租赁及缴费信息表.年份 == 年份,
        )
        .order_by(宿舍租赁及缴费信息表.序号)
        .all()
    )

essential_text_fields = {
    "宿舍简称": ("宿舍简称", "dormShortName"),
    "地址房号": ("地址房号", "address"),
    "房东姓名": ("房东姓名", "landlordName"),
    "联系方式": ("联系方式", "landlordPhone"),
    "平米": ("平米", "area"),
    "租期": ("租期", "leaseTerm"),
    "付款方式": ("付款方式", "paymentMethod"),
    "收款信息": ("收款信息", "payeeInfo"),
    "电表号": ("电表号", "electricMeterNo"),
    "取暖卡号": ("取暖卡号", "heatingCardNo"),
    "水卡": ("水卡", "waterCard"),
    "暖气费缴费方式": ("暖气费缴费方式", "heatingPayMethod"),
    # 首租
    "首租租金": ("首租租金", "firstRentAmount"),
    "首租租期": ("首租租期", "firstRentPeriod"),
    # 1-12月
    "一月租金": ("一月租金", "janRentAmount"),
    "一月租期": ("一月租期", "janRentPeriod"),
    "二月租金": ("二月租金", "febRentAmount"),
    "二月租期": ("二月租期", "febRentPeriod"),
    "三月租金": ("三月租金", "marRentAmount"),
    "三月租期": ("三月租期", "marRentPeriod"),
    "四月租金": ("四月租金", "aprRentAmount"),
    "四月租期": ("四月租期", "aprRentPeriod"),
    "五月租金": ("五月租金", "mayRentAmount"),
    "五月租期": ("五月租期", "mayRentPeriod"),
    "六月租金": ("六月租金", "junRentAmount"),
    "六月租期": ("六月租期", "junRentPeriod"),
    "七月租金": ("七月租金", "julRentAmount"),
    "七月租期": ("七月租期", "julRentPeriod"),
    "八月租金": ("八月租金", "augRentAmount"),
    "八月租期": ("八月租期", "augRentPeriod"),
    "九月租金": ("九月租金", "sepRentAmount"),
    "九月租期": ("九月租期", "sepRentPeriod"),
    "十月租金": ("十月租金", "octRentAmount"),
    "十月租期": ("十月租期", "octRentPeriod"),
    "十一月租金": ("十一月租金", "novRentAmount"),
    "十一月租期": ("十一月租期", "novRentPeriod"),
    "十二月租金": ("十二月租金", "decRentAmount"),
    "十二月租期": ("十二月租期", "decRentPeriod"),
    "其他月份": ("其他月份", "otherMonths"),
    "宿舍原始状态": ("宿舍原始状态", "originalStatus"),
    "签约人": ("签约人", "signer"),
    "宿舍管理老师": ("宿舍管理老师", "dormManager"),
    "备注": ("备注", "remarks"),
}

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    行列表: List[Dict[str, Any]],
):
    _migrate()
    db.query(宿舍租赁及缴费信息表).filter(
        宿舍租赁及缴费信息表.神殿名称 == 神殿名称,
        宿舍租赁及缴费信息表.年份 == 年份,
    ).delete()

    def _to_int(val) -> Optional[int]:
        try:
            if val in (None, ""):  # noqa
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

    def _get_text(d: Dict[str, Any], cn: str, en: str) -> Optional[str]:
        v = _get(d, cn, en, text_only=True)
        return v

    for r in sorted(行列表, key=lambda x: _to_int(_get(x, "序号", "serialNumber")) or 0):
        row = 宿舍租赁及缴费信息表(
            神殿名称=神殿名称,
            年份=int(年份 or 0),
            序号=_to_int(_get(r, "序号", "serialNumber")) or 0,
            宿舍简称=_get_text(r, "宿舍简称", "dormShortName"),
            地址房号=_get_text(r, "地址房号", "address"),
            房东姓名=_get_text(r, "房东姓名", "landlordName"),
            联系方式=_get_text(r, "联系方式", "landlordPhone"),
            平米=_get_text(r, "平米", "area"),
            租期=_get_text(r, "租期", "leaseTerm"),
            付款方式=_get_text(r, "付款方式", "paymentMethod"),
            租金=_to_int(_get(r, "租金", "rentAmount")),
            押金=_to_int(_get(r, "押金", "deposit")),
            收款信息=_get_text(r, "收款信息", "payeeInfo"),
            电表号=_get_text(r, "电表号", "electricMeterNo"),
            取暖卡号=_get_text(r, "取暖卡号", "heatingCardNo"),
            水卡=_get_text(r, "水卡", "waterCard"),
            暖气费缴费方式=_get_text(r, "暖气费缴费方式", "heatingPayMethod"),
            暖气费缴费金额=_to_int(_get(r, "暖气费缴费金额", "heatingPayAmount")),
            首租租金=_to_int(_get(r, "首租租金", "firstRentAmount")),
            首租租期=_get_text(r, "首租租期", "firstRentPeriod"),
            一月租金=_to_int(_get(r, "一月租金", "janRentAmount")),
            一月租期=_get_text(r, "一月租期", "janRentPeriod"),
            二月租金=_to_int(_get(r, "二月租金", "febRentAmount")),
            二月租期=_get_text(r, "二月租期", "febRentPeriod"),
            三月租金=_to_int(_get(r, "三月租金", "marRentAmount")),
            三月租期=_get_text(r, "三月租期", "marRentPeriod"),
            四月租金=_to_int(_get(r, "四月租金", "aprRentAmount")),
            四月租期=_get_text(r, "四月租期", "aprRentPeriod"),
            五月租金=_to_int(_get(r, "五月租金", "mayRentAmount")),
            五月租期=_get_text(r, "五月租期", "mayRentPeriod"),
            六月租金=_to_int(_get(r, "六月租金", "junRentAmount")),
            六月租期=_get_text(r, "六月租期", "junRentPeriod"),
            七月租金=_to_int(_get(r, "七月租金", "julRentAmount")),
            七月租期=_get_text(r, "七月租期", "julRentPeriod"),
            八月租金=_to_int(_get(r, "八月租金", "augRentAmount")),
            八月租期=_get_text(r, "八月租期", "augRentPeriod"),
            九月租金=_to_int(_get(r, "九月租金", "sepRentAmount")),
            九月租期=_get_text(r, "九月租期", "sepRentPeriod"),
            十月租金=_to_int(_get(r, "十月租金", "octRentAmount")),
            十月租期=_get_text(r, "十月租期", "octRentPeriod"),
            十一月租金=_to_int(_get(r, "十一月租金", "novRentAmount")),
            十一月租期=_get_text(r, "十一月租期", "novRentPeriod"),
            十二月租金=_to_int(_get(r, "十二月租金", "decRentAmount")),
            十二月租期=_get_text(r, "十二月租期", "decRentPeriod"),
            其他月份=_get_text(r, "其他月份", "otherMonths"),
            宿舍原始状态=_get_text(r, "宿舍原始状态", "originalStatus"),
            签约人=_get_text(r, "签约人", "signer"),
            宿舍管理老师=_get_text(r, "宿舍管理老师", "dormManager"),
            备注=_get_text(r, "备注", "remarks"),
        )
        db.add(row)

    db.flush()
