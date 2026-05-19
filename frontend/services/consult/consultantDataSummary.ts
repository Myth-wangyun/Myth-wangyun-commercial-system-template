/**
 * 003神殿各咨询师数据汇总新版 - 前端服务层
 * 提供从后端API获取咨询师数据汇总的接口
 */

import api from '@/services/api'

// ==================== 类型定义 ====================

/** 单个来源统计数据 */
export interface ConsultantSourceStats {
  收入数: number
  招生总数: number
  上门量: number
  咨询量: number
}

/** 咨询师月度数据 */
export interface ConsultantMonthData {
  咨询师: string
  月份: number
  // 所有媒体来源汇总
  计划收入: number
  实际收入: number
  计划招生: number
  实际招生: number
  退费数: number
  上门总量: number
  咨询总量: number
  // 分来源统计
  SEM: ConsultantSourceStats
  新媒体: ConsultantSourceStats
  市场口碑: ConsultantSourceStats
  合作伙伴: ConsultantSourceStats
  口碑: ConsultantSourceStats
  渠道: ConsultantSourceStats
  // 转化率
  总转化率?: number
  电转门率?: number
  当面转化率?: number
}

/** 咨询师年度统计响应 */
export interface ConsultantYearlyResponse {
  神殿: string
  年份: number
  咨询师列表: string[]
  数据列表: ConsultantMonthData[]
}

/** 月度咨询师汇总 */
export interface MonthlyConsultantSummary {
  月份: number
  咨询师数据: ConsultantMonthData[]
  月度合计: ConsultantMonthData
}

/** 神殿月度响应 */
export interface CampusMonthlyResponse {
  神殿: string
  年份: number
  月度汇总列表: MonthlyConsultantSummary[]
}

/** 咨询师列表响应 */
export interface ConsultantListResponse {
  神殿: string
  咨询师列表: string[]
}

// ==================== API 方法 ====================

/**
 * 获取神殿各咨询师数据汇总
 * @param year 年份
 * @param campus 神殿名称
 * @param month 月份（可选，不传则返回全年）
 */
export async function getConsultantDataSummary(
  year: number,
  campus: string,
  month?: number
): Promise<ConsultantYearlyResponse> {
  const params: Record<string, unknown> = { year, campus }
  if (month) params.month = month
  
  const response = await api.get<ConsultantYearlyResponse>(
    '/api/v1/consult/consultant-data-summary/by-consultant',
    { params }
  )
  return response.data
}

/**
 * 获取神殿月度咨询师汇总
 * @param year 年份
 * @param campus 神殿名称
 */
export async function getMonthlySummary(
  year: number,
  campus: string
): Promise<CampusMonthlyResponse> {
  const response = await api.get<CampusMonthlyResponse>(
    '/api/v1/consult/consultant-data-summary/monthly-summary',
    { params: { year, campus } }
  )
  return response.data
}

/**
 * 获取神殿咨询师列表
 * @param campus 神殿名称
 * @param year 年份（可选）
 */
export async function getConsultantList(
  campus: string,
  year?: number
): Promise<ConsultantListResponse> {
  const params: Record<string, unknown> = { campus }
  if (year) params.year = year
  
  const response = await api.get<ConsultantListResponse>(
    '/api/v1/consult/consultant-data-summary/consultant-list',
    { params }
  )
  return response.data
}

// ==================== 工具函数 ====================

/** 创建空统计数据 */
export function createEmptyStats(): ConsultantSourceStats {
  return {
    收入数: 0,
    招生总数: 0,
    上门量: 0,
    咨询量: 0,
  }
}

/** 计算转化率 */
export function calcRate(numerator: number, denominator: number): string {
  if (denominator === 0) return '-'
  return (numerator / denominator * 100).toFixed(2) + '%'
}

/** 格式化金额 */
export function formatMoney(value: number): string {
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/**
 * 聚合咨询师月度数据为年度汇总
 */
export function aggregateYearlyData(data: ConsultantMonthData[]): ConsultantMonthData {
  const result: ConsultantMonthData = {
    咨询师: '年度合计',
    月份: 0,
    计划收入: 0,
    实际收入: 0,
    计划招生: 0,
    实际招生: 0,
    退费数: 0,
    上门总量: 0,
    咨询总量: 0,
    SEM: createEmptyStats(),
    新媒体: createEmptyStats(),
    市场口碑: createEmptyStats(),
    合作伙伴: createEmptyStats(),
    口碑: createEmptyStats(),
    渠道: createEmptyStats(),
  }
  
  for (const item of data) {
    result.计划收入 += item.计划收入
    result.实际收入 += item.实际收入
    result.计划招生 += item.计划招生
    result.实际招生 += item.实际招生
    result.退费数 += item.退费数
    result.上门总量 += item.上门总量
    result.咨询总量 += item.咨询总量
    
    // 分来源汇总
    const sources = ['SEM', '新媒体', '市场口碑', '合作伙伴', '口碑', '渠道'] as const
    for (const source of sources) {
      const srcItem = item[source]
      const srcResult = result[source]
      srcResult.收入数 += srcItem.收入数
      srcResult.招生总数 += srcItem.招生总数
      srcResult.上门量 += srcItem.上门量
      srcResult.咨询量 += srcItem.咨询量
    }
  }
  
  // 计算转化率
  if (result.咨询总量 > 0) {
    result.总转化率 = Number((result.实际招生 / result.咨询总量 * 100).toFixed(2))
    result.电转门率 = Number((result.上门总量 / result.咨询总量 * 100).toFixed(2))
  }
  if (result.上门总量 > 0) {
    result.当面转化率 = Number((result.实际招生 / result.上门总量 * 100).toFixed(2))
  }
  
  return result
}

/**
 * 按咨询师分组数据
 */
export function groupByConsultant(data: ConsultantMonthData[]): Map<string, ConsultantMonthData[]> {
  const groups = new Map<string, ConsultantMonthData[]>()
  
  for (const item of data) {
    const list = groups.get(item.咨询师) || []
    list.push(item)
    groups.set(item.咨询师, list)
  }
  
  return groups
}

/**
 * 按月份分组数据
 */
export function groupByMonth(data: ConsultantMonthData[]): Map<number, ConsultantMonthData[]> {
  const groups = new Map<number, ConsultantMonthData[]>()
  
  for (const item of data) {
    const list = groups.get(item.月份) || []
    list.push(item)
    groups.set(item.月份, list)
  }
  
  return groups
}
