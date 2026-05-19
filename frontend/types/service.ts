// 教学质量-学员服务模块类型定义

// 学生档案录入相关类型
export interface StudentProfile {
  id: string
  studentName: string // 姓名
  gender: '男' | '女' // 性别
  enrollmentDate: string // 入学时间
  enrollmentAge?: number // 入学年龄
  campusSource?: string // 神殿来源
  consultant?: string // 咨询师
  tuitionAmount?: number // 应收学费金额
  paidAmount?: number // 已收学费金额
  outstandingAmount?: number // 欠费金额
  phone?: string // 联系电话
  wechat?: string // 微信号
  qq?: string // QQ号
  address?: string // 家庭住址
  emergencyContact?: string // 紧急联系人
  emergencyPhone?: string // 紧急联系电话
  major?: string // 专业
  class?: string // 班级
  instructor?: string // 授课教员
  homeroomTeacher?: string // 班主任
  status: '在校' | '休学' | '退学' | '毕业' // 状态
  notes?: string // 备注
  createdAt?: string
  updatedAt?: string
}

// 学生档案创建请求
export interface CreateStudentProfileRequest {
  studentName: string
  gender: '男' | '女'
  enrollmentDate: string
  enrollmentAge?: number
  campusSource?: string
  consultant?: string
  tuitionAmount?: number
  paidAmount?: number
  outstandingAmount?: number
  phone?: string
  wechat?: string
  qq?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  major?: string
  class?: string
  instructor?: string
  homeroomTeacher?: string
  status: '在校' | '休学' | '退学' | '毕业'
  notes?: string
}

// 学生档案更新请求
export interface UpdateStudentProfileRequest {
  id: string
  studentName?: string
  gender?: '男' | '女'
  enrollmentDate?: string
  enrollmentAge?: number
  campusSource?: string
  consultant?: string
  tuitionAmount?: number
  paidAmount?: number
  outstandingAmount?: number
  phone?: string
  wechat?: string
  qq?: string
  address?: string
  emergencyContact?: string
  emergencyPhone?: string
  major?: string
  class?: string
  instructor?: string
  homeroomTeacher?: string
  status?: '在校' | '休学' | '退学' | '毕业'
  notes?: string
}

// 每日新生安排相关类型
export interface NewStudentArrangement {
  id: string | number
  studentName: string // 新生姓名
  age: number // 年龄
  gender: '男' | '女' // 性别
  major: string // 所报专业
  duration: string // 学制
  concerns?: string // 抗拒点/关注点
  receivableAmount: number // 应收金额
  receivedAmount: number // 已收金额
  owedAmount: number // 欠费金额
  expectedPaymentDate?: string // 预计回款时间
  teachingContent?: string // 授课内容
  teachingLocation?: string // 授课地点
  enrollmentDate: string // 入学日期
  classDays: number // 上课天数
  planner?: string // 规划师
  homeroomTeacher?: string // 班主任
  instructor?: string // 教员
  notes?: string // 备注
  recorder?: string // 填表人
  recordTime?: string // 填表时间
  arrangementDate: string // 安排日期
  campus: string // 神殿
  createdAt?: string
  updatedAt?: string
}

// 每日新生安排创建请求
export interface CreateNewStudentArrangementRequest {
  studentName: string
  age: number
  gender: '男' | '女'
  major: string
  duration: string
  concerns?: string
  receivableAmount: number
  receivedAmount: number
  owedAmount: number
  expectedPaymentDate?: string
  teachingContent?: string
  teachingLocation?: string
  enrollmentDate: string
  classDays: number
  planner?: string
  homeroomTeacher?: string
  instructor?: string
  notes?: string
  recorder?: string
  arrangementDate: string
  campus: string
}

// 每日新生安排更新请求
export interface UpdateNewStudentArrangementRequest {
  id: string | number
  studentName?: string
  age?: number
  gender?: '男' | '女'
  major?: string
  duration?: string
  concerns?: string
  receivableAmount?: number
  receivedAmount?: number
  owedAmount?: number
  expectedPaymentDate?: string
  teachingContent?: string
  teachingLocation?: string
  enrollmentDate?: string
  classDays?: number
  planner?: string
  homeroomTeacher?: string
  instructor?: string
  notes?: string
  recorder?: string
  arrangementDate?: string
  campus?: string
}

// 压力面试成绩相关类型
export interface StressInterviewRecord {
  id: string
  studentId: string
  studentName: string // 学员姓名
  age?: number
  gender?: '男' | '女'
  major: string // 所报专业
  duration?: string
  interviewDate?: string
  interviewer?: string
  interviewContent?: string
  studentPerformance?: string
  stressTestResult?: string
  overallScore?: number
  communicationScore?: number
  technicalScore?: number
  adaptabilityScore?: number
  stressResistanceScore?: number
  interviewResult?: '通过' | '不通过' | '待定'
  status?: '已完成' | '进行中' | '已暂停'
  feedback?: string
  improvementSuggestions?: string
  nextInterviewDate?: string
  notes?: string
  recorder?: string
  recordTime?: string
  project1Score: ProjectScore
  project2Score: ProjectScore
  project3Score: ProjectScore
  project4Score: ProjectScore
  project5Score: ProjectScore
  totalAverage: number
  campus: string // 神殿
  className: string
  courseName: string
  instructorName: string
  homeroomTeacherName: string
  createdAt?: string
  updatedAt?: string
}

export interface ProjectScore {
  instructor1: number
  instructor2: number
  instructor3: number
  homeroom1: number
  homeroom2: number
  average?: number
}

// 压力面试成绩创建请求
export interface CreateStressInterviewRecordRequest {
  studentId?: string
  studentName: string // 学员姓名
  age?: number // 兼容旧页面
  gender?: '男' | '女' // 兼容旧页面
  major: string // 所报专业
  duration?: string // 兼容旧页面
  interviewDate?: string // 兼容旧页面
  interviewer?: string // 兼容旧页面
  interviewContent?: string // 兼容旧页面
  studentPerformance?: string // 兼容旧页面
  stressTestResult?: string // 兼容旧页面
  overallScore?: number // 兼容旧页面
  communicationScore?: number // 兼容旧页面
  technicalScore?: number // 兼容旧页面
  adaptabilityScore?: number // 兼容旧页面
  stressResistanceScore?: number // 兼容旧页面
  interviewResult?: '通过' | '不通过' | '待定' // 兼容旧页面
  status?: '已完成' | '进行中' | '已暂停' // 兼容旧页面
  feedback?: string // 兼容旧页面
  improvementSuggestions?: string // 兼容旧页面
  nextInterviewDate?: string // 兼容旧页面
  notes?: string // 兼容旧页面
  recorder?: string // 兼容旧页面
  recordTime?: string // 兼容旧页面
  project1Score?: ProjectScore
  project2Score?: ProjectScore
  project3Score?: ProjectScore
  project4Score?: ProjectScore
  project5Score?: ProjectScore
  campus: string // 神殿
  className?: string
  courseName?: string
  instructorName?: string
  homeroomTeacherName?: string
}

// 压力面试成绩更新请求
export interface UpdateStressInterviewRecordRequest {
  id: string
  studentId?: string
  studentName?: string // 学员姓名
  age?: number
  gender?: '男' | '女'
  major?: string // 所报专业
  duration?: string
  interviewDate?: string
  interviewer?: string
  interviewContent?: string
  studentPerformance?: string
  stressTestResult?: string
  overallScore?: number
  communicationScore?: number
  technicalScore?: number
  adaptabilityScore?: number
  stressResistanceScore?: number
  interviewResult?: '通过' | '不通过' | '待定'
  status?: '已完成' | '进行中' | '已暂停'
  feedback?: string
  improvementSuggestions?: string
  nextInterviewDate?: string
  notes?: string
  recorder?: string
  recordTime?: string
  project1Score?: ProjectScore
  project2Score?: ProjectScore
  project3Score?: ProjectScore
  project4Score?: ProjectScore
  project5Score?: ProjectScore
  campus?: string // 神殿
  className?: string
  courseName?: string
  instructorName?: string
  homeroomTeacherName?: string
}

// 压力面试统计信息
export interface StressInterviewStats {
  totalInterviews?: number // 总面试数
  reinforcementCount?: number
  interviewCount?: number
  expectedCount?: number
  actualCount?: number
  qualifiedCount?: number
  participationRate?: number
  qualificationRate?: number
  passedInterviews?: number // 通过数
  failedInterviews?: number // 不通过数
  averageScore: number // 平均评分
}

// 项目设置
export interface ProjectSetting {
  id: number
  name: string // 项目名称
  date: string // 项目日期
}

// 查询参数
export interface ServiceQueryParams {
  page?: number
  pageSize?: number
  search?: string
  campus?: string
  date?: string
  status?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 分页响应
export interface ServicePageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 统计信息
export interface ServiceStats {
  totalStudents?: number
  totalReceivable?: number
  totalReceived?: number
  totalOwed?: number
  enrollmentRate?: number
  completionRate?: number
  totalInterviews?: number
  passedInterviews?: number
  failedInterviews?: number
  averageScore?: number
}

// 默认数据
export const DEFAULT_STUDENT_PROFILE: CreateStudentProfileRequest = {
  studentName: '',
  gender: '男',
  enrollmentDate: new Date().toISOString().split('T')[0],
  status: '在校',
}

export const DEFAULT_NEW_STUDENT_ARRANGEMENT: CreateNewStudentArrangementRequest = {
  studentName: '',
  age: 18,
  gender: '男',
  major: '',
  duration: '',
  receivableAmount: 0,
  receivedAmount: 0,
  owedAmount: 0,
  enrollmentDate: new Date().toISOString().split('T')[0],
  classDays: 0,
  arrangementDate: new Date().toISOString().split('T')[0],
  campus: '',
}

// 压力面试成绩
export interface PressInterviewScore {
  id: number | string
  campusName: string
  majorName: string
  className: string
  courseName: string
  instructorName: string
  studentId: string
  studentName: string
  projectScores?: Record<
    string,
    {
      instructor1Score: number
      instructor2Score: number
      instructor3Score: number
      homeroomTeacher1Score: number
      homeroomTeacher2Score: number
      averageScore: number
    }
  >
  headerConfig?: Record<number, Record<string, string>>  // 表头配置：{project_number: {instructor1: '...', ...}}
  year: number
  month: number
  createdAt?: string
  updatedAt?: string
}

export interface CreatePressInterviewScoreRequest {
  campusName: string
  majorName: string
  className: string
  courseName: string
  instructorName: string
  studentId: string
  studentName: string
  projectScores?: PressInterviewScore['projectScores']
  headerConfig?: PressInterviewScore['headerConfig']  // 表头配置：{project_number: {instructor1: '...', ...}}
  year: number
  month: number
}

export interface UpdatePressInterviewScoreRequest extends Partial<CreatePressInterviewScoreRequest> {
  id: number | string
}

// 班考试成绩
export interface ExamStudentScore {
  studentId: string
  studentName: string
  vocabularyScore?: number
  writtenScore?: number
  labScore?: number
  dailyScore?: number
  totalScore?: number
  passed?: boolean
}

export interface ClassExamScore {
  id: number | string
  campusName?: string
  majorName?: string
  className?: string
  courseName?: string
  instructorName?: string
  firstExamDate?: string
  makeupExamDate?: string
  classSize: number
  passCount: number
  scoresFirst?: { students: ExamStudentScore[] }
  scoresMakeup?: { students: ExamStudentScore[] }
  scoresFinal: any
  createdAt?: string
  updatedAt?: string
}

export interface CreateClassExamScoreRequest {
  campusName: string
  majorName: string
  className: string
  courseName: string
  instructorName: string
  firstExamDate?: string
  makeupExamDate?: string
  classSize?: number
  passCount?: number
  scoresFirst: { students: ExamStudentScore[] }
  scoresMakeup: { students: ExamStudentScore[] }
  scoresFinal?: { students: ExamStudentScore[] }
}

export interface UpdateClassExamScoreRequest extends Partial<CreateClassExamScoreRequest> {
  id: number | string
}

// 班项目成绩表
export interface ProjectGradeStudent {
  key: string
  studentNo: string
  studentName: string
  [k: string]: any
}

export interface ProjectGradeRegister {
  id: number | string
  campusName: string
  majorName: string
  className: string
  courseName: string
  teacherName: string
  projectCount?: number
  classSize?: number
  actualSubmissions?: number
  passCount?: number
  projectNames?: string[]
  projectAttemptDates?: any
  raterNames?: any
  students?: any
  createdAt?: string
  updatedAt?: string
}

export interface CreateProjectGradeRegisterRequest {
  campusName: string
  majorName: string
  className: string
  courseName: string
  teacherName: string
  projectCount: number
  classSize: number
  actualSubmissions: number
  passCount: number
  projectNames: string[]
  projectAttemptDates: any
  raterNames: any
  students: any
}

export interface UpdateProjectGradeRegisterRequest extends Partial<CreateProjectGradeRegisterRequest> {
  id: number | string
}

export interface SalaryPredictionRecord {
  key: string
  serialNumber: number
  name: string
  gender: '男' | '女'
  idCard: string
  birthDate: string
  education: string
  major: string
  graduatedSchool: string
  nativePlace: string
  exams: Record<string, number | null>
  projects: Record<string, number | null>
  defenses: Record<string, number | null>
  thousandScore: number
  classTeacherComment: string
  lecturers: Array<{ teacherName: string; comment: string }>
  estimatedSalary: string
}

export interface SalaryPrediction {
  id: number
  campusName: string
  majorName: string
  className: string
  classTeacherName?: string | null
  reinforcementTeacherName?: string | null
  records: SalaryPredictionRecord[]
  examHeaders: Array<{ key: string; title: string }>
  projectPairs: Array<{ projectKey: string; defenseKey: string; projectTitle: string; defenseTitle: string }>
  createdAt?: string
  updatedAt?: string
}

export interface CreateSalaryPredictionRequest extends Omit<SalaryPrediction, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateSalaryPredictionRequest extends Partial<CreateSalaryPredictionRequest> {
  id: number | string
}

export interface StudentSatisfactionDetail {
  id: number
  campusName: string
  year: number
  teacherName: string
  className: string
  rows: any[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateStudentSatisfactionDetailRequest extends Omit<StudentSatisfactionDetail, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateStudentSatisfactionDetailRequest extends Partial<CreateStudentSatisfactionDetailRequest> {
  id: number | string
}

export interface StudentSatisfactionAvg {
  campusName: string
  year: number
  teacherName: string
  m1?: number | null
  m2?: number | null
  m3?: number | null
  m4?: number | null
  m5?: number | null
  m6?: number | null
  m7?: number | null
  m8?: number | null
  m9?: number | null
  m10?: number | null
  m11?: number | null
  m12?: number | null
}

export interface ClassAssignmentGradeRecord {
  assignments?: Array<{ number: number; date?: string; name?: string }>
  students?: Array<{
    student_id?: string
    student_name?: string
    assignments?: Array<{
      number?: number
      assignment_score?: number | null
      quiz_score?: number | null
      submitted?: boolean
    }>
    daily_score?: number | null
    final_score?: number | null
  }>
}

export interface ClassAssignmentGrade {
  id: number
  campusName: string
  majorName: string
  className: string
  courseName: string
  teacherName: string
  classSize: number
  assignmentCount: number
  expectedSubmit: number
  actualSubmit: number
  unsubmittedCount: number
  passCount: number
  submitRate: number
  passRate: number
  startDate?: string
  endDate?: string
  records: ClassAssignmentGradeRecord | any
  createdAt?: string
  updatedAt?: string
}

export interface CreateClassAssignmentGradeRequest extends Omit<ClassAssignmentGrade, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateClassAssignmentGradeRequest extends Partial<CreateClassAssignmentGradeRequest> {
  id: number | string
}

// 教员年度听课打分表
export interface TeacherYearlyLectureScore {
  id: number
  date: string
  className: string
  courseContent: string
  teacherName: string
  totalScore: number
  suggestions?: string | null
  scores: Array<{
    key: string
    category: string
    content: string
    score?: 1 | 2 | 3 | 4 | 5
  }>
  createdAt?: string
  updatedAt?: string
}

export interface CreateTeacherYearlyLectureScoreRequest extends Omit<TeacherYearlyLectureScore, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateTeacherYearlyLectureScoreRequest extends Partial<CreateTeacherYearlyLectureScoreRequest> {
  id: number | string
}

// 教员年度听课打分汇总表
export interface TeacherYearlyLectureScoreSummary {
  id: number
  campus_name?: string
  year: number
  summary_data: Array<{
    key: string
    name: string
    m1?: number
    m2?: number
    m3?: number
    m4?: number
    m5?: number
    m6?: number
    m7?: number
    m8?: number
    m9?: number
    m10?: number
    m11?: number
    m12?: number
  }>
  createdAt?: string
  updatedAt?: string
}

export interface CreateTeacherYearlyLectureScoreSummaryRequest extends Omit<TeacherYearlyLectureScoreSummary, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateTeacherYearlyLectureScoreSummaryRequest extends Partial<CreateTeacherYearlyLectureScoreSummaryRequest> {
  id: number | string
}

export interface TeacherLectureScoreRow {
  category: string
  standard: string
  m1?: number
  m2?: number
  m3?: number
  m4?: number
  m5?: number
  m6?: number
  m7?: number
  m8?: number
  m9?: number
  m10?: number
  m11?: number
  m12?: number
  avg?: number
}

export interface TeacherLectureScoreSheet {
  id: number
  campusName: string
  teacherName: string
  year: number
  rows: TeacherLectureScoreRow[]
  createdAt?: string
  updatedAt?: string
}

export interface CreateTeacherLectureScoreSheetRequest extends Omit<TeacherLectureScoreSheet, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateTeacherLectureScoreSheetRequest extends Partial<CreateTeacherLectureScoreSheetRequest> {
  id: number | string
}

export const DEFAULT_STRESS_INTERVIEW_RECORD: CreateStressInterviewRecordRequest = {
  studentId: '',
  studentName: '',
  age: 18,
  gender: '男',
  major: '',
  duration: '',
  interviewDate: '',
  interviewer: '',
  interviewContent: '',
  studentPerformance: '',
  stressTestResult: '',
  overallScore: 0,
  communicationScore: 0,
  technicalScore: 0,
  adaptabilityScore: 0,
  stressResistanceScore: 0,
  interviewResult: '待定',
  status: '进行中',
  feedback: '',
  improvementSuggestions: '',
  notes: '',
  recorder: '',
  className: '',
  courseName: '',
  instructorName: '',
  homeroomTeacherName: '',
  project1Score: { instructor1: 0, instructor2: 0, instructor3: 0, homeroom1: 0, homeroom2: 0 },
  project2Score: { instructor1: 0, instructor2: 0, instructor3: 0, homeroom1: 0, homeroom2: 0 },
  project3Score: { instructor1: 0, instructor2: 0, instructor3: 0, homeroom1: 0, homeroom2: 0 },
  project4Score: { instructor1: 0, instructor2: 0, instructor3: 0, homeroom1: 0, homeroom2: 0 },
  project5Score: { instructor1: 0, instructor2: 0, instructor3: 0, homeroom1: 0, homeroom2: 0 },
  campus: '',
}

// 选项数据
export const GENDER_OPTIONS = [
  { value: '男', label: '男' },
  { value: '女', label: '女' },
]

export const STATUS_OPTIONS = [
  { value: '在校', label: '在校' },
  { value: '休学', label: '休学' },
  { value: '退学', label: '退学' },
  { value: '毕业', label: '毕业' },
]

export const CAMPUS_OPTIONS = [
  { value: '主神殿', label: '主神殿' },
  { value: '永恒殿', label: '永恒殿' },
  { value: '李大殿', label: '李大殿' },
  { value: '智慧阁', label: '智慧阁' },
  { value: '神恩殿', label: '神恩殿' },
  { value: '慈悲殿', label: '慈悲殿' },
  { value: '光明殿', label: '光明殿' },
]

export const MAJOR_OPTIONS = [
  { value: '数字媒体', label: '数字媒体' },
  { value: '前端开发', label: '前端开发' },
  { value: '后端开发', label: '后端开发' },
  { value: 'UI设计', label: 'UI设计' },
  { value: '产品经理', label: '产品经理' },
  { value: '测试工程师', label: '测试工程师' },
]

export const DURATION_OPTIONS = [
  { value: '6个月', label: '6个月' },
  { value: '8个月', label: '8个月' },
  { value: '12个月', label: '12个月' },
  { value: '18个月', label: '18个月' },
  { value: '24个月', label: '24个月' },
]

export const INTERVIEW_RESULT_OPTIONS = [
  { value: '通过', label: '通过' },
  { value: '不通过', label: '不通过' },
  { value: '待定', label: '待定' },
]

export const INTERVIEW_STATUS_OPTIONS = [
  { value: '已完成', label: '已完成' },
  { value: '进行中', label: '进行中' },
  { value: '已暂停', label: '已暂停' },
]
