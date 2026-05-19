"""
教学质量模块 - 作业登记表
Schema: teaching_quality

维度：神殿名称 + 班级名称 + 年份 + 月份
存储：每行一条记录（序号行）

表：teaching_quality."作业登记表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 班级名称 varchar(100) not null
- 年份 int not null
- 月份 int not null (1..12)
- 序号 int not null              -- 行序号
- 日期 varchar(20)
- 课程名称 varchar(100)
- 章节 varchar(200)
- 班级人数 int
- 班主任 varchar(50)
- 教员 varchar(50)
- 作业提交率 int                  -- 0-100
- 作业合格率 int                  -- 0-100
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


class 作业登记表(AccountBase):
    __tablename__ = "作业登记表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    日期: Mapped[str | None] = mapped_column(String(20), nullable=True)
    课程名称: Mapped[str | None] = mapped_column(String(100), nullable=True)
    章节: Mapped[str | None] = mapped_column(String(200), nullable=True)
    班级人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    班主任: Mapped[str | None] = mapped_column(String(50), nullable=True)
    教员: Mapped[str | None] = mapped_column(String(50), nullable=True)
    作业提交率: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0-100
    作业合格率: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0-100
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "年份", "月份", "序号", name="uq_作业登记_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_作业登记_维度", "神殿名称", "班级名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[作业登记表.__table__])
def init_homework_tables():
    _migrate()

def fetch_homework_rows(
    db: Session, *, 神殿名称: str, 班级名称: str, 年份: int, 月份: int
) -> List[作业登记表]:
    _migrate()
    return (
        db.query(作业登记表)
        .filter(
            作业登记表.神殿名称 == 神殿名称,
            作业登记表.班级名称 == 班级名称,
            作业登记表.年份 == 年份,
            作业登记表.月份 == 月份,
        )
        .order_by(作业登记表.序号)
        .all()
    )

def replace_homework_rows(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入指定班级+年月的作业登记表。
    支持字段（中文）：序号/日期/课程名称/章节/班级人数/班主任/教员/作业提交率/作业合格率/备注
    兼容英文字段：date/courseName/chapter/classSize/headTeacher/teacher/submitRate/passRate/remark
    跳过完全空白行。
    """
    _migrate()
    db.query(作业登记表).filter(
        作业登记表.神殿名称 == 神殿名称,
        作业登记表.班级名称 == 班级名称,
        作业登记表.年份 == 年份,
        作业登记表.月份 == 月份,
    ).delete()

    def _to_int(v):
        try:
            return int(v)
        except Exception:
            return None

    for i, r in enumerate(行列表, start=1):
        _oid = r.get("序号")
        try:
            序号 = int(_oid) if _oid is not None else i
        except Exception:
            序号 = i
        日期 = r.get("日期") or r.get("date")
        课程名称 = r.get("课程名称") or r.get("courseName")
        章节 = r.get("章节") or r.get("chapter")
        班级人数 = r.get("班级人数") if r.get("班级人数") is not None else r.get("classSize")
        班级人数_i = _to_int(班级人数)
        班主任 = r.get("班主任") or r.get("headTeacher")
        教员 = r.get("教员") or r.get("teacher")
        作业提交率 = r.get("作业提交率") if r.get("作业提交率") is not None else r.get("submitRate")
        作业提交率_i = _to_int(作业提交率)
        作业合格率 = r.get("作业合格率") if r.get("作业合格率") is not None else r.get("passRate")
        作业合格率_i = _to_int(作业合格率)
        备注 = r.get("备注") or r.get("remark")

        # 跳过完全空白行
        if not (日期 or 课程名称 or 章节 or 班级人数_i is not None or 班主任 or 教员 or 作业提交率_i is not None or 作业合格率_i is not None or 备注):
            continue

        db.add(
            作业登记表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                年份=年份,
                月份=月份,
                序号=序号,
                日期=日期,
                课程名称=课程名称,
                章节=章节,
                班级人数=班级人数_i,
                班主任=班主任,
                教员=教员,
                作业提交率=作业提交率_i,
                作业合格率=作业合格率_i,
                备注=备注,
            )
        )

    db.flush()

