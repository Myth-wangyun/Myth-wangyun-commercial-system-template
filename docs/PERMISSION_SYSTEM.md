# 清美教育管理系统 - 权限系统文档

## 目录
- [权限系统概述](#权限系统概述)
- [角色定义](#角色定义)
- [权限矩阵](#权限矩阵)
- [数据库用户权限](#数据库用户权限)
- [API 权限控制](#api-权限控制)
- [前端路由权限](#前端路由权限)
- [最佳实践](#最佳实践)

---

## 权限系统概述

清美教育管理系统采用 **基于角色的访问控制（RBAC）** 模型，通过角色和权限的组合实现细粒度的访问控制。

### 核心概念
- **用户（User）**: 系统使用者，可以是管理员、教师、员工等
- **角色（Role）**: 用户的身份标识，决定用户可以访问哪些功能
- **权限（Permission）**: 对特定资源的操作权限（增删改查）
- **校区（Campus）**: 多租户隔离，用户只能访问所属校区的数据

### 权限层级
```
系统级权限（System Level）
  ├── 超级管理员（Super Admin）- 全系统访问
  │
校区级权限（Campus Level）
  ├── 校区管理员（Campus Admin）- 单校区全部功能
  ├── 部门管理员（Department Manager）- 单部门全部功能
  │
功能级权限（Feature Level）
  ├── 教师（Teacher）- 教学相关功能
  ├── 员工（Staff）- 业务相关功能
  ├── 查看者（Viewer）- 只读权限
```

---

## 角色定义

### 1. 超级管理员（Super Admin）
**角色代码**: `super_admin`

**权限范围**:
- ✅ 访问所有校区数据
- ✅ 管理用户和角色
- ✅ 修改系统配置
- ✅ 查看审计日志
- ✅ 执行数据库备份和恢复
- ✅ 访问所有 API 端点

**适用人员**: 系统技术管理员、总部 IT 负责人

**数据库用户**: `postgres`（超级用户）

---

### 2. 校区管理员（Campus Admin）
**角色代码**: `campus_admin`

**权限范围**:
- ✅ 访问所属校区的所有数据
- ✅ 管理校区内的用户
- ✅ 管理校区内的所有业务数据
- ✅ 导出校区报表
- ❌ 无法访问其他校区数据
- ❌ 无法修改系统配置

**适用人员**: 校区校长、校区主任

**数据库用户**: `qm_app_user`（应用用户）

---

### 3. 部门管理员（Department Manager）
**角色代码**: `department_manager`

**权限范围**:
- ✅ 访问所属部门的所有数据
- ✅ 管理部门内的员工
- ✅ 管理部门业务数据
- ✅ 导出部门报表
- ❌ 无法访问其他部门数据
- ❌ 无法管理用户角色

**适用人员**: 教学部主任、市场部主任、人力资源部主任

**数据库用户**: `qm_app_user`（应用用户）

---

### 4. 教师（Teacher）
**角色代码**: `teacher`

**权限范围**:
- ✅ 查看和编辑自己的课程数据
- ✅ 查看和编辑自己的学生数据
- ✅ 提交教学质量数据
- ✅ 查看教学报表
- ❌ 无法访问其他教师的数据
- ❌ 无法管理用户

**适用人员**: 任课教师、班主任

**数据库用户**: `qm_app_user`（应用用户）

---

### 5. 员工（Staff）
**角色代码**: `staff`

**权限范围**:
- ✅ 查看和编辑自己负责的业务数据
- ✅ 提交工作报表
- ✅ 查看部门公告
- ❌ 无法访问其他员工的数据
- ❌ 无法管理用户

**适用人员**: 市场专员、招生专员、行政人员

**数据库用户**: `qm_app_user`（应用用户）

---

### 6. 查看者（Viewer）
**角色代码**: `viewer`

**权限范围**:
- ✅ 查看所属校区/部门的数据
- ✅ 导出报表
- ❌ 无法编辑任何数据
- ❌ 无法管理用户

**适用人员**: 财务人员、审计人员、数据分析师

**数据库用户**: `qm_readonly_user`（只读用户）

---

## 权限矩阵

### 用户管理权限

| 功能 | Super Admin | Campus Admin | Dept Manager | Teacher | Staff | Viewer |
|------|-------------|--------------|--------------|---------|-------|--------|
| 创建用户 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 编辑用户 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 删除用户 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 分配角色 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 重置密码 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 查看用户列表 | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

### 教学管理权限

| 功能 | Super Admin | Campus Admin | Dept Manager | Teacher | Staff | Viewer |
|------|-------------|--------------|--------------|---------|-------|--------|
| 管理课程 | ✅ | ✅ | ✅ | ✅ (自己) | ❌ | ❌ |
| 管理学生 | ✅ | ✅ | ✅ | ✅ (自己) | ❌ | ❌ |
| 录入成绩 | ✅ | ✅ | ✅ | ✅ (自己) | ❌ | ❌ |
| 查看成绩 | ✅ | ✅ | ✅ | ✅ (自己) | ❌ | ✅ |
| 导出报表 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

### 教学质量管理权限

| 功能 | Super Admin | Campus Admin | Dept Manager | Teacher | Staff | Viewer |
|------|-------------|--------------|--------------|---------|-------|--------|
| 提交质量数据 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 审核质量数据 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 查看质量报表 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| 导出质量数据 | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

### 学生就业管理权限

| 功能 | Super Admin | Campus Admin | Dept Manager | Teacher | Staff | Viewer |
|------|-------------|--------------|--------------|---------|-------|--------|
| 录入就业信息 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 编辑就业信息 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 删除就业信息 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 查看就业统计 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 导出就业报表 | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

### 市场管理权限

| 功能 | Super Admin | Campus Admin | Dept Manager | Teacher | Staff | Viewer |
|------|-------------|--------------|--------------|---------|-------|--------|
| 录入市场数据 | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| 编辑市场数据 | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| 删除市场数据 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 查看市场报表 | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| 导出市场数据 | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

### 系统管理权限

| 功能 | Super Admin | Campus Admin | Dept Manager | Teacher | Staff | Viewer |
|------|-------------|--------------|--------------|---------|-------|--------|
| 修改系统配置 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 查看审计日志 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| 数据库备份 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 访问 API 文档 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 数据库用户权限

### 1. postgres（超级用户）
**用途**: 数据库管理、迁移、初始化

**权限**:
- ✅ 所有数据库操作权限
- ✅ 创建/删除数据库
- ✅ 创建/删除用户
- ✅ 修改表结构

**使用场景**:
- 执行 Alembic 迁移
- 创建新的数据库用户
- 数据库初始化

**安全建议**:
- ⚠️ 仅在开发环境和数据库维护时使用
- ⚠️ 生产环境应用不应使用此用户
- ⚠️ 密码必须强度高且定期更换

---

### 2. qm_app_user（应用用户）
**用途**: 应用程序运行时使用

**权限**:
- ✅ 读写所有业务表
- ✅ 执行存储过程
- ✅ 创建临时表
- ❌ 无法修改表结构
- ❌ 无法创建/删除数据库

**使用场景**:
- 生产环境后端应用
- 测试环境后端应用

**创建脚本**:
```sql
-- 创建应用用户
CREATE USER qm_app_user WITH PASSWORD 'your_secure_password_here';

-- 授予数据库连接权限
GRANT CONNECT ON DATABASE qmjy TO qm_app_user;

-- 授予 schema 权限
GRANT ALL ON SCHEMA public TO qm_app_user;
GRANT ALL ON SCHEMA academic TO qm_app_user;
GRANT ALL ON SCHEMA teaching_quality TO qm_app_user;

-- 授予表权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO qm_app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA academic TO qm_app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA teaching_quality TO qm_app_user;

-- 授予序列权限
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO qm_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA academic TO qm_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA teaching_quality TO qm_app_user;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO qm_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA academic GRANT ALL ON TABLES TO qm_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA teaching_quality GRANT ALL ON TABLES TO qm_app_user;
```

---

### 3. qm_readonly_user（只读用户）
**用途**: 报表查询、数据分析

**权限**:
- ✅ 读取所有业务表
- ❌ 无法修改任何数据
- ❌ 无法创建表
- ❌ 无法执行存储过程

**使用场景**:
- BI 工具连接
- 数据分析师查询
- 第三方报表系统

**创建脚本**:
```sql
-- 创建只读用户
CREATE USER qm_readonly_user WITH PASSWORD 'readonly_password_here';

-- 授予连接权限
GRANT CONNECT ON DATABASE qmjy TO qm_readonly_user;

-- 授予 schema 使用权限
GRANT USAGE ON SCHEMA public TO qm_readonly_user;
GRANT USAGE ON SCHEMA academic TO qm_readonly_user;
GRANT USAGE ON SCHEMA teaching_quality TO qm_readonly_user;

-- 授予只读权限
GRANT SELECT ON ALL TABLES IN SCHEMA public TO qm_readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA academic TO qm_readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA teaching_quality TO qm_readonly_user;

-- 设置默认只读权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO qm_readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA academic GRANT SELECT ON TABLES TO qm_readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA teaching_quality GRANT SELECT ON TABLES TO qm_readonly_user;
```

---

### 4. qm_backup_user（备份用户）
**用途**: 数据库备份

**权限**:
- ✅ 读取所有数据
- ✅ 执行 pg_dump
- ❌ 无法修改数据

**使用场景**:
- 自动备份脚本
- 手动备份操作

**创建脚本**:
```sql
-- 创建备份用户
CREATE USER qm_backup_user WITH PASSWORD 'backup_password_here';

-- 授予备份权限
GRANT CONNECT ON DATABASE qmjy TO qm_backup_user;
ALTER USER qm_backup_user WITH REPLICATION;

-- 授予只读权限
GRANT USAGE ON SCHEMA public TO qm_backup_user;
GRANT USAGE ON SCHEMA academic TO qm_backup_user;
GRANT USAGE ON SCHEMA teaching_quality TO qm_backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO qm_backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA academic TO qm_backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA teaching_quality TO qm_backup_user;
```

---

## API 权限控制

### 认证机制
系统使用 **JWT（JSON Web Token）** 进行身份认证：

1. 用户登录 → 后端验证用户名密码
2. 验证成功 → 生成 JWT Token（包含用户 ID、角色、校区等信息）
3. 前端存储 Token → HttpOnly Cookie（防止 XSS 攻击）
4. 后续请求 → 自动携带 Token
5. 后端验证 Token → 提取用户信息 → 检查权限

### 权限装饰器
后端使用依赖注入实现权限控制：

```python
from app.core.auth import get_current_active_user, require_role

# 需要登录
@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_active_user)):
    return {"message": "You are authenticated"}

# 需要特定角色
@router.post("/admin-only")
async def admin_only_route(current_user: User = Depends(require_role(["super_admin", "campus_admin"]))):
    return {"message": "Admin access granted"}
```

### 公开 API（无需认证）
以下 API 端点无需认证：
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新 Token
- `GET /api/v1/health` - 健康检查
- `GET /docs` - API 文档（开发环境）

### 受保护 API（需要认证）
所有其他 API 端点均需要有效的 JWT Token。

---

## 前端路由权限

### 路由配置
前端路由在 `frontend/config/router/routes.ts` 中定义，每个路由包含权限元数据：

```typescript
{
  path: '/admin/users',
  title: '用户管理',
  auth: true,  // 需要登录
  roles: ['super_admin', 'campus_admin'],  // 允许的角色
  type: 'standalone'
}
```

### 权限检查流程
1. 用户访问路由 → 检查 `auth` 字段
2. 如果 `auth: true` → 检查用户是否登录
3. 如果未登录 → 重定向到登录页
4. 如果已登录 → 检查 `roles` 字段
5. 如果用户角色不在 `roles` 列表 → 显示 403 页面
6. 如果权限匹配 → 渲染页面

### 菜单显示控制
前端菜单根据用户角色动态显示：

```typescript
// 只有管理员能看到用户管理菜单
const menuItems = routes.filter(route => {
  if (!route.roles) return true;
  return route.roles.includes(currentUser.role);
});
```

---

## 最佳实践

### 1. 最小权限原则
- 用户只应拥有完成工作所需的最小权限
- 避免给普通用户分配管理员角色
- 定期审查用户权限，移除不必要的权限

### 2. 职责分离
- 开发环境和生产环境使用不同的数据库用户
- 应用用户不应拥有修改表结构的权限
- 备份用户只应拥有只读权限

### 3. 密码安全
- 使用强密码（至少 12 位，包含大小写字母、数字、特号）
- 定期更换密码（建议每 90 天）
- 不要在代码中硬编码密码
- 使用环境变量存储敏感信息

### 4. Token 安全
- JWT Token 存储在 HttpOnly Cookie 中（防止 XSS）
- Token 设置合理的过期时间（建议 8 小时）
- 使用 Refresh Token 实现自动续期
- 生产环境必须使用强密钥签名 Token

### 5. 审计日志
- 记录所有敏感操作（登录、修改权限、删除数据）
- 日志包含：用户 ID、操作时间、IP 地址、操作内容
- 定期审查审计日志，发现异常行为

### 6. 数据隔离
- 使用校区代码实现多租户隔离
- 用户只能访问所属校区的数据
- 后端 API 自动注入校区过滤条件

### 7. 前后端双重验证
- 前端路由权限控制（提升用户体验）
- 后端 API 权限验证（保证安全性）
- 永远不要只依赖前端权限控制

---

## 权限问题排查

### 1. 用户无法登录
**可能原因**:
- 用户名或密码错误
- 用户账号被禁用
- 数据库连接失败

**排查步骤**:
```bash
# 检查用户是否存在
psql -U postgres -d qmjy -c "SELECT * FROM users WHERE username='用户名';"

# 检查用户是否被禁用
psql -U postgres -d qmjy -c "SELECT is_active FROM users WHERE username='用户名';"

# 查看后端日志
tail -f logs/app.log
```

### 2. 用户无法访问某个功能
**可能原因**:
- 用户角色权限不足
- 前端路由配置错误
- 后端 API 权限验证失败

**排查步骤**:
```bash
# 检查用户角色
psql -U postgres -d qmjy -c "SELECT role FROM users WHERE username='用户名';"

# 检查前端路由配置
cat frontend/config/router/routes.ts | grep "path"

# 查看后端 API 日志
tail -f logs/app.log | grep "403"
```

### 3. 数据库连接失败
**可能原因**:
- 数据库用户密码错误
- 数据库用户权限不足
- 连接池耗尽

**排查步骤**:
```bash
# 测试数据库连接
psql -U qm_app_user -h localhost -d qmjy

# 检查连接池状态
psql -U postgres -d qmjy -c "SELECT * FROM pg_stat_activity;"

# 检查用户权限
psql -U postgres -d qmjy -c "\du qm_app_user"
```

---

## 附录：完整数据库用户创建脚本

```sql
-- ==================== 1. 创建应用用户 ====================
CREATE USER qm_app_user WITH PASSWORD 'your_secure_password_here';

-- 授予数据库连接权限
GRANT CONNECT ON DATABASE qmjy TO qm_app_user;

-- 授予 schema 权限
GRANT ALL ON SCHEMA public TO qm_app_user;
GRANT ALL ON SCHEMA academic TO qm_app_user;
GRANT ALL ON SCHEMA teaching_quality TO qm_app_user;

-- 授予表权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO qm_app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA academic TO qm_app_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA teaching_quality TO qm_app_user;

-- 授予序列权限
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO qm_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA academic TO qm_app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA teaching_quality TO qm_app_user;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO qm_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA academic GRANT ALL ON TABLES TO qm_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA teaching_quality GRANT ALL ON TABLES TO qm_app_user;

-- ==================== 2. 创建只读用户 ====================
CREATE USER qm_readonly_user WITH PASSWORD 'readonly_password_here';

-- 授予连接权限
GRANT CONNECT ON DATABASE qmjy TO qm_readonly_user;

-- 授予 schema 使用权限
GRANT USAGE ON SCHEMA public TO qm_readonly_user;
GRANT USAGE ON SCHEMA academic TO qm_readonly_user;
GRANT USAGE ON SCHEMA teaching_quality TO qm_readonly_user;

-- 授予只读权限
GRANT SELECT ON ALL TABLES IN SCHEMA public TO qm_readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA academic TO qm_readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA teaching_quality TO qm_readonly_user;

-- 设置默认只读权限
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO qm_readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA academic GRANT SELECT ON TABLES TO qm_readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA teaching_quality GRANT SELECT ON TABLES TO qm_readonly_user;

-- ==================== 3. 创建备份用户 ====================
CREATE USER qm_backup_user WITH PASSWORD 'backup_password_here';

-- 授予备份权限
GRANT CONNECT ON DATABASE qmjy TO qm_backup_user;
ALTER USER qm_backup_user WITH REPLICATION;

-- 授予只读权限
GRANT USAGE ON SCHEMA public TO qm_backup_user;
GRANT USAGE ON SCHEMA academic TO qm_backup_user;
GRANT USAGE ON SCHEMA teaching_quality TO qm_backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO qm_backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA academic TO qm_backup_user;
GRANT SELECT ON ALL TABLES IN SCHEMA teaching_quality TO qm_backup_user;

-- ==================== 4. 验证权限 ====================
-- 查看所有用户
\du

-- 查看用户权限
\dp

-- 测试连接
-- psql -U qm_app_user -h localhost -d qmjy
-- psql -U qm_readonly_user -h localhost -d qmjy
-- psql -U qm_backup_user -h localhost -d qmjy
```

---

## 更新日志

- **2026-01-15**: 初始版本，定义基础权限系统
- **待更新**: 根据实际使用情况调整权限配置

---

如有权限相关问题，请联系系统管理员。
