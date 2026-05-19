/**
 * 祈福司职数数据服务
 * 对应后端 /api/v1/consult/staffing/* 接口
 */

import api from '@/services/api'

// ==================== 类型定义 ====================

export interface StaffingSummary {
  记录ID: number
  年份: number
  神殿: string
  // 咨询师职数
  咨询总职数: number
  咨询干部职数: number
  咨询员工职数: number
  // 渠道职数
  渠道总职数: number
  县办: number
  乡办: number
  信息员: number
  创建时间?: string
  更新时间?: string
}

export interface ConsultantDetail {
  记录ID: number
  年份: number
  神殿: string
  序号: number
  姓名: string
  职务: string
  职务级别: string
  备注?: string
}

export interface ChannelDetail {
  记录ID: number
  年份: number
  神殿: string
  序号: number
  姓名: string
  区域: string
  职务类型: string  // 县办/乡办/信息员
  备注?: string
}

export interface CampusStaffingDetail {
  汇总数据: StaffingSummary
  咨询师明细: ConsultantDetail[]
  渠道人员明细: ChannelDetail[]
}

// ==================== API 函数 ====================

/**
 * 获取指定年份所有神殿的职数汇总
 */
export async function getStaffingSummaryByYear(year: number): Promise<StaffingSummary[]> {
  const response = await api.get(`/consult/staffing/summary/year/${year}`)
  return response.data || []
}

/**
 * 获取指定年份和神殿的职数汇总
 */
export async function getStaffingSummary(year: number, campus: string): Promise<StaffingSummary | null> {
  const response = await api.get(`/consult/staffing/summary/${year}/${encodeURIComponent(campus)}`)
  return response.data || null
}

/**
 * 获取神殿职数明细（包括汇总和人员明细）
 */
export async function getCampusStaffingDetail(year: number, campus: string): Promise<CampusStaffingDetail> {
  const response = await api.get(`/consult/staffing/detail/${year}/${encodeURIComponent(campus)}`)
  return response.data
}

/**
 * 保存神殿职数明细
 */
export async function saveCampusStaffingDetail(
  year: number,
  campus: string,
  data: {
    汇总数据: Partial<StaffingSummary>
    咨询师明细?: ConsultantDetail[]
    渠道人员明细?: ChannelDetail[]
  }
): Promise<CampusStaffingDetail> {
  const response = await api.post(
    `/consult/staffing/detail/${year}/${encodeURIComponent(campus)}`,
    data
  )
  return response.data
}

/**
 * 获取所有神殿的职数数据映射（用于Dashboard快速查找）
 */
export async function getStaffingMap(year: number): Promise<Map<string, StaffingSummary>> {
  const summaries = await getStaffingSummaryByYear(year)
  const map = new Map<string, StaffingSummary>()
  summaries.forEach(s => map.set(s.神殿, s))
  return map
}
