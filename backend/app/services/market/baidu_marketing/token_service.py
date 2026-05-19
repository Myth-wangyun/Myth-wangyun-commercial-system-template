"""
百度营销API - Token管理服务

负责Token的存储、查询、刷新和过期管理
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Protocol, cast

from sqlalchemy.orm import Session

from .oauth_service import BaiduOAuthService

logger = logging.getLogger(__name__)


class TokenInfo:
    """Token信息数据类"""
    
    def __init__(
        self,
        user_id: int,
        user_name: str,
        access_token: str,
        refresh_token: str,
        open_id: str,
        expires_at: datetime,
        refresh_expires_at: datetime,
        app_id: str,
        user_acct_type: int = 1,  # 1: 普通账户, 2: 超管账户
        master_name: Optional[str] = None,
    ):
        self.user_id = user_id
        self.user_name = user_name
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.open_id = open_id
        self.expires_at = expires_at
        self.refresh_expires_at = refresh_expires_at
        self.app_id = app_id
        self.user_acct_type = user_acct_type
        self.master_name = master_name
    
    @property
    def is_access_token_expired(self) -> bool:
        """accessToken是否已过期"""
        return datetime.now() >= self.expires_at
    
    @property
    def is_refresh_token_expired(self) -> bool:
        """refreshToken是否已过期"""
        return datetime.now() >= self.refresh_expires_at
    
    @property
    def should_refresh(self) -> bool:
        """是否应该刷新Token（提前5分钟刷新）"""
        return datetime.now() >= self.expires_at - timedelta(minutes=5)
    
    def to_dict(self) -> Dict[str, Any]:
        """转为字典"""
        return {
            "user_id": self.user_id,
            "user_name": self.user_name,
            "access_token": self.access_token,
            "refresh_token": self.refresh_token,
            "open_id": self.open_id,
            "expires_at": self.expires_at.isoformat(),
            "refresh_expires_at": self.refresh_expires_at.isoformat(),
            "app_id": self.app_id,
            "user_acct_type": self.user_acct_type,
            "master_name": self.master_name,
            "is_expired": self.is_access_token_expired,
            "should_refresh": self.should_refresh,
        }


class TokenRecord(Protocol):
    user_id: int
    user_name: str
    open_id: str | None
    access_token: str
    refresh_token: str
    expires_at: datetime
    refresh_expires_at: datetime
    app_id: str
    user_acct_type: int
    master_name: str | None
    status: int
    updated_at: datetime


def _build_token_info(record: TokenRecord) -> TokenInfo:
    return TokenInfo(
        user_id=record.user_id,
        user_name=record.user_name,
        access_token=record.access_token,
        refresh_token=record.refresh_token,
        open_id=record.open_id or '',
        expires_at=record.expires_at,
        refresh_expires_at=record.refresh_expires_at,
        app_id=record.app_id,
        user_acct_type=record.user_acct_type,
        master_name=record.master_name,
    )


class BaiduTokenService:
    """
    百度Token管理服务
    
    提供Token的CRUD操作和自动刷新功能
    """
    
    def __init__(self, oauth_service: BaiduOAuthService):
        """
        初始化Token服务
        
        Args:
            oauth_service: OAuth服务实例
        """
        self.oauth_service = oauth_service
        
        # 内存缓存（生产环境建议使用Redis）
        self._token_cache: Dict[int, TokenInfo] = {}
    
    def save_token(
        self,
        user_id: int,
        user_name: str,
        access_token: str,
        refresh_token: str,
        open_id: str,
        expires_in: int,
        refresh_expires_in: int,
        user_acct_type: int = 1,
        master_name: Optional[str] = None,
        db: Optional[Session] = None
    ) -> TokenInfo:
        """
        保存Token信息
        
        Args:
            user_id: 用户ID
            user_name: 用户名（推广账户名称）
            access_token: 授权令牌
            refresh_token: 刷新令牌
            open_id: 用户标识
            expires_in: accessToken有效时间（秒）
            refresh_expires_in: refreshToken有效时间（秒）
            user_acct_type: 账户类型（1: 普通, 2: 超管）
            master_name: 超管账户名称
            db: 数据库会话（可选）
            
        Returns:
            TokenInfo对象
        """
        now = datetime.now()
        
        token_info = TokenInfo(
            user_id=user_id,
            user_name=user_name,
            access_token=access_token,
            refresh_token=refresh_token,
            open_id=open_id,
            expires_at=now + timedelta(seconds=expires_in),
            refresh_expires_at=now + timedelta(seconds=refresh_expires_in),
            app_id=self.oauth_service.app_id,
            user_acct_type=user_acct_type,
            master_name=master_name,
        )
        
        # 保存到内存缓存
        self._token_cache[user_id] = token_info
        
        # 如果提供了数据库会话，也保存到数据库
        if db is not None:
            self._save_to_db(token_info, db)
        
        logger.info(f"Token已保存: userId={user_id}, userName={user_name}")
        return token_info
    
    def _save_to_db(self, token_info: TokenInfo, db: Session):
        """
        保存Token到数据库
        
        使用 upsert 逻辑：存在则更新，不存在则插入
        """
        from .models import BaiduMarketingToken
        
        try:
            existing = db.query(BaiduMarketingToken).filter(
                BaiduMarketingToken.user_id == token_info.user_id,
                BaiduMarketingToken.app_id == token_info.app_id
            ).first()
            
            if existing:
                existing_record = cast(TokenRecord, existing)
                # 更新现有记录
                existing_record.access_token = token_info.access_token
                existing_record.refresh_token = token_info.refresh_token
                existing_record.open_id = token_info.open_id
                existing_record.expires_at = token_info.expires_at
                existing_record.refresh_expires_at = token_info.refresh_expires_at
                existing_record.user_name = token_info.user_name
                existing_record.user_acct_type = token_info.user_acct_type
                existing_record.master_name = token_info.master_name
                existing_record.status = 1  # 设为正常状态
                existing_record.updated_at = datetime.now()
                logger.info(f"Token已更新到数据库: userId={token_info.user_id}")
            else:
                # 插入新记录
                new_token = BaiduMarketingToken(
                    user_id=token_info.user_id,
                    user_name=token_info.user_name,
                    access_token=token_info.access_token,
                    refresh_token=token_info.refresh_token,
                    open_id=token_info.open_id,
                    expires_at=token_info.expires_at,
                    refresh_expires_at=token_info.refresh_expires_at,
                    app_id=token_info.app_id,
                    user_acct_type=token_info.user_acct_type,
                    master_name=token_info.master_name,
                    status=1,
                )
                db.add(new_token)
                logger.info(f"Token已新增到数据库: userId={token_info.user_id}")
            
            db.commit()
        except Exception as e:
            logger.error(f"保存Token到数据库失败: {e}")
            db.rollback()
            raise
    
    def get_token(self, user_id: int, db: Optional[Session] = None) -> Optional[TokenInfo]:
        """
        获取Token信息
        
        Args:
            user_id: 用户ID
            db: 数据库会话（可选）
            
        Returns:
            TokenInfo对象，不存在则返回None
        """
        # 先从缓存查找
        if user_id in self._token_cache:
            return self._token_cache[user_id]
        
        # 如果有数据库会话，从数据库加载
        if db is not None:
            token_info = self._load_from_db(user_id, db)
            if token_info:
                self._token_cache[user_id] = token_info
                return token_info
        
        return None
    
    def _load_from_db(self, user_id: int, db: Session) -> Optional[TokenInfo]:
        """
        从数据库加载Token
        """
        from .models import BaiduMarketingToken
        
        try:
            token = db.query(BaiduMarketingToken).filter(
                BaiduMarketingToken.user_id == user_id,
                BaiduMarketingToken.app_id == self.oauth_service.app_id,
                BaiduMarketingToken.status == 1  # 只加载有效的Token
            ).first()
            
            if token:
                logger.info(f"从数据库加载Token: userId={user_id}")
                return _build_token_info(cast(TokenRecord, token))
        except Exception as e:
            logger.error(f"从数据库加载Token失败: {e}")
        
        return None
    
    async def get_valid_access_token(
        self,
        user_id: int,
        db: Optional[Session] = None
    ) -> Optional[str]:
        """
        获取有效的accessToken（自动刷新）
        
        Args:
            user_id: 用户ID
            db: 数据库会话（可选）
            
        Returns:
            有效的accessToken，无法获取则返回None
        """
        token_info = self.get_token(user_id, db)
        
        if token_info is None:
            logger.warning(f"Token不存在: userId={user_id}")
            return None
        
        # 检查refreshToken是否已过期
        if token_info.is_refresh_token_expired:
            logger.error(f"refreshToken已过期，需要重新授权: userId={user_id}")
            return None
        
        # 检查是否需要刷新
        if token_info.should_refresh:
            logger.info(f"accessToken即将过期，正在刷新: userId={user_id}")
            success = await self.refresh_token(user_id, db)
            if not success:
                logger.error(f"Token刷新失败: userId={user_id}")
                return None
            
            # 重新获取刷新后的Token
            token_info = self.get_token(user_id, db)
            if token_info is None:
                return None
        
        return token_info.access_token
    
    async def refresh_token(
        self,
        user_id: int,
        db: Optional[Session] = None
    ) -> bool:
        """
        刷新Token
        
        Args:
            user_id: 用户ID
            db: 数据库会话（可选）
            
        Returns:
            是否刷新成功
        """
        token_info = self.get_token(user_id, db)
        
        if token_info is None:
            logger.warning(f"刷新失败，Token不存在: userId={user_id}")
            return False
        
        if token_info.is_refresh_token_expired:
            logger.error(f"刷新失败，refreshToken已过期: userId={user_id}")
            return False
        
        # 调用刷新接口
        result = await self.oauth_service.refresh_access_token(
            token_info.refresh_token,
            user_id
        )
        
        if result.get("code") != 0:
            logger.error(f"刷新Token失败: {result}")
            return False
        
        data = result.get("data", {})
        
        # 更新Token
        self.save_token(
            user_id=user_id,
            user_name=token_info.user_name,
            access_token=data.get("accessToken"),
            refresh_token=data.get("refreshToken"),
            open_id=token_info.open_id,
            expires_in=data.get("expiresIn", 86400),
            refresh_expires_in=data.get("refreshExpiresIn", 2592000),
            user_acct_type=token_info.user_acct_type,
            master_name=token_info.master_name,
            db=db,
        )
        
        logger.info(f"Token刷新成功: userId={user_id}")
        return True
    
    def delete_token(self, user_id: int, db: Optional[Session] = None):
        """
        删除Token
        
        Args:
            user_id: 用户ID
            db: 数据库会话（可选）
        """
        # 从缓存删除
        if user_id in self._token_cache:
            del self._token_cache[user_id]
        
        # 从数据库删除
        if db is not None:
            self._delete_from_db(user_id, db)
        
        logger.info(f"Token已删除: userId={user_id}")
    
    def _delete_from_db(self, user_id: int, db: Session):
        """从数据库删除Token（软删除：设置status=0）"""
        from .models import BaiduMarketingToken
        
        try:
            result = db.query(BaiduMarketingToken).filter(
                BaiduMarketingToken.user_id == user_id,
                BaiduMarketingToken.app_id == self.oauth_service.app_id
            ).update({
                "status": 0,
                "updated_at": datetime.now()
            })
            db.commit()
            logger.info(f"Token已从数据库删除(软删除): userId={user_id}, affected={result}")
        except Exception as e:
            logger.error(f"从数据库删除Token失败: {e}")
            db.rollback()
            raise
    
    def get_all_tokens(self, db: Optional[Session] = None) -> List[TokenInfo]:
        """
        获取所有Token
        
        Args:
            db: 数据库会话（可选）
            
        Returns:
            TokenInfo列表
        """
        # 如果有数据库会话，优先从数据库获取
        if db is not None:
            return self._load_all_from_db(db)
        
        # 否则从缓存获取
        return list(self._token_cache.values())
    
    def _load_all_from_db(self, db: Session) -> List[TokenInfo]:
        """从数据库加载所有有效Token"""
        from .models import BaiduMarketingToken
        
        try:
            tokens = db.query(BaiduMarketingToken).filter(
                BaiduMarketingToken.app_id == self.oauth_service.app_id,
                BaiduMarketingToken.status == 1
            ).all()
            
            result = []
            for token in tokens:
                token_record = cast(TokenRecord, token)
                token_info = _build_token_info(token_record)
                result.append(token_info)
                # 同时更新到缓存
                self._token_cache[token_record.user_id] = token_info
            
            logger.info(f"从数据库加载了 {len(result)} 个Token")
            return result
        except Exception as e:
            logger.error(f"从数据库加载所有Token失败: {e}")
            return list(self._token_cache.values())
    
    def load_tokens_from_db(self, db: Session) -> int:
        """
        从数据库加载所有Token到缓存（服务启动时调用）
        
        Args:
            db: 数据库会话
            
        Returns:
            加载的Token数量
        """
        tokens = self._load_all_from_db(db)
        return len(tokens)
    
    async def refresh_all_expiring_tokens(
        self,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        刷新所有即将过期的Token（定时任务使用）
        
        Args:
            db: 数据库会话（可选）
            
        Returns:
            刷新结果统计
        """
        results = {
            "total": 0,
            "refreshed": 0,
            "failed": 0,
            "skipped": 0,
        }
        
        all_tokens = self.get_all_tokens(db)
        results["total"] = len(all_tokens)
        
        for token_info in all_tokens:
            if token_info.should_refresh:
                if token_info.is_refresh_token_expired:
                    logger.warning(
                        f"跳过刷新，refreshToken已过期: userId={token_info.user_id}"
                    )
                    results["skipped"] += 1
                else:
                    success = await self.refresh_token(token_info.user_id, db)
                    if success:
                        results["refreshed"] += 1
                    else:
                        results["failed"] += 1
            else:
                results["skipped"] += 1
        
        logger.info(f"Token批量刷新完成: {results}")
        return results
