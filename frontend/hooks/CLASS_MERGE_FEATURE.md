# 班级列表合并功能说明

## 功能概述

`useConfigOptions` hook 现在会自动合并两个来源的班级列表：
1. **配置中心的班级列表** - 从 `config_master.classes` 表获取
2. **数据库中的班级列表** - 从所有包含 `class_name` 字段的业务表中获取

这样可以确保即使用户在业务表中使用了配置中心没有的班级名称，这些班级也会出现在下拉选择列表中。

## 实现原理

### 后端实现

新增了 API 端点：`GET /api/v1/config/classes/from-database`

该端点会从以下表中查询唯一的班级名称：
- `class_exam_scores` (班考试成绩表)
- `class_assignment_grades` (班作业成绩表)
- `project_grade_registers` (班项目成绩表)
- `press_interview_scores` (班压力面试成绩表)

**查询逻辑**：
```python
# 从每个表查询唯一的 class_name
class_names = set()
for table in [ClassExamScore, ClassAssignmentGrade, ProjectGradeRegister, PressInterviewScore]:
    query = db.query(table.class_name).distinct()
    if campus_name:
        query = query.filter(table.campus_name == campus_name)
    class_names.update([row[0] for row in query.all() if row[0]])

return sorted(list(class_names))
```

### 前端实现

在 `useConfigOptions` hook 中：

1. **并行请求**：同时请求配置中心和数据库的班级列表
   ```typescript
   const [classesRes, classesFromDb, coursesRes] = await Promise.all([
     fetchClasses({ campus_code: resolvedCampusCode }),
     fetchClassesFromDatabase({ campus_name: campusNameTrimmed || undefined }),
     fetchCourses(...),
   ]);
   ```

2. **去重合并**：
   ```typescript
   // 创建配置中心班级名称的Set用于快速查找
   const configClassNames = new Set(filteredClasses.map(c => c.class_name));
   
   // 从数据库获取的班级名称中，找出不在配置中心的班级
   const dbOnlyClasses = classesFromDb.filter(className => !configClassNames.has(className));
   
   // 为数据库中的班级创建虚拟的ClassProfile对象
   const dbClassProfiles: ClassProfile[] = dbOnlyClasses.map((className, index) => ({
     id: -1000 - index, // 使用负数ID避免与配置中心的ID冲突
     class_name: className,
     campus_name: campusNameTrimmed || '',
     is_active: true,
   }));
   
   // 合并两个列表
   const mergedClasses = [...filteredClasses, ...dbClassProfiles];
   ```

## 使用方式

### 自动生效

所有使用 `useConfigOptions` hook 的组件都会自动获得合并后的班级列表，无需修改代码。

```typescript
const { classes } = useConfigOptions({
  campusName: '盛邦校区',
  majorName: '数字媒体',
});

// classes 现在包含：
// 1. 配置中心的所有班级
// 2. 数据库中存在的但配置中心没有的班级
```

### API 调用

如果需要单独获取数据库中的班级列表：

```typescript
import { fetchClassesFromDatabase } from '@/services/configMaster';

// 获取所有校区数据库中的班级
const dbClasses = await fetchClassesFromDatabase();

// 获取特定校区的数据库班级
const dbClasses = await fetchClassesFromDatabase({ 
  campus_name: '盛邦校区' 
});
```

## 数据来源优先级

1. **配置中心的班级** - 优先显示，包含完整的班级信息（ID、编码、状态等）
2. **数据库中的班级** - 补充显示，只有班级名称，使用负数ID标识

## 注意事项

1. **性能考虑**：
   - 数据库查询会扫描多个表，如果数据量很大可能较慢
   - 建议在生产环境中添加缓存机制

2. **数据一致性**：
   - 数据库中的班级名称可能与配置中心不完全一致（大小写、空格等）
   - 建议定期同步配置中心的数据

3. **校区过滤**：
   - 如果指定了 `campusName`，数据库查询也会按校区过滤
   - 确保校区名称在配置中心和业务表中保持一致

4. **负数ID**：
   - 数据库中的班级使用负数ID（-1000, -1001, ...）
   - 这样可以避免与配置中心的ID冲突
   - 如果需要区分，可以检查 `id < 0`

## 示例

### 场景1：配置中心有班级，数据库也有
```
配置中心：S32106, S32107
数据库：S32106, S32107, TEST_CLASS_001

结果：S32106, S32107, TEST_CLASS_001
```

### 场景2：配置中心没有，但数据库有
```
配置中心：S32106, S32107
数据库：OLD_CLASS_2023, LEGACY_CLASS

结果：S32106, S32107, OLD_CLASS_2023, LEGACY_CLASS
```

### 场景3：按校区过滤
```
配置中心（盛邦校区）：S32106, S32107
数据库（盛邦校区）：S32106, TEST_CLASS
数据库（冀美校区）：J202401, J202402

查询（盛邦校区）结果：S32106, S32107, TEST_CLASS
```

## 技术细节

### 后端 API

**端点**：`GET /api/v1/config/classes/from-database`

**参数**：
- `campus_name` (可选): 按校区名称过滤

**响应**：
```json
[
  "S32106",
  "S32107",
  "TEST_CLASS_001",
  "OLD_CLASS_2023"
]
```

### 前端服务

**函数**：`fetchClassesFromDatabase(params?)`

**参数**：
```typescript
{
  campus_name?: string
}
```

**返回**：`Promise<string[]>` - 班级名称数组

## 未来优化建议

1. **添加缓存**：使用 Redis 缓存数据库班级列表，减少数据库查询
2. **增量更新**：监听数据变更，增量更新班级列表
3. **数据同步**：提供工具将数据库中的班级同步到配置中心
4. **性能监控**：监控查询性能，优化慢查询

