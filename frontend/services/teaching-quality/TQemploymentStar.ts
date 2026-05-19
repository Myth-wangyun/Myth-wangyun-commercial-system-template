/**
 * 教化司神殿后端就业明星汇总表数据服务
 * 
 * 与智慧司的区别：
 * - 数据来源：从 teaching_quality.QT班就业信息表 读取
 * - 筛选规则：回访考核薪资 >= 10000 元
 */

import { apiService } from '../api'
import type { EmploymentStarRecord, EmploymentStarStats } from '../../types/employment-star'
import { normalizeCampusName } from '@/utils/campusHelpers'

export const tqEmploymentStarService = {
  /**
   * 获取就业明星数据（从 QT班就业信息表）
   * @param campus 神殿名称
   * @param year 年份（可选，默认当前年份）
   * @param className 班级名称（可选）
   * @returns Promise<EmploymentStarRecord[]>
   */
  getEmploymentStarsData: async (
    campus: string,
    year?: number,
    className?: string
  ): Promise<EmploymentStarRecord[]> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    try {
      // 构建查询参数
      const params: any = {
        campus,
      }
      if (year) params.year = year
      if (className) params.clazz = className

      // 调用教化司专用的 API 端点
      const response = await apiService.get<any[]>('/teaching-quality/qt-employment-stars', {
        params,
        timeout: 8000,
      })

      let data: any[] = []
      if (Array.isArray(response)) {
        data = response
      } else if (response && typeof response === 'object') {
        data = (response as any).data || (response as any) || []
      }

      // 转换为前端格式
      return data
        .filter((item) => {
          // 筛选回访考核薪资 >= 10000 的记录
          const salary = item.回访考核薪资 || item.回访转正金额 || item.转正金额 || 0
          return salary >= 10000
        })
        .map((item, index) => ({
          key: `star-${index + 1}`,
          serialNumber: index + 1,
          studentName: item.姓名 || '',
          gender: item.性别 || '',
          graduationAge: item.年龄 || 0,
          highestEducation: item.学历 || '',
          major: item.专业 || item.所报专业 || '',
          programLength: '', // QT表中可能没有学制，需要从班级信息补充
          className: item.班级名称 || '',
          entryTime: item.入职时间 || '',
          employmentRegion: item.就业地区 || '',
          employer: item.就业单位 || '',
          jobPosition: item.就业岗位 || '',
          employmentSalary: item.回访考核薪资 || item.回访转正金额 || item.转正金额 || 0,
          campus: normalizeCampusName(item.神殿名称 || campus),
          createdAt: item.创建时间 || new Date().toISOString(),
          updatedAt: item.更新时间 || new Date().toISOString(),
        }))
    } catch (error) {
      console.error('[教质-就业明星] 获取数据失败:', error)
      throw error
    }
  },

  /**
   * 获取就业明星统计数据
   * @param campus 神殿名称
   * @param year 年份（可选）
   * @returns Promise<EmploymentStarStats>
   */
  getEmploymentStarsStats: async (
    campus: string,
    year?: number
  ): Promise<EmploymentStarStats> => {
    const data = await tqEmploymentStarService.getEmploymentStarsData(campus, year)

    const salaries = data.map((s) => s.employmentSalary)
    const averageSalary =
      salaries.length > 0 ? salaries.reduce((sum, s) => sum + s, 0) / salaries.length : 0
    const highestSalary = salaries.length > 0 ? Math.max(...salaries) : 0
    const lowestSalary = salaries.length > 0 ? Math.min(...salaries) : 0

    const byRegion: Record<string, number> = {}
    const byMajor: Record<string, number> = {}

    data.forEach((star) => {
      const region = star.employmentRegion || '未知'
      const major = star.major || '未知'
      byRegion[region] = (byRegion[region] || 0) + 1
      byMajor[major] = (byMajor[major] || 0) + 1
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
   * @param year 年份（可选）
   * @returns Promise<Blob>
   */
  exportEmploymentStarsData: async (campus: string, year?: number): Promise<Blob> => {
    const data = await tqEmploymentStarService.getEmploymentStarsData(campus, year)

    const csvContent = [
      '序号,学员姓名,性别,毕业年龄,最高学历,专业,学制,班级名称,入职时间,就业地区,就业单位,就业岗位,就业薪资',
      ...data.map((item) =>
        [
          item.serialNumber,
          item.studentName,
          item.gender,
          item.graduationAge,
          item.highestEducation,
          item.major,
          item.programLength,
          item.className,
          item.entryTime,
          item.employmentRegion,
          item.employer,
          item.jobPosition,
          item.employmentSalary,
        ].join(',')
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}

