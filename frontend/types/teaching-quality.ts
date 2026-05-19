// 教质模块类型定义

// 基础类型
export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

// 质量评估相关类型
export interface QualityEvaluation extends BaseEntity {
  id: string
  teacherId: string
  teacherName: string
  classId: string
  className: string
  courseId: string
  courseName: string
  evaluationDate: string
  evaluatorId: string
  evaluatorName: string
  overallScore: number
  evaluationItems: EvaluationItem[]
  comments: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  campusId: string
}

export interface EvaluationItem {
  id: string
  name: string
  description: string
  score: number
  maxScore: number
  weight: number
  comment?: string
  category: 'teaching' | 'content' | 'interaction' | 'management' | 'innovation'
}

// 班级评估类型
export interface ClassEvaluation extends BaseEntity {
  id: string
  classId: string
  className: string
  teacherId: string
  teacherName: string
  evaluationPeriod: string
  studentCount: number
  participationRate: number
  averageScore: number
  evaluationItems: ClassEvaluationItem[]
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  status: 'ongoing' | 'completed' | 'reviewed'
  campusId: string
}

export interface ClassEvaluationItem {
  id: string
  name: string
  score: number
  maxScore: number
  weight: number
  studentFeedback: string[]
  teacherResponse?: string
}

// 教师评估类型
export interface TeacherEvaluation extends BaseEntity {
  id: string
  teacherId: string
  teacherName: string
  department: string
  position: string
  evaluationPeriod: string
  evaluatorId: string
  evaluatorName: string
  overallRating: number
  evaluationCriteria: TeacherEvaluationCriteria[]
  studentFeedback: StudentFeedback[]
  peerReview: PeerReview[]
  selfAssessment: SelfAssessment
  developmentPlan: DevelopmentPlan
  status: 'draft' | 'submitted' | 'reviewed' | 'approved'
  campusId: string
}

export interface TeacherEvaluationCriteria {
  id: string
  name: string
  description: string
  score: number
  maxScore: number
  weight: number
  evidence: string[]
  comments: string
  category: 'teaching' | 'research' | 'service' | 'professional_development'
}

export interface StudentFeedback {
  id: string
  studentId: string
  studentName: string
  classId: string
  rating: number
  comments: string
  suggestions: string
  submittedAt: string
}

export interface PeerReview {
  id: string
  reviewerId: string
  reviewerName: string
  rating: number
  comments: string
  strengths: string[]
  areasForImprovement: string[]
  submittedAt: string
}

export interface SelfAssessment {
  id: string
  achievements: string[]
  challenges: string[]
  goals: string[]
  supportNeeded: string[]
  submittedAt: string
}

export interface DevelopmentPlan {
  id: string
  objectives: string[]
  activities: string[]
  timeline: string
  resources: string[]
  successMetrics: string[]
  mentorId?: string
  mentorName?: string
}

// 质量监控类型
export interface QualityMonitoring extends BaseEntity {
  id: string
  type: 'class' | 'teacher' | 'course' | 'campus'
  targetId: string
  targetName: string
  metric: string
  value: number
  threshold: number
  status: 'normal' | 'warning' | 'critical'
  alertLevel: 'low' | 'medium' | 'high'
  message: string
  actionRequired: boolean
  actionTaken?: string
  resolvedAt?: string
  campusId: string
}

// 质量报告类型
export interface QualityReport extends BaseEntity {
  id: string
  title: string
  type: 'summary' | 'detailed' | 'comparative' | 'trend'
  period: string
  scope: 'campus' | 'department' | 'teacher' | 'class'
  data: QualityReportData
  insights: string[]
  recommendations: string[]
  status: 'draft' | 'published' | 'archived'
  authorId: string
  authorName: string
  campusId: string
}

export interface QualityReportData {
  summary: {
    totalEvaluations: number
    averageScore: number
    improvementRate: number
    topPerformers: string[]
    areasForImprovement: string[]
  }
  trends: {
    period: string
    scores: number[]
    labels: string[]
  }
  comparisons: {
    previousPeriod: number
    currentPeriod: number
    change: number
    changePercentage: number
  }
  details: any[]
}

// 质量标准类型
export interface QualityStandard extends BaseEntity {
  id: string
  name: string
  description: string
  category: 'teaching' | 'assessment' | 'student_support' | 'professional_development'
  criteria: QualityCriteria[]
  weight: number
  isActive: boolean
  effectiveDate: string
  expiryDate?: string
  campusId: string
}

export interface QualityCriteria {
  id: string
  name: string
  description: string
  score: number
  maxScore: number
  weight: number
  indicators: string[]
  evidence: string[]
}

// 通知规则类型
export interface NotificationRule extends BaseEntity {
  id: string
  name: string
  description: string
  trigger:
    | 'score_below'
    | 'score_above'
    | 'trend_down'
    | 'missing_evaluation'
    | 'deadline_approaching'
  conditions: NotificationCondition[]
  actions: NotificationAction[]
  isActive: boolean
  priority: 'low' | 'medium' | 'high'
  campusId: string
}

export interface NotificationCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
  value: any
}

export interface NotificationAction {
  type: 'email' | 'sms' | 'system_notification' | 'workflow'
  recipients: string[]
  template: string
  delay?: number
}

// 查询参数类型
export interface QualityEvaluationQueryParams {
  page?: number
  pageSize?: number
  teacherId?: string
  classId?: string
  courseId?: string
  status?: string
  startDate?: string
  endDate?: string
  campusId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ClassEvaluationQueryParams {
  page?: number
  pageSize?: number
  classId?: string
  teacherId?: string
  evaluationPeriod?: string
  status?: string
  campusId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface TeacherEvaluationQueryParams {
  page?: number
  pageSize?: number
  teacherId?: string
  department?: string
  evaluationPeriod?: string
  status?: string
  campusId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 创建和更新请求类型
export interface CreateQualityEvaluationRequest {
  teacherId: string
  classId: string
  courseId: string
  evaluationDate: string
  evaluatorId: string
  evaluationItems: Omit<EvaluationItem, 'id'>[]
  comments: string
  campusId: string
}

export interface UpdateQualityEvaluationRequest {
  evaluationItems?: Omit<EvaluationItem, 'id'>[]
  comments?: string
  status?: string
}

export interface CreateClassEvaluationRequest {
  classId: string
  teacherId: string
  evaluationPeriod: string
  evaluationItems: Omit<ClassEvaluationItem, 'id'>[]
  strengths: string[]
  improvements: string[]
  recommendations: string[]
  campusId: string
}

export interface UpdateClassEvaluationRequest {
  evaluationItems?: Omit<ClassEvaluationItem, 'id'>[]
  strengths?: string[]
  improvements?: string[]
  recommendations?: string[]
  status?: string
}

export interface CreateTeacherEvaluationRequest {
  teacherId: string
  evaluationPeriod: string
  evaluatorId: string
  evaluationCriteria: Omit<TeacherEvaluationCriteria, 'id'>[]
  campusId: string
}

export interface UpdateTeacherEvaluationRequest {
  evaluationCriteria?: Omit<TeacherEvaluationCriteria, 'id'>[]
  status?: string
}

// 统计数据类型
export interface QualityStatistics {
  totalEvaluations: number
  averageScore: number
  improvementRate: number
  topPerformers: Array<{
    id: string
    name: string
    score: number
    improvement: number
  }>
  areasForImprovement: Array<{
    area: string
    currentScore: number
    targetScore: number
    gap: number
  }>
  trends: Array<{
    period: string
    score: number
    evaluations: number
  }>
  distribution: Array<{
    range: string
    count: number
    percentage: number
  }>
}

// 默认值
export const DEFAULT_QUALITY_EVALUATION: Partial<QualityEvaluation> = {
  overallScore: 0,
  evaluationItems: [],
  comments: '',
  status: 'draft',
}

export const DEFAULT_CLASS_EVALUATION: Partial<ClassEvaluation> = {
  studentCount: 0,
  participationRate: 0,
  averageScore: 0,
  evaluationItems: [],
  strengths: [],
  improvements: [],
  recommendations: [],
  status: 'ongoing',
}

export const DEFAULT_TEACHER_EVALUATION: Partial<TeacherEvaluation> = {
  overallRating: 0,
  evaluationCriteria: [],
  studentFeedback: [],
  peerReview: [],
  status: 'draft',
}
