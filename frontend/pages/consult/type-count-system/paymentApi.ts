/**
 * 缴费记录API服务
 * 用于管理咨询量的缴费记录、首款和后续交费
 */

import axios from 'axios'

const API_BASE = '/api/v1/consult'

// 缴费记录数据结构
export interface PaymentRecord {
  缴费ID: number
  记录ID: number
  对象ID: number
  缴费类型: '首款' | '后续交费'
  缴费金额: number
  缴费时间: string
  缴费方式?: string
  收款人?: string
  备注?: string
  凭证号?: string
  创建时间?: string
  创建人?: string
  更新时间?: string
  更新人?: string
}

// 缴费汇总数据结构
export interface PaymentSummary {
  汇总ID: number
  记录ID: number
  对象ID: number
  应交金额: number
  首款金额: number
  已交金额: number
  欠费金额: number
  缴费状态: '未缴费' | '部分缴费' | '已缴清'
  后续交费次数: number
  创建时间?: string
  更新时间?: string
}

// 缴费信息（汇总+记录列表）
export interface PaymentInfo {
  summary: PaymentSummary | null
  first_payment: PaymentRecord | null
  subsequent_payments: PaymentRecord[]
}

// 创建缴费记录请求
export interface CreatePaymentRequest {
  记录ID: number
  对象ID: number
  缴费类型: '首款' | '后续交费'
  缴费金额: number
  缴费时间: string
  缴费方式?: string
  收款人?: string
  备注?: string
  凭证号?: string
  应交金额?: number  // 首款时可以同时设置应交金额
}

// 更新缴费记录请求
export interface UpdatePaymentRequest {
  缴费金额?: number
  缴费时间?: string
  缴费方式?: string
  收款人?: string
  备注?: string
  凭证号?: string
}

// 更新缴费汇总请求
export interface UpdateSummaryRequest {
  应交金额: number
}

/**
 * 获取咨询量的缴费信息（汇总+首款+后续交费列表）
 */
export async function getPaymentInfo(recordId: number): Promise<PaymentInfo> {
  const response = await axios.get(`${API_BASE}/payment/by-record/${recordId}`)
  return response.data
}

/**
 * 新增缴费记录
 */
export async function createPaymentRecord(data: CreatePaymentRequest): Promise<PaymentRecord> {
  const response = await axios.post(`${API_BASE}/payment/record`, data)
  return response.data
}

/**
 * 获取缴费记录详情
 */
export async function getPaymentRecord(paymentId: number): Promise<PaymentRecord> {
  const response = await axios.get(`${API_BASE}/payment/record/${paymentId}`)
  return response.data
}

/**
 * 更新缴费记录
 */
export async function updatePaymentRecord(
  paymentId: number, 
  data: UpdatePaymentRequest
): Promise<PaymentRecord> {
  const response = await axios.put(`${API_BASE}/payment/record/${paymentId}`, data)
  return response.data
}

/**
 * 删除缴费记录
 */
export async function deletePaymentRecord(paymentId: number): Promise<{ success: boolean, message: string }> {
  const response = await axios.delete(`${API_BASE}/payment/record/${paymentId}`)
  return response.data
}

/**
 * 更新缴费汇总（主要用于设置应交金额）
 */
export async function updatePaymentSummary(
  recordId: number, 
  data: UpdateSummaryRequest
): Promise<PaymentSummary> {
  // 使用正确的接口: PUT /payment/amount/{record_id}?应交金额=xxx
  const response = await axios.put(`${API_BASE}/payment/amount/${recordId}?应交金额=${data.应交金额}`)
  return response.data
}

/**
 * 获取缴费汇总
 */
export async function getPaymentSummary(recordId: number): Promise<PaymentSummary> {
  const response = await axios.get(`${API_BASE}/payment/summary/${recordId}`)
  return response.data
}

// 辅助函数：格式化金额显示
export function formatMoney(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '¥0.00'
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 辅助函数：获取缴费状态颜色
export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case '已缴清':
      return 'green'
    case '部分缴费':
      return 'orange'
    case '未缴费':
    default:
      return 'red'
  }
}

// 辅助函数：获取缴费类型颜色
export function getPaymentTypeColor(type: string): string {
  return type === '首款' ? 'blue' : 'purple'
}
