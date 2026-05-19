import { api } from '@/services/api'

const BASE_URL = '/consult'

export interface PendingTransferApprovalRecord {
  recordId: number
  phone: string
  name: string
  sourceConsultant: string
  targetConsultant: string
  sourceCampus: string
  targetCampus: string
  applyTime: string
  applicant: string
  reason: string
}

export interface ConsultantTransferConsultantInfo {
  name: string
  campus: string
  recordCount: number
}

interface ApiPendingTransferApprovalRecord {
  record_id: number
  phone: string
  name: string
  source_consultant: string
  target_consultant: string
  source_campus: string
  target_campus: string
  apply_time: string
  applicant: string
  reason: string
}

interface ApiConsultantTransferConsultantInfo {
  name: string
  campus: string
  record_count: number
}

interface TransferApprovalResponse {
  success: boolean
  message: string
  approved_count: number
  rejected_count: number
}

const mapPendingTransferApprovalRecord = (
  item: ApiPendingTransferApprovalRecord,
): PendingTransferApprovalRecord => ({
  recordId: item.record_id,
  phone: item.phone,
  name: item.name,
  sourceConsultant: item.source_consultant,
  targetConsultant: item.target_consultant,
  sourceCampus: item.source_campus,
  targetCampus: item.target_campus,
  applyTime: item.apply_time,
  applicant: item.applicant,
  reason: item.reason,
})

const mapConsultantTransferConsultantInfo = (
  item: ApiConsultantTransferConsultantInfo,
): ConsultantTransferConsultantInfo => ({
  name: item.name,
  campus: item.campus,
  recordCount: item.record_count,
})

export async function listPendingTransferApprovals(
  campus?: string,
): Promise<PendingTransferApprovalRecord[]> {
  const response = await api.get<ApiPendingTransferApprovalRecord[]>(
    `${BASE_URL}/consultant-transfer/pending-approvals`,
    { params: { campus } },
  )
  return (response.data || []).map(mapPendingTransferApprovalRecord)
}

export async function listTransferConsultants(
  campus?: string,
): Promise<ConsultantTransferConsultantInfo[]> {
  const response = await api.get<ApiConsultantTransferConsultantInfo[]>(
    `${BASE_URL}/consultant-transfer/consultants`,
    { params: { campus } },
  )
  return (response.data || []).map(mapConsultantTransferConsultantInfo)
}

export async function handleTransferApproval(payload: {
  recordIds: number[]
  approved: boolean
  opinion: string
  targetConsultant?: string
}) {
  const response = await api.post<TransferApprovalResponse>(
    `${BASE_URL}/consultant-transfer/approve`,
    {
      record_ids: payload.recordIds,
      approved: payload.approved,
      opinion: payload.opinion,
    },
    {
      params: {
        target_consultant: payload.approved ? payload.targetConsultant : '',
      },
    },
  )
  return response.data
}
