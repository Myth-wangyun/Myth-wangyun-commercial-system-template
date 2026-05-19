/**
 * 从班级档案读取学籍注册信息
 * 
 * 根据班级档案中的以下字段判断学生的注册状态：
 * - 是否承诺注册学历
 * - 承诺注册学历性质
 * - 承诺注册学历级别
 * - 学历学校名称
 * - 是否已注册中专/大专
 */

import { buildApiUrl } from '@/utils/apiBase'

/**
 * 班级档案中的学生记录（简化版，只包含注册相关字段）
 */
export interface ClassFileStudent {
  name: string
  headTeacher?: string
  className?: string
  gender?: string
  idCardNumber?: string
  // 注册相关字段
  promisedRegisterEducation?: string // 是否承诺注册学历（是/否）
  promisedEducationNature?: string // 承诺注册学历性质（如：全日制）
  promisedEducationLevel?: string // 承诺注册学历级别（中专1年/中专3年/其他中等教育/成考/国开/其他高等教育）
  educationSchoolName?: string // 学历学校名称
  registeredSecondaryOrCollege?: string // 是否已注册中专/大专（已注册中专/已注册大专/未注册）
  registeredSchool?: string // 所注册学校
}

/**
 * 学籍注册统计结果（按类别）
 */
export interface EnrollmentStatsByCategory {
  // 中专层次
  secondaryThreeYear: ClassFileStudent[] // 中专3年
  secondaryOneYear: ClassFileStudent[] // 中专1年
  secondaryOther: ClassFileStudent[] // 其他中等教育
  // 大学层次
  collegeAdultExam: ClassFileStudent[] // 成考
  collegeOpenUniv: ClassFileStudent[] // 国开
  collegeOther: ClassFileStudent[] // 其他高等教育
  // 未注册
  notRegistered: ClassFileStudent[] // 承诺注册但未注册
  notPromised: ClassFileStudent[] // 未承诺注册
}

/**
 * 学籍注册统计结果（按班主任）
 */
export interface EnrollmentStatsByTeacher {
  [teacherName: string]: {
    secondaryThreeYear: number
    secondaryOneYear: number
    secondaryOther: number
    collegeAdultExam: number
    collegeOpenUniv: number
    collegeOther: number
    notRegistered: number
    notPromised: number
  }
}

/**
 * 规范化神殿名称（去掉"神殿"后缀）
 */
const normalizeCampus = (campus: string): string => {
  if (!campus) return ''
  return campus.replace(/神殿$/, '').trim()
}

/**
 * 从班级档案API获取所有学生数据
 */
const fetchAllClassFileRecords = async (campus: string): Promise<ClassFileStudent[]> => {
  try {
    const normalizedCampus = normalizeCampus(campus)
    const allRecords: ClassFileStudent[] = []

    // 先获取班级列表
    const classListUrl = buildApiUrl(`/teaching-quality/class-list?campus=${encodeURIComponent(normalizedCampus)}`)
    const classListRes = await fetch(classListUrl)
    
    if (!classListRes.ok) {
      console.warn('[班级档案读取] 获取班级列表失败')
      return []
    }

    const classList = (await classListRes.json()) as Array<{ 班级名称: string; 神殿: string }>
    const uniqueClasses = Array.from(
      new Set(classList.map((c) => c.班级名称).filter(Boolean))
    )

    console.log(`[班级档案读取] 找到 ${uniqueClasses.length} 个班级`)

    // 遍历所有班级，获取学生数据
    for (const className of uniqueClasses) {
      try {
        const url = buildApiUrl(
          `/teaching-quality/class-file?campus=${encodeURIComponent(normalizedCampus)}&class=${encodeURIComponent(className)}`
        )
        const res = await fetch(url)
        if (!res.ok) {
          console.warn(`[班级档案读取] 加载 ${className} 班数据失败`)
          continue
        }
        const result = await res.json()
        const rows = (result?.行列表 || []) as any[]

        const mapped: ClassFileStudent[] = rows
          .filter((r: any) => r.name && String(r.name).trim()) // 只保留有姓名的学生
          .map((r: any) => ({
            name: String(r.name || '').trim(),
            headTeacher: String(r.headTeacher || '').trim(),
            // NOTE: 不从班级档案直接用于花名册的班级字段（按要求），保留原班级信息但不映射到花名册的 class 字段
            className: className,
            // 从班级档案尝试获取性别与身份证号（字段名可能不统一，兼容常见英文/中文字段）
            gender: String(r.gender || r.sex || r.性别 || '').trim(),
            idCardNumber: String(r.idCardNumber || r.idCard || r.id_card || r.身份证件号 || r.身份证号 || '').trim(),
            promisedRegisterEducation: String(r.promisedRegisterEducation || '').trim(),
            promisedEducationNature: String(r.promisedEducationNature || '').trim(),
            promisedEducationLevel: String(r.promisedEducationLevel || '').trim(),
            educationSchoolName: String(r.educationSchoolName || '').trim(),
            registeredSecondaryOrCollege: String(r.registeredSecondaryOrCollege || '').trim(),
            registeredSchool: String(r.registeredSchool || '').trim(),
          }))

        allRecords.push(...mapped)
      } catch (error) {
        console.error(`[班级档案读取] 加载 ${className} 班数据异常:`, error)
      }
    }

    console.log(`[班级档案读取] 共读取 ${allRecords.length} 条学生记录`)
    return allRecords
  } catch (error) {
    console.error('[班级档案读取] 获取班级档案数据失败:', error)
    return []
  }
}

/**
 * 判断学生是否承诺注册学历
 */
const isPromisedToRegister = (student: ClassFileStudent): boolean => {
  const promised = student.promisedRegisterEducation?.toLowerCase()
  return promised === '是' || promised === 'yes' || promised === 'y'
}

/**
 * 判断学生是否已注册（任意类型）
 * 兼容多种字段值格式：已注册中专、已注册大专、已注册、registered 等
 */
const isRegistered = (student: ClassFileStudent): boolean => {
  const status = (student.registeredSecondaryOrCollege || '').toLowerCase()
  // 检查是否包含"已注册"或"registered"，同时排除"未注册"
  if (status.includes('未注册') || status.includes('not registered')) {
    return false
  }
  return status.includes('已注册') || status.includes('registered')
}

/**
 * 判断学生是否已注册中专
 */
const isRegisteredSecondary = (student: ClassFileStudent): boolean => {
  const status = (student.registeredSecondaryOrCollege || '').toLowerCase()
  return status.includes('已注册中专')
}

/**
 * 判断学生是否已注册大专
 */
const isRegisteredCollege = (student: ClassFileStudent): boolean => {
  const status = (student.registeredSecondaryOrCollege || '').toLowerCase()
  return status.includes('已注册大专')
}

/**
 * 根据承诺注册学历级别分类学生
 */
const categorizeStudent = (student: ClassFileStudent): keyof EnrollmentStatsByCategory | null => {
  // 如果未承诺注册，归类为 notPromised
  if (!isPromisedToRegister(student)) {
    return 'notPromised'
  }

  // 如果承诺了但未注册，归类为 notRegistered
  if (!isRegistered(student)) {
    return 'notRegistered'
  }

  // 根据承诺注册学历级别分类
  const level = student.promisedEducationLevel || ''
  
  if (level.includes('中专3年')) {
    return 'secondaryThreeYear'
  } else if (level.includes('中专1年')) {
    return 'secondaryOneYear'
  } else if (level.includes('其他中等教育')) {
    return 'secondaryOther'
  } else if (level.includes('成考')) {
    return 'collegeAdultExam'
  } else if (level.includes('国开')) {
    return 'collegeOpenUniv'
  } else if (level.includes('其他高等教育')) {
    return 'collegeOther'
  }

  // 如果没有明确的级别，根据注册状态判断
  if (isRegisteredSecondary(student)) {
    // 已注册中专但没有明确级别，默认归为中专3年
    return 'secondaryThreeYear'
  } else if (isRegisteredCollege(student)) {
    // 已注册大专但没有明确级别，默认归为成考
    return 'collegeAdultExam'
  }

  // 无法分类，归为未注册
  return 'notRegistered'
}

/**
 * 按类别统计学籍注册情况
 */
export const getEnrollmentStatsByCategory = async (campus: string): Promise<EnrollmentStatsByCategory> => {
  const students = await fetchAllClassFileRecords(campus)
  
  const stats: EnrollmentStatsByCategory = {
    secondaryThreeYear: [],
    secondaryOneYear: [],
    secondaryOther: [],
    collegeAdultExam: [],
    collegeOpenUniv: [],
    collegeOther: [],
    notRegistered: [],
    notPromised: [],
  }

  for (const student of students) {
    const category = categorizeStudent(student)
    if (category) {
      stats[category].push(student)
    }
  }

  console.log('[班级档案读取] 统计结果:', {
    中专3年: stats.secondaryThreeYear.length,
    中专1年: stats.secondaryOneYear.length,
    其他中等教育: stats.secondaryOther.length,
    成考: stats.collegeAdultExam.length,
    国开: stats.collegeOpenUniv.length,
    其他高等教育: stats.collegeOther.length,
    未注册: stats.notRegistered.length,
    未承诺: stats.notPromised.length,
  })

  return stats
}

/**
 * 按班主任统计学籍注册情况
 */
export const getEnrollmentStatsByTeacher = async (campus: string): Promise<EnrollmentStatsByTeacher> => {
  const students = await fetchAllClassFileRecords(campus)
  
  const stats: EnrollmentStatsByTeacher = {}

  for (const student of students) {
    const teacher = student.headTeacher || '未分配班主任'
    
    if (!stats[teacher]) {
      stats[teacher] = {
        secondaryThreeYear: 0,
        secondaryOneYear: 0,
        secondaryOther: 0,
        collegeAdultExam: 0,
        collegeOpenUniv: 0,
        collegeOther: 0,
        notRegistered: 0,
        notPromised: 0,
      }
    }

    const category = categorizeStudent(student)
    if (category) {
      if (category === 'secondaryThreeYear') {
        stats[teacher].secondaryThreeYear++
      } else if (category === 'secondaryOneYear') {
        stats[teacher].secondaryOneYear++
      } else if (category === 'secondaryOther') {
        stats[teacher].secondaryOther++
      } else if (category === 'collegeAdultExam') {
        stats[teacher].collegeAdultExam++
      } else if (category === 'collegeOpenUniv') {
        stats[teacher].collegeOpenUniv++
      } else if (category === 'collegeOther') {
        stats[teacher].collegeOther++
      } else if (category === 'notRegistered') {
        stats[teacher].notRegistered++
      } else if (category === 'notPromised') {
        stats[teacher].notPromised++
      }
    }
  }

  console.log('[班级档案读取] 按班主任统计:', Object.keys(stats).length, '位班主任')

  return stats
}

/**
 * 获取汇总数据（用于填充学籍统计表）
 */
export const getEnrollmentSummaryFromClassFile = async (campus: string) => {
  const statsByCategory = await getEnrollmentStatsByCategory(campus)
  const statsByTeacher = await getEnrollmentStatsByTeacher(campus)

  return {
    // 总计
    total: {
      secondaryThreeYear: statsByCategory.secondaryThreeYear.length,
      secondaryOneYear: statsByCategory.secondaryOneYear.length,
      secondaryOther: statsByCategory.secondaryOther.length,
      collegeAdultExam: statsByCategory.collegeAdultExam.length,
      collegeOpenUniv: statsByCategory.collegeOpenUniv.length,
      collegeOther: statsByCategory.collegeOther.length,
      notRegistered: statsByCategory.notRegistered.length,
      notPromised: statsByCategory.notPromised.length,
    },
    // 按类别
    byCategory: statsByCategory,
    // 按班主任
    byTeacher: statsByTeacher,
  }
}

/**
 * 将班级档案学生数据转换为花名册格式
 */
const convertToRosterFormat = (students: ClassFileStudent[], category: keyof EnrollmentStatsByCategory) => {
  return students.map((student, index) => ({
    key: `${index}-${student.name}`,
    studentName: student.name,
    // 从班级档案获取到的性别和身份证号（如果有）
    gender: student.gender || '',
    idCardNumber: student.idCardNumber || '',
    major: '',
    educationSystem: '',
    // 按要求：花名册的班级字段不要从班级档案获取，保持为空，由上层视图或其他来源提供
    className: '',
    nation: '',
    politicalStatus: '',
    householdType: '',
    contactPhone: '',
    householdAddress: '',
    enrollmentTarget: '',
    isMigrantChild: '',
    registrationYear: '',
    scholarshipStatus: '',
    parentName1: '',
    parentPhone1: '',
    parentName2: '',
    parentPhone2: '',
    campus: '',
    headTeacher: student.headTeacher || '',
    // 已注册花名册特有字段
    schoolName: student.educationSchoolName || '',
    registrationTime: '',
    graduationTime: '',
    studentNumber: '',
    grade: '',
    studyMode: '',
    // 需注册花名册特有字段
    pendingRegistrationTime: '',
  }))
}

/**
 * 为各个花名册提供从班级档案获取数据的功能
 */
export const getRosterDataFromClassFile = async (
  campus: string,
  category: 'secondary-3year-registered' | 'secondary-1year-registered' | 'other-secondary-registered' |
           'secondary-3year-to-register' | 'secondary-1year-to-register' | 'other-secondary-to-register' |
           'adult-exam-registered' | 'adult-exam-to-register' |
           'open-university-registered' | 'open-university-to-register' |
           'other-higher-registered' | 'other-higher-to-register'
) => {
  const stats = await getEnrollmentStatsByCategory(campus)
  
  // 根据类别映射到对应的学生列表
  const categoryMap: Record<string, keyof EnrollmentStatsByCategory> = {
    'secondary-3year-registered': 'secondaryThreeYear',
    'secondary-1year-registered': 'secondaryOneYear',
    'other-secondary-registered': 'secondaryOther',
    'secondary-3year-to-register': 'notRegistered', // 需注册的从未注册中筛选
    'secondary-1year-to-register': 'notRegistered',
    'other-secondary-to-register': 'notRegistered',
    'adult-exam-registered': 'collegeAdultExam',
    'adult-exam-to-register': 'notRegistered',
    'open-university-registered': 'collegeOpenUniv',
    'open-university-to-register': 'notRegistered',
    'other-higher-registered': 'collegeOther',
    'other-higher-to-register': 'notRegistered',
  }
  
  const mappedCategory = categoryMap[category]
  let students = stats[mappedCategory] || []
  
  // 对于"需注册"类别，需要进一步筛选
  if (category.includes('to-register')) {
    // 从未注册的学生中筛选出对应级别的学生
    // 重要：再次确认学生确实未注册（双重检查，防止数据不一致）
    students = stats.notRegistered.filter(student => {
      // 双重检查：确保学生确实未注册
      if (isRegistered(student)) {
        console.warn(`[班级档案读取] 学生 ${student.name} 已注册但出现在未注册列表中，已排除`)
        return false
      }
      
      const level = student.promisedEducationLevel || ''
      if (category === 'secondary-3year-to-register') {
        return level.includes('中专3年')
      } else if (category === 'secondary-1year-to-register') {
        return level.includes('中专1年')
      } else if (category === 'other-secondary-to-register') {
        return level.includes('其他中等教育')
      } else if (category === 'adult-exam-to-register') {
        return level.includes('成考')
      } else if (category === 'open-university-to-register') {
        return level.includes('国开')
      } else if (category === 'other-higher-to-register') {
        return level.includes('其他高等教育')
      }
      return false
    })
  }
  
  return convertToRosterFormat(students, mappedCategory)
}

/**
 * 导出工具对象（与 enrollmentStatisticsAutoFill 保持一致的接口风格）
 */
export const classFileEnrollmentReader = {
  /**
   * 获取按类别分类的学籍统计
   */
  getStatsByCategory: getEnrollmentStatsByCategory,

  /**
   * 获取按班主任分类的学籍统计
   */
  getStatsByTeacher: getEnrollmentStatsByTeacher,

  /**
   * 获取汇总数据
   */
  getSummary: getEnrollmentSummaryFromClassFile,

  /**
   * 获取所有学生记录（原始数据）
   */
  getAllStudents: fetchAllClassFileRecords,

  /**
   * 为花名册获取数据
   */
  getRosterData: getRosterDataFromClassFile,
}

