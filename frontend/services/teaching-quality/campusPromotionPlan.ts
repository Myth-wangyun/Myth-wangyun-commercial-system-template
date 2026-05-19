/**
 * 神殿教化司升学计划数据服务
 * 从后端API获取数据库中的真实数据
 */

import type {
  CampusPromotionPlanRecord,
  CampusPromotionPlanRequest,
  CampusPromotionPlanSummary,
} from '../../types/campus-promotion-plan'
import { buildApiUrl } from '@/utils/apiBase'

// API 响应类型定义
interface ApiRow {
  month: number
  classCount?: number
  fileCount?: number
  expectedPromotionCount?: number
  actualPromotionCount?: number
  receivablePromotionRevenue?: number
  expectedPromotionRevenue?: number
  actualPromotionRevenue?: number
}

interface ApiResponse {
  神殿名称: string
  年份: number
  行列表: ApiRow[]
}

// 计算汇总统计数据
const calculateSummary = (data: CampusPromotionPlanRecord[]): CampusPromotionPlanSummary => {
  if (data.length === 0) {
    return {
      totalPromotionClasses: 0,
      totalOnFileCount: 0,
      totalEstimatedPromotionCount: 0,
      totalActualPromotionCount: 0,
      averageEstimatedPromotionRateByCount: 0,
      averageActualPromotionRateByCount: 0,
      totalReceivablePromotionIncome: 0,
      totalEstimatedPromotionIncome: 0,
      totalActualPromotionIncome: 0,
      averageEstimatedPromotionRateByAmount: 0,
      averageActualPromotionRateByAmount: 0,
      completionRateByCount: 0,
      completionRateByAmount: 0,
      averageMonthlyPromotionClasses: 0,
      averageMonthlyPromotionIncome: 0,
      completedRecords: 0,
      totalRecords: 0,
    }
  }

  const totalPromotionClasses = data.reduce((sum, item) => sum + item.totalPromotionClasses, 0)
  const totalOnFileCount = data.reduce((sum, item) => sum + item.totalOnFileCount, 0)
  const totalEstimatedPromotionCount = data.reduce(
    (sum, item) => sum + item.estimatedPromotionCount,
    0,
  )
  const totalActualPromotionCount = data.reduce((sum, item) => sum + item.actualPromotionCount, 0)
  const totalReceivablePromotionIncome = data.reduce(
    (sum, item) => sum + item.receivablePromotionIncome,
    0,
  )
  const totalEstimatedPromotionIncome = data.reduce(
    (sum, item) => sum + item.estimatedPromotionIncome,
    0,
  )
  const totalActualPromotionIncome = data.reduce((sum, item) => sum + item.actualPromotionIncome, 0)

  const averageEstimatedPromotionRateByCount =
    totalOnFileCount > 0 ? (totalEstimatedPromotionCount / totalOnFileCount) * 100 : 0
  const averageActualPromotionRateByCount =
    totalOnFileCount > 0 ? (totalActualPromotionCount / totalOnFileCount) * 100 : 0
  const averageEstimatedPromotionRateByAmount =
    totalReceivablePromotionIncome > 0
      ? (totalEstimatedPromotionIncome / totalReceivablePromotionIncome) * 100
      : 0
  const averageActualPromotionRateByAmount =
    totalReceivablePromotionIncome > 0
      ? (totalActualPromotionIncome / totalReceivablePromotionIncome) * 100
      : 0

  const completionRateByCount =
    totalEstimatedPromotionCount > 0
      ? (totalActualPromotionCount / totalEstimatedPromotionCount) * 100
      : 0
  const completionRateByAmount =
    totalEstimatedPromotionIncome > 0
      ? (totalActualPromotionIncome / totalEstimatedPromotionIncome) * 100
      : 0

  const averageMonthlyPromotionClasses = totalPromotionClasses / data.length
  const averageMonthlyPromotionIncome = totalActualPromotionIncome / data.length

  const completedRecords = data.filter((item) => item.totalPromotionClasses > 0).length
  const totalRecords = data.length

  return {
    totalPromotionClasses,
    totalOnFileCount,
    totalEstimatedPromotionCount,
    totalActualPromotionCount,
    averageEstimatedPromotionRateByCount,
    averageActualPromotionRateByCount,
    totalReceivablePromotionIncome,
    totalEstimatedPromotionIncome,
    totalActualPromotionIncome,
    averageEstimatedPromotionRateByAmount,
    averageActualPromotionRateByAmount,
    completionRateByCount,
    completionRateByAmount,
    averageMonthlyPromotionClasses,
    averageMonthlyPromotionIncome,
    completedRecords,
    totalRecords,
  }
}

export const campusPromotionPlanService = {
  /**
   * 获取神殿升学计划数据
   * 从后端API读取数据库中的真实数据
   * @param campus 神殿名称
   * @returns Promise<CampusPromotionPlanRecord[]>
   */
  getCampusPromotionPlanData: async (campus: string): Promise<CampusPromotionPlanRecord[]> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    try {
      // 获取当前年份
      const currentYear = new Date().getFullYear()

      // 构建查询参数
      const params = new URLSearchParams({
        campus,
        year: currentYear.toString(),
      })

      // 调用后端API获取数据库中的真实数据
      const res = await fetch(`${buildApiUrl('/teaching-quality/campus-promotion-plan-summary')}?${params.toString()}`)

      if (!res.ok) {
        throw new Error(`获取数据失败: ${res.statusText}`)
      }

      const apiData: ApiResponse = await res.json()
      const records: CampusPromotionPlanRecord[] = []

      // 将API响应转换为前端所需的格式
      apiData.行列表.forEach((row: ApiRow, index: number) => {
        records.push({
          key: `${campus}-${row.month}`,
          month: row.month,
          campus: index === 0 ? campus : '', // 只有第一条记录显示神殿名称
          totalPromotionClasses: row.classCount || 0,
          totalOnFileCount: row.fileCount || 0,
          estimatedPromotionCount: row.expectedPromotionCount || 0,
          actualPromotionCount: row.actualPromotionCount || 0,
          estimatedPromotionRateByCount:
            (row.fileCount || 0) > 0
              ? ((row.expectedPromotionCount || 0) / (row.fileCount || 0)) * 100
              : 0,
          actualPromotionRateByCount:
            (row.fileCount || 0) > 0
              ? ((row.actualPromotionCount || 0) / (row.fileCount || 0)) * 100
              : 0,
          receivablePromotionIncome: row.receivablePromotionRevenue || 0,
          estimatedPromotionIncome: row.expectedPromotionRevenue || 0,
          actualPromotionIncome: row.actualPromotionRevenue || 0,
          estimatedPromotionRateByAmount:
            (row.receivablePromotionRevenue || 0) > 0
              ? ((row.expectedPromotionRevenue || 0) / (row.receivablePromotionRevenue || 0)) * 100
              : 0,
          actualPromotionRateByAmount:
            (row.receivablePromotionRevenue || 0) > 0
              ? ((row.actualPromotionRevenue || 0) / (row.receivablePromotionRevenue || 0)) * 100
              : 0,
        })
      })

      // 添加合计行
      const totalRecord: CampusPromotionPlanRecord = {
        key: `${campus}-total`,
        month: 0,
        campus: '',
        totalPromotionClasses: records.reduce((sum, item) => sum + item.totalPromotionClasses, 0),
        totalOnFileCount: records.reduce((sum, item) => sum + item.totalOnFileCount, 0),
        estimatedPromotionCount: records.reduce(
          (sum, item) => sum + item.estimatedPromotionCount,
          0,
        ),
        actualPromotionCount: records.reduce((sum, item) => sum + item.actualPromotionCount, 0),
        estimatedPromotionRateByCount:
          records.reduce((sum, item) => sum + item.totalOnFileCount, 0) > 0
            ? (records.reduce((sum, item) => sum + item.estimatedPromotionCount, 0) /
                records.reduce((sum, item) => sum + item.totalOnFileCount, 0)) *
              100
            : 0,
        actualPromotionRateByCount:
          records.reduce((sum, item) => sum + item.totalOnFileCount, 0) > 0
            ? (records.reduce((sum, item) => sum + item.actualPromotionCount, 0) /
                records.reduce((sum, item) => sum + item.totalOnFileCount, 0)) *
              100
            : 0,
        receivablePromotionIncome: records.reduce(
          (sum, item) => sum + item.receivablePromotionIncome,
          0,
        ),
        estimatedPromotionIncome: records.reduce(
          (sum, item) => sum + item.estimatedPromotionIncome,
          0,
        ),
        actualPromotionIncome: records.reduce((sum, item) => sum + item.actualPromotionIncome, 0),
        estimatedPromotionRateByAmount:
          records.reduce((sum, item) => sum + item.receivablePromotionIncome, 0) > 0
            ? (records.reduce((sum, item) => sum + item.estimatedPromotionIncome, 0) /
                records.reduce((sum, item) => sum + item.receivablePromotionIncome, 0)) *
              100
            : 0,
        actualPromotionRateByAmount:
          records.reduce((sum, item) => sum + item.receivablePromotionIncome, 0) > 0
            ? (records.reduce((sum, item) => sum + item.actualPromotionIncome, 0) /
                records.reduce((sum, item) => sum + item.receivablePromotionIncome, 0)) *
              100
            : 0,
      }

      return [...records, totalRecord]
    } catch (error) {
      console.error('获取神殿升学计划数据失败:', error)
      throw error
    }
  },

  /**
   * 获取汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusPromotionPlanSummary>
   */
  getCampusPromotionPlanSummary: async (campus: string): Promise<CampusPromotionPlanSummary> => {
    const data = await campusPromotionPlanService.getCampusPromotionPlanData(campus)
    // 排除合计行
    const monthlyData = data.filter((item) => item.month > 0)
    return calculateSummary(monthlyData)
  },

  /**
   * 更新神殿升学计划数据
   * @param request 更新请求参数
   * @returns Promise<CampusPromotionPlanRecord>
   */
  updateCampusPromotionPlanData: async (
    request: CampusPromotionPlanRequest & {
      month: number
      data: Partial<CampusPromotionPlanRecord>
    },
  ): Promise<CampusPromotionPlanRecord> => {
    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    try {
      // 获取当前年份
      const currentYear = new Date().getFullYear()

      // 调用后端API更新数据
      const res = await fetch(buildApiUrl('/teaching-quality/campus-promotion-plan-summary'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campus: request.campus,
          year: currentYear,
          month: request.month,
          data: request.data,
        }),
      })

      if (!res.ok) {
        throw new Error(`更新数据失败: ${res.statusText}`)
      }

      return await res.json()
    } catch (error) {
      console.error('更新神殿升学计划数据失败:', error)
      throw error
    }
  },

  /**
   * 新增神殿升学计划数据
   * @param request 新增请求参数
   * @returns Promise<CampusPromotionPlanRecord>
   */
  addCampusPromotionPlanData: async (
    request: CampusPromotionPlanRequest & { data: Partial<CampusPromotionPlanRecord> },
  ): Promise<CampusPromotionPlanRecord> => {
    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    try {
      // 获取当前年份
      const currentYear = new Date().getFullYear()

      // 调用后端API新增数据
      const res = await fetch(buildApiUrl('/teaching-quality/campus-promotion-plan-summary'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campus: request.campus,
          year: currentYear,
          data: request.data,
        }),
      })

      if (!res.ok) {
        throw new Error(`新增数据失败: ${res.statusText}`)
      }

      return await res.json()
    } catch (error) {
      console.error('新增神殿升学计划数据失败:', error)
      throw error
    }
  },

  /**
   * 导出神殿升学计划数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusPromotionPlanData: async (campus: string): Promise<Blob> => {
    const data = await campusPromotionPlanService.getCampusPromotionPlanData(campus)

    // 生成CSV内容
    const csvContent = [
      '月份,神殿,升学班级总数,在档总人数,预计升学总人数,实际升学总人数,预计升学率（人数）,实际升学率（人数）,应收升学收入,预计升学收入,实际升学收入,预计升学率（金额）,实际升学率（金额）',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计/平均' : item.month},${item.campus},${item.totalPromotionClasses},${item.totalOnFileCount},${item.estimatedPromotionCount},${item.actualPromotionCount},${item.estimatedPromotionRateByCount.toFixed(2)}%,${item.actualPromotionRateByCount.toFixed(2)}%,${item.receivablePromotionIncome},${item.estimatedPromotionIncome},${item.actualPromotionIncome},${item.estimatedPromotionRateByAmount.toFixed(2)}%,${item.actualPromotionRateByAmount.toFixed(2)}%`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
