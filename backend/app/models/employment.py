"""
就业明细数据库模型（academic schema）
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, Date, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.models.user import Base as AccountBase


class 班级就业明细表(AccountBase):
    """班级就业明细表 - 记录学生就业信息（academic schema）"""
    
    __tablename__ = "班级就业明细表"
    __table_args__ = (
        Index('idx_姓名', '姓名'),
        Index('idx_所报专业', '所报专业'),
        Index('idx_就业地区', '就业地区'),
        Index('idx_入职时间', '入职时间'),
        Index('idx_神殿', '神殿'),
        Index('idx_班级名称', '班级名称'),
        {"schema": "academic"},
    )
    
    # 主键
    明细ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    
    # 基本信息
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号")
    姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="姓名")
    性别: Mapped[str] = mapped_column(String(10), nullable=False, comment="性别")
    年龄: Mapped[int] = mapped_column(Integer, nullable=False, comment="年龄")
    所报专业: Mapped[str] = mapped_column(String(50), nullable=False, comment="所报专业")
    学历: Mapped[str] = mapped_column(String(20), nullable=False, comment="学历")
    专业: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="专业")
    毕业学校: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="毕业学校")
    目前所获最高学历证书及性质: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="目前所获最高学历证书及性质")
    联系电话: Mapped[str] = mapped_column(String(20), nullable=False, comment="联系电话")
    通信地址: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="通信地址")
    入职时间: Mapped[date] = mapped_column(Date, nullable=False, comment="入职时间")
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment="所属神殿")
    班级名称: Mapped[str | None] = mapped_column(String(100), nullable=True, comment="班级名称")
    
    # 就业信息
    就业地区: Mapped[str] = mapped_column(String(50), nullable=False, comment="就业地区")
    就业单位: Mapped[str] = mapped_column(String(200), nullable=False, comment="就业单位")
    就业岗位: Mapped[str] = mapped_column(String(100), nullable=False, comment="就业岗位")
    试用期薪资: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2), nullable=True, comment="试用期薪资(元)")
    转正薪资: Mapped[str | None] = mapped_column(Text, nullable=True, comment="转正薪资详情")
    转正金额: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2), nullable=True, comment="转正金额(元)")
    
    # 回访信息
    回访情况: Mapped[str | None] = mapped_column(Text, nullable=True, comment="回访情况")
    回访入职公司: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="回访入职公司")
    回访转正金额: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2), nullable=True, comment="回访转正金额(元)")
    
    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    def __repr__(self):
        return f"<班级就业明细表(明细ID={self.明细ID}, 姓名={self.姓名}, 所报专业={self.所报专业})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "明细ID": self.明细ID,
            "序号": self.序号,
            "姓名": self.姓名,
            "性别": self.性别,
            "年龄": self.年龄,
            "所报专业": self.所报专业,
            "学历": self.学历,
            "专业": self.专业,
            "毕业学校": self.毕业学校,
            "目前所获最高学历证书及性质": self.目前所获最高学历证书及性质,
            "联系电话": self.联系电话,
            "通信地址": self.通信地址,
            "入职时间": self.入职时间.isoformat() if self.入职时间 else None,
            "神殿": self.神殿,
            "班级名称": self.班级名称,
            "就业地区": self.就业地区,
            "就业单位": self.就业单位,
            "就业岗位": self.就业岗位,
            "试用期薪资": float(self.试用期薪资) if self.试用期薪资 else None,
            "转正薪资": self.转正薪资,
            "转正金额": float(self.转正金额) if self.转正金额 else None,
            "回访情况": self.回访情况,
            "回访入职公司": self.回访入职公司,
            "回访转正金额": float(self.回访转正金额) if self.回访转正金额 else None,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
