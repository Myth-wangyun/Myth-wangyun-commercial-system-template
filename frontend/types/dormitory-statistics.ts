/**
 * 神殿教化司现有宿舍统计表相关类型定义
 */

// 宿舍统计记录
export interface DormitoryStatisticsRecord {
  key: string
  month: number // 月份
  campus: string // 神殿
  enrolledStudents: number // 在校生数
  totalDormitories: number // 宿舍总数量
  totalOccupants: number // 住宿总人数
  occupancyRate: number // 住宿率
  maleDormitoryCount: number // 男宿总数量
  maleOccupants: number // 男宿总人数
  maleEmptyBeds: number // 男宿空床位总数量
  maleNewStudentBeds: number // 适合男新生床位数
  femaleDormitoryCount: number // 女宿总数量
  femaleOccupants: number // 女宿总人数
  femaleEmptyBeds: number // 女宿空床位总数量
  femaleNewStudentBeds: number // 适合女新生住宿床位
  plannedRentedDormitories: number // 计划租宿舍数量
  actualRentedDormitories: number // 实际租宿舍数量
  plannedVacatedDormitories: number // 计划退宿舍数量
  actualVacatedDormitories: number // 实际退宿舍数量
  remarks: string // 备注

  rowType: 'data' | 'total' // 行类型

  createdAt?: string
  updatedAt?: string
}

// 宿舍统计表格组件属性
export interface DormitoryStatisticsTableProps {
  data: DormitoryStatisticsRecord[]
  loading: boolean
  onRefresh: () => void
  onEdit: (record: DormitoryStatisticsRecord) => void
  onDelete: (record: DormitoryStatisticsRecord) => void
  onExport: () => void
}

// 编辑模态框属性
export interface DormitoryStatisticsEditModalProps {
  open: boolean
  record: DormitoryStatisticsRecord | null
  onCancel: () => void
  onOk: (values: Partial<DormitoryStatisticsRecord>) => void
}

// 统计数据
export interface DormitoryStatisticsStats {
  totalMonths: number // 总月数
  totalEnrolledStudents: number // 总在校生数
  totalDormitories: number // 总宿舍数
  totalOccupants: number // 总住宿人数
  averageOccupancyRate: number // 平均住宿率
  totalMaleDormitories: number // 总男宿数量
  totalMaleOccupants: number // 总男宿人数
  totalFemaleDormitories: number // 总女宿数量
  totalFemaleOccupants: number // 总女宿人数
  totalRentedDormitories: number // 总租宿舍数
  totalVacatedDormitories: number // 总退宿舍数
}
