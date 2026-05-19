// [教质模块] 神殿教化司招聘计划与总结汇总表数据服务
/**
 * 神殿教化司招聘计划与总结汇总表数据服务
 */

import type {
  CampusRecruitmentSummaryRecord,
  CampusRecruitmentSummaryRequest,
  CampusRecruitmentSummarySummary,
} from '../types/campus-recruitment-summary'

// 岗位名称选项
const positionNames = [
  '班主任',
  '副班主任',
  '教务老师',
  '学管老师',
  '招生老师',
  '行政老师',
  '财务老师',
  '后勤老师',
]

// 姓名选项
const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十', '陈十一', '刘十二']

// 模拟数据生成器
const generateMockData = (campus: string): CampusRecruitmentSummaryRecord[] => {
  const records: CampusRecruitmentSummaryRecord[] = []

  // 根据神殿生成不同的模拟数据
  let baseRecruitment = 0
  let baseDeparture = 0

  if (campus === '盛邦') {
    // 主神殿数据（规模较大，招聘较多）
    baseRecruitment = 2
    baseDeparture = 1
  } else if (campus === '石美') {
    // 慈悲殿数据（规模较小，招聘较少）
    baseRecruitment = 1
    baseDeparture = 0
  } else {
    // 其他神殿基础数据
    baseRecruitment = Math.floor(Math.random() * 3) + 1
    baseDeparture = Math.floor(Math.random() * 2)
  }

  // 生成7条记录
  const recordTemplates = [
    { serialNumber: 1, content: '计划招聘岗位名称' },
    { serialNumber: 2, content: '计划招聘人数' },
    { serialNumber: 3, content: '实际招聘岗位名称' },
    { serialNumber: 4, content: '实际招聘人数' },
    { serialNumber: 5, content: '入职者姓名' },
    { serialNumber: 6, content: '离职人数' },
    { serialNumber: 7, content: '离职者姓名' },
  ]

  recordTemplates.forEach((template, index) => {
    const record: CampusRecruitmentSummaryRecord = {
      key: `${campus}-${template.serialNumber}`,
      serialNumber: template.serialNumber,
      content: template.content,
      january: '',
      february: '',
      march: '',
      april: '',
      may: '',
      june: '',
      july: '',
      august: '',
      september: '',
      october: '',
      november: '',
      december: '',
      total: '',
    }

    // 根据记录类型填充数据
    if (template.serialNumber === 1) {
      // 计划招聘岗位名称
      record.january = positionNames[Math.floor(Math.random() * positionNames.length)]
      record.total = record.january
    } else if (template.serialNumber === 2) {
      // 计划招聘人数
      record.january = baseRecruitment.toString()
      record.total = baseRecruitment.toString()
    } else if (template.serialNumber === 3) {
      // 实际招聘岗位名称
      record.january = positionNames[Math.floor(Math.random() * positionNames.length)]
      record.total = record.january
    } else if (template.serialNumber === 4) {
      // 实际招聘人数
      record.january = baseRecruitment.toString()
      record.total = baseRecruitment.toString()
    } else if (template.serialNumber === 5) {
      // 入职者姓名
      record.january = names[Math.floor(Math.random() * names.length)]
      record.total = record.january
    } else if (template.serialNumber === 6) {
      // 离职人数
      record.january = baseDeparture.toString()
      record.total = baseDeparture.toString()
    } else if (template.serialNumber === 7) {
      // 离职者姓名
      if (baseDeparture > 0) {
        record.january = names[Math.floor(Math.random() * names.length)]
        record.total = record.january
      }
    }

    records.push(record)
  })

  return records
}

// 计算汇总统计数据
const calculateSummary = (
  data: CampusRecruitmentSummaryRecord[],
): CampusRecruitmentSummarySummary => {
  if (data.length === 0) {
    return {
      totalPlannedRecruitment: 0,
      totalActualRecruitment: 0,
      totalDepartures: 0,
      netGrowth: 0,
      recruitmentCompletionRate: 0,
      turnoverRate: 0,
      completedRecords: 0,
      totalRecords: 0,
      mostRecruitedPosition: '',
      mostDepartedPosition: '',
    }
  }

  // 获取计划招聘人数和实际招聘人数
  const plannedRecruitmentRecord = data.find((item) => item.serialNumber === 2)
  const actualRecruitmentRecord = data.find((item) => item.serialNumber === 4)
  const departureRecord = data.find((item) => item.serialNumber === 6)

  const totalPlannedRecruitment = plannedRecruitmentRecord
    ? parseInt(plannedRecruitmentRecord.total) || 0
    : 0
  const totalActualRecruitment = actualRecruitmentRecord
    ? parseInt(actualRecruitmentRecord.total) || 0
    : 0
  const totalDepartures = departureRecord ? parseInt(departureRecord.total) || 0 : 0

  const netGrowth = totalActualRecruitment - totalDepartures
  const recruitmentCompletionRate =
    totalPlannedRecruitment > 0 ? (totalActualRecruitment / totalPlannedRecruitment) * 100 : 0
  const turnoverRate =
    totalActualRecruitment > 0 ? (totalDepartures / totalActualRecruitment) * 100 : 0

  const completedRecords = data.filter((item) => item.total && item.total !== '').length
  const totalRecords = data.length

  // 获取招聘最多的岗位和离职最多的岗位
  const plannedPositionRecord = data.find((item) => item.serialNumber === 1)
  const actualPositionRecord = data.find((item) => item.serialNumber === 3)

  const mostRecruitedPosition = actualPositionRecord?.total || ''
  const mostDepartedPosition = plannedPositionRecord?.total || ''

  return {
    totalPlannedRecruitment,
    totalActualRecruitment,
    totalDepartures,
    netGrowth,
    recruitmentCompletionRate,
    turnoverRate,
    completedRecords,
    totalRecords,
    mostRecruitedPosition,
    mostDepartedPosition,
  }
}

export const campusRecruitmentSummaryService = {
  /**
   * 获取神殿招聘计划与总结汇总数据
   * @param campus 神殿名称
   * @returns Promise<CampusRecruitmentSummaryRecord[]>
   */
  getCampusRecruitmentSummaryData: async (
    campus: string,
  ): Promise<CampusRecruitmentSummaryRecord[]> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 500))

    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    return generateMockData(campus)
  },

  /**
   * 获取汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusRecruitmentSummarySummary>
   */
  getCampusRecruitmentSummarySummary: async (
    campus: string,
  ): Promise<CampusRecruitmentSummarySummary> => {
    const data = await campusRecruitmentSummaryService.getCampusRecruitmentSummaryData(campus)
    return calculateSummary(data)
  },

  /**
   * 更新神殿招聘计划与总结汇总数据
   * @param request 更新请求参数
   * @returns Promise<CampusRecruitmentSummaryRecord>
   */
  updateCampusRecruitmentSummaryData: async (
    request: CampusRecruitmentSummaryRequest & {
      serialNumber: number
      data: Partial<CampusRecruitmentSummaryRecord>
    },
  ): Promise<CampusRecruitmentSummaryRecord> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    const currentData = generateMockData(request.campus).find(
      (item) => item.serialNumber === request.serialNumber,
    )
    if (!currentData) {
      throw new Error('未找到指定序号的数据')
    }

    const updatedData = {
      ...currentData,
      ...request.data,
    }

    return updatedData
  },

  /**
   * 导出神殿招聘计划与总结汇总数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusRecruitmentSummaryData: async (campus: string): Promise<Blob> => {
    // 模拟API延迟
    await new Promise((resolve) => setTimeout(resolve, 200))

    const data = await campusRecruitmentSummaryService.getCampusRecruitmentSummaryData(campus)

    // 生成CSV内容
    const csvContent = [
      '序号,内容,1月,2月,3月,4月,5月,6月,7月,8月,9月,10月,11月,12月,合计',
      ...data.map(
        (item) =>
          `${item.serialNumber},${item.content},${item.january},${item.february},${item.march},${item.april},${item.may},${item.june},${item.july},${item.august},${item.september},${item.october},${item.november},${item.december},${item.total}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
