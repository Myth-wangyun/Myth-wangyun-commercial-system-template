# RBAC权限系统实施指南

本文档详细说明了QM-SYSTEM项目的权限访问控制（RBAC）系统的实施方案。

## 一、系统架构

权限系统采用三层架构：
1. **后端层**：权限规则与校验（核心安全层）
2. **前端层**：路由/页面/按钮级控制（表现层）
3. **数据层**：角色 × 权限配置（配置数据）

## 二、数据库设计

### 2.1 核心表结构

创建了4个核心表：

1. **roles** - 角色表
   - 存储角色信息（董事长、学术总监等）
   - 支持系统内置角色和自定义角色

2. **permissions** - 权限表
   - 存储权限代码和说明
   - 采用分层命名：`module.resource.action`
   - 示例：`academic.enterprise_culture.presentation.view`

3. **role_permissions** - 角色权限关联表
   - 定义每个角色拥有哪些权限

4. **user_roles** - 用户角色关联表
   - 定义每个用户拥有哪些角色

### 2.2 数据库迁移

迁移文件位置：
```
migrations/versions/20260102_create_rbac_tables.py
```

执行方式（两种二选一）：

1) 默认推荐（无需 Alembic）：启动后端自动创建/对齐结构（`IF NOT EXISTS`）

2) 可选（使用 Alembic）：
```bash
cd backend
alembic upgrade head
```

数据库/用户/权限初始化的完整流程建议统一参考：`docs/DB_SETUP.md`

## 三、后端实现

### 3.1 核心文件

1. **数据模型**
   - `app/models/role.py` - 角色模型
   - `app/models/permission.py` - 权限模型
   - `app/models/role_permission.py` - 角色权限关联
   - `app/models/user_role.py` - 用户角色关联

2. **权限核心逻辑**
   - `app/core/permissions.py` - 权限管理器
     - `get_user_permissions()` - 获取用户权限
     - `check_permission()` - 检查权限
     - 支持通配符匹配（如 `academic.*`）

3. **权限依赖注入**
   - `app/core/dependencies.py` - FastAPI依赖函数
     - `require_permission()` - 单权限检查
     - `require_any_permission()` - 多权限任一检查
     - `require_all_permissions()` - 多权限全部检查
     - `require_role()` - 角色检查

### 3.2 API权限保护示例

```python
from app.core.dependencies import require_permission

@router.get(
    "/culture-presentation/{campus}/{year}/{month}",
    dependencies=[Depends(require_permission("academic.enterprise_culture.presentation.view"))]
)
async def get_presentation_plan(...):
    ...
```

### 3.3 已保护的API

- 企业文化宣讲计划表 (`culture_presentation.py`)
  - 查看：`academic.enterprise_culture.presentation.view`
  - 编辑：`academic.enterprise_culture.presentation.edit`
  - 删除：`academic.enterprise_culture.presentation.delete`

- 企业文化考试计划表 (`culture_exam.py`)
  - 查看：`academic.enterprise_culture.exam.view`
  - 编辑：`academic.enterprise_culture.exam.edit`
  - 删除：`academic.enterprise_culture.exam.delete`

## 四、前端实现

### 4.1 核心文件

1. **权限工具函数** - `frontend/utils/permission.ts`
   - `hasPermission()` - 检查单个权限
   - `hasAnyPermission()` - 检查任一权限
   - `hasAllPermissions()` - 检查所有权限
   - `hasRole()` - 检查角色
   - `PermissionCodes` - 权限代码常量
   - `RoleCodes` - 角色代码常量

2. **路由守卫** - `frontend/utils/routeGuard.ts`
   - `checkRoutePermission()` - 检查路由权限
   - `createRouteGuard()` - 创建路由守卫函数

3. **路由配置** - `frontend/config/router/routes.ts`
   - 添加了 `permission` 和 `roles` 字段到路由元信息

### 4.2 路由权限配置示例

```typescript
{
  key: 'academic-campus-06-enterprise-culture-1-culture-presentation-plan',
  path: '/academic/campus/06-enterprise-culture/1-culture-presentation-plan',
  type: 'standalone',
  meta: { 
    title: '企业文化宣讲计划表', 
    requiresAuth: true,
    permission: 'academic.enterprise_culture.presentation.view'
  },
}
```

### 4.3 组件中使用权限

```tsx
import { hasPermission, PermissionCodes } from '@/utils/permission'

function MyComponent() {
  const userPermissions = useUserPermissions() // 从状态管理获取
  
  return (
    <>
      {hasPermission(userPermissions, PermissionCodes.ACADEMIC.ENTERPRISE_CULTURE.PRESENTATION.VIEW) && (
        <Button>查看</Button>
      )}
      
      {hasPermission(userPermissions, PermissionCodes.ACADEMIC.ENTERPRISE_CULTURE.PRESENTATION.EDIT) && (
        <Button>编辑</Button>
      )}
    </>
  )
}
```

## 五、权限命名规范

### 5.1 权限代码格式

```
{module}.{resource}.{action}
```

- **module**: 模块名（academic, management, teaching_quality等）
- **resource**: 资源类型（enterprise_culture, meeting_record等）
- **action**: 操作（view, edit, delete, export等）

### 5.2 通配符权限

- `academic.*` - 学术部所有权限
- `management.*` - 管理中心所有权限
- `*` - 超级用户权限（所有权限）

## 六、初始化权限数据

### 6.1 运行初始化脚本

```bash
cd backend
python init_permissions.py
```

### 6.2 脚本功能

1. 创建默认权限（企业文化相关权限）
2. 创建默认角色（董事长、学术总监等）
3. 分配角色权限：
   - 董事长：所有部门权限
   - 学术总监：学术部所有权限
   - 教质总监：教质部所有权限
   - 等等...
4. 为admin用户分配董事长角色

## 七、业务规则实现

### 7.1 当前实现的规则

✅ **企业文化宣讲计划表和考试计划表**
- 只有董事长和学术总监能够访问
- 后端API已添加权限检查
- 前端路由已添加权限配置

✅ **董事长和学术总监的特权**
- 董事长拥有：`academic.*`, `management.*`, `teaching_quality.*`, `consulting.*`, `marketing.*`, `hr.*`
- 学术总监拥有：`academic.*`

### 7.2 扩展方式

为其他表格/页面添加权限保护：

**后端**：
```python
@router.get(
    "/some-resource",
    dependencies=[Depends(require_permission("module.resource.view"))]
)
async def get_resource(...):
    ...
```

**前端路由**：
```typescript
{
  path: '/some-path',
  meta: {
    requiresAuth: true,
    permission: 'module.resource.view'
  }
}
```

## 八、部署步骤

### 8.1 数据库迁移

```bash
cd backend
alembic upgrade head
```

### 8.2 初始化权限数据

```bash
cd backend
python init_permissions.py
```

### 8.3 验证

1. 检查数据库表是否创建成功
2. 检查权限数据是否初始化成功
3. 测试API权限保护是否生效
4. 测试前端路由守卫是否生效

## 九、后续扩展

### 9.1 添加新权限

1. 在 `init_permissions.py` 中添加权限定义
2. 重新运行初始化脚本
3. 在前端 `permission.ts` 中添加权限常量
4. 在后端API上添加权限依赖
5. 在前端路由配置中添加权限

### 9.2 添加新角色

1. 在 `init_permissions.py` 中添加角色定义
2. 配置角色权限映射
3. 重新运行初始化脚本
4. 在前端 `permission.ts` 中添加角色常量

### 9.3 为用户分配角色

通过管理界面或数据库操作：

```sql
-- 查询角色ID和用户ID
SELECT role_id FROM roles WHERE code = 'chairman';
SELECT user_id FROM users WHERE username = 'someuser';

-- 分配角色
INSERT INTO user_roles (user_id, role_id) 
VALUES (用户ID, 角色ID);
```

## 十、安全注意事项

1. ⚠️ **后端权限检查是安全核心**
   - 前端只能隐藏UI，不能阻止API调用
   - 必须在后端API层做权限校验

2. ⚠️ **超级用户权限**
   - 使用 `is_superuser` 字段标记超级用户
   - 超级用户拥有所有权限（通配符 `*`）

3. ⚠️ **权限缓存**
   - 考虑在用户登录时缓存权限列表
   - 避免每次请求都查询数据库

4. ⚠️ **审计日志**
   - 建议记录所有权限检查失败的尝试
   - 用于安全审计和异常检测

## 十一、问题排查

### 11.1 用户无法访问某个页面

1. 检查用户是否分配了角色
2. 检查角色是否配置了对应权限
3. 检查权限代码是否匹配
4. 查看后端日志中的权限检查记录

### 11.2 权限检查总是失败

1. 确认数据库迁移已执行
2. 确认权限数据已初始化
3. 检查权限代码拼写是否正确
4. 检查通配符权限是否正确配置

## 十二、参考资料

- FastAPI依赖注入：https://fastapi.tiangolo.com/tutorial/dependencies/
- React Router权限控制：https://reactrouter.com/en/main/start/overview
- RBAC权限模型：https://en.wikipedia.org/wiki/Role-based_access_control
