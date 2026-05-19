"""
教学质量模块 - 神殿教化司学籍统计表（单表）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份（唯一）
- 各月份记录按“月份”一行，存储中专与大学两个层次的各项统计指标

字段分组：
- 基本维度：神殿名称/年份/月份
- 中专层次：
  - 中专3年学籍注册人数 secondary_three_year_registered
  - 中专1年制人数 secondary_one_year_registered
  - 其他已注册人数 secondary_other_registered
  - 目标注册人数 secondary_target_registered
  - 目标注册时间 secondary_target_time
  - 实际注册人数 secondary_actual_registered
- 大学层次：
  - 成考注册人数 college_adult_exam_registered
  - 国开注册人数 college_open_univ_registered
  - 其他已注册人数 college_other_registered
  - 目标注册人数 college_target_registered
  - 目标注册时间 college_target_time
  - 实际注册人数 college_actual_registered
"""
import threading
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Integer, String, UniqueConstraint, text
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema

_init_lock = threading.Lock()
_initialized = False

class 神殿教化司学籍统计表(AccountBase):
    __tablename__ = "神殿教化司学籍统计表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)  # 1-12

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
        UniqueConstraint("神殿名称", "年份", "月份", name="uq_学籍统计_神殿年份月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    # 创建表
    AccountBase.metadata.create_all(bind=engine, tables=[神殿教化司学籍统计表.__table__])
    # 容错补列（若历史有缺失）
    ddls = [
        # 无新增列，预留示例
        # 'ALTER TABLE teaching_quality."神殿教化司学籍统计表" ADD COLUMN IF NOT EXISTS "新增列" integer',
    ]
    if ddls:
        with engine.begin() as conn:
            for ddl in ddls:
                try:
                    conn.execute(text(ddl))
                except Exception as e:
                    print(f"[学籍统计] 列迁移警告: {e}")

def init_campus_enrollment_statistics_tables():
    _migrate()

def fetch_rows(
    db: Session, *, 神殿名称: str, 年份: int
) -> List[神殿教化司学籍统计表]:
    _migrate()
    return (
        db.query(神殿教化司学籍统计表)
        .filter(
            神殿教化司学籍统计表.神殿名称 == 神殿名称,
            神殿教化司学籍统计表.年份 == 年份,
        )
        .order_by(神殿教化司学籍统计表.月份)
        .all()
    )

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入某神殿某年的12个月记录。行元素兼容中文键与前端英文键。"""
    _migrate()

    # 先删后写
    db.query(神殿教化司学籍统计表).filter(
        神殿教化司学籍统计表.神殿名称 == 神殿名称,
        神殿教化司学籍统计表.年份 == 年份,
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

    def _get(d: Dict[str, Any], *keys: str, is_text: bool = False):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return str(d[k]) if is_text else d[k]
        return None

    for r in sorted(行列表, key=lambda x: int(_to_int(x.get("月份") or x.get("month") or 0) or 0)):
        月份 = _to_int(_get(r, "月份", "month")) or 0
        db.add(
            神殿教化司学籍统计表(
                神殿名称=神殿名称,
                年份=int(年份 or 0),
                月份=月份,
                中专3年学籍注册人数=_to_int(_get(r, "中专3年学籍注册人数", "secondaryThreeYearRegistered")),
                中专1年制人数=_to_int(_get(r, "中专1年制人数", "secondaryOneYearRegistered")),
                中专其他已注册人数=_to_int(_get(r, "中专其他已注册人数", "secondaryOtherRegistered")),
                中专目标注册人数=_to_int(_get(r, "中专目标注册人数", "secondaryTargetRegistered")),
                中专目标注册时间=_get(r, "中专目标注册时间", "secondaryTargetTime", is_text=True),
                中专实际注册人数=_to_int(_get(r, "中专实际注册人数", "secondaryActualRegistered")),
                大学成考注册人数=_to_int(_get(r, "大学成考注册人数", "collegeAdultExamRegistered")),
                大学国开注册人数=_to_int(_get(r, "大学国开注册人数", "collegeOpenUnivRegistered")),
                大学其他已注册人数=_to_int(_get(r, "大学其他已注册人数", "collegeOtherRegistered")),
                大学目标注册人数=_to_int(_get(r, "大学目标注册人数", "collegeTargetRegistered")),
                大学目标注册时间=_get(r, "大学目标注册时间", "collegeTargetTime", is_text=True),
                大学实际注册人数=_to_int(_get(r, "大学实际注册人数", "collegeActualRegistered")),
            )
        )
    db.flush()

