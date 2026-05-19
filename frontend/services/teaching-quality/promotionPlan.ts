/**
 * 神殿教化司升学计划数据服务
 * 从后端API获取数据库中的真实数据
 */

import type { PromotionPlanRecord, PromotionPlanStats } from '../../types/promotion-plan'
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

export const promotionPlanService = {
  /**
   * 获取升学计划数据
   * 从后端API读取数据库中的真实数据
   * @param campus 神殿名称
   * @returns Promise<PromotionPlanRecord[]>
   */
  getPromotionPlanData: async (campus: string): Promise<PromotionPlanRecord[]> => {
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
      const res = await fetch(
        `${buildApiUrl('/teaching-quality/campus-promotion-plan-summary')}?${params.toString()}`,
      )

      if (!res.ok) {
        throw new Error(`获取数据失败: ${res.statusText}`)
      }

      const apiData: ApiResponse = await res.json()
      const records: PromotionPlanRecord[] = []

      // 将API响应转换为前端所需的格式
      apiData.行列表.forEach((row: ApiRow, index: number) => {
        records.push({
          key: `${campus}-${row.month}`,
          month: row.month,
          campus: index === 0 ? campus : '', // 只有第一条记录显示神殿名称
          totalClasses: row.classCount || 0,
          totalStudents: row.fileCount || 0,
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
          rowType: 'data',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      })

      // 添加合计/平均行
      const totalClasses = records.reduce((sum, r) => sum + r.totalClasses, 0)
      const totalStudents = records.reduce((sum, r) => sum + r.totalStudents, 0)
      const totalEstimatedPromotionCount = records.reduce(
        (sum, r) => sum + r.estimatedPromotionCount,
        0,
      )
      const totalActualPromotionCount = records.reduce((sum, r) => sum + r.actualPromotionCount, 0)
      const totalReceivablePromotionIncome = records.reduce(
        (sum, r) => sum + r.receivablePromotionIncome,
        0,
      )
      const totalEstimatedPromotionIncome = records.reduce(
        (sum, r) => sum + r.estimatedPromotionIncome,
        0,
      )
      const totalActualPromotionIncome = records.reduce(
        (sum, r) => sum + r.actualPromotionIncome,
        0,
      )

      // 计算平均升学率
      const averageEstimatedPromotionRateByCount =
        totalStudents > 0 ? (totalEstimatedPromotionCount / totalStudents) * 100 : 0
      const averageActualPromotionRateByCount =
        totalStudents > 0 ? (totalActualPromotionCount / totalStudents) * 100 : 0
      const averageEstimatedPromotionRateByAmount =
        totalReceivablePromotionIncome > 0
          ? (totalEstimatedPromotionIncome / totalReceivablePromotionIncome) * 100
          : 0
      const averageActualPromotionRateByAmount =
        totalReceivablePromotionIncome > 0
          ? (totalActualPromotionIncome / totalReceivablePromotionIncome) * 100
          : 0

      records.push({
        key: 'total',
        month: 0,
        campus: '',
        totalClasses,
        totalStudents,
        estimatedPromotionCount: totalEstimatedPromotionCount,
        actualPromotionCount: totalActualPromotionCount,
        estimatedPromotionRateByCount: averageEstimatedPromotionRateByCount,
        actualPromotionRateByCount: averageActualPromotionRateByCount,
        receivablePromotionIncome: totalReceivablePromotionIncome,
        estimatedPromotionIncome: totalEstimatedPromotionIncome,
        actualPromotionIncome: totalActualPromotionIncome,
        estimatedPromotionRateByAmount: averageEstimatedPromotionRateByAmount,
        actualPromotionRateByAmount: averageActualPromotionRateByAmount,
        rowType: 'total',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      return records
    } catch (error) {
      console.error('获取升学计划数据失败:', error)
      throw error
    }
  },

  /**
   * 获取升学计划统计数据
   * @param campus 神殿名称
   * @returns Promise<PromotionPlanStats>
   */
  getPromotionPlanStats: async (campus: string): Promise<PromotionPlanStats> => {
    const data = await promotionPlanService.getPromotionPlanData(campus)
    const dataRows = data.filter((r) => r.rowType === 'data')
    const totalRow = data.find((r) => r.rowType === 'total')

    return {
      totalMonths: dataRows.length,
      totalClasses: totalRow?.totalClasses || 0,
      totalStudents: totalRow?.totalStudents || 0,
      totalEstimatedPromotionCount: totalRow?.estimatedPromotionCount || 0,
      totalActualPromotionCount: totalRow?.actualPromotionCount || 0,
      averageEstimatedPromotionRateByCount: totalRow?.estimatedPromotionRateByCount || 0,
      averageActualPromotionRateByCount: totalRow?.actualPromotionRateByCount || 0,
      totalReceivablePromotionIncome: totalRow?.receivablePromotionIncome || 0,
      totalEstimatedPromotionIncome: totalRow?.estimatedPromotionIncome || 0,
      totalActualPromotionIncome: totalRow?.actualPromotionIncome || 0,
      averageEstimatedPromotionRateByAmount: totalRow?.estimatedPromotionRateByAmount || 0,
      averageActualPromotionRateByAmount: totalRow?.actualPromotionRateByAmount || 0,
    }
  },

  /**
   * 导出升学计划数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportPromotionPlanData: async (campus: string): Promise<Blob> => {
    const data = await promotionPlanService.getPromotionPlanData(campus)

    const csvContent = [
      '月份,神殿,升学班级总数,在档总人数,预计升学总人数,实际升学总人数,预计升学率（人数）,实际升学率（人数）,应收升学收入,预计升学收入,实际升学收入,预计升学率（金额）,实际升学率（金额）',
      ...data.map(
        (item) =>
          `${item.month === 0 ? '合计/平均' : item.month},${item.campus},${item.totalClasses},${item.totalStudents},${item.estimatedPromotionCount},${item.actualPromotionCount},${item.estimatedPromotionRateByCount.toFixed(2)}%,${item.actualPromotionRateByCount.toFixed(2)}%,${item.receivablePromotionIncome},${item.estimatedPromotionIncome},${item.actualPromotionIncome},${item.estimatedPromotionRateByAmount.toFixed(2)}%,${item.actualPromotionRateByAmount.toFixed(2)}%`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
