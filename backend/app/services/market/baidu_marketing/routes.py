"""
百度营销API - FastAPI路由

提供OAuth回调、Token管理、API代理等HTTP接口
"""

import logging
from typing import Any, Dict, List, Optional

# 导入数据库会话
from app.core.database import get_market_db
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .marketing_api import BaiduMarketingAPI

# 导入服务
from .oauth_service import BaiduOAuthService
from .token_service import BaiduTokenService

logger = logging.getLogger(__name__)

# 创建路由器
router = APIRouter(prefix="/baidu-marketing", tags=["百度营销API"])


# ==================== Pydantic模型 ====================

class AppConfig(BaseModel):
    """应用配置"""
    app_id: str = Field(..., description="应用ID")
    secret_key: str = Field(..., description="应用密钥")
    callback_url: str = Field(..., description="回调地址")
    developer_user_id: int = Field(..., description="开发者用户ID")


class TokenExchangeRequest(BaseModel):
    """Token换取请求"""
    auth_code: str = Field(..., description="临时授权码")
    user_id: int = Field(..., description="用户ID")
    user_name: str = Field(..., description="推广账户名称")


class TokenRefreshRequest(BaseModel):
    """Token刷新请求"""
    user_id: int = Field(..., description="用户ID")


class ApiCallRequest(BaseModel):
    """API调用请求"""
    user_name: str = Field(..., description="推广账户名称")
    user_id: int = Field(..., description="用户ID")
    body: Dict[str, Any] = Field(default_factory=dict, description="请求体")


class GenerateAuthUrlRequest(BaseModel):
    """生成授权链接请求"""
    scope: str = Field(default="1_0_1,1_2_1_1", description="权限范围")
    state: Optional[str] = Field(default=None, description="自定义state参数")


class MultiChannelReportRequest(BaseModel):
    """一站式多渠道报告请求"""
    user_name: str = Field(..., description="推广账户名称")
    user_id: int = Field(..., description="用户ID")
    start_date: str = Field(..., description="开始日期 (YYYY-MM-DD)")
    end_date: str = Field(..., description="结束日期 (YYYY-MM-DD)")
    time_unit: str = Field(
        default="DAY",
        description="时间单位: HOUR(小时), DAY(天), WEEK(周), MONTH(月), SUMMARY(时间段汇总)"
    )
    columns: Optional[List[str]] = Field(
        default=None,
        description="返回字段列表: date, userName, userId, product, impression, click, cost, ctr, cpc"
    )
    products: Optional[List[int]] = Field(
        default=None,
        description="投放渠道过滤: 0(搜索推广), 1(信息流推广), 3(阿拉丁推广), 4(知识营销)"
    )
    start_row: int = Field(default=0, description="起始行（分页）")
    row_count: int = Field(default=200, description="返回行数（最大200）")
    need_sum: bool = Field(default=False, description="是否需要汇总")


class DailyCostReportRequest(BaseModel):
    """每日展点消报告请求"""
    user_name: str = Field(..., description="推广账户名称")
    user_id: int = Field(..., description="用户ID")
    start_date: str = Field(..., description="开始日期 (YYYY-MM-DD)")
    end_date: str = Field(..., description="结束日期 (YYYY-MM-DD)")
    products: Optional[List[int]] = Field(
        default=None,
        description="投放渠道过滤: 0(搜索推广), 1(信息流推广), 3(阿拉丁推广), 4(知识营销)"
    )


class HourlyCostReportRequest(BaseModel):
    """小时级展点消报告请求"""
    user_name: str = Field(..., description="推广账户名称")
    user_id: int = Field(..., description="用户ID")
    date: str = Field(..., description="日期 (YYYY-MM-DD)")
    products: Optional[List[int]] = Field(
        default=None,
        description="投放渠道过滤: 0(搜索推广), 1(信息流推广), 3(阿拉丁推广), 4(知识营销)"
    )


class SummaryCostReportRequest(BaseModel):
    """汇总展点消报告请求"""
    user_name: str = Field(..., description="推广账户名称")
    user_id: int = Field(..., description="用户ID")
    start_date: str = Field(..., description="开始日期 (YYYY-MM-DD)")
    end_date: str = Field(..., description="结束日期 (YYYY-MM-DD)")
    products: Optional[List[int]] = Field(
        default=None,
        description="投放渠道过滤: 0(搜索推广), 1(信息流推广), 3(阿拉丁推广), 4(知识营销)"
    )


class ApiResponse(BaseModel):
    """统一API响应"""
    code: int = Field(default=0, description="状态码: 0-成功")
    message: str = Field(default="success", description="状态消息")
    data: Optional[Any] = Field(default=None, description="数据")


# ==================== 全局服务实例 ====================

# 服务实例（需要在应用启动时初始化）
_oauth_service: Optional[BaiduOAuthService] = None
_token_service: Optional[BaiduTokenService] = None
_marketing_api: Optional[BaiduMarketingAPI] = None
_initialized: bool = False


def init_services(config: AppConfig):
    """
    初始化服务实例
    
    在应用启动时调用，配置百度营销API服务
    
    Args:
        config: 应用配置
    """
    global _oauth_service, _token_service, _marketing_api, _initialized
    
    _oauth_service = BaiduOAuthService(
        app_id=config.app_id,
        secret_key=config.secret_key,
        callback_url=config.callback_url,
        developer_user_id=config.developer_user_id,
    )
    
    _token_service = BaiduTokenService(_oauth_service)
    _marketing_api = BaiduMarketingAPI(_token_service)
    _initialized = True
    
    logger.info(f"百度营销API服务已初始化: appId={config.app_id}")


def _auto_init_from_env():
    """从环境变量自动初始化服务"""
    global _initialized
    if _initialized:
        return
    
    from .config import get_config
    try:
        config = get_config()
        if config and config.app_id and config.app_id != "your_app_id_here":
            init_services(AppConfig(
                app_id=config.app_id,
                secret_key=config.secret_key,
                callback_url=config.callback_url,
                developer_user_id=config.developer_user_id,
            ))
            logger.info("百度营销API服务已从环境变量自动初始化")
    except Exception as e:
        logger.warning(f"百度营销API服务自动初始化失败: {e}")


def get_oauth_service() -> BaiduOAuthService:
    """获取OAuth服务"""
    _auto_init_from_env()  # 尝试自动初始化
    if _oauth_service is None:
        raise HTTPException(
            status_code=500,
            detail="百度营销API服务未初始化，请配置环境变量或调用 init_services"
        )
    return _oauth_service


def get_token_service() -> BaiduTokenService:
    """获取Token服务"""
    _auto_init_from_env()  # 尝试自动初始化
    if _token_service is None:
        raise HTTPException(
            status_code=500,
            detail="百度营销API服务未初始化，请配置环境变量或调用 init_services"
        )
    return _token_service


def get_marketing_api() -> BaiduMarketingAPI:
    """获取营销API服务"""
    _auto_init_from_env()  # 尝试自动初始化
    if _marketing_api is None:
        raise HTTPException(
            status_code=500,
            detail="百度营销API服务未初始化，请配置环境变量或调用 init_services"
        )
    return _marketing_api


# ==================== OAuth相关接口 ====================

@router.post("/init", response_model=ApiResponse, summary="初始化服务")
async def initialize_services(config: AppConfig):
    """
    初始化百度营销API服务
    
    注意：生产环境应从配置文件或环境变量读取，不要通过API传递密钥
    """
    try:
        init_services(config)
        return ApiResponse(
            code=0,
            message="服务初始化成功",
            data={"app_id": config.app_id}
        )
    except Exception as e:
        logger.error(f"服务初始化失败: {e}")
        return ApiResponse(code=-1, message=f"初始化失败: {str(e)}")


@router.post("/auth/generate-url", response_model=ApiResponse, summary="生成授权链接")
async def generate_auth_url(
    request: GenerateAuthUrlRequest,
    oauth_service: BaiduOAuthService = Depends(get_oauth_service)
):
    """
    生成百度OAuth授权链接
    
    将此链接发送给推广用户，用户点击后进入百度授权页面
    """
    try:
        auth_url = oauth_service.generate_auth_url(
            scope=request.scope,
            state=request.state
        )
        return ApiResponse(
            code=0,
            message="授权链接生成成功",
            data={"auth_url": auth_url}
        )
    except Exception as e:
        logger.error(f"生成授权链接失败: {e}")
        return ApiResponse(code=-1, message=f"生成失败: {str(e)}")


@router.get("/oauth/callback", summary="OAuth回调接口")
async def oauth_callback(
    request: Request,
    appId: str = Query(..., description="应用ID"),
    authCode: str = Query(..., description="临时授权码"),
    userId: str = Query(..., description="用户ID"),
    timestamp: str = Query(..., description="时间戳"),
    state: str = Query(..., description="状态码"),
    signature: str = Query(..., description="签名"),
    oauth_service: BaiduOAuthService = Depends(get_oauth_service),
    token_service: BaiduTokenService = Depends(get_token_service),
    db: Session = Depends(get_market_db),
):
    """
    百度OAuth回调接口
    
    百度OAuth中心会在用户授权后调用此接口，传递临时授权码
    
    流程：
    1. 验证签名
    2. 验证state
    3. 用authCode换取accessToken
    4. 保存Token
    """
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "")
    
    # ========== 详细日志 ==========
    logger.info("=" * 60)
    logger.info("百度营销API OAuth回调开始")
    logger.info(f"  appId: {appId}")
    logger.info(f"  userId: {userId}")
    logger.info(f"  authCode: {authCode[:20]}..." if len(authCode) > 20 else f"  authCode: {authCode}")
    logger.info(f"  timestamp: {timestamp}")
    logger.info(f"  state: {state}")
    logger.info(f"  signature: {signature[:30]}..." if len(signature) > 30 else f"  signature: {signature}")
    logger.info(f"  client_ip: {client_ip}")
    logger.info(f"  user_agent: {user_agent}")
    logger.info("=" * 60)
    
    # 打印到控制台确保可见
    print("=" * 60)
    print("[百度营销API] OAuth回调收到请求:")
    print(f"  appId: {appId}")
    print(f"  userId: {userId}")
    print(f"  authCode: {authCode[:20]}..." if len(authCode) > 20 else f"  authCode: {authCode}")
    print(f"  timestamp: {timestamp}")
    print(f"  state: {state}")
    print("=" * 60)
    
    # 1. 验证回调参数
    verify_result = oauth_service.verify_callback(
        app_id=appId,
        auth_code=authCode,
        user_id=userId,
        timestamp=timestamp,
        state=state,
        signature=signature
    )
    
    if not verify_result["success"]:
        error_msg = verify_result['error']
        logger.warning(f"OAuth回调验证失败: {error_msg}")
        print(f"[百度营销API] OAuth回调验证失败: {error_msg}")
        return JSONResponse(
            status_code=400,
            content={
                "code": 600011,
                "message": error_msg,
                "data": None
            }
        )
    
    # 2. 换取accessToken
    print("[百度营销API] 开始用authCode换取accessToken...")
    try:
        user_id_int = int(userId)
    except ValueError:
        print(f"[百度营销API] userId格式错误: {userId}")
        return JSONResponse(
            status_code=400,
            content={
                "code": 600011,
                "message": "userId格式错误",
                "data": None
            }
        )
    
    token_result = await oauth_service.exchange_access_token(
        auth_code=authCode,
        user_id=user_id_int
    )
    
    print(f"[百度营销API] accessToken换取结果: code={token_result.get('code')}")
    
    if token_result.get("code") != 0:
        error_msg = token_result.get("message", "换取Token失败")
        logger.error(f"换取accessToken失败: {token_result}")
        print(f"[百度营销API] 换取accessToken失败: {error_msg}")
        return JSONResponse(
            status_code=400,
            content={
                "code": token_result.get("code", -1),
                "message": error_msg,
                "data": None
            }
        )
    
    # 3. 获取用户信息
    data = token_result.get("data", {})
    open_id = data.get("openId")
    access_token = data.get("accessToken")
    
    print(f"[百度营销API] 获取到accessToken，openId={open_id}")
    
    # 查询用户详细信息
    print("[百度营销API] 开始获取用户信息...")
    user_info_result = await oauth_service.get_user_info(
        open_id=open_id,
        access_token=access_token,
        user_id=user_id_int
    )
    
    user_name = ""
    user_acct_type = 1
    master_name = None
    
    if user_info_result.get("code") == 0:
        user_data = user_info_result.get("data", {})
        user_name = user_data.get("masterName", "")
        user_acct_type = user_data.get("userAcctType", 1)
        if user_acct_type == 2:
            master_name = user_name
        print(f"[百度营销API] 用户信息获取成功: userName={user_name}, userAcctType={user_acct_type}")
    else:
        print(f"[百度营销API] 用户信息获取失败: {user_info_result}")
    
    # 4. 保存Token（同时保存到内存缓存和数据库）
    print("[百度营销API] 保存Token到数据库...")
    token_service.save_token(
        user_id=user_id_int,
        user_name=user_name or f"user_{user_id_int}",
        access_token=data.get("accessToken"),
        refresh_token=data.get("refreshToken"),
        open_id=open_id,
        expires_in=data.get("expiresIn", 86400),
        refresh_expires_in=data.get("refreshExpiresIn", 2592000),
        user_acct_type=user_acct_type,
        master_name=master_name,
        db=db,  # 传入数据库会话以持久化Token
    )
    
    logger.info(f"OAuth授权成功: userId={user_id_int}, userName={user_name}")
    print(f"[百度营销API] ✅ OAuth授权成功！userId={user_id_int}, userName={user_name}")
    print("=" * 60)
    
    # 返回成功响应
    return JSONResponse(content={
        "code": 0,
        "message": "授权成功",
        "data": {
            "userId": user_id_int,
            "userName": user_name,
            "userAcctType": user_acct_type,
            "accessToken": access_token[:20] + "..." if access_token else None,  # 脱敏
        }
    })


@router.post("/token/exchange", response_model=ApiResponse, summary="手动换取Token")
async def exchange_token(
    request: TokenExchangeRequest,
    oauth_service: BaiduOAuthService = Depends(get_oauth_service),
    token_service: BaiduTokenService = Depends(get_token_service),
):
    """
    手动换取accessToken
    
    如果回调接口有问题，可以手动调用此接口
    """
    # 换取Token
    token_result = await oauth_service.exchange_access_token(
        auth_code=request.auth_code,
        user_id=request.user_id
    )
    
    if token_result.get("code") != 0:
        return ApiResponse(
            code=token_result.get("code", -1),
            message=token_result.get("message", "换取Token失败")
        )
    
    data = token_result.get("data", {})
    
    # 保存Token
    token_service.save_token(
        user_id=request.user_id,
        user_name=request.user_name,
        access_token=data.get("accessToken"),
        refresh_token=data.get("refreshToken"),
        open_id=data.get("openId"),
        expires_in=data.get("expiresIn", 86400),
        refresh_expires_in=data.get("refreshExpiresIn", 2592000),
    )
    
    return ApiResponse(
        code=0,
        message="Token换取成功",
        data={
            "userId": request.user_id,
            "userName": request.user_name,
            "expiresIn": data.get("expiresIn"),
        }
    )


@router.post("/token/refresh", response_model=ApiResponse, summary="刷新Token")
async def refresh_token(
    request: TokenRefreshRequest,
    token_service: BaiduTokenService = Depends(get_token_service),
    db: Session = Depends(get_market_db),
):
    """
    刷新accessToken
    """
    success = await token_service.refresh_token(request.user_id, db)
    
    if not success:
        return ApiResponse(code=-1, message="Token刷新失败")
    
    return ApiResponse(code=0, message="Token刷新成功")


@router.get("/token/{user_id}", response_model=ApiResponse, summary="获取Token信息")
async def get_token_info(
    user_id: int,
    token_service: BaiduTokenService = Depends(get_token_service),
    db: Session = Depends(get_market_db),
):
    """
    获取指定用户的Token信息
    """
    token_info = token_service.get_token(user_id, db)
    
    if token_info is None:
        return ApiResponse(code=-1, message="Token不存在")
    
    return ApiResponse(
        code=0,
        message="success",
        data=token_info.to_dict()
    )


@router.get("/tokens", response_model=ApiResponse, summary="获取所有Token")
async def get_all_tokens(
    token_service: BaiduTokenService = Depends(get_token_service),
    db: Session = Depends(get_market_db),
):
    """
    获取所有已授权的Token列表
    """
    tokens = token_service.get_all_tokens(db)
    
    return ApiResponse(
        code=0,
        message="success",
        data=[t.to_dict() for t in tokens]
    )


# ==================== 营销API代理接口 ====================

@router.post("/api/account/info", response_model=ApiResponse, summary="获取账户信息")
async def get_account_info(
    request: ApiCallRequest,
    marketing_api: BaiduMarketingAPI = Depends(get_marketing_api),
):
    """
    获取推广账户信息
    
    - 账户余额
    - 消费金额
    - 预算设置
    """
    result = await marketing_api.get_account_info(
        user_name=request.user_name,
        user_id=request.user_id,
        account_fields=request.body.get("accountFields"),
    )
    
    header = result.get("header", {})
    
    if header.get("status", 0) != 0:
        return ApiResponse(
            code=header.get("status", -1),
            message=header.get("desc", "API调用失败"),
            data=result
        )
    
    return ApiResponse(
        code=0,
        message="success",
        data=result.get("body")
    )


@router.post("/api/campaign/list", response_model=ApiResponse, summary="获取推广计划列表")
async def get_campaign_list(
    request: ApiCallRequest,
    marketing_api: BaiduMarketingAPI = Depends(get_marketing_api),
):
    """
    获取搜索广告推广计划列表
    """
    result = await marketing_api.get_campaign(
        user_name=request.user_name,
        user_id=request.user_id,
        campaign_ids=request.body.get("campaignIds"),
        campaign_fields=request.body.get("campaignFields"),
    )
    
    header = result.get("header", {})
    
    if header.get("status", 0) != 0:
        return ApiResponse(
            code=header.get("status", -1),
            message=header.get("desc", "API调用失败"),
            data=result
        )
    
    return ApiResponse(
        code=0,
        message="success",
        data=result.get("body")
    )


@router.post("/api/keyword/list", response_model=ApiResponse, summary="获取关键词列表")
async def get_keyword_list(
    request: ApiCallRequest,
    marketing_api: BaiduMarketingAPI = Depends(get_marketing_api),
):
    """
    获取搜索广告关键词列表
    """
    result = await marketing_api.get_word(
        user_name=request.user_name,
        user_id=request.user_id,
        word_ids=request.body.get("wordIds"),
        adgroup_ids=request.body.get("adgroupIds"),
        word_fields=request.body.get("wordFields"),
    )
    
    header = result.get("header", {})
    
    if header.get("status", 0) != 0:
        return ApiResponse(
            code=header.get("status", -1),
            message=header.get("desc", "API调用失败"),
            data=result
        )
    
    return ApiResponse(
        code=0,
        message="success",
        data=result.get("body")
    )


@router.post("/api/keyword/update", response_model=ApiResponse, summary="更新关键词")
async def update_keyword(
    request: ApiCallRequest,
    marketing_api: BaiduMarketingAPI = Depends(get_marketing_api),
):
    """
    更新关键词（改价等）
    
    请求body示例:
    ```json
    {
        "words": [
            {"wordId": 123456, "price": 1.5}
        ]
    }
    ```
    """
    words = request.body.get("words", [])
    
    if not words:
        return ApiResponse(code=-1, message="words参数不能为空")
    
    result = await marketing_api.update_word(
        user_name=request.user_name,
        user_id=request.user_id,
        words=words,
    )
    
    header = result.get("header", {})
    
    if header.get("status", 0) != 0:
        return ApiResponse(
            code=header.get("status", -1),
            message=header.get("desc", "API调用失败"),
            data=result
        )
    
    return ApiResponse(
        code=0,
        message="success",
        data=result.get("body")
    )


@router.post("/api/report/realtime", response_model=ApiResponse, summary="获取实时报告")
async def get_realtime_report(
    request: ApiCallRequest,
    marketing_api: BaiduMarketingAPI = Depends(get_marketing_api),
):
    """
    获取实时数据报告
    
    请求body示例:
    ```json
    {
        "reportType": 2,
        "levelOfDetails": 3,
        "startDate": "2024-01-01",
        "endDate": "2024-01-31"
    }
    ```
    """
    start_date = request.body.get("startDate")
    end_date = request.body.get("endDate")
    if not isinstance(start_date, str) or not isinstance(end_date, str):
        return ApiResponse(code=400, message="startDate 和 endDate 为必填字符串参数", data=None)
    result = await marketing_api.get_real_time_data(
        user_name=request.user_name,
        user_id=request.user_id,
        report_type=request.body.get("reportType", 2),
        level_of_details=request.body.get("levelOfDetails", 3),
        start_date=start_date,
        end_date=end_date,
        stat_ids=request.body.get("statIds"),
        device=request.body.get("device"),
        performance_data=request.body.get("performanceData"),
    )
    
    header = result.get("header", {})
    
    if header.get("status", 0) != 0:
        return ApiResponse(
            code=header.get("status", -1),
            message=header.get("desc", "API调用失败"),
            data=result
        )
    
    return ApiResponse(
        code=0,
        message="success",
        data=result.get("body")
    )


# ==================== 一站式多渠道报告接口 ====================

@router.post("/api/report/multi-channel", response_model=ApiResponse, summary="获取一站式多渠道报告")
async def get_multi_channel_report(
    request: MultiChannelReportRequest,
    marketing_api: BaiduMarketingAPI = Depends(get_marketing_api),
    db: Session = Depends(get_market_db),
):
    """
    获取一站式多渠道报告数据
    
    获取账户粒度的多渠道数据（包括搜索推广、信息流推广、阿拉丁推广、知识营销）
    
    **时间单位 (time_unit):**
    - HOUR: 小时
    - DAY: 天
    - WEEK: 周
    - MONTH: 月
    - SUMMARY: 时间段汇总
    
    **返回字段 (columns):**
    - date: 日期
    - userName: 账户名
    - userId: 账户ID
    - product: 投放渠道 (0:搜索推广, 1:信息流推广, 3:阿拉丁推广, 4:知识营销)
    - impression: 展现
    - click: 点击
    - cost: 消费
    - ctr: 点击率
    - cpc: 平均点击价格
    
    **请求示例:**
    ```json
    {
        "user_name": "your_username",
        "user_id": 12345678,
        "start_date": "2024-01-01",
        "end_date": "2024-01-31",
        "time_unit": "DAY",
        "columns": ["product", "date", "cost", "impression", "click"],
        "products": [0, 1]
    }
    ```
    
    **注意:** 支持的最大时间区间为824天
    """
    result = await marketing_api.get_multi_channel_report(
        user_name=request.user_name,
        user_id=request.user_id,
        start_date=request.start_date,
        end_date=request.end_date,
        time_unit=request.time_unit,
        columns=request.columns,
        products=request.products,
        start_row=request.start_row,
        row_count=request.row_count,
        need_sum=request.need_sum,
        db=db,
    )
    
    # OpenApiReportService返回格式与其他接口不同
    status = result.get("status", -1)
    success = result.get("success", False)
    
    if status != 200 or not success:
        return ApiResponse(
            code=status,
            message=result.get("message", "API调用失败"),
            data=result
        )
    
    return ApiResponse(
        code=0,
        message="success",
        data=result.get("data")
    )


@router.post("/api/report/daily-cost", response_model=ApiResponse, summary="获取每日展点消数据")
async def get_daily_cost_report(
    request: DailyCostReportRequest,
    marketing_api: BaiduMarketingAPI = Depends(get_marketing_api),
    db: Session = Depends(get_market_db),
):
    """
    获取每日展点消数据（便捷接口）
    
    返回每日的展现、点击、消费、点击率、平均点击价格数据
    
    **请求示例:**
    ```json
    {
        "user_name": "your_username",
        "user_id": 12345678,
        "start_date": "2024-01-01",
        "end_date": "2024-01-31",
        "products": [0, 1]
    }
    ```
    """
    result = await marketing_api.get_daily_cost_report(
        user_name=request.user_name,
        user_id=request.user_id,
        start_date=request.start_date,
        end_date=request.end_date,
        products=request.products,
        db=db,
    )
    
    status = result.get("status", -1)
    success = result.get("success", False)
    
    if status != 200 or not success:
        return ApiResponse(
            code=status,
            message=result.get("message", "API调用失败"),
            data=result
        )
    
    return ApiResponse(
        code=0,
        message="success",
        data=result.get("data")
    )


@router.post("/api/report/hourly-cost", response_model=ApiResponse, summary="获取小时级展点消数据")
async def get_hourly_cost_report(
    request: HourlyCostReportRequest,
    marketing_api: BaiduMarketingAPI = Depends(get_marketing_api),
    db: Session = Depends(get_market_db),
):
    """
    获取小时级展点消数据（便捷接口）
    
    返回指定日期每小时的展现、点击、消费数据
    
    **请求示例:**
    ```json
    {
        "user_name": "your_username",
        "user_id": 12345678,
        "date": "2024-01-15",
        "products": [0, 1]
    }
    ```
    """
    result = await marketing_api.get_hourly_cost_report(
        user_name=request.user_name,
        user_id=request.user_id,
        date=request.date,
        products=request.products,
        db=db,
    )
    
    status = result.get("status", -1)
    success = result.get("success", False)
    
    if status != 200 or not success:
        return ApiResponse(
            code=status,
            message=result.get("message", "API调用失败"),
            data=result
        )
    
    return ApiResponse(
        code=0,
        message="success",
        data=result.get("data")
    )


@router.post("/api/report/summary-cost", response_model=ApiResponse, summary="获取时间段汇总展点消数据")
async def get_summary_cost_report(
    request: SummaryCostReportRequest,
    marketing_api: BaiduMarketingAPI = Depends(get_marketing_api),
    db: Session = Depends(get_market_db),
):
    """
    获取时间段汇总展点消数据（便捷接口）
    
    返回指定时间段内的汇总展现、点击、消费、点击率、平均点击价格数据
    
    **请求示例:**
    ```json
    {
        "user_name": "your_username",
        "user_id": 12345678,
        "start_date": "2024-01-01",
        "end_date": "2024-01-31",
        "products": [0, 1]
    }
    ```
    """
    result = await marketing_api.get_summary_cost_report(
        user_name=request.user_name,
        user_id=request.user_id,
        start_date=request.start_date,
        end_date=request.end_date,
        products=request.products,
        db=db,
    )
    
    status = result.get("status", -1)
    success = result.get("success", False)
    
    if status != 200 or not success:
        return ApiResponse(
            code=status,
            message=result.get("message", "API调用失败"),
            data=result
        )
    
    return ApiResponse(
        code=0,
        message="success",
        data=result.get("data")
    )


# ==================== 定时任务接口 ====================

@router.post("/tasks/refresh-tokens", response_model=ApiResponse, summary="批量刷新Token")
async def batch_refresh_tokens(
    token_service: BaiduTokenService = Depends(get_token_service),
):
    """
    批量刷新即将过期的Token
    
    建议通过定时任务每5分钟调用一次
    """
    results = await token_service.refresh_all_expiring_tokens()
    
    return ApiResponse(
        code=0,
        message="批量刷新完成",
        data=results
    )
