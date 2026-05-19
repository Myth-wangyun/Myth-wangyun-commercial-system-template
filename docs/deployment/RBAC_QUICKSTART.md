# 权限系统快速开始

## 一、部署步骤（按顺序执行）

### 1. 初始化到最新数据库结构（默认：无需 Alembic）

项目当前策略是：后端启动时会自动创建所需 schema/table/index/view（`IF NOT EXISTS`），因此首次部署通常不需要手动跑 `alembic`。

- 数据库/用户/权限创建流程请看：`docs/DB_SETUP.md`
- 启动后端完成结构初始化：

```powershell
.\scripts\deployment\start-backend-env.ps1 -Mode prod -BindHost 0.0.0.0 -Port 8000
```

> 如果你仍希望使用 Alembic 迁移：可以执行 `alembic upgrade head`，但它不是启动到“最新可运行结构”的硬前置。

### 2. 初始化权限数据
```bash
cd backend
python init_permissions.py
```

### 3. 验证结果
检查数据库中的表：
- `roles` - 应该有8个角色
- `permissions` - 应该有14个权限
- `role_permissions` - 应该有若干角色权限关联
- `user_roles` - admin用户应该有董事长角色

## 二、已实现的功能

### ✅ 企业文化相关权限
- **企业文化宣讲计划表**：只有董事长和学术总监能访问
- **企业文化考试计划表**：只有董事长和学术总监能访问

### ✅ 角色配置
- **董事长**：所有部门的所有权限
- **学术总监**：学术部所有权限
- **教质总监**：教质部所有权限
- **咨询总监**：咨询部所有权限
- **市场总监**：市场部所有权限
- **人资总监**：人资部所有权限

## 三、如何为用户分配角色

### 方法1：通过数据库（临时方案）
```sql
-- 1. 查看所有角色
SELECT role_id, code, name FROM roles;

-- 2. 查看用户
SELECT user_id, username, real_name FROM users;

-- 3. 为用户分配角色
INSERT INTO user_roles (user_id, role_id) 
VALUES (用户ID, 角色ID);

-- 示例：为用户1分配学术总监角色（假设角色ID为2）
INSERT INTO user_roles (user_id, role_id) VALUES (1, 2);
```

### 方法2：通过后端脚本
修改 `init_permissions.py` 中的 `assign_user_roles()` 函数

## 四、权限代码说明

### 企业文化相关
- `academic.enterprise_culture.presentation.view` - 查看宣讲计划
- `academic.enterprise_culture.presentation.edit` - 编辑宣讲计划
- `academic.enterprise_culture.presentation.delete` - 删除宣讲计划
- `academic.enterprise_culture.exam.view` - 查看考试计划
- `academic.enterprise_culture.exam.edit` - 编辑考试计划
- `academic.enterprise_culture.exam.delete` - 删除考试计划

### 通配符权限
- `academic.*` - 学术部所有权限
- `management.*` - 管理中心所有权限
- `teaching_quality.*` - 教质部所有权限
- `consulting.*` - 咨询部所有权限
- `marketing.*` - 市场部所有权限
- `hr.*` - 人资部所有权限

## 五、测试权限

> 注意：如果你在开发/测试环境设置了 `REQUIRE_AUTH=false`（免登录测试所有 API），系统会返回合成的 dev 超级用户，RBAC 校验将全部通过。
> 如需验证 403/权限效果，请在测试时把 `REQUIRE_AUTH=true`。

### 测试后端API
```bash
# 1. 以普通用户登录
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"普通用户","password":"密码"}'

# 2. 尝试访问企业文化宣讲计划（应该返回403）
curl -X GET http://localhost:8000/api/v1/culture-presentation/校区/2024/1 \
  -H "Authorization: Bearer {token}"

# 3. 以董事长或学术总监登录
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"密码"}'

# 4. 再次访问（应该返回200）
curl -X GET http://localhost:8000/api/v1/culture-presentation/校区/2024/1 \
  -H "Authorization: Bearer {token}"
```

### 测试前端路由
1. 以普通用户登录前端
2. 尝试访问：`http://localhost:5173/academic/campus/06-enterprise-culture/1-culture-presentation-plan`
3. 应该被重定向到403页面或隐藏菜单项

4. 以董事长或学术总监登录
5. 应该可以正常访问该页面

## 六、扩展权限系统

### 为新表格添加权限

1. **定义权限**（在 `init_permissions.py`）
```python
{
    "code": "academic.new_resource.view",
    "name": "查看新资源",
    "module": "academic",
    "resource": "new_resource",
    "action": "view",
    "is_system": True,
}
```

2. **后端API添加保护**
```python
@router.get(
    "/new-resource",
    dependencies=[Depends(require_permission("academic.new_resource.view"))]
)
async def get_new_resource(...):
    ...
```

3. **前端路由添加权限**
```typescript
{
  path: '/new-resource',
  meta: {
    requiresAuth: true,
    permission: 'academic.new_resource.view'
  }
}
```

4. **重新初始化权限**
```bash
python init_permissions.py
```

## 七、常见问题

### Q1: 为什么我分配了角色但还是没权限？
A: 检查：
1. 角色是否正确分配（查询 `user_roles` 表）
2. 角色是否配置了对应权限（查询 `role_permissions` 表）
3. 权限代码是否匹配（后端API、前端路由、权限数据要一致）

### Q2: 如何让某个用户拥有所有权限？
A: 两种方式：
1. 设置 `users.is_superuser = true`
2. 为用户分配董事长角色

### Q3: 通配符权限如何工作？
A: 权限系统支持层级匹配：
- `academic.*` 可以匹配 `academic.enterprise_culture.presentation.view`
- `academic.enterprise_culture.*` 可以匹配 `academic.enterprise_culture.presentation.view` 和 `academic.enterprise_culture.exam.view`

## 八、下一步

1. ✅ 权限系统基础框架已完成
2. 🔲 为其他表格/页面添加权限保护
3. 🔲 实现员工管理界面的角色分配功能
4. 🔲 实现配置中心的权限管理界面
5. 🔲 添加权限审计日志
