"""
教学质量模块 - 专业考试成绩登记表（Major Exam Score Sheet）
Schema: teaching_quality

维度：神殿名称 + 班级名称 + 年份 + 月份
存储：每行一条记录（序号行），包含学生姓名、科目+考试时间+教员姓名、考试成绩

表：teaching_quality."专业考试成绩登记表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 班级名称 varchar(100) not null
- 年份 int not null
- 月份 int not null (1..12)
- 序号 int not null              -- 前端行序号
- 学生姓名 varchar(50)
- 科目考试信息 text             -- 科目+考试时间+教员姓名
- 考试成绩 varchar(50)
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


class 专业考试成绩登记表(AccountBase):
    __tablename__ = "专业考试成绩登记表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    学生姓名: Mapped[str | None] = mapped_column(String(50), nullable=True)
    科目考试信息: Mapped[str | None] = mapped_column(Text, nullable=True)
    考试成绩: Mapped[str | None] = mapped_column(String(50), nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "年份", "月份", "序号", name="uq_专业考试成绩_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_专业考试成绩_维度", "神殿名称", "班级名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[专业考试成绩登记表.__table__])
def init_major_exam_score_tables():
    _migrate()

def fetch_major_exam_score_rows(
    db: Session, *, 神殿名称: str, 班级名称: str, 年份: int, 月份: int
) -> List[专业考试成绩登记表]:
    _migrate()
    return (
        db.query(专业考试成绩登记表)
        .filter(
            专业考试成绩登记表.神殿名称 == 神殿名称,
            专业考试成绩登记表.班级名称 == 班级名称,
            专业考试成绩登记表.年份 == 年份,
            专业考试成绩登记表.月份 == 月份,
        )
        .order_by(专业考试成绩登记表.序号)
        .all()
    )

def replace_major_exam_score_rows(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入指定班级+年月的专业考试成绩登记表。
    兼容英文字段：serialNumber/studentName/subjectExamInfo/examScore
    跳过完全空白行与非数字序号（如“合计/平均”）。
    """
    _migrate()
    db.query(专业考试成绩登记表).filter(
        专业考试成绩登记表.神殿名称 == 神殿名称,
        专业考试成绩登记表.班级名称 == 班级名称,
        专业考试成绩登记表.年份 == 年份,
        专业考试成绩登记表.月份 == 月份,
    ).delete()

    def _to_int(val) -> int | None:
        try:
            return int(val)
        except Exception:
            return None

    for r in 行列表:
        序号 = r.get("序号")
        if 序号 is None:
            序号 = r.get("serialNumber")
        序号 = _to_int(序号)
        if 序号 is None:
            continue
        学生姓名 = (r.get("学生姓名") or r.get("studentName") or "").strip()
        科目考试信息 = (r.get("科目考试信息") or r.get("subjectExamInfo") or "").strip()
        考试成绩 = (r.get("考试成绩") or r.get("examScore") or "").strip()
        if not (学生姓名 or 科目考试信息 or 考试成绩):
            continue
        db.add(
            专业考试成绩登记表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                年份=年份,
                月份=月份,
                序号=序号,
                学生姓名=学生姓名,
                科目考试信息=科目考试信息,
                考试成绩=考试成绩,
            )
        )

    db.flush()
