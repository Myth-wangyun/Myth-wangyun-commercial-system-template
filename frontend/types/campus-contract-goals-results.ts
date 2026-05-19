/**
 * 神殿教化司企业签约目标与结果汇总表相关类型定义
 */

// 神殿教化司企业签约目标与结果汇总记录
export interface CampusContractGoalsResultsRecord {
  key: string
  month: number // 月份
  campus: string // 神殿
  targetContractCount: number // 签约目标数量
  actualContractCount: number // 实际签约数量
}

// 神殿选择器组件属性
export interface CampusContractGoalsResultsSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 企业签约目标与结果汇总数据表格组件属性
export interface CampusContractGoalsResultsTableProps {
  campus: string
  data: CampusContractGoalsResultsRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
  onEdit?: (record: CampusContractGoalsResultsRecord) => void
  onAdd?: () => void
}

// 企业签约目标与结果汇总编辑模态框属性
export interface CampusContractGoalsResultsEditModalProps {
  visible: boolean
  record: CampusContractGoalsResultsRecord | null
  onCancel: () => void
  onSave: (record: CampusContractGoalsResultsRecord) => void
}

// 数据请求参数
export interface CampusContractGoalsResultsRequest {
  campus: string
}

// 数据更新参数
export interface CampusContractGoalsResultsUpdate {
  campus: string
  month: number
  data: Partial<CampusContractGoalsResultsRecord>
}

// 汇总统计数据
export interface CampusContractGoalsResultsSummary {
  totalTargetContracts: number // 总目标签约数
  totalActualContracts: number // 总实际签约数
  completionRate: number // 完成率
  averageMonthlyTarget: number // 月均目标
  averageMonthlyActual: number // 月均实际
  completedRecords: number // 已完成记录数
  totalRecords: number // 总记录数
}
