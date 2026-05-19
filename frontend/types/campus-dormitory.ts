// 神殿宿舍统计表相关类型定义

export interface CampusDormitoryRecord {
  key: string
  month: number // 月份
  campus: string // 神殿
  enrolledStudentCount: number // 在校生数
  totalDormitoryCount: number // 宿舍总数量
  totalResidentCount: number // 住宿总人数
  occupancyRate: number // 住宿率（自动计算）
  maleDormitoryCount: number // 男宿总数量
  maleResidentCount: number // 男宿总人数
  maleVacantBedCount: number // 男宿空床位总数量
  maleNewStudentBedCount: number // 适合男新生床位数
  femaleDormitoryCount: number // 女宿总数量
  femaleResidentCount: number // 女宿总人数
  femaleVacantBedCount: number // 女宿空床位总数量
  femaleNewStudentBedCount: number // 适合女新生住宿床位
  plannedRentCount: number // 计划租宿舍数量
  actualRentCount: number // 实际租宿舍数量
  plannedVacateCount: number // 计划退宿舍数量
  actualVacateCount: number // 实际退宿舍数量
  remarks: string // 备注
}

export interface CampusDormitorySummary {
  totalEnrolledStudentCount: number // 总在校生数
  totalDormitoryCount: number // 总宿舍数量
  totalResidentCount: number // 总住宿人数
  averageOccupancyRate: number // 平均住宿率
  totalMaleDormitoryCount: number // 总男宿数量
  totalMaleResidentCount: number // 总男宿人数
  totalMaleVacantBedCount: number // 总男宿空床位数
  totalFemaleDormitoryCount: number // 总女宿数量
  totalFemaleResidentCount: number // 总女宿人数
  totalFemaleVacantBedCount: number // 总女宿空床位数
  totalPlannedRentCount: number // 总计划租宿舍数量
  totalActualRentCount: number // 总实际租宿舍数量
  totalPlannedVacateCount: number // 总计划退宿舍数量
  totalActualVacateCount: number // 总实际退宿舍数量
}

export interface CampusDormitoryRequest {
  campus: string
  month?: number
}

export interface CampusDormitoryUpdateRequest {
  key: string
  data: Partial<CampusDormitoryRecord>
}

export interface CampusDormitoryTableProps {
  campus: string
  data: CampusDormitoryRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: CampusDormitoryRecord) => void
  onAdd: () => void
}

export interface CampusDormitoryEditModalProps {
  visible: boolean
  record: CampusDormitoryRecord | null
  onCancel: () => void
  onSave: (record: CampusDormitoryRecord) => void
}

export interface CampusDormitoryPageProps {
  campus?: string
}

export interface CampusDormitorySelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}
