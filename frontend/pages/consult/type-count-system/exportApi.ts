/**
 * 咨询量导出审批 API
 */

import { api } from '@/services/api'
import type { ConsultationQueryParams } from './types'

const BASE_URL = '/consult/export'

// ==================== 类型定义 ====================

export interface ExportRequest {
  id: number
  applicant_id: number
  applicant_name: string
  applicant_campus?: string
  reason: string
  filters: ConsultationQueryParams
  total_records: number
  status: 'pending' | 'approved' | 'rejected'
  approver_id?: number
  approver_name?: string
  approval_time?: string
  approval_comment?: string
  download_url?: string
  download_expires_at?: string
  created_at: string
  updated_at: string
}

export interface CreateExportRequestData {
  reason: string
  filters: ConsultationQueryParams
  total_records: number
}

export interface ApproveExportRequestData {
  comment?: string
}

export interface RejectExportRequestData {
  comment: string
}

export interface ExportRequestListResponse {
  data: ExportRequest[]
  total: number
  page: number
  page_size: number
}

// ==================== API 函数 ====================

/**
 * 创建导出申请
 */
export async function createExportRequest(data: CreateExportRequestData): Promise<{ success: boolean; data: ExportRequest }> {
  const response = await api.post(`${BASE_URL}/request`, data)
  return response.data
}

/**
 * 获取我的导出申请列表
 */
export async function getMyExportRequests(params?: {
  page?: number
  page_size?: number
  status?: 'pending' | 'approved' | 'rejected'
}): Promise<ExportRequestListResponse> {
  const response = await api.get(`${BASE_URL}/my-requests`, { params })
  return response.data
}

/**
 * 获取待审批的导出申请列表（审批人专用）
 */
export async function getPendingExportRequests(params?: {
  page?: number
  page_size?: number
}): Promise<ExportRequestListResponse> {
  const response = await api.get(`${BASE_URL}/pending-requests`, { params })
  return response.data
}

/**
 * 获取所有导出申请列表（审批人专用）
 */
export async function getAllExportRequests(params?: {
  page?: number
  page_size?: number
  status?: 'pending' | 'approved' | 'rejected'
  applicant_name?: string
}): Promise<ExportRequestListResponse> {
  const response = await api.get(`${BASE_URL}/all-requests`, { params })
  return response.data
}

/**
 * 审批通过导出申请
 */
export async function approveExportRequest(
  requestId: number, 
  data?: ApproveExportRequestData
): Promise<{ success: boolean; data: ExportRequest }> {
  const response = await api.post(`${BASE_URL}/request/${requestId}/approve`, data)
  return response.data
}

/**
 * 驳回导出申请
 */
export async function rejectExportRequest(
  requestId: number, 
  data: RejectExportRequestData
): Promise<{ success: boolean; data: ExportRequest }> {
  const response = await api.post(`${BASE_URL}/request/${requestId}/reject`, data)
  return response.data
}

/**
 * 下载导出文件（需要已审批通过）
 */
export async function downloadExportFile(requestId: number): Promise<void> {
  // 使用 window.open 触发下载
  const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1]
  window.open(`/api${BASE_URL}/request/${requestId}/download`, '_blank')
}

/**
 * 获取导出申请详情
 */
export async function getExportRequestDetail(requestId: number): Promise<{ success: boolean; data: ExportRequest }> {
  const response = await api.get(`${BASE_URL}/request/${requestId}`)
  return response.data
}

/**
 * 撤销导出申请（仅限待审批状态）
 */
export async function cancelExportRequest(requestId: number): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`${BASE_URL}/request/${requestId}`)
  return response.data
}

// ==================== 审批人配置 API ====================

export interface ExportApprover {
  id: number
  user_id: number
  user_name: string
  real_name: string
  is_active: boolean
  created_at: string
}

/**
 * 获取导出审批人列表
 */
export async function getExportApprovers(): Promise<{ data: ExportApprover[] }> {
  const response = await api.get(`${BASE_URL}/approvers`)
  return response.data
}

/**
 * 添加导出审批人
 */
export async function addExportApprover(userId: number): Promise<{ success: boolean; data: ExportApprover }> {
  const response = await api.post(`${BASE_URL}/approvers`, { user_id: userId })
  return response.data
}

/**
 * 移除导出审批人
 */
export async function removeExportApprover(approverId: number): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`${BASE_URL}/approvers/${approverId}`)
  return response.data
}

/**
 * 检查当前用户是否是审批人
 */
export async function checkIsApprover(): Promise<{ is_approver: boolean }> {
  const response = await api.get(`${BASE_URL}/check-approver`)
  return response.data
}
