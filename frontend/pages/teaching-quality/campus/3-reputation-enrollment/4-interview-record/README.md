# 021 XX校区教质部学员访谈记录表

## 概述

本模块实现了学员访谈记录管理系统，包含三个独立的访谈表单：

1. **学员访谈表**：记录与在校学员的访谈信息
2. **家长访谈表**：记录与学员家长的访谈信息
3. **毕业生访谈表**：记录与毕业学员的回访信息

通过 Tab 切换的方式统一管理三类访谈记录，便于教质部全面了解学员、家长和毕业生的反馈。

## 功能特性

### 1. 学员访谈表

- **基本信息记录**：姓名、性别、是否住宿、联系方式、现住地址
- **访谈信息**：访谈日期、访谈内容、访谈结果
- **管理功能**：班主任签字、回访时间、备注
- **可编辑表格**：支持快速编辑模式和详细编辑对话框
- **数据操作**：添加、编辑、删除、刷新、导出

### 2. 家长访谈表

- **家长信息**：学员姓名、家长姓名、关系、联系电话
- **访谈方式**：电话、面谈、微信等多种方式
- **访谈记录**：访谈内容、家长反馈、学生状况
- **后续跟进**：访谈结果、跟进计划
- **完整记录**：班主任签字、备注信息

### 3. 毕业生访谈表

- **毕业信息**：姓名、毕业日期、联系电话
- **就业信息**：当前公司、职位、薪资、工作地点
- **访谈内容**：访谈日期、访谈方式、工作状态
- **职业发展**：职业发展情况、对学校的建议
- **完整记录**：访谈内容、访谈结果、教师签字

## 目录结构

```
4-interview-record/
├── index.tsx                           # 入口文件（Tab切换）
├── 1-student-interview-table.tsx       # 学员访谈表
├── 2-parent-interview-table.tsx        # 家长访谈表
├── 3-graduate-interview-table.tsx      # 毕业生访谈表
└── README.md                           # 说明文档
```

## 数据结构

### 学员访谈记录 (StudentInterviewRecord)

```typescript
interface StudentInterviewRecord {
  key: string
  serialNumber: number // 序号
  studentName: string // 姓名
  gender: string // 男/女
  hasDormitory: string // 是否住宿
  studentPhone: string // 学生电话
  parentPhone: string // 家长电话
  currentAddress: string // 现住地址
  goHomeTime: string // 回家时间
  goHomePath: string // 回家路径
  goHomeMethod: string // 回家方法
  returnTime: string // 返校时间
  goHomeWith: string // 回家与谁
  teacherSignature: string // 班主任签字
  returnVisitTime: string // 回访时间
  interviewDate: string // 访谈日期
  interviewContent: string // 访谈内容
  interviewResult: string // 访谈结果
  remarks: string // 备注
}
```

### 家长访谈记录 (ParentInterviewRecord)

```typescript
interface ParentInterviewRecord {
  key: string
  serialNumber: number // 序号
  studentName: string // 学员姓名
  parentName: string // 家长姓名
  relationship: string // 与学员关系
  parentPhone: string // 家长电话
  interviewDate: string // 访谈日期
  interviewMethod: string // 访谈方式
  interviewContent: string // 访谈内容
  parentFeedback: string // 家长反馈
  studentStatus: string // 学生状况
  interviewResult: string // 访谈结果
  followUpPlan: string // 后续跟进计划
  teacherSignature: string // 班主任签字
  returnVisitTime: string // 回访时间
  remarks: string // 备注
}
```

### 毕业生访谈记录 (GraduateInterviewRecord)

```typescript
interface GraduateInterviewRecord {
  key: string
  serialNumber: number // 序号
  studentName: string // 姓名
  graduationDate: string // 毕业日期
  currentCompany: string // 当前公司
  position: string // 职位
  salary: string // 薪资
  workLocation: string // 工作地点
  phone: string // 联系电话
  interviewDate: string // 访谈日期
  interviewMethod: string // 访谈方式
  workStatus: string // 工作状态
  careerDevelopment: string // 职业发展
  feedbackToSchool: string // 对学校的建议
  interviewContent: string // 访谈内容
  interviewResult: string // 访谈结果
  teacherSignature: string // 教师签字
  remarks: string // 备注
}
```

## 使用说明

### 1. 访问页面

- 导航至：**校区 > 教质部 > 口碑招生 > 学员访谈记录表**
- 通过 Tab 切换三种不同的访谈表

### 2. 筛选数据

- **校区筛选**：选择要查看的校区
- **年月筛选**：选择访谈的年份和月份

### 3. 查看数据

- 表格展示所有访谈记录
- 支持左右滚动查看完整信息

### 4. 编辑模式

- 点击 **编辑** 按钮进入快速编辑模式
- 直接在表格单元格中修改数据
- 点击 **保存** 按钮保存所有更改

### 5. 详细编辑

- 点击每行的 **编辑** 按钮打开编辑对话框
- 在对话框中填写完整的访谈信息
- 表单验证确保必填项完整

### 6. 添加记录

- 点击 **添加** 按钮创建新的访谈记录
- 序号自动递增

### 7. 删除记录

- 点击每行的 **删除** 按钮移除记录
- 删除后自动重新编号

### 8. 数据操作

- **刷新**：重新加载数据
- **导出**：导出为 Excel 文件（开发中）

## 业务场景

### 学员访谈

- **新生入学访谈**：了解学员基本情况和家庭信息
- **定期回访**：跟踪学员学习和生活状况
- **问题跟进**：针对特殊情况的深度访谈
- **离校管理**：记录回家时间、路径等安全信息

### 家长访谈

- **家校沟通**：定期与家长沟通学员情况
- **问题反馈**：收集家长的意见和建议
- **协同管理**：家校合作管理学员
- **满意度调查**：了解家长对学校的评价

### 毕业生访谈

- **就业跟踪**：了解毕业生就业情况
- **职业发展**：跟踪毕业生职业成长
- **教学反馈**：收集对学校教学的建议
- **校友联络**：维护校友关系

## 注意事项

1. **数据隐私**：访谈记录涉及个人隐私，需严格保密
2. **完整记录**：访谈内容应详细记录，便于后续跟进
3. **及时更新**：访谈后应及时录入系统
4. **跟进管理**：根据访谈结果制定跟进计划
5. **定期回访**：建立定期回访机制

## 技术特点

- **React + TypeScript**：类型安全的组件开发
- **Ant Design**：统一的UI组件库
- **Tab切换**：三种访谈表无缝切换
- **表单验证**：确保数据完整性和准确性
- **响应式设计**：适配不同屏幕尺寸
- **可编辑表格**：快速编辑和详细编辑双模式
- **状态管理**：使用 Zustand 管理全局状态

## 后续优化

- [ ] 集成后端 API 实现数据持久化
- [ ] 实现访谈记录的导出功能（Excel/PDF）
- [ ] 添加访谈提醒功能
- [ ] 实现访谈统计报表
- [ ] 支持访谈模板快速填写
- [ ] 添加访谈图片/附件上传功能
- [ ] 实现访谈记录的搜索和筛选
- [ ] 支持批量导入访谈记录
