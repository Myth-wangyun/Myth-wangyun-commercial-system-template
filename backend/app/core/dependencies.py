"""
权限依赖注入
提供用于 FastAPI 路由的权限检查依赖
"""
import logging
from typing import Callable, Set

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..models.user import User
from .auth import AuthManager
from .database import get_db
from .permissions import permission_manager

logger = logging.getLogger(__name__)


def require_permission(permission_code: str) -> Callable:
    """
    创建权限检查依赖
    
    用法示例：
    ```python
    @router.get("/some-resource", dependencies=[Depends(require_permission("academic.enterprise_culture.view"))])
    def get_resource():
        ...
    ```
    
    Args:
        permission_code: 需要的权限代码
        
    Returns:
        依赖函数
    """
    def permission_checker(
        current_user: User = Depends(AuthManager.get_current_user),
        db: Session = Depends(get_db)
    ) -> bool:
        """检查当前用户是否拥有指定权限"""
        
        # 获取用户的所有权限
        user_permissions = permission_manager.get_user_permissions(db, current_user)
        
        # 检查是否拥有所需权限
        if not permission_manager.check_permission(user_permissions, permission_code):
            logger.warning(
                f"用户 {current_user.username} 尝试访问 {permission_code} 但权限不足"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足，需要权限：{permission_code}"
            )
        
        logger.info(f"用户 {current_user.username} 成功通过权限检查：{permission_code}")
        return True
    
    return permission_checker


def require_any_permission(*permission_codes: str) -> Callable:
    """
    创建多权限检查依赖（满足任一权限即可）
    
    用法示例：
    ```python
    @router.get("/resource", dependencies=[Depends(require_any_permission("perm1", "perm2"))])
    def get_resource():
        ...
    ```
    
    Args:
        permission_codes: 需要的权限代码列表
        
    Returns:
        依赖函数
    """
    def permission_checker(
        current_user: User = Depends(AuthManager.get_current_user),
        db: Session = Depends(get_db)
    ) -> bool:
        """检查当前用户是否拥有任一指定权限"""
        
        user_permissions = permission_manager.get_user_permissions(db, current_user)
        
        for perm_code in permission_codes:
            if permission_manager.check_permission(user_permissions, perm_code):
                logger.info(f"用户 {current_user.username} 通过权限检查：{perm_code}")
                return True
        
        logger.warning(
            f"用户 {current_user.username} 尝试访问但权限不足，需要：{permission_codes}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"权限不足，需要以下任一权限：{', '.join(permission_codes)}"
        )
    
    return permission_checker


def require_all_permissions(*permission_codes: str) -> Callable:
    """
    创建多权限检查依赖（必须满足所有权限）
    
    用法示例：
    ```python
    @router.get("/resource", dependencies=[Depends(require_all_permissions("perm1", "perm2"))])
    def get_resource():
        ...
    ```
    
    Args:
        permission_codes: 需要的权限代码列表
        
    Returns:
        依赖函数
    """
    def permission_checker(
        current_user: User = Depends(AuthManager.get_current_user),
        db: Session = Depends(get_db)
    ) -> bool:
        """检查当前用户是否拥有所有指定权限"""
        
        user_permissions = permission_manager.get_user_permissions(db, current_user)
        
        missing_permissions = []
        for perm_code in permission_codes:
            if not permission_manager.check_permission(user_permissions, perm_code):
                missing_permissions.append(perm_code)
        
        if missing_permissions:
            logger.warning(
                f"用户 {current_user.username} 缺少权限：{missing_permissions}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足，缺少：{', '.join(missing_permissions)}"
            )
        
        logger.info(f"用户 {current_user.username} 通过所有权限检查")
        return True
    
    return permission_checker


def require_role(role_code: str) -> Callable:
    """
    创建角色检查依赖
    
    用法示例：
    ```python
    @router.get("/resource", dependencies=[Depends(require_role("chairman"))])
    def get_resource():
        ...
    ```
    
    Args:
        role_code: 需要的角色代码
        
    Returns:
        依赖函数
    """
    def role_checker(
        current_user: User = Depends(AuthManager.get_current_user),
        db: Session = Depends(get_db)
    ) -> bool:
        """检查当前用户是否拥有指定角色"""
        
        if not permission_manager.has_role(db, current_user, role_code):
            logger.warning(
                f"用户 {current_user.username} 尝试访问但角色不符，需要：{role_code}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"权限不足，需要角色：{role_code}"
            )
        
        logger.info(f"用户 {current_user.username} 成功通过角色检查：{role_code}")
        return True
    
    return role_checker


def get_current_user_permissions(
    current_user: User = Depends(AuthManager.get_current_user),
    db: Session = Depends(get_db)
) -> Set[str]:
    """
    获取当前用户的所有权限（用于在路由处理函数中使用）
    
    用法示例：
    ```python
    @router.get("/resource")
    def get_resource(permissions: Set[str] = Depends(get_current_user_permissions)):
        if "some.permission" in permissions:
            # 做某些事情
        ...
    ```
    
    Returns:
        用户权限集合
    """
    return permission_manager.get_user_permissions(db, current_user)
