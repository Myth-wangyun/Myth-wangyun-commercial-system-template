/**
 * 003神殿各咨询师数据汇总 V3 - 前端服务层
 *
 * 三个看板:
 *   TAB1 - 年度核心数据汇总 (月份×神殿)
 *   TAB2 - 年度核心数据看板 (咨询师年度汇总)
 *   TAB3 - 月度核心数据看板 (月份×咨询师)
 */

import api from '../api'

// ==================== 类型定义 ====================

/** 所有媒体来源统计 */
export interface MediaStats {
  计划收入: number
  实际收入: number
  收入完成率: number | null
  计划招生: number
  实际招生: number
  总转化率: number | null
  退费数: number
  上门总量: number
  上门率: number | null
  咨询总量: number
}

/** 网络来源子类统计 */
export interface NetworkSourceStats {
  实际收入: number
  报名转化率: number | null
  实际招生: number
  上门率: number | null
  上门量: number
  咨询量: number
}

/** 网络媒体汇总统计 */
export interface NetworkSummaryStats {
  计划收入: number
  实际收入: number
  收入完成率: number | null
  计划招生: number
  实际招生: number
  总转化率: number | null
  退费数: number
  上门量: number
  上门率: number | null
  咨询量: number
}

/** TAB1 行 */
export interface Tab1Row {
  月份: string
  神殿: string
  咨询师职数: number
  所有媒体来源: MediaStats
}

/** TAB2 网络媒体核心数据汇总 行 */
export interface Tab2NetworkRow {
  月份: string
  神殿: string
  咨询师职数: number
  网络媒体: NetworkSummaryStats
  SEM: NetworkSourceStats
  新媒体: NetworkSourceStats
  市场口碑: NetworkSourceStats
  合作伙伴: NetworkSourceStats
  免费推广: NetworkSourceStats
}

/** TAB2 网络媒体年度核心数据看板 行 */
export interface Tab2NetworkAnnualRow {
  序号: number | string
  咨询师: string
  职位: string
  网络媒体: NetworkSummaryStats
  SEM: NetworkSourceStats
  新媒体: NetworkSourceStats
  市场口碑: NetworkSourceStats
  合作伙伴: NetworkSourceStats
  免费推广: NetworkSourceStats
}

/** TAB2 网络媒体月度核心数据看板 行 */
export interface Tab2NetworkMonthlyRow {
  月份: string
  咨询师: string
  咨询师职数: number | string
  网络媒体: NetworkSummaryStats
  SEM: NetworkSourceStats
  新媒体: NetworkSourceStats
  市场口碑: NetworkSourceStats
  合作伙伴: NetworkSourceStats
  免费推广: NetworkSourceStats
}

/** TAB3 渠道核心数据汇总 行 */
export interface Tab3ChannelSummaryRow {
  月份: string
  神殿: string
  咨询师职数: number
  渠道平台: NetworkSummaryStats
  渠道: NetworkSourceStats
}

/** TAB3 渠道年度核心数据看板 行 */
export interface Tab3ChannelAnnualRow {
  序号: number | string
  咨询师: string
  职位: string
  渠道平台: NetworkSummaryStats
  渠道: NetworkSourceStats
}

/** TAB3 渠道月度核心数据看板 行 */
export interface Tab3ChannelMonthlyRow {
  月份: string
  咨询师: string
  咨询师职数: number | string
  渠道平台: NetworkSummaryStats
  渠道: NetworkSourceStats
}

/** TAB4 口碑核心数据汇总 行 */
export interface Tab4KoubeiSummaryRow {
  月份: string
  神殿: string
  咨询师职数: number
  口碑平台: NetworkSummaryStats
  咨询口碑: NetworkSourceStats
  教质口碑: NetworkSourceStats
  学术口碑: NetworkSourceStats
  校园口碑: NetworkSourceStats
  其他口碑: NetworkSourceStats
}

/** TAB4 口碑年度核心数据看板 行 */
export interface Tab4KoubeiAnnualRow {
  序号: number | string
  咨询师: string
  职位: string
  口碑平台: NetworkSummaryStats
  咨询口碑: NetworkSourceStats
  教质口碑: NetworkSourceStats
  学术口碑: NetworkSourceStats
  校园口碑: NetworkSourceStats
  其他口碑: NetworkSourceStats
}

/** TAB4 口碑月度核心数据看板 行 */
export interface Tab4KoubeiMonthlyRow {
  月份: string
  咨询师: string
  咨询师职数: number | string
  口碑平台: NetworkSummaryStats
  咨询口碑: NetworkSourceStats
  教质口碑: NetworkSourceStats
  学术口碑: NetworkSourceStats
  校园口碑: NetworkSourceStats
  其他口碑: NetworkSourceStats
}

/** TAB2 行 */
export interface Tab2Row {
  序号: number | string
  咨询师: string
  职位: string
  所有媒体来源: MediaStats
}

/** TAB3 行 */
export interface Tab3Row {
  月份: string
  咨询师: string
  咨询师职数: number | string
  所有媒体来源: MediaStats
}

/** 完整响应 */
export interface FullV3Response {
  神殿: string
  年份: number
  tab1_年度核心数据汇总: Tab1Row[]
  tab2_网络媒体_核心数据汇总: Tab2NetworkRow[]
  tab2_网络媒体_年度核心数据看板: Tab2NetworkAnnualRow[]
  tab2_网络媒体_月度核心数据看板: Tab2NetworkMonthlyRow[]
  tab3_渠道_核心数据汇总: Tab3ChannelSummaryRow[]
  tab3_渠道_年度核心数据看板: Tab3ChannelAnnualRow[]
  tab3_渠道_月度核心数据看板: Tab3ChannelMonthlyRow[]
  tab4_口碑_核心数据汇总: Tab4KoubeiSummaryRow[]
  tab4_口碑_年度核心数据看板: Tab4KoubeiAnnualRow[]
  tab4_口碑_月度核心数据看板: Tab4KoubeiMonthlyRow[]
  tab2_年度核心数据看板: Tab2Row[]
  tab3_月度核心数据看板: Tab3Row[]
}

/** 计划数据保存请求 */
export interface SavePlanRequest {
  campus: string
  year: number
  month: number
  consultant: string
  plan_income?: number
  plan_enrollment?: number
  data_type?: string  // 网络/渠道/口碑
  sub_table?: number  // 1=子表1核心数据汇总, 2=子表2年度看板, 3=子表3月度看板
}

// ==================== API 函数 ====================

const BASE_URL = '/consult/consultant-data-summary-v3'

/**
 * 获取完整页面数据（3个看板）
 */
export async function getV3FullData(year: number, campus: string): Promise<FullV3Response> {
  const response = await api.get<FullV3Response>(`${BASE_URL}/full-data`, {
    params: { year, campus },
  })
  return response.data
}

/**
 * 保存计划数据
 */
export async function saveV3PlanData(
  data: SavePlanRequest,
): Promise<{ success: boolean; message: string }> {
  const response = await api.post(`${BASE_URL}/save-plan`, data)
  return response.data
}

// ==================== 格式化工具 ====================

export function fmtPercent(v: number | null | undefined): string {
  if (v === null || v === undefined) return '-'
  return `${v.toFixed(1)}%`
}

export function fmtMoney(v: number | null | undefined): string {
  if (v === null || v === undefined || v === 0) return '0'
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined) return '0'
  return v.toLocaleString('zh-CN')
}
