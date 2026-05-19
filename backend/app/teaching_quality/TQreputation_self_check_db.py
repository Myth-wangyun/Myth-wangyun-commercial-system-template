"""
教学质量模块 - 神殿教化司口碑工作自查表 数据库与辅助函数
Schema: teaching_quality

存储方式：按"单元格"存储（维度 + 行信息 + 日序号）。

表：teaching_quality."口碑工作自查表"
- 记录ID serial PK
- 神殿名称 varchar(50) not null
- 年份 int not null
- 月份 int not null (1..12)
- 班主任姓名 varchar(50) not null
- 事件 varchar(20) not null           -- 访谈/活动/线上宣传
- 详细内容 varchar(200) not null       -- 如“访谈新生数量/活动内容/朋友圈数量/…… 等”
- 日序号 int not null                  -- 1..31
- 填写内容 text nullable               -- 单元格文本
唯一：神殿名称 + 年份 + 月份 + 班主任姓名 + 事件 + 详细内容 + 日序号
索引：神殿名称 + 年份 + 月份 + 班主任姓名
"""
from datetime import datetime
from typing import Any, Dict, Iterable, List

from sqlalchemy import Column, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 口碑工作自查表(AccountBase):
    __tablename__ = "口碑工作自查表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False)
    年份: Mapped[int] = mapped_column(Integer, nullable=False)
    月份: Mapped[int] = mapped_column(Integer, nullable=False)
    班主任姓名: Mapped[str] = mapped_column(String(50), nullable=False)

    事件: Mapped[str] = mapped_column(String(20), nullable=False)
    详细内容: Mapped[str] = mapped_column(String(200), nullable=False)
    日序号: Mapped[int] = mapped_column(Integer, nullable=False)
    填写内容: Mapped[str | None] = mapped_column(Text, nullable=True)

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp())
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp())

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "班主任姓名", "事件", "详细内容", "日序号", name="uq_口碑自查_维度行日"),
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_口碑自查_维度", "神殿名称", "年份", "月份", "班主任姓名"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

def _migrate():
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[口碑工作自查表.__table__])
def init_reputation_self_check_tables():
    _migrate()

# 行 -> 多单元格展开 的内部工具
_DEF_DAYS = [str(i) for i in range(1, 32)]

def _iter_cells_from_row(row: Dict[str, Any]) -> Iterable[Dict[str, Any]]:
    """将一行数据展开为多个单元格。

    说明：前端/接口可能会传入同一行中重复的 key（例如多次出现“是否填写访谈记录表”）
    为避免同一维度(事件+详细内容+日序号)在一次写入中重复插入触发唯一约束，
    此处只负责展开，去重逻辑在 replace_reputation_self_check 中统一处理。
    """
    事件 = row.get("事件") or row.get("category") or row.get("类别")
    详细内容 = row.get("详细内容") or row.get("detailContent")
    日填报: Dict[str, Any] = row.get("日填报") or {}
    # 兼容直接扁平化的 1..31 字段
    if not 日填报:
        日填报 = {d: row.get(d) for d in _DEF_DAYS if d in row}
    for d in _DEF_DAYS:
        if d in 日填报:
            yield {"事件": 事件, "详细内容": 详细内容, "日序号": int(d), "填写内容": 日填报.get(d)}

def fetch_reputation_self_check_rows(
    db: Session, *, 神殿名称: str, 年份: int, 月份: int, 班主任姓名: str
) -> List[口碑工作自查表]:
    _migrate()
    return (
        db.query(口碑工作自查表)
        .filter(
            口碑工作自查表.神殿名称 == 神殿名称,
            口碑工作自查表.年份 == 年份,
            口碑工作自查表.月份 == 月份,
            口碑工作自查表.班主任姓名 == 班主任姓名,
        )
        .order_by(口碑工作自查表.事件, 口碑工作自查表.详细内容, 口碑工作自查表.日序号)
        .all()
    )

def replace_reputation_self_check(
    db: Session,
    *,
    神殿名称: str,
    年份: int,
    月份: int,
    班主任姓名: str,
    行列表: List[Dict[str, Any]],
):
    """覆盖写入指定维度的整张表（全部单元格）。

    之前实现为：先 delete 再逐条 insert。
    但在同一次请求 payload 内，若出现重复的 (事件+详细内容+日序号) 单元格，
    会在 flush 时触发唯一约束 uq_口碑自查_维度行日 的 UniqueViolation。

    这里做两件事：
    1) 在内存中对单元格按唯一键去重（同键后写覆盖先写）
    2) 跳过缺失 事件/详细内容 的异常行，避免写入脏数据
    """
    _migrate()

    # 先清空该维度下的历史数据
    db.query(口碑工作自查表).filter(
        口碑工作自查表.神殿名称 == 神殿名称,
        口碑工作自查表.年份 == 年份,
        口碑工作自查表.月份 == 月份,
        口碑工作自查表.班主任姓名 == 班主任姓名,
    ).delete()

    # 先在内存中去重，避免一次 flush 插入重复键导致 500
    # key: (事件, 详细内容, 日序号)
    cell_map: Dict[tuple, Any] = {}

    for row in 行列表:
        for cell in _iter_cells_from_row(row):
            事件 = (cell.get("事件") or "").strip() if isinstance(cell.get("事件"), str) else (cell.get("事件") or "")
            详细内容 = (cell.get("详细内容") or "").strip() if isinstance(cell.get("详细内容"), str) else (cell.get("详细内容") or "")
            日序号 = cell.get("日序号")

            # 缺少关键维度直接跳过
            if not 事件 or not 详细内容 or not isinstance(日序号, int):
                continue

            内容 = cell.get("填写内容")
            # 跳过空值/无意义值，避免大量空白单元格占库
            if 内容 is None or (isinstance(内容, str) and 内容.strip() == ""):
                continue

            cell_map[(事件, 详细内容, 日序号)] = 内容

    for (事件, 详细内容, 日序号), 内容 in cell_map.items():
        db.add(
            口碑工作自查表(
                神殿名称=神殿名称,
                年份=年份,
                月份=月份,
                班主任姓名=班主任姓名,
                事件=事件,
                详细内容=详细内容,
                日序号=日序号,
                填写内容=内容,
            )
        )

    db.flush()

def rows_to_matrix(records: List[口碑工作自查表]) -> List[Dict[str, Any]]:
    """将单元格记录还原为前端友好的一行结构。
    输出每行形如：{"事件": ..., "详细内容": ..., "日填报": {"1": "..", ...}}
    """
    matrix: Dict[tuple, Dict[str, Any]] = {}
    for r in records:
        key = (r.事件, r.详细内容)
        if key not in matrix:
            matrix[key] = {"事件": r.事件, "详细内容": r.详细内容, "日填报": {}}
        matrix[key]["日填报"][str(r.日序号)] = r.填写内容
    # 保持稳定顺序：按事件、详细内容排序
    out = [matrix[k] for k in sorted(matrix.keys(), key=lambda x: (x[0] or "", x[1] or ""))]
    return out

