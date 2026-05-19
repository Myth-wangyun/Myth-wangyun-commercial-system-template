/**
 * 神殿教化司师资配比表相关类型定义
 */

// 神殿教化司师资配比记录
export interface CampusTeacherRatioRecord {
  key: string
  month: number // 月份
  statisticsTime: string // 统计时间
  campus: string // 神殿
  totalStudents: number // 学生总人数

  // 职数分析
  positionAnalysis: {
    targetTeacherStudentRatio: string // 目标师生配比（如"1:60"）
    targetTeacherCount: number // 目标老师总数
    actualTeacherCount: number // 实际老师数量
    homeroomTeacherVacancies: number // 班主任空缺职数
    homeroomTeacherSurplus: number // 班主任冗余职数
  }

  // 干部职数分析
  cadrePositionAnalysis: {
    targetMiddleManagementRatio: string // 目标中层与班主任配比
    targetMiddleManagementCount: number // 目标中层人数
    actualMiddleManagementCount: number // 实际中层人数
    middleManagementVacancies: number // 中层空缺职数
    middleManagementSurplus: number // 中层冗余职数
  }
}

// 神殿选择器组件属性
export interface CampusTeacherRatioSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 师资配比数据表格组件属性
export interface CampusTeacherRatioTableProps {
  campus: string
  data: CampusTeacherRatioRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: CampusTeacherRatioRecord) => void
}

// 师资配比编辑模态框属性
export interface CampusTeacherRatioEditModalProps {
  visible: boolean
  record: CampusTeacherRatioRecord | null
  onCancel: () => void
  onSave: (record: CampusTeacherRatioRecord) => void
}

// 数据请求参数
export interface CampusTeacherRatioRequest {
  campus: string
}

// 数据更新参数
export interface CampusTeacherRatioUpdate {
  campus: string
  month: number
  data: Partial<CampusTeacherRatioRecord>
}

// 汇总统计数据
export interface CampusTeacherRatioSummary {
  totalStudents: number // 总学生人数
  totalTargetTeachers: number // 总目标老师数
  totalActualTeachers: number // 总实际老师数
  totalHomeroomVacancies: number // 总班主任空缺数
  totalHomeroomSurplus: number // 总班主任冗余数
  totalTargetMiddleManagement: number // 总目标中层人数
  totalActualMiddleManagement: number // 总实际中层人数
  totalMiddleManagementVacancies: number // 总中层空缺数
  totalMiddleManagementSurplus: number // 总中层冗余数
  averageTeacherStudentRatio: number // 平均师生配比
  teacherUtilizationRate: number // 老师利用率
  middleManagementUtilizationRate: number // 中层利用率
  completedRecords: number // 已完成记录数
  totalRecords: number // 总记录数
}
