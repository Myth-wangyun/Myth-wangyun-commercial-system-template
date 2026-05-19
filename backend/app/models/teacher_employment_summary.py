"""
神殿后端教员就业汇总表模型（academic schema）
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, DateTime, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 神殿后端教员就业汇总表(AccountBase):
    """神殿后端教员就业汇总表 - 记录教员就业汇总信息（academic schema）"""
    
    __tablename__ = "神殿后端教员就业汇总表"
    __table_args__ = (
        # 使用更具体的索引名，避免与其他表的通用索引名冲突
        Index('idx_teacher_employment_summary_神殿', '神殿'),
        Index('idx_teacher_employment_summary_教员姓名', '教员姓名'),
        Index('idx_teacher_employment_summary_班级名称', '班级名称'),
        UniqueConstraint('神殿', '教员姓名', '专业', '学制', '班级名称', name='uniq_teacher_employment_summary'),
        {"schema": "academic"},
    )
    
    # 主键
    汇总ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="汇总ID")
    
    # 基本信息
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="所属神殿")
    教员姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="教员姓名")
    专业: Mapped[str] = mapped_column(String(50), nullable=False, comment="专业")
    学制: Mapped[str] = mapped_column(String(20), nullable=False, comment="学制")
    班级名称: Mapped[str] = mapped_column(String(100), nullable=False, comment="班级名称")
    毕业时间: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="毕业时间（YYYY-MM格式）")
    
    # 就业薪资统计
    目标平均就业薪资: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2), nullable=True, comment="目标平均就业薪资(元)")
    实际平均就业薪资: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2), nullable=True, comment="实际平均就业薪资(元)")
    达标率: Mapped[Decimal | None] = mapped_column(DECIMAL(5, 2), nullable=True, comment="达标率(%)")
    
    # 就业率统计
    目标就业人数: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="目标就业人数")
    实际就业人数: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="实际就业人数")
    就业率: Mapped[Decimal | None] = mapped_column(DECIMAL(5, 2), nullable=True, comment="就业率(%)")
    
    # 其他统计
    薪资过万人数: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="薪资过万人数")
    
    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    def __repr__(self):
        return f"<神殿后端教员就业汇总表(汇总ID={self.汇总ID}, 教员姓名={self.教员姓名}, 班级名称={self.班级名称})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "汇总ID": self.汇总ID,
            "神殿": self.神殿,
            "教员姓名": self.教员姓名,
            "专业": self.专业,
            "学制": self.学制,
            "班级名称": self.班级名称,
            "毕业时间": self.毕业时间,
            "目标平均就业薪资": float(self.目标平均就业薪资) if self.目标平均就业薪资 else None,
            "实际平均就业薪资": float(self.实际平均就业薪资) if self.实际平均就业薪资 else None,
            "达标率": float(self.达标率) if self.达标率 else None,
            "目标就业人数": self.目标就业人数,
            "实际就业人数": self.实际就业人数,
            "就业率": float(self.就业率) if self.就业率 else None,
            "薪资过万人数": self.薪资过万人数,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
