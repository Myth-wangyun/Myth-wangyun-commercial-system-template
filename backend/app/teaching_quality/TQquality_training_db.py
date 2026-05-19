"""
教学质量模块 - 素质训练登记表（Quality Training Sheet）
Schema: teaching_quality

维度：神殿名称 + 班级名称 + 年份 + 月份
存储：每行一条记录（序号行），包含时间、内容、几节课、作业提交率、考试合格率、问题汇总

表：teaching_quality."素质训练登记表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 班级名称 varchar(100) not null
- 年份 int not null
- 月份 int not null (1..12)
- 序号 int not null              -- 前端行序号
- 时间 varchar(50)
- 内容 text
- 几节课 varchar(50)
- 作业提交率 varchar(50)
- 考试合格率 varchar(50)
- 问题汇总 text
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


class 素质训练登记表(AccountBase):
    __tablename__ = "素质训练登记表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    内容: Mapped[str | None] = mapped_column(Text, nullable=True)
    几节课: Mapped[str | None] = mapped_column(String(50), nullable=True)
    作业提交率: Mapped[str | None] = mapped_column(String(50), nullable=True)
    考试合格率: Mapped[str | None] = mapped_column(String(50), nullable=True)
    问题汇总: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "年份", "月份", "序号", name="uq_素质训练_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_素质训练_维度", "神殿名称", "班级名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    # teaching_quality 模块专用 schema
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[素质训练登记表.__table__])
def init_quality_training_tables():
    _migrate()

def fetch_quality_training_rows(
    db: Session, *, 神殿名称: str, 班级名称: str, 年份: int, 月份: int
) -> List[素质训练登记表]:
    _migrate()
    return (
        db.query(素质训练登记表)
        .filter(
            素质训练登记表.神殿名称 == 神殿名称,
            素质训练登记表.班级名称 == 班级名称,
            素质训练登记表.年份 == 年份,
            素质训练登记表.月份 == 月份,
        )
        .order_by(素质训练登记表.序号)
        .all()
    )

def replace_quality_training_rows(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入指定班级+年月的素质训练登记表。
    行列示例（与前端字段对应）：
    {
      "序号": 1,
      "时间": "11.25",
      "内容": "弟子规总序",
      "几节课": "两节课",
      "作业提交率": "100%",
      "考试合格率": "95%",
      "问题汇总": "…"
    }
    也兼容英文字段：date/content/lessonCount/homeworkSubmitRate/examPassRate/issuesSummary。
    """
    _migrate()
    db.query(素质训练登记表).filter(
        素质训练登记表.神殿名称 == 神殿名称,
        素质训练登记表.班级名称 == 班级名称,
        素质训练登记表.年份 == 年份,
        素质训练登记表.月份 == 月份,
    ).delete()

    for r in sorted(行列表, key=lambda x: x.get("序号", 0)):
        序号 = int(r.get("序号") or r.get("serialNumber") or 0)
        时间 = r.get("时间") or r.get("date")
        内容 = r.get("内容") or r.get("content")
        几节课 = r.get("几节课") or r.get("lessonCount")
        作业提交率 = r.get("作业提交率") or r.get("homeworkSubmitRate")
        考试合格率 = r.get("考试合格率") or r.get("examPassRate")
        问题汇总 = r.get("问题汇总") or r.get("issuesSummary")
        db.add(
            素质训练登记表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                年份=年份,
                月份=月份,
                序号=序号,
                时间=时间,
                内容=内容,
                几节课=几节课,
                作业提交率=作业提交率,
                考试合格率=考试合格率,
                问题汇总=问题汇总,
            )
        )

    db.flush()

