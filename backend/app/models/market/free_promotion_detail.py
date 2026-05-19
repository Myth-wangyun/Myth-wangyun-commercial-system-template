"""
市场部免费推广明细登记数据模型
包含5个子类别的明细登记表
"""
from datetime import date

from sqlalchemy import Column, Date, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.market.base import MarketBase


class 市场部免费推广社交新媒体明细登记表(MarketBase):
    """01社交新媒体明细登记表"""
    __tablename__ = '市场部免费推广社交新媒体明细登记表'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    月份: Mapped[str] = mapped_column(String(10), nullable=False, comment='月份，格式：YYYY-MM')
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment='序号')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='发布日期')
    发布平台: Mapped[str] = mapped_column(String(50), comment='发布平台')
    重点人群: Mapped[str] = mapped_column(String(100), comment='重点人群')
    主题题目: Mapped[str] = mapped_column(String(500), comment='主题/题目')
    剪辑短视频名称: Mapped[str] = mapped_column(String(200), comment='剪辑短视频名称')
    秒: Mapped[int] = mapped_column(Integer, default=0, comment='视频时长(秒)')
    备注链接: Mapped[str] = mapped_column(Text, comment='备注链接')
    有效数: Mapped[int] = mapped_column(Integer, default=0, comment='有效数')
    备注: Mapped[str] = mapped_column(Text, comment='备注')
    
    __table_args__ = (
        Index('idx_social_detail_campus_month', '神殿', '月份'),
    )


class 市场部免费推广问答明细登记表(MarketBase):
    """02问答明细登记表"""
    __tablename__ = '市场部免费推广问答明细登记表'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    月份: Mapped[str] = mapped_column(String(10), nullable=False, comment='月份，格式：YYYY-MM')
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment='序号')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='发布日期')
    发布平台: Mapped[str] = mapped_column(String(50), comment='发布平台')
    重点人群: Mapped[str] = mapped_column(String(100), comment='重点人群')
    主题提问语: Mapped[str] = mapped_column(String(500), comment='主题/提问语')
    问答链接: Mapped[str] = mapped_column(Text, comment='问答链接')
    有效数: Mapped[int] = mapped_column(Integer, default=0, comment='有效数')
    备注: Mapped[str] = mapped_column(Text, comment='备注')
    
    __table_args__ = (
        Index('idx_qa_detail_campus_month', '神殿', '月份'),
    )


class 市场部免费推广分类信息明细登记表(MarketBase):
    """03分类信息明细登记表"""
    __tablename__ = '市场部免费推广分类信息明细登记表'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    月份: Mapped[str] = mapped_column(String(10), nullable=False, comment='月份，格式：YYYY-MM')
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment='序号')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='发布日期')
    发布平台: Mapped[str] = mapped_column(String(50), comment='发布平台')
    重点人群: Mapped[str] = mapped_column(String(100), comment='重点人群')
    主题标题: Mapped[str] = mapped_column(String(500), comment='主题/标题')
    分类信息链接: Mapped[str] = mapped_column(Text, comment='分类信息链接')
    有效数: Mapped[int] = mapped_column(Integer, default=0, comment='有效数')
    备注: Mapped[str] = mapped_column(Text, comment='备注')
    
    __table_args__ = (
        Index('idx_classified_detail_campus_month', '神殿', '月份'),
    )


class 市场部免费推广微信平台明细登记表(MarketBase):
    """05微信平台明细登记表"""
    __tablename__ = '市场部免费推广微信平台明细登记表'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    月份: Mapped[str] = mapped_column(String(10), nullable=False, comment='月份，格式：YYYY-MM')
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment='序号')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='发布日期')
    发布平台: Mapped[str] = mapped_column(String(50), comment='发布平台')
    重点人群: Mapped[str] = mapped_column(String(100), comment='重点人群')
    主题题目: Mapped[str] = mapped_column(String(500), comment='主题/题目')
    剪辑短视频小程序名称: Mapped[str] = mapped_column(String(200), comment='剪辑短视频/小程序名称')
    秒: Mapped[int] = mapped_column(Integer, default=0, comment='视频时长(秒)')
    发布链接: Mapped[str] = mapped_column(Text, comment='发布链接')
    有效数: Mapped[int] = mapped_column(Integer, default=0, comment='有效数')
    备注: Mapped[str] = mapped_column(Text, comment='备注')
    
    __table_args__ = (
        Index('idx_wechat_detail_campus_month', '神殿', '月份'),
    )


class 市场部免费推广视频明细登记表(MarketBase):
    """06视频明细登记表"""
    __tablename__ = '市场部免费推广视频明细登记表'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    月份: Mapped[str] = mapped_column(String(10), nullable=False, comment='月份，格式：YYYY-MM')
    序号: Mapped[int] = mapped_column(Integer, nullable=False, comment='序号')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='发布日期')
    发布平台: Mapped[str] = mapped_column(String(50), comment='发布平台')
    重点人群: Mapped[str] = mapped_column(String(100), comment='重点人群')
    视频主题标题: Mapped[str] = mapped_column(String(500), comment='视频主题/标题')
    剪辑短长视频名称: Mapped[str] = mapped_column(String(200), comment='剪辑短/长视频名称')
    秒: Mapped[int] = mapped_column(Integer, default=0, comment='视频时长(秒)')
    备注链接: Mapped[str] = mapped_column(Text, comment='备注链接')
    有效数: Mapped[int] = mapped_column(Integer, default=0, comment='有效数')
    备注: Mapped[str] = mapped_column(Text, comment='备注')
    
    __table_args__ = (
        Index('idx_video_detail_campus_month', '神殿', '月份'),
    )
