# 岗位分析报告汇总表 - 动态列功能说明

## 功能概述

岗位分析报告汇总表现在支持**动态添加/删除列**功能，用户可以根据需要自定义表格列，所有更改会**立即保存到后端数据库**。

## 已实现的功能

### 1. 前端功能

- ✅ **动态添加列**：点击"添加列"按钮，输入列标识和列名称即可添加新列
- ✅ **动态删除列**：点击列标题旁的删除图标即可删除列
- ✅ **自动保存**：添加/删除列后立即保存到后端，无需手动点击保存
- ✅ **数据持久化**：所有列配置和数据都保存在数据库中
- ✅ **按年份管理**：不同年份的数据独立管理

### 2. 后端功能

- ✅ **数据库模型**：使用 JSONB 存储动态列配置和数据
- ✅ **API 端点**：
  - `GET /api/v1/position-analysis-summary/by-year/{year}` - 按年份获取数据
  - `POST /api/v1/position-analysis-summary/` - 创建/更新数据
  - `POST /api/v1/position-analysis-summary/{id}/columns` - 添加列
  - `DELETE /api/v1/position-analysis-summary/{id}/columns/{key}` - 删除列
- ✅ **数据验证**：确保列标识唯一性，数据完整性

## 数据库表结构

### 表名：`academic.academic_position_analysis_summary`

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| 年份 | Integer | 数据年份 |
| columns | JSONB | 列配置数组 `[{"key": "network", "label": "网络工程"}, ...]` |
| rows | JSONB | 行数据数组 `[{"campus": "盛邦", "data": {"network": 10, ...}}, ...]` |
| 创建时间 | DateTime | 创建时间 |
| 更新时间 | DateTime | 更新时间 |

## 使用说明

### 添加新列

1. 点击"添加列"按钮
2. 输入列标识（英文，用于数据存储，例如：`newMajor`）
3. 输入列名称（中文，用于显示，例如：`新专业`）
4. 点击"添加"
5. 系统会自动保存到后端，新列会出现在表格中

### 删除列

1. 点击要删除的列标题旁的删除图标（红色 X）
2. 确认删除
3. 系统会自动保存到后端，列会从表格中移除

### 编辑数据

1. 直接在表格单元格中输入数值
2. 点击"保存"按钮保存所有更改

## API 使用示例

### 添加列

```http
POST /api/v1/position-analysis-summary/{record_id}/columns
Content-Type: application/json

{
  "key": "newMajor",
  "label": "新专业"
}
```

### 删除列

```http
DELETE /api/v1/position-analysis-summary/{record_id}/columns/{column_key}
```

### 获取数据

```http
GET /api/v1/position-analysis-summary/by-year/2025?create_if_not_exists=true
```

### 保存数据

```http
POST /api/v1/position-analysis-summary/
Content-Type: application/json

{
  "年份": 2025,
  "columns": [
    {"key": "network", "label": "网络工程"},
    {"key": "newMajor", "label": "新专业"}
  ],
  "rows": [
    {
      "campus": "盛邦",
      "data": {
        "network": 10,
        "newMajor": 5
      }
    }
  ]
}
```

## 技术实现

### 前端

- 使用 React Hooks 管理状态
- 使用 Ant Design 组件构建 UI
- 使用统一的 API 服务（`@/services/api`）进行数据请求
- 添加/删除列后立即调用 API 保存

### 后端

- 使用 PostgreSQL JSONB 存储动态列和数据
- FastAPI 提供 RESTful API
- SQLAlchemy ORM 进行数据库操作
- Pydantic 进行数据验证

## 注意事项

1. **列标识唯一性**：同一表格中列标识（key）必须唯一
2. **数据完整性**：删除列会同时删除该列的所有数据
3. **年份隔离**：不同年份的数据完全独立
4. **自动保存**：添加/删除列后会自动保存，无需手动点击保存按钮

## 测试步骤

1. 访问页面：`http://localhost:5173/academic-mgnt-core-business-summary-all`
2. 滚动到"11. 岗位分析"部分
3. 点击"添加列"按钮
4. 输入列标识和列名称
5. 确认添加
6. 检查新列是否出现在表格中
7. 检查后端数据库是否已保存新列配置

---

*更新时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*

