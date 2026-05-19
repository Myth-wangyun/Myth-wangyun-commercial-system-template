"""
百度营销API - 配置管理

从环境变量或配置文件加载百度营销API配置
"""

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class BaiduMarketingConfig:
    """百度营销API配置"""
    
    # 应用配置
    app_id: str
    secret_key: str
    callback_url: str
    developer_user_id: int
    
    # 可选配置
    scope: str = "1_0_1,1_2_1_1"
    
    @classmethod
    def from_env(cls) -> Optional["BaiduMarketingConfig"]:
        """
        从环境变量加载配置
        
        环境变量:
        - BAIDU_MARKETING_APP_ID: 应用ID
        - BAIDU_MARKETING_SECRET_KEY: 应用密钥
        - BAIDU_MARKETING_CALLBACK_URL: 回调地址
        - BAIDU_MARKETING_DEVELOPER_USER_ID: 开发者用户ID
        - BAIDU_MARKETING_SCOPE: 权限范围（可选）
        """
        app_id = os.getenv("BAIDU_MARKETING_APP_ID")
        secret_key = os.getenv("BAIDU_MARKETING_SECRET_KEY")
        callback_url = os.getenv("BAIDU_MARKETING_CALLBACK_URL")
        developer_user_id = os.getenv("BAIDU_MARKETING_DEVELOPER_USER_ID")

        if not app_id or not secret_key or not callback_url or not developer_user_id:
            return None

        try:
            parsed_developer_user_id = int(developer_user_id)
        except ValueError:
            return None

        return cls(
            app_id=app_id,
            secret_key=secret_key,
            callback_url=callback_url,
            developer_user_id=parsed_developer_user_id,
            scope=os.getenv("BAIDU_MARKETING_SCOPE") or "1_0_1,1_2_1_1",
        )
    
    def to_dict(self) -> dict:
        """转为字典（不含敏感信息）"""
        return {
            "app_id": self.app_id,
            "callback_url": self.callback_url,
            "developer_user_id": self.developer_user_id,
            "scope": self.scope,
        }


# 默认配置（示例，请替换为真实值）
DEFAULT_CONFIG = BaiduMarketingConfig(
    app_id="your_app_id_here",
    secret_key="your_secret_key_here",
    callback_url="https://your-domain.com/api/v1/baidu-marketing/oauth/callback",
    developer_user_id=123456,
)


def get_config() -> BaiduMarketingConfig:
    """
    获取配置
    
    优先从环境变量加载，否则使用默认配置
    """
    config = BaiduMarketingConfig.from_env()
    if config is None:
        # 生产环境不应使用默认配置
        import warnings
        warnings.warn(
            "未配置百度营销API环境变量，使用默认配置（仅用于开发测试）",
            RuntimeWarning
        )
        config = DEFAULT_CONFIG
    return config
