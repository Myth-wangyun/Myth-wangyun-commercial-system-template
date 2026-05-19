"""
教学质量模块 - 班级强化期就业计划与监督表（单表实现）
Schema: teaching_quality

维度：神殿名称 + 班级名称 + 序号
- 表头元信息（需就业人数/强化周期/毕业时间/就业周期/目标平均薪资/负责班主任/负责教员）与每一行一起存入（去规范化）
- 行字段：日期/星期/工作内容/形式地点/工作目标/如何做/实际工作结果/后期跟进目标/参与人/组织者/监督人/评价结果
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Integer, String, Text, inspect, text
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 班级强化期计划监督表(AccountBase):
    __tablename__ = "班级强化期计划监督表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    # 表头元信息（冗余到每行）
    需就业人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    强化周期: Mapped[str | None] = mapped_column(String(50), nullable=True)
    毕业时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    就业周期: Mapped[str | None] = mapped_column(String(100), nullable=True)
    目标平均薪资: Mapped[int | None] = mapped_column(Integer, nullable=True)
    负责班主任: Mapped[str | None] = mapped_column(String(50), nullable=True)
    负责教员: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # 行字段
    日期: Mapped[str | None] = mapped_column(String(50), nullable=True)
    星期: Mapped[str | None] = mapped_column(String(10), nullable=True)
    工作内容: Mapped[str | None] = mapped_column(Text, nullable=True)
    形式地点: Mapped[str | None] = mapped_column(String(160), nullable=True)
    工作目标: Mapped[str | None] = mapped_column(Text, nullable=True)
    如何做: Mapped[str | None] = mapped_column(Text, nullable=True)
    实际工作结果: Mapped[str | None] = mapped_column(Text, nullable=True)
    后期跟进目标: Mapped[str | None] = mapped_column(Text, nullable=True)
    参与人: Mapped[str | None] = mapped_column(Text, nullable=True)
    组织者: Mapped[str | None] = mapped_column(String(100), nullable=True)
    监督人: Mapped[str | None] = mapped_column(String(100), nullable=True)
    评价结果: Mapped[str | None] = mapped_column(Text, nullable=True)

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
    # 先清理可能遗留的唯一约束/索引，避免 create_all 再次创建时冲突
    if inspect(engine).has_table("班级强化期计划监督表", schema="teaching_quality"):
        with engine.begin() as conn:
            try:
                conn.execute(text('ALTER TABLE teaching_quality."班级强化期计划监督表" DROP CONSTRAINT IF EXISTS "uq_强化期计划监督_维度序号"'))
            except Exception as e:
                print(f"[强化期计划监督] 约束清理警告: {e}")
            try:
                conn.execute(text('DROP INDEX IF EXISTS teaching_quality."idx_强化期计划监督_维度"'))
            except Exception as e:
                print(f"[强化期计划监督] 索引清理警告: {e}")

    # 创建表
    AccountBase.metadata.create_all(bind=engine, tables=[班级强化期计划监督表.__table__])

def init_class_intensify_plan_supervision_tables():
    _migrate()

def fetch_rows(
    db: Session, *, 神殿名称: str, 班级名称: str
) -> List[班级强化期计划监督表]:
    _migrate()
    return (
        db.query(班级强化期计划监督表)
        .filter(
            班级强化期计划监督表.神殿名称 == 神殿名称,
            班级强化期计划监督表.班级名称 == 班级名称,
        )
        .order_by(班级强化期计划监督表.序号)
        .all()
    )

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    行列表: List[Dict[str, Any]],
    需就业人数: Optional[int] = None,
    强化周期: Optional[str] = None,
    毕业时间: Optional[str] = None,
    就业周期: Optional[str] = None,
    目标平均薪资: Optional[int] = None,
    负责班主任: Optional[str] = None,
    负责教员: Optional[str] = None,
):
    _migrate()
    db.query(班级强化期计划监督表).filter(
        班级强化期计划监督表.神殿名称 == 神殿名称,
        班级强化期计划监督表.班级名称 == 班级名称,
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
        需就业人数=_to_int(需就业人数),
        强化周期=强化周期 or None,
        毕业时间=毕业时间 or None,
        就业周期=就业周期 or None,
        目标平均薪资=_to_int(目标平均薪资),
        负责班主任=负责班主任 or None,
        负责教员=负责教员 or None,
    )

    for r in sorted(行列表, key=lambda x: x.get("序号") or x.get("serialNumber") or 0):
        序号 = _to_int(r.get("序号") or r.get("serialNumber")) or 0
        日期 = (r.get("日期") or r.get("date") or None)
        星期 = (r.get("星期") or r.get("weekday") or None)
        工作内容 = (r.get("工作内容") or r.get("workContent") or None)
        形式地点 = (r.get("形式/地点") or r.get("formOrLocation") or None)
        工作目标 = (r.get("工作目标") or r.get("workTarget") or None)
        如何做 = (r.get("如何做") or r.get("howToDo") or None)
        实际工作结果 = (r.get("实际工作结果") or r.get("result") or None)
        后期跟进目标 = (r.get("后期跟进目标") or r.get("followUpTarget") or None)
        参与人 = (r.get("参与人") or r.get("participants") or None)
        组织者 = (r.get("组织者") or r.get("organizer") or None)
        监督人 = (r.get("监督人") or r.get("supervisor") or None)
        评价结果 = (r.get("评价结果") or r.get("evaluation") or None)

        db.add(
            班级强化期计划监督表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                序号=序号,
                **meta,
                日期=日期,
                星期=星期,
                工作内容=工作内容,
                形式地点=形式地点,
                工作目标=工作目标,
                如何做=如何做,
                实际工作结果=实际工作结果,
                后期跟进目标=后期跟进目标,
                参与人=参与人,
                组织者=组织者,
                监督人=监督人,
                评价结果=评价结果,
            )
        )

    db.flush()
