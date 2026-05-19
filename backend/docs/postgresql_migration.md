# PostgreSQL迁移指南

## 概述

系统已从MySQL迁移到PostgreSQL 17。本文档说明迁移后的配置和使用方法。

## 已完成的更改

### 1. 依赖包更新

**requirements.txt**
- ❌ 移除：`pymysql==1.1.1`
- ❌ 移除：`cryptography==46.0.3`（MySQL加密连接支持）
- ✅ 新增：`psycopg2-binary==2.9.10`（PostgreSQL驱动）

### 2. 配置更新

**app/core/config.py**
- 数据库端口：`3306` → `5432`
- 默认用户：`root` → `postgres`
- 字符集：`utf8mb4` → `utf8`
- 连接URL格式：`mysql+pymysql://` → `postgresql://`

### 3. 数据库创建函数更新

**app/core/database.py**
- 数据库检查：`SHOW DATABASES LIKE` → `SELECT FROM pg_database WHERE datname`
- 数据库创建：`CREATE DATABASE ... DEFAULT CHARACTER SET utf8mb4` → `CREATE DATABASE ... ENCODING 'UTF8'`
- 表检查：`SHOW TABLES LIKE` → `SELECT FROM information_schema.tables`

## 配置PostgreSQL

### 1. 设置PostgreSQL密码

```bash
# 切换到postgres用户
sudo -u postgres psql

# 在psql中设置密码
ALTER USER postgres WITH PASSWORD 'your_password';

# 退出
\q
```

### 2. 更新环境变量

创建或更新 `.env` 文件：

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=account
```

### 3. 安装Python依赖

```bash
cd backend
pip install -r requirements.txt
```

## 数据库初始化

### 1. 创建数据库

运行后端应用会自动创建数据库，或手动创建：

```bash
# 连接到PostgreSQL
sudo -u postgres psql

# 创建数据库
CREATE DATABASE account ENCODING 'UTF8';
CREATE DATABASE 市场 ENCODING 'UTF8';
CREATE DATABASE 就业 ENCODING 'UTF8';

# 退出
\q
```

### 2. 初始化表结构

```bash
cd backend
python main.py
```

应用启动时会自动创建所有表结构。

## SQL语法差异

### 1. 字符串引号

- MySQL: 可以使用反引号 `` `table_name` ``
- PostgreSQL: 使用双引号 `"table_name"` 或不使用引号（如果名称合法）

### 2. 数据库创建

**MySQL:**
```sql
CREATE DATABASE `db_name` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci;
```

**PostgreSQL:**
```sql
CREATE DATABASE db_name ENCODING 'UTF8';
```

### 3. 检查数据库是否存在

**MySQL:**
```sql
SHOW DATABASES LIKE 'db_name';
```

**PostgreSQL:**
```sql
SELECT 1 FROM pg_database WHERE datname = 'db_name';
```

### 4. 检查表是否存在

**MySQL:**
```sql
SHOW TABLES LIKE 'table_name';
```

**PostgreSQL:**
```sql
SELECT 1 FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'table_name';
```

### 5. 自增ID

- MySQL: `AUTO_INCREMENT`
- PostgreSQL: `SERIAL` 或 `GENERATED ALWAYS AS IDENTITY`

**注意**：SQLAlchemy会自动处理这些差异，使用ORM时无需担心。

## 验证安装

### 1. 检查PostgreSQL版本

```bash
sudo -u postgres psql -c "SELECT version();"
```

应该显示：`PostgreSQL 17.7`

### 2. 测试连接

```bash
# 使用psql连接
psql -U postgres -d account

# 或使用Python测试
python -c "from app.core.database import engine; print(engine.connect())"
```

### 3. 检查表结构

```bash
sudo -u postgres psql -d account -c "\dt"
```

## 常见问题

### 1. 连接被拒绝

**错误**：`psycopg2.OperationalError: connection refused`

**解决**：
```bash
# 检查PostgreSQL是否运行
sudo systemctl status postgresql

# 启动PostgreSQL
sudo systemctl start postgresql
```

### 2. 认证失败

**错误**：`psycopg2.OperationalError: password authentication failed`

**解决**：
- 检查 `.env` 文件中的密码是否正确
- 确认PostgreSQL用户密码已设置

### 3. 数据库不存在

**错误**：`psycopg2.OperationalError: database "account" does not exist`

**解决**：
- 运行数据库初始化脚本
- 或手动创建数据库

### 4. 字符编码问题

PostgreSQL默认使用UTF-8编码，与MySQL的utf8mb4兼容。如果遇到编码问题：

```sql
-- 检查数据库编码
SELECT datname, pg_encoding_to_char(encoding) FROM pg_database;

-- 如果需要，重新创建数据库
DROP DATABASE account;
CREATE DATABASE account ENCODING 'UTF8';
```

## 性能优化建议

### 1. 连接池配置

PostgreSQL的连接池配置与MySQL相同，已在 `config.py` 中设置：

```python
DB_POOL_SIZE: int = 5
DB_MAX_OVERFLOW: int = 10
DB_POOL_RECYCLE: int = 3600
```

### 2. 索引优化

PostgreSQL的索引使用方式与MySQL类似，SQLAlchemy会自动创建索引。

### 3. 查询优化

PostgreSQL的查询优化器更强大，复杂查询性能通常更好。

## 迁移检查清单

- [x] 更新 `requirements.txt`
- [x] 更新 `config.py` 中的数据库配置
- [x] 更新 `database.py` 中的数据库创建函数
- [ ] 设置PostgreSQL密码
- [ ] 更新 `.env` 文件
- [ ] 安装Python依赖
- [ ] 创建数据库
- [ ] 初始化表结构
- [ ] 测试连接
- [ ] 验证数据操作

## 下一步

1. 设置PostgreSQL密码
2. 更新环境变量配置
3. 运行数据库初始化
4. 测试API接口

## 参考资源

- [PostgreSQL官方文档](https://www.postgresql.org/docs/)
- [psycopg2文档](https://www.psycopg.org/docs/)
- [SQLAlchemy PostgreSQL](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html)

