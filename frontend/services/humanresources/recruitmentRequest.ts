import { api, HR_HEAVY_WRITE_TIMEOUT_MS, parsePaginationHeaders, type PagedResult } from '../api'

export type RecruitmentStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type RecruitmentStage = 'department_head' | 'principal' | 'hr_director' | 'chairman'

export interface RecruitmentApproverCandidate {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface RecruitmentApprovalPreviewStage {
  stage: RecruitmentStage
  stageLabel: string
  recommendedUserIds: number[]
  approvers: RecruitmentApproverCandidate[]
}

interface ApiRecruitmentCurrentApprover {
  user_id: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

interface ApiRecruitmentApprovalAction {
  id: number
  stage: string
  stage_label: string
  action: string
  approver_user_id?: number | null
  approver_name?: string | null
  comment?: string | null
  created_at: string
}

interface ApiRecruitmentApprovalFlowStep {
  stage: string
  stage_label: string
  status: string
  status_label: string
  approvers: ApiRecruitmentCurrentApprover[]
  action?: string | null
  action_label?: string | null
  acted_by_user_id?: number | null
  acted_by_name?: string | null
  comment?: string | null
  acted_at?: string | null
}

interface ApiRecruitmentRequestRecord {
  id: number
  request_no: string
  campus?: string | null
  apply_date: string
  department: string
  position: string
  headcount: number
  reason: string
  expected_date: string
  gender?: string | null
  age?: string | null
  marital_status?: string | null
  education?: string | null
  major?: string | null
  skills_experience?: string | null
  suggested_salary?: string | null
  job_responsibilities?: string | null
  analysis_and_reason?: string | null
  internal_candidate_has: boolean
  internal_candidate_department?: string | null
  internal_candidate_name?: string | null
  created_by_user_id?: number | null
  created_by_name?: string | null
  dept_manager_opinion?: string | null
  principal_opinion?: string | null
  hr_director_opinion?: string | null
  chairman_approval?: string | null
  status: RecruitmentStatus
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
  selected_approver_user_ids: Partial<Record<RecruitmentStage, number[]>>
  current_approvers: ApiRecruitmentCurrentApprover[]
  approval_flow: ApiRecruitmentApprovalFlowStep[]
  approval_actions: ApiRecruitmentApprovalAction[]
  created_at: string
  updated_at: string
}

export interface RecruitmentCurrentApprover {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface RecruitmentApprovalAction {
  id: number
  stage: string
  stageLabel: string
  action: string
  approverUserId?: number | null
  approverName?: string | null
  comment?: string | null
  createdAt: string
}

export interface RecruitmentApprovalFlowStep {
  stage: string
  stageLabel: string
  status: string
  statusLabel: string
  approvers: RecruitmentCurrentApprover[]
  action?: string | null
  actionLabel?: string | null
  actedByUserId?: number | null
  actedByName?: string | null
  comment?: string | null
  actedAt?: string | null
}

export interface RecruitmentRequestRecord {
  id: number
  requestNo: string
  campus?: string | null
  applyDate: string
  department: string
  position: string
  headcount: number
  reason: string
  expectedDate: string
  gender?: string | null
  age?: string | null
  maritalStatus?: string | null
  education?: string | null
  major?: string | null
  skillsExperience?: string | null
  suggestedSalary?: string | null
  jobResponsibilities?: string | null
  analysisAndReason?: string | null
  internalCandidate: {
    hasCandidate: boolean
    department?: string | null
    name?: string | null
  }
  createdByUserId?: number | null
  createdByName?: string | null
  deptManagerOpinion?: string | null
  principalOpinion?: string | null
  hrDirectorOpinion?: string | null
  chairmanApproval?: string | null
  status: RecruitmentStatus
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
  selectedApproverUserIds: Partial<Record<RecruitmentStage, number[]>>
  currentApprovers: RecruitmentCurrentApprover[]
  approvalFlow: RecruitmentApprovalFlowStep[]
  approvalActions: RecruitmentApprovalAction[]
  createdAt: string
  updatedAt: string
}

export interface RecruitmentRequestPayload {
  campus?: string | null
  applyDate: string
  department: string
  position: string
  headcount: number
  reason: string
  expectedDate: string
  gender?: string | null
  age?: string | null
  maritalStatus?: string | null
  education?: string | null
  major?: string | null
  skillsExperience?: string | null
  suggestedSalary?: string | null
  jobResponsibilities?: string | null
  analysisAndReason?: string | null
  internalCandidate: {
    hasCandidate: boolean
    department?: string | null
    name?: string | null
  }
  selectedApproverUserIds?: Partial<Record<RecruitmentStage, number[]>>
}

interface ApiRecruitmentApprovalPreviewStage {
  stage: RecruitmentStage
  stage_label: string
  recommended_user_ids: number[]
  approvers: ApiRecruitmentCurrentApprover[]
}

interface ApiRecruitmentApprovalConfigApprover {
  id: number
  approver_user_id: number
  approver_name: string
  approver_department?: string | null
  approver_position?: string | null
  approver_campus?: string | null
  sort_order: number
}

interface ApiRecruitmentApprovalConfig {
  id: number
  campus: string
  apply_department?: string | null
  apply_position?: string | null
  stage: RecruitmentStage
  stage_label: string
  is_active: boolean
  approvers: ApiRecruitmentApprovalConfigApprover[]
  created_at: string
  updated_at: string
}

export interface RecruitmentApprovalConfig {
  id: number
  campus: string
  applyDepartment?: string | null
  applyPosition?: string | null
  stage: RecruitmentStage
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

export interface RecruitmentApprovalConfigPayload {
  campus: string
  applyDepartment?: string | null
  applyPosition?: string | null
  stage: RecruitmentStage
  approverUserIds: number[]
  isActive: boolean
}

const mapRequestPayload = (payload: RecruitmentRequestPayload) => ({
  campus: payload.campus || undefined,
  apply_date: payload.applyDate,
  department: payload.department,
  position: payload.position,
  headcount: payload.headcount,
  reason: payload.reason,
  expected_date: payload.expectedDate,
  gender: payload.gender || undefined,
  age: payload.age || undefined,
  marital_status: payload.maritalStatus || undefined,
  education: payload.education || undefined,
  major: payload.major || undefined,
  skills_experience: payload.skillsExperience || undefined,
  suggested_salary: payload.suggestedSalary || undefined,
  job_responsibilities: payload.jobResponsibilities || undefined,
  analysis_and_reason: payload.analysisAndReason || undefined,
  internal_candidate_has: payload.internalCandidate.hasCandidate,
  internal_candidate_department: payload.internalCandidate.department || undefined,
  internal_candidate_name: payload.internalCandidate.name || undefined,
  selected_approver_user_ids: payload.selectedApproverUserIds || {},
})

const mapRequestRecord = (record: ApiRecruitmentRequestRecord): RecruitmentRequestRecord => ({
  id: record.id,
  requestNo: record.request_no,
  campus: record.campus,
  applyDate: record.apply_date,
  department: record.department,
  position: record.position,
  headcount: record.headcount,
  reason: record.reason,
  expectedDate: record.expected_date,
  gender: record.gender,
  age: record.age,
  maritalStatus: record.marital_status,
  education: record.education,
  major: record.major,
  skillsExperience: record.skills_experience,
  suggestedSalary: record.suggested_salary,
  jobResponsibilities: record.job_responsibilities,
  analysisAndReason: record.analysis_and_reason,
  internalCandidate: {
    hasCandidate: record.internal_candidate_has,
    department: record.internal_candidate_department,
    name: record.internal_candidate_name,
  },
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  deptManagerOpinion: record.dept_manager_opinion,
  principalOpinion: record.principal_opinion,
  hrDirectorOpinion: record.hr_director_opinion,
  chairmanApproval: record.chairman_approval,
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
  stage: ApiRecruitmentApprovalPreviewStage,
): RecruitmentApprovalPreviewStage => ({
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

const mapApprovalConfig = (config: ApiRecruitmentApprovalConfig): RecruitmentApprovalConfig => ({
  id: config.id,
  campus: config.campus,
  applyDepartment: config.apply_department,
  applyPosition: config.apply_position,
  stage: config.stage,
  stageLabel: config.stage_label,
  isActive: config.is_active,
  approvers: config.approvers.map((item) => ({
    id: item.id,
    approverUserId: item.approver_user_id,
    approverName: item.approver_name,
    approverDepartment: item.approver_department,
    approverPosition: item.approver_position,
    approverCampus: item.approver_campus,
    sortOrder: item.sort_order,
  })),
  createdAt: config.created_at,
  updatedAt: config.updated_at,
})

export async function listRecruitmentRequests(params?: {
  campus?: string
  status?: RecruitmentStatus
  department?: string
  search?: string
}) {
  const response = await api.get<ApiRecruitmentRequestRecord[]>(
    '/human-resources/recruitment-requests',
    { params },
  )
  return response.data.map(mapRequestRecord)
}

export async function listRecruitmentRequestsPaged(params?: {
  campus?: string
  status?: RecruitmentStatus
  department?: string
  search?: string
  page?: number
  pageSize?: number
}): Promise<PagedResult<RecruitmentRequestRecord>> {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const response = await api.get<ApiRecruitmentRequestRecord[]>(
    '/human-resources/recruitment-requests',
    {
      params: {
        campus: params?.campus,
        status: params?.status,
        department: params?.department,
        search: params?.search,
        page,
        page_size: pageSize,
      },
    },
  )
  const meta = parsePaginationHeaders(response.headers, page, pageSize)
  return {
    items: response.data.map(mapRequestRecord),
    total: meta.total,
    page: meta.page,
    pageSize: meta.pageSize,
  }
}

export async function getRecruitmentRequest(id: number) {
  const response = await api.get<ApiRecruitmentRequestRecord>(
    `/human-resources/recruitment-requests/${id}`,
  )
  return mapRequestRecord(response.data)
}

export async function createRecruitmentRequest(payload: RecruitmentRequestPayload) {
  const response = await api.post<ApiRecruitmentRequestRecord>(
    '/human-resources/recruitment-requests',
    mapRequestPayload(payload),
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapRequestRecord(response.data)
}

export async function updateRecruitmentRequest(id: number, payload: RecruitmentRequestPayload) {
  const response = await api.put<ApiRecruitmentRequestRecord>(
    `/human-resources/recruitment-requests/${id}`,
    mapRequestPayload(payload),
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapRequestRecord(response.data)
}

export async function deleteRecruitmentRequest(id: number) {
  await api.delete(`/human-resources/recruitment-requests/${id}`, {
    timeout: HR_HEAVY_WRITE_TIMEOUT_MS,
  })
}

export async function submitRecruitmentRequest(id: number) {
  const response = await api.post<ApiRecruitmentRequestRecord>(
    `/human-resources/recruitment-requests/${id}/submit`,
  )
  return mapRequestRecord(response.data)
}

export async function approveRecruitmentRequest(id: number, comment?: string) {
  const response = await api.post<ApiRecruitmentRequestRecord>(
    `/human-resources/recruitment-requests/${id}/approve`,
    { comment },
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapRequestRecord(response.data)
}

export async function rejectRecruitmentRequest(id: number, comment: string) {
  const response = await api.post<ApiRecruitmentRequestRecord>(
    `/human-resources/recruitment-requests/${id}/reject`,
    { comment },
  )
  return mapRequestRecord(response.data)
}

export async function listRecruitmentApprovalConfigs(params?: {
  campus?: string
  applyDepartment?: string
  applyPosition?: string
  stage?: RecruitmentStage
}) {
  const response = await api.get<ApiRecruitmentApprovalConfig[]>(
    '/human-resources/recruitment-approval-configs',
    {
      params: {
        campus: params?.campus,
        apply_department: params?.applyDepartment,
        apply_position: params?.applyPosition,
        stage: params?.stage,
      },
    },
  )
  return response.data.map(mapApprovalConfig)
}

export async function upsertRecruitmentApprovalConfig(payload: RecruitmentApprovalConfigPayload) {
  const response = await api.put<ApiRecruitmentApprovalConfig>(
    '/human-resources/recruitment-approval-configs',
    {
      campus: payload.campus,
      apply_department: payload.applyDepartment || undefined,
      apply_position: payload.applyPosition || undefined,
      stage: payload.stage,
      approver_user_ids: payload.approverUserIds,
      is_active: payload.isActive,
    },
  )
  return mapApprovalConfig(response.data)
}

export async function deleteRecruitmentApprovalConfig(id: number) {
  await api.delete(`/human-resources/recruitment-approval-configs/${id}`)
}

export async function previewRecruitmentApproverCandidates(payload: {
  campus?: string | null
  department: string
  position: string
}) {
  const response = await api.post<ApiRecruitmentApprovalPreviewStage[]>(
    '/human-resources/recruitment-requests/approver-preview',
    {
      campus: payload.campus || undefined,
      department: payload.department,
      position: payload.position,
    },
  )
  return (response.data || []).map(mapPreviewStage)
}
