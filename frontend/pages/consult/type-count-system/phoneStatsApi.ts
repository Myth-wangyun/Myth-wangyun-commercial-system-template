/**
 * 电话量统计API服务
 * 与咨询沟通记录模块深度绑定
 */

import axios from 'axios'

const API_BASE = '/api/v1/consult'

// 电话量日统计数据结构
export interface PhoneDailyStats {
  日期: string
  电话量: number
  网聊量: number
  当面量: number
  总沟通量: number
  总用时: number
  联系成功量: number
  联系失败量: number
}

// 电话量咨询师统计数据结构
export interface PhoneConsultantStats {
  咨询师: string
  电话量: number
  网聊量: number
  当面量: number
  总沟通量: number
  总用时: number
  联系成功量: number
  联系失败量: number
}

// 电话量月统计数据结构
export interface PhoneMonthlyStats {
  月份: number
  电话量: number
  网聊量: number
  当面量: number
  总沟通量: number
  总用时: number
  联系成功量: number
  联系失败量: number
}

// 汇总数据结构
export interface PhoneStatsSummary {
  电话量: number
  网聊量: number
  当面量: number
  总沟通量: number
  联系成功量: number
  联系失败量: number
  平均用时: number
}

// 统计响应结构
export interface PhoneStatsResponse<T> {
  success: boolean
  data: T[]
  summary: PhoneStatsSummary
}

/**
 * 按日期统计电话量/沟通量
 */
export async function getPhoneStatsByDate(params: {
  start_date?: string
  end_date?: string
  咨询师?: string
  神殿?: string
}): Promise<PhoneStatsResponse<PhoneDailyStats>> {
  const response = await axios.get(`${API_BASE}/phone-call/stats/by-date`, { params })
  return response.data
}

/**
 * 按咨询师统计电话量/沟通量
 */
export async function getPhoneStatsByConsultant(params: {
  start_date?: string
  end_date?: string
  神殿?: string
}): Promise<PhoneStatsResponse<PhoneConsultantStats>> {
  const response = await axios.get(`${API_BASE}/phone-call/stats/by-consultant`, { params })
  return response.data
}

/**
 * 按月份统计电话量/沟通量
 * 用于接入表1-6的电话量字段
 */
export async function getPhoneStatsByMonth(params: {
  year: number
  咨询师?: string
  神殿?: string
}): Promise<PhoneStatsResponse<PhoneMonthlyStats>> {
  const response = await axios.get(`${API_BASE}/phone-call/stats/by-month`, { params })
  return response.data
}

// 电话量神殿统计数据结构
export interface PhoneCampusStats {
  神殿: string
  年份: number
  电话量: number
  网聊量: number
  当面量: number
  总沟通量: number
  总用时: number
  联系成功量: number
  联系失败量: number
}

/**
 * 按神殿统计年度电话量/沟通量
 * 用于接入表0的神殿年度汇总
 */
export async function getPhoneStatsByCampus(params: {
  year: number
}): Promise<PhoneStatsResponse<PhoneCampusStats>> {
  const response = await axios.get(`${API_BASE}/phone-call/stats/by-campus`, { params })
  return response.data
}

// ==================== 咨询沟通记录API ====================

// 咨询沟通记录数据结构
export interface CommunicationRecord {
  沟通ID: number
  记录ID: number
  对象ID: number
  沟通时间: string
  用时: number
  咨询师: string
  沟通方式: '网聊' | '电话' | '当面'
  需求点?: string
  关注点?: string
  抗拒点?: string
  咨询内容?: string
  咨询结果?: string
  报名意愿?: 'A' | 'B' | 'C' | 'D'
  有需求?: number
  有钱?: number
  有时间?: number
  有支持?: number
  具备条件?: string
  课程意向?: string
  联系不上?: number
  预定回访时间?: string
  创建人?: string
  创建时间?: string
  更新时间?: string
}

// 创建沟通记录请求
export interface CreateCommunicationRequest {
  记录ID: number
  沟通时间: string
  用时?: number
  咨询师?: string
  沟通方式: '网聊' | '电话' | '当面'
  需求点?: string
  关注点?: string
  抗拒点?: string
  咨询内容?: string
  咨询结果?: string
  报名意愿?: 'A' | 'B' | 'C' | 'D'
  有需求?: number
  有钱?: number
  有时间?: number
  有支持?: number
  具备条件?: string
  课程意向?: string
  联系不上?: number
  预定回访时间?: string
}

/**
 * 创建咨询沟通记录
 */
export async function createCommunicationRecord(data: CreateCommunicationRequest) {
  const response = await axios.post(`${API_BASE}/communication/record`, data)
  return response.data
}

/**
 * 获取咨询量的所有沟通记录
 */
export async function getCommunicationsByRecordId(记录ID: number) {
  const response = await axios.get(`${API_BASE}/communication/by-record/${记录ID}`)
  return response.data
}

/**
 * 获取咨询对象的所有沟通记录
 */
export async function getCommunicationsByObjectId(对象ID: number) {
  const response = await axios.get(`${API_BASE}/communication/by-object/${对象ID}`)
  return response.data
}

/**
 * 获取咨询量明细及其沟通记录
 */
export async function getConsultationWithCommunications(记录ID: number) {
  const response = await axios.get(`${API_BASE}/consultation/record-with-communications/${记录ID}`)
  return response.data
}

/**
 * 更新沟通记录
 */
export async function updateCommunicationRecord(沟通ID: number, data: Partial<CommunicationRecord>) {
  const response = await axios.put(`${API_BASE}/communication/record/${沟通ID}`, data)
  return response.data
}

/**
 * 删除沟通记录
 */
export async function deleteCommunicationRecord(沟通ID: number) {
  const response = await axios.delete(`${API_BASE}/communication/record/${沟通ID}`)
  return response.data
}

/**
 * 获取沟通记录列表（支持分页和筛选）
 */
export async function getCommunicationRecords(params: {
  记录ID?: number
  对象ID?: number
  咨询师?: string
  沟通方式?: '网聊' | '电话' | '当面'
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}) {
  const response = await axios.get(`${API_BASE}/communication/records`, { params })
  return response.data
}

/**
 * 今日沟通记录（带咨询者信息）
 */
export interface TodayCommunicationRecord extends CommunicationRecord {
  咨询者姓名?: string
  电话?: string
  量来源?: string
  状态?: string
  报名意向?: string
}

export async function getMyTodayCommunications(target_date?: string) {
  const response = await axios.get(`${API_BASE}/communication/my-today`, {
    params: target_date ? { target_date } : undefined,
  })
  return response.data
}
