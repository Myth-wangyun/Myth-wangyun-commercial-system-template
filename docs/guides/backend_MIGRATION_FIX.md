# 数据库迁移修复指南

## 问题描述

如果遇到以下错误：
```
column "unsubmitted_count" does not exist in table "academic.class_assignment_grades"
```

这说明数据库中的 `academic.class_assignment_grades` 表缺少 `unsubmitted_count` 字段。

## 原因

这个字段是在 2025-12-30 通过 Alembic 迁移添加的。如果你的数据库是在此之前初始化的，就不会包含这个字段。

## 解决方案

### 方案1：运行 Alembic 迁移（推荐）

在 backend 目录下运行：

```bash
cd backend
alembic upgrade head
```

这会自动应用所有待执行的迁移，包括添加 `unsubmitted_count` 字段。

### 方案2：手动添加字段

如果 Alembic 不可用，可以手动执行以下 SQL：

```sql
-- 添加 unsubmitted_count 字段
ALTER TABLE academic.class_assignment_grades 
ADD COLUMN IF NOT EXISTS unsubmitted_count INTEGER NOT NULL DEFAULT 0;

-- 计算现有记录的 unsubmitted_count
UPDATE academic.class_assignment_grades
SET unsubmitted_count = expected_submit - actual_submit
WHERE unsubmitted_count = 0;
```

### 方案3：重新初始化数据库

如果是测试环境且数据可以丢弃，可以重新初始化：

```bash
cd backend
python -c "from app.core.database import init_db; init_db()"
```

注意：这会清空所有数据！仅适用于开发/测试环境。

## 验证

迁移完成后，可以验证字段是否存在：

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'academic' 
  AND table_name = 'class_assignment_grades' 
  AND column_name = 'unsubmitted_count';
```

应该返回：
```
column_name       | data_type
------------------|-----------
unsubmitted_count | integer
```

## 关于 init_db() 的说明

`init_db()` 函数会在第7步自动运行 Alembic 迁移：

```python
# 步骤7：运行 Alembic 数据库迁移
print("[步骤7] 运行 Alembic 数据库迁移（创建视图等）...")
run_alembic_migrations()
```

所以：
- ✅ **新数据库**：运行 `init_db()` 会自动包含最新的字段
- ❌ **旧数据库**：需要手动运行 `alembic upgrade head` 来更新

## 启动链路约束

- `init_db()` 只允许在显式脚本、迁移修复命令或 `backend/main.py` 的运行期初始化入口中调用。
- 不要在模块导入阶段直接调用 `init_db()`，尤其不要放在 API 模块、模型模块或路由注册模块的顶层。开发模式下这会被 reloader 和 worker 各执行一次，表现为启动慢、日志刷屏、热重载像死循环。
- `teaching_quality` 模块若需要启动期建表或轻量迁移，请在对应 `*_api.py` 中定义普通函数 `_startup_init()`，由 `backend/main.py` 在 `lifespan()` 中统一执行；不要再使用 `@router.on_event("startup")`。

## 迁移文件位置

相关的迁移文件：`migrations/versions/20251230_add_unsubmitted_count.py`
