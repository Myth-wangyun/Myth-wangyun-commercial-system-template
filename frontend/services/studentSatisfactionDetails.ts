// [教质模块] 学员满意度明细表服务
import { api } from './api'

export interface StudentSatisfactionDetail {
  id: number
  campus_name: string
  year: number
  teacher_name: string
  rows: any[]
  created_at?: string
  updated_at?: string
}

export const listSatisfactionDetails = async (params: {
  campus?: string
  year?: number
  teacher?: string
}) => {
  const res = await api.get('/student-satisfaction/student-satisfaction-details/', {
    params: {
      campus_name: params.campus,
      teacher_name: params.teacher,
      year: params.year,
    },
  })
  return res.data as StudentSatisfactionDetail[]
}
