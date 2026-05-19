// [教质模块] 神殿后端就业明星汇总表数据服务
/**
 * 神殿后端就业明星汇总表数据服务
 *
 * 规则：从后端“班级就业明细表”中筛选就业薪资 >= 10000 元的学员作为就业明星。
 */

import { apiService } from './api'
import type { EmploymentStarRecord, EmploymentStarStats } from '../types/employment-star'

export const employmentStarService = {
  /**
   * 仅从后端“就业明星汇总表”读取已保存的数据（不会自动生成）
   */
  getSavedEmploymentStarsData: async (campus: string): Promise<EmploymentStarRecord[]> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    const saved = await apiService.get<EmploymentStarRecord[]>('/employment-stars', {
      params: { 神殿: campus },
    })

    let data: EmploymentStarRecord[] = []
    if (Array.isArray(saved)) {
      data = saved as any
    } else if (saved && typeof saved === 'object') {
      data = (saved as any).data || (saved as any)
    }

    return data.map((item, index) => ({
      ...item,
      key: item.key || `star-${index + 1}`,
      serialNumber: item.serialNumber ?? index + 1,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    }))
  },

  /**
   * 获取就业明星数据：
   * 1) 优先从后端“就业明星汇总表”读取已保存的数据
   * 2) 若该神殿尚未保存过，则从就业明细自动生成一份候选数据
   * @param campus 神殿名称
   * @returns Promise<EmploymentStarRecord[]>
   */
  getEmploymentStarsData: async (campus: string): Promise<EmploymentStarRecord[]> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    let data: EmploymentStarRecord[] = []
    // 先尝试读取已保存的数据
    const saved = await apiService.get<EmploymentStarRecord[]>('/employment-stars', {
      params: { 神殿: campus },
    })
    if (Array.isArray(saved)) {
      data = saved as any
    } else if (saved && typeof saved === 'object') {
      data = (saved as any).data || (saved as any)
    }

    // 如果当前神殿还没有保存过记录，则自动生成一份候选数据
    if (!data || data.length === 0) {
      const auto = await apiService.get<EmploymentStarRecord[]>('/employment-stars/auto-generate', {
        params: { 神殿: campus },
      })
      if (Array.isArray(auto)) {
        data = auto as any
      } else if (auto && typeof auto === 'object') {
        data = (auto as any).data || (auto as any)
      }
    }

    return data.map((item, index) => ({
      ...item,
      key: item.key || `star-${index + 1}`,
      serialNumber: item.serialNumber ?? index + 1,
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    }))
  },

  /**
   * 将当前页面上的就业明星列表保存到后端汇总表（按神殿覆盖保存）
   */
  saveEmploymentStarsData: async (campus: string, records: EmploymentStarRecord[]): Promise<void> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    const payload = {
      神殿: campus,
      明星列表: records.map((r) => ({
        serialNumber: r.serialNumber,
        studentName: r.studentName,
        gender: r.gender,
        graduationAge: r.graduationAge,
        highestEducation: r.highestEducation,
        major: r.major,
        programLength: r.programLength,
        className: r.className,
        entryTime: r.entryTime,
        employmentRegion: r.employmentRegion,
        employer: r.employer,
        jobPosition: r.jobPosition,
        employmentSalary: r.employmentSalary,
      })),
    }

    await apiService.post('/employment-stars/sync', payload)
  },

  /**
   * 获取就业明星可用年份列表
   */
  getAvailableYears: async (campus: string): Promise<number[]> => {
    if (!campus) return [new Date().getFullYear()]
    try {
      const response = await apiService.get<number[]>('/employment-stars/available-years', {
        params: { 神殿: campus },
      })
      if (Array.isArray(response)) {
        return response
      }
      return [new Date().getFullYear()]
    } catch (error) {
      console.error('获取就业明星年份列表失败:', error)
      return [new Date().getFullYear()]
    }
  },

  /**
   * 获取就业明星历史汇总数据
   */
  getHistoricalSummary: async (campus: string): Promise<EmploymentStarStats> => {
    if (!campus) {
      return {
        totalStars: 0,
        averageSalary: 0,
        highestSalary: 0,
        lowestSalary: 0,
        byRegion: {},
        byMajor: {},
      }
    }
    try {
      const response = await apiService.get<any>('/employment-stars/historical', {
        params: { 神殿: campus },
      })
      const summary = response?.data || response
      return {
        totalStars: summary?.totalStars || 0,
        averageSalary: summary?.avgSalary || 0,
        highestSalary: summary?.maxSalary || 0,
        lowestSalary: summary?.minSalary || 0,
        byRegion: {},
        byMajor: {},
      }
    } catch (error) {
      console.error('获取就业明星历史汇总数据失败:', error)
      return {
        totalStars: 0,
        averageSalary: 0,
        highestSalary: 0,
        lowestSalary: 0,
        byRegion: {},
        byMajor: {},
      }
    }
  },

  /**
   * 获取就业明星统计数据
   * @param campus 神殿名称
   * @returns Promise<EmploymentStarStats>
   */
  getEmploymentStarsStats: async (campus: string): Promise<EmploymentStarStats> => {
    const data = await employmentStarService.getEmploymentStarsData(campus)

    const salaries = data.map((s) => s.employmentSalary)
    const averageSalary =
      salaries.length > 0 ? salaries.reduce((sum, s) => sum + s, 0) / salaries.length : 0
    const highestSalary = salaries.length > 0 ? Math.max(...salaries) : 0
    const lowestSalary = salaries.length > 0 ? Math.min(...salaries) : 0

    const byRegion: Record<string, number> = {}
    const byMajor: Record<string, number> = {}

    data.forEach((star) => {
      byRegion[star.employmentRegion] = (byRegion[star.employmentRegion] || 0) + 1
      byMajor[star.major] = (byMajor[star.major] || 0) + 1
    })

    return {
      totalStars: data.length,
      averageSalary,
      highestSalary,
      lowestSalary,
      byRegion,
      byMajor,
    }
  },

  /**
   * 导出就业明星数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportEmploymentStarsData: async (campus: string): Promise<Blob> => {
    const data = await employmentStarService.getEmploymentStarsData(campus)

    const csvContent = [
      '序号,学员姓名,性别,毕业年龄,最高学历,专业,学制,班级名称,入职时间,就业地区,就业单位,就业岗位,就业薪资',
      ...data.map(
        (item, index) =>
          `${item.serialNumber},${item.studentName},${item.gender},${item.graduationAge},${item.highestEducation},${item.major},${item.programLength},${item.className},${item.entryTime},${item.employmentRegion},${item.employer},${item.jobPosition},${item.employmentSalary}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
