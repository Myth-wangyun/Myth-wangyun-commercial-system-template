"""
教学质量模块 - 神殿教化司个人负责学籍统计表（单表）
Schema: teaching_quality

维度：神殿名称 + 年份 + 序号（同一表内可存多位“负责人”行）
- 字段按照前端 2-campus-personal-enrollment-statistics-summary.tsx 一一对应
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Index, Integer, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 神殿个人负责学籍统计表(AccountBase):
    __tablename__ = "神殿个人负责学籍统计表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    序号: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    姓名: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # 中专层次
    中专3年学籍注册人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    中专1年制人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    中专其他已注册人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    中专目标注册人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    中专目标注册时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    中专实际注册人数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 大学层次
    大学成考注册人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    大学国开注册人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    大学其他已注册人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    大学目标注册人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    大学目标注册时间: Mapped[str | None] = mapped_column(String(50), nullable=True)
    大学实际注册人数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "序号", name="uq_个人负责学籍_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_个人负责学籍_神殿年份", "神殿名称", "年份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[神殿个人负责学籍统计表.__table__])
    # 预留列迁移（当前无）
    ddls: list[str] = []
    if ddls:
        with engine.begin() as conn:
            for ddl in ddls:
                try:
                    conn.execute(text(ddl))
                except Exception as e:
                    print(f"[个人负责学籍] 列迁移警告: {e}")

def init_campus_personal_enrollment_statistics_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[神殿个人负责学籍统计表]:
    _migrate()
    return (
        db.query(神殿个人负责学籍统计表)
        .filter(
            神殿个人负责学籍统计表.神殿名称 == 神殿名称,
            神殿个人负责学籍统计表.年份 == 年份,
        )
        .order_by(神殿个人负责学籍统计表.序号)
        .all()
    )

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入某神殿某年的个人负责学籍统计行。
    兼容中文键与前端英文键名。
    """
    _migrate()

    db.query(神殿个人负责学籍统计表).filter(
        神殿个人负责学籍统计表.神殿名称 == 神殿名称,
        神殿个人负责学籍统计表.年份 == 年份,
    ).delete()

    def _to_int(v) -> Optional[int]:
        try:
            if v is None or v == "":
                return None
            return int(str(v))
        except Exception:
            try:
                return int(float(v))
            except Exception:
                return None

    def _get(d: Dict[str, Any], *keys: str, text_only: bool = False):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return str(d[k]) if text_only else d[k]
        return None

    for r in sorted(行列表, key=lambda x: int(_to_int(x.get("序号") or x.get("serialNumber") or 0) or 0)):
        序号 = _to_int(_get(r, "序号", "serialNumber")) or 0
        db.add(
            神殿个人负责学籍统计表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                序号=序号,
                姓名=_get(r, "姓名", "name", text_only=True),
                中专3年学籍注册人数=_to_int(_get(r, "中专3年学籍注册人数", "secondaryThreeYearRegistered")),
                中专1年制人数=_to_int(_get(r, "中专1年制人数", "secondaryOneYearRegistered")),
                中专其他已注册人数=_to_int(_get(r, "中专其他已注册人数", "secondaryOtherRegistered")),
                中专目标注册人数=_to_int(_get(r, "中专目标注册人数", "secondaryTargetRegistered")),
                中专目标注册时间=_get(r, "中专目标注册时间", "secondaryTargetTime", text_only=True),
                中专实际注册人数=_to_int(_get(r, "中专实际注册人数", "secondaryActualRegistered")),
                大学成考注册人数=_to_int(_get(r, "大学成考注册人数", "collegeAdultExamRegistered")),
                大学国开注册人数=_to_int(_get(r, "大学国开注册人数", "collegeOpenUnivRegistered")),
                大学其他已注册人数=_to_int(_get(r, "大学其他已注册人数", "collegeOtherRegistered")),
                大学目标注册人数=_to_int(_get(r, "大学目标注册人数", "collegeTargetRegistered")),
                大学目标注册时间=_get(r, "大学目标注册时间", "collegeTargetTime", text_only=True),
                大学实际注册人数=_to_int(_get(r, "大学实际注册人数", "collegeActualRegistered")),
            )
        )

    db.flush()

