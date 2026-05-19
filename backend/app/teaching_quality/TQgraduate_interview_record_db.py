"""
教学质量模块 - 毕业生访谈记录表 数据库与辅助函数
Schema: teaching_quality

表：teaching_quality."毕业生访谈记录表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 年份 int not null
- 月份 int not null (1..12)
- 序号 int not null
- 姓名 varchar(100)
- 班级 varchar(100)
- 咨询师 varchar(50)
- 学历 varchar(50)
- 籍贯 varchar(100)
- 入学时间 date
- 访谈时间 date
- 访谈记录 text (存储多条记录的文本块)
唯一：神殿名称 + 年份 + 月份 + 序号
索引：神殿名称 + 年份 + 月份
"""
from datetime import date, datetime
from datetime import date as pydate
from typing import Any, Dict, List

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 毕业生访谈记录表(AccountBase):
    __tablename__ = "毕业生访谈记录表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)
    班级: Mapped[str | None] = mapped_column(String(100), nullable=True)
    咨询师: Mapped[str | None] = mapped_column(String(50), nullable=True)
    学历: Mapped[str | None] = mapped_column(String(50), nullable=True)
    籍贯: Mapped[str | None] = mapped_column(String(100), nullable=True)
    入学时间: Mapped[date | None] = mapped_column(Date, nullable=True)
    访谈时间: Mapped[date | None] = mapped_column(Date, nullable=True)
    访谈记录: Mapped[str | None] = mapped_column(Text, nullable=True)
    班主任: Mapped[str | None] = mapped_column(String(50), nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "班主任", "序号", name="uq_毕业生访谈记录_维度班主任序号"),
        Index("idx_毕业生访谈记录_维度", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[毕业生访谈记录表.__table__])

    # --- 修复历史遗留唯一约束 ---
    # 旧唯一约束：uq_毕业生访谈记录_维度序号 (神殿名称+年份+月份+序号)
    # 新唯一约束：uq_毕业生访谈记录_维度班主任序号 (神殿名称+年份+月份+班主任+序号)
    # 仅修改 ORM 的 UniqueConstraint 不会自动改数据库中的旧约束，因此这里做幂等迁移。
    with engine.begin() as conn:

        # 1) drop old constraint if exists
        conn.execute(
            text(
                'DO $$ BEGIN '
                "IF EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid=t.oid JOIN pg_namespace n ON n.oid=t.relnamespace "
                "WHERE c.conname='uq_毕业生访谈记录_维度序号' AND n.nspname='teaching_quality' AND t.relname='毕业生访谈记录表') THEN "
                "EXECUTE 'ALTER TABLE teaching_quality.\"毕业生访谈记录表\" DROP CONSTRAINT \"uq_毕业生访谈记录_维度序号\"'; "
                'END IF; '
                'END $$;'
            )
        )

        # 2) create new constraint if not exists
        conn.execute(
            text(
                'DO $$ BEGIN '
                "IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_class t ON c.conrelid=t.oid JOIN pg_namespace n ON n.oid=t.relnamespace "
                "WHERE c.conname='uq_毕业生访谈记录_维度班主任序号' AND n.nspname='teaching_quality' AND t.relname='毕业生访谈记录表') THEN "
                "EXECUTE 'ALTER TABLE teaching_quality.\"毕业生访谈记录表\" ADD CONSTRAINT \"uq_毕业生访谈记录_维度班主任序号\" UNIQUE (\"神殿名称\", \"年份\", \"月份\", \"班主任\", \"序号\")'; "
                'END IF; '
                'END $$;'
            )
        )

def init_graduate_interview_tables():
    _migrate()

def _to_date(val):
    if isinstance(val, pydate):
        return val
    if isinstance(val, str) and val:
        try:
            return pydate.fromisoformat(val)
        except Exception:
            return None
    return None

def fetch_interview_rows(
    db: Session, *, 神殿名称: str, 年份: int, 月份: int, 班主任: str | None = None
) -> List[毕业生访谈记录表]:
    _migrate()
    q = (
        db.query(毕业生访谈记录表)
        .filter(
            毕业生访谈记录表.神殿名称 == 神殿名称,
            毕业生访谈记录表.年份 == 年份,
            毕业生访谈记录表.月份 == 月份,
        )
    )
    if 班主任:
        q = q.filter(毕业生访谈记录表.班主任 == 班主任)
    return q.order_by(毕业生访谈记录表.序号).all()

def replace_interview_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    _migrate()

    # 重要：毕业生访谈记录按“神殿+年月+班主任”维度分别保存。
    # 旧逻辑只按“神殿+年月”整表覆盖，会导致不同班主任互相顶替。
    # 这里收集本次 payload 涉及到的班主任集合，逐个维度覆盖删除。
    teachers = sorted({(r.get("班主任") or "").strip() for r in (行列表 or [])})

    # 若 payload 未携带班主任（兼容历史数据），则仍按旧维度覆盖一次
    if not teachers or teachers == [""]:
        db.query(毕业生访谈记录表).filter(
            毕业生访谈记录表.神殿名称 == 神殿名称,
            毕业生访谈记录表.年份 == 年份,
            毕业生访谈记录表.月份 == 月份,
        ).delete()
    else:
        for t in teachers:
            db.query(毕业生访谈记录表).filter(
                毕业生访谈记录表.神殿名称 == 神殿名称,
                毕业生访谈记录表.年份 == 年份,
                毕业生访谈记录表.月份 == 月份,
                毕业生访谈记录表.班主任 == t,
            ).delete()

    for row in sorted(行列表, key=lambda x: x.get("序号", 0)):
        db.add(
            毕业生访谈记录表(
                神殿名称=神殿名称,
                年份=年份,
                月份=月份,
                序号=row.get("序号", 0),
                姓名=row.get("姓名"),
                班级=row.get("班级"),
                咨询师=row.get("咨询师"),
                学历=row.get("学历"),
                籍贯=row.get("籍贯"),
                入学时间=_to_date(row.get("入学时间")),
                访谈时间=_to_date(row.get("访谈时间")),
                访谈记录=row.get("访谈记录"),
                班主任=row.get("班主任"),
            )
        )
    db.flush()
