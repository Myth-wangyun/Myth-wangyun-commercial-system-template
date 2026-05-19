"""
教学质量模块-神殿-管理数据 - 教化司培训计划与成绩明细表（PostgreSQL teaching_quality schema）

最新需求：按“场次”管理，一次培训可能跨多天；场次命名为：1月第一次、1月第二次...

表设计：两张表
1) teaching_quality."教化司培训计划" （一条=一个场次）
2) teaching_quality."教化司培训成绩明细" （多条=该场次下人员成绩）

唯一键： (神殿名称, 场次名称)

提供：
- init_training_plan_score_tables()  建表/迁移（幂等）
- list_sessions(db, 神殿名称)  查询该神殿的所有场次
- generate_session_name(db, 神殿名称, 开始日期)  生成“X月第N次”
- get_plan_with_scores(db, 神殿名称, 场次名称)  查询
- upsert_plan_with_scores(db, payload)  按(神殿名称, 场次名称)覆盖写入（计划+明细）
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

# 关键：本项目在 init_db() 阶段会对 TQBase.metadata.clear() 进行清理，
# 这会导致后续在运行期（接口请求时）动态 import 本文件时，
# ForeignKey 解析不到目标表，从而抛 NoReferencedTableError。
# 因此这里需要确保目标表/明细表都已注册到同一个 metadata。
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema

# 说明：不要在模块 import 时做 autoload 反射（表可能尚未创建，会抛 NoSuchTableError）
# 外键引用的关键点是：目标表与明细表必须使用同一个 metadata（TQBase.metadata），
# 且 ForeignKey 字符串要与 schema_translate_map 的行为一致。
# 这里无需额外 Table(...) 反射注册。

# 如果本模块在运行期被动态导入，而 init_db() 里曾经 clear 过 TQBase.metadata，
# 这里会重新把目标表注册回 metadata（仅用于外键解析，不会发起数据库反射查询）。
# 注意：metadata.tables 的 key 通常是 "schema.table"（例如 teaching_quality.教化司培训计划），
# 不是带引号的 teaching_quality."教化司培训计划"。
# 因此外键解析报 NoReferencedTableError 时，需要确保正确 key 的 Table 已存在。
if 'teaching_quality.教化司培训计划' not in AccountBase.metadata.tables:
    Table(
        '教化司培训计划',
        AccountBase.metadata,
        Column('计划ID', Integer, primary_key=True),
        schema='teaching_quality',
        extend_existing=True,
    )

class 教化司培训计划(AccountBase):
    __tablename__ = "教化司培训计划"

    计划ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="计划ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")

    场次名称: Mapped[str] = mapped_column(String(100), nullable=False, comment="场次名称，如'1月第一次'")
    开始日期: Mapped[str] = mapped_column(String(20), nullable=False, comment="开始日期 YYYY-MM-DD")
    结束日期: Mapped[str] = mapped_column(String(20), nullable=False, comment="结束日期 YYYY-MM-DD")

    培训目标: Mapped[str | None] = mapped_column(Text, nullable=True, comment="培训目标")
    主要内容: Mapped[str | None] = mapped_column(Text, nullable=True, comment="主要内容")
    培训方式: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="培训方式")
    负责人: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="负责人")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        comment="更新时间",
    )

    __table_args__ = (
        UniqueConstraint("神殿名称", "场次名称", name="uq_教化司培训计划_神殿_场次"),
        Index("idx_教化司培训计划_神殿", "神殿名称"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

class 教化司培训成绩明细(AccountBase):
    __tablename__ = "教化司培训成绩明细"

    明细ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    计划ID: Mapped[int] = mapped_column(
        Integer,
        # 注意：此处无需用 academic + schema_translate_map。
        # 该模型本身已经声明 schema=teaching_quality（见 __table_args__），
        # 如果写 academic 会导致 create_all 阶段找不到 referred table 而抛 NoReferencedTableError。
        # 关键：ForeignKey 的字符串必须和 metadata 里目标表的 key/名称对应。
        # 使用 teaching_quality.教化司培训计划.计划ID（不带引号）可避免动态导入时找不到 referred table。
        ForeignKey('teaching_quality.教化司培训计划.计划ID', ondelete="CASCADE"),
        nullable=False,
        comment="计划ID",
    )

    培训人: Mapped[str] = mapped_column(String(100), nullable=False, comment="培训人（班主任姓名）")
    成绩: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True, comment="成绩")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        comment="更新时间",
    )

    __table_args__ = (
        Index("idx_教化司培训成绩明细_计划", "计划ID"),
        Index("idx_教化司培训成绩明细_培训人", "培训人"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate_training_plan_score_tables() -> None:
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(
        bind=engine, tables=[教化司培训计划.__table__, 教化司培训成绩明细.__table__]
    )

def init_training_plan_score_tables() -> None:
    _migrate_training_plan_score_tables()

def list_sessions(db: Session, *, 神殿名称: str) -> List[教化司培训计划]:
    _migrate_training_plan_score_tables()
    return (
        db.query(教化司培训计划)
        .filter(教化司培训计划.神殿名称 == 神殿名称)
        .order_by(教化司培训计划.开始日期.desc(), 教化司培训计划.计划ID.desc())
        .all()
    )

def generate_session_name(db: Session, *, 神殿名称: str, 开始日期: str) -> str:
    """生成形如：1月第一次、1月第二次...

    逻辑：统计同神殿、同“开始日期所在月份”已有多少场次 + 1
    """
    _migrate_training_plan_score_tables()
    try:
        dt = datetime.strptime(开始日期, "%Y-%m-%d")
        month = dt.month
        # 用 LIKE 匹配 "{month}月第" 开头
        prefix = f"{month}月第"
        count = (
            db.query(教化司培训计划)
            .filter(
                教化司培训计划.神殿名称 == 神殿名称,
                教化司培训计划.场次名称.like(f"{prefix}%"),
            )
            .count()
        )
        return f"{month}月第{count + 1}次"
    except Exception:
        # 兜底
        return "新场次"

def get_plan_with_scores(
    db: Session, *, 神殿名称: str, 场次名称: str
) -> Tuple[Optional[教化司培训计划], List[教化司培训成绩明细]]:
    _migrate_training_plan_score_tables()
    plan = (
        db.query(教化司培训计划)
        .filter(教化司培训计划.神殿名称 == 神殿名称, 教化司培训计划.场次名称 == 场次名称)
        .first()
    )
    if not plan:
        return None, []

    details = (
        db.query(教化司培训成绩明细)
        .filter(教化司培训成绩明细.计划ID == plan.计划ID)
        .order_by(教化司培训成绩明细.明细ID.asc())
        .all()
    )
    return plan, details

def upsert_plan_with_scores(
    db: Session,
    *,
    神殿名称: str,
    场次名称: str,
    开始日期: str,
    结束日期: str,
    培训目标: str = "",
    主要内容: str = "",
    培训方式: str = "",
    负责人: str = "",
    明细列表: List[Dict[str, Any]],
) -> None:
    """按(神殿名称, 场次名称)覆盖写入。

    明细元素：{"培训人": "xxx", "成绩": 88.5}
    """
    _migrate_training_plan_score_tables()

    plan = (
        db.query(教化司培训计划)
        .filter(教化司培训计划.神殿名称 == 神殿名称, 教化司培训计划.场次名称 == 场次名称)
        .first()
    )

    if not plan:
        plan = 教化司培训计划(
            神殿名称=神殿名称,
            场次名称=场次名称,
            开始日期=开始日期,
            结束日期=结束日期,
            培训目标=培训目标,
            主要内容=主要内容,
            培训方式=培训方式,
            负责人=负责人,
        )
        db.add(plan)
        db.flush()  # 获取 plan.计划ID
    else:
        plan.开始日期 = 开始日期
        plan.结束日期 = 结束日期
        plan.培训目标 = 培训目标
        plan.主要内容 = 主要内容
        plan.培训方式 = 培训方式
        plan.负责人 = 负责人
        db.flush()

        # 删除旧明细
        db.query(教化司培训成绩明细).filter(教化司培训成绩明细.计划ID == plan.计划ID).delete()

    # 插入新明细
    for item in 明细列表 or []:
        trainee = (item.get("培训人") or "").strip()
        if not trainee:
            continue
        score = item.get("成绩")
        db.add(教化司培训成绩明细(计划ID=plan.计划ID, 培训人=trainee, 成绩=score))
