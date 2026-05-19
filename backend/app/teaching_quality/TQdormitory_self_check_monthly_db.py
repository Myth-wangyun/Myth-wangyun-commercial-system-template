"""
教学质量模块 - 宿舍管理（月度）自查统计 表与辅助函数
Schema: teaching_quality

表：teaching_quality."宿舍管理月度自查统计表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 年份 int not null
- 月份 int not null (1..12)
- 管理老师 varchar(50) not null
- 序号 int not null
- 宿舍名称 varchar(100)
- 住宿人数 int
- 是否有投诉或重大事故 varchar(10)   -- 是/否
- 是否每日正常查寝 varchar(10)       -- 是/否
- 是否按时都已收取住宿费 varchar(10)  -- 是/否
- 是否每周开宿舍会 varchar(10)        -- 是/否
- 是否每周检查卫生 varchar(10)        -- 是/否
- 是否及时解决宿舍问题 text
- 学员纪律 text
- 备注 text
唯一：神殿名称 + 年份 + 月份 + 管理老师 + 序号
索引：神殿名称 + 年份 + 月份
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 宿舍管理月度自查统计表(AccountBase):
    __tablename__ = "宿舍管理月度自查统计表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    管理老师: Mapped[str] = mapped_column(String(50), nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    宿舍名称: Mapped[str | None] = mapped_column(String(100), nullable=True)
    住宿人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    是否有投诉或重大事故: Mapped[str | None] = mapped_column(String(10), nullable=True)
    是否每日正常查寝: Mapped[str | None] = mapped_column(String(10), nullable=True)
    是否按时都已收取住宿费: Mapped[str | None] = mapped_column(String(10), nullable=True)
    是否每周开宿舍会: Mapped[str | None] = mapped_column(String(10), nullable=True)
    是否每周检查卫生: Mapped[str | None] = mapped_column(String(10), nullable=True)
    是否及时解决宿舍问题: Mapped[str | None] = mapped_column(Text, nullable=True)
    学员纪律: Mapped[str | None] = mapped_column(Text, nullable=True)
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "管理老师", "序号", name="uq_宿舍自查_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_宿舍自查_维度", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[宿舍管理月度自查统计表.__table__])
def init_dormitory_self_check_tables():
    _migrate()

def fetch_dormitory_self_check_rows(
    db: Session, *, 神殿名称: str, 年份: int, 月份: int
) -> List[宿舍管理月度自查统计表]:
    _migrate()
    return (
        db.query(宿舍管理月度自查统计表)
        .filter(
            宿舍管理月度自查统计表.神殿名称 == 神殿名称,
            宿舍管理月度自查统计表.年份 == 年份,
            宿舍管理月度自查统计表.月份 == 月份,
        )
        .order_by(宿舍管理月度自查统计表.管理老师, 宿舍管理月度自查统计表.序号)
        .all()
    )

def replace_dormitory_self_check_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入指定维度的数据。
    行列表元素示例（对应前端一行）：
    {
      "管理老师": "张", "序号": 1, "宿舍名称": "A1-101", "住宿人数": 6,
      "是否有投诉或重大事故": "是/否", "是否每日正常查寝": "是/否", "是否按时都已收取住宿费": "是/否",
      "是否每周开宿舍会": "是/否", "是否每周检查卫生": "是/否",
      "是否及时解决宿舍问题": "...", "学员纪律": "...", "备注": "..."
    }
    """
    _migrate()
    db.query(宿舍管理月度自查统计表).filter(
        宿舍管理月度自查统计表.神殿名称 == 神殿名称,
        宿舍管理月度自查统计表.年份 == 年份,
        宿舍管理月度自查统计表.月份 == 月份,
    ).delete()

    for r in sorted(行列表, key=lambda x: (str(x.get("管理老师", "")), int(x.get("序号", 0)))):
        # 住宿人数可为字符串，尝试转 int
        def _to_int(v):
            try:
                return int(v) if v not in (None, "", "-") else None
            except Exception:
                return None

        db.add(
            宿舍管理月度自查统计表(
                神殿名称=神殿名称,
                年份=年份,
                月份=月份,
                管理老师=str(r.get("管理老师") or r.get("manager") or ""),
                序号=int(r.get("序号") or r.get("serialNumber") or 0),
                宿舍名称=r.get("宿舍名称") or r.get("dormitoryName"),
                住宿人数=_to_int(r.get("住宿人数") or r.get("residentsCount")),
                是否有投诉或重大事故=r.get("是否有投诉或重大事故") or r.get("hasComplaintOrAccident"),
                是否每日正常查寝=r.get("是否每日正常查寝") or r.get("dailyCheck"),
                是否按时都已收取住宿费=r.get("是否按时都已收取住宿费，收支正常") or r.get("feeCollectedOnTime"),
                是否每周开宿舍会=r.get("是否每周开宿舍会") or r.get("weeklyMeeting"),
                是否每周检查卫生=r.get("是否每周检查卫生，卫生干净整洁") or r.get("weeklySanitationCheck"),
                是否及时解决宿舍问题=r.get("是否及时解决宿舍问题") or r.get("issuesResolvedTimely"),
                学员纪律=r.get("学员纪律") or r.get("discipline"),
                备注=r.get("备注") or r.get("remark"),
            )
        )
    db.flush()

