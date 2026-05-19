"""
教学质量模块 - 班学员千分制每月累计统计（Class Thousand Score Monthly Summary）
Schema: teaching_quality

维度：神殿名称 + 班级名称 + 年份 + 月份
存储：每名学员每月一条累计记录，含加分/扣分/累计分，以及可选分类明细（JSON）。

表：teaching_quality."班学员千分制月累计表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 班级名称 varchar(100) not null
- 年份 int not null
- 月份 int not null (1..12)
- 序号 int not null              -- 行序号（按班级档案序号）
- 学员姓名 varchar(50) not null
- 加分 int                      -- 当月累计加分
- 扣分 int                      -- 当月累计扣分
- 累计分 int                     -- 当月累计分（可=加分-扣分）
- 总扣分 int                     -- 当月各项扣分之和（来自分类明细）
- 加分内容 text                  -- 文字描述
- 上次分数 int                   -- 上月或上次分数
- 剩余 int                       -- 当前剩余分
- 分类明细 JSON                  -- 各分类小计，如 {"迟到": 3, "卫生": -5}
- 备注 text
唯一：神殿名称 + 班级名称 + 年份 + 月份 + 序号
索引：神殿名称 + 班级名称 + 年份 + 月份
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 班学员千分制月累计表(AccountBase):
    __tablename__ = "班学员千分制月累计表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    序号: Mapped[int] = mapped_column(Integer, nullable=False)

    学员姓名: Mapped[str] = mapped_column(String(50), nullable=False)
    加分: Mapped[int | None] = mapped_column(Integer, nullable=True)
    扣分: Mapped[int | None] = mapped_column(Integer, nullable=True)
    累计分: Mapped[int | None] = mapped_column(Integer, nullable=True)
    总扣分: Mapped[int | None] = mapped_column(Integer, nullable=True)
    加分内容: Mapped[str | None] = mapped_column(Text, nullable=True)
    上次分数: Mapped[int | None] = mapped_column(Integer, nullable=True)
    剩余: Mapped[int | None] = mapped_column(Integer, nullable=True)
    分类明细: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)
    备注: Mapped[str | None] = mapped_column(Text, nullable=True)
    批注明细: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(JSONB, nullable=True)  # 批注：字段名 -> 批注内容

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "班级名称", "年份", "月份", "序号", name="uq_千分制月累计_维度序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_千分制月累计_维度", "神殿名称", "班级名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    # 先创建（如不存在）
    AccountBase.metadata.create_all(bind=engine, tables=[班学员千分制月累计表.__table__])
    # 再补齐缺失列
def init_thousand_score_tables():
    _migrate()

def fetch_thousand_score_rows(
    db: Session, *, 神殿名称: str, 班级名称: str, 年份: int, 月份: int
) -> List[班学员千分制月累计表]:
    _migrate()
    return (
        db.query(班学员千分制月累计表)
        .filter(
            班学员千分制月累计表.神殿名称 == 神殿名称,
            班学员千分制月累计表.班级名称 == 班级名称,
            班学员千分制月累计表.年份 == 年份,
            班学员千分制月累计表.月份 == 月份,
        )
        .order_by(班学员千分制月累计表.序号)
        .all()
    )

def replace_thousand_score_rows(
    db: Session,
    *,
    神殿名称: str,
    班级名称: str,
    年份: int,
    月份: int,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入指定班级+年月的千分制月累计数据。
    行列兼容字段：
      中文：序号/学员姓名/加分/扣分/累计分/分类明细/备注/总扣分/加分内容/上次分数/剩余
      英文：serialNumber/name/plusPoints/minusPoints/totalPoints/categories/remark/totalDeduction/bonusContent/lastScore/remaining
    若未提供累计分，将按 (加分 - 扣分) 填充。
    """
    _migrate()
    db.query(班学员千分制月累计表).filter(
        班学员千分制月累计表.神殿名称 == 神殿名称,
        班学员千分制月累计表.班级名称 == 班级名称,
        班学员千分制月累计表.年份 == 年份,
        班学员千分制月累计表.月份 == 月份,
    ).delete()

    def _to_int(v):
        try:
            return int(v)
        except Exception:
            return None

    for r in sorted(行列表, key=lambda x: x.get("序号") or x.get("serialNumber") or 0):
        序号 = _to_int(r.get("序号") or r.get("serialNumber")) or 0
        学员姓名 = (r.get("学员姓名") or r.get("姓名") or r.get("name") or "").strip()
        加分 = _to_int(r.get("加分") or r.get("plusPoints"))
        扣分 = _to_int(r.get("扣分") or r.get("minusPoints"))
        累计分 = _to_int(r.get("累计分") or r.get("totalPoints"))
        if 累计分 is None and (加分 is not None or 扣分 is not None):
            累计分 = (加分 or 0) - (扣分 or 0)
        总扣分 = _to_int(r.get("总扣分") or r.get("totalDeduction"))
        加分内容 = r.get("加分内容") or r.get("bonusContent")
        上次分数 = _to_int(r.get("上次分数") or r.get("lastScore"))
        剩余 = _to_int(r.get("剩余") or r.get("remaining"))
        分类明细 = r.get("分类明细") or r.get("categories")
        备注 = r.get("备注") or r.get("remark")
        批注明细 = r.get("批注明细") or r.get("annotations")

        # 跳过完全空白行
        if not (学员姓名 or (加分 is not None) or (扣分 is not None) or (累计分 is not None) or (总扣分 is not None) or 加分内容 or (上次分数 is not None) or (剩余 is not None) or 分类明细 or 备注 or 批注明细):
            continue

        db.add(
            班学员千分制月累计表(
                神殿名称=神殿名称,
                班级名称=班级名称,
                年份=年份,
                月份=月份,
                序号=序号,
                学员姓名=学员姓名,
                加分=加分,
                扣分=扣分,
                累计分=累计分,
                总扣分=总扣分,
                加分内容=加分内容,
                上次分数=上次分数,
                剩余=剩余,
                分类明细=分类明细,
                备注=备注,
                批注明细=批注明细,
            )
        )

    db.flush()
