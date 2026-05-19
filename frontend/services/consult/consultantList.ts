/**
 * 咨询师列表API服务
 * 从后端获取咨询师数据
 */

import api from '../api'

// 咨询师信息接口
export interface ConsultantInfo {
  user_id: number
  real_name: string
  department?: string
  position?: string
  campus?: string
  phone?: string
}

// 咨询师列表响应接口
export interface ConsultantListResponse {
  items: ConsultantInfo[]
  total: number
}

// 按神殿分组的咨询师列表接口
export interface ConsultantsByCampusResponse {
  campus: string
  consultants: string[]
}

/**
 * 获取咨询师列表
 * @param params 筛选参数
 * @returns 咨询师列表
 */
export async function getConsultants(params?: {
  campus?: string
  department?: string
  position?: string
}): Promise<ConsultantListResponse> {
  const response = await api.get<ConsultantListResponse>('/consult/consultants', { params })
  return response.data
}

/**
 * 获取按神殿分组的咨询师列表
 * @returns 按神殿分组的咨询师列表
 */
export async function getConsultantsByCampus(): Promise<ConsultantsByCampusResponse[]> {
  const response = await api.get<ConsultantsByCampusResponse[]>('/consult/consultants/by-campus')
  return response.data
}

/**
 * 获取咨询师姓名列表
 * @param campus 神殿名称（可选）
 * @returns 咨询师姓名数组
 */
export async function getConsultantNames(campus?: string): Promise<string[]> {
  const params = campus ? { campus } : undefined
  const response = await api.get<string[]>('/consult/consultants/names', { params })
  return response.data
}

/**
 * 获取有咨询师的神殿列表
 * @returns 神殿名称数组
 */
export async function getConsultantCampusOptions(): Promise<string[]> {
  const response = await api.get<string[]>('/consult/consultants/campus-options')
  return response.data
}

/**
 * 将按神殿分组的咨询师列表转换为配置对象
 * 用于咨询量生成器等工具
 * @returns Record<string, string[]> 格式的配置对象
 */
export async function getConsultantsConfig(): Promise<Record<string, string[]>> {
  const data = await getConsultantsByCampus()
  const config: Record<string, string[]> = {}
  for (const item of data) {
    config[item.campus] = item.consultants
  }
  return config
}
