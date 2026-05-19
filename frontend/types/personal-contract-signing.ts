/**
 * 神殿教化司个人企业签约目标与结果汇总表相关类型定义
 */

// 个人签约汇总记录
export interface PersonalContractSigningRecord {
  key: string
  serialNumber: number // 序号
  name: string // 姓名
  targetCount: number // 签约目标数量
  actualCount: number // 实际签约数量
  rowType: 'data' | 'total' // 行类型

  createdAt?: string
  updatedAt?: string
}

// 个人签约汇总表格组件属性
export interface PersonalContractSigningTableProps {
  data: PersonalContractSigningRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

// 统计数据
export interface PersonalContractSigningStats {
  totalPeople: number // 总人数
  totalTargetCount: number // 总目标数量
  totalActualCount: number // 总实际数量
  achievementRate: number // 达成率
  averagePerPerson: number // 人均签约数量
}
