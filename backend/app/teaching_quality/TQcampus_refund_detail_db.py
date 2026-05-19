"""
教学质量模块 - 神殿教化司退费明细表（按月保存明细行，可编辑）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份 + 身份证号（唯一）
前端编辑保存时按月覆盖写入。
"""
from datetime import date, datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 退费明细表(AccountBase):
    __tablename__ = "退费明细表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    序号: Mapped[int | None] = mapped_column(Integer, nullable=True)
    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    性别: Mapped[str | None] = mapped_column(String(10), nullable=True)
    身份证号: Mapped[str | None] = mapped_column(String(50), nullable=True)
    入学时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    入学年龄: Mapped[str | None] = mapped_column(String(50), nullable=True)
    学历: Mapped[str | None] = mapped_column(String(50), nullable=True)
    毕业时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    毕业年龄: Mapped[str | None] = mapped_column(String(50), nullable=True)
    最高学历证书及性质: Mapped[str | None] = mapped_column(Text, nullable=True)
    神殿来源: Mapped[str | None] = mapped_column(String(100), nullable=True)
    咨询师: Mapped[str | None] = mapped_column(String(100), nullable=True)
    所报专业: Mapped[str | None] = mapped_column(String(100), nullable=True)
    学制: Mapped[str | None] = mapped_column(String(50), nullable=True)
    应收学费金额: Mapped[int | None] = mapped_column(Integer, nullable=True)
    班主任姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    学员状态: Mapped[str | None] = mapped_column(String(100), nullable=True)
    过往专业: Mapped[str | None] = mapped_column(String(100), nullable=True)
    毕业学校: Mapped[str | None] = mapped_column(String(200), nullable=True)
    联系电话: Mapped[str | None] = mapped_column(String(50), nullable=True)
    家长电话: Mapped[str | None] = mapped_column(String(50), nullable=True)
    通信地址: Mapped[str | None] = mapped_column(Text, nullable=True)
    户口性质: Mapped[str | None] = mapped_column(String(50), nullable=True)
    就读方式: Mapped[str | None] = mapped_column(String(50), nullable=True)
    现住址: Mapped[str | None] = mapped_column(Text, nullable=True)
    是否承诺注册学历: Mapped[str | None] = mapped_column(String(10), nullable=True)
    承诺注册学历性质级别名称: Mapped[str | None] = mapped_column(Text, nullable=True)
    是否已注册中专大专: Mapped[str | None] = mapped_column(String(10), nullable=True)
    所注册学校: Mapped[str | None] = mapped_column(String(200), nullable=True)
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)
    退费时间: Mapped[date | None] = mapped_column(Date, nullable=True)  # 改为日期类型
    退费金额: Mapped[int | None] = mapped_column(Integer, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "身份证号"),
        Index(None, "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[退费明细表.__table__], checkfirst=True)

def init_refund_detail_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int, 月份: int) -> List[退费明细表]:
    _migrate()
    return (
        db.query(退费明细表)
        .filter(
            退费明细表.神殿名称 == 神殿名称,
            退费明细表.年份 == 年份,
            退费明细表.月份 == 月份,
        )
        .order_by(退费明细表.序号.asc().nullsfirst(), 退费明细表.姓名.asc())
        .all()
    )

def replace_rows(db: Session, *, 神殿名称: str, 年份: int, 月份: int, 行列表: List[Dict[str, Any]]):
    _migrate()
    # 覆盖写入：先删后插
    db.query(退费明细表).filter(
        退费明细表.神殿名称 == 神殿名称,
        退费明细表.年份 == 年份,
        退费明细表.月份 == 月份,
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

    def _parse_date(v) -> Optional[date]:
        """解析日期字符串，支持多种格式"""
        if v in (None, ""):
            return None
        try:
            s = str(v).strip()
            # 尝试 ISO 格式 YYYY-MM-DD
            if len(s) >= 10 and s[4] == '-' and s[7] == '-':
                return datetime.strptime(s[:10], '%Y-%m-%d').date()
            # 尝试 YYYY/MM/DD 格式
            if len(s) >= 10 and s[4] == '/' and s[7] == '/':
                return datetime.strptime(s[:10], '%Y/%m/%d').date()
            # 尝试 YYYYMMDD 格式
            if len(s) == 8 and s.isdigit():
                return datetime.strptime(s, '%Y%m%d').date()
            return None
        except Exception:
            return None

    def _get(d: Dict[str, Any], *keys: str, text_only: bool = False):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return str(d[k]) if text_only else d[k]
        return None

    for r in 行列表:
        姓名 = _get(r, "姓名", "name", text_only=True)
        身份证 = _get(r, "身份证号", "idCard", text_only=True)
        # 跳过完全空白行（姓名和身份证号都为空）
        if not (姓名 or 身份证):
            continue
        db.add(
            退费明细表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=int(月份 or 0),
                序号=_to_int(_get(r, "序号", "serialNumber")),
                姓名=姓名,
                性别=_get(r, "性别", "gender", text_only=True),
                身份证号=身份证,
                入学时间=_get(r, "入学时间", "enrollDate", text_only=True),
                入学年龄=_get(r, "入学年龄", "enrollAge", text_only=True),
                学历=_get(r, "学历", "education", text_only=True),
                毕业时间=_get(r, "毕业时间", "graduationDate", text_only=True),
                毕业年龄=_get(r, "毕业年龄", text_only=True),
                最高学历证书及性质=_get(r, "最高学历证书及性质", "highestDegree", text_only=True),
                神殿来源=_get(r, "神殿来源", "campusSource", text_only=True),
                咨询师=_get(r, "咨询师", "consultant", text_only=True),
                所报专业=_get(r, "所报专业", "reportedMajor", text_only=True),
                学制=_get(r, "学制", "educationSystem", text_only=True),
                应收学费金额=_to_int(_get(r, "应收学费金额", "receivableTuition")),
                班主任姓名=_get(r, "班主任姓名", "headTeacherName", text_only=True),
                学员状态=_get(r, "学员状态", "studentStatus", text_only=True),
                过往专业=_get(r, "过往专业", "previousMajor", text_only=True),
                毕业学校=_get(r, "毕业学校", "graduatedSchool", text_only=True),
                联系电话=_get(r, "联系电话", "contactPhone", text_only=True),
                家长电话=_get(r, "家长电话", "parentPhone", text_only=True),
                通信地址=_get(r, "通信地址", "mailingAddress", text_only=True),
                户口性质=_get(r, "户口性质", "householdType", text_only=True),
                就读方式=_get(r, "就读方式", "studyMode", text_only=True),
                现住址=_get(r, "现住址", "currentAddress", text_only=True),
                是否承诺注册学历=_get(r, "是否承诺注册学历", "hasRegistrationCommitment", text_only=True),
                承诺注册学历性质级别名称=_get(r, "承诺注册学历性质级别名称", "registrationCommitmentDetails", text_only=True),
                是否已注册中专大专=_get(r, "是否已注册中专大专", "hasRegistered", text_only=True),
                所注册学校=_get(r, "所注册学校", "registeredSchool", text_only=True),
                备注=_get(r, "备注", "remarks", text_only=True),
                退费时间=_parse_date(_get(r, "退费时间", "refundDate", text_only=True)),
                退费金额=_to_int(_get(r, "退费金额", "refundAmount")),
            )
        )
    db.flush()

