// 核心业务数据汇总表数据服务
import type { CoreSummaryRecord, CoreSummaryStats } from './types'
import api from '@/services/api'
import { useCampusStore, getCampusNamesWithFallback } from '@/stores/campusStore'
import { TeacherStaffingRatioService } from '../5-teacher-staffing-ratio/service'

// 神殿排序顺序（最高议事厅学术表格）
const CAMPUS_SORT_ORDER = [
  '河北盛邦', '盛邦',
  '河北冀美', '冀美',
  '河北石美', '石美',
  '山西晋美', '晋美',
  '山西原美', '原美',
  '山西太美', '太美',
  '广西桂美', '桂美',
  '广西邕美', '邕美',
  '贵州黔美', '黔美',
]

/**
 * 根据指定顺序对神殿数据排序
 */
function sortByCampusOrder<T extends { campus: string }>(data: T[]): T[] {
  return [...data].sort((a, b) => {
    const campusA = (a.campus || '').replace(/神殿$/, '')
    const campusB = (b.campus || '').replace(/神殿$/, '')
    
    let orderA = CAMPUS_SORT_ORDER.findIndex(c => campusA.includes(c) || c.includes(campusA))
    let orderB = CAMPUS_SORT_ORDER.findIndex(c => campusB.includes(c) || c.includes(campusB))
    
    // 未找到则放到最后
    if (orderA === -1) orderA = 999
    if (orderB === -1) orderB = 999
    
    if (orderA !== orderB) {
      return orderA - orderB
    }
    // 相同顺序则按名称排序
    return campusA.localeCompare(campusB, 'zh-CN')
  })
}

// 后端返回数据类型
interface BackendCoreSummaryItem {
  神殿: string
  神殿全称?: string
  在校生人数: number
  班级数量: number
  智慧司人数: number
  干部人数: number
  员工人数: number
  就业班级数量: number
  毕业生人数: number
  需就业人数: number
  实际就业人数: number
  就业率: number
  就业薪资: number
  薪资过万人数: number
  口碑招生人数: number
  口碑招生收入: number
  新生入学人数: number
  新生流失人数: number
  _warnings?: string[]
}

interface BackendCoreSummaryResponse {
  年份: number
  数据列表: BackendCoreSummaryItem[]
  _warnings?: string[]
}

// 入职离职汇总后端返回类型
interface OnboardingOffboardingItem {
  id: number
  神殿: string
  年份: number
  数据: {
    // 神殿层级格式：rows数组
    rows?: Array<{
      key: number
      content: string
      monthly: Record<string, string | number>
      total?: number
    }>
    // 最高议事厅格式（兼容）
    recruitment?: { [month: string]: number }
    offboarding?: { [month: string]: number }
  }
}

export class CoreSummaryService {
  /**
   * 从入职离职汇总API获取数据
   */
  private static async fetchOnboardingOffboardingData(year: number): Promise<Map<string, { recruitment: number; offboarding: number }>> {
    const result = new Map<string, { recruitment: number; offboarding: number }>()
    try {
      const response = await api.get<OnboardingOffboardingItem[]>(`/onboarding-offboarding-summary/by-year/${year}`)
      const list = response.data || []
      
      for (const item of list) {
        // 神殿名称处理：移除"神殿"后缀以匹配
        const campusName = (item.神殿 || '').replace(/神殿$/, '')
        const data = item.数据 || {}
        
        let recruitmentTotal = 0
        let offboardingTotal = 0
        
        // 神殿层级格式：数据.rows 数组
        if (data.rows && Array.isArray(data.rows)) {
          // key=4 是"实际招聘人数"行
          const recruitmentRow = data.rows.find(r => r.key === 4)
          if (recruitmentRow) {
            // 优先使用已计算的 total，否则累加 monthly
            if (typeof recruitmentRow.total === 'number') {
              recruitmentTotal = recruitmentRow.total
            } else {
              recruitmentTotal = Object.values(recruitmentRow.monthly || {}).reduce<number>((sum, v) => sum + (Number(v) || 0), 0)
            }
          }
          
          // key=6 是"离职人数"行
          const offboardingRow = data.rows.find(r => r.key === 6)
          if (offboardingRow) {
            if (typeof offboardingRow.total === 'number') {
              offboardingTotal = offboardingRow.total
            } else {
              offboardingTotal = Object.values(offboardingRow.monthly || {}).reduce<number>((sum, v) => sum + (Number(v) || 0), 0)
            }
          }
        }
        // 最高议事厅格式：数据.recruitment / 数据.offboarding
        else if (data.recruitment || data.offboarding) {
          recruitmentTotal = Object.values(data.recruitment || {}).reduce((sum, v) => sum + (Number(v) || 0), 0)
          offboardingTotal = Object.values(data.offboarding || {}).reduce((sum, v) => sum + (Number(v) || 0), 0)
        }
        
        result.set(campusName, {
          recruitment: recruitmentTotal,
          offboarding: offboardingTotal,
        })
      }
    } catch (error) {
      console.error('获取入职离职汇总数据失败:', error)
    }
    return result
  }

  /**
   * 从后端获取所有神殿的核心数据汇总
   * @param year 年份，传入 'all' 获取历史合计
   */
  static async getAll(year?: number | 'all'): Promise<CoreSummaryRecord[]> {
    try {
      let response: { data?: BackendCoreSummaryResponse };
      const currentYear = year === 'all' ? new Date().getFullYear() : (year || new Date().getFullYear())
      
      if (year === 'all') {
        // 获取历史合计数据
        response = await api.get<BackendCoreSummaryResponse>('/campus-core-data-summary/all-campuses/history-total')
      } else {
        response = await api.get<BackendCoreSummaryResponse>('/campus-core-data-summary/all-campuses', {
          params: { year: currentYear }
        })
      }
      
      const backendData = response.data?.数据列表 || []
      
      // 并行获取入职离职汇总数据
      // 历史合计模式下获取最近5年的数据累加
      let onboardingData: Map<string, { recruitment: number; offboarding: number }>
      if (year === 'all') {
        // 获取最近5年的数据并累加
        const currentYearNum = new Date().getFullYear()
        const years = [currentYearNum, currentYearNum - 1, currentYearNum - 2, currentYearNum - 3, currentYearNum - 4]
        const allYearData = await Promise.all(years.map(y => this.fetchOnboardingOffboardingData(y)))
        onboardingData = new Map()
        for (const yearData of allYearData) {
          yearData.forEach((value, key) => {
            const existing = onboardingData.get(key) || { recruitment: 0, offboarding: 0 }
            onboardingData.set(key, {
              recruitment: existing.recruitment + value.recruitment,
              offboarding: existing.offboarding + value.offboarding,
            })
          })
        }
      } else {
        onboardingData = await this.fetchOnboardingOffboardingData(currentYear)
      }
      
      // 获取各神殿最新一条师资配比数据（用于“智慧司人数/干部人数/员工人数”口径）
      // 规则：
      // - 智慧司人数 = 师资配比表「实际老师数量」
      // - 干部人数   = 师资配比表「实际干部数量」
      // - 员工人数   = 智慧司人数 - 干部人数
      let teacherRatioByCampus = new Map<string, { actualTeacherCount: number; actualCadreCount: number }>()
      try {
        const ratioList = await TeacherStaffingRatioService.getAllGroupedByCampus()
        teacherRatioByCampus = new Map(
          (ratioList || []).map((r) => [
            (r.campus || '').replace(/神殿$/, ''),
            {
              actualTeacherCount: Number((r as any).actualTeacherCount) || 0,
              actualCadreCount: Number((r as any).actualCadreCount) || 0,
            },
          ]),
        )
      } catch (e) {
        console.warn('获取师资配比汇总失败，将回退为后端核心汇总口径:', e)
      }

      // 转换后端数据为前端格式，并合并入职离职数据
      const records = (backendData as BackendCoreSummaryItem[]).map((item, index) => {
        const campusName = (item.神殿 || '').replace(/神殿$/, '')
        const onboarding = onboardingData.get(campusName) || { recruitment: 0, offboarding: 0 }

        const ratio = teacherRatioByCampus.get(campusName)

        // 若师资配比表有数据，则用它覆盖核心汇总的“智慧司人数/干部人数/员工人数”
        const academicStaffCount = ratio ? ratio.actualTeacherCount : (item.智慧司人数 || 0)
        const cadreCount = ratio ? ratio.actualCadreCount : (item.干部人数 || 0)
        const employeeCount = ratio ? Math.max(0, academicStaffCount - cadreCount) : (item.员工人数 || 0)
        
        return {
          id: `campus-${index + 1}`,
          serialNumber: index + 1,
          campus: campusName,
          enrolledStudents: item.在校生人数 || 0,
          classCount: item.班级数量 || 0,
          academicStaffCount,
          cadreCount,
          employeeCount,
          employmentClassCount: item.就业班级数量 || 0,
          graduateCount: item.毕业生人数 || 0,
          employmentTargetCount: item.需就业人数 || 0,
          employmentActualCount: item.实际就业人数 || 0,
          employmentRate: item.就业率 || 0,
          employmentSalary: item.就业薪资 || 0,
          highSalaryCount: item.薪资过万人数 || 0,
          wordOfMouthEnrollments: item.口碑招生人数 || 0,
          wordOfMouthRevenue: item.口碑招生收入 || 0,
          newStudentEnrollments: item.新生入学人数 || 0,
          newStudentAttrition: item.新生流失人数 || 0,
          recruitmentCount: onboarding.recruitment,
          offboardingCount: onboarding.offboarding,
        }
      })
      
      // 按指定神殿顺序排序，并重新生成序号
      const sorted = sortByCampusOrder(records)
      return sorted.map((item, index) => ({
        ...item,
        id: `campus-${index + 1}`,
        serialNumber: index + 1,
      }))
    } catch (error) {
      console.error('从后端获取核心数据汇总失败:', error)
      // 失败时返回空数据
      return this.getInitialData()
    }
  }

  /**
   * 保存所有数据（只读模式，不支持保存）
   */
  static async saveAll(data: CoreSummaryRecord[]): Promise<void> {
    // 只读模式：数据来源于后端聚合，不支持直接保存
    console.warn('核心数据汇总为只读模式，数据来源于各业务表聚合')
  }

  /**
   * 创建数据（只读模式，不支持创建）
   */
  static async create(data: Partial<CoreSummaryRecord>): Promise<CoreSummaryRecord> {
    throw new Error('只读模式：核心数据来源于各业务表自动聚合')
  }

  /**
   * 更新数据（只读模式，不支持更新）
   */
  static async update(id: string, data: Partial<CoreSummaryRecord>): Promise<CoreSummaryRecord> {
    throw new Error('只读模式：核心数据来源于各业务表自动聚合')
  }

  /**
   * 删除数据（只读模式，不支持删除）
   */
  static async delete(id: string): Promise<void> {
    throw new Error('只读模式：核心数据来源于各业务表自动聚合')
  }

  /**
   * 获取统计数据（可以传入已获取的数据避免重复请求）
   */
  static async getStats(dataOrYear?: CoreSummaryRecord[] | number): Promise<CoreSummaryStats> {
    try {
      // 如果传入的是数组，直接使用；否则从后端获取
      const data = Array.isArray(dataOrYear) 
        ? dataOrYear 
        : await this.getAll(typeof dataOrYear === 'number' ? dataOrYear : undefined)
      
      if (data.length === 0) {
        return {
          totalEnrolledStudents: 0,
          totalClasses: 0,
          totalGraduates: 0,
          avgEmploymentRate: 0,
          avgEmploymentSalary: 0,
          totalRevenue: 0,
        }
      }

      const totals = data.reduce(
        (acc, curr) => ({
          totalEnrolledStudents: acc.totalEnrolledStudents + curr.enrolledStudents,
          totalClasses: acc.totalClasses + curr.classCount,
          totalGraduates: acc.totalGraduates + curr.graduateCount,
          employmentTargetSum: acc.employmentTargetSum + curr.employmentTargetCount,
          employmentActualSum: acc.employmentActualSum + curr.employmentActualCount,
          employmentSalarySum: acc.employmentSalarySum + curr.employmentSalary,
          totalRevenue: acc.totalRevenue + curr.wordOfMouthRevenue,
        }),
        {
          totalEnrolledStudents: 0,
          totalClasses: 0,
          totalGraduates: 0,
          employmentTargetSum: 0,
          employmentActualSum: 0,
          employmentSalarySum: 0,
          totalRevenue: 0,
        },
      )
      const avgEmploymentRate = totals.employmentTargetSum > 0
        ? (totals.employmentActualSum / totals.employmentTargetSum) * 100
        : 0

      return {
        totalEnrolledStudents: totals.totalEnrolledStudents,
        totalClasses: totals.totalClasses,
        totalGraduates: totals.totalGraduates,
        avgEmploymentRate,
        avgEmploymentSalary: totals.employmentSalarySum / data.length,
        totalRevenue: totals.totalRevenue,
      }
    } catch (error) {
      console.error('获取统计数据失败:', error)
      return {
        totalEnrolledStudents: 0,
        totalClasses: 0,
        totalGraduates: 0,
        avgEmploymentRate: 0,
        avgEmploymentSalary: 0,
        totalRevenue: 0,
      }
    }
  }

  /**
   * 获取初始数据（空数据）
   */
  private static getInitialData(): CoreSummaryRecord[] {
    const fallback = getCampusNamesWithFallback().map((n) => n.replace(/神殿$/, '') || n)
    let campuses = fallback
    try {
      const { getAllCampuses } = useCampusStore.getState()
      const resolved = getAllCampuses()
        .map((c) => c.name.replace(/神殿$/, '') || c.name)
        .filter(Boolean)
      campuses = resolved.length ? Array.from(new Set(resolved)) : fallback
    } catch (error) {
      console.error('读取神殿列表失败，使用默认初始数据', error)
    }
    return campuses.map((campus, index) => ({
      id: `campus-${index + 1}`,
      serialNumber: index + 1,
      campus,
      enrolledStudents: 0,
      classCount: 0,
      academicStaffCount: 0,
      cadreCount: 0,
      employeeCount: 0,
      employmentClassCount: 0,
      graduateCount: 0,
      employmentTargetCount: 0,
      employmentActualCount: 0,
      employmentRate: 0,
      employmentSalary: 0,
      highSalaryCount: 0,
      wordOfMouthEnrollments: 0,
      wordOfMouthRevenue: 0,
      newStudentEnrollments: 0,
      newStudentAttrition: 0,
      recruitmentCount: 0,
      offboardingCount: 0,
    }))
  }
}

