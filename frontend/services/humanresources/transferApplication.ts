import { api } from '../api'

export type TransferStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type TransferStage =
  | 'out_department_manager'
  | 'hr_first_review'
  | 'in_department_manager'
  | 'biz_director'
  | 'hr_final_review'
  | 'chairman'

export interface TransferApproverCandidate {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface TransferApprovalPreviewStage {
  stage: TransferStage
  stageLabel: string
  recommendedUserIds: number[]
  approvers: TransferApproverCandidate[]
}

interface ApiTransferCurrentApprover {
  user_id: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

interface ApiTransferApprovalAction {
  id: number
  stage: string
  stage_label: string
  action: string
  approver_user_id?: number | null
  approver_name?: string | null
  comment?: string | null
  created_at: string
}

interface ApiTransferApprovalFlowStep {
  stage: string
  stage_label: string
  status: string
  status_label: string
  approvers: ApiTransferCurrentApprover[]
  action?: string | null
  action_label?: string | null
  acted_by_user_id?: number | null
  acted_by_name?: string | null
  comment?: string | null
  acted_at?: string | null
}

interface ApiTransferApplicationRecord {
  id: number
  application_no: string
  apply_date: string
  campus: string
  name: string
  department: string
  position: string
  entry_date: string
  original_salary?: number | null
  target_department: string
  target_position: string
  new_base_salary?: number | null
  new_performance_salary?: number | null
  new_salary?: number | null
  reason: string
  applicant_name?: string | null
  created_by_user_id?: number | null
  created_by_name?: string | null
  out_department_manager_opinion?: string | null
  out_department_manager_passed?: boolean | null
  hr_first_review_opinion?: string | null
  hr_first_review_passed?: boolean | null
  in_department_manager_opinion?: string | null
  in_department_manager_passed?: boolean | null
  biz_director_opinion?: string | null
  biz_director_passed?: boolean | null
  hr_final_review_opinion?: string | null
  hr_final_review_passed?: boolean | null
  chairman_opinion?: string | null
  chairman_passed?: boolean | null
  is_passed?: boolean | null
  status: TransferStatus
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
  selected_approver_user_ids: Partial<Record<TransferStage, number[]>>
  current_approvers: ApiTransferCurrentApprover[]
  approval_flow: ApiTransferApprovalFlowStep[]
  approval_actions: ApiTransferApprovalAction[]
  created_at: string
  updated_at: string
}

interface ApiTransferApprovalPreviewStage {
  stage: TransferStage
  stage_label: string
  recommended_user_ids: number[]
  approvers: ApiTransferCurrentApprover[]
}

export interface TransferCurrentApprover {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface TransferApprovalAction {
  id: number
  stage: string
  stageLabel: string
  action: string
  approverUserId?: number | null
  approverName?: string | null
  comment?: string | null
  createdAt: string
}

export interface TransferApprovalFlowStep {
  stage: string
  stageLabel: string
  status: string
  statusLabel: string
  approvers: TransferCurrentApprover[]
  action?: string | null
  actionLabel?: string | null
  actedByUserId?: number | null
  actedByName?: string | null
  comment?: string | null
  actedAt?: string | null
}

export interface TransferApplicationRecord {
  id: number
  applicationNo: string
  applyDate: string
  campus: string
  name: string
  department: string
  position: string
  entryDate: string
  originalSalary?: number | null
  targetDepartment: string
  targetPosition: string
  newBaseSalary?: number | null
  newPerformanceSalary?: number | null
  newSalary?: number | null
  reason: string
  applicantName?: string | null
  createdByUserId?: number | null
  createdByName?: string | null
  outDepartmentManagerOpinion?: string | null
  outDepartmentManagerPassed?: boolean | null
  hrFirstReviewOpinion?: string | null
  hrFirstReviewPassed?: boolean | null
  inDepartmentManagerOpinion?: string | null
  inDepartmentManagerPassed?: boolean | null
  bizDirectorOpinion?: string | null
  bizDirectorPassed?: boolean | null
  hrFinalReviewOpinion?: string | null
  hrFinalReviewPassed?: boolean | null
  chairmanOpinion?: string | null
  chairmanPassed?: boolean | null
  isPassed?: boolean | null
  status: TransferStatus
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
  selectedApproverUserIds: Partial<Record<TransferStage, number[]>>
  currentApprovers: TransferCurrentApprover[]
  approvalFlow: TransferApprovalFlowStep[]
  approvalActions: TransferApprovalAction[]
  createdAt: string
  updatedAt: string
}

export interface TransferApplicationPayload {
  applyDate: string
  campus: string
  name: string
  department: string
  position: string
  entryDate: string
  originalSalary?: number | null
  targetDepartment: string
  targetPosition: string
  newBaseSalary?: number | null
  newPerformanceSalary?: number | null
  newSalary?: number | null
  reason: string
  applicantName?: string | null
  selectedApproverUserIds?: Partial<Record<TransferStage, number[]>>
}

export interface TransferApprovalActionPayload {
  comment?: string
  newBaseSalary?: number | null
  newPerformanceSalary?: number | null
  newSalary?: number | null
}

const mapApplicationPayload = (payload: TransferApplicationPayload) => ({
  apply_date: payload.applyDate,
  campus: payload.campus,
  name: payload.name,
  department: payload.department,
  position: payload.position,
  entry_date: payload.entryDate,
  original_salary: payload.originalSalary ?? undefined,
  target_department: payload.targetDepartment,
  target_position: payload.targetPosition,
  new_base_salary: payload.newBaseSalary ?? undefined,
  new_performance_salary: payload.newPerformanceSalary ?? undefined,
  new_salary: payload.newSalary ?? undefined,
  reason: payload.reason,
  applicant_name: payload.applicantName || undefined,
  selected_approver_user_ids: payload.selectedApproverUserIds || {},
})

const mapPartialApplicationPayload = (payload: Partial<TransferApplicationPayload>) => {
  const result: Record<string, unknown> = {}
  if (payload.applyDate !== undefined) result.apply_date = payload.applyDate
  if (payload.campus !== undefined) result.campus = payload.campus
  if (payload.name !== undefined) result.name = payload.name
  if (payload.department !== undefined) result.department = payload.department
  if (payload.position !== undefined) result.position = payload.position
  if (payload.entryDate !== undefined) result.entry_date = payload.entryDate
  if (payload.originalSalary !== undefined)
    result.original_salary = payload.originalSalary ?? undefined
  if (payload.targetDepartment !== undefined) result.target_department = payload.targetDepartment
  if (payload.targetPosition !== undefined) result.target_position = payload.targetPosition
  if (payload.newBaseSalary !== undefined)
    result.new_base_salary = payload.newBaseSalary ?? undefined
  if (payload.newPerformanceSalary !== undefined)
    result.new_performance_salary = payload.newPerformanceSalary ?? undefined
  if (payload.newSalary !== undefined) result.new_salary = payload.newSalary ?? undefined
  if (payload.reason !== undefined) result.reason = payload.reason
  if (payload.applicantName !== undefined)
    result.applicant_name = payload.applicantName || undefined
  if (payload.selectedApproverUserIds !== undefined) {
    result.selected_approver_user_ids = payload.selectedApproverUserIds || {}
  }
  return result
}

const mapApplicationRecord = (record: ApiTransferApplicationRecord): TransferApplicationRecord => ({
  id: record.id,
  applicationNo: record.application_no,
  applyDate: record.apply_date,
  campus: record.campus,
  name: record.name,
  department: record.department,
  position: record.position,
  entryDate: record.entry_date,
  originalSalary: record.original_salary,
  targetDepartment: record.target_department,
  targetPosition: record.target_position,
  newBaseSalary: record.new_base_salary,
  newPerformanceSalary: record.new_performance_salary,
  newSalary: record.new_salary,
  reason: record.reason,
  applicantName: record.applicant_name,
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  outDepartmentManagerOpinion: record.out_department_manager_opinion,
  outDepartmentManagerPassed: record.out_department_manager_passed,
  hrFirstReviewOpinion: record.hr_first_review_opinion,
  hrFirstReviewPassed: record.hr_first_review_passed,
  inDepartmentManagerOpinion: record.in_department_manager_opinion,
  inDepartmentManagerPassed: record.in_department_manager_passed,
  bizDirectorOpinion: record.biz_director_opinion,
  bizDirectorPassed: record.biz_director_passed,
  hrFinalReviewOpinion: record.hr_final_review_opinion,
  hrFinalReviewPassed: record.hr_final_review_passed,
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
  currentApprovers: record.current_approvers.map((item) => ({
    userId: item.user_id,
    name: item.name,
    department: item.department,
    position: item.position,
    campus: item.campus,
  })),
  approvalFlow: record.approval_flow.map((item) => ({
    stage: item.stage,
    stageLabel: item.stage_label,
    status: item.status,
    statusLabel: item.status_label,
    approvers: item.approvers.map((approver) => ({
      userId: approver.user_id,
      name: approver.name,
      department: approver.department,
      position: approver.position,
      campus: approver.campus,
    })),
    action: item.action,
    actionLabel: item.action_label,
    actedByUserId: item.acted_by_user_id,
    actedByName: item.acted_by_name,
    comment: item.comment,
    actedAt: item.acted_at,
  })),
  approvalActions: record.approval_actions.map((item) => ({
    id: item.id,
    stage: item.stage,
    stageLabel: item.stage_label,
    action: item.action,
    approverUserId: item.approver_user_id,
    approverName: item.approver_name,
    comment: item.comment,
    createdAt: item.created_at,
  })),
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

const mapPreviewStage = (stage: ApiTransferApprovalPreviewStage): TransferApprovalPreviewStage => ({
  stage: stage.stage,
  stageLabel: stage.stage_label,
  recommendedUserIds: stage.recommended_user_ids || [],
  approvers: (stage.approvers || []).map((item) => ({
    userId: item.user_id,
    name: item.name,
    department: item.department,
    position: item.position,
    campus: item.campus,
  })),
})

export async function listTransferApplications(params?: {
  campus?: string
  status?: TransferStatus
  department?: string
}) {
  const response = await api.get<ApiTransferApplicationRecord[]>(
    '/human-resources/transfer-applications',
    {
      params: {
        campus: params?.campus || undefined,
        status: params?.status || undefined,
        department: params?.department || undefined,
      },
    },
  )
  return response.data.map(mapApplicationRecord)
}

export async function getTransferApplication(applicationId: number) {
  const response = await api.get<ApiTransferApplicationRecord>(
    `/human-resources/transfer-applications/${applicationId}`,
  )
  return mapApplicationRecord(response.data)
}

export async function createTransferApplication(payload: TransferApplicationPayload) {
  const response = await api.post<ApiTransferApplicationRecord>(
    '/human-resources/transfer-applications',
    mapApplicationPayload(payload),
  )
  return mapApplicationRecord(response.data)
}

export async function updateTransferApplication(
  applicationId: number,
  payload: Partial<TransferApplicationPayload>,
) {
  const response = await api.put<ApiTransferApplicationRecord>(
    `/human-resources/transfer-applications/${applicationId}`,
    mapPartialApplicationPayload(payload),
  )
  return mapApplicationRecord(response.data)
}

export async function deleteTransferApplication(applicationId: number) {
  await api.delete(`/human-resources/transfer-applications/${applicationId}`)
}

export async function submitTransferApplication(applicationId: number) {
  const response = await api.post<ApiTransferApplicationRecord>(
    `/human-resources/transfer-applications/${applicationId}/submit`,
  )
  return mapApplicationRecord(response.data)
}

export async function approveTransferApplication(
  applicationId: number,
  payload?: TransferApprovalActionPayload,
) {
  const response = await api.post<ApiTransferApplicationRecord>(
    `/human-resources/transfer-applications/${applicationId}/approve`,
    {
      comment: payload?.comment || undefined,
      new_base_salary: payload?.newBaseSalary ?? undefined,
      new_performance_salary: payload?.newPerformanceSalary ?? undefined,
      new_salary: payload?.newSalary ?? undefined,
    },
  )
  return mapApplicationRecord(response.data)
}

export async function rejectTransferApplication(applicationId: number, comment: string) {
  const response = await api.post<ApiTransferApplicationRecord>(
    `/human-resources/transfer-applications/${applicationId}/reject`,
    {
      comment,
    },
  )
  return mapApplicationRecord(response.data)
}

export async function previewTransferApproverCandidates(payload: {
  campus: string
  department: string
  position: string
  targetDepartment: string
  targetPosition: string
}) {
  const response = await api.post<ApiTransferApprovalPreviewStage[]>(
    '/human-resources/transfer-applications/approver-preview',
    {
      campus: payload.campus,
      department: payload.department,
      position: payload.position,
      target_department: payload.targetDepartment,
      target_position: payload.targetPosition,
    },
  )
  return (response.data || []).map(mapPreviewStage)
}
