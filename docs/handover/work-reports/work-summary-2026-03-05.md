# 工作日报 - 2026年3月5日

> **项目**: 清美教育管理系统 (QM-System)  
> **提交次数**: 7 次  
> **变更规模**: 90 个文件，+20,936 行 / -9,201 行（净增 11,735 行）

---

## 一、今日工作总结

### 1. 咨询系统 - 微信号查重防重功能
- 在咨询录入表单（PC端 + 移动端）中新增微信号防重复校验逻辑
- 后端 `consultation_record` CRUD 层新增查重接口，支持微信号重复检测
- Schema 层新增相关字段定义
- 涉及文件：`consultation_record.py`（endpoint/crud/schema）、`ConsultationForm.tsx`、`MobileConsultationForm.tsx`、`api.ts`、`types.ts`（共 7 个文件）

### 2. 培训汇总表 - 下拉选填框与统计逻辑优化
- 培训汇总表页面增加"全部员工"下拉选填框功能
- 后端 `weekly_training.py` 服务层统计逻辑重构优化（减少 35 行冗余代码）
- 前端 `WeeklyTrainingTable.tsx` 和培训汇总页面同步更新
- 涉及文件：3 个（后端服务 + 前端组件 × 2）

### 3. 人事部模块架构重构（重大变更）
- **清理旧代码**：删除原 `human-resources` 目录下全部旧页面，包括：
  - `01-group-hr-dashboard`（集团看板 level1/level2 共 20+ 文件）
  - `02-campus-level2-dashboard`（校区二级看板 6 个页面）
  - `02-campus-level3-dashboard`（校区三级看板）
  - `04-campus-level3-hr-planning`、`05-campus-level3-compensation`、`06-campus-level3-recruitment`
  - `GroupDashboard.tsx` 入口页面
  - 共计删除约 **9,070 行**旧代码
- **新建路由体系**：在 `/humanresources/` 前缀下创建 18 个页面占位组件：
  - 个人信息看板(000)、年度综合看板(001)
  - 线下事业部：年度看板(offline-002)、月度看板(offline-003)、日报看板(offline-004)、员工档案(offline-005)
  - 总部事业部：年度看板(hq-002)、月度看板(hq-003)、日报看板(hq-004)、员工档案(hq-005)
  - 线上事业部：年度看板(online-002)、月度看板(online-003)、日报看板(online-004)、员工档案(online-005)
  - 基础数据：HR规划(base-006)、培训管理、社保管理、招聘入职
- **更新路由配置**：`routes.ts` 新增 119 行路由定义、`routeComponents.ts` 更新 28 行懒加载、`menuItems.tsx` 新增 153 行菜单配置

### 4. HR规划模块（base-006-hr-planning）- 9个子页面
- **预约面试记录** `AppointmentInterviewRecord.tsx`（632 行）
- **晋升申请** `PromotionApplication.tsx`（715 行）
- **晋升面试** `PromotionInterview.tsx`（854 行）
- **转正申请** `RegularizationApplication.tsx`（661 行）
- **离职审批** `ResignationApproval.tsx`（684 行）
- **调岗申请** `TransferApplication.tsx`（617 行）
- **停薪留职申请** `UnpaidLeaveApplication.tsx`（570 行）
- **工作交接** `WorkHandover.tsx`（1,086 行）
- **述职报告** `WorkReport.tsx`（675 行）
- Tab 页入口 `index.tsx` 整合所有子页面

### 5. 培训管理模块（base-006-training-management）- 4个子页面
- **培训目标** `TrainingGoals.tsx`（1,316 行）
- **培训满意度** `TrainingSatisfaction.tsx`（943 行）
- **培训申请** `TrainingApplication.tsx`（1,008 行）
- **培训成果** `TrainingResults.tsx`（1,001 行）
- Tab 页入口更新

### 6. 招聘入职模块（base-006-recruitment-onboarding）- 2个子页面
- **面试登记** `InterviewRegistration.tsx`（814 行）
- **招聘需求** `RecruitmentRequest.tsx`（889 行）
- Tab 页入口更新

### 7. 社保管理模块（base-006-social-insurance）- 2个子页面
- **社保费用汇总** `InsuranceCostSummary.tsx`（1,014 行）
- **社保申请** `SocialInsuranceApplication.tsx`（1,073 行）
- Tab 页入口更新

### 8. 线下事业部年度核心数据看板（offline-002）- 7张数据表
- **表1 总览表**：合计行 + 校区行，多级表头分组（职数/招聘/HR规划/培训/薪酬/社保/绩效），5 个自动计算率
- **表2 招聘及入职明细**：月×校区树形展开，12 列含 4 个自动计算率
- **表3 人力资源规划明细**：调岗/优化/离职/离职率，月×校区树
- **表4 培训明细**：11 列含场次/人次/合格率/满意度/费用，加权平均聚合
- **表5 薪酬及福利明细**：薪酬总额/人均薪酬(auto)/干部&基层平均薪酬/福利
- **表6 社保明细**：应参保/实际参保/参保率(auto)/缴纳分项/服务费
- **表7 绩效明细**：动态校区列（各校区绩效平均分），绩效/干部/基层平均分，平均值聚合
- 共享年份选择器、通用 `buildTreeData` 工厂函数、`seqCol`/`campusCol` 列工厂、行样式工具
- 总代码量约 **939 行**

### 9. 线下事业部月度核心数据看板（offline-003）- 4个TAB页
- **人力资源配置** `HRResourceAllocation.tsx`（460 行）
- **月度培训** `MonthlyTraining.tsx`（502 行）
- **月度薪酬福利** `MonthlySalaryWelfare.tsx`（445 行）
- **月度社保** `MonthlySocialInsurance.tsx`（423 行）
- Tab 页入口更新

### 10. 线下事业部日报看板（offline-004）- 4个TAB页
- **招聘入职** `RecruitmentOnboarding.tsx`（448 行）
- **薪酬福利** `SalaryWelfare.tsx`（382 行）
- **社保汇总** `SocialInsuranceSummary.tsx`（435 行）
- **培训** `Training.tsx`（357 行）
- Tab 页入口更新，动态校区列，解决无限渲染循环问题

### 11. 线下事业部员工档案（offline-005）
- **人事总表** `PersonnelSummary.tsx`（844 行）- 39 列超宽表格，含完整员工信息字段

---

## 二、技术亮点

1. **通用树形数据工厂** `buildTreeData<D, R>()`：泛型函数，适配 5 张树形表（表2-6），自动构建"年度合计→校区 + 12月→校区"二级树
2. **通用列工厂** `seqCol<T>()`、`campusCol<T>()`：减少 5 张表的重复列定义
3. **动态校区列**：表7 绩效表根据 `campusList` 动态生成校区列，支持校区增减自适应
4. **旧代码彻底清理**：删除 9,070 行过时代码，统一新架构

---

## 三、明日工作计划

1. **线下事业部年度看板（offline-002）收尾**
   - 检查 7 张表的数据联动和汇总逻辑是否需要后端接口对接
   - 优化大表格的滚动性能

2. **总部事业部看板页面开发（hq-002 ~ hq-005）**
   - 年度核心数据看板 hq-002（参照 offline-002 结构，调整总部特有字段）
   - 月度看板 hq-003、日报看板 hq-004、员工档案 hq-005

3. **线上事业部看板页面开发（online-002 ~ online-005）**
   - 复用线下事业部页面结构，适配线上事业部数据维度

4. **个人信息看板（000）与年度综合看板（001）**
   - 实现 000-personal-info-dashboard 个人信息展示
   - 实现 001-annual-comprehensive-dashboard 年度综合数据看板

5. **后端 API 对接**
   - 为人事部各模块（HR规划、培训、社保、招聘入职）设计 RESTful API
   - 创建对应的 SQLAlchemy 模型和 CRUD 操作
   - 实现看板数据的汇总查询接口

6. **数据持久化**
   - 将前端各看板的本地 `useState` 数据接入后端 API
   - 实现数据的增删改查完整流程

7. **代码质量**
   - 对新增的 20,000+ 行代码进行 lint 检查和代码审查
   - 补充关键模块的单元测试
