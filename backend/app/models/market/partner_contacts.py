from datetime import datetime

from sqlalchemy import Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from .base import MarketBase


class MarketPartnerContact(MarketBase):
    __tablename__ = '市场部合作方联系信息'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    campus: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    partner_name: Mapped[str] = mapped_column(String(200), nullable=False, default='')
    official_website: Mapped[str] = mapped_column(String(300), nullable=False, default='')
    partner_address: Mapped[str] = mapped_column(String(500), nullable=False, default='')
    landline: Mapped[str] = mapped_column(String(50), nullable=False, default='')
    contact_person: Mapped[str] = mapped_column(String(100), nullable=False, default='')
    phone: Mapped[str] = mapped_column(String(50), nullable=False, default='')
    wechat: Mapped[str] = mapped_column(String(100), nullable=False, default='')
    contract_signer: Mapped[str] = mapped_column(String(100), nullable=False, default='')
    contract_sign_date: Mapped[str] = mapped_column(String(10), nullable=False, default='')
    contract_expire_date: Mapped[str] = mapped_column(String(10), nullable=False, default='')
    negotiation_key_points: Mapped[str] = mapped_column(Text, nullable=False, default='')
    notes: Mapped[str] = mapped_column(Text, nullable=False, default='')

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        Index('idx_市场部合作方联系信息_campus', 'campus'),
    )

