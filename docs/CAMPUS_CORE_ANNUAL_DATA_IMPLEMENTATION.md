# 校区核心年度数据表 - 实施说明

## 概述

为"01核心数据看板 2026年度河北盛邦校区市场网络中心数据表"创建了数据库表，支持将数据保存到数据库。

## 功能特性

### 1. 数据库表结构

**表名**: `market.校区核心年度数据表`

**字段说明**:
- `id`: 主键，自增
- `year`: 年份
- `month`: 月份 (1-12)
- `campus`: 校区名称

**数据字段**:
- 网络中心收入: `plan_income`, `actual_income`, `investment_ratio`
- 校区运营: `enrollment_conversion_rate`, `refund_count`, `refund_rate`
- 网络中心计划报名: `plan_enrollment`
- 校区报名: `gross_enrollment`, `net_enrollment`, `order_count`, `enrollment_progress`, `net_cost`
- 校区上门: `visit_count`, `visit_rate`
- 网络中心计划咨询量: `plan_consult_volume`
- 网络中心数据: `actual_consult_volume`, `consult_completion_progress`, `consult_cost`
- 网络中心计划消费: `plan_cost`
- 实际消费: `actual_cost`

**索引**:
- 联合索引: `(year, month, campus)`
- 唯一约束: `(year, month, campus)` - 防止重复数据

### 2. API接口

**基础路径**: `/api/v1/market/campus-core-annual`

#### 2.1 获取数据
```
GET /api/v1/market/campus-core-annual/data
参数:
  - campus: 校区名称 (必填)
  - year: 年份 (必填)
返回: 12个月的数据，按月份组织
```

#### 2.2 批量保存数据
```
POST /api/v1/market/campus-core-annual/save
请求体:
{
  "campus": "盛邦校区",
  "year": "2026",
  "months": [
    {
      "month": 1,
      "plan_income": 1000000,
      "actual_income": 950000,
      ...
    },
    ...
  ]
}
```

#### 2.3 保存单月数据
```
POST /api/v1/market/campus-core-annual/save-month
请求体:
{
  "campus": "盛邦校区",
  "year": "2026",
  "month": 1,
  "plan_income": 1000000,
  ...
}
```

#### 2.4 删除数据
```
DELETE /api/v1/market/campus-core-annual/delete
参数:
  - campus: 校区名称 (必填)
  - year: 年份 (必填)
  - month: 月份 (可选，不传则删除整年)
```

### 3. 前端功能

#### 3.1 数据加载
- 自动从5个数据源汇总实际数据（新媒体、SEM、网络合作伙伴、口碑、免费推广）
- 从网络计划表加载计划数据
- 从数据库加载已保存的数据（优先级最高）

#### 3.2 数据保存
- 点击"保存数据"按钮，将当前显示的所有数据保存到数据库
- 支持新增和更新操作
- 保存成功后显示提示信息

#### 3.3 数据优先级
1. 数据库中已保存的数据（最高优先级）
2. 从各数据源汇总的实际数据
3. 从网络计划表加载的计划数据

## 部署步骤

### 1. 创建数据库表

在后端目录执行：

```bash
cd D:\Documents\Desktop\1\qm-system\backend
python create_campus_core_annual_table.py
```

### 2. 验证表创建

连接数据库，执行：

```sql
-- 查看表结构
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'market' 
AND table_name = '校区核心年度数据表'
ORDER BY ordinal_position;

-- 查看索引
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'market' 
AND tablename = '校区核心年度数据表';
```

### 3. 重启后端服务

```bash
# 停止现有服务
# 启动服务
python main.py
```

### 4. 测试API

```bash
# 测试获取数据
curl "http://localhost:8000/api/v1/market/campus-core-annual/data?campus=盛邦校区&year=2026"

# 测试保存数据
curl -X POST "http://localhost:8000/api/v1/market/campus-core-annual/save-month" \
  -H "Content-Type: application/json" \
  -d '{
    "campus": "盛邦校区",
    "year": "2026",
    "month": 1,
    "plan_income": 1000000,
    "actual_income": 950000
  }'
```

## 使用说明

### 用户操作流程

1. **打开页面**: 访问"市场月度数据 > 校区分解 > 01核心数据看板"

2. **选择年份**: 使用年份选择器选择要查看的年份

3. **查看数据**: 
   - 系统自动汇总各数据源的实际数据
   - 显示计划数据
   - 如果有已保存的数据，优先显示保存的数据

4. **保存数据**: 
   - 确认数据无误后，点击"保存数据"按钮
   - 系统将当前12个月的数据保存到数据库
   - 保存成功后显示提示信息

5. **数据更新**:
   - 如果数据源更新，重新加载页面会获取最新数据
   - 可以再次点击"保存数据"更新数据库中的数据

## 数据流程

```
数据源（5个表） → 汇总计算 → 显示在页面
                              ↓
网络计划表 → 计划数据 → 显示在页面
                              ↓
                         用户确认
                              ↓
                      点击"保存数据"
                              ↓
                    保存到数据库表
                              ↓
                    下次加载优先使用
```

## 注意事项

1. **数据唯一性**: 同一校区、同一年份、同一月份只能有一条记录
2. **数据覆盖**: 重复保存会更新现有数据，不会创建重复记录
3. **校区名称**: 系统会自动处理校区名称的多种变体（如"盛邦"、"盛邦校区"、"河北盛邦"等）
4. **数据类型**: 
   - 金额字段使用 `NUMERIC(12, 2)` 类型，支持精确计算
   - 比率字段使用 `VARCHAR(20)` 类型，存储格式化后的字符串
5. **性能优化**: 已创建索引，查询性能良好

## 文件清单

### 后端文件
- `backend/app/models/market/campus_core_annual_data.py` - 数据库模型
- `backend/app/api/v1/market/campus_core_annual_data.py` - API接口
- `backend/create_campus_core_annual_table.py` - 建表脚本

### 前端文件
- `frontend/services/market/campusCoreAnnualService.ts` - 服务层
- `frontend/pages/market/2-market-monthly-data/1-campus/01-core-dashboard.tsx` - 页面组件（已更新）

## 扩展建议

1. **数据导出**: 可以添加导出Excel功能
2. **数据对比**: 可以添加年度对比功能
3. **数据审批**: 可以添加数据审批流程
4. **历史记录**: 可以添加数据修改历史记录
5. **权限控制**: 可以添加保存权限控制

## 技术栈

- **后端**: FastAPI + SQLAlchemy + PostgreSQL
- **前端**: React + TypeScript + Ant Design
- **数据库**: PostgreSQL 12+

## 维护说明

### 数据备份
```sql
-- 备份表数据
COPY market.校区核心年度数据表 TO '/path/to/backup.csv' CSV HEADER;

-- 恢复表数据
COPY market.校区核心年度数据表 FROM '/path/to/backup.csv' CSV HEADER;
```

### 数据清理
```sql
-- 删除指定年份的数据
DELETE FROM market.校区核心年度数据表 WHERE year = 2025;

-- 删除指定校区的数据
DELETE FROM market.校区核心年度数据表 WHERE campus = '盛邦校区';
```

## 问题排查

### 1. 保存失败
- 检查数据库连接是否正常
- 检查表是否存在
- 查看后端日志获取详细错误信息

### 2. 数据不显示
- 检查API是否正常返回数据
- 检查浏览器控制台是否有错误
- 确认校区名称和年份参数是否正确

### 3. 数据不一致
- 确认数据源是否正确
- 检查数据汇总逻辑
- 验证保存的数据是否正确

## 联系支持

如有问题，请联系技术支持团队。

