// [教质模块] 最高议事厅学术经理功能评价 API 服务
/**
 * 最高议事厅学术经理功能评价 API 服务
 * 用于经理评估页面提交数据和经理功能分析页面获取数据
 */

import { api } from './api'

// 评估数据中每个教员的分数
export interface EvaluatorScores {
  name: string // 教员姓名
  价值观: number
  业务能力: number
  团队建设: number
  管理能力: number
  合计: number
}

// 提交到后端的数据结构
export interface ManagerFunctionEvaluationData {
  神殿: string
  年份: number
  月份: string // YYYY-MM
  数据: {
    month: string // YYYY-MM
    evaluators: EvaluatorScores[]
    // 保存原始评分明细（可选）
    details?: {
      rows: Array<{
        id: string
        category: string
        item: string
        scores: Record<string, number>
      }>
    }
  }
}

// API 返回的数据结构
export interface ManagerFunctionEvaluationOut {
  id: number
  神殿: string
  年份: number
  月份: string
  数据: {
    month: string
    evaluators: EvaluatorScores[]
    details?: any
  }
}

const unwrap = async <T,>(promise: Promise<{ data: T }>): Promise<T> => {
  const res = await promise
  return res.data
}

/**
 * 获取某神殿某年的经理功能评价数据
 */
export const fetchManagerFunctionEvaluation = (campus?: string, year?: number, month?: string) =>
  unwrap(api.get<ManagerFunctionEvaluationOut[]>('/manager-function-evaluation/', { 
    params: { campus, year, month } 
  }))

/**
 * 获取所有神殿的经理功能评价数据
 * @param year 年份（可选）
 * @param month 月份 YYYY-MM 格式（可选）
 */
export const fetchAllManagerFunctionEvaluation = async (year?: number, month?: string): Promise<ManagerFunctionEvaluationOut[]> => {
  return unwrap(api.get<ManagerFunctionEvaluationOut[]>('/manager-function-evaluation/all', {
    params: { year, month }
  }))
}

/**
 * 创建或更新经理功能评价数据（同神殿+月份会覆盖）
 */
export const saveManagerFunctionEvaluation = (payload: ManagerFunctionEvaluationData) =>
  unwrap(api.post<ManagerFunctionEvaluationOut>('/manager-function-evaluation/', payload))

/**
 * 更新经理功能评价数据
 */
export const updateManagerFunctionEvaluation = (id: number, payload: { 数据: ManagerFunctionEvaluationData['数据'] }) =>
  unwrap(api.put<ManagerFunctionEvaluationOut>(`/manager-function-evaluation/${id}`, payload))

/**
 * 删除经理功能评价数据
 */
export const deleteManagerFunctionEvaluation = (id: number) =>
  unwrap(api.delete(`/manager-function-evaluation/${id}`))
