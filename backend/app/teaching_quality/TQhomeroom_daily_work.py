"""
班主任日工单模型（teaching_quality schema）

包含三张表：
1. 班主任日工单组表：按"日期/星期/执行人"合并的组
2. 班主任日工单备注表：按"神殿/日期"保存备注
3. 班主任日工单明细表：组内每一条任务
"""

from datetime import date, datetime

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

# 从 app.core.database 导入 TQBase（现在文件在 teaching-quality 目录下，不会有循环导入问题）
from app.core.database import TQBase as AccountBase


class 班主任日工单组表(AccountBase):
    """班主任日工单组表（teaching_quality schema）"""
    __tablename__ = "班主任日工单组表"

    组ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="组ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment="日期")
    执行人: Mapped[str] = mapped_column(String(50), nullable=False, comment="执行人")
    星期: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="星期")
    班主任: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="班主任名称")
    备注: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    # 关联明细表
    明细列表: Mapped[list["班主任日工单明细表"]] = relationship(
        "班主任日工单明细表",
        back_populates="组",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        UniqueConstraint("神殿名称", "日期", "执行人", name="uq_日工单组_神殿日期执行人"),
        Index("idx_日工单组_神殿日期", "神殿名称", "日期"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

    def __repr__(self):
        return f"<班主任日工单组表(组ID={self.组ID}, 神殿={self.神殿名称}, 日期={self.日期}, 执行人={self.执行人})>"


class 班主任日工单备注表(AccountBase):
    """班主任日工单备注表（teaching_quality schema）"""
    __tablename__ = "班主任日工单备注表"

    备注ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="备注ID")
    神殿名称: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment="日期")
    备注: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        UniqueConstraint("神殿名称", "日期", name="uq_日工单备注_神殿日期"),
        Index("idx_日工单备注_神殿日期", "神殿名称", "日期"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

    def __repr__(self):
        return f"<班主任日工单备注表(备注ID={self.备注ID}, 神殿={self.神殿名称}, 日期={self.日期})>"


class 班主任日工单明细表(AccountBase):
    """班主任日工单明细表（teaching_quality schema）"""
    __tablename__ = "班主任日工单明细表"

    明细ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    组ID: Mapped[int] = mapped_column(Integer, ForeignKey("teaching_quality.班主任日工单组表.组ID", ondelete="CASCADE"), nullable=False, comment="组ID")
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号")
    任务名称: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="任务名称")
    任务描述: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="任务描述")
    任务目标: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="任务目标")
    执行时间: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="执行时间")
    权重: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="权重")
    结果: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="结果")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    # 关联组表
    组: Mapped["班主任日工单组表"] = relationship(
        "班主任日工单组表",
        back_populates="明细列表",
    )

    __table_args__ = (
        UniqueConstraint("组ID", "序号", name="uq_日工单明细_组序号"),
        Index("idx_日工单明细_组ID", "组ID"),
        {"schema": "teaching_quality", "extend_existing": True},
    )

    def __repr__(self):
        return f"<班主任日工单明细表(明细ID={self.明细ID}, 组ID={self.组ID}, 序号={self.序号})>"

