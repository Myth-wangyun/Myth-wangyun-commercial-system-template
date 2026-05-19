import { api } from '../api'

export type PromotionStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type PromotionStage =
  | 'department_manager'
  | 'principal'
  | 'biz_director'
  | 'hr_director'
  | 'chairman'

export interface PromotionApproverCandidate {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface PromotionApprovalPreviewStage {
  stage: PromotionStage
  stageLabel: string
  recommendedUserIds: number[]
  approvers: PromotionApproverCandidate[]
}

interface ApiPromotionCurrentApprover {
  user_id: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

interface ApiPromotionApprovalAction {
  id: number
  stage: string
  stage_label: string
  action: string
  approver_user_id?: number | null
  approver_name?: string | null
  comment?: string | null
  created_at: string
}

interface ApiPromotionApprovalFlowStep {
  stage: string
  stage_label: string
  status: string
  status_label: string
  approvers: ApiPromotionCurrentApprover[]
  action?: string | null
  action_label?: string | null
  acted_by_user_id?: number | null
  acted_by_name?: string | null
  comment?: string | null
  acted_at?: string | null
}

interface ApiPromotionApplicationRecord {
  id: number
  application_no: string
  fill_date: string
  campus: string
  name: string
  native_place?: string | null
  age?: number | null
  entry_date: string
  department: string
  position: string
  work_overview: string
  promotion_reason: string
  confidence_and_expectation: string
  original_level?: string | null
  original_salary?: number | null
  promoted_level?: string | null
  promoted_base_salary?: number | null
  promoted_performance_salary?: number | null
  promoted_salary?: number | null
  created_by_user_id?: number | null
  created_by_name?: string | null
  department_manager_opinion?: string | null
  department_manager_passed?: boolean | null
  principal_opinion?: string | null
  principal_passed?: boolean | null
  biz_director_opinion?: string | null
  biz_director_passed?: boolean | null
  hr_director_opinion?: string | null
  hr_director_passed?: boolean | null
  chairman_opinion?: string | null
  chairman_passed?: boolean | null
  is_passed?: boolean | null
  status: PromotionStatus
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
  selected_approver_user_ids: Partial<Record<PromotionStage, number[]>>
  current_approvers: ApiPromotionCurrentApprover[]
  approval_flow: ApiPromotionApprovalFlowStep[]
  approval_actions: ApiPromotionApprovalAction[]
  created_at: string
  updated_at: string
}

export interface PromotionCurrentApprover {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface PromotionApprovalAction {
  id: number
  stage: string
  stageLabel: string
  action: string
  approverUserId?: number | null
  approverName?: string | null
  comment?: string | null
  createdAt: string
}

export interface PromotionApprovalFlowStep {
  stage: string
  stageLabel: string
  status: string
  statusLabel: string
  approvers: PromotionCurrentApprover[]
  action?: string | null
  actionLabel?: string | null
  actedByUserId?: number | null
  actedByName?: string | null
  comment?: string | null
  actedAt?: string | null
}

export interface PromotionApplicationRecord {
  id: number
  applicationNo: string
  fillDate: string
  campus: string
  name: string
  nativePlace?: string | null
  age?: number | null
  entryDate: string
  department: string
  position: string
  workOverview: string
  promotionReason: string
  confidenceAndExpectation: string
  originalLevel?: string | null
  originalSalary?: number | null
  promotedLevel?: string | null
  promotedBaseSalary?: number | null
  promotedPerformanceSalary?: number | null
  promotedSalary?: number | null
  createdByUserId?: number | null
  createdByName?: string | null
  departmentManagerOpinion?: string | null
  departmentManagerPassed?: boolean | null
  principalOpinion?: string | null
  principalPassed?: boolean | null
  bizDirectorOpinion?: string | null
  bizDirectorPassed?: boolean | null
  hrDirectorOpinion?: string | null
  hrDirectorPassed?: boolean | null
  chairmanOpinion?: string | null
  chairmanPassed?: boolean | null
  isPassed?: boolean | null
  status: PromotionStatus
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
  selectedApproverUserIds: Partial<Record<PromotionStage, number[]>>
  currentApprovers: PromotionCurrentApprover[]
  approvalFlow: PromotionApprovalFlowStep[]
  approvalActions: PromotionApprovalAction[]
  createdAt: string
  updatedAt: string
}

export interface PromotionApplicationPayload {
  fillDate: string
  campus: string
  name: string
  nativePlace?: string | null
  age?: number | null
  entryDate: string
  department: string
  position: string
  workOverview: string
  promotionReason: string
  confidenceAndExpectation: string
  originalLevel?: string | null
  originalSalary?: number | null
  promotedLevel?: string | null
  promotedBaseSalary?: number | null
  promotedPerformanceSalary?: number | null
  promotedSalary?: number | null
  selectedApproverUserIds?: Partial<Record<PromotionStage, number[]>>
}

export interface PromotionApprovalActionPayload {
  comment?: string
  originalLevel?: string | null
  originalSalary?: number | null
  promotedLevel?: string | null
  promotedBaseSalary?: number | null
  promotedPerformanceSalary?: number | null
  promotedSalary?: number | null
}

interface ApiPromotionApprovalPreviewStage {
  stage: PromotionStage
  stage_label: string
  recommended_user_ids: number[]
  approvers: ApiPromotionCurrentApprover[]
}

interface ApiPromotionApprovalConfigApprover {
  id: number
  approver_user_id: number
  approver_name: string
  approver_department?: string | null
  approver_position?: string | null
  approver_campus?: string | null
  sort_order: number
}

interface ApiPromotionApprovalConfig {
  id: number
  campus: string
  apply_department?: string | null
  apply_position?: string | null
  stage: PromotionStage
  stage_label: string
  is_active: boolean
  approvers: ApiPromotionApprovalConfigApprover[]
  created_at: string
  updated_at: string
}

export interface PromotionApprovalConfig {
  id: number
  campus: string
  applyDepartment?: string | null
  applyPosition?: string | null
  stage: PromotionStage
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

export interface PromotionApprovalConfigPayload {
  campus: string
  applyDepartment?: string | null
  applyPosition?: string | null
  stage: PromotionStage
  approverUserIds: number[]
  isActive: boolean
}

const mapApplicationPayload = (payload: PromotionApplicationPayload) => ({
  fill_date: payload.fillDate,
  campus: payload.campus,
  name: payload.name,
  native_place: payload.nativePlace || undefined,
  age: payload.age ?? undefined,
  entry_date: payload.entryDate,
  department: payload.department,
  position: payload.position,
  work_overview: payload.workOverview,
  promotion_reason: payload.promotionReason,
  confidence_and_expectation: payload.confidenceAndExpectation,
  original_level: payload.originalLevel || undefined,
  original_salary: payload.originalSalary ?? undefined,
  promoted_level: payload.promotedLevel || undefined,
  promoted_base_salary: payload.promotedBaseSalary ?? undefined,
  promoted_performance_salary: payload.promotedPerformanceSalary ?? undefined,
  promoted_salary: payload.promotedSalary ?? undefined,
  selected_approver_user_ids: payload.selectedApproverUserIds || {},
})

const mapPartialApplicationPayload = (payload: Partial<PromotionApplicationPayload>) => {
  const result: Record<string, unknown> = {}
  if (payload.fillDate !== undefined) result.fill_date = payload.fillDate
  if (payload.campus !== undefined) result.campus = payload.campus
  if (payload.name !== undefined) result.name = payload.name
  if (payload.nativePlace !== undefined) result.native_place = payload.nativePlace || undefined
  if (payload.age !== undefined) result.age = payload.age ?? undefined
  if (payload.entryDate !== undefined) result.entry_date = payload.entryDate
  if (payload.department !== undefined) result.department = payload.department
  if (payload.position !== undefined) result.position = payload.position
  if (payload.workOverview !== undefined) result.work_overview = payload.workOverview
  if (payload.promotionReason !== undefined) result.promotion_reason = payload.promotionReason
  if (payload.confidenceAndExpectation !== undefined) {
    result.confidence_and_expectation = payload.confidenceAndExpectation
  }
  if (payload.originalLevel !== undefined) result.original_level = payload.originalLevel || undefined
  if (payload.originalSalary !== undefined) result.original_salary = payload.originalSalary ?? undefined
  if (payload.promotedLevel !== undefined) result.promoted_level = payload.promotedLevel || undefined
  if (payload.promotedBaseSalary !== undefined) {
    result.promoted_base_salary = payload.promotedBaseSalary ?? undefined
  }
  if (payload.promotedPerformanceSalary !== undefined) {
    result.promoted_performance_salary = payload.promotedPerformanceSalary ?? undefined
  }
  if (payload.promotedSalary !== undefined) result.promoted_salary = payload.promotedSalary ?? undefined
  if (payload.selectedApproverUserIds !== undefined) {
    result.selected_approver_user_ids = payload.selectedApproverUserIds || {}
  }
  return result
}

const mapApplicationRecord = (record: ApiPromotionApplicationRecord): PromotionApplicationRecord => ({
  id: record.id,
  applicationNo: record.application_no,
  fillDate: record.fill_date,
  campus: record.campus,
  name: record.name,
  nativePlace: record.native_place,
  age: record.age,
  entryDate: record.entry_date,
  department: record.department,
  position: record.position,
  workOverview: record.work_overview,
  promotionReason: record.promotion_reason,
  confidenceAndExpectation: record.confidence_and_expectation,
  originalLevel: record.original_level,
  originalSalary: record.original_salary,
  promotedLevel: record.promoted_level,
  promotedBaseSalary: record.promoted_base_salary,
  promotedPerformanceSalary: record.promoted_performance_salary,
  promotedSalary: record.promoted_salary,
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  departmentManagerOpinion: record.department_manager_opinion,
  departmentManagerPassed: record.department_manager_passed,
  principalOpinion: record.principal_opinion,
  principalPassed: record.principal_passed,
  bizDirectorOpinion: record.biz_director_opinion,
  bizDirectorPassed: record.biz_director_passed,
  hrDirectorOpinion: record.hr_director_opinion,
  hrDirectorPassed: record.hr_director_passed,
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
  stage: ApiPromotionApprovalPreviewStage,
): PromotionApprovalPreviewStage => ({
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

const mapApprovalConfigRecord = (record: ApiPromotionApprovalConfig): PromotionApprovalConfig => ({
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

export async function listPromotionApplications(params?: {
  campus?: string
  status?: PromotionStatus
  department?: string
}) {
  const response = await api.get<ApiPromotionApplicationRecord[]>('/human-resources/promotion-applications', {
    params: {
      campus: params?.campus || undefined,
      status: params?.status || undefined,
      department: params?.department || undefined,
    },
  })
  return response.data.map(mapApplicationRecord)
}

export async function getPromotionApplication(applicationId: number) {
  const response = await api.get<ApiPromotionApplicationRecord>(
    `/human-resources/promotion-applications/${applicationId}`,
  )
  return mapApplicationRecord(response.data)
}

export async function createPromotionApplication(payload: PromotionApplicationPayload) {
  const response = await api.post<ApiPromotionApplicationRecord>(
    '/human-resources/promotion-applications',
    mapApplicationPayload(payload),
  )
  return mapApplicationRecord(response.data)
}

export async function updatePromotionApplication(
  applicationId: number,
  payload: Partial<PromotionApplicationPayload>,
) {
  const response = await api.put<ApiPromotionApplicationRecord>(
    `/human-resources/promotion-applications/${applicationId}`,
    mapPartialApplicationPayload(payload),
  )
  return mapApplicationRecord(response.data)
}

export async function deletePromotionApplication(applicationId: number) {
  await api.delete(`/human-resources/promotion-applications/${applicationId}`)
}

export async function submitPromotionApplication(applicationId: number) {
  const response = await api.post<ApiPromotionApplicationRecord>(
    `/human-resources/promotion-applications/${applicationId}/submit`,
  )
  return mapApplicationRecord(response.data)
}

export async function approvePromotionApplication(
  applicationId: number,
  payload?: PromotionApprovalActionPayload,
) {
  const response = await api.post<ApiPromotionApplicationRecord>(
    `/human-resources/promotion-applications/${applicationId}/approve`,
    {
      comment: payload?.comment || undefined,
      original_level: payload?.originalLevel || undefined,
      original_salary: payload?.originalSalary ?? undefined,
      promoted_level: payload?.promotedLevel || undefined,
      promoted_base_salary: payload?.promotedBaseSalary ?? undefined,
      promoted_performance_salary: payload?.promotedPerformanceSalary ?? undefined,
      promoted_salary: payload?.promotedSalary ?? undefined,
    },
  )
  return mapApplicationRecord(response.data)
}

export async function rejectPromotionApplication(applicationId: number, comment: string) {
  const response = await api.post<ApiPromotionApplicationRecord>(
    `/human-resources/promotion-applications/${applicationId}/reject`,
    {
      comment,
    },
  )
  return mapApplicationRecord(response.data)
}

export async function listPromotionApprovalConfigs(params?: {
  campus?: string
  applyDepartment?: string
  applyPosition?: string
  stage?: PromotionStage
}) {
  const response = await api.get<ApiPromotionApprovalConfig[]>('/human-resources/promotion-approval-configs', {
    params: {
      campus: params?.campus || undefined,
      apply_department: params?.applyDepartment || undefined,
      apply_position: params?.applyPosition || undefined,
      stage: params?.stage || undefined,
    },
  })
  return (response.data || []).map(mapApprovalConfigRecord)
}

export async function upsertPromotionApprovalConfig(payload: PromotionApprovalConfigPayload) {
  const response = await api.put<ApiPromotionApprovalConfig>('/human-resources/promotion-approval-configs', {
    campus: payload.campus,
    apply_department: payload.applyDepartment || undefined,
    apply_position: payload.applyPosition || undefined,
    stage: payload.stage,
    approver_user_ids: payload.approverUserIds,
    is_active: payload.isActive,
  })
  return mapApprovalConfigRecord(response.data)
}

export async function deletePromotionApprovalConfig(configId: number) {
  const response = await api.delete<{ success: boolean }>(
    `/human-resources/promotion-approval-configs/${configId}`,
  )
  return response.data
}

export async function previewPromotionApproverCandidates(payload: {
  campus: string
  department: string
  position: string
}) {
  const response = await api.post<ApiPromotionApprovalPreviewStage[]>(
    '/human-resources/promotion-applications/approver-preview',
    payload,
  )
  return (response.data || []).map(mapPreviewStage)
}
