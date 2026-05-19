/**
 * 神殿教化司招聘计划与总结汇总表相关类型定义
 */

// 神殿教化司招聘计划与总结汇总记录
export interface CampusRecruitmentSummaryRecord {
  key: string
  serialNumber: number // 序号
  content: string // 内容
  january: string // 1月
  february: string // 2月
  march: string // 3月
  april: string // 4月
  may: string // 5月
  june: string // 6月
  july: string // 7月
  august: string // 8月
  september: string // 9月
  october: string // 10月
  november: string // 11月
  december: string // 12月
  total: string // 合计
}

// 神殿选择器组件属性
export interface CampusRecruitmentSummarySelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 招聘计划与总结汇总数据表格组件属性
export interface CampusRecruitmentSummaryTableProps {
  campus: string
  data: CampusRecruitmentSummaryRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit: (record: CampusRecruitmentSummaryRecord) => void
}

// 招聘计划与总结汇总编辑模态框属性
export interface CampusRecruitmentSummaryEditModalProps {
  visible: boolean
  record: CampusRecruitmentSummaryRecord | null
  onCancel: () => void
  onSave: (record: CampusRecruitmentSummaryRecord) => void
}

// 数据请求参数
export interface CampusRecruitmentSummaryRequest {
  campus: string
}

// 数据更新参数
export interface CampusRecruitmentSummaryUpdate {
  campus: string
  serialNumber: number
  data: Partial<CampusRecruitmentSummaryRecord>
}

// 汇总统计数据
export interface CampusRecruitmentSummarySummary {
  totalPlannedRecruitment: number // 总计划招聘人数
  totalActualRecruitment: number // 总实际招聘人数
  totalDepartures: number // 总离职人数
  netGrowth: number // 净增长人数
  recruitmentCompletionRate: number // 招聘完成率
  turnoverRate: number // 离职率
  completedRecords: number // 已完成记录数
  totalRecords: number // 总记录数
  mostRecruitedPosition: string // 招聘最多的岗位
  mostDepartedPosition: string // 离职最多的岗位
}
