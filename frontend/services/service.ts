// [教质模块] 学员服务模块服务层 - 新生安排、压力面试、考试成绩、项目成绩、薪资预估、学员满意度
import { api } from './api'
import type {
  StudentSatisfactionAvg,
  ClassAssignmentGrade,
  CreateClassAssignmentGradeRequest,
  UpdateClassAssignmentGradeRequest,
  StudentProfile,
  CreateStudentProfileRequest,
  UpdateStudentProfileRequest,
  NewStudentArrangement,
  CreateNewStudentArrangementRequest,
  UpdateNewStudentArrangementRequest,
  StressInterviewRecord,
  CreateStressInterviewRecordRequest,
  UpdateStressInterviewRecordRequest,
  ServiceQueryParams,
  ServicePageResponse,
  ServiceStats,
  StressInterviewStats,
  PressInterviewScore,
  CreatePressInterviewScoreRequest,
  UpdatePressInterviewScoreRequest,
  ClassExamScore,
  CreateClassExamScoreRequest,
  UpdateClassExamScoreRequest,
  ProjectGradeRegister,
  CreateProjectGradeRegisterRequest,
  UpdateProjectGradeRegisterRequest,
  SalaryPrediction,
  CreateSalaryPredictionRequest,
  UpdateSalaryPredictionRequest,
  StudentSatisfactionDetail,
  CreateStudentSatisfactionDetailRequest,
  UpdateStudentSatisfactionDetailRequest,
} from '../types/service'

const mapNewStudentArrangementFromApi = (item: any): NewStudentArrangement => ({
  id: item.id,
  studentName: item.student_name ?? '',
  age: Number(item.age ?? 0),
  gender: item.gender ?? '',
  major: item.major ?? '',
  duration: item.duration ?? '',
  concerns: item.concerns ?? '',
  receivableAmount: Number(item.receivable_amount ?? 0),
  receivedAmount: Number(item.received_amount ?? 0),
  owedAmount: Number(item.owed_amount ?? 0),
  expectedPaymentDate: item.expected_payment_date || '',
  teachingContent: item.teaching_content ?? '',
  teachingLocation: item.teaching_location ?? '',
  enrollmentDate: item.enrollment_date || '',
  classDays: Number(item.class_days ?? 0),
  planner: item.planner ?? '',
  homeroomTeacher: item.homeroom_teacher ?? '',
  instructor: item.instructor ?? '',
  notes: item.notes ?? '',
  recorder: item.recorder ?? '',
  recordTime: item.record_time || item.created_at || '',
  arrangementDate: item.arrangement_date || '',
  campus: item.campus ?? '',
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

const mapNewStudentArrangementToApi = (
  data: CreateNewStudentArrangementRequest | UpdateNewStudentArrangementRequest,
) => ({
  student_name: data.studentName,
  age: data.age,
  gender: data.gender,
  major: data.major,
  duration: data.duration,
  concerns: data.concerns,
  receivable_amount: data.receivableAmount,
  received_amount: data.receivedAmount,
  owed_amount: data.owedAmount,
  expected_payment_date: data.expectedPaymentDate || null,
  teaching_content: data.teachingContent,
  teaching_location: data.teachingLocation,
  enrollment_date: data.enrollmentDate,
  class_days: data.classDays,
  planner: data.planner,
  homeroom_teacher: data.homeroomTeacher,
  instructor: data.instructor,
  notes: data.notes,
  recorder: data.recorder,
  arrangement_date: data.arrangementDate,
  campus: data.campus,
})

const NEW_STUDENT_ARRANGEMENT_PATH = '/new-student-arrangements'
const NEW_STUDENT_ARRANGEMENT_URL = `${NEW_STUDENT_ARRANGEMENT_PATH}/`

// 学生档案服务
export const studentProfileService = {
  // 获取学生档案列表
  getList: async (
    params: ServiceQueryParams = {},
    campus?: string,
  ): Promise<ServicePageResponse<StudentProfile>> => {
    // 这里应该调用实际的API
    return {
      list: [],
      total: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      totalPages: 0,
    }
  },

  // 获取学生档案详情
  getById: async (id: string, campus?: string): Promise<StudentProfile | null> => {
    // 这里应该调用实际的API
    return null
  },

  // 创建学生档案
  create: async (data: CreateStudentProfileRequest, campus?: string): Promise<StudentProfile> => {
    // 这里应该调用实际的API
    throw new Error('Not implemented')
  },

  // 更新学生档案
  update: async (data: UpdateStudentProfileRequest, campus?: string): Promise<StudentProfile> => {
    // 这里应该调用实际的API
    throw new Error('Not implemented')
  },

  // 删除学生档案
  delete: async (id: string, campus?: string): Promise<void> => {
    // 这里应该调用实际的API
    throw new Error('Not implemented')
  },

  // 获取学生档案统计
  getStats: async (campus?: string): Promise<ServiceStats> => {
    // 这里应该调用实际的API
    return {
      totalStudents: 0,
      totalReceivable: 0,
      totalReceived: 0,
      totalOwed: 0,
      enrollmentRate: 0,
      completionRate: 0,
    }
  },
}

// 每日新生安排服务
export const newStudentArrangementService = {
  // 获取每日新生安排列表
  getList: async (
    params: ServiceQueryParams = {},
    campus?: string,
  ): Promise<ServicePageResponse<NewStudentArrangement>> => {
    const res = await api.get(NEW_STUDENT_ARRANGEMENT_URL, {
      params: {
        campus,
        date: params.date,
        // 新增：按年月查询（不影响原有按天 date 查询）
        year: (params as any).year,
        month: (params as any).month,
        search: params.search,
        page: params.page,
        page_size: params.pageSize,
      },
    })
    const data = res.data
    const records = (data.records || data.list || []).map(mapNewStudentArrangementFromApi)
    return {
      list: records,
      total: data.total || 0,
      page: data.page || 1,
      pageSize: data.page_size || params.pageSize || 20,
      totalPages: Math.ceil((data.total || 0) / (data.page_size || params.pageSize || 20)),
    }
  },

  // 获取每日新生安排详情
  getById: async (id: string | number, campus?: string): Promise<NewStudentArrangement | null> => {
    const res = await api.get(NEW_STUDENT_ARRANGEMENT_URL, {
      params: { id: Number(id), campus },
    })
    const list = (res.data?.records || res.data?.list || []).map(mapNewStudentArrangementFromApi)
    const targetId = String(id)
    return list.find((item: NewStudentArrangement) => String(item.id) === targetId) || null
  },

  // 创建每日新生安排
  create: async (
    data: CreateNewStudentArrangementRequest,
    campus?: string,
  ): Promise<NewStudentArrangement> => {
    const payload = mapNewStudentArrangementToApi({ ...data, campus: campus || data.campus })
    const res = await api.post(NEW_STUDENT_ARRANGEMENT_URL, payload)
    return mapNewStudentArrangementFromApi(res.data)
  },

  // 更新每日新生安排
  update: async (
    data: UpdateNewStudentArrangementRequest,
    campus?: string,
  ): Promise<NewStudentArrangement> => {
    const payload = mapNewStudentArrangementToApi({ ...data, campus: campus || data.campus })
    const res = await api.put(NEW_STUDENT_ARRANGEMENT_URL, { id: data.id, ...payload })
    return mapNewStudentArrangementFromApi(res.data)
  },

  // 删除每日新生安排
  delete: async (id: string | number, campus?: string): Promise<void> => {
    await api.delete(NEW_STUDENT_ARRANGEMENT_URL, { params: { id: Number(id), campus } })
  },

  // 获取每日新生安排统计
  getStats: async (date: string, campus?: string): Promise<ServiceStats> => {
    // 这里应该调用实际的API
    return {
      totalStudents: 0,
      totalReceivable: 0,
      totalReceived: 0,
      totalOwed: 0,
      enrollmentRate: 0,
      completionRate: 0,
    }
  },
}

// 压力面试成绩服务
const mapPressScoreToApi = (data: CreatePressInterviewScoreRequest | UpdatePressInterviewScoreRequest) => ({
  id: 'id' in data ? data.id : undefined,
  campus_name: data.campusName,
  major_name: data.majorName,
  class_name: data.className,
  course_name: data.courseName,
  instructor_name: data.instructorName,
  student_id: data.studentId,
  student_name: data.studentName,
  project_scores: data.projectScores || {},
  header_config: data.headerConfig || (('headerConfig' in data && data.headerConfig !== undefined) ? data.headerConfig : undefined),
  year: data.year,
  month: data.month,
})

const mapPressScoreFromApi = (item: any): PressInterviewScore => ({
  id: item.id,
  campusName: item.campus_name,
  majorName: item.major_name,
  className: item.class_name,
  courseName: item.course_name,
  instructorName: item.instructor_name,
  studentId: item.student_id,
  studentName: item.student_name,
  projectScores: item.project_scores || {},
  headerConfig: item.header_config || {},
  year: item.year,
  month: item.month,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

// 压力面试表头配置服务（从 press_interview_scores 表读取）
export const pressInterviewHeaderConfigService = {
  getList: async (
    campus?: string,
    className?: string,
  ): Promise<Record<string, Record<number, Record<string, string>>>> => {
    if (!campus || !className) {
      return {}
    }
    const res = await api.get('/press-interview-scores/header-config', {
      params: {
        campus_name: campus,
        class_name: className,
      },
    })
    const headerConfig = res.data.header_config || {}
    // 转换为前端需要的格式：{scope_key: {project_number: {instructor1: '...', ...}}}
    const scopeKey = `${campus}__${className}`
    // headerConfig 应该是 {project_number: {instructor1: '...', ...}} 的格式
    // 如果不是，需要转换
    if (headerConfig && typeof headerConfig === 'object') {
      return { [scopeKey]: headerConfig }
    }
    return {}
  },

  createOrUpdate: async (
    campus: string,
    className: string,
    projectNumber: number,
    headerConfig: Record<string, string>,
  ): Promise<void> => {
    // 获取当前的 header_config
    let currentHeaderConfig: Record<number, Record<string, string>> = {}
    try {
      const getRes = await api.get('/press-interview-scores/header-config', {
        params: {
          campus_name: campus,
          class_name: className,
        },
      })
      currentHeaderConfig = (getRes.data.header_config || {}) as Record<number, Record<string, string>>
    } catch (error) {
      // 如果没有记录，使用空对象
      currentHeaderConfig = {}
    }
    
    // 更新指定项目的表头配置
    currentHeaderConfig[projectNumber] = headerConfig
    
    // 保存到后端（更新所有相同神殿+班级的记录）
    await api.post('/press-interview-scores/header-config', {
      campus_name: campus,
      class_name: className,
      header_config: currentHeaderConfig,
    })
  },
  
  // 批量更新所有项目的表头配置
  updateAll: async (
    campus: string,
    className: string,
    allHeaderConfigs: Record<number, Record<string, string>>,
  ): Promise<void> => {
    await api.post('/press-interview-scores/header-config', {
      campus_name: campus,
      class_name: className,
      header_config: allHeaderConfigs,
    })
  },
}

export const pressInterviewScoreService = {
  getList: async (
    params: ServiceQueryParams & {
      major_name?: string
      course_name?: string
      instructor_name?: string
      year?: number
      month?: number
    } = {},
    campus?: string,
    className?: string,
  ): Promise<ServicePageResponse<PressInterviewScore>> => {
    const res = await api.get('/press-interview-scores/', {
      params: {
        campus_name: campus,
        class_name: className,
        major_name: params.major_name,
        course_name: params.course_name,
        instructor_name: params.instructor_name,
        year: params.year,
        month: params.month,
        search: params.search,
        page: params.page,
        page_size: params.pageSize,
      },
    })
    const data = res.data
    const records = (data.records || []).map(mapPressScoreFromApi)
    return {
      list: records,
      total: data.total || 0,
      page: data.page || 1,
      pageSize: data.page_size || params.pageSize || 20,
      totalPages: Math.ceil((data.total || 0) / (data.page_size || params.pageSize || 20)),
    }
  },

  create: async (data: CreatePressInterviewScoreRequest): Promise<PressInterviewScore> => {
    const res = await api.post('/press-interview-scores/', mapPressScoreToApi(data))
    return mapPressScoreFromApi(res.data)
  },

  update: async (data: UpdatePressInterviewScoreRequest): Promise<PressInterviewScore> => {
    const res = await api.put('/press-interview-scores/', mapPressScoreToApi(data))
    return mapPressScoreFromApi(res.data)
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete('/press-interview-scores/', { params: { id: Number(id) } })
  },
}

// 班考试成绩服务
const mapClassExamFromApi = (item: any): ClassExamScore => {
  // 映射学员数据的字段名称 (snake_case -> camelCase)
  const mapStudentScore = (student: any) => ({
    studentId: student.student_id || student.studentId,
    studentName: student.student_name || student.studentName,
    vocabularyScore: student.vocabulary_score ?? student.vocabularyScore,
    writtenScore: student.written_score ?? student.writtenScore,
    labScore: student.lab_score ?? student.labScore,
    dailyScore: student.daily_score ?? student.dailyScore,
    totalScore: student.total_score ?? student.totalScore,
    passed: student.passed,
  })
  
  return {
    id: item.id,
    campusName: item.campus_name || item.campusName,
    majorName: item.major_name || item.majorName,
    className: item.class_name || item.className,
    courseName: item.course_name || item.courseName,
    instructorName: item.instructor_name || item.instructorName,
    firstExamDate: item.first_exam_date || item.firstExamDate,
    makeupExamDate: item.makeup_exam_date || item.makeupExamDate,
    classSize: Number(item.class_size ?? item.classSize ?? 0),
    passCount: Number(item.pass_count ?? item.passCount ?? 0),
    scoresFirst: {
      students: (item.scores_first?.students || item.scoresFirst?.students || []).map(mapStudentScore),
    },
    scoresMakeup: {
      students: (item.scores_makeup?.students || item.scoresMakeup?.students || []).map(mapStudentScore),
    },
    scoresFinal: item.scores_final || item.scoresFinal || {},
    createdAt: item.created_at || item.createdAt,
    updatedAt: item.updated_at || item.updatedAt,
  }
}

const mapClassExamToApi = (data: CreateClassExamScoreRequest | UpdateClassExamScoreRequest) => {
  // 映射学员数据 (camelCase -> snake_case)
  const mapStudentToApi = (student: any) => ({
    student_id: student.studentId ?? student.student_id,
    student_name: student.studentName ?? student.student_name,
    vocabulary_score: student.vocabularyScore ?? student.vocabulary_score,
    written_score: student.writtenScore ?? student.written_score,
    lab_score: student.labScore ?? student.lab_score,
    daily_score: student.dailyScore ?? student.daily_score,
  })

  return {
    id: 'id' in data ? data.id : undefined,
    campus_name: data.campusName,
    major_name: data.majorName,
    class_name: data.className,
    course_name: data.courseName,
    instructor_name: data.instructorName,
    first_exam_date: data.firstExamDate,
    makeup_exam_date: data.makeupExamDate,
    scores_first: {
      students: (data.scoresFirst?.students || []).map(mapStudentToApi),
    },
    scores_makeup: {
      students: (data.scoresMakeup?.students || []).map(mapStudentToApi),
    },
  }
}

export const classExamScoreService = {
  getList: async (
    params: ServiceQueryParams = {},
    campus?: string,
    className?: string,
  ): Promise<ServicePageResponse<ClassExamScore>> => {
    const res = await api.get('/class-exam-scores/', {
      params: {
        campus_name: campus,
        class_name: className,
        search: params.search,
        page: params.page,
        page_size: params.pageSize,
      },
    })
    const data = res.data
    const records = (data.records || []).map(mapClassExamFromApi)
    return {
      list: records,
      total: data.total || 0,
      page: data.page || 1,
      pageSize: data.page_size || params.pageSize || 20,
      totalPages: Math.ceil((data.total || 0) / (data.page_size || params.pageSize || 20)),
    }
  },

  create: async (data: CreateClassExamScoreRequest): Promise<ClassExamScore> => {
    const res = await api.post('/class-exam-scores/', mapClassExamToApi(data))
    return mapClassExamFromApi(res.data)
  },

  update: async (data: UpdateClassExamScoreRequest): Promise<ClassExamScore> => {
    const res = await api.put('/class-exam-scores/', mapClassExamToApi(data))
    return mapClassExamFromApi(res.data)
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete('/class-exam-scores/', { params: { id: Number(id) } })
  },
}

// 项目成绩表服务
const mapProjectRegisterFromApi = (item: any): ProjectGradeRegister => ({
  id: item.id,
  campusName: item.campus_name || item.campusName,
  majorName: item.major_name || item.majorName,
  className: item.class_name || item.className,
  courseName: item.course_name || item.courseName,
  teacherName: item.teacher_name || item.teacherName,
  projectCount: item.project_count ?? item.projectCount ?? 0,
  classSize: item.class_size ?? item.classSize ?? 0,
  actualSubmissions: item.actual_submissions ?? item.actualSubmissions ?? 0,
  passCount: item.pass_count ?? item.passCount ?? 0,
  projectNames: item.project_names || item.projectNames || [],
  projectAttemptDates: item.project_attempt_dates || item.projectAttemptDates || [],
  raterNames: item.rater_names || item.raterNames || [],
  students: item.students || [],
  createdAt: item.created_at || item.createdAt,
  updatedAt: item.updated_at || item.updatedAt,
})

const mapProjectRegisterToApi = (
  data: CreateProjectGradeRegisterRequest | UpdateProjectGradeRegisterRequest,
) => ({
  id: 'id' in data ? data.id : undefined,
  campus_name: data.campusName,
  major_name: data.majorName,
  class_name: data.className,
  course_name: data.courseName,
  teacher_name: data.teacherName,
  project_count: data.projectCount,
  class_size: data.classSize,
  actual_submissions: data.actualSubmissions,
  pass_count: data.passCount,
  project_names: data.projectNames,
  project_attempt_dates: data.projectAttemptDates,
  rater_names: data.raterNames,
  students: data.students,
})

export const projectGradeRegisterService = {
  getList: async (
    params: ServiceQueryParams = {},
    campus?: string,
    className?: string,
  ): Promise<ServicePageResponse<ProjectGradeRegister>> => {
    const res = await api.get('/project-grade-registers/', {
      params: {
        campus_name: campus,
        class_name: className,
        search: params.search,
        page: params.page,
        page_size: params.pageSize,
      },
    })
    const data = res.data
    const records = (data.records || []).map(mapProjectRegisterFromApi)
    return {
      list: records,
      total: data.total || 0,
      page: data.page || 1,
      pageSize: data.page_size || params.pageSize || 20,
      totalPages: Math.ceil((data.total || 0) / (data.page_size || params.pageSize || 20)),
    }
  },

  create: async (data: CreateProjectGradeRegisterRequest): Promise<ProjectGradeRegister> => {
    const res = await api.post('/project-grade-registers/', mapProjectRegisterToApi(data))
    return mapProjectRegisterFromApi(res.data)
  },

  update: async (data: UpdateProjectGradeRegisterRequest): Promise<ProjectGradeRegister> => {
    const res = await api.put('/project-grade-registers/', mapProjectRegisterToApi(data))
    return mapProjectRegisterFromApi(res.data)
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete('/project-grade-registers/', { params: { id: Number(id) } })
  },
}

// 薪资预估表服务
const mapSalaryPredictionFromApi = (item: any): SalaryPrediction => ({
  id: item.id,
  campusName: item.campus_name || item.campusName,
  majorName: item.major_name || item.majorName,
  className: item.class_name || item.className,
  classTeacherName: item.class_teacher_name || item.classTeacherName,
  reinforcementTeacherName: item.reinforcement_teacher_name || item.reinforcementTeacherName,
  records: item.records || [],
  examHeaders: item.exam_headers || item.examHeaders || [],
  projectPairs: item.project_pairs || item.projectPairs || [],
  createdAt: item.created_at || item.createdAt,
  updatedAt: item.updated_at || item.updatedAt,
})

const mapSalaryPredictionToApi = (
  data: CreateSalaryPredictionRequest | UpdateSalaryPredictionRequest,
) => ({
  id: 'id' in data ? data.id : undefined,
  campus_name: data.campusName,
  major_name: data.majorName,
  class_name: data.className,
  class_teacher_name: data.classTeacherName,
  reinforcement_teacher_name: data.reinforcementTeacherName,
  records: data.records,
  exam_headers: data.examHeaders,
  project_pairs: data.projectPairs,
})

export const salaryPredictionService = {
  getList: async (
    campus?: string,
    className?: string,
  ): Promise<SalaryPrediction[]> => {
    const res = await api.get('/salary/salary-predictions/', { params: { campus_name: campus, class_name: className } })
    return (res.data || []).map(mapSalaryPredictionFromApi)
  },

  create: async (data: CreateSalaryPredictionRequest): Promise<SalaryPrediction> => {
    const res = await api.post('/salary/salary-predictions/', mapSalaryPredictionToApi(data))
    return mapSalaryPredictionFromApi(res.data)
  },

  update: async (data: UpdateSalaryPredictionRequest): Promise<SalaryPrediction> => {
    const res = await api.put('/salary/salary-predictions/', mapSalaryPredictionToApi(data))
    return mapSalaryPredictionFromApi(res.data)
  },

  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/salary/salary-predictions/${id}`)
  },
}

// 学员满意度详情
const mapStudentSatisfactionDetailFromApi = (item: any): StudentSatisfactionDetail => ({
  id: item.id,
  campusName: item.campus_name || item.campusName,
  year: item.year || item.年份 || new Date().getFullYear(),
  teacherName: item.teacher_name || item.teacherName,
  className: item.class_name || item.className || '',
  rows: item.rows || [],
  createdAt: item.created_at || item.createdAt,
  updatedAt: item.updated_at || item.updatedAt,
})

const mapStudentSatisfactionDetailToApi = (
  data: CreateStudentSatisfactionDetailRequest | UpdateStudentSatisfactionDetailRequest,
) => ({
  id: 'id' in data ? data.id : undefined,
  campus_name: data.campusName,
  year: data.year,
  teacher_name: data.teacherName,
  class_name: (data as any).className ?? '',
  rows: data.rows,
})

const mapStudentSatisfactionAvgFromApi = (item: any): StudentSatisfactionAvg => ({
  campusName: item.campus_name || item.campusName,
  year: item.year || item.年份,
  teacherName: item.teacher_name || item.teacherName,
  m1: item.m1,
  m2: item.m2,
  m3: item.m3,
  m4: item.m4,
  m5: item.m5,
  m6: item.m6,
  m7: item.m7,
  m8: item.m8,
  m9: item.m9,
  m10: item.m10,
  m11: item.m11,
  m12: item.m12,
})

export const studentSatisfactionDetailService = {
  getList: async (campus?: string, teacher?: string, className?: string, year?: number): Promise<StudentSatisfactionDetail[]> => {
    const res = await api.get('/student-satisfaction/student-satisfaction-details/', {
      params: { campus_name: campus, teacher_name: teacher, class_name: className, year },
    })
    return (res.data || []).map(mapStudentSatisfactionDetailFromApi)
  },
  create: async (data: CreateStudentSatisfactionDetailRequest): Promise<StudentSatisfactionDetail> => {
    const res = await api.post('/student-satisfaction/student-satisfaction-details/', mapStudentSatisfactionDetailToApi(data))
    return mapStudentSatisfactionDetailFromApi(res.data)
  },
  update: async (data: UpdateStudentSatisfactionDetailRequest): Promise<StudentSatisfactionDetail> => {
    const res = await api.put('/student-satisfaction/student-satisfaction-details/', mapStudentSatisfactionDetailToApi(data))
    return mapStudentSatisfactionDetailFromApi(res.data)
  },
  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/student-satisfaction/student-satisfaction-details/${id}`)
  },
  getAvg: async (campus?: string, year?: number): Promise<StudentSatisfactionAvg[]> => {
    // 优先使用动态聚合的接口；失败再回退到视图
    try {
      const res = await api.get('/student-satisfaction/student-satisfaction-details/avg-computed', {
        params: { campus_name: campus, year },
      })
      if (res?.data) return (res.data || []).map(mapStudentSatisfactionAvgFromApi)
    } catch (error: any) {
      // fallback below
      if (error?.response?.status !== 404) {
        console.warn('avg-computed 接口失败，尝试回退 avg 视图', error?.response?.data || error?.message)
      }
    }
    const res = await api.get('/student-satisfaction/student-satisfaction-details/avg', {
      params: { campus_name: campus, year },
    })
    return (res.data || []).map(mapStudentSatisfactionAvgFromApi)
  },
}

// 班作业成绩表
const mapClassAssignmentGradeFromApi = (item: any): ClassAssignmentGrade => ({
  id: item.id,
  campusName: item.campus_name || item.campusName,
  majorName: item.major_name || item.majorName,
  className: item.class_name || item.className,
  courseName: item.course_name || item.courseName,
  teacherName: item.teacher_name || item.teacherName,
  classSize: Number(item.class_size ?? 0),
  assignmentCount: Number(item.assignment_count ?? 0),
  expectedSubmit: Number(item.expected_submit ?? 0),
  actualSubmit: Number(item.actual_submit ?? 0),
  unsubmittedCount: Number(item.unsubmitted_count ?? 0),
  passCount: Number(item.pass_count ?? 0),
  // 处理 Decimal 类型（PostgreSQL 返回的可能是字符串）
  submitRate: item.submit_rate !== null && item.submit_rate !== undefined ? Number(item.submit_rate) : 0,
  passRate: item.pass_rate !== null && item.pass_rate !== undefined ? Number(item.pass_rate) : 0,
  startDate: item.start_date,
  endDate: item.end_date,
  records: item.records || {},
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

const mapClassAssignmentGradeToApi = (data: CreateClassAssignmentGradeRequest | UpdateClassAssignmentGradeRequest) => ({
  id: 'id' in data ? data.id : undefined,
  campus_name: data.campusName,
  major_name: data.majorName,
  class_name: data.className,
  course_name: data.courseName,
  teacher_name: data.teacherName,
  class_size: data.classSize,
  assignment_count: data.assignmentCount,
  expected_submit: data.expectedSubmit,
  actual_submit: data.actualSubmit,
  unsubmitted_count: data.unsubmittedCount,
  pass_count: data.passCount,
  submit_rate: data.submitRate,
  pass_rate: data.passRate,
  start_date: data.startDate,
  end_date: data.endDate,
  records: data.records,
})

export const classAssignmentGradeService = {
  getList: async (params: { campus?: string; major?: string; className?: string; course?: string } = {}): Promise<ClassAssignmentGrade[]> => {
    const res = await api.get('/class-assignment/class-assignment-grades/', {
      params: {
        campus_name: params.campus,
        major_name: params.major,
        class_name: params.className,
        course_name: params.course,
      },
    })
    return (res.data || []).map(mapClassAssignmentGradeFromApi)
  },
  create: async (data: CreateClassAssignmentGradeRequest): Promise<ClassAssignmentGrade> => {
    // 使用 save-or-update 端点，避免重复记录
    const res = await api.post('/class-assignment/class-assignment-grades/save-or-update', mapClassAssignmentGradeToApi(data))
    return mapClassAssignmentGradeFromApi(res.data)
  },
  update: async (data: UpdateClassAssignmentGradeRequest): Promise<ClassAssignmentGrade> => {
    const res = await api.put('/class-assignment/class-assignment-grades/', mapClassAssignmentGradeToApi(data))
    return mapClassAssignmentGradeFromApi(res.data)
  },
  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/class-assignment/class-assignment-grades/${id}`)
  },
}

// 教员年度听课打分表服务
import type { TeacherYearlyLectureScore, CreateTeacherYearlyLectureScoreRequest, UpdateTeacherYearlyLectureScoreRequest } from '../types/service'

const mapTeacherYearlyLectureScoreFromApi = (item: any): TeacherYearlyLectureScore => ({
  id: item.id,
  date: item.date,
  className: item.class_name || item.className,
  courseContent: item.course_content || item.courseContent,
  teacherName: item.teacher_name || item.teacherName,
  totalScore: Number(item.total_score ?? 0),
  suggestions: item.suggestions || null,
  scores: item.scores || [],
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

const mapTeacherYearlyLectureScoreToApi = (data: CreateTeacherYearlyLectureScoreRequest | UpdateTeacherYearlyLectureScoreRequest) => ({
  id: 'id' in data ? data.id : undefined,
  date: data.date,
  class_name: data.className,
  course_content: data.courseContent,
  teacher_name: data.teacherName,
  total_score: data.totalScore,
  suggestions: data.suggestions,
  scores: data.scores,
})

export const teacherYearlyLectureScoreService = {
  getList: async (params: { 
    teacherName?: string
    className?: string
    startDate?: string
    endDate?: string
  } = {}): Promise<TeacherYearlyLectureScore[]> => {
    const res = await api.get('/teacher-yearly-lecture-score/teacher-yearly-lecture-scores/', {
      params: {
        teacher_name: params.teacherName,
        class_name: params.className,
        start_date: params.startDate,
        end_date: params.endDate,
      },
    })
    return (res.data || []).map(mapTeacherYearlyLectureScoreFromApi)
  },
  getById: async (id: string | number): Promise<TeacherYearlyLectureScore> => {
    const res = await api.get(`/teacher-yearly-lecture-score/teacher-yearly-lecture-scores/${id}`)
    return mapTeacherYearlyLectureScoreFromApi(res.data)
  },
  create: async (data: CreateTeacherYearlyLectureScoreRequest): Promise<TeacherYearlyLectureScore> => {
    const res = await api.post('/teacher-yearly-lecture-score/teacher-yearly-lecture-scores/', mapTeacherYearlyLectureScoreToApi(data))
    return mapTeacherYearlyLectureScoreFromApi(res.data)
  },
  update: async (data: UpdateTeacherYearlyLectureScoreRequest): Promise<TeacherYearlyLectureScore> => {
    const res = await api.put('/teacher-yearly-lecture-score/teacher-yearly-lecture-scores/', mapTeacherYearlyLectureScoreToApi(data))
    return mapTeacherYearlyLectureScoreFromApi(res.data)
  },
  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/teacher-yearly-lecture-score/teacher-yearly-lecture-scores/${id}`)
  },
}

// 教员年度听课打分汇总表服务
import type { TeacherYearlyLectureScoreSummary, CreateTeacherYearlyLectureScoreSummaryRequest, UpdateTeacherYearlyLectureScoreSummaryRequest } from '../types/service'

const mapTeacherYearlyLectureScoreSummaryFromApi = (item: any): TeacherYearlyLectureScoreSummary => ({
  id: item.id,
  campus_name: item.campus_name,
  year: Number(item.year) || new Date().getFullYear(),
  summary_data: item.summary_data || [],
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

const mapTeacherYearlyLectureScoreSummaryToApi = (data: CreateTeacherYearlyLectureScoreSummaryRequest | UpdateTeacherYearlyLectureScoreSummaryRequest) => ({
  id: 'id' in data ? data.id : undefined,
  campus_name: data.campus_name,
  year: data.year,
  summary_data: data.summary_data,
})

export const teacherYearlyLectureScoreSummaryService = {
  getList: async (params: { year?: number; campus_name?: string } = {}): Promise<TeacherYearlyLectureScoreSummary[]> => {
    const res = await api.get('/teacher-yearly-lecture-score/teacher-yearly-lecture-score-summaries/', {
      params: {
        year: params.year,
        campus_name: params.campus_name,
      },
    })
    return (res.data || []).map(mapTeacherYearlyLectureScoreSummaryFromApi)
  },
  getById: async (id: string | number): Promise<TeacherYearlyLectureScoreSummary> => {
    const res = await api.get(`/teacher-yearly-lecture-score/teacher-yearly-lecture-score-summaries/${id}`)
    return mapTeacherYearlyLectureScoreSummaryFromApi(res.data)
  },
  getByYear: async (year: number, campusName?: string): Promise<TeacherYearlyLectureScoreSummary> => {
    const res = await api.get(`/teacher-yearly-lecture-score/teacher-yearly-lecture-score-summaries/year/${year}`, {
      params: { campus_name: campusName },
    })
    return mapTeacherYearlyLectureScoreSummaryFromApi(res.data)
  },
  create: async (data: CreateTeacherYearlyLectureScoreSummaryRequest): Promise<TeacherYearlyLectureScoreSummary> => {
    const res = await api.post('/teacher-yearly-lecture-score/teacher-yearly-lecture-score-summaries/', mapTeacherYearlyLectureScoreSummaryToApi(data))
    return mapTeacherYearlyLectureScoreSummaryFromApi(res.data)
  },
  update: async (data: UpdateTeacherYearlyLectureScoreSummaryRequest): Promise<TeacherYearlyLectureScoreSummary> => {
    const res = await api.put('/teacher-yearly-lecture-score/teacher-yearly-lecture-score-summaries/', mapTeacherYearlyLectureScoreSummaryToApi(data))
    return mapTeacherYearlyLectureScoreSummaryFromApi(res.data)
  },
  upsertByYear: async (year: number, summaryData: any[], campusName?: string): Promise<TeacherYearlyLectureScoreSummary> => {
    const res = await api.post('/teacher-yearly-lecture-score/teacher-yearly-lecture-score-summaries/upsert-by-year', {
      year,
      summary_data: summaryData,
      campus_name: campusName,
    })
    return mapTeacherYearlyLectureScoreSummaryFromApi(res.data)
  },
  delete: async (id: string | number): Promise<void> => {
    await api.delete(`/teacher-yearly-lecture-score/teacher-yearly-lecture-score-summaries/${id}`)
  },
}

// 智慧司听课成绩表（12个月细项）
import type {
  TeacherLectureScoreSheet,
  TeacherLectureScoreRow,
  CreateTeacherLectureScoreSheetRequest,
  UpdateTeacherLectureScoreSheetRequest,
} from '../types/service'

const mapTeacherLectureScoreRowFromApi = (row: any): TeacherLectureScoreRow => ({
  category: row.category,
  standard: row.standard,
  m1: row.m1,
  m2: row.m2,
  m3: row.m3,
  m4: row.m4,
  m5: row.m5,
  m6: row.m6,
  m7: row.m7,
  m8: row.m8,
  m9: row.m9,
  m10: row.m10,
  m11: row.m11,
  m12: row.m12,
  avg: row.avg,
})

const mapTeacherLectureScoreSheetFromApi = (item: any): TeacherLectureScoreSheet => ({
  id: item.id,
  campusName: item.campus_name,
  teacherName: item.teacher_name,
  year: Number(item.year) || new Date().getFullYear(),
  rows: Array.isArray(item.rows) ? item.rows.map(mapTeacherLectureScoreRowFromApi) : [],
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

const mapTeacherLectureScoreSheetToApi = (
  data: CreateTeacherLectureScoreSheetRequest | UpdateTeacherLectureScoreSheetRequest,
) => ({
  id: 'id' in data ? data.id : undefined,
  campus_name: data.campusName,
  teacher_name: data.teacherName,
  year: data.year,
  rows: data.rows,
})

export const teacherLectureScoreSheetService = {
  list: async (params: { campusName?: string; teacherName?: string; year?: number } = {}): Promise<TeacherLectureScoreSheet[]> => {
    const res = await api.get('/teacher-lecture-score/teacher-lecture-scores/', {
      params: {
        campus_name: params.campusName,
        teacher_name: params.teacherName,
        year: params.year,
      },
    })
    return (res.data || []).map(mapTeacherLectureScoreSheetFromApi)
  },
  create: async (data: CreateTeacherLectureScoreSheetRequest): Promise<TeacherLectureScoreSheet> => {
    const res = await api.post('/teacher-lecture-score/teacher-lecture-scores/', mapTeacherLectureScoreSheetToApi(data))
    return mapTeacherLectureScoreSheetFromApi(res.data)
  },
  update: async (data: UpdateTeacherLectureScoreSheetRequest): Promise<TeacherLectureScoreSheet> => {
    const res = await api.put('/teacher-lecture-score/teacher-lecture-scores/', mapTeacherLectureScoreSheetToApi(data))
    return mapTeacherLectureScoreSheetFromApi(res.data)
  },
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/teacher-lecture-score/teacher-lecture-scores/${id}`)
  },
}

// 压力面试成绩服务
export const stressInterviewService = {
  // 获取压力面试成绩列表
  getList: async (
    params: ServiceQueryParams = {},
    campus?: string,
  ): Promise<ServicePageResponse<StressInterviewRecord>> => {
    // 这里应该调用实际的API
    return {
      list: [],
      total: 0,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      totalPages: 0,
    }
  },

  // 获取压力面试成绩详情
  getById: async (id: string, campus?: string): Promise<StressInterviewRecord | null> => {
    // 这里应该调用实际的API
    return null
  },

  // 创建压力面试成绩
  create: async (
    data: CreateStressInterviewRecordRequest,
    campus?: string,
  ): Promise<StressInterviewRecord> => {
    // 这里应该调用实际的API
    throw new Error('Not implemented')
  },

  // 更新压力面试成绩
  update: async (
    data: UpdateStressInterviewRecordRequest,
    campus?: string,
  ): Promise<StressInterviewRecord> => {
    // 这里应该调用实际的API
    throw new Error('Not implemented')
  },

  // 删除压力面试成绩
  delete: async (id: string, campus?: string): Promise<void> => {
    // 这里应该调用实际的API
    throw new Error('Not implemented')
  },

  // 获取压力面试统计
  getStats: async (_campus?: string): Promise<StressInterviewStats> => {
    // 这里应该调用实际的API
    return {} as StressInterviewStats
  },
}

// 服务质量工具函数
export const serviceUtils = {
  // 格式化金额
  formatCurrency: (value: number): string => {
    return `¥${value.toLocaleString()}`
  },

  // 格式化数字
  formatNumber: (value: number): string => {
    return value.toLocaleString()
  },

  // 格式化百分比
  formatPercentage: (value: number): string => {
    return `${value.toFixed(1)}%`
  },

  // 计算平均分
  calculateAverageScore: (scores: number[]): number => {
    const validScores = scores.filter((score) => score > 0)
    return validScores.length > 0
      ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
      : 0
  },

  // 计算项目平均分
  calculateProjectAverage: (projectScore: {
    instructor1: number
    instructor2: number
    instructor3: number
    homeroom1: number
    homeroom2: number
  }): number => {
    const scores = [
      projectScore.instructor1,
      projectScore.instructor2,
      projectScore.instructor3,
      projectScore.homeroom1,
      projectScore.homeroom2,
    ]
    return serviceUtils.calculateAverageScore(scores)
  },

  // 计算总平均分
  // 兼容：当前 types 中 CreateStressInterviewRecordRequest 未包含 project1Score..project5Score 等字段
  // 若后续补齐类型/接口，可再恢复严格类型计算
  calculateTotalAverage: (record: any): number => {
    const project1Avg = record?.project1Score ? serviceUtils.calculateProjectAverage(record.project1Score) : 0
    const project2Avg = record?.project2Score ? serviceUtils.calculateProjectAverage(record.project2Score) : 0
    const project3Avg = record?.project3Score ? serviceUtils.calculateProjectAverage(record.project3Score) : 0
    const project4Avg = record?.project4Score ? serviceUtils.calculateProjectAverage(record.project4Score) : 0
    const project5Avg = record?.project5Score ? serviceUtils.calculateProjectAverage(record.project5Score) : 0

    const averages = [project1Avg, project2Avg, project3Avg, project4Avg, project5Avg]
    return serviceUtils.calculateAverageScore(averages)
  },

  // 验证学生档案数据
  validateStudentProfile: (data: CreateStudentProfileRequest): string[] => {
    const errors: string[] = []

    if (!data.studentName.trim()) {
      errors.push('学生姓名不能为空')
    }

    if (!data.enrollmentDate) {
      errors.push('入学时间不能为空')
    }

    if (data.phone && !/^1[3-9]\d{9}$/.test(data.phone)) {
      errors.push('手机号格式不正确')
    }

    if (data.tuitionAmount && data.tuitionAmount < 0) {
      errors.push('应收学费不能为负数')
    }

    if (data.paidAmount && data.paidAmount < 0) {
      errors.push('已收学费不能为负数')
    }

    return errors
  },

  // 验证每日新生安排数据
  validateNewStudentArrangement: (data: CreateNewStudentArrangementRequest): string[] => {
    const errors: string[] = []

    if (!data.studentName.trim()) {
      errors.push('新生姓名不能为空')
    }

    if (data.age < 16 || data.age > 50) {
      errors.push('年龄必须在16-50之间')
    }

    if (!String(data?.major || '').trim()) {
      errors.push('专业不能为空')
    }

    if (!data.duration.trim()) {
      errors.push('学制不能为空')
    }

    if (data.receivableAmount < 0) {
      errors.push('应收金额不能为负数')
    }

    if (data.receivedAmount < 0) {
      errors.push('已收金额不能为负数')
    }

    if (data.owedAmount < 0) {
      errors.push('欠费金额不能为负数')
    }

    if (!data.enrollmentDate) {
      errors.push('入学日期不能为空')
    }

    if (data.classDays < 0) {
      errors.push('上课天数不能为负数')
    }

    if (!String(data?.campus || '').trim()) {
      errors.push('神殿不能为空')
    }

    return errors
  },

  // 验证压力面试成绩数据
  validateStressInterviewRecord: (data: any): string[] => {
    const errors: string[] = []

    if (!String(data?.studentId || '').trim()) {
      errors.push('学号不能为空')
    }

    if (!String(data?.studentName || '').trim()) {
      errors.push('学员姓名不能为空')
    }

    if (!data.campus.trim()) {
      errors.push('神殿不能为空')
    }

    if (!data.major.trim()) {
      errors.push('专业不能为空')
    }

    if (!String(data?.className || '').trim()) {
      errors.push('班级不能为空')
    }

    if (!String(data?.courseName || '').trim()) {
      errors.push('课程不能为空')
    }

    if (!String(data?.instructorName || '').trim()) {
      errors.push('教员姓名不能为空')
    }

    if (!String(data?.homeroomTeacherName || '').trim()) {
      errors.push('班主任姓名不能为空')
    }

    // 验证评分范围
    const validateProjectScore = (projectScore: any, projectName: string) => {
      const scores = [
        projectScore.instructor1,
        projectScore.instructor2,
        projectScore.instructor3,
        projectScore.homeroom1,
        projectScore.homeroom2,
      ]

      scores.forEach((score, index) => {
        if (score < 0 || score > 100) {
          errors.push(`${projectName}评分${index + 1}必须在0-100之间`)
        }
      })
    }

    if (data?.project1Score) validateProjectScore(data.project1Score, '项目1')
    if (data?.project2Score) validateProjectScore(data.project2Score, '项目2')
    if (data?.project3Score) validateProjectScore(data.project3Score, '项目3')
    if (data?.project4Score) validateProjectScore(data.project4Score, '项目4')
    if (data?.project5Score) validateProjectScore(data.project5Score, '项目5')

    return errors
  },

  // 生成学号
  generateStudentId: (campus: string, major: string, year: number): string => {
    const campusCode = campus.substring(0, 2)
    const majorCode = major.substring(0, 2)
    const randomNum = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')
    return `${campusCode}${majorCode}${year}${randomNum}`
  },

  // 计算欠费金额
  calculateOwedAmount: (receivable: number, received: number): number => {
    return Math.max(0, receivable - received)
  },

  // 计算参与率
  calculateParticipationRate: (actual: number, expected: number): number => {
    return expected > 0 ? (actual / expected) * 100 : 0
  },

  // 计算合格率
  calculateQualificationRate: (qualified: number, actual: number): number => {
    return actual > 0 ? (qualified / actual) * 100 : 0
  },
}

// 导出服务质量模块服务
export const serviceModuleService = {
  studentProfile: studentProfileService,
  newStudentArrangement: newStudentArrangementService,
  stressInterview: stressInterviewService,
  utils: serviceUtils,
}
