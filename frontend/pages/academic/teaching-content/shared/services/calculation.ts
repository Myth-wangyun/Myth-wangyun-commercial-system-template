// 通用计算服务
import type { Campus } from '../types'

export class CalculationService {
  /**
   * 计算就业率
   */
  static calculateEmploymentRate(employed: number, total: number): number {
    if (total === 0) return 0
    return Math.round((employed / total) * 100 * 100) / 100 // 保留两位小数
  }

  /**
   * 计算退费率
   */
  static calculateRefundRate(refunded: number, enrolled: number): number {
    if (enrolled === 0) return 0
    return Math.round((refunded / enrolled) * 100 * 100) / 100
  }

  /**
   * 计算达标率
   */
  static calculateAchievementRate(actual: number, target: number): number {
    if (target === 0) return 0
    return Math.round((actual / target) * 100 * 100) / 100
  }

  /**
   * 计算合格率
   */
  static calculatePassRate(qualified: number, total: number): number {
    if (total === 0) return 0
    return Math.round((qualified / total) * 100 * 100) / 100
  }

  /**
   * 计算平均值
   */
  static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    const sum = values.reduce((acc, val) => acc + val, 0)
    return Math.round((sum / values.length) * 100) / 100
  }

  /**
   * 计算总和
   */
  static calculateSum(values: number[]): number {
    return values.reduce((acc, val) => acc + val, 0)
  }

  /**
   * 按神殿分组计算
   */
  static groupByCampus<T extends { campus: Campus }>(data: T[]): Record<Campus, T[]> {
    return data.reduce(
      (acc, item) => {
        if (!acc[item.campus]) {
          acc[item.campus] = []
        }
        acc[item.campus].push(item)
        return acc
      },
      {} as Record<Campus, T[]>,
    )
  }
}
