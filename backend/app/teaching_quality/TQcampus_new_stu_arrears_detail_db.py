"""
教学质量模块 - 神殿教化司新生仍欠费明细表（按月保存明细行，可编辑）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份 + 序号（唯一）
前端编辑保存时按月覆盖写入。
"""
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema

_init_lock = threading.Lock()
_initialized = False

class 新生仍欠费明细表(AccountBase):
    __tablename__ = "新生仍欠费明细表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    序号: Mapped[int | None] = mapped_column(Integer, nullable=True)
    班主任姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    新生姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    报名时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    报道时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    报名专业: Mapped[str | None] = mapped_column(String(100), nullable=True)
    报名学制: Mapped[str | None] = mapped_column(String(50), nullable=True)
    应收学费: Mapped[int | None] = mapped_column(Integer, nullable=True)
    报名交费金额: Mapped[int | None] = mapped_column(Integer, nullable=True)
    补款金额: Mapped[int | None] = mapped_column(Integer, nullable=True)
    仍欠费金额: Mapped[int | None] = mapped_column(Integer, nullable=True)
    是否全款: Mapped[str | None] = mapped_column(String(10), nullable=True)
    是否贷款: Mapped[str | None] = mapped_column(String(10), nullable=True)
    是否过课时: Mapped[str | None] = mapped_column(String(10), nullable=True)
    试学周期: Mapped[str | None] = mapped_column(String(50), nullable=True)
    是否退费: Mapped[str | None] = mapped_column(String(10), nullable=True)
    退费情况说明: Mapped[str | None] = mapped_column(Text, nullable=True)
    咨询师: Mapped[str | None] = mapped_column(String(100), nullable=True)
    是否住宿: Mapped[str | None] = mapped_column(String(10), nullable=True)
    宿舍名称: Mapped[str | None] = mapped_column(String(200), nullable=True)
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "序号"),
        Index(None, "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    global _initialized
    if _initialized:
        return
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        _initialized = True
        return
    with _init_lock:
        if _initialized:
            return
        ensure_teaching_quality_schema()
        AccountBase.metadata.create_all(bind=engine, tables=[新生仍欠费明细表.__table__], checkfirst=True)
        _initialized = True

def init_new_stu_arrears_detail_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int, 月份: int) -> List[新生仍欠费明细表]:
    _migrate()
    return (
        db.query(新生仍欠费明细表)
        .filter(
            新生仍欠费明细表.神殿名称 == 神殿名称,
            新生仍欠费明细表.年份 == 年份,
            新生仍欠费明细表.月份 == 月份,
        )
        .order_by(新生仍欠费明细表.序号.asc().nullsfirst(), 新生仍欠费明细表.新生姓名.asc().nullsfirst())
        .all()
    )

def replace_rows(db: Session, *, 神殿名称: str, 年份: int, 月份: int, 行列表: List[Dict[str, Any]]):
    _migrate()
    # 覆盖写入：先删后插
    db.query(新生仍欠费明细表).filter(
        新生仍欠费明细表.神殿名称 == 神殿名称,
        新生仍欠费明细表.年份 == 年份,
        新生仍欠费明细表.月份 == 月份,
    ).delete()

    def _to_int(v) -> Optional[int]:
        try:
            if v in (None, ""):
                return None
            return int(str(v))
        except Exception:
            try:
                return int(float(v))
            except Exception:
                return None

    def _get(d: Dict[str, Any], *keys: str, text_only: bool = False):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return str(d[k]) if text_only else d[k]
        return None

    for r in 行列表:
        姓名 = _get(r, "新生姓名", "studentName", text_only=True)
        金额 = _to_int(_get(r, "仍欠费金额", "arrearsAmount"))
        # 跳过完全空白行（新生姓名为空且欠费金额为空且其他核心项为空）
        if not (姓名 or 金额):
            continue
        db.add(
            新生仍欠费明细表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=int(月份 or 0),
                序号=_to_int(_get(r, "序号", "serialNumber")),
                班主任姓名=_get(r, "班主任姓名", "classTeacherName", text_only=True),
                新生姓名=姓名,
                报名时间=_get(r, "报名时间", "signUpDate", text_only=True),
                报道时间=_get(r, "报道时间", "reportDate", text_only=True),
                报名专业=_get(r, "报名专业", "major", text_only=True),
                报名学制=_get(r, "报名学制", "programLength", text_only=True),
                应收学费=_to_int(_get(r, "应收学费", "tuitionShould")),
                报名交费金额=_to_int(_get(r, "报名交费金额", "tuitionPaid")),
                补款金额=_to_int(_get(r, "补款金额", "additionalPayment")),
                仍欠费金额=_to_int(_get(r, "仍欠费金额", "arrearsAmount")),
                是否全款=_get(r, "是否全款", "isFullPayment", text_only=True),
                是否贷款=_get(r, "是否贷款", "isLoan", text_only=True),
                是否过课时=_get(r, "是否过课时", "hasAttendedClass", text_only=True),
                试学周期=_get(r, "试学周期", "trialPeriod", text_only=True),
                是否退费=_get(r, "是否退费", "isRefund", text_only=True),
                退费情况说明=_get(r, "退费情况说明", "refundNote", text_only=True),
                咨询师=_get(r, "咨询师", "consultant", text_only=True),
                是否住宿=_get(r, "是否住宿", "hasAccommodation", text_only=True),
                宿舍名称=_get(r, "宿舍名称", "dormName", text_only=True),
                备注=_get(r, "备注", "remark", text_only=True),
            )
        )
    db.flush()

