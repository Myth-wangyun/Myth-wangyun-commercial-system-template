"""
百度营销API - OAuth服务

处理百度OAuth授权流程，包括：
- 生成授权链接
- 处理OAuth回调
- 验证签名
"""

import logging
from typing import Any, Dict, Optional
from urllib.parse import urlencode

import httpx

from .crypto_utils import SignatureService

logger = logging.getLogger(__name__)


class BaiduOAuthService:
    """
    百度OAuth授权服务
    
    处理OAuth2.0授权流程
    """
    
    # 百度OAuth相关URL
    OAUTH_PAGE_URL = "https://u.baidu.com/oauth/page/index"
    ACCESS_TOKEN_URL = "https://u.baidu.com/oauth/accessToken"
    REFRESH_TOKEN_URL = "https://u.baidu.com/oauth/refreshToken"
    USER_INFO_URL = "https://u.baidu.com/oauth/getUserInfo"
    
    # 固定的platformId
    PLATFORM_ID = "4960345965958561794"
    
    def __init__(
        self,
        app_id: str,
        secret_key: str,
        callback_url: str,
        developer_user_id: int
    ):
        """
        初始化OAuth服务
        
        Args:
            app_id: 应用ID
            secret_key: 应用密钥
            callback_url: 回调地址
            developer_user_id: 开发者用户ID（用于生成state）
        """
        self.app_id = app_id
        self.secret_key = secret_key
        self.callback_url = callback_url
        self.developer_user_id = developer_user_id
        
        # HTTP客户端
        self._client: Optional[httpx.AsyncClient] = None
    
    async def _get_client(self) -> httpx.AsyncClient:
        """获取HTTP客户端（懒加载）"""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=30.0)
        return self._client
    
    async def close(self):
        """关闭HTTP客户端"""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    def generate_auth_url(
        self,
        scope: str = "1_0_1,1_2_1_1",
        state: Optional[str] = None
    ) -> str:
        """
        生成授权链接
        
        Args:
            scope: 权限范围（多个用逗号分隔）
                - 1_0_1: 财务信息
                - 1_2_1_1: 账号信息
                - 更多scope请参考百度官方文档
            state: 自定义state参数，为空则自动生成
            
        Returns:
            完整的授权链接
        """
        if state is None:
            state = SignatureService.generate_state(
                self.app_id, 
                self.developer_user_id
            )
        
        params = {
            "platformId": self.PLATFORM_ID,
            "appId": self.app_id,
            "scope": scope,
            "state": state,
            "callback": self.callback_url,
        }
        
        return f"{self.OAUTH_PAGE_URL}?{urlencode(params)}"
    
    def verify_callback(
        self,
        app_id: str,
        auth_code: str,
        user_id: str,
        timestamp: str,
        state: str,
        signature: str
    ) -> Dict[str, Any]:
        """
        验证回调参数
        
        Args:
            app_id: 应用ID
            auth_code: 临时授权码
            user_id: 授权用户ID
            timestamp: 时间戳
            state: 状态码
            signature: 签名
            
        Returns:
            验证结果字典，包含：
            - success: 是否成功
            - error: 错误信息（如果失败）
        """
        result: Dict[str, Any] = {"success": False, "error": None}
        
        # 1. 验证appId
        if app_id != self.app_id:
            result["error"] = "appId不匹配"
            logger.warning(f"OAuth回调验证失败: appId不匹配, 期望={self.app_id}, 实际={app_id}")
            return result
        
        # 2. 验证state（防CSRF）
        if not SignatureService.verify_state(
            self.app_id,
            self.developer_user_id,
            state
        ):
            result["error"] = "state验证失败"
            logger.warning("OAuth回调验证失败: state不匹配")
            return result
        
        # 3. 验证signature
        params = {
            "appId": app_id,
            "authCode": auth_code,
            "userId": user_id,
            "state": state,
            "timestamp": timestamp,
        }
        
        if not SignatureService.verify_signature(params, signature, self.secret_key):
            result["error"] = "签名验证失败"
            logger.warning("OAuth回调验证失败: 签名不匹配")
            return result
        
        result["success"] = True
        logger.info(f"OAuth回调验证成功: userId={user_id}")
        return result
    
    async def exchange_access_token(
        self,
        auth_code: str,
        user_id: int
    ) -> Dict[str, Any]:
        """
        用authCode换取accessToken
        
        Args:
            auth_code: 临时授权码
            user_id: 授权用户ID
            
        Returns:
            API返回结果，成功时包含：
            - accessToken: 授权令牌
            - refreshToken: 刷新令牌
            - expiresIn: 授权令牌剩余有效时间（秒）
            - refreshExpiresIn: 刷新令牌剩余有效时间（秒）
            - openId: 用户标识
            - userId: 用户ID
        """
        client = await self._get_client()
        
        payload = {
            "appId": self.app_id,
            "authCode": auth_code,
            "secretKey": self.secret_key,
            "grantType": "auth_code",
            "userId": user_id,
        }
        
        try:
            response = await client.post(
                self.ACCESS_TOKEN_URL,
                json=payload,
                headers={"Content-Type": "application/json;charset=utf-8"}
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("code") == 0:
                logger.info(f"accessToken换取成功: userId={user_id}")
            else:
                logger.error(f"accessToken换取失败: {result}")
            
            return result
            
        except httpx.HTTPError as e:
            logger.error(f"accessToken换取HTTP错误: {e}")
            return {
                "code": -1,
                "message": f"HTTP错误: {str(e)}",
                "data": None
            }
        except Exception as e:
            logger.error(f"accessToken换取异常: {e}")
            return {
                "code": -1,
                "message": f"异常: {str(e)}",
                "data": None
            }
    
    async def refresh_access_token(
        self,
        refresh_token: str,
        user_id: int
    ) -> Dict[str, Any]:
        """
        刷新accessToken
        
        Args:
            refresh_token: 刷新令牌
            user_id: 用户ID
            
        Returns:
            API返回结果
        """
        client = await self._get_client()
        
        payload = {
            "appId": self.app_id,
            "secretKey": self.secret_key,
            "userId": user_id,
            "refreshToken": refresh_token,
        }
        
        try:
            response = await client.post(
                self.REFRESH_TOKEN_URL,
                json=payload,
                headers={"Content-Type": "application/json;charset=utf-8"}
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("code") == 0:
                logger.info(f"accessToken刷新成功: userId={user_id}")
            else:
                logger.error(f"accessToken刷新失败: {result}")
            
            return result
            
        except httpx.HTTPError as e:
            logger.error(f"accessToken刷新HTTP错误: {e}")
            return {
                "code": -1,
                "message": f"HTTP错误: {str(e)}",
                "data": None
            }
        except Exception as e:
            logger.error(f"accessToken刷新异常: {e}")
            return {
                "code": -1,
                "message": f"异常: {str(e)}",
                "data": None
            }
    
    async def get_user_info(
        self,
        open_id: str,
        access_token: str,
        user_id: int,
        need_sub_list: bool = False,
        page_size: int = 100,
        last_page_max_uc_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        查询授权用户信息
        
        Args:
            open_id: 用户标识
            access_token: 授权令牌
            user_id: 用户ID
            need_sub_list: 是否需要子账号列表
            page_size: 分页数量（默认100，最大500）
            last_page_max_uc_id: 上一页最大userId（用于分页）
            
        Returns:
            用户信息
        """
        client = await self._get_client()
        
        payload = {
            "openId": open_id,
            "accessToken": access_token,
            "userId": user_id,
        }
        
        if need_sub_list:
            payload["needSubList"] = True
            payload["pageSize"] = min(page_size, 500)
            if last_page_max_uc_id is not None:
                payload["lastPageMaxUcId"] = last_page_max_uc_id
            else:
                payload["lastPageMaxUcId"] = 1  # 第一次查询设为1
        
        try:
            response = await client.post(
                self.USER_INFO_URL,
                json=payload,
                headers={"Content-Type": "application/json;charset=utf-8"}
            )
            response.raise_for_status()
            return response.json()
            
        except httpx.HTTPError as e:
            logger.error(f"获取用户信息HTTP错误: {e}")
            return {
                "code": -1,
                "message": f"HTTP错误: {str(e)}",
                "data": None
            }
        except Exception as e:
            logger.error(f"获取用户信息异常: {e}")
            return {
                "code": -1,
                "message": f"异常: {str(e)}",
                "data": None
            }
