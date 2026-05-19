# CORS 配置说明

## 当前配置

后端已经配置了 CORS，允许来自以下来源的请求：

### 明确允许的来源
- `http://localhost:5173` - 前端开发服务器（默认端口）
- `http://localhost:5174` - 前端开发服务器（备用端口）
- `http://127.0.0.1:5173` - 前端开发服务器（IP 形式）
- `http://localhost:8000` - 后端服务本身（Swagger 等）
- 其他开发/测试服务器地址

### 正则匹配
允许 `localhost`、`127.0.0.1` 等主机的任意端口：
```
http://(localhost|127\.0\.0\.1|172\.16\.0\.130|116\.255\.152\.27):\d+
```

## 如果遇到 CORS 错误

### 1. 检查后端服务是否已重启

CORS 配置在 `backend/main.py` 中，修改后需要重启后端服务：

```powershell
# 停止后端服务 (Ctrl+C)
# 重新启动
cd backend
python main.py --mode dev
```

### 2. 查看具体的 CORS 错误

在浏览器开发者工具的 Console 标签中查看错误信息，通常会显示：
- 被拒绝的 Origin
- 缺少的 CORS 头
- 具体的错误原因

### 3. 检查请求头

确保请求包含正确的 Origin 头：
- 前端页面地址：`http://localhost:5173`
- 请求目标：`http://localhost:8000/api/v1/auth/login`
- Origin 头应该是：`http://localhost:5173`

### 4. 临时放宽 CORS（仅开发环境）

如果仍有问题，可以临时允许所有来源（**仅用于开发环境**）：

```python
# 在 backend/main.py 中临时修改
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源（仅开发）
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**注意**：生产环境必须限制允许的来源！

## 验证 CORS 配置

### 方法 1: 使用 curl 测试

```powershell
# 测试 OPTIONS 预检请求
curl -X OPTIONS http://localhost:8000/api/v1/auth/login `
  -H "Origin: http://localhost:5173" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: content-type" `
  -v
```

应该看到响应头包含：
- `Access-Control-Allow-Origin: http://localhost:5173`
- `Access-Control-Allow-Methods: POST`
- `Access-Control-Allow-Headers: content-type`

### 方法 2: 查看后端启动日志

后端启动时会打印 CORS 配置：

```
🌐 CORS 已启用:
   Origins: ['http://localhost:5173', ...]
   Regex: http://(localhost|127\.0\.0\.1|...):\d+
```

## 常见 CORS 错误

### 错误 1: "Access to XMLHttpRequest has been blocked by CORS policy"

**原因**：Origin 不在允许列表中

**解决**：检查后端 CORS 配置是否包含前端地址

### 错误 2: "No 'Access-Control-Allow-Origin' header is present"

**原因**：后端没有返回 CORS 头

**解决**：确保后端 CORS 中间件已正确配置

### 错误 3: "Credentials flag is 'true', but 'Access-Control-Allow-Origin' is '*'"

**原因**：使用通配符 `*` 时不能同时使用 `allow_credentials=True`

**解决**：明确指定允许的来源，不要使用 `*`

## 当前配置状态

✅ 已配置允许 `http://localhost:5173`
✅ 已配置正则匹配 localhost 任意端口
✅ 已配置允许所有方法和请求头
✅ 已配置允许凭证（cookies 等）

---

*更新时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*

