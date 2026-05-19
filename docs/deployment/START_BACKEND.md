# 启动后端服务指南

## 问题诊断

从错误日志可以看到：
```
Sending Request to the Target: POST /api/v1/auth/login
proxy error Error: socket hang up
```

这说明：
- ✅ Vite 代理配置正确（请求被转发）
- ❌ 后端服务未运行（无法连接到 localhost:8000）

## 解决方案

### 步骤 1: 启动后端服务

推荐直接在项目根目录执行统一入口：

```powershell
python main.py --mode dev
```

该入口会自动转发到 `backend/main.py`，这是当前项目的标准 Python 启动方式。

启动链路回归检查：

```powershell
python backend/scripts/checks/system/check_root_python_main_entry.py
python backend/scripts/checks/db/check_humanresources_employee_storage.py
```

在**新的终端窗口**中运行：

```powershell
# 如果你仍希望直接运行后端入口，也可以：
cd backend
python main.py --mode dev
```

### 步骤 2: 验证后端服务

启动后应该看到类似输出：

```
🚀 启动清美教育管理系统...
系统运行在http://0.0.0.0:8000/
📌 数据库: qmjy
📌 API 文档: http://0.0.0.0:8000/docs
✅ 数据库已就绪
```

### 步骤 3: 测试后端 API

在浏览器中访问：
- API 文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/health

### 开发环境免登录（方便 curl/AI 测试）

后端现在支持 **development/test 环境默认不要求登录**，你可以直接请求任意 API（包括需要权限的接口）。

控制方式：
- 默认行为（推荐）：`APP_ENV=development` 或 `APP_ENV=test` 时，如果未显式设置 `REQUIRE_AUTH`，则自动 `REQUIRE_AUTH=false`
- 强制关闭认证：设置 `DEV_NO_AUTH=true`（仅对 development/test 生效）
- 在开发环境强制开启认证：设置 `REQUIRE_AUTH=true`

示例（创建 `qm-system/.env.development`，然后用 `python main.py --mode dev` 启动）：
```env
APP_ENV=development
REQUIRE_AUTH=false
```

curl 测试示例（本地后端）：
```bash
curl 'http://127.0.0.1:8000/api/v1/campus-core-data-summary?campus=%E5%B9%BF%E8%A5%BF%E6%A1%82%E7%BE%8E%E6%A0%A1%E5%8C%BA&year=2026'
```

### 步骤 4: 重新测试前端

后端服务运行后，前端应该能正常连接。

## 常见问题

### Q: 端口 8000 已被占用？

**A:** 检查并释放端口：

```powershell
# 查找占用 8000 端口的进程
netstat -ano | findstr :8000

# 结束进程（替换 PID 为实际进程 ID）
taskkill /PID <PID> /F
```

### Q: 数据库连接失败？

**A:** 确保 PostgreSQL 服务正在运行：

```powershell
# Windows 服务
Get-Service -Name postgresql*

# 或检查端口
netstat -ano | findstr :5432
```

### Q: 模块导入错误？

**A:** 确保安装了所有依赖：

```powershell
cd backend
pip install -r requirements.txt
```

## 快速启动脚本

创建 `scripts/deployment/start-backend.ps1`：

```powershell
# scripts/deployment/start-backend.ps1
cd backend
python main.py --mode dev
```

然后运行：
```powershell
.\scripts\deployment\start-backend.ps1
```

## 同时运行前后端

### 方法 1: 使用两个终端窗口

**终端 1 - 后端**：
```powershell
python main.py --mode dev
```

**终端 2 - 前端**：
```powershell
npm run dev
```

### 方法 2: 使用 PowerShell 后台任务

```powershell
# 启动后端（后台）
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python main.py --mode dev"

# 启动前端
npm run dev
```

---

*更新时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*
