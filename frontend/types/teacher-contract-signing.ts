/**
 * 神殿教化司班主任企业签约目标与结果汇总表相关类型定义
 */

// 班主任企业签约记录
export interface TeacherContractSigningRecord {
  key: string
  month: number // 月份 (1-12)
  handlerName: string // 学校经办人（班主任姓名）
  targetCount: number // 签约目标数量
  actualCount: number // 实际签约数量
  enterpriseName: string // 签约企业名称
  majorDirection: string // 签约专业方向
  cooperationPeriod: string // 合作周期
  contactName: string // 企业联系人姓名
  contactPhone: string // 企业联系电话
  rowType: 'data' | 'subtotal' | 'month-total' // 行类型

  createdAt?: string
  updatedAt?: string
}

// 班主任企业签约汇总表格组件属性
export interface TeacherContractSigningTableProps {
  campus: string
  month?: number
  data: TeacherContractSigningRecord[]
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

// 统计数据
export interface TeacherContractSigningStats {
  totalTargetCount: number // 总目标数量
  totalActualCount: number // 总实际数量
  achievementRate: number // 达成率
  totalEnterprises: number // 签约企业总数
}
