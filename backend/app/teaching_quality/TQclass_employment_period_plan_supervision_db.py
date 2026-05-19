"""
教学质量模块 - 就业期/入职 计划与监督表（单表实现）
Schema: teaching_quality

维度：神殿名称 + 班级名称 + 年份 + 月份 + 序号
- 表头元信息（需就业人数/就业周期/目标平均薪资/负责班主任/负责教员）冗余到每行，便于单表查询
- 行字段：日期/形式地点/工作内容/工作目标/如何做/实际工作结果/班主任/教员/监督人/备注
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Integer, String, Text, inspect, text
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 就业期计划监督表(AccountBase):
    __tablename__ = "就业期计划监督表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    # 表头元信息（冗余到每行）
    需就业人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    就业周期: Mapped[str | None] = mapped_column(String(100), nullable=True)
    目标平均薪资: Mapped[int | None] = mapped_column(Integer, nullable=True)
    负责班主任: Mapped[str | None] = mapped_column(String(50), nullable=True)
    负责教员: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # 行字段
    日期: Mapped[str | None] = mapped_column(String(50), nullable=True)
    形式地点: Mapped[str | None] = mapped_column(String(160), nullable=True)
    工作内容: Mapped[str | None] = mapped_column(Text, nullable=True)
    工作目标: Mapped[str | None] = mapped_column(Text, nullable=True)
    如何做: Mapped[str | None] = mapped_column(Text, nullable=True)
    实际工作结果: Mapped[str | None] = mapped_column(Text, nullable=True)
    班主任: Mapped[str | None] = mapped_column(String(100), nullable=True)
    教员: Mapped[str | None] = mapped_column(String(100), nullable=True)
    监督人: Mapped[str | None] = mapped_column(String(100), nullable=True)
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    # 清理可能遗留的约束/索引（历史版本），容错处理
    if inspect(engine).has_table("就业期计划监督表", schema="teaching_quality"):
        with engine.begin() as conn:
            for ddl in [
                'ALTER TABLE teaching_quality."就业期计划监督表" DROP CONSTRAINT IF EXISTS "uq_就业期计划监督_维度序号"',
                'DROP INDEX IF EXISTS teaching_quality."idx_就业期计划监督_维度"',
            ]:
                try:
                    conn.execute(text(ddl))
                except Exception as e:
                    print(f"[就业期计划监督] 清理警告: {e}")
    # 创建表
    AccountBase.metadata.create_all(bind=engine, tables=[就业期计划监督表.__table__])

def init_class_employment_period_plan_supervision_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 班级名称: str, 年份: int, 月份: int) -> List[就业期计划监督表]:
    _migrate()
    return (
        db.query(就业期计划监督表)
        .filter(
            就业期计划监督表.神殿名称 == 神殿名称,
            就业期计划监督表.班级名称 == 班级名称,
            就业期计划监督表.年份 == 年份,
            就业期计划监督表.月份 == 月份,
        )
        .order_by(就业期计划监督表.序号)
        .all()
    )

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
    需就业人数: Optional[int] = None,
    就业周期: Optional[str] = None,
    目标平均薪资: Optional[int] = None,
    负责班主任: Optional[str] = None,
    负责教员: Optional[str] = None,
):
    _migrate()
    db.query(就业期计划监督表).filter(
        就业期计划监督表.神殿名称 == 神殿名称,
        就业期计划监督表.班级名称 == 班级名称,
        就业期计划监督表.年份 == 年份,
        就业期计划监督表.月份 == 月份,
    ).delete()

    def _to_int(v):
        try:
            if v is None or v == "":
                return None
            return int(str(v))
        except Exception:
            try:
                return int(float(v))
            except Exception:
                return None

    meta = dict(
        年份=int(年份 or 0),
        月份=int(月份 or 0),
        需就业人数=_to_int(需就业人数),
        就业周期=就业周期 or None,
        目标平均薪资=_to_int(目标平均薪资),
        负责班主任=负责班主任 or None,
        负责教员=负责教员 or None,
    )

    for r in sorted(行列表, key=lambda x: x.get("序号") or x.get("serialNumber") or 0):
        序号 = _to_int(r.get("序号") or r.get("serialNumber")) or 0
        日期 = (r.get("日期") or r.get("date") or None)
        形式地点 = (r.get("形式地点") or r.get("形式/地点") or r.get("formOrLocation") or None)
        工作内容 = (r.get("工作内容") or r.get("workContent") or None)
        工作目标 = (r.get("工作目标") or r.get("workTarget") or None)
        如何做 = (r.get("如何做") or r.get("howToDo") or None)
        实际工作结果 = (r.get("实际工作结果") or r.get("result") or None)
        班主任 = (r.get("班主任") or r.get("headTeacher") or None)
        教员 = (r.get("教员") or r.get("teacher") or None)
        监督人 = (r.get("监督人") or r.get("supervisor") or None)
        备注 = (r.get("备注") or r.get("remark") or None)

        db.add(
            就业期计划监督表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                序号=序号,
                **meta,
                日期=日期,
                形式地点=形式地点,
                工作内容=工作内容,
                工作目标=工作目标,
                如何做=如何做,
                实际工作结果=实际工作结果,
                班主任=班主任,
                教员=教员,
                监督人=监督人,
                备注=备注,
            )
        )

    db.flush()
