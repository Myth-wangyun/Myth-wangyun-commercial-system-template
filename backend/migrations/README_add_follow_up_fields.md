# 添加追访字段迁移脚本

## 功能说明

此脚本用于向咨询量表添加追访相关字段，解决数据库结构与ORM模型不一致的问题。

### 添加的字段

#### 1. 咨询量明细表_v2
- `最近追访时间` (TIMESTAMP) - 记录最近一次追访的时间
- `追访记录` (TEXT) - 记录追访的详细内容

#### 2. 咨询量主表
- `最后追访时间` (TIMESTAMP) - 私域保护期判断依据
- `保护期状态` (VARCHAR(20)) - 状态值：私域保护中/已释放到校域/已释放到公域
- `释放时间` (TIMESTAMP) - 释放到校域/公域的时间

## 使用方法

### Windows PowerShell

```powershell
# 1. 进入后端目录
cd d:\Documents\Desktop\1\qm-system\backend

# 2. 激活虚拟环境（如果使用）
# conda activate py311
# 或
# .\venv\Scripts\Activate.ps1

# 3. 运行迁移脚本
python migrations\add_follow_up_fields.py
```

### Linux/Mac

```bash
# 1. 进入后端目录
cd /path/to/qm-system/backend

# 2. 激活虚拟环境（如果使用）
# source venv/bin/activate

# 3. 运行迁移脚本
python migrations/add_follow_up_fields.py
```

## 执行流程

1. **检查现有字段** - 脚本会先检查字段是否已存在
2. **添加缺失字段** - 只添加不存在的字段
3. **添加字段注释** - 为每个字段添加说明
4. **验证结果** - 检查字段是否成功添加

## 注意事项

1. ✅ 脚本是**幂等**的，可以重复运行，不会重复添加字段
2. ✅ 运行前会要求确认，输入 `yes` 或 `y` 继续
3. ✅ 自动检测已存在的字段，跳过已添加的字段
4. ⚠️ 需要数据库连接配置正确
5. ⚠️ 需要有数据库修改权限

## 回滚方法

如需删除添加的字段，可以在数据库中执行：

```sql
-- 删除咨询量明细表_v2的字段
ALTER TABLE consult."咨询量明细表_v2" DROP COLUMN IF EXISTS "最近追访时间";
ALTER TABLE consult."咨询量明细表_v2" DROP COLUMN IF EXISTS "追访记录";

-- 删除咨询量主表的字段
ALTER TABLE consult."咨询量主表" DROP COLUMN IF EXISTS "最后追访时间";
ALTER TABLE consult."咨询量主表" DROP COLUMN IF EXISTS "保护期状态";
ALTER TABLE consult."咨询量主表" DROP COLUMN IF EXISTS "释放时间";
```

## 故障排除

### 错误：找不到模块

```
ModuleNotFoundError: No module named 'app'
```

**解决方法**：确保在 `backend` 目录下运行脚本

### 错误：数据库连接失败

```
sqlalchemy.exc.OperationalError: could not connect to server
```

**解决方法**：
1. 检查数据库是否正在运行
2. 检查 `.env` 文件中的数据库配置
3. 确认数据库连接参数正确

### 错误：权限不足

```
psycopg.errors.InsufficientPrivilege: permission denied
```

**解决方法**：确保数据库用户有 ALTER TABLE 权限

## 验证结果

运行成功后，可以在数据库中查询验证：

```sql
-- 查看咨询量明细表_v2的字段
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'consult' 
AND table_name = '咨询量明细表_v2' 
AND column_name IN ('最近追访时间', '追访记录');

-- 查看咨询量主表的字段
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'consult' 
AND table_name = '咨询量主表' 
AND column_name IN ('最后追访时间', '保护期状态', '释放时间');
```
