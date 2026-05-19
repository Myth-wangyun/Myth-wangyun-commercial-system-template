/**
 * 神殿教化司师资配比表相关类型定义
 */

// 师资配比记录
export interface TeacherRatioRecord {
  id: string
  /** 前端合计行标记（非后端字段） */
  isTotal?: boolean
  month: number // 月份
  statisticsTime?: string // 统计时间
  campus: string // 神殿

  // 基础信息
  studentTotal: number // 学生总人数

  // 职数分析
  targetStudentTeacherRatio: string // 目标师生配比
  targetTeacherCount: number // 目标老师总数
  actualTeacherCount: number // 实际老师数量
  headmasterVacancy: number // 班主任空缺职数
  headmasterRedundancy: number // 班主任冗余职数
  targetMiddleManagementRatio: string // 目标中层与班主任配比

  // 干部职数分析
  targetMiddleManagementCount: number // 目标中层人数
  actualMiddleManagementCount: number // 实际中层人数
  middleManagementVacancy: number // 中层空缺职数
  middleManagementRedundancy: number // 中层冗余职数

  createdAt?: string
  updatedAt?: string
}

// 师资配比表格组件属性
export interface TeacherRatioTableProps {
  campus: string
  data: TeacherRatioRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: TeacherRatioRecord) => void
}

// 师资配比编辑模态框属性
export interface TeacherRatioEditModalProps {
  visible: boolean
  record: TeacherRatioRecord | null
  onCancel: () => void
  onSave: (record: TeacherRatioRecord) => void
  /** 默认神殿（新增时带入/编辑时兜底） */
  defaultCampus?: string
  /** 默认月份（新增时带入） */
  defaultMonth?: number
}

// 统计数据
export interface TeacherRatioSummary {
  totalStudents: number // 总学生数
  totalTargetTeachers: number // 总目标老师数
  totalActualTeachers: number // 总实际老师数
  totalHeadmasterVacancy: number // 总班主任空缺数
  totalHeadmasterRedundancy: number // 总班主任冗余数
  totalMiddleManagementVacancy: number // 总中层空缺数
  totalMiddleManagementRedundancy: number // 总中层冗余数
}
