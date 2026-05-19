"""
教学质量模块 - 学员压力面试成绩登记表（单表实现）
Schema: teaching_quality

说明：
- 采用单表按“神殿+专业+班级+课程+年份+月份+学号”维度唯一；
- 每条记录为“1名学员在当月一次面试周期内的5个项目评分集”；
- 表头信息（强化人数/面试次数/应面/实面/合格/教员/班主任）重复写入每条记录，便于单表实现；
- 平均分可以由后端/前端计算，这里也保存一份，便于直接查询。
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 学员压力面试成绩登记表(AccountBase):
    __tablename__ = "学员压力面试成绩登记表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    专业名称: Mapped[str | None] = mapped_column(String(100), nullable=True)
    班级名称: Mapped[str | None] = mapped_column(String(100), nullable=True)
    课程名称: Mapped[str | None] = mapped_column(String(100), nullable=True)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)

    学号: Mapped[str] = mapped_column(String(50), nullable=False)
    学员姓名: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # 表头统计信息（冗余到每条记录以保证单表设计）
    强化人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    面试次数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    应面试数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际面试数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    合格数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    教员姓名: Mapped[str | None] = mapped_column(String(50), nullable=True)
    班主任姓名: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # 项目1~5：日期+教员1/2/3+班主任1/2+平均
    项目1日期: Mapped[str | None] = mapped_column(String(20), nullable=True)
    项目1教员1分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目1教员2分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目1教员3分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目1班主任1分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目1班主任2分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目1平均分: Mapped[float | None] = mapped_column(Float, nullable=True)

    项目2日期: Mapped[str | None] = mapped_column(String(20), nullable=True)
    项目2教员1分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目2教员2分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目2教员3分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目2班主任1分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目2班主任2分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目2平均分: Mapped[float | None] = mapped_column(Float, nullable=True)

    项目3日期: Mapped[str | None] = mapped_column(String(20), nullable=True)
    项目3教员1分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目3教员2分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目3教员3分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目3班主任1分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目3班主任2分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目3平均分: Mapped[float | None] = mapped_column(Float, nullable=True)

    项目4日期: Mapped[str | None] = mapped_column(String(20), nullable=True)
    项目4教员1分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目4教员2分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目4教员3分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目4班主任1分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目4班主任2分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目4平均分: Mapped[float | None] = mapped_column(Float, nullable=True)

    项目5日期: Mapped[str | None] = mapped_column(String(20), nullable=True)
    项目5教员1分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目5教员2分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目5教员3分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目5班主任1分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目5班主任2分: Mapped[float | None] = mapped_column(Float, nullable=True)
    项目5平均分: Mapped[float | None] = mapped_column(Float, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "专业名称", "班级名称", "课程名称", "年份", "月份", "学号", name="uq_压力面试成绩_维度学号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_压力面试成绩_维度", "神殿名称", "专业名称", "班级名称", "课程名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[学员压力面试成绩登记表.__table__])
def init_class_pressure_interview_score_tables():
    _migrate()

def fetch_class_pressure_interview_rows(
    db: Session,
    *,
    神殿名称: str,
    专业名称: str,
    班级名称: str,
    课程名称: str,
    年份: int,
    月份: int,
) -> List[学员压力面试成绩登记表]:
    _migrate()
    q = (
        db.query(学员压力面试成绩登记表)
        .filter(
            学员压力面试成绩登记表.神殿名称 == 神殿名称,
            学员压力面试成绩登记表.专业名称 == 专业名称,
            学员压力面试成绩登记表.班级名称 == 班级名称,
            学员压力面试成绩登记表.课程名称 == 课程名称,
            学员压力面试成绩登记表.年份 == 年份,
            学员压力面试成绩登记表.月份 == 月份,
        )
        .order_by(学员压力面试成绩登记表.学号)
    )
    return q.all()

def replace_class_pressure_interview_rows(
    db: Session,
    *,
    神殿名称: str,
    专业名称: str,
    班级名称: str,
    课程名称: str,
    年份: int,
    月份: int,
    表头: Dict[str, Any],
    行列表: List[Dict[str, Any]],
):
    """按维度覆盖写入。
    表头：{"强化人数":int, "面试次数":int, "应面试数量":int, "实际面试数量":int, "合格数量":int, "教员姓名":str, "班主任姓名":str}
    行列表示例（每行一个学员）：
    {
      "学号":"...", "学员姓名":"...",
      "项目1": {"日期":"2024/7/1", "教员1分":80, "教员2分":85, "教员3分":90, "班主任1分":88, "班主任2分":87, "平均分":86.0},
      ... 项目2..项目5 同结构
    }
    """
    _migrate()
    db.query(学员压力面试成绩登记表).filter(
        学员压力面试成绩登记表.神殿名称 == 神殿名称,
        学员压力面试成绩登记表.专业名称 == 专业名称,
        学员压力面试成绩登记表.班级名称 == 班级名称,
        学员压力面试成绩登记表.课程名称 == 课程名称,
        学员压力面试成绩登记表.年份 == 年份,
        学员压力面试成绩登记表.月份 == 月份,
    ).delete()

    def _get(p: Dict[str, Any], k: str):
        return None if p is None else p.get(k)

    for r in 行列表:
        # 跳过学号为空的行，避免唯一约束冲突
        sid = (r.get("学号") or r.get("studentId") or "").strip()
        if not sid:
            continue
        p1 = r.get("项目1") or {}
        p2 = r.get("项目2") or {}
        p3 = r.get("项目3") or {}
        p4 = r.get("项目4") or {}
        p5 = r.get("项目5") or {}
        db.add(
            学员压力面试成绩登记表(
                神殿名称=神殿名称,
                专业名称=专业名称,
                班级名称=班级名称,
                课程名称=课程名称,
                年份=年份,
                月份=月份,
                学号=sid,
                学员姓名=(r.get("学员姓名") or r.get("studentName")),
                强化人数=表头.get("强化人数"),
                面试次数=表头.get("面试次数"),
                应面试数量=表头.get("应面试数量"),
                实际面试数量=表头.get("实际面试数量"),
                合格数量=表头.get("合格数量"),
                教员姓名=表头.get("教员姓名"),
                班主任姓名=表头.get("班主任姓名"),
                项目1日期=_get(p1, "日期"),
                项目1教员1分=_get(p1, "教员1分"),
                项目1教员2分=_get(p1, "教员2分"),
                项目1教员3分=_get(p1, "教员3分"),
                项目1班主任1分=_get(p1, "班主任1分"),
                项目1班主任2分=_get(p1, "班主任2分"),
                项目1平均分=_get(p1, "平均分"),
                项目2日期=_get(p2, "日期"),
                项目2教员1分=_get(p2, "教员1分"),
                项目2教员2分=_get(p2, "教员2分"),
                项目2教员3分=_get(p2, "教员3分"),
                项目2班主任1分=_get(p2, "班主任1分"),
                项目2班主任2分=_get(p2, "班主任2分"),
                项目2平均分=_get(p2, "平均分"),
                项目3日期=_get(p3, "日期"),
                项目3教员1分=_get(p3, "教员1分"),
                项目3教员2分=_get(p3, "教员2分"),
                项目3教员3分=_get(p3, "教员3分"),
                项目3班主任1分=_get(p3, "班主任1分"),
                项目3班主任2分=_get(p3, "班主任2分"),
                项目3平均分=_get(p3, "平均分"),
                项目4日期=_get(p4, "日期"),
                项目4教员1分=_get(p4, "教员1分"),
                项目4教员2分=_get(p4, "教员2分"),
                项目4教员3分=_get(p4, "教员3分"),
                项目4班主任1分=_get(p4, "班主任1分"),
                项目4班主任2分=_get(p4, "班主任2分"),
                项目4平均分=_get(p4, "平均分"),
                项目5日期=_get(p5, "日期"),
                项目5教员1分=_get(p5, "教员1分"),
                项目5教员2分=_get(p5, "教员2分"),
                项目5教员3分=_get(p5, "教员3分"),
                项目5班主任1分=_get(p5, "班主任1分"),
                项目5班主任2分=_get(p5, "班主任2分"),
                项目5平均分=_get(p5, "平均分"),
            )
        )
    db.flush()
