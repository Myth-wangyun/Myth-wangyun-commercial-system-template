import { api } from '../api'

export type UnpaidLeaveStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type UnpaidLeaveStage = 'department_head' | 'biz_director' | 'hr' | 'chairman'

export interface UnpaidLeaveApproverCandidate {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface UnpaidLeaveApprovalPreviewStage {
  stage: UnpaidLeaveStage
  stageLabel: string
  recommendedUserIds: number[]
  approvers: UnpaidLeaveApproverCandidate[]
}

interface ApiUnpaidLeaveCurrentApprover {
  user_id: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

interface ApiUnpaidLeaveApprovalAction {
  id: number
  stage: string
  stage_label: string
  action: string
  approver_user_id?: number | null
  approver_name?: string | null
  comment?: string | null
  created_at: string
}

interface ApiUnpaidLeaveApprovalFlowStep {
  stage: string
  stage_label: string
  status: string
  status_label: string
  approvers: ApiUnpaidLeaveCurrentApprover[]
  action?: string | null
  action_label?: string | null
  acted_by_user_id?: number | null
  acted_by_name?: string | null
  comment?: string | null
  acted_at?: string | null
}

interface ApiUnpaidLeaveApplicationRecord {
  id: number
  application_no: string
  fill_date: string
  campus: string
  name: string
  gender?: string | null
  department: string
  position: string
  entry_date: string
  birth_date?: string | null
  phone?: string | null
  email?: string | null
  home_address?: string | null
  current_address?: string | null
  reason: string
  created_by_user_id?: number | null
  created_by_name?: string | null
  department_head_opinion?: string | null
  department_head_passed?: boolean | null
  biz_director_opinion?: string | null
  biz_director_passed?: boolean | null
  hr_opinion?: string | null
  hr_passed?: boolean | null
  chairman_opinion?: string | null
  chairman_passed?: boolean | null
  is_passed?: boolean | null
  status: UnpaidLeaveStatus
  status_label: string
  current_stage?: string | null
  current_stage_label?: string | null
  rejection_reason?: string | null
  submitted_at?: string | null
  completed_at?: string | null
  can_edit: boolean
  can_delete: boolean
  can_submit: boolean
  can_approve: boolean
  selected_approver_user_ids: Partial<Record<UnpaidLeaveStage, number[]>>
  current_approvers: ApiUnpaidLeaveCurrentApprover[]
  approval_flow: ApiUnpaidLeaveApprovalFlowStep[]
  approval_actions: ApiUnpaidLeaveApprovalAction[]
  created_at: string
  updated_at: string
}

interface ApiUnpaidLeaveApprovalPreviewStage {
  stage: UnpaidLeaveStage
  stage_label: string
  recommended_user_ids: number[]
  approvers: ApiUnpaidLeaveCurrentApprover[]
}

export interface UnpaidLeaveCurrentApprover {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface UnpaidLeaveApprovalAction {
  id: number
  stage: string
  stageLabel: string
  action: string
  approverUserId?: number | null
  approverName?: string | null
  comment?: string | null
  createdAt: string
}

export interface UnpaidLeaveApprovalFlowStep {
  stage: string
  stageLabel: string
  status: string
  statusLabel: string
  approvers: UnpaidLeaveCurrentApprover[]
  action?: string | null
  actionLabel?: string | null
  actedByUserId?: number | null
  actedByName?: string | null
  comment?: string | null
  actedAt?: string | null
}

export interface UnpaidLeaveApplicationRecord {
  id: number
  applicationNo: string
  fillDate: string
  campus: string
  name: string
  gender?: string | null
  department: string
  position: string
  entryDate: string
  birthDate?: string | null
  phone?: string | null
  email?: string | null
  homeAddress?: string | null
  currentAddress?: string | null
  reason: string
  createdByUserId?: number | null
  createdByName?: string | null
  departmentHeadOpinion?: string | null
  departmentHeadPassed?: boolean | null
  bizDirectorOpinion?: string | null
  bizDirectorPassed?: boolean | null
  hrOpinion?: string | null
  hrPassed?: boolean | null
  chairmanOpinion?: string | null
  chairmanPassed?: boolean | null
  isPassed?: boolean | null
  status: UnpaidLeaveStatus
  statusLabel: string
  currentStage?: string | null
  currentStageLabel?: string | null
  rejectionReason?: string | null
  submittedAt?: string | null
  completedAt?: string | null
  canEdit: boolean
  canDelete: boolean
  canSubmit: boolean
  canApprove: boolean
  selectedApproverUserIds: Partial<Record<UnpaidLeaveStage, number[]>>
  currentApprovers: UnpaidLeaveCurrentApprover[]
  approvalFlow: UnpaidLeaveApprovalFlowStep[]
  approvalActions: UnpaidLeaveApprovalAction[]
  createdAt: string
  updatedAt: string
}

export interface UnpaidLeaveApplicationPayload {
  fillDate: string
  campus: string
  name: string
  gender?: string | null
  department: string
  position: string
  entryDate: string
  birthDate?: string | null
  phone?: string | null
  email?: string | null
  homeAddress?: string | null
  currentAddress?: string | null
  reason: string
  selectedApproverUserIds?: Partial<Record<UnpaidLeaveStage, number[]>>
}

const mapApplicationPayload = (payload: UnpaidLeaveApplicationPayload) => ({
  fill_date: payload.fillDate,
  campus: payload.campus,
  name: payload.name,
  gender: payload.gender || undefined,
  department: payload.department,
  position: payload.position,
  entry_date: payload.entryDate,
  birth_date: payload.birthDate || undefined,
  phone: payload.phone || undefined,
  email: payload.email || undefined,
  home_address: payload.homeAddress || undefined,
  current_address: payload.currentAddress || undefined,
  reason: payload.reason,
  selected_approver_user_ids: payload.selectedApproverUserIds || {},
})

const mapPartialApplicationPayload = (payload: Partial<UnpaidLeaveApplicationPayload>) => {
  const result: Record<string, unknown> = {}
  if (payload.fillDate !== undefined) result.fill_date = payload.fillDate
  if (payload.campus !== undefined) result.campus = payload.campus
  if (payload.name !== undefined) result.name = payload.name
  if (payload.gender !== undefined) result.gender = payload.gender || undefined
  if (payload.department !== undefined) result.department = payload.department
  if (payload.position !== undefined) result.position = payload.position
  if (payload.entryDate !== undefined) result.entry_date = payload.entryDate
  if (payload.birthDate !== undefined) result.birth_date = payload.birthDate || undefined
  if (payload.phone !== undefined) result.phone = payload.phone || undefined
  if (payload.email !== undefined) result.email = payload.email || undefined
  if (payload.homeAddress !== undefined) result.home_address = payload.homeAddress || undefined
  if (payload.currentAddress !== undefined)
    result.current_address = payload.currentAddress || undefined
  if (payload.reason !== undefined) result.reason = payload.reason
  if (payload.selectedApproverUserIds !== undefined) {
    result.selected_approver_user_ids = payload.selectedApproverUserIds || {}
  }
  return result
}

const mapCurrentApprover = (
  approver: ApiUnpaidLeaveCurrentApprover,
): UnpaidLeaveCurrentApprover => ({
  userId: approver.user_id,
  name: approver.name,
  department: approver.department,
  position: approver.position,
  campus: approver.campus,
})

const mapApprovalPreviewStage = (
  stage: ApiUnpaidLeaveApprovalPreviewStage,
): UnpaidLeaveApprovalPreviewStage => ({
  stage: stage.stage,
  stageLabel: stage.stage_label,
  recommendedUserIds: stage.recommended_user_ids || [],
  approvers: (stage.approvers || []).map(mapCurrentApprover),
})

const mapApplicationRecord = (
  record: ApiUnpaidLeaveApplicationRecord,
): UnpaidLeaveApplicationRecord => ({
  id: record.id,
  applicationNo: record.application_no,
  fillDate: record.fill_date,
  campus: record.campus,
  name: record.name,
  gender: record.gender,
  department: record.department,
  position: record.position,
  entryDate: record.entry_date,
  birthDate: record.birth_date,
  phone: record.phone,
  email: record.email,
  homeAddress: record.home_address,
  currentAddress: record.current_address,
  reason: record.reason,
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  departmentHeadOpinion: record.department_head_opinion,
  departmentHeadPassed: record.department_head_passed,
  bizDirectorOpinion: record.biz_director_opinion,
  bizDirectorPassed: record.biz_director_passed,
  hrOpinion: record.hr_opinion,
  hrPassed: record.hr_passed,
  chairmanOpinion: record.chairman_opinion,
  chairmanPassed: record.chairman_passed,
  isPassed: record.is_passed,
  status: record.status,
  statusLabel: record.status_label,
  currentStage: record.current_stage,
  currentStageLabel: record.current_stage_label,
  rejectionReason: record.rejection_reason,
  submittedAt: record.submitted_at,
  completedAt: record.completed_at,
  canEdit: record.can_edit,
  canDelete: record.can_delete,
  canSubmit: record.can_submit,
  canApprove: record.can_approve,
  selectedApproverUserIds: record.selected_approver_user_ids || {},
  currentApprovers: (record.current_approvers || []).map(mapCurrentApprover),
  approvalFlow: (record.approval_flow || []).map((step) => ({
    stage: step.stage,
    stageLabel: step.stage_label,
    status: step.status,
    statusLabel: step.status_label,
    approvers: (step.approvers || []).map(mapCurrentApprover),
    action: step.action,
    actionLabel: step.action_label,
    actedByUserId: step.acted_by_user_id,
    actedByName: step.acted_by_name,
    comment: step.comment,
    actedAt: step.acted_at,
  })),
  approvalActions: (record.approval_actions || []).map((action) => ({
    id: action.id,
    stage: action.stage,
    stageLabel: action.stage_label,
    action: action.action,
    approverUserId: action.approver_user_id,
    approverName: action.approver_name,
    comment: action.comment,
    createdAt: action.created_at,
  })),
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

export async function listUnpaidLeaveApplications(params?: {
  campus?: string
  status?: UnpaidLeaveStatus
  department?: string
}) {
  const response = await api.get<ApiUnpaidLeaveApplicationRecord[]>(
    '/human-resources/unpaid-leave-applications',
    { params },
  )
  return response.data.map(mapApplicationRecord)
}

export async function getUnpaidLeaveApplication(applicationId: number) {
  const response = await api.get<ApiUnpaidLeaveApplicationRecord>(
    `/human-resources/unpaid-leave-applications/${applicationId}`,
  )
  return mapApplicationRecord(response.data)
}

export async function createUnpaidLeaveApplication(payload: UnpaidLeaveApplicationPayload) {
  const response = await api.post<ApiUnpaidLeaveApplicationRecord>(
    '/human-resources/unpaid-leave-applications',
    mapApplicationPayload(payload),
  )
  return mapApplicationRecord(response.data)
}

export async function updateUnpaidLeaveApplication(
  applicationId: number,
  payload: Partial<UnpaidLeaveApplicationPayload>,
) {
  const response = await api.put<ApiUnpaidLeaveApplicationRecord>(
    `/human-resources/unpaid-leave-applications/${applicationId}`,
    mapPartialApplicationPayload(payload),
  )
  return mapApplicationRecord(response.data)
}

export async function deleteUnpaidLeaveApplication(applicationId: number) {
  await api.delete(`/human-resources/unpaid-leave-applications/${applicationId}`)
}

export async function submitUnpaidLeaveApplication(applicationId: number) {
  const response = await api.post<ApiUnpaidLeaveApplicationRecord>(
    `/human-resources/unpaid-leave-applications/${applicationId}/submit`,
  )
  return mapApplicationRecord(response.data)
}

export async function approveUnpaidLeaveApplication(applicationId: number, comment?: string) {
  const response = await api.post<ApiUnpaidLeaveApplicationRecord>(
    `/human-resources/unpaid-leave-applications/${applicationId}/approve`,
    { comment },
  )
  return mapApplicationRecord(response.data)
}

export async function rejectUnpaidLeaveApplication(applicationId: number, comment: string) {
  const response = await api.post<ApiUnpaidLeaveApplicationRecord>(
    `/human-resources/unpaid-leave-applications/${applicationId}/reject`,
    { comment },
  )
  return mapApplicationRecord(response.data)
}

export async function previewUnpaidLeaveApproverCandidates(payload: {
  campus: string
  department: string
  position: string
}) {
  const response = await api.post<ApiUnpaidLeaveApprovalPreviewStage[]>(
    '/human-resources/unpaid-leave-applications/approver-preview',
    {
      campus: payload.campus,
      department: payload.department,
      position: payload.position,
    },
  )
  return response.data.map(mapApprovalPreviewStage)
}
