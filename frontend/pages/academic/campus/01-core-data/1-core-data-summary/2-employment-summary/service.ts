// 后端学员就业汇总表数据服务
import { v4 as uuidv4 } from 'uuid'
import { storageService } from '@/pages/academic/teaching-content/shared/services/storage'
import { STORAGE_KEYS } from '@/pages/academic/teaching-content/constants'
import { CalculationService } from '@/pages/academic/teaching-content/shared/services/calculation'
import { api } from '@/services/api'
import { loadCampusData } from '@/pages/academic/teaching-content/shared/campusStorage'
import type { Campus, Major, ProgramLength } from '@/pages/academic/teaching-content/shared/types'
import type {
  IEmploymentSummary,
  IEmploymentSummaryForm,
  IEmploymentStats,
  IMajorEmploymentComparison,
  IEmploymentTrend,
} from './types'

// 后端返回的班级就业总结记录类型（英文字段）
interface BackendClassEmploymentSummary {
  id: string
  classCode: string
  campus: string
  major?: string
  programLength?: string
  instructor?: string
  classTeacher?: string
  graduationTime?: string
  archiveCount: number
  needEmploymentCount: number
  targetEmploymentCount: number
  actualEmploymentCount: number
  targetEmploymentRate: number
  actualEmploymentRate: number
  targetNeedEmploymentRate: number
  actualNeedEmploymentRate: number
  targetAverageSalary: number
  actualAverageSalary: number
  salaryOverTenThousand: number
  year: number
  month: number
  notes?: string
  createdAt?: string
  updatedAt?: string
}

// 本地存储的班级就业记录类型（与 class-summary.tsx 共享）
interface LocalEmploymentClassRecord {
  id: string
  serialNumber: number
  campus: string
  summaryId?: number
  major: string
  programLength: string
  className: string
  instructor: string
  headTeacher: string
  graduationDate: string
  targetAverageSalary: number
  actualAverageSalary: number
  archiveCount: number
  targetEmploymentCount: number
  actualEmploymentCount: number
  highSalaryCount: number
}

export class EmploymentSummaryService {
  private static readonly STORAGE_KEY = STORAGE_KEYS.EMPLOYMENT_SUMMARY

  /**
   * 从本地存储读取班级就业汇总数据（与 class-summary.tsx 共享数据源）
   */
  static async fetchFromLocalClassSummary(campusName: string): Promise<IEmploymentSummary[]> {
    try {
      const records = loadCampusData<LocalEmploymentClassRecord[]>(
        STORAGE_KEYS.CAMPUS_EMPLOYMENT_CLASS_SUMMARY,
        campusName,
        []
      )

      if (!records || records.length === 0) {
        console.log('[就业汇总] 本地存储无班级就业汇总数据')
        return []
      }

      console.log('[就业汇总] 从本地存储获取到数据:', records.length, '条')
      const now = new Date().toISOString()

      return records.map((r) => {
        const achievementRate = CalculationService.calculateAchievementRate(
          r.actualAverageSalary,
          r.targetAverageSalary,
        )
        const employmentRate = CalculationService.calculateEmploymentRate(
          r.actualEmploymentCount,
          r.targetEmploymentCount,
        )

        return {
          id: r.id || uuidv4(),
          campus: r.campus.replace('神殿', '') as Campus,
          major: (r.major || '') as unknown as Major,
          programLength: (r.programLength || '') as unknown as ProgramLength,
          className: r.className,
          instructor: r.instructor || '',
          classTeacher: r.headTeacher || '',
          graduationTime: r.graduationDate || '',
          targetAvgSalary: r.targetAverageSalary || 0,
          actualAvgSalary: r.actualAverageSalary || 0,
          achievementRate,
          archivedCount: r.archiveCount || 0,
          targetEmployment: r.targetEmploymentCount || 0,
          actualEmployment: r.actualEmploymentCount || 0,
          employmentRate,
          salaryOver10k: r.highSalaryCount || 0,
          createdAt: now,
          updatedAt: now,
        }
      })
    } catch (error) {
      console.error('[就业汇总] 从本地存储读取失败:', error)
      return []
    }
  }

  /**
   * 从后端班级就业总结API获取数据并转换为前端格式
   */
  static async fetchFromBackend(campusName: string): Promise<IEmploymentSummary[]> {
    try {
      // 标准化神殿名称
      const normalizedCampus = campusName.replace(/神殿$/, '').trim()
      
      // 直接调用后端 API，使用中文参数名
      const response = await api.get<BackendClassEmploymentSummary[]>('/class-employment-summary/', {
        params: { 神殿: normalizedCampus },
        headers: { 'X-Campus': btoa(encodeURIComponent(normalizedCampus)) }
      })
      
      let summaries: BackendClassEmploymentSummary[] = []
      if (Array.isArray(response.data)) {
        summaries = response.data
      } else if (Array.isArray(response)) {
        summaries = response as unknown as BackendClassEmploymentSummary[]
      }
      
      // 二次过滤确保只返回当前神殿数据
      summaries = summaries.filter(s => {
        const sCampus = (s.campus || '').replace(/神殿$/, '').trim()
        return sCampus === normalizedCampus
      })
      
      if (!summaries || summaries.length === 0) {
        console.log('[就业汇总] 后端无数据，返回空数组')
        return []
      }

      console.log('[就业汇总] 从后端获取到数据:', summaries.length, '条')
      const now = new Date().toISOString()
      const results: IEmploymentSummary[] = []

      for (const s of summaries) {
        // 优先使用后端返回的毕业时间，否则用年月构造
        const graduationTime = s.graduationTime || `${s.year}-${String(s.month).padStart(2, '0')}-01`

        const archivedCount = s.archiveCount ?? 0
        const actualEmployment = s.actualEmploymentCount ?? 0
        const targetEmployment = s.targetEmploymentCount ?? 0
        const targetAvgSalary = s.targetAverageSalary ?? 0
        const actualAvgSalary = s.actualAverageSalary ?? 0
        const salaryOver10k = s.salaryOverTenThousand ?? 0

        const achievementRate = CalculationService.calculateAchievementRate(
          actualAvgSalary,
          targetAvgSalary,
        )
        const employmentRate = CalculationService.calculateEmploymentRate(
          actualEmployment,
          targetEmployment,
        )

        results.push({
          id: s.id || uuidv4(),
          campus: campusName.replace('神殿', '') as Campus,
          major: (s.major || '') as unknown as Major,
          programLength: (s.programLength || '') as unknown as ProgramLength,
          className: s.classCode,
          instructor: s.instructor || '',
          classTeacher: s.classTeacher || '',
          graduationTime,
          targetAvgSalary,
          actualAvgSalary,
          achievementRate,
          archivedCount,
          targetEmployment,
          actualEmployment,
          employmentRate,
          salaryOver10k,
          createdAt: s.createdAt || now,
          updatedAt: s.updatedAt || now,
        })
      }

      return results
    } catch (error) {
      console.error('从后端获取就业数据失败:', error)
      return []
    }
  }

  /**
   * 获取可用年份列表
   * @param campusName 神殿名称（可选）
   */
  static async getAvailableYears(campusName?: string): Promise<number[]> {
    try {
      const normalizedCampus = campusName?.replace(/神殿$/, '').trim()
      const params: Record<string, string> = {}
      if (normalizedCampus) {
        params['神殿'] = normalizedCampus
      }
      const response = await api.get<{ 年份列表: number[] }>('/class-employment-summary/available-years', { params })
      const years = response.data?.年份列表 || (response as unknown as { 年份列表: number[] })?.年份列表 || []
      
      // 确保当前年份在列表中
      const currentYear = new Date().getFullYear()
      if (!years.includes(currentYear)) {
        years.unshift(currentYear)
      }
      return years.sort((a, b) => b - a)
    } catch (error) {
      console.error('获取可用年份列表失败:', error)
      const currentYear = new Date().getFullYear()
      return [currentYear, currentYear - 1, currentYear - 2]
    }
  }

  /**
   * 获取历史汇总数据（所有年份合计）
   * @param campusName 神殿名称
   */
  static async getHistoricalSummary(campusName?: string): Promise<IEmploymentStats> {
    try {
      const normalizedCampus = campusName?.replace(/神殿$/, '').trim()
      const params: Record<string, string> = {}
      if (normalizedCampus) {
        params['神殿'] = normalizedCampus
      }
      const response = await api.get<{
        totalClasses: number
        totalArchiveCount: number
        totalTargetEmployment: number
        totalActualEmployment: number
        avgTargetSalary: number
        avgActualSalary: number
        avgEmploymentRate: number
        avgAchievementRate: number
        totalSalaryOver10k: number
      }>('/class-employment-summary/historical', { params })
      
      const data = response.data || (response as unknown as typeof response.data)
      
      return {
        totalClasses: data?.totalClasses || 0,
        totalGraduates: data?.totalArchiveCount || 0,
        totalEmployed: data?.totalActualEmployment || 0,
        avgEmploymentRate: data?.avgEmploymentRate || 0,
        avgTargetSalary: data?.avgTargetSalary || 0,
        avgActualSalary: data?.avgActualSalary || 0,
        totalSalaryOver10k: data?.totalSalaryOver10k || 0,
        avgAchievementRate: data?.avgAchievementRate || 0,
      }
    } catch (error) {
      console.error('获取历史汇总数据失败:', error)
      return {
        totalClasses: 0,
        totalGraduates: 0,
        totalEmployed: 0,
        avgEmploymentRate: 0,
        avgTargetSalary: 0,
        avgActualSalary: 0,
        totalSalaryOver10k: 0,
        avgAchievementRate: 0,
      }
    }
  }

  /**
   * 获取所有就业数据
   * 优先级：1. 本地班级就业汇总存储 → 2. 后端API → 3. 本服务专用localStorage
   */
  static async getAll(campusName?: string, year?: number): Promise<IEmploymentSummary[]> {
    try {
      if (campusName) {
        const fullCampusName = campusName.endsWith('神殿') ? campusName : `${campusName}神殿`
        
        // 直接从后端API获取教质数据
        console.log('[就业汇总] 从后端API获取教质数据')
        let backendData = await this.fetchFromBackend(fullCampusName)
        
        // 按年份筛选
        if (year && backendData.length > 0) {
          backendData = backendData.filter(item => {
            const itemYear = item.graduationTime ? parseInt(item.graduationTime.split('-')[0]) : 0
            return itemYear === year
          })
        }
        
        return backendData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }
      
      return []
    } catch (error) {
      console.error('获取就业数据失败:', error)
      return []
    }
  }

  /**
   * 根据ID获取就业数据
   */
  static async getById(id: string): Promise<IEmploymentSummary | null> {
    try {
      return await storageService.get<IEmploymentSummary>(this.STORAGE_KEY, id)
    } catch (error) {
      console.error('获取就业数据失败:', error)
      return null
    }
  }

  /**
   * 将前端数据转换为后端格式
   */
  private static toBackendFormat(data: IEmploymentSummaryForm & { id?: string }): BackendClassEmploymentSummary {
    // 从毕业时间解析年月
    const [year, month] = data.graduationTime.split('-').map(Number)
    
    return {
      id: data.id || uuidv4(),
      classCode: data.className,
      campus: data.campus,
      archiveCount: data.archivedCount,
      needEmploymentCount: data.archivedCount, // 默认等于档案人数
      targetEmploymentCount: data.targetEmployment,
      actualEmploymentCount: data.actualEmployment,
      targetEmploymentRate: data.targetEmployment / data.archivedCount * 100 || 0,
      actualEmploymentRate: data.actualEmployment / data.archivedCount * 100 || 0,
      targetNeedEmploymentRate: 0,
      actualNeedEmploymentRate: 0,
      targetAverageSalary: data.targetAvgSalary,
      actualAverageSalary: data.actualAvgSalary,
      salaryOverTenThousand: data.salaryOver10k,
      year: year || new Date().getFullYear(),
      month: month || new Date().getMonth() + 1,
    }
  }

  /**
   * 创建就业数据（保存到后端和本地）
   */
  static async create(data: IEmploymentSummaryForm): Promise<IEmploymentSummary> {
    try {
      const now = new Date().toISOString()
      const id = uuidv4()

      // 自动计算达标率和就业率
      const achievementRate = CalculationService.calculateAchievementRate(
        data.actualAvgSalary,
        data.targetAvgSalary,
      )
      const employmentRate = CalculationService.calculateEmploymentRate(
        data.actualEmployment,
        data.targetEmployment,
      )

      const newData: IEmploymentSummary = {
        id,
        ...data,
        achievementRate,
        employmentRate,
        createdAt: now,
        updatedAt: now,
      }

      // 保存到后端
      try {
        const backendData = this.toBackendFormat({ ...data, id })
        await api.put('/class-employment-summary/', backendData)
        console.log('[就业汇总] 数据已保存到后端')
      } catch (backendError) {
        console.error('[就业汇总] 保存到后端失败:', backendError)
        // 后端保存失败时仍然保存到本地
      }

      // 同时保存到本地作为备份
      await storageService.save(this.STORAGE_KEY, newData)
      return newData
    } catch (error) {
      console.error('创建就业数据失败:', error)
      throw new Error('创建就业数据失败')
    }
  }

  /**
   * 更新就业数据（保存到后端和本地）
   */
  static async update(
    id: string,
    data: Partial<IEmploymentSummaryForm>,
  ): Promise<IEmploymentSummary> {
    try {
      if (
        !data.campus ||
        !data.major ||
        !data.programLength ||
        !data.className ||
        !data.instructor ||
        !data.classTeacher ||
        !data.graduationTime
      ) {
        throw new Error('缺少必要的后端更新字段')
      }

      // 重新计算达标率和就业率
      const achievementRate = CalculationService.calculateAchievementRate(
        data.actualAvgSalary ?? 0,
        data.targetAvgSalary ?? 0,
      )
      const employmentRate = CalculationService.calculateEmploymentRate(
        data.actualEmployment ?? 0,
        data.targetEmployment ?? 0,
      )

      const updatedData: IEmploymentSummary = {
        id,
        campus: data.campus,
        major: data.major,
        programLength: data.programLength,
        className: data.className,
        instructor: data.instructor,
        classTeacher: data.classTeacher,
        graduationTime: data.graduationTime,
        targetAvgSalary: data.targetAvgSalary ?? 0,
        actualAvgSalary: data.actualAvgSalary ?? 0,
        archivedCount: data.archivedCount ?? 0,
        targetEmployment: data.targetEmployment ?? 0,
        actualEmployment: data.actualEmployment ?? 0,
        salaryOver10k: data.salaryOver10k ?? 0,
        achievementRate,
        employmentRate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const backendData = this.toBackendFormat({
        id,
        campus: updatedData.campus,
        major: updatedData.major,
        programLength: updatedData.programLength,
        className: updatedData.className,
        instructor: updatedData.instructor,
        classTeacher: updatedData.classTeacher,
        graduationTime: updatedData.graduationTime,
        targetAvgSalary: updatedData.targetAvgSalary,
        actualAvgSalary: updatedData.actualAvgSalary,
        archivedCount: updatedData.archivedCount,
        targetEmployment: updatedData.targetEmployment,
        actualEmployment: updatedData.actualEmployment,
        salaryOver10k: updatedData.salaryOver10k,
      })
      await api.put('/class-employment-summary/', backendData)
      return updatedData
    } catch (error) {
      console.error('更新就业数据失败:', error)
      throw new Error('更新就业数据失败')
    }
  }

  /**
   * 删除就业数据
   */
  static async delete(id: string): Promise<void> {
    try {
      await storageService.delete(this.STORAGE_KEY, id)
    } catch (error) {
      console.error('删除就业数据失败:', error)
      throw new Error('删除就业数据失败')
    }
  }

  /**
   * 批量删除就业数据
   */
  static async batchDelete(ids: string[]): Promise<void> {
    try {
      await Promise.all(ids.map((id) => this.delete(id)))
    } catch (error) {
      console.error('批量删除就业数据失败:', error)
      throw new Error('批量删除就业数据失败')
    }
  }

  /**
   * 根据神殿筛选数据
   */
  static async getByCampus(campus: string): Promise<IEmploymentSummary[]> {
    try {
      const allData = await this.getAll()
      return allData.filter((item) => item.campus === campus)
    } catch (error) {
      console.error('根据神殿筛选数据失败:', error)
      return []
    }
  }

  /**
   * 根据专业筛选数据
   */
  static async getByMajor(major: string): Promise<IEmploymentSummary[]> {
    try {
      const allData = await this.getAll()
      return allData.filter((item) => item.major === major)
    } catch (error) {
      console.error('根据专业筛选数据失败:', error)
      return []
    }
  }

  /**
   * 根据毕业时间范围筛选数据
   */
  static async getByGraduationTimeRange(
    startDate: string,
    endDate: string,
  ): Promise<IEmploymentSummary[]> {
    try {
      const allData = await this.getAll()
      return allData.filter((item) => {
        const graduationTime = new Date(item.graduationTime)
        const start = new Date(startDate)
        const end = new Date(endDate)
        return graduationTime >= start && graduationTime <= end
      })
    } catch (error) {
      console.error('根据毕业时间范围筛选数据失败:', error)
      return []
    }
  }

  /**
   * 获取统计数据
   */
  static async getStats(): Promise<IEmploymentStats> {
    try {
      const data = await this.getAll()

      if (data.length === 0) {
        return {
          totalClasses: 0,
          totalGraduates: 0,
          totalEmployed: 0,
          avgEmploymentRate: 0,
          avgTargetSalary: 0,
          avgActualSalary: 0,
          totalSalaryOver10k: 0,
          avgAchievementRate: 0,
        }
      }

      const totalClasses = data.length
      const totalGraduates = CalculationService.calculateSum(data.map((item) => item.archivedCount))
      const totalEmployed = CalculationService.calculateSum(
        data.map((item) => item.actualEmployment),
      )
      const avgEmploymentRate = CalculationService.calculateAverage(
        data.map((item) => item.employmentRate),
      )
      const avgTargetSalary = CalculationService.calculateAverage(
        data.map((item) => item.targetAvgSalary),
      )
      const avgActualSalary = CalculationService.calculateAverage(
        data.map((item) => item.actualAvgSalary),
      )
      const totalSalaryOver10k = CalculationService.calculateSum(
        data.map((item) => item.salaryOver10k),
      )
      const avgAchievementRate = CalculationService.calculateAverage(
        data.map((item) => item.achievementRate),
      )

      return {
        totalClasses,
        totalGraduates,
        totalEmployed,
        avgEmploymentRate,
        avgTargetSalary,
        avgActualSalary,
        totalSalaryOver10k,
        avgAchievementRate,
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
      throw new Error('获取统计数据失败')
    }
  }

  /**
   * 获取专业就业对比数据
   */
  static async getMajorComparison(): Promise<IMajorEmploymentComparison[]> {
    try {
      const data = await this.getAll()
      const majorGroups = data.reduce(
        (acc, item) => {
          if (!acc[item.major]) {
            acc[item.major] = []
          }
          acc[item.major].push(item)
          return acc
        },
        {} as Record<string, IEmploymentSummary[]>,
      )

      return Object.entries(majorGroups).map(([major, items]) => {
        const totalClasses = items.length
        const avgEmploymentRate = CalculationService.calculateAverage(
          items.map((item) => item.employmentRate),
        )
        const avgActualSalary = CalculationService.calculateAverage(
          items.map((item) => item.actualAvgSalary),
        )
        const totalSalaryOver10k = CalculationService.calculateSum(
          items.map((item) => item.salaryOver10k),
        )

        return {
          major: major as unknown as Major,
          totalClasses,
          avgEmploymentRate,
          avgActualSalary,
          totalSalaryOver10k,
        }
      })
    } catch (error) {
      console.error('获取专业对比数据失败:', error)
      return []
    }
  }

  /**
   * 获取就业趋势数据
   */
  static async getTrendData(): Promise<IEmploymentTrend[]> {
    try {
      const data = await this.getAll()

      // 按毕业时间分组
      const timeGroups = data.reduce(
        (acc, item) => {
          const month = item.graduationTime.substring(0, 7) // YYYY-MM
          if (!acc[month]) {
            acc[month] = []
          }
          acc[month].push(item)
          return acc
        },
        {} as Record<string, IEmploymentSummary[]>,
      )

      return Object.entries(timeGroups)
        .map(([month, items]) => {
          const graduates = CalculationService.calculateSum(items.map((item) => item.archivedCount))
          const employed = CalculationService.calculateSum(
            items.map((item) => item.actualEmployment),
          )
          const targetEmployment = CalculationService.calculateSum(
            items.map((item) => item.targetEmployment),
          )
          const employmentRate = CalculationService.calculateEmploymentRate(employed, targetEmployment)
          const avgSalary = CalculationService.calculateAverage(
            items.map((item) => item.actualAvgSalary),
          )

          return {
            month,
            graduates,
            employed,
            employmentRate,
            avgSalary,
          }
        })
        .sort((a, b) => a.month.localeCompare(b.month))
    } catch (error) {
      console.error('获取趋势数据失败:', error)
      return []
    }
  }

  /**
   * 导出数据
   */
  static async exportData(): Promise<IEmploymentSummary[]> {
    return await this.getAll()
  }

  /**
   * 导入数据
   */
  static async importData(data: IEmploymentSummary[]): Promise<void> {
    try {
      const now = new Date().toISOString()
      const importedData = data.map((item) => {
        // 重新计算达标率和就业率
        const achievementRate = CalculationService.calculateAchievementRate(
          item.actualAvgSalary,
          item.targetAvgSalary,
        )
        const employmentRate = CalculationService.calculateEmploymentRate(
          item.actualEmployment,
          item.targetEmployment,
        )

        return {
          ...item,
          id: item.id || uuidv4(),
          achievementRate,
          employmentRate,
          createdAt: item.createdAt || now,
          updatedAt: now,
        }
      })

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

  /**
   * 根据“班级就业总结表”自动生成某个神殿的后端学员就业汇总数据
   *
   * 只自动填充可以从后端计算出来的字段：
   * - 班级名称、毕业时间（由 年份+月份 组合）
   * - 目标/实际平均就业薪资
   * - 档案人数、目标/实际就业人数、就业率
   * - 薪资过万人数
   *
   * 专业、学制、授课教员、班主任等保留为空，由用户在页面中补充。
   */
  static async autoGenerateFromClassSummary(campusShort: string): Promise<IEmploymentSummary[]> {
    const campusName = campusShort.endsWith('神殿') ? campusShort : `${campusShort}神殿`

    // 直接从后端API获取数据（后端已从教化司数据源读取）
    console.log('[就业汇总] 从后端API获取教质数据')
    const generated = await this.fetchFromBackend(campusName)

    if (!generated || generated.length === 0) {
      console.log('[就业汇总] 后端无数据')
      return []
    }

    console.log('[就业汇总] 从后端获取到', generated.length, '条数据')

    // 更新本地存储缓存
    const existing = await storageService.getAll<IEmploymentSummary>(this.STORAGE_KEY)
    const remaining = existing.filter((item) => item.campus !== campusShort)
    const combined = [...remaining, ...generated]

    await storageService.clear(this.STORAGE_KEY)
    await storageService.saveAll(this.STORAGE_KEY, combined)

    return generated
  }
}
