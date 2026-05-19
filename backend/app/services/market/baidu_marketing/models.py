"""
百度营销API - 数据库模型

存储百度营销API的Token和应用配置信息
存储在 market schema 下
"""

from datetime import datetime

from sqlalchemy import BigInteger, Column, DateTime, Index, Integer, String, Text, UniqueConstraint

# 使用市场部的 MarketBase（存储在 market schema）
from app.models.market import MarketBase as Base


class BaiduMarketingApp(Base):
    """
    百度营销应用配置表
    
    存储开发者创建的百度营销应用信息
    """
    __tablename__ = "baidu_marketing_app"
    __table_args__ = (
        {"schema": "market", "comment": "百度营销应用配置表"},
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    app_id = Column(String(64), nullable=False, unique=True, index=True, comment="应用ID")
    app_name = Column(String(100), nullable=False, comment="应用名称")
    secret_key = Column(String(128), nullable=False, comment="应用密钥（加密存储）")
    callback_url = Column(String(500), nullable=False, comment="回调地址")
    developer_user_id = Column(BigInteger, nullable=False, comment="开发者用户ID")
    scope = Column(String(500), default="1_0_1,1_2_1_1", comment="权限范围")
    status = Column(Integer, default=1, comment="状态: 1-正常, 0-禁用")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")


class BaiduMarketingToken(Base):
    """
    百度营销Token表
    
    存储授权用户的accessToken和refreshToken
    """
    __tablename__ = "baidu_marketing_token"
    __table_args__ = (
        UniqueConstraint("app_id", "user_id", name="uq_baidu_marketing_app_user"),
        Index("idx_baidu_marketing_expires_at", "expires_at"),
        Index("idx_baidu_marketing_status_expires", "status", "expires_at"),
        {"schema": "market", "comment": "百度营销Token表"},
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    app_id = Column(String(64), nullable=False, index=True, comment="应用ID")
    user_id = Column(BigInteger, nullable=False, index=True, comment="授权用户ID（ucid）")
    user_name = Column(String(100), nullable=False, comment="推广账户名称（ucname）")
    open_id = Column(String(64), nullable=True, comment="用户标识")
    access_token = Column(Text, nullable=False, comment="授权令牌")
    refresh_token = Column(Text, nullable=False, comment="刷新令牌")
    expires_at = Column(DateTime, nullable=False, comment="accessToken过期时间")
    refresh_expires_at = Column(DateTime, nullable=False, comment="refreshToken过期时间")
    user_acct_type = Column(Integer, default=1, comment="账户类型: 1-普通账户, 2-超管账户")
    master_uid = Column(BigInteger, nullable=True, comment="超管账户ID（如果是子账户）")
    master_name = Column(String(100), nullable=True, comment="超管账户名称")
    status = Column(Integer, default=1, comment="状态: 1-正常, 0-已失效")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, comment="更新时间")


class BaiduMarketingAuthLog(Base):
    """
    百度营销授权日志表
    
    记录OAuth授权相关的日志
    """
    __tablename__ = "baidu_marketing_auth_log"
    __table_args__ = (
        Index("idx_baidu_marketing_app_action", "app_id", "action"),
        Index("idx_baidu_marketing_user_action", "user_id", "action"),
        {"schema": "market", "comment": "百度营销授权日志表"},
    )
    
    id = Column(Integer, primary_key=True, autoincrement=True, comment="主键ID")
    app_id = Column(String(64), nullable=False, index=True, comment="应用ID")
    user_id = Column(BigInteger, nullable=True, comment="用户ID")
    action = Column(String(50), nullable=False, comment="操作类型: callback/exchange_token/refresh_token/revoke")
    status = Column(String(20), nullable=False, comment="状态: success/failed")
    error_code = Column(String(20), nullable=True, comment="错误码")
    error_message = Column(Text, nullable=True, comment="错误信息")
    request_data = Column(Text, nullable=True, comment="请求数据（脱敏）")
    response_data = Column(Text, nullable=True, comment="响应数据（脱敏）")
    ip_address = Column(String(50), nullable=True, comment="IP地址")
    user_agent = Column(String(500), nullable=True, comment="User-Agent")
    created_at = Column(DateTime, default=datetime.now, index=True, comment="创建时间")
