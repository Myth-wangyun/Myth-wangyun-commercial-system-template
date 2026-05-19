"""
教学质量模块 - 班级出勤表（XX班班级出勤表）
Schema: teaching_quality

存储粒度：每名学员、每天、上/下午 各一条记录（单元格方式），方便扩展月份与查询。

表：teaching_quality."班级出勤表"
- 记录ID serial PK
- 神殿名称 varchar(50)  可空（当前前端未固定传递，预留）
- 班级名称 varchar(100) not null
- 年份 int not null
- 序号 int not null              -- 前端行序号，便于排序
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

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 班级出勤表(AccountBase):
    __tablename__ = "班级出勤表"

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
        UniqueConstraint("神殿名称", "班级名称", "年份", "学员姓名", "日期", "上下半天", name="uq_班级出勤_唯一"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_班级出勤_维度", "神殿名称", "班级名称", "年份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[班级出勤表.__table__])
def init_class_attendance_tables():
    _migrate()

def fetch_class_attendance_rows(
    db: Session, *, 神殿名称: str | None, 班级名称: str, 年份: int
) -> List[班级出勤表]:
    _migrate()
    q = db.query(班级出勤表).filter(
        班级出勤表.班级名称 == 班级名称,
        班级出勤表.年份 == 年份,
    )
    if 神殿名称 is not None:
        q = q.filter(班级出勤表.神殿名称 == 神殿名称)
    return q.order_by(班级出勤表.序号, 班级出勤表.学员姓名, 班级出勤表.日期,班级出勤表.上下半天).all()

def replace_class_attendance_rows(
    db: Session,
    *,
    神殿名称: str | None,
    班级名称: str,
    年份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入指定维度（班级+年份）的所有单元格。
    行列表元素示例：
    {
      "序号": 1,
      "姓名": "张三",
      "日期备注": "...",
      "slots": {"2025-09-01-am": "出勤", "2025-09-01-pm": "缺勤", ...}
    }
    """
    _migrate()
    q = db.query(班级出勤表).filter(班级出勤表.班级名称 == 班级名称, 班级出勤表.年份 == 年份)
    if 神殿名称 is not None:
        q = q.filter(班级出勤表.神殿名称 == 神殿名称)
    q.delete()
    
    # 先flush删除操作，然后重置序列，避免主键冲突
    db.flush()
    db.execute(text(
        'SELECT setval(pg_get_serial_sequence(\'teaching_quality."班级出勤表"\', \'记录ID\'), '
        'COALESCE((SELECT MAX("记录ID") FROM teaching_quality."班级出勤表"), 0) + 1, false)'
    ))

    import datetime

    def _parse_slot_key(sk: str):
        # 期望形如 2025-09-01-am / 2025-10-02-pm
        try:
            parts = sk.split("-")
            y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
            half = parts[3]
            return datetime.date(y, m, d), half
        except Exception:
            return None, None

    for r in 行列表:
        序号 = int(r.get("序号") or r.get("serialNumber") or 0)
        姓名 = (r.get("姓名") or r.get("name") or "").strip()
        日期备注 = r.get("日期备注") or r.get("dateRemark")
        slots: Dict[str, Any] = r.get("slots") or {}
        for sk, val in slots.items():
            dt, half = _parse_slot_key(sk)
            if dt is None or half not in ("am", "pm"):
                continue
            # 仅写入当前年份的数据，防止误传其他年度
            if dt.year != 年份:
                continue
            db.add(
                班级出勤表(
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

