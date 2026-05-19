"""
就业模块神殿表模型
为每个神殿创建独立的就业明细表
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, Date, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    """Declarative base for campus employment models."""

    pass

class 就业明细表_主神殿(Base):
    """主神殿就业明细表"""
    __tablename__ = "就业明细表_主神殿"
    
    # 主键
    明细ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    
    # 基本信息
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号")
    姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="姓名")
    性别: Mapped[str] = mapped_column(String(10), nullable=False, comment="性别")
    年龄: Mapped[int] = mapped_column(Integer, nullable=False, comment="年龄")
    所报专业: Mapped[str] = mapped_column(String(50), nullable=False, comment="所报专业")
    学历: Mapped[str] = mapped_column(String(20), nullable=False, comment="学历")
    联系电话: Mapped[str] = mapped_column(String(20), nullable=False, comment="联系电话")
    入职时间: Mapped[date] = mapped_column(Date, nullable=False, comment="入职时间")
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, default="主神殿", comment="所属神殿")
    就业地区: Mapped[str] = mapped_column(String(50), nullable=False, comment="就业地区")
    就业单位: Mapped[str] = mapped_column(String(200), nullable=False, comment="就业单位")
    就业岗位: Mapped[str] = mapped_column(String(100), nullable=False, comment="就业岗位")
    转正薪资: Mapped[str | None] = mapped_column(Text, nullable=True, comment="转正薪资详情")
    转正金额: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2), nullable=True, comment="转正金额")
    回访情况: Mapped[str | None] = mapped_column(Text, nullable=True, comment="回访情况")
    回访入职公司: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="回访入职公司")
    回访转正金额: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2), nullable=True, comment="回访转正金额")
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    __table_args__ = (
        Index('idx_姓名', '姓名'),
        Index('idx_入职时间', '入职时间'),
        Index('idx_就业地区', '就业地区'),
        Index('idx_就业单位', '就业单位'),
        Index('idx_神殿', '神殿'),
    )

    def __repr__(self):
        return f"<就业明细表_主神殿(序号={self.序号}, 姓名={self.姓名}, 就业单位={self.就业单位})>"

    def to_dict(self):
        return {
            "明细ID": self.明细ID,
            "序号": self.序号,
            "姓名": self.姓名,
            "性别": self.性别,
            "年龄": self.年龄,
            "所报专业": self.所报专业,
            "学历": self.学历,
            "联系电话": self.联系电话,
            "入职时间": self.入职时间.isoformat() if self.入职时间 else None,
            "神殿": self.神殿,
            "就业地区": self.就业地区,
            "就业单位": self.就业单位,
            "就业岗位": self.就业岗位,
            "转正薪资": self.转正薪资,
            "转正金额": float(self.转正金额) if self.转正金额 else None,
            "回访情况": self.回访情况,
            "回访入职公司": self.回访入职公司,
            "回访转正金额": float(self.回访转正金额) if self.回访转正金额 is not None else None,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }

# 为其他神殿创建类似的模型类
def create_campus_employment_model(campus: str):
    """为指定神殿创建就业明细表模型"""
    table_name = f"就业明细表_{campus.replace('神殿', '')}"
    
    class CampusEmploymentModel(Base):
        __tablename__ = table_name
        
        # 主键
        明细ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
        
        # 基本信息
        序号: Mapped[int] = mapped_column(Integer, nullable=False, comment="序号")
        姓名: Mapped[str] = mapped_column(String(50), nullable=False, comment="姓名")
        性别: Mapped[str] = mapped_column(String(10), nullable=False, comment="性别")
        年龄: Mapped[int] = mapped_column(Integer, nullable=False, comment="年龄")
        所报专业: Mapped[str] = mapped_column(String(50), nullable=False, comment="所报专业")
        学历: Mapped[str] = mapped_column(String(20), nullable=False, comment="学历")
        联系电话: Mapped[str] = mapped_column(String(20), nullable=False, comment="联系电话")
        入职时间: Mapped[date] = mapped_column(Date, nullable=False, comment="入职时间")
        神殿: Mapped[str] = mapped_column(String(50), nullable=False, default=campus, comment="所属神殿")
        就业地区: Mapped[str] = mapped_column(String(50), nullable=False, comment="就业地区")
        就业单位: Mapped[str] = mapped_column(String(200), nullable=False, comment="就业单位")
        就业岗位: Mapped[str] = mapped_column(String(100), nullable=False, comment="就业岗位")
        转正薪资: Mapped[str | None] = mapped_column(Text, nullable=True, comment="转正薪资详情")
        转正金额: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2), nullable=True, comment="转正金额")
        回访情况: Mapped[str | None] = mapped_column(Text, nullable=True, comment="回访情况")
        回访入职公司: Mapped[str | None] = mapped_column(String(200), nullable=True, comment="回访入职公司")
        回访转正金额: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2), nullable=True, comment="回访转正金额")
        创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
        更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

        __table_args__ = (
            Index('idx_姓名', '姓名'),
            Index('idx_入职时间', '入职时间'),
            Index('idx_就业地区', '就业地区'),
            Index('idx_就业单位', '就业单位'),
            Index('idx_神殿', '神殿'),
        )

        def __repr__(self):
            return f"<{table_name}(序号={self.序号}, 姓名={self.姓名}, 就业单位={self.就业单位})>"

        def to_dict(self):
            return {
                "明细ID": self.明细ID,
                "序号": self.序号,
                "姓名": self.姓名,
                "性别": self.性别,
                "年龄": self.年龄,
                "所报专业": self.所报专业,
                "学历": self.学历,
                "联系电话": self.联系电话,
                "入职时间": self.入职时间.isoformat() if self.入职时间 else None,
                "神殿": self.神殿,
                "就业地区": self.就业地区,
                "就业单位": self.就业单位,
                "就业岗位": self.就业岗位,
                "转正薪资": self.转正薪资,
                "转正金额": float(self.转正金额) if self.转正金额 else None,
                "回访情况": self.回访情况,
                "回访入职公司": self.回访入职公司,
                "回访转正金额": float(self.回访转正金额) if self.回访转正金额 is not None else None,
                "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
                "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
            }
    
    return CampusEmploymentModel

# 创建所有神殿的模型
CAMPUS_MODELS = {}
for campus in ["主神殿", "永恒殿", "吴来殿", "李大殿", "智慧阁", "光明殿", "神恩殿"]:
    CAMPUS_MODELS[campus] = create_campus_employment_model(campus)
