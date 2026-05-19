# psycopg3 迁移完成说明

## 概述

已将项目中所有数据库连接从 psycopg2 迁移到 psycopg3，确保系统统一使用 psycopg3 驱动。

## 修改的文件

### 1. `backend/app/core/campus_manager.py`
- **修改位置**: 3处 `create_engine` 调用
- **修改内容**: 
  - `postgresql://` → `postgresql+psycopg://`
  - 添加密码处理逻辑（空密码时使用默认值）
- **影响**: 校区管理器的所有数据库连接现在使用 psycopg3

### 2. `backend/app/core/campus_database.py`
- **修改位置**: 4处 `create_engine` 调用
- **修改内容**:
  - `postgresql://` → `postgresql+psycopg://`
  - 添加密码处理逻辑（空密码时使用默认值）
- **影响**: 校区数据库管理器的所有数据库连接现在使用 psycopg3

### 3. `backend/sql/init/insert_employment_test_data.py`
- **修改位置**: 1处默认 DATABASE_URL
- **修改内容**: `postgresql://` → `postgresql+psycopg://`
- **影响**: 测试数据插入脚本使用 psycopg3

## 技术细节

### psycopg3 的优势

1. **原生 UTF-8 支持**: psycopg3 原生支持 UTF-8 编码，无需特殊配置
2. **更好的性能**: psycopg3 使用异步 I/O，性能更优
3. **现代化设计**: 更符合 Python 3 的现代特性

### 连接字符串格式

**旧格式 (psycopg2)**:
```
postgresql://user:password@host:port/database
```

**新格式 (psycopg3)**:
```
postgresql+psycopg://user:password@host:port/database
```

### 密码处理

所有修改后的代码都包含密码处理逻辑：
- 如果密码为空，使用默认密码 "postgres"（仅用于开发环境）
- 如果密码存在，使用配置的密码

```python
password_part = f":{settings.DB_PASSWORD}" if settings.DB_PASSWORD else ":postgres"
connection_url = f"postgresql+psycopg://{settings.DB_USER}{password_part}@{settings.DB_HOST}:{settings.DB_PORT}/database"
```

## 已验证的文件

以下文件已经正确使用 psycopg3，无需修改：
- ✅ `backend/app/core/database.py` - 主数据库连接
- ✅ `backend/app/core/config.py` - 配置中的数据库 URL 生成

## 注意事项

1. **依赖要求**: 确保 `requirements.txt` 中包含 `psycopg[binary]==3.2.3`
2. **兼容性**: psycopg3 与 psycopg2 不兼容，确保环境中只安装 psycopg3
3. **测试**: 运行系统前请测试所有数据库连接功能

## 验证方法

运行以下命令验证迁移是否成功：

```bash
# 检查是否还有 psycopg2 引用（除了诊断脚本）
grep -r "psycopg2" backend/app --exclude="diagnose.py"

# 检查是否还有旧的连接字符串格式
grep -r "postgresql://" backend/app --exclude="*.md"

# 测试导入
cd backend
python -c "from app.core.campus_manager import campus_manager; print('✓ campus_manager 导入成功')"
python -c "from app.core.campus_database import campus_db_manager; print('✓ campus_db_manager 导入成功')"
```

## 迁移完成时间

$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

---

*此文档记录了从 psycopg2 到 psycopg3 的完整迁移过程*

