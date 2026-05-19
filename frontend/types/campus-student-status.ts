// 神殿学籍统计表相关类型定义

export interface CampusStudentStatusRecord {
  key: string
  month: number // 月份
  campus: string // 神殿

  // 中专层次
  vocationalThreeYearCount: number // 中专3年学籍注册人数
  vocationalOneYearCount: number // 中专1年制人数
  vocationalOtherRegisteredCount: number // 其他已注册人数
  vocationalTargetCount: number // 目标注册人数
  vocationalTargetTime: string // 目标注册时间
  vocationalActualCount: number // 实际注册人数

  // 大学层次
  adultExamCount: number // 成考注册人数
  nationalOpenCount: number // 国开注册人数
  universityOtherRegisteredCount: number // 其他已注册人数
  universityTargetCount: number // 目标注册人数
  universityTargetTime: string // 目标注册时间
  universityActualCount: number // 实际注册人数
}

export interface CampusStudentStatusSummary {
  totalVocationalThreeYearCount: number // 总中专3年学籍注册人数
  totalVocationalOneYearCount: number // 总中专1年制人数
  totalVocationalOtherRegisteredCount: number // 总其他已注册人数
  totalVocationalTargetCount: number // 总目标注册人数
  totalVocationalActualCount: number // 总实际注册人数
  totalAdultExamCount: number // 总成考注册人数
  totalNationalOpenCount: number // 总国开注册人数
  totalUniversityOtherRegisteredCount: number // 总其他已注册人数
  totalUniversityTargetCount: number // 总目标注册人数
  totalUniversityActualCount: number // 总实际注册人数
}

export interface CampusStudentStatusRequest {
  campus: string
  month?: number
}

export interface CampusStudentStatusUpdateRequest {
  key: string
  data: Partial<CampusStudentStatusRecord>
}

export interface CampusStudentStatusTableProps {
  campus: string
  data: CampusStudentStatusRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: CampusStudentStatusRecord) => void
  onAdd: () => void
}

export interface CampusStudentStatusEditModalProps {
  visible: boolean
  record: CampusStudentStatusRecord | null
  onCancel: () => void
  onSave: (record: CampusStudentStatusRecord) => void
}

export interface CampusStudentStatusPageProps {
  campus?: string
}

export interface CampusStudentStatusSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}
