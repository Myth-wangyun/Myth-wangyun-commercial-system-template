/**
 * 教员KPI自动计算服务
 * 从 academic schema 相关数据库表自动获取KPI指标数据
 */

import { apiService } from './api'

/**
 * 自动计算的KPI指标
 */
export interface AutoKPIMetrics {
  name: string
  assignmentSubmitRate: number | null
  assignmentPassRate: number | null
  examPassRate: number | null
  employmentCount: number | null
  employmentSalary: number | null
  attendanceRate: number | null
}

/**
 * 自动计算KPI响应
 */
export interface AutoKPIResponse {
  campus: string
  year: number
  month: number
  metrics: AutoKPIMetrics[]
}

/**
 * 自动计算教员KPI指标
 *
 * @param campus 神殿名称
 * @param year 年份
 * @param month 月份 (1-12)
 * @param teacherName 教员姓名（可选，不传则计算所有教员）
 * @returns 自动计算的KPI指标数据
 */
export async function autoCalculateTeacherKPI(
  campus: string,
  year: number,
  month: number,
  teacherName?: string
): Promise<AutoKPIResponse> {
  const params: Record<string, any> = {
    campus,
    year,
    month,
  }

  if (teacherName) {
    params.teacher_name = teacherName
  }

  const response = await apiService.get<AutoKPIResponse>(
    '/academic/teacher-kpi/auto-calculate',
    { params }
  )

  return (response?.data ?? response) as AutoKPIResponse
}

/**
 * 自动计算单个教员的KPI指标
 *
 * @param campus 神殿名称
 * @param teacherName 教员姓名
 * @param year 年份
 * @param month 月份 (1-12)
 * @returns 单个教员的KPI指标数据
 */
export async function autoCalculateSingleTeacherKPI(
  campus: string,
  teacherName: string,
  year: number,
  month: number
): Promise<AutoKPIMetrics> {
  const response = await apiService.get<AutoKPIMetrics>(
    '/academic/teacher-kpi/auto-calculate/single',
    {
      params: {
        campus,
        teacher_name: teacherName,
        year,
        month,
      },
    }
  )

  return (response?.data ?? response) as AutoKPIMetrics
}

/**
 * 批量获取多个教员的KPI指标
 *
 * @param campus 神殿名称
 * @param teacherNames 教员姓名列表
 * @param year 年份
 * @param month 月份 (1-12)
 * @returns 多个教员的KPI指标数据
 */
export async function batchAutoCalculateTeacherKPI(
  campus: string,
  teacherNames: string[],
  year: number,
  month: number
): Promise<AutoKPIMetrics[]> {
  // 批量调用单个教员的接口
  const promises = teacherNames.map((name) =>
    autoCalculateSingleTeacherKPI(campus, name, year, month)
  )

  try {
    const results = await Promise.all(promises)
    return results
  } catch (error) {
    console.error('[batchAutoCalculateTeacherKPI] 批量获取失败:', error)
    throw error
  }
}
