# 生产环境部署指南 - Windows Server 2019

## 快速开始

### 1. 安装生产服务器
```bash
# 推荐：安装 Hypercorn（原生 ASGI 支持）
pip install hypercorn

# 或安装其他服务器
pip install uvicorn[standard]  # 性能优秀
pip install waitress asgiref   # 需要 asgiref 适配器
```

### 2. 启动服务
```bash
# 方法一：进入 backend 后使用 production.py（推荐）
cd backend
python production.py

# 方法二：使用批处理脚本
scripts\\deployment\\start-production.bat

# 方法三：使用 PowerShell 脚本
.\scripts\\deployment\\start-production.ps1
```

## 命令参数

```bash
python production.py --help

选项:
  --server {hypercorn,uvicorn,waitress}  服务器类型（默认: hypercorn）
  --host HOST                            绑定地址（默认: 0.0.0.0）
  --port PORT                            监听端口（默认: 8000）
  --workers WORKERS                      工作线程数（默认: 4）
```

## 示例

```bash
# 默认使用 Hypercorn
python production.py

# 使用 Hypercorn，自定义配置
python production.py --server hypercorn --port 8080 --workers 4

# 使用 Uvicorn
python production.py --server uvicorn --workers 2

# 使用 Waitress（通过 ASGI 适配器）
python production.py --server waitress --workers 8
```

## Windows 服务配置

使用 NSSM 将后端配置为 Windows 服务：

```bash
# 1. 下载 NSSM: https://nssm.cc/download

# 2. 安装服务
nssm install QMSystem "D:\qm-system\backend\venv\Scripts\python.exe" "D:\qm-system\backend\production.py"

# 3. 启动服务
nssm start QMSystem
```

详细文档请参考 [backend_PRODUCTION_DEPLOYMENT.md](backend_PRODUCTION_DEPLOYMENT.md)
