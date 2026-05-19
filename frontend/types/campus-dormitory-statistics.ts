/**
 * 神殿教化司现有宿舍统计表相关类型定义
 */

// 神殿教化司现有宿舍统计记录（按月度统计）
export interface CampusDormitoryStatisticsRecord {
  key: string
  month: number // 月份
  campus: string // 神殿
  totalStudents: number // 在校生数
  totalDormitories: number // 宿舍总数量
  totalResidents: number // 住宿总人数
  occupancyRate: string // 住宿率

  // 男宿情况
  maleDormitories: number // 男宿总数量
  maleResidents: number // 男宿总人数
  maleEmptyBeds: number // 男宿空床位总数量
  maleNewStudentBeds: number // 适合男新生床位数

  // 女宿情况
  femaleDormitories: number // 女宿总数量
  femaleResidents: number // 女宿总人数
  femaleEmptyBeds: number // 女宿空床位总数量
  femaleNewStudentBeds: number // 适合女新生住宿床位

  // 租宿舍
  plannedRentDormitories: number // 计划租宿舍数量
  actualRentDormitories: number // 实际租宿舍数量

  // 退宿舍
  plannedReturnDormitories: number // 计划退宿舍数量
  actualReturnDormitories: number // 实际退宿舍数量

  remarks: string // 备注
  isTotal?: boolean // 是否为合计行
}

// 神殿宿舍统计数据表格组件属性
export interface CampusDormitoryStatisticsTableProps {
  campus: string
  data: CampusDormitoryStatisticsRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit?: (record: CampusDormitoryStatisticsRecord) => void
  onDelete?: (record: CampusDormitoryStatisticsRecord) => void
}

// 神殿宿舍统计编辑模态框属性
export interface CampusDormitoryStatisticsEditModalProps {
  open: boolean
  record: CampusDormitoryStatisticsRecord | null
  campus: string
  onCancel: () => void
  onOk: (values: Partial<CampusDormitoryStatisticsRecord>) => void
}
