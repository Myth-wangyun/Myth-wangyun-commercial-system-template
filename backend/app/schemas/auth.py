from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from ..models.user import UserRole, UserStatus


class LoginRequest(BaseModel):
    """登录请求模型"""

    username: str
    password: str

    model_config = ConfigDict(
        json_schema_extra={"example": {"username": "admin", "password": "admin123"}},
    )


class LoginResponse(BaseModel):
    """登录响应模型"""

    access_token: str
    token_type: str
    expires_in: int
    user: "UserResponse"

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "token_type": "bearer",
                "expires_in": 1800,
                "user": {
                    "user_id": 1,
                    "username": "admin",
                    "real_name": "管理员",
                    "email": "admin@example.com",
                    "role": "admin",
                },
            }
        },
    )


class UserCreate(BaseModel):
    """用户创建模型"""

    username: str
    password: str
    real_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None
    campus_access_list: list[str] = Field(default_factory=list)
    role: UserRole = UserRole.STAFF
    gender: Optional[str] = None
    entry_date: Optional[datetime] = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError("用户名长度至少3位")
        if len(v) > 50:
            raise ValueError("用户名长度不能超过50位")
        if not v.replace("_", "").isalnum():
            raise ValueError("用户名只能包含字母、数字和下划线")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("密码长度至少6位")
        if len(v) > 128:
            raise ValueError("密码长度不能超过128位")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "username": "zhangsan",
                "password": "password123",
                "real_name": "张三",
                "email": "zhangsan@example.com",
                "phone": "13800138000",
                "department": "智慧司",
                "position": "讲师",
                "campus": "主神殿",
                "role": "teacher",
                "gender": "男",
                "entry_date": "2023-01-01T00:00:00",
            }
        },
    )


class UserUpdate(BaseModel):
    """用户更新模型"""

    real_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None
    campus_access_list: Optional[list[str]] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    gender: Optional[str] = None
    entry_date: Optional[datetime] = None
    notes: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "real_name": "张三",
                "email": "zhangsan@example.com",
                "phone": "13800138000",
                "department": "智慧司",
                "position": "高级讲师",
                "campus": "主神殿",
                "gender": "男",
            }
        },
    )


class UserResponse(BaseModel):
    """用户响应模型"""

    user_id: int
    username: str
    real_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    campus: Optional[str] = None
    campus_access_list: list[str] = Field(default_factory=list)
    role: str
    status: str
    is_superuser: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    gender: Optional[str] = None
    entry_date: Optional[datetime] = None
    notes: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat() if v else None},
        json_schema_extra={
            "example": {
                "user_id": 1,
                "username": "admin",
                "real_name": "管理员",
                "email": "admin@example.com",
                "phone": "13800138000",
                "department": "最高议事厅",
                "position": "系统管理员",
                "campus": "总部",
                "role": "admin",
                "status": "active",
                "is_superuser": True,
                "created_at": "2023-01-01T00:00:00",
                "updated_at": "2023-01-01T00:00:00",
                "last_login": "2023-01-01T00:00:00",
                "gender": "男",
                "entry_date": "2023-01-01T00:00:00",
                "notes": "系统管理员",
            }
        },
    )


class PasswordChangeRequest(BaseModel):
    """密码修改请求模型"""

    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v):
        if len(v) < 6:
            raise ValueError("新密码长度至少6位")
        if len(v) > 128:
            raise ValueError("新密码长度不能超过128位")
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "current_password": "oldpassword123",
                "new_password": "newpassword123",
            }
        },
    )


class UserListResponse(BaseModel):
    """用户列表响应模型"""

    users: list[UserResponse]
    total: int
    skip: int
    limit: int

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "users": [
                    {
                        "user_id": 1,
                        "username": "admin",
                        "real_name": "管理员",
                        "role": "admin",
                        "status": "active",
                    }
                ],
                "total": 1,
                "skip": 0,
                "limit": 100,
            }
        },
    )


# 更新前向引用
LoginResponse.model_rebuild()
