import { api } from '../api'

export type ResignationApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type ResignationApprovalStage =
  | 'department_head'
  | 'hr'
  | 'principal'
  | 'operations_reviewer'
  | 'chairman'

export interface ResignationApprovalApproverCandidate {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface ResignationApprovalPreviewStage {
  stage: ResignationApprovalStage
  stageLabel: string
  recommendedUserIds: number[]
  approvers: ResignationApprovalApproverCandidate[]
}

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

interface ApiResignationApprovalRecord {
  id: number
  application_no: string
  fill_date: string
  campus: string
  name: string
  gender?: string | null
  department: string
  position: string
  entry_date?: string | null
  contract_end_date?: string | null
  leave_date: string
  leave_type: string
  leave_type_other?: string | null
  reason: string
  employee_sign?: string | null
  employee_sign_date?: string | null
  created_by_user_id?: number | null
  created_by_name?: string | null
  department_head_opinion?: string | null
  department_head_passed?: boolean | null
  department_head_salary_end_date?: string | null
  hr_opinion?: string | null
  hr_passed?: boolean | null
  hr_salary_end_date?: string | null
  principal_opinion?: string | null
  principal_passed?: boolean | null
  operations_review_opinion?: string | null
  operations_review_passed?: boolean | null
  chairman_opinion?: string | null
  chairman_passed?: boolean | null
  is_passed?: boolean | null
  status: ResignationApprovalStatus
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
  selected_approver_user_ids: Partial<Record<ResignationApprovalStage, number[]>>
  current_approvers: ApiCurrentApprover[]
  approval_flow: ApiApprovalFlowStep[]
  approval_actions: ApiApprovalAction[]
  created_at: string
  updated_at: string
}

interface ApiApprovalPreviewStage {
  stage: ResignationApprovalStage
  stage_label: string
  recommended_user_ids: number[]
  approvers: ApiCurrentApprover[]
}

export interface ResignationApprovalCurrentApprover {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface ResignationApprovalAction {
  id: number
  stage: string
  stageLabel: string
  action: string
  approverUserId?: number | null
  approverName?: string | null
  comment?: string | null
  createdAt: string
}

export interface ResignationApprovalFlowStep {
  stage: string
  stageLabel: string
  status: string
  statusLabel: string
  approvers: ResignationApprovalCurrentApprover[]
  action?: string | null
  actionLabel?: string | null
  actedByUserId?: number | null
  actedByName?: string | null
  comment?: string | null
  actedAt?: string | null
}

export interface ResignationApprovalRecord {
  id: number
  applicationNo: string
  fillDate: string
  campus: string
  name: string
  gender?: string | null
  department: string
  position: string
  entryDate?: string | null
  contractEndDate?: string | null
  leaveDate: string
  leaveType: string
  leaveTypeOther?: string | null
  reason: string
  employeeSign?: string | null
  employeeSignDate?: string | null
  createdByUserId?: number | null
  createdByName?: string | null
  departmentHeadOpinion?: string | null
  departmentHeadPassed?: boolean | null
  departmentHeadSalaryEndDate?: string | null
  hrOpinion?: string | null
  hrPassed?: boolean | null
  hrSalaryEndDate?: string | null
  principalOpinion?: string | null
  principalPassed?: boolean | null
  operationsReviewOpinion?: string | null
  operationsReviewPassed?: boolean | null
  chairmanOpinion?: string | null
  chairmanPassed?: boolean | null
  isPassed?: boolean | null
  status: ResignationApprovalStatus
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
  selectedApproverUserIds: Partial<Record<ResignationApprovalStage, number[]>>
  currentApprovers: ResignationApprovalCurrentApprover[]
  approvalFlow: ResignationApprovalFlowStep[]
  approvalActions: ResignationApprovalAction[]
  createdAt: string
  updatedAt: string
}

export interface ResignationApprovalPayload {
  fillDate: string
  campus: string
  name: string
  gender?: string | null
  department: string
  position: string
  entryDate?: string | null
  contractEndDate?: string | null
  leaveDate: string
  leaveType: string
  leaveTypeOther?: string | null
  reason: string
  employeeSign?: string | null
  employeeSignDate?: string | null
  selectedApproverUserIds?: Partial<Record<ResignationApprovalStage, number[]>>
}

export interface ResignationApprovalActionPayload {
  comment?: string
  salaryEndDate?: string | null
}

const mapApplicationPayload = (payload: ResignationApprovalPayload) => ({
  fill_date: payload.fillDate,
  campus: payload.campus,
  name: payload.name,
  gender: payload.gender || undefined,
  department: payload.department,
  position: payload.position,
  entry_date: payload.entryDate || undefined,
  contract_end_date: payload.contractEndDate || undefined,
  leave_date: payload.leaveDate,
  leave_type: payload.leaveType,
  leave_type_other: payload.leaveTypeOther || undefined,
  reason: payload.reason,
  employee_sign: payload.employeeSign || undefined,
  employee_sign_date: payload.employeeSignDate || undefined,
  selected_approver_user_ids: payload.selectedApproverUserIds || {},
})

const mapPartialApplicationPayload = (payload: Partial<ResignationApprovalPayload>) => {
  const result: Record<string, unknown> = {}
  if (payload.fillDate !== undefined) result.fill_date = payload.fillDate
  if (payload.campus !== undefined) result.campus = payload.campus
  if (payload.name !== undefined) result.name = payload.name
  if (payload.gender !== undefined) result.gender = payload.gender || undefined
  if (payload.department !== undefined) result.department = payload.department
  if (payload.position !== undefined) result.position = payload.position
  if (payload.entryDate !== undefined) result.entry_date = payload.entryDate || undefined
  if (payload.contractEndDate !== undefined)
    result.contract_end_date = payload.contractEndDate || undefined
  if (payload.leaveDate !== undefined) result.leave_date = payload.leaveDate
  if (payload.leaveType !== undefined) result.leave_type = payload.leaveType
  if (payload.leaveTypeOther !== undefined)
    result.leave_type_other = payload.leaveTypeOther || undefined
  if (payload.reason !== undefined) result.reason = payload.reason
  if (payload.employeeSign !== undefined) result.employee_sign = payload.employeeSign || undefined
  if (payload.employeeSignDate !== undefined)
    result.employee_sign_date = payload.employeeSignDate || undefined
  if (payload.selectedApproverUserIds !== undefined) {
    result.selected_approver_user_ids = payload.selectedApproverUserIds || {}
  }
  return result
}

const mapActionPayload = (payload?: ResignationApprovalActionPayload | string) => {
  if (typeof payload === 'string') {
    return { comment: payload || undefined }
  }
  return {
    comment: payload?.comment || undefined,
    salary_end_date: payload?.salaryEndDate || undefined,
  }
}

const mapCurrentApprover = (approver: ApiCurrentApprover): ResignationApprovalCurrentApprover => ({
  userId: approver.user_id,
  name: approver.name,
  department: approver.department,
  position: approver.position,
  campus: approver.campus,
})

const mapApprovalPreviewStage = (
  stage: ApiApprovalPreviewStage,
): ResignationApprovalPreviewStage => ({
  stage: stage.stage,
  stageLabel: stage.stage_label,
  recommendedUserIds: stage.recommended_user_ids || [],
  approvers: (stage.approvers || []).map(mapCurrentApprover),
})

const mapApprovalAction = (action: ApiApprovalAction): ResignationApprovalAction => ({
  id: action.id,
  stage: action.stage,
  stageLabel: action.stage_label,
  action: action.action,
  approverUserId: action.approver_user_id,
  approverName: action.approver_name,
  comment: action.comment,
  createdAt: action.created_at,
})

const mapApprovalFlow = (flow: ApiApprovalFlowStep): ResignationApprovalFlowStep => ({
  stage: flow.stage,
  stageLabel: flow.stage_label,
  status: flow.status,
  statusLabel: flow.status_label,
  approvers: (flow.approvers || []).map(mapCurrentApprover),
  action: flow.action,
  actionLabel: flow.action_label,
  actedByUserId: flow.acted_by_user_id,
  actedByName: flow.acted_by_name,
  comment: flow.comment,
  actedAt: flow.acted_at,
})

const mapRecord = (record: ApiResignationApprovalRecord): ResignationApprovalRecord => ({
  id: record.id,
  applicationNo: record.application_no,
  fillDate: record.fill_date,
  campus: record.campus,
  name: record.name,
  gender: record.gender,
  department: record.department,
  position: record.position,
  entryDate: record.entry_date,
  contractEndDate: record.contract_end_date,
  leaveDate: record.leave_date,
  leaveType: record.leave_type,
  leaveTypeOther: record.leave_type_other,
  reason: record.reason,
  employeeSign: record.employee_sign,
  employeeSignDate: record.employee_sign_date,
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  departmentHeadOpinion: record.department_head_opinion,
  departmentHeadPassed: record.department_head_passed,
  departmentHeadSalaryEndDate: record.department_head_salary_end_date,
  hrOpinion: record.hr_opinion,
  hrPassed: record.hr_passed,
  hrSalaryEndDate: record.hr_salary_end_date,
  principalOpinion: record.principal_opinion,
  principalPassed: record.principal_passed,
  operationsReviewOpinion: record.operations_review_opinion,
  operationsReviewPassed: record.operations_review_passed,
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
  approvalFlow: (record.approval_flow || []).map(mapApprovalFlow),
  approvalActions: (record.approval_actions || []).map(mapApprovalAction),
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

export async function listResignationApprovals(params?: {
  campus?: string
  status?: ResignationApprovalStatus
  department?: string
}) {
  const response = await api.get<ApiResignationApprovalRecord[]>(
    '/human-resources/resignation-approvals',
    {
      params: {
        campus: params?.campus || undefined,
        status: params?.status || undefined,
        department: params?.department || undefined,
      },
    },
  )
  return response.data.map(mapRecord)
}

export async function previewResignationApproverCandidates(input: {
  campus: string
  department: string
  position: string
}) {
  const response = await api.post<ApiApprovalPreviewStage[]>(
    '/human-resources/resignation-approvals/approver-preview',
    input,
  )
  return response.data.map(mapApprovalPreviewStage)
}

export async function getResignationApproval(applicationId: number) {
  const response = await api.get<ApiResignationApprovalRecord>(
    `/human-resources/resignation-approvals/${applicationId}`,
  )
  return mapRecord(response.data)
}

export async function createResignationApproval(payload: ResignationApprovalPayload) {
  const response = await api.post<ApiResignationApprovalRecord>(
    '/human-resources/resignation-approvals',
    mapApplicationPayload(payload),
  )
  return mapRecord(response.data)
}

export async function updateResignationApproval(
  applicationId: number,
  payload: Partial<ResignationApprovalPayload>,
) {
  const response = await api.put<ApiResignationApprovalRecord>(
    `/human-resources/resignation-approvals/${applicationId}`,
    mapPartialApplicationPayload(payload),
  )
  return mapRecord(response.data)
}

export async function deleteResignationApproval(applicationId: number) {
  await api.delete(`/human-resources/resignation-approvals/${applicationId}`)
}

export async function submitResignationApproval(applicationId: number) {
  const response = await api.post<ApiResignationApprovalRecord>(
    `/human-resources/resignation-approvals/${applicationId}/submit`,
  )
  return mapRecord(response.data)
}

export async function approveResignationApproval(
  applicationId: number,
  payload?: ResignationApprovalActionPayload | string,
) {
  const response = await api.post<ApiResignationApprovalRecord>(
    `/human-resources/resignation-approvals/${applicationId}/approve`,
    mapActionPayload(payload),
  )
  return mapRecord(response.data)
}

export async function rejectResignationApproval(
  applicationId: number,
  payload: ResignationApprovalActionPayload | string,
) {
  const response = await api.post<ApiResignationApprovalRecord>(
    `/human-resources/resignation-approvals/${applicationId}/reject`,
    mapActionPayload(payload),
  )
  return mapRecord(response.data)
}
