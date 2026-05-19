# 校区数据库配置指南

## 概述

系统已支持多校区数据库配置，通过参数化的方式可以灵活切换不同校区的数据库连接。

## 配置说明

### 1. 默认配置

- **默认数据库**: `account`
- **默认校区**: `管理中心`
- **默认校区代码**: `center`

### 2. 校区配置映射

| 校区代码 | 校区名称 | 数据库名称 | 说明 |
|---------|---------|-----------|------|
| `center` | 管理中心 | `account` | 清美教育管理中心 |
| `shengbang` | 盛邦校区 | `shengbang_db` | 盛邦校区 |
| `jimei` | 冀美校区 | `jimei_db` | 冀美校区 |
| `jinmei` | 晋美校区 | `jinmei_db` | 晋美校区 |
| `shimei` | 石美校区 | `shimei_db` | 石美校区 |
| `taimei` | 太美校区 | `taimei_db` | 太美校区 |
| `guimei` | 桂美校区 | `guimei_db` | 桂美校区 |

## 使用方法

### 1. 环境变量方式

```bash
# Windows PowerShell
$env:DB_NAME="account"
$env:CAMPUS_NAME="管理中心"
$env:CAMPUS_CODE="center"

# 或者
set DB_NAME=account
set CAMPUS_NAME=管理中心
set CAMPUS_CODE=center

# Linux/Mac
export DB_NAME="account"
export CAMPUS_NAME="管理中心"
export CAMPUS_CODE="center"
```

### 2. 代码中使用

```python
from backend.app.core.config import settings, get_campus_config, get_database_url_for_campus

# 获取当前配置
print(f"当前数据库: {settings.DB_NAME}")
print(f"当前校区: {settings.CAMPUS_NAME}")

# 获取特定校区配置
shengbang_config = get_campus_config("shengbang")
print(f"盛邦校区数据库: {shengbang_config['db_name']}")

# 获取特定校区的数据库连接URL
shengbang_db_url = get_database_url_for_campus("shengbang")
print(f"盛邦校区数据库URL: {shengbang_db_url}")
```

### 3. 导入脚本使用

```bash
# 导入到管理中心数据库
python tools/import_center_employees.py

# 导入到盛邦校区数据库
set DB_NAME=shengbang_db && set CAMPUS_CODE=shengbang && python tools/import_shengbang_employees.py

# 导入到冀美校区数据库
set DB_NAME=jimei_db && set CAMPUS_CODE=jimei && python tools/import_jimei_employees.py
```

## 数据库连接示例

### 管理中心数据库连接
```
mysql+pymysql://root:1234@localhost:3306/account?charset=utf8mb4
```

### 盛邦校区数据库连接
```
mysql+pymysql://root:1234@localhost:3306/shengbang_db?charset=utf8mb4
```

## 注意事项

1. **数据库创建**: 使用前请确保对应的数据库已创建
2. **权限配置**: 确保数据库用户有访问对应数据库的权限
3. **数据隔离**: 不同校区的数据完全隔离，互不影响
4. **配置一致性**: 确保环境变量和代码中的配置保持一致

## 扩展新校区

要添加新校区，只需在 `CAMPUS_CONFIGS` 中添加配置：

```python
"new_campus": {
    "name": "新校区",
    "db_name": "new_campus_db",
    "description": "新校区描述"
}
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库是否存在
   - 检查用户名密码是否正确
   - 检查数据库服务是否启动

2. **环境变量不生效**
   - 确保环境变量名称正确
   - 重启应用程序
   - 检查环境变量作用域

3. **校区配置错误**
   - 检查校区代码是否在 `CAMPUS_CONFIGS` 中定义
   - 检查数据库名称是否正确
