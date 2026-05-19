import { api, HR_HEAVY_WRITE_TIMEOUT_MS, parsePaginationHeaders, type PagedResult } from '../api'

export type TrainingApplicationStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type TrainingApplicationStage =
  | 'department_head'
  | 'principal'
  | 'group_department'
  | 'hr'
  | 'chairman'

export type TrainingCategory = '思想' | '业务' | '管理'
export type TrainingFormat = '线上' | '线下' | '线上+线下'
export type ExamMethod = '理论' | '实操' | '理论+实操'

interface ApiCurrentApprover {
  user_id: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

interface ApiApprovalAction {
  id: number
  stage: string
  stage_label: string
  action: string
  approver_user_id?: number | null
  approver_name?: string | null
  comment?: string | null
  created_at: string
}

interface ApiApprovalFlowStep {
  stage: string
  stage_label: string
  status: string
  status_label: string
  approvers: ApiCurrentApprover[]
  action?: string | null
  action_label?: string | null
  acted_by_user_id?: number | null
  acted_by_name?: string | null
  comment?: string | null
  acted_at?: string | null
}

interface ApiTrainingApplicationRecord {
  id: number
  application_no: string
  campus: string
  department: string
  category: TrainingCategory
  objective: string
  trainees: string
  content: string
  start_date: string
  end_date: string
  total_hours: number
  training_format: TrainingFormat
  exam_method: ExamMethod
  trainer?: string | null
  expected_pass_rate?: number | null
  cost_per_person: number
  cost_count: number
  cost_total: number
  cost_other: number
  is_internal_training: boolean
  is_key_staff_training: boolean
  include_chairman_approval: boolean
  remark?: string | null
  created_by_user_id?: number | null
  created_by_name?: string | null
  department_head_opinion?: string | null
  department_head_passed?: boolean | null
  principal_opinion?: string | null
  principal_passed?: boolean | null
  group_department_opinion?: string | null
  group_department_passed?: boolean | null
  hr_opinion?: string | null
  hr_passed?: boolean | null
  chairman_opinion?: string | null
  chairman_passed?: boolean | null
  is_passed?: boolean | null
  status: TrainingApplicationStatus
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
  selected_approver_user_ids: Partial<Record<TrainingApplicationStage, number[]>>
  current_approvers: ApiCurrentApprover[]
  approval_flow: ApiApprovalFlowStep[]
  approval_actions: ApiApprovalAction[]
  created_at: string
  updated_at: string
}

interface ApiApproverPreviewStage {
  stage: TrainingApplicationStage
  stage_label: string
  recommended_user_ids: number[]
  approvers: ApiCurrentApprover[]
}

export interface TrainingApplicationApproverCandidate {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface TrainingApplicationApprovalPreviewStage {
  stage: TrainingApplicationStage
  stageLabel: string
  recommendedUserIds: number[]
  approvers: TrainingApplicationApproverCandidate[]
}

export interface TrainingApplicationCurrentApprover {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface TrainingApplicationApprovalAction {
  id: number
  stage: string
  stageLabel: string
  action: string
  approverUserId?: number | null
  approverName?: string | null
  comment?: string | null
  createdAt: string
}

export interface TrainingApplicationApprovalFlowStep {
  stage: string
  stageLabel: string
  status: string
  statusLabel: string
  approvers: TrainingApplicationCurrentApprover[]
  action?: string | null
  actionLabel?: string | null
  actedByUserId?: number | null
  actedByName?: string | null
  comment?: string | null
  actedAt?: string | null
}

export interface TrainingApplicationRecord {
  id: number
  applicationNo: string
  campus: string
  department: string
  category: TrainingCategory
  objective: string
  trainees: string
  content: string
  startDate: string
  endDate: string
  totalHours: number
  format: TrainingFormat
  examMethod: ExamMethod
  trainer?: string | null
  expectedPassRate?: number | null
  costPerPerson: number
  costCount: number
  costTotal: number
  costOther: number
  isInternalTraining: boolean
  isKeyStaffTraining: boolean
  includeChairmanApproval: boolean
  remark?: string | null
  createdByUserId?: number | null
  createdByName?: string | null
  departmentHeadOpinion?: string | null
  departmentHeadPassed?: boolean | null
  principalOpinion?: string | null
  principalPassed?: boolean | null
  groupDepartmentOpinion?: string | null
  groupDepartmentPassed?: boolean | null
  hrOpinion?: string | null
  hrPassed?: boolean | null
  chairmanOpinion?: string | null
  chairmanPassed?: boolean | null
  isPassed?: boolean | null
  status: TrainingApplicationStatus
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
  selectedApproverUserIds: Partial<Record<TrainingApplicationStage, number[]>>
  currentApprovers: TrainingApplicationCurrentApprover[]
  approvalFlow: TrainingApplicationApprovalFlowStep[]
  approvalActions: TrainingApplicationApprovalAction[]
  createdAt: string
  updatedAt: string
}

export interface TrainingApplicationPayload {
  campus: string
  department: string
  category: TrainingCategory
  objective: string
  trainees: string
  content: string
  startDate: string
  endDate: string
  totalHours: number
  format: TrainingFormat
  examMethod: ExamMethod
  trainer?: string | null
  expectedPassRate?: number | null
  costPerPerson: number
  costCount: number
  costTotal: number
  costOther: number
  isInternalTraining: boolean
  isKeyStaffTraining: boolean
  includeChairmanApproval: boolean
  remark?: string | null
  selectedApproverUserIds?: Partial<Record<TrainingApplicationStage, number[]>>
}

const mapApprover = (item: ApiCurrentApprover): TrainingApplicationCurrentApprover => ({
  userId: item.user_id,
  name: item.name,
  department: item.department,
  position: item.position,
  campus: item.campus,
})

const mapRecord = (record: ApiTrainingApplicationRecord): TrainingApplicationRecord => ({
  id: record.id,
  applicationNo: record.application_no,
  campus: record.campus,
  department: record.department,
  category: record.category,
  objective: record.objective,
  trainees: record.trainees,
  content: record.content,
  startDate: record.start_date,
  endDate: record.end_date,
  totalHours: record.total_hours,
  format: record.training_format,
  examMethod: record.exam_method,
  trainer: record.trainer,
  expectedPassRate: record.expected_pass_rate,
  costPerPerson: record.cost_per_person,
  costCount: record.cost_count,
  costTotal: record.cost_total,
  costOther: record.cost_other,
  isInternalTraining: record.is_internal_training,
  isKeyStaffTraining: record.is_key_staff_training,
  includeChairmanApproval: record.include_chairman_approval,
  remark: record.remark,
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  departmentHeadOpinion: record.department_head_opinion,
  departmentHeadPassed: record.department_head_passed,
  principalOpinion: record.principal_opinion,
  principalPassed: record.principal_passed,
  groupDepartmentOpinion: record.group_department_opinion,
  groupDepartmentPassed: record.group_department_passed,
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
  currentApprovers: record.current_approvers.map(mapApprover),
  approvalFlow: record.approval_flow.map((item) => ({
    stage: item.stage,
    stageLabel: item.stage_label,
    status: item.status,
    statusLabel: item.status_label,
    approvers: item.approvers.map(mapApprover),
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

const mapPayload = (payload: TrainingApplicationPayload) => ({
  campus: payload.campus,
  department: payload.department,
  category: payload.category,
  objective: payload.objective,
  trainees: payload.trainees,
  content: payload.content,
  start_date: payload.startDate,
  end_date: payload.endDate,
  total_hours: payload.totalHours,
  training_format: payload.format,
  exam_method: payload.examMethod,
  trainer: payload.trainer || undefined,
  expected_pass_rate: payload.expectedPassRate ?? undefined,
  cost_per_person: payload.costPerPerson,
  cost_count: payload.costCount,
  cost_total: payload.costTotal,
  cost_other: payload.costOther,
  is_internal_training: payload.isInternalTraining,
  is_key_staff_training: payload.isKeyStaffTraining,
  include_chairman_approval: payload.includeChairmanApproval,
  remark: payload.remark || undefined,
  selected_approver_user_ids: payload.selectedApproverUserIds || {},
})

export async function listTrainingApplications(params?: {
  campus?: string
  status?: TrainingApplicationStatus
  department?: string
  category?: TrainingCategory
  search?: string
}) {
  const response = await api.get<ApiTrainingApplicationRecord[]>('/human-resources/training-applications', {
    params: {
      campus: params?.campus || undefined,
      status: params?.status || undefined,
      department: params?.department || undefined,
      category: params?.category || undefined,
      search: params?.search || undefined,
    },
  })
  return response.data.map(mapRecord)
}

export async function listTrainingApplicationsPaged(params?: {
  campus?: string
  status?: TrainingApplicationStatus
  department?: string
  category?: TrainingCategory
  search?: string
  page?: number
  pageSize?: number
}): Promise<PagedResult<TrainingApplicationRecord>> {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const response = await api.get<ApiTrainingApplicationRecord[]>('/human-resources/training-applications', {
    params: {
      campus: params?.campus || undefined,
      status: params?.status || undefined,
      department: params?.department || undefined,
      category: params?.category || undefined,
      search: params?.search || undefined,
      page,
      page_size: pageSize,
    },
  })
  const meta = parsePaginationHeaders(response.headers, page, pageSize)
  return {
    items: response.data.map(mapRecord),
    total: meta.total,
    page: meta.page,
    pageSize: meta.pageSize,
  }
}

export async function getTrainingApplication(id: number) {
  const response = await api.get<ApiTrainingApplicationRecord>(`/human-resources/training-applications/${id}`)
  return mapRecord(response.data)
}

export async function previewTrainingApplicationApprovers(payload: {
  campus: string
  department: string
  category: TrainingCategory
  isInternalTraining: boolean
  isKeyStaffTraining: boolean
  includeChairmanApproval: boolean
  totalAmount: number
}) {
  const response = await api.post<ApiApproverPreviewStage[]>('/human-resources/training-applications/approver-preview', {
    campus: payload.campus,
    department: payload.department,
    category: payload.category,
    is_internal_training: payload.isInternalTraining,
    is_key_staff_training: payload.isKeyStaffTraining,
    include_chairman_approval: payload.includeChairmanApproval,
    total_amount: payload.totalAmount,
  })
  return response.data.map<TrainingApplicationApprovalPreviewStage>((item) => ({
    stage: item.stage,
    stageLabel: item.stage_label,
    recommendedUserIds: item.recommended_user_ids,
    approvers: item.approvers.map((approver) => ({
      userId: approver.user_id,
      name: approver.name,
      department: approver.department,
      position: approver.position,
      campus: approver.campus,
    })),
  }))
}

export async function createTrainingApplication(payload: TrainingApplicationPayload) {
  const response = await api.post<ApiTrainingApplicationRecord>(
    '/human-resources/training-applications',
    mapPayload(payload),
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapRecord(response.data)
}

export async function updateTrainingApplication(id: number, payload: TrainingApplicationPayload) {
  const response = await api.put<ApiTrainingApplicationRecord>(
    `/human-resources/training-applications/${id}`,
    mapPayload(payload),
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapRecord(response.data)
}

export async function deleteTrainingApplication(id: number) {
  await api.delete(`/human-resources/training-applications/${id}`, {
    timeout: HR_HEAVY_WRITE_TIMEOUT_MS,
  })
}

export async function submitTrainingApplication(id: number) {
  const response = await api.post<ApiTrainingApplicationRecord>(
    `/human-resources/training-applications/${id}/submit`,
  )
  return mapRecord(response.data)
}

export async function approveTrainingApplication(id: number, comment?: string) {
  const response = await api.post<ApiTrainingApplicationRecord>(
    `/human-resources/training-applications/${id}/approve`,
    { comment },
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapRecord(response.data)
}

export async function rejectTrainingApplication(id: number, comment: string) {
  const response = await api.post<ApiTrainingApplicationRecord>(
    `/human-resources/training-applications/${id}/reject`,
    { comment },
  )
  return mapRecord(response.data)
}