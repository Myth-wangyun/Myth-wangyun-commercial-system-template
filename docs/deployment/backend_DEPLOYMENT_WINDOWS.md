# Windows Server 2019 部署指南

## 快速启动

### 方式 1: 使用 Python 脚本（推荐）

```bash
# 单进程模式（推荐用于 Windows）
cd backend
python scripts/deployment/test.py --host 0.0.0.0 --port 8000

# 查看帮助
python scripts/deployment/test.py --help
```

### 方式 2: 使用批处理脚本

```cmd
# 使用默认端口 8000
cd backend && scripts\deployment\start-server.bat

# 使用自定义端口
cd backend && scripts\deployment\start-server.bat 8080
```

### 方式 3: 使用 PowerShell 脚本

```powershell
# 默认配置
cd backend
.\scripts\deployment\start-server.ps1

# 自定义端口
.\scripts\deployment\start-server.ps1 -Port 8080

# 完整参数
.\scripts\deployment\start-server.ps1 -Port 8000 -Workers 1 -LogLevel info
```

## 部署地址

- 主服务: http://116.255.152.27:8000/
- API 文档: http://116.255.152.27:8000/docs
- 交互式文档: http://116.255.152.27:8000/redoc

## 参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `--host` | 监听地址 | `0.0.0.0` |
| `--port` | 监听端口 | `8000` |
| `--workers` | 工作进程数 | `1` |
| `--log-level` | 日志级别 | `info` |
| `--reload` | 热重载（开发模式） | 禁用 |

## 为什么不使用多进程？

在 Windows Server 上使用多进程可能遇到以下问题：

1. **进程间通信问题**: Windows 的多进程机制与 Unix/Linux 不同
2. **稳定性问题**: uvicorn 在 Windows 上的多进程支持不如 Linux 稳定
3. **资源开销**: Windows 进程创建开销较大

### 推荐方案

**生产环境建议使用以下任一方案：**

#### 方案 1: 单进程 + Nginx 反向代理（推荐）

```nginx
# nginx.conf
upstream backend {
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    server 127.0.0.1:8003;
    server 127.0.0.1:8004;
}

server {
    listen 8000;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

启动多个单进程实例：
```bash
# 终端1
python scripts/deployment/test.py --port 8001

# 终端2
python scripts/deployment/test.py --port 8002

# 终端3
python scripts/deployment/test.py --port 8003

# 终端4
python scripts/deployment/test.py --port 8004
```

#### 方案 2: 使用 Windows 服务

使用 NSSM (Non-Sucking Service Manager) 将 Python 应用注册为 Windows 服务：

```cmd
# 安装 NSSM
# 下载: https://nssm.cc/download

# 安装服务
nssm install QMBackend "C:\Python\python.exe" "C:\path\to\backend\scripts\deployment\test.py --host 0.0.0.0 --port 8000"

# 启动服务
nssm start QMBackend

# 停止服务
nssm stop QMBackend

# 删除服务
nssm remove QMBackend confirm
```

#### 方案 3: 使用 IIS + ASGI

通过 IIS 的 HttpPlatformHandler 运行 Python 应用。

## 环境要求

- Python 3.8+
- Windows Server 2019
- 已安装依赖: `pip install -r requirements.txt`

## 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
netstat -ano | findstr :8000

# 结束进程
taskkill /PID <进程ID> /F
```

### 2. 防火墙问题

```powershell
# 允许端口 8000
New-NetFirewallRule -DisplayName "QM Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

### 3. 权限问题

确保以管理员身份运行或给予足够权限。

## 性能优化建议

1. **单进程模式**: 对于小型应用，单进程足够使用
2. **异步处理**: FastAPI 已使用异步，无需额外优化
3. **数据库连接池**: 已在代码中配置
4. **静态资源**: 使用 Nginx 托管前端静态文件

## 监控和日志

日志位置: 控制台输出

建议使用 Windows Event Viewer 或第三方日志管理工具。

## 停止服务

按 `Ctrl + C` 停止运行中的服务。

## 自动重启

使用 Windows 任务计划程序设置开机自启：

1. 打开任务计划程序
2. 创建基本任务
3. 触发器: 系统启动时
4. 操作: 启动程序 `python.exe`
5. 参数: `scripts/deployment/test.py --host 0.0.0.0 --port 8000`
6. 起始于: `backend` 目录路径

## 技术支持

如有问题，请查看日志输出或联系技术支持。
