/**
 * 咨询量统计API
 * 用于获取各TAB的统计数据
 */

import { api } from '@/services/api'

export interface TabStat {
  tab_name: string
  count: number
}

export interface StatsResponse {
  success: boolean
  data: TabStat[]
  config_tree: Record<string, Record<string, string[]>>
  query_params: {
    神殿: string | null
    开始日期: string | null
    结束日期: string | null
  }
}

export interface TabDataResponse {
  success: boolean
  total: number
  page: number
  page_size: number
  data: any[]
}

export interface SummaryResponse {
  success: boolean
  data: {
    总量: number
    上门量: number
    报名量: number
    订座量: number
    无效量: number
    不算量: number
    量来源分布: Record<string, number>
    媒体来源分布: Array<{
      量来源: string
      媒体来源: string
      数量: number
    }>
  }
  config_tree: Record<string, Record<string, string[]>>
}

export interface ConfigTreeResponse {
  success: boolean
  data: Record<string, Record<string, string[]>>
}

// 完整配置树的类型定义（包含排序信息）
export interface MediaDetailItem {
  name: string
  sort_order: number
  description?: string
  is_important?: boolean
}

export interface MediaSourceItem {
  name: string
  sort_order: number
  description?: string
  is_important?: boolean
  details: MediaDetailItem[]
}

export interface MediaCategoryItem {
  name: string
  sort_order: number
  description?: string
  sources: MediaSourceItem[]
}

export interface FullConfigTreeResponse {
  success: boolean
  data: {
    categories: MediaCategoryItem[]
  }
}

// 注意：api 实例的 baseURL 已经包含 /api/v1
const BASE_URL = '/consult'

/**
 * 获取媒体来源配置树（简单格式）
 */
export async function getConfigTree(): Promise<ConfigTreeResponse> {
  const response = await api.get(`${BASE_URL}/consultation/stats/config-tree`)
  return response.data
}

/**
 * 获取媒体来源完整配置树（包含排序信息）
 */
export async function getFullConfigTree(): Promise<FullConfigTreeResponse> {
  const response = await api.get(`${BASE_URL}/consultation/stats/config-tree-full`)
  return response.data
}

/**
 * 获取所有TAB的统计数据
 */
export async function getAllTabsStats(params: {
  神殿?: string
  开始日期?: string
  结束日期?: string
}): Promise<StatsResponse> {
  const response = await api.get(`${BASE_URL}/consultation/stats/tabs`, { params })
  return response.data
}

/**
 * 获取指定TAB的详细数据
 */
export async function getTabData(tabName: string, params: {
  神殿?: string
  开始日期?: string
  结束日期?: string
  page?: number
  page_size?: number
}): Promise<TabDataResponse> {
  const response = await api.get(`${BASE_URL}/consultation/stats/tab-data/${encodeURIComponent(tabName)}`, { params })
  return response.data
}

/**
 * 获取汇总统计数据
 */
export async function getSummaryStats(params: {
  神殿?: string
  开始日期?: string
  结束日期?: string
}): Promise<SummaryResponse> {
  const response = await api.get(`${BASE_URL}/consultation/stats/summary`, { params })
  return response.data
}

// ============= 数据联动API =============

/** 月度咨询量统计响应 */
export interface MonthlyCampusSummaryResponse {
  success: boolean
  data: {
    年份: number
    神殿: string
    数据类型: string
    月度数据: Array<{
      月份: number
      咨询总量: number
      上门量: number
      报名量: number
      退费人数: number
      电话量: number
      实际收入: number
    }>
    年度汇总: {
      咨询总量: number
      上门量: number
      报名量: number
      退费人数: number
      电话量: number
      实际收入: number
    }
  }
}

/** 所有神殿年度汇总响应 */
export interface AllCampusYearlySummaryResponse {
  success: boolean
  data: {
    年份: number
    数据类型: string
    分类: string
    媒体来源: string
    神殿数据: Array<{
      神殿: string
      咨询总量: number
      上门量: number
      报名量: number
      订座量: number
      退费人数: number
      电话量: number
      实际收入: number
    }>
    合计: {
      神殿: string
      咨询总量: number
      上门量: number
      报名量: number
      订座量: number
      退费人数: number
      电话量: number
      实际收入: number
    }
  }
}

/**
 * 获取按月份和神殿汇总的咨询量统计数据
 * 用于002神殿年月表的数据联动
 */
export async function getMonthlyCampusSummary(params: {
  年份: number
  神殿?: string
  数据类型?: string
  媒体来源?: string  // 多个用逗号分隔，如 "百教网,知了好学"
  分类?: string  // 配置驱动分类(SEM/新媒体/市场口碑/合作伙伴/免费推广/口碑/渠道/神殿新媒体)
}): Promise<MonthlyCampusSummaryResponse> {
  const response = await api.get(`${BASE_URL}/consultation/stats/monthly-campus-summary`, { params })
  return response.data
}

/**
 * 获取所有神殿的年度汇总统计数据
 * 用于001最高议事厅核心数据汇总表的数据联动
 */
export async function getAllCampusYearlySummary(params: {
  年份: number
  数据类型?: string
  媒体来源?: string
  分类?: string
}): Promise<AllCampusYearlySummaryResponse> {
  const response = await api.get(`${BASE_URL}/consultation/stats/all-campus-yearly-summary`, { params })
  return response.data
}

/** 咨询师月度统计响应 */
export interface ConsultantMonthlySummaryResponse {
  success: boolean
  data: {
    年份: number
    神殿: string
    数据类型: string
    咨询师数据: Record<string, Record<number, {
      咨询总量: number
      上门量: number
      报名量: number
      退费人数: number
      电话量: number
      实际收入: number
    }>>
  }
}

/**
 * 获取咨询师按月度的咨询量统计数据
 * 用于口碑等页面的咨询师月度表自动填充
 */
export async function getConsultantMonthlySummary(params: {
  年份: number
  神殿: string
  数据类型?: string
  媒体来源?: string  // 多个用逗号分隔，如 "百教网,知了好学"
  分类?: string  // 配置驱动分类
}): Promise<ConsultantMonthlySummaryResponse> {
  const response = await api.get(`${BASE_URL}/consultation/stats/consultant-monthly-summary`, { params })
  return response.data
}
