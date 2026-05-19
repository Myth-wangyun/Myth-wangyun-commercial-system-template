// 口碑招生汇总表数据服务
import { v4 as uuidv4 } from 'uuid'
import { storageService } from '@/pages/academic/teaching-content/shared/services/storage.ts'
import { STORAGE_KEYS } from '@/pages/academic/teaching-content/constants.ts'
import { CalculationService } from '@/pages/academic/teaching-content/shared/services/calculation.ts'
import type {
  IEnrollmentSummary,
  IEnrollmentSummaryForm,
  IEnrollmentStats,
  IEnrollmentTrend,
  ICampusEnrollmentComparison,
} from './types.ts'

export class EnrollmentSummaryService {
  private static readonly STORAGE_KEY = STORAGE_KEYS.ENROLLMENT_SUMMARY

  /**
   * 获取所有招生数据
   */
  static async getAll(): Promise<IEnrollmentSummary[]> {
    try {
      const data = await storageService.getAll<IEnrollmentSummary>(this.STORAGE_KEY)
      return data.sort((a, b) => {
        // 按年份和月份排序
        if (a.year !== b.year) {
          return b.year - a.year
        }
        return b.month - a.month
      })
    } catch (error) {
      console.error('获取招生数据失败:', error)
      return []
    }
  }

  /**
   * 根据ID获取招生数据
   */
  static async getById(id: string): Promise<IEnrollmentSummary | null> {
    try {
      return await storageService.get<IEnrollmentSummary>(this.STORAGE_KEY, id)
    } catch (error) {
      console.error('获取招生数据失败:', error)
      return null
    }
  }

  /**
   * 创建招生数据
   */
  static async create(data: IEnrollmentSummaryForm): Promise<IEnrollmentSummary> {
    try {
      const now = new Date().toISOString()
      const newData: IEnrollmentSummary = {
        id: uuidv4(),
        ...data,
        createdAt: now,
        updatedAt: now,
      }

      await storageService.save(this.STORAGE_KEY, newData)
      return newData
    } catch (error) {
      console.error('创建招生数据失败:', error)
      throw new Error('创建招生数据失败')
    }
  }

  /**
   * 更新招生数据
   */
  static async update(
    id: string,
    data: Partial<IEnrollmentSummaryForm>,
  ): Promise<IEnrollmentSummary> {
    try {
      const existing = await this.getById(id)
      if (!existing) {
        throw new Error('数据不存在')
      }

      const updatedData: IEnrollmentSummary = {
        ...existing,
        ...data,
        updatedAt: new Date().toISOString(),
      }

      await storageService.save(this.STORAGE_KEY, updatedData)
      return updatedData
    } catch (error) {
      console.error('更新招生数据失败:', error)
      throw new Error('更新招生数据失败')
    }
  }

  /**
   * 删除招生数据
   */
  static async delete(id: string): Promise<void> {
    try {
      await storageService.delete(this.STORAGE_KEY, id)
    } catch (error) {
      console.error('删除招生数据失败:', error)
      throw new Error('删除招生数据失败')
    }
  }

  /**
   * 批量删除招生数据
   */
  static async batchDelete(ids: string[]): Promise<void> {
    try {
      await Promise.all(ids.map((id) => this.delete(id)))
    } catch (error) {
      console.error('批量删除招生数据失败:', error)
      throw new Error('批量删除招生数据失败')
    }
  }

  /**
   * 根据神殿筛选数据
   */
  static async getByCampus(campus: string): Promise<IEnrollmentSummary[]> {
    try {
      const allData = await this.getAll()
      return allData.filter((item) => item.campus === campus)
    } catch (error) {
      console.error('根据神殿筛选数据失败:', error)
      return []
    }
  }

  /**
   * 根据年份筛选数据
   */
  static async getByYear(year: number): Promise<IEnrollmentSummary[]> {
    try {
      const allData = await this.getAll()
      return allData.filter((item) => item.year === year)
    } catch (error) {
      console.error('根据年份筛选数据失败:', error)
      return []
    }
  }

  /**
   * 根据月份筛选数据
   */
  static async getByMonth(month: number): Promise<IEnrollmentSummary[]> {
    try {
      const allData = await this.getAll()
      return allData.filter((item) => item.month === month)
    } catch (error) {
      console.error('根据月份筛选数据失败:', error)
      return []
    }
  }

  /**
   * 获取统计数据
   */
  static async getStats(): Promise<IEnrollmentStats> {
    try {
      const data = await this.getAll()

      if (data.length === 0) {
        return {
          totalTargetWOM: 0,
          totalActualWOM: 0,
          totalTargetWalkin: 0,
          totalActualWalkin: 0,
          totalTargetEnrollment: 0,
          totalActualEnrollment: 0,
          totalTargetRevenue: 0,
          totalActualRevenue: 0,
          avgWOMRate: 0,
          avgWalkinRate: 0,
          avgEnrollmentRate: 0,
          avgRevenueRate: 0,
        }
      }

      const totalTargetWOM = CalculationService.calculateSum(data.map((item) => item.targetWOM))
      const totalActualWOM = CalculationService.calculateSum(data.map((item) => item.actualWOM))
      const totalTargetWalkin = CalculationService.calculateSum(
        data.map((item) => item.targetWalkin),
      )
      const totalActualWalkin = CalculationService.calculateSum(
        data.map((item) => item.actualWalkin),
      )
      const totalTargetEnrollment = CalculationService.calculateSum(
        data.map((item) => item.targetEnrollment),
      )
      const totalActualEnrollment = CalculationService.calculateSum(
        data.map((item) => item.actualEnrollment),
      )
      const totalTargetRevenue = CalculationService.calculateSum(
        data.map((item) => item.targetRevenue),
      )
      const totalActualRevenue = CalculationService.calculateSum(
        data.map((item) => item.actualRevenue),
      )

      const avgWOMRate = CalculationService.calculateAchievementRate(totalActualWOM, totalTargetWOM)
      const avgWalkinRate = CalculationService.calculateAchievementRate(
        totalActualWalkin,
        totalTargetWalkin,
      )
      const avgEnrollmentRate = CalculationService.calculateAchievementRate(
        totalActualEnrollment,
        totalTargetEnrollment,
      )
      const avgRevenueRate = CalculationService.calculateAchievementRate(
        totalActualRevenue,
        totalTargetRevenue,
      )

      return {
        totalTargetWOM,
        totalActualWOM,
        totalTargetWalkin,
        totalActualWalkin,
        totalTargetEnrollment,
        totalActualEnrollment,
        totalTargetRevenue,
        totalActualRevenue,
        avgWOMRate,
        avgWalkinRate,
        avgEnrollmentRate,
        avgRevenueRate,
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
      throw new Error('获取统计数据失败')
    }
  }

  /**
   * 获取月度趋势数据
   */
  static async getTrendData(campus?: string, year?: number): Promise<IEnrollmentTrend[]> {
    try {
      let data = await this.getAll()

      if (campus) {
        data = data.filter((item) => item.campus === campus)
      }

      if (year) {
        data = data.filter((item) => item.year === year)
      }

      // 按月份分组
      const monthGroups = data.reduce(
        (acc, item) => {
          const monthKey = `${item.year}-${item.month.toString().padStart(2, '0')}`
          if (!acc[monthKey]) {
            acc[monthKey] = []
          }
          acc[monthKey].push(item)
          return acc
        },
        {} as Record<string, IEnrollmentSummary[]>,
      )

      return Object.entries(monthGroups)
        .map(([month, items]) => {
          const totalTargetWOM = CalculationService.calculateSum(
            items.map((item) => item.targetWOM),
          )
          const totalActualWOM = CalculationService.calculateSum(
            items.map((item) => item.actualWOM),
          )
          const totalTargetWalkin = CalculationService.calculateSum(
            items.map((item) => item.targetWalkin),
          )
          const totalActualWalkin = CalculationService.calculateSum(
            items.map((item) => item.actualWalkin),
          )
          const totalTargetEnrollment = CalculationService.calculateSum(
            items.map((item) => item.targetEnrollment),
          )
          const totalActualEnrollment = CalculationService.calculateSum(
            items.map((item) => item.actualEnrollment),
          )
          const totalTargetRevenue = CalculationService.calculateSum(
            items.map((item) => item.targetRevenue),
          )
          const totalActualRevenue = CalculationService.calculateSum(
            items.map((item) => item.actualRevenue),
          )

          return {
            month,
            targetWOM: totalTargetWOM,
            actualWOM: totalActualWOM,
            targetWalkin: totalTargetWalkin,
            actualWalkin: totalActualWalkin,
            targetEnrollment: totalTargetEnrollment,
            actualEnrollment: totalActualEnrollment,
            targetRevenue: totalTargetRevenue,
            actualRevenue: totalActualRevenue,
          }
        })
        .sort((a, b) => a.month.localeCompare(b.month))
    } catch (error) {
      console.error('获取趋势数据失败:', error)
      return []
    }
  }

  /**
   * 获取神殿对比数据
   */
  static async getCampusComparison(): Promise<ICampusEnrollmentComparison[]> {
    try {
      const data = await this.getAll()
      const campusGroups = CalculationService.groupByCampus(data)

      return Object.entries(campusGroups).map(([campus, items]) => {
        const totalTargetWOM = CalculationService.calculateSum(
          (items as IEnrollmentSummary[]).map((item) => item.targetWOM),
        )
        const totalActualWOM = CalculationService.calculateSum(
          (items as IEnrollmentSummary[]).map((item) => item.actualWOM),
        )
        const totalTargetEnrollment = CalculationService.calculateSum(
          (items as IEnrollmentSummary[]).map((item) => item.targetEnrollment),
        )
        const totalActualEnrollment = CalculationService.calculateSum(
          (items as IEnrollmentSummary[]).map((item) => item.actualEnrollment),
        )
        const totalTargetRevenue = CalculationService.calculateSum(
          (items as IEnrollmentSummary[]).map((item) => item.targetRevenue),
        )
        const totalActualRevenue = CalculationService.calculateSum(
          (items as IEnrollmentSummary[]).map((item) => item.actualRevenue),
        )

        const avgWOMRate = CalculationService.calculateAchievementRate(
          totalActualWOM,
          totalTargetWOM,
        )
        const avgEnrollmentRate = CalculationService.calculateAchievementRate(
          totalActualEnrollment,
          totalTargetEnrollment,
        )
        const avgRevenueRate = CalculationService.calculateAchievementRate(
          totalActualRevenue,
          totalTargetRevenue,
        )

        return {
          campus: campus as any,
          totalTargetWOM,
          totalActualWOM,
          totalTargetEnrollment,
          totalActualEnrollment,
          totalTargetRevenue,
          totalActualRevenue,
          avgWOMRate,
          avgEnrollmentRate,
          avgRevenueRate,
        }
      })
    } catch (error) {
      console.error('获取神殿对比数据失败:', error)
      return []
    }
  }

  /**
   * 导出数据
   */
  static async exportData(): Promise<IEnrollmentSummary[]> {
    return await this.getAll()
  }

  /**
   * 导入数据
   */
  static async importData(data: IEnrollmentSummary[]): Promise<void> {
    try {
      const now = new Date().toISOString()
      const importedData = data.map((item) => ({
        ...item,
        id: item.id || uuidv4(),
        createdAt: item.createdAt || now,
        updatedAt: now,
      }))

      await storageService.saveAll(this.STORAGE_KEY, importedData)
    } catch (error) {
      console.error('导入数据失败:', error)
      throw new Error('导入数据失败')
    }
  }

  /**
   * 清空所有数据
   */
  static async clearAll(): Promise<void> {
    try {
      await storageService.clear(this.STORAGE_KEY)
    } catch (error) {
      console.error('清空数据失败:', error)
      throw new Error('清空数据失败')
    }
  }
}
