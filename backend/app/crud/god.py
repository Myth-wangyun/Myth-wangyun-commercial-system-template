from __future__ import annotations

from datetime import UTC, datetime
from typing import Optional, Sequence

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from ..models.god import AdminUser, God, GodRole, GodStatus
from ..schemas.god import AdminLoginRequest, GodCreate, GodUpdate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """密码哈希"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)


class GodCRUD:
    """神祇CRUD操作"""

    @staticmethod
    def get_by_id(db: Session, god_id: int) -> Optional[God]:
        """根据ID获取神祇"""
        return db.query(God).filter(God.god_id == god_id).first()

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[God]:
        """根据名称获取神祇"""
        return db.query(God).filter(God.name == name).first()

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> Sequence[God]:
        """获取所有神祇"""
        return db.query(God).offset(skip).limit(limit).all()

    @staticmethod
    def get_count(db: Session) -> int:
        """获取神祇总数"""
        return db.query(God).count()

    @staticmethod
    def get_by_role(db: Session, role: GodRole) -> Sequence[God]:
        """根据角色获取神祇"""
        return db.query(God).filter(God.role == role).all()

    @staticmethod
    def create(db: Session, god_data: GodCreate) -> God:
        """创建神祇"""
        db_god = God(
            name=god_data.name,
            title=god_data.title,
            role=GodRole(god_data.role),
            status=GodStatus(god_data.status),
            description=god_data.description,
            power_level=god_data.power_level,
            avatar=god_data.avatar,
            temple_name=god_data.temple_name,
            blessing=god_data.blessing,
            is_eternal=god_data.is_eternal,
            reign_years=god_data.reign_years,
        )
        db.add(db_god)
        db.commit()
        db.refresh(db_god)
        return db_god

    @staticmethod
    def update(db: Session, god_id: int, god_data: GodUpdate) -> Optional[God]:
        """更新神祇"""
        db_god = db.query(God).filter(God.god_id == god_id).first()
        if not db_god:
            return None

        update_data = god_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field == "status" and value:
                setattr(db_god, field, GodStatus(value))
            elif field == "role" and value:
                setattr(db_god, field, GodRole(value))
            else:
                setattr(db_god, field, value)

        db.commit()
        db.refresh(db_god)
        return db_god

    @staticmethod
    def delete(db: Session, god_id: int) -> bool:
        """删除神祇"""
        db_god = db.query(God).filter(God.god_id == god_id).first()
        if not db_god:
            return False
        db.delete(db_god)
        db.commit()
        return True


class AdminUserCRUD:
    """管理员CRUD操作"""

    @staticmethod
    def get_by_id(db: Session, admin_id: int) -> Optional[AdminUser]:
        """根据ID获取管理员"""
        return db.query(AdminUser).filter(AdminUser.admin_id == admin_id).first()

    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[AdminUser]:
        """根据用户名获取管理员"""
        return db.query(AdminUser).filter(AdminUser.username == username).first()

    @staticmethod
    def authenticate(db: Session, login_data: AdminLoginRequest) -> Optional[AdminUser]:
        """验证管理员登录"""
        admin = AdminUserCRUD.get_by_username(db, login_data.username)
        if not admin:
            return None
        if not verify_password(login_data.password, admin.password_hash):
            return None
        if not admin.is_active:
            return None
        return admin

    @staticmethod
    def create(db: Session, username: str, password: str, nickname: str, role: str = "admin") -> AdminUser:
        """创建管理员"""
        db_admin = AdminUser(
            username=username,
            password_hash=get_password_hash(password),
            nickname=nickname,
            role=role,
        )
        db.add(db_admin)
        db.commit()
        db.refresh(db_admin)
        return db_admin

    @staticmethod
    def update_last_login(db: Session, admin_id: int) -> None:
        """更新最后登录时间"""
        admin = db.query(AdminUser).filter(AdminUser.admin_id == admin_id).first()
        if admin:
            admin.last_login = datetime.now(UTC).replace(tzinfo=None)
            db.commit()
