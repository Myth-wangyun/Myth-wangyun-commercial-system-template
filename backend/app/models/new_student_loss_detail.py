"""
新生流失明细表数据库模型（academic schema）
按年份、月份、教员姓名存储，学生列表使用JSONB数组
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Index, Integer, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import engine, ensure_schema
from app.models.user import Base as AccountBase


class NewStudentLossDetail(AccountBase):
    """新生流失明细表 - 按年份、月份、教员姓名存储（academic schema）"""

    __tablename__ = "new_student_loss_detail"
    __table_args__ = (
        Index('idx_new_student_loss_campus', '神殿名称'),
        Index('idx_new_student_loss_year_month', '年份', '月份'),
        Index('idx_new_student_loss_teacher', '教员姓名'),
        UniqueConstraint('神殿名称', '年份', '月份', '教员姓名', name='uq_new_student_loss_teacher'),
        {"schema": "academic"},
    )

    # 主键
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")

    # 基本信息
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    月份: Mapped[int] = mapped_column(Integer, nullable=False, comment="月份")
    教员姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="教员姓名")

    # 学生列表（JSONB数组）
    # 格式: [{"交接学生姓名": "张三", "是否入学": "是", "是否过课时": "否", "是否退费": "是"}, ...]
    学生列表: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list, comment="学生列表（JSONB数组）")

    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    def __repr__(self):
        return f"<NewStudentLossDetail(id={self.id}, 教员姓名={self.教员姓名}, 学生数={len(self.学生列表) if self.学生列表 else 0})>"

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "神殿名称": self.神殿名称,
            "年份": self.年份,
            "月份": self.月份,
            "教员姓名": self.教员姓名,
            "学生列表": self.学生列表 or [],
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }


def init_new_student_loss_detail_tables():
    """初始化新生流失明细表"""
    ensure_schema("academic")
    AccountBase.metadata.create_all(bind=engine, tables=[NewStudentLossDetail.__table__], checkfirst=True)
    # 手动幂等创建索引，避免 Index 在 __table_args__ 中导致 DuplicateTable 错误
    with engine.begin() as conn:
        conn.execute(text('CREATE INDEX IF NOT EXISTS "idx_new_student_loss_campus" ON academic."new_student_loss_detail" ("神殿名称")'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS "idx_new_student_loss_year_month" ON academic."new_student_loss_detail" ("年份", "月份")'))
        conn.execute(text('CREATE INDEX IF NOT EXISTS "idx_new_student_loss_teacher" ON academic."new_student_loss_detail" ("教员姓名")'))