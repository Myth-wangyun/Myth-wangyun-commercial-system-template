"""
教学质量模块-管理数据 - 会议记录表（PostgreSQL teaching_quality schema） 026文件
文件位置：backend/app/teaching-quality

表：teaching_quality."会议记录表"
- 记录ID serial PK
- 神殿名称 varchar(50)
- 时间 varchar(100)        # 与前端 time 文本对应
- 地点 varchar(200)
- 主讲 varchar(100)
- 参与人 text
- 议题 text
- 问题解决 text
- 问题待解决 text
- 创建时间/更新时间

提供：
- init_meeting_tables()  建表/迁移（幂等）
- fetch_records(db, 神殿名称)  查询
- replace_records(db, 神殿名称, 记录列表)  覆盖写入某神殿全部记录
"""
from datetime import datetime
from typing import Any, Dict, List

from sqlalchemy import Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, Session, mapped_column
from sqlalchemy.sql import func

from app.core.database import TQBase as AccountBase
from app.core.database import engine, ensure_teaching_quality_schema


class 会议记录表(AccountBase):
    __tablename__ = "会议记录表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    时间: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="时间（自由文本）")
    地点: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="地点")
    主讲: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="主讲")
    参与人: Mapped[str | None] = mapped_column(Text, nullable=True, comment="参与人")
    议题: Mapped[str | None] = mapped_column(Text, nullable=True, comment="议题")
    问题解决: Mapped[str | None] = mapped_column(Text, nullable=True, comment="问题解决")
    问题待解决: Mapped[str | None] = mapped_column(Text, nullable=True, comment="问题待解决")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        # Index 移至 _migrate() 中手动创建，避免重复定义导致 DuplicateTable 错误
        Index("idx_会议记录_神殿", "神殿名称"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

    def __repr__(self) -> str:
        return f"<会议记录表(记录ID={self.记录ID}, 神殿={self.神殿名称}, 时间={self.时间})>"

def _migrate_meeting_table() -> None:
    ensure_teaching_quality_schema()
    # 创建表（如果不存在）
    AccountBase.metadata.create_all(bind=engine, tables=[会议记录表.__table__])
    # 可按需在此添加迁移（目前字段已齐全）

def init_meeting_tables() -> None:
    _migrate_meeting_table()

def fetch_records(db: Session, *, 神殿名称: str) -> List[会议记录表]:
    _migrate_meeting_table()
    return (
        db.query(会议记录表)
        .filter(会议记录表.神殿名称 == 神殿名称)
        .order_by(会议记录表.记录ID.desc())
        .all()
    )

def replace_records(db: Session, *, 神殿名称: str, 记录列表: List[Dict[str, Any]]) -> None:
    """覆盖写入某神殿的全部会议记录。
    记录元素：{"时间":"","地点":"","主讲":"","参与人":"","议题":"","问题解决":"","问题待解决":""}
    """
    _migrate_meeting_table()
    # 删除旧数据
    db.query(会议记录表).filter(会议记录表.神殿名称 == 神殿名称).delete()
    # 插入新数据
    for item in 记录列表:
        db.add(
            会议记录表(
                神殿名称=神殿名称,
                时间=item.get("时间"),
                地点=item.get("地点"),
                主讲=item.get("主讲"),
                参与人=item.get("参与人"),
                议题=item.get("议题"),
                问题解决=item.get("问题解决"),
                问题待解决=item.get("问题待解决"),
            )
        )

