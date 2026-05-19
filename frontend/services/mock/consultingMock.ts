// 咨询模块Mock数据服务

import {
  generateId,
  mockSuccessResponse,
  mockErrorResponse,
  mockDelay,
  getStorageData,
  setStorageData,
} from './index'

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
  ConsultingType,
  ConsultingStatus,
  ConsultingPriority,
} from '@/types/consulting'

// 存储键名
const CONSULTING_RECORDS_KEY = 'consulting_records'
const CONSULTING_TYPES_KEY = 'consulting_types'

// 生成随机咨询类型
const getRandomConsultingType = (): ConsultingType => {
  const types: ConsultingType[] = ['电话咨询', '在线咨询', '微信咨询', 'QQ咨询', '现场咨询', '其他']
  return types[Math.floor(Math.random() * types.length)]
}

// 生成随机咨询状态
const getRandomConsultingStatus = (): ConsultingStatus => {
  const statuses: ConsultingStatus[] = ['待处理', '处理中', '已处理', '已关闭']
  return statuses[Math.floor(Math.random() * statuses.length)]
}

// 生成随机优先级
const getRandomPriority = (): ConsultingPriority => {
  const priorities: ConsultingPriority[] = ['低', '中', '高', '紧急']
  return priorities[Math.floor(Math.random() * priorities.length)]
}

// 生成随机客户姓名
const generateCustomerName = (): string => {
  const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴']
  const names = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军']
  const surname = surnames[Math.floor(Math.random() * surnames.length)]
  const name = names[Math.floor(Math.random() * names.length)]
  return surname + name
}

// 生成随机手机号
const generatePhone = (): string => {
  const prefixes = [
    '130',
    '131',
    '132',
    '133',
    '134',
    '135',
    '136',
    '137',
    '138',
    '139',
    '150',
    '151',
    '152',
    '153',
    '155',
    '156',
    '157',
    '158',
    '159',
    '180',
    '181',
    '182',
    '183',
    '184',
    '185',
    '186',
    '187',
    '188',
    '189',
  ]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = Math.floor(Math.random() * 100000000)
    .toString()
    .padStart(8, '0')
  return prefix + suffix
}

// 生成随机时间
const generateTime = (): string => {
  const hour = Math.floor(Math.random() * 24)
    .toString()
    .padStart(2, '0')
  const minute = Math.floor(Math.random() * 60)
    .toString()
    .padStart(2, '0')
  return `${hour}:${minute}`
}

// 生成随机日期（最近30天）
const generateRandomDate = (): string => {
  const today = new Date()
  const randomDays = Math.floor(Math.random() * 30)
  const date = new Date(today.getTime() - randomDays * 24 * 60 * 60 * 1000)
  return date.toISOString().split('T')[0]
}

// 生成咨询记录
const generateConsultingRecord = (): ConsultingRecord => {
  const date = generateRandomDate()
  const time = generateTime()
  const createdAt = new Date(`${date}T${time}:00`).toISOString()
  const updatedAt = new Date(
    new Date(createdAt).getTime() + Math.random() * 24 * 60 * 60 * 1000,
  ).toISOString()

  return {
    id: generateId(),
    date,
    time,
    type: getRandomConsultingType(),
    customerName: generateCustomerName(),
    customerPhone: generatePhone(),
    customerWechat:
      Math.random() > 0.5 ? `wx_${Math.random().toString(36).slice(2, 10)}` : undefined,
    customerQQ: Math.random() > 0.5 ? Math.floor(Math.random() * 1000000000).toString() : undefined,
    source: ['', '百度', '微信', '朋友介绍', '其他'][Math.floor(Math.random() * 5)],
    subject: ['课程咨询', '价格咨询', '就业咨询', '技术咨询', '其他'][
      Math.floor(Math.random() * 5)
    ],
    content: '客户咨询内容详情...',
    status: getRandomConsultingStatus(),
    priority: getRandomPriority(),
    assignedTo:
      Math.random() > 0.3
        ? ['张老师', '李老师', '王老师', '刘老师'][Math.floor(Math.random() * 4)]
        : undefined,
    response: Math.random() > 0.4 ? '已回复客户咨询内容' : undefined,
    followUpDate:
      Math.random() > 0.6
        ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : undefined,
    notes: Math.random() > 0.5 ? '备注信息' : undefined,
    createdAt,
    updatedAt,
  }
}

// 生成咨询类型配置
const generateConsultingTypeConfig = (): ConsultingTypeConfig => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2']
  const types: ConsultingType[] = ['电话咨询', '在线咨询', '微信咨询', 'QQ咨询', '现场咨询', '其他']

  return {
    id: generateId(),
    name: types[Math.floor(Math.random() * types.length)],
    description: '咨询类型描述',
    color: colors[Math.floor(Math.random() * colors.length)],
    isActive: true,
    sortOrder: Math.floor(Math.random() * 100),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// 获取咨询记录数据
const getConsultingRecordsData = (campus?: string): ConsultingRecord[] => {
  const key = campus ? `${CONSULTING_RECORDS_KEY}_${campus}` : CONSULTING_RECORDS_KEY
  let data = getStorageData<ConsultingRecord[]>(key, [])

  if (!data || data.length === 0) {
    data = Array.from({ length: 50 }, generateConsultingRecord)
    setStorageData(key, data)
  }

  return data
}

// 保存咨询记录数据
const saveConsultingRecordsData = (data: ConsultingRecord[], campus?: string): void => {
  const key = campus ? `${CONSULTING_RECORDS_KEY}_${campus}` : CONSULTING_RECORDS_KEY
  setStorageData(key, data)
}

// 获取咨询类型配置数据
const getConsultingTypesData = (campus?: string): ConsultingTypeConfig[] => {
  const key = campus ? `${CONSULTING_TYPES_KEY}_${campus}` : CONSULTING_TYPES_KEY
  let data = getStorageData<ConsultingTypeConfig[]>(key, [])

  if (!data || data.length === 0) {
    data = Array.from({ length: 6 }, generateConsultingTypeConfig)
    setStorageData(key, data)
  }

  return data
}

// 保存咨询类型配置数据
const saveConsultingTypesData = (data: ConsultingTypeConfig[], campus?: string): void => {
  const key = campus ? `${CONSULTING_TYPES_KEY}_${campus}` : CONSULTING_TYPES_KEY
  setStorageData(key, data)
}

// 咨询记录服务
const consultingRecordService = {
  // 获取咨询记录列表
  getList: async (params: ConsultingQueryParams = {}, campus?: string) => {
    await mockDelay()

    try {
      let data = getConsultingRecordsData(campus)

      // 应用筛选条件
      if (params.startDate) {
        data = data.filter((record) => record.date >= params.startDate!)
      }
      if (params.endDate) {
        data = data.filter((record) => record.date <= params.endDate!)
      }
      if (params.type) {
        data = data.filter((record) => record.type === params.type)
      }
      if (params.status) {
        data = data.filter((record) => record.status === params.status)
      }
      if (params.priority) {
        data = data.filter((record) => record.priority === params.priority)
      }
      if (params.assignedTo) {
        data = data.filter((record) => record.assignedTo === params.assignedTo)
      }
      if (params.search) {
        const search = params.search.toLowerCase()
        data = data.filter(
          (record) =>
            record.customerName.toLowerCase().includes(search) ||
            record.customerPhone.includes(search) ||
            record.subject.toLowerCase().includes(search) ||
            record.content.toLowerCase().includes(search),
        )
      }

      // 排序
      if (params.sortBy) {
        data.sort((a, b) => {
          const aValue = a[params.sortBy as keyof ConsultingRecord]
          const bValue = b[params.sortBy as keyof ConsultingRecord]
          const order = params.sortOrder === 'desc' ? -1 : 1
          if (aValue === undefined || bValue === undefined) return 0
          return aValue < bValue ? -order : aValue > bValue ? order : 0
        })
      }

      // 分页
      const page = params.page || 1
      const pageSize = params.pageSize || 20
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const list = data.slice(start, end)

      const response: ConsultingPageResponse<ConsultingRecord> = {
        list,
        total: data.length,
        page,
        pageSize,
        totalPages: Math.ceil(data.length / pageSize),
      }

      return mockSuccessResponse(response)
    } catch (error) {
      return mockErrorResponse('获取咨询记录列表失败')
    }
  },

  // 获取咨询记录详情
  getById: async (id: string, campus?: string) => {
    await mockDelay()

    try {
      const data = getConsultingRecordsData(campus)
      const record = data.find((item) => item.id === id)

      if (!record) {
        return mockErrorResponse('咨询记录不存在')
      }

      return mockSuccessResponse(record)
    } catch (error) {
      return mockErrorResponse('获取咨询记录详情失败')
    }
  },

  // 创建咨询记录
  create: async (data: CreateConsultingRequest, campus?: string) => {
    await mockDelay()

    try {
      const records = getConsultingRecordsData(campus)
      const newRecord: ConsultingRecord = {
        id: generateId(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      records.push(newRecord)
      saveConsultingRecordsData(records, campus)

      return mockSuccessResponse(newRecord)
    } catch (error) {
      return mockErrorResponse('创建咨询记录失败')
    }
  },

  // 更新咨询记录
  update: async (data: UpdateConsultingRequest, campus?: string) => {
    await mockDelay()

    try {
      const records = getConsultingRecordsData(campus)
      const index = records.findIndex((item) => item.id === data.id)

      if (index === -1) {
        return mockErrorResponse('咨询记录不存在')
      }

      records[index] = {
        ...records[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }

      saveConsultingRecordsData(records, campus)

      return mockSuccessResponse(records[index])
    } catch (error) {
      return mockErrorResponse('更新咨询记录失败')
    }
  },

  // 删除咨询记录
  delete: async (id: string, campus?: string) => {
    await mockDelay()

    try {
      const records = getConsultingRecordsData(campus)
      const filteredRecords = records.filter((item) => item.id !== id)

      if (filteredRecords.length === records.length) {
        return mockErrorResponse('咨询记录不存在')
      }

      saveConsultingRecordsData(filteredRecords, campus)

      return mockSuccessResponse(null)
    } catch (error) {
      return mockErrorResponse('删除咨询记录失败')
    }
  },

  // 批量删除咨询记录
  batchDelete: async (ids: string[], campus?: string) => {
    await mockDelay()

    try {
      const records = getConsultingRecordsData(campus)
      const filteredRecords = records.filter((item) => !ids.includes(item.id))

      saveConsultingRecordsData(filteredRecords, campus)

      return mockSuccessResponse(null)
    } catch (error) {
      return mockErrorResponse('批量删除咨询记录失败')
    }
  },
}

// 咨询类型配置服务
const consultingTypeService = {
  // 获取咨询类型列表
  getList: async (campus?: string) => {
    await mockDelay()

    try {
      const data = getConsultingTypesData(campus)
      return mockSuccessResponse(data)
    } catch (error) {
      return mockErrorResponse('获取咨询类型列表失败')
    }
  },

  // 获取咨询类型详情
  getById: async (id: string, campus?: string) => {
    await mockDelay()

    try {
      const data = getConsultingTypesData(campus)
      const type = data.find((item) => item.id === id)

      if (!type) {
        return mockErrorResponse('咨询类型不存在')
      }

      return mockSuccessResponse(type)
    } catch (error) {
      return mockErrorResponse('获取咨询类型详情失败')
    }
  },

  // 创建咨询类型
  create: async (data: CreateConsultingTypeRequest, campus?: string) => {
    await mockDelay()

    try {
      const types = getConsultingTypesData(campus)
      const newType: ConsultingTypeConfig = {
        id: generateId(),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      types.push(newType)
      saveConsultingTypesData(types, campus)

      return mockSuccessResponse(newType)
    } catch (error) {
      return mockErrorResponse('创建咨询类型失败')
    }
  },

  // 更新咨询类型
  update: async (data: UpdateConsultingTypeRequest, campus?: string) => {
    await mockDelay()

    try {
      const types = getConsultingTypesData(campus)
      const index = types.findIndex((item) => item.id === data.id)

      if (index === -1) {
        return mockErrorResponse('咨询类型不存在')
      }

      types[index] = {
        ...types[index],
        ...data,
        updatedAt: new Date().toISOString(),
      }

      saveConsultingTypesData(types, campus)

      return mockSuccessResponse(types[index])
    } catch (error) {
      return mockErrorResponse('更新咨询类型失败')
    }
  },

  // 删除咨询类型
  delete: async (id: string, campus?: string) => {
    await mockDelay()

    try {
      const types = getConsultingTypesData(campus)
      const filteredTypes = types.filter((item) => item.id !== id)

      if (filteredTypes.length === types.length) {
        return mockErrorResponse('咨询类型不存在')
      }

      saveConsultingTypesData(filteredTypes, campus)

      return mockSuccessResponse(null)
    } catch (error) {
      return mockErrorResponse('删除咨询类型失败')
    }
  },
}

// 咨询统计服务
const consultingStatsService = {
  // 获取咨询统计数据
  getConsultingStats: async (_params: ConsultingStatsQueryParams = {}, campus?: string) => {
    await mockDelay()

    try {
      const records = getConsultingRecordsData(campus)

      // 应用筛选条件
      let filteredRecords = records
      if (_params.startDate) {
        filteredRecords = filteredRecords.filter((record) => record.date >= _params.startDate!)
      }
      if (_params.endDate) {
        filteredRecords = filteredRecords.filter((record) => record.date <= _params.endDate!)
      }
      if (_params.type) {
        filteredRecords = filteredRecords.filter((record) => record.type === _params.type)
      }
      if (_params.status) {
        filteredRecords = filteredRecords.filter((record) => record.status === _params.status)
      }

      // 计算统计数据
      const totalRecords = filteredRecords.length
      const totalByType: Record<ConsultingType, number> = {
        电话咨询: 0,
        在线咨询: 0,
        微信咨询: 0,
        QQ咨询: 0,
        现场咨询: 0,
        其他: 0,
      }

      const totalByStatus: Record<ConsultingStatus, number> = {
        待处理: 0,
        处理中: 0,
        已处理: 0,
        已关闭: 0,
      }

      const totalByPriority: Record<ConsultingPriority, number> = {
        低: 0,
        中: 0,
        高: 0,
        紧急: 0,
      }

      let totalResponseTime = 0
      let responseTimeCount = 0
      let completedCount = 0

      filteredRecords.forEach((record) => {
        totalByType[record.type]++
        totalByStatus[record.status]++
        totalByPriority[record.priority]++

        if (record.createdAt && record.updatedAt) {
          const responseTime =
            new Date(record.updatedAt).getTime() - new Date(record.createdAt).getTime()
          totalResponseTime += responseTime
          responseTimeCount++
        }

        if (record.status === '已处理' || record.status === '已关闭') {
          completedCount++
        }
      })

      const avgResponseTime =
        responseTimeCount > 0 ? totalResponseTime / responseTimeCount / (1000 * 60 * 60) : 0
      const completionRate = totalRecords > 0 ? (completedCount / totalRecords) * 100 : 0

      const stats: ConsultingStats = {
        totalRecords,
        totalByType,
        totalByStatus,
        totalByPriority,
        avgResponseTime: Number(avgResponseTime.toFixed(2)),
        completionRate: Number(completionRate.toFixed(2)),
      }

      return mockSuccessResponse(stats)
    } catch (error) {
      return mockErrorResponse('获取咨询统计数据失败')
    }
  },

  // 获取咨询汇总数据
  getConsultingSummary: async (_params: ConsultingStatsQueryParams = {}, campus?: string) => {
    await mockDelay()

    try {
      const records = getConsultingRecordsData(campus)

      // 按日期分组
      const dateGroups = records.reduce(
        (groups, record) => {
          if (!groups[record.date]) {
            groups[record.date] = []
          }
          groups[record.date].push(record)
          return groups
        },
        {} as Record<string, ConsultingRecord[]>,
      )

      const summary: ConsultingSummary[] = Object.entries(dateGroups).map(([date, records]) => {
        const totalCount = records.length
        const byType: Record<ConsultingType, number> = {
          电话咨询: 0,
          在线咨询: 0,
          微信咨询: 0,
          QQ咨询: 0,
          现场咨询: 0,
          其他: 0,
        }

        const byStatus: Record<ConsultingStatus, number> = {
          待处理: 0,
          处理中: 0,
          已处理: 0,
          已关闭: 0,
        }

        let totalResponseTime = 0
        let responseTimeCount = 0
        let completedCount = 0

        records.forEach((record) => {
          byType[record.type]++
          byStatus[record.status]++

          if (record.createdAt && record.updatedAt) {
            const responseTime =
              new Date(record.updatedAt).getTime() - new Date(record.createdAt).getTime()
            totalResponseTime += responseTime
            responseTimeCount++
          }

          if (record.status === '已处理' || record.status === '已关闭') {
            completedCount++
          }
        })

        const avgResponseTime =
          responseTimeCount > 0 ? totalResponseTime / responseTimeCount / (1000 * 60 * 60) : 0
        const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

        return {
          date,
          totalCount,
          byType,
          byStatus,
          avgResponseTime: Number(avgResponseTime.toFixed(2)),
          completionRate: Number(completionRate.toFixed(2)),
        }
      })

      // 按日期排序
      summary.sort((a, b) => a.date.localeCompare(b.date))

      return mockSuccessResponse(summary)
    } catch (error) {
      return mockErrorResponse('获取咨询汇总数据失败')
    }
  },

  // 获取时间序列统计数据
  getTimeSeriesStats: async (_params: ConsultingStatsQueryParams = {}, campus?: string) => {
    await mockDelay()

    try {
      const records = getConsultingRecordsData(campus)

      // 按日期分组
      const dateGroups = records.reduce(
        (groups, record) => {
          if (!groups[record.date]) {
            groups[record.date] = []
          }
          groups[record.date].push(record)
          return groups
        },
        {} as Record<string, ConsultingRecord[]>,
      )

      const timeSeries: ConsultingTimeSeriesStats[] = Object.entries(dateGroups).map(
        ([date, records]) => {
          const totalCount = records.length
          let completedCount = 0
          let totalResponseTime = 0
          let responseTimeCount = 0

          records.forEach((record) => {
            if (record.status === '已处理' || record.status === '已关闭') {
              completedCount++
            }

            if (record.createdAt && record.updatedAt) {
              const responseTime =
                new Date(record.updatedAt).getTime() - new Date(record.createdAt).getTime()
              totalResponseTime += responseTime
              responseTimeCount++
            }
          })

          const avgResponseTime =
            responseTimeCount > 0 ? totalResponseTime / responseTimeCount / (1000 * 60 * 60) : 0
          const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

          return {
            period: date,
            totalCount,
            completedCount,
            avgResponseTime: Number(avgResponseTime.toFixed(2)),
            completionRate: Number(completionRate.toFixed(2)),
          }
        },
      )

      // 按日期排序
      timeSeries.sort((a, b) => a.period.localeCompare(b.period))

      return mockSuccessResponse(timeSeries)
    } catch (error) {
      return mockErrorResponse('获取时间序列统计数据失败')
    }
  },
}

// 导出Mock服务
export const consultingMockService = {
  records: consultingRecordService,
  types: consultingTypeService,
  stats: consultingStatsService,
}
