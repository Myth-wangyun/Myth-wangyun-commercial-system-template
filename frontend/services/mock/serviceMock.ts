// 教学质量-学员服务模块Mock数据服务

import {
  generateId,
  mockSuccessResponse,
  mockErrorResponse,
  mockDelay,
  getStorageData,
  setStorageData,
} from './index'

import type {
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
} from '@/types/service'

// 存储键名
const STUDENT_PROFILE_KEY = 'student_profile'
const NEW_STUDENT_ARRANGEMENT_KEY = 'new_student_arrangement'
const STRESS_INTERVIEW_KEY = 'stress_interview'

// 生成随机姓名
const generateStudentName = (): string => {
  const surnames = [
    '王',
    '李',
    '张',
    '刘',
    '陈',
    '杨',
    '赵',
    '黄',
    '周',
    '吴',
    '徐',
    '孙',
    '马',
    '朱',
    '胡',
    '郭',
    '何',
    '高',
    '林',
    '罗',
  ]
  const names = [
    '伟',
    '芳',
    '娜',
    '秀英',
    '敏',
    '静',
    '丽',
    '强',
    '磊',
    '军',
    '明',
    '华',
    '建国',
    '建华',
    '志强',
    '志明',
    '秀兰',
    '秀英',
    '秀华',
    '秀珍',
  ]
  const surname = surnames[Math.floor(Math.random() * surnames.length)]
  const name = names[Math.floor(Math.random() * names.length)]
  return surname + name
}

// 生成随机手机号
const generatePhone = (): string => {
  const prefixes = [
    '130',
    '131',
    '132',
    '133',
    '134',
    '135',
    '136',
    '137',
    '138',
    '139',
    '150',
    '151',
    '152',
    '153',
    '155',
    '156',
    '157',
    '158',
    '159',
    '180',
    '181',
    '182',
    '183',
    '184',
    '185',
    '186',
    '187',
    '188',
    '189',
  ]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, '0')
  return prefix + suffix
}

// 生成随机金额（1000-50000）
const generateAmount = (): number => {
  return Math.floor(Math.random() * 49000) + 1000
}

// 生成随机年龄（16-30）
const generateAge = (): number => {
  return Math.floor(Math.random() * 15) + 16
}

// 生成随机评分（60-100）
const generateScore = (): number => {
  return Math.floor(Math.random() * 41) + 60
}

// 生成学生档案数据
const generateStudentProfile = (): StudentProfile => {
  const gender = Math.random() > 0.5 ? '男' : '女'
  const enrollmentDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]
  const tuitionAmount = generateAmount()
  const paidAmount = Math.floor(tuitionAmount * (0.3 + Math.random() * 0.7))

  return {
    id: generateId(),
    studentName: generateStudentName(),
    gender,
    enrollmentDate,
    enrollmentAge: generateAge(),
    campusSource: '主神殿',
    consultant: '咨询师' + Math.floor(Math.random() * 10 + 1),
    tuitionAmount,
    paidAmount,
    outstandingAmount: tuitionAmount - paidAmount,
    phone: generatePhone(),
    wechat: 'wx_' + Math.random().toString(36).slice(2, 10),
    qq: Math.floor(Math.random() * 1000000000).toString(),
    address: '北京市朝阳区' + Math.floor(Math.random() * 100) + '号',
    emergencyContact: generateStudentName(),
    emergencyPhone: generatePhone(),
    major: ['数字媒体', '前端开发', '后端开发', 'UI设计'][Math.floor(Math.random() * 4)],
    class: 'T' + Math.floor(Math.random() * 1000 + 1000),
    instructor: '教员' + Math.floor(Math.random() * 10 + 1),
    homeroomTeacher: '班主任' + Math.floor(Math.random() * 10 + 1),
    status: (['在校', '休学', '退学', '毕业'] as const)[Math.floor(Math.random() * 4)],
    notes: '备注信息',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// 生成每日新生安排数据
const generateNewStudentArrangement = (): NewStudentArrangement => {
  const gender = Math.random() > 0.5 ? '男' : '女'
  const arrangementDate = new Date().toISOString().split('T')[0]
  const enrollmentDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]
  const receivableAmount = generateAmount()
  const receivedAmount = Math.floor(receivableAmount * (0.2 + Math.random() * 0.8))

  return {
    id: generateId(),
    studentName: generateStudentName(),
    age: generateAge(),
    gender,
    major: ['数字媒体', '前端开发', '后端开发', 'UI设计'][Math.floor(Math.random() * 4)],
    duration: ['6个月', '8个月', '12个月', '18个月'][Math.floor(Math.random() * 4)],
    concerns: '关注就业前景',
    receivableAmount,
    receivedAmount,
    owedAmount: receivableAmount - receivedAmount,
    expectedPaymentDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    teachingContent: '基础课程',
    teachingLocation: '教室A' + Math.floor(Math.random() * 10 + 1),
    enrollmentDate,
    classDays: Math.floor(Math.random() * 30 + 1),
    planner: '规划师' + Math.floor(Math.random() * 10 + 1),
    homeroomTeacher: '班主任' + Math.floor(Math.random() * 10 + 1),
    instructor: '教员' + Math.floor(Math.random() * 10 + 1),
    notes: '新生安排备注',
    recorder: '记录员' + Math.floor(Math.random() * 10 + 1),
    recordTime: new Date().toISOString(),
    arrangementDate,
    campus: ['主神殿', '永恒殿', '李大殿', '智慧阁'][Math.floor(Math.random() * 4)],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// 生成压力面试成绩数据
const generateStressInterviewRecord = (): StressInterviewRecord => {
  const generateProjectScore = () => ({
    instructor1: generateScore(),
    instructor2: generateScore(),
    instructor3: generateScore(),
    homeroom1: generateScore(),
    homeroom2: generateScore(),
    average: 0, // 将在后面计算
  })

  const project1Score = generateProjectScore()
  const project2Score = generateProjectScore()
  const project3Score = generateProjectScore()
  const project4Score = generateProjectScore()
  const project5Score = generateProjectScore()

  // 计算平均分
  const calculateAverage = (score: any) => {
    const scores = [
      score.instructor1,
      score.instructor2,
      score.instructor3,
      score.homeroom1,
      score.homeroom2,
    ]
    return scores.reduce((sum, s) => sum + s, 0) / scores.length
  }

  project1Score.average = calculateAverage(project1Score)
  project2Score.average = calculateAverage(project2Score)
  project3Score.average = calculateAverage(project3Score)
  project4Score.average = calculateAverage(project4Score)
  project5Score.average = calculateAverage(project5Score)

  const totalAverage =
    (project1Score.average +
      project2Score.average +
      project3Score.average +
      project4Score.average +
      project5Score.average) /
    5

  return {
    id: generateId(),
    studentId: 'S' + Math.floor(Math.random() * 100000),
    studentName: generateStudentName(),
    project1Score,
    project2Score,
    project3Score,
    project4Score,
    project5Score,
    totalAverage,
    campus: '慈悲殿',
    major: '数字媒体',
    className: 'S32106',
    courseName: '项目答辩',
    instructorName: '张老师',
    homeroomTeacherName: '李老师',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// 获取学生档案数据
const getStudentProfileData = (campus?: string): StudentProfile[] => {
  const key = campus ? `${STUDENT_PROFILE_KEY}_${campus}` : STUDENT_PROFILE_KEY
  let data = getStorageData<StudentProfile[]>(key, [])

  if (!data || data.length === 0) {
    data = Array.from({ length: 50 }, generateStudentProfile)
    setStorageData(key, data)
  }

  return data
}

// 保存学生档案数据
const saveStudentProfileData = (data: StudentProfile[], campus?: string): void => {
  const key = campus ? `${STUDENT_PROFILE_KEY}_${campus}` : STUDENT_PROFILE_KEY
  setStorageData(key, data)
}

// 获取每日新生安排数据
const getNewStudentArrangementData = (campus?: string): NewStudentArrangement[] => {
  const key = campus ? `${NEW_STUDENT_ARRANGEMENT_KEY}_${campus}` : NEW_STUDENT_ARRANGEMENT_KEY
  let data = getStorageData<NewStudentArrangement[]>(key, [])

  if (!data || data.length === 0) {
    data = Array.from({ length: 30 }, generateNewStudentArrangement)
    setStorageData(key, data)
  }

  return data
}

// 保存每日新生安排数据
const saveNewStudentArrangementData = (data: NewStudentArrangement[], campus?: string): void => {
  const key = campus ? `${NEW_STUDENT_ARRANGEMENT_KEY}_${campus}` : NEW_STUDENT_ARRANGEMENT_KEY
  setStorageData(key, data)
}

// 获取压力面试成绩数据
const getStressInterviewData = (campus?: string): StressInterviewRecord[] => {
  const key = campus ? `${STRESS_INTERVIEW_KEY}_${campus}` : STRESS_INTERVIEW_KEY
  let data = getStorageData<StressInterviewRecord[]>(key, [])

  if (!data || data.length === 0) {
    data = Array.from({ length: 20 }, generateStressInterviewRecord)
    setStorageData(key, data)
  }

  return data
}

// 保存压力面试成绩数据
const saveStressInterviewData = (data: StressInterviewRecord[], campus?: string): void => {
  const key = campus ? `${STRESS_INTERVIEW_KEY}_${campus}` : STRESS_INTERVIEW_KEY
  setStorageData(key, data)
}

// 学生档案服务
const studentProfileService = {
  // 获取学生档案列表
  getList: async (params: ServiceQueryParams = {}, campus?: string) => {
    await mockDelay()

    try {
      let data = getStudentProfileData(campus)

      // 应用搜索条件
      if (params.search) {
        const search = params.search.toLowerCase()
        data = data.filter(
          (item) =>
            item.studentName.toLowerCase().includes(search) ||
            (item.phone && item.phone.includes(search)) ||
            (item.major && item.major.toLowerCase().includes(search)) ||
            (item.class && item.class.toLowerCase().includes(search)),
        )
      }

      // 应用状态筛选
      if (params.status) {
        data = data.filter((item) => item.status === params.status)
      }

      // 排序
      if (params.sortBy) {
        data.sort((a, b) => {
          const aValue = a[params.sortBy as keyof StudentProfile]
          const bValue = b[params.sortBy as keyof StudentProfile]
          const order = params.sortOrder === 'desc' ? -1 : 1
          if (aValue === undefined || bValue === undefined) return 0
          return aValue < bValue ? -order : aValue > bValue ? order : 0
        })
      }

      // 分页
      const page = params.page || 1
      const pageSize = params.pageSize || 20
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const list = data.slice(start, end)

      const response: ServicePageResponse<StudentProfile> = {
        list,
        total: data.length,
        page,
        pageSize,
        totalPages: Math.ceil(data.length / pageSize),
      }

      return mockSuccessResponse(response)
    } catch (error) {
      return mockErrorResponse('获取学生档案列表失败')
    }
  },

  // 获取学生档案详情
  getById: async (id: string, campus?: string) => {
    await mockDelay()

    try {
      const data = getStudentProfileData(campus)
      const item = data.find((item) => item.id === id)

      if (!item) {
        return mockErrorResponse('学生档案不存在')
      }

      return mockSuccessResponse(item)
    } catch (error) {
      return mockErrorResponse('获取学生档案详情失败')
    }
  },

  // 创建学生档案
  create: async (data: CreateStudentProfileRequest, campus?: string) => {
    await mockDelay()

    try {
      const records = getStudentProfileData(campus)
      const newRecord: StudentProfile = {
        id: generateId(),
        ...data,
        outstandingAmount: (data.tuitionAmount || 0) - (data.paidAmount || 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      records.push(newRecord)
      saveStudentProfileData(records, campus)

      return mockSuccessResponse(newRecord)
    } catch (error) {
      return mockErrorResponse('创建学生档案失败')
    }
  },

  // 更新学生档案
  update: async (data: UpdateStudentProfileRequest, campus?: string) => {
    await mockDelay()

    try {
      const records = getStudentProfileData(campus)
      const index = records.findIndex((item) => item.id === data.id)

      if (index === -1) {
        return mockErrorResponse('学生档案不存在')
      }

      records[index] = {
        ...records[index],
        ...data,
        outstandingAmount:
          (data.tuitionAmount || records[index].tuitionAmount || 0) -
          (data.paidAmount || records[index].paidAmount || 0),
        updatedAt: new Date().toISOString(),
      }

      saveStudentProfileData(records, campus)

      return mockSuccessResponse(records[index])
    } catch (error) {
      return mockErrorResponse('更新学生档案失败')
    }
  },

  // 删除学生档案
  delete: async (id: string, campus?: string) => {
    await mockDelay()

    try {
      const records = getStudentProfileData(campus)
      const filteredRecords = records.filter((item) => item.id !== id)

      if (filteredRecords.length === records.length) {
        return mockErrorResponse('学生档案不存在')
      }

      saveStudentProfileData(filteredRecords, campus)

      return mockSuccessResponse(null)
    } catch (error) {
      return mockErrorResponse('删除学生档案失败')
    }
  },

  // 获取学生档案统计
  getStats: async (campus?: string) => {
    await mockDelay()

    try {
      const data = getStudentProfileData(campus)

      if (data.length === 0) {
        return mockSuccessResponse({
          totalStudents: 0,
          totalReceivable: 0,
          totalReceived: 0,
          totalOwed: 0,
          enrollmentRate: 0,
          completionRate: 0,
        })
      }

      const totalStudents = data.length
      const totalReceivable = data.reduce((sum, item) => sum + (item.tuitionAmount || 0), 0)
      const totalReceived = data.reduce((sum, item) => sum + (item.paidAmount || 0), 0)
      const totalOwed = data.reduce((sum, item) => sum + (item.outstandingAmount || 0), 0)
      const enrollmentRate =
        (data.filter((item) => item.status === '在校').length / totalStudents) * 100
      const completionRate =
        (data.filter((item) => item.status === '毕业').length / totalStudents) * 100

      const stats: ServiceStats = {
        totalStudents,
        totalReceivable,
        totalReceived,
        totalOwed,
        enrollmentRate: Number(enrollmentRate.toFixed(2)),
        completionRate: Number(completionRate.toFixed(2)),
      }

      return mockSuccessResponse(stats)
    } catch (error) {
      return mockErrorResponse('获取学生档案统计失败')
    }
  },
}

// 每日新生安排服务
const newStudentArrangementService = {
  // 获取每日新生安排列表
  getList: async (params: ServiceQueryParams = {}, campus?: string) => {
    await mockDelay()

    try {
      let data = getNewStudentArrangementData(campus)

      // 应用筛选条件
      if (params.campus) {
        data = data.filter((item) => item.campus === params.campus)
      }

      if (params.date) {
        data = data.filter((item) => item.arrangementDate === params.date)
      }

      if (params.search) {
        const search = params.search.toLowerCase()
        data = data.filter(
          (item) =>
            item.studentName.toLowerCase().includes(search) ||
            item.major.toLowerCase().includes(search) ||
            (item.planner && item.planner.toLowerCase().includes(search)),
        )
      }

      // 排序
      if (params.sortBy) {
        data.sort((a, b) => {
          const aValue = a[params.sortBy as keyof NewStudentArrangement]
          const bValue = b[params.sortBy as keyof NewStudentArrangement]
          const order = params.sortOrder === 'desc' ? -1 : 1
          if (aValue === undefined || bValue === undefined) return 0
          return aValue < bValue ? -order : aValue > bValue ? order : 0
        })
      }

      // 分页
      const page = params.page || 1
      const pageSize = params.pageSize || 20
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const list = data.slice(start, end)

      const response: ServicePageResponse<NewStudentArrangement> = {
        list,
        total: data.length,
        page,
        pageSize,
        totalPages: Math.ceil(data.length / pageSize),
      }

      return mockSuccessResponse(response)
    } catch (error) {
      return mockErrorResponse('获取每日新生安排列表失败')
    }
  },

  // 获取每日新生安排详情
  getById: async (id: string, campus?: string) => {
    await mockDelay()

    try {
      const data = getNewStudentArrangementData(campus)
      const item = data.find((item) => item.id === id)

      if (!item) {
        return mockErrorResponse('每日新生安排记录不存在')
      }

      return mockSuccessResponse(item)
    } catch (error) {
      return mockErrorResponse('获取每日新生安排详情失败')
    }
  },

  // 创建每日新生安排
  create: async (data: CreateNewStudentArrangementRequest, campus?: string) => {
    await mockDelay()

    try {
      const records = getNewStudentArrangementData(campus)
      const newRecord: NewStudentArrangement = {
        id: generateId(),
        ...data,
        owedAmount: data.receivableAmount - data.receivedAmount,
        recordTime: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      records.push(newRecord)
      saveNewStudentArrangementData(records, campus)

      return mockSuccessResponse(newRecord)
    } catch (error) {
      return mockErrorResponse('创建每日新生安排失败')
    }
  },

  // 更新每日新生安排
  update: async (data: UpdateNewStudentArrangementRequest, campus?: string) => {
    await mockDelay()

    try {
      const records = getNewStudentArrangementData(campus)
      const index = records.findIndex((item) => item.id === data.id)

      if (index === -1) {
        return mockErrorResponse('每日新生安排记录不存在')
      }

      records[index] = {
        ...records[index],
        ...data,
        owedAmount:
          (data.receivableAmount || records[index].receivableAmount) -
          (data.receivedAmount || records[index].receivedAmount),
        updatedAt: new Date().toISOString(),
      }

      saveNewStudentArrangementData(records, campus)

      return mockSuccessResponse(records[index])
    } catch (error) {
      return mockErrorResponse('更新每日新生安排失败')
    }
  },

  // 删除每日新生安排
  delete: async (id: string, campus?: string) => {
    await mockDelay()

    try {
      const records = getNewStudentArrangementData(campus)
      const filteredRecords = records.filter((item) => item.id !== id)

      if (filteredRecords.length === records.length) {
        return mockErrorResponse('每日新生安排记录不存在')
      }

      saveNewStudentArrangementData(filteredRecords, campus)

      return mockSuccessResponse(null)
    } catch (error) {
      return mockErrorResponse('删除每日新生安排失败')
    }
  },

  // 获取每日新生安排统计
  getStats: async (date: string, campus?: string) => {
    await mockDelay()

    try {
      const data = getNewStudentArrangementData(campus).filter(
        (item) => item.arrangementDate === date && (!campus || item.campus === campus),
      )

      if (data.length === 0) {
        return mockSuccessResponse({
          totalStudents: 0,
          totalReceivable: 0,
          totalReceived: 0,
          totalOwed: 0,
          enrollmentRate: 0,
          completionRate: 0,
        })
      }

      const totalStudents = data.length
      const totalReceivable = data.reduce((sum, item) => sum + item.receivableAmount, 0)
      const totalReceived = data.reduce((sum, item) => sum + item.receivedAmount, 0)
      const totalOwed = data.reduce((sum, item) => sum + item.owedAmount, 0)
      const enrollmentRate = 100 // 新生安排都是已入学的
      const completionRate = 0 // 新生还没有毕业的

      const stats: ServiceStats = {
        totalStudents,
        totalReceivable,
        totalReceived,
        totalOwed,
        enrollmentRate,
        completionRate,
      }

      return mockSuccessResponse(stats)
    } catch (error) {
      return mockErrorResponse('获取每日新生安排统计失败')
    }
  },
}

// 压力面试成绩服务
const stressInterviewService = {
  // 获取压力面试成绩列表
  getList: async (params: ServiceQueryParams = {}, campus?: string) => {
    await mockDelay()

    try {
      let data = getStressInterviewData(campus)

      // 应用筛选条件
      if (params.campus) {
        data = data.filter((item) => item.campus === params.campus)
      }

      if (params.search) {
        const search = params.search.toLowerCase()
        data = data.filter(
          (item) =>
            item.studentName.toLowerCase().includes(search) ||
            item.studentId.toLowerCase().includes(search) ||
            item.major.toLowerCase().includes(search) ||
            item.className.toLowerCase().includes(search),
        )
      }

      // 排序
      if (params.sortBy) {
        data.sort((a, b) => {
          const aValue = a[params.sortBy as keyof StressInterviewRecord]
          const bValue = b[params.sortBy as keyof StressInterviewRecord]
          const order = params.sortOrder === 'desc' ? -1 : 1
          if (aValue === undefined || bValue === undefined) return 0
          return aValue < bValue ? -order : aValue > bValue ? order : 0
        })
      }

      // 分页
      const page = params.page || 1
      const pageSize = params.pageSize || 20
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const list = data.slice(start, end)

      const response: ServicePageResponse<StressInterviewRecord> = {
        list,
        total: data.length,
        page,
        pageSize,
        totalPages: Math.ceil(data.length / pageSize),
      }

      return mockSuccessResponse(response)
    } catch (error) {
      return mockErrorResponse('获取压力面试成绩列表失败')
    }
  },

  // 获取压力面试成绩详情
  getById: async (id: string, campus?: string) => {
    await mockDelay()

    try {
      const data = getStressInterviewData(campus)
      const item = data.find((item) => item.id === id)

      if (!item) {
        return mockErrorResponse('压力面试成绩记录不存在')
      }

      return mockSuccessResponse(item)
    } catch (error) {
      return mockErrorResponse('获取压力面试成绩详情失败')
    }
  },

  // 创建压力面试成绩
  create: async (data: CreateStressInterviewRecordRequest, campus?: string) => {
    await mockDelay()

    try {
      const records = getStressInterviewData(campus)

      // 计算平均分
      const calculateAverage = (projectScore: any) => {
        const scores = [
          projectScore.instructor1,
          projectScore.instructor2,
          projectScore.instructor3,
          projectScore.homeroom1,
          projectScore.homeroom2,
        ]
        return scores.reduce((sum, s) => sum + s, 0) / scores.length
      }

      const project1Score = { ...data.project1Score, average: calculateAverage(data.project1Score) }
      const project2Score = { ...data.project2Score, average: calculateAverage(data.project2Score) }
      const project3Score = { ...data.project3Score, average: calculateAverage(data.project3Score) }
      const project4Score = { ...data.project4Score, average: calculateAverage(data.project4Score) }
      const project5Score = { ...data.project5Score, average: calculateAverage(data.project5Score) }

      const totalAverage =
        (project1Score.average +
          project2Score.average +
          project3Score.average +
          project4Score.average +
          project5Score.average) /
        5

      const newRecord: StressInterviewRecord = {
        id: generateId(),
        studentId: data.studentId,
        studentName: data.studentName,
        project1Score,
        project2Score,
        project3Score,
        project4Score,
        project5Score,
        totalAverage,
        campus: data.campus,
        major: data.major,
        className: data.className,
        courseName: data.courseName,
        instructorName: data.instructorName,
        homeroomTeacherName: data.homeroomTeacherName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      records.push(newRecord)
      saveStressInterviewData(records, campus)

      return mockSuccessResponse(newRecord)
    } catch (error) {
      return mockErrorResponse('创建压力面试成绩失败')
    }
  },

  // 更新压力面试成绩
  update: async (data: UpdateStressInterviewRecordRequest, campus?: string) => {
    await mockDelay()

    try {
      const records = getStressInterviewData(campus)
      const index = records.findIndex((item) => item.id === data.id)

      if (index === -1) {
        return mockErrorResponse('压力面试成绩记录不存在')
      }

      // 计算平均分
      const calculateAverage = (projectScore: any) => {
        const scores = [
          projectScore.instructor1,
          projectScore.instructor2,
          projectScore.instructor3,
          projectScore.homeroom1,
          projectScore.homeroom2,
        ]
        return scores.reduce((sum, s) => sum + s, 0) / scores.length
      }

      let updatedRecord = { ...records[index], ...data }

      // 重新计算平均分
      if (data.project1Score) {
        updatedRecord.project1Score = {
          ...data.project1Score,
          average: calculateAverage(data.project1Score),
        }
      }
      if (data.project2Score) {
        updatedRecord.project2Score = {
          ...data.project2Score,
          average: calculateAverage(data.project2Score),
        }
      }
      if (data.project3Score) {
        updatedRecord.project3Score = {
          ...data.project3Score,
          average: calculateAverage(data.project3Score),
        }
      }
      if (data.project4Score) {
        updatedRecord.project4Score = {
          ...data.project4Score,
          average: calculateAverage(data.project4Score),
        }
      }
      if (data.project5Score) {
        updatedRecord.project5Score = {
          ...data.project5Score,
          average: calculateAverage(data.project5Score),
        }
      }

      // 重新计算总平均分
      updatedRecord.totalAverage =
        (updatedRecord.project1Score.average +
          updatedRecord.project2Score.average +
          updatedRecord.project3Score.average +
          updatedRecord.project4Score.average +
          updatedRecord.project5Score.average) /
        5

      updatedRecord.updatedAt = new Date().toISOString()

      records[index] = updatedRecord
      saveStressInterviewData(records, campus)

      return mockSuccessResponse(records[index])
    } catch (error) {
      return mockErrorResponse('更新压力面试成绩失败')
    }
  },

  // 删除压力面试成绩
  delete: async (id: string, campus?: string) => {
    await mockDelay()

    try {
      const records = getStressInterviewData(campus)
      const filteredRecords = records.filter((item) => item.id !== id)

      if (filteredRecords.length === records.length) {
        return mockErrorResponse('压力面试成绩记录不存在')
      }

      saveStressInterviewData(filteredRecords, campus)

      return mockSuccessResponse(null)
    } catch (error) {
      return mockErrorResponse('删除压力面试成绩失败')
    }
  },

  // 获取压力面试统计
  getStats: async (campus?: string) => {
    await mockDelay()

    try {
      const data = getStressInterviewData(campus)

      if (data.length === 0) {
        return mockSuccessResponse({
          reinforcementCount: 0,
          interviewCount: 0,
          expectedCount: 0,
          actualCount: 0,
          qualifiedCount: 0,
          participationRate: 0,
          qualificationRate: 0,
          averageScore: 0,
        })
      }

      const reinforcementCount = data.length
      const interviewCount = data.length * 5 // 每个学生5个项目
      const expectedCount = data.length * 5
      const actualCount = data.length * 5
      const qualifiedCount = data.filter((item) => item.totalAverage >= 60).length * 5
      const participationRate = (actualCount / expectedCount) * 100
      const qualificationRate = (qualifiedCount / actualCount) * 100
      const averageScore = data.reduce((sum, item) => sum + item.totalAverage, 0) / data.length

      const stats: StressInterviewStats = {
        reinforcementCount,
        interviewCount,
        expectedCount,
        actualCount,
        qualifiedCount,
        participationRate: Number(participationRate.toFixed(2)),
        qualificationRate: Number(qualificationRate.toFixed(2)),
        averageScore: Number(averageScore.toFixed(2)),
      }

      return mockSuccessResponse(stats)
    } catch (error) {
      return mockErrorResponse('获取压力面试统计失败')
    }
  },
}

// 导出Mock服务
export const serviceMockService = {
  studentProfile: studentProfileService,
  newStudentArrangement: newStudentArrangementService,
  stressInterview: stressInterviewService,
}
