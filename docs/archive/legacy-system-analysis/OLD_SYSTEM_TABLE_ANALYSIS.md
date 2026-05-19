# 旧教务系统数据库表结构分析

> **分析来源**: PHP 控制器源码 (DooPHP 框架) + CSV 导出数据 + template_tags.php 枚举定义
> **数据快照日期**: 2026-02-09
> **表总计**: 25 张核心教务表

---

## 枚举值速查表

### TALK_TYPE — 学员访谈类型 (getDeanTalkTypeA)

| 值 | 含义 |
|----|------|
| `1` | 新学员访谈 |
| `2` | 常规访谈 |
| `3` | 问题学员访谈 |
| `4` | 家长访谈 |

### POINT_TYPE — 千分制扣分类型 (getDeanPointTypeA)

| 值 | 默认扣分 | 含义 | 类别 |
|----|----------|------|------|
| `punch_late` | 10 | 迟到 | 考勤 |
| `punch_leave` | 5 | 早退 | 考勤 |
| `punch_cut` | 40 | 旷课 | 考勤 |
| `punch_jia` | 10 | 请假2节 | 考勤 |
| `punch_jia2` | 20 | 请假4节 | 考勤 |
| `law_leav2` | 2 | 课间迟到 | 考勤 |
| `taidu_huhu` | 5 | 上课睡觉 | 学习态度 |
| `taidu_mobile` | 5 | 上课用手机 | 学习态度 |
| `taidu_homework` | 2 | 不交作业 | 学习态度 |
| `taidu_chao` | 10 | 抄袭作业 | 学习态度 |
| `taidu_guanli` | 50 | 不服从管理 | 学习态度 |
| `juzhi_ling` | 5 | 上课手机铃响 | 文明举止 |
| `juzhi_dajia` | 50 | 打架斗殴 | 文明举止 |
| `juzhi_zhanghua` | 5 | 说脏话 | 文明举止 |
| `juzhi_tutan` | 5 | 随地吐痰 | 文明举止 |
| `law_ka` | 2 | 不带胸卡 | 违反规定 |
| `law_game` | 20 | 机房玩游戏 | 违反规定 |
| `law_clean` | 5 | 不做卫生者 | 违反规定 |
| `law_jinjiaoji` | 20 | 禁止使用教师机 | 违反规定 |
| `law_zhiyezh` | 10 | 不穿职业装 | 违反规定 |
| `law_cangjuan` | 20 | 私藏试卷 | 违反规定 |
| `bujige_late` | 2 | 不及格者自习迟到 | 不及格补习 |
| `bujige_leave` | 5 | 不及格者自习早退 | 不及格补习 |
| `bujige_cut` | 20 | 不及格者自习旷课 | 不及格补习 |
| `other` | 自定义 | 其它 | — |

### LECTURE_TYPE — 听课类型 (getDeanLectureTypeA)

| 值 | 含义 |
|----|------|
| `new` | 新班听课 |
| `normal` | 常规听课 |
| `complain` | 投诉听课 |

### ENTER_TYPE — 入学类型 (getClassEnterTypeA)

| 值 | 含义 |
|----|------|
| `1` | 报名入学 |
| `2` | 休学入学（复学重新编入班级） |

### PATROL ACTION_CODE — 巡班行为代码 (getPatrolActionA)

| 代码 | 含义 | 对象 |
|------|------|------|
| `tready_01` | 教员是否提前5分钟到教室 | 教员 |
| `tready_02` | 是否课前检查电脑与投影能正常使用 | 教员 |
| `tready_03` | 课前是否准备白板、白板笔、板擦 | 教员 |
| `tready_04` | 课前软件是否下载完毕 | 教员 |
| `tlaw_05` | 教员是否维持课堂纪律 | 教员 |
| `tpunch_06` | 教员是否擅自离岗 | 教员 |
| `tpunch_07` | 教员是否早退 | 教员 |
| `ttuo_08` | 教员是否拖堂 | 教员 |
| `trule_09` | 教员是否关闭电脑和投影仪 | 教员 |
| `spunch_10` | 学员是否迟到 | 学员 |
| `sair_11` | 课堂学员是否睡觉 | 学员 |
| `sair_12` | 课堂学员是否玩游戏 | 学员 |
| `slaw_13` | 课堂学员是自由出入教室 | 学员 |
| `spose_14` | 不戴听课证 | 学员 |
| `spose_15` | 说脏话 | 学员 |
| `sair_16` | 开着电脑不上机的学员 | 学员 |
| `srule_17` | 把水和食物带入机房的 | 学员 |

---

## 模块 1: 学生档案

### s_student (学生档案表)

**业务含义**: 系统核心学生主表，存储学生的个人基本信息、联系方式、学历背景、就业意向等。一个学生在系统中只有一条记录，通过 STUDENT_NO 唯一标识。学生可同时在多个班级学习（通过 s_class_student 关联）。

**数据量**: 5,203 条记录

**所属模块**: 学生档案管理（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 1001 | 自增 |
| BRANCH_ID | 分校ID | 11, 12, 13, 14 | 11=盛邦, 12=冀美, 13=晋美, 14=首美 |
| STUDENT_NO | 学号 | SB2015001 | 分校前缀+年份+序号 |
| STATUS | 状态 | 0 | 详见 s_class_student.STATUS |
| FULL_NAME | 姓名 | 张三 | |
| PIN_YIN | 拼音 | zhangsan | 用于证书英文名 |
| SEX | 性别 | 1, 2 | 1=男, 2=女 |
| BIRTHDAY | 出生日期 | 1998-05-20 | |
| NATION | 民族 | 汉族 | |
| NATIVE_PLACE | 籍贯 | 河北石家庄 | |
| CITIZEN_ID | 身份证号 | 130102199805200011 | 唯一约束 |
| MOBILE | 手机号 | 13800138000 | |
| EMERGENCY_TEL | 紧急联系电话 | 13900139000 | |
| MEDIA_FROM | 来源渠道 | 1, 2, 3, 4 | 咨询来源媒体代码 |
| SITE_TREE | 地区编码 | 1301 | 关联 dic_site 地区字典树 |
| ADDRESS | 家庭地址 | 石家庄市裕华区... | |
| POST_CODE | 邮编 | 050000 | |
| EMAIL | 电子邮箱 | xx@qq.com | |
| QQ | QQ号 | 12345678 | |
| WEIXIN | 微信号 | wxid_xxx | |
| PHOTO_URL | 照片URL | /upload/photo/xxx.jpg | 学员照片 |
| EDUCATION | 学历 | 1~7 | 1=小学, 2=初中, 3=高中, 4=中专, 5=大专, 6=本科, 7=研究生及以上 |
| MAJOR | 专业 | 计算机科学 | 原学历专业 |
| SCHOOL | 毕业学校 | xx大学 | |
| GRADUATE_DATE | 毕业日期 | 2018-06-30 | |
| CERTIFICATE1 | 已有证书 | 英语四级 | |
| LIVE_STATUS | 当前状态 | 1~5 | 1=在读, 2=在职, 3=应届, 4=待业, 5=创业 |
| WORK_MONTHS | 工作月数 | 12 | |
| WORK_SALARY | 工作薪资 | 3000 | 入学前薪资 |
| WORK_NOTE | 工作备注 | | |
| PURPOSE_JOB | 意向职位 | Java开发工程师 | |
| PURPOSE_CITY1 | 意向城市1 | 北京 | |
| PURPOSE_CITY2 | 意向城市2 | 上海 | |
| PURPOSE_CITY3 | 意向城市3 | 深圳 | |
| FOUNDATION_TYPE | 基础类型 | | 入学基础水平 |
| LEARNED_COURSE | 已学课程 | | |
| STUDY_TARGET | 学习目标 | | |
| JOB_TARGET | 就业目标 | | |
| JOB_SITE_TREE | 就业地区 | | 关联 dic_site |
| JOB_JOB | 就业职位 | | |
| JOB_SALARY | 就业薪资 | 8000 | 就业后薪资 |
| JOB_COM | 就业公司 | XX科技有限公司 | |
| NOTE | 备注 | | |
| CREATE_TIME | 创建时间 | 2020-09-01 10:30:00 | |
| CITIZEN_PHOTO_URL | 身份证照片URL | /upload/citizen/xxx.jpg | |
| EDUCATION_PHOTO_URL | 学历证书照片URL | /upload/edu/xxx.jpg | |

---

## 模块 2: 班级学生关系

### s_class_student (班级学生关系表)

**业务含义**: 核心关联表，记录学生在某个班级中的学习状态、费用信息、考勤统计、访谈统计、千分制积分等。一个学生可能对应多条 class_student 记录（报名多门课程或转班后产生新记录）。是教务业务的中心表，被考勤、访谈、千分制、考试等子模块广泛引用。

**数据量**: 4,957 条记录

**所属模块**: 班级管理（教务模块）

**STATUS 枚举** (getClassStudentStatusA):

| 值 | 含义 |
|----|------|
| `0` | 正常（在学） |
| `5` | 毕业 |
| `6` | 已休学 |
| `9` | 已退学 |

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 1001 | 自增 |
| CLASS_ID | 班级ID | 50 | 关联 u_course_class |
| STUDENT_ID | 学生ID | 2001 | 关联 s_student.ID |
| BRANCH_ID | 分校ID | 11 | |
| STATUS | 状态 | 0, 5, 6, 9 | 见上方枚举 |
| ENTER_TYPE | 入学类型 | 1, 2 | 1=报名入学, 2=休学入学（复学重编班） |
| STUDENT_NO | 学号 | SB2015001 | 冗余存储，快速查询 |
| FULL_NAME | 姓名 | 张三 | 冗余存储 |
| SEX | 性别 | 1, 2 | 冗余存储 |
| COURSE_ID | 课程ID | 10 | 关联 u_course |
| CLASS_TITLE | 班级名称 | BCSP2024-01 | 冗余存储 |
| PAY_TYPE | 缴费方式 | | |
| BOOK_ID | 收据ID | 3001 | 关联 s_branch_book 财务收据 |
| TOTAL_MONEY | 总费用 | 25800.00 | 应缴学费总额 |
| PAYED_MONEY | 已缴费用 | 25800.00 | 实际已缴金额 |
| REST_NUM | 休学次数 | 0, 1 | 累计休学次数 |
| TRANS_NUM | 转班次数 | 0, 1 | 累计转班次数 |
| NOTE | 备注 | | |
| CREATE_TIME | 创建时间 | 2024-03-01 | 即入学日期 |
| CHANGE_NUM | 异动次数 | 0 | 总异动（休+转+退）次数 |
| TALK_NUM_STUDENT | 学生访谈次数 | 3 | 计数器，TALK_TYPE<4 时+1 |
| TALK_NUM_PARENT | 家长访谈次数 | 1 | 计数器，TALK_TYPE=4 时+1 |
| TOTAL_POINT | 千分制总扣分 | 45 | 累计扣除千分制分数 |
| HOMEWORK_POST_NUM | 作业提交次数 | 10 | |
| PUNISH_NUM | 处罚次数 | 2 | |
| DIRECT_STR | 课程方向 | java | 专业方向标识 |
| TMP_FLAG | 临时标记 | | 业务临时字段 |
| JOB_DATE | 就业日期 | 2024-12-01 | |
| JOB_FLAG | 就业标记 | | |
| JOB_COM | 就业单位 | XX科技 | |
| JOB_SALARY_TEST | 试用期薪资 | 6000 | |
| JOB_SALARY | 转正薪资 | 8000 | |
| JOB_POSITION | 就业职位 | Java开发 | |
| JOB_SITE | 就业城市 | 北京 | |
| JOB_NUM | 就业编号 | | |

---

## 模块 3: 学籍异动

### s_change_trans (转班记录表)

**业务含义**: 记录学生的转班（含跨校区转班）操作。保存转班前后的班级、课程、价格等完整快照，支持审批流程。转班通过后，旧 class_student 记录标记删除，创建新 class_student 记录。跨校区转班时 NEW_BRANCH_ID ≠ BRANCH_ID。

**数据量**: 1,240 条记录

**所属模块**: 学籍异动（教务模块）

**STATUS 枚举** (getTransStatusA):

| 值 | 含义 |
|----|------|
| `1` | 转班申请 |
| `2` | 批准转班 |
| `6` | 不许转班 |
| `9` | 删除 |

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 100 | 自增 |
| BRANCH_ID | 原分校ID | 11 | 申请人所在分校 |
| STATUS | 审批状态 | 1, 2, 6, 9 | 见上方枚举 |
| TRANS_DATE | 转班日期 | 2024-06-15 | |
| OLD_CLASS_TITLE | 原班级名称 | BCSP2024-01 | |
| OLD_COURSE_ID | 原课程ID | 10 | |
| OLD_CLASS_ID | 原班级ID | 50 | |
| OLD_GONE_HOURS | 原班已上课时 | 120 | |
| OLD_TOTAL_HOURS | 原班总课时 | 300 | |
| OLD_BEGIN_DATE | 原班开班日期 | 2024-03-01 | |
| OLD_PRICE | 原班报价 | 15800 | |
| NEW_BRANCH_ID | 新分校ID | 12 | 跨校区转班时不同于 BRANCH_ID |
| NEW_CLASS_TITLE | 新班级名称 | BCSP2024-03 | |
| NEW_COURSE_ID | 新课程ID | 10 | |
| NEW_CLASS_ID | 新班级ID | 55 | |
| NEW_TOTAL_HOURS | 新班总课时 | 300 | |
| NEW_BEGIN_DATE | 新班开班日期 | 2024-05-01 | |
| NEW_PRICE | 新班报价 | 15800 | |
| STUDENT_ID | 学生ID | 2001 | 关联 s_student.ID |
| FULL_NAME | 学生姓名 | 张三 | 冗余存储 |
| PAYMENT | 差价金额 | 0, 2000 | 正数=需补缴, 负数=可退 |
| BOOK_ID | 收据ID | 3100 | 关联 s_branch_book |
| APPROVE_USER_NAME | 审批人 | admin | |
| APPROVE_TIME | 审批时间 | 2024-06-16 | |
| USER_NAME | 申请人 | teacher01 | |
| NOTE | 申请说明 | 学生要求转到下午班 | |
| APPROVE_NOTE | 审批说明 | 同意 | |
| CREATE_TIME | 创建时间 | 2024-06-15 10:00:00 | |

---

### s_change_quit (退学记录表)

**业务含义**: 记录学生退学操作。包含退学原因分类、费用退还计算（按已消课时比例）。审批通过后，对应的 class_student.STATUS 更新为 9（已退学）。

**数据量**: 78 条记录

**所属模块**: 学籍异动（教务模块）

**STATUS 枚举** (getQuitStatusA):

| 值 | 含义 |
|----|------|
| `1` | 退学申请 |
| `2` | 批准退学 |
| `6` | 不许退学 |
| `9` | 删除 |

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 50 | 自增 |
| BRANCH_ID | 分校ID | 11 | |
| STATUS | 审批状态 | 1, 2, 6, 9 | 见上方枚举 |
| REASON_TYPE | 退学原因分类 | | 原因编码 |
| QUIT_DATE | 退学日期 | 2024-08-10 | |
| BEGIN_DATE | 开班日期 | 2024-03-01 | 该班开班时间 |
| TOTAL_HOURS | 总课时 | 300 | |
| GONE_HOURS | 已消课时 | 150 | |
| STUDENT_ID | 学生ID | 2001 | 关联 s_student.ID |
| FULL_NAME | 学生姓名 | 张三 | 冗余存储 |
| COURSE_ID | 课程ID | 10 | |
| CLASS_ID | 班级ID | 50 | |
| CLASS_TITLE | 班级名称 | BCSP2024-01 | 冗余存储 |
| CHARGE_MONEY | 应收学费 | 25800 | 合同总金额 |
| PAYED_MONEY | 已交学费 | 25800 | |
| BOOK_ID | 收据ID | 3001 | 关联 s_branch_book |
| BACK_MONEY | 退还金额 | 12900 | 按比例计算的退款 |
| APPROVE_USER_NAME | 审批人 | admin | |
| APPROVE_TIME | 审批时间 | 2024-08-11 | |
| USER_NAME | 申请人 | teacher01 | |
| NOTE | 申请说明 | 学生个人原因退学 | |
| APPROVE_NOTE | 审批说明 | 同意退学 | |
| CREATE_TIME | 创建时间 | 2024-08-10 09:00:00 | |

---

### s_change_rest (休学/复学记录表)

**业务含义**: 记录学生的休学和复学全生命周期。一条记录包含完整的 休学申请→休学审批→复学申请→复学审批 四阶段信息。复学时需重新分配班级（NEW_CLASS_ID），并创建新的 class_student 记录（ENTER_TYPE=2）。支持延期操作（关联 s_change_rest_delay）。

**数据量**: 183 条记录

**所属模块**: 学籍异动（教务模块）

**STATUS 枚举** (getRestStatusA):

| 值 | 含义 |
|----|------|
| `1` | 休学申请 |
| `2` | 批准休学 |
| `3` | 复学申请 |
| `4` | 批准复学 |
| `6` | 不许休学 |
| `7` | 不许复学 |
| `9` | 删除 |

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 80 | 自增 |
| BRANCH_ID | 分校ID | 11 | |
| STATUS | 状态 | 1~4, 6, 7, 9 | 见上方枚举，覆盖休学+复学流程 |
| STUDENT_ID | 学生ID | 2001 | 关联 s_student.ID |
| FULL_NAME | 学生姓名 | 张三 | 冗余存储 |
| COURSE_ID | 课程ID | 10 | |
| OLD_CLASS_TITLE | 原班级名称 | BCSP2024-01 | |
| OLD_CLASS_ID | 原班级ID | 50 | |
| OLD_GONE_HOURS | 原班已上课时 | 100 | |
| OLD_TOTAL_HOURS | 原班总课时 | 300 | |
| OLD_BEGIN_DATE | 原班开班日期 | 2024-03-01 | |
| OLD_PRICE | 原班报价 | 15800 | |
| NEW_CLASS_TITLE | 复学班级名称 | BCSP2024-05 | 复学审批时填写 |
| NEW_CLASS_ID | 复学班级ID | 60 | 复学审批时填写 |
| NEW_TOTAL_HOURS | 复学班总课时 | 300 | |
| NEW_BEGIN_DATE | 复学班开班日期 | 2024-09-01 | |
| NEW_PRICE | 复学班报价 | 15800 | |
| PAYMENT | 差价金额 | 0 | 复学涉及的可能补差 |
| PAY_ID | 缴费ID | | 差价缴费记录 |
| REST_DATE | 休学起始日期 | 2024-06-01 | |
| REST_DATE_END | 休学截止日期 | 2024-12-01 | 可能被延期修改 |
| REST_USER_NAME | 休学申请人 | teacher01 | |
| REST_NOTE | 休学说明 | 家中有事 | |
| REST_APPROVE_TIME | 休学审批时间 | 2024-06-02 | |
| REST_APPROVE_USER_NAME | 休学审批人 | admin | |
| REST_APPROVE_NOTE | 休学审批说明 | 同意 | |
| BACK_DATE | 复学日期 | 2024-09-15 | |
| BACK_USER_NAME | 复学申请人 | teacher01 | |
| BACK_NOTE | 复学说明 | 学生要求复学 | |
| BACK_APPROVE_TIME | 复学审批时间 | 2024-09-16 | |
| BACK_APPROVE_USER_NAME | 复学审批人 | admin | |
| BACK_APPROVE_NOTE | 复学审批说明 | 同意复学 | |
| CREATE_TIME | 创建时间 | 2024-06-01 10:00:00 | |
| DELAY_NUM | 延期次数 | 0, 1 | 休学延期次数计数 |
| REST_DATE_END_FIRST | 首次休学截止日 | 2024-12-01 | 延期前的原始截止日，不会被修改 |

---

### s_change_rest_delay (休学延期记录表)

**业务含义**: 记录休学延期操作的明细。每次延期向 s_change_rest 更新 REST_DATE_END 和 DELAY_NUM+1，同时插入一条 delay 记录保存延期历史。

**数据量**: 8 条记录

**所属模块**: 学籍异动（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 5 | 自增 |
| REST_ID | 休学记录ID | 80 | 关联 s_change_rest.ID |
| REST_DATE_END | 新截止日期 | 2025-03-01 | 延期后的新截止日 |
| REST_NOTE | 延期说明 | 需继续休养 | |
| REST_USER_NAME | 操作人 | teacher01 | |
| CREATE_TIME | 创建时间 | 2024-11-20 | |

---

## 模块 4: 考试管理

### s_dean_exam (考试主表)

**业务含义**: 考试场次主记录。由教务审批考试申请后自动创建，聚合同一日期、同一考试代码的多个班级申请为一场考试。一场考试可包含多个教室（s_dean_exam_classroom）和多个参考学生（s_dean_exam_student）。

**数据量**: 114 条记录

**所属模块**: 考试管理（教务模块）

**STATUS 枚举** (getExamStatusA):

| 值 | 含义 |
|----|------|
| `0` | 已审核（初始状态） |
| `1` | 已布置考场 |
| `2` | 已出监考报告 |
| `3` | 成绩已录入 |

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 200 | 自增 |
| BRANCH_ID | 分校ID | 11 | |
| STATUS | 考试进度状态 | 0~3 | 见上方枚举 |
| EXAM_CODE_ID | 考试代码ID | 5 | 关联 s_dean_exam_code.ID |
| EXAM_TITLE | 考试名称 | 高级软件工程师认证考试 | |
| EXAM_DATE | 考试日期 | 2024-12-20 | |
| BEGIN_TIME | 开始时间 | 09:00 | |
| END_TIME | 结束时间 | 11:00 | |
| STUDENT_NUM | 参考人数 | 45 | |
| USER_NAME | 创建人/组织人 | admin | |
| CLASSROOM_NUM | 考场数量 | 2 | |
| CREATE_TIME | 创建时间 | 2024-12-01 | |

---

### s_dean_exam_apply (考试申请表)

**业务含义**: 班主任为本班学生提交的考试申请。指定考试代码、考试日期和参考学生。审核通过后，系统会自动匹配或创建 s_dean_exam 记录，并将 EXAM_ID 回写到申请记录上。

**数据量**: 161 条记录

**所属模块**: 考试管理（教务模块）

**STATUS 枚举** (getExamApplyStatusA):

| 值 | 含义 |
|----|------|
| `0` | 未审核 |
| `1` | 已审核（通过） |
| `7` | 审核不通过 |

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 300 | 自增 |
| BRANCH_ID | 分校ID | 11 | |
| EXAM_ID | 考试ID | 200 | 审核通过后回写，关联 s_dean_exam.ID |
| STATUS | 审核状态 | 0, 1, 7 | 见上方枚举 |
| COURSE_ID | 课程ID | 10 | |
| CLASS_ID | 班级ID | 50 | |
| CLASS_TITLE | 班级名称 | BCSP2024-01 | 冗余存储 |
| EXAM_CODE_ID | 考试代码ID | 5 | 关联 s_dean_exam_code.ID |
| TITLE | 申请标题 | BCSP2024-01高级软件工程师认证 | |
| EXAM_DATE | 考试日期 | 2024-12-20 | |
| APPLY_STUDENT_NUM | 报名人数 | 30 | |
| USER_NAME | 申请人(班主任) | head01 | |
| APPLY_TIME | 申请时间 | 2024-11-20 | |
| APPLY_NOTE | 申请说明 | | |
| APPROVE_USER_NAME | 审批人 | admin | |
| APPROVE_TIME | 审批时间 | 2024-11-25 | |
| APPROVE_NOTE | 审批说明 | | |
| CLASSROOM_STR | 考场分配JSON | {"classroom_id":1,...} | 布置考场时写入 |

---

### s_dean_exam_student (考试学生记录表)

**业务含义**: 每个参考学生的考试详细记录，包含考场座位分配、考试费用、考试成绩。EXAM_INDEX 字段标识本门考试是该学生的第几次考（首考=1，补考=2, 第三次及以上需额外收费）。成绩录入后 STATUS 更新为 4，缺考标记为 7。

**数据量**: 1,707 条记录

**所属模块**: 考试管理（教务模块）

**STATUS 枚举**:

| 值 | 含义 |
|----|------|
| `0` | 初始（已报名） |
| `4` | 已录入成绩 |
| `7` | 缺考 |

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 5000 | 自增 |
| BRANCH_ID | 分校ID | 11 | |
| STATUS | 状态 | 0, 4, 7 | 见上方枚举 |
| EXAM_ID | 考试ID | 200 | 关联 s_dean_exam.ID |
| EXAM_APPLY_ID | 考试申请ID | 300 | 关联 s_dean_exam_apply.ID |
| EXAM_CODE_ID | 考试代码ID | 5 | 关联 s_dean_exam_code.ID |
| IS_PAYED | 是否已缴费 | 0, 1 | 考试费缴纳状态 |
| EXAM_INDEX | 考试次数 | 1, 2, 3 | 1=首考, 2=补考, 3+=多次补考(需加收费用) |
| EXAM_FEE | 考试费用 | 0, 160 | 首考一般为0，补考按exam_code价格 |
| IS_CHECK_IN | 是否签到 | 0, 1 | 考试当天签到 |
| EXAM_SCORE | 考试成绩 | 85 | |
| SCORE_DATE | 录分日期 | 2024-12-25 | |
| STUDENT_ID | 学生ID | 2001 | 关联 s_student.ID |
| STUDENT_NO | 学号 | SB2015001 | 冗余存储 |
| STUDENT_NAME | 学生姓名 | 张三 | 冗余存储 |
| PAYMENT | 缴费方式 | | |
| NOTE | 备注 | | |
| CREATE_TIME | 创建时间 | 2024-11-20 | |
| CLASSROOM_ID | 考场教室ID | 3 | 布置考场时分配 |
| CLASSROOM_TITLE | 考场名称 | 301教室 | 冗余存储 |
| SEAT_NO | 座位号 | 15 | 布置考场时分配 |
| CLASS_ID | 班级ID | 50 | 冗余存储 |
| COURSE_ID | 课程ID | 10 | 冗余存储 |
| CLASS_TITLE | 班级名称 | BCSP2024-01 | 冗余存储 |
| HEAD_TEACHER_NAME | 班主任 | head01 | |
| TOTAL_MONEY | 学费总额 | 25800 | |
| PAYED_MONEY | 已缴学费 | 25800 | |
| LICENCE_FEE | 认证费 | 160 | 认证考试费用 |

---

### s_dean_exam_code (考试代码表)

**业务含义**: 定义系统中所有可选的考试/认证类型及其价格。每条记录代表一种认证考试（如"高级软件工程师"、"网络工程师"）或结业考试，附带补考收费标准。通过 HEAD_ID 关联到考试类别。

**数据量**: 13 条记录

**所属模块**: 考试管理-基础数据（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 1~13 | 自增 |
| HEAD_ID | 类别ID | 1, 2, 10, 11, 12, 13 | 关联 s_dean_exam_code_head.ID |
| STATUS | 状态 | 1 | 1=有效 |
| TITLE | 考试名称 | 高级软件工程师, 网络工程师, PS, 3D建筑 | |
| PRICE | 补考费用(元) | 0, 160 | 首考免费，补考按此价格收费 |
| SORT_NO | 排序号 | 10, 20, 30 | 列表显示排序 |
| NOTE | 备注 | | |
| CREATE_TIME | 创建时间 | 2019-01-01 | |

**完整数据**:

| ID | HEAD_ID | TITLE | PRICE |
|----|---------|-------|-------|
| 1 | 1 | 高级软件工程师 | 160 |
| 2 | 2 | 网络工程师 | 160 |
| 3 | 2 | 高级网络工程师 | 160 |
| 4 | 2 | 信息安全工程师 | 160 |
| 5 | 1 | 结业考试 | 0 |
| 6 | 11 | PS | 0 |
| 7 | 11 | 3D建筑 | 0 |
| 8 | 11 | 3D游戏美工 | 0 |
| 9 | 10 | maya模型材质 | 0 |
| 10 | 10 | maya动画特效 | 0 |
| 11 | 10 | 后期 | 0 |
| 12 | 12 | 结业考试(UI) | 0 |
| 13 | 13 | 结业考试(建筑) | 0 |

---

### s_dean_exam_code_head (考试类别表)

**业务含义**: 考试代码的分类头表，将考试代码按专业方向归类。

**数据量**: 6 条记录

**所属模块**: 考试管理-基础数据（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 1~13 | |
| STATUS | 状态 | 1 | 1=有效 |
| TITLE | 类别名称 | java软件, 网络, 影视后期, CG设计大师, UI设计师, 建筑表现 | |
| SORT_NO | 排序号 | 10~60 | |
| NOTE | 备注 | | |
| CREATE_TIME | 创建时间 | 2019-01-01 | |

**完整数据**:

| ID | TITLE |
|----|-------|
| 1 | java软件 |
| 2 | 网络 |
| 10 | 影视后期 |
| 11 | CG设计大师 |
| 12 | UI设计师 |
| 13 | 建筑表现 |

---

### s_dean_exam_classroom (考试考场表)

**业务含义**: 考试场次与教室的关联表，记录每间考场的监考教员和学生人数。一场考试可占用多间教室，每间教室可分配主监考和副监考。

**数据量**: 30 条记录

**所属模块**: 考试管理（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 100 | 自增 |
| EXAM_ID | 考试ID | 200 | 关联 s_dean_exam.ID |
| CLASSROOM_ID | 教室ID | 3 | 关联教室基础数据 |
| STATUS | 状态 | 1 | 1=有效 |
| CLASSROOM_TITLE | 教室名称 | 301教室 | 冗余存储 |
| TEACHER_USER_NAME | 主监考教员 | teacher01 | |
| TEACHER_USER_NAME2 | 副监考教员 | teacher02 | |
| NOTE | 监考报告/备注 | | 考后填写监考报告 |
| NOTE_USER_NAME | 报告填写人 | teacher01 | |
| STUDENT_NUM | 考场学生人数 | 25 | |

---

## 模块 5: 考勤管理

### s_dean_punch (班级考勤统计表)

**业务含义**: 按班级+日期维度的考勤统计汇总表（非逐人明细）。每条记录是某一天某个班的考勤情况：迟到/早退/旷课/请假人数统计。考勤分为上午(后缀1)和下午(后缀2)两个时段。班主任每日填报。

**数据量**: 25,019 条记录

**所属模块**: 日常考勤（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 10000 | 自增 |
| BRANCH_ID | 分校ID | 11 | |
| COURSE_ID | 课程ID | 10 | |
| CLASS_ID | 班级ID | 50 | |
| CLASS_TITLE | 班级名称 | BCSP2024-01 | 冗余存储 |
| PUNCH_DATE | 考勤日期 | 2024-12-20 | |
| STUDENT_NUM | 总人数 | 40 | 当日在册学生数 |
| LATE1_NUM | 上午迟到人数 | 2 | |
| LEAVE1_NUM | 上午早退人数 | 0 | |
| CUT1_NUM | 上午旷课人数 | 1 | |
| JIA1_NUM | 上午请假人数(≤2节) | 3 | punch_jia 类型 |
| LATE2_NUM | 下午迟到人数 | 1 | |
| LEAVE2_NUM | 下午早退人数 | 0 | |
| CUT2_NUM | 下午旷课人数 | 0 | |
| JIA2_NUM | 下午请假人数(4节) | 1 | punch_jia2 类型 |
| JIA3_NUM | 病假人数 | 0 | punch_jia3 类型(全天) |
| USER_NAME | 填报人 | head01 | 班主任 |
| NOTE | 备注 | | |
| CREATE_TIME | 创建时间 | 2024-12-20 17:00:00 | |
| UPDATE_TIME | 更新时间 | 2024-12-20 18:00:00 | |

**考勤类型与千分制联动**: 保存考勤时，系统自动按类型在 s_dean_point 中生成对应的千分制扣分记录（punch_late=10分, punch_leave=5分, punch_cut=40分, punch_jia=10分, punch_jia2=20分）。

---

## 模块 6: 巡班管理

### s_dean_patrol (巡班记录表)

**业务含义**: 教务巡班检查记录。巡班人员对每个班级的课堂进行巡查，记录发现的问题和解决方案。每次巡班记录关联多条 s_dean_patrol_action（具体行为观察项）。

**数据量**: 106,926 条记录

**所属模块**: 教学质量管理（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 50000 | 自增 |
| STATUS | 状态 | 1 | 1=有效 |
| OCCUR_TIME | 巡班时间 | 2024-12-20 10:30:00 | |
| BRANCH_ID | 分校ID | 11 | |
| COURSE_ID | 课程ID | 10 | |
| CLASS_ID | 班级ID | 50 | |
| CLASS_TITLE | 班级名称 | BCSP2024-01 | 冗余存储 |
| TEACHER_ID | 教员ID | 100 | 当堂授课教员 |
| TEACHER_NAME | 教员姓名 | 王老师 | 冗余存储 |
| TROUBLE | 发现问题 | 3名学生上课玩手机 | |
| SOLUTION | 解决方案 | 已提醒，并扣除千分制 | |
| USER_NAME | 巡班人 | dean01 | |
| NOTE | 备注 | | |
| CREATE_TIME | 创建时间 | 2024-12-20 | |
| ACTION_NUM | 行为观察数量 | 5 | 关联 patrol_action 记录数 |

---

### s_dean_patrol_action (巡班行为观察明细表)

**业务含义**: 巡班时针对每个检查项的观察结果。ACTION_CODE 对应 getPatrolActionA() 中定义的标准化行为代码，以 `t` 前缀表示教员行为，`s` 前缀表示学员行为。

**数据量**: 88 条记录

**所属模块**: 教学质量管理（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 500 | 自增 |
| PATROL_ID | 巡班记录ID | 50000 | 关联 s_dean_patrol.ID |
| OCCUR_DATE | 发生日期 | 2024-12-20 | |
| BRANCH_ID | 分校ID | 11 | |
| CLASS_ID | 班级ID | 50 | |
| TEACHER_ID | 教员ID | 100 | |
| ACTION_CODE | 行为代码 | srule_17, sair_11, spunch_10 | 见"巡班行为代码"枚举表 |

---

## 模块 7: 千分制管理

### s_dean_point (千分制扣分记录表)

**业务含义**: 学生千分制考核明细记录。每条记录对应一次扣分事件，POINT_TYPE 标识扣分原因类型（来自考勤自动生成或手动录入），POINT_NUM 为扣除分数。可逻辑删除（STATUS=9）。学生的 TOTAL_POINT 为所有有效扣分记录之和。

**数据量**: 21,329 条记录

**所属模块**: 千分制考核（教务模块）

**STATUS 枚举**:

| 值 | 含义 |
|----|------|
| `1` | 有效 |
| `9` | 已删除（逻辑删除） |

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 30000 | 自增 |
| STATUS | 状态 | 1, 9 | 1=有效, 9=已删除 |
| BRANCH_ID | 分校ID | 11 | |
| CLASS_ID | 班级ID | 50 | |
| STUDENT_ID | 学生ID | 2001 | 关联 s_student.ID |
| STUDENT_NAME | 学生姓名 | 张三 | 冗余存储 |
| POINT_TYPE | 扣分类型 | punch_late, taidu_homework, other | 见"POINT_TYPE枚举表" |
| PUNISH_TIME | 处罚时间 | 2024-12-20 | |
| POINT_NUM | 扣除分数 | 10 | 正数表示扣分 |
| USER_NAME | 操作人 | head01 | |
| NOTE | 备注/原因 | 上课迟到15分钟 | `other`类型时为手动填写 |
| CREATE_TIME | 创建时间 | 2024-12-20 | |
| MODEL_ID | 模型ID | | 可能关联其他业务模块 |

**数据来源**: 
1. **考勤自动生成**: 保存 s_dean_punch 时，系统按迟到/早退/旷课人数自动批量插入对应的 point 记录
2. **手动录入**: 班主任在千分制管理界面选择扣分类型或自定义(other)录入

---

## 模块 8: 学员访谈

### s_dean_talk (学员访谈记录表)

**业务含义**: 班主任与学生或家长的访谈记录。TALK_TYPE 区分访谈类型（新学员/常规/问题学员/家长），每次访谈记录问题发现和解决方案。保存时自动更新 class_student 的 TALK_NUM_STUDENT 或 TALK_NUM_PARENT 计数。

**数据量**: 32,048 条记录

**所属模块**: 学员管理（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 40000 | 自增 |
| BRANCH_ID | 分校ID | 11 | |
| CLASS_ID | 班级ID | 50 | |
| STUDENT_ID | 学生ID | 2001 | 关联 s_student.ID |
| TALK_TYPE | 访谈类型 | 1, 2, 3, 4 | 1=新学员, 2=常规, 3=问题学员, 4=家长 |
| BEGIN_TIME | 访谈时间 | 2024-12-20 14:00:00 | |
| CHAT_MINUTE | 访谈时长(分钟) | 30 | |
| TROUBLE | 发现问题 | 学习进度落后 | |
| CONTENT | 访谈内容 | 了解学生学习困难原因... | |
| SOLUTION | 解决方案 | 安排课后辅导 | |
| USER_NAME | 访谈人(班主任) | head01 | |
| CREATE_TIME | 创建时间 | 2024-12-20 | |

**计数逻辑**: TALK_TYPE < '4' → class_student.TALK_NUM_STUDENT += 1; TALK_TYPE = '4' → class_student.TALK_NUM_PARENT += 1

---

## 模块 9: 听课管理

### s_dean_lecture (听课记录表)

**业务含义**: 教务人员对教员授课的课堂观摩/听课记录。区分新班听课、常规听课、投诉听课三种类型。记录听课时长、课堂违纪情况（迟到/早退/旷课人数）和听课评价内容。

**数据量**: 849 条记录

**所属模块**: 教学质量管理（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 800 | 自增 |
| BRANCH_ID | 分校ID | 11 | |
| COURSE_ID | 课程ID | 10 | |
| CLASS_ID | 班级ID | 50 | |
| CLASS_TITLE | 班级名称 | BCSP2024-01 | 冗余存储 |
| LECTURE_TYPE | 听课类型 | new, normal, complain | 见"LECTURE_TYPE枚举表" |
| BEGIN_TIME | 听课开始时间 | 2024-12-20 09:00:00 | |
| MINUTE_NUM | 听课时长(分钟) | 45 | |
| TITLE | 听课主题 | Java基础-面向对象 | 授课主题 |
| LATE_NUM | 迟到学生数 | 2 | |
| LEAVE_NUM | 早退学生数 | 0 | |
| CUT_NUM | 旷课学生数 | 1 | |
| CONTENT | 听课评价/记录 | 教学内容清晰，互动较好... | |
| USER_NAME | 听课人(教务) | dean01 | |
| CREATE_TIME | 创建时间 | 2024-12-20 | |
| TEACHER_USER_NAME | 被听课教员 | teacher01 | |

---

## 模块 10: 作业管理

### s_dean_homework (作业提交记录表)

**业务含义**: 学生作业的提交和批改记录。关联课程单元(UNIT_ID)和测试(TEST_ID)。记录提交时间、文档URL、批改分数。未按时提交作业会触发千分制扣分（taidu_homework）。

**数据量**: 0 条记录（仅表头，无数据）

**所属模块**: 教学管理（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | | 自增 |
| STATUS | 状态 | | |
| BRANCH_ID | 分校ID | | |
| COURSE_ID | 课程ID | | |
| CLASS_ID | 班级ID | | |
| STUDENT_ID | 学生ID | | 关联 s_student.ID |
| UNIT_ID | 课程单元ID | | 关联 u_course_unit |
| TEST_ID | 测试ID | | |
| BEGIN_TIME | 布置时间 | | |
| HOMEWORK_POST_TIME | 要求提交截止时间 | | |
| DOC_URL | 作业文档URL | | 上传附件地址 |
| POST_TIME | 实际提交时间 | | |
| SCORE_TIME | 批改时间 | | |
| SCORE | 作业得分 | | |
| USER_NAME | 操作人 | | |
| CREATE_TIME | 创建时间 | | |
| POINT_NUM | 扣分分数 | | 关联千分制扣分 |
| PUNISH_TIME | 处罚时间 | | |

---

## 模块 11: 证书管理

### s_certificate (证书记录表)

**业务含义**: 学员获得的认证证书记录。通过考试后由教务录入证书编号，关联考试代码(EXAM_CODE_ID)和学生身份信息。支持证书查询（含查询次数统计）。

**数据量**: 918 条记录

**所属模块**: 证书管理（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 600 | 自增 |
| CERTIFICATE_NO | 证书编号 | OSTA-20241201-001 | 唯一标识 |
| CITIZEN_ID | 身份证号 | 130102199805200011 | 持证人身份证 |
| BRANCH_ID | 分校ID | 11 | |
| EXAM_CODE_ID | 考试代码ID | 1 | 关联 s_dean_exam_code.ID |
| STUDENT_ID | 学生ID | 2001 | 关联 s_student.ID |
| STUDENT_NO | 学号 | SB2015001 | |
| STATUS | 状态 | 1 | 1=有效 |
| FULL_NAME | 学生姓名 | 张三 | |
| PIN_YIN | 拼音 | zhangsan | 证书英文名 |
| SEX | 性别 | 1, 2 | |
| CERTIFICATE_DATE | 发证日期 | 2024-12-25 | |
| VIEW_NUM | 查询次数 | 5 | 证书被查询的次数 |
| USER_NAME | 录入人 | admin | |
| TITLE | 证书名称 | 高级软件工程师 | |
| NOTE | 备注 | | |
| CREATE_TIME | 创建时间 | 2024-12-25 | |
| UPDATE_TIME | 更新时间 | 2024-12-26 | |

---

## 模块 12: 宿舍管理

### s_hall (宿舍房间表)

**业务含义**: 宿舍/公寓房间基础信息表。记录每间宿舍的地址、面积、床位数、租金价格、房东联系方式及租赁合同信息（房东押金、付款周期等）。IS_PAY_CREATE 标识是否已初始化月度付款计划。

**数据量**: 40 条记录

**所属模块**: 宿舍管理（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 20 | 自增 |
| IS_VALID | 是否有效 | 1, 0 | 1=有效, 0=已停用 |
| BRANCH_ID | 分校ID | 11 | |
| PRICE | 学员月租金(元) | 500 | 向学员收取的每月租金 |
| TITLE | 房间编号/名称 | A栋201 | |
| ADDRESS | 地址 | 石家庄市裕华区xx路xx号 | |
| AREA | 面积(㎡) | 25 | |
| LOFT_TYPE | 楼层类型 | 2 | |
| BED_NUM | 床位数 | 6 | |
| IN_NUM | 已入住人数 | 4 | 当前实际入住 |
| BEGIN_DATE | 租赁开始日期 | 2023-01-01 | 与房东签约日期 |
| END_DATE | 租赁结束日期 | 2025-12-31 | |
| LANDLORD_CONTACT | 房东联系方式 | 13800138000 | |
| LANDLORD_PRICE | 房东租金(元/月) | 3000 | 付给房东的月租 |
| LANDLORD_NOTE | 房东备注 | | |
| CREATE_TIME | 创建时间 | 2023-01-01 | |
| NOTE | 备注 | | |
| LANDLORD_DEPOSIT | 房东押金 | 6000 | 押N付M中的押金 |
| LANDLORD_PAY_MONTH | 付款月数 | 3 | 每N个月付一次房东租金 |
| LANDLORD_PAY_DAY | 付款日 | 1 | 每月几号付款 |
| IS_PAY_CREATE | 是否已创建付款计划 | 0, 1 | 标识是否已初始化月度水电费记录 |
| USER_NAME | 创建人 | admin | |

---

### s_hall_rent (宿舍租住记录表)

**业务含义**: 学生宿舍入住/退宿记录。每条记录对应一个学生在某宿舍某床位的租住情况，包含租期、费用和支付状态。退宿时 STATUS 改为 6，设置 END_DATE。

**数据量**: 1,058 条记录

**所属模块**: 宿舍管理（教务模块）

**STATUS 枚举**:

| 值 | 含义 |
|----|------|
| `0` | 在住 |
| `6` | 已退租 |

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 700 | 自增 |
| STATUS | 租住状态 | 0, 6 | 0=在住, 6=已退租 |
| BRANCH_ID | 分校ID | 11 | |
| HALL_ID | 宿舍ID | 20 | 关联 s_hall.ID |
| COURSE_ID | 课程ID | 10 | |
| CLASS_ID | 班级ID | 50 | |
| CLASS_TITLE | 班级名称 | BCSP2024-01 | 冗余存储 |
| STUDENT_ID | 学生ID | 2001 | 关联 s_student.ID |
| STUDENT_NAME | 学生姓名 | 张三 | 冗余存储 |
| HALL_TITLE | 宿舍名称 | A栋201 | 冗余存储 |
| BED_NO | 床位号 | 3 | |
| PRICE | 月租金(元) | 500 | |
| BEGIN_DATE | 入住日期 | 2024-03-01 | |
| END_DATE | 退宿日期 | 2024-12-31 | 退租时填写 |
| TOTAL_MONEY | 应付总额 | 5000 | |
| PAYED_MONEY | 已付金额 | 5000 | |
| NOTE | 备注 | | |
| CREATE_TIME | 创建时间 | 2024-03-01 | |
| USER_NAME | 操作人 | head01 | |

---

### s_hall_water_fee (宿舍水电费表)

**业务含义**: 按宿舍+月份维度的水电费记录。每月为每间宿舍生成一条水电费记录（通过 makeRentMonthPay 批量初始化），包含水电费和租金。IS_MADE_SHEET 标识是否已制表（财务对账用）。

**数据量**: 623 条记录

**所属模块**: 宿舍管理（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 400 | 自增 |
| HALL_ID | 宿舍ID | 20 | 关联 s_hall.ID |
| MONTH_KEY | 月份标识 | 2024-12 | 格式 YYYY-MM |
| PRICE | 月租金(元) | 3000 | 付给房东的月租，从 s_hall.LANDLORD_PRICE 取 |
| WATER_FEE | 水电费(元) | 150 | |
| USER_NAME | 操作人 | admin | |
| IS_MADE_SHEET | 是否已制表 | 0, 1 | 0=未制表, 1=已制表(财务确认) |
| MADE_SHEET_TIME | 制表时间 | 2024-12-31 | |
| CREATE_TIME | 创建时间 | 2024-12-01 | |

---

## 模块 13: 教室管理

### s_classroom_date (教室日排课表)

**业务含义**: 教室的日维度排课/占用记录。每一行代表某间教室在某一天的各时段占用情况。TIME1~TIME5 对应一天中 7 个时段（部分时段拆分为上下半段：TIME21/TIME22, TIME41/TIME42），存储占用该时段的班级ID或标识。

**数据量**: 40,963 条记录

**所属模块**: 教室管理（基础数据模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 100000 | 自增 |
| BRANCH_ID | 分校ID | 11 | |
| CLASSROOM_ID | 教室ID | 3 | 关联教室基础数据 |
| DATE_ID | 日期标识 | 20241220 | YYYYMMDD 格式 |
| TIME1 | 时段1(上午第一节) | 50, 0 | 0=空闲, 其他=占用的班级ID |
| TIME21 | 时段2上半(上午第二节前半) | 50 | |
| TIME22 | 时段2下半(上午第二节后半) | 50 | |
| TIME3 | 时段3(午间) | 0 | |
| TIME41 | 时段4上半(下午第一节前半) | 55 | |
| TIME42 | 时段4下半(下午第一节后半) | 55 | |
| TIME5 | 时段5(下午第二节/晚间) | 0 | |

**初始化逻辑**: 通过 BranchSysController::classroom_iniSave 批量为某月所有工作日生成所有教室的排课记录（初始值全为0），再由教务手动编辑分配班级。

---

### s_classroom_student (教室常用座位表)

**业务含义**: 记录班级使用某间教室时的学生座位分配情况。STUDENT_SEAT_STR 以JSON格式存储全班学生的座位号分配。

**数据量**: 15 条记录

**所属模块**: 教室管理（教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 10 | 自增 |
| BRANCH_ID | 分校ID | 11 | |
| TITLE | 标题 | BCSP2024-01 301教室座位表 | |
| CLASSROOM_ID | 教室ID | 3 | |
| CLASSROOM_TITLE | 教室名称 | 301教室 | 冗余存储 |
| STUDENT_NUM | 学生数 | 35 | |
| STUDENT_SEAT_STR | 座位分配JSON | {"2001":"A1","2002":"A2",...} | 学生ID→座位号映射 |
| CREATE_TIME | 创建时间 | 2024-03-01 | |

---

## 模块 14: 班级管理

### u_course_class (班级表)

**业务含义**: 班级（教学班）基础信息表。每个班级属于一门课程(COURSE_ID)和一个分校(BRANCH_ID)，有班主任(HEAD_USER_NAME)和多个授课教员。记录班级的开班日期、总课时、学员人数等。u_前缀表示属于全局课程体系。

**数据量**: 423 条记录

**所属模块**: 班级管理（教学/教务模块）

**字段详情**:

| 字段名 | 含义 | 值示例 | 备注 |
|--------|------|--------|------|
| ID | 主键 | 50 | 自增 |
| BRANCH_ID | 分校ID | 11 | |
| STATUS | 状态 | 0, 1 | 0=在读中, 1=已结课/毕业 |
| COURSE_ID | 课程ID | 10 | 关联 u_course |
| CLASS_TITLE | 班级名称 | BCSP2024-01 | 唯一命名 |
| HEAD_USER_NAME | 班主任用户名 | head01 | |
| BEGIN_DATE | 开班日期 | 2024-03-01 | |
| TOTAL_HOURS | 总课时 | 300 | |
| STUDENT_NUM | 学生人数 | 40 | 当前在册人数 |
| CREATE_TIME | 创建时间 | 2024-02-15 | |

> **注意**: u_course_class 的完整字段可能超出以上列表，此处为基于控制器代码中引用的核心字段。建议迁移时以实际 CSV 表头为准。

---

## 数据量汇总

| 表名 | 中文名 | 记录数 | 所属模块 |
|------|--------|--------|----------|
| s_student | 学生档案表 | 5,203 | 学生档案 |
| s_class_student | 班级学生关系表 | 4,957 | 班级管理 |
| s_change_trans | 转班记录表 | 1,240 | 学籍异动 |
| s_change_quit | 退学记录表 | 78 | 学籍异动 |
| s_change_rest | 休学/复学记录表 | 183 | 学籍异动 |
| s_change_rest_delay | 休学延期记录表 | 8 | 学籍异动 |
| s_dean_exam | 考试主表 | 114 | 考试管理 |
| s_dean_exam_apply | 考试申请表 | 161 | 考试管理 |
| s_dean_exam_student | 考试学生记录表 | 1,707 | 考试管理 |
| s_dean_exam_code | 考试代码表 | 13 | 考试管理-基础数据 |
| s_dean_exam_code_head | 考试类别表 | 6 | 考试管理-基础数据 |
| s_dean_exam_classroom | 考试考场表 | 30 | 考试管理 |
| s_dean_punch | 班级考勤统计表 | 25,019 | 日常考勤 |
| s_dean_patrol | 巡班记录表 | 106,926 | 教学质量管理 |
| s_dean_patrol_action | 巡班行为观察表 | 88 | 教学质量管理 |
| s_dean_point | 千分制扣分记录表 | 21,329 | 千分制考核 |
| s_dean_talk | 学员访谈记录表 | 32,048 | 学员管理 |
| s_dean_lecture | 听课记录表 | 849 | 教学质量管理 |
| s_dean_homework | 作业提交记录表 | 0 | 教学管理 |
| s_certificate | 证书记录表 | 918 | 证书管理 |
| s_hall | 宿舍房间表 | 40 | 宿舍管理 |
| s_hall_rent | 宿舍租住记录表 | 1,058 | 宿舍管理 |
| s_hall_water_fee | 宿舍水电费表 | 623 | 宿舍管理 |
| s_classroom_date | 教室日排课表 | 40,963 | 教室管理 |
| s_classroom_student | 教室常用座位表 | 15 | 教室管理 |
| u_course_class | 班级表 | 423 | 班级管理 |

---

## 关键业务关系图

```
s_student (1) ──── (N) s_class_student (N) ──── (1) u_course_class
                         │
       ┌─────────────────┼─────────────────────────┐
       │                 │                          │
  s_change_trans    s_change_rest ─── s_change_rest_delay
  s_change_quit          │
                         │
       ┌─────────────────┼────────────────┐
       │                 │                │
  s_dean_point     s_dean_talk     s_dean_exam_student
  (千分制)          (访谈)              │
       │                          s_dean_exam_apply
       │                               │
  s_dean_punch ◄───自动扣分───►   s_dean_exam
  (考勤统计)                           │
                                  s_dean_exam_classroom
                                       │
                                  s_dean_exam_code ─── s_dean_exam_code_head
                                       │
                                  s_certificate

  s_dean_patrol ─── s_dean_patrol_action  (巡班)
  s_dean_lecture                          (听课)
  s_dean_homework                         (作业)

  s_hall ─── s_hall_rent      (宿舍-学生)
         └── s_hall_water_fee (宿舍-水电费)

  s_classroom_date            (教室排课)
  s_classroom_student         (教室座位)
```

---

## 迁移注意事项

1. **冗余字段**: 旧系统大量使用冗余存储（如 CLASS_TITLE, FULL_NAME, STUDENT_NAME 等在多表中重复），新系统可通过 JOIN 查询替代，但需注意历史数据中可能存在学生改名后冗余字段未同步的情况。

2. **BRANCH_ID 映射**: 旧系统 BRANCH_ID: 11=盛邦, 12=冀美, 13=晋美, 14=首美(石美)。需与新系统的8校区ID映射。

3. **考勤→千分制联动**: 旧系统保存考勤时自动批量生成千分制扣分记录，迁移时需注意 s_dean_point 中的考勤类扣分记录与 s_dean_punch 的数据一致性。

4. **休学状态机**: s_change_rest 使用单条记录的 STATUS 字段追踪 4 个阶段（申请→批准→复学申请→批准复学），迁移时需将该状态机映射到新系统的工作流。

5. **考试代码为静态数据**: s_dean_exam_code 和 s_dean_exam_code_head 总共仅 19 条，可直接迁移为字典/种子数据。

6. **s_dean_homework 无数据**: 该表虽有定义但实际无业务数据，可考虑跳过迁移。

7. **s_dean_patrol 数据量大**: 106,926 条巡班记录是数据量最大的教务表之一，但 s_dean_patrol_action 仅 88 条，说明大部分巡班记录未关联具体行为观察明细（可能是后期才增加的功能）。

8. **POINT_TYPE 包含手动类型**: 除预定义的 24 种扣分类型外，还有 `other` 类型允许自定义分值和描述，迁移时需特殊处理。
