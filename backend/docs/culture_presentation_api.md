# 企业文化宣讲计划表 API 文档

## 概述

企业文化宣讲计划表API提供了对企业文化宣讲计划的完整CRUD操作。支持按校区、年份、月份管理宣讲计划数据。

## 基础路径

```
/api/v1/culture-presentation
```

## API端点

### 1. 获取宣讲计划

获取指定校区、年份、月份的宣讲计划列表。

**请求**
```
GET /api/v1/culture-presentation/{campus}/{year}/{month}
```

**路径参数**
- `campus` (string): 校区名称，如 "盛邦"、"石美" 等
- `year` (int): 年份，范围 2000-2100
- `month` (int): 月份，范围 1-12

**响应示例**
```json
{
  "校区名称": "石美",
  "年份": 2024,
  "月份": 3,
  "行数据": [
    {
      "计划ID": 1,
      "校区名称": "石美",
      "年份": 2024,
      "月份": 3,
      "序号": 1,
      "宣讲时间": "2024-03-15",
      "宣讲地点": "会议室A",
      "宣讲方式": "现场宣讲",
      "宣讲主题": "企业文化核心价值观",
      "宣讲内容概述": "介绍公司核心价值观和发展历程",
      "宣讲对象": "新员工",
      "主讲人": "张经理",
      "需准备资料": "PPT、宣传册",
      "备注": "需要提前准备投影设备",
      "创建时间": "2024-03-01T10:00:00",
      "更新时间": "2024-03-01T10:00:00"
    }
  ],
  "创建时间": "2024-03-01T10:00:00",
  "更新时间": "2024-03-01T10:00:00"
}
```

### 2. 创建宣讲计划

创建新的宣讲计划（批量创建多行）。

**请求**
```
POST /api/v1/culture-presentation/
```

**请求体**
```json
{
  "校区名称": "石美",
  "年份": 2024,
  "月份": 3,
  "行数据": [
    {
      "序号": 1,
      "宣讲时间": "2024-03-15",
      "宣讲地点": "会议室A",
      "宣讲方式": "现场宣讲",
      "宣讲主题": "企业文化核心价值观",
      "宣讲内容概述": "介绍公司核心价值观和发展历程",
      "宣讲对象": "新员工",
      "主讲人": "张经理",
      "需准备资料": "PPT、宣传册",
      "备注": "需要提前准备投影设备"
    },
    {
      "序号": 2,
      "宣讲时间": "2024-03-20",
      "宣讲地点": "培训室B",
      "宣讲方式": "线上宣讲",
      "宣讲主题": "团队协作精神",
      "宣讲内容概述": "讲解团队协作的重要性和方法",
      "宣讲对象": "全体员工",
      "主讲人": "李经理",
      "需准备资料": "在线会议链接",
      "备注": null
    }
  ]
}
```

**响应**
返回创建的宣讲计划列表（格式同获取宣讲计划）。

### 3. 更新宣讲计划

更新指定校区、年份、月份的宣讲计划（批量更新）。

**请求**
```
PUT /api/v1/culture-presentation/{campus}/{year}/{month}
```

**路径参数**
- `campus` (string): 校区名称
- `year` (int): 年份
- `month` (int): 月份

**请求体**
```json
{
  "行数据": [
    {
      "序号": 1,
      "宣讲时间": "2024-03-16",
      "宣讲地点": "会议室A",
      "宣讲方式": "现场宣讲",
      "宣讲主题": "企业文化核心价值观（更新）",
      "宣讲内容概述": "介绍公司核心价值观和发展历程",
      "宣讲对象": "新员工",
      "主讲人": "张经理",
      "需准备资料": "PPT、宣传册",
      "备注": "时间已调整"
    }
  ]
}
```

**响应**
返回更新后的宣讲计划列表。

### 4. 删除宣讲计划

删除指定校区、年份、月份的所有宣讲计划。

**请求**
```
DELETE /api/v1/culture-presentation/{campus}/{year}/{month}
```

**路径参数**
- `campus` (string): 校区名称
- `year` (int): 年份
- `month` (int): 月份

**响应**
```json
{
  "success": true,
  "message": "成功删除 10 条记录",
  "deleted_count": 10
}
```

### 5. 获取单行宣讲计划

根据计划ID获取单行宣讲计划。

**请求**
```
GET /api/v1/culture-presentation/row/{plan_id}
```

**路径参数**
- `plan_id` (int): 计划ID

**响应**
返回单行宣讲计划数据（格式同获取宣讲计划中的行数据）。

### 6. 更新单行宣讲计划

更新单行宣讲计划。

**请求**
```
PUT /api/v1/culture-presentation/row/{plan_id}
```

**路径参数**
- `plan_id` (int): 计划ID

**请求体**
```json
{
  "宣讲时间": "2024-03-17",
  "宣讲地点": "会议室A",
  "宣讲方式": "现场宣讲",
  "宣讲主题": "企业文化核心价值观",
  "宣讲内容概述": "介绍公司核心价值观和发展历程",
  "宣讲对象": "新员工",
  "主讲人": "张经理",
  "需准备资料": "PPT、宣传册",
  "备注": "时间再次调整"
}
```

**响应**
返回更新后的单行宣讲计划数据。

### 7. 删除单行宣讲计划

删除单行宣讲计划。

**请求**
```
DELETE /api/v1/culture-presentation/row/{plan_id}
```

**路径参数**
- `plan_id` (int): 计划ID

**响应**
```json
{
  "success": true,
  "message": "删除成功"
}
```

## 错误响应

所有API在发生错误时返回以下格式：

```json
{
  "detail": "错误信息描述"
}
```

常见HTTP状态码：
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

## 使用示例

### Python示例

```python
import requests

# 基础URL
BASE_URL = "http://localhost:8000/api/v1/culture-presentation"

# 获取宣讲计划
response = requests.get(f"{BASE_URL}/石美/2024/3")
plan = response.json()
print(plan)

# 创建宣讲计划
new_plan = {
    "校区名称": "石美",
    "年份": 2024,
    "月份": 3,
    "行数据": [
        {
            "序号": 1,
            "宣讲时间": "2024-03-15",
            "宣讲地点": "会议室A",
            "宣讲方式": "现场宣讲",
            "宣讲主题": "企业文化核心价值观",
            "宣讲内容概述": "介绍公司核心价值观和发展历程",
            "宣讲对象": "新员工",
            "主讲人": "张经理",
            "需准备资料": "PPT、宣传册",
            "备注": "需要提前准备投影设备"
        }
    ]
}
response = requests.post(f"{BASE_URL}/", json=new_plan)
print(response.json())
```

### JavaScript/TypeScript示例

```typescript
const BASE_URL = "http://localhost:8000/api/v1/culture-presentation";

// 获取宣讲计划
async function getPlan(campus: string, year: number, month: number) {
  const response = await fetch(`${BASE_URL}/${campus}/${year}/${month}`);
  const plan = await response.json();
  return plan;
}

// 创建宣讲计划
async function createPlan(planData: any) {
  const response = await fetch(`${BASE_URL}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(planData),
  });
  const result = await response.json();
  return result;
}

// 使用示例
const plan = await getPlan('石美', 2024, 3);
console.log(plan);
```

## 注意事项

1. **数据唯一性**: 每个校区、年份、月份的组合对应一个完整的计划。创建或更新时会先删除该组合的旧数据，然后插入新数据。

2. **序号**: 序号用于标识计划中的行，建议从1开始连续编号。

3. **日期格式**: 日期字段使用ISO 8601格式（YYYY-MM-DD）。

4. **字符编码**: 所有文本字段支持UTF-8编码，可以存储中文内容。

5. **数据库**: 表存储在`account`数据库中，如果需要使用其他数据库，需要修改数据库连接配置。

