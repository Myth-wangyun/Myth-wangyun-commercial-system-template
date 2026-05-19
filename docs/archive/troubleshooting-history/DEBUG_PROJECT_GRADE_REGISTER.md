# 项目成绩表数据流分析

## 问题：能插入但不能获取

### 数据流对比

#### 1. 创建数据（POST）流程 ✅
```
前端发送数据
  ↓
ProjectGradeRegisterCreate (Schema 验证 + 标准化 students)
  ↓
payload.model_dump() → dict
  ↓
crud.create_register() → 再次标准化 students
  ↓
ProjectGradeRegister(**data) → SQLAlchemy ORM 对象
  ↓
db.add() + db.commit() → 插入数据库
  ↓
ProjectGradeRegisterResponse.from_orm(record) → 返回响应
```

**关键点**：
- Schema 验证器会标准化 `students` 数据
- CRUD 层再次标准化（双重保险）
- 数据格式一致，插入成功

#### 2. 获取数据（GET）流程 ❌
```
数据库查询 → SQLAlchemy ORM 对象
  ↓
手动标准化 students（在 API 层）
  ↓
创建 record_dict
  ↓
ProjectGradeRegisterResponse(**record_dict) ← **这里可能失败！**
```

**问题点**：
1. `ProjectGradeRegisterResponse` 继承自 `ProjectGradeRegisterBase`
2. `ProjectGradeRegisterBase` 有 `@field_validator('students')` 验证器
3. `ProjectGradeRegisterBase` 还定义了其他字段的类型：
   - `project_names: List[str]`
   - `project_attempt_dates: List[List[str]]`
   - `rater_names: List[List[str]]`

**可能的问题**：
- 如果数据库中的 `project_attempt_dates` 不是 `List[List[str]]` 格式，验证会失败
- 如果数据库中的 `rater_names` 不是 `List[List[str]]` 格式，验证会失败
- 如果 `students` 验证器在处理时出错，也会失败

### 根本原因

**Schema 验证过于严格**：
- `project_attempt_dates: List[List[str]]` - 要求严格的二维列表
- `rater_names: List[List[str]]` - 要求严格的二维列表
- 如果数据库中有旧数据格式不一致，验证会失败

### 解决方案

1. **在 API 层标准化所有字段**（不只是 students）
2. **使用更宽松的验证**，或者
3. **在创建响应对象前，确保所有字段格式正确**

