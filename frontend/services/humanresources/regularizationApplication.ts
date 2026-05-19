import { api, HR_HEAVY_WRITE_TIMEOUT_MS } from '../api'

export type RegularizationStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type RegularizationStage =
  | 'department_head'
  | 'vice_principal'
  | 'principal'
  | 'hr'
  | 'chairman'

export interface RegularizationApproverCandidate {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface RegularizationApprovalPreviewStage {
  stage: RegularizationStage
  stageLabel: string
  recommendedUserIds: number[]
  approvers: RegularizationApproverCandidate[]
}

interface ApiRegularizationCurrentApprover {
  user_id: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

interface ApiRegularizationApprovalAction {
  id: number
  stage: string
  stage_label: string
  action: string
  approver_user_id?: number | null
  approver_name?: string | null
  comment?: string | null
  created_at: string
}

interface ApiRegularizationApprovalFlowStep {
  stage: string
  stage_label: string
  status: string
  status_label: string
  approvers: ApiRegularizationCurrentApprover[]
  action?: string | null
  action_label?: string | null
  acted_by_user_id?: number | null
  acted_by_name?: string | null
  comment?: string | null
  acted_at?: string | null
}

interface ApiRegularizationApplicationRecord {
  id: number
  application_no: string
  fill_date: string
  campus: string
  name: string
  department: string
  position: string
  gender?: string | null
  entry_date: string
  regular_salary?: number | null
  probation_start: string
  probation_end: string
  probation_salary?: number | null
  main_work: string
  suggestion?: string | null
  self_evaluation: string
  created_by_user_id?: number | null
  created_by_name?: string | null
  department_head_opinion?: string | null
  department_head_passed?: boolean | null
  vice_principal_opinion?: string | null
  vice_principal_passed?: boolean | null
  hr_opinion?: string | null
  hr_passed?: boolean | null
  principal_opinion?: string | null
  principal_passed?: boolean | null
  chairman_opinion?: string | null
  chairman_passed?: boolean | null
  is_passed?: boolean | null
  status: RegularizationStatus
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
  selected_approver_user_ids: Partial<Record<RegularizationStage, number[]>>
  current_approvers: ApiRegularizationCurrentApprover[]
  approval_flow: ApiRegularizationApprovalFlowStep[]
  approval_actions: ApiRegularizationApprovalAction[]
  created_at: string
  updated_at: string
}

export interface RegularizationCurrentApprover {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface RegularizationApprovalAction {
  id: number
  stage: string
  stageLabel: string
  action: string
  approverUserId?: number | null
  approverName?: string | null
  comment?: string | null
  createdAt: string
}

export interface RegularizationApprovalFlowStep {
  stage: string
  stageLabel: string
  status: string
  statusLabel: string
  approvers: RegularizationCurrentApprover[]
  action?: string | null
  actionLabel?: string | null
  actedByUserId?: number | null
  actedByName?: string | null
  comment?: string | null
  actedAt?: string | null
}

export interface RegularizationApplicationRecord {
  id: number
  applicationNo: string
  fillDate: string
  campus: string
  name: string
  department: string
  position: string
  gender?: string | null
  entryDate: string
  regularSalary?: number | null
  probationStart: string
  probationEnd: string
  probationSalary?: number | null
  mainWork: string
  suggestion?: string | null
  selfEvaluation: string
  createdByUserId?: number | null
  createdByName?: string | null
  departmentHeadOpinion?: string | null
  departmentHeadPassed?: boolean | null
  vicePrincipalOpinion?: string | null
  vicePrincipalPassed?: boolean | null
  hrOpinion?: string | null
  hrPassed?: boolean | null
  principalOpinion?: string | null
  principalPassed?: boolean | null
  chairmanOpinion?: string | null
  chairmanPassed?: boolean | null
  isPassed?: boolean | null
  status: RegularizationStatus
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
  selectedApproverUserIds: Partial<Record<RegularizationStage, number[]>>
  currentApprovers: RegularizationCurrentApprover[]
  approvalFlow: RegularizationApprovalFlowStep[]
  approvalActions: RegularizationApprovalAction[]
  createdAt: string
  updatedAt: string
}

export interface RegularizationApplicationPayload {
  fillDate: string
  campus: string
  name: string
  department: string
  position: string
  gender?: string | null
  entryDate: string
  regularSalary?: number | null
  probationStart: string
  probationEnd: string
  probationSalary?: number | null
  mainWork: string
  suggestion?: string | null
  selfEvaluation: string
  selectedApproverUserIds?: Partial<Record<RegularizationStage, number[]>>
}

interface ApiRegularizationApprovalPreviewStage {
  stage: RegularizationStage
  stage_label: string
  recommended_user_ids: number[]
  approvers: ApiRegularizationCurrentApprover[]
}

interface ApiRegularizationApprovalConfigApprover {
  id: number
  approver_user_id: number
  approver_name: string
  approver_department?: string | null
  approver_position?: string | null
  approver_campus?: string | null
  sort_order: number
}

interface ApiRegularizationApprovalConfig {
  id: number
  campus: string
  apply_department?: string | null
  apply_position?: string | null
  stage: RegularizationStage
  stage_label: string
  is_active: boolean
  approvers: ApiRegularizationApprovalConfigApprover[]
  created_at: string
  updated_at: string
}

export interface RegularizationApprovalConfig {
  id: number
  campus: string
  applyDepartment?: string | null
  applyPosition?: string | null
  stage: RegularizationStage
  stageLabel: string
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

export interface RegularizationApprovalConfigPayload {
  campus: string
  applyDepartment?: string | null
  applyPosition?: string | null
  stage: RegularizationStage
  approverUserIds: number[]
  isActive: boolean
}

const mapApplicationPayload = (payload: RegularizationApplicationPayload) => ({
  fill_date: payload.fillDate,
  campus: payload.campus,
  name: payload.name,
  department: payload.department,
  position: payload.position,
  gender: payload.gender || undefined,
  entry_date: payload.entryDate,
  regular_salary: payload.regularSalary ?? undefined,
  probation_start: payload.probationStart,
  probation_end: payload.probationEnd,
  probation_salary: payload.probationSalary ?? undefined,
  main_work: payload.mainWork,
  suggestion: payload.suggestion || undefined,
  self_evaluation: payload.selfEvaluation,
  selected_approver_user_ids: payload.selectedApproverUserIds || {},
})

const mapPartialApplicationPayload = (payload: Partial<RegularizationApplicationPayload>) => {
  const result: Record<string, unknown> = {}
  if (payload.fillDate !== undefined) result.fill_date = payload.fillDate
  if (payload.campus !== undefined) result.campus = payload.campus
  if (payload.name !== undefined) result.name = payload.name
  if (payload.department !== undefined) result.department = payload.department
  if (payload.position !== undefined) result.position = payload.position
  if (payload.gender !== undefined) result.gender = payload.gender || undefined
  if (payload.entryDate !== undefined) result.entry_date = payload.entryDate
  if (payload.regularSalary !== undefined) result.regular_salary = payload.regularSalary ?? undefined
  if (payload.probationStart !== undefined) result.probation_start = payload.probationStart
  if (payload.probationEnd !== undefined) result.probation_end = payload.probationEnd
  if (payload.probationSalary !== undefined) result.probation_salary = payload.probationSalary ?? undefined
  if (payload.mainWork !== undefined) result.main_work = payload.mainWork
  if (payload.suggestion !== undefined) result.suggestion = payload.suggestion || undefined
  if (payload.selfEvaluation !== undefined) result.self_evaluation = payload.selfEvaluation
  if (payload.selectedApproverUserIds !== undefined) {
    result.selected_approver_user_ids = payload.selectedApproverUserIds || {}
  }
  return result
}

const mapApplicationRecord = (
  record: ApiRegularizationApplicationRecord,
): RegularizationApplicationRecord => ({
  id: record.id,
  applicationNo: record.application_no,
  fillDate: record.fill_date,
  campus: record.campus,
  name: record.name,
  department: record.department,
  position: record.position,
  gender: record.gender,
  entryDate: record.entry_date,
  regularSalary: record.regular_salary,
  probationStart: record.probation_start,
  probationEnd: record.probation_end,
  probationSalary: record.probation_salary,
  mainWork: record.main_work,
  suggestion: record.suggestion,
  selfEvaluation: record.self_evaluation,
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  departmentHeadOpinion: record.department_head_opinion,
  departmentHeadPassed: record.department_head_passed,
  vicePrincipalOpinion: record.vice_principal_opinion,
  vicePrincipalPassed: record.vice_principal_passed,
  hrOpinion: record.hr_opinion,
  hrPassed: record.hr_passed,
  principalOpinion: record.principal_opinion,
  principalPassed: record.principal_passed,
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

const mapPreviewStage = (
  stage: ApiRegularizationApprovalPreviewStage,
): RegularizationApprovalPreviewStage => ({
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

const mapApprovalConfigRecord = (
  record: ApiRegularizationApprovalConfig,
): RegularizationApprovalConfig => ({
  id: record.id,
  campus: record.campus,
  applyDepartment: record.apply_department,
  applyPosition: record.apply_position,
  stage: record.stage,
  stageLabel: record.stage_label,
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

export async function listRegularizationApplications(params?: {
  campus?: string
  status?: RegularizationStatus
  department?: string
}) {
  const response = await api.get<ApiRegularizationApplicationRecord[]>(
    '/human-resources/regularization-applications',
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

export async function getRegularizationApplication(applicationId: number) {
  const response = await api.get<ApiRegularizationApplicationRecord>(
    `/human-resources/regularization-applications/${applicationId}`,
  )
  return mapApplicationRecord(response.data)
}

export async function createRegularizationApplication(payload: RegularizationApplicationPayload) {
  const response = await api.post<ApiRegularizationApplicationRecord>(
    '/human-resources/regularization-applications',
    mapApplicationPayload(payload),
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapApplicationRecord(response.data)
}

export async function updateRegularizationApplication(
  applicationId: number,
  payload: Partial<RegularizationApplicationPayload>,
) {
  const response = await api.put<ApiRegularizationApplicationRecord>(
    `/human-resources/regularization-applications/${applicationId}`,
    mapPartialApplicationPayload(payload),
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapApplicationRecord(response.data)
}

export async function deleteRegularizationApplication(applicationId: number) {
  await api.delete(`/human-resources/regularization-applications/${applicationId}`, {
    timeout: HR_HEAVY_WRITE_TIMEOUT_MS,
  })
}

export async function submitRegularizationApplication(applicationId: number) {
  const response = await api.post<ApiRegularizationApplicationRecord>(
    `/human-resources/regularization-applications/${applicationId}/submit`,
    undefined,
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapApplicationRecord(response.data)
}

export async function approveRegularizationApplication(applicationId: number, comment?: string) {
  const response = await api.post<ApiRegularizationApplicationRecord>(
    `/human-resources/regularization-applications/${applicationId}/approve`,
    {
      comment: comment || undefined,
    },
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapApplicationRecord(response.data)
}

export async function rejectRegularizationApplication(applicationId: number, comment: string) {
  const response = await api.post<ApiRegularizationApplicationRecord>(
    `/human-resources/regularization-applications/${applicationId}/reject`,
    {
      comment,
    },
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapApplicationRecord(response.data)
}

export async function listRegularizationApprovalConfigs(params?: {
  campus?: string
  applyDepartment?: string
  applyPosition?: string
  stage?: RegularizationStage
}) {
  const response = await api.get<ApiRegularizationApprovalConfig[]>(
    '/human-resources/regularization-approval-configs',
    {
      params: {
        campus: params?.campus || undefined,
        apply_department: params?.applyDepartment || undefined,
        apply_position: params?.applyPosition || undefined,
        stage: params?.stage || undefined,
      },
    },
  )
  return (response.data || []).map(mapApprovalConfigRecord)
}

export async function upsertRegularizationApprovalConfig(
  payload: RegularizationApprovalConfigPayload,
) {
  const response = await api.put<ApiRegularizationApprovalConfig>(
    '/human-resources/regularization-approval-configs',
    {
      campus: payload.campus,
      apply_department: payload.applyDepartment || undefined,
      apply_position: payload.applyPosition || undefined,
      stage: payload.stage,
      approver_user_ids: payload.approverUserIds,
      is_active: payload.isActive,
    },
  )
  return mapApprovalConfigRecord(response.data)
}

export async function deleteRegularizationApprovalConfig(configId: number) {
  const response = await api.delete<{ success: boolean }>(
    `/human-resources/regularization-approval-configs/${configId}`,
  )
  return response.data
}

export async function previewRegularizationApproverCandidates(payload: {
  campus: string
  department: string
  position: string
}) {
  const response = await api.post<ApiRegularizationApprovalPreviewStage[]>(
    '/human-resources/regularization-applications/approver-preview',
    payload,
  )
  return (response.data || []).map(mapPreviewStage)
}
