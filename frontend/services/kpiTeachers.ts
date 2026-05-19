// [教质模块] KPI 教员服务
import fallbackTeacherList from '@/data/kpi-teachers.json'
import { api } from './api'
import type { TeacherProfile } from './configMaster'

export interface KpiTeacher {
  id?: number
  name: string
  role?: string
  campusCode?: string
}

export interface KpiTeacherResponse {
  teachers: KpiTeacher[]
}

export interface AddKpiTeacherPayload {
  name: string
  role?: string
  campusCode?: string
}

const FALLBACK_TEACHERS = fallbackTeacherList as KpiTeacher[]

const mapTeachers = (items: TeacherProfile[]): KpiTeacher[] =>
  items.map((item) => ({
    id: item.id,
    name: item.name,
    role: item.title || (item.participate_kpi ? '教员' : '人员'),
    campusCode: item.campus_code,
  }))

export const fetchKpiTeachers = async (campusName?: string): Promise<KpiTeacherResponse> => {
  try {
    const params: any = { participate_kpi: true, active: true }
    if (campusName) {
      params.campus_name = campusName
    }
    const res = await api.get<TeacherProfile[]>('/config/teachers', { params })
    return { teachers: mapTeachers(res.data) }
  } catch (error) {
    console.warn('加载教员配置失败，使用本地数据', error)
    return { teachers: FALLBACK_TEACHERS }
  }
}

export const addKpiTeacher = async (payload: AddKpiTeacherPayload) => {
  await api.post('/config/teachers', {
    name: payload.name,
    campus_code: payload.campusCode || '主神殿',
    title: payload.role || '教员',
    participate_kpi: true,
    is_active: true,
  })
  return fetchKpiTeachers()
}
