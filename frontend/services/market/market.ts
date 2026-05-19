// [市场模块] 市场投放数据服务
import { apiService, type ApiResponse } from '../api'
import type {
  MarketDailyRecord,
  MarketStats,
  MarketSummary,
  MarketPartner,
  MarketQueryParams,
  MarketPageResponse,
  CreateMarketDailyRequest,
  UpdateMarketDailyRequest,
  CreatePartnerRequest,
  UpdatePartnerRequest,
  StatsQueryParams,
  TimeSeriesStats,
  ExportConfig,
} from '../../types/market'

// 市场服务
export const marketService = {
  // 日投放数据相关
  daily: {
    // 获取日投放数据列表
    getList: async (
      params: MarketQueryParams = {},
    ): Promise<ApiResponse<MarketPageResponse<MarketDailyRecord>>> => {
      return apiService.get<MarketPageResponse<MarketDailyRecord>>('/market/daily', { params })
    },

    // 获取单条日投放数据
    getById: async (id: string): Promise<ApiResponse<MarketDailyRecord>> => {
      return apiService.get<MarketDailyRecord>(`/market/daily/${id}`)
    },

    // 创建日投放数据
    create: async (data: CreateMarketDailyRequest): Promise<ApiResponse<MarketDailyRecord>> => {
      return apiService.post<MarketDailyRecord>('/market/daily', data)
    },

    // 更新日投放数据
    update: async (data: UpdateMarketDailyRequest): Promise<ApiResponse<MarketDailyRecord>> => {
      return apiService.put<MarketDailyRecord>(`/market/daily/${data.id}`, data)
    },

    // 删除日投放数据
    delete: async (id: string): Promise<ApiResponse<void>> => {
      return apiService.delete<void>(`/market/daily/${id}`)
    },

    // 批量创建日投放数据
    bulkCreate: async (
      data: CreateMarketDailyRequest[],
    ): Promise<ApiResponse<MarketDailyRecord[]>> => {
      return apiService.post<MarketDailyRecord[]>('/market/daily/bulk', data)
    },
  },

  // 统计数据相关
  stats: {
    // 获取市场统计数据
    getMarketStats: async (params: StatsQueryParams = {}): Promise<ApiResponse<MarketStats>> => {
      return apiService.get<MarketStats>('/market/stats', { params })
    },

    // 获取市场汇总数据
    getMarketSummary: async (
      params: StatsQueryParams = {},
    ): Promise<ApiResponse<MarketSummary[]>> => {
      return apiService.get<MarketSummary[]>('/market/summary', { params })
    },

    // 获取时间序列统计数据
    getTimeSeriesStats: async (
      params: StatsQueryParams = {},
    ): Promise<ApiResponse<TimeSeriesStats[]>> => {
      return apiService.get<TimeSeriesStats[]>('/market/stats/timeseries', { params })
    },
  },

  // 合作方管理相关
  partners: {
    // 获取合作方列表
    getList: async (
      params: { page?: number; pageSize?: number; search?: string } = {},
    ): Promise<ApiResponse<MarketPageResponse<MarketPartner>>> => {
      return apiService.get<MarketPageResponse<MarketPartner>>('/market/partners', { params })
    },

    // 获取单条合作方信息
    getById: async (id: string): Promise<ApiResponse<MarketPartner>> => {
      return apiService.get<MarketPartner>(`/market/partners/${id}`)
    },

    // 创建合作方
    create: async (data: CreatePartnerRequest): Promise<ApiResponse<MarketPartner>> => {
      return apiService.post<MarketPartner>('/market/partners', data)
    },

    // 更新合作方
    update: async (data: UpdatePartnerRequest): Promise<ApiResponse<MarketPartner>> => {
      return apiService.put<MarketPartner>(`/market/partners/${data.id}`, data)
    },

    // 删除合作方
    delete: async (id: string): Promise<ApiResponse<void>> => {
      return apiService.delete<void>(`/market/partners/${id}`)
    },
  },

  // 数据导出相关
  export: {
    // 导出市场数据
    exportData: async (config: ExportConfig): Promise<Blob> => {
      const response = await apiService.post('/market/export', config, {
        responseType: 'blob',
      })
      return response.data
    },

    // 下载导出文件
    downloadFile: (blob: Blob, filename: string): void => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    },
  },
}

// 计算统计指标的工具函数
export const marketUtils = {
  // 计算点击率
  calculateClickRate: (clicks: number, impressions: number): number => {
    if (impressions === 0) return 0
    return Number(((clicks / impressions) * 100).toFixed(2))
  },

  // 计算对话率
  calculateConversionRate: (dialogues: number, clicks: number): number => {
    if (clicks === 0) return 0
    return Number(((dialogues / clicks) * 100).toFixed(2))
  },

  // 计算有效对话率
  calculateValidConvRate: (validDialogues: number, dialogues: number): number => {
    if (dialogues === 0) return 0
    return Number(((validDialogues / dialogues) * 100).toFixed(2))
  },

  // 计算咨询率
  calculateLeadRate: (leads: number, validDialogues: number): number => {
    if (validDialogues === 0) return 0
    return Number(((leads / validDialogues) * 100).toFixed(2))
  },

  // 计算平均点击成本
  calculateAvgClickPrice: (spend: number, clicks: number): number => {
    if (clicks === 0) return 0
    return Number((spend / clicks).toFixed(2))
  },

  // 计算总统计指标
  calculateTotalStats: (records: MarketDailyRecord[]): MarketStats => {
    const totalRecords = records.length
    const totalSpend = records.reduce((sum, record) => sum + record.spend, 0)
    const totalClicks = records.reduce((sum, record) => sum + record.clicks, 0)
    const totalConversations = records.reduce((sum, record) => sum + record.dialogues, 0)
    const totalValidConv = records.reduce((sum, record) => sum + record.validDialogues, 0)
    const totalPV = records.reduce((sum, record) => sum + record.pv, 0)
    const totalLeads = records.reduce((sum, record) => sum + record.leads, 0)
    const totalImpressions = records.reduce((sum, record) => sum + record.impressions, 0)

    return {
      totalRecords,
      totalSpend,
      totalClicks,
      totalConversations,
      totalValidConv,
      totalPV,
      totalLeads,
      clickRate: marketUtils.calculateClickRate(totalClicks, totalImpressions),
      conversionRate: marketUtils.calculateConversionRate(totalConversations, totalClicks),
      leadRate: marketUtils.calculateLeadRate(totalLeads, totalValidConv),
      avgClickPrice: marketUtils.calculateAvgClickPrice(totalSpend, totalClicks),
    }
  },

  // 按媒体来源汇总数据
  calculateSummaryByMedia: (records: MarketDailyRecord[]): MarketSummary[] => {
    const mediaGroups = records.reduce(
      (groups, record) => {
        const mediaSource = record.mediaSource
        if (!groups[mediaSource]) {
          groups[mediaSource] = []
        }
        groups[mediaSource].push(record)
        return groups
      },
      {} as Record<string, MarketDailyRecord[]>,
    )

    return Object.entries(mediaGroups).map(([mediaSource, mediaRecords]) => {
      const stats = marketUtils.calculateTotalStats(mediaRecords)
      return {
        mediaSource: mediaSource as any,
        totalSpend: stats.totalSpend,
        totalClicks: stats.totalClicks,
        totalConversations: stats.totalConversations,
        totalValidConv: stats.totalValidConv,
        totalLeads: stats.totalLeads,
        clickRate: stats.clickRate,
        conversionRate: stats.conversionRate,
        leadRate: stats.leadRate,
        avgClickPrice: stats.avgClickPrice,
        recordCount: stats.totalRecords,
      }
    })
  },

  // 格式化金额
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(amount)
  },

  // 格式化百分比
  formatPercentage: (value: number): string => {
    return `${value.toFixed(2)}%`
  },

  // 格式化数字
  formatNumber: (value: number): string => {
    return new Intl.NumberFormat('zh-CN').format(value)
  },
}

export default marketService
