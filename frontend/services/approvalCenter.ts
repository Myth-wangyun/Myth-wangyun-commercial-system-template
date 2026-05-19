import {
  handleTransferApproval,
} from '@/services/consult/consultantTransfer'
import {
  approveExportApprovalRequest,
  rejectExportApprovalRequest,
} from '@/services/consult/exportApproval'
import {
  approveAppointmentInterviewRecord,
  getAppointmentInterviewRecord,
  rejectAppointmentInterviewRecord,
  type AppointmentInterviewRecord,
} from '@/services/humanresources/appointmentInterviewRecord'
import {
  approveRecruitmentRequest,
  getRecruitmentRequest,
  rejectRecruitmentRequest,
  type RecruitmentRequestRecord,
} from '@/services/humanresources/recruitmentRequest'
import {
  approvePromotionApplication,
  getPromotionApplication,
  rejectPromotionApplication,
  type PromotionApplicationRecord,
} from '@/services/humanresources/promotionApplication'
import {
  approveRegularizationApplication,
  getRegularizationApplication,
  rejectRegularizationApplication,
  type RegularizationApplicationRecord,
} from '@/services/humanresources/regularizationApplication'
import {
  approveResignationApproval,
  getResignationApproval,
  rejectResignationApproval,
  type ResignationApprovalActionPayload,
  type ResignationApprovalRecord,
} from '@/services/humanresources/resignationApproval'
import {
  approveSocialInsuranceApplication,
  getSocialInsuranceApplication,
  rejectSocialInsuranceApplication,
  type SocialInsuranceApprovalActionPayload,
  type SocialInsuranceApplicationRecord,
} from '@/services/humanresources/socialInsuranceApplication'
import {
  approveTransferApplication,
  getTransferApplication,
  rejectTransferApplication,
  type TransferApplicationRecord,
} from '@/services/humanresources/transferApplication'
import {
  approveTrainingApplication,
  getTrainingApplication,
  rejectTrainingApplication,
  type TrainingApplicationRecord,
} from '@/services/humanresources/trainingApplication'
import {
  approveUnpaidLeaveApplication,
  getUnpaidLeaveApplication,
  rejectUnpaidLeaveApplication,
  type UnpaidLeaveApplicationRecord,
} from '@/services/humanresources/unpaidLeaveApplication'
import {
  approveWorkHandover,
  getWorkHandover,
  rejectWorkHandover,
  type WorkHandoverRecord,
} from '@/services/humanresources/workHandover'
import { api } from '@/services/api'

export type ApprovalCenterItemType =
  | 'appointment_interview'
  | 'recruitment'
  | 'training_application'
  | 'regularization'
  | 'promotion'
  | 'social_insurance'
  | 'transfer_application'
  | 'unpaid_leave'
  | 'work_handover'
  | 'resignation_approval'
  | 'transfer'
  | 'export'

export interface ApprovalCenterItem {
  id: string
  type: ApprovalCenterItemType
  title: string
  applicant: string
  campus?: string | null
  department?: string | null
  submittedAt: string
  description?: string | null
  actionPath: string
  rawId: number
}

export interface ApprovalCenterSummary {
  total: number
  appointmentInterviewCount: number
  recruitmentCount: number
  trainingApplicationCount: number
  regularizationCount: number
  promotionCount: number
  socialInsuranceCount: number
  transferApplicationCount: number
  unpaidLeaveCount: number
  workHandoverCount: number
  resignationApprovalCount: number
  transferCount: number
  exportCount: number
  items: ApprovalCenterItem[]
}

export interface ApprovalReminderSummary {
  total: number
  appointmentInterviewCount: number
  recruitmentCount: number
  trainingApplicationCount: number
  regularizationCount: number
  promotionCount: number
  socialInsuranceCount: number
  transferApplicationCount: number
  unpaidLeaveCount: number
  workHandoverCount: number
  resignationApprovalCount: number
  transferCount: number
  exportCount: number
  notificationCount: number
  attentionTotal: number
}

export interface ApprovalNotificationItem {
  id: number
  bizType:
    | 'appointment_interview'
    | 'recruitment'
    | 'training_application'
    | 'regularization'
    | 'promotion'
    | 'social_insurance'
    | 'transfer_application'
    | 'unpaid_leave'
    | 'work_handover'
    | 'resignation_approval'
  requestId: number
  requestNo: string
  notificationType: string
  title: string
  content: string
  stage?: string | null
  stageLabel?: string | null
  isRead: boolean
  actionByUserId?: number | null
  actionByName?: string | null
  createdAt: string
  readAt?: string | null
}

export interface ApprovalHistoryItem {
  id: string
  type:
    | 'appointment_interview'
    | 'recruitment'
    | 'training_application'
    | 'regularization'
    | 'promotion'
    | 'social_insurance'
    | 'transfer_application'
    | 'unpaid_leave'
    | 'work_handover'
    | 'resignation_approval'
  rawId: number
  requestNo: string
  title: string
  applicant: string
  campus?: string | null
  department?: string | null
  status: string
  statusLabel: string
  currentStageLabel?: string | null
  updatedAt: string
}

export type ApprovalDetailRecord =
  | AppointmentInterviewRecord
  | RecruitmentRequestRecord
  | TrainingApplicationRecord
  | PromotionApplicationRecord
  | RegularizationApplicationRecord
  | ResignationApprovalRecord
  | SocialInsuranceApplicationRecord
  | TransferApplicationRecord
  | UnpaidLeaveApplicationRecord
  | WorkHandoverRecord

const getApprovalApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api/v1'
    }
  }
  return '/api/v1'
}

export async function getApprovalCenterSummary(): Promise<ApprovalCenterSummary> {
  const response = await api.get<{
    total: number
    appointment_interview_count: number
    recruitment_count: number
    training_application_count: number
    regularization_count: number
    promotion_count: number
    social_insurance_count: number
    transfer_application_count: number
    unpaid_leave_count: number
    work_handover_count: number
    resignation_approval_count: number
    transfer_count: number
    export_count: number
    items: Array<{
      id: string
      type: ApprovalCenterItemType
      title: string
      applicant: string
      campus?: string | null
      department?: string | null
      submitted_at: string
      description?: string | null
      action_path: string
      raw_id: number
    }>
  }>('/approvals/pending-items')

  return {
    total: response.data.total,
    appointmentInterviewCount: response.data.appointment_interview_count,
    recruitmentCount: response.data.recruitment_count,
    trainingApplicationCount: response.data.training_application_count,
    regularizationCount: response.data.regularization_count,
    promotionCount: response.data.promotion_count,
    socialInsuranceCount: response.data.social_insurance_count,
    transferApplicationCount: response.data.transfer_application_count,
    unpaidLeaveCount: response.data.unpaid_leave_count,
    workHandoverCount: response.data.work_handover_count,
    resignationApprovalCount: response.data.resignation_approval_count,
    transferCount: response.data.transfer_count,
    exportCount: response.data.export_count,
    items: (response.data.items || []).map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      applicant: item.applicant,
      campus: item.campus,
      department: item.department,
      submittedAt: item.submitted_at,
      description: item.description,
      actionPath: item.action_path,
      rawId: item.raw_id,
    })),
  }
}

export async function getApprovalReminderSummary(): Promise<ApprovalReminderSummary> {
  const response = await api.get<{
    total: number
    attention_total: number
    appointment_interview_count: number
    recruitment_count: number
    training_application_count: number
    regularization_count: number
    promotion_count: number
    social_insurance_count: number
    transfer_application_count: number
    unpaid_leave_count: number
    work_handover_count: number
    resignation_approval_count: number
    transfer_count: number
    export_count: number
    notification_count: number
  }>('/approvals/summary')
  return {
    total: response.data.total,
    appointmentInterviewCount: response.data.appointment_interview_count,
    recruitmentCount: response.data.recruitment_count,
    trainingApplicationCount: response.data.training_application_count,
    regularizationCount: response.data.regularization_count,
    promotionCount: response.data.promotion_count,
    socialInsuranceCount: response.data.social_insurance_count,
    transferApplicationCount: response.data.transfer_application_count,
    unpaidLeaveCount: response.data.unpaid_leave_count,
    workHandoverCount: response.data.work_handover_count,
    resignationApprovalCount: response.data.resignation_approval_count,
    transferCount: response.data.transfer_count,
    exportCount: response.data.export_count,
    notificationCount: response.data.notification_count,
    attentionTotal: response.data.attention_total,
  }
}

export function subscribeApprovalReminderSummary(
  onSummary: (summary: ApprovalReminderSummary) => void,
  onError?: () => void,
) {
  const eventSource = new EventSource(`${getApprovalApiBaseUrl()}/approvals/stream`, {
    withCredentials: true,
  })

  eventSource.addEventListener('summary', (event) => {
    const payload = JSON.parse((event as MessageEvent).data) as {
      total: number
      attention_total: number
      appointment_interview_count: number
      recruitment_count: number
      training_application_count: number
      regularization_count: number
      promotion_count: number
      social_insurance_count: number
      transfer_application_count: number
      unpaid_leave_count: number
      work_handover_count: number
      resignation_approval_count: number
      transfer_count: number
      export_count: number
      notification_count: number
    }
    onSummary({
      total: payload.total,
      appointmentInterviewCount: payload.appointment_interview_count,
      recruitmentCount: payload.recruitment_count,
      trainingApplicationCount: payload.training_application_count,
      regularizationCount: payload.regularization_count,
      promotionCount: payload.promotion_count,
      socialInsuranceCount: payload.social_insurance_count,
      transferApplicationCount: payload.transfer_application_count,
      unpaidLeaveCount: payload.unpaid_leave_count,
      workHandoverCount: payload.work_handover_count,
      resignationApprovalCount: payload.resignation_approval_count,
      transferCount: payload.transfer_count,
      exportCount: payload.export_count,
      notificationCount: payload.notification_count,
      attentionTotal: payload.attention_total,
    })
  })

  eventSource.onerror = () => {
    onError?.()
  }

  return () => eventSource.close()
}

export async function approveApprovalCenterItem(
  item: ApprovalCenterItem,
  comment?: string,
  options?: {
    targetConsultant?: string
    socialInsurancePayload?: SocialInsuranceApprovalActionPayload
    resignationApprovalPayload?: ResignationApprovalActionPayload
  },
): Promise<void> {
  if (item.type === 'appointment_interview') {
    await approveAppointmentInterviewRecord(item.rawId, { comment: comment || '通过' })
    return
  }
  if (item.type === 'recruitment') {
    await approveRecruitmentRequest(item.rawId, comment)
    return
  }
  if (item.type === 'training_application') {
    await approveTrainingApplication(item.rawId, comment)
    return
  }
  if (item.type === 'regularization') {
    await approveRegularizationApplication(item.rawId, comment)
    return
  }
  if (item.type === 'promotion') {
    await approvePromotionApplication(item.rawId, { comment })
    return
  }
  if (item.type === 'social_insurance') {
    await approveSocialInsuranceApplication(item.rawId, {
      comment,
      ...options?.socialInsurancePayload,
    })
    return
  }
  if (item.type === 'transfer_application') {
    await approveTransferApplication(item.rawId, { comment })
    return
  }
  if (item.type === 'unpaid_leave') {
    await approveUnpaidLeaveApplication(item.rawId, comment)
    return
  }
  if (item.type === 'work_handover') {
    await approveWorkHandover(item.rawId, comment)
    return
  }
  if (item.type === 'resignation_approval') {
    await approveResignationApproval(item.rawId, options?.resignationApprovalPayload || comment)
    return
  }
  if (item.type === 'transfer') {
    await handleTransferApproval({
      recordIds: [item.rawId],
      approved: true,
      opinion: comment || '同意',
      targetConsultant: options?.targetConsultant,
    })
    return
  }
  if (item.type === 'export') {
    await approveExportApprovalRequest(item.rawId, comment)
    return
  }
  throw new Error('当前审批事项暂不支持处理')
}

export async function rejectApprovalCenterItem(
  item: ApprovalCenterItem,
  comment: string,
): Promise<void> {
  if (item.type === 'appointment_interview') {
    await rejectAppointmentInterviewRecord(item.rawId, { comment })
    return
  }
  if (item.type === 'recruitment') {
    await rejectRecruitmentRequest(item.rawId, comment)
    return
  }
  if (item.type === 'training_application') {
    await rejectTrainingApplication(item.rawId, comment)
    return
  }
  if (item.type === 'regularization') {
    await rejectRegularizationApplication(item.rawId, comment)
    return
  }
  if (item.type === 'promotion') {
    await rejectPromotionApplication(item.rawId, comment)
    return
  }
  if (item.type === 'social_insurance') {
    await rejectSocialInsuranceApplication(item.rawId, comment)
    return
  }
  if (item.type === 'transfer_application') {
    await rejectTransferApplication(item.rawId, comment)
    return
  }
  if (item.type === 'unpaid_leave') {
    await rejectUnpaidLeaveApplication(item.rawId, comment)
    return
  }
  if (item.type === 'work_handover') {
    await rejectWorkHandover(item.rawId, comment)
    return
  }
  if (item.type === 'resignation_approval') {
    await rejectResignationApproval(item.rawId, { comment })
    return
  }
  if (item.type === 'transfer') {
    await handleTransferApproval({
      recordIds: [item.rawId],
      approved: false,
      opinion: comment,
    })
    return
  }
  if (item.type === 'export') {
    await rejectExportApprovalRequest(item.rawId, comment)
    return
  }
  throw new Error('当前审批事项暂不支持处理')
}

export async function listApprovalNotifications(params?: { unreadOnly?: boolean }) {
  const response = await api.get<{
    data: Array<{
      id: number
      biz_type:
        | 'appointment_interview'
        | 'recruitment'
        | 'training_application'
        | 'regularization'
        | 'promotion'
        | 'social_insurance'
        | 'transfer_application'
        | 'unpaid_leave'
        | 'work_handover'
        | 'resignation_approval'
      request_id: number
      request_no: string
      notification_type: string
      title: string
      content: string
      stage?: string | null
      stage_label?: string | null
      is_read: boolean
      action_by_user_id?: number | null
      action_by_name?: string | null
      created_at: string
      read_at?: string | null
    }>
    total: number
  }>('/approvals/notifications', {
    params: { unread_only: params?.unreadOnly || undefined },
  })
  return response.data.data.map<ApprovalNotificationItem>((item) => ({
    id: item.id,
    bizType: item.biz_type,
    requestId: item.request_id,
    requestNo: item.request_no,
    notificationType: item.notification_type,
    title: item.title,
    content: item.content,
    stage: item.stage,
    stageLabel: item.stage_label,
    isRead: item.is_read,
    actionByUserId: item.action_by_user_id,
    actionByName: item.action_by_name,
    createdAt: item.created_at,
    readAt: item.read_at,
  }))
}

export async function markApprovalNotificationRead(notificationId: number) {
  await api.post(`/approvals/notifications/${notificationId}/read`)
}

export async function markApprovalNotificationReadWithBiz(
  notificationId: number,
  bizType:
    | 'appointment_interview'
    | 'recruitment'
    | 'training_application'
    | 'regularization'
    | 'promotion'
    | 'social_insurance'
    | 'transfer_application'
    | 'unpaid_leave'
    | 'work_handover'
    | 'resignation_approval',
) {
  await api.post(`/approvals/notifications/${notificationId}/read`, undefined, {
    params: { biz_type: bizType },
  })
}

export async function markAllApprovalNotificationsRead() {
  await api.post('/approvals/notifications/read-all')
}

export async function getApprovalHistoryItems(): Promise<ApprovalHistoryItem[]> {
  const response = await api.get<{
    data: Array<{
      id: string
      type: ApprovalHistoryItem['type']
      raw_id: number
      request_no: string
      title: string
      applicant: string
      campus?: string | null
      department?: string | null
      status: string
      status_label: string
      current_stage_label?: string | null
      updated_at: string
    }>
    total: number
  }>('/approvals/history')

  return (response.data.data || []).map((item) => ({
    id: item.id,
    type: item.type,
    rawId: item.raw_id,
    requestNo: item.request_no,
    title: item.title,
    applicant: item.applicant,
    campus: item.campus,
    department: item.department,
    status: item.status,
    statusLabel: item.status_label,
    currentStageLabel: item.current_stage_label,
    updatedAt: item.updated_at,
  }))
}

export async function getApprovalCenterDetail(
  item:
    | ApprovalCenterItem
    | ApprovalHistoryItem
    | {
        type:
          | 'appointment_interview'
          | 'recruitment'
            | 'training_application'
          | 'regularization'
          | 'promotion'
          | 'social_insurance'
          | 'transfer_application'
          | 'unpaid_leave'
          | 'work_handover'
          | 'resignation_approval'
        rawId: number
      },
): Promise<ApprovalDetailRecord> {
  if (item.type === 'appointment_interview') {
    return getAppointmentInterviewRecord(item.rawId)
  }
  if (item.type === 'recruitment') {
    return getRecruitmentRequest(item.rawId)
  }
  if (item.type === 'training_application') {
    return getTrainingApplication(item.rawId)
  }
  if (item.type === 'regularization') {
    return getRegularizationApplication(item.rawId)
  }
  if (item.type === 'promotion') {
    return getPromotionApplication(item.rawId)
  }
  if (item.type === 'transfer_application') {
    return getTransferApplication(item.rawId)
  }
  if (item.type === 'unpaid_leave') {
    return getUnpaidLeaveApplication(item.rawId)
  }
  if (item.type === 'work_handover') {
    return getWorkHandover(item.rawId)
  }
  if (item.type === 'resignation_approval') {
    return getResignationApproval(item.rawId)
  }
  return getSocialInsuranceApplication(item.rawId)
}
