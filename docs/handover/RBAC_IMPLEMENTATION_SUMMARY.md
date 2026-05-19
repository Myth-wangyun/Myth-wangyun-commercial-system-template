# RBAC权限系统实施总结

## 问题发现

用户反馈：普通员工登录后，仍然可以访问企业文化宣讲计划表和企业文化考试计划表，但按照需求这两个表格应该只有董事长和学术总监可以访问。

经过调查发现，虽然后端API已经添加了权限检查（`require_permission`依赖），但**前端路由系统没有应用权限守卫**，导致普通用户可以直接访问页面（虽然后端API会拒绝数据请求，但页面本身是可以打开的）。

## 解决方案

### 1. 后端权限保护（已完成）

#### 数据库模型
- `Role` - 角色表
- `Permission` - 权限表  
- `RolePermission` - 角色-权限关联表
- `UserRole` - 用户-角色关联表

#### 核心逻辑
- `PermissionManager` - 权限管理器类
  - `get_user_permissions()` - 获取用户所有权限
  - `check_permission()` - 检查用户是否有某个权限（支持通配符）

#### API保护
文件：`backend/app/api/v1/endpoints/culture_presentation.py` 和 `culture_exam.py`

所有路由都添加了权限依赖：
```python
@router.get("/list", dependencies=[Depends(require_permission("academic.enterprise_culture.presentation.view"))])
@router.post("/", dependencies=[Depends(require_permission("academic.enterprise_culture.presentation.edit"))])
@router.put("/{id}", dependencies=[Depends(require_permission("academic.enterprise_culture.presentation.edit"))])
@router.delete("/{id}", dependencies=[Depends(require_permission("academic.enterprise_culture.presentation.delete"))])
```

### 2. 前端权限保护（本次修复）

#### 创建权限守卫组件
文件：`frontend/components/auth/PermissionGuard.tsx`

功能：
- 检查用户是否登录
- 检查用户是否有所需权限
- 如果没有权限，显示403错误页面

#### 集成到路由系统
文件：`frontend/config/router/routesGenerator.tsx`

修改：
1. 导入 `PermissionGuard` 组件
2. 在生成路由时，如果路由配置中有 `permission` 字段，自动用 `PermissionGuard` 包装该路由组件

```typescript
const requiredPermission = route.meta?.permission

const element = requiredPermission ? (
  <Suspense fallback={<LoadingSpinner />}>
    <PermissionGuard permission={requiredPermission}>
      {React.createElement(Component as React.ComponentType<any>)}
    </PermissionGuard>
  </Suspense>
) : (
  <Suspense fallback={<LoadingSpinner />}>
    {React.createElement(Component as React.ComponentType<any>)}
  </Suspense>
)
```

#### 路由元数据配置
文件：`frontend/config/router/routes.ts`

企业文化路由已经配置了权限要求：
```typescript
{
  key: 'academic-campus-06-enterprise-culture-1-culture-presentation-plan',
  path: '/academic/campus/06-enterprise-culture/1-culture-presentation-plan',
  meta: { 
    title: '企业文化宣讲计划表', 
    requiresAuth: true,
    permission: 'academic.enterprise_culture.presentation.view'
  },
}
```

## 权限体系

### 权限代码结构
格式：`模块.资源.操作`

例如：
- `academic.enterprise_culture.presentation.view` - 查看企业文化宣讲计划
- `academic.enterprise_culture.presentation.edit` - 编辑企业文化宣讲计划
- `academic.enterprise_culture.exam.view` - 查看企业文化考试计划
- `academic.enterprise_culture.exam.edit` - 编辑企业文化考试计划

### 支持通配符
- `academic.*` - 学术部所有权限
- `management.*` - 管理中心所有权限
- `*` - 所有权限（超级管理员）

### 初始化的角色
1. **董事长** (chairman) - 全部权限
2. **学术总监** (academic_director) - 学术部全部权限
3. **教质经理** (teaching_quality_manager) - 教质部管理权限
4. **教师** (teacher) - 基础教学权限
5. **班主任** (homeroom_teacher) - 班级管理权限
6. **咨询师** (consultant) - 市场咨询权限
7. **财务主管** (finance_supervisor) - 财务管理权限
8. **人事专员** (hr_specialist) - 人事管理权限

## 使用方法

### 1. 给用户分配角色

```python
from app.models.user_role import UserRole
from app.core.database import SessionLocal

db = SessionLocal()

# 给用户ID为5的用户分配董事长角色（角色ID为1）
user_role = UserRole(user_id=5, role_id=1)
db.add(user_role)
db.commit()
```

### 2. 查看用户权限

使用调试脚本：
```bash
python check_user_permissions.py <username>
```

### 3. 保护新的API端点

```python
from fastapi import Depends
from app.core.dependencies import require_permission

@router.get("/some-endpoint", dependencies=[Depends(require_permission("module.resource.action"))])
async def some_endpoint():
    pass
```

### 4. 保护新的前端路由

在 `frontend/config/router/routes.ts` 中添加权限元数据：
```typescript
{
  key: 'some-route',
  path: '/some/path',
  meta: { 
    title: '页面标题',
    requiresAuth: true,
    permission: 'module.resource.action'  // 添加这一行
  },
}
```

## 验证步骤

1. **查看所有用户角色**
   ```bash
   python check_user_permissions.py --all
   ```

2. **查看特定用户权限**
   ```bash
   python check_user_permissions.py <username>
   ```

3. **测试前端访问**
   - 用普通员工账号登录
   - 尝试访问 `/academic/campus/06-enterprise-culture/1-culture-presentation-plan`
   - 应该看到403权限不足页面

4. **测试后端API**
   - 用普通员工的token调用 `/api/v1/culture-presentation/list`
   - 应该返回403 Forbidden

## 已知问题

- 所有现有用户都没有分配角色（除了admin用户）
- 需要根据部门和职位给用户批量分配相应的角色

## 下一步工作

1. 根据员工的部门和职位，批量分配角色
2. 为其他敏感表格添加权限保护
3. 实现前端菜单权限过滤（根据用户权限显示/隐藏菜单项）
4. 添加角色和权限管理界面
