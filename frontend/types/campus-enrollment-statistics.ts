/**
 * 神殿教化司学籍统计表相关类型定义
 */

// 神殿教化司学籍统计记录（按月度统计）
export interface CampusEnrollmentStatisticsRecord {
  key: string
  month: number // 月份
  campus: string // 神殿

  // 中专层次
  vocational3YearRegistered: number // 中专3年学籍注册人数
  vocational1YearRegistered: number // 中专1年制人数
  vocationalOtherRegistered: number // 其他已注册人数
  vocationalTargetCount: number // 目标注册人数
  vocationalTargetTime: string // 目标注册时间
  vocationalActualRegistered: number // 实际注册人数

  // 大学层次
  adultExamRegistered: number // 成考注册人数
  openUniversityRegistered: number // 国开注册人数
  universityOtherRegistered: number // 其他已注册人数
  universityTargetCount: number // 目标注册人数
  universityTargetTime: string // 目标注册时间
  universityActualRegistered: number // 实际注册人数

  isTotal?: boolean // 是否为合计行
}

// 表格组件 Props
export interface CampusEnrollmentStatisticsTableProps {
  dataSource: CampusEnrollmentStatisticsRecord[]
  loading?: boolean
  onEdit?: (record: CampusEnrollmentStatisticsRecord) => void
  onDelete?: (key: string) => void
}

// 编辑对话框 Props
export interface CampusEnrollmentStatisticsEditModalProps {
  visible: boolean
  record: CampusEnrollmentStatisticsRecord | null
  onCancel: () => void
  onOk: (values: Partial<CampusEnrollmentStatisticsRecord>) => void
}
