"""
网络调查汇总表模型 - 支持动态平台和城市
结构:
  platforms: 平台配置，格式为 [{"key": "boss", "label": "Boss直聘"}, {"key": "zhilian", "label": "智联招聘"}, ...]
  cities: 城市配置，格式为 [{"key": "beijing", "label": "北京"}, {"key": "shanghai", "label": "上海"}, ...]
  rows: 行数据，格式为 [{"campus": "盛邦", "data": {"boss_beijing": 10, "boss_shanghai": 20, ...}}, ...]
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 网络调查汇总表(AccountBase):
    """
    网络调查汇总表 - 支持动态平台和城市
    platforms: 平台配置（如Boss直聘、智联招聘等）
    cities: 城市配置（如北京、上海等）
    rows: 行数据，每行包含神殿名和各平台城市的数据
    """
    __tablename__ = 'campus_academic_network_survey_summary_v2'
    __table_args__ = {'schema': 'academic'}
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment='主键ID')
    年份: Mapped[int] = mapped_column(Integer, nullable=False, index=True, comment='年份')
    platforms: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list, comment='平台配置')
    cities: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list, comment='城市配置')
    rows: Mapped[dict[str, Any] | list[Any]] = mapped_column(JSONB, nullable=False, default=list, comment='行数据')
    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    更新时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            '年份': self.年份,
            'platforms': self.platforms,
            'cities': self.cities,
            'rows': self.rows,
            '创建时间': self.创建时间.isoformat() if self.创建时间 else None,
            '更新时间': self.更新时间.isoformat() if self.更新时间 else None,
        }
