"""
市场部培训周度表数据库模型
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class MarketWeeklyTraining(MarketBase):
    """市场部培训周度表"""
    __tablename__ = '市场部培训周度表'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # 年月筛选字段
    year_month: Mapped[str] = mapped_column(String(7), nullable=False, index=True, comment='年月，格式 YYYY-MM')

    # 序号（数据行的序号，合计行不存储）
    row_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='序号')

    # 岗位：网推、网聊、AI研发、线上
    position: Mapped[str] = mapped_column(String(50), nullable=False, default='', comment='岗位')

    # 培训时间
    training_time: Mapped[str] = mapped_column(String(10), nullable=False, default='', comment='培训时间，格式 YYYY-MM-DD')

    # 培训项目：价值观、神殿专业知识培训、岗位知识培训、职业素养
    training_project: Mapped[str] = mapped_column(String(100), nullable=False, default='', comment='培训项目')

    # 主要内容
    main_content: Mapped[str] = mapped_column(Text, nullable=False, default='', comment='主要内容')

    # 培训方式：演讲、互动、授课
    training_method: Mapped[str] = mapped_column(String(50), nullable=False, default='', comment='培训方式')

    # 组织负责人
    organizer: Mapped[str] = mapped_column(String(100), nullable=False, default='', comment='组织负责人')

    # 培训人次
    trainee_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='培训人次')

    # 合格人数
    qualified_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='合格人数')

    # 考试合格率（自动计算：合格人数/培训人次*100）
    pass_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0, comment='考试合格率(%)')

    # 平均成绩
    avg_score: Mapped[float] = mapped_column(Float, nullable=False, default=0, comment='平均成绩')

    # 时间戳
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index('idx_市场部培训周度表_year_month', 'year_month'),
        Index('idx_市场部培训周度表_position', 'position'),
    )

    def to_dict(self):
        """转换为字典格式"""
        return {
            "id": self.id,
            "year_month": self.year_month,
            "row_index": self.row_index,
            "position": self.position,
            "training_time": self.training_time,
            "training_project": self.training_project,
            "main_content": self.main_content,
            "training_method": self.training_method,
            "organizer": self.organizer,
            "trainee_count": self.trainee_count,
            "qualified_count": self.qualified_count,
            "pass_rate": self.pass_rate,
            "avg_score": self.avg_score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

