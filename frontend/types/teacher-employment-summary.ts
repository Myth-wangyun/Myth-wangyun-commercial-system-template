/**
 * 神殿后端班主任就业汇总表相关类型定义
 */

// 班主任就业记录
export interface TeacherEmploymentSummaryRecord {
  key: string
  summaryId?: number // 对应后端汇总ID
  teacherName: string // 教员姓名
  major: string // 专业
  programLength: string // 学制
  className: string // 班级名称
  graduationTime?: string // 毕业时间

  // 就业薪资
  targetAverageSalary?: number // 目标平均就业薪资
  actualAverageSalary?: number // 实际平均就业薪资
  achievementRate?: number // 达标率

  // 就业率
  fileCount?: number // 档案人数
  targetEmploymentCount?: number // 目标就业人数
  actualEmploymentCount?: number // 实际就业人数
  employmentRate?: number // 就业率

  // 薪资过万人数
  salaryOverTenThousand?: number // 薪资过万人数

  // 关联信息
  campus: string // 神殿
  serialNumber: number // 序号

  // 行类型标记
  rowType: 'data' | 'subtotal' | 'total' // 数据类型：正常数据、子合计、总合计

  createdAt?: string
  updatedAt?: string
}

// 班主任就业汇总表格组件属性
export interface TeacherEmploymentSummaryTableProps {
  campus: string
  data: TeacherEmploymentSummaryRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

// 统计数据
export interface TeacherEmploymentSummaryStats {
  totalTeachers: number // 教员总数
  totalClasses: number // 班级总数
  totalSalaryOverTenThousand: number // 薪资过万总人数
  averageAchievementRate: number // 平均达标率
  averageEmploymentRate: number // 平均就业率
}
