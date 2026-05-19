/**
 * 神殿教化司核心数据汇总表相关类型定义
 */

// 神殿教化司核心数据记录
export interface CampusCoreDataRecord {
  key: string
  campus: string

  // 基础信息
  totalStudents: number // 学生总人数
  totalClasses: number // 班级总个数
  qualityStaffCount: number // 教质总职数
  cadreStaffCount: number // 干部总职数
  totalEmployees: number // 员工总人数

  // 就业数据
  employmentClassCount: number // 就业班级总数
  totalEmployed: number // 就业总人数
  employmentRate: number // 就业率
  averageSalary: number // 就业平均薪资
  highSalaryCount: number // 薪资过万人数

  // 业务数据
  enterpriseContracts: number // 企业签约总数
  reputationRegistrations: number // 口碑报名总人数
  reputationRevenue: number // 口碑总收入

  // 升学数据
  furtherEducationCount: number // 升学总人数
  furtherEducationRevenue: number // 升学总收入
  furtherEducationRate: number // 升学率（金额）

  // 学员管理
  newStudentEnrollments: number // 新生入学总人数
  newStudentRefunds: number // 新生退费总人数
  oldStudentRefunds: number // 老生退费总人数
  refundRate: number // 退费率
  fluctuationRate: number // 异动率

  // 宿舍管理
  totalDormitories: number // 宿舍总个数
  totalDormitoryOccupancy: number // 宿舍总人数

  // 学籍管理
  secondaryVocationalTarget: number // 中专层次目标注册总人数
  universityTarget: number // 大学层次目标注册总人数
}

// 神殿选择器组件属性
export interface CampusSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 核心数据表格组件属性
export interface CampusCoreDataTableProps {
  campus: string
  data: CampusCoreDataRecord | null
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

// 数据请求参数
export interface CampusCoreDataRequest {
  campus: string
}

// 数据更新参数
export interface CampusCoreDataUpdate {
  campus: string
  data: Partial<CampusCoreDataRecord>
}
