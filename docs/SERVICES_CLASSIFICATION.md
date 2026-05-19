# 前端 Services 目录文件分类说明

本文档说明 `frontend/services/` 目录下各服务文件的模块归属。

## 模块分类

### 通用模块 [通用模块]

供所有模块使用的基础服务和公共功能。

| 文件名 | 描述 |
|--------|------|
| `api.ts` | API 基础服务，axios 实例配置 |
| `auth.ts` | 认证服务，登录、登出、token 管理 |
| `campus.ts` | 校区基础服务 |
| `configMaster.ts` | 配置主数据服务，校区、专业、班级、教员配置 |
| `dataService.ts` | 数据服务，通用数据操作 |

### 学术模块 [学术模块]

学术部相关业务服务，处理学术研究、学术管理等功能。

| 文件名 | 描述 |
|--------|------|
| `academic.ts` | 学术研究基础服务 - 论文、会议、科研项目 |
| `academicCampusReputationEnrollmentGoalsResults.ts` | 校区学术部口碑招生汇总表数据服务 |
| `academicDailyWorkSummary.ts` | 学术部日工作总结表服务 |
| `academicMeetingRecord.ts` | 校区学术管理数据会议记录表服务 |
| `academicStaffInterview.ts` | 学术部员工访谈记录服务 |
| `academicSummary.ts` | 学术部核心数据汇总表服务 |

### 教质模块 [教质模块]

教学质量部（教质部）相关业务服务，处理学员就业、口碑招生、维稳、宿舍管理等功能。

#### 核心数据汇总

| 文件名 | 描述 |
|--------|------|
| `campusCoreData.ts` | 校区教质部核心数据汇总表数据服务 |
| `campusCoreDataSummary.ts` | 校区教质部核心数据汇总表数据服务 |
| `managementCenterCoreData.ts` | 管理中心教质部核心数据汇总表数据服务 |

#### 学员就业

| 文件名 | 描述 |
|--------|------|
| `campusEmployment.ts` | 校区后端学员就业目标与结果汇总表数据服务 |
| `campusEmploymentGoalsResults.ts` | 校区后端学员就业目标与结果汇总表数据服务 |
| `managementCenterEmployment.ts` | 管理中心后端学员就业目标与结果汇总表数据服务 |
| `classEmploymentSummary.ts` | 班级就业总结服务 |
| `teacherEmploymentSummary.ts` | 校区后端教员就业汇总表服务 |
| `campusClassEmploymentInfo.ts` | 校区班级就业信息服务 |
| `employmentStar.ts` | 校区后端就业明星汇总表数据服务 |

#### 口碑招生

| 文件名 | 描述 |
|--------|------|
| `campusReputation.ts` | 校区教质部口碑招生目标与结果汇总表数据服务 |
| `campusReputationEnrollmentGoalsResults.ts` | 校区教质部口碑招生目标与结果汇总表数据服务 |
| `reputationEnrollment.ts` | 校区教质部口碑招生目标与结果汇总表数据服务 |
| `personalReputationEnrollment.ts` | 校区教质部口碑招生个人目标与结果汇总表数据服务 |
| `monthlyPersonalReputationEnrollment.ts` | 校区教质部口碑招生月度个人目标与结果汇总表数据服务 |
| `teachingQualityCampusReputationEnrollmentGoalsResults.ts` | 校区教质部口碑招生目标与结果汇总表数据服务 |
| `reputationKeyPoints.ts` | 口碑招生关键点服务 |
| `reputationSelfCheck.ts` | 口碑招生自查服务 |

#### 新生维稳

| 文件名 | 描述 |
|--------|------|
| `campusStability.ts` | 校区教质部新生当月维稳统计表数据服务 |
| `campusNewStudentStability.ts` | 校区教质部新生当月维稳统计表数据服务 |
| `newStudentStability.ts` | 校区教质部新生当月维稳统计表数据服务 |
| `newStudentStabilityDetail.ts` | 校区教质部新生当月维稳明细表数据服务 |
| `newStudentStabilityPersonal.ts` | 校区教质部新生维稳个人统计表数据服务 |
| `newStudentStabilityMonthlyPersonal.ts` | 校区教质部新生维稳月度个人统计表数据服务 |
| `outstandingFeesDetail.ts` | 校区教质部新生仍欠费明细表数据服务 |

#### 学员异动

| 文件名 | 描述 |
|--------|------|
| `campusFluctuation.ts` | 校区教质部学员异动表数据服务 |
| `campusStudentFluctuation.ts` | 校区教质部学员异动表数据服务 |
| `campusStudentMovement.ts` | 校区教质部学员异动表数据服务 |
| `personalStudentFluctuation.ts` | 校区教质部个人统计学员异动表数据服务 |
| `monthlyPersonalStudentFluctuation.ts` | 校区教质部月度个人统计学员异动表数据服务 |

#### 企业签约

| 文件名 | 描述 |
|--------|------|
| `campusContract.ts` | 校区教质部企业签约目标与结果汇总表数据服务 |
| `campusContractGoalsResults.ts` | 校区教质部企业签约目标与结果汇总表数据服务 |
| `contractSigningSummary.ts` | 校区教质部企业签约目标与结果汇总表数据服务 |
| `teacherContractSigning.ts` | 校区教质部班主任企业签约目标与结果汇总表数据服务 |
| `personalContractSigning.ts` | 校区教质部个人企业签约目标与结果汇总表数据服务 |

#### 升学计划

| 文件名 | 描述 |
|--------|------|
| `campusPromotion.ts` | 校区教质部升学计划数据服务 |
| `campusPromotionPlan.ts` | 校区教质部升学计划数据服务 |
| `promotionPlan.ts` | 校区教质部升学计划数据服务 |
| `personalPromotionTarget.ts` | 校区教质部个人升学目标与结果汇总表数据服务 |
| `monthlyPersonalPromotionTarget.ts` | 校区教质部月度个人升学目标与结果汇总表数据服务 |
| `monthlyClassPromotionTarget.ts` | 校区教质部月度班级升学目标与结果汇总表数据服务 |

#### 宿舍管理

| 文件名 | 描述 |
|--------|------|
| `campusDormitory.ts` | 校区教质部宿舍管理数据服务 |
| `campusDormitoryStatistics.ts` | 校区教质部现有宿舍统计表数据服务 |
| `dormitoryStatistics.ts` | 校区教质部现有宿舍统计表数据服务 |
| `personalDormitoryManagement.ts` | 校区教质部个人宿舍管理统计表数据服务 |
| `monthlyPersonalDormitoryManagement.ts` | 校区教质部每月个人宿舍管理统计表数据服务 |

#### 师资配比与招聘

| 文件名 | 描述 |
|--------|------|
| `campusTeacherRatio.ts` | 校区教质部师资配比表数据服务 |
| `teacherRatio.ts` | 校区教质部师资配比表数据服务 |
| `campusRecruitmentSummary.ts` | 校区教质部招聘计划与总结汇总表数据服务 |
| `recruitmentPlanSummary.ts` | 校区教质部招聘计划与总结汇总表数据服务 |

#### 培训与考核

| 文件名 | 描述 |
|--------|------|
| `campusTrainingPlan.ts` | 校区教质部培训计划与成绩汇总表数据服务 |
| `trainingPlanPerformance.ts` | 教质部培训计划与成绩汇总表数据服务 |
| `cultureExam.ts` | 企业文化考试计划表服务 |
| `culturePresentation.ts` | 企业文化宣讲计划表服务 |
| `standardizationCheck.ts` | 标准化检查服务 |

#### 教员功能分析

| 文件名 | 描述 |
|--------|------|
| `teacherFunctionAnalysis.ts` | 教员功能分析总表服务 |
| `teacherFunctionSubtable.ts` | 教员功能分析子表服务 |
| `teacherExamRate.ts` | 教员功能分析 - 班级/教员考试合格率服务 |
| `teacherProject.ts` | 教员功能分析 - 项目提交率/项目合格率服务 |
| `teacherSuperiorAudit.ts` | 教员功能分析上级听课表服务 |
| `teacherViolation.ts` | 教员功能分析学员违纪表服务 |
| `teacherHourStats.ts` | 教员课时统计服务 |

#### 经理功能分析

| 文件名 | 描述 |
|--------|------|
| `campusManagerAnalysis.ts` | 校区教质部经理、副经理功能分析表数据服务 |
| `staffFunctionAnalysis.ts` | 管理中心学术经理功能评价 API 服务 |

#### 学籍统计

| 文件名 | 描述 |
|--------|------|
| `campusEnrollmentStatistics.ts` | 校区教质部学籍统计表数据服务 |
| `campusPersonalEnrollmentStatistics.ts` | 校区教质部个人负责学籍统计表数据服务 |
| `campusStudentStatus.ts` | 校区教质部学生状态服务 |

#### 学员服务（成绩、满意度等）

| 文件名 | 描述 |
|--------|------|
| `service.ts` | 学员服务模块服务层 - 新生安排、压力面试、考试成绩、项目成绩、薪资预估、学员满意度 |
| `campusProjectPlan.ts` | 校区项目计划服务 |
| `studentSatisfaction.ts` | 学员满意度汇总表服务 |
| `studentSatisfactionDetails.ts` | 学员满意度明细表服务 |
| `studentInterviews.ts` | 学生访谈记录服务 |

#### KPI 与绩效

| 文件名 | 描述 |
|--------|------|
| `kpiResults.ts` | KPI 结果服务 |
| `kpiTeachers.ts` | KPI 教员服务 |
| `staffMonthlyPerformance.ts` | 员工月度绩效服务 |

### 市场模块 [市场模块]

市场部相关业务服务。

| 文件名 | 描述 |
|--------|------|
| `market.ts` | 市场投放数据服务 |
| `consulting.ts` | 咨询服务 |

---

## 注意事项

1. 文件首行已添加模块分类注释，格式为：`// [模块名] 服务描述`
2. 部分服务文件可能同时服务于多个模块，以主要功能进行分类
3. `academic/` 子目录为空目录，可删除或在后续需要时使用
4. `mock/` 子目录包含模拟数据服务，供开发测试使用

## 统计

| 模块 | 文件数量 |
|------|---------|
| 通用模块 | 5 |
| 学术模块 | 6 |
| 教质模块 | 74 |
| 市场模块 | 2 |
| **总计** | **87** |
