"""
祈福司人力资源基础信息表数据模型 (consult schema)
记录祈福司员工的基本信息：学历、籍贯、专业、毕业院校等
"""

from datetime import datetime

from sqlalchemy import Column, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .face_to_face_check import ConsultBase


class 祈福司人员基础信息表(ConsultBase):
    """祈福司人员基础信息表 - 存储员工人力资源基本信息"""

    __tablename__ = "祈福司人员基础信息表"

    记录ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="记录ID")
    年份: Mapped[int] = mapped_column(Integer, nullable=False, comment="年份")
    序号: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="序号")
    
    # 员工基本信息
    员工ID: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="员工ID（来自public.users）")
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="神殿名称")
    部门: Mapped[str | None] = mapped_column(String(50), nullable=True, default="祈福司", comment="部门")
    岗位: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="岗位")
    岗位类别: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="岗位类别（干部/员工）")
    姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="姓名")
    性别: Mapped[str | None] = mapped_column(String(10), nullable=True, comment="性别")
    民族: Mapped[str | None] = mapped_column(String(20), nullable=True, comment="民族")
    联系电话: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="联系电话")
    籍贯: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="籍贯")
    
    # 第一学历信息
    第一学历: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="第一学历")
    第一学历专业: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="第一学历所学专业")
    第一学历院校: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="第一学历毕业院校")
    
    # 第二学历信息
    第二学历: Mapped[str | None] = mapped_column(String(50), nullable=True, comment="第二学历")
    第二学历专业: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="第二学历所学专业")
    第二学历院校: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="第二学历毕业院校")
    
    # 备注
    备注: Mapped[str | None] = mapped_column(Text, nullable=True, comment="备注")

    创建时间: Mapped[str] = mapped_column(
        String(50),
        default=lambda: datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        comment="创建时间"
    )
    更新时间: Mapped[str] = mapped_column(
        String(50),
        default=lambda: datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        onupdate=lambda: datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        comment="更新时间"
    )

    __table_args__ = (
        UniqueConstraint('年份', '神殿', '姓名', name='uq_hr_basic_year_campus_name'),
        Index('idx_hr_basic_年份', '年份'),
        Index('idx_hr_basic_神殿', '神殿'),
        Index('idx_hr_basic_姓名', '姓名'),
        Index('idx_hr_basic_员工ID', '员工ID'),
        {"schema": "consult", "comment": "祈福司人员基础信息表"}
    )

    def __repr__(self):
        return f"<祈福司人员基础信息表(记录ID={self.记录ID}, 年份={self.年份}, 神殿={self.神殿}, 姓名={self.姓名})>"
