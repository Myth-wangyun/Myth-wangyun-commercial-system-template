# 集成测试数据生成指南

## 📊 数据生成规模

### 班考试成绩表
- **年份**: 2024, 2025（2个年份）
- **月份**: 1-12月（12个月）
- **每天**: 每个月生成所有天的数据（28-31天，取决于月份）
- **每条记录**: 10个学生
- **预计总记录数**: 2年 × 12月 × 平均30天 × 1条 = **约720条记录**
- **预计总学生数**: 720 × 10 = **约7,200个学生记录**

### 班项目成绩表
- **年份**: 2024, 2025（2个年份）
- **月份**: 1-12月（12个月）
- **每天**: 每个月生成15天的数据
- **每条记录**: 20个学生，1-5个项目
- **预计总记录数**: 2年 × 12月 × 15天 × 1条 = **约360条记录**
- **预计总学生数**: 360 × 20 = **约7,200个学生记录**

### 班压力面试成绩表
- **年份**: 2024, 2025（2个年份）
- **月份**: 1-12月（12个月）
- **每个学生**: 每月生成20个学生的数据
- **每个学生**: 1-5个项目
- **预计总记录数**: 2年 × 12月 × 20学生 = **约480条记录**

## 🎯 数据覆盖范围

### 校区覆盖
- 盛邦校区
- 冀美校区

### 专业覆盖
- 数字媒体（设计类，有平时成绩）
- Java开发（IT类，有单词成绩）
- UI设计（设计类，有平时成绩）
- Python开发（IT类，有单词成绩）
- Web前端（IT类，有单词成绩）

### 班级覆盖
- S32106, S32107（数字媒体班级）
- J202401, J202402（Java开发班级）

### 课程覆盖
- PS, Java基础, UI设计基础, 毕业强化
- 压力面试, 综合面试, 技术面试

### 教员覆盖
- 杜鹏涛, 李老师, 王老师, 张老师

## 📅 日期覆盖

### 考试日期
- **首考日期**: 覆盖每个月的每一天（1-31日，根据月份实际天数）
- **补考日期**: 首考日期后7天

### 项目提交日期
- **首次提交**: 每月1-15日
- **二次提交**: 首次后3天
- **三次提交**: 首次后6天

### 年份和月份
- **年份**: 2024, 2025
- **月份**: 1-12月（完整覆盖）

## 🎲 测试数据特点

### 成绩分布
- **最低分**: 0分（边界测试）
- **最高分**: 100分（边界测试）
- **及格线**: 58-62分（边界测试）
- **正常范围**: 60-100分（大部分数据）

### 学生数量
- **小批量**: 3-5个学生（边界测试）
- **中批量**: 10-20个学生（常规测试）
- **大批量**: 30个学生（压力测试）

### 项目数量
- **单项目**: 1个项目
- **多项目**: 2-5个项目（常规）
- **复杂项目**: 10个项目（压力测试）

## ⚠️ 重要提示

### 数据不会自动删除
- ✅ 测试完成后，所有数据都会保留在数据库中
- ✅ 这些数据可以被其他表格引用
- ✅ 需要手动清理时，请谨慎操作

### 数据清理方法

#### 方法1: 通过前端界面删除
1. 登录系统
2. 进入相应的表格页面
3. 批量删除测试数据

#### 方法2: 通过数据库直接删除（SQL）
```sql
-- 删除班考试成绩表测试数据
DELETE FROM class_exam_scores 
WHERE student_name LIKE '测试%' 
   OR student_name LIKE 'IT学生%'
   OR student_name LIKE '设计学生%'
   OR student_name LIKE '大批量学生%'
   OR student_name LIKE '边界%';

-- 删除班项目成绩表测试数据
DELETE FROM project_grade_registers 
WHERE student_name LIKE '项目学生%'
   OR student_name LIKE '复杂项目学生%';

-- 删除班压力面试成绩表测试数据
DELETE FROM press_interview_scores 
WHERE student_name LIKE '压力面试学生%'
   OR student_name LIKE '多项目学生%'
   OR student_name LIKE '边界%';
```

#### 方法3: 按时间范围删除
```sql
-- 删除2024-2025年的测试数据（如果确定都是测试数据）
DELETE FROM class_exam_scores 
WHERE first_exam_date >= '2024-01-01' 
  AND first_exam_date <= '2025-12-31'
  AND (student_name LIKE '测试%' OR student_name LIKE 'IT%' OR student_name LIKE '设计%');
```

## 📈 数据统计

运行测试后，可以通过以下方式查看数据统计：

```sql
-- 统计班考试成绩表数据
SELECT 
  campus_name,
  major_name,
  COUNT(*) as record_count,
  SUM(class_size) as total_students
FROM class_exam_scores
WHERE student_name LIKE '测试%'
GROUP BY campus_name, major_name;

-- 统计班项目成绩表数据
SELECT 
  campus_name,
  major_name,
  COUNT(*) as record_count,
  SUM(class_size) as total_students
FROM project_grade_registers
WHERE student_name LIKE '项目学生%'
GROUP BY campus_name, major_name;

-- 统计班压力面试成绩表数据
SELECT 
  year,
  month,
  campus_name,
  COUNT(*) as record_count
FROM press_interview_scores
WHERE student_name LIKE '压力面试学生%'
GROUP BY year, month, campus_name;
```

## 🚀 运行测试

```bash
# 运行集成测试（会生成大量数据）
npm run test:integration

# 测试完成后，数据会保留在数据库中
# 可以用于：
# 1. 测试其他依赖这些数据的表格
# 2. 验证数据聚合功能
# 3. 测试数据查询和统计功能
```

## 💡 使用建议

1. **首次运行**: 建议在测试环境运行，验证数据生成正常
2. **数据验证**: 运行后检查数据库，确认数据已正确写入
3. **依赖测试**: 使用这些数据测试其他依赖表格
4. **清理时机**: 在所有相关测试完成后，再统一清理数据

