# 快速集成指南：为学籍花名册添加"从班级档案获取"功能

## 🎯 目标

为12个学籍花名册表格添加"从班级档案获取"按钮，让用户可以一键从班级档案读取学生数据。

## ✅ 已完成

- [x] 7-secondary-3year-to-register-roster.tsx（中专3年学籍需注册花名册）

## 📝 快速集成步骤（3步）

### 步骤1：添加导入（1行代码）

在文件顶部的导入区域添加：

```typescript
import { useClassFileRoster } from './utils/useClassFileRoster'
```

### 步骤2：添加Hook（在组件内部，约20行代码）

在 `useStudentAutoFill` Hook 之后添加：

```typescript
// 使用从班级档案获取数据的Hook
const { fetchFromClassFile, loading: classFileLoading } = useClassFileRoster({
  category: 'CATEGORY_NAME', // 见下方映射表
  campus: currentCampus,
  mapFunction: (rawData, campus) => rawData.map((r: any, i: number) => ({
    // 根据当前花名册的Record类型映射字段
    // 复制现有的 fetchFromServer 中的字段映射逻辑
  }))
})
```

### 步骤3：添加按钮（在Card的extra中）

在"刷新"按钮之前添加：

```typescript
<Button 
  onClick={() => fetchFromClassFile(setDataSource)} 
  disabled={!canIO}
  loading={classFileLoading}
>
  从班级档案获取
</Button>
```

## 📋 Category 映射表

| 文件名 | Category 参数 | 记录类型 |
|--------|--------------|---------|
| 1-secondary-3year-registration-roster.tsx | `'secondary-3year-registered'` | 已注册 |
| 2-secondary-1year-registration-roster.tsx | `'secondary-1year-registered'` | 已注册 |
| 3-other-secondary-education-registration-roster.tsx | `'other-secondary-registered'` | 已注册 |
| 7-secondary-3year-to-register-roster.tsx | `'secondary-3year-to-register'` | 需注册 ✅ |
| 8-secondary-1year-to-register-roster.tsx | `'secondary-1year-to-register'` | 需注册 |
| 9-other-secondary-education-to-register-roster.tsx | `'other-secondary-to-register'` | 需注册 |
| 4-adult-exam-registration-roster.tsx | `'adult-exam-registered'` | 已注册 |
| 10-adult-exam-to-register-roster.tsx | `'adult-exam-to-register'` | 需注册 |
| 5-open-university-registration-roster.tsx | `'open-university-registered'` | 已注册 |
| 11-open-university-to-register-roster.tsx | `'open-university-to-register'` | 需注册 |
| 6-other-higher-education-registration.tsx | `'other-higher-registered'` | 已注册 |
| 12-other-higher-education-to-register-roster.tsx | `'other-higher-to-register'` | 需注册 |

## 💡 完整示例

### 示例1：需注册花名册（如：中专3年学籍需注册花名册）

```typescript
// 1. 导入
import { useClassFileRoster } from './utils/useClassFileRoster'

// 2. 在组件内添加Hook
const { fetchFromClassFile, loading: classFileLoading } = useClassFileRoster({
  category: 'secondary-3year-to-register',
  campus: currentCampus,
  mapFunction: (rawData, campus) => rawData.map((r: any, i: number) => ({
    key: `${i}-${r.studentName}`,
    pendingRegistrationTime: r.pendingRegistrationTime || '',
    studentName: r.studentName || '',
    gender: r.gender || '',
    idCardNumber: r.idCardNumber || '',
    major: r.major || '',
    educationSystem: r.educationSystem || '',
    className: r.className || '',
    nation: r.nation || '',
    politicalStatus: r.politicalStatus || '',
    householdType: r.householdType || '',
    contactPhone: r.contactPhone || '',
    householdAddress: r.householdAddress || '',
    enrollmentTarget: r.enrollmentTarget || '',
    isMigrantChild: r.isMigrantChild || '',
    registrationYear: r.registrationYear || '',
    scholarshipStatus: r.scholarshipStatus || '',
    parentName1: r.parentName1 || '',
    parentPhone1: r.parentPhone1 || '',
    parentName2: r.parentName2 || '',
    parentPhone2: r.parentPhone2 || '',
    campus: campus,
    headTeacher: r.headTeacher || '',
  }))
})

// 3. 在Card的extra中添加按钮
<Card
  title="中专3年学籍需注册花名册"
  extra={
    <Space>
      <Button 
        onClick={() => fetchFromClassFile(setDataSource)} 
        disabled={!canIO}
        loading={classFileLoading}
      >
        从班级档案获取
      </Button>
      <Button onClick={fetchFromServer} disabled={!canIO}>
        刷新
      </Button>
      {/* 其他按钮... */}
    </Space>
  }
>
```

### 示例2：已注册花名册（如：中专3年学籍注册花名册）

```typescript
// 1. 导入
import { useClassFileRoster } from './utils/useClassFileRoster'

// 2. 在组件内添加Hook
const { fetchFromClassFile, loading: classFileLoading } = useClassFileRoster({
  category: 'secondary-3year-registered',
  campus: currentCampus,
  mapFunction: (rawData, campus) => rawData.map((r: any, i: number) => ({
    key: String(r.studentNumber || `${i}-${r.studentName}`),
    schoolName: r.schoolName || '',
    registrationTime: r.registrationTime || '',
    graduationTime: r.graduationTime || '',
    studentNumber: r.studentNumber || '',
    studentName: r.studentName || '',
    gender: r.gender || '',
    idCardNumber: r.idCardNumber || '',
    major: r.major || '',
    grade: r.grade || '',
    educationSystem: r.educationSystem || '',
    className: r.className || '',
    studyMode: r.studyMode || '',
    nation: r.nation || '',
    politicalStatus: r.politicalStatus || '',
    householdType: r.householdType || '',
    contactPhone: r.contactPhone || '',
    householdAddress: r.householdAddress || '',
    enrollmentTarget: r.enrollmentTarget || '',
    isMigrantChild: r.isMigrantChild || '',
    registrationYear: r.registrationYear || '',
    scholarshipStatus: r.scholarshipStatus || '',
    parentName1: r.parentName1 || '',
    parentPhone1: r.parentPhone1 || '',
    parentName2: r.parentName2 || '',
    parentPhone2: r.parentPhone2 || '',
    campus: campus,
    headTeacher: r.headTeacher || '',
  }))
})

// 3. 在Card的extra中添加按钮（注意：已注册花名册有年月选择器）
<Card
  title="中专3年学籍注册花名册"
  extra={
    <Space>
      <span>年份</span>
      <DatePicker picker="year" /* ... */ />
      <span>月份</span>
      <DatePicker picker="month" /* ... */ />
      <Button 
        onClick={() => fetchFromClassFile(setDataSource)} 
        disabled={!canIO}
        loading={classFileLoading}
      >
        从班级档案获取
      </Button>
      <Button onClick={fetchFromServer} disabled={!canIO}>
        刷新
      </Button>
      {/* 其他按钮... */}
    </Space>
  }
>
```

## 🔍 字段映射技巧

### 方法1：复制现有映射

最简单的方法是复制 `fetchFromServer` 函数中的字段映射逻辑：

```typescript
// 找到 fetchFromServer 中的这段代码
const mapped: RecordType[] = rows.map((r: any) => ({
  key: String(r.studentNumber || ''),
  schoolName: r.schoolName || '',
  // ... 其他字段
}))

// 复制到 mapFunction 中，只需修改参数名
mapFunction: (rawData, campus) => rawData.map((r: any, i: number) => ({
  key: String(r.studentNumber || `${i}-${r.studentName}`),
  schoolName: r.schoolName || '',
  // ... 其他字段（完全相同）
}))
```

### 方法2：使用TypeScript类型

如果有明确的Record类型定义，可以直接使用：

```typescript
mapFunction: (rawData, campus) => rawData.map((r: any, i: number): RecordType => ({
  // TypeScript会提示需要哪些字段
}))
```

## ⚠️ 注意事项

1. **canIO 变量**：
   - 已注册花名册：`Boolean(currentCampus && year && month)`
   - 需注册花名册：`Boolean(currentCampus)`

2. **Key 生成**：
   - 已注册：通常用 `studentNumber`
   - 需注册：通常用 `${i}-${studentName}`

3. **特殊字段**：
   - `campus`: 使用 `campus` 参数（不是 `r.campus`）
   - `key`: 需要保证唯一性

4. **数据完整性**：
   - 从班级档案获取的数据可能不完整
   - 建议在按钮旁边添加提示文字

## 🧪 测试清单

完成集成后，请测试：

- [ ] 点击"从班级档案获取"按钮
- [ ] 确认加载提示显示
- [ ] 确认数据正确加载到表格
- [ ] 确认学生数量正确
- [ ] 确认班主任、班级等信息正确
- [ ] 点击"保存"按钮
- [ ] 刷新页面确认数据持久化

## 📊 进度跟踪

- [x] 7-secondary-3year-to-register-roster.tsx
- [ ] 1-secondary-3year-registration-roster.tsx
- [ ] 2-secondary-1year-registration-roster.tsx
- [ ] 3-other-secondary-education-registration-roster.tsx
- [ ] 8-secondary-1year-to-register-roster.tsx
- [ ] 9-other-secondary-education-to-register-roster.tsx
- [ ] 4-adult-exam-registration-roster.tsx
- [ ] 10-adult-exam-to-register-roster.tsx
- [ ] 5-open-university-registration-roster.tsx
- [ ] 11-open-university-to-register-roster.tsx
- [ ] 6-other-higher-education-registration.tsx
- [ ] 12-other-higher-education-to-register-roster.tsx

## 💬 需要帮助？

如果在集成过程中遇到问题：

1. 查看已完成的示例文件：`7-secondary-3year-to-register-roster.tsx`
2. 查看Hook文档：`utils/useClassFileRoster.ts`
3. 查看核心工具：`utils/classFileEnrollmentReader.ts`
4. 查看用户文档：`班级档案学籍统计使用说明.md`

---

**预计时间**：每个文件约5-10分钟  
**总计时间**：约1-2小时完成所有11个文件

