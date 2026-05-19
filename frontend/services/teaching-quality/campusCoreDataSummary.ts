/**
 * 神殿教化司核心数据汇总表数据服务
 */

import type {
  CampusCoreDataSummaryRecord,
  CampusCoreDataSummaryRequest,
  CampusCoreDataSummarySummary,
} from '../../types/campus-core-data-summary'
import { apiService } from '../api'
import { normalizeCampusName } from '@/utils/campusHelpers'

// 从后端API响应数据转换为前端表格数据
const transformBackendDataToTableRecord = (
  backendData: Record<string, any>,
): CampusCoreDataSummaryRecord => {
  // 统一神殿名称格式：确保包含"神殿"后缀
  const campusName = normalizeCampusName(backendData.神殿 || backendData.campus)
  
  return {
    key: `${campusName}-${Date.now()}`,
    serialNumber: 1,
    campus: campusName,
    totalStudents: backendData.在校生人数 || 0,
    totalClasses: backendData.班级数量 || 0,
    totalTeachingQualityPositions: backendData.智慧司人数 || 0,
    totalCadrePositions: backendData.干部人数 || 0,
    totalEmployees: backendData.员工人数 || 0,
    totalEmploymentClasses: backendData.就业班级数量 || 0,
    // 就业总人数：后端返回字段为“就业总人数”或 totalEmployedStudents（兼容旧字段“毕业生人数”）
    totalEmployedStudents: Number(
      backendData.totalEmployedStudents ?? backendData.就业总人数 ?? backendData.毕业生人数 ?? 0,
    ),
    // 就业率：后端为 0~1 小数，前端展示百分比
    employmentRate: Number(backendData.就业率 ?? backendData.employmentRate ?? 0) * 100, // 转换为百分比
    averageEmploymentSalary: backendData.就业薪资 || 0,
    salaryOverTenThousand: backendData.薪资过万人数 || 0,
    totalEnterpriseContracts: backendData.企业签约总数 || 0,
    totalWordOfMouthRegistrations: backendData.口碑招生人数 || 0,
    totalWordOfMouthRevenue: backendData.口碑招生收入 || 0,
    totalFurtherEducationStudents: backendData.升学总人数 || 0,
    totalFurtherEducationRevenue: backendData.升学总收入 || 0,
    // 升学率（金额）：后端字段为“升学率（金额）”，有些旧接口可能仍返回“升学率”
    furtherEducationRateByAmount: Number(
      backendData['升学率（金额）'] ?? backendData.升学率 ?? backendData.furtherEducationRateByAmount ?? 0,
    ),
    totalNewStudentEnrollments: backendData.新生入学人数 || 0,
    totalNewStudentRefunds: backendData.新生流失人数 || 0,
    totalOldStudentRefunds: backendData.老生流失人数 || 0,
    refundRate: backendData.退费率 || 0,
    turnoverRate: backendData.异动率 || 0,
    totalDormitories: backendData.宿舍总个数 || 0,
    totalDormitoryResidents: backendData.宿舍总人数 || 0,
    targetSecondaryVocationalRegistrations: backendData.中专层次目标注册总人数 || 0,
    targetUniversityRegistrations: backendData.大学层次目标注册总人数 || 0,
  }
}

// 计算汇总统计数据
const calculateSummary = (data: CampusCoreDataSummaryRecord[]): CampusCoreDataSummarySummary => {
  if (data.length === 0) {
    return {
      totalStudents: 0,
      totalClasses: 0,
      totalEmployees: 0,
      averageEmploymentRate: 0,
      averageEmploymentSalary: 0,
      totalEnterpriseContracts: 0,
      totalWordOfMouthRevenue: 0,
      totalFurtherEducationRevenue: 0,
      averageRefundRate: 0,
      averageTurnoverRate: 0,
      totalDormitoryCapacity: 0,
      dormitoryOccupancyRate: 0,
      completedRecords: 0,
      totalRecords: 0,
    }
  }

  const totalStudents = data.reduce((sum, item) => sum + item.totalStudents, 0)
  const totalClasses = data.reduce((sum, item) => sum + item.totalClasses, 0)
  const totalEmployees = data.reduce((sum, item) => sum + item.totalEmployees, 0)
  const averageEmploymentRate =
    data.reduce((sum, item) => sum + item.employmentRate, 0) / data.length
  const averageEmploymentSalary =
    data.reduce((sum, item) => sum + item.averageEmploymentSalary, 0) / data.length
  const totalEnterpriseContracts = data.reduce(
    (sum, item) => sum + item.totalEnterpriseContracts,
    0,
  )
  const totalWordOfMouthRevenue = data.reduce((sum, item) => sum + item.totalWordOfMouthRevenue, 0)
  const totalFurtherEducationRevenue = data.reduce(
    (sum, item) => sum + item.totalFurtherEducationRevenue,
    0,
  )
  const averageRefundRate = data.reduce((sum, item) => sum + item.refundRate, 0) / data.length
  const averageTurnoverRate = data.reduce((sum, item) => sum + item.turnoverRate, 0) / data.length
  const totalDormitoryCapacity = data.reduce((sum, item) => sum + item.totalDormitories * 6, 0)
  const dormitoryOccupancyRate =
    totalDormitoryCapacity > 0
      ? (data.reduce((sum, item) => sum + item.totalDormitoryResidents, 0) /
          totalDormitoryCapacity) *
        100
      : 0

  const completedRecords = data.filter((item) => item.totalStudents > 0).length
  const totalRecords = data.length

  return {
    totalStudents,
    totalClasses,
    totalEmployees,
    averageEmploymentRate,
    averageEmploymentSalary,
    totalEnterpriseContracts,
    totalWordOfMouthRevenue,
    totalFurtherEducationRevenue,
    averageRefundRate,
    averageTurnoverRate,
    totalDormitoryCapacity,
    dormitoryOccupancyRate,
    completedRecords,
    totalRecords,
  }
}

export const campusCoreDataSummaryService = {
  /**
   * 获取神殿核心数据汇总数据
   * 从后端API获取数据，而不是使用模拟数据
   * @param campus 神殿名称
   * @returns Promise<CampusCoreDataSummaryRecord[]>
   */
  getCampusCoreDataSummaryData: async (campus: string): Promise<CampusCoreDataSummaryRecord[]> => {
    if (!campus) {
      throw new Error('神殿名称不能为空')
    }

    try {
      // 调用后端API获取核心数据汇总
      const campusName = campus.endsWith('神殿') ? campus : `${campus}神殿`
      const res = await apiService.get('/teaching-quality/campus-core-data-summary/', {
        params: {
          campus: campusName,
          year: new Date().getFullYear(),
        },
      })

      // 将后端响应数据转换为前端表格数据
      const tableRecord = transformBackendDataToTableRecord(res as any)
      return [tableRecord]
    } catch (error) {
      console.error('获取神殿核心数据汇总失败:', error)
      throw new Error('获取神殿核心数据汇总失败')
    }
  },

  /**
   * 获取汇总统计数据
   * @param campus 神殿名称
   * @returns Promise<CampusCoreDataSummarySummary>
   */
  getCampusCoreDataSummarySummary: async (
    campus: string,
  ): Promise<CampusCoreDataSummarySummary> => {
    const data = await campusCoreDataSummaryService.getCampusCoreDataSummaryData(campus)
    return calculateSummary(data)
  },

  /**
   * 更新神殿核心数据汇总数据
   * @param request 更新请求参数
   * @returns Promise<CampusCoreDataSummaryRecord>
   */
  updateCampusCoreDataSummaryData: async (
    request: CampusCoreDataSummaryRequest & {
      serialNumber: number
      data: Partial<CampusCoreDataSummaryRecord>
    },
  ): Promise<CampusCoreDataSummaryRecord> => {
    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    try {
      // 调用后端API更新数据
      const response = await apiService.put('/campus-core-data-summary/', request.data, {
        params: {
          campus: request.campus,
        },
      })

      return transformBackendDataToTableRecord(response.data)
    } catch (error) {
      console.error('更新神殿核心数据汇总失败:', error)
      throw new Error('更新神殿核心数据汇总失败')
    }
  },

  /**
   * 新增神殿核心数据汇总数据
   * @param request 新增请求参数
   * @returns Promise<CampusCoreDataSummaryRecord>
   */
  addCampusCoreDataSummaryData: async (
    request: CampusCoreDataSummaryRequest & { data: Partial<CampusCoreDataSummaryRecord> },
  ): Promise<CampusCoreDataSummaryRecord> => {
    if (!request.campus) {
      throw new Error('神殿名称不能为空')
    }

    try {
      // 调用后端API新增数据
      const response = await apiService.post('/campus-core-data-summary/', request.data, {
        params: {
          campus: request.campus,
        },
      })

      return transformBackendDataToTableRecord(response.data)
    } catch (error) {
      console.error('新增神殿核心数据汇总失败:', error)
      throw new Error('新增神殿核心数据汇总失败')
    }
  },

  /**
   * 导出神殿核心数据汇总数据
   * @param campus 神殿名称
   * @returns Promise<Blob>
   */
  exportCampusCoreDataSummaryData: async (campus: string): Promise<Blob> => {
    const data = await campusCoreDataSummaryService.getCampusCoreDataSummaryData(campus)

    // 生成CSV内容
    const csvContent = [
      '序号,神殿,学生总人数,班级总个数,教质总职数,干部总职数,员工总人数,就业班级总数,就业总人数,就业率,就业平均薪资,薪资过万人数,企业签约总数,口碑报名总人数,口碑总收入,升学总人数,升学总收入,升学率（金额）,新生入学总人数,新生退费总人数,老生退费总人数,退费率,异动率,宿舍总个数,宿舍总人数,中专层次目标注册总人数,大学层次目标注册总人数',
      ...data.map(
        (item) =>
          `${item.serialNumber},${item.campus},${item.totalStudents},${item.totalClasses},${item.totalTeachingQualityPositions},${item.totalCadrePositions},${item.totalEmployees},${item.totalEmploymentClasses},${item.totalEmployedStudents},${item.employmentRate},${item.averageEmploymentSalary},${item.salaryOverTenThousand},${item.totalEnterpriseContracts},${item.totalWordOfMouthRegistrations},${item.totalWordOfMouthRevenue},${item.totalFurtherEducationStudents},${item.totalFurtherEducationRevenue},${item.furtherEducationRateByAmount},${item.totalNewStudentEnrollments},${item.totalNewStudentRefunds},${item.totalOldStudentRefunds},${item.refundRate},${item.turnoverRate},${item.totalDormitories},${item.totalDormitoryResidents},${item.targetSecondaryVocationalRegistrations},${item.targetUniversityRegistrations}`,
      ),
    ].join('\n')

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  },
}
