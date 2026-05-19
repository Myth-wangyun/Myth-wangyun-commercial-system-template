"""
学员满意度平均视图（v_student_satisfaction_avg）
"""

from decimal import Decimal

from sqlalchemy import Column, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.user import Base as AccountBase


class StudentSatisfactionAvg(AccountBase):
    __tablename__ = "v_student_satisfaction_avg"
    __table_args__ = {"schema": "academic"}

    campus_name: Mapped[str] = mapped_column(String(100), primary_key=True)
    year: Mapped[int] = mapped_column(Integer, primary_key=True)
    teacher_name: Mapped[str] = mapped_column(String(100), primary_key=True)
    m1: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    m2: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    m3: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    m4: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    m5: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    m6: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    m7: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    m8: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    m9: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    m10: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    m11: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
    m12: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)
