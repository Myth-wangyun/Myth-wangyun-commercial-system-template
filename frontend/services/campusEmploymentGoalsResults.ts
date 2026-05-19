/**
 * 神殿后端学员就业目标与结果汇总表数据服务
 * 从后端 /teaching-quality/qt-class-employment-summary API 获取数据
 */

import { apiService } from './api'
import type {
  CampusEmploymentGoalsResultsRecord,
  CampusEmploymentGoalsResultsRequest,
  CampusEmploymentGoalsResultsSummary,
} from '../types/campus-employment-goals-results'

// 后端返回的班级就业总结数据格式
interface BackendClassSummaryResponse {
  总结ID?: number;
  神殿名称: string;
  班级名称: string;
  年份: number;
  专业?: string;
  学制?: string;
  教员?: string;
  班主任?: string;
  结案人数: number;
  需就业人数: number;
  实际就业人数: number;
  目标平均薪资: number;
  实际平均薪资: number;
  就业达标率?: number;
  实际就业率?: number;
  薪资过万人数?: number;
  创建时间?: string;
  更新时间?: string;
}

const normalizeCampusName = (value: string) => value.replace(/神殿$/, '').trim()

/**
 * 将后端班级就业总结数据转换为前端就业目标与结果格式
 */
const transformBackendToFrontend = (
  backendRecords: BackendClassSummaryResponse[],
  campus: string,
): CampusEmploymentGoalsResultsRecord[] => {
  return backendRecords.map((record, index) => {
    const 档案人数 = record.结案人数 || 0
    const 实际就业人数 = record.实际就业人数 || 0
    const 实际平均薪资 = record.实际平均薪资 || 0
    const 目标平均薪资 = record.目标平均薪资 || 0
    
    // 计算达标率（实际平均薪资 / 目标平均薪资）
    const attainmentRate = 目标平均薪资 > 0 ? (实际平均薪资 / 目标平均薪资) * 100 : 0
    
    // 计算就业率（实际就业人数 / 档案人数）
    const employmentRate = 档案人数 > 0 ? (实际就业人数 / 档案人数) * 100 : 0

    return {
      key: record.总结ID ? String(record.总结ID) : `${campus}-${record.班级名称}-${index}`,
      serialNumber: index + 1,
      campus: index === 0 ? campus : '', // 只有第一条记录显示神殿名称
      majorDirection: record.专业 || '',
      duration: record.学制 || '',
      className: record.班级名称,
      instructor: record.教员 || '',
      headTeacher: record.班主任 || '',
      graduationDate: record.年份 ? `${record.年份}年` : '',
      salaryAttainment: {
        targetAverageSalary: 目标平均薪资,
        actualAverageSalary: 实际平均薪资,
        attainmentRate: Math.round(attainmentRate * 100) / 100,
      },
      employmentRate: {
        fileCount: 档案人数,
        targetEmploymentCount: record.需就业人数 || 0,
        actualEmploymentCount: 实际就业人数,
        employmentRate: Math.round(employmentRate * 100) / 100,
      },
      salaryOverTenThousand: record.薪资过万人数 || 0,
    }
  })
}

// 计算汇总统计数据
const calculateSummary = (
  data: CampusEmploymentGoalsResultsRecord[],
): CampusEmploymentGoalsResultsSummary => {
  if (data.length === 0) {
    return {
      totalClasses: 0,
      totalStudents: 0,
      averageTargetSalary: 0,
      averageActualSalary: 0,
      averageAttainmentRate: 0,
      totalTargetEmployment: 0,
      totalActualEmployment: 0,
      averageEmploymentRate: 0,
      totalSalaryOverTenThousand: 0,
      completedRecords: 0,
      totalRecords: 0,
    }
  }

  const totalClasses = data.filter((item) => item.className).length
  const totalStudents = data.reduce((sum, item) => sum + item.employmentRate.fileCount, 0)
  const averageTargetSalary =
    data.reduce((sum, item) => sum + item.salaryAttainment.targetAverageSalary, 0) / data.length
  const averageActualSalary =
    data.reduce((sum, item) => sum + item.salaryAttainment.actualAverageSalary, 0) / data.length
  const averageAttainmentRate =
    data.reduce((sum, item) => sum + item.salaryAttainment.attainmentRate, 0) / data.length
  const totalTargetEmployment = data.reduce(
    (sum, item) => sum + item.employmentRate.targetEmploymentCount,
    0,
  )
  const totalActualEmployment = data.reduce(
    (sum, item) => sum + item.employmentRate.actualEmploymentCount,
    0,
  )
  const averageEmploymentRate =
    data.reduce((sum, item) => sum + item.employmentRate.employmentRate, 0) / data.length
  const totalSalaryOverTenThousand = data.reduce((sum, item) => sum + item.salaryOverTenThousand, 0)

  const completedRecords = data.filter((item) => item.className && item.majorDirection).length
  const totalRecords = data.length

  return {
    totalClasses,
    totalStudents,
    averageTargetSalary,
    averageActualSalary,
    averageAttainmentRate,
    totalTargetEmployment,
    totalActualEmployment,
    averageEmploymentRate,
    totalSalaryOverTenThousand,
    completedRecords,
    totalRecords,
  }
}

export const campusEmploymentGoalsResultsService = {
  /**
   * 获取神殿就业目标与结果汇总数据
   * 从后端 /teaching-quality/qt-class-employment-summary/list API 获取数据
   * @param campus 神殿名称
   * @param year 年份（可选）
   * @returns Promise<CampusEmploymentGoalsResultsRecord[]>
   */
  getCampusEmploymentGoalsResultsData: async (
    campus: string,
    year?: number | null,
  ): Promise<CampusEmploymentGoalsResultsRecord[]> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    const normalizedCampus = normalizeCampusName(campus)

    try {
      // 构建查询参数
      const params: any = { campus: normalizedCampus }
      if (year !== null && year !== undefined) {
        params.year = year
      }

      // 从教学质量模块的API获取数据
      const response = await apiService.get<BackendClassSummaryResponse[]>(
        '/teaching-quality/qt-class-employment-summary/list',
        { params },
      )

      let backendData: BackendClassSummaryResponse[] = []
      if (Array.isArray(response)) {
        backendData = response
      } else if (response && typeof response === 'object' && Array.isArray((response as any).data)) {
        backendData = (response as any).data
      }

      // 过滤当前神殿的数据
      const filteredData = backendData.filter(
        (item) => normalizeCampusName(item.神殿名称) === normalizedCampus,
      )

      console.log(
        `[就业目标与结果] 从后端获取到 ${backendData.length} 条班级就业总结数据，过滤后保留 ${filteredData.length} 条`,
      )

      if (filteredData.length === 0) {
        console.log(`[就业目标与结果] ${campus} 神殿暂无班级就业总结数据`)
        return []
      }

      // 转换为前端格式
      const frontendData = transformBackendToFrontend(filteredData, normalizedCampus)
      console.log(`[就业目标与结果] 转换后数据:`, frontendData)

      return frontendData
    } catch (error: any) {
      // 404 表示没有数据，返回空数组
      if (error?.response?.status === 404) {
        console.log(`[就业目标与结果] ${campus} 神殿暂无数据`)
        return []
      }
      console.error('[就业目标与结果] 获取数据失败:', error)
      throw error
    }
  },

  /**
   * 获取汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusEmploymentGoalsResultsSummary>
   */
  getCampusEmploymentGoalsResultsSummary: async (
    campus: string,
  ): Promise<CampusEmploymentGoalsResultsSummary> => {
    const data = await campusEmploymentGoalsResultsService.getCampusEmploymentGoalsResultsData(campus)
    return calculateSummary(data)
  },

  /**
   * 获取可用年份列表
   * @param campus 神殿名称
   * @returns Promise<number[]> 年份数组（降序排列）
   */
  getAvailableYears: async (campus: string): Promise<number[]> => {
    if (!campus) {
      return []
    }

    try {
      const response = await apiService.get<number[]>(
        '/teaching-quality/qt-class-employment-summary/years',
        { params: { campus } },
      )

      let years: number[] = []
      if (Array.isArray(response)) {
        years = response
      } else if (response && typeof response === 'object' && Array.isArray((response as any).data)) {
        years = (response as any).data
      }

      // 确保年份按降序排列（最新年份在前）
      return years.sort((a, b) => b - a)
    } catch (error) {
      console.error('获取可用年份失败:', error)
      return []
    }
  },

  /**
   * 更新神殿就业目标与结果汇总数据
   * @param request 更新请求参数
   * @returns Promise<CampusEmploymentGoalsResultsRecord>
   */
  updateCampusEmploymentGoalsResultsData: async (
    request: CampusEmploymentGoalsResultsRequest & {
      serialNumber: number
      data: Partial<CampusEmploymentGoalsResultsRecord>
    },
  ): Promise<CampusEmploymentGoalsResultsRecord> => {
    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    // TODO: 调用后端API更新数据
    // 目前返回更新后的数据
    const currentData = (
      await campusEmploymentGoalsResultsService.getCampusEmploymentGoalsResultsData(request.campus)
    ).find((item) => item.serialNumber === request.serialNumber)

    if (!currentData) {
      throw new Error('未找到指定序号的数据')
    }

    const updatedData = {
      ...currentData,
      ...request.data,
    }

    return updatedData
  },

  /**
   * 新增神殿就业目标与结果汇总数据
   * @param request 新增请求参数
   * @returns Promise<CampusEmploymentGoalsResultsRecord>
   */
  addCampusEmploymentGoalsResultsData: async (
    request: CampusEmploymentGoalsResultsRequest & {
      data: Partial<CampusEmploymentGoalsResultsRecord>
    },
  ): Promise<CampusEmploymentGoalsResultsRecord> => {
    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    const newRecord: CampusEmploymentGoalsResultsRecord = {
      key: `${request.campus}-${Date.now()}`,
      serialNumber: Date.now(),
      campus: request.campus,
      majorDirection: '',
      duration: '',
      className: '',
      instructor: '',
      headTeacher: '',
      graduationDate: '',
      salaryAttainment: {
        targetAverageSalary: 0,
        actualAverageSalary: 0,
        attainmentRate: 0,
      },
      employmentRate: {
        fileCount: 0,
        targetEmploymentCount: 0,
        actualEmploymentCount: 0,
        employmentRate: 0,
      },
      salaryOverTenThousand: 0,
      ...request.data,
    }

    return newRecord
  },

  /**
   * 导出神殿就业目标与结果汇总数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusEmploymentGoalsResultsData: async (campus: string): Promise<Blob> => {
    const data = await campusEmploymentGoalsResultsService.getCampusEmploymentGoalsResultsData(campus)

    // 生成CSV内容
    const csvContent = [
      '序号,神殿,专业方向,学制,班级名称,授课教员,负责班主任,毕业时间,目标平均就业薪资,实际平均就业薪资,达标率,档案人数,目标就业人数,实际就业人数,就业率,薪资过万人数',
      ...data.map(
        (item) =>
          `${item.serialNumber},${item.campus},${item.majorDirection},${item.duration},${item.className},${item.instructor},${item.headTeacher},${item.graduationDate},${item.salaryAttainment.targetAverageSalary},${item.salaryAttainment.actualAverageSalary},${item.salaryAttainment.attainmentRate},${item.employmentRate.fileCount},${item.employmentRate.targetEmploymentCount},${item.employmentRate.actualEmploymentCount},${item.employmentRate.employmentRate},${item.salaryOverTenThousand}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}