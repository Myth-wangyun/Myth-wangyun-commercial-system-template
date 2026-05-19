# 生产环境：生成/替换 JWT 密钥（SECRET_KEY）与启动流程

本文档用于：
- **首次上线**时生成并配置 JWT `SECRET_KEY`
- **密钥轮换**（怀疑泄露/按周期轮换）
- 确保后端能通过 [backend/production.py](backend/production.py) + [.env.production](.env.production) 正常启动

---

## 0. 重要说明（必须读）

- **替换 `SECRET_KEY` 会让所有已签发的 Token 立即失效**（包括 `access_token` / `refresh_token`）。
  - 现象：用户会被要求重新登录，这是正常的。
- 本项目生产环境 Cookie 默认 `secure=true` 且 `samesite=none`（用于跨站携带 Cookie）。
  - **必须通过 HTTPS 访问**，否则浏览器会拒绝写入 Cookie，表现为“登录后还是未登录”。

---

## 1. 生成新的 JWT 密钥（推荐方式）

在服务器上运行（PowerShell 或 CMD 都可以）：

- 生成 64 字节强随机密钥：

`python -c "import secrets; print(secrets.token_urlsafe(64))"`

把输出的一整串复制下来（不要包含引号）。

---

## 2. 在 .env.production 中替换 SECRET_KEY

编辑项目根目录的 [.env.production](.env.production)，找到：

`SECRET_KEY=...`

替换为刚生成的值，例如：

`SECRET_KEY=替换成你生成的那一长串`

同时建议确认这些项（按你实际策略设置即可）：
- `ALGORITHM=HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES=480`
- `REFRESH_TOKEN_EXPIRE_DAYS=7`

---

## 3. CORS 与前端域名（避免“能启动但前端登录不上”）

前端登录请求会携带 Cookie（axios 配置了 `withCredentials: true`），因此 CORS 必须允许你的前端域名。

在 [.env.production](.env.production) 配置 `ALLOWED_ORIGINS`（两种写法都支持）：

- 推荐：JSON 数组（更直观）

`ALLOWED_ORIGINS=["https://qingmeisj.com","https://www.qingmeisj.com"]`

- 或：逗号分隔字符串

`ALLOWED_ORIGINS=https://qingmeisj.com,https://www.qingmeisj.com`

注意：
- 生产环境 **不要** 设置 `CORS_ALLOW_ALL=1`（那样会禁用凭证 Cookie）。

---

## 4. 启动后端（Windows Server 推荐流程）

### 4.1 进入后端目录

`cd backend`

### 4.2（可选）确认依赖已安装

`python -m pip install -r requirements.txt`

### 4.3 使用生产启动脚本

`python production.py`

说明：
- [backend/production.py](backend/production.py) 会设置 `APP_ENV=production` 并加载 [.env.production](.env.production)
- 后端 Settings 也会在生产环境优先读取 `.env.production`（以防你直接运行 `python main.py`）

---

## 5. 启动后自检清单

### 5.1 健康检查

浏览器或命令行访问：
- `http(s)://<你的域名>/health`（或 `http://<服务器IP>:8000/health`）

预期：返回 `{"status":"ok"}`

### 5.2 登录接口是否可达

- 你可以先用浏览器 DevTools → Network 观察：
  - `/api/v1/auth/login` 是否返回 200
  - Response Headers 是否包含 `Set-Cookie: access_token=...` / `refresh_token=...`

如果 login 返回 200，但浏览器没有保存 Cookie：
- 检查是否 HTTPS
- 检查反向代理是否正确转发（如 Nginx/IIS 终止 HTTPS）

---

## 6. 密钥轮换后的用户侧影响（运维提示）

- 所有用户需要重新登录
- 如遇“卡在登录页/一直 401”，可让用户清理站点 Cookie 后重试

---

## 7. 常见故障与定位

### 7.1 后端启动时报 settings 解析错误

优先检查 [.env.production](.env.production) 是否有语法问题（比如漏了等号、带了多余引号）。

### 7.2 前端提示未登录/登录后立即跳回登录页

常见原因：
- 非 HTTPS 导致 `secure=true` Cookie 被浏览器拒绝
- CORS 未允许前端域名（`ALLOWED_ORIGINS` 配错）

---
