"""
市场模块数据库模型
"""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import DECIMAL, Column, Date, DateTime, Index, Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    """Declarative base for legacy market models."""

    pass


class 投放明细表(Base):
    """投放明细表 - 对应SQL中的投放明细表"""
    
    __tablename__ = "投放明细表"
    
    # 主键
    明细ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
    
    # 基本信息
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment="日期(年月日)")
    媒体来源: Mapped[str] = mapped_column(String(10), nullable=False, comment="媒体来源")
    消费金额: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment="消费金额(元)")
    
    # 投放数据
    展现量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="展现量")
    点击量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="点击量")
    IP: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="IP")
    PV: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="PV")
    
    # 转化数据
    对话量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="对话量")
    有效对话: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="有效对话")
    咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="咨询量")
    
    # 时间戳
    创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
    更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
    
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
            "消费金额": float(self.消费金额) if self.消费金额 else 0.0,
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

def create_campus_table_class(table_name, campus_name):
    """创建神殿投放明细表类"""
    
    # 生成唯一的索引名前缀（使用表名）
    # 例如：盛邦投放明细表 -> idx_盛邦投放明细表_日期
    # PostgreSQL 中索引名必须全局唯一，所以需要包含表名
    index_prefix = f"idx_{table_name}"
    
    class Campus投放明细表(Base):
        """{campus_name}投放明细表"""
        
        __tablename__ = table_name
        
        # 主键
        明细ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, comment="明细ID")
        
        # 基本信息
        日期: Mapped[date] = mapped_column(Date, nullable=False, comment="日期(年月日)")
        媒体来源: Mapped[str] = mapped_column(String(10), nullable=False, comment="媒体来源")
        消费金额: Mapped[Decimal] = mapped_column(DECIMAL(10, 2), nullable=False, default=0.00, comment="消费金额(元)")
        
        # 投放数据
        展现量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="展现量")
        点击量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="点击量")
        IP: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="IP")
        PV: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="PV")
        
        # 转化数据
        对话量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="对话量")
        有效对话: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="有效对话")
        咨询量: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="咨询量")
        
        # 时间戳
        创建时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), comment="创建时间")
        更新时间: Mapped[datetime] = mapped_column(DateTime, default=func.current_timestamp(), onupdate=func.current_timestamp(), comment="更新时间")
        
        # 索引 - 使用唯一的索引名（包含表名，避免 PostgreSQL 索引名冲突）
        __table_args__ = (
            Index(f'{index_prefix}_日期', '日期'),
            Index(f'{index_prefix}_媒体来源', '媒体来源'),
        )
        
        def __repr__(self):
            return f"<{table_name}(明细ID={{self.明细ID}}, 日期={{self.日期}}, 媒体来源={{self.媒体来源}})>"
        
        def to_dict(self):
            """转换为字典格式"""
            return {
                "明细ID": self.明细ID,
                "日期": self.日期.isoformat() if self.日期 else None,
                "媒体来源": self.媒体来源,
                "消费金额": float(self.消费金额) if self.消费金额 else 0.0,
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
    
    # 设置类名和文档字符串
    Campus投放明细表.__name__ = table_name
    Campus投放明细表.__doc__ = f"{campus_name}投放明细表"
    
    return Campus投放明细表

# 创建各神殿投放明细表类
盛邦投放明细表 = create_campus_table_class("盛邦投放明细表", "主神殿")
冀美投放明细表 = create_campus_table_class("冀美投放明细表", "永恒殿")
石美投放明细表 = create_campus_table_class("石美投放明细表", "慈悲殿")
晋美投放明细表 = create_campus_table_class("晋美投放明细表", "李大殿")
原美投放明细表 = create_campus_table_class("原美投放明细表", "智慧阁")
太美投放明细表 = create_campus_table_class("太美投放明细表", "光明殿")
桂美投放明细表 = create_campus_table_class("桂美投放明细表", "神恩殿")
