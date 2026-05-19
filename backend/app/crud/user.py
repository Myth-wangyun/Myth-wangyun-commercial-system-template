import logging
from datetime import datetime
from typing import List, Optional

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from ..models.user import User, UserRole, UserSession, UserStatus

logger = logging.getLogger(__name__)

class UserCRUD:
    """用户CRUD操作类"""
    
    @staticmethod
    def create_user(
        db: Session,
        username: str,
        password_hash: str,
        real_name: str,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        department: Optional[str] = None,
        position: Optional[str] = None,
        campus: Optional[str] = None,
        campus_access_list: Optional[List[str]] = None,
        role: UserRole = UserRole.STAFF,
        gender: Optional[str] = None,
        entry_date: Optional[datetime] = None
    ) -> User:
        """
        创建新用户
        
        Args:
            db: 数据库会话
            username: 用户名
            password_hash: 密码哈希
            real_name: 真实姓名
            email: 邮箱
            phone: 手机号
            department: 部门
            position: 岗位
            campus: 神殿
            role: 用户角色
            gender: 性别
            entry_date: 入职时间
            
        Returns:
            创建的用户对象
        """
        try:
            user = User(
                username=username,
                password_hash=password_hash,
                real_name=real_name,
                email=email,
                phone=phone,
                department=department,
                position=position,
                campus=campus,
                campus_access_list=User.normalize_campus_access_list(campus, campus_access_list),
                role=role,
                gender=gender,
                entry_date=entry_date,
                status=UserStatus.ACTIVE
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            logger.info(f"用户创建成功: {username}")
            return user
            
        except Exception as e:
            db.rollback()
            logger.error(f"创建用户失败: {e}")
            raise e
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> Optional[User]:
        """根据用户名获取用户"""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        """根据用户ID获取用户"""
        return db.query(User).filter(User.user_id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """根据邮箱获取用户"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_users(
        db: Session,
        skip: int = 0,
        limit: int = 100,
        department: Optional[str] = None,
        campus: Optional[str] = None,
        role: Optional[UserRole] = None,
        status: Optional[UserStatus] = None
    ) -> List[User]:
        """
        获取用户列表
        
        Args:
            db: 数据库会话
            skip: 跳过的记录数
            limit: 限制的记录数
            department: 部门筛选
            campus: 神殿筛选
            role: 角色筛选
            status: 状态筛选
            
        Returns:
            用户列表
        """
        query = db.query(User)
        
        # 应用筛选条件
        if department:
            query = query.filter(User.department == department)
        if campus:
            query = query.filter(
                or_(
                    User.campus == campus,
                    User.campus_access_list.contains([campus])
                )
            )
        if role:
            query = query.filter(User.role == role)
        if status:
            query = query.filter(User.status == status)
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def update_user(
        db: Session,
        user_id: int,
        **kwargs
    ) -> Optional[User]:
        """
        更新用户信息
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            **kwargs: 要更新的字段
            
        Returns:
            更新后的用户对象
        """
        try:
            user = db.query(User).filter(User.user_id == user_id).first()
            if not user:
                return None
            
            # 更新允许的字段
            allowed_fields = [
                'real_name', 'email', 'phone', 'department', 
                'position', 'campus', 'campus_access_list', 'role', 'status',
                'gender', 'entry_date', 'notes'
            ]
            
            for field, value in kwargs.items():
                if field in allowed_fields and hasattr(user, field):
                    setattr(user, field, value)

            if 'campus' in kwargs or 'campus_access_list' in kwargs:
                user.campus_access_list = User.normalize_campus_access_list(
                    user.campus,
                    user.campus_access_list
                )
            
            user.updated_at = datetime.utcnow()
            
            db.commit()
            db.refresh(user)
            
            logger.info(f"用户更新成功: {user.username}")
            return user
            
        except Exception as e:
            db.rollback()
            logger.error(f"更新用户失败: {e}")
            raise e
    
    @staticmethod
    def update_password(db: Session, user_id: int, password_hash: str) -> bool:
        """
        更新用户密码
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            password_hash: 新密码哈希
            
        Returns:
            是否更新成功
        """
        try:
            user = db.query(User).filter(User.user_id == user_id).first()
            if not user:
                return False
            
            user.password_hash = password_hash
            user.updated_at = datetime.utcnow()
            
            db.commit()
            logger.info(f"用户密码更新成功: {user.username}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"更新用户密码失败: {e}")
            raise e
    
    @staticmethod
    def update_last_login(db: Session, user_id: int) -> bool:
        """更新用户最后登录时间"""
        try:
            user = db.query(User).filter(User.user_id == user_id).first()
            if not user:
                return False
            
            user.last_login = datetime.utcnow()
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"更新最后登录时间失败: {e}")
            raise e
    
    @staticmethod
    def delete_user(db: Session, user_id: int) -> bool:
        """
        删除用户（软删除，将状态设为非活跃）
        
        Args:
            db: 数据库会话
            user_id: 用户ID
            
        Returns:
            是否删除成功
        """
        try:
            user = db.query(User).filter(User.user_id == user_id).first()
            if not user:
                return False
            
            user.status = UserStatus.INACTIVE
            user.updated_at = datetime.utcnow()
            
            db.commit()
            logger.info(f"用户删除成功: {user.username}")
            return True
            
        except Exception as e:
            db.rollback()
            logger.error(f"删除用户失败: {e}")
            raise e
    
    @staticmethod
    def get_user_count(db: Session, **filters) -> int:
        """获取用户总数"""
        query = db.query(User)
        
        for field, value in filters.items():
            if hasattr(User, field) and value is not None:
                query = query.filter(getattr(User, field) == value)
        
        return query.count()
    
    @staticmethod
    def get_users_by_campus(db: Session, campus: str) -> List[User]:
        """根据神殿获取用户列表"""
        return db.query(User).filter(
            and_(
                User.campus == campus,
                User.status == UserStatus.ACTIVE
            )
        ).all()
    
    @staticmethod
    def get_users_by_department(db: Session, department: str) -> List[User]:
        """根据部门获取用户列表"""
        return db.query(User).filter(
            and_(
                User.department == department,
                User.status == UserStatus.ACTIVE
            )
        ).all()

class UserSessionCRUD:
    """用户会话CRUD操作类"""
    
    @staticmethod
    def create_session(
        db: Session,
        session_id: str,
        user_id: int,
        token: str,
        expires_at: datetime
    ) -> UserSession:
        """创建用户会话"""
        session = UserSession(
            session_id=session_id,
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        return session
    
    @staticmethod
    def get_session(db: Session, session_id: str) -> Optional[UserSession]:
        """获取会话"""
        return db.query(UserSession).filter(
            and_(
                UserSession.session_id == session_id,
                UserSession.is_active == True,
                UserSession.expires_at > datetime.utcnow()
            )
        ).first()
    
    @staticmethod
    def deactivate_session(db: Session, session_id: str) -> bool:
        """停用会话"""
        session = db.query(UserSession).filter(UserSession.session_id == session_id).first()
        if session:
            session.is_active = False
            db.commit()
            return True
        return False
    
    @staticmethod
    def cleanup_expired_sessions(db: Session) -> int:
        """清理过期会话"""
        expired_sessions = db.query(UserSession).filter(
            UserSession.expires_at < datetime.utcnow()
        ).all()
        
        count = len(expired_sessions)
        for session in expired_sessions:
            db.delete(session)
        
        db.commit()
        return count
