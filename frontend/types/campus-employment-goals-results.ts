/**
 * 神殿后端学员就业目标与结果汇总表相关类型定义
 */

// 神殿后端学员就业目标与结果汇总记录
export interface CampusEmploymentGoalsResultsRecord {
  key: string
  serialNumber: number // 序号
  campus: string // 神殿
  majorDirection: string // 专业方向
  duration: string // 学制
  className: string // 班级名称
  instructor: string // 授课教员
  headTeacher: string // 负责班主任
  graduationDate: string // 毕业时间

  // 薪资达标率
  salaryAttainment: {
    targetAverageSalary: number // 目标平均就业薪资
    actualAverageSalary: number // 实际平均就业薪资
    attainmentRate: number // 达标率
  }

  // 就业率
  employmentRate: {
    fileCount: number // 档案人数
    targetEmploymentCount: number // 目标就业人数
    actualEmploymentCount: number // 实际就业人数
    employmentRate: number // 就业率
  }

  salaryOverTenThousand: number // 薪资过万人数
}

// 神殿选择器组件属性
export interface CampusEmploymentGoalsResultsSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 就业目标与结果汇总数据表格组件属性
export interface CampusEmploymentGoalsResultsTableProps {
  campus: string
  data: CampusEmploymentGoalsResultsRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: CampusEmploymentGoalsResultsRecord) => void
  onAdd?: () => void
}

// 就业目标与结果汇总编辑模态框属性
export interface CampusEmploymentGoalsResultsEditModalProps {
  visible: boolean
  record: CampusEmploymentGoalsResultsRecord | null
  onCancel: () => void
  onSave: (record: CampusEmploymentGoalsResultsRecord) => void
}

// 数据请求参数
export interface CampusEmploymentGoalsResultsRequest {
  campus: string
}

// 数据更新参数
export interface CampusEmploymentGoalsResultsUpdate {
  campus: string
  serialNumber: number
  data: Partial<CampusEmploymentGoalsResultsRecord>
}

// 汇总统计数据
export interface CampusEmploymentGoalsResultsSummary {
  totalClasses: number // 总班级数
  totalStudents: number // 总学生数
  averageTargetSalary: number // 平均目标薪资
  averageActualSalary: number // 平均实际薪资
  averageAttainmentRate: number // 平均达标率
  totalTargetEmployment: number // 总目标就业人数
  totalActualEmployment: number // 总实际就业人数
  averageEmploymentRate: number // 平均就业率
  totalSalaryOverTenThousand: number // 总薪资过万人数
  completedRecords: number // 已完成记录数
  totalRecords: number // 总记录数
}
