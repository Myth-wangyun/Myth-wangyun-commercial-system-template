# 调试 ERR_EMPTY_RESPONSE 错误

## 问题描述

前端请求 `http://localhost:8000/api/v1/auth/login` 时出现 `ERR_EMPTY_RESPONSE` 错误，表示后端服务器在处理请求时崩溃或没有返回响应。

## 可能的原因

1. **后端服务崩溃**：处理请求时发生未捕获的异常
2. **数据库连接失败**：无法连接到 PostgreSQL 数据库
3. **代码错误**：登录端点代码中有 bug
4. **依赖缺失**：缺少必要的 Python 包

## 调试步骤

### 1. 检查后端服务是否正在运行

```powershell
# 检查端口 8000 是否被占用
netstat -ano | findstr :8000

# 检查 Python 进程
Get-Process | Where-Object { $_.ProcessName -like "*python*" }
```

### 2. 查看后端日志

在后端服务运行的终端窗口中，查看是否有错误信息：

```powershell
cd backend
python main.py --mode dev
```

注意查看：
- 启动时的错误信息
- 请求处理时的错误信息
- 数据库连接错误

### 3. 测试后端 API 是否正常

使用 curl 或浏览器直接测试：

```powershell
# 测试健康检查
curl http://localhost:8000/health

# 测试登录端点（使用 form-data）
curl -X POST http://localhost:8000/api/v1/auth/login `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "username=admin&password=admin123&grant_type=password"
```

### 4. 检查数据库连接

```powershell
# 检查 PostgreSQL 服务是否运行
Get-Service -Name postgresql*

# 或检查端口
netstat -ano | findstr :5432
```

### 5. 检查后端代码

查看 `backend/app/api/v1/endpoints/auth.py` 中的登录端点，确保：
- 数据库会话正确获取
- 异常被正确捕获
- 返回格式正确

## 常见问题和解决方案

### 问题 1: 数据库连接失败

**症状**：后端启动时显示数据库连接错误

**解决**：
1. 确保 PostgreSQL 服务正在运行
2. 检查 `backend/.env` 或环境变量中的数据库配置
3. 测试数据库连接：
   ```python
   python -c "from app.core.database import engine; engine.connect()"
   ```

### 问题 2: 缺少依赖

**症状**：导入错误

**解决**：
```powershell
cd backend
pip install -r requirements.txt
```

### 问题 3: 代码异常未捕获

**症状**：后端日志显示异常但请求没有返回

**解决**：检查全局异常处理器是否正常工作

## 快速诊断命令

```powershell
# 1. 检查后端服务
netstat -ano | findstr :8000

# 2. 检查数据库服务
netstat -ano | findstr :5432

# 3. 测试后端 API
curl http://localhost:8000/health

# 4. 查看后端日志（在运行后端的终端中）
```

## 建议的修复步骤

1. **重启后端服务**：
   ```powershell
   # 停止当前服务 (Ctrl+C)
   cd backend
   python main.py --mode dev
   ```

2. **查看完整的错误日志**：
   - 在后端终端中查看所有输出
   - 查找 Python 异常堆栈跟踪
   - 查找数据库连接错误

3. **简化测试**：
   - 先测试 `/health` 端点
   - 再测试 `/docs` 端点（Swagger UI）
   - 最后测试 `/api/v1/auth/login`

4. **检查环境变量**：
   - 确保数据库配置正确
   - 确保所有必要的环境变量已设置

---

*更新时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*

