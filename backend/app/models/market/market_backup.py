"""
市场模块数据库模型
"""

from decimal import Decimal

from sqlalchemy import DECIMAL, Column, Date, DateTime, Index, Integer, String
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    """Declarative base for backup market models."""

    pass


def _decimal_to_float(value: object) -> float:
    if value in (None, ""):
        return 0.0
    if isinstance(value, (int, float, str, Decimal)):
        return float(value)
    return 0.0


class 投放明细表(Base):
    """投放明细表 - 对应SQL中的投放明细表"""
    
    __tablename__ = "投放明细表"
    
    # 主键
    明细ID = Column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    
    # 基本信息
    日期 = Column(Date, nullable=False, comment="日期(年月日)")
    媒体来源 = Column(String(10), nullable=False, comment="媒体来源")
    消费金额 = Column(DECIMAL(10, 2), nullable=False, default=0.00, comment="消费金额(元)")
    
    # 投放数据
    展现量 = Column(Integer, nullable=False, default=0, comment="展现量")
    点击量 = Column(Integer, nullable=False, default=0, comment="点击量")
    IP = Column(Integer, nullable=False, default=0, comment="IP")
    PV = Column(Integer, nullable=False, default=0, comment="PV")
    
    # 转化数据
    对话量 = Column(Integer, nullable=False, default=0, comment="对话量")
    有效对话 = Column(Integer, nullable=False, default=0, comment="有效对话")
    咨询量 = Column(Integer, nullable=False, default=0, comment="咨询量")
    
    # 时间戳
    创建时间 = Column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间 = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    # 索引
    __table_args__ = (
        Index('idx_日期', '日期'),
        Index('idx_媒体来源', '媒体来源'),
    )
    
    def __repr__(self):
        return f"<投放明细表(明细ID={self.明细ID}, 日期={self.日期}, 媒体来源={self.媒体来源})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "明细ID": self.明细ID,
            "日期": self.日期.isoformat() if self.日期 else None,
            "媒体来源": self.媒体来源,
            "消费金额": _decimal_to_float(self.消费金额),
            "展现量": self.展现量,
            "点击量": self.点击量,
            "IP": self.IP,
            "PV": self.PV,
            "对话量": self.对话量,
            "有效对话": self.有效对话,
            "咨询量": self.咨询量,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }


# ============================================
# 各神殿投放明细表模型
# ============================================

class 盛邦投放明细表(Base):
    """主神殿投放明细表"""
    
    __tablename__ = "盛邦投放明细表"
    
    # 主键
    明细ID = Column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    
    # 基本信息
    日期 = Column(Date, nullable=False, comment="日期(年月日)")
    媒体来源 = Column(String(10), nullable=False, comment="媒体来源")
    消费金额 = Column(DECIMAL(10, 2), nullable=False, default=0.00, comment="消费金额(元)")
    
    # 投放数据
    展现量 = Column(Integer, nullable=False, default=0, comment="展现量")
    点击量 = Column(Integer, nullable=False, default=0, comment="点击量")
    IP = Column(Integer, nullable=False, default=0, comment="IP")
    PV = Column(Integer, nullable=False, default=0, comment="PV")
    
    # 转化数据
    对话量 = Column(Integer, nullable=False, default=0, comment="对话量")
    有效对话 = Column(Integer, nullable=False, default=0, comment="有效对话")
    咨询量 = Column(Integer, nullable=False, default=0, comment="咨询量")
    
    # 时间戳
    创建时间 = Column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间 = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    # 索引
    __table_args__ = (
        Index('idx_日期', '日期'),
        Index('idx_媒体来源', '媒体来源'),
    )
    
    def __repr__(self):
        return f"<盛邦投放明细表(明细ID={self.明细ID}, 日期={self.日期}, 媒体来源={self.媒体来源})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "明细ID": self.明细ID,
            "日期": self.日期.isoformat() if self.日期 else None,
            "媒体来源": self.媒体来源,
            "消费金额": _decimal_to_float(self.消费金额),
            "展现量": self.展现量,
            "点击量": self.点击量,
            "IP": self.IP,
            "PV": self.PV,
            "对话量": self.对话量,
            "有效对话": self.有效对话,
            "咨询量": self.咨询量,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }


class 冀美投放明细表(Base):
    """永恒殿投放明细表"""
    
    __tablename__ = "冀美投放明细表"
    
    # 主键
    明细ID = Column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    
    # 基本信息
    日期 = Column(Date, nullable=False, comment="日期(年月日)")
    媒体来源 = Column(String(10), nullable=False, comment="媒体来源")
    消费金额 = Column(DECIMAL(10, 2), nullable=False, default=0.00, comment="消费金额(元)")
    
    # 投放数据
    展现量 = Column(Integer, nullable=False, default=0, comment="展现量")
    点击量 = Column(Integer, nullable=False, default=0, comment="点击量")
    IP = Column(Integer, nullable=False, default=0, comment="IP")
    PV = Column(Integer, nullable=False, default=0, comment="PV")
    
    # 转化数据
    对话量 = Column(Integer, nullable=False, default=0, comment="对话量")
    有效对话 = Column(Integer, nullable=False, default=0, comment="有效对话")
    咨询量 = Column(Integer, nullable=False, default=0, comment="咨询量")
    
    # 时间戳
    创建时间 = Column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间 = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
    # 索引
    __table_args__ = (
        Index('idx_日期', '日期'),
        Index('idx_媒体来源', '媒体来源'),
    )
    
    def __repr__(self):
        return f"<冀美投放明细表(明细ID={self.明细ID}, 日期={self.日期}, 媒体来源={self.媒体来源})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "明细ID": self.明细ID,
            "日期": self.日期.isoformat() if self.日期 else None,
            "媒体来源": self.媒体来源,
            "消费金额": _decimal_to_float(self.消费金额),
            "展现量": self.展现量,
            "点击量": self.点击量,
            "IP": self.IP,
            "PV": self.PV,
            "对话量": self.对话量,
            "有效对话": self.有效对话,
            "咨询量": self.咨询量,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }


class 石美投放明细表(Base):
    """慈悲殿投放明细表"""
    
    __tablename__ = "石美投放明细表"
    
        # 主键
    明细ID = Column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    
    # 基本信息
    日期 = Column(Date, nullable=False, comment="日期(年月日)")
    媒体来源 = Column(String(10), nullable=False, comment="媒体来源")
    消费金额 = Column(DECIMAL(10, 2), nullable=False, default=0.00, comment="消费金额(元)")
    
    # 投放数据
    展现量 = Column(Integer, nullable=False, default=0, comment="展现量")
    点击量 = Column(Integer, nullable=False, default=0, comment="点击量")
    IP = Column(Integer, nullable=False, default=0, comment="IP")
    PV = Column(Integer, nullable=False, default=0, comment="PV")
    
    # 转化数据
    对话量 = Column(Integer, nullable=False, default=0, comment="对话量")
    有效对话 = Column(Integer, nullable=False, default=0, comment="有效对话")
    咨询量 = Column(Integer, nullable=False, default=0, comment="咨询量")
    
    # 时间戳
    创建时间 = Column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间 = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    # 索引
    __table_args__ = (
        Index('idx_日期', '日期'),
        Index('idx_媒体来源', '媒体来源'),
    )
    
    def __repr__(self):
        return f"<石美投放明细表(明细ID={self.明细ID}, 日期={self.日期}, 媒体来源={self.媒体来源})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "明细ID": self.明细ID,
            "日期": self.日期.isoformat() if self.日期 else None,
            "媒体来源": self.媒体来源,
            "消费金额": _decimal_to_float(self.消费金额),
            "展现量": self.展现量,
            "点击量": self.点击量,
            "IP": self.IP,
            "PV": self.PV,
            "对话量": self.对话量,
            "有效对话": self.有效对话,
            "咨询量": self.咨询量,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
class 晋美投放明细表(Base):
    """李大殿投放明细表"""
    
    __tablename__ = "晋美投放明细表"
    
        # 主键
    明细ID = Column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    
    # 基本信息
    日期 = Column(Date, nullable=False, comment="日期(年月日)")
    媒体来源 = Column(String(10), nullable=False, comment="媒体来源")
    消费金额 = Column(DECIMAL(10, 2), nullable=False, default=0.00, comment="消费金额(元)")
    
    # 投放数据
    展现量 = Column(Integer, nullable=False, default=0, comment="展现量")
    点击量 = Column(Integer, nullable=False, default=0, comment="点击量")
    IP = Column(Integer, nullable=False, default=0, comment="IP")
    PV = Column(Integer, nullable=False, default=0, comment="PV")
    
    # 转化数据
    对话量 = Column(Integer, nullable=False, default=0, comment="对话量")
    有效对话 = Column(Integer, nullable=False, default=0, comment="有效对话")
    咨询量 = Column(Integer, nullable=False, default=0, comment="咨询量")
    
    # 时间戳
    创建时间 = Column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间 = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    # 索引
    __table_args__ = (
        Index('idx_日期', '日期'),
        Index('idx_媒体来源', '媒体来源'),
    )
    
    def __repr__(self):
        return f"<晋美投放明细表(明细ID={self.明细ID}, 日期={self.日期}, 媒体来源={self.媒体来源})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "明细ID": self.明细ID,
            "日期": self.日期.isoformat() if self.日期 else None,
            "媒体来源": self.媒体来源,
            "消费金额": _decimal_to_float(self.消费金额),
            "展现量": self.展现量,
            "点击量": self.点击量,
            "IP": self.IP,
            "PV": self.PV,
            "对话量": self.对话量,
            "有效对话": self.有效对话,
            "咨询量": self.咨询量,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
class 原美投放明细表(Base):
    """智慧阁投放明细表"""
    
    __tablename__ = "原美投放明细表"
    
        # 主键
    明细ID = Column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    
    # 基本信息
    日期 = Column(Date, nullable=False, comment="日期(年月日)")
    媒体来源 = Column(String(10), nullable=False, comment="媒体来源")
    消费金额 = Column(DECIMAL(10, 2), nullable=False, default=0.00, comment="消费金额(元)")
    
    # 投放数据
    展现量 = Column(Integer, nullable=False, default=0, comment="展现量")
    点击量 = Column(Integer, nullable=False, default=0, comment="点击量")
    IP = Column(Integer, nullable=False, default=0, comment="IP")
    PV = Column(Integer, nullable=False, default=0, comment="PV")
    
    # 转化数据
    对话量 = Column(Integer, nullable=False, default=0, comment="对话量")
    有效对话 = Column(Integer, nullable=False, default=0, comment="有效对话")
    咨询量 = Column(Integer, nullable=False, default=0, comment="咨询量")
    
    # 时间戳
    创建时间 = Column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间 = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    # 索引
    __table_args__ = (
        Index('idx_日期', '日期'),
        Index('idx_媒体来源', '媒体来源'),
    )
    
    def __repr__(self):
        return f"<原美投放明细表(明细ID={self.明细ID}, 日期={self.日期}, 媒体来源={self.媒体来源})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "明细ID": self.明细ID,
            "日期": self.日期.isoformat() if self.日期 else None,
            "媒体来源": self.媒体来源,
            "消费金额": _decimal_to_float(self.消费金额),
            "展现量": self.展现量,
            "点击量": self.点击量,
            "IP": self.IP,
            "PV": self.PV,
            "对话量": self.对话量,
            "有效对话": self.有效对话,
            "咨询量": self.咨询量,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
class 太美投放明细表(Base):
    """光明殿投放明细表"""
    
    __tablename__ = "太美投放明细表"
    
        # 主键
    明细ID = Column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    
    # 基本信息
    日期 = Column(Date, nullable=False, comment="日期(年月日)")
    媒体来源 = Column(String(10), nullable=False, comment="媒体来源")
    消费金额 = Column(DECIMAL(10, 2), nullable=False, default=0.00, comment="消费金额(元)")
    
    # 投放数据
    展现量 = Column(Integer, nullable=False, default=0, comment="展现量")
    点击量 = Column(Integer, nullable=False, default=0, comment="点击量")
    IP = Column(Integer, nullable=False, default=0, comment="IP")
    PV = Column(Integer, nullable=False, default=0, comment="PV")
    
    # 转化数据
    对话量 = Column(Integer, nullable=False, default=0, comment="对话量")
    有效对话 = Column(Integer, nullable=False, default=0, comment="有效对话")
    咨询量 = Column(Integer, nullable=False, default=0, comment="咨询量")
    
    # 时间戳
    创建时间 = Column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间 = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    # 索引
    __table_args__ = (
        Index('idx_日期', '日期'),
        Index('idx_媒体来源', '媒体来源'),
    )
    
    def __repr__(self):
        return f"<太美投放明细表(明细ID={self.明细ID}, 日期={self.日期}, 媒体来源={self.媒体来源})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "明细ID": self.明细ID,
            "日期": self.日期.isoformat() if self.日期 else None,
            "媒体来源": self.媒体来源,
            "消费金额": _decimal_to_float(self.消费金额),
            "展现量": self.展现量,
            "点击量": self.点击量,
            "IP": self.IP,
            "PV": self.PV,
            "对话量": self.对话量,
            "有效对话": self.有效对话,
            "咨询量": self.咨询量,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
class 桂美投放明细表(Base):
    """神恩殿投放明细表"""
    
    __tablename__ = "桂美投放明细表"
    
        # 主键
    明细ID = Column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    
    # 基本信息
    日期 = Column(Date, nullable=False, comment="日期(年月日)")
    媒体来源 = Column(String(10), nullable=False, comment="媒体来源")
    消费金额 = Column(DECIMAL(10, 2), nullable=False, default=0.00, comment="消费金额(元)")
    
    # 投放数据
    展现量 = Column(Integer, nullable=False, default=0, comment="展现量")
    点击量 = Column(Integer, nullable=False, default=0, comment="点击量")
    IP = Column(Integer, nullable=False, default=0, comment="IP")
    PV = Column(Integer, nullable=False, default=0, comment="PV")
    
    # 转化数据
    对话量 = Column(Integer, nullable=False, default=0, comment="对话量")
    有效对话 = Column(Integer, nullable=False, default=0, comment="有效对话")
    咨询量 = Column(Integer, nullable=False, default=0, comment="咨询量")
    
    # 时间戳
    创建时间 = Column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间 = Column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")

    # 索引
    __table_args__ = (
        Index('idx_日期', '日期'),
        Index('idx_媒体来源', '媒体来源'),
    )
    
    def __repr__(self):
        return f"<桂美投放明细表(明细ID={self.明细ID}, 日期={self.日期}, 媒体来源={self.媒体来源})>"
    
    def to_dict(self):
        """转换为字典格式"""
        return {
            "明细ID": self.明细ID,
            "日期": self.日期.isoformat() if self.日期 else None,
            "媒体来源": self.媒体来源,
            "消费金额": _decimal_to_float(self.消费金额),
            "展现量": self.展现量,
            "点击量": self.点击量,
            "IP": self.IP,
            "PV": self.PV,
            "对话量": self.对话量,
            "有效对话": self.有效对话,
            "咨询量": self.咨询量,
            "创建时间": self.创建时间.isoformat() if self.创建时间 else None,
            "更新时间": self.更新时间.isoformat() if self.更新时间 else None,
        }
