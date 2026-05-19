"""
教学质量模块 - 自习签到表（Self Study Sign-in）
Schema: teaching_quality

维度：神殿名称 + 班级名称 + 年份 + 月份
存储：每名学员、每个"时间槽"（slot-<index>-arrive/leave）一条记录（单元格方式）。

表：teaching_quality."自习签到表"
- 记录ID serial PK
- 神殿名称 varchar(50)  可空
- 班级名称 varchar(100) not null
- 年份 int not null
- 月份 int not null
- 序号 int not null              -- 前端行序号
- 学员姓名 varchar(50) not null
- 槽序号 int not null            -- 1..N
- 到退 varchar(6) not null        -- 'arrive'|'leave'
- 值 text                        -- 单元格内容（时间或符号等）
唯一：神殿名称 + 班级名称 + 年份 + 月份 + 学员姓名 + 槽序号 + 到退
索引：神殿名称 + 班级名称 + 年份 + 月份
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 自习签到表(AccountBase):
    __tablename__ = "自习签到表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str | None] = mapped_column(String(50), nullable=True)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)
    学员姓名: Mapped[str] = mapped_column(String(50), nullable=False)

    槽序号: Mapped[int] = mapped_column(Integer, nullable=False)
    到退: Mapped[str] = mapped_column(String(6), nullable=False)  # arrive/leave
    值: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "年份", "月份", "学员姓名", "槽序号", "到退", name="uq_自习签到_唯一"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_自习签到_维度", "神殿名称", "班级名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[自习签到表.__table__])
def init_self_study_signin_tables():
    _migrate()

def fetch_self_study_signin_rows(
    db: Session, *, 神殿名称: str | None, 班级名称: str, 年份: int, 月份: int
) -> List[自习签到表]:
    _migrate()
    q = db.query(自习签到表).filter(
        自习签到表.班级名称 == 班级名称,
        自习签到表.年份 == 年份,
        自习签到表.月份 == 月份,
    )
    if 神殿名称 is not None:
        q = q.filter(自习签到表.神殿名称 == 神殿名称)
    return q.order_by(自习签到表.序号, 自习签到表.学员姓名, 自习签到表.槽序号, 自习签到表.到退).all()

def replace_self_study_signin_rows(
    db: Session,
    *,
    神殿名称: str | None,
    班级名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入指定维度（班级+年月）的所有单元格。
    行列示例：
    {
      "序号": 1,
      "姓名": "张三",
      "slots": {"slot-1-arrive": "18:30", "slot-1-leave": "20:30", ...}
    }
    """
    _migrate()

    # 先清空该班级该年月所有记录
    q = db.query(自习签到表).filter(
        自习签到表.班级名称 == 班级名称,
        自习签到表.年份 == 年份,
        自习签到表.月份 == 月份,
    )
    if 神殿名称 is not None:
        q = q.filter(自习签到表.神殿名称 == 神殿名称)
    q.delete()

    def _parse_slot_key(sk: str):
        try:
            parts = str(sk).split("-")  # slot-<index>-arrive/leave
            if len(parts) != 3:
                return None, None
            if parts[0] != "slot":
                return None, None
            idx = int(parts[1])
            typ = parts[2]
            if typ not in ("arrive", "leave"):
                return None, None
            return idx, typ
        except Exception:
            return None, None

    for r in 行列表:
        序号 = int(r.get("序号") or 0)
        姓名 = (r.get("姓名") or r.get("name") or "").strip()
        slots: Dict[str, Any] = r.get("slots") or {}
        for sk, val in slots.items():
            idx, typ = _parse_slot_key(sk)
            if idx is None:
                continue
            db.add(
                自习签到表(
                    神殿名称=神殿名称,
                    班级名称=班级名称,
                    年份=年份,
                    月份=月份,
                    序号=序号,
                    学员姓名=姓名,
                    槽序号=idx,
                    到退=typ,
                    值=str(val) if val is not None else None,
                )
            )
    db.flush()

