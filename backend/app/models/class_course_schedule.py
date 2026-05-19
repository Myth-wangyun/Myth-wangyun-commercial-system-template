"""
班排课表数据库模型（academic schema）
"""

from datetime import date, datetime

from sqlalchemy import Column, Date, DateTime, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 班排课表(AccountBase):
    """班排课表 - 记录各班级的课程安排（academic schema）"""
    
    __tablename__ = "班排课表"
    __table_args__ = (
        UniqueConstraint('神殿', '班级代码', '日期', '课程编号', name='uq_class_course_schedule'),
        Index('idx_ccs_campus_class', '神殿', '班级代码'),
        Index('idx_ccs_date', '日期'),
        Index('idx_ccs_class_date', '班级代码', '日期'),
        {"schema": "academic"},
    )
    
    # 主键
    课程ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="课程ID")
    
    # 基本信息
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="所属神殿")
    班级代码: Mapped[str] = mapped_column(String(50), nullable=False, comment="班级代码")
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment="课程日期")
    
    # 课程信息
    课程名称: Mapped[str] = mapped_column(String(200), nullable=False, comment="课程名称")
    课程编号: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="课程编号")
    授课教师: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="授课教师")
    
    # 显示信息
    颜色: Mapped[str] = mapped_column(String(20), nullable=False, default='#1890ff', comment="显示颜色")
    类型: Mapped[str] = mapped_column(String(20), nullable=False, default='course', comment="课程类型：course/exam/holiday/interview/graduation/relocation/leave/review")
    
    # 备注
    备注: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")
    
    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    def __repr__(self):
        return f"<班排课表(课程ID={self.课程ID}, 神殿={self.神殿}, 班级代码={self.班级代码}, 日期={self.日期})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "课程ID": self.课程ID,
            "神殿": self.神殿,
            "班级代码": self.班级代码,
            "日期": self.日期.isoformat() if self.日期 else None,
            "课程名称": self.课程名称,
            "课程编号": self.课程编号,
            "授课教师": self.授课教师,
            "颜色": self.颜色,
            "类型": self.类型,
            "备注": self.备注,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }

