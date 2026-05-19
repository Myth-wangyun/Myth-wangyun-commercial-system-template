"""
教学质量模块 - 入职计划与监督表（单表实现，支持动态日记录）
Schema: teaching_quality

维度：神殿名称 + 班级名称 + 年份 + 月份 + 序号
- 行固定字段：姓名/性别/目前年龄/现有学历/预计就业地区/目标岗位/目标薪资/负责班主任/负责教员
- 动态字段：日记录（JSONB，key 为前端各日期或周总结键，如 oct1、octWeek1、nov1...）
- 表头说明：描述（放到每行冗余或配置表，这里简化为每行存一份，读取时以第一行的描述为主）
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Integer, String, Text, inspect, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 入职计划监督表(AccountBase):
    __tablename__ = "入职计划监督表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    # 行固定字段
    姓名: Mapped[str | None] = mapped_column(String(50), nullable=True)
    性别: Mapped[str | None] = mapped_column(String(10), nullable=True)
    目前年龄: Mapped[str | None] = mapped_column(String(20), nullable=True)
    现有学历: Mapped[str | None] = mapped_column(String(50), nullable=True)
    预计就业地区: Mapped[str | None] = mapped_column(String(100), nullable=True)
    目标岗位: Mapped[str | None] = mapped_column(Text, nullable=True)
    目标薪资: Mapped[str | None] = mapped_column(String(50), nullable=True)
    负责班主任: Mapped[str | None] = mapped_column(String(50), nullable=True)
    负责教员: Mapped[str | None] = mapped_column(String(50), nullable=True)

    日记录: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)  # { key: string }
    描述: Mapped[str | None] = mapped_column(Text, nullable=True)

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
    # 清理历史残留（容错）
    if inspect(engine).has_table("入职计划监督表", schema="teaching_quality"):
        with engine.begin() as conn:
            for ddl in [
                'ALTER TABLE teaching_quality."入职计划监督表" DROP CONSTRAINT IF EXISTS "uq_入职计划监督_维度序号"',
                'DROP INDEX IF EXISTS teaching_quality."idx_入职计划监督_维度"',
            ]:
                try:
                    conn.execute(text(ddl))
                except Exception as e:
                    print(f"[入职计划监督] 清理警告: {e}")
    # 创建表
    AccountBase.metadata.create_all(bind=engine, tables=[入职计划监督表.__table__])

def init_class_onboarding_plan_supervision_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 班级名称: str, 年份: int, 月份: int) -> List[入职计划监督表]:
    _migrate()
    return (
        db.query(入职计划监督表)
        .filter(
            入职计划监督表.神殿名称 == 神殿名称,
            入职计划监督表.班级名称 == 班级名称,
            入职计划监督表.年份 == 年份,
            入职计划监督表.月份 == 月份,
        )
        .order_by(入职计划监督表.序号)
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
    描述: Optional[str] = None,
):
    _migrate()
    db.query(入职计划监督表).filter(
        入职计划监督表.神殿名称 == 神殿名称,
        入职计划监督表.班级名称 == 班级名称,
        入职计划监督表.年份 == 年份,
        入职计划监督表.月份 == 月份,
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

    for r in sorted(行列表, key=lambda x: x.get("序号") or x.get("serialNumber") or 0):
        序号 = _to_int(r.get("序号") or r.get("serialNumber")) or 0
        姓名 = (r.get("姓名") or r.get("name") or None)
        性别 = (r.get("性别") or r.get("gender") or None)
        目前年龄 = (r.get("目前年龄") or r.get("currentAge") or None)
        现有学历 = (r.get("现有学历") or r.get("currentEducation") or None)
        预计就业地区 = (r.get("预计就业地区") or r.get("targetRegion") or None)
        目标岗位 = (r.get("目标岗位") or r.get("targetPosition") or None)
        目标薪资 = (r.get("目标薪资") or r.get("targetSalary") or None)
        负责班主任 = (r.get("负责班主任") or r.get("headTeacher") or None)
        负责教员 = (r.get("负责教员") or r.get("teacher") or None)

        # 将动态键统一收集到日记录
        exclude_keys = {
            "序号","serialNumber","姓名","name","性别","gender","目前年龄","currentAge","现有学历","currentEducation",
            "预计就业地区","targetRegion","目标岗位","targetPosition","目标薪资","targetSalary",
            "负责班主任","headTeacher","负责教员","teacher",
        }
        日记录: Dict[str, Any] = {}
        for k, v in (r or {}).items():
            if k in exclude_keys:
                continue
            if v is None or (isinstance(v, str) and v.strip() == ""):
                continue
            日记录[k] = v

        db.add(
            入职计划监督表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                年份=int(年份 or 0),
                月份=int(月份 or 0),
                序号=序号,
                姓名=姓名,
                性别=性别,
                目前年龄=目前年龄,
                现有学历=现有学历,
                预计就业地区=预计就业地区,
                目标岗位=目标岗位,
                目标薪资=目标薪资,
                负责班主任=负责班主任,
                负责教员=负责教员,
                日记录=日记录 or None,
                描述=描述 or None,
            )
        )

    db.flush()
