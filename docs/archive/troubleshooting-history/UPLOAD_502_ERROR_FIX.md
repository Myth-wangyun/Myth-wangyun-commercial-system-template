# 上传接口 502 错误修复指南

## 问题诊断

**502 Bad Gateway** 错误表示代理服务器（IIS/Nginx）无法从上游 FastAPI 应用获得有效响应。

### 可能的原因：

1. **IIS/Nginx 上传大小限制过小**（默认可能只有1-4MB）
2. **超时时间过短**（大文件上传需要更长时间）
3. **FastAPI 应用崩溃或内存溢出**
4. **异常未正确捕获导致应用崩溃**

---

## 已实施的修复

### 1. 后端代码优化

#### ✅ 添加详细日志记录
- 记录上传过程的每个步骤
- 记录文件大小、类型、错误信息
- 便于诊断问题

#### ✅ 优化异常处理
- 捕获所有可能的异常
- 返回友好的错误信息
- 清理失败的文件，避免磁盘空间浪费

#### ✅ 优化图片验证
- 设置 PIL 的最大像素限制（防止 DecompressionBomb 攻击）
- 正确释放图片资源，避免内存泄漏

#### ✅ 使用配置中的上传大小限制
- 从硬编码的 5MB 改为使用配置文件的 `MAX_UPLOAD_SIZE`（默认10MB）

**文件位置：** `backend/app/teaching-quality/TQstudent_movement_application_api.py`

---

### 2. Nginx 配置修复

**文件位置：** `nginx.conf`

#### ✅ 增加上传大小限制
```nginx
# 客户端上传大小限制（默认1MB，设置为50MB）
client_max_body_size 50M;
```

#### ✅ 增加超时时间
```nginx
proxy_connect_timeout 300s;
proxy_send_timeout 300s;
proxy_read_timeout 300s;
```

#### ✅ 关闭代理缓冲（大文件上传）
```nginx
proxy_request_buffering off;
proxy_buffering off;
```

---

### 3. IIS 配置修复

**文件位置：** `web.config`（需要放在 IIS 网站根目录）

#### ✅ 增加上传大小限制
```xml
<requestLimits maxAllowedContentLength="52428800" />  <!-- 50MB -->
<httpRuntime maxRequestLength="51200" executionTimeout="300" />
```

#### ✅ 增加超时时间
```xml
<requestTimeout>00:05:00</requestTimeout>
```

---

## 部署步骤

### 对于 Nginx 部署：

1. **更新 nginx.conf**
   ```bash
   # 复制新配置到服务器
   scp nginx.conf user@server:/etc/nginx/nginx.conf
   
   # 测试配置
   nginx -t
   
   # 重新加载配置
   nginx -s reload
   # 或
   systemctl reload nginx
   ```

2. **重启后端服务**
   ```bash
   # 重启 FastAPI 应用
   systemctl restart your-fastapi-service
   ```

---

### 对于 IIS 部署：

1. **部署 web.config**
   - 将 `web.config` 复制到 IIS 网站根目录（通常是 `C:\inetpub\wwwroot\your-site\`）
   - 如果已有 `web.config`，需要合并配置

2. **确保 IIS 模块已安装**
   - **URL Rewrite 模块**：用于 API 反代
   - **ARR (Application Request Routing)**：用于反向代理
   - 安装后，在 IIS 管理器中启用 Proxy

3. **重启 IIS 站点**
   ```powershell
   # 在 IIS 管理器中重启站点
   # 或使用 PowerShell
   Restart-WebAppPool -Name "YourAppPoolName"
   Restart-WebSite -Name "YourSiteName"
   ```

4. **重启后端服务**
   ```powershell
   # 如果使用 Windows Service
   Restart-Service YourFastAPIService
   ```

---

## 验证修复

### 1. 检查后端日志

上传文件后，查看后端日志：

```bash
# 查看日志（根据你的日志配置）
tail -f logs/app.log

# 或查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
```

**成功的日志应该显示：**
```
[上传] 开始处理上传请求 - 文件名: xxx.png, 类型: image/png, 校区: xxx
[上传] 文件读取完成 - 大小: 1234567 字节 (1.18MB)
[上传] 图片尺寸: 1920x1080
[上传] 文件保存成功: /path/to/file.png
[上传] 上传成功 - URL: /api/v1/...
```

**如果出现错误，日志会显示详细信息：**
```
[上传] 上传失败 - 文件名: xxx.png, 错误: xxx
```

### 2. 测试上传

使用 curl 或浏览器测试上传：

```bash
# 测试上传（替换为实际的URL和文件路径）
curl -X POST "http://your-domain/api/v1/teaching-quality/student-movement-application/upload" \
  -F "file=@test.png" \
  -F "campus=测试校区" \
  -F "student_name=张三" \
  -F "id_card=110101200001011234"
```

**预期响应：**
```json
{
  "success": true,
  "message": "文件上传成功",
  "file_path": "student-movement-application/ceshixiaoqu/zhangsan110101200001011234.png",
  "file_url": "/api/v1/teaching-quality/student-movement-application/file/student-movement-application/ceshixiaoqu/zhangsan110101200001011234.png",
  "file_size": 1234567,
  "image_dimensions": {"width": 1920, "height": 1080}
}
```

---

## 常见问题排查

### 问题1：仍然返回 502

**可能原因：**
- IIS/Nginx 配置未生效（需要重启）
- FastAPI 应用未启动或崩溃
- 防火墙阻止了连接

**排查步骤：**
1. 检查 FastAPI 应用是否运行：
   ```bash
   # Linux
   ps aux | grep uvicorn
   netstat -tlnp | grep 8000
   
   # Windows
   netstat -ano | findstr 8000
   ```

2. 检查日志：
   ```bash
   # 后端日志
   tail -f logs/app.log
   
   # Nginx 错误日志
   tail -f /var/log/nginx/error.log
   
   # IIS 日志
   # 位置：C:\inetpub\logs\LogFiles\W3SVC{site-id}\
   ```

3. 直接访问后端接口（绕过代理）：
   ```bash
   curl http://116.255.152.27:8000/api/v1/teaching-quality/student-movement-application/files
   ```

---

### 问题2：上传小文件成功，大文件失败

**可能原因：**
- IIS/Nginx 上传大小限制未正确设置
- 配置文件未生效

**排查步骤：**
1. **Nginx：**
   ```bash
   # 检查配置是否生效
   nginx -T | grep client_max_body_size
   
   # 应该显示：client_max_body_size 50M;
   ```

2. **IIS：**
   ```powershell
   # 检查配置
   Get-WebConfigurationProperty -PSPath "MACHINE/WEBROOT/APPHOST/YourSite" -Filter "system.webServer/security/requestFiltering/requestLimits" -Name "maxAllowedContentLength"
   
   # 应该显示：52428800 (50MB)
   ```

---

### 问题3：上传超时

**可能原因：**
- 超时时间设置过短
- 网络速度慢
- 服务器处理慢

**解决方案：**
1. 增加超时时间（已在配置中设置为 300 秒）
2. 检查服务器资源使用情况（CPU、内存、磁盘）
3. 优化图片处理逻辑（如果需要）

---

### 问题4：内存溢出

**可能原因：**
- 图片太大
- PIL 处理时内存占用过高
- 服务器内存不足

**已实施的优化：**
- 设置 PIL 最大像素限制
- 及时释放图片资源
- 增加错误处理，避免崩溃

**如果仍然有问题：**
1. 降低 `MAX_UPLOAD_SIZE` 配置（例如改为 5MB）
2. 在上传前压缩图片（前端处理）
3. 增加服务器内存

---

## 配置参考

### 文件大小限制对照表

| 配置项 | 默认值 | 修复后值 | 说明 |
|--------|--------|----------|------|
| FastAPI (`MAX_UPLOAD_SIZE`) | 10485760 (10MB) | 10485760 (10MB) | 代码中的限制 |
| Nginx (`client_max_body_size`) | 1MB | 50MB | 代理服务器限制 |
| IIS (`maxAllowedContentLength`) | 30000000 (约30MB) | 52428800 (50MB) | IIS 限制 |
| IIS (`maxRequestLength`) | 4096 (4MB) | 51200 (50MB) | ASP.NET 限制 |

**建议：** 将所有限制设置为相同或更大的值，避免不一致导致的问题。

---

## 监控建议

1. **日志监控**
   - 监控上传失败的日志
   - 设置告警，当错误率过高时通知

2. **资源监控**
   - 监控服务器内存使用
   - 监控磁盘空间（上传文件占用）

3. **性能监控**
   - 监控上传接口的响应时间
   - 监控文件大小分布

---

## 联系支持

如果问题仍然存在，请提供以下信息：

1. **错误信息**：完整的错误响应（502 HTML 或 JSON）
2. **日志信息**：后端日志、Nginx/IIS 错误日志
3. **文件信息**：尝试上传的文件大小、类型
4. **环境信息**：服务器操作系统、部署方式（IIS/Nginx）、FastAPI 运行方式

---

## 更新日志

- **2024-01-XX**: 初始修复
  - 添加详细日志记录
  - 优化异常处理
  - 修复 Nginx/IIS 配置
  - 优化图片处理
