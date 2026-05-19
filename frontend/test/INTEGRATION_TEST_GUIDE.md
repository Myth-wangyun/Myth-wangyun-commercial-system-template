# 集成测试运行指南

## 问题诊断

### 当前错误：`AxiosError: Network Error`

这个错误说明：
- ✅ DOM 环境已配置正确（jsdom）
- ✅ 测试正在尝试发送真实的 HTTP 请求
- ❌ 后端服务可能没有运行，或者 API 地址配置不正确

## 运行前检查清单

### 1. 确保后端服务正在运行

```bash
# 检查后端服务是否在运行
curl http://localhost:8000/api/v1/health
# 或者检查后端进程
ps aux | grep uvicorn
```

### 2. 检查 API 基础地址

集成测试会使用环境变量 `VITE_API_BASE_URL`，如果没有设置，默认使用 `/api/v1`。

```bash
# 设置 API 地址（如果需要）
export VITE_API_BASE_URL=http://localhost:8000/api/v1
npm run test:integration
```

### 3. 检查认证 Token

如果后端需要认证，确保：
- 有有效的认证 token
- Token 已正确配置在 `authStore` 中

## 运行集成测试

### 方式1：使用默认配置

```bash
# 确保后端服务在 http://localhost:8000 运行
npm run test:integration
```

### 方式2：指定 API 地址

```bash
# 使用环境变量指定 API 地址
VITE_API_BASE_URL=http://localhost:8000/api/v1 npm run test:integration
```

### 方式3：使用不同的后端地址

```bash
# 如果后端在其他地址
VITE_API_BASE_URL=http://192.168.1.100:8000/api/v1 npm run test:integration
```

## 测试数据清理

集成测试会在测试结束后自动清理数据（`afterAll` 钩子），但如果测试中断，可能需要手动清理：

```sql
-- 清理测试数据（示例）
DELETE FROM class_exam_scores WHERE student_name LIKE '测试%';
DELETE FROM project_grade_registers WHERE student_name LIKE '测试%';
DELETE FROM press_interview_scores WHERE student_name LIKE '测试%';
```

## 常见问题

### Q: Network Error 怎么办？

**A:** 检查以下几点：
1. 后端服务是否运行：`curl http://localhost:8000/api/v1/health`
2. API 地址是否正确：检查 `VITE_API_BASE_URL` 环境变量
3. 网络连接是否正常：检查防火墙和网络设置

### Q: 401 Unauthorized 怎么办？

**A:** 需要配置认证 token：
1. 登录系统获取 token
2. 在测试中设置 token（可能需要修改测试文件）

### Q: 测试数据没有清理？

**A:** 如果测试中断，`afterAll` 可能没有执行：
1. 手动运行清理脚本
2. 或者手动删除测试数据

## 验证测试是否真正写入数据库

运行测试后，可以查询数据库验证：

```sql
-- 查询测试数据
SELECT * FROM class_exam_scores WHERE student_name LIKE '测试%';
SELECT * FROM project_grade_registers WHERE student_name LIKE '测试%';
SELECT * FROM press_interview_scores WHERE student_name LIKE '测试%';
```

## 与单元测试的区别

| 特性 | 单元测试 | 集成测试 |
|------|---------|---------|
| **Mock** | ✅ 使用 mock | ❌ 不使用 mock |
| **HTTP 请求** | ❌ 不发送 | ✅ 发送真实请求 |
| **数据库** | ❌ 不写数据库 | ✅ 写真实数据库 |
| **后端服务** | ❌ 不需要 | ✅ 必须运行 |
| **速度** | ⚡ 快 | 🐌 慢 |

