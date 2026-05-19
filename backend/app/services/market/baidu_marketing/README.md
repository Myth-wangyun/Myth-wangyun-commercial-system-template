# 百度营销API接入指南

## 一、整体流程

```
开发者创建应用 → 生成授权链接 → 用户点击授权 → 百度回调 → 换取Token → 调用API → 定期刷新Token
```

## 二、目录结构

```
backend/app/services/market/baidu_marketing/
├── __init__.py          # 模块导出
├── config.py            # 配置管理
├── crypto_utils.py      # AES加密和签名工具
├── oauth_service.py     # OAuth服务（授权、换Token）
├── token_service.py     # Token管理服务
├── marketing_api.py     # 营销API调用
├── models.py            # 数据库模型
└── routes.py            # FastAPI路由
```

## 三、快速开始

### 1. 配置环境变量

在 `.env` 文件中添加：

```env
# 百度营销API配置
BAIDU_MARKETING_APP_ID=你的应用ID
BAIDU_MARKETING_SECRET_KEY=你的应用密钥
BAIDU_MARKETING_CALLBACK_URL=https://你的域名/api/v1/baidu-marketing/oauth/callback
BAIDU_MARKETING_DEVELOPER_USER_ID=开发者用户ID
BAIDU_MARKETING_SCOPE=1_0_1,1_2_1_1
```

### 2. 注册路由

在 `main.py` 中添加：

```python
from app.services.market.baidu_marketing.routes import router as baidu_router
from app.services.market.baidu_marketing.config import get_config
from app.services.market.baidu_marketing.routes import init_services, AppConfig

# 注册路由
app.include_router(baidu_router, prefix="/api/v1")

# 应用启动时初始化服务
@app.on_event("startup")
async def startup_event():
    config = get_config()
    init_services(AppConfig(
        app_id=config.app_id,
        secret_key=config.secret_key,
        callback_url=config.callback_url,
        developer_user_id=config.developer_user_id,
    ))
```

### 3. 创建数据库表（可选）

```bash
# 使用 Alembic 生成迁移
alembic revision --autogenerate -m "add baidu marketing tables"
alembic upgrade head
```

## 四、API接口说明

### OAuth授权相关

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/baidu-marketing/auth/generate-url` | POST | 生成授权链接 |
| `/api/v1/baidu-marketing/oauth/callback` | GET | OAuth回调（百度调用） |
| `/api/v1/baidu-marketing/token/exchange` | POST | 手动换取Token |
| `/api/v1/baidu-marketing/token/refresh` | POST | 刷新Token |
| `/api/v1/baidu-marketing/token/{user_id}` | GET | 获取Token信息 |
| `/api/v1/baidu-marketing/tokens` | GET | 获取所有Token |

### 营销API代理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/baidu-marketing/api/account/info` | POST | 获取账户信息 |
| `/api/v1/baidu-marketing/api/campaign/list` | POST | 获取推广计划列表 |
| `/api/v1/baidu-marketing/api/keyword/list` | POST | 获取关键词列表 |
| `/api/v1/baidu-marketing/api/keyword/update` | POST | 更新关键词（改价） |
| `/api/v1/baidu-marketing/api/report/realtime` | POST | 获取实时报告 |

### 定时任务

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/baidu-marketing/tasks/refresh-tokens` | POST | 批量刷新即将过期的Token |

## 五、使用示例

### 1. 生成授权链接

```bash
curl -X POST http://localhost:8000/api/v1/baidu-marketing/auth/generate-url \
  -H "Content-Type: application/json" \
  -d '{
    "scope": "1_0_1,1_2_1_1"
  }'
```

响应：
```json
{
  "code": 0,
  "message": "授权链接生成成功",
  "data": {
    "auth_url": "https://u.baidu.com/oauth/page/index?platformId=xxx&appId=xxx&..."
  }
}
```

### 2. 获取账户信息

```bash
curl -X POST http://localhost:8000/api/v1/baidu-marketing/api/account/info \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "推广账户名称",
    "user_id": 123456,
    "body": {
      "accountFields": ["userId", "balance", "cost"]
    }
  }'
```

### 3. 更新关键词出价

```bash
curl -X POST http://localhost:8000/api/v1/baidu-marketing/api/keyword/update \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "推广账户名称",
    "user_id": 123456,
    "body": {
      "words": [
        {"wordId": 123456, "price": 1.5},
        {"wordId": 123457, "price": 2.0}
      ]
    }
  }'
```

### 4. 获取实时报告

```bash
curl -X POST http://localhost:8000/api/v1/baidu-marketing/api/report/realtime \
  -H "Content-Type: application/json" \
  -d '{
    "user_name": "推广账户名称",
    "user_id": 123456,
    "body": {
      "reportType": 2,
      "levelOfDetails": 3,
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    }
  }'
```

## 六、定时任务配置

### 使用 APScheduler

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.market.baidu_marketing.routes import get_token_service

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('interval', minutes=5)
async def refresh_baidu_tokens():
    """每5分钟刷新即将过期的Token"""
    try:
        token_service = get_token_service()
        results = await token_service.refresh_all_expiring_tokens()
        print(f"Token刷新结果: {results}")
    except Exception as e:
        print(f"Token刷新失败: {e}")

scheduler.start()
```

### 使用 Celery

```python
from celery import Celery
from celery.schedules import crontab

app = Celery('tasks')

@app.task
def refresh_baidu_tokens():
    import asyncio
    from app.services.market.baidu_marketing.routes import get_token_service
    
    async def _refresh():
        token_service = get_token_service()
        return await token_service.refresh_all_expiring_tokens()
    
    return asyncio.run(_refresh())

# celeryconfig.py
app.conf.beat_schedule = {
    'refresh-baidu-tokens': {
        'task': 'tasks.refresh_baidu_tokens',
        'schedule': crontab(minute='*/5'),  # 每5分钟
    },
}
```

## 七、常见错误码

| 错误码 | 说明 | 处理方式 |
|--------|------|----------|
| 89403 | header中缺少accessToken | 检查请求是否携带Token |
| 894061 | accessToken已过期 | 调用刷新接口 |
| 894062 | 授权已失效 | 需要用户重新授权 |
| 894063 | 应用已重置 | 需要用户重新授权 |
| 894064 | 用户已解除授权 | 需要用户重新授权 |

## 八、注意事项

1. **secretKey 安全**
   - 只在后端使用，不要传到前端
   - 不要出现在日志中
   - 使用环境变量存储

2. **回调地址**
   - 必须是 HTTPS（生产环境）
   - 不能包含特殊字符（?、%等）
   - 需要百度能够访问

3. **Token管理**
   - accessToken 有效期 24 小时
   - refreshToken 有效期 30 天
   - 建议提前 5 分钟刷新
   - 刷新后旧Token立即失效

4. **超管账户**
   - 超管账户授权后，子账户可使用超管的Token
   - 调用API时 userName 使用子账户名称
   - accessToken 使用超管的Token

## 九、数据库表结构

### baidu_marketing_app（应用配置表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| app_id | VARCHAR(64) | 应用ID |
| app_name | VARCHAR(100) | 应用名称 |
| secret_key | VARCHAR(128) | 应用密钥 |
| callback_url | VARCHAR(500) | 回调地址 |
| developer_user_id | BIGINT | 开发者用户ID |
| scope | VARCHAR(500) | 权限范围 |
| status | INT | 状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

### baidu_marketing_token（Token表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| app_id | VARCHAR(64) | 应用ID |
| user_id | BIGINT | 用户ID |
| user_name | VARCHAR(100) | 账户名称 |
| open_id | VARCHAR(64) | 用户标识 |
| access_token | TEXT | 授权令牌 |
| refresh_token | TEXT | 刷新令牌 |
| expires_at | DATETIME | 过期时间 |
| refresh_expires_at | DATETIME | 刷新过期时间 |
| user_acct_type | INT | 账户类型 |
| master_uid | BIGINT | 超管ID |
| master_name | VARCHAR(100) | 超管名称 |
| status | INT | 状态 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

## 十、扩展建议

1. **生产环境**
   - 使用 Redis 缓存 Token
   - 实现 Token 自动刷新守护进程
   - 添加监控告警

2. **高可用**
   - Token 存储使用数据库
   - 多实例部署时使用分布式锁

3. **安全性**
   - Token 加密存储
   - 请求限流
   - 审计日志
