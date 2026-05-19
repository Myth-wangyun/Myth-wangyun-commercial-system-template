# 前端生产环境部署指南

## 快速开始

### 方式一：自动化脚本（推荐）

```bash
# PowerShell
.\scripts\deployment\start-production-preview.ps1

# CMD
scripts\deployment\start-production-preview.bat
```

### 方式二：手动命令

```bash
# 1. 构建生产版本
npm run build:production

# 2. 预览生产构建
npm run preview:production

# 3. 或使用 Python 简单服务器
npm run serve
```

## 构建配置

### 环境变量（`.env.production`）

```env
VITE_API_BASE_URL=http://116.255.152.27:8000/api/v1
VITE_ENABLE_CAPTCHA=false
VITE_ENABLE_REACT_SCAN=false
VITE_ENABLE_STATS=false
```

### 特性说明

| 特性 | 开发环境 | 测试环境 | 生产环境 |
|-----|---------|---------|---------|
| 验证码 | ❌ | ✅ | ❌ |
| React Scan | ✅ | ❌ | ❌ |
| Stats.js 性能面板 | ✅ | ❌ | ❌ |
| 校区信息真实数据 | ✅ | ✅ | ✅ |

## 访问地址

- **前端**: http://116.255.152.27:5173/
- **后端 API**: http://116.255.152.27:8000/api/v1
- **API 文档**: http://116.255.152.27:8000/docs

## 构建产物

构建完成后，所有静态文件将输出到 `dist/` 目录：

```
dist/
├── index.html           # 入口 HTML
├── assets/
│   ├── *.js            # JavaScript 代码（已压缩）
│   ├── *.css           # 样式表（已压缩）
│   └── *.woff2         # 字体文件
└── favicon.ico         # 网站图标
```

## 部署到生产服务器

### 使用 Nginx（推荐）

```nginx
server {
    listen 5173;
    server_name 116.255.152.27;
    root /path/to/qm-system/dist;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理（可选，如果后端在同一台服务器）
    location /api/v1/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 使用 Python HTTP Server（简单预览）

```bash
# 方式一：使用 npm 脚本
npm run serve

# 方式二：直接使用 Python
python -m http.server 5173 --directory dist --bind 0.0.0.0
```

### 使用 IIS（Windows Server）

1. 安装 URL Rewrite 模块
2. 将 `dist/` 目录内容复制到 IIS 网站根目录
3. 添加 `web.config`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="SPA Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

## 性能优化

生产构建已包含以下优化：

- ✅ 代码分割（Code Splitting）
- ✅ 资源压缩（Minification）
- ✅ Tree Shaking（移除未使用代码）
- ✅ 静态资源哈希命名（缓存优化）
- ✅ CSS 提取与压缩
- ❌ 禁用开发工具（React Scan、Stats.js）

## 验证部署

访问 http://116.255.152.27:5173/ 检查：

1. ✅ 页面正常加载
2. ✅ 登录功能正常（无验证码）
3. ✅ 校区信息页显示真实数据（教职工数、专业课程数、校区总数）
4. ✅ 控制台无错误
5. ✅ 网络请求指向正确的后端 API

## 故障排查

### 页面空白

- 检查浏览器控制台是否有错误
- 确认 `dist/index.html` 存在
- 检查 Nginx/IIS 配置中的 `root` 路径

### API 请求失败

- 确认后端服务运行在 http://116.255.152.27:8000
- 检查 `.env.production` 中 `VITE_API_BASE_URL` 配置
- 检查浏览器控制台 Network 面板

### 路由 404 错误

- 确保服务器配置了 SPA 路由重写规则
- 检查 `vite.config.ts` 中 `base` 配置

## 回滚策略

```bash
# 备份当前构建
cp -r dist dist.backup.$(date +%Y%m%d_%H%M%S)

# 如需回滚
cp -r dist.backup.20241209_143000 dist
```

## 监控建议

生产环境应监控：

- 前端页面加载时间
- API 响应时间
- 错误率（通过前端错误日志）
- 用户访问量

可集成工具：
- Google Analytics
- Sentry（错误追踪）
- 自定义日志上报
