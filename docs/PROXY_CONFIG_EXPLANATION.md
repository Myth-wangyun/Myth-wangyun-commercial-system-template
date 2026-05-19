# Vite 代理配置说明

## 工作原理

### 为什么请求显示在 5173 端口？

这是**正常行为**！工作流程如下：

1. **前端代码**：使用相对路径 `/api/v1/auth/login`
2. **浏览器**：将相对路径解析为当前页面的完整 URL
   - 当前页面：`http://localhost:5173`
   - 请求 URL：`http://localhost:5173/api/v1/auth/login`
3. **Vite 代理**：拦截匹配 `/api/v1` 的请求
4. **转发请求**：将请求转发到配置的 target（`http://localhost:8000`）
5. **最终请求**：实际到达 `http://localhost:8000/api/v1/auth/login`

### 流程图

```
浏览器请求
  ↓
http://localhost:5173/api/v1/auth/login
  ↓
Vite 开发服务器 (端口 5173)
  ↓
代理拦截 (/api/v1 匹配)
  ↓
转发到 target
  ↓
http://localhost:8000/api/v1/auth/login
  ↓
后端 FastAPI 服务 (端口 8000)
```

## 配置说明

### vite.config.ts

```typescript
proxy: {
  '/api/v1': {
    target: 'http://localhost:8000',  // 后端服务地址
    changeOrigin: true,                 // 改变请求的 origin
    secure: false,                      // 如果是 https，设置为 false
  },
}
```

### 关键配置项

- **`/api/v1`**: 匹配所有以 `/api/v1` 开头的请求
- **`target`**: 后端服务的实际地址
- **`changeOrigin: true`**: 改变请求的 origin，避免 CORS 问题
- **`secure: false`**: 如果是 HTTPS，设置为 false

## 调试代理

### 检查代理是否工作

1. **查看 Vite 控制台**：
   - 启动 Vite 后，查看控制台是否有代理日志
   - 如果配置了 `configure`，会看到请求和响应日志

2. **检查网络请求**：
   - 打开浏览器开发者工具
   - 查看 Network 标签
   - 请求 URL 应该显示为 `http://localhost:5173/api/v1/...`
   - 但实际请求会被转发到 `http://localhost:8000/api/v1/...`

3. **检查后端日志**：
   - 查看后端服务的日志
   - 应该能看到来自代理的请求

### 常见问题

#### Q: 为什么看到 500 错误？

**A:** 500 错误说明：
- ✅ 代理工作正常（请求被转发了）
- ❌ 后端服务有问题

**解决方法**：
1. 检查后端服务是否运行：`netstat -ano | findstr :8000`
2. 检查后端日志，查看具体错误
3. 确保后端服务监听在 `localhost:8000` 或 `127.0.0.1:8000`

#### Q: 为什么看到 404 错误？

**A:** 可能的原因：
1. 后端路由不存在
2. 代理配置的路径不匹配
3. 后端服务未运行

#### Q: 为什么看到连接被拒绝？

**A:** 后端服务未运行或端口不对：
1. 启动后端服务：`cd backend && python main.py --mode dev`
2. 检查端口是否正确：默认应该是 8000

## 验证步骤

1. **启动后端服务**：
   ```powershell
   cd backend
   python main.py --mode dev
   ```
   应该看到：`系统运行在http://0.0.0.0:8000/`

2. **启动前端服务**：
   ```powershell
   npm run dev
   ```
   应该看到：`VITE v7.2.6  ready in XXX ms`

3. **测试代理**：
   - 打开浏览器：`http://localhost:5173`
   - 打开开发者工具 Network 标签
   - 尝试登录或调用 API
   - 检查请求是否成功

4. **检查后端日志**：
   - 查看后端控制台
   - 应该能看到来自前端的请求日志

## 环境变量配置

### 开发环境

创建 `.env.development` 文件（可选）：

```env
VITE_PROXY_TARGET=http://localhost:8000
```

### 生产环境

生产环境不需要代理，直接配置 API 地址：

```env
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
```

---

*更新时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*

