"""
教学质量模块 - 晚自习出勤表
Schema: teaching_quality

存储粒度：每名学员、每天、上/下午 各一条记录（单元格方式）。

表：teaching_quality."晚自习出勤表"
- 记录ID serial PK
- 神殿名称 varchar(50)  可空
- 班级名称 varchar(100) not null
- 年份 int not null
- 序号 int not null              -- 前端行序号
- 学员姓名 varchar(50) not null
- 日期 date not null
- 上下半天 varchar(2) not null    -- 'am'/'pm'
- 值 text                        -- 单元格内容（出勤、缺勤、请假、或符号等）
- 日期备注 text                  -- 行备注（按学生行），为简化写入，允许在每条记录重复存放同一行备注
唯一：神殿名称 + 班级名称 + 年份 + 学员姓名 + 日期 + 上下半天
索引：神殿名称 + 班级名称 + 年份
"""
from datetime import date, datetime
from typing import Any, Dict, List

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 晚自习出勤表(AccountBase):
    __tablename__ = "晚自习出勤表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str | None] = mapped_column(String(50), nullable=True)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)
    学员姓名: Mapped[str] = mapped_column(String(50), nullable=False)
    日期: Mapped[date] = mapped_column(Date, nullable=False)
    上下半天: Mapped[str] = mapped_column(String(2), nullable=False)  # am/pm
    值: Mapped[str | None] = mapped_column(Text, nullable=True)
    日期备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "年份", "学员姓名", "日期", "上下半天", name="uq_晚自习出勤_唯一"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_晚自习出勤_维度", "神殿名称", "班级名称", "年份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[晚自习出勤表.__table__])
def init_evening_attendance_tables():
    _migrate()

def fetch_evening_attendance_rows(
    db: Session, *, 神殿名称: str | None, 班级名称: str, 年份: int
) -> List[晚自习出勤表]:
    _migrate()
    q = db.query(晚自习出勤表).filter(
        晚自习出勤表.班级名称 == 班级名称,
        晚自习出勤表.年份 == 年份,
    )
    if 神殿名称 is not None:
        q = q.filter(晚自习出勤表.神殿名称 == 神殿名称)
    return q.order_by(晚自习出勤表.序号, 晚自习出勤表.学员姓名, 晚自习出勤表.日期, 晚自习出勤表.上下半天).all()

def replace_evening_attendance_rows(
    db: Session,
    *,
    神殿名称: str | None,
    班级名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入指定维度（班级+年份+月份）的所有单元格。
    行列示例：
    {
      "序号": 1,
      "姓名": "张三",
      "日期备注": "...",
      "slots": {"1.06-am": "出勤", "1.06-pm": "缺勤", ...}
    }
    兼容 slot key 格式："1.6-am"、"1.06-am"、"YYYY-MM-DD-am"。
    """
    _migrate()

    # 删除该班级+年份+月份的所有记录
    import datetime

    from sqlalchemy import extract

    q = db.query(晚自习出勤表).filter(
        晚自习出勤表.班级名称 == 班级名称,
        晚自习出勤表.年份 == 年份,
        extract('month', 晚自习出勤表.日期) == 月份,
    )
    if 神殿名称 is not None:
        q = q.filter(晚自习出勤表.神殿名称 == 神殿名称)
    q.delete()

    def _parse_slot_key(sk: str, Y: int, M: int):
        sk = str(sk).strip()
        try:
            if '-' in sk and sk.count('-') == 2 and len(sk.split('-')[0]) == 4:
                # 形如 YYYY-MM-DD-am
                parts = sk.split('-')
                y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
                half = parts[3]
                return datetime.date(y, m, d), half
            # 形如 1.6-am / 01.06-am
            left, half = sk.split('-')
            _m, _d = left.split('.')
            d = int(_d)
            return datetime.date(Y, M, d), half
        except Exception:
            return None, None

    for r in 行列表:
        序号 = int(r.get("序号") or 0)
        姓名 = (r.get("姓名") or r.get("name") or "").strip()
        日期备注 = r.get("日期备注") or r.get("dateRemark")
        slots: Dict[str, Any] = r.get("slots") or {}
        for sk, val in slots.items():
            dt, half = _parse_slot_key(sk, 年份, 月份)
            if dt is None or half not in ("am", "pm"):
                continue
            if dt.year != 年份 or dt.month != 月份:
                continue
            db.add(
                晚自习出勤表(
                    神殿名称=神殿名称,
                    班级名称=班级名称,
                    年份=年份,
                    序号=序号,
                    学员姓名=姓名,
                    日期=dt,
                    上下半天=half,
                    值=str(val) if val is not None else None,
                    日期备注=日期备注,
                )
            )
    db.flush()

