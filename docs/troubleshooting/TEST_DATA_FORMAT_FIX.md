# 测试数据格式修复说明

## 问题分析

用户反馈：班项目成绩表和班压力面试成绩表的数据展示不出来，但是手动输入的数据刷新后能展示出来。

### 根本原因

1. **项目成绩表**：
   - 前端期望 `projectAttemptDates` 日期格式为 `YYYY/M/D`（如 `2024/1/15`）
   - 测试数据生成时使用的是 `YYYY-MM-DD` 格式（如 `2024-01-15`）
   - 前端加载数据时使用 `meta.className` 过滤，默认值是 `S32106`，但测试数据使用的是 `测试班级1`、`测试班级2`、`测试班级3`

2. **压力面试成绩表**：
   - 前端默认 `selectedClassCode` 是 `'S32106'`
   - 测试数据生成的 `className` 是 `测试班级1`、`测试班级2`、`测试班级3`
   - 过滤时 `item.classCode === selectedClassCode` 不匹配，导致数据被过滤掉
   - 学员命名不一致：测试数据生成时 `studentIndex` 从 1 到 20，但应该循环使用 `测试学生1`、`测试学生2`、`测试学生3`

## 修复方案

### 1. 项目成绩表测试数据修复 ✅

**文件**: `frontend/test/project-grade-register.integration.test.ts`

#### 修复日期格式
```typescript
// 修复前：YYYY-MM-DD
baseDate.format('YYYY-MM-DD')

// 修复后：YYYY/M/D
baseDate.format('YYYY/M/D')
```

#### 确保班级名称匹配
- 测试数据使用 `测试班级1`、`测试班级2`、`测试班级3`
- 前端默认使用 `S32106`，但前端支持从下拉框选择班级
- 用户需要在前端选择对应的班级才能看到数据

### 2. 压力面试成绩表测试数据修复 ✅

**文件**: `frontend/test/press-interview-scores.integration.test.ts`

#### 修复学员命名
```typescript
// 修复前：studentIndex 从 1 到 20，生成 测试学生1 到 测试学生20
const studentNumber = studentIndex;
const studentName = `测试学生${studentNumber}`

// 修复后：循环使用 测试学生1、测试学生2、测试学生3
const studentNumber = ((studentIndex - 1) % 3) + 1; // 1, 2, 3 循环
const studentName = `测试学生${studentNumber}`
```

#### 确保与项目成绩表一致
- 学员 ID：`TEST_STUDENT_1`、`TEST_STUDENT_2`、`TEST_STUDENT_3`
- 学员姓名：`测试学生1`、`测试学生2`、`测试学生3`
- 与项目成绩表的学员命名保持一致

### 3. 数据格式要求

#### 项目成绩表数据结构
```typescript
{
  campusName: '盛邦校区' | '冀美校区',
  majorName: '数字媒体' | 'Java开发' | 'UI设计',
  className: '测试班级1' | '测试班级2' | '测试班级3',
  courseName: '毕业强化' | '项目实战' | '综合实训',
  teacherName: '杜鹏涛' | '李老师' | '王老师' | '张老师',
  projectCount: 1-5,
  students: [
    {
      key: '1',
      studentNo: 'TEST_STUDENT_1',
      studentName: '测试学生1',
      p1a1: { score: 85, comment: '...' },
      p1a2: { score: 90, comment: '...' },
      p1a3: { score: 95, comment: '...' },
      ...
    },
    ...
  ],
  projectNames: ['项目1_2024年1月1日', ...],
  projectAttemptDates: [
    ['2024/1/1', '2024/1/4', '2024/1/7'], // 每个项目3次尝试的日期
    ...
  ],
  raterNames: [
    ['教员1_杜鹏涛', '教员2_杜鹏涛', '教员3_杜鹏涛', '班主任1', '班主任2'],
    ...
  ]
}
```

#### 压力面试成绩表数据结构
```typescript
{
  campusName: '盛邦校区' | '冀美校区',
  majorName: '数字媒体' | 'Java开发' | 'UI设计',
  className: '测试班级1' | '测试班级2' | '测试班级3',
  courseName: '压力面试' | '综合面试' | '技术面试',
  instructorName: '杜鹏涛' | '李老师' | '王老师' | '张老师',
  studentId: 'TEST_STUDENT_1' | 'TEST_STUDENT_2' | 'TEST_STUDENT_3',
  studentName: '测试学生1' | '测试学生2' | '测试学生3',
  year: 2024 | 2025,
  month: 1-12,
  projectScores: {
    '1': {
      instructor1Score: 85,
      instructor2Score: 87,
      instructor3Score: 86,
      homeroomTeacher1Score: 90,
      homeroomTeacher2Score: 88,
      averageScore: 87.2
    },
    '2': { ... },
    ...
  }
}
```

## 前端过滤逻辑

### 项目成绩表
- 前端使用 `meta.className` 过滤数据
- 默认值是 `S32106`，但可以通过下拉框选择
- 用户需要选择 `测试班级1`、`测试班级2` 或 `测试班级3` 才能看到测试数据

### 压力面试成绩表
- 前端使用以下条件过滤：
  - `selectedClassCode`：班级代码（默认 `S32106`）
  - `selectedMajor`：专业名称（默认 `数字媒体`）
  - `selectedCourse`：课程名称（默认 `压力面试`）
  - `instructor`：教员姓名（默认 `杜鹏涛`）
- 用户需要：
  1. 选择对应的班级（`测试班级1`、`测试班级2` 或 `测试班级3`）
  2. 确保专业、课程、教员匹配

## 测试验证

### 验证步骤

1. **运行集成测试**：
   ```bash
   npm run test:integration
   ```

2. **验证项目成绩表**：
   - 打开前端页面：`学术 -> 校区 -> 某校区某班项目成绩表`
   - 在"班级名称"下拉框中选择 `测试班级1`、`测试班级2` 或 `测试班级3`
   - 应该能看到测试数据

3. **验证压力面试成绩表**：
   - 打开前端页面：`学术 -> 校区 -> 学员压力面试成绩登记表`
   - 在"班级名称"下拉框中选择 `测试班级1`、`测试班级2` 或 `测试班级3`
   - 确保"专业名称"是 `数字媒体`、"课程名称"是 `压力面试`、"教员姓名"是 `杜鹏涛`
   - 应该能看到测试数据

## 注意事项

1. **班级名称匹配**：
   - 测试数据使用 `测试班级1`、`测试班级2`、`测试班级3`
   - 前端默认使用 `S32106`，需要手动选择对应的班级

2. **学员命名统一**：
   - 所有表（考试、项目、压力面试）都使用统一的学员命名
   - `测试学生1`、`测试学生2`、`测试学生3`（循环使用）
   - `TEST_STUDENT_1`、`TEST_STUDENT_2`、`TEST_STUDENT_3`（学号）

3. **日期格式**：
   - 项目成绩表的 `projectAttemptDates` 使用 `YYYY/M/D` 格式
   - 例如：`2024/1/15` 而不是 `2024-01-15`

4. **数据关联**：
   - 确保项目成绩表和压力面试成绩表使用相同的学员命名
   - 这样薪资预估表才能正确关联数据

