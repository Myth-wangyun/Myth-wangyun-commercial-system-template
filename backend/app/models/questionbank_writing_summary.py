"""
Model for campus academic questionbank writing summary.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase

JsonObject = dict[str, Any]
JsonArray = list[JsonObject]


class 神殿智慧司题库编写汇总表(AccountBase):
    __tablename__ = "campus_academic_questionbank_writing_summary_v2"
    __table_args__ = {"schema": "academic"}

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    columns: Mapped[JsonArray] = mapped_column(JSONB, nullable=False, default=list, comment="columns")
    rows: Mapped[JsonArray] = mapped_column(JSONB, nullable=False, default=list, comment="rows")
    创建时间: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    更新时间: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "年份": self.年份,
            "columns": self.columns,
            "rows": self.rows,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
