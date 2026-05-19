# 项目成绩表重新设计文档

## 问题描述

`project_grade_registers` 表设计有问题，没有正确存储学号和学员姓名。前端界面设计没问题，问题在后端存储和API。

## 问题分析

### 原有设计的问题

1. **Schema 验证不足**：`students` 字段定义为 `Any`，没有验证每个学生必须包含 `studentNo` 和 `studentName`
2. **数据标准化缺失**：后端没有确保存储时使用统一的字段名（`studentNo`/`studentName` vs `student_no`/`student_name`）
3. **过滤功能不足**：API 只支持校区和班级过滤，不支持专业、课程、教师过滤

## 重新设计方案

### 1. Schema 增强 ✅

**文件**: `backend/app/schemas/project_grade_register.py`

#### 新增 `StudentData` 模型
```python
class StudentData(BaseModel):
    key: str  # 行键
    studentNo: str  # 学号（必需）
    studentName: str  # 学员姓名（必需）
    # 动态字段：p{n}a{1|2|3} -> { score?: number; comment?: string }
```

#### 增强验证器
- 在 `ProjectGradeRegisterBase` 和 `ProjectGradeRegisterUpdate` 中添加 `@field_validator('students')`
- 确保每个学生都有 `studentNo` 和 `studentName` 字段（即使为空字符串）
- 自动标准化字段名（支持 `studentNo`/`student_no` 和 `studentName`/`student_name`）

### 2. CRUD 函数增强 ✅

**文件**: `backend/app/crud/project_grade_register.py`

#### `create_register` 函数
- 在创建前标准化 `students` 数据
- 确保每个学生都有 `studentNo` 和 `studentName` 字段
- 统一使用驼峰命名（`studentNo`、`studentName`）

#### `update_register` 函数
- 在更新前标准化 `students` 数据
- 确保数据格式一致

#### `list_registers` 函数
- 新增过滤参数：`major_name`、`course_name`、`teacher_name`
- 支持更精确的数据查询

### 3. API 端点增强 ✅

**文件**: `backend/app/api/v1/endpoints/project_grade_register.py`

#### `GET /project-grade-registers/`
新增查询参数：
- `major_name` - 专业名称
- `course_name` - 课程名称
- `teacher_name` - 教师姓名

## 数据结构规范

### Students JSONB 字段结构

```json
[
  {
    "key": "1",
    "studentNo": "TEST_STUDENT_1",
    "studentName": "测试学生1",
    "p1a1": { "score": 85, "comment": "表现优秀" },
    "p1a2": { "score": 90, "comment": "改进明显" },
    "p1a3": { "score": 95, "comment": "完美" },
    "p2a1": { "score": 80, "comment": "良好" },
    ...
  },
  {
    "key": "2",
    "studentNo": "TEST_STUDENT_2",
    "studentName": "测试学生2",
    ...
  }
]
```

### 字段要求

1. **必需字段**：
   - `key`: 字符串，行键（通常为 "1", "2", "3"...）
   - `studentNo`: 字符串，学号（可以为空字符串，但不能缺失）
   - `studentName`: 字符串，学员姓名（可以为空字符串，但不能缺失）

2. **动态字段**：
   - `p{n}a{1|2|3}`: 项目成绩对象
     - `score`: 数字（可选）
     - `comment`: 字符串（可选）

## 数据标准化逻辑

### 输入标准化

后端接收数据时，自动处理以下情况：

1. **字段名不统一**：
   - `studentNo` 或 `student_no` → 统一为 `studentNo`
   - `studentName` 或 `student_name` → 统一为 `studentName`

2. **缺失字段**：
   - 如果 `studentNo` 缺失，设置为空字符串 `""`
   - 如果 `studentName` 缺失，设置为空字符串 `""`
   - 如果 `key` 缺失，使用索引+1作为默认值

3. **保留其他字段**：
   - 所有项目成绩字段（`p1a1`, `p1a2`, 等）保持不变

### 输出标准化

后端返回数据时，确保：
- 所有学生都有 `studentNo` 和 `studentName` 字段
- 字段名统一为驼峰命名（`studentNo`、`studentName`）

## 前端兼容性

前端无需修改，因为：
1. 前端已经使用 `studentNo` 和 `studentName`（驼峰命名）
2. 后端会自动标准化数据，确保兼容性
3. 前端发送的数据格式保持不变

## 测试验证

### 测试用例

1. **创建记录**：
   - 发送包含 `studentNo` 和 `studentName` 的数据
   - 验证后端正确存储

2. **更新记录**：
   - 更新学生的学号和姓名
   - 验证后端正确更新

3. **查询记录**：
   - 使用新的过滤参数查询
   - 验证返回的数据包含正确的学号和姓名

4. **数据迁移**：
   - 如果已有旧数据，验证是否能正确读取和显示

## 数据库迁移

**注意**：当前设计不需要数据库迁移，因为：
- `students` 字段已经是 JSONB 类型
- 只需要在应用层标准化数据格式
- 旧数据在读取时会自动标准化

如果需要强制迁移现有数据，可以运行数据清理脚本：

```python
# 示例：数据迁移脚本（可选）
def migrate_students_data(db: Session):
    records = db.query(ProjectGradeRegister).all()
    for record in records:
        if record.students:
            normalized = []
            for idx, student in enumerate(record.students):
                normalized_student = {
                    'key': student.get('key', str(idx + 1)),
                    'studentNo': student.get('studentNo', student.get('student_no', '')),
                    'studentName': student.get('studentName', student.get('student_name', '')),
                }
                for k, v in student.items():
                    if k not in ['key', 'studentNo', 'studentName', 'student_no', 'student_name']:
                        normalized_student[k] = v
                normalized.append(normalized_student)
            record.students = normalized
    db.commit()
```

## 总结

### 已完成的改进

1. ✅ **Schema 验证增强**：确保每个学生都有 `studentNo` 和 `studentName`
2. ✅ **数据标准化**：自动统一字段名和格式
3. ✅ **API 过滤增强**：支持专业、课程、教师过滤
4. ✅ **CRUD 函数增强**：在创建和更新时自动标准化数据

### 关键特性

- **向后兼容**：支持旧数据格式（`student_no`/`student_name`）
- **自动标准化**：输入时自动转换为统一格式
- **数据完整性**：确保每个学生都有必需的字段
- **前端无需修改**：前端代码保持不变

### 下一步

1. 运行集成测试，验证数据正确存储
2. 检查现有数据，确认格式正确
3. 如果需要，运行数据迁移脚本清理旧数据

