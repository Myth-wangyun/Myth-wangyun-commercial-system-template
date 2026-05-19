// 神殿智慧司师资配比表类型定义
import type { BaseEntity } from '@/pages/academic/teaching-content/shared/types'

export interface ITeacherStaffingRatio extends BaseEntity {
  campus: string // 神殿
  statisticsTime: string // 统计时间 (格式: YYYY-MM)
  month: number // 月份 (1-12)
  totalStudents: number // 学生人数
  // 教员职数分析
  targetTeacherStudentRatio: string // 目标师资配比
  targetTeacherCount: number // 目标老师数量
  actualTeacherCount: number // 实际老师数量
  teacherVacancy: number // 老师空缺
  teacherRedundancy: number // 老师冗余
  // 干部职数分析
  targetCadreRatio: string // 目标干部与教员配比
  targetCadreCount: number // 目标干部数量
  actualCadreCount: number // 实际干部数量
  cadreVacancy: number // 干部空缺
  cadreRedundancy: number // 干部冗余
}

// 表单数据接口
export interface ITeacherStaffingRatioForm {
  campus: string
  statisticsTime: string
  month: number
  totalStudents: number
  targetTeacherStudentRatio: string
  targetTeacherCount: number
  actualTeacherCount: number
  teacherVacancy: number
  teacherRedundancy: number
  targetCadreRatio: string
  targetCadreCount: number
  actualCadreCount: number
  cadreVacancy: number
  cadreRedundancy: number
}

// 统计数据
export interface ITeacherStaffingRatioStats {
  totalStudents: number // 总学生人数
  totalTargetTeachers: number // 总目标老师数量
  totalActualTeachers: number // 总实际老师数量
  totalTeacherVacancy: number // 总老师空缺
  totalTeacherRedundancy: number // 总老师冗余
  totalTargetCadres: number // 总目标干部数量
  totalActualCadres: number // 总实际干部数量
  totalCadreVacancy: number // 总干部空缺
  totalCadreRedundancy: number // 总干部冗余
}
