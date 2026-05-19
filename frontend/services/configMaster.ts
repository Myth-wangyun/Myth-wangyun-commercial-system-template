import type { Dayjs } from 'dayjs'
import { api } from './api'

export interface CampusProfile {
  code: string
  name: string
  campus_code?: string
  short_name?: string | null
  city?: string | null
  address?: string | null
  contact_name?: string | null
  contact_phone?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface MajorProfile {
  id: number
  campus_name: string  // 后端返回的是 campus_name
  name: string
  description?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ClassProfile {
  id: number
  class_code?: string | null
  class_name: string
  campus_name: string  // 后端返回的是 campus_name
  campus_code?: string
  major_id?: number | null
  major_name?: string | null  // 专业名称（冗余存储）
  homeroom_teacher_id?: number | null
  homeroom_teacher_name?: string | null  // 班主任姓名（冗余存储）
  program_length?: string | null  // 学制（如：1年、1.5年、两年制）
  instructor_name?: string | null  // 授课教员名称（从关联表获取）
  status?: string | null
  start_date?: string | null
  end_date?: string | null
  student_capacity?: number | null  // 计划人数/学生人数
  is_active: boolean
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface TeacherProfile {
  id: number
  name: string
  // 后端返回 campus_name，保留 campus_code 兼容旧调用
  campus_name?: string
  campus_code?: string
  teacher_code?: string | null
  user_id?: number | null
  title?: string | null
  phone?: string | null
  email?: string | null
  specialty?: string | null
  is_active: boolean
  participate_kpi: boolean
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface AssignmentProfile {
  id: number
  teacher_id: number
  class_id: number
  role: string
  start_date?: string | null
  end_date?: string | null
  is_primary: boolean
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface CourseProfile {
  id: number
  course_name: string
  campus_name: string  // 后端返回的是 campus_name
  campus_code?: string
  major_id?: number | null
  description?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface HomeroomTeacherProfile {
  id: number
  name: string
  campus_name: string
  campus_code?: string
  start_date?: string | null
  end_date?: string | null
  teacher_code?: string | null
  title?: string | null
  phone?: string | null
  email?: string | null
  specialty?: string | null
  is_active: boolean
  participate_kpi: boolean
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface EmployeeProfile {
  id: number
  user_id?: number | null
  name: string
  department: string
  position: string
  contact: string
  campus_name?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

const unwrap = async <T,>(promise: Promise<{ data: T }>): Promise<T> => {
  const res = await promise
  return res.data
}

// helper for serializing dates
const formatDate = (value?: Dayjs | null) => (value ? value.format('YYYY-MM-DD') : undefined)
const normalizeDateValue = (value?: string | Dayjs | null) =>
  typeof value === 'string' ? value : formatDate(value || undefined)

// campus
export const fetchCampuses = () => unwrap(api.get<CampusProfile[]>('/config/campuses'))
export const createCampus = (payload: Partial<CampusProfile>) =>
  unwrap(api.post<CampusProfile>('/config/campuses', payload))
export const updateCampus = (name: string, payload: Partial<CampusProfile>) =>
  unwrap(api.put<CampusProfile>(`/config/campuses/${encodeURIComponent(name)}`, payload))
// 注意：后端使用神殿“名称”作为路径参数
export const deleteCampus = (name: string) => unwrap(api.delete(`/config/campuses/${encodeURIComponent(name)}`))
// users by department (从 public.users 获取指定部门人员，按神殿分组)
export interface DepartmentUser {
  user_id: number
  real_name: string
  position: string | null
  phone: string | null
  campus: string
}
export interface DepartmentUserGroup {
  campus: string
  users: DepartmentUser[]
}
export const fetchUsersByDepartment = (department: string) =>
  unwrap(api.get<DepartmentUserGroup[]>('/config/department-users', { params: { department } }))
export const fetchEmployeeDepartments = () => unwrap(api.get<string[]>('/config/employees/departments'))
export const fetchEmployeePositions = () => unwrap(api.get<string[]>('/config/employees/positions'))
// majors
export const fetchMajors = (params?: { campus_code?: string; campus_name?: string; active?: boolean }) => {
  const query = {
    ...params,
    campus_name: params?.campus_name || params?.campus_code,
  }
  return unwrap(api.get<MajorProfile[]>('/config/majors', { params: query }))
}
export const createMajor = (payload: Partial<MajorProfile>) =>
  unwrap(api.post<MajorProfile>('/config/majors', payload))
export const updateMajor = (id: number, payload: Partial<MajorProfile>) =>
  unwrap(api.put<MajorProfile>(`/config/majors/${id}`, payload))
export const deleteMajor = (id: number) => unwrap(api.delete(`/config/majors/${id}`))

// teachers
export const fetchTeachers = (params?: {
  campus_code?: string
  campus_name?: string
  active?: boolean
  participate_kpi?: boolean
  position?: string  // 职位过滤，支持多个职位用逗号分隔
  is_primary?: boolean  // 是否负责强化（从teacher_class_assignments表筛选）
}) => unwrap(api.get<TeacherProfile[]>('/config/teachers', { params }))
export const createTeacher = (payload: Partial<TeacherProfile>) =>
  unwrap(api.post<TeacherProfile>('/config/teachers', payload))
export const updateTeacher = (id: number, payload: Partial<TeacherProfile>) =>
  unwrap(api.put<TeacherProfile>(`/config/teachers/${id}`, payload))
export const deleteTeacher = (id: number) => unwrap(api.delete(`/config/teachers/${id}`))

// classes
export const fetchClasses = (params?: { campus_code?: string; campus_name?: string; major_id?: number; active?: boolean }) => {
  const query = {
    ...params,
    campus_name: params?.campus_name || params?.campus_code,
  }
  return unwrap(api.get<ClassProfile[]>('/config/classes', { params: query }))
}

// 从数据库表获取唯一班级列表（用于补充配置中心的班级列表）
export const fetchClassesFromDatabase = (params?: { campus_name?: string }) =>
  unwrap(api.get<string[]>('/config/classes/from-database', { params }))
export const createClass = (payload: Partial<ClassProfile>) => {
  const body = {
    ...payload,
    start_date: normalizeDateValue(payload.start_date),
    end_date: normalizeDateValue(payload.end_date),
  }
  return unwrap(api.post<ClassProfile>('/config/classes', body))
}
export const updateClass = (id: number, payload: Partial<ClassProfile>) => {
  const body = {
    ...payload,
    start_date: normalizeDateValue(payload.start_date),
    end_date: normalizeDateValue(payload.end_date),
  }
  return unwrap(api.put<ClassProfile>(`/config/classes/${id}`, body))
}
export const deleteClass = (id: number) => unwrap(api.delete(`/config/classes/${id}`))

// assignments
export const fetchAssignments = (params?: { teacher_id?: number; class_id?: number; active_only?: boolean }) =>
  unwrap(api.get<AssignmentProfile[]>('/config/assignments', { params }))
export const createAssignment = (payload: Partial<AssignmentProfile>) => {
  const body = {
    ...payload,
    start_date: normalizeDateValue(payload.start_date),
    end_date: normalizeDateValue(payload.end_date),
  }
  return unwrap(api.post<AssignmentProfile>('/config/assignments', body))
}
export const updateAssignment = (id: number, payload: Partial<AssignmentProfile>) => {
  const body = {
    ...payload,
    start_date: normalizeDateValue(payload.start_date),
    end_date: normalizeDateValue(payload.end_date),
  }
  return unwrap(api.put<AssignmentProfile>(`/config/assignments/${id}`, body))
}
export const deleteAssignment = (id: number) => unwrap(api.delete(`/config/assignments/${id}`))

// courses
export const fetchCourses = (params?: { campus_code?: string; campus_name?: string; major_id?: number; active?: boolean }) => {
  const query = {
    ...params,
    campus_name: params?.campus_name || params?.campus_code,
  }
  return unwrap(api.get<CourseProfile[]>('/config/courses', { params: query }))
}
export const createCourse = (payload: Partial<CourseProfile>) =>
  unwrap(api.post<CourseProfile>('/config/courses', payload))
export const updateCourse = (id: number, payload: Partial<CourseProfile>) =>
  unwrap(api.put<CourseProfile>(`/config/courses/${id}`, payload))
export const deleteCourse = (id: number) => unwrap(api.delete(`/config/courses/${id}`))

// homeroom teachers
export const fetchHomeroomTeachers = (params?: { teacher_id?: number; class_id?: number; campus_name?: string; campus_code?: string; active?: boolean }) => {
  const query = {
    ...params,
    campus_name: params?.campus_name || params?.campus_code,
  }
  return unwrap(api.get<HomeroomTeacherProfile[]>('/config/homeroom-teachers', { params: query }))
}
export const createHomeroomTeacher = (payload: Partial<HomeroomTeacherProfile>) => {
  const body = {
    ...payload,
    start_date: normalizeDateValue(payload.start_date),
    end_date: normalizeDateValue(payload.end_date),
  }
  return unwrap(api.post<HomeroomTeacherProfile>('/config/homeroom-teachers', body))
}
export const updateHomeroomTeacher = (id: number, payload: Partial<HomeroomTeacherProfile>) => {
  const body = {
    ...payload,
    start_date: normalizeDateValue(payload.start_date),
    end_date: normalizeDateValue(payload.end_date),
  }
  return unwrap(api.put<HomeroomTeacherProfile>(`/config/homeroom-teachers/${id}`, body))
}
export const deleteHomeroomTeacher = (id: number) => unwrap(api.delete(`/config/homeroom-teachers/${id}`))

// employees (旧API，保留兼容)
export const fetchEmployees = (params?: { campus_name?: string; department?: string; position?: string; name?: string; is_active?: boolean }) => {
  return unwrap(api.get<EmployeeProfile[]>('/config/employees', { params }))
}
export const fetchDepartments = () => unwrap(api.get<string[]>('/config/employees/departments'))
export const fetchPositions = () => unwrap(api.get<string[]>('/config/employees/positions'))
export const fetchUsers = () => unwrap(api.get<any[]>('/config/employees/users'))
export const createEmployee = (payload: Partial<EmployeeProfile>) => {
  return unwrap(api.post<EmployeeProfile>('/config/employees', payload))
}
export const updateEmployee = (id: number, payload: Partial<EmployeeProfile>) => {
  return unwrap(api.put<EmployeeProfile>(`/config/employees/${id}`, payload))
}
export const deleteEmployee = (id: number) => unwrap(api.delete(`/config/employees/${id}`))
export const importEmployeesFromUsers = () => {
  return unwrap(api.post<{ success: boolean; imported: number; skipped: number; message: string }>('/config/employees/import', {}))
}

// ========== 用户权限管理 (直接操作 users 表) ==========

/** 用户权限配置信息 */
export interface UserPermissionInfo {
  user_id: number
  username: string
  name: string
  department: string | null
  position: string | null
  campus: string | null
  phone: string | null
  email: string | null
  role: string | null
  is_superuser: boolean
  status: string
}

/** 获取用户权限配置列表 */
export const fetchUserPermissions = (params?: { 
  campus?: string
  department?: string
  position?: string
  name?: string 
}) => {
  return unwrap(api.get<UserPermissionInfo[]>('/config/user-permissions', { params }))
}

/** 获取单个用户权限配置 */
export const fetchUserPermission = (userId: number) => {
  return unwrap(api.get<UserPermissionInfo>(`/config/user-permissions/${userId}`))
}

/** 更新用户权限配置 */
export const updateUserPermission = (userId: number, data: {
  department?: string
  position?: string
  campus?: string
  phone?: string
  email?: string
  status?: string
}) => {
  return unwrap(api.put<UserPermissionInfo & { success: boolean; message: string }>(
    `/config/user-permissions/${userId}`, 
    data
  ))
}

/** 创建新员工 */
export const createUserEmployee = (data: {
  username: string
  password: string
  real_name: string
  department: string
  position: string
  campus?: string
  phone?: string
  email?: string
  gender?: string
}) => {
  return unwrap(api.post<UserPermissionInfo & { success: boolean; message: string }>(
    '/config/user-permissions',
    data
  ))
}

/** 删除员工（软删除） */
export const deleteUserEmployee = (userId: number) => {
  return unwrap(api.delete<{ success: boolean; message: string }>(
    `/config/user-permissions/${userId}`
  ))
}

/** 获取部门选项 */
export const fetchDepartmentOptions = () => {
  return unwrap(api.get<string[]>('/config/user-permissions/options/departments'))
}

/** 获取职位选项 */
export const fetchPositionOptions = () => {
  return unwrap(api.get<string[]>('/config/user-permissions/options/positions'))
}

/** 获取神殿选项 */
export const fetchCampusOptions = () => {
  return unwrap(api.get<string[]>('/config/user-permissions/options/campuses'))
}
