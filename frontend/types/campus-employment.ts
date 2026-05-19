/**
 * 神殿后端学员就业目标与结果汇总表相关类型定义
 */

// 神殿后端学员就业目标与结果记录
export interface CampusEmploymentRecord {
  key: string
  serialNumber: number // 序号
  campus: string // 神殿
  majorDirection: string // 专业方向
  programLength: string // 学制
  className: string // 班级名称
  instructor: string // 授课教员
  homeroomTeacher: string // 负责班主任
  graduationTime: string // 毕业时间

  // 薪资达标率
  targetAverageSalary: number // 目标平均就业薪资
  actualAverageSalary: number // 实际平均就业薪资
  attainmentRate: number // 达标率

  // 就业率
  archiveCount: number // 档案人数
  targetEmploymentCount: number // 目标就业人数
  actualEmploymentCount: number // 实际就业人数
  employmentRate: number // 就业率

  highSalaryCount: number // 薪资过万人数
}

// 神殿选择器组件属性
export interface CampusEmploymentSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 就业数据表格组件属性
export interface CampusEmploymentTableProps {
  campus: string
  data: CampusEmploymentRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

// 数据请求参数
export interface CampusEmploymentRequest {
  campus: string
}

// 数据更新参数
export interface CampusEmploymentUpdate {
  campus: string
  data: Partial<CampusEmploymentRecord>
}

// 汇总统计数据
export interface CampusEmploymentSummary {
  totalArchiveCount: number // 总档案人数
  totalTargetEmployment: number // 总目标就业人数
  totalActualEmployment: number // 总实际就业人数
  averageEmploymentRate: number // 平均就业率
  totalTargetSalary: number // 总目标薪资
  totalActualSalary: number // 总实际薪资
  averageAttainmentRate: number // 平均达标率
  totalHighSalaryCount: number // 总薪资过万人数
}
