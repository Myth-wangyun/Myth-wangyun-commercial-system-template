// 咨询模块类型定义

// 咨询类型枚举
export type ConsultingType = '电话咨询' | '在线咨询' | '微信咨询' | 'QQ咨询' | '现场咨询' | '其他'

// 咨询状态枚举
export type ConsultingStatus = '待处理' | '处理中' | '已处理' | '已关闭'

// 咨询优先级枚举
export type ConsultingPriority = '低' | '中' | '高' | '紧急'

// 咨询记录
export interface ConsultingRecord {
  id: string
  date: string // YYYY-MM-DD格式
  time: string // HH:mm格式
  type: ConsultingType // 咨询类型
  customerName: string // 客户姓名
  customerPhone: string // 客户电话
  customerWechat?: string // 客户微信
  customerQQ?: string // 客户QQ
  source: string // 来源渠道
  subject: string // 咨询主题
  content: string // 咨询内容
  status: ConsultingStatus // 处理状态
  priority: ConsultingPriority // 优先级
  assignedTo?: string // 分配给
  response?: string // 回复内容
  followUpDate?: string // 跟进日期
  notes?: string // 备注
  createdAt?: string
  updatedAt?: string
}

// 咨询类型配置
export interface ConsultingTypeConfig {
  id: string
  name: string // 类型名称
  description?: string // 描述
  color: string // 显示颜色
  isActive: boolean // 是否启用
  sortOrder: number // 排序
  createdAt?: string
  updatedAt?: string
}

// 咨询统计数据
export interface ConsultingStats {
  totalRecords: number // 总记录数
  totalByType: Record<ConsultingType, number> // 按类型统计
  totalByStatus: Record<ConsultingStatus, number> // 按状态统计
  totalByPriority: Record<ConsultingPriority, number> // 按优先级统计
  avgResponseTime: number // 平均响应时间(小时)
  completionRate: number // 完成率(%)
  satisfactionRate?: number // 满意度(%)
}

// 咨询汇总数据
export interface ConsultingSummary {
  date: string
  totalCount: number
  byType: Record<ConsultingType, number>
  byStatus: Record<ConsultingStatus, number>
  avgResponseTime: number
  completionRate: number
}

// 时间序列统计数据
export interface ConsultingTimeSeriesStats {
  period: string
  totalCount: number
  completedCount: number
  avgResponseTime: number
  completionRate: number
  satisfactionRate?: number
}

// 创建咨询记录请求
export interface CreateConsultingRequest {
  date: string
  time: string
  type: ConsultingType
  customerName: string
  customerPhone: string
  customerWechat?: string
  customerQQ?: string
  source: string
  subject: string
  content: string
  status: ConsultingStatus
  priority: ConsultingPriority
  assignedTo?: string
  response?: string
  followUpDate?: string
  notes?: string
}

// 更新咨询记录请求
export interface UpdateConsultingRequest extends Partial<CreateConsultingRequest> {
  id: string
}

// 创建咨询类型请求
export interface CreateConsultingTypeRequest {
  name: string
  description?: string
  color: string
  isActive: boolean
  sortOrder: number
}

// 更新咨询类型请求
export interface UpdateConsultingTypeRequest extends Partial<CreateConsultingTypeRequest> {
  id: string
}

// 查询参数
export interface ConsultingQueryParams {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
  type?: ConsultingType
  status?: ConsultingStatus
  priority?: ConsultingPriority
  assignedTo?: string
  search?: string
  sortBy?: 'date' | 'time' | 'type' | 'status' | 'priority'
  sortOrder?: 'asc' | 'desc'
}

// 统计查询参数
export interface ConsultingStatsQueryParams {
  startDate?: string
  endDate?: string
  type?: ConsultingType
  status?: ConsultingStatus
  groupBy?: 'day' | 'week' | 'month' | 'year'
}

// 分页响应
export interface ConsultingPageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 咨询类型选项
export const CONSULTING_TYPE_OPTIONS: { label: string; value: ConsultingType }[] = [
  { label: '电话咨询', value: '电话咨询' },
  { label: '在线咨询', value: '在线咨询' },
  { label: '微信咨询', value: '微信咨询' },
  { label: 'QQ咨询', value: 'QQ咨询' },
  { label: '现场咨询', value: '现场咨询' },
  { label: '其他', value: '其他' },
]

// 咨询状态选项
export const CONSULTING_STATUS_OPTIONS: {
  label: string
  value: ConsultingStatus
  color: string
}[] = [
  { label: '待处理', value: '待处理', color: 'orange' },
  { label: '处理中', value: '处理中', color: 'blue' },
  { label: '已处理', value: '已处理', color: 'green' },
  { label: '已关闭', value: '已关闭', color: 'gray' },
]

// 咨询优先级选项
export const CONSULTING_PRIORITY_OPTIONS: {
  label: string
  value: ConsultingPriority
  color: string
}[] = [
  { label: '低', value: '低', color: 'green' },
  { label: '中', value: '中', color: 'blue' },
  { label: '高', value: '高', color: 'orange' },
  { label: '紧急', value: '紧急', color: 'red' },
]

// 默认表单值
export const DEFAULT_CONSULTING_RECORD: Partial<ConsultingRecord> = {
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  type: '电话咨询',
  status: '待处理',
  priority: '中',
  source: '',
  subject: '',
  content: '',
  notes: '',
}

// 默认咨询类型配置
export const DEFAULT_CONSULTING_TYPE_CONFIG: Partial<ConsultingTypeConfig> = {
  name: '',
  description: '',
  color: '#1890ff',
  isActive: true,
  sortOrder: 0,
}
