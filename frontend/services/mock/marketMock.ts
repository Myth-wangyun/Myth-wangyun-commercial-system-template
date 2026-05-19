import type {
  MarketDailyRecord,
  MarketStats,
  MarketSummary,
  MarketPartner,
  MarketQueryParams,
  CreateMarketDailyRequest,
  UpdateMarketDailyRequest,
  CreatePartnerRequest,
  UpdatePartnerRequest,
  StatsQueryParams,
  TimeSeriesStats,
  MediaSource,
} from '@/types/market'
import {
  mockSuccessResponse,
  mockDelay,
  getStorageData,
  setStorageData,
  generateId,
  generateRandomDate,
  generateRandomNumber,
  generateRandomAmount,
  getCampusStorageKey,
} from './index'

// 媒体来源列表
const MEDIA_SOURCES: MediaSource[] = ['百度', '360', '搜狗', '神马', '头条', '腾讯', '其他']

// 生成随机媒体来源
const getRandomMediaSource = (): MediaSource => {
  return MEDIA_SOURCES[Math.floor(Math.random() * MEDIA_SOURCES.length)]
}

// 生成测试日投放数据
const generateMockDailyRecord = (id?: string): MarketDailyRecord => {
  const date = generateRandomDate(new Date('2024-01-01'), new Date())
  const mediaSource = getRandomMediaSource()
  const spend = generateRandomAmount(100, 5000)
  const impressions = generateRandomNumber(1000, 50000)
  const clicks = generateRandomNumber(50, 2000)
  const ip = generateRandomNumber(30, 1500)
  const pv = generateRandomNumber(100, 3000)
  const dialogues = generateRandomNumber(10, 200)
  const validDialogues = Math.floor(dialogues * (0.6 + Math.random() * 0.3))
  const leads = Math.floor(validDialogues * (0.1 + Math.random() * 0.4))

  return {
    id: id || generateId(),
    date,
    mediaSource,
    spend,
    impressions,
    clicks,
    ip,
    pv,
    dialogues,
    validDialogues,
    leads,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// 生成测试合作方数据
const generateMockPartner = (id?: string): MarketPartner => {
  const names = ['百度推广', '360推广', '搜狗推广', '神马推广', '头条推广', '腾讯推广', '其他推广']
  const contacts = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九']
  const phones = ['13800138001', '13900139002', '13700137003', '13600136004', '13500135005']
  const emails = ['contact1@example.com', 'contact2@example.com', 'contact3@example.com']
  const addresses = [
    '北京市朝阳区',
    '上海市浦东新区',
    '广州市天河区',
    '深圳市南山区',
    '杭州市西湖区',
  ]

  return {
    id: id || generateId(),
    name: names[Math.floor(Math.random() * names.length)],
    contactPerson: contacts[Math.floor(Math.random() * contacts.length)],
    phone: phones[Math.floor(Math.random() * phones.length)],
    email: emails[Math.floor(Math.random() * emails.length)],
    address: addresses[Math.floor(Math.random() * addresses.length)],
    mediaSource: getRandomMediaSource(),
    status: Math.random() > 0.2 ? 'active' : 'inactive',
    notes: '合作方备注信息',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// 获取神殿存储key
const getMarketStorageKey = (key: string, campus?: string): string => {
  return getCampusStorageKey(`market-${key}`, campus)
}

// 获取日投放数据
const getMarketDailyData = (campus?: string): MarketDailyRecord[] => {
  return getStorageData(getMarketStorageKey('daily', campus), [])
}

// 保存日投放数据
const saveMarketDailyData = (data: MarketDailyRecord[], campus?: string): void => {
  setStorageData(getMarketStorageKey('daily', campus), data)
}

// 获取合作方数据
const getPartnerData = (campus?: string): MarketPartner[] => {
  return getStorageData(getMarketStorageKey('partners', campus), [])
}

// 保存合作方数据
const savePartnerData = (data: MarketPartner[], campus?: string): void => {
  setStorageData(getMarketStorageKey('partners', campus), data)
}

// 初始化测试数据
const initializeMockData = (campus?: string): void => {
  const dailyData = getMarketDailyData(campus)
  const partnerData = getPartnerData(campus)

  // 如果数据为空，生成测试数据
  if (dailyData.length === 0) {
    const mockDailyData = Array.from({ length: 50 }, () => generateMockDailyRecord())
    saveMarketDailyData(mockDailyData, campus)
  }

  if (partnerData.length === 0) {
    const mockPartnerData = Array.from({ length: 10 }, () => generateMockPartner())
    savePartnerData(mockPartnerData, campus)
  }
}

// 市场Mock服务
export const marketMockService = {
  // 日投放数据相关
  daily: {
    // 获取日投放数据列表
    getList: async (params: MarketQueryParams = {}, campus?: string): Promise<any> => {
      await mockDelay(300)
      initializeMockData(campus)

      let data = getMarketDailyData(campus)

      // 筛选
      if (params.startDate) {
        data = data.filter((record) => record.date >= params.startDate!)
      }
      if (params.endDate) {
        data = data.filter((record) => record.date <= params.endDate!)
      }
      if (params.mediaSource) {
        data = data.filter((record) => record.mediaSource === params.mediaSource)
      }

      // 排序
      if (params.sortBy) {
        data.sort((a, b) => {
          const aVal = a[params.sortBy as keyof MarketDailyRecord] as number
          const bVal = b[params.sortBy as keyof MarketDailyRecord] as number
          const result = aVal - bVal
          return params.sortOrder === 'desc' ? -result : result
        })
      }

      // 分页
      const page = params.page || 1
      const pageSize = params.pageSize || 20
      const total = data.length
      const totalPages = Math.ceil(total / pageSize)
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const list = data.slice(startIndex, endIndex)

      return mockSuccessResponse({
        list,
        total,
        page,
        pageSize,
        totalPages,
      })
    },

    // 获取单条日投放数据
    getById: async (id: string, campus?: string): Promise<any> => {
      await mockDelay(200)
      const data = getMarketDailyData(campus)
      const record = data.find((item) => item.id === id)

      if (!record) {
        throw new Error('记录不存在')
      }

      return mockSuccessResponse(record)
    },

    // 创建日投放数据
    create: async (data: CreateMarketDailyRequest, campus?: string): Promise<any> => {
      await mockDelay(400)
      const records = getMarketDailyData(campus)

      // 检查是否已存在相同日期和媒体来源的记录
      const exists = records.find(
        (record) => record.date === data.date && record.mediaSource === data.mediaSource,
      )

      if (exists) {
        throw new Error('该日期和媒体来源的记录已存在')
      }

      const newRecord: MarketDailyRecord = {
        id: generateId(),
        date: data.date,
        mediaSource: data.mediaSource,
        spend: data.spend,
        impressions: data.impressions || 0,
        clicks: data.clicks || 0,
        ip: data.ip || 0,
        pv: data.pv || 0,
        dialogues: data.dialogues || 0,
        validDialogues: data.validDialogues || 0,
        leads: data.leads || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      records.push(newRecord)
      saveMarketDailyData(records, campus)

      return mockSuccessResponse(newRecord)
    },

    // 更新日投放数据
    update: async (data: UpdateMarketDailyRequest, campus?: string): Promise<any> => {
      await mockDelay(400)
      const records = getMarketDailyData(campus)
      const index = records.findIndex((record) => record.id === data.id)

      if (index === -1) {
        throw new Error('记录不存在')
      }

      // 检查是否与其他记录冲突
      if (data.date && data.mediaSource) {
        const exists = records.find(
          (record) =>
            record.id !== data.id &&
            record.date === data.date &&
            record.mediaSource === data.mediaSource,
        )

        if (exists) {
          throw new Error('该日期和媒体来源的记录已存在')
        }
      }

      records[index] = {
        ...records[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }

      saveMarketDailyData(records, campus)

      return mockSuccessResponse(records[index])
    },

    // 删除日投放数据
    delete: async (id: string, campus?: string): Promise<any> => {
      await mockDelay(300)
      const records = getMarketDailyData(campus)
      const filteredRecords = records.filter((record) => record.id !== id)

      if (filteredRecords.length === records.length) {
        throw new Error('记录不存在')
      }

      saveMarketDailyData(filteredRecords, campus)

      return mockSuccessResponse(null)
    },

    // 批量创建日投放数据
    bulkCreate: async (data: CreateMarketDailyRequest[], campus?: string): Promise<any> => {
      await mockDelay(600)
      const records = getMarketDailyData(campus)
      const newRecords: MarketDailyRecord[] = []

      for (const item of data) {
        // 检查是否已存在
        const exists = records.find(
          (record) => record.date === item.date && record.mediaSource === item.mediaSource,
        )

        if (!exists) {
          const newRecord: MarketDailyRecord = {
            id: generateId(),
            date: item.date,
            mediaSource: item.mediaSource,
            spend: item.spend,
            impressions: item.impressions || 0,
            clicks: item.clicks || 0,
            ip: item.ip || 0,
            pv: item.pv || 0,
            dialogues: item.dialogues || 0,
            validDialogues: item.validDialogues || 0,
            leads: item.leads || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          newRecords.push(newRecord)
          records.push(newRecord)
        }
      }

      saveMarketDailyData(records, campus)

      return mockSuccessResponse(newRecords)
    },
  },

  // 统计数据相关
  stats: {
    // 获取市场统计数据
    getMarketStats: async (params: StatsQueryParams = {}, campus?: string): Promise<any> => {
      await mockDelay(200)
      const data = getMarketDailyData(campus)

      let filteredData = data

      // 筛选
      if (params.startDate) {
        filteredData = filteredData.filter((record) => record.date >= params.startDate!)
      }
      if (params.endDate) {
        filteredData = filteredData.filter((record) => record.date <= params.endDate!)
      }
      if (params.mediaSource) {
        filteredData = filteredData.filter((record) => record.mediaSource === params.mediaSource)
      }

      // 计算统计指标
      const totalRecords = filteredData.length
      const totalSpend = filteredData.reduce((sum, record) => sum + record.spend, 0)
      const totalClicks = filteredData.reduce((sum, record) => sum + record.clicks, 0)
      const totalConversations = filteredData.reduce((sum, record) => sum + record.dialogues, 0)
      const totalValidConv = filteredData.reduce((sum, record) => sum + record.validDialogues, 0)
      const totalPV = filteredData.reduce((sum, record) => sum + record.pv, 0)
      const totalLeads = filteredData.reduce((sum, record) => sum + record.leads, 0)
      const totalImpressions = filteredData.reduce((sum, record) => sum + record.impressions, 0)

      const stats: MarketStats = {
        totalRecords,
        totalSpend,
        totalClicks,
        totalConversations,
        totalValidConv,
        totalPV,
        totalLeads,
        clickRate:
          totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
        conversionRate:
          totalClicks > 0 ? Number(((totalConversations / totalClicks) * 100).toFixed(2)) : 0,
        leadRate: totalValidConv > 0 ? Number(((totalLeads / totalValidConv) * 100).toFixed(2)) : 0,
        avgClickPrice: totalClicks > 0 ? Number((totalSpend / totalClicks).toFixed(2)) : 0,
      }

      return mockSuccessResponse(stats)
    },

    // 获取市场汇总数据
    getMarketSummary: async (params: StatsQueryParams = {}, campus?: string): Promise<any> => {
      await mockDelay(300)
      const data = getMarketDailyData(campus)

      let filteredData = data

      // 筛选
      if (params.startDate) {
        filteredData = filteredData.filter((record) => record.date >= params.startDate!)
      }
      if (params.endDate) {
        filteredData = filteredData.filter((record) => record.date <= params.endDate!)
      }
      if (params.mediaSource) {
        filteredData = filteredData.filter((record) => record.mediaSource === params.mediaSource)
      }

      // 按媒体来源分组
      const mediaGroups = filteredData.reduce(
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

      const summary: MarketSummary[] = Object.entries(mediaGroups).map(([mediaSource, records]) => {
        const totalSpend = records.reduce((sum, record) => sum + record.spend, 0)
        const totalClicks = records.reduce((sum, record) => sum + record.clicks, 0)
        const totalConversations = records.reduce((sum, record) => sum + record.dialogues, 0)
        const totalValidConv = records.reduce((sum, record) => sum + record.validDialogues, 0)
        const totalLeads = records.reduce((sum, record) => sum + record.leads, 0)
        const totalImpressions = records.reduce((sum, record) => sum + record.impressions, 0)

        return {
          mediaSource: mediaSource as MediaSource,
          totalSpend,
          totalClicks,
          totalConversations,
          totalValidConv,
          totalLeads,
          clickRate:
            totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
          conversionRate:
            totalClicks > 0 ? Number(((totalConversations / totalClicks) * 100).toFixed(2)) : 0,
          leadRate:
            totalValidConv > 0 ? Number(((totalLeads / totalValidConv) * 100).toFixed(2)) : 0,
          avgClickPrice: totalClicks > 0 ? Number((totalSpend / totalClicks).toFixed(2)) : 0,
          recordCount: records.length,
        }
      })

      return mockSuccessResponse(summary)
    },

    // 获取时间序列统计数据
    getTimeSeriesStats: async (params: StatsQueryParams = {}, campus?: string): Promise<any> => {
      await mockDelay(300)
      const data = getMarketDailyData(campus)

      let filteredData = data

      // 筛选
      if (params.startDate) {
        filteredData = filteredData.filter((record) => record.date >= params.startDate!)
      }
      if (params.endDate) {
        filteredData = filteredData.filter((record) => record.date <= params.endDate!)
      }
      if (params.mediaSource) {
        filteredData = filteredData.filter((record) => record.mediaSource === params.mediaSource)
      }

      // 按日期分组
      const dateGroups = filteredData.reduce(
        (groups, record) => {
          const date = record.date
          if (!groups[date]) {
            groups[date] = []
          }
          groups[date].push(record)
          return groups
        },
        {} as Record<string, MarketDailyRecord[]>,
      )

      const timeSeries: TimeSeriesStats[] = Object.entries(dateGroups).map(([date, records]) => {
        const totalSpend = records.reduce((sum, record) => sum + record.spend, 0)
        const totalClicks = records.reduce((sum, record) => sum + record.clicks, 0)
        const totalConversations = records.reduce((sum, record) => sum + record.dialogues, 0)
        const totalLeads = records.reduce((sum, record) => sum + record.leads, 0)
        const totalImpressions = records.reduce((sum, record) => sum + record.impressions, 0)

        return {
          period: date,
          totalSpend,
          totalClicks,
          totalConversations,
          totalLeads,
          clickRate:
            totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
          conversionRate:
            totalClicks > 0 ? Number(((totalConversations / totalClicks) * 100).toFixed(2)) : 0,
          leadRate:
            totalConversations > 0
              ? Number(((totalLeads / totalConversations) * 100).toFixed(2))
              : 0,
          avgClickPrice: totalClicks > 0 ? Number((totalSpend / totalClicks).toFixed(2)) : 0,
        }
      })

      // 按日期排序
      timeSeries.sort((a, b) => a.period.localeCompare(b.period))

      return mockSuccessResponse(timeSeries)
    },
  },

  // 合作方管理相关
  partners: {
    // 获取合作方列表
    getList: async (
      params: { page?: number; pageSize?: number; search?: string } = {},
      campus?: string,
    ): Promise<any> => {
      await mockDelay(300)
      initializeMockData(campus)

      let data = getPartnerData(campus)

      // 搜索
      if (params.search) {
        const search = params.search.toLowerCase()
        data = data.filter(
          (partner) =>
            partner.name.toLowerCase().includes(search) ||
            partner.contactPerson.toLowerCase().includes(search) ||
            partner.phone.includes(search),
        )
      }

      // 分页
      const page = params.page || 1
      const pageSize = params.pageSize || 20
      const total = data.length
      const totalPages = Math.ceil(total / pageSize)
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const list = data.slice(startIndex, endIndex)

      return mockSuccessResponse({
        list,
        total,
        page,
        pageSize,
        totalPages,
      })
    },

    // 获取单条合作方信息
    getById: async (id: string, campus?: string): Promise<any> => {
      await mockDelay(200)
      const data = getPartnerData(campus)
      const partner = data.find((item) => item.id === id)

      if (!partner) {
        throw new Error('合作方不存在')
      }

      return mockSuccessResponse(partner)
    },

    // 创建合作方
    create: async (data: CreatePartnerRequest, campus?: string): Promise<any> => {
      await mockDelay(400)
      const partners = getPartnerData(campus)

      const newPartner: MarketPartner = {
        id: generateId(),
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address,
        mediaSource: data.mediaSource,
        status: data.status || 'active',
        notes: data.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      partners.push(newPartner)
      savePartnerData(partners, campus)

      return mockSuccessResponse(newPartner)
    },

    // 更新合作方
    update: async (data: UpdatePartnerRequest, campus?: string): Promise<any> => {
      await mockDelay(400)
      const partners = getPartnerData(campus)
      const index = partners.findIndex((partner) => partner.id === data.id)

      if (index === -1) {
        throw new Error('合作方不存在')
      }

      partners[index] = {
        ...partners[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }

      savePartnerData(partners, campus)

      return mockSuccessResponse(partners[index])
    },

    // 删除合作方
    delete: async (id: string, campus?: string): Promise<any> => {
      await mockDelay(300)
      const partners = getPartnerData(campus)
      const filteredPartners = partners.filter((partner) => partner.id !== id)

      if (filteredPartners.length === partners.length) {
        throw new Error('合作方不存在')
      }

      savePartnerData(filteredPartners, campus)

      return mockSuccessResponse(null)
    },
  },
}

export default marketMockService
