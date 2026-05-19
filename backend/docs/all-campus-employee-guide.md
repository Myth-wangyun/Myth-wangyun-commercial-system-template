# 清美教育所有校区员工数据导入指南

## 🏫 概述

本指南涵盖了清美教育所有校区的员工数据导入，包括管理中心、盛邦校区、冀美校区、石美校区、晋美校区、原美校区、太美校区和桂美校区，确保所有密码都使用bcrypt加密方式。

## 📊 校区员工统计

### 管理中心（23人）
- **市场部**: 15人
- **人资行政部**: 3人
- **运营部**: 2人
- **财务**: 2人
- **学术部**: 1人
- **教质部**: 1人

### 盛邦校区（35人）
- **咨询部**: 12人
- **学术部**: 12人
- **教质部**: 6人
- **渠道部**: 4人
- **校长**: 1人

### 冀美校区（34人）
- **咨询部**: 12人
- **学术部**: 12人
- **教质部**: 8人
- **运营部**: 1人
- **财务**: 1人

### 石美校区（30人）
- **教质部**: 8人
- **学术部**: 13人
- **渠道部**: 1人
- **行政部**: 8人

### 晋美校区（26人）
- **校长**: 1人
- **学术部**: 9人
- **咨询部**: 8人
- **渠道部**: 1人
- **教质部**: 5人
- **财务部**: 1人
- **保洁阿姨**: 2人

### 原美校区（19人）
- **咨询部**: 8人
- **学术部**: 6人
- **教质部**: 3人
- **财务部**: 1人

### 太美校区（5人）
- **学术部**: 3人
- **教质部**: 2人

### 桂美校区（19人）
- **咨询部**: 9人
- **学术部**: 5人
- **教质部**: 2人
- **运营**: 2人
- **财务部**: 1人

### 总计：191名员工

## 🔐 安全特性

- ✅ **bcrypt加密** - 所有密码都使用bcrypt加密存储
- ✅ **随机盐值** - 每次生成的哈希都不同
- ✅ **安全验证** - 完整的密码验证测试
- ✅ **默认密码** - 用户名+123456格式

## 🛠️ 导入方法

### 方法1: Python脚本导入（推荐）

#### 管理中心员工导入
```bash
cd tools
python import_employees.py
```

#### 盛邦校区员工导入
```bash
cd tools
python import_shengbang_employees.py
```

#### 冀美校区员工导入
```bash
cd tools
python import_jimei_employees.py
```

#### 石美校区员工导入
```bash
cd tools
python import_shimei_employees.py
```

#### 晋美校区员工导入
```bash
cd tools
python import_jinmei_employees.py
```

#### 原美校区员工导入
```bash
cd tools
python import_yuanmei_employees.py
```

#### 太美校区员工导入
```bash
cd tools
python import_taimei_employees.py
```

#### 桂美校区员工导入
```bash
cd tools
python import_guimei_employees.py
```

#### 快速导入（管理中心）
```bash
cd tools
python quick_import_employees.py
```

### 方法2: SQL脚本导入

#### 管理中心员工
```bash
mysql -u username -p database_name < sql/insert_employees.sql
```

#### 盛邦校区员工
```bash
mysql -u username -p database_name < sql/insert_shengbang_employees.sql
```

#### 冀美校区员工
```bash
mysql -u username -p database_name < sql/insert_jimei_employees.sql
```

#### 石美校区员工
```bash
mysql -u username -p database_name < sql/insert_shimei_employees.sql
```

#### 晋美校区员工
```bash
mysql -u username -p database_name < sql/insert_jinmei_employees.sql
```

#### 原美校区员工
```bash
mysql -u username -p database_name < sql/insert_yuanmei_employees.sql
```

#### 太美校区员工
```bash
mysql -u username -p database_name < sql/insert_taimei_employees.sql
```

#### 桂美校区员工
```bash
mysql -u username -p database_name < sql/insert_guimei_employees.sql
```

## 🧪 测试验证

### 运行所有校区测试
```bash
cd tools
python test_all_campus_employees.py
```

### 测试功能
1. **校区员工登录测试** - 验证各校区关键员工登录
2. **所有校区统计** - 显示校区、部门、角色、性别分布
3. **各校区员工列表** - 显示详细员工信息
4. **bcrypt一致性检查** - 验证所有密码都使用bcrypt
5. **密码验证测试** - 测试密码验证功能
6. **最近入职员工** - 显示最近入职的员工

### 单独测试
```bash
# 测试bcrypt功能
python test_bcrypt_encryption.py

# 测试员工导入
python test_employee_import.py
```

## 📁 文件结构

```
tools/
├── import_employees.py              # 管理中心员工导入
├── import_shengbang_employees.py    # 盛邦校区员工导入
├── import_jimei_employees.py        # 冀美校区员工导入
├── import_shimei_employees.py       # 石美校区员工导入
├── import_jinmei_employees.py       # 晋美校区员工导入
├── import_yuanmei_employees.py      # 原美校区员工导入
├── import_taimei_employees.py       # 太美校区员工导入
├── import_guimei_employees.py       # 桂美校区员工导入
├── quick_import_employees.py        # 快速导入脚本
├── test_employee_import.py          # 员工导入测试
├── test_bcrypt_encryption.py        # bcrypt功能测试
└── test_all_campus_employees.py     # 所有校区测试

sql/
├── insert_employees.sql             # 管理中心SQL脚本
├── insert_shengbang_employees.sql   # 盛邦校区SQL脚本
├── insert_jimei_employees.sql       # 冀美校区SQL脚本
├── insert_shimei_employees.sql      # 石美校区SQL脚本
├── insert_jinmei_employees.sql      # 晋美校区SQL脚本
└── insert_yuanmei_employees.sql     # 原美校区SQL脚本
└── insert_taimei_employees.sql      # 太美校区SQL脚本
└── insert_guimei_employees.sql       # 桂美校区SQL脚本

docs/
├── employee-import-guide.md         # 管理中心导入指南
├── bcrypt-employee-import-guide.md  # bcrypt导入指南
└── all-campus-employee-guide.md     # 本指南文档
```

## 🔑 默认密码规则

所有员工的默认密码格式：**用户名 + "123456"**

### 示例
- **管理中心**: 冯钰 (fengyu) → `fengyu123456`
- **盛邦校区**: 靳月莲 (jinyuelian) → `jinyuelian123456`
- **冀美校区**: 韩俊萍 (hanjunping) → `hanjunping123456`
- **石美校区**: 韩亚萍 (hanyaping) → `hanyaping123456`
- **晋美校区**: 薛宁 (xuening) → `xuening123456`
- **原美校区**: 吴倩 (wuqian) → `wuqian123456`
- **太美校区**: 王阳 (wangyang) → `wangyang123456`
- **桂美校区**: 陈旭 (chenxu) → `chenxu123456`

## 🏢 校区信息

### 管理中心
- **位置**: 总部
- **主要部门**: 市场部、人资行政部、运营部
- **特色**: 管理职能，统筹各校区

### 盛邦校区
- **位置**: 盛邦校区
- **主要部门**: 咨询部、学术部、教质部
- **特色**: 教学为主，咨询和学术并重

### 冀美校区
- **位置**: 冀美校区
- **主要部门**: 咨询部、学术部、教质部
- **特色**: 教学为主，咨询和学术并重

### 石美校区
- **位置**: 石美校区
- **主要部门**: 教质部、学术部、行政部
- **特色**: 教学为主，注重教质管理和学术发展

### 晋美校区
- **位置**: 晋美校区
- **主要部门**: 学术部、咨询部、教质部
- **特色**: 教学为主，咨询和学术并重，注重教质管理

### 原美校区
- **位置**: 原美校区
- **主要部门**: 咨询部、学术部、教质部
- **特色**: 咨询为主，学术和教质并重，注重分析规划

### 太美校区
- **位置**: 太美校区
- **主要部门**: 学术部、教质部
- **特色**: 学术教学为主，教质管理并重，规模较小但专业

### 桂美校区
- **位置**: 桂美校区
- **主要部门**: 咨询部、学术部、教质部
- **特色**: 咨询为主，学术和教质并重，注重运营管理

## 🔧 技术细节

### bcrypt配置
```python
# 在 SecurityManager 中
@staticmethod
def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()  # 生成随机盐值
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
    return password_hash.decode('utf-8')

@staticmethod
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
```

### 数据库存储
```sql
-- 密码哈希字段类型
password_hash VARCHAR(255) NOT NULL

-- 校区字段
campus VARCHAR(50) NOT NULL

-- 示例数据
INSERT INTO users (username, password_hash, campus, ...) VALUES 
('hanjunping', '$2b$12$DkPuHcYScBQsjv6FZvRdzuBSnObpLXj8YCWOkIllOVv.yErGuBdKq', '冀美校区', ...);
```

## ⚠️ 安全建议

### 生产环境部署
1. **修改默认密码** - 所有员工首次登录后必须修改密码
2. **密码策略** - 实施强密码策略
3. **定期更新** - 定期要求员工更新密码
4. **监控异常** - 监控异常登录行为
5. **校区隔离** - 根据校区设置不同的访问权限

### 开发环境
1. **测试数据** - 使用测试密码进行开发
2. **数据隔离** - 开发和生产数据分离
3. **权限控制** - 限制数据库访问权限

## 🚀 部署步骤

### 1. 环境准备
```bash
# 安装依赖
pip install bcrypt

# 验证安装
python -c "import bcrypt; print('bcrypt安装成功')"
```

### 2. 数据库准备
```sql
-- 确保users表存在
-- 确保password_hash字段为VARCHAR(255)
-- 确保campus字段为VARCHAR(50)
```

### 3. 导入数据
```bash
# 按顺序导入各校区数据
python tools/import_employees.py              # 管理中心
python tools/import_shengbang_employees.py    # 盛邦校区
python tools/import_jimei_employees.py        # 冀美校区
python tools/import_shimei_employees.py       # 石美校区
python tools/import_jinmei_employees.py       # 晋美校区
python tools/import_yuanmei_employees.py      # 原美校区
python tools/import_taimei_employees.py       # 太美校区
python tools/import_guimei_employees.py        # 桂美校区
```

### 4. 验证导入
```bash
# 运行综合测试
python tools/test_all_campus_employees.py
```

## 📈 性能考虑

### bcrypt性能特点
- **哈希生成**: 约100-200ms（可配置）
- **密码验证**: 约100-200ms
- **内存使用**: 低
- **CPU使用**: 中等（安全考虑）

### 优化建议
1. **成本因子**: 根据服务器性能调整bcrypt成本因子
2. **缓存策略**: 对频繁验证的密码实施缓存
3. **异步处理**: 密码重置等操作使用异步处理
4. **分校区部署**: 根据校区规模考虑分校区部署

## 🔍 故障排除

### 常见问题

#### 1. bcrypt导入失败
```python
ImportError: No module named 'bcrypt'
```
**解决方案**: `pip install bcrypt`

#### 2. 密码验证失败
```python
TypeError: a bytes-like object is required
```
**解决方案**: 确保密码编码为UTF-8

#### 3. 校区数据混乱
```
校区字段为空或错误
```
**解决方案**: 检查导入脚本中的campus字段设置

### 调试方法
```python
# 检查哈希格式
hash_value = "$2b$12$DkPuHcYScBQsjv6FZvRdzuBSnObpLXj8YCWOkIllOVv.yErGuBdKq"
print(f"哈希前缀: {hash_value[:7]}")  # 应该是 $2b$12$
print(f"哈希长度: {len(hash_value)}")  # 应该是 60

# 检查校区分布
from sqlalchemy import text
result = db.execute(text("SELECT campus, COUNT(*) FROM users GROUP BY campus"))
```

## 📞 技术支持

### 验证清单
- [ ] bcrypt库已安装
- [ ] SecurityManager配置正确
- [ ] 数据库字段类型正确
- [ ] 所有校区导入脚本运行成功
- [ ] 密码验证测试通过
- [ ] 校区数据分布正确

### 联系信息
如遇到技术问题，请检查：
1. 错误日志
2. 数据库连接
3. bcrypt版本兼容性
4. 密码格式要求
5. 校区字段设置

## 🎯 总结

通过本指南，你可以：
- ✅ 确保所有密码使用bcrypt加密
- ✅ 安全导入所有校区员工数据
- ✅ 验证加密功能正常
- ✅ 部署到生产环境
- ✅ 管理多校区员工数据

**重要提醒**: 
1. 所有员工首次登录后必须修改默认密码
2. 根据校区设置不同的访问权限
3. 定期备份和同步员工数据
4. 监控各校区的登录行为

## 📋 快速参考

### 导入命令
```bash
# 管理中心
python tools/import_employees.py

# 盛邦校区  
python tools/import_shengbang_employees.py

# 冀美校区
python tools/import_jimei_employees.py

# 石美校区
python tools/import_shimei_employees.py

# 晋美校区
python tools/import_jinmei_employees.py

# 原美校区
python tools/import_yuanmei_employees.py

# 太美校区
python tools/import_taimei_employees.py

# 桂美校区
python tools/import_guimei_employees.py

# 综合测试
python tools/test_all_campus_employees.py
```

### 默认密码
```
用户名 + "123456"
例如: fengyu123456, jinyuelian123456, hanjunping123456, hanyaping123456, xuening123456, wuqian123456, wangyang123456, chenxu123456
```

### 校区标识
- 管理中心: "总部"
- 盛邦校区: "盛邦校区"  
- 冀美校区: "冀美校区"
- 石美校区: "石美校区"
- 晋美校区: "晋美校区"
- 原美校区: "原美校区"
- 太美校区: "太美校区"
- 桂美校区: "桂美校区"
