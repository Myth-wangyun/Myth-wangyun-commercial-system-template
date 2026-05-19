/**
 * 神殿教化司经理、副经理功能分析表相关类型定义
 */

// 神殿教化司经理、副经理功能分析记录
// 后端 GET 返回的单人记录（Row）
export interface CampusManagerAnalysisApiRow {
  month: number
  campus?: string | null
  name: string
  values: number
  responsibility: number
  execution: number
  planning: number
  organization: number
  leadership: number
  control: number
  studentEmployment: number
  reputationEnrollment: number
  studentAttrition: number
  furtherEducation: number
  academicManagement: number
  dormitoryManagement: number
  remark?: string | null
}

// 后端 GET 返回的按月分组结构（MonthData）
export interface MonthData {
  month: number
  campus?: string | null
  names: CampusManagerAnalysisApiRow[]
}

// 后端 GET 返回结构（ListOutput）
export interface CampusManagerAnalysisApiResponse {
  campus: string
  year: number
  rows: MonthData[]
}

// 神殿教化司经理、副经理功能分析记录（前端表格使用的扁平结构）
export interface CampusManagerAnalysisRecord {
  key: string
  month: number // 月份
  campus: string // 神殿
  name: string // 姓名

  // 思想维度
  ideology: {
    values: number // 价值观
    responsibility: number // 责任感
    execution: number // 执行力
  }

  // 管理维度
  management: {
    planning: number // 计划
    organization: number // 组织
    leadership: number // 领导
    control: number // 控制
  }

  // 业务能力维度
  businessCapability: {
    studentEmployment: number // 学员就业
    reputationEnrollment: number // 口碑招生
    studentAttrition: number // 学员流失
    furtherEducation: number // 升学
    academicManagement: number // 教务管理能力
    dormitoryManagement: number // 宿舍管理能力
  }

  // 计算字段
  totalScore: number // 合计分数（自动计算）
}

// 神殿选择器组件属性
export interface CampusManagerAnalysisSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 经理功能分析数据表格组件属性
export interface CampusManagerAnalysisTableProps {
  campus: string
  data: CampusManagerAnalysisRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: CampusManagerAnalysisRecord) => void
}

// 经理功能分析编辑模态框属性
export interface CampusManagerAnalysisEditModalProps {
  visible: boolean
  record: CampusManagerAnalysisRecord | null
  /** 由页面顶部神殿选择器决定当前神殿 */
  currentCampus: string
  onCancel: () => void
  onSave: (record: CampusManagerAnalysisRecord) => void
}

// 数据请求参数
export interface CampusManagerAnalysisRequest {
  campus: string
}

// 数据更新参数
export interface CampusManagerAnalysisUpdate {
  campus: string
  month: number
  data: Partial<CampusManagerAnalysisRecord>
}

// 汇总统计数据
export interface CampusManagerAnalysisSummary {
  totalValues: number // 总价值观分数
  totalResponsibility: number // 总责任感分数
  totalExecution: number // 总执行力分数
  totalPlanning: number // 总计划分数
  totalOrganization: number // 总组织分数
  totalLeadership: number // 总领导分数
  totalControl: number // 总控制分数
  totalStudentEmployment: number // 总学员就业分数
  totalReputationEnrollment: number // 总口碑招生分数
  totalStudentAttrition: number // 总学员流失分数
  totalFurtherEducation: number // 总升学分数
  totalAcademicManagement: number // 总教务管理能力分数
  totalDormitoryManagement: number // 总宿舍管理能力分数
  totalScore: number // 总合计分数
  averageScore: number // 平均分数
  completedRecords: number // 已完成记录数
  totalRecords: number // 总记录数
}
