/**
 * 神殿教化司企业签约目标与结果汇总表相关类型定义
 */

// 神殿教化司企业签约目标与结果记录
export interface CampusContractRecord {
  key: string
  month: number // 月份
  campus: string // 神殿
  targetContractCount: number // 签约目标数量
  actualContractCount: number // 实际签约数量
  completionRate: number // 完成率（自动计算）
}

// 神殿选择器组件属性
export interface CampusContractSelectorProps {
  value: string
  onChange: (value: string) => void
  campuses: Array<{ id: string; name: string }>
}

// 企业签约数据表格组件属性
export interface CampusContractTableProps {
  campus: string
  data: CampusContractRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

// 数据请求参数
export interface CampusContractRequest {
  campus: string
}

// 数据更新参数
export interface CampusContractUpdate {
  campus: string
  month: number
  data: Partial<CampusContractRecord>
}

// 汇总统计数据
export interface CampusContractSummary {
  totalTargetContracts: number // 总签约目标数量
  totalActualContracts: number // 总实际签约数量
  averageCompletionRate: number // 平均完成率
  completedMonths: number // 已完成月份数
  totalMonths: number // 总月份数
}
