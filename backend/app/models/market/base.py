from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

# 设置 market schema 的 metadata
market_metadata = MetaData(schema='market')


class MarketBase(DeclarativeBase):
    """Declarative base for market schema models."""

    metadata = market_metadata








































