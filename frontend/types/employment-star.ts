/**
 * 神殿后端就业明星汇总表相关类型定义
 */

// 就业明星记录
export interface EmploymentStarRecord {
  key: string
  studentName: string // 学员姓名
  gender: string // 性别
  graduationAge: number // 毕业年龄
  highestEducation: string // 最高学历
  major: string // 专业
  programLength: string // 学制
  className: string // 班级名称
  entryTime: string // 入职时间
  employmentRegion: string // 就业地区
  employer: string // 就业单位
  jobPosition: string // 就业岗位
  employmentSalary: number // 就业薪资

  // 关联信息
  campus: string // 神殿
  serialNumber: number // 序号（自动生成）

  createdAt?: string
  updatedAt?: string
}

// 就业明星表格组件属性
export interface EmploymentStarTableProps {
  campus: string
  data: EmploymentStarRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

// 统计数据
export interface EmploymentStarStats {
  totalStars: number // 就业明星总数
  averageSalary: number // 平均薪资
  highestSalary: number // 最高薪资
  lowestSalary: number // 最低薪资
  byRegion: Record<string, number> // 按地区统计
  byMajor: Record<string, number> // 按专业统计
}
