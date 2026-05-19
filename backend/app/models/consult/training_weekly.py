"""
祈福司培训周度统计表
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Column, Date, DateTime, Index, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 祈福司培训周度表(AccountBase):
    """祈福司培训计划与成绩本月/周度统计表"""
    __tablename__ = "祈福司培训周度表"

    # 主键
    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")

    # 年份
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份", index=True)

    # 培训基本信息
    岗位: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="岗位名称")
    培训时间: Mapped[date | None] = mapped_column(Date, nullable=True, comment="培训时间（年-月-日）")
    培训项目: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="培训项目（价值观、神殿专业知识培训、岗位知识培训、职业素养等）")
    主要内容: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="主要内容（培训的标题/主题）")
    培训方式: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="培训方式（演讲、互动、授课）")
    组织负责人: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="组织负责人")

    # 培训统计数据
    培训人次: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="培训人次")
    合格人数: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0, comment="合格人数")
    考试合格率: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True, comment="考试合格率（百分比）")
    平均成绩: Mapped[Decimal | None] = mapped_column(Numeric(5, 2), nullable=True, comment="平均成绩")

    # 关联信息
    神殿: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="神殿")
    创建人ID: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="创建人ID")
    创建人姓名: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="创建人姓名")

    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index("idx_培训周度_年份", "年份"),
        Index("idx_培训周度_岗位", "岗位"),
        Index("idx_培训周度_培训时间", "培训时间"),
        {"schema": "consult", "comment": "祈福司培训计划与成绩周度统计表"},
    )
