"""应用配置模块

从环境变量读取配置信息。
"""

import json
import os
from typing import Any, Dict, List, Optional

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _resolve_env_files() -> tuple[str, ...]:
    """Pick the matching env files without letting production defaults bleed into tests."""

    app_env = (os.environ.get("APP_ENV") or "").strip().lower()
    if app_env == "test":
        return (".env.test", ".env")
    if app_env in {"prod", "production"}:
        return (".env.production", ".env")
    return (".env",)


class Settings(BaseSettings):
    """应用配置类"""
    # 应用配置
    APP_NAME: str = "清美教育管理系统"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    # 服务器配置
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    RELOAD: bool = True
    SQL_ECHO: bool = False
    
    # 数据库配置（PostgreSQL）
    DB_HOST: str = "/var/run/postgresql"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_NAME: str = "qmjy"
    DB_CHARSET: str = "utf8"
    
    # 数据库连接池配置
    DB_POOL_SIZE: int = 200       # 基础连接数（原5→20）
    DB_MAX_OVERFLOW: int = 30    # 溢出连接数（原10→30），总共最多50连接
    DB_POOL_RECYCLE: int = 1800  # 连接回收时间（原360→1800秒）
    DB_POOL_TIMEOUT: int = 30    # 获取连接超时时间（秒）
    
    # JWT认证配置
    SECRET_KEY: str = "your-secret-key-here-please-change-it"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS配置
    # 说明：生产环境里常见两种写法：
    # - 逗号分隔字符串："http://a,http://b"
    # - JSON 数组字符串："[\"http://a\",\"http://b\"]"
    # 这里先按原始字符串读取，随后在 settings 创建后统一归一化为 List[str]。
    ALLOWED_ORIGINS: Any = (
        "http://localhost:3000,"
        "http://localhost:8080,"
        "http://127.0.0.1:5500,"
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    )
    ALLOW_ORIGIN_REGEX: Optional[str] = None
    
    # 文件上传配置
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 10485760  # 10MB
    # 说明：同样兼容两种写法：
    # - 逗号分隔字符串："xlsx,xls,png"
    # - JSON 数组字符串："[\"xlsx\",\"xls\",\"png\"]"
    # 这里先按原始字符串读取，随后统一归一化为 List[str]。
    ALLOWED_EXTENSIONS: Any = "xlsx,xls,csv,pdf,jpg,jpeg,png"
    
    # 日志配置
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    LOG_ROTATION: str = "500 MB"
    LOG_RETENTION: str = "10 days"
    
    # 分页配置
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # 神殿配置（从环境变量读取，如果没有则使用默认值）
    CAMPUS_NAME: str = "最高议事厅"
    CAMPUS_CODE: str = "center"
    
    # 安全配置
    REQUIRE_AUTH: bool = True
    # 开发免登录开关：在 development/test 下可强制关闭认证
    # 说明：生产环境默认不会使用该开关。
    # 若需要在 dev 环境临时强制开启认证，可显式设置 REQUIRE_AUTH=true。
    DEV_NO_AUTH: bool = False
    
    # 速率限制配置
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    @field_validator(
        "DEBUG",
        "RELOAD",
        "SQL_ECHO",
        "REQUIRE_AUTH",
        "DEV_NO_AUTH",
        "RATE_LIMIT_ENABLED",
        mode="before",
    )
    @classmethod
    def _normalize_bool_like_value(cls, value: Any) -> Any:
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug", "dev", "development"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "prod", "production"}:
                return False
        return value
    
    @property
    def DATABASE_URL(self) -> str:
        """构建数据库连接URL"""
        if self.DB_HOST and self.DB_HOST.startswith('/'):
            # Unix socket connection
            return f"postgresql+psycopg://{self.DB_USER}@{self.DB_HOST}/{self.DB_NAME}"
        password_part = f":{self.DB_PASSWORD}" if self.DB_PASSWORD else ""
        return (
            f"postgresql+psycopg://{self.DB_USER}{password_part}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )
    
    def get_database_url(self, db_name: Optional[str] = None) -> str:
        """获取指定数据库的连接URL"""
        target_db = db_name or self.DB_NAME
        if self.DB_HOST and self.DB_HOST.startswith('/'):
            # Unix socket connection
            return f"postgresql+psycopg://{self.DB_USER}@{self.DB_HOST}/{target_db}"
        password_part = f":{self.DB_PASSWORD}" if self.DB_PASSWORD else ""
        return (
            f"postgresql+psycopg://{self.DB_USER}{password_part}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{target_db}"
        )
    
    model_config = SettingsConfigDict(
        env_file=_resolve_env_files(),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @model_validator(mode="after")
    def _apply_dev_auth_overrides(self):
        """开发/测试环境默认免登录。

        规则：
        - 若 APP_ENV 是 development/dev/test/debug/local：
          - 如果没有显式设置环境变量 REQUIRE_AUTH，则默认 REQUIRE_AUTH=False
          - 如果 DEV_NO_AUTH=True，则强制 REQUIRE_AUTH=False
        - 生产环境（prod/production）不做任何自动降级。
        """

        app_env = (os.environ.get("APP_ENV") or self.APP_ENV or "").lower()
        is_dev = app_env in {"dev", "development", "test", "debug", "local"}
        is_prod = app_env in {"prod", "production"}

        if is_prod:
            return self

        # 检查是否显式设置了配置（通过 .env 文件或环境变量）
        # 使用 model_fields_set 替代 os.environ.get，
        # 因为 pydantic 读取 .env 后可能不会回写到 os.environ。
        require_auth_env_present = "REQUIRE_AUTH" in self.model_fields_set
        rate_limit_enabled_env_present = "RATE_LIMIT_ENABLED" in self.model_fields_set

        if is_dev and not require_auth_env_present:
            self.REQUIRE_AUTH = False

        if is_dev and getattr(self, "DEV_NO_AUTH", False):
            self.REQUIRE_AUTH = False

        # 开发/测试环境默认关闭速率限制（避免 smoke test/批量 curl 被 429 阻断）
        # 若需要在 dev 环境也启用限流，可显式设置 RATE_LIMIT_ENABLED=true。
        if is_dev and (not rate_limit_enabled_env_present) and (self.REQUIRE_AUTH is False):
            self.RATE_LIMIT_ENABLED = False

        return self

    @model_validator(mode="after")
    def _normalize_list_like_settings(self):
        def _parse_list_like(value: Any) -> List[str]:
            if value is None:
                return []
            if isinstance(value, list):
                return [str(v).strip() for v in value if str(v).strip()]
            if isinstance(value, str):
                text = value.strip()
                if not text:
                    return []
                if text.startswith("["):
                    try:
                        parsed = json.loads(text)
                        if isinstance(parsed, list):
                            return [str(v).strip() for v in parsed if str(v).strip()]
                    except (json.JSONDecodeError, TypeError, ValueError):
                        pass
                return [item.strip() for item in text.split(",") if item.strip()]
            return [str(value).strip()] if str(value).strip() else []

        self.ALLOWED_ORIGINS = _parse_list_like(self.ALLOWED_ORIGINS)
        self.ALLOWED_EXTENSIONS = [
            ext.lstrip(".") for ext in _parse_list_like(self.ALLOWED_EXTENSIONS) if ext.lstrip(".")
        ]
        return self


# 神殿配置映射
CAMPUS_CONFIGS: Dict[str, Dict[str, Any]] = {
    "center": {
        "name": "最高议事厅",
        "db_name": "qmjy",
        "code": "center",
        "description": "清美教育最高议事厅"
    },
    "shengbang": {
        "name": "主神殿",
        "db_name": "shengbang_db",
        "code": "shengbang",
        "description": "主神殿"
    },
    "jimei": {
        "name": "永恒殿",
        "db_name": "jimei_db",
        "code": "jimei",
        "description": "永恒殿"
    },
    "jinmei": {
        "name": "李大殿",
        "db_name": "jinmei_db",
        "code": "jinmei",
        "description": "李大殿"
    },
    "shimei": {
        "name": "慈悲殿",
        "db_name": "shimei_db",
        "code": "shimei",
        "description": "慈悲殿"
    },
    "taimei": {
        "name": "光明殿",
        "db_name": "taimei_db",
        "code": "taimei",
        "description": "光明殿"
    },
    "guimei": {
        "name": "神恩殿",
        "db_name": "guimei_db",
        "code": "guimei",
        "description": "神恩殿"
    },
    "qianmei": {
        "name": "天威殿",
        "db_name": "qianmei_db",
        "code": "qianmei",
        "description": "天威殿"
    }
}


def get_campus_config(campus_code: str) -> Dict[str, Any]:
    """
    获取神殿配置
    
    Args:
        campus_code: 神殿代码
        
    Returns:
        神殿配置字典，包含 name, db_name, code, description
        
    Raises:
        ValueError: 如果神殿代码不存在
    """
    if campus_code not in CAMPUS_CONFIGS:
        raise ValueError(f"未知的神殿代码: {campus_code}")
    return CAMPUS_CONFIGS[campus_code].copy()


def get_database_url_for_campus(campus_code: str) -> str:
    """
    获取指定神殿的数据库连接URL
    
    Args:
        campus_code: 神殿代码
        
    Returns:
        数据库连接URL
    """
    campus_config = get_campus_config(campus_code)
    db_name = campus_config["db_name"]
    return settings.get_database_url(db_name)


# 创建全局配置实例
settings = Settings()
