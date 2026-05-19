# Windows Server 2019 生产环境部署指南

## 入口文档（JWT 密钥与启动）

如果你的目标是“用 [../../backend/.env.production](../../backend/.env.production) 配好 `SECRET_KEY` 并通过 [../../backend/production.py](../../backend/production.py) 启动”，直接按这个文档走：

- [../JWT_KEY_ROTATION_AND_PROD_STARTUP.md](../JWT_KEY_ROTATION_AND_PROD_STARTUP.md)

## 📋 概述

本系统在 Windows Server 2019 上部署时，由于 Windows 不支持 `uvicorn --workers` 原生多进程模式，需要使用替代方案。

---

## ⚠️ 部署前必读

### 1. 配置生产环境变量

**必须** 修改 `.env.production` 中的以下配置：

```bash
# 数据库配置 - 根据实际生产环境修改
DB_HOST=your-db-host
DB_PORT=5432
DB_PASSWORD=your-strong-password
DB_NAME=qmjy

# JWT密钥 - 必须修改！使用以下命令生成：
# python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-random-secret-key-here

# CORS域名 - 添加你的生产域名
ALLOWED_ORIGINS=["https://your-domain.com"]
```

### 2. 正确的启动方式

```powershell
# 必须在 backend 目录下启动
cd backend
python production.py
```

**不要** 从项目根目录运行 `python backend/production.py`，会导致模块导入失败。

---

## 🎯 推荐方案对比

| 方案 | 启动脚本 | 优点 | 缺点 | 推荐度 |
|------|---------|------|------|--------|
| **Hypercorn** | `scripts/deployment/start_production.ps1` | 原生支持 ASGI、性能优秀、Windows 友好 | 需要额外安装 | ⭐⭐⭐⭐⭐ |
| **Waitress** | `scripts/deployment/start_production_waitress.ps1` | Windows 专用、稳定可靠 | 需要 ASGI→WSGI 适配器 | ⭐⭐⭐⭐ |
| **Uvicorn 多进程** | `scripts/deployment/start_production_uvicorn.ps1` | 支持 WebSocket、灵活 | 需要手动管理进程 | ⭐⭐⭐ |

---

## 🚀 方案 1：Hypercorn（推荐）

### 安装依赖

```powershell
pip install hypercorn
```

### 启动服务

```powershell
cd backend
.\scripts\deployment\start_production.ps1
```

### 手动启动（可选）

```powershell
# 获取 CPU 核心数
$cpuCount = (Get-WmiObject Win32_ComputerSystem).NumberOfLogicalProcessors

# 启动 Hypercorn
hypercorn main:app --bind 0.0.0.0:8000 --workers $cpuCount --worker-class asyncio
```

### 特点

- ✅ 原生支持 ASGI（FastAPI）
- ✅ 自动根据 CPU 核心数设置 workers
- ✅ 性能优秀，适合生产环境
- ✅ Windows 完全支持

---

## 🔧 方案 2：Waitress（备选）

### 安装依赖

```powershell
pip install waitress asgiref
```

### 启动服务

```powershell
cd backend
.\scripts\deployment\start_production_waitress.ps1
```

### 特点

- ✅ Windows 专用 WSGI 服务器
- ✅ 稳定可靠，适合生产环境
- ⚠️ 需要 `asgiref` 适配器（ASGI→WSGI）
- ❌ 不支持 WebSocket（本系统不需要）

---

## ⚡ 方案 3：Uvicorn 多进程（手动管理）

### 启动服务

```powershell
cd backend
.\scripts\deployment\start_production_uvicorn.ps1
```

### 特点

- ✅ 支持 WebSocket（本系统不需要）
- ✅ 灵活，可自定义端口和进程数
- ⚠️ 需要手动管理多个进程
- ⚠️ 如需负载均衡，需要配置 Nginx

### Nginx 负载均衡配置示例

```nginx
upstream backend_api {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    server 127.0.0.1:8003;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location /api/ {
        proxy_pass http://backend_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 📊 性能优化建议

### 1. 数据库连接池

在 [../../backend/app/core/database.py](../../backend/app/core/database.py) 中配置：

```python
engine = create_engine(
    database_url,
    pool_size=20,          # 连接池大小
    max_overflow=10,       # 最大溢出连接数
    pool_pre_ping=True,    # 连接前检查
    pool_recycle=3600,    # 连接回收时间（秒）
)
```

### 2. Worker 数量

- **Hypercorn**: 自动设置为 CPU 核心数
- **Waitress**: 线程数 = CPU 核心数
- **Uvicorn 多进程**: 进程数 = CPU 核心数

### 3. 静态文件

使用 Nginx 处理静态文件，不要通过 Python 应用处理：

```nginx
location /static/ {
    alias /path/to/static/files/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 🔍 监控和日志

### 查看日志

所有启动脚本都会输出日志到控制台。生产环境建议重定向到文件：

```powershell
cd backend
.\scripts\deployment\start_production.ps1 | Tee-Object -FilePath "logs\app.log"
```

### 健康检查

访问 `http://your-server:8000/docs` 查看 API 文档，确认服务正常运行。

---

## 🛠️ 故障排查

### 问题 1: 端口被占用

```powershell
# 查看端口占用
netstat -ano | findstr :8000

# 结束进程（替换 PID）
taskkill /PID <PID> /F
```

### 问题 2: 依赖未安装

```powershell
# 安装所有依赖
pip install -r requirements.txt

# 安装生产环境依赖
pip install hypercorn
# 或
pip install waitress asgiref
```

### 问题 3: 编码问题

确保环境变量已设置：

```powershell
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"
```

---

## 📝 Windows 服务化（开机自启）

### 使用 NSSM（推荐）

1. 下载 NSSM: https://nssm.cc/download
2. 安装服务：

```powershell
nssm install QMEduSystem "C:\Python\python.exe" "D:\path\to\backend\scripts\deployment\start_production.ps1"
```

3. 启动服务：

```powershell
nssm start QMEduSystem
```

---

## ✅ 快速开始

1. **安装依赖**:
   ```powershell
   pip install hypercorn
   ```

2. **启动服务**:
   ```powershell
   cd backend
    .\scripts\deployment\start_production.ps1
   ```

3. **验证运行**:
   访问 `http://localhost:8000/docs`

---

## 📞 总结

| 场景 | 推荐方案 |
|------|---------|
| **快速上线，简单稳定** | Hypercorn |
| **Windows 专用，最稳定** | Waitress |
| **需要 WebSocket 或高并发** | Uvicorn 多进程 + Nginx |

**当前推荐：Hypercorn**（`scripts/deployment/start_production.ps1`）

