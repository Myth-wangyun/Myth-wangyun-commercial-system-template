import logging
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..crud.user import UserCRUD
from ..models.user import User, UserRole, UserStatus
from .config import settings
from .database import get_db  # pyright: ignore[reportMissingImports]
from .security import security_manager

logger = logging.getLogger(__name__)

# OAuth2 密码承载器（可选）
security = HTTPBearer(auto_error=False)

class AuthManager:
    """认证管理器"""
    
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
        """
        验证用户凭据
        
        Args:
            db: 数据库会话
            username: 用户名
            password: 密码
            
        Returns:
            用户对象，如果验证失败返回None
        """
        try:
            user = UserCRUD.get_user_by_username(db, username)
            if not user:
                logger.warning(f"用户不存在: {username}")
                return None
            
            if user.status != UserStatus.ACTIVE:
                logger.warning(f"用户状态异常: {username}, 状态: {user.status}")
                return None
            
            if not security_manager.verify_password(password, user.password_hash):
                logger.warning(f"密码验证失败: {username}")
                return None
            
            logger.info(f"用户认证成功: {username}")
            return user
            
        except Exception as e:
            logger.error(f"用户认证异常: {e}")
            return None
    
    @staticmethod
    def get_current_user(
        request: Request,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
        db: Session = Depends(get_db)
    ) -> User:
        """
        获取当前用户(从JWT令牌)
        支持从 Cookie 或 Authorization header 读取 token
        
        Args:
            request: HTTP请求对象
            credentials: HTTP认证凭据（可选）
            db: 数据库会话
            
        Returns:
            当前用户对象
            
        Raises:
            HTTPException: 认证失败
        """
        # 开发/测试免登录：返回一个内置超级用户，便于任意 API 调试
        # 注意：生产环境默认 REQUIRE_AUTH=True，不会走到这里。
        if not getattr(settings, "REQUIRE_AUTH", True):
            dev_user = User()
            dev_user.user_id = 0
            dev_user.username = "dev"
            dev_user.real_name = "开发免登录用户"
            dev_user.password_hash = "DEV_NO_AUTH"
            dev_user.role = UserRole.ADMIN
            dev_user.status = UserStatus.ACTIVE
            dev_user.is_superuser = True
            dev_user.department = "DEV"
            dev_user.position = "DEV"
            dev_user.campus = None
            dev_user.campus_access_list = []
            return dev_user

        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            # 优先从 HttpOnly Cookie 读取（推荐，XSS 无法访问）
            token = request.cookies.get("access_token")
            
            # 如果 Cookie 中没有，从 Authorization header 读取（向后兼容）
            if not token and credentials:
                token = credentials.credentials
            
            if not token:
                raise credentials_exception
            
            payload = security_manager.verify_token(token)
            username = payload.get("sub")
            
            if username is None:
                raise credentials_exception
            
            user = UserCRUD.get_user_by_username(db, username)
            if user is None:
                raise credentials_exception
            
            return user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"获取当前用户失败: {e}")
            raise credentials_exception
    
    @staticmethod
    def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
        """
        获取当前活跃用户
        
        Args:
            current_user: 当前用户
            
        Returns:
            活跃用户对象
            
        Raises:
            HTTPException: 用户非活跃
        """
        if current_user.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="用户账户已被停用"
            )
        return current_user
    
    @staticmethod
    def get_current_admin_user(current_user: User = Depends(get_current_active_user)) -> User:
        """
        获取当前管理员用户
        
        Args:
            current_user: 当前用户
            
        Returns:
            管理员用户对象
            
        Raises:
            HTTPException: 权限不足
        """
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER] and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="权限不足，需要管理员权限"
            )
        return current_user
    
    @staticmethod
    def require_role(required_roles: list):
        """
        角色权限装饰器工厂
        
        Args:
            required_roles: 需要的角色列表
            
        Returns:
            依赖函数
        """
        def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
            if current_user.role not in required_roles and not current_user.is_superuser:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"权限不足，需要以下角色之一: {', '.join(required_roles)}"
                )
            return current_user
        
        return role_checker
    
    @staticmethod
    def require_department(required_departments: list):
        """
        部门权限装饰器工厂
        
        Args:
            required_departments: 需要的部门列表
            
        Returns:
            依赖函数
        """
        def department_checker(current_user: User = Depends(get_current_active_user)) -> User:
            if current_user.department not in required_departments and not current_user.is_superuser:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"权限不足，需要以下部门之一: {', '.join(required_departments)}"
                )
            return current_user
        
        return department_checker
    
    @staticmethod
    def require_campus(required_campuses: list):
        """
        神殿权限装饰器工厂
        
        Args:
            required_campuses: 需要的神殿列表
            
        Returns:
            依赖函数
        """
        def campus_checker(current_user: User = Depends(get_current_active_user)) -> User:
            if (
                not current_user.is_superuser
                and not any(current_user.has_campus_access(campus) for campus in required_campuses)
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"权限不足，需要以下神殿之一: {', '.join(required_campuses)}"
                )
            return current_user
        
        return campus_checker

# 创建全局实例
auth_manager = AuthManager()

# 便捷的依赖函数
get_current_user = auth_manager.get_current_user
get_current_active_user = auth_manager.get_current_active_user
get_current_admin_user = auth_manager.get_current_admin_user

def get_current_superuser(current_user: User = Depends(get_current_active_user)) -> User:
    """
    获取当前超级用户
    
    Args:
        current_user: 当前用户
        
    Returns:
        超级用户对象
        
    Raises:
        HTTPException: 权限不足
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="权限不足，需要超级用户权限"
        )
    return current_user

# 预定义的角色权限依赖
require_admin = auth_manager.require_role(["admin"])
require_manager = auth_manager.require_role(["admin", "manager"])
require_teacher = auth_manager.require_role(["admin", "manager", "teacher"])
require_consultant = auth_manager.require_role(["admin", "manager", "consultant"])
