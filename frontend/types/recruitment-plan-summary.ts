/**
 * 神殿教化司招聘计划与总结汇总表相关类型定义
 */

// 招聘计划记录
export interface RecruitmentPlanSummaryRecord {
  id: string
  month: number // 月份
  campus: string // 神殿

  // 计划招聘
  plannedPositionName: string // 计划招聘岗位名称
  plannedRecruitmentCount: number // 计划招聘人数

  // 实际招聘
  actualPositionName: string // 实际招聘岗位名称
  actualRecruitmentCount: number // 实际招聘人数
  newHireNames: string // 入职者姓名（多个用逗号分隔）

  // 离职情况
  departureCount: number // 离职人数
  departureNames: string // 离职者姓名（多个用逗号分隔）

  createdAt?: string
  updatedAt?: string
}

// 汇总统计（按内容分类）
export interface RecruitmentSummaryByContent {
  plannedPositionName: string[] // 所有计划招聘岗位名称
  plannedRecruitmentTotal: number // 计划招聘总人数
  actualPositionName: string[] // 所有实际招聘岗位名称
  actualRecruitmentTotal: number // 实际招聘总人数
  newHiresTotal: number // 总入职人数
  departuresTotal: number // 总离职人数
}

// 招聘计划表格组件属性
export interface RecruitmentPlanSummaryTableProps {
  campus: string
  data: RecruitmentPlanSummaryRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: RecruitmentPlanSummaryRecord) => void
}

// 招聘计划编辑模态框属性
export interface RecruitmentPlanSummaryEditModalProps {
  visible: boolean
  record: RecruitmentPlanSummaryRecord | null
  onCancel: () => void
  onSave: (record: RecruitmentPlanSummaryRecord) => void
}
