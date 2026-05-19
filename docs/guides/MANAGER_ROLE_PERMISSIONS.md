# MANAGER 角色访问权限说明

## 角色定义

`MANAGER` 是系统中的一个用户角色，在 `UserRole` 枚举中定义：

```python
class UserRole(PyEnum):
    ADMIN = "admin"           # 系统管理员
    MANAGER = "manager"       # 部门经理
    TEACHER = "teacher"       # 教师
    CONSULTANT = "consultant" # 咨询师
    STAFF = "staff"          # 普通员工
    VIEWER = "viewer"        # 只读用户
```

## 权限范围

### 1. 后端 API 权限 ✅

MANAGER 角色在**后端**享有**管理员权限**，可以访问以下受保护的操作：

#### 员工管理操作
- ✅ **新增员工** (`POST /api/v1/config/user-permissions`)
- ✅ **编辑员工权限** (`PUT /api/v1/config/user-permissions/{user_id}`)
- ✅ **删除员工** (`DELETE /api/v1/config/user-permissions/{user_id}`)
- ✅ **查看员工列表** (`GET /api/v1/config/user-permissions`) - 无权限限制
- ✅ **查看员工详情** (`GET /api/v1/config/user-permissions/{user_id}`) - 无权限限制

#### 权限检查机制
后端的 `get_current_admin_user` 函数（`backend/app/core/auth.py` 第132-152行）认为以下角色都有管理员权限：

```python
if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER] and not current_user.is_superuser:
    raise HTTPException(status_code=403, detail="权限不足，需要管理员权限")
```

**这意味着：**
- `ADMIN` 角色：有管理员权限
- `MANAGER` 角色：**有管理员权限** ✅
- `is_superuser = True`：有管理员权限
- 其他角色：无管理员权限

### 2. 前端菜单权限 ⚠️

**重要：** MANAGER 角色在**前端菜单过滤**中**不被视为管理员**。

#### 菜单过滤逻辑
前端的 `isAdmin` 判断（`frontend/components/Sidebar.tsx` 第27行）：

```typescript
const isAdmin = user?.role === 'admin'  // 只检查 'admin'，不包括 'manager'
```

这意味着：
- ✅ `ADMIN` 角色：可以访问所有菜单（绕过权限和部门检查）
- ❌ `MANAGER` 角色：**不能**绕过菜单过滤，菜单会根据以下规则过滤：
  1. **RBAC 权限检查**：根据用户拥有的权限代码过滤菜单
  2. **部门过滤**：根据用户的 `department` 字段过滤菜单
  3. **职位过滤**：根据用户的 `position` 字段过滤菜单

#### 菜单访问规则

MANAGER 角色可以访问的菜单取决于：

1. **用户拥有的 RBAC 权限**
   - 系统使用新的 RBAC 权限系统（Role、Permission、RolePermission 表）
   - 用户的权限通过 UserRole 关联表关联到 Role，Role 再关联到 Permission
   - 如果用户没有分配任何 Role，则没有权限

2. **用户的部门字段** (`department`)
   - `学术部`：可访问 `department === 'academic'` 或 `department === 'common'` 的菜单
   - `教质部`：可访问 `department === 'teaching_quality'` 或 `department === 'common'` 的菜单
   - 其他部门：只能访问 `department === 'common'` 的菜单

3. **用户的职位字段** (`position`)
   - `董事长`、`学术总监`：可以访问所有菜单（绕过部门检查）
   - 其他职位：按部门过滤

### 3. RBAC 权限系统

系统中有**两套权限系统并存**：

1. **旧的 UserRole 枚举系统**（`ADMIN`, `MANAGER`, `TEACHER` 等）
   - 用于基本的角色区分和后端 API 权限检查
   - `MANAGER` 角色在此系统中有管理员权限

2. **新的 RBAC 系统**（Role、Permission 表）
   - 用于细粒度的权限控制
   - 菜单访问权限依赖此系统
   - 用户需要通过 UserRole 关联表关联到具体的 Role（如 `academic_manager`, `principal` 等）

**注意：** 如果用户在数据库中只有 `role = 'manager'`，但没有通过 UserRole 关联表关联到任何 RBAC Role，那么：
- ✅ 后端 API：可以访问（因为有 MANAGER 角色）
- ❌ 前端菜单：可能无法访问（因为没有 RBAC 权限）

## 典型场景

### 场景1：学术经理（部门经理）
```sql
-- 用户信息
role = 'manager'
department = '学术部'
position = '学术经理'
```

**权限：**
- ✅ 后端：可以管理员工（新增、编辑、删除）
- ✅ 前端：根据 RBAC 权限访问学术部相关菜单
- ⚠️ 如果未分配 RBAC Role，可能需要关联 `academic_manager` 角色

### 场景2：教质经理（部门经理）
```sql
-- 用户信息
role = 'manager'
department = '教质部'
position = '教质经理'
```

**权限：**
- ✅ 后端：可以管理员工
- ✅ 前端：根据 RBAC 权限访问教质部相关菜单
- ⚠️ 如果未分配 RBAC Role，可能需要关联相应的 Role

## 与 ADMIN 角色的区别

| 特性 | ADMIN | MANAGER |
|------|-------|---------|
| **后端 API 权限** | ✅ 管理员权限 | ✅ 管理员权限 |
| **前端菜单** | ✅ 访问所有菜单（绕过检查） | ❌ 根据权限和部门过滤 |
| **isAdmin 标志** | ✅ `isAdmin = true` | ❌ `isAdmin = false` |
| **RBAC 权限** | 通常有 `*` 权限 | 需要分配具体权限 |

## 建议和注意事项

### 1. 为 MANAGER 角色分配 RBAC 权限
为了确保 MANAGER 角色可以访问相应的菜单，建议：

```sql
-- 1. 查询用户ID
SELECT user_id FROM users WHERE username = 'manager_username';

-- 2. 查询可用的 Role（如 academic_manager）
SELECT role_id FROM roles WHERE code = 'academic_manager';

-- 3. 关联用户到 Role
INSERT INTO user_roles (user_id, role_id)
VALUES (用户ID, RoleID);

-- 4. 验证 Role 是否有相应的权限
SELECT p.code 
FROM permissions p
JOIN role_permissions rp ON p.permission_id = rp.permission_id
WHERE rp.role_id = RoleID;
```

### 2. 前端 isAdmin 判断建议
如果需要让 MANAGER 角色也能绕过菜单过滤，可以修改：

```typescript
// 当前实现
const isAdmin = user?.role === 'admin'

// 建议修改为（如果希望 MANAGER 也有管理员权限）
const isAdmin = user?.role === 'admin' || user?.role === 'manager'
```

**注意：** 修改前需要考虑是否希望 MANAGER 角色也能访问所有菜单。

### 3. 权限系统整合建议
考虑将两套权限系统整合：
- 统一使用 RBAC 系统进行权限控制
- 将 UserRole 枚举中的角色映射到 RBAC Role
- 前端菜单过滤完全依赖 RBAC 权限

## 相关文件

- `backend/app/models/user.py` - UserRole 枚举定义
- `backend/app/core/auth.py` - 权限检查函数
- `backend/app/core/permissions.py` - RBAC 权限管理器
- `frontend/components/Sidebar.tsx` - 前端菜单过滤
- `frontend/config/ui/menuItems.tsx` - 菜单配置和过滤逻辑
- `docs/PERMISSION_SYSTEM.md` - 权限系统与角色能力说明

## 总结

**MANAGER 角色的权限特点：**

1. ✅ **后端 API**：享有管理员权限，可以管理员工
2. ❌ **前端菜单**：不享有管理员特权，菜单根据 RBAC 权限和部门过滤
3. ⚠️ **建议**：为 MANAGER 角色分配相应的 RBAC Role 和权限，以确保可以访问相应的菜单和功能
