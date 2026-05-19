/**
 * 财务收入和退费 API 服务
 * 007财务收入和退费 - 最高议事厅核心数据
 * 
 * 数据来源说明：
 * - 计划收入/计划招生：手动输入，存储到数据库
 * - 实际收入/实际招生/退费人数/咨询总量/上门量：从咨询量录入系统自动读取
 */

import request from '@/services/api'

const BASE_URL = '/consult/financial'

// ==================== 数据类型 ====================

export const DATA_TYPES = [
  'SEM',
  '新媒体',
  '市场口碑',
  '网络合作伙伴',
  '免费推广',
  '口碑',
  '渠道',
  '神殿新媒体',
  '汇总'
] as const

export type DataType = typeof DATA_TYPES[number]

// ==================== 接口类型定义 ====================

/** 神殿月度财务数据 */
export interface CampusMonthlyData {
  记录ID?: number
  年份: number
  月份: number
  神殿: string
  数据类型: string
  计划收入: number
  实际收入: number
  计划招生: number
  实际招生: number
  退费人数: number
  创建人ID?: number
  创建人姓名?: string
  创建时间?: string
  更新时间?: string
}

/** 最高议事厅核心数据汇总 */
export interface MgntCoreSummaryData {
  记录ID?: number
  年份: number
  神殿: string
  数据类型: string
  计划收入: number
  实际收入: number
  计划招生: number
  实际招生: number
  退费人数: number
  创建人ID?: number
  创建人姓名?: string
  创建时间?: string
  更新时间?: string
}

/** 年度汇总数据 */
export interface YearlySummary {
  计划收入: number
  实际收入: number
  计划招生: number
  实际招生: number
  退费人数: number
}

/** 自动统计的月度数据 */
export interface AutoStatsMonthlyItem {
  月份: number
  咨询总量: number
  上门量: number
  实际招生: number
  退费人数: number
  实际收入: number
  退费金额: number
}

/** 自动统计的神殿年度数据 */
export interface AutoStatsCampusYearly {
  神殿: string
  咨询总量: number
  上门量: number
  实际招生: number
  退费人数: number
  实际收入: number
  退费金额: number
}

/** 合并后的月度数据（含转化率） */
export interface CombinedMonthlyData {
  月份: number
  // 计划数据（手动输入）
  计划收入: number
  计划招生: number
  // 实际数据（自动计算）
  咨询总量: number
  上门量: number
  实际招生: number
  退费人数: number
  实际收入: number
  退费金额: number
  // 转化率
  总转化率: number
  当面转化率: number
  电转门: number
}

/** 合并后的年度汇总 */
export interface CombinedYearlySummary {
  计划收入: number
  计划招生: number
  咨询总量: number
  上门量: number
  实际招生: number
  退费人数: number
  实际收入: number
  退费金额: number
  总转化率: number
  当面转化率: number
  电转门: number
}

// ==================== TAB2 - 神殿月度数据 API ====================

/**
 * 创建/更新神殿月度财务数据
 */
export async function upsertCampusMonthlyData(data: Omit<CampusMonthlyData, '记录ID'>) {
  return request.post(`${BASE_URL}/campus-monthly-data`, data).then(res => res.data)
}

/**
 * 批量创建/更新神殿月度财务数据
 */
export async function batchUpsertCampusMonthlyData(dataList: Omit<CampusMonthlyData, '记录ID'>[]) {
  return request.post(`${BASE_URL}/campus-monthly-data/batch`, {
    数据列表: dataList
  }).then(res => res.data)
}

/**
 * 获取神殿月度数据（用于TAB2展示）
 */
export async function getCampusMonthlyData(params: {
  year: number
  campus: string
  data_type: string
}): Promise<{
  神殿: string
  年份: number
  数据类型: string
  月度数据: CampusMonthlyData[]
  年度汇总: YearlySummary
}> {
  return request.get(`${BASE_URL}/campus-monthly-data`, { params }).then(res => res.data)
}

/**
 * 获取神殿所有数据类型的数据
 */
export async function getCampusAllData(params: {
  year: number
  campus: string
}): Promise<{
  神殿: string
  年份: number
  分类数据: Record<string, CampusMonthlyData[]>
  分类汇总: Record<string, YearlySummary>
}> {
  return request.get(`${BASE_URL}/campus-all-data`, { params }).then(res => res.data)
}

/**
 * 获取所有神殿年度计划汇总（从神殿月度财务数据）
 * 用于002子表1的神殿汇总行中计划数据展示
 */
export async function getAllCampusYearlyPlanSummary(params: {
  year: number
  data_type: string
}): Promise<Array<{ 神殿: string; 计划收入: number; 计划招生: number }>> {
  return request.get(`${BASE_URL}/all-campus-yearly-plan-summary`, { params }).then(res => res.data)
}

/**
 * 更新神殿月度财务数据
 */
export async function updateCampusMonthlyData(recordId: number, data: Partial<CampusMonthlyData>) {
  return request.put(`${BASE_URL}/campus-monthly-data/${recordId}`, data).then(res => res.data)
}

/**
 * 删除神殿月度财务数据
 */
export async function deleteCampusMonthlyData(recordId: number) {
  return request.delete(`${BASE_URL}/campus-monthly-data/${recordId}`).then(res => res.data)
}

// ==================== TAB1 - 最高议事厅核心数据汇总 API ====================

/**
 * 获取最高议事厅核心数据汇总（TAB1）
 */
export async function getMgntCoreSummary(params: {
  year: number
  data_type: string
}): Promise<{
  年份: number
  数据类型: string
  神殿数据: MgntCoreSummaryData[]
  总计: YearlySummary
}> {
  return request.get(`${BASE_URL}/mgnt-core-summary`, { params }).then(res => res.data)
}

/**
 * 获取最高议事厅所有数据类型的核心数据汇总
 */
export async function getMgntCoreSummaryAll(params: {
  year: number
}): Promise<{
  年份: number
  分类数据: Record<string, MgntCoreSummaryData[]>
  分类总计: Record<string, YearlySummary>
}> {
  return request.get(`${BASE_URL}/mgnt-core-summary/all`, { params }).then(res => res.data)
}

/**
 * 创建/更新最高议事厅核心数据汇总
 */
export async function upsertMgntCoreSummary(data: Omit<MgntCoreSummaryData, '记录ID'>) {
  return request.post(`${BASE_URL}/mgnt-core-summary`, data).then(res => res.data)
}

/**
 * 从神殿月度数据同步最高议事厅汇总
 */
export async function syncMgntCoreSummary(params: {
  year: number
  campus?: string
  data_type?: string
}): Promise<{
  同步数量: number
  同步记录: Array<{
    神殿: string
    数据类型: string
    记录ID: number
  }>
}> {
  return request.post(`${BASE_URL}/mgnt-core-summary/sync`, null, { params }).then(res => res.data)
}

/**
 * 获取支持的数据类型列表
 */
export async function getDataTypes(): Promise<string[]> {
  return request.get(`${BASE_URL}/data-types`).then(res => res.data)
}

// ==================== 自动读取咨询量系统数据 API ====================

/**
 * 从咨询量系统自动获取月度实际数据
 */
export async function getAutoStatsMonthly(params: {
  year: number
  campus: string
  data_type: string
}): Promise<{
  success: boolean
  data: {
    年份: number
    神殿: string
    数据类型: string
    月度数据: AutoStatsMonthlyItem[]
    年度汇总: {
      咨询总量: number
      上门量: number
      实际招生: number
      退费人数: number
      实际收入: number
      退费金额: number
    }
  }
}> {
  return request.get(`${BASE_URL}/auto-stats/monthly`, { params }).then(res => res.data)
}

/**
 * 从咨询量系统自动获取各神殿年度汇总
 */
export async function getAutoStatsYearlyByCampus(params: {
  year: number
  data_type: string
}): Promise<{
  success: boolean
  data: {
    年份: number
    数据类型: string
    神殿数据: AutoStatsCampusYearly[]
    合计: AutoStatsCampusYearly
  }
}> {
  return request.get(`${BASE_URL}/auto-stats/yearly-by-campus`, { params }).then(res => res.data)
}

/**
 * 从咨询量系统自动获取所有数据类型的神殿年度汇总
 */
export async function getAutoStatsAllDataTypes(params: {
  year: number
}): Promise<{
  success: boolean
  data: {
    年份: number
    分类数据: Record<string, {
      神殿数据: AutoStatsCampusYearly[]
      合计: AutoStatsCampusYearly
    }>
  }
}> {
  return request.get(`${BASE_URL}/auto-stats/all-data-types`, { params }).then(res => res.data)
}

/**
 * 获取合并后的月度数据（计划+自动实际数据）
 * 包含转化率计算：总转化率、当面转化率、电转门
 */
export async function getCombinedMonthlyData(params: {
  year: number
  campus: string
  data_type: string
}): Promise<{
  success: boolean
  data: {
    年份: number
    神殿: string
    数据类型: string
    月度数据: CombinedMonthlyData[]
    年度汇总: CombinedYearlySummary
  }
}> {
  return request.get(`${BASE_URL}/combined-monthly-data`, { params }).then(res => res.data)
}

// ==================== 数据来源配置 ====================

/** 从市场表获取的数据类型（保留用于市场表独立查询） */
export const MARKET_SOURCE_DATA_TYPES = ['SEM', '新媒体', '市场口碑', '网络合作伙伴'] as const

/** 从咨询量系统获取的数据类型 */
export const CONSULT_SOURCE_DATA_TYPES = ['口碑', '渠道', '神殿新媒体'] as const

/**
 * 获取数据类型的数据来源标识
 * 所有数据类型的实际数据统一从咨询量系统获取
 */
export function getDataSourceLabel(dataType: string): string {
  return '咨询量系统'
}

/**
 * 获取合并后的月度数据V2
 * - 计划收入/计划招生：手动输入
 * - 实际收入/实际招生/退费人数：统一从咨询量录入系统读取
 */
export async function getCombinedMonthlyDataV2(params: {
  year: number
  campus: string
  data_type: string
}): Promise<{
  success: boolean
  data: {
    年份: number
    神殿: string
    数据类型: string
    数据来源: string
    月度数据: CombinedMonthlyData[]
    年度汇总: CombinedYearlySummary
  }
}> {
  return request.get(`${BASE_URL}/combined-monthly-data-v2`, { params }).then(res => res.data)
}

