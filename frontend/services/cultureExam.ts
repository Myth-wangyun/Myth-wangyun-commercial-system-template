// [教质模块] 企业文化考试计划表服务
/**
 * 企业文化考试计划表服务
 */

import { api } from './api'

// 数据类型定义
export interface ExamPlanRow {
  key?: string
  index: number
  scope?: string
  organizer?: string
  time?: string
  location?: string
  method?: string
  topic?: string // 考试主题
  content?: string // 考试内容概述
  audience?: string
  proctor?: string
  venue?: string // 考场布置
  materials?: string
  remark?: string
}

export interface ExamPlan {
  神殿名称: string
  年份: number
  月份: number
  行数据: Array<{
    计划ID?: number
    序号: number
    考试时间?: string
    考试地点?: string
    考试方式?: string
    考试主题?: string
    考试内容概述?: string
    考试对象?: string
    监考人?: string
    考场布置?: string
    需准备资料?: string
    备注?: string
  }>
  创建时间?: string
  更新时间?: string
}

/**
 * 获取考试计划
 */
export const getExamPlan = async (
  campus: string,
  year: number,
  month: number
): Promise<ExamPlan> => {
  try {
    const response = await api.get<ExamPlan>(
      `/culture-exam/${encodeURIComponent(campus)}/${year}/${month}`
    )
    return response.data
  } catch (error: any) {
    if (error.response?.status === 404 || error.response?.status === 500) {
      return {
        神殿名称: campus,
        年份: year,
        月份: month,
        行数据: [],
      }
    }
    throw error
  }
}

/**
 * 保存考试计划
 */
export const saveExamPlan = async (
  campus: string,
  year: number,
  month: number,
  rows: ExamPlanRow[]
): Promise<ExamPlan> => {
  const hasContent = (row: ExamPlanRow) =>
    Boolean(
      row.time ||
        row.location ||
        row.method ||
        row.topic ||
        row.content ||
        row.audience ||
        row.proctor ||
        row.venue ||
        row.materials ||
        row.remark
    )

  const 行数据 = rows
    .filter(hasContent)
    .map((row) => ({
      序号: row.index,
      考试时间: row.time || undefined,
      考试地点: row.location || undefined,
      考试方式: row.method || undefined,
      考试主题: row.topic || undefined,
      考试内容概述: row.content || undefined,
      考试对象: row.audience || undefined,
      监考人: row.proctor || undefined,
      考场布置: row.venue || undefined,
      需准备资料: row.materials || undefined,
      备注: row.remark || undefined,
    }))

  const planData = {
    神殿名称: campus,
    年份: year,
    月份: month,
    行数据,
  }

  try {
    try {
      const existingPlan = await getExamPlan(campus, year, month)
      if (existingPlan.行数据 && existingPlan.行数据.length > 0) {
        const response = await api.put<ExamPlan>(
          `/culture-exam/${encodeURIComponent(campus)}/${year}/${month}`,
          { 行数据 }
        )
        return response.data
      }
      const response = await api.post<ExamPlan>(
        '/culture-exam/',
        planData
      )
      return response.data
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 500) {
        const response = await api.post<ExamPlan>(
          '/culture-exam/',
          planData
        )
        return response.data
      }
      throw error
    }
  } catch (error) {
    console.error('保存考试计划失败:', error)
    throw error
  }
}

/**
 * 删除考试计划
 */
export const deleteExamPlan = async (
  campus: string,
  year: number,
  month: number
): Promise<void> => {
  await api.delete(
    `/culture-exam/${encodeURIComponent(campus)}/${year}/${month}`
  )
}
