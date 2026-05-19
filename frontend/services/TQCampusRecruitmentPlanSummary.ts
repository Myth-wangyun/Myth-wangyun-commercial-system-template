/**
 * 教学质量模块 - 神殿教化司招聘计划与总结汇总表 API 服务
 * 
 * 提供与后端 API 的交互接口
 */

import { api } from '@/services/api'

/**
 * 招聘计划数据接口
 */
export interface RecruitmentPlanData {
  id?: number
  神殿: string
  部门?: string
  岗位名称: string
  岗位类别?: string
  计划招聘人数?: number
  计划招聘时间?: string | Date
  实际招聘岗位名称?: string
  实际招聘人数?: number
  实际招聘时间?: string | Date
  招聘渠道?: string
  应聘人数?: number
  面试人数?: number
  录用人数?: number
  录用率?: number
  招聘成本?: number
  人均成本?: number
  入职后三个月留任率?: number
  半年留任率?: number
  一年留任率?: number
  招聘满意度评分?: number
  招聘满意度评价?: string
  
  // 新增字段：入/离职信息
  入职者姓名?: string
  离职人数?: number
  离职者姓名?: string

  招聘总结?: string
  存在的问题?: string
  改进措施?: string
  招聘负责人?: string
  审核人?: string
  备注?: string
  创建时间?: string
  更新时间?: string
}

/**
 * 招聘统计数据接口
 */
export interface RecruitmentStatistics {
  总招聘数: number
  计划招聘总人数: number
  实际招聘总人数: number
  总应聘人数: number
  总面试人数: number
  总录用人数: number
  平均录用率: number
  总招聘成本: number
  平均人均成本: number
  平均满意度评分: number
}

/**
 * API 响应接口
 */
export interface ApiResponse<T = any> {
  success?: boolean
  message?: string
  data?: T
  code?: number
}

const API_BASE = '/teaching-quality'
const ENDPOINT = `${API_BASE}/campus-recruitment-plan`

/**
 * 获取招聘计划列表
 * 
 * @param params 查询参数
 * @returns 招聘计划列表
 */
export async function fetchRecruitmentList(params?: {
  campus?: string
  start_date?: string
  end_date?: string
}): Promise<RecruitmentPlanData[]> {
  try {
    const response = await api.get<RecruitmentPlanData[]>(ENDPOINT, {
      params,
    })
    return response.data || []
  } catch (error) {
    console.error('获取招聘计划列表失败:', error)
    throw error
  }
}

/**
 * 获取单条招聘计划
 * 
 * @param id 招聘计划ID
 * @returns 招聘计划详情
 */
export async function fetchRecruitmentById(id: number): Promise<RecruitmentPlanData> {
  try {
    const response = await api.get<RecruitmentPlanData>(`${ENDPOINT}/${id}`)
    return response.data
  } catch (error) {
    console.error(`获取招聘计划 ${id} 失败:`, error)
    throw error
  }
}

/**
 * 创建招聘计划
 * 
 * @param data 招聘计划数据
 * @returns 创建后的招聘计划
 */
export async function createRecruitment(data: RecruitmentPlanData): Promise<RecruitmentPlanData> {
  try {
    const response = await api.post<RecruitmentPlanData>(ENDPOINT, data)
    return response.data
  } catch (error) {
    console.error('创建招聘计划失败:', error)
    throw error
  }
}

/**
 * 更新招聘计划
 * 
 * @param id 招聘计划ID
 * @param data 更新的数据
 * @returns 更新后的招聘计划
 */
export async function updateRecruitment(
  id: number,
  data: Partial<RecruitmentPlanData>
): Promise<RecruitmentPlanData> {
  try {
    const response = await api.put<RecruitmentPlanData>(`${ENDPOINT}/${id}`, data)
    return response.data
  } catch (error) {
    console.error(`更新招聘计划 ${id} 失败:`, error)
    throw error
  }
}

/**
 * 删除招聘计划
 * 
 * @param id 招聘计划ID
 * @returns 删除结果
 */
export async function deleteRecruitment(id: number): Promise<boolean> {
  try {
    await api.delete(`${ENDPOINT}/${id}`)
    return true
  } catch (error) {
    console.error(`删除招聘计划 ${id} 失败:`, error)
    throw error
  }
}

/**
 * 保存招聘计划（创建或更新）
 * 
 * @param data 招聘计划数据（包含 id 则更新，否则创建）
 * @returns 保存结果
 */
export async function saveRecruitment(data: RecruitmentPlanData): Promise<ApiResponse> {
  try {
    const response = await api.post<ApiResponse>(`${ENDPOINT}/save`, data)
    return response.data || { success: false }
  } catch (error) {
    console.error('保存招聘计划失败:', error)
    throw error
  }
}

/**
 * 获取招聘统计数据
 * 
 * @param params 查询参数
 * @returns 招聘统计数据
 */
export async function fetchRecruitmentStatistics(params?: {
  campus?: string
  start_date?: string
  end_date?: string
}): Promise<RecruitmentStatistics> {
  try {
    const response = await api.get<RecruitmentStatistics>(
      `${ENDPOINT}/statistics/summary`,
      { params }
    )
    return response.data || {
      总招聘数: 0,
      计划招聘总人数: 0,
      实际招聘总人数: 0,
      总应聘人数: 0,
      总面试人数: 0,
      总录用人数: 0,
      平均录用率: 0,
      总招聘成本: 0,
      平均人均成本: 0,
      平均满意度评分: 0,
    }
  } catch (error) {
    console.error('获取招聘统计数据失败:', error)
    throw error
  }
}

/**
 * 批量保存招聘计划
 * 
 * @param dataList 招聘计划数据列表
 * @returns 保存结果列表
 */
export async function batchSaveRecruitment(
  dataList: RecruitmentPlanData[]
): Promise<ApiResponse[]> {
  try {
    const promises = dataList.map(data => saveRecruitment(data))
    const results = await Promise.all(promises)
    return results
  } catch (error) {
    console.error('批量保存招聘计划失败:', error)
    throw error
  }
}

/**
 * 导出招聘计划数据（CSV 格式）
 * 
 * @param params 查询参数
 */
export async function exportRecruitmentData(params?: {
  campus?: string
  start_date?: string
  end_date?: string
}): Promise<Blob> {
  try {
    const response = await api.get(`${ENDPOINT}/export`, {
      params,
      responseType: 'blob',
    })
    return response.data
  } catch (error) {
    console.error('导出招聘计划数据失败:', error)
    throw error
  }
}

