# Linux 生产环境部署指南

> 清美教育管理系统 - Debian/Ubuntu 生产环境部署方案  
> 适用于：Debian 13.2, Ubuntu 22.04+, 其他基于 Debian 的 Linux 发行版  
> 更新时间：2026-01-23

---

## 📋 目录

- [环境要求](#环境要求)
- [方案一：Systemd + Uvicorn（推荐）](#方案一systemd--uvicorn推荐)
- [方案二：Docker Compose（容器化）](#方案二docker-compose容器化)
- [方案三：Gunicorn + Uvicorn Workers（高并发）](#方案三gunicorn--uvicorn-workers高并发)
- [Nginx 反向代理配置](#nginx-反向代理配置)
- [方案对比](#方案对比)
- [常见问题](#常见问题)

---

## 环境要求

### 系统要求
- **操作系统**：Debian 13.2 / Ubuntu 22.04+ / 其他 Debian 系发行版
- **Python**：3.12+
- **数据库**：PostgreSQL 15+
- **内存**：最低 2GB，推荐 4GB+
- **磁盘**：最低 20GB，推荐 50GB+

### 基础依赖安装

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装必要的系统包
sudo apt install -y \
    python3.12 \
    python3.12-venv \
    python3-pip \
    postgresql-client \
    nginx \
    git \
    curl \
    build-essential

# 验证安装
python3 --version  # 应该显示 Python 3.12.x
psql --version     # 应该显示 PostgreSQL 客户端版本
nginx -v           # 应该显示 Nginx 版本
```

---

## 方案一：Systemd + Uvicorn（推荐）

### 🌟 适用场景
- ✅ **标准生产环境部署**
- ✅ 需要系统级进程管理
- ✅ 要求开机自启动
- ✅ 需要完善的日志管理
- ✅ 单机部署，资源有限

### 📦 优点
- 系统原生支持，无需额外依赖
- 自动重启和故障恢复
- 完善的日志系统（journalctl）
- 资源占用低
- 便于监控和管理

### 📦 缺点
- 配置相对复杂
- 不支持容器化
- 依赖系统环境

---

### 🚀 部署步骤

#### 1. 创建应用目录和用户

```bash
# 创建应用目录
sudo mkdir -p /opt/qm-system
sudo mkdir -p /var/log/qm-backend
sudo mkdir -p /opt/qm-system/uploads

# 创建专用用户（推荐）
sudo useradd -r -s /bin/bash -d /opt/qm-system qmapp

# 复制代码到应用目录
sudo cp -r /path/to/your/qm-system/* /opt/qm-system/

# 设置目录权限
sudo chown -R qmapp:qmapp /opt/qm-system
sudo chown -R qmapp:qmapp /var/log/qm-backend
sudo chmod 755 /opt/qm-system
```

#### 2. 创建 Python 虚拟环境

```bash
# 切换到应用用户
sudo su - qmapp

# 进入后端目录
cd /opt/qm-system/backend

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 升级 pip
pip install --upgrade pip

# 安装依赖
pip install -r requirements.txt

# 验证安装
python -c "import fastapi; print(fastapi.__version__)"

# 退出应用用户
exit
```

#### 3. 创建环境配置文件

```bash
# 创建生产环境配置
sudo nano /opt/qm-system/backend/.env.production
```

内容示例：

```bash
# 应用环境
APP_ENV=production
REQUIRE_AUTH=true

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qm_system
DB_USER=qmadmin
DB_PASSWORD=your_secure_password_here

# JWT 密钥（请使用强密码）
SECRET_KEY=your_secret_key_here_please_change_it_to_random_string

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=/var/log/qm-backend/app.log

# CORS 配置（根据实际前端域名修改）
CORS_ORIGINS=["https://yourdomain.com"]

# 文件上传配置
UPLOAD_DIR=/opt/qm-system/uploads
MAX_UPLOAD_SIZE=52428800  # 50MB
```

#### 4. 创建 Systemd 服务文件

```bash
sudo nano /etc/systemd/system/qm-backend.service
```

服务配置：

```ini
[Unit]
Description=QM System Backend API Service
Documentation=https://github.com/your-org/qm-system
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=qmapp
Group=qmapp
WorkingDirectory=/opt/qm-system/backend

# 环境变量
Environment="PATH=/opt/qm-system/backend/venv/bin:/usr/local/bin:/usr/bin:/bin"
Environment="PYTHONUNBUFFERED=1"
Environment="PYTHONUTF8=1"
EnvironmentFile=/opt/qm-system/backend/.env.production

# 启动命令
ExecStart=/opt/qm-system/backend/venv/bin/uvicorn main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --log-level info \
  --access-log \
  --no-use-colors

# 重启策略
Restart=always
RestartSec=3
StartLimitBurst=5
StartLimitInterval=60

# 资源限制
LimitNOFILE=65535
LimitNPROC=4096

# 安全加固（可选）
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/qm-system/uploads /var/log/qm-backend

# 标准输出/错误日志
StandardOutput=journal
StandardError=journal
SyslogIdentifier=qm-backend

```

---

### ✅ 可选：使用 production.py + Hypercorn（单进程 / 4 进程）

本项目已内置 [backend/production.py](backend/production.py) 启动脚本，可通过 `--workers` 控制进程数。以下示例与已有服务文件风格一致（使用根目录虚拟环境 /opt/qm-system/.venv）。

#### A. 单进程（workers = 1）

```ini
[Unit]
Description=QM System Backend (Single Process)
After=network.target

[Service]
User=root
WorkingDirectory=/opt/qm-system/backend
EnvironmentFile=/opt/qm-system/.env.production
ExecStart=/opt/qm-system/.venv/bin/python /opt/qm-system/backend/production.py \
  --server hypercorn \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 1

StandardOutput=append:/data/logs/qm-system.out.log
StandardError=append:/data/logs/qm-system.err.log

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

#### B. 4 进程（workers = 4）

```ini
[Unit]
Description=QM System Backend (4 Workers)
After=network.target

[Service]
User=root
WorkingDirectory=/opt/qm-system/backend
EnvironmentFile=/opt/qm-system/.env.production
ExecStart=/opt/qm-system/.venv/bin/python /opt/qm-system/backend/production.py \
  --server hypercorn \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4

StandardOutput=append:/data/logs/qm-system.out.log
StandardError=append:/data/logs/qm-system.err.log

Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

#### 5. 启用并启动服务

```bash
# 重新加载 systemd 配置
sudo systemctl daemon-reload

# 启用开机自启动
sudo systemctl enable qm-backend

# 启动服务
sudo systemctl start qm-backend

# 查看服务状态
sudo systemctl status qm-backend

# 查看实时日志
sudo journalctl -u qm-backend -f

# 查看最近 100 行日志
sudo journalctl -u qm-backend -n 100 --no-pager
```

#### 6. 服务管理命令

```bash
# 启动服务
sudo systemctl start qm-backend

# 停止服务
sudo systemctl stop qm-backend

# 重启服务
sudo systemctl restart qm-backend

# 重新加载配置（不中断服务）
sudo systemctl reload qm-backend

# 查看服务状态
sudo systemctl status qm-backend

# 查看服务是否启用自启动
sudo systemctl is-enabled qm-backend

# 禁用自启动
sudo systemctl disable qm-backend

# 查看服务启动耗时
sudo systemd-analyze blame | grep qm-backend
```

---

## 方案二：Docker Compose（容器化）

### 🌟 适用场景
- ✅ **完整容器化部署**
- ✅ 需要环境隔离
- ✅ 开发/测试/生产环境一致性
- ✅ 微服务架构
- ✅ 需要快速部署和迁移

### 📦 优点
- 环境隔离，避免依赖冲突
- 易于迁移和扩展
- 统一管理前端、后端、数据库
- 支持版本控制
- 便于 CI/CD 集成

### 📦 缺点
- 资源开销相对较大
- 需要学习 Docker 知识
- 网络配置相对复杂

---

### 🚀 部署步骤

#### 1. 安装 Docker 和 Docker Compose

```bash
# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 安装 Docker Compose
sudo apt install docker-compose-plugin

# 验证安装
docker --version
docker compose version

# 添加当前用户到 docker 组（可选）
sudo usermod -aG docker $USER
# 需要重新登录才能生效
```

#### 2. 创建后端 Dockerfile

创建 `backend/Dockerfile`：

```dockerfile
# 使用官方 Python 3.12 镜像
FROM python:3.12-slim

# 设置作者信息
LABEL maintainer="your-email@example.com"
LABEL description="QM System Backend API"

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    gcc \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建上传目录
RUN mkdir -p /app/uploads && chmod 755 /app/uploads

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV PYTHONUTF8=1
ENV APP_ENV=production

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health', timeout=5)" || exit 1

# 启动命令
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

#### 3. 更新 docker-compose.yml

更新项目根目录的 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  # PostgreSQL 数据库
  database:
    image: postgres:16-alpine
    container_name: qm-database
    restart: unless-stopped
    environment:
      POSTGRES_DB: qm_system
      POSTGRES_USER: qmadmin
      POSTGRES_PASSWORD: ${DB_PASSWORD:-ChangeMeInProduction}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=zh_CN.UTF-8"
      TZ: Asia/Shanghai
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sh:/docker-entrypoint-initdb.d/init-db.sh
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U qmadmin -d qm_system"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - qm-network

  # 后端 API 服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: qm-backend
    restart: unless-stopped
    environment:
      # 应用配置
      APP_ENV: production
      REQUIRE_AUTH: "true"
      
      # 数据库配置
      DB_HOST: database
      DB_PORT: 5432
      DB_NAME: qm_system
      DB_USER: qmadmin
      DB_PASSWORD: ${DB_PASSWORD:-ChangeMeInProduction}
      
      # JWT 配置
      SECRET_KEY: ${SECRET_KEY:-ChangeThisSecretKeyInProduction}
      
      # 其他配置
      TZ: Asia/Shanghai
      LOG_LEVEL: INFO
    volumes:
      - ./uploads:/app/uploads
      - ./backend/logs:/app/logs
    ports:
      - "8000:8000"
    depends_on:
      database:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - qm-network

  # 前端应用
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: qm-frontend
    restart: unless-stopped
    environment:
      NODE_ENV: production
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - qm-network

# 数据卷
volumes:
  postgres_data:
    driver: local

# 网络
networks:
  qm-network:
    driver: bridge
```

#### 4. 创建环境变量文件

创建 `.env` 文件（在项目根目录）：

```bash
# 数据库密码
DB_PASSWORD=your_secure_db_password_here

# JWT 密钥
SECRET_KEY=your_very_long_and_random_secret_key_here

# 其他配置
TZ=Asia/Shanghai
```

⚠️ **安全提示**：确保 `.env` 文件已添加到 `.gitignore`

#### 5. 启动服务

```bash
# 首次启动（构建镜像）
docker compose up -d --build

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend

# 停止服务
docker compose down

# 停止并删除数据卷（谨慎使用！）
docker compose down -v
```

#### 6. 常用 Docker 命令

```bash
# 查看运行中的容器
docker ps

# 进入后端容器
docker exec -it qm-backend bash

# 查看后端日志
docker logs -f qm-backend

# 重启后端服务
docker restart qm-backend

# 查看容器资源占用
docker stats

# 清理未使用的资源
docker system prune -a

# 备份数据库
docker exec qm-database pg_dump -U qmadmin qm_system > backup.sql

# 恢复数据库
docker exec -i qm-database psql -U qmadmin qm_system < backup.sql
```

#### 7. 更新和维护

```bash
# 更新代码后重新构建
git pull
docker compose up -d --build

# 仅重启后端
docker compose restart backend

# 查看容器内文件
docker exec qm-backend ls -la /app

# 执行数据库迁移
docker exec qm-backend alembic upgrade head
```

---

## 方案三：Gunicorn + Uvicorn Workers（高并发）

### 🌟 适用场景
- ✅ **高并发生产环境**
- ✅ 需要负载均衡
- ✅ 多核 CPU 服务器
- ✅ 需要灵活的进程管理
- ✅ 需要优雅重启（零停机）

### 📦 优点
- 支持多进程，充分利用多核 CPU
- 成熟稳定，生产环境广泛使用
- 支持优雅重启（零停机部署）
- 灵活的配置选项
- 完善的工作进程管理

### 📦 缺点
- 配置相对复杂
- 内存占用较高（多进程）
- 需要额外安装 Gunicorn

---

### 🚀 部署步骤

#### 1. 安装 Gunicorn

```bash
# 激活虚拟环境
cd /opt/qm-system/backend
source venv/bin/activate

# 安装 Gunicorn
pip install gunicorn

# 验证安装
gunicorn --version
```

#### 2. 创建 Gunicorn 配置文件

创建 `backend/gunicorn_conf.py`：

```python
"""
Gunicorn 配置文件
适用于生产环境的 FastAPI 应用
"""
import multiprocessing
import os

# 服务器套接字
bind = "0.0.0.0:8000"
backlog = 2048

# Worker 进程
workers = multiprocessing.cpu_count() * 2 + 1  # 推荐公式：CPU核心数 * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 10000  # 每个 worker 处理多少请求后重启（防止内存泄漏）
max_requests_jitter = 1000  # 随机抖动，避免所有 worker 同时重启
timeout = 120  # Worker 超时时间（秒）
keepalive = 5  # Keep-Alive 连接超时时间（秒）

# 进程命名
proc_name = "qm-backend"

# 日志
loglevel = os.getenv("LOG_LEVEL", "info").lower()
accesslog = "/var/log/qm-backend/access.log"
errorlog = "/var/log/qm-backend/error.log"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# 进程管理
daemon = False  # 使用 Systemd 管理时设为 False
pidfile = "/var/run/qm-backend.pid"
umask = 0o027
user = None  # 由 Systemd 管理用户
group = None  # 由 Systemd 管理组

# 服务器机制
preload_app = True  # 预加载应用（提高性能，但热重载会重启所有 worker）
reload = False  # 生产环境禁用自动重载
reload_engine = "auto"

# SSL（如果需要）
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"

# Worker 钩子函数
def on_starting(server):
    """服务器启动时执行"""
    print(f"Gunicorn 服务器启动中...")
    print(f"Workers: {workers}")
    print(f"Bind: {bind}")

def on_reload(server):
    """服务器重载时执行"""
    print("Gunicorn 服务器重载中...")

def when_ready(server):
    """服务器就绪时执行"""
    print("Gunicorn 服务器已就绪，开始接受请求")

def pre_fork(server, worker):
    """Worker fork 前执行"""
    pass

def post_fork(server, worker):
    """Worker fork 后执行"""
    print(f"Worker {worker.pid} 已启动")

def pre_exec(server):
    """Gunicorn 重新执行前执行"""
    print("Gunicorn 准备重新执行...")

def worker_int(worker):
    """Worker 被信号中断时执行"""
    print(f"Worker {worker.pid} 收到中断信号")

def worker_abort(worker):
    """Worker 异常终止时执行"""
    print(f"Worker {worker.pid} 异常终止")

# 环境变量
raw_env = [
    f"APP_ENV=production",
    f"PYTHONUNBUFFERED=1",
    f"PYTHONUTF8=1",
]
```

#### 3. 创建优化的 Systemd 服务

```bash
sudo nano /etc/systemd/system/qm-backend.service
```

服务配置：

```ini
[Unit]
Description=QM System Backend API (Gunicorn + Uvicorn)
Documentation=https://github.com/your-org/qm-system
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=notify
User=qmapp
Group=qmapp
WorkingDirectory=/opt/qm-system/backend

# 环境变量
Environment="PATH=/opt/qm-system/backend/venv/bin:/usr/local/bin:/usr/bin:/bin"
Environment="PYTHONUNBUFFERED=1"
Environment="PYTHONUTF8=1"
EnvironmentFile=/opt/qm-system/backend/.env.production

# 启动命令
ExecStart=/opt/qm-system/backend/venv/bin/gunicorn main:app \
    --config /opt/qm-system/backend/gunicorn_conf.py

# 优雅重启（零停机）
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
KillSignal=SIGTERM
TimeoutStopSec=30

# 重启策略
Restart=always
RestartSec=3
StartLimitBurst=5
StartLimitInterval=60

# 资源限制
LimitNOFILE=65535
LimitNPROC=8192
LimitCORE=infinity

# 安全加固
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/qm-system/uploads /var/log/qm-backend /var/run

# 标准输出/错误日志
StandardOutput=journal
StandardError=journal
SyslogIdentifier=qm-backend

# Systemd 通知支持
NotifyAccess=all

[Install]
WantedBy=multi-user.target
```

#### 4. 启用服务

```bash
# 创建日志目录
sudo mkdir -p /var/log/qm-backend
sudo chown qmapp:qmapp /var/log/qm-backend

# 创建 PID 文件目录
sudo mkdir -p /var/run
sudo chown qmapp:qmapp /var/run

# 重新加载 systemd
sudo systemctl daemon-reload

# 启用并启动服务
sudo systemctl enable qm-backend
sudo systemctl start qm-backend

# 查看状态
sudo systemctl status qm-backend
```

#### 5. 零停机重启

```bash
# 优雅重启（不中断现有连接）
sudo systemctl reload qm-backend

# 或使用 kill 命令
sudo kill -HUP $(cat /var/run/qm-backend.pid)

# 查看进程
ps aux | grep gunicorn
```

#### 6. 性能监控

创建监控脚本 `backend/monitor.sh`：

```bash
#!/bin/bash
# Gunicorn 进程监控脚本

echo "=== QM Backend 进程监控 ==="
echo ""

# 主进程
echo "主进程："
ps aux | grep "gunicorn.*master" | grep -v grep

echo ""
echo "Worker 进程："
ps aux | grep "gunicorn.*worker" | grep -v grep

echo ""
echo "=== 端口监听 ==="
sudo netstat -tlnp | grep :8000

echo ""
echo "=== 内存占用 ==="
ps aux | grep gunicorn | grep -v grep | awk '{sum+=$6} END {print "总内存: " sum/1024 " MB"}'

echo ""
echo "=== 连接数 ==="
sudo netstat -an | grep :8000 | wc -l
```

```bash
# 添加执行权限
chmod +x backend/monitor.sh

# 运行监控
./backend/monitor.sh
```

---

## Nginx 反向代理配置

### 基础配置

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/qm-system
```

配置内容：

```nginx
# 后端 upstream（负载均衡）
upstream qm_backend {
    # 如果有多个后端实例，可以配置多个 server
    server 127.0.0.1:8000 max_fails=3 fail_timeout=30s;
    # server 127.0.0.1:8001 max_fails=3 fail_timeout=30s;
    
    # 保持连接
    keepalive 32;
}

# HTTP 服务器
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # 访问日志
    access_log /var/log/nginx/qm-access.log;
    error_log /var/log/nginx/qm-error.log;

    # 客户端请求大小限制
    client_max_body_size 50M;
    client_body_buffer_size 128k;

    # 超时设置
    proxy_connect_timeout 90;
    proxy_send_timeout 90;
    proxy_read_timeout 90;

    # 前端静态文件
    location / {
        root /opt/qm-system/dist;
        index index.html;
        try_files $uri $uri/ /index.html;

        # 静态文件缓存
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://qm_backend;
        
        # 代理头设置
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Request-ID $request_id;
        
        # HTTP 版本和连接
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        # 禁用缓存（API 请求）
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }

    # 文件上传接口（增加超时时间）
    location /api/upload {
        proxy_pass http://qm_backend;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # 上传专用超时设置
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        
        # 增大缓冲区
        client_body_buffer_size 512k;
    }

    # WebSocket 支持（如果需要）
    location /ws/ {
        proxy_pass http://qm_backend;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WebSocket 专用超时
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # 健康检查
    location /health {
        access_log off;
        proxy_pass http://qm_backend/health;
        proxy_set_header Host $host;
    }

    # 静态文件上传目录
    location /uploads/ {
        alias /opt/qm-system/uploads/;
        
        # 安全设置：禁止执行脚本
        location ~ \.(php|jsp|asp|sh|py|pl|cgi)$ {
            deny all;
        }
    }

    # 禁止访问敏感文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ \.(env|ini|conf|bak|sql|log)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}

# HTTPS 服务器（推荐生产环境使用）
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL 证书配置
    ssl_certificate /etc/nginx/ssl/yourdomain.com.crt;
    ssl_certificate_key /etc/nginx/ssl/yourdomain.com.key;

    # SSL 优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS（可选）
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 其他配置同上 HTTP 配置
    # ... (复制上面的 location 配置)
}

# HTTP 自动跳转 HTTPS（启用 HTTPS 后取消注释）
# server {
#     listen 80;
#     listen [::]:80;
#     server_name yourdomain.com www.yourdomain.com;
#     return 301 https://$server_name$request_uri;
# }
```

### 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/qm-system /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx

# 查看 Nginx 状态
sudo systemctl status nginx
```

### 配置 SSL 证书（Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 自动配置 SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 测试自动续期
sudo certbot renew --dry-run

# 查看证书信息
sudo certbot certificates
```

---

## 方案对比

| 特性 | Systemd + Uvicorn | Docker Compose | Gunicorn + Uvicorn |
|------|------------------|----------------|-------------------|
| **部署复杂度** | ⭐⭐ 中等 | ⭐⭐⭐ 较复杂 | ⭐⭐⭐ 复杂 |
| **资源占用** | ⭐⭐⭐⭐⭐ 最低 | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐ 较低 |
| **性能** | ⭐⭐⭐⭐ 高 | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 最高 |
| **可维护性** | ⭐⭐⭐⭐ 高 | ⭐⭐⭐⭐⭐ 最高 | ⭐⭐⭐ 中等 |
| **环境隔离** | ⭐⭐ 低 | ⭐⭐⭐⭐⭐ 最高 | ⭐⭐ 低 |
| **扩展性** | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐⭐ 最高 | ⭐⭐⭐⭐ 高 |
| **学习成本** | ⭐⭐ 低 | ⭐⭐⭐⭐ 高 | ⭐⭐⭐ 中等 |
| **生产成熟度** | ⭐⭐⭐⭐⭐ 成熟 | ⭐⭐⭐⭐ 成熟 | ⭐⭐⭐⭐⭐ 成熟 |
| **零停机部署** | ❌ 不支持 | ⭐⭐⭐ 需配置 | ⭐⭐⭐⭐⭐ 原生支持 |
| **多核利用** | ⭐⭐⭐ 手动配置 | ⭐⭐⭐⭐ 容器编排 | ⭐⭐⭐⭐⭐ 自动优化 |

### 推荐场景

| 场景 | 推荐方案 |
|------|---------|
| 小型单机部署 | 方案一：Systemd + Uvicorn |
| 标准生产环境 | 方案一 或 方案三 |
| 高并发场景（> 1000 QPS） | 方案三：Gunicorn + Uvicorn |
| 微服务架构 | 方案二：Docker Compose |
| 需要环境隔离 | 方案二：Docker Compose |
| 需要快速迁移 | 方案二：Docker Compose |
| 多环境部署（开发/测试/生产） | 方案二：Docker Compose |
| 资源受限环境 | 方案一：Systemd + Uvicorn |
| 需要零停机部署 | 方案三：Gunicorn + Uvicorn |

---

## 常见问题

### Q1: 如何查看后端服务日志？

**方案一（Systemd）：**
```bash
# 实时查看
sudo journalctl -u qm-backend -f

# 查看最近 100 行
sudo journalctl -u qm-backend -n 100

# 查看特定时间段
sudo journalctl -u qm-backend --since "2026-01-23 10:00:00" --until "2026-01-23 12:00:00"
```

**方案二（Docker）：**
```bash
# 实时查看
docker logs -f qm-backend

# 查看最近 100 行
docker logs --tail 100 qm-backend
```

**方案三（Gunicorn）：**
```bash
# 查看访问日志
tail -f /var/log/qm-backend/access.log

# 查看错误日志
tail -f /var/log/qm-backend/error.log
```

---

### Q2: 如何进行数据库迁移？

```bash
# 方案一和方案三
cd /opt/qm-system/backend
source venv/bin/activate
alembic upgrade head

# 方案二（Docker）
docker exec qm-backend alembic upgrade head
```

---

### Q3: 如何增加 Worker 数量？

**方案一（Systemd + Uvicorn）：**
```bash
# 编辑服务文件
sudo nano /etc/systemd/system/qm-backend.service

# 修改 --workers 参数
ExecStart=... --workers 8

# 重启服务
sudo systemctl daemon-reload
sudo systemctl restart qm-backend
```

**方案三（Gunicorn）：**
```bash
# 编辑配置文件
nano /opt/qm-system/backend/gunicorn_conf.py

# 修改 workers 参数
workers = 8

# 重启服务
sudo systemctl restart qm-backend
```

---

### Q4: 如何备份和恢复数据库？

```bash
# 备份
sudo -u postgres pg_dump qm_system > qm_system_backup_$(date +%Y%m%d).sql

# 或压缩备份
sudo -u postgres pg_dump qm_system | gzip > qm_system_backup_$(date +%Y%m%d).sql.gz

# 恢复
sudo -u postgres psql qm_system < qm_system_backup_20260123.sql

# 或从压缩文件恢复
gunzip < qm_system_backup_20260123.sql.gz | sudo -u postgres psql qm_system
```

---

### Q5: 如何监控服务器资源？

```bash
# 安装监控工具
sudo apt install htop iotop nethogs

# 查看系统资源
htop

# 查看磁盘 I/O
sudo iotop

# 查看网络流量
sudo nethogs

# 查看进程占用
ps aux | grep python

# 查看端口占用
sudo netstat -tlnp | grep 8000
```

---

### Q6: 如何配置日志轮转？

创建 `/etc/logrotate.d/qm-backend`：

```bash
/var/log/qm-backend/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 qmapp qmapp
    sharedscripts
    postrotate
        systemctl reload qm-backend > /dev/null 2>&1 || true
    endscript
}
```

---

### Q7: 如何配置防火墙？

```bash
# 使用 UFW（推荐）
sudo apt install ufw

# 允许 SSH
sudo ufw allow 22/tcp

# 允许 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 如果直接暴露后端端口（不推荐）
# sudo ufw allow 8000/tcp

# 启用防火墙
sudo ufw enable

# 查看状态
sudo ufw status
```

---

### Q8: 如何进行性能测试？

```bash
# 安装压测工具
sudo apt install apache2-utils

# 简单压测
ab -n 1000 -c 10 http://localhost:8000/health

# 使用 wrk（更强大）
git clone https://github.com/wg/wrk.git
cd wrk
make
sudo cp wrk /usr/local/bin/

# 压测
wrk -t4 -c100 -d30s http://localhost:8000/api/v1/health
```

---

### Q9: 如何配置开机自启动？

所有三种方案都已配置自启动：

```bash
# 检查自启动状态
sudo systemctl is-enabled qm-backend

# 启用自启动
sudo systemctl enable qm-backend

# 禁用自启动
sudo systemctl disable qm-backend
```

---

### Q10: 如何排查服务无法启动？

```bash
# 1. 查看服务状态
sudo systemctl status qm-backend

# 2. 查看详细日志
sudo journalctl -u qm-backend -xe

# 3. 检查配置文件
sudo nginx -t
python /opt/qm-system/backend/main.py  # 测试运行

# 4. 检查端口占用
sudo netstat -tlnp | grep 8000

# 5. 检查文件权限
ls -la /opt/qm-system/backend

# 6. 检查数据库连接
psql -h localhost -U qmadmin -d qm_system

# 7. 手动启动测试
cd /opt/qm-system/backend
source venv/bin/activate
python main.py
```

---

## 附录

### A. 完整部署检查清单

- [ ] 系统更新完成
- [ ] Python 3.12+ 已安装
- [ ] PostgreSQL 已配置并运行
- [ ] 虚拟环境已创建
- [ ] 依赖包已安装
- [ ] 环境变量已配置
- [ ] 数据库迁移已完成
- [ ] Systemd 服务已配置
- [ ] 服务已启动并运行正常
- [ ] Nginx 已配置
- [ ] SSL 证书已配置（生产环境）
- [ ] 防火墙已配置
- [ ] 日志轮转已配置
- [ ] 数据库备份计划已建立
- [ ] 监控告警已配置

### B. 安全加固建议

1. **修改默认密码**：确保所有默认密码已修改
2. **限制 SSH 访问**：禁用 root 登录，使用密钥认证
3. **配置防火墙**：只开放必要端口
4. **启用 HTTPS**：生产环境必须使用 HTTPS
5. **定期更新**：及时更新系统和依赖包
6. **配置日志审计**：记录所有关键操作
7. **数据库访问控制**：使用强密码，限制远程访问
8. **文件权限控制**：确保敏感文件权限正确
9. **配置 fail2ban**：防止暴力破解
10. **定期备份**：建立自动备份机制

### C. 性能优化建议

1. **数据库优化**：
   - 配置合适的连接池大小
   - 添加必要的索引
   - 定期 VACUUM 和 ANALYZE
   
2. **应用优化**：
   - 使用异步操作
   - 配置缓存（Redis）
   - 优化数据库查询
   
3. **系统优化**：
   - 调整文件描述符限制
   - 配置 TCP 优化参数
   - 使用 SSD 存储
   
4. **负载均衡**：
   - 配置多个后端实例
   - 使用 Nginx 负载均衡
   - 考虑使用 CDN

---

## 联系与支持

- **项目地址**：https://github.com/your-org/qm-system
- **文档地址**：https://docs.yourdomain.com
- **问题反馈**：https://github.com/your-org/qm-system/issues

---

**最后更新**：2026-01-23  
**版本**：v1.0.0  
**维护者**：清美教育技术团队
