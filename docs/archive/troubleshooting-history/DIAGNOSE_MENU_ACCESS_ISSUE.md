# 伍瑶无法访问学术部菜单问题诊断

## 问题描述
生产环境下，伍瑶（部门：学术部，职位：学术经理）无法访问学术部菜单。

## 权限控制逻辑

### 前端菜单过滤逻辑
位置：`frontend/config/ui/menuItems.tsx` 第1070行

```typescript
if (userDepartment === '学术部' && (dept === 'academic' || dept === 'common')) {
  return true
}
```

**关键点：**
- 用户部门必须**完全匹配** `'学术部'`（字符串）
- 菜单项的 `department` 字段必须是 `'academic'` 或 `'common'`

### 用户信息获取流程
1. 登录时：从 `/auth/login` 获取用户信息
2. 存储在：`authStore` (zustand persist，会保存到 localStorage)
3. 菜单渲染时：从 `user?.department` 获取部门信息

## 可能的原因

### 1. 前端缓存了旧的用户信息 ⚠️ **最可能**
- 用户信息被缓存在 localStorage 中
- 如果在员工管理页面更新了用户的部门信息，前端不会自动刷新
- **解决方案：** 清除浏览器缓存或调用 `refreshUserInfo()`

### 2. 数据库中的部门字段值不正确
- 可能的值：`null`、空字符串、`"学术部 "`（有空格）、`"学术部"`（全角字符）
- **检查方法：** 查询数据库确认

### 3. 后端返回的部门字段值不一致
- 后端 `/auth/me` 接口返回的 `department` 字段值可能不是 "学术部"
- **检查方法：** 查看浏览器 Network 面板中的 `/auth/me` 响应

## 诊断步骤

### 步骤1：检查浏览器控制台日志
打开浏览器开发者工具，查看：
1. `[Sidebar] 用户信息:` - 检查 `department` 字段的值
2. `[filterMenuByDepartment] 参数:` - 检查传入的 `userDepartment` 值
3. `[filterMenuByDepartment] 处理菜单项:` - 查看菜单过滤过程

### 步骤2：检查后端返回的用户信息
在浏览器 Network 面板中：
1. 找到 `/api/v1/auth/me` 请求
2. 查看响应中的 `department` 字段值
3. 确认是否为 `"学术部"`（注意引号和空格）

### 步骤3：检查数据库
```sql
SELECT user_id, username, real_name, department, position, campus 
FROM public.users 
WHERE username = '伍瑶的用户名' OR real_name = '伍瑶';
```

**检查点：**
- `department` 字段值是否为 `'学术部'`
- 是否有前后空格
- 是否为 NULL

### 步骤4：清除前端缓存
在浏览器控制台执行：
```javascript
// 清除 authStore 缓存
localStorage.removeItem('auth-storage')
// 刷新页面
location.reload()
```

## 解决方案

### 方案1：刷新用户信息（推荐）
在员工管理页面更新用户信息后，自动刷新当前用户的会话：

**修改位置：** `frontend/pages/system/config/employeer_mangage.tsx`

在更新用户信息成功后，检查是否是当前用户，如果是则刷新：

```typescript
// 在 handleUpdate 成功后
if (record.user_id === currentUser?.id) {
  await refreshUserInfo()
}
```

### 方案2：修复数据库中的部门字段值
如果数据库中的值不正确，执行：

```sql
-- 检查当前值
SELECT user_id, username, real_name, department 
FROM public.users 
WHERE real_name = '伍瑶';

-- 更新为正确的值（如果值不正确）
UPDATE public.users 
SET department = '学术部' 
WHERE real_name = '伍瑶' AND (department IS NULL OR department != '学术部');
```

### 方案3：增强菜单过滤逻辑的容错性
如果部门字段值可能有变体，可以修改过滤逻辑：

```typescript
// 在 filterMenuByDepartment 中
const normalizeDepartment = (dept: string | null | undefined): string | null => {
  if (!dept) return null
  // 去除前后空格，统一格式
  return dept.trim()
}

const normalizedUserDept = normalizeDepartment(userDepartment)
if (normalizedUserDept === '学术部' && (dept === 'academic' || dept === 'common')) {
  return true
}
```

## 已实施的修复

### 1. 增强菜单过滤逻辑的容错性 ✅
- **位置：** `frontend/config/ui/menuItems.tsx`
- **改进：** 
  - 添加了 `normalizeDepartment` 函数，自动去除部门字段的前后空格
  - 使用标准化后的部门名称进行匹配，避免因空格导致的匹配失败
  - 改进了调试日志，显示原始值和标准化后的值

### 2. 添加诊断工具 ✅
- **位置：** `frontend/utils/diagnoseMenuAccess.ts`
- **功能：**
  - 自动诊断用户菜单访问权限问题
  - 在浏览器控制台显示详细的诊断信息
  - 提供针对性的解决方案

### 3. Sidebar 组件集成诊断 ✅
- **位置：** `frontend/components/Sidebar.tsx`
- **功能：** 用户登录后自动在控制台打印诊断信息

## 快速修复步骤

1. **立即修复（清除缓存）：**
   - 让伍瑶清除浏览器缓存或使用无痕模式登录
   - 或在浏览器控制台执行：`localStorage.removeItem('auth-storage'); location.reload()`

2. **查看诊断信息：**
   - 打开浏览器开发者工具（F12）
   - 查看 Console 面板
   - 查找 `🔍 菜单访问权限诊断` 分组
   - 根据诊断结果采取相应措施

3. **验证数据库：**
   ```sql
   SELECT user_id, username, real_name, department, position 
   FROM public.users 
   WHERE real_name = '伍瑶';
   ```
   **检查点：**
   - `department` 字段值应为 `'学术部'`（注意不要有前后空格）
   - 如果值不正确，执行：
     ```sql
     UPDATE public.users 
     SET department = '学术部' 
     WHERE real_name = '伍瑶';
     ```

4. **检查后端响应：**
   - 登录后查看 Network 面板中的 `/api/v1/auth/me` 响应
   - 确认 `department` 字段值为 `"学术部"`（注意引号和空格）

5. **如果问题仍然存在：**
   - 检查浏览器控制台的 `[filterMenuByDepartment]` 日志
   - 查看 `normalizedUserDept` 的值是否正确
   - 查看菜单项的 `department` 字段值

## 预防措施

1. **在员工管理页面更新用户信息后，自动刷新当前用户会话**
2. **添加部门字段值的验证和标准化**
3. **在菜单过滤逻辑中添加调试日志（生产环境可关闭）**
