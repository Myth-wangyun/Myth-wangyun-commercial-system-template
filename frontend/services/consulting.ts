// [市场模块] 咨询服务

import type {
  ConsultingRecord,
  ConsultingTypeConfig,
  ConsultingStats,
  ConsultingSummary,
  ConsultingTimeSeriesStats,
  CreateConsultingRequest,
  UpdateConsultingRequest,
  CreateConsultingTypeRequest,
  UpdateConsultingTypeRequest,
  ConsultingQueryParams,
  ConsultingStatsQueryParams,
  ConsultingPageResponse,
} from '../types/consulting'

// 咨询工具函数
export const consultingUtils = {
  // 格式化时间
  formatTime: (time: string): string => {
    return time
  },

  // 格式化日期
  formatDate: (date: string): string => {
    return new Date(date).toLocaleDateString('zh-CN')
  },

  // 格式化日期时间
  formatDateTime: (date: string, time: string): string => {
    return `${new Date(date).toLocaleDateString('zh-CN')} ${time}`
  },

  // 计算响应时间
  calculateResponseTime: (createdAt: string, updatedAt: string): number => {
    const created = new Date(createdAt)
    const updated = new Date(updatedAt)
    const diffMs = updated.getTime() - created.getTime()
    return Math.round(diffMs / (1000 * 60 * 60)) // 返回小时数
  },

  // 格式化响应时间
  formatResponseTime: (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}分钟`
    } else if (hours < 24) {
      return `${hours}小时`
    } else {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return `${days}天${remainingHours}小时`
    }
  },

  // 计算完成率
  calculateCompletionRate: (total: number, completed: number): number => {
    return total > 0 ? Number(((completed / total) * 100).toFixed(2)) : 0
  },

  // 格式化百分比
  formatPercentage: (value: number): string => {
    return `${value}%`
  },

  // 格式化数字
  formatNumber: (value: number): string => {
    return value.toLocaleString('zh-CN')
  },

  // 获取状态颜色
  getStatusColor: (status: string): string => {
    const statusColors: Record<string, string> = {
      待处理: 'orange',
      处理中: 'blue',
      已处理: 'green',
      已关闭: 'gray',
    }
    return statusColors[status] || 'default'
  },

  // 获取优先级颜色
  getPriorityColor: (priority: string): string => {
    const priorityColors: Record<string, string> = {
      低: 'green',
      中: 'blue',
      高: 'orange',
      紧急: 'red',
    }
    return priorityColors[priority] || 'default'
  },

  // 验证手机号
  validatePhone: (phone: string): boolean => {
    const phoneRegex = /^1[3-9]\d{9}$/
    return phoneRegex.test(phone)
  },

  // 验证微信
  validateWechat: (wechat: string): boolean => {
    const wechatRegex = /^[a-zA-Z0-9_-]{6,20}$/
    return wechatRegex.test(wechat)
  },

  // 验证QQ
  validateQQ: (qq: string): boolean => {
    const qqRegex = /^[1-9]\d{4,10}$/
    return qqRegex.test(qq)
  },
}

// 咨询记录API服务接口
export interface ConsultingRecordService {
  // 获取咨询记录列表
  getList: (
    params?: ConsultingQueryParams,
    campus?: string,
  ) => Promise<{
    data: ConsultingPageResponse<ConsultingRecord>
    success: boolean
    message: string
  }>

  // 获取咨询记录详情
  getById: (
    id: string,
    campus?: string,
  ) => Promise<{
    data: ConsultingRecord
    success: boolean
    message: string
  }>

  // 创建咨询记录
  create: (
    data: CreateConsultingRequest,
    campus?: string,
  ) => Promise<{
    data: ConsultingRecord
    success: boolean
    message: string
  }>

  // 更新咨询记录
  update: (
    data: UpdateConsultingRequest,
    campus?: string,
  ) => Promise<{
    data: ConsultingRecord
    success: boolean
    message: string
  }>

  // 删除咨询记录
  delete: (
    id: string,
    campus?: string,
  ) => Promise<{
    success: boolean
    message: string
  }>

  // 批量删除咨询记录
  batchDelete: (
    ids: string[],
    campus?: string,
  ) => Promise<{
    success: boolean
    message: string
  }>
}

// 咨询类型配置API服务接口
export interface ConsultingTypeService {
  // 获取咨询类型列表
  getList: (campus?: string) => Promise<{
    data: ConsultingTypeConfig[]
    success: boolean
    message: string
  }>

  // 获取咨询类型详情
  getById: (
    id: string,
    campus?: string,
  ) => Promise<{
    data: ConsultingTypeConfig
    success: boolean
    message: string
  }>

  // 创建咨询类型
  create: (
    data: CreateConsultingTypeRequest,
    campus?: string,
  ) => Promise<{
    data: ConsultingTypeConfig
    success: boolean
    message: string
  }>

  // 更新咨询类型
  update: (
    data: UpdateConsultingTypeRequest,
    campus?: string,
  ) => Promise<{
    data: ConsultingTypeConfig
    success: boolean
    message: string
  }>

  // 删除咨询类型
  delete: (
    id: string,
    campus?: string,
  ) => Promise<{
    success: boolean
    message: string
  }>
}

// 咨询统计API服务接口
export interface ConsultingStatsService {
  // 获取咨询统计数据
  getConsultingStats: (
    params?: ConsultingStatsQueryParams,
    campus?: string,
  ) => Promise<{
    data: ConsultingStats
    success: boolean
    message: string
  }>

  // 获取咨询汇总数据
  getConsultingSummary: (
    params?: ConsultingStatsQueryParams,
    campus?: string,
  ) => Promise<{
    data: ConsultingSummary[]
    success: boolean
    message: string
  }>

  // 获取时间序列统计数据
  getTimeSeriesStats: (
    params?: ConsultingStatsQueryParams,
    campus?: string,
  ) => Promise<{
    data: ConsultingTimeSeriesStats[]
    success: boolean
    message: string
  }>
}

// 咨询服务接口
export interface ConsultingService {
  records: ConsultingRecordService
  types: ConsultingTypeService
  stats: ConsultingStatsService
}

// 导出服务接口（实际项目中会通过依赖注入或工厂模式创建）
export const consultingService: ConsultingService = {
  records: {} as ConsultingRecordService,
  types: {} as ConsultingTypeService,
  stats: {} as ConsultingStatsService,
}
