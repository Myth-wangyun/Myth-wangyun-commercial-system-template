# Windows 开发模式配置说明

## 更新内容

已更新 Vite 配置，在 Windows 开发模式下统一使用 `localhost:8000` 作为后端 API 代理目标。

## 配置变更

### vite.config.ts

代理配置现在会根据操作系统自动选择：

- **Windows (win32)**: 默认使用 `http://localhost:8000`
- **其他系统**: 使用 `http://172.16.0.130:8000`

配置优先级（从高到低）：
1. 环境变量 `VITE_PROXY_TARGET`
2. 环境变量 `VITE_API_BASE_URL`（自动去除 `/api/v1` 后缀）
3. 根据操作系统自动选择（Windows → localhost，其他 → 172.16.0.130）

## 使用方法

### 方法 1: 使用默认配置（推荐）

在 Windows 上直接运行，会自动使用 `localhost:8000`：

```powershell
npm run dev
```

### 方法 2: 使用环境变量

创建 `.env.development` 文件（在项目根目录）：

```env
VITE_PROXY_TARGET=http://localhost:8000
```

或者：

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 方法 3: 临时指定（命令行）

```powershell
# Windows PowerShell
$env:VITE_PROXY_TARGET="http://localhost:8000"; npm run dev

# 或使用 cross-env（如果已安装）
npx cross-env VITE_PROXY_TARGET=http://localhost:8000 npm run dev
```

## 验证配置

1. **启动后端服务**（确保在 localhost:8000 运行）：
   ```powershell
   cd backend
   python main.py --mode dev
   ```

2. **启动前端服务**：
   ```powershell
   npm run dev
   ```

3. **检查代理是否正常**：
   - 打开浏览器访问 `http://localhost:5173`
   - 打开开发者工具 Network 标签
   - 尝试登录或调用 API
   - 检查请求是否成功代理到 `http://localhost:8000`

## 常见问题

### Q: 仍然出现连接错误？

**A:** 确保后端服务正在运行：
```powershell
# 检查后端是否在运行
netstat -ano | findstr :8000

# 如果没有，启动后端
cd backend
python main.py --mode dev
```

### Q: 如何切换到其他后端地址？

**A:** 使用环境变量：
```powershell
$env:VITE_PROXY_TARGET="http://your-server:8000"
npm run dev
```

### Q: 如何在 Linux/Mac 上使用？

**A:** 配置会自动检测非 Windows 系统，使用 `172.16.0.130:8000`。如果需要修改，使用环境变量覆盖。

## 配置代码

```typescript
proxy: {
  '/api/v1': {
    // 优先使用环境变量，否则在 Windows 开发模式下使用 localhost
    target: process.env.VITE_PROXY_TARGET || 
            process.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 
            (process.platform === 'win32' ? 'http://localhost:8000' : 'http://172.16.0.130:8000'),
    changeOrigin: true,
    secure: false,
    rewrite: path => path.replace(/^\/api\/v1/, '/api/v1'),
  },
},
```

## 注意事项

1. **后端服务地址**: 确保后端服务配置为监听 `localhost:8000` 或 `127.0.0.1:8000`
2. **防火墙**: 确保本地防火墙允许 localhost 连接
3. **端口占用**: 确保 8000 端口没有被其他程序占用

---

*更新时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*

