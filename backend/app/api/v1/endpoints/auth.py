import os
from datetime import timedelta
from typing import List, Literal, Optional, TypedDict

from fastapi import APIRouter, Body, Depends, HTTPException, Request, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ....core.auth import get_current_active_user, get_current_admin_user
from ....core.config import settings
from ....core.database import get_db
from ....core.permissions import permission_manager
from ....core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    security_manager,
)
from ....crud.user import UserCRUD
from ....models.user import User, UserRole, UserStatus, utcnow
from ....schemas.auth import (
    LoginResponse,
    PasswordChangeRequest,
    UserCreate,
    UserResponse,
    UserUpdate,
)

router = APIRouter()


class CookieSettings(TypedDict, total=False):
    httponly: bool
    samesite: Literal["lax", "none", "strict"]
    secure: bool
    path: str
    domain: str


_allow_legacy_refresh = (
    settings.DEBUG
    or settings.APP_ENV.lower() in {"dev", "development", "test"}
    or os.environ.get("ALLOW_LEGACY_REFRESH", "0") == "1"
)


def _serialize_user(user: User) -> UserResponse:
    return UserResponse(
        user_id=user.user_id,
        username=user.username,
        real_name=user.real_name,
        email=user.email,
        phone=user.phone,
        department=user.department,
        position=user.position,
        campus=user.campus,
        campus_access_list=user.get_accessible_campuses(),
        role=user.role.value,
        status=user.status.value,
        is_superuser=user.is_superuser,
        created_at=user.created_at.isoformat() if user.created_at else None,
        updated_at=user.updated_at.isoformat() if user.updated_at else None,
        last_login=user.last_login.isoformat() if user.last_login else None,
        gender=user.gender,
        entry_date=user.entry_date.isoformat() if user.entry_date else None,
        notes=user.notes,
    )


def _refresh_cookie_settings() -> CookieSettings:
    def _bool_from_env(value: Optional[str], default: bool) -> bool:
        if value is None:
            return default
        return value.strip().lower() in {"1", "true", "yes", "on"}

    app_env = settings.APP_ENV.lower()
    env_override = os.environ.get("APP_ENV", "").lower()
    is_production = app_env in {"prod", "production"} or env_override in {
        "prod",
        "production",
    }

    cookie_settings: CookieSettings = {
        "httponly": True,
        "samesite": "none" if is_production else "lax",
        "secure": True if is_production else False,
        "path": "/",
    }

    samesite_override = os.environ.get("COOKIE_SAMESITE") or os.environ.get(
        "AUTH_COOKIE_SAMESITE"
    )
    secure_override = os.environ.get("COOKIE_SECURE") or os.environ.get(
        "AUTH_COOKIE_SECURE"
    )
    domain_override = os.environ.get("COOKIE_DOMAIN") or os.environ.get(
        "AUTH_COOKIE_DOMAIN"
    )

    if samesite_override:
        normalized_samesite = samesite_override.strip().lower()
        if normalized_samesite == "lax":
            cookie_settings["samesite"] = "lax"
        elif normalized_samesite == "none":
            cookie_settings["samesite"] = "none"
        elif normalized_samesite == "strict":
            cookie_settings["samesite"] = "strict"
    if secure_override is not None:
        cookie_settings["secure"] = _bool_from_env(
            secure_override, cookie_settings["secure"]
        )
    if domain_override:
        cookie_settings["domain"] = domain_override.strip()

    return cookie_settings


def _verify_reset_secret(payload: dict):
    """Ensure password reset calls carry the shared secret to prevent abuse."""
    provided = payload.get("secret_key") or payload.get("reset_key")
    if not provided or provided != settings.SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="无效的重置密钥"
        )


@router.post("/login", response_model=LoginResponse, summary="用户登录")
async def login_for_access_token(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    try:
        user = UserCRUD.get_user_by_username(db, username=form_data.username)
        if not user or not security_manager.verify_password(
            form_data.password, user.password_hash
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码不正确",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if user.status != UserStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="用户账户未激活或已被禁用",
            )

        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security_manager.create_access_token(
            data={
                "sub": user.username,
                "user_id": user.user_id,
                "role": user.role.value,
            },
            expires_delta=access_token_expires,
        )

        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        refresh_token = security_manager.create_refresh_token(
            data={"sub": user.username, "user_id": user.user_id},
            expires_delta=refresh_token_expires,
        )

        # 记录登录时间
        user.last_login = utcnow()
        db.add(user)
        db.commit()

        # 将refresh token存储为HTTP-only cookie
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            **_refresh_cookie_settings(),
            max_age=int(refresh_token_expires.total_seconds()),
        )

        # 将 access_token 也存储为 HttpOnly Cookie（最高安全性，防 XSS）
        response.set_cookie(
            key="access_token",
            value=access_token,
            **_refresh_cookie_settings(),
            max_age=int(access_token_expires.total_seconds()),
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": _serialize_user(user),
        }
    except HTTPException:
        # 重新抛出 HTTP 异常（401, 403 等）
        raise
    except Exception as e:
        import traceback

        print(f"\n{'='*60}")
        print(f"❌ 登录端点异常: {type(e).__name__}")
        print(f"   错误: {str(e)}")
        print(f"   堆栈跟踪:\n{traceback.format_exc()}")
        print(f"{'='*60}\n")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录处理失败: {str(e)}",
        ) from e


@router.post("/logout", summary="用户登出")
async def logout(response: Response):
    """
    用户登出 - 清除所有认证相关的 Cookie

    注意：需要使用与设置 Cookie 时相同的参数（path, domain, samesite）才能正确删除
    """
    cookie_settings = _refresh_cookie_settings()

    # 删除 refresh_token Cookie
    response.delete_cookie(
        key="refresh_token",
        path=cookie_settings.get("path", "/"),
        domain=cookie_settings.get("domain"),
        samesite=cookie_settings.get("samesite", "lax"),
    )

    # 删除 access_token Cookie
    response.delete_cookie(
        key="access_token",
        path=cookie_settings.get("path", "/"),
        domain=cookie_settings.get("domain"),
        samesite=cookie_settings.get("samesite", "lax"),
    )

    return {"message": "成功登出"}


@router.post("/refresh", summary="刷新访问令牌")
async def refresh_access_token(
    request: Request,
    response: Response,
    payload: Optional[dict] = Body(default=None),
    db: Session = Depends(get_db),
):
    # 开发/测试免登录模式：自动生成开发用户的 token
    if not getattr(settings, "REQUIRE_AUTH", True):
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security_manager.create_access_token(
            data={"sub": "dev", "user_id": 0, "role": "admin"},
            expires_delta=access_token_expires,
        )
        refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        new_refresh_token = security_manager.create_refresh_token(
            data={"sub": "dev", "user_id": 0},
            expires_delta=refresh_token_expires,
        )
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            **_refresh_cookie_settings(),
            max_age=int(refresh_token_expires.total_seconds()),
        )
        response.set_cookie(
            key="access_token",
            value=access_token,
            **_refresh_cookie_settings(),
            max_age=int(access_token_expires.total_seconds()),
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        }

    refresh_token = None
    if payload:
        refresh_token = payload.get("refresh_token")
    if not refresh_token:
        refresh_token = request.cookies.get("refresh_token") or request.headers.get(
            "X-Refresh-Token"
        )
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="缺少刷新令牌"
        )

    try:
        token_payload = security_manager.verify_token(refresh_token, "refresh")
    except HTTPException as exc:
        if _allow_legacy_refresh and getattr(exc, "detail", "") == "无效的令牌类型":
            try:
                token_payload = security_manager.verify_token(refresh_token, "access")
            except HTTPException:
                raise
        else:
            raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="刷新令牌无效"
        ) from exc

    username = token_payload.get("sub")
    user_id = token_payload.get("user_id")
    user = None
    if user_id:
        user = UserCRUD.get_user_by_id(db, user_id=user_id)
    elif username:
        user = UserCRUD.get_user_by_username(db, username=username)

    if not user or user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不可用"
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security_manager.create_access_token(
        data={"sub": user.username, "user_id": user.user_id, "role": user.role.value},
        expires_delta=access_token_expires,
    )

    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    new_refresh_token = security_manager.create_refresh_token(
        data={"sub": user.username, "user_id": user.user_id},
        expires_delta=refresh_token_expires,
    )

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        **_refresh_cookie_settings(),
        max_age=int(refresh_token_expires.total_seconds()),
    )

    # 将新的 access_token 也存储为 HttpOnly Cookie（最高安全性，防 XSS）
    response.set_cookie(
        key="access_token",
        value=access_token,
        **_refresh_cookie_settings(),
        max_age=int(access_token_expires.total_seconds()),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.get("/me", response_model=UserResponse, summary="获取当前用户信息")
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return _serialize_user(current_user)


@router.get("/me/permissions", summary="获取当前用户的权限列表")
async def get_my_permissions(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """
    获取当前登录用户的所有权限代码

    返回格式：
    {
        "permissions": ["academic.enterprise_culture.presentation.view", ...],
        "roles": [{"code": "chairman", "name": "董事长"}, ...]
    }
    """
    # 获取用户的所有权限
    permissions = permission_manager.get_user_permissions(db, current_user)

    # 获取用户的所有角色
    roles = permission_manager.get_user_roles(db, current_user)

    return {
        "permissions": list(permissions),
        "roles": [
            {"code": role.code, "name": role.name, "description": role.description}
            for role in roles
        ],
        "is_superuser": current_user.is_superuser,
        "user_info": {
            "user_id": current_user.user_id,
            "username": current_user.username,
            "real_name": current_user.real_name,
            "department": current_user.department,
            "position": current_user.position,
        },
    }


@router.get("/me/accessible-campuses", summary="获取当前用户可访问的神殿列表")
async def get_my_accessible_campuses(
    current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)
):
    """
    根据用户的部门和职位返回可访问的神殿列表

    规则：
    - 以下职位的员工只能访问自己所属的神殿（根据 campus 字段）：
      * 校长
      * 学术经理
      * 学术副经理
      * 教员
      * 讲师
    - 其他用户：可以访问所有神殿

    返回格式：
    {
        "campuses": ["主神殿", "永恒殿", ...],
        "restricted": true/false  # 是否受限
    }
    """
    from ....models.config_master import CampusProfile

    # 获取所有活跃的神殿
    all_campuses = (
        db.query(CampusProfile)
        .filter(CampusProfile.is_active.is_(True))
        .order_by(CampusProfile.name)
        .all()
    )

    campus_names = [campus.name for campus in all_campuses]

    # 定义受限职位关键词列表
    restricted_positions = ["校长", "学术经理", "学术副经理", "教员", "讲师"]

    # 检查是否是受限用户
    is_restricted = False
    if current_user.position:
        # 检查职位是否包含任一受限关键词
        for restricted_keyword in restricted_positions:
            if restricted_keyword in current_user.position:
                is_restricted = True
                break

    if is_restricted:
        user_campuses = [
            campus_name
            for campus_name in current_user.get_accessible_campuses()
            if campus_name in campus_names
        ]
        campus_names = user_campuses

    return {
        "campuses": campus_names,
        "restricted": is_restricted,
        "user_campus": current_user.campus,
        "user_campuses": current_user.get_accessible_campuses(),
        "user_department": current_user.department,
        "user_position": current_user.position,
    }


@router.put("/me/password", summary="修改当前用户密码")
async def change_my_password(
    password_change: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    # 重新从当前 session 获取用户对象，确保在同一个 session 中操作
    user = db.query(User).filter(User.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    if not security_manager.verify_password(
        password_change.current_password, user.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="旧密码不正确"
        )

    user.password_hash = security_manager.get_password_hash(
        password_change.new_password
    )
    db.commit()
    db.refresh(user)
    return {
        "message": "密码修改成功，请牢记新密码并保管好自己的密码，下次需要用新密码完成登录哦！"
    }


# --- 管理员/经理权限的API ---


@router.post(
    "/users",
    response_model=UserResponse,
    summary="创建新用户 (管理员/经理) - 仅开发模式",
)
async def create_new_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    # 只允许在开发模式下创建用户
    app_env = os.environ.get("APP_ENV", "development").lower()
    if app_env in ("prod", "production"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="生产环境禁止通过 API 创建用户",
        )

    db_user = UserCRUD.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="用户名已存在"
        )

    # 创建用户
    password_hash = security_manager.get_password_hash(user.password)
    new_user = UserCRUD.create_user(
        db=db,
        username=user.username,
        password_hash=password_hash,
        real_name=user.real_name,
        email=user.email,
        phone=user.phone,
        department=user.department,
        position=user.position,
        campus=user.campus,
        campus_access_list=user.campus_access_list,
        role=user.role,
        gender=user.gender,
        entry_date=user.entry_date,
    )

    return _serialize_user(new_user)


@router.get(
    "/users", response_model=List[UserResponse], summary="获取用户列表 (管理员/经理)"
)
async def read_users(
    skip: int = 0,
    limit: int = 100,
    campus: Optional[str] = None,
    department: Optional[str] = None,
    position: Optional[str] = None,
    role: Optional[UserRole] = None,
    status: Optional[UserStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    users = UserCRUD.get_users(
        db=db,
        skip=skip,
        limit=limit,
        campus=campus,
        department=department,
        role=role,
        status=status,
    )

    # 转换为UserResponse格式
    return [_serialize_user(user) for user in users]


@router.get("/users/search", summary="搜索用户")
async def search_users(
    keyword: str,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    搜索用户（按用户名或真实姓名模糊匹配）
    用于添加审批人等场景
    """
    from sqlalchemy import or_

    users = (
        db.query(User)
        .filter(
            User.status == UserStatus.ACTIVE,
            or_(
                User.username.ilike(f"%{keyword}%"),
                User.real_name.ilike(f"%{keyword}%"),
            ),
        )
        .limit(limit)
        .all()
    )

    return {
        "data": [
            {
                "user_id": user.user_id,
                "username": user.username,
                "real_name": user.real_name,
                "department": user.department,
                "position": user.position,
                "campus": user.campus,
            }
            for user in users
        ]
    }


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="获取单个用户信息 (管理员/经理)",
)
async def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    user = UserCRUD.get_user_by_id(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户未找到")

    return _serialize_user(user)


@router.put(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="更新用户信息 (管理员/经理)",
)
async def update_user_data(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    user = UserCRUD.update_user(
        db, user_id=user_id, **user_update.model_dump(exclude_none=True)
    )
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户未找到")

    return _serialize_user(user)


@router.delete("/users/{user_id}", summary="删除用户 (管理员)")
async def delete_user_data(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    success = UserCRUD.delete_user(db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户未找到")
    return {"message": "用户已删除"}


# --- 密码重置相关API ---


@router.post("/reset-password/{username}", summary="重置指定用户密码")
async def reset_user_password(
    username: str, password_data: dict, db: Session = Depends(get_db)
):
    """
    重置指定用户的密码

    Args:
        username: 用户名
        password_data: 包含新密码的字典 {"password": "new_password"}

    Returns:
        重置结果信息
    """
    _verify_reset_secret(password_data)

    user = UserCRUD.get_user_by_username(db, username=username)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")

    new_password = password_data.get("password")
    if not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="密码不能为空"
        )

    # 验证密码强度
    is_valid, error_msg = security_manager.validate_password_strength(new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"密码不符合要求: {error_msg}",
        )

    # 更新密码哈希
    user.password_hash = security_manager.get_password_hash(new_password)
    user.updated_at = utcnow()
    db.commit()

    return {
        "message": f"用户 {username} 的密码已重置",
        "username": username,
        "reset_time": user.updated_at.isoformat(),
    }


@router.post("/admin/reset-admin-password", summary="重置admin密码")
async def reset_admin_password(password_data: dict, db: Session = Depends(get_db)):
    """
    重置admin用户密码（无需认证，用于系统初始化）

    Args:
        password_data: 包含新密码的字典 {"password": "new_password"}

    Returns:
        重置结果信息
    """
    _verify_reset_secret(password_data)

    admin_user = UserCRUD.get_user_by_username(db, username="admin")
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="admin用户不存在"
        )

    new_password = password_data.get("password", "admin")  # 默认密码为admin

    # 验证密码强度
    is_valid, error_msg = security_manager.validate_password_strength(new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"密码不符合要求: {error_msg}",
        )

    # 更新密码哈希
    admin_user.password_hash = security_manager.get_password_hash(new_password)
    admin_user.updated_at = utcnow()
    db.commit()

    return {
        "message": "admin密码已重置",
        "username": "admin",
        "reset_time": admin_user.updated_at.isoformat(),
    }
