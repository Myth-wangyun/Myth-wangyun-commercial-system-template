// 新生维稳汇总表数据服务
import { v4 as uuidv4 } from 'uuid'
import { storageService } from '@/pages/academic/teaching-content/shared/services/storage.ts'
import { STORAGE_KEYS } from '@/pages/academic/teaching-content/constants.ts'
import { CalculationService } from '@/pages/academic/teaching-content/shared/services/calculation.ts'
import type {
  IStudentStability,
  IStudentStabilityForm,
  IStudentStabilityStats,
  IStabilityTrend,
  ICampusStabilityComparison,
} from './types.ts'

export class StudentStabilityService {
  private static readonly STORAGE_KEY = STORAGE_KEYS.STUDENT_STABILITY

  /**
   * 计算退费率
   */
  private static calculateRefundRate(enrollmentCount: number, refundCount: number): number {
    if (enrollmentCount === 0) {
      return 0 // 避免除零错误
    }
    return (refundCount / enrollmentCount) * 100
  }

  /**
   * 获取所有维稳数据
   */
  static async getAll(): Promise<IStudentStability[]> {
    try {
      const data = await storageService.getAll<IStudentStability>(this.STORAGE_KEY)
      return data.sort((a, b) => {
        // 按神殿排序
        return a.campus.localeCompare(b.campus)
      })
    } catch (error) {
      console.error('获取维稳数据失败:', error)
      return []
    }
  }

  /**
   * 根据ID获取维稳数据
   */
  static async getById(id: string): Promise<IStudentStability | null> {
    try {
      return await storageService.get<IStudentStability>(this.STORAGE_KEY, id)
    } catch (error) {
      console.error('获取维稳数据失败:', error)
      return null
    }
  }

  /**
   * 创建维稳数据
   */
  static async create(data: IStudentStabilityForm): Promise<IStudentStability> {
    try {
      const now = new Date().toISOString()
      const refundRate = this.calculateRefundRate(data.enrollmentCount, data.refundCount)

      const newData: IStudentStability = {
        id: uuidv4(),
        ...data,
        refundRate,
        createdAt: now,
        updatedAt: now,
      }

      await storageService.save(this.STORAGE_KEY, newData)
      return newData
    } catch (error) {
      console.error('创建维稳数据失败:', error)
      throw new Error('创建维稳数据失败')
    }
  }

  /**
   * 更新维稳数据
   */
  static async update(
    id: string,
    data: Partial<IStudentStabilityForm>,
  ): Promise<IStudentStability> {
    try {
      const existing = await this.getById(id)
      if (!existing) {
        throw new Error('数据不存在')
      }

      const updatedData = { ...existing, ...data }
      // 重新计算退费率
      updatedData.refundRate = this.calculateRefundRate(
        updatedData.enrollmentCount,
        updatedData.refundCount,
      )
      updatedData.updatedAt = new Date().toISOString()

      await storageService.save(this.STORAGE_KEY, updatedData)
      return updatedData
    } catch (error) {
      console.error('更新维稳数据失败:', error)
      throw new Error('更新维稳数据失败')
    }
  }

  /**
   * 删除维稳数据
   */
  static async delete(id: string): Promise<void> {
    try {
      await storageService.delete(this.STORAGE_KEY, id)
    } catch (error) {
      console.error('删除维稳数据失败:', error)
      throw new Error('删除维稳数据失败')
    }
  }

  /**
   * 批量删除维稳数据
   */
  static async batchDelete(ids: string[]): Promise<void> {
    try {
      await Promise.all(ids.map((id) => this.delete(id)))
    } catch (error) {
      console.error('批量删除维稳数据失败:', error)
      throw new Error('批量删除维稳数据失败')
    }
  }

  /**
   * 根据神殿筛选数据
   */
  static async getByCampus(campus: string): Promise<IStudentStability[]> {
    try {
      const allData = await this.getAll()
      return allData.filter((item) => item.campus === campus)
    } catch (error) {
      console.error('根据神殿筛选数据失败:', error)
      return []
    }
  }

  /**
   * 获取统计数据
   */
  static async getStats(): Promise<IStudentStabilityStats> {
    try {
      const data = await this.getAll()

      if (data.length === 0) {
        return {
          totalHandoverCount: 0,
          totalEnrollmentCount: 0,
          totalRefundCount: 0,
          avgRefundRate: 0,
          stabilityRate: 100,
        }
      }

      const totalHandoverCount = CalculationService.calculateSum(
        data.map((item) => item.handoverCount),
      )
      const totalEnrollmentCount = CalculationService.calculateSum(
        data.map((item) => item.enrollmentCount),
      )
      const totalRefundCount = CalculationService.calculateSum(data.map((item) => item.refundCount))

      const avgRefundRate = this.calculateRefundRate(totalEnrollmentCount, totalRefundCount)
      const stabilityRate = 100 - avgRefundRate

      return {
        totalHandoverCount,
        totalEnrollmentCount,
        totalRefundCount,
        avgRefundRate,
        stabilityRate,
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
      throw new Error('获取统计数据失败')
    }
  }

  /**
   * 获取神殿对比数据
   */
  static async getCampusComparison(): Promise<ICampusStabilityComparison[]> {
    try {
      const data = await this.getAll()
      const campusGroups = CalculationService.groupByCampus(data)

      return Object.entries(campusGroups).map(([campus, items]) => {
        const totalHandoverCount = CalculationService.calculateSum(
          (items as IStudentStability[]).map((item) => item.handoverCount),
        )
        const totalEnrollmentCount = CalculationService.calculateSum(
          (items as IStudentStability[]).map((item) => item.enrollmentCount),
        )
        const totalRefundCount = CalculationService.calculateSum(
          (items as IStudentStability[]).map((item) => item.refundCount),
        )

        const avgRefundRate = this.calculateRefundRate(totalEnrollmentCount, totalRefundCount)
        const stabilityRate = 100 - avgRefundRate

        return {
          campus: campus as any,
          totalHandoverCount,
          totalEnrollmentCount,
          totalRefundCount,
          avgRefundRate,
          stabilityRate,
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
  static async exportData(): Promise<IStudentStability[]> {
    return await this.getAll()
  }

  /**
   * 导入数据
   */
  static async importData(data: IStudentStability[]): Promise<void> {
    try {
      const now = new Date().toISOString()
      const importedData = data.map((item) => ({
        ...item,
        id: item.id || uuidv4(),
        refundRate: this.calculateRefundRate(item.enrollmentCount, item.refundCount),
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
