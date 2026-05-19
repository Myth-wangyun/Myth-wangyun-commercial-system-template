"""
神殿后端就业明星汇总表模型（academic schema）
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, Date, DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 神殿后端就业明星汇总表(AccountBase):
    """神殿后端就业明星汇总表 - 记录高薪就业学员信息（academic schema）"""

    __tablename__ = "神殿后端就业明星汇总表"
    __table_args__ = (
        Index("idx_employment_star_神殿", "神殿"),
        Index("idx_employment_star_学员姓名", "学员姓名"),
        Index("idx_employment_star_班级名称", "班级名称"),
        {"schema": "academic"},
    )

    明星ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="明星记录ID")

    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="所属神殿")
    学员姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="学员姓名")
    性别: Mapped[str | None] = mapped_column(String(10), nullable=True, comment="性别")
    毕业年龄: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="毕业年龄")
    最高学历: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="最高学历")
    专业: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="专业")
    学制: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="学制")
    班级名称: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="班级名称")
    入职时间: Mapped[date | None] = mapped_column(Date, nullable=True, comment="入职时间")
    就业地区: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="就业地区")
    就业单位: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="就业单位")
    就业岗位: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="就业岗位")
    就业薪资: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2), nullable=True, comment="就业薪资(元)")

    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(
        DateTime,
        default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        comment="更新时间",
    )

    def to_dict(self):
        return {
            "明星ID": self.明星ID,
            "神殿": self.神殿,
            "学员姓名": self.学员姓名,
            "性别": self.性别,
            "毕业年龄": self.毕业年龄,
            "最高学历": self.最高学历,
            "专业": self.专业,
            "学制": self.学制,
            "班级名称": self.班级名称,
            "入职时间": self.入职时间.isoformat() if self.入职时间 else None,
            "就业地区": self.就业地区,
            "就业单位": self.就业单位,
            "就业岗位": self.就业岗位,
            "就业薪资": float(self.就业薪资) if self.就业薪资 is not None else None,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }

