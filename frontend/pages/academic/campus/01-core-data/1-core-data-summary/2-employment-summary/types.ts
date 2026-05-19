// 后端学员就业汇总表类型定义
import type {
  BaseEntity,
  Campus,
  Major,
  ProgramLength,
} from '@/pages/academic/teaching-content/shared/types'

export interface IEmploymentSummary extends BaseEntity {
  campus: Campus
  major: Major // 专业
  programLength: ProgramLength // 学制
  className: string // 班级名称
  instructor: string // 授课教员
  classTeacher: string // 班主任
  graduationTime: string // 毕业时间
  targetAvgSalary: number // 目标平均就业薪资
  actualAvgSalary: number // 实际平均就业薪资
  achievementRate: number // 达标率(自动计算)
  archivedCount: number // 档案人数
  targetEmployment: number // 目标就业人数
  actualEmployment: number // 实际就业人数
  employmentRate: number // 就业率(自动计算)
  salaryOver10k: number // 薪资过万人数
}

// 表单数据接口
export interface IEmploymentSummaryForm {
  campus: Campus
  major: Major
  programLength: ProgramLength
  className: string
  instructor: string
  classTeacher: string
  graduationTime: string
  targetAvgSalary: number
  actualAvgSalary: number
  archivedCount: number
  targetEmployment: number
  actualEmployment: number
  salaryOver10k: number
}

// 就业统计数据
export interface IEmploymentStats {
  totalClasses: number
  totalGraduates: number
  totalEmployed: number
  avgEmploymentRate: number
  avgTargetSalary: number
  avgActualSalary: number
  totalSalaryOver10k: number
  avgAchievementRate: number
}

// 专业就业对比数据
export interface IMajorEmploymentComparison {
  major: Major
  totalClasses: number
  avgEmploymentRate: number
  avgActualSalary: number
  totalSalaryOver10k: number
}

// 月度就业趋势数据
export interface IEmploymentTrend {
  month: string
  graduates: number
  employed: number
  employmentRate: number
  avgSalary: number
}

// 表格列配置
export const EMPLOYMENT_COLUMNS = [
  {
    title: '序号',
    dataIndex: 'index',
    key: 'index',
    width: 60,
    fixed: 'left' as const,
  },
  {
    title: '神殿',
    dataIndex: 'campus',
    key: 'campus',
    width: 100,
    fixed: 'left' as const,
  },
  {
    title: '专业',
    dataIndex: 'major',
    key: 'major',
    width: 120,
  },
  {
    title: '学制',
    dataIndex: 'programLength',
    key: 'programLength',
    width: 100,
  },
  {
    title: '班级名称',
    dataIndex: 'className',
    key: 'className',
    width: 120,
  },
  {
    title: '授课教员',
    dataIndex: 'instructor',
    key: 'instructor',
    width: 120,
  },
  {
    title: '班主任',
    dataIndex: 'classTeacher',
    key: 'classTeacher',
    width: 120,
  },
  {
    title: '毕业时间',
    dataIndex: 'graduationTime',
    key: 'graduationTime',
    width: 120,
  },
  {
    title: '目标平均就业薪资',
    dataIndex: 'targetAvgSalary',
    key: 'targetAvgSalary',
    width: 150,
    sorter: true,
    render: (value: number) => `¥${value.toLocaleString()}`,
  },
  {
    title: '实际平均就业薪资',
    dataIndex: 'actualAvgSalary',
    key: 'actualAvgSalary',
    width: 150,
    sorter: true,
    render: (value: number) => `¥${value.toLocaleString()}`,
  },
  {
    title: '达标率',
    dataIndex: 'achievementRate',
    key: 'achievementRate',
    width: 100,
    sorter: true,
    render: (value: number) => `${value.toFixed(2)}%`,
  },
  {
    title: '档案人数',
    dataIndex: 'archivedCount',
    key: 'archivedCount',
    width: 100,
    sorter: true,
  },
  {
    title: '目标就业人数',
    dataIndex: 'targetEmployment',
    key: 'targetEmployment',
    width: 120,
    sorter: true,
  },
  {
    title: '实际就业人数',
    dataIndex: 'actualEmployment',
    key: 'actualEmployment',
    width: 120,
    sorter: true,
  },
  {
    title: '就业率',
    dataIndex: 'employmentRate',
    key: 'employmentRate',
    width: 100,
    sorter: true,
    render: (value: number) => `${value.toFixed(2)}%`,
  },
  {
    title: '薪资过万人数',
    dataIndex: 'salaryOver10k',
    key: 'salaryOver10k',
    width: 120,
    sorter: true,
  },
]

// 表单字段配置
export const EMPLOYMENT_FORM_FIELDS = [
  {
    name: 'campus',
    label: '神殿',
    type: 'select' as const,
    required: true,
    placeholder: '请选择神殿',
  },
  {
    name: 'major',
    label: '专业',
    type: 'select' as const,
    required: true,
    placeholder: '请选择专业',
  },
  {
    name: 'programLength',
    label: '学制',
    type: 'select' as const,
    required: true,
    placeholder: '请选择学制',
  },
  {
    name: 'className',
    label: '班级名称',
    type: 'input' as const,
    required: true,
    placeholder: '请输入班级名称',
  },
  {
    name: 'instructor',
    label: '授课教员',
    type: 'input' as const,
    required: true,
    placeholder: '请输入授课教员',
  },
  {
    name: 'classTeacher',
    label: '班主任',
    type: 'input' as const,
    required: true,
    placeholder: '请输入班主任',
  },
  {
    name: 'graduationTime',
    label: '毕业时间',
    type: 'date' as const,
    required: true,
    placeholder: '请选择毕业时间',
  },
  {
    name: 'targetAvgSalary',
    label: '目标平均就业薪资',
    type: 'number' as const,
    required: true,
    placeholder: '请输入目标平均就业薪资',
  },
  {
    name: 'actualAvgSalary',
    label: '实际平均就业薪资',
    type: 'number' as const,
    required: true,
    placeholder: '请输入实际平均就业薪资',
  },
  {
    name: 'archivedCount',
    label: '档案人数',
    type: 'number' as const,
    required: true,
    placeholder: '请输入档案人数',
  },
  {
    name: 'targetEmployment',
    label: '目标就业人数',
    type: 'number' as const,
    required: true,
    placeholder: '请输入目标就业人数',
  },
  {
    name: 'actualEmployment',
    label: '实际就业人数',
    type: 'number' as const,
    required: true,
    placeholder: '请输入实际就业人数',
  },
  {
    name: 'salaryOver10k',
    label: '薪资过万人数',
    type: 'number' as const,
    required: true,
    placeholder: '请输入薪资过万人数',
  },
]
