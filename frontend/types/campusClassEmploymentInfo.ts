// 神殿班级就业信息数据类型
export interface CampusClassEmploymentInfo {
  id: string
  serialNumber: number
  name: string
  gender: string
  age: number
  majorApplied: string // 所报专业
  educationLevel: string // 学历
  major: string // 专业
  graduatedSchool: string // 毕业学校
  highestDegreeCertificate: string // 目前所获最高学历证书及性质
  contactPhone: string // 联系电话
  mailingAddress: string // 通信地址
  startDate: string // 入职时间
  employmentRegion: string // 就业地区
  employer: string // 就业单位
  jobPosition: string // 就业岗位
  probationarySalary: number // 试用期薪资
  regularSalaryText?: string // 转正薪资（文本）
  regularSalary: number // 转正金额（数字）
  followUpCompany: string // 回访情况
  followUpAssessmentSalary: number // 回访转正金额
  campus: string // 神殿
  className: string // 班级名称
}

// 班级信息类型
export interface ClassInfo {
  id: string
  name: string
  campus: string
  major: string
  instructor: string
  classAdvisor: string
  graduationTime: string
  programLength?: string // 学制
}

// 神殿班级列表类型
export interface CampusClassList {
  campus: string
  classes: ClassInfo[]
}
