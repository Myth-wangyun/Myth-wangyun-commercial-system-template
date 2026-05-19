/**
 * 神殿教化司个人宿舍管理统计表相关类型定义
 */

// 个人宿舍管理统计记录
export interface PersonalDormitoryManagementRecord {
  key: string
  serialNumber: number // 序号
  teacherName: string // 班主任姓名
  studentCount: number // 带班人数
  totalDormitories: number // 宿舍管理总数量
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

// 个人宿舍管理统计表格组件属性
export interface PersonalDormitoryManagementTableProps {
  data: PersonalDormitoryManagementRecord[]
  loading: boolean
  onRefresh: () => void
  onEdit: (record: PersonalDormitoryManagementRecord) => void
  onDelete: (record: PersonalDormitoryManagementRecord) => void
  onExport: () => void
}

// 编辑模态框属性
export interface PersonalDormitoryManagementEditModalProps {
  open: boolean
  record: PersonalDormitoryManagementRecord | null
  onCancel: () => void
  onOk: (values: Partial<PersonalDormitoryManagementRecord>) => void
}

// 统计数据
export interface PersonalDormitoryManagementStats {
  totalTeachers: number // 总班主任数
  totalStudentCount: number // 总带班人数
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
