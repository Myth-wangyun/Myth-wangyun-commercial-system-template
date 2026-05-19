"""
教学质量模块 - 教质经理KPI计划 数据库与辅助函数（PostgreSQL teaching_quality schema）
文件位置：backend/app/teaching-quality

表：teaching_quality."教质经理KPI计划表"
- 记录ID serial PK
- 神殿名称 varchar(50)
- 年份 int（可选；前端未筛选时可传当前年份）
- 月份 int（可选；前端未筛选时可传当前月份或固定0）
- 序号 int          （行序）
- 姓名 varchar(50)  （可为空）
- 项目指标 varchar(50)  （业务指标/管理指标）
- KPI指标 varchar(50)
- KPI名称 varchar(200)
- 计算细则 text
- 数据来源 varchar(100)
- 权重 numeric
- 项目描述 text
- 自我打分 numeric
- 上级领导打分 numeric
- KPI值 numeric
- 备注 text
- 行类型 varchar(20) （data/total）
- 创建时间/更新时间

唯一：神殿名称 + 年份 + 月份 + 姓名 + 序号
索引：神殿名称 + 年份 + 月份
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, Text, UniqueConstraint, text
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import engine, ensure_teaching_quality_schema
from app.models.user import Base as AccountBase


class 教质经理KPI计划表(AccountBase):
    __tablename__ = "教质经理KPI计划表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="年份")
    月份: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="月份(1-12)")
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号")
    姓名: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="姓名")
    项目指标: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="项目指标")
    KPI指标: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="KPI指标")
    KPI名称: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="KPI名称")
    计算细则: Mapped[str | None] = mapped_column(Text, nullable=True, comment="计算细则")
    数据来源: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="数据来源/考核")
    权重: Mapped[float | None] = mapped_column(Float, nullable=True, comment="权重")
    项目描述: Mapped[str | None] = mapped_column(Text, nullable=True, comment="项目描述")
    自我打分: Mapped[float | None] = mapped_column(Float, nullable=True, comment="自我打分")
    上级领导打分: Mapped[float | None] = mapped_column(Float, nullable=True, comment="上级领导打分")
    KPI值: Mapped[float | None] = mapped_column(Float, nullable=True, comment="KPI值")
    备注: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")
    行类型: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="行类型 data/total")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        UniqueConstraint("神殿名称", "年份", "月份", "姓名", "序号", name="uq_教质经理kpi_神殿年月姓名序号"),
        # Index 移至 _migrate() 中手动创建，避免重复定义
        Index("idx_教质经理kpi_神殿年月", "神殿名称", "年份", "月份"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

    def __repr__(self):
        return f"<教质经理KPI计划表(神殿={self.神殿名称},{self.年份}-{self.月份}, 序号={self.序号}, KPI名称={self.KPI名称})>"

def _migrate() -> None:
    from app.core.database import _tq_batch_migrated
    if _tq_batch_migrated:
        return
    ensure_teaching_quality_schema()
    AccountBase.metadata.create_all(bind=engine, tables=[教质经理KPI计划表.__table__], checkfirst=True)
    with engine.begin() as conn:
        conn.execute(text('ALTER TABLE teaching_quality."教质经理KPI计划表" DROP CONSTRAINT IF EXISTS uq_教质经理kpi_神殿年月序号'))
        conn.execute(
            text(
                'DO $$ BEGIN\n'
                "    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_教质经理kpi_神殿年月姓名序号') THEN\n"
                '        ALTER TABLE teaching_quality."教质经理KPI计划表" ADD CONSTRAINT uq_教质经理kpi_神殿年月姓名序号 UNIQUE (神殿名称, 年份, 月份, 姓名, 序号);\n'
                '    END IF;\n'
                'END $$;'
            )
        )

def init_manager_kpi_tables() -> None:
    _migrate()

def fetch_rows(db: Session, *, 神殿名称: str, 年份: Optional[int] = None, 月份: Optional[int] = None) -> List[教质经理KPI计划表]:
    _migrate()
    query = db.query(教质经理KPI计划表).filter(教质经理KPI计划表.神殿名称 == 神殿名称)
    if 年份 is not None:
        query = query.filter(教质经理KPI计划表.年份 == 年份)
    if 月份 is not None:
        query = query.filter(教质经理KPI计划表.月份 == 月份)
    return query.order_by(教质经理KPI计划表.姓名, 教质经理KPI计划表.序号).all()

def replace_rows(
    db: Session,
    *,
    神殿名称: str,
    行列表: List[Dict[str, Any]],
    年份: Optional[int] = None,
    月份: Optional[int] = None,
) -> None:
    _migrate()
    # 覆盖同一维度（如仅按神殿；或按神殿+年；或按神殿+年+月）
    query = db.query(教质经理KPI计划表).filter(教质经理KPI计划表.神殿名称 == 神殿名称)
    if 年份 is not None:
        query = query.filter(教质经理KPI计划表.年份 == 年份)
    if 月份 is not None:
        query = query.filter(教质经理KPI计划表.月份 == 月份)
    query.delete()

    for row in sorted(行列表, key=lambda x: (x.get("姓名") or "", x.get("序号", 0))):
        db.add(
            教质经理KPI计划表(
                神殿名称=神殿名称,
                年份=年份,
                月份=月份,
                序号=row.get("序号"),
                姓名=row.get("姓名"),
                项目指标=row.get("项目指标"),
                KPI指标=row.get("KPI指标"),
                KPI名称=row.get("KPI名称"),
                计算细则=row.get("计算细则"),
                数据来源=row.get("数据来源"),
                权重=row.get("权重"),
                项目描述=row.get("项目描述"),
                自我打分=row.get("自我打分"),
                上级领导打分=row.get("上级领导打分"),
                KPI值=row.get("KPI值"),
                备注=row.get("备注"),
                行类型=row.get("行类型"),
            )
        )
