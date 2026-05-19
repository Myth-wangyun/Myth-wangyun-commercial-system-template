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

    // 优先从“自动生成”获取（直接读取 QT班就业信息表，速度更快、避免已保存接口超时）
    try {
      const auto = await apiService.get<EmploymentStarRecord[]>('/employment-stars/auto-generate', {
        params: { 神殿: campus },
        timeout: 8000,
      })
      if (Array.isArray(auto)) {
        data = auto as any
      } else if (auto && typeof auto === 'object') {
        data = (auto as any).data || (auto as any)
      }
    } catch (_) {
      // 忽略自动生成失败，继续读取已保存
    }

    // 若自动生成没有数据，再读取“已保存”的汇总表
    if (!data || data.length === 0) {
      try {
        const saved = await apiService.get<EmploymentStarRecord[]>('/employment-stars', {
          params: { 神殿: campus },
          timeout: 8000,
        })
        if (Array.isArray(saved)) {
          data = saved as any
        } else if (saved && typeof saved === 'object') {
          data = (saved as any).data || (saved as any)
        }
      } catch (_) {
        // 两个来源都失败，返回空
        data = []
      }
    }

    return (data || []).map((item, index) => ({
      ...item,
      key: item.key || `star-${index + 1}`,
      serialNumber: item.serialNumber ?? index + 1,
      createdAt: (item as any).createdAt || new Date().toISOString(),
      updatedAt: (item as any).updatedAt || new Date().toISOString(),
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
