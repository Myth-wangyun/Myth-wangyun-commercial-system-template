/**
 * 神殿教化司企业签约目标与结果汇总表相关类型定义
 */

// 企业签约汇总记录
export interface ContractSigningSummaryRecord {
  key: string
  month: number // 月份 (1-12)
  campus?: string // 神殿（只在第一行显示）
  targetCount: number // 签约目标数量
  actualCount: number // 实际签约数量
  rowType: 'data' | 'total' // 行类型

  createdAt?: string
  updatedAt?: string
}

// 企业签约汇总表格组件属性
export interface ContractSigningSummaryTableProps {
  campus: string
  data: ContractSigningSummaryRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

// 统计数据
export interface ContractSigningSummaryStats {
  totalTargetCount: number // 总目标数量
  totalActualCount: number // 总实际数量
  achievementRate: number // 达成率
  averageMonthlyCount: number // 月均签约数量
}
