// [教质模块] 企业文化宣讲计划表服务
/**
 * 企业文化宣讲计划表服务
 */

import { api } from './api'

// 数据类型定义
export interface PlanRow {
  key?: string
  index: number
  time?: string
  location?: string
  method?: string
  topic?: string
  summary?: string
  audience?: string
  speaker?: string
  materials?: string
  remark?: string
}

export interface PresentationPlan {
  神殿名称: string
  年份: number
  月份: number
  行数据: Array<{
    计划ID?: number
    序号: number
    宣讲时间?: string
    宣讲地点?: string
    宣讲方式?: string
    宣讲主题?: string
    宣讲内容概述?: string
    宣讲对象?: string
    主讲人?: string
    需准备资料?: string
    备注?: string
  }>
  创建时间?: string
  更新时间?: string
}

/**
 * 获取宣讲计划
 */
export const getPresentationPlan = async (
  campus: string,
  year: number,
  month: number
): Promise<PresentationPlan> => {
  try {
    // FastAPI直接返回数据，不使用{success, data}包装
    const response = await api.get<PresentationPlan>(
      `/culture-presentation/${encodeURIComponent(campus)}/${year}/${month}`
    )
    return response.data
  } catch (error: any) {
    // 如果404或500，返回空数据
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
 * 保存宣讲计划
 */
export const savePresentationPlan = async (
  campus: string,
  year: number,
  month: number,
  rows: PlanRow[]
): Promise<PresentationPlan> => {
  // 仅提交有内容的行，避免一次性插入大量空记录
  const hasContent = (row: PlanRow) =>
    Boolean(
      row.time ||
        row.location ||
        row.method ||
        row.topic ||
        row.summary ||
        row.audience ||
        row.speaker ||
        row.materials ||
        row.remark,
    )

  const 行数据 = rows
    .filter(hasContent)
    .map((row) => ({
      序号: row.index,
      宣讲时间: row.time || undefined,
      宣讲地点: row.location || undefined,
      宣讲方式: row.method || undefined,
      宣讲主题: row.topic || undefined,
      宣讲内容概述: row.summary || undefined,
      宣讲对象: row.audience || undefined,
      主讲人: row.speaker || undefined,
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
    // 先尝试获取，如果存在且有数据则更新，否则创建
    try {
      const existingPlan = await getPresentationPlan(campus, year, month)
      // 如果存在数据（行数据不为空），则更新
      if (existingPlan.行数据 && existingPlan.行数据.length > 0) {
        const response = await api.put<PresentationPlan>(
          `/culture-presentation/${encodeURIComponent(campus)}/${year}/${month}`,
          { 行数据 }
        )
        return response.data
      } else {
        // 如果存在但数据为空，也创建（覆盖）
        const response = await api.post<PresentationPlan>(
          '/culture-presentation/',
          planData
        )
        return response.data
      }
    } catch (error: any) {
      // 如果获取失败（404等），直接创建
      if (error.response?.status === 404 || error.response?.status === 500) {
        const response = await api.post<PresentationPlan>(
          '/culture-presentation/',
          planData
        )
        return response.data
      }
      throw error
    }
  } catch (error) {
    console.error('保存宣讲计划失败:', error)
    throw error
  }
}

/**
 * 删除宣讲计划
 */
export const deletePresentationPlan = async (
  campus: string,
  year: number,
  month: number
): Promise<void> => {
  await api.delete(
    `/culture-presentation/${encodeURIComponent(campus)}/${year}/${month}`
  )
}
