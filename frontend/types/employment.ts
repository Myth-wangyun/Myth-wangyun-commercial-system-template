// 就业汇总表数据类型定义
export interface EmploymentRecord {
  id: string
  serialNumber: number
  campus: string
  major: string
  programLength: string
  className: string
  instructor: string
  homeroomTeacher: string
  graduationTime: string
  // 就业薪资相关
  targetAverageSalary: number
  actualAverageSalary: number
  achievementRate: number
  // 就业率相关
  fileCount: number
  targetEmploymentCount: number
  actualEmploymentCount: number
  employmentRate: number
  // 薪资过万人数
  highSalaryCount: number
}

// 统计汇总数据
export interface EmploymentSummary {
  totalRecords: number
  totalFileCount: number
  totalTargetEmploymentCount: number
  totalActualEmploymentCount: number
  averageEmploymentRate: number
  averageTargetSalary: number
  averageActualSalary: number
  averageAchievementRate: number
  totalHighSalaryCount: number
}

// 表单数据
export interface EmploymentFormData {
  campus: string
  major: string
  programLength: string
  className: string
  instructor: string
  homeroomTeacher: string
  graduationTime: string
  targetAverageSalary: number
  actualAverageSalary: number
  fileCount: number
  targetEmploymentCount: number
  actualEmploymentCount: number
  highSalaryCount: number
}

// 神殿选项
export const CAMPUS_OPTIONS = [
  { label: '盛邦', value: '盛邦' },
  { label: '其他神殿', value: '其他神殿' },
]

// 专业选项
export const MAJOR_OPTIONS = [
  { label: '云计算', value: '云计算' },
  { label: 'Java开发', value: 'Java开发' },
  { label: 'Python开发', value: 'Python开发' },
  { label: '前端开发', value: '前端开发' },
  { label: '大数据', value: '大数据' },
  { label: '人工智能', value: '人工智能' },
]

// 学制选项
export const PROGRAM_LENGTH_OPTIONS = [
  { label: '6个月', value: '6个月' },
  { label: '12个月', value: '12个月' },
  { label: '18个月', value: '18个月' },
  { label: '24个月', value: '24个月' },
]
