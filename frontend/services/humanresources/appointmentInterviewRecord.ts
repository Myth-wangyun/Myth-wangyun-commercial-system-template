import { api } from '../api'

export type AppointmentInterviewRecordStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type AppointmentInterviewRecordStage = 'principal' | 'hr_director' | 'chairman'

export interface AppointmentInterviewApprovalInfo {
  opinion: string
  signer: string
  signDate: string
}

export interface AppointmentInterviewCurrentApprover {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface AppointmentInterviewApprovalPreviewStage {
  stage: AppointmentInterviewRecordStage
  stageLabel: string
  recommendedUserIds: number[]
  approvers: AppointmentInterviewCurrentApprover[]
  allowMultiApprover?: boolean
  applicantSelectable?: boolean
}

export interface AppointmentInterviewApprovalAction {
  id: number
  stage: string
  stageLabel: string
  action: string
  approverUserId?: number | null
  approverName?: string | null
  comment?: string | null
  createdAt: string
}

export interface AppointmentInterviewApprovalFlowStep {
  stage: AppointmentInterviewRecordStage
  stageLabel: string
  status: string
  statusLabel: string
  approvers: AppointmentInterviewCurrentApprover[]
  action?: string | null
  actionLabel?: string | null
  actedByUserId?: number | null
  actedByName?: string | null
  comment?: string | null
  actedAt?: string | null
}

interface ApiAppointmentInterviewApprovalInfo {
  opinion?: string | null
  signer?: string | null
  sign_date?: string | null
}

interface ApiAppointmentInterviewCurrentApprover {
  user_id: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

interface ApiAppointmentInterviewApprovalPreviewStage {
  stage: AppointmentInterviewRecordStage
  stage_label: string
  recommended_user_ids: number[]
  approvers: ApiAppointmentInterviewCurrentApprover[]
  allow_multi_approver?: boolean
  applicant_selectable?: boolean
}

interface ApiAppointmentInterviewApprovalAction {
  id: number
  stage: string
  stage_label: string
  action: string
  approver_user_id?: number | null
  approver_name?: string | null
  comment?: string | null
  created_at: string
}

interface ApiAppointmentInterviewApprovalFlowStep {
  stage: AppointmentInterviewRecordStage
  stage_label: string
  status: string
  status_label: string
  approvers: ApiAppointmentInterviewCurrentApprover[]
  action?: string | null
  action_label?: string | null
  acted_by_user_id?: number | null
  acted_by_name?: string | null
  comment?: string | null
  acted_at?: string | null
}

interface ApiAppointmentInterviewRecord {
  id: number
  campus: string
  interviewer: string
  interviewee: string
  location?: string | null
  interview_date: string
  answers: string[]
  suggestions?: string | null
  self_sign: ApiAppointmentInterviewApprovalInfo
  principal_approval: ApiAppointmentInterviewApprovalInfo
  principal_passed?: boolean | null
  hr_approval: ApiAppointmentInterviewApprovalInfo
  hr_passed?: boolean | null
  chairman_approval: ApiAppointmentInterviewApprovalInfo
  chairman_passed?: boolean | null
  status: AppointmentInterviewRecordStatus
  status_label: string
  current_stage?: AppointmentInterviewRecordStage | null
  current_stage_label?: string | null
  rejection_reason?: string | null
  submitted_at?: string | null
  completed_at?: string | null
  created_by_user_id?: number | null
  created_by_name?: string | null
  can_edit: boolean
  can_delete: boolean
  can_submit: boolean
  can_approve: boolean
  selected_approver_user_ids: Partial<Record<AppointmentInterviewRecordStage, number[]>>
  current_approvers: ApiAppointmentInterviewCurrentApprover[]
  approval_flow: ApiAppointmentInterviewApprovalFlowStep[]
  approval_actions: ApiAppointmentInterviewApprovalAction[]
  created_at: string
  updated_at: string
}

export interface AppointmentInterviewRecord {
  id: number
  campus: string
  interviewer: string
  interviewee: string
  location: string
  interviewDate: string
  answers: string[]
  suggestions: string
  selfSign: AppointmentInterviewApprovalInfo
  principalApproval: AppointmentInterviewApprovalInfo
  principalPassed?: boolean | null
  hrApproval: AppointmentInterviewApprovalInfo
  hrPassed?: boolean | null
  chairmanApproval: AppointmentInterviewApprovalInfo
  chairmanPassed?: boolean | null
  status: AppointmentInterviewRecordStatus
  statusLabel: string
  currentStage?: AppointmentInterviewRecordStage | null
  currentStageLabel?: string | null
  rejectionReason?: string | null
  submittedAt?: string | null
  completedAt?: string | null
  createdByUserId?: number | null
  createdByName?: string | null
  canEdit: boolean
  canDelete: boolean
  canSubmit: boolean
  canApprove: boolean
  selectedApproverUserIds: Partial<Record<AppointmentInterviewRecordStage, number[]>>
  currentApprovers: AppointmentInterviewCurrentApprover[]
  approvalFlow: AppointmentInterviewApprovalFlowStep[]
  approvalActions: AppointmentInterviewApprovalAction[]
  createdAt: string
  updatedAt: string
}

export interface AppointmentInterviewRecordPayload {
  campus: string
  interviewer: string
  interviewee: string
  location?: string
  interviewDate: string
  answers: string[]
  suggestions?: string
  selfSign?: AppointmentInterviewApprovalInfo
  selectedApproverUserIds?: Partial<Record<AppointmentInterviewRecordStage, number[]>>
}

export interface AppointmentInterviewApprovalActionPayload {
  comment: string
}

const normalizeString = (value?: string | null) => value || ''

const mapApprovalInfo = (
  info?: ApiAppointmentInterviewApprovalInfo | null,
): AppointmentInterviewApprovalInfo => ({
  opinion: normalizeString(info?.opinion),
  signer: normalizeString(info?.signer),
  signDate: normalizeString(info?.sign_date),
})

const mapApprover = (
  approver: ApiAppointmentInterviewCurrentApprover,
): AppointmentInterviewCurrentApprover => ({
  userId: approver.user_id,
  name: approver.name,
  department: approver.department,
  position: approver.position,
  campus: approver.campus,
})

const mapApprovalAction = (
  action: ApiAppointmentInterviewApprovalAction,
): AppointmentInterviewApprovalAction => ({
  id: action.id,
  stage: action.stage,
  stageLabel: action.stage_label,
  action: action.action,
  approverUserId: action.approver_user_id,
  approverName: action.approver_name,
  comment: action.comment,
  createdAt: action.created_at,
})

const mapApprovalFlowStep = (
  step: ApiAppointmentInterviewApprovalFlowStep,
): AppointmentInterviewApprovalFlowStep => ({
  stage: step.stage,
  stageLabel: step.stage_label,
  status: step.status,
  statusLabel: step.status_label,
  approvers: Array.isArray(step.approvers) ? step.approvers.map(mapApprover) : [],
  action: step.action,
  actionLabel: step.action_label,
  actedByUserId: step.acted_by_user_id,
  actedByName: step.acted_by_name,
  comment: step.comment,
  actedAt: step.acted_at,
})

const mapPreviewStage = (
  stage: ApiAppointmentInterviewApprovalPreviewStage,
): AppointmentInterviewApprovalPreviewStage => ({
  stage: stage.stage,
  stageLabel: stage.stage_label,
  recommendedUserIds: stage.recommended_user_ids || [],
  approvers: Array.isArray(stage.approvers) ? stage.approvers.map(mapApprover) : [],
  allowMultiApprover: stage.allow_multi_approver,
  applicantSelectable: stage.applicant_selectable,
})

const mapPayloadApprovalInfo = (info?: AppointmentInterviewApprovalInfo) => ({
  opinion: info?.opinion || undefined,
  signer: info?.signer || undefined,
  sign_date: info?.signDate || undefined,
})

const mapRecord = (record: ApiAppointmentInterviewRecord): AppointmentInterviewRecord => ({
  id: record.id,
  campus: record.campus,
  interviewer: record.interviewer,
  interviewee: record.interviewee,
  location: normalizeString(record.location),
  interviewDate: record.interview_date,
  answers: Array.isArray(record.answers) ? record.answers : [],
  suggestions: normalizeString(record.suggestions),
  selfSign: mapApprovalInfo(record.self_sign),
  principalApproval: mapApprovalInfo(record.principal_approval),
  principalPassed: record.principal_passed,
  hrApproval: mapApprovalInfo(record.hr_approval),
  hrPassed: record.hr_passed,
  chairmanApproval: mapApprovalInfo(record.chairman_approval),
  chairmanPassed: record.chairman_passed,
  status: record.status,
  statusLabel: record.status_label,
  currentStage: record.current_stage,
  currentStageLabel: record.current_stage_label,
  rejectionReason: record.rejection_reason,
  submittedAt: record.submitted_at,
  completedAt: record.completed_at,
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  canEdit: record.can_edit,
  canDelete: record.can_delete,
  canSubmit: record.can_submit,
  canApprove: record.can_approve,
  selectedApproverUserIds: record.selected_approver_user_ids || {},
  currentApprovers: Array.isArray(record.current_approvers)
    ? record.current_approvers.map(mapApprover)
    : [],
  approvalFlow: Array.isArray(record.approval_flow)
    ? record.approval_flow.map(mapApprovalFlowStep)
    : [],
  approvalActions: Array.isArray(record.approval_actions)
    ? record.approval_actions.map(mapApprovalAction)
    : [],
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

const mapPayload = (payload: AppointmentInterviewRecordPayload) => ({
  campus: payload.campus,
  interviewer: payload.interviewer,
  interviewee: payload.interviewee,
  location: payload.location || undefined,
  interview_date: payload.interviewDate,
  answers: payload.answers,
  suggestions: payload.suggestions || undefined,
  self_sign: mapPayloadApprovalInfo(payload.selfSign),
  selected_approver_user_ids: payload.selectedApproverUserIds || {},
})

export async function listAppointmentInterviewRecords(params?: {
  status?: AppointmentInterviewRecordStatus
  search?: string
}) {
  const response = await api.get<ApiAppointmentInterviewRecord[]>(
    '/human-resources/appointment-interview-records',
    {
      params: {
        status: params?.status,
        search: params?.search,
      },
    },
  )
  return response.data.map(mapRecord)
}

export async function getAppointmentInterviewRecord(id: number) {
  const response = await api.get<ApiAppointmentInterviewRecord>(
    `/human-resources/appointment-interview-records/${id}`,
  )
  return mapRecord(response.data)
}

export async function createAppointmentInterviewRecord(payload: AppointmentInterviewRecordPayload) {
  const response = await api.post<ApiAppointmentInterviewRecord>(
    '/human-resources/appointment-interview-records',
    mapPayload(payload),
  )
  return mapRecord(response.data)
}

export async function updateAppointmentInterviewRecord(
  id: number,
  payload: AppointmentInterviewRecordPayload,
) {
  const response = await api.put<ApiAppointmentInterviewRecord>(
    `/human-resources/appointment-interview-records/${id}`,
    mapPayload(payload),
  )
  return mapRecord(response.data)
}

export async function deleteAppointmentInterviewRecord(id: number) {
  await api.delete(`/human-resources/appointment-interview-records/${id}`)
}

export async function submitAppointmentInterviewRecord(id: number) {
  const response = await api.post<ApiAppointmentInterviewRecord>(
    `/human-resources/appointment-interview-records/${id}/submit`,
  )
  return mapRecord(response.data)
}

export async function approveAppointmentInterviewRecord(
  id: number,
  payload: AppointmentInterviewApprovalActionPayload,
) {
  const response = await api.post<ApiAppointmentInterviewRecord>(
    `/human-resources/appointment-interview-records/${id}/approve`,
    payload,
  )
  return mapRecord(response.data)
}

export async function rejectAppointmentInterviewRecord(
  id: number,
  payload: AppointmentInterviewApprovalActionPayload,
) {
  const response = await api.post<ApiAppointmentInterviewRecord>(
    `/human-resources/appointment-interview-records/${id}/reject`,
    payload,
  )
  return mapRecord(response.data)
}

export async function previewAppointmentInterviewApproverCandidates(payload: { campus: string }) {
  const response = await api.post<ApiAppointmentInterviewApprovalPreviewStage[]>(
    '/human-resources/appointment-interview-records/approver-preview',
    {
      campus: payload.campus,
    },
  )
  return (response.data || []).map(mapPreviewStage)
}
