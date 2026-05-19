"""市场部员工功能分析表 - SQLAlchemy Models

包含四个表：
1. 市场部中层功能分析表 - 中层干部评分
2. 市场部网推功能分析表 - 网推员工评分
3. 市场部网聊功能分析表 - 网聊员工评分
4. 市场部AI研发功能分析表 - AI研发+其他员工评分

落表 schema: market
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.market.base import MarketBase

# ============================================================
# 员工表 - 存储各类别的员工信息
# ============================================================

class 市场部功能分析员工表(MarketBase):
    """员工信息表 - 存储功能分析中的员工"""
    __tablename__ = '市场部功能分析员工表'
    __table_args__ = (
        Index('idx_功能分析员工_类别', 'category'),
        Index('idx_功能分析员工_年份', 'year'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[str] = mapped_column(String(10), nullable=False, comment='年份')
    category: Mapped[str] = mapped_column(String(50), nullable=False, comment='类别：中层/网推/网聊/AI研发')
    employee_key: Mapped[str] = mapped_column(String(100), nullable=False, comment='员工唯一标识')
    employee_name: Mapped[str] = mapped_column(String(100), nullable=False, comment='员工姓名')
    position: Mapped[str] = mapped_column(String(100), nullable=False, default='', comment='职位（中层专用）')
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment='排序顺序')

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


# ============================================================
# 中层功能分析表
# ============================================================

class 市场部中层功能分析表(MarketBase):
    """中层功能分析评分表"""
    __tablename__ = '市场部中层功能分析表'
    __table_args__ = (
        Index('idx_中层功能分析_年份', 'year'),
        Index('idx_中层功能分析_员工', 'employee_key'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[str] = mapped_column(String(10), nullable=False, comment='年份')
    employee_key: Mapped[str] = mapped_column(String(100), nullable=False, comment='员工唯一标识')
    row_id: Mapped[int] = mapped_column(Integer, nullable=False, comment='评分项序号(1-20)')
    rating: Mapped[float] = mapped_column(Float, nullable=False, default=0, comment='评分')

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class 市场部中层功能分析权重表(MarketBase):
    """中层功能分析权重表"""
    __tablename__ = '市场部中层功能分析权重表'
    __table_args__ = (
        Index('idx_中层功能分析权重_年份', 'year'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[str] = mapped_column(String(10), nullable=False, comment='年份')
    row_id: Mapped[int] = mapped_column(Integer, nullable=False, comment='评分项序号(1-20)')
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=0, comment='权重百分比')

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


# ============================================================
# 网推功能分析表
# ============================================================

class 市场部网推功能分析表(MarketBase):
    """网推功能分析评分表"""
    __tablename__ = '市场部网推功能分析表'
    __table_args__ = (
        Index('idx_网推功能分析_年份', 'year'),
        Index('idx_网推功能分析_员工', 'employee_key'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[str] = mapped_column(String(10), nullable=False, comment='年份')
    employee_key: Mapped[str] = mapped_column(String(100), nullable=False, comment='员工唯一标识')
    row_id: Mapped[int] = mapped_column(Integer, nullable=False, comment='评分项序号(1-18)')
    score: Mapped[float] = mapped_column(Float, nullable=False, default=0, comment='得分')

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


# ============================================================
# 网聊功能分析表
# ============================================================

class 市场部网聊功能分析表(MarketBase):
    """网聊功能分析评分表"""
    __tablename__ = '市场部网聊功能分析表'
    __table_args__ = (
        Index('idx_网聊功能分析_年份', 'year'),
        Index('idx_网聊功能分析_员工', 'employee_key'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[str] = mapped_column(String(10), nullable=False, comment='年份')
    employee_key: Mapped[str] = mapped_column(String(100), nullable=False, comment='员工唯一标识')
    row_id: Mapped[int] = mapped_column(Integer, nullable=False, comment='评分项序号(1-18)')
    score: Mapped[float] = mapped_column(Float, nullable=False, default=0, comment='得分')

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


# ============================================================
# AI研发功能分析表
# ============================================================

class 市场部AI研发功能分析表(MarketBase):
    """AI研发+其他功能分析评分表"""
    __tablename__ = '市场部AI研发功能分析表'
    __table_args__ = (
        Index('idx_AI研发功能分析_年份', 'year'),
        Index('idx_AI研发功能分析_员工', 'employee_key'),
        {'schema': 'market'},
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    year: Mapped[str] = mapped_column(String(10), nullable=False, comment='年份')
    employee_key: Mapped[str] = mapped_column(String(100), nullable=False, comment='员工唯一标识')
    row_id: Mapped[int] = mapped_column(Integer, nullable=False, comment='评分项序号(1-18)')
    score: Mapped[float] = mapped_column(Float, nullable=False, default=0, comment='得分')

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

