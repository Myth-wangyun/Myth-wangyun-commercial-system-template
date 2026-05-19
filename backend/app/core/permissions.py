"""
权限管理器
负责权限检查、权限获取等核心功能
"""
import logging
from typing import Dict, List, Optional, Set

from fastapi import Depends, HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Query, Session

from ..models.permission import Permission
from ..models.role import Role
from ..models.role_permission import RolePermission
from ..models.user import User
from ..models.user_role import UserRole

logger = logging.getLogger(__name__)


def check_is_export_approver(db: Session, user_id: int) -> bool:
    """检查用户是否是咨询量导出审批人"""
    try:
        from ..models.consult.export_approval import 导出审批人
        approver = db.query(导出审批人).filter(
            导出审批人.user_id == user_id,
            导出审批人.is_active == True
        ).first()
        return approver is not None
    except Exception as e:
        logger.error(f"检查导出审批人失败: {e}")
        return False


class PermissionContext:
    """权限上下文 - 包含用户、数据范围、神殿信息"""
    def __init__(self, user: User, data_scope: str, campus: Optional[str] = None):
        self.user = user
        self.data_scope = data_scope
        self.campus = campus
        self.user_id = user.user_id
    
    def __repr__(self):
        return f"<PermissionContext(user={self.user.username}, scope={self.data_scope}, campus={self.campus})>"


class PermissionManager:
    """权限管理器"""

    @staticmethod
    def get_direct_permissions(db: Session, user_id: int) -> Set[str]:
        """
        从权限划分配置（user_permissions_direct）读取用户直接权限
        同时将 routeKey 权限映射为后端点分权限码
        """
        try:
            from sqlalchemy import text as sa_text
            _ensure_user_permissions_direct_table(db)
            _ensure_route_permission_table(db)
            direct_perms = db.execute(sa_text("""
                SELECT permission_code FROM public.user_permissions_direct
                WHERE user_id = :uid
            """), {"uid": user_id}).fetchall()

            if direct_perms:
                direct_codes = {p[0] for p in direct_perms}
                permission_codes = set(direct_codes)

                # 使用后端表中的 routeKey -> permission_code 映射
                route_map = _get_route_permission_map_from_db(db, list(direct_codes))
                mapped_count = 0
                for code in direct_codes:
                    mapped = route_map.get(code)
                    if mapped:
                        permission_codes.update(mapped)
                        mapped_count += len(mapped)

                logger.info(
                    f"用户 {user_id} 直接权限 {len(direct_codes)} 项，映射后端权限 {mapped_count} 项"
                )
                return permission_codes
        except Exception as e:
            # user_permissions_direct 表可能不存在，忽略错误
            try:
                db.rollback()
            except Exception:
                pass
            logger.debug(f"读取直接分配权限失败（表可能不存在）: {e}")

        return set()
    
    @staticmethod
    def get_user_permissions(db: Session, user: User) -> Set[str]:
        """
        获取用户的所有权限代码集合
        
                权限来源：
                - 直接分配权限（user_permissions_direct 表，由权限划分管理页面设置）
                    routeKey 会自动映射为后端点分权限码
        
        Args:
            db: 数据库会话
            user: 用户对象
            
        Returns:
            权限代码集合，如：{'academic.enterprise_culture.view', 'consult-type-count-system'}
        """
        try:
            # 超级用户拥有所有权限
            if user.is_superuser:
                logger.info(f"用户 {user.username} 是超级用户，拥有所有权限")
                return {"*"}  # 通配符表示所有权限
            
            permission_codes = set()

            # ========== 来源: 直接分配权限（权限划分管理） ==========
            direct_codes = PermissionManager.get_direct_permissions(db, user.user_id)
            if direct_codes:
                permission_codes.update(direct_codes)
                logger.info(f"用户 {user.username} 有 {len(direct_codes)} 个直接分配权限")
            else:
                logger.warning(f"用户 {user.username} 未配置直接权限")
            
            # 检查是否为导出审批人，如果是则添加审批权限
            if check_is_export_approver(db, user.user_id):
                permission_codes.add('consult.export.approve')
                logger.info(f"用户 {user.username} 是导出审批人，已添加审批权限")
            
            logger.info(f"用户 {user.username} 拥有 {len(permission_codes)} 个权限")
            return permission_codes
            
        except Exception as e:
            logger.error(f"获取用户权限失败: {e}")
            return set()

    @staticmethod
    def check_permission(permission_codes: Set[str], required_permission: str) -> bool:
        """
        检查是否拥有指定权限
        
        Args:
            permission_codes: 用户拥有的权限代码集合
            required_permission: 需要的权限代码
            
        Returns:
            是否拥有权限
        """
        # 超级用户权限
        if "*" in permission_codes:
            return True
        
        # 完全匹配
        if required_permission in permission_codes:
            return True
        
        # 通配符匹配，如：academic.* 可以匹配 academic.enterprise_culture.view
        parts = required_permission.split('.')
        for i in range(len(parts)):
            wildcard = '.'.join(parts[:i+1]) + '.*'
            if wildcard in permission_codes:
                return True
        
        return False
    
    @staticmethod
    def get_user_roles(db: Session, user: User) -> List[Role]:
        """
        获取用户的所有角色
        
        Args:
            db: 数据库会话
            user: 用户对象
            
        Returns:
            角色列表
        """
        try:
            roles = (
                db.query(Role)
                .join(UserRole, Role.role_id == UserRole.role_id)
                .filter(UserRole.user_id == user.user_id)
                .filter(Role.is_active == True)
                .all()
            )
            return roles
        except Exception as e:
            logger.error(f"获取用户角色失败: {e}")
            return []
    
    @staticmethod
    def has_role(db: Session, user: User, role_code: str) -> bool:
        """
        检查用户是否拥有指定角色
        
        Args:
            db: 数据库会话
            user: 用户对象
            role_code: 角色代码
            
        Returns:
            是否拥有角色
        """
        try:
            role = (
                db.query(Role)
                .join(UserRole, Role.role_id == UserRole.role_id)
                .filter(UserRole.user_id == user.user_id)
                .filter(Role.code == role_code)
                .filter(Role.is_active == True)
                .first()
            )
            return role is not None
        except Exception as e:
            logger.error(f"检查用户角色失败: {e}")
            return False


def _ensure_route_permission_table(db: Session) -> None:
    """确保 routeKey -> permission_code 映射表存在"""
    try:
        from sqlalchemy import text as sa_text
        db.execute(sa_text("""
            CREATE TABLE IF NOT EXISTS public.permission_route_map (
                route_key VARCHAR(200) NOT NULL,
                permission_code VARCHAR(200) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (route_key, permission_code)
            )
        """))
        db.commit()
    except Exception as e:
        db.rollback()
        logger.debug(f"创建 permission_route_map 失败（可能权限不足）: {e}")


def _ensure_user_permissions_direct_table(db: Session) -> None:
    """确保 user_permissions_direct 表存在"""
    try:
        from sqlalchemy import text as sa_text
        db.execute(sa_text("""
            CREATE TABLE IF NOT EXISTS public.user_permissions_direct (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
                permission_code VARCHAR(200) NOT NULL,
                granted_by VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT uix_user_perm_direct UNIQUE (user_id, permission_code)
            )
        """))
        db.execute(sa_text("""
            CREATE INDEX IF NOT EXISTS idx_upd_user_id ON public.user_permissions_direct (user_id)
        """))
        db.commit()
    except Exception as e:
        db.rollback()
        logger.debug(f"创建 user_permissions_direct 失败（可能权限不足）: {e}")


def _get_route_permission_map_from_db(
    db: Session,
    route_keys: List[str]
) -> Dict[str, List[str]]:
    """
    从后端表获取 routeKey -> 权限码列表 的映射
    """
    if not route_keys:
        return {}

    try:
        from sqlalchemy import text as sa_text
        rows = db.execute(
            sa_text("""
                SELECT route_key, permission_code
                FROM public.permission_route_map
                WHERE route_key = ANY(:route_keys)
            """),
            {"route_keys": route_keys},
        ).fetchall()

        route_map: Dict[str, List[str]] = {}
        for route_key, permission_code in rows:
            route_map.setdefault(route_key, []).append(permission_code)

        for key, perms in route_map.items():
            route_map[key] = sorted(set(perms))

        return route_map
    except Exception as e:
        logger.error(f"读取 permission_route_map 失败: {e}")
        return {}


class DataScopeFilter:
    """数据范围过滤器"""
    
    @staticmethod
    def get_user_data_scope(db: Session, user: User, permission_code: str) -> str:
        """
        获取用户在指定权限下的数据范围
        
        Args:
            db: 数据库会话
            user: 用户对象
            permission_code: 权限代码
            
        Returns:
            数据范围: all/campus/self
        """
        # 超级管理员始终是all
        if user.is_superuser:
            return "all"

        # 如果用户有直接分配权限，默认赋予 all 数据范围
        direct_codes = PermissionManager.get_direct_permissions(db, user.user_id)
        if direct_codes:
            return "all"
        
        # 查询用户的角色
        user_roles = db.query(UserRole).filter(
            UserRole.user_id == user.user_id
        ).all()
        
        if not user_roles:
            return "self"  # 没有角色默认只能看自己
        
        # 查询用户的权限和数据范围
        role_ids = [ur.role_id for ur in user_roles]
        role_permissions = db.query(RolePermission, Permission).join(
            Permission, RolePermission.permission_id == Permission.permission_id
        ).filter(
            RolePermission.role_id.in_(role_ids),
            Permission.code == permission_code,
            Permission.is_active == True
        ).all()
        
        if not role_permissions:
            return "self"  # 没有权限默认只能看自己
        
        # 获取最高的数据范围权限 (all > campus > self)
        data_scope_priority = {"all": 3, "campus": 2, "self": 1}
        max_scope = "self"
        max_priority = 0
        
        for rp, perm in role_permissions:
            scope = rp.data_scope or "self"
            priority = data_scope_priority.get(scope, 1)
            if priority > max_priority:
                max_priority = priority
                max_scope = scope
        
        return max_scope
    
    @staticmethod
    def apply_filter(
        query: Query,
        user: User,
        data_scope: str,
        model_class,
        campus_field: str = "campus",
        user_field: Optional[str] = None,
    ) -> Query:
        """
        根据数据范围应用过滤
        
        Args:
            query: SQLAlchemy查询对象
            user: 用户对象
            data_scope: 数据范围 (all/campus/self)
            model_class: 模型类
            campus_field: 神殿字段名
            user_field: 用户字段名（用于self范围）
            
        Returns:
            过滤后的查询对象
        """
        # 全部数据访问 - 不过滤
        if data_scope == "all":
            return query
        
        # 神殿范围访问
        if data_scope == "campus":
            if user.campus:
                # 过滤本神殿数据
                return query.filter(getattr(model_class, campus_field) == user.campus)
            else:
                # 没有神殿信息，可以访问全部（董事长等）
                return query
        
        # 仅自己的数据
        if data_scope == "self":
            if not user_field:
                raise ValueError("self数据范围需要指定user_field参数")
            
            filters = []
            
            # 添加用户过滤
            filters.append(getattr(model_class, user_field) == user.user_id)
            
            # 同时限制神殿（如果用户有神殿且模型有神殿字段）
            if user.campus and hasattr(model_class, campus_field):
                filters.append(getattr(model_class, campus_field) == user.campus)
            
            return query.filter(and_(*filters))
        
        return query
    
    @staticmethod
    def create_permission_context(db: Session, user: User, permission_code: str) -> PermissionContext:
        """
        创建权限上下文
        
        Args:
            db: 数据库会话
            user: 用户对象
            permission_code: 权限代码
            
        Returns:
            PermissionContext对象
        """
        # 超级管理员
        if user.is_superuser:
            return PermissionContext(
                user=user,
                data_scope="all",
                campus=None
            )
        
        # 获取数据范围
        data_scope = DataScopeFilter.get_user_data_scope(db, user, permission_code)
        
        # 返回权限上下文
        return PermissionContext(
            user=user,
            data_scope=data_scope,
            campus=user.campus if data_scope in ["campus", "self"] else None
        )


def require_permission(permission_code: str):
    """
    权限依赖注入装饰器
    
    使用示例:
        @router.get("/some-endpoint")
        def get_data(
            perm_ctx: PermissionContext = Depends(require_permission("academic.some.view"))
        ):
            # 使用perm_ctx.data_scope和perm_ctx.campus进行数据过滤
            pass
    
    Args:
        permission_code: 权限代码
        
    Returns:
        依赖函数
    """
    from ..core.auth import AuthManager
    from ..core.database import get_db
    
    async def permission_checker(
        current_user: User = Depends(AuthManager.get_current_user),
        db: Session = Depends(get_db)
    ) -> PermissionContext:
        # 超级管理员直接放行
        if current_user.is_superuser:
            return PermissionContext(
                user=current_user,
                data_scope="all",
                campus=None
            )
        
        # 检查是否有权限
        permissions = PermissionManager.get_user_permissions(db, current_user)
        if not PermissionManager.check_permission(permissions, permission_code):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"没有权限访问: {permission_code}"
            )
        
        # 创建权限上下文
        return DataScopeFilter.create_permission_context(db, current_user, permission_code)
    
    return permission_checker


# 创建全局实例
permission_manager = PermissionManager()
data_scope_filter = DataScopeFilter()
