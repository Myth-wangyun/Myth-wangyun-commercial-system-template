import { api, HR_HEAVY_WRITE_TIMEOUT_MS, parsePaginationHeaders, type PagedResult } from '../api'

export type SocialInsuranceStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type SocialInsuranceStage = 'department_head' | 'hr' | 'principal' | 'chairman'

export interface SocialInsuranceApproverCandidate {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface SocialInsuranceApprovalPreviewStage {
  stage: SocialInsuranceStage
  stageLabel: string
  recommendedUserIds: number[]
  approvers: SocialInsuranceApproverCandidate[]
}

interface ApiSocialInsuranceCurrentApprover {
  user_id: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

interface ApiSocialInsuranceApprovalAction {
  id: number
  stage: string
  stage_label: string
  action: string
  approver_user_id?: number | null
  approver_name?: string | null
  comment?: string | null
  created_at: string
}

interface ApiSocialInsuranceApprovalFlowStep {
  stage: string
  stage_label: string
  status: string
  status_label: string
  approvers: ApiSocialInsuranceCurrentApprover[]
  action?: string | null
  action_label?: string | null
  acted_by_user_id?: number | null
  acted_by_name?: string | null
  comment?: string | null
  acted_at?: string | null
}

interface ApiSocialInsuranceApplicationRecord {
  id: number
  application_no: string
  fill_date: string
  campus: string
  account_no?: string | null
  name: string
  department: string
  position: string
  phone: string
  id_number: string
  household_type: string
  id_expiry: string
  hire_date: string
  registered_address: string
  prev_payment_place?: string | null
  prev_payment_type?: string | null
  prev_payment_base?: number | null
  insurance_type: string
  remark?: string | null
  created_by_user_id?: number | null
  created_by_name?: string | null
  dept_manager_opinion?: string | null
  hr_payment_content?: string | null
  hr_payment_base?: number | null
  hr_start_date?: string | null
  hr_insurance_place?: string | null
  hr_opinion?: string | null
  principal_opinion?: string | null
  chairman_opinion?: string | null
  status: SocialInsuranceStatus
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
  selected_approver_user_ids: Partial<Record<SocialInsuranceStage, number[]>>
  current_approvers: ApiSocialInsuranceCurrentApprover[]
  approval_flow: ApiSocialInsuranceApprovalFlowStep[]
  approval_actions: ApiSocialInsuranceApprovalAction[]
  created_at: string
  updated_at: string
}

export interface SocialInsuranceCurrentApprover {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface SocialInsuranceApprovalAction {
  id: number
  stage: string
  stageLabel: string
  action: string
  approverUserId?: number | null
  approverName?: string | null
  comment?: string | null
  createdAt: string
}

export interface SocialInsuranceApprovalFlowStep {
  stage: string
  stageLabel: string
  status: string
  statusLabel: string
  approvers: SocialInsuranceCurrentApprover[]
  action?: string | null
  actionLabel?: string | null
  actedByUserId?: number | null
  actedByName?: string | null
  comment?: string | null
  actedAt?: string | null
}

export interface SocialInsuranceApplicationRecord {
  id: number
  applicationNo: string
  fillDate: string
  campus: string
  accountNo?: string | null
  name: string
  department: string
  position: string
  phone: string
  idNumber: string
  householdType: string
  idExpiry: string
  hireDate: string
  registeredAddress: string
  prevPaymentPlace?: string | null
  prevPaymentType?: string | null
  prevPaymentBase?: number | null
  insuranceType: string
  remark?: string | null
  createdByUserId?: number | null
  createdByName?: string | null
  deptManagerOpinion?: string | null
  hrPaymentContent?: string | null
  hrPaymentBase?: number | null
  hrStartDate?: string | null
  hrInsurancePlace?: string | null
  hrOpinion?: string | null
  principalOpinion?: string | null
  chairmanOpinion?: string | null
  status: SocialInsuranceStatus
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
  selectedApproverUserIds: Partial<Record<SocialInsuranceStage, number[]>>
  currentApprovers: SocialInsuranceCurrentApprover[]
  approvalFlow: SocialInsuranceApprovalFlowStep[]
  approvalActions: SocialInsuranceApprovalAction[]
  createdAt: string
  updatedAt: string
}

export interface SocialInsuranceApplicationPayload {
  fillDate: string
  campus: string
  accountNo: string
  name: string
  department: string
  position: string
  phone: string
  idNumber: string
  householdType: string
  idExpiry: string
  hireDate: string
  registeredAddress: string
  prevPaymentPlace?: string | null
  prevPaymentType?: string | null
  prevPaymentBase?: number | null
  insuranceType: string
  remark?: string | null
  selectedApproverUserIds?: Partial<Record<SocialInsuranceStage, number[]>>
}

export interface SocialInsuranceApprovalActionPayload {
  comment?: string | null
  hrPaymentContent?: string | null
  hrPaymentBase?: number | null
  hrStartDate?: string | null
  hrInsurancePlace?: string | null
}

interface ApiSocialInsuranceApprovalConfigApprover {
  id: number
  approver_user_id: number
  approver_name: string
  approver_department?: string | null
  approver_position?: string | null
  approver_campus?: string | null
  sort_order: number
}

interface ApiSocialInsuranceApprovalConfig {
  id: number
  campus: string
  apply_department?: string | null
  apply_position?: string | null
  stage: SocialInsuranceStage
  stage_label: string
  is_active: boolean
  approvers: ApiSocialInsuranceApprovalConfigApprover[]
  created_at: string
  updated_at: string
}

interface ApiSocialInsuranceApprovalPreviewStage {
  stage: SocialInsuranceStage
  stage_label: string
  recommended_user_ids: number[]
  approvers: ApiSocialInsuranceCurrentApprover[]
}

export interface SocialInsuranceApprovalConfig {
  id: number
  campus: string
  applyDepartment?: string | null
  applyPosition?: string | null
  stage: SocialInsuranceStage
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

export interface SocialInsuranceApprovalConfigPayload {
  campus: string
  applyDepartment?: string | null
  applyPosition?: string | null
  stage: SocialInsuranceStage
  approverUserIds: number[]
  isActive: boolean
}

const mapApplicationPayload = (payload: SocialInsuranceApplicationPayload) => ({
  fill_date: payload.fillDate,
  campus: payload.campus,
  account_no: payload.accountNo,
  name: payload.name,
  department: payload.department,
  position: payload.position,
  phone: payload.phone,
  id_number: payload.idNumber,
  household_type: payload.householdType,
  id_expiry: payload.idExpiry,
  hire_date: payload.hireDate,
  registered_address: payload.registeredAddress,
  prev_payment_place: payload.prevPaymentPlace || undefined,
  prev_payment_type: payload.prevPaymentType || undefined,
  prev_payment_base: payload.prevPaymentBase ?? undefined,
  insurance_type: payload.insuranceType,
  remark: payload.remark || undefined,
  selected_approver_user_ids: payload.selectedApproverUserIds || {},
})

const mapApplicationRecord = (
  record: ApiSocialInsuranceApplicationRecord,
): SocialInsuranceApplicationRecord => ({
  id: record.id,
  applicationNo: record.application_no,
  fillDate: record.fill_date,
  campus: record.campus,
  accountNo: record.account_no,
  name: record.name,
  department: record.department,
  position: record.position,
  phone: record.phone,
  idNumber: record.id_number,
  householdType: record.household_type,
  idExpiry: record.id_expiry,
  hireDate: record.hire_date,
  registeredAddress: record.registered_address,
  prevPaymentPlace: record.prev_payment_place,
  prevPaymentType: record.prev_payment_type,
  prevPaymentBase: record.prev_payment_base,
  insuranceType: record.insurance_type,
  remark: record.remark,
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  deptManagerOpinion: record.dept_manager_opinion,
  hrPaymentContent: record.hr_payment_content,
  hrPaymentBase: record.hr_payment_base,
  hrStartDate: record.hr_start_date,
  hrInsurancePlace: record.hr_insurance_place,
  hrOpinion: record.hr_opinion,
  principalOpinion: record.principal_opinion,
  chairmanOpinion: record.chairman_opinion,
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
  stage: ApiSocialInsuranceApprovalPreviewStage,
): SocialInsuranceApprovalPreviewStage => ({
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

const mapPartialApplicationPayload = (payload: Partial<SocialInsuranceApplicationPayload>) => {
  const result: Record<string, unknown> = {}
  if (payload.fillDate !== undefined) result.fill_date = payload.fillDate
  if (payload.campus !== undefined) result.campus = payload.campus
  if (payload.accountNo !== undefined) result.account_no = payload.accountNo
  if (payload.name !== undefined) result.name = payload.name
  if (payload.department !== undefined) result.department = payload.department
  if (payload.position !== undefined) result.position = payload.position
  if (payload.phone !== undefined) result.phone = payload.phone
  if (payload.idNumber !== undefined) result.id_number = payload.idNumber
  if (payload.householdType !== undefined) result.household_type = payload.householdType
  if (payload.idExpiry !== undefined) result.id_expiry = payload.idExpiry
  if (payload.hireDate !== undefined) result.hire_date = payload.hireDate
  if (payload.registeredAddress !== undefined) result.registered_address = payload.registeredAddress
  if (payload.prevPaymentPlace !== undefined) {
    result.prev_payment_place = payload.prevPaymentPlace || undefined
  }
  if (payload.prevPaymentType !== undefined) {
    result.prev_payment_type = payload.prevPaymentType || undefined
  }
  if (payload.prevPaymentBase !== undefined) {
    result.prev_payment_base = payload.prevPaymentBase ?? undefined
  }
  if (payload.insuranceType !== undefined) result.insurance_type = payload.insuranceType
  if (payload.remark !== undefined) result.remark = payload.remark || undefined
  if (payload.selectedApproverUserIds !== undefined) {
    result.selected_approver_user_ids = payload.selectedApproverUserIds || {}
  }
  return result
}

const mapApprovalConfigRecord = (
  record: ApiSocialInsuranceApprovalConfig,
): SocialInsuranceApprovalConfig => ({
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

export async function listSocialInsuranceApplications(params?: {
  campus?: string
  status?: SocialInsuranceStatus
  department?: string
  search?: string
}) {
  const response = await api.get<ApiSocialInsuranceApplicationRecord[]>('/human-resources/social-insurance-applications', {
    params: {
      campus: params?.campus || undefined,
      status: params?.status || undefined,
      department: params?.department || undefined,
      search: params?.search || undefined,
    },
  })
  return (response.data || []).map(mapApplicationRecord)
}

export async function listSocialInsuranceApplicationsPaged(params?: {
  campus?: string
  status?: SocialInsuranceStatus
  department?: string
  search?: string
  page?: number
  pageSize?: number
}): Promise<PagedResult<SocialInsuranceApplicationRecord>> {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const response = await api.get<ApiSocialInsuranceApplicationRecord[]>('/human-resources/social-insurance-applications', {
    params: {
      campus: params?.campus || undefined,
      status: params?.status || undefined,
      department: params?.department || undefined,
      search: params?.search || undefined,
      page,
      page_size: pageSize,
    },
  })
  const meta = parsePaginationHeaders(response.headers, page, pageSize)
  return {
    items: (response.data || []).map(mapApplicationRecord),
    total: meta.total,
    page: meta.page,
    pageSize: meta.pageSize,
  }
}

export async function getSocialInsuranceApplication(applicationId: number) {
  const response = await api.get<ApiSocialInsuranceApplicationRecord>(
    `/human-resources/social-insurance-applications/${applicationId}`,
  )
  return mapApplicationRecord(response.data)
}

export async function createSocialInsuranceApplication(payload: SocialInsuranceApplicationPayload) {
  const response = await api.post<ApiSocialInsuranceApplicationRecord>(
    '/human-resources/social-insurance-applications',
    mapApplicationPayload(payload),
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapApplicationRecord(response.data)
}

export async function updateSocialInsuranceApplication(
  applicationId: number,
  payload: Partial<SocialInsuranceApplicationPayload>,
) {
  const response = await api.put<ApiSocialInsuranceApplicationRecord>(
    `/human-resources/social-insurance-applications/${applicationId}`,
    mapPartialApplicationPayload(payload),
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapApplicationRecord(response.data)
}

export async function deleteSocialInsuranceApplication(applicationId: number) {
  const response = await api.delete<{ success: boolean }>(
    `/human-resources/social-insurance-applications/${applicationId}`,
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return response.data
}

export async function submitSocialInsuranceApplication(applicationId: number) {
  const response = await api.post<ApiSocialInsuranceApplicationRecord>(
    `/human-resources/social-insurance-applications/${applicationId}/submit`,
  )
  return mapApplicationRecord(response.data)
}

export async function approveSocialInsuranceApplication(
  applicationId: number,
  payload?: SocialInsuranceApprovalActionPayload,
) {
  const response = await api.post<ApiSocialInsuranceApplicationRecord>(
    `/human-resources/social-insurance-applications/${applicationId}/approve`,
    {
      comment: payload?.comment || undefined,
      hr_payment_content: payload?.hrPaymentContent || undefined,
      hr_payment_base: payload?.hrPaymentBase ?? undefined,
      hr_start_date: payload?.hrStartDate || undefined,
      hr_insurance_place: payload?.hrInsurancePlace || undefined,
    },
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapApplicationRecord(response.data)
}

export async function rejectSocialInsuranceApplication(
  applicationId: number,
  comment: string,
) {
  const response = await api.post<ApiSocialInsuranceApplicationRecord>(
    `/human-resources/social-insurance-applications/${applicationId}/reject`,
    { comment },
  )
  return mapApplicationRecord(response.data)
}

export async function listSocialInsuranceApprovalConfigs(params?: {
  campus?: string
  applyDepartment?: string
  applyPosition?: string
  stage?: SocialInsuranceStage
}) {
  const response = await api.get<ApiSocialInsuranceApprovalConfig[]>(
    '/human-resources/social-insurance-approval-configs',
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

export async function upsertSocialInsuranceApprovalConfig(
  payload: SocialInsuranceApprovalConfigPayload,
) {
  const response = await api.put<ApiSocialInsuranceApprovalConfig>(
    '/human-resources/social-insurance-approval-configs',
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

export async function deleteSocialInsuranceApprovalConfig(configId: number) {
  const response = await api.delete<{ success: boolean }>(
    `/human-resources/social-insurance-approval-configs/${configId}`,
  )
  return response.data
}

export async function previewSocialInsuranceApproverCandidates(payload: {
  campus: string
  department: string
  position: string
}) {
  const response = await api.post<ApiSocialInsuranceApprovalPreviewStage[]>(
    '/human-resources/social-insurance-applications/approver-preview',
    payload,
  )
  return (response.data || []).map(mapPreviewStage)
}
