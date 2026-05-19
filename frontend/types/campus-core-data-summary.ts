/**
 * 神殿教化司核心数据汇总表相关类型定义
 */

// 神殿教化司核心数据汇总记录
export interface CampusCoreDataSummaryRecord {
  key: string
  serialNumber: number // 序号
  campus: string // 神殿
  totalStudents: number // 学生总人数
  totalClasses: number // 班级总个数
  totalTeachingQualityPositions: number // 教质总职数
  totalCadrePositions: number // 干部总职数
  totalEmployees: number // 员工总人数
  totalEmploymentClasses: number // 就业班级总数
  totalEmployedStudents: number // 就业总人数
  employmentRate: number // 就业率
  averageEmploymentSalary: number // 就业平均薪资
  salaryOverTenThousand: number // 薪资过万人数
  totalEnterpriseContracts: number // 企业签约总数
  totalWordOfMouthRegistrations: number // 口碑报名总人数
  totalWordOfMouthRevenue: number // 口碑总收入
  totalFurtherEducationStudents: number // 升学总人数
  totalFurtherEducationRevenue: number // 升学总收入
  furtherEducationRateByAmount: number // 升学率（金额）
  totalNewStudentEnrollments: number // 新生入学总人数
  totalNewStudentRefunds: number // 新生退费总人数
  totalOldStudentRefunds: number // 老生退费总人数
  refundRate: number // 退费率
  turnoverRate: number // 异动率
  totalDormitories: number // 宿舍总个数
  totalDormitoryResidents: number // 宿舍总人数
  targetSecondaryVocationalRegistrations: number // 中专层次目标注册总人数
  targetUniversityRegistrations: number // 大学层次目标注册总人数
}

// 神殿选择器组件属性
export interface CampusCoreDataSummarySelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 核心数据汇总数据表格组件属性
export interface CampusCoreDataSummaryTableProps {
  campus: string
  data: CampusCoreDataSummaryRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: CampusCoreDataSummaryRecord) => void
  onAdd: () => void
}

// 核心数据汇总编辑模态框属性
export interface CampusCoreDataSummaryEditModalProps {
  visible: boolean
  record: CampusCoreDataSummaryRecord | null
  onCancel: () => void
  onSave: (record: CampusCoreDataSummaryRecord) => void
}

// 统计卡片组件属性
export interface CampusCoreDataSummaryStatsProps {
  data: CampusCoreDataSummaryRecord[]
  loading: boolean
}

// 数据请求参数
export interface CampusCoreDataSummaryRequest {
  campus: string
}

// 数据更新参数
export interface CampusCoreDataSummaryUpdate {
  campus: string
  serialNumber: number
  data: Partial<CampusCoreDataSummaryRecord>
}

// 汇总统计数据
export interface CampusCoreDataSummarySummary {
  totalStudents: number // 总学生人数
  totalClasses: number // 总班级数
  totalEmployees: number // 总员工数
  averageEmploymentRate: number // 平均就业率
  averageEmploymentSalary: number // 平均就业薪资
  totalEnterpriseContracts: number // 总企业签约数
  totalWordOfMouthRevenue: number // 总口碑收入
  totalFurtherEducationRevenue: number // 总升学收入
  averageRefundRate: number // 平均退费率
  averageTurnoverRate: number // 平均异动率
  totalDormitoryCapacity: number // 总宿舍容量
  dormitoryOccupancyRate: number // 宿舍入住率
  completedRecords: number // 已完成记录数
  totalRecords: number // 总记录数
}
