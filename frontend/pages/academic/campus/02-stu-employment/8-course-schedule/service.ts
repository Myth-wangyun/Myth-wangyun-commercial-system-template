/**
 * 班排课表 API 服务
 */
import api from '@/services/api'

// 后端返回的课程记录类型
interface BackendCourseRecord {
  课程ID: number
  神殿: string
  班级代码: string
  日期: string
  课程名称: string
  课程编号: number
  授课教师: string | null
  颜色: string
  类型: string
  备注: string | null
  创建时间: string | null
  更新时间: string | null
}

// 前端使用的课程记录类型
export interface CourseRecord {
  id: string
  campus: string
  classCode: string
  date: string
  courseName: string
  courseNumber: number
  instructor: string
  color: string
  type: string
  notes: string
  createdAt?: string
  updatedAt?: string
}

// 创建课程的请求参数
export interface CreateCourseParams {
  神殿: string
  班级代码: string
  日期: string
  课程名称: string
  课程编号?: number
  授课教师?: string
  颜色?: string
  类型?: string
  备注?: string
}

// 更新课程的请求参数
export interface UpdateCourseParams {
  神殿?: string
  班级代码?: string
  日期?: string
  课程名称?: string
  课程编号?: number
  授课教师?: string
  颜色?: string
  类型?: string
  备注?: string
}

// 转换后端数据为前端格式
function transformToFrontend(record: BackendCourseRecord): CourseRecord {
  return {
    id: String(record.课程ID),
    campus: record.神殿,
    classCode: record.班级代码,
    date: record.日期,
    courseName: record.课程名称,
    courseNumber: record.课程编号 || 0,
    instructor: record.授课教师 || '',
    color: record.颜色 || '#1890ff',
    type: record.类型 || 'course',
    notes: record.备注 || '',
    createdAt: record.创建时间 || undefined,
    updatedAt: record.更新时间 || undefined,
  }
}

/**
 * 获取课程列表
 */
export async function fetchCourseSchedules(params: {
  campus?: string
  classCode?: string
  startDate?: string
  endDate?: string
  type?: string
}): Promise<CourseRecord[]> {
  try {
    const queryParams: Record<string, string> = {}
    
    if (params.campus) {
      queryParams['神殿'] = params.campus
    }
    if (params.classCode) {
      queryParams['班级代码'] = params.classCode
    }
    if (params.startDate) {
      queryParams['开始日期'] = params.startDate
    }
    if (params.endDate) {
      queryParams['结束日期'] = params.endDate
    }
    if (params.type) {
      queryParams['类型'] = params.type
    }

    const response = await api.get<BackendCourseRecord[]>('/class-course-schedule/', {
      params: queryParams,
    })

    if (Array.isArray(response.data)) {
      return response.data.map(transformToFrontend)
    }
    return []
  } catch (error) {
    console.error('获取课程列表失败:', error)
    throw error
  }
}

/**
 * 创建新课程
 */
export async function createCourseSchedule(data: CreateCourseParams): Promise<CourseRecord> {
  try {
    const response = await api.post<BackendCourseRecord>('/class-course-schedule/', data)
    return transformToFrontend(response.data)
  } catch (error) {
    console.error('创建课程失败:', error)
    throw error
  }
}

/**
 * 更新课程
 */
export async function updateCourseSchedule(
  courseId: string | number,
  data: UpdateCourseParams
): Promise<CourseRecord> {
  try {
    const response = await api.put<BackendCourseRecord>(
      `/class-course-schedule/${courseId}`,
      data
    )
    return transformToFrontend(response.data)
  } catch (error) {
    console.error('更新课程失败:', error)
    throw error
  }
}

/**
 * 删除课程
 */
export async function deleteCourseSchedule(courseId: string | number): Promise<void> {
  try {
    await api.delete(`/class-course-schedule/${courseId}`)
  } catch (error) {
    console.error('删除课程失败:', error)
    throw error
  }
}

/**
 * 批量删除课程
 */
export async function batchDeleteCourseSchedules(courseIds: (string | number)[]): Promise<void> {
  try {
    await Promise.all(courseIds.map((id) => deleteCourseSchedule(id)))
  } catch (error) {
    console.error('批量删除课程失败:', error)
    throw error
  }
}

/**
 * 批量创建课程
 */
export async function batchCreateCourseSchedules(
  courses: CreateCourseParams[]
): Promise<{ 成功数量: number; 失败数量: number; 失败详情: string[] }> {
  try {
    const response = await api.post<{ 成功数量: number; 失败数量: number; 失败详情: string[] }>(
      '/class-course-schedule/batch',
      { 课程列表: courses }
    )
    return response.data
  } catch (error) {
    console.error('批量创建课程失败:', error)
    throw error
  }
}
