import { api } from '@/services/api'

const BASE_URL = '/consult/export'

export interface ExportApprovalRequest {
  id: number
  applicantId: number
  applicantName: string
  applicantCampus?: string
  reason: string
  totalRecords: number
  status: 'pending' | 'approved' | 'rejected'
  approverId?: number
  approverName?: string
  approvalTime?: string
  approvalComment?: string
  createdAt: string
  updatedAt: string
}

interface ApiExportApprovalRequest {
  id: number
  applicant_id: number
  applicant_name: string
  applicant_campus?: string
  reason: string
  total_records: number
  status: 'pending' | 'approved' | 'rejected'
  approver_id?: number
  approver_name?: string
  approval_time?: string
  approval_comment?: string
  created_at: string
  updated_at: string
}

interface ExportRequestListResponse {
  data: ApiExportApprovalRequest[]
  total: number
  page: number
  page_size: number
}

const mapExportApprovalRequest = (item: ApiExportApprovalRequest): ExportApprovalRequest => ({
  id: item.id,
  applicantId: item.applicant_id,
  applicantName: item.applicant_name,
  applicantCampus: item.applicant_campus,
  reason: item.reason,
  totalRecords: item.total_records,
  status: item.status,
  approverId: item.approver_id,
  approverName: item.approver_name,
  approvalTime: item.approval_time,
  approvalComment: item.approval_comment,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
})

export async function listPendingExportApprovalRequests(): Promise<ExportApprovalRequest[]> {
  const response = await api.get<ExportRequestListResponse>(`${BASE_URL}/pending-requests`, {
    params: { page: 1, page_size: 100 },
  })
  return (response.data?.data || []).map(mapExportApprovalRequest)
}

export async function checkExportApprovalPermission(): Promise<boolean> {
  const response = await api.get<{ is_approver: boolean }>(`${BASE_URL}/check-approver`)
  return !!response.data?.is_approver
}

export async function approveExportApprovalRequest(requestId: number, comment?: string) {
  const response = await api.post<{ success: boolean }>(
    `${BASE_URL}/request/${requestId}/approve`,
    comment ? { comment } : undefined,
  )
  return response.data
}

export async function rejectExportApprovalRequest(requestId: number, comment: string) {
  const response = await api.post<{ success: boolean }>(`${BASE_URL}/request/${requestId}/reject`, {
    comment,
  })
  return response.data
}
