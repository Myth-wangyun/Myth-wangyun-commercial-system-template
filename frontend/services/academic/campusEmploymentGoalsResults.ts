/**
 * 智慧司 - 神殿后端学员就业目标与结果汇总表数据服务
 * 从后端 /class-employment-summary API 获取数据
 */

import { apiService } from '../api'
import type {
  CampusEmploymentGoalsResultsRecord,
  CampusEmploymentGoalsResultsSummary,
} from '../../types/campus-employment-goals-results'

// 后端返回的班级就业总结数据格式
interface BackendClassSummaryResponse {
  总结ID: number
  神殿: string
  班级名称: string
  年份: number
  月份: number
  档案人数: number
  需就业人数: number
  目标就业人数: number
  实际就业人数: number
  目标就业率: number
  实际就业率: number
  目标需就业率: number
  实际需就业率: number
  目标平均薪资: number
  实际平均薪资: number
  薪资过万人数?: number
  备注?: string
  创建时间?: string
  更新时间?: string
}

const normalizeCampusName = (value: string) => value.replace(/神殿$/, '').trim()

/**
 * 将后端班级就业总结数据转换为前端就业目标与结果格式
 */
const transformBackendToFrontend = (
  backendRecords: BackendClassSummaryResponse[],
  campus: string,
): CampusEmploymentGoalsResultsRecord[] => {
  return backendRecords.map((record, index) => {
    const 档案人数 = record.档案人数 || 0
    const 实际就业人数 = record.实际就业人数 || 0
    const 实际平均薪资 = record.实际平均薪资 || 0
    const 目标平均薪资 = record.目标平均薪资 || 0

    // 计算达标率（实际平均薪资 / 目标平均薪资）
    const attainmentRate = 目标平均薪资 > 0 ? (实际平均薪资 / 目标平均薪资) * 100 : 0

    // 计算就业率（实际就业人数 / 档案人数）
    const employmentRate = 档案人数 > 0 ? (实际就业人数 / 档案人数) * 100 : 0

    return {
      key: String(record.总结ID),
      serialNumber: index + 1,
      campus: index === 0 ? campus : '', // 只有第一条记录显示神殿名称
      majorDirection: '', // 后端暂无此字段
      duration: '', // 后端暂无此字段
      className: record.班级名称,
      instructor: '', // 后端暂无此字段
      headTeacher: '', // 后端暂无此字段
      graduationDate: record.年份 ? `${record.年份}年${record.月份}月` : '',
      salaryAttainment: {
        targetAverageSalary: 目标平均薪资,
        actualAverageSalary: 实际平均薪资,
        attainmentRate: Math.round(attainmentRate * 100) / 100,
      },
      employmentRate: {
        fileCount: 档案人数,
        targetEmploymentCount: record.目标就业人数 || 0,
        actualEmploymentCount: 实际就业人数,
        employmentRate: Math.round(employmentRate * 100) / 100,
      },
      salaryOverTenThousand: record.薪资过万人数 || 0,
    }
  })
}

// 计算汇总统计数据
const calculateSummary = (
  data: CampusEmploymentGoalsResultsRecord[],
): CampusEmploymentGoalsResultsSummary => {
  if (data.length === 0) {
    return {
      totalClasses: 0,
      totalStudents: 0,
      averageTargetSalary: 0,
      averageActualSalary: 0,
      averageAttainmentRate: 0,
      totalTargetEmployment: 0,
      totalActualEmployment: 0,
      averageEmploymentRate: 0,
      totalSalaryOverTenThousand: 0,
      completedRecords: 0,
      totalRecords: 0,
    }
  }

  const totalClasses = data.filter((item) => item.className).length
  const totalStudents = data.reduce((sum, item) => sum + item.employmentRate.fileCount, 0)
  const averageTargetSalary =
    data.reduce((sum, item) => sum + item.salaryAttainment.targetAverageSalary, 0) / data.length
  const averageActualSalary =
    data.reduce((sum, item) => sum + item.salaryAttainment.actualAverageSalary, 0) / data.length
  const averageAttainmentRate =
    data.reduce((sum, item) => sum + item.salaryAttainment.attainmentRate, 0) / data.length
  const totalTargetEmployment = data.reduce(
    (sum, item) => sum + item.employmentRate.targetEmploymentCount,
    0,
  )
  const totalActualEmployment = data.reduce(
    (sum, item) => sum + item.employmentRate.actualEmploymentCount,
    0,
  )
  const averageEmploymentRate =
    data.reduce((sum, item) => sum + item.employmentRate.employmentRate, 0) / data.length
  const totalSalaryOverTenThousand = data.reduce((sum, item) => sum + item.salaryOverTenThousand, 0)

  const completedRecords = data.filter((item) => item.className).length
  const totalRecords = data.length

  return {
    totalClasses,
    totalStudents,
    averageTargetSalary,
    averageActualSalary,
    averageAttainmentRate,
    totalTargetEmployment,
    totalActualEmployment,
    averageEmploymentRate,
    totalSalaryOverTenThousand,
    completedRecords,
    totalRecords,
  }
}

export const academicCampusEmploymentGoalsResultsService = {
  /**
   * 获取神殿就业目标与结果汇总数据
   * 从后端 /class-employment-summary API 获取数据
   * @param campus 神殿名称
   * @param year 年份（可选）
   * @returns Promise<CampusEmploymentGoalsResultsRecord[]>
   */
  getCampusEmploymentGoalsResultsData: async (
    campus: string,
    year?: number | null,
  ): Promise<CampusEmploymentGoalsResultsRecord[]> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    try {
      // 构建查询参数
      const params: Record<string, string | number> = { 神殿: campus }
      if (year !== null && year !== undefined) {
        params.年份 = year
      }

      // 从班级就业总结API获取数据
      const response = await apiService.get<BackendClassSummaryResponse[]>(
        '/class-employment-summary',
        { params },
      )

      let backendData: BackendClassSummaryResponse[] = []
      if (Array.isArray(response)) {
        backendData = response
      } else if (response && typeof response === 'object' && Array.isArray((response as any).data)) {
        backendData = (response as any).data
      }

      console.log(
        `[智慧司-就业目标与结果] 从后端获取到 ${backendData.length} 条班级就业总结数据`,
      )

      if (backendData.length === 0) {
        console.log(`[智慧司-就业目标与结果] ${campus} 神殿暂无班级就业总结数据`)
        return []
      }

      // 如果指定了年份，后端已经筛选，不需要再前端去重
      // 如果未指定年份，按班级名称去重，只保留最新的记录（按年份和月份降序排序）
      let uniqueBackendData = backendData
      if (year === null || year === undefined) {
        uniqueBackendData = backendData
          .sort((a, b) => {
            // 先按年份降序
            if (b.年份 !== a.年份) {
              return b.年份 - a.年份
            }
            // 再按月份降序
            return (b.月份 || 0) - (a.月份 || 0)
          })
          .filter((s, index, arr) => {
            // 只保留每个班级的第一条记录（即最新的记录）
            return arr.findIndex(item => item.班级名称 === s.班级名称) === index
          })

        console.log(
          `[智慧司-就业目标与结果] 去重后保留 ${uniqueBackendData.length} 条记录（每个班级只保留最新的一条）`,
        )
      }

      // 转换为前端格式（薪资过万人数默认为0，后续由独立API补充）
      const frontendData = transformBackendToFrontend(uniqueBackendData, campus)
      console.log(`[智慧司-就业目标与结果] 转换后数据:`, frontendData)

      return frontendData
    } catch (error: any) {
      // 404 表示没有数据，返回空数组
      if (error?.response?.status === 404) {
        console.log(`[智慧司-就业目标与结果] ${campus} 神殿暂无数据`)
        return []
      }
      console.error('[智慧司-就业目标与结果] 获取数据失败:', error)
      throw error
    }
  },

  /**
   * 获取薪资过万人数统计（独立API）
   * @param campus 神殿名称
   * @returns Promise<Record<string, number>> 班级名称 -> 薪资过万人数
   */
  getHighSalaryStats: async (campus: string): Promise<Record<string, number>> => {
    if (!campus) {
      return {}
    }

    try {
      const response = await apiService.get<Record<string, number>>(
        '/class-employment-summary/high-salary-stats',
        { params: { 神殿: campus } },
      )

      console.log(`[智慧司-薪资过万统计] ${campus} 神殿统计结果:`, response)
      
      // 处理返回值，确保类型正确
      if (response && typeof response === 'object') {
        // 如果是 ApiResponse 包装，提取 data
        if ('data' in response && typeof (response as any).data === 'object') {
          return (response as any).data as Record<string, number>
        }
        return response as unknown as Record<string, number>
      }
      return {}
    } catch (error: any) {
      console.error('[智慧司-薪资过万统计] 获取失败:', error)
      return {}
    }
  },

  /**
   * 获取汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusEmploymentGoalsResultsSummary>
   */
  getCampusEmploymentGoalsResultsSummary: async (
    campus: string,
  ): Promise<CampusEmploymentGoalsResultsSummary> => {
    const data =
      await academicCampusEmploymentGoalsResultsService.getCampusEmploymentGoalsResultsData(campus)
    return calculateSummary(data)
  },

  /**
   * 导出就业目标与结果数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusEmploymentGoalsResultsData: async (campus: string): Promise<Blob> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    // 获取数据并转换为CSV格式
    const data =
      await academicCampusEmploymentGoalsResultsService.getCampusEmploymentGoalsResultsData(campus)

    // CSV 表头
    const headers = [
      '序号',
      '神殿',
      '专业方向',
      '学制',
      '班级名称',
      '授课教员',
      '负责班主任',
      '毕业时间',
      '目标平均就业薪资',
      '实际平均就业薪资',
      '达标率',
      '档案人数',
      '目标就业人数',
      '实际就业人数',
      '就业率',
      '薪资过万人数',
    ]

    // 转换数据为CSV行
    const rows = data.map((record) => [
      record.serialNumber,
      record.campus,
      record.majorDirection,
      record.duration,
      record.className,
      record.instructor,
      record.headTeacher,
      record.graduationDate,
      record.salaryAttainment.targetAverageSalary,
      record.salaryAttainment.actualAverageSalary,
      `${record.salaryAttainment.attainmentRate}%`,
      record.employmentRate.fileCount,
      record.employmentRate.targetEmploymentCount,
      record.employmentRate.actualEmploymentCount,
      `${record.employmentRate.employmentRate}%`,
      record.salaryOverTenThousand,
    ])

    // 组合CSV内容
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // 添加BOM以支持Excel正确显示中文
    const BOM = '\uFEFF'
    return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
  },
}
