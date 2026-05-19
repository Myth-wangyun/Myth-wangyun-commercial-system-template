# Nginx 部署文档（前端静态资源 + 后端 API 反代）

本文档用于在服务器环境使用 Nginx 部署前端构建产物，并将前端 API 请求反代到后端服务，确保前后端联通。

## 1. 前端构建

在项目根目录构建前端：

```bash
# 若服务器不需要 puppeteer
PUPPETEER_SKIP_DOWNLOAD=1 npm install
npm run build
```

构建完成后，产物位于：

```
/opt/qm-system/dist
```

## 2. Nginx 配置

已在项目根目录提供示例配置文件：

- [nginx.conf](../nginx.conf)

关键点：
- 静态资源根目录：`/opt/qm-system/dist`
- API 反代：`/api/` -> `http://127.0.0.1:8000`
- SPA 路由支持：`try_files $uri $uri/ /index.html`

如需修改：
- `server_name` 改为实际域名或 IP
- `upstream qm_backend` 改为后端实际地址（如容器内服务名）

## 3. 后端启动

确保后端服务已启动并监听 `127.0.0.1:8000`（或与 nginx 配置一致的地址端口）。

## 4. 启用 Nginx

将配置写入 Nginx（示例路径，可按实际环境修改）：

```bash
sudo cp /opt/qm-system/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 5. 验证

- 访问前端：`http://<域名或IP>/`
- 测试 API：`http://<域名或IP>/api/v1/health`（或后端实际健康检查路径）

## 6. 常见问题

1. **前端请求 404**：检查 Nginx `root` 是否指向真实 `dist` 目录。
2. **API 502/504**：确认后端服务是否已启动，端口是否一致。
3. **跨域问题**：生产环境默认使用 `/api/v1` 相对路径，不需要额外 CORS 配置；若使用不同域名，请在后端开启 CORS。

## 7. 生产建议

- 建议启用 HTTPS 并配置证书。
- 配合 Nginx 日志进行监控和排障。
- 后端可使用 systemd 或容器保证常驻运行。
