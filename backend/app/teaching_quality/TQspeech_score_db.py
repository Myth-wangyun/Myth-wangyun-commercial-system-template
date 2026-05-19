"""
教学质量模块 - 班级演讲评分表（Speech Score Sheet）
Schema: teaching_quality

维度：神殿名称 + 班级名称 + 年份 + 月份
存储：每行一条记录（序号行），包含姓名、日期、演讲主题、评分

表：teaching_quality."班级演讲评分表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 班级名称 varchar(100) not null
- 年份 int not null
- 月份 int not null (1..12)
- 序号 int not null              -- 前端行序号
- 姓名 varchar(50)
- 日期 varchar(20)               -- 允许自由格式，例如 2025-09-01
- 演讲主题 text
- 评分 int                       -- 0..100
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


class 班级演讲评分表(AccountBase):
    __tablename__ = "班级演讲评分表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    姓名: Mapped[str | None] = mapped_column(String(50), nullable=True)
    日期: Mapped[str | None] = mapped_column(String(20), nullable=True)
    演讲主题: Mapped[str | None] = mapped_column(Text, nullable=True)
    评分: Mapped[int | None] = mapped_column(Integer, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "年份", "月份", "序号", name="uq_班级演讲评分_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_班级演讲评分_维度", "神殿名称", "班级名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[班级演讲评分表.__table__])
def init_speech_score_tables():
    _migrate()

def fetch_speech_score_rows(
    db: Session, *, 神殿名称: str, 班级名称: str, 年份: int, 月份: int
) -> List[班级演讲评分表]:
    _migrate()
    return (
        db.query(班级演讲评分表)
        .filter(
            班级演讲评分表.神殿名称 == 神殿名称,
            班级演讲评分表.班级名称 == 班级名称,
            班级演讲评分表.年份 == 年份,
            班级演讲评分表.月份 == 月份,
        )
        .order_by(班级演讲评分表.序号)
        .all()
    )

def replace_speech_score_rows(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入指定班级+年月的演讲评分表。
    行列示例（与前端字段对应）：
    {
      "序号": 1,
      "姓名": "张三",
      "日期": "2025-09-01",
      "演讲主题": "XXXX",
      "评分": 95
    }
    兼容英文字段：serialNumber/name/date/topic/score。
    """
    _migrate()
    db.query(班级演讲评分表).filter(
        班级演讲评分表.神殿名称 == 神殿名称,
        班级演讲评分表.班级名称 == 班级名称,
        班级演讲评分表.年份 == 年份,
        班级演讲评分表.月份 == 月份,
    ).delete()

    def _to_int(v):
        try:
            return int(v)
        except Exception:
            return None

    for r in sorted(行列表, key=lambda x: x.get("序号") or x.get("serialNumber") or 0):
        序号 = _to_int(r.get("序号") or r.get("serialNumber")) or 0
        姓名 = (r.get("姓名") or r.get("name") or "").strip()
        日期 = (r.get("日期") or r.get("date") or "").strip()
        演讲主题 = (r.get("演讲主题") or r.get("topic") or "").strip()
        评分 = r.get("评分")
        评分_i = _to_int(评分)

        # 跳过完全空白行
        if not (姓名 or 日期 or 演讲主题 or (评分_i is not None)):
            continue

        db.add(
            班级演讲评分表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                年份=年份,
                月份=月份,
                序号=序号,
                姓名=姓名,
                日期=日期,
                演讲主题=演讲主题,
                评分=评分_i,
            )
        )

    db.flush()

