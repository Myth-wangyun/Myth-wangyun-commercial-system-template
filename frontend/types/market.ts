// 市场模块类型定义

// 媒体来源枚举
export type MediaSource = '百度' | '360' | '搜狗' | '神马' | '头条' | '腾讯' | '其他'

// 日投放数据记录
export interface MarketDailyRecord {
  id: string
  date: string // YYYY-MM-DD格式
  mediaSource: MediaSource
  spend: number // 消费金额(元)
  impressions: number // 展现量
  clicks: number // 点击量
  ip: number // IP数量
  pv: number // PV数量
  dialogues: number // 对话量
  validDialogues: number // 有效对话
  leads: number // 咨询量
  createdAt?: string
  updatedAt?: string
}

// 市场统计数据
export interface MarketStats {
  totalRecords: number // 总记录数
  totalSpend: number // 总消费金额
  totalClicks: number // 总点击量
  totalConversations: number // 总对话量
  totalValidConv: number // 总有效对话
  totalPV: number // 总PV
  totalLeads: number // 总咨询量
  clickRate: number // 点击率
  conversionRate: number // 对话率
  leadRate: number // 咨询率
  avgClickPrice: number // 平均点击成本
}

// 市场汇总数据
export interface MarketSummary {
  mediaSource: MediaSource
  totalSpend: number
  totalClicks: number
  totalConversations: number
  totalValidConv: number
  totalLeads: number
  clickRate: number
  conversionRate: number
  leadRate: number
  avgClickPrice: number
  recordCount: number
}

// 合作方信息
export interface MarketPartner {
  id: string
  name: string // 合作方名称
  contactPerson: string // 联系人
  phone: string // 电话
  email?: string // 邮箱
  address?: string // 地址
  mediaSource: MediaSource // 所属平台
  status: 'active' | 'inactive' // 状态
  notes?: string // 备注
  createdAt?: string
  updatedAt?: string
}

// 查询参数
export interface MarketQueryParams {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
  mediaSource?: MediaSource
  sortBy?: 'date' | 'spend' | 'clicks' | 'conversations'
  sortOrder?: 'asc' | 'desc'
}

// 分页响应
export interface MarketPageResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 创建日投放数据请求
export interface CreateMarketDailyRequest {
  date: string
  mediaSource: MediaSource
  spend: number
  impressions?: number
  clicks?: number
  ip?: number
  pv?: number
  dialogues?: number
  validDialogues?: number
  leads?: number
}

// 更新日投放数据请求
export interface UpdateMarketDailyRequest extends Partial<CreateMarketDailyRequest> {
  id: string
}

// 创建合作方请求
export interface CreatePartnerRequest {
  name: string
  contactPerson: string
  phone: string
  email?: string
  address?: string
  mediaSource: MediaSource
  status?: 'active' | 'inactive'
  notes?: string
}

// 更新合作方请求
export interface UpdatePartnerRequest extends Partial<CreatePartnerRequest> {
  id: string
}

// 统计查询参数
export interface StatsQueryParams {
  startDate?: string
  endDate?: string
  mediaSource?: MediaSource
  groupBy?: 'day' | 'week' | 'month' | 'year'
}

// 时间序列统计数据
export interface TimeSeriesStats {
  period: string
  totalSpend: number
  totalClicks: number
  totalConversations: number
  totalLeads: number
  clickRate: number
  conversionRate: number
  leadRate: number
  avgClickPrice: number
}

// 导出配置
export interface ExportConfig {
  format: 'excel' | 'csv'
  fields: string[]
  startDate?: string
  endDate?: string
  mediaSource?: MediaSource
}

// 表单验证规则
export interface MarketFormRules {
  date: { required: boolean; message: string }
  mediaSource: { required: boolean; message: string }
  spend: { required: boolean; min: number; message: string }
  impressions: { min: number; message: string }
  clicks: { min: number; message: string }
  ip: { min: number; message: string }
  pv: { min: number; message: string }
  dialogues: { min: number; message: string }
  validDialogues: { min: number; message: string }
  leads: { min: number; message: string }
}

// 媒体来源选项
export const MEDIA_SOURCE_OPTIONS: { label: string; value: MediaSource }[] = [
  { label: '百度', value: '百度' },
  { label: '360', value: '360' },
  { label: '搜狗', value: '搜狗' },
  { label: '神马', value: '神马' },
  { label: '头条', value: '头条' },
  { label: '腾讯', value: '腾讯' },
  { label: '其他', value: '其他' },
]

// 默认表单值
export const DEFAULT_MARKET_DAILY_RECORD: Partial<MarketDailyRecord> = {
  date: new Date().toISOString().split('T')[0],
  mediaSource: '百度',
  spend: 0,
  impressions: 0,
  clicks: 0,
  ip: 0,
  pv: 0,
  dialogues: 0,
  validDialogues: 0,
  leads: 0,
}

// 表单验证规则
export const MARKET_FORM_RULES: MarketFormRules = {
  date: { required: true, message: '请选择日期' },
  mediaSource: { required: true, message: '请选择媒体来源' },
  spend: { required: true, min: 0, message: '消费金额不能小于0' },
  impressions: { min: 0, message: '展现量不能小于0' },
  clicks: { min: 0, message: '点击量不能小于0' },
  ip: { min: 0, message: 'IP数量不能小于0' },
  pv: { min: 0, message: 'PV数量不能小于0' },
  dialogues: { min: 0, message: '对话量不能小于0' },
  validDialogues: { min: 0, message: '有效对话不能小于0' },
  leads: { min: 0, message: '咨询量不能小于0' },
}
