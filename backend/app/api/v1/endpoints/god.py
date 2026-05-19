from __future__ import annotations

from datetime import timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ....core.config import settings
from ....core.database import get_db
from ....crud.god import AdminUserCRUD, GodCRUD
from ....models.god import God
from ....schemas.god import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminUserResponse,
    GodCreate,
    GodListResponse,
    GodResponse,
    GodUpdate,
)

router = APIRouter(prefix="/god", tags=["神祇管理"])


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建访问令牌"""
    from jose import JWTError, jwt
    to_encode = data.copy()
    expire = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    if expires_delta:
        expire = expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


@router.get("/", response_model=GodListResponse, summary="获取神祇列表")
async def get_gods(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取所有神祇"""
    gods = GodCRUD.get_all(db, skip=skip, limit=limit)
    total = GodCRUD.get_count(db)
    return GodListResponse(
        total=total,
        items=[GodResponse.model_validate(god) for god in gods]
    )


@router.get("/{god_id}", response_model=GodResponse, summary="获取神祇详情")
async def get_god(god_id: int, db: Session = Depends(get_db)):
    """根据ID获取神祇"""
    god = GodCRUD.get_by_id(db, god_id)
    if not god:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="神祇不存在"
        )
    return GodResponse.model_validate(god)


@router.post("/", response_model=GodResponse, summary="创建神祇")
async def create_god(god_data: GodCreate, db: Session = Depends(get_db)):
    """创建新神祇"""
    existing = GodCRUD.get_by_name(db, god_data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="神祇名称已存在"
        )
    god = GodCRUD.create(db, god_data)
    return GodResponse.model_validate(god)


@router.put("/{god_id}", response_model=GodResponse, summary="更新神祇")
async def update_god(god_id: int, god_data: GodUpdate, db: Session = Depends(get_db)):
    """更新神祇信息"""
    god = GodCRUD.update(db, god_id, god_data)
    if not god:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="神祇不存在"
        )
    return GodResponse.model_validate(god)


@router.delete("/{god_id}", summary="删除神祇")
async def delete_god(god_id: int, db: Session = Depends(get_db)):
    """删除神祇"""
    success = GodCRUD.delete(db, god_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="神祇不存在"
        )
    return {"message": "神祇已删除"}


# 管理员认证路由
admin_router = APIRouter(prefix="/admin", tags=["管理员认证"])

ADMIN_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7天有效期


@admin_router.post("/login", response_model=AdminLoginResponse, summary="管理员登录")
async def admin_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """管理员登录验证"""
    admin = AdminUserCRUD.authenticate(
        db, 
        AdminLoginRequest(username=form_data.username, password=form_data.password)
    )
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码不正确",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    AdminUserCRUD.update_last_login(db, admin.admin_id)
    
    access_token = create_access_token(
        data={
            "sub": admin.username,
            "admin_id": admin.admin_id,
            "role": admin.role
        },
        expires_delta=timedelta(minutes=ADMIN_TOKEN_EXPIRE_MINUTES)
    )
    
    return AdminLoginResponse(
        access_token=access_token,
        admin=AdminUserResponse.model_validate(admin)
    )


@admin_router.post("/register", response_model=AdminUserResponse, summary="注册管理员")
async def register_admin(
    username: str,
    password: str,
    nickname: str,
    db: Session = Depends(get_db)
):
    """注册新管理员（仅用于初始化）"""
    existing = AdminUserCRUD.get_by_username(db, username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名已存在"
        )
    
    # 检查是否已存在管理员
    from ...models.god import AdminUser
    admin_count = db.query(AdminUser).count()
    if admin_count > 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="仅允许初始化时创建管理员"
        )
    
    admin = AdminUserCRUD.create(db, username, password, nickname)
    return AdminUserResponse.model_validate(admin)
