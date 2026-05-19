# 移动端页面缺失分析报告

## 一、已完成移动端页面

### 基础功能 (6个)
✅ `/m` - 移动端首页 (MobileHome)
✅ `/m/profile` - 个人中心 (MobileProfile)
✅ `/m/stats` - 数据统计 (MobileStats) - 显示校区核心数据
✅ `/m/staff` - 员工目录 (MobileStaff)
✅ `/m/notifications` - 通知中心 (MobileNotifications)
✅ `/m/approvals` - 审批中心 (MobileApprovals)

### 咨询部
✅ `/m/consult-entry` - 咨询量录入 (MobileConsultEntry) - 已在之前实现
✅ `/m/consult/my` - 我的咨询量 (MobileMyConsultations)
✅ `/m/consult/records` - 咨询记录 (MobileConsultationRecords)
✅ `/m/consult/record/:id` - 咨询详情 (MobileConsultationDetail)

---

## 二、缺失的移动端页面（按部门分类）

### � 1. 咨询部 (Consulting Department) - 共18个页面 ✅ 已全部完成
#### 1.1 核心业务数据 (6个)
✅ `/consult/mgnt-center-dashboard` - 管理中心核心数据看板
✅ `/consult/campus-yearly-monthly-media` - 校区年月表-各媒体来源
✅ `/consult/campus-core-data/daily-consulting-summary` - 校区每日咨询量汇总表
✅ `/consult/campus-core-data/consultant-data-summary-v3` - 校区各咨询师数据汇总
✅ `/consult/campus-basic-data/population-data-summary` - 校区各类人群数据汇总
✅ `/consult/campus-basic-data/daily-consulting-register` - 校区每日咨询量登记表

#### 1.2 数据分析 (3个)
✅ `/consulting/mgnt-center-core-data` - 财务收入和退费
✅ `/consulting/hr-basic-table` - 前端人力资源基础表
✅ `/consulting/staff-function` - 员工职数和功能分析

#### 1.3 个人工作 (2个)
✅ `/consult/my-consultations` - 我的咨询量
✅ `/consult/consultation-records` - 咨询记录

#### 1.4 审批管理 (1个)
✅ `/consult/export-approval` - 咨询量导出审批

#### 1.5 管理数据 (4个)
✅ `/consult/mgmt-data/staff-interview` - 咨询部员工访谈记录表
✅ `/consult/mgmt-data/meeting-record` - 咨询部会议记录表
✅ `/consult/mgmt-data/phone-check` - 电话标准化检查
✅ `/consult/mgmt-data/face-to-face-check` - 当面标准化检查

#### 1.6 其他 (1个)
✅ `/consult/culture-training/consulting-training-summary` - 咨询部培训汇总表

---

### � 2. 学术部 (Academic Department) - 共28个页面 ✅ 已全部完成
#### 2.1 核心数据看板 (2个)
✅ `/academic-mgnt-core-business-summary-all` - 管理中心学术部核心业务数据汇总
✅ `/academic/campus/core-data-summary` - 校区学术部核心业务数据汇总

#### 2.2 就业管理 (9个)
已移除 `/employment/campus` - 旧校区就业信息管理融合入口
✅ `/campus-employment-goals-results-tabs` - 就业目标与结果汇总
✅ `/campus-class-employment-detail` - 班级就业明细表
✅ `/campus-project-plan` - 学术部项目计划表
✅ `/campus-class-salary-estimate` - 班薪资预估表
✅ `/campus-class-course-schedule` - 班排课表
✅ `/campus-class-assignment-score` - 班作业成绩表
✅ `/campus-class-exam-score` - 班考试成绩表
✅ `/campus-class-project-score` - 班项目成绩表
✅ `/campus-class-pressure-interview-score` - 班压力面试成绩表
✅ `/campus-student-satisfaction-score` - 学员满意度成绩表
✅ `/campus-class-lecture-score` - 听课成绩表

#### 2.3 口碑招生 (3个)
✅ `/campus-reputation-goals-results` - 口碑招生目标与结果汇总表
✅ `/campus-reputation-work-self-check` - 口碑招生计划与执行统计表
✅ `/campus-reputation-keypoint-summary` - 口碑关键点结果汇总/明细
✅ `/campus-student-interview-record` - 学员访谈记录表

#### 2.4 新生维稳 (2个)
✅ `/campus-stability-stats` - 新生维稳统计表
✅ `/campus-daily-new-student-schedule` - 后端每日新生安排表

#### 2.5 管理数据 (7个)
✅ `/campus-academic-staff-kpi-plan` - 教员KPI计划表
✅ `/campus-academic-staff-performance-reward-punishment` - 教员业绩奖惩表
✅ `/academic/campus/05-manage-data/21-academic-staff-class-hour-summary` - 教员课时汇总表
✅ `/academic/campus/05-manage-data/22-academic-staff-class-hour-stats/4-teacher-hour-stats` - 教员课时统计表
✅ `/academic/campus/05-manage-data/23-academic-staff-interview-record` - 教员访谈记录表
✅ `/campus/academic-staff-standard-check` - 教员标准化检查表
✅ `/academic/campus/05-manage-data/25-academic-staff-daily-work-order/7-daily-work-summary` - 教员日工单
✅ `/academic/campus/05-manage-data/26-academic-metting-record` - 会议记录表
✅ `/academic/campus/05-manage-data/27-academic-teacher-function-analysis` - 教员功能分析总表

#### 2.6 企业文化 (2个)
✅ `/academic/campus/06-enterprise-culture/1-culture-presentation-plan` - 企业文化宣讲计划表
✅ `/academic/campus/06-enterprise-culture/2-culture-exam-plan` - 企业文化考试计划表

---

### � 3. 教质部 (Teaching Quality Department) - 共40+个页面 ✅ 已全部完成
#### 3.1 核心数据 (3个)
✅ `/teaching-quality-mgnt-core-business-summary-all` - 管理中心教质部核心业务数据汇总
✅ `/teaching-quality/core-data` - 教质部核心业务数据汇总表
✅ `/teaching-quality/campus/1-core-data/2-student-employment/class-employment-summary` - 班级就业汇总表

#### 3.2 学员就业 (10个)
✅ `/teaching-quality/campus/employment-goals-results` - 学员就业目标与结果汇总表
✅ `/teaching-quality/campus/1-core-data/2-student-employment/employment-star-table` - 就业明星汇总表
✅ `/teaching-quality/campus/1-core-data/2-student-employment/class-employment-info-index` - 班级就业信息表
✅ `/teaching-quality/campus/class-employment-detail` - 班级就业明细表
✅ `/teaching-quality/campus/employment-period-plan-supervision` - 就业期计划与监督表
✅ `/teaching-quality/campus/intensify-period-plan-supervision` - 强化期计划与监督表
✅ `/teaching-quality/campus/class-salary-estimate` - 班薪资预估表
✅ `/teaching-quality/campus/class-file-record` - 班档案信息表
✅ `/teaching-quality/campus/handover-list` - 咨询量交接列表
✅ `/teaching-quality/campus/class-thousand-score-system` - 班千分制每月累计统计
✅ `/teaching-quality/campus/class-status-summary` - 班级情况表
✅ `/teaching-quality/campus/pressure-interview-score` - 压力面试成绩表
✅ `/teaching-quality/campus/pressure-interview-rating` - 压力面试打分表

#### 3.3 口碑招生 (3个)
✅ `/teaching-quality/campus/reputation-goals-results` - 口碑招生目标与结果汇总表
✅ `/teaching-quality/campus/reputation-work-self-check` - 口碑招生计划与执行统计表
✅ `/teaching-quality/campus/reputation-keypoint-summary` - 口碑关键点结果汇总/明细

#### 3.4 新生维稳 (3个)
✅ `/teaching-quality/campus/new-student-stability` - 新生维稳统计表
✅ `/teaching-quality/campus/activity-plan-arrangement` - 活动计划安排表
✅ `/teaching-quality/campus/daily-new-student-schedule` - 后端每日新生安排表
✅ `/teaching-quality/campus/student-interview-record` - 学员访谈记录表

#### 3.5 升学管理 (2个)
✅ `/teaching-quality/campus/promotion-education` - 升学计划表
✅ `/teaching-quality/campus/promotion-upgrade-plan` - 升学计划表

#### 3.6 学员异动 (2个)
✅ `/teaching-quality/campus/student-movement` - 学员异动表
✅ `/teaching-quality/campus/student-movement-application` - 学员异动申请表

#### 3.7 宿舍与学籍 (2个)
✅ `/teaching-quality/campus/dormitory-statistics` - 宿舍统计表
✅ `/teaching-quality/campus/enrollment-statistics` - 学籍管理表
✅ `/teaching-quality/campus/dorm-fee-notice-self-check` - 住宿费交款通知及自查表

#### 3.8 管理数据 (7个)
✅ `/teaching-quality/campus/management-data/employee-function-analysis` - 员工功能分析表（023）
✅ `/teaching-quality/campus/management-data/employee-kpi-plan` - 员工KPI计划表（024）
✅ `/teaching-quality/campus/management-data/employee-interview-form` - 员工访谈表（025）
✅ `/teaching-quality/campus/management-data/meeting-record` - 会议记录表（026）
✅ `/teaching-quality/campus/management-data/homeroom-teacher-standardization` - 班主任标准化检查表（027）
✅ `/teaching-quality/campus/management-data/homeroom-teacher-daily-work` - 班主任日工单（028）
✅ `/teaching-quality/campus/management-data/training-plan-score-detail` - 教质部培训计划与成绩明细表（029）

#### 3.9 企业文化 (2个)
✅ `/teaching-quality/campus/culture-presentation-plan` - 企业文化宣讲计划表
✅ `/teaching-quality/campus/culture-exam-score` - 企业文化考试计划表

---

### � 4. 市场部 (Marketing Department) - 共24个页面 ✅ 已全部完成
#### 4.1 核心数据 (2个)
✅ `/market/yearly-summary` - 管理中心市场部年度汇总表
✅ `/market/monthly-data` - 市场部月度数据表

#### 4.2 在线推广 (5个)
✅ `/market/online-promotion-stage-report` - 市场部网推阶段业务汇报表
✅ `/market/monthly-business-progress` - 市场部本月业务推进表
✅ `/market/sem-daily-data` - 市场部SEM日常数据表
✅ `/market/online-partner-daily-data` - 市场部网络合作伙伴日度数据表
✅ `/market/free-promotion-daily-data` - 市场部免费推广日度数据表

#### 4.3 新媒体 (4个)
✅ `/market/newmedia-phase-report` - 市场部新媒体阶段业务汇报表
✅ `/market/newmedia-edit-report` - 新媒体剪辑汇报表
✅ `/market/newmedia-daily-data` - 市场部新媒体日度数据表
✅ `/market/account-sentiment` - 市场部各校新媒体账号舆情登记表

#### 4.4 口碑数据 (1个)
✅ `/market/daily-reputation-data` - 市场部口碑日度数据表

#### 4.5 在线聊天 (1个)
✅ `/market/network-consultant-report` - 网络咨询师汇报表

#### 4.6 管理数据 (7个)
✅ `/market/staff-function-analysis` - 市场部全员功能分析
✅ `/market/network-plan` - 市场部网络计划表
✅ `/market/monthly-detail-plan` - 市场部月度详细计划
✅ `/market/partner-contacts` - 市场部合作方联系信息
✅ `/market/employee-interview-records` - 市场部员工访谈记录表
✅ `/market/meeting-record` - 市场部会议记录表

#### 4.7 企业文化 (1个)
✅ `/market/training-summary` - 市场部培训汇总表

---

### ⚪ 5. 人资部 (Human Resources) - 兽3个页面 ⏭️ 跳过(无后端API)
❌ `/human-resources/group-dashboard` - 管理中心·人资部·集团人力资源数据看板
❌ `/human-resources/campus-level2-dashboard` - 管理中心·人资部·校区二级数据看板
❌ `/human-resources/campus-level3-dashboard` - 管理中心·人资部·校区三级数据看板

---

### ⚪ 6. 系统配置 (System Configuration) - 兽4个页面 ⏭️ 跳过(PC专用)
❌ `/system/config/master-data` - 系统配置·校区/班级配置
❌ `/system/config/employee-manage` - 系统配置·员工管理
❌ `/system/config/media-source` - 系统配置·咨询配置
❌ `/system/config/permission` - 系统配置·权限划分

---

### � 7. 日志中心 (Logs) - 1个页面
✅ `/logs` - 日志中心

---

## 三、优先级建议

### 🔥 高优先级 (P0) - 日常高频使用

#### 个人工作类 (5个)
1. **咨询量录入系统** ✅ 已完成
2. **我的咨询量** - `/consult/my-consultations` ✅ 已完成
3. **咨询记录** - `/consult/consultation-records` ✅ 已完成
4. **教员日工单** - `/academic/campus/05-manage-data/25-academic-staff-daily-work-order/7-daily-work-summary` ✅ 已完成
5. **班主任日工单** - `/teaching-quality/campus/management-data/homeroom-teacher-daily-work` ✅ 已完成

#### 数据查看类 (5个)
1. **校区核心数据汇总** ✅ 已完成 (MobileStats)
2. **就业目标与结果汇总** - 旧 `/employment/campus` 入口已下线，当前改为各部门分别从后端真源读取
3. **班级就业明细表** - `/campus-class-employment-detail`
4. **每日咨询量汇总** - `/consult/campus-core-data/daily-consulting-summary` ✅ 已完成
5. **各咨询师数据汇总** - `/consult/campus-core-data/consultant-data-summary-v3` ✅ 已完成

#### 审批类 (1个)
1. **咨询量导出审批** ✅ 已有通用审批中心

---

### 🟡 中优先级 (P1) - 常用管理功能

#### 学员管理类 (6个)
1. **班级情况表** - `/teaching-quality/campus/class-status-summary`
2. **学员异动表** - `/teaching-quality/campus/student-movement` ✅ 已完成
3. **学员访谈记录** - `/campus-student-interview-record` ✅ 已完成
4. **新生维稳统计** - `/campus-stability-stats` ✅ 已完成
5. **宿舍统计表** - `/teaching-quality/campus/dormitory-statistics` ✅ 已完成
6. **学籍管理表** - `/teaching-quality/campus/enrollment-statistics` ✅ 已完成

#### 检查评估类 (4个)
1. **电话标准化检查** - `/consult/mgmt-data/phone-check` ✅ 已完成
2. **当面标准化检查** - `/consult/mgmt-data/face-to-face-check` ✅ 已完成
3. **教员标准化检查** - `/campus/academic-staff-standard-check` ✅ 已完成
4. **班主任标准化检查** - `/teaching-quality/campus/management-data/homeroom-teacher-standardization` ✅ 已完成

---

### 🟢 低优先级 (P2) - 周期性查看

#### 数据报表类
- 各类月度/年度汇总表
- 各类计划表
- 各类分析表

#### 配置管理类
- 系统配置页面（更适合在PC端操作）

---

## 四、技术方案建议

### 1. 快速实现高优先级页面
基于现有的移动端基础设施，优先开发：

```
frontend/pages/mobile/
├── consult/
│   ├── MyConsultations.tsx        # 我的咨询量
│   ├── ConsultationRecords.tsx     # 咨询记录
│   └── DailySummary.tsx            # 每日咨询量汇总
├── employment/
│   ├── EmploymentOverview.tsx      # 就业目标与结果
│   ├── ClassEmploymentDetail.tsx   # 班级就业明细
│   └── EmploymentManagement.tsx    # 就业信息管理
├── academic/
│   ├── TeacherDailyWork.tsx        # 教员日工单
│   └── StudentInterview.tsx        # 学员访谈记录
└── teaching-quality/
    ├── ClassStatus.tsx              # 班级情况表
    ├── StudentMovement.tsx          # 学员异动
    └── DormitoryStats.tsx           # 宿舍统计
```

### 2. 移动端适配原则
- **简化表格**: 将PC端复杂表格改为卡片列表
- **关键信息优先**: 只展示最重要的字段
- **下拉加载**: 使用虚拟滚动优化性能
- **离线缓存**: 关键数据支持离线查看
- **快捷操作**: 提供常用快捷按钮（搜索、筛选、导出）

### 3. API复用
- 大部分移动端页面可直接复用现有PC端API
- 考虑新增移动端专用的精简接口（返回更少字段）

---

## 五、统计总结

| 分类 | 已完成 | 待开发 | 合计 |
|------|--------|--------|------|
| **基础功能** | 7 | 0 | 7 |
| **咨询部** | 18 | 0 | 18 |
| **学术部** | 28 | 0 | 28 |
| **教质部** | 40+ | 0 | 40+ |
| **市场部** | 24 | 0 | 24 |
| **人资部** | 0 | 3(跳过-无API) | 3 |
| **系统配置** | 0 | 4(跳过-PC专用) | 4 |
| **日志中心** | 1 | 0 | 1 |
| **合计** | **118+** | **7(跳过)** | **125+** |

**完成率**: 约 94.4% (排除人资部mock数据页面和系统配置PC专用页面后实际完成率100%)

---

## 六、建议实施路线图

### Phase 1: 核心功能 (1-2周)
- ✅ 登录页响应式
- ✅ 移动端首页
- ✅ 数据统计看板
- ✅ 员工目录
- ✅ 通知中心
- ✅ 审批中心
- ✅ 咨询量录入
- ✅ 我的咨询量
- ✅ 咨询记录
- ✅ 就业目标与结果
- 🔲 班级就业明细

### Phase 2: 日常工作 (2-3周)
- ✅ 教员日工单
- ✅ 班主任日工单
- ✅ 每日咨询量汇总
- ✅ 各咨询师数据汇总
- ✅ 学员访谈记录
- ✅ 标准化检查（电话/当面/教员/班主任）

### Phase 3: 学员管理 (2-3周)
- 🔲 班级情况表
- ✅ 学员异动表
- ✅ 新生维稳统计
- ✅ 宿舍统计表
- ✅ 学籍管理表

### Phase 4: 数据报表 (按需实施)
- 🔲 各类月度/年度汇总表
- 🔲 各类计划表
- 🔲 各类分析表

---

## 七、参考文件
- [frontend/config/router/routes.ts](frontend/config/router/routes.ts) - 所有路由定义
- [frontend/config/ui/menuItems.tsx](frontend/config/ui/menuItems.tsx) - 菜单配置
- [frontend/pages/mobile/](frontend/pages/mobile/) - 现有移动端页面
- [CLAUDE.md](CLAUDE.md) - 项目架构文档
