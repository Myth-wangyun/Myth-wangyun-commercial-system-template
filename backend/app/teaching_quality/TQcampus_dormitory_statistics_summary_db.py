"""
教学质量模块 - 神殿教化司现有宿舍统计表（月汇总，按年保存）
Schema: teaching_quality

维度：神殿名称 + 年份 + 月份（唯一）
说明：数据来源于“每月个人宿舍管理统计表”的按月汇总；本表可保存汇总结果与备注。
"""
import threading
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema

# 并发幂等保护，避免每次请求都触发表结构检查占用连接
_init_lock = threading.Lock()
_initialized = False

class 宿舍统计月汇总表(AccountBase):
    __tablename__ = "宿舍统计月汇总表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    月份: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    在校生数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    宿舍总数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    住宿总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    男宿总数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    男宿总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    男宿空床位总数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    适合男新生床位数: Mapped[int | None] = mapped_column(Integer, nullable=True)

    女宿总数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    女宿总人数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    女宿空床位总数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    适合女新生住宿床位: Mapped[int | None] = mapped_column(Integer, nullable=True)

    计划租宿舍数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际租宿舍数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    计划退宿舍数量: Mapped[int | None] = mapped_column(Integer, nullable=True)
    实际退宿舍数量: Mapped[int | None] = mapped_column(Integer, nullable=True)

    备注: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", name="uq_宿舍统计汇总_神殿年份月份"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_宿舍统计汇总_神殿年份", "神殿名称", "年份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    global _initialized
    if _initialized:
        return
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        _initialized = True
        return
    with _init_lock:
        if _initialized:
            return
        ensure_teaching_quality_schema()
        AccountBase.metadata.create_all(bind=engine, tables=[宿舍统计月汇总表.__table__], checkfirst=True)
    with engine.begin() as conn:
        _initialized = True

def init_campus_dormitory_statistics_summary_tables():
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: int) -> List[宿舍统计月汇总表]:
    _migrate()
    return (
        db.query(宿舍统计月汇总表)
        .filter(
            宿舍统计月汇总表.神殿名称 == 神殿名称,
            宿舍统计月汇总表.年份 == 年份,
        )
        .order_by(宿舍统计月汇总表.月份)
        .all()
    )

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    行列表: List[Dict[str, Any]],
):
    """使用批量 UPSERT 方式保存宿舍统计月汇总，大幅提高性能。"""
    _migrate()

    def _get(d: Dict[str, Any], *keys: str):
        for k in keys:
            if k in d and d[k] not in (None, ""):
                return d[k]
        return None

    # 使用 PostgreSQL 的批量 INSERT ... ON CONFLICT DO UPDATE 语法
    from sqlalchemy.dialects.postgresql import insert
    
    values_list = []
    for r in 行列表:
        月份 = int(_get(r, "月份", "month") or 0)
        if not 月份:
            continue
            
        values_list.append({
            "神殿名称": 神殿名称,
            "年份": int(年份 or 0),
            "月份": 月份,
            "在校生数": int(_get(r, "在校生数", "inSchoolCount") or 0),
            "宿舍总数量": int(_get(r, "宿舍总数量", "dormTotalCount") or 0),
            "住宿总人数": int(_get(r, "住宿总人数", "dormResidentCount") or 0),
            "男宿总数量": int(_get(r, "男宿总数量", "maleDormCount") or 0),
            "男宿总人数": int(_get(r, "男宿总人数", "maleDormResidentCount") or 0),
            "男宿空床位总数量": int(_get(r, "男宿空床位总数量", "maleEmptyBedCount") or 0),
            "适合男新生床位数": int(_get(r, "适合男新生床位数", "maleNewStudentBedCount") or 0),
            "女宿总数量": int(_get(r, "女宿总数量", "femaleDormCount") or 0),
            "女宿总人数": int(_get(r, "女宿总人数", "femaleDormResidentCount") or 0),
            "女宿空床位总数量": int(_get(r, "女宿空床位总数量", "femaleEmptyBedCount") or 0),
            "适合女新生住宿床位": int(_get(r, "适合女新生住宿床位", "femaleNewStudentBedCount") or 0),
            "计划租宿舍数量": int(_get(r, "计划租宿舍数量", "planRentDormCount") or 0),
            "实际租宿舍数量": int(_get(r, "实际租宿舍数量", "actualRentDormCount") or 0),
            "计划退宿舍数量": int(_get(r, "计划退宿舍数量", "planQuitDormCount") or 0),
            "实际退宿舍数量": int(_get(r, "实际退宿舍数量", "actualQuitDormCount") or 0),
            "备注": _get(r, "备注", "remark"),
        })
    
    if not values_list:
        return
    
    # 批量执行 UPSERT
    stmt = insert(宿舍统计月汇总表).values(values_list)
    
    # 定义冲突时的更新操作（排除主键和唯一约束字段）
    update_dict = {
        "在校生数": stmt.excluded.在校生数,
        "宿舍总数量": stmt.excluded.宿舍总数量,
        "住宿总人数": stmt.excluded.住宿总人数,
        "男宿总数量": stmt.excluded.男宿总数量,
        "男宿总人数": stmt.excluded.男宿总人数,
        "男宿空床位总数量": stmt.excluded.男宿空床位总数量,
        "适合男新生床位数": stmt.excluded.适合男新生床位数,
        "女宿总数量": stmt.excluded.女宿总数量,
        "女宿总人数": stmt.excluded.女宿总人数,
        "女宿空床位总数量": stmt.excluded.女宿空床位总数量,
        "适合女新生住宿床位": stmt.excluded.适合女新生住宿床位,
        "计划租宿舍数量": stmt.excluded.计划租宿舍数量,
        "实际租宿舍数量": stmt.excluded.实际租宿舍数量,
        "计划退宿舍数量": stmt.excluded.计划退宿舍数量,
        "实际退宿舍数量": stmt.excluded.实际退宿舍数量,
        "备注": stmt.excluded.备注,
        "更新时间": func.current_timestamp(),
    }
    
    stmt = stmt.on_conflict_do_update(
        constraint="uq_宿舍统计汇总_神殿年份月份",
        set_=update_dict
    )
    
    print(f"[DB汇总] 开始执行批量UPSERT，共{len(values_list)}条记录")
    result = db.execute(stmt)
    print(f"[DB汇总] 批量UPSERT执行完成，影响行数: {result.rowcount if hasattr(result, 'rowcount') else '未知'}")
    # 不需要显式flush，让SQLAlchemy自动管理
    # db.flush()

