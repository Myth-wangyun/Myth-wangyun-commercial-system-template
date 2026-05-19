import { api } from '../api'

interface ApiTransferApprovalConfigApprover {
  id: number
  approver_user_id: number
  approver_name: string
  approver_department?: string | null
  approver_position?: string | null
  approver_campus?: string | null
  sort_order: number
}

interface ApiTransferApprovalConfig {
  id: number
  campus: string
  is_active: boolean
  approvers: ApiTransferApprovalConfigApprover[]
  created_at: string
  updated_at: string
}

export interface TransferApprovalConfig {
  id: number
  campus: string
  isActive: boolean
  approvers: Array<{
    id: number
    approverUserId: number
    approverName: string
    approverDepartment?: string | null
    approverPosition?: string | null
    approverCampus?: string | null
    sortOrder: number
  }>
  createdAt: string
  updatedAt: string
}

export interface TransferApprovalConfigPayload {
  approverUserIds: number[]
  isActive?: boolean
}

const mapConfig = (record: ApiTransferApprovalConfig): TransferApprovalConfig => ({
  id: record.id,
  campus: record.campus,
  isActive: record.is_active,
  approvers: record.approvers.map((item) => ({
    id: item.id,
    approverUserId: item.approver_user_id,
    approverName: item.approver_name,
    approverDepartment: item.approver_department,
    approverPosition: item.approver_position,
    approverCampus: item.approver_campus,
    sortOrder: item.sort_order,
  })),
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

export async function listTransferApprovalConfigs(
  campus?: string,
): Promise<TransferApprovalConfig[]> {
  const response = await api.get<ApiTransferApprovalConfig[]>('/config/transfer-approvers', {
    params: { campus },
  })
  return (response.data || []).map(mapConfig)
}

export async function upsertTransferApprovalConfig(
  campus: string,
  payload: TransferApprovalConfigPayload,
): Promise<TransferApprovalConfig> {
  const response = await api.put<ApiTransferApprovalConfig>(
    `/config/transfer-approvers/${encodeURIComponent(campus)}`,
    {
      approver_user_ids: payload.approverUserIds,
      is_active: payload.isActive ?? true,
    },
  )
  return mapConfig(response.data)
}
