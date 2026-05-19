"""
市场部免费推广日度数据模型
包含6个子类别的数据表
"""
from datetime import date
from decimal import Decimal

from sqlalchemy import Column, Date, Index, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.market.base import MarketBase


class 市场部免费推广社交新媒体日度数据表(MarketBase):
    """01社交新媒体日度数据表"""
    __tablename__ = '市场部免费推广社交新媒体日度数据表'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # 基本信息
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='数据日期')
    
    # 社交新媒体实际收入汇总数据
    社交新媒体实际收入: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment='社交新媒体实际收入')
    社交新媒体报名转化率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='社交新媒体报名转化率')
    退费数: Mapped[int] = mapped_column(Integer, default=0, comment='退费数')
    净报名: Mapped[int] = mapped_column(Integer, default=0, comment='净报名')
    毛报总数: Mapped[int] = mapped_column(Integer, default=0, comment='毛报总数')
    订座数: Mapped[int] = mapped_column(Integer, default=0, comment='订座数')
    上门人数: Mapped[int] = mapped_column(Integer, default=0, comment='上门人数')
    社交新媒体咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='社交新媒体咨询量')
    咨询量成本: Mapped[Decimal] = mapped_column(Numeric(15, 2), comment='咨询量成本')
    社交新媒体消耗: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment='社交新媒体消耗')
    
    # 抖音总览
    抖音有效条数: Mapped[int] = mapped_column(Integer, default=0, comment='抖音有效条数')
    抖音播放量: Mapped[int] = mapped_column(Integer, default=0, comment='抖音播放量')
    抖音点赞量: Mapped[int] = mapped_column(Integer, default=0, comment='抖音点赞量')
    抖音评论量: Mapped[int] = mapped_column(Integer, default=0, comment='抖音评论量')
    抖音分享量: Mapped[int] = mapped_column(Integer, default=0, comment='抖音分享量')
    抖音收藏量: Mapped[int] = mapped_column(Integer, default=0, comment='抖音收藏量')
    抖音咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='抖音咨询量')
    
    # 抖音内容吸引力
    抖音完播率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='抖音完播率')
    抖音2s跳出率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='抖音2s跳出率')
    抖音平均访问时长: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='抖音平均访问时长(秒)')
    抖音5s完播率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='抖音5s完播率')
    抖音平均播放占比: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='抖音平均播放占比')
    
    # 抖音观众参与度
    抖音点赞率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='抖音点赞率')
    抖音评论率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='抖音评论率')
    抖音分享率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='抖音分享率')
    抖音收藏率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='抖音收藏率')
    抖音不感兴趣率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='抖音不感兴趣率')
    
    # 快手喜爱分诊断
    快手有效条数: Mapped[int] = mapped_column(Integer, default=0, comment='快手有效条数')
    快手喜爱分: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='快手喜爱分')
    快手画质清晰度: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='快手画质清晰度')
    快手标题质量: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='快手标题质量')
    快手咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='快手咨询量')
    
    # 快手播放数据
    快手播放量: Mapped[int] = mapped_column(Integer, default=0, comment='快手播放量')
    快手平均播放时长: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='快手平均播放时长(秒)')
    快手封面点击率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='快手封面点击率')
    快手2s跳出率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='快手2s跳出率')
    快手5s完播率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='快手5s完播率')
    快手完播率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='快手完播率')
    
    # 快手互动效果
    快手点赞量: Mapped[int] = mapped_column(Integer, default=0, comment='快手点赞量')
    快手评论量: Mapped[int] = mapped_column(Integer, default=0, comment='快手评论量')
    快手分享量: Mapped[int] = mapped_column(Integer, default=0, comment='快手分享量')
    快手收藏量: Mapped[int] = mapped_column(Integer, default=0, comment='快手收藏量')
    快手涨粉量: Mapped[int] = mapped_column(Integer, default=0, comment='快手涨粉量')
    
    备注: Mapped[str] = mapped_column(Text, comment='备注')
    
    __table_args__ = (
        Index('idx_free_social_campus_date', '神殿', '日期'),
    )


class 市场部免费推广问答日度数据表(MarketBase):
    """02问答日度数据表"""
    __tablename__ = '市场部免费推广问答日度数据表'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # 基本信息
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='数据日期')
    
    # 问答类快手汇总数据
    问答实际收入: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment='问答实际收入')
    问答报名转化率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='问答报名转化率')
    退费数: Mapped[int] = mapped_column(Integer, default=0, comment='退费数')
    净报名: Mapped[int] = mapped_column(Integer, default=0, comment='净报名')
    毛报总数: Mapped[int] = mapped_column(Integer, default=0, comment='毛报总数')
    订座数: Mapped[int] = mapped_column(Integer, default=0, comment='订座数')
    上门人数: Mapped[int] = mapped_column(Integer, default=0, comment='上门人数')
    问答咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='问答咨询量')
    咨询量成本: Mapped[Decimal] = mapped_column(Numeric(15, 2), comment='咨询量成本')
    问答花费: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment='问答花费')
    
    # 百度知道
    百度知道有效条数: Mapped[int] = mapped_column(Integer, default=0, comment='百度知道有效条数')
    百度知道浏览量: Mapped[int] = mapped_column(Integer, default=0, comment='百度知道浏览量')
    百度知道点赞数: Mapped[int] = mapped_column(Integer, default=0, comment='百度知道点赞数')
    百度知道有效数: Mapped[int] = mapped_column(Integer, default=0, comment='百度知道有效数')
    百度知道有效率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='百度知道有效率')
    百度知道咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='百度知道咨询量')
    
    # 知乎
    知乎有效条数: Mapped[int] = mapped_column(Integer, default=0, comment='知乎有效条数')
    知乎浏览量: Mapped[int] = mapped_column(Integer, default=0, comment='知乎浏览量')
    知乎点赞数: Mapped[int] = mapped_column(Integer, default=0, comment='知乎点赞数')
    知乎有效数: Mapped[int] = mapped_column(Integer, default=0, comment='知乎有效数')
    知乎有效率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='知乎有效率')
    知乎咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='知乎咨询量')
    
    备注: Mapped[str] = mapped_column(Text, comment='备注')
    
    __table_args__ = (
        Index('idx_free_qa_campus_date', '神殿', '日期'),
    )


class 市场部免费推广分类信息日度数据表(MarketBase):
    """03分类信息日度数据表"""
    __tablename__ = '市场部免费推广分类信息日度数据表'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # 基本信息
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='数据日期')
    
    # 分类信息汇总数据
    分类信息实际收入: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment='分类信息实际收入')
    分类信息报名转化率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='分类信息报名转化率')
    退费数: Mapped[int] = mapped_column(Integer, default=0, comment='退费数')
    净报名: Mapped[int] = mapped_column(Integer, default=0, comment='净报名')
    毛报总数: Mapped[int] = mapped_column(Integer, default=0, comment='毛报总数')
    订座数: Mapped[int] = mapped_column(Integer, default=0, comment='订座数')
    上门人数: Mapped[int] = mapped_column(Integer, default=0, comment='上门人数')
    分类信息咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='分类信息咨询量')
    咨询量成本: Mapped[Decimal] = mapped_column(Numeric(15, 2), comment='咨询量成本')
    分类信息花费: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment='分类信息花费')
    
    # 分类信息基础数据
    有效分类信息量: Mapped[int] = mapped_column(Integer, default=0, comment='有效分类信息量')
    有效量: Mapped[int] = mapped_column(Integer, default=0, comment='有效量')
    有效率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='有效率')
    浏览量: Mapped[int] = mapped_column(Integer, default=0, comment='浏览量')
    点赞量: Mapped[int] = mapped_column(Integer, default=0, comment='点赞量')
    分享量: Mapped[int] = mapped_column(Integer, default=0, comment='分享量')
    咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='咨询量')
    
    备注: Mapped[str] = mapped_column(Text, comment='备注')
    
    __table_args__ = (
        Index('idx_free_classified_campus_date', '神殿', '日期'),
    )


class 市场部免费推广地图日度数据表(MarketBase):
    """04地图日度数据表"""
    __tablename__ = '市场部免费推广地图日度数据表'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # 基本信息
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='数据日期')
    
    # 地图汇总数据
    地图实际收入: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment='地图实际收入')
    地图报名转化率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='地图报名转化率')
    退费数: Mapped[int] = mapped_column(Integer, default=0, comment='退费数')
    净报名: Mapped[int] = mapped_column(Integer, default=0, comment='净报名')
    毛报总数: Mapped[int] = mapped_column(Integer, default=0, comment='毛报总数')
    订座数: Mapped[int] = mapped_column(Integer, default=0, comment='订座数')
    上门人数: Mapped[int] = mapped_column(Integer, default=0, comment='上门人数')
    地图总量: Mapped[int] = mapped_column(Integer, default=0, comment='地图总量')
    咨询量成本: Mapped[Decimal] = mapped_column(Numeric(15, 2), comment='咨询量成本')
    地图消费: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment='地图消费')
    
    # 百度地图
    百度地图评论数: Mapped[int] = mapped_column(Integer, default=0, comment='百度地图评论数')
    百度地图点赞数: Mapped[int] = mapped_column(Integer, default=0, comment='百度地图点赞数')
    百度地图图片数: Mapped[int] = mapped_column(Integer, default=0, comment='百度地图图片数')
    百度地图精选案例数: Mapped[int] = mapped_column(Integer, default=0, comment='百度地图精选案例数')
    百度地图产品服务数: Mapped[int] = mapped_column(Integer, default=0, comment='百度地图产品服务数')
    百度地图评论分: Mapped[Decimal] = mapped_column(Numeric(3, 1), comment='百度地图评论分')
    百度地图咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='百度地图电话/咨询量')
    
    # 高德地图
    高德地图评论数: Mapped[int] = mapped_column(Integer, default=0, comment='高德地图评论数')
    高德地图点赞数: Mapped[int] = mapped_column(Integer, default=0, comment='高德地图点赞数')
    高德地图图片数: Mapped[int] = mapped_column(Integer, default=0, comment='高德地图图片数')
    高德地图产品服务数: Mapped[int] = mapped_column(Integer, default=0, comment='高德地图产品服务数')
    高德地图评论分: Mapped[Decimal] = mapped_column(Numeric(3, 1), comment='高德地图评论分')
    高德地图咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='高德地图电话/咨询量')
    
    # 腾讯地图（微信地图）
    腾讯地图评论数: Mapped[int] = mapped_column(Integer, default=0, comment='腾讯地图评论数')
    腾讯地图点赞数: Mapped[int] = mapped_column(Integer, default=0, comment='腾讯地图点赞数')
    腾讯地图图片数: Mapped[int] = mapped_column(Integer, default=0, comment='腾讯地图图片数')
    腾讯地图产品服务数: Mapped[int] = mapped_column(Integer, default=0, comment='腾讯地图产品服务数')
    腾讯地图评论分: Mapped[Decimal] = mapped_column(Numeric(3, 1), comment='腾讯地图评论分')
    腾讯地图咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='腾讯地图电话/咨询量')
    
    # 其他地图（360、谷歌等）
    其他地图评论数: Mapped[int] = mapped_column(Integer, default=0, comment='其他地图评论数')
    其他地图点赞数: Mapped[int] = mapped_column(Integer, default=0, comment='其他地图点赞数')
    其他地图图片数: Mapped[int] = mapped_column(Integer, default=0, comment='其他地图图片数')
    其他地图产品服务数: Mapped[int] = mapped_column(Integer, default=0, comment='其他地图产品服务数')
    其他地图评论分: Mapped[Decimal] = mapped_column(Numeric(3, 1), comment='其他地图评论分')
    其他地图咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='其他地图电话/咨询量')
    
    备注: Mapped[str] = mapped_column(Text, comment='备注')
    
    __table_args__ = (
        Index('idx_free_map_campus_date', '神殿', '日期'),
    )


class 市场部免费推广微信平台日度数据表(MarketBase):
    """05微信平台日度数据表"""
    __tablename__ = '市场部免费推广微信平台日度数据表'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # 基本信息
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='数据日期')
    
    # 微信平台汇总数据
    微信平台实际收入: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment='微信平台实际收入')
    微信平台报名转化率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='微信平台报名转化率')
    退费数: Mapped[int] = mapped_column(Integer, default=0, comment='退费数')
    净报名: Mapped[int] = mapped_column(Integer, default=0, comment='净报名')
    毛报总数: Mapped[int] = mapped_column(Integer, default=0, comment='毛报总数')
    订座数: Mapped[int] = mapped_column(Integer, default=0, comment='订座数')
    上门人数: Mapped[int] = mapped_column(Integer, default=0, comment='上门人数')
    微信平台咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='微信平台咨询量')
    咨询量成本: Mapped[Decimal] = mapped_column(Numeric(15, 2), comment='咨询量成本')
    微信平台花费: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment='微信平台花费')
    
    # 微信视频号数据
    视频号有效条数: Mapped[int] = mapped_column(Integer, default=0, comment='微信视频号有效条数')
    视频号数据诊断结果均值: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='微信视频号数据诊断结果均值')
    视频号播放量: Mapped[int] = mapped_column(Integer, default=0, comment='微信视频号播放量')
    视频号完播率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='微信视频号完播率')
    视频号平均播放时长: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='微信视频号平均播放时长(秒)')
    视频号3s以上播放率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='微信视频号3s以上播放率')
    视频号喜欢数: Mapped[int] = mapped_column(Integer, default=0, comment='微信视频号喜欢数')
    视频号点赞数: Mapped[int] = mapped_column(Integer, default=0, comment='微信视频号点赞数')
    视频号评论数: Mapped[int] = mapped_column(Integer, default=0, comment='微信视频号评论数')
    视频号新增关注: Mapped[int] = mapped_column(Integer, default=0, comment='微信视频号新增关注')
    视频号转发量: Mapped[int] = mapped_column(Integer, default=0, comment='微信视频号转发总量')
    视频号咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='微信视频号咨询量')
    
    # 公众号数据
    公众号文章数: Mapped[int] = mapped_column(Integer, default=0, comment='公众号文章数')
    公众号阅读量: Mapped[int] = mapped_column(Integer, default=0, comment='公众号阅读量')
    公众号点赞数: Mapped[int] = mapped_column(Integer, default=0, comment='公众号点赞数')
    公众号分享数: Mapped[int] = mapped_column(Integer, default=0, comment='公众号分享数')
    公众号推荐数: Mapped[int] = mapped_column(Integer, default=0, comment='公众号推荐人数')
    公众号留言数: Mapped[int] = mapped_column(Integer, default=0, comment='公众号留言条数')
    公众号咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='公众号咨询量')
    
    # 朋友圈数据
    朋友圈发布数: Mapped[int] = mapped_column(Integer, default=0, comment='朋友圈发布数')
    朋友圈互动量: Mapped[int] = mapped_column(Integer, default=0, comment='朋友圈互动量')
    朋友圈咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='朋友圈咨询量')
    
    备注: Mapped[str] = mapped_column(Text, comment='备注')
    
    __table_args__ = (
        Index('idx_free_wechat_campus_date', '神殿', '日期'),
    )


class 市场部免费推广视频日度数据表(MarketBase):
    """06视频日度数据表"""
    __tablename__ = '市场部免费推广视频日度数据表'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # 基本信息
    神殿: Mapped[str] = mapped_column(String(50), nullable=False, comment='神殿名称')
    日期: Mapped[date] = mapped_column(Date, nullable=False, comment='数据日期')
    
    # 视频汇总数据
    视频实际收入: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment='视频实际收入')
    视频报名转化率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='视频报名转化率')
    退费数: Mapped[int] = mapped_column(Integer, default=0, comment='退费数')
    净报名: Mapped[int] = mapped_column(Integer, default=0, comment='净报名')
    毛报总数: Mapped[int] = mapped_column(Integer, default=0, comment='毛报总数')
    订座数: Mapped[int] = mapped_column(Integer, default=0, comment='订座数')
    上门人数: Mapped[int] = mapped_column(Integer, default=0, comment='上门人数')
    视频咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='视频咨询量')
    咨询量成本: Mapped[Decimal] = mapped_column(Numeric(15, 2), comment='咨询量成本')
    视频花费: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=0, comment='视频花费')
    
    # 爱奇艺视频
    爱奇艺视频数: Mapped[int] = mapped_column(Integer, default=0, comment='爱奇艺视频数')
    爱奇艺展现量: Mapped[int] = mapped_column(Integer, default=0, comment='爱奇艺总展现量')
    爱奇艺播放量: Mapped[int] = mapped_column(Integer, default=0, comment='爱奇艺总播放量')
    爱奇艺总播放时长: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='爱奇艺总播放时长(秒)')
    爱奇艺总播放完成率: Mapped[Decimal] = mapped_column(Numeric(10, 2), comment='爱奇艺总播放完成率')
    爱奇艺评论量: Mapped[int] = mapped_column(Integer, default=0, comment='爱奇艺总评论量')
    爱奇艺点赞量: Mapped[int] = mapped_column(Integer, default=0, comment='爱奇艺总点赞量')
    爱奇艺咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='爱奇艺咨询量')
    
    # 腾讯视频
    腾讯视频数: Mapped[int] = mapped_column(Integer, default=0, comment='腾讯视频数')
    腾讯播放量: Mapped[int] = mapped_column(Integer, default=0, comment='腾讯播放量')
    腾讯点赞量: Mapped[int] = mapped_column(Integer, default=0, comment='腾讯点赞量')
    腾讯评论量: Mapped[int] = mapped_column(Integer, default=0, comment='腾讯评论量')
    腾讯咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='腾讯咨询量')
    
    # 优酷视频
    优酷视频数: Mapped[int] = mapped_column(Integer, default=0, comment='优酷视频数')
    优酷播放量: Mapped[int] = mapped_column(Integer, default=0, comment='优酷播放量')
    优酷点赞量: Mapped[int] = mapped_column(Integer, default=0, comment='优酷点赞量')
    优酷评论量: Mapped[int] = mapped_column(Integer, default=0, comment='优酷评论量')
    优酷分享量: Mapped[int] = mapped_column(Integer, default=0, comment='优酷分享量')
    优酷粉丝数: Mapped[int] = mapped_column(Integer, default=0, comment='优酷粉丝数')
    优酷咨询量: Mapped[int] = mapped_column(Integer, default=0, comment='优酷咨询量')
    
    备注: Mapped[str] = mapped_column(Text, comment='备注')
    
    __table_args__ = (
        Index('idx_free_video_campus_date', '神殿', '日期'),
    )
