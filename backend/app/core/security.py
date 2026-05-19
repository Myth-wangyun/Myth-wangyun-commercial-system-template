import logging
import secrets
from datetime import datetime, timedelta
from typing import Optional

import bcrypt
from fastapi import HTTPException, status
from jose import JWTError, jwt

from .config import settings

logger = logging.getLogger(__name__)

# JWT配置（统一从 settings 读取）
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS

class SecurityManager:
    """安全管理器"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """
        验证密码 - 使用bcrypt
        
        Args:
            plain_password: 明文密码
            hashed_password: 哈希密码
            
        Returns:
            是否匹配
        """
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception as e:
            logger.error(f"密码验证失败: {e}")
            return False
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """
        生成密码哈希 - 使用bcrypt
        
        Args:
            password: 明文密码
            
        Returns:
            哈希密码
        """
        try:
            salt = bcrypt.gensalt()
            password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
            return password_hash.decode('utf-8')
        except Exception as e:
            logger.error(f"密码哈希生成失败: {e}")
            raise e
    
    @staticmethod
    def create_access_token(
        data: dict,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        创建访问令牌
        
        Args:
            data: 要编码的数据
            expires_delta: 过期时间差
            
        Returns:
            JWT令牌
        """
        try:
            to_encode = data.copy()
            
            if expires_delta:
                expire = datetime.utcnow() + expires_delta
            else:
                expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            
            to_encode.update({"exp": expire, "type": "access"})
            
            encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
            return encoded_jwt
            
        except Exception as e:
            logger.error(f"创建访问令牌失败: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="令牌创建失败"
            )
    
    @staticmethod
    def create_refresh_token(
        data: dict,
        expires_delta: Optional[timedelta] = None
    ) -> str:
        """
        创建刷新令牌
        
        Args:
            data: 要编码的数据
            expires_delta: 过期时间差
            
        Returns:
            JWT刷新令牌
        """
        try:
            to_encode = data.copy()
            
            if expires_delta:
                expire = datetime.utcnow() + expires_delta
            else:
                expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            
            to_encode.update({"exp": expire, "type": "refresh"})
            
            encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
            return encoded_jwt
            
        except Exception as e:
            logger.error(f"创建刷新令牌失败: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="刷新令牌创建失败"
            )
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> dict:
        """
        验证令牌
        
        Args:
            token: JWT令牌
            token_type: 令牌类型 (access/refresh)
            
        Returns:
            解码后的数据
            
        Raises:
            HTTPException: 令牌无效或过期
        """
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # 检查令牌类型
            if payload.get("type") != token_type:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="无效的令牌类型"
                )
            
            # 检查过期时间
            exp = payload.get("exp")
            if exp is None or datetime.utcnow() > datetime.fromtimestamp(exp):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="令牌已过期"
                )
            
            return payload
            
        except JWTError as e:
            logger.error(f"令牌验证失败: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的令牌"
            )
    
    @staticmethod
    def generate_session_id() -> str:
        """生成会话ID"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def validate_password_strength(password: str) -> tuple[bool, str]:
        """
        验证密码强度
        
        Args:
            password: 密码
            
        Returns:
            (是否有效, 错误信息)
        """
        if len(password) < 6:
            return False, "密码长度至少6位"
        
        if len(password) > 128:
            return False, "密码长度不能超过128位"
        
        # 可以添加更多密码强度检查
        has_letter = any(c.isalpha() for c in password)
        has_digit = any(c.isdigit() for c in password)
        
        if not has_letter:
            return False, "密码必须包含字母"
        
        if not has_digit:
            return False, "密码必须包含数字"
        
        return True, ""
    
    @staticmethod
    def validate_username(username: str) -> tuple[bool, str]:
        """
        验证用户名格式
        
        Args:
            username: 用户名
            
        Returns:
            (是否有效, 错误信息)
        """
        if len(username) < 3:
            return False, "用户名长度至少3位"
        
        if len(username) > 50:
            return False, "用户名长度不能超过50位"
        
        # 只允许字母、数字、下划线
        if not username.replace("_", "").isalnum():
            return False, "用户名只能包含字母、数字和下划线"
        
        return True, ""
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """
        验证邮箱格式
        
        Args:
            email: 邮箱地址
            
        Returns:
            是否有效
        """
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))

class TokenManager:
    """令牌管理器"""
    
    @staticmethod
    def create_token_pair(user_id: int, username: str) -> dict:
        """
        创建令牌对
        
        Args:
            user_id: 用户ID
            username: 用户名
            
        Returns:
            包含访问令牌和刷新令牌的字典
        """
        token_data = {
            "sub": username,
            "user_id": user_id
        }
        
        access_token = SecurityManager.create_access_token(token_data)
        refresh_token = SecurityManager.create_refresh_token(token_data)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    
    @staticmethod
    def refresh_access_token(refresh_token: str) -> dict:
        """
        刷新访问令牌
        
        Args:
            refresh_token: 刷新令牌
            
        Returns:
            新的访问令牌
        """
        payload = SecurityManager.verify_token(refresh_token, "refresh")
        
        token_data = {
            "sub": payload.get("sub"),
            "user_id": payload.get("user_id")
        }
        
        access_token = SecurityManager.create_access_token(token_data)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

# 创建全局实例
security_manager = SecurityManager()
token_manager = TokenManager()
