"""
教学质量模块 - 新生班催费记录表（Fee Reminder Sheet）
Schema: teaching_quality

维度：神殿名称 + 班级名称 + 年份 + 月份
存储：每行一条记录（序号行）

表：teaching_quality."新生班催费记录表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 班级名称 varchar(100) not null
- 年份 int not null
- 月份 int not null (1..12)
- 序号 int not null              -- 行序号
- 学生姓名 varchar(50)
- 专业 varchar(100)
- 学制 varchar(50)
- 学费应收 int
- 已收 int
- 欠费金额 int
- 报名时间 varchar(50)
- 预计报到时间 varchar(50)
- 预计回款时间 text
- 实际回款时间 text
- 实际回款金额 text
- 剩余回款 int
- 催费记录 text
- 咨询师 varchar(50)
- 班主任 varchar(50)
- 教员 varchar(50)
- 备注 text
唯一：神殿名称 + 班级名称 + 年份 + 月份 + 序号
索引：神殿名称 + 班级名称 + 年份 + 月份
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 新生班催费记录表(AccountBase):
    __tablename__ = "新生班催费记录表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    学生姓名: Mapped[str | None] = mapped_column(String(50), nullable=True)
    专业: Mapped[str | None] = mapped_column(String(100), nullable=True)
    学制: Mapped[str | None] = mapped_column(String(50), nullable=True)
    学费应收: Mapped[int | None] = mapped_column(Integer, nullable=True)
    已收: Mapped[int | None] = mapped_column(Integer, nullable=True)
    欠费金额: Mapped[int | None] = mapped_column(Integer, nullable=True)
    报名时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    预计报到时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    预计回款时间: Mapped[str | None] = mapped_column(Text, nullable=True)
    实际回款时间: Mapped[str | None] = mapped_column(Text, nullable=True)
    实际回款金额: Mapped[str | None] = mapped_column(Text, nullable=True)
    剩余回款: Mapped[int | None] = mapped_column(Integer, nullable=True)
    催费记录: Mapped[str | None] = mapped_column(Text, nullable=True)
    咨询师: Mapped[str | None] = mapped_column(String(50), nullable=True)
    班主任: Mapped[str | None] = mapped_column(String(50), nullable=True)
    教员: Mapped[str | None] = mapped_column(String(50), nullable=True)
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "年份", "月份", "序号", name="uq_新生班催费_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_新生班催费_维度", "神殿名称", "班级名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[新生班催费记录表.__table__])
def init_fee_reminder_tables():
    _migrate()

def fetch_fee_reminder_rows(
    db: Session, *, 神殿名称: str, 班级名称: str, 年份: int, 月份: int
) -> List[新生班催费记录表]:
    _migrate()
    return (
        db.query(新生班催费记录表)
        .filter(
            新生班催费记录表.神殿名称 == 神殿名称,
            新生班催费记录表.班级名称 == 班级名称,
            新生班催费记录表.年份 == 年份,
            新生班催费记录表.月份 == 月份,
        )
        .order_by(新生班催费记录表.序号)
        .all()
    )

def replace_fee_reminder_rows(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入指定班级+年月的新生班催费记录表。
    兼容英文字段：
      studentName, major, schoolingLength, tuitionReceivable, amountReceived, arrearsAmount,
      signUpDate, expectedReportDate, expectedReturnDates, actualReturnDates, actualReturnAmounts,
      remainingReturn, reminderRecord, consultant, headTeacher, teacher, remark
    跳过完全空白行。
    """
    _migrate()
    db.query(新生班催费记录表).filter(
        新生班催费记录表.神殿名称 == 神殿名称,
        新生班催费记录表.班级名称 == 班级名称,
        新生班催费记录表.年份 == 年份,
        新生班催费记录表.月份 == 月份,
    ).delete()

    def _to_int(v):
        try:
            return int(v)
        except Exception:
            return None

    for i, r in enumerate(行列表, start=1):
        # 序号
        _oid = r.get("序号")
        try:
            序号 = int(_oid) if _oid is not None else i
        except Exception:
            序号 = i
        # 字段映射
        学生姓名 = (r.get("学生姓名") or r.get("studentName") or "").strip()
        专业 = (r.get("专业") or r.get("major") or "").strip()
        学制 = (r.get("学制") or r.get("schoolingLength") or "").strip()
        学费应收 = r.get("学费应收") if r.get("学费应收") is not None else r.get("tuitionReceivable")
        已收 = r.get("已收") if r.get("已收") is not None else r.get("amountReceived")
        欠费金额 = r.get("欠费金额") if r.get("欠费金额") is not None else r.get("arrearsAmount")
        报名时间 = r.get("报名时间") or r.get("signUpDate")
        预计报到时间 = r.get("预计报到时间") or r.get("expectedReportDate")
        预计回款时间 = r.get("预计回款时间") or r.get("expectedReturnDates")
        实际回款时间 = r.get("实际回款时间") or r.get("actualReturnDates")
        实际回款金额 = r.get("实际回款金额") or r.get("actualReturnAmounts")
        剩余回款 = r.get("剩余回款") if r.get("剩余回款") is not None else r.get("remainingReturn")
        催费记录 = r.get("催费记录") or r.get("reminderRecord")
        咨询师 = r.get("咨询师") or r.get("consultant")
        班主任 = r.get("班主任") or r.get("headTeacher")
        教员 = r.get("教员") or r.get("teacher")
        备注 = r.get("备注") or r.get("remark")

        学费应收_i = _to_int(学费应收)
        已收_i = _to_int(已收)
        欠费金额_i = _to_int(欠费金额)
        剩余回款_i = _to_int(剩余回款)

        # 跳过完全空白行
        if not (
            学生姓名
            or 专业
            or 学制
            or 学费应收_i is not None
            or 已收_i is not None
            or 欠费金额_i is not None
            or 报名时间
            or 预计报到时间
            or 预计回款时间
            or 实际回款时间
            or 实际回款金额
            or 剩余回款_i is not None
            or 催费记录
            or 咨询师
            or 班主任
            or 教员
            or 备注
        ):
            continue

        db.add(
            新生班催费记录表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                年份=年份,
                月份=月份,
                序号=序号,
                学生姓名=学生姓名,
                专业=专业,
                学制=学制,
                学费应收=学费应收_i,
                已收=已收_i,
                欠费金额=欠费金额_i,
                报名时间=报名时间,
                预计报到时间=预计报到时间,
                预计回款时间=预计回款时间,
                实际回款时间=实际回款时间,
                实际回款金额=实际回款金额,
                剩余回款=剩余回款_i,
                催费记录=催费记录,
                咨询师=咨询师,
                班主任=班主任,
                教员=教员,
                备注=备注,
            )
        )

    db.flush()

