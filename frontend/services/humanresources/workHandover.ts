import { api } from '../api'

export type WorkHandoverStatus = 'draft' | 'pending' | 'approved' | 'rejected'
export type WorkHandoverStage =
  | 'department_head'
  | 'operations_reviewer'
  | 'academic_reviewer'
  | 'teaching_quality_reviewer'
  | 'chairman'

export interface WorkHandoverDepartmentSection {
  workHandover: string
  materialsHandover: string
  pendingItems: string
  workCompleted: boolean
  noIssues: boolean
  managerSign: string
  managerDate?: string | null
  lastMonth: string
  lastDay: string
  salarySign: string
  salaryDate?: string | null
  receiver: string
  handleDate?: string | null
}

export interface WorkHandoverFinanceSection {
  hasDebt: boolean
  debtAmount?: number | null
  receiptSubmitted: boolean
  receiptCount?: number | null
  financeItems: string
  cashierSign: string
  cashierDate?: string | null
  accountCleared: boolean
  itemsCompleted: boolean
  managerSign: string
  managerDate?: string | null
}

export interface WorkHandoverHrSection {
  fixedAssets: string
  officeSupplies: string
  fingerprint: string
  insurance: string
  receiver: string
  handleDate?: string | null
  completed: boolean
  salaryNormal: boolean
  salaryEndYear: string
  salaryEndMonth: string
  salaryEndDay: string
  managerSign: string
  managerDate?: string | null
}

export interface WorkHandoverApproverCandidate {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export interface WorkHandoverApprovalPreviewStage {
  stage: WorkHandoverStage
  stageLabel: string
  recommendedUserIds: number[]
  approvers: WorkHandoverApproverCandidate[]
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

interface ApiDepartmentSection {
  work_handover?: string
  materials_handover?: string
  pending_items?: string
  work_completed?: boolean
  no_issues?: boolean
  manager_sign?: string
  manager_date?: string | null
  last_month?: string
  last_day?: string
  salary_sign?: string
  salary_date?: string | null
  receiver?: string
  handle_date?: string | null
}

interface ApiFinanceSection {
  has_debt?: boolean
  debt_amount?: number | null
  receipt_submitted?: boolean
  receipt_count?: number | null
  finance_items?: string
  cashier_sign?: string
  cashier_date?: string | null
  account_cleared?: boolean
  items_completed?: boolean
  manager_sign?: string
  manager_date?: string | null
}

interface ApiHrSection {
  fixed_assets?: string
  office_supplies?: string
  fingerprint?: string
  insurance?: string
  receiver?: string
  handle_date?: string | null
  completed?: boolean
  salary_normal?: boolean
  salary_end_year?: string
  salary_end_month?: string
  salary_end_day?: string
  manager_sign?: string
  manager_date?: string | null
}

interface ApiWorkHandoverRecord {
  id: number
  application_no: string
  campus: string
  name: string
  department: string
  position: string
  entry_date?: string | null
  phone?: string | null
  email?: string | null
  leave_date: string
  leave_type?: string | null
  leave_type_other?: string | null
  leave_reason: string[]
  leave_reason_other?: string | null
  address?: string | null
  dept_handover: ApiDepartmentSection
  finance_handover: ApiFinanceSection
  hr_handover: ApiHrSection
  all_completed: boolean
  principal_sign?: string | null
  principal_date?: string | null
  principal_sign_required?: boolean
  created_by_user_id?: number | null
  created_by_name?: string | null
  department_head_opinion?: string | null
  department_head_passed?: boolean | null
  operations_review_opinion?: string | null
  operations_review_passed?: boolean | null
  academic_review_opinion?: string | null
  academic_review_passed?: boolean | null
  teaching_quality_review_opinion?: string | null
  teaching_quality_review_passed?: boolean | null
  chairman_opinion?: string | null
  chairman_passed?: boolean | null
  is_passed?: boolean | null
  status: WorkHandoverStatus
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
  selected_approver_user_ids: Partial<Record<WorkHandoverStage, number[]>>
  current_approvers: ApiCurrentApprover[]
  approval_flow: ApiApprovalFlowStep[]
  approval_actions: ApiApprovalAction[]
  created_at: string
  updated_at: string
}

export interface WorkHandoverAssigneeSuggestion {
  recommendedName?: string | null
  candidates: WorkHandoverApproverCandidate[]
}

export interface WorkHandoverFormAssigneePreview {
  departmentReceiver: WorkHandoverAssigneeSuggestion
  financeCashier: WorkHandoverAssigneeSuggestion
  financeManager: WorkHandoverAssigneeSuggestion
  hrReceiver: WorkHandoverAssigneeSuggestion
  principalSignRequired: boolean
}

interface ApiAssigneeSuggestion {
  recommended_name?: string | null
  candidates?: ApiCurrentApprover[]
}

interface ApiFormAssigneePreview {
  department_receiver?: ApiAssigneeSuggestion
  finance_cashier?: ApiAssigneeSuggestion
  finance_manager?: ApiAssigneeSuggestion
  hr_receiver?: ApiAssigneeSuggestion
  principal_sign_required?: boolean
}

interface ApiApprovalPreviewStage {
  stage: WorkHandoverStage
  stage_label: string
  recommended_user_ids: number[]
  approvers: ApiCurrentApprover[]
}

const mapAssigneeSuggestion = (
  item?: ApiAssigneeSuggestion | null,
): WorkHandoverAssigneeSuggestion => ({
  recommendedName: item?.recommended_name,
  candidates: (item?.candidates || []).map(mapCurrentApprover),
})

export interface WorkHandoverCurrentApprover {
  userId: number
  name: string
  department?: string | null
  position?: string | null
  campus?: string | null
}

export async function previewWorkHandoverFormAssignees(payload: {
  campus: string
  department: string
  position: string
}) {
  const response = await api.post<ApiFormAssigneePreview>(
    '/human-resources/work-handovers/form-assignee-preview',
    payload,
  )
  return {
    departmentReceiver: mapAssigneeSuggestion(response.data.department_receiver),
    financeCashier: mapAssigneeSuggestion(response.data.finance_cashier),
    financeManager: mapAssigneeSuggestion(response.data.finance_manager),
    hrReceiver: mapAssigneeSuggestion(response.data.hr_receiver),
    principalSignRequired: response.data.principal_sign_required !== false,
  }
}

export interface WorkHandoverApprovalAction {
  id: number
  stage: string
  stageLabel: string
  action: string
  approverUserId?: number | null
  approverName?: string | null
  comment?: string | null
  createdAt: string
}

export interface WorkHandoverApprovalFlowStep {
  stage: string
  stageLabel: string
  status: string
  statusLabel: string
  approvers: WorkHandoverCurrentApprover[]
  action?: string | null
  actionLabel?: string | null
  actedByUserId?: number | null
  actedByName?: string | null
  comment?: string | null
  actedAt?: string | null
}

export interface WorkHandoverRecord {
  id: number
  applicationNo: string
  campus: string
  name: string
  department: string
  position: string
  entryDate?: string | null
  phone?: string | null
  email?: string | null
  leaveDate: string
  leaveType?: string | null
  leaveTypeOther?: string | null
  leaveReason: string[]
  leaveReasonOther?: string | null
  address?: string | null
  deptHandover: WorkHandoverDepartmentSection
  financeHandover: WorkHandoverFinanceSection
  hrHandover: WorkHandoverHrSection
  allCompleted: boolean
  principalSign?: string | null
  principalDate?: string | null
  principalSignRequired: boolean
  createdByUserId?: number | null
  createdByName?: string | null
  departmentHeadOpinion?: string | null
  departmentHeadPassed?: boolean | null
  operationsReviewOpinion?: string | null
  operationsReviewPassed?: boolean | null
  academicReviewOpinion?: string | null
  academicReviewPassed?: boolean | null
  teachingQualityReviewOpinion?: string | null
  teachingQualityReviewPassed?: boolean | null
  chairmanOpinion?: string | null
  chairmanPassed?: boolean | null
  isPassed?: boolean | null
  status: WorkHandoverStatus
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
  selectedApproverUserIds: Partial<Record<WorkHandoverStage, number[]>>
  currentApprovers: WorkHandoverCurrentApprover[]
  approvalFlow: WorkHandoverApprovalFlowStep[]
  approvalActions: WorkHandoverApprovalAction[]
  createdAt: string
  updatedAt: string
}

export interface WorkHandoverPayload {
  campus: string
  name: string
  department: string
  position: string
  entryDate?: string | null
  phone?: string | null
  email?: string | null
  leaveDate: string
  leaveType?: string | null
  leaveTypeOther?: string | null
  leaveReason: string[]
  leaveReasonOther?: string | null
  address?: string | null
  deptHandover: WorkHandoverDepartmentSection
  financeHandover: WorkHandoverFinanceSection
  hrHandover: WorkHandoverHrSection
  allCompleted: boolean
  principalSign?: string | null
  principalDate?: string | null
  selectedApproverUserIds?: Partial<Record<WorkHandoverStage, number[]>>
}

const mapDepartmentSectionPayload = (payload: WorkHandoverDepartmentSection) => ({
  work_handover: payload.workHandover,
  materials_handover: payload.materialsHandover,
  pending_items: payload.pendingItems,
  work_completed: payload.workCompleted,
  no_issues: payload.noIssues,
  manager_sign: payload.managerSign,
  manager_date: payload.managerDate || undefined,
  last_month: payload.lastMonth,
  last_day: payload.lastDay,
  salary_sign: payload.salarySign,
  salary_date: payload.salaryDate || undefined,
  receiver: payload.receiver,
  handle_date: payload.handleDate || undefined,
})

const mapFinanceSectionPayload = (payload: WorkHandoverFinanceSection) => ({
  has_debt: payload.hasDebt,
  debt_amount: payload.debtAmount ?? undefined,
  receipt_submitted: payload.receiptSubmitted,
  receipt_count: payload.receiptCount ?? undefined,
  finance_items: payload.financeItems,
  cashier_sign: payload.cashierSign,
  cashier_date: payload.cashierDate || undefined,
  account_cleared: payload.accountCleared,
  items_completed: payload.itemsCompleted,
  manager_sign: payload.managerSign,
  manager_date: payload.managerDate || undefined,
})

const mapHrSectionPayload = (payload: WorkHandoverHrSection) => ({
  fixed_assets: payload.fixedAssets,
  office_supplies: payload.officeSupplies,
  fingerprint: payload.fingerprint,
  insurance: payload.insurance,
  receiver: payload.receiver,
  handle_date: payload.handleDate || undefined,
  completed: payload.completed,
  salary_normal: payload.salaryNormal,
  salary_end_year: payload.salaryEndYear,
  salary_end_month: payload.salaryEndMonth,
  salary_end_day: payload.salaryEndDay,
  manager_sign: payload.managerSign,
  manager_date: payload.managerDate || undefined,
})

const mapPayload = (payload: WorkHandoverPayload) => ({
  campus: payload.campus,
  name: payload.name,
  department: payload.department,
  position: payload.position,
  entry_date: payload.entryDate || undefined,
  phone: payload.phone || undefined,
  email: payload.email || undefined,
  leave_date: payload.leaveDate,
  leave_type: payload.leaveType || undefined,
  leave_type_other: payload.leaveTypeOther || undefined,
  leave_reason: payload.leaveReason || [],
  leave_reason_other: payload.leaveReasonOther || undefined,
  address: payload.address || undefined,
  dept_handover: mapDepartmentSectionPayload(payload.deptHandover),
  finance_handover: mapFinanceSectionPayload(payload.financeHandover),
  hr_handover: mapHrSectionPayload(payload.hrHandover),
  all_completed: payload.allCompleted,
  principal_sign: payload.principalSign || undefined,
  principal_date: payload.principalDate || undefined,
  selected_approver_user_ids: payload.selectedApproverUserIds || {},
})

const mapPartialPayload = (payload: Partial<WorkHandoverPayload>) => {
  const result: Record<string, unknown> = {}
  if (payload.campus !== undefined) result.campus = payload.campus
  if (payload.name !== undefined) result.name = payload.name
  if (payload.department !== undefined) result.department = payload.department
  if (payload.position !== undefined) result.position = payload.position
  if (payload.entryDate !== undefined) result.entry_date = payload.entryDate || undefined
  if (payload.phone !== undefined) result.phone = payload.phone || undefined
  if (payload.email !== undefined) result.email = payload.email || undefined
  if (payload.leaveDate !== undefined) result.leave_date = payload.leaveDate
  if (payload.leaveType !== undefined) result.leave_type = payload.leaveType || undefined
  if (payload.leaveTypeOther !== undefined)
    result.leave_type_other = payload.leaveTypeOther || undefined
  if (payload.leaveReason !== undefined) result.leave_reason = payload.leaveReason || []
  if (payload.leaveReasonOther !== undefined)
    result.leave_reason_other = payload.leaveReasonOther || undefined
  if (payload.address !== undefined) result.address = payload.address || undefined
  if (payload.deptHandover !== undefined) {
    result.dept_handover = mapDepartmentSectionPayload(payload.deptHandover)
  }
  if (payload.financeHandover !== undefined) {
    result.finance_handover = mapFinanceSectionPayload(payload.financeHandover)
  }
  if (payload.hrHandover !== undefined) {
    result.hr_handover = mapHrSectionPayload(payload.hrHandover)
  }
  if (payload.allCompleted !== undefined) result.all_completed = payload.allCompleted
  if (payload.principalSign !== undefined)
    result.principal_sign = payload.principalSign || undefined
  if (payload.principalDate !== undefined)
    result.principal_date = payload.principalDate || undefined
  if (payload.selectedApproverUserIds !== undefined) {
    result.selected_approver_user_ids = payload.selectedApproverUserIds || {}
  }
  return result
}

const mapCurrentApprover = (approver: ApiCurrentApprover): WorkHandoverCurrentApprover => ({
  userId: approver.user_id,
  name: approver.name,
  department: approver.department,
  position: approver.position,
  campus: approver.campus,
})

const mapDepartmentSection = (
  section?: ApiDepartmentSection | null,
): WorkHandoverDepartmentSection => ({
  workHandover: section?.work_handover || '',
  materialsHandover: section?.materials_handover || '',
  pendingItems: section?.pending_items || '',
  workCompleted: section?.work_completed || false,
  noIssues: section?.no_issues || false,
  managerSign: section?.manager_sign || '',
  managerDate: section?.manager_date || undefined,
  lastMonth: section?.last_month || '',
  lastDay: section?.last_day || '',
  salarySign: section?.salary_sign || '',
  salaryDate: section?.salary_date || undefined,
  receiver: section?.receiver || '',
  handleDate: section?.handle_date || undefined,
})

const mapFinanceSection = (section?: ApiFinanceSection | null): WorkHandoverFinanceSection => ({
  hasDebt: section?.has_debt || false,
  debtAmount: section?.debt_amount ?? undefined,
  receiptSubmitted: section?.receipt_submitted || false,
  receiptCount: section?.receipt_count ?? undefined,
  financeItems: section?.finance_items || '',
  cashierSign: section?.cashier_sign || '',
  cashierDate: section?.cashier_date || undefined,
  accountCleared: section?.account_cleared || false,
  itemsCompleted: section?.items_completed || false,
  managerSign: section?.manager_sign || '',
  managerDate: section?.manager_date || undefined,
})

const mapHrSection = (section?: ApiHrSection | null): WorkHandoverHrSection => ({
  fixedAssets: section?.fixed_assets || '',
  officeSupplies: section?.office_supplies || '',
  fingerprint: section?.fingerprint || '',
  insurance: section?.insurance || '',
  receiver: section?.receiver || '',
  handleDate: section?.handle_date || undefined,
  completed: section?.completed || false,
  salaryNormal: section?.salary_normal || false,
  salaryEndYear: section?.salary_end_year || '',
  salaryEndMonth: section?.salary_end_month || '',
  salaryEndDay: section?.salary_end_day || '',
  managerSign: section?.manager_sign || '',
  managerDate: section?.manager_date || undefined,
})

const mapApprovalPreviewStage = (
  stage: ApiApprovalPreviewStage,
): WorkHandoverApprovalPreviewStage => ({
  stage: stage.stage,
  stageLabel: stage.stage_label,
  recommendedUserIds: stage.recommended_user_ids || [],
  approvers: (stage.approvers || []).map(mapCurrentApprover),
})

const mapRecord = (record: ApiWorkHandoverRecord): WorkHandoverRecord => ({
  id: record.id,
  applicationNo: record.application_no,
  campus: record.campus,
  name: record.name,
  department: record.department,
  position: record.position,
  entryDate: record.entry_date,
  phone: record.phone,
  email: record.email,
  leaveDate: record.leave_date,
  leaveType: record.leave_type,
  leaveTypeOther: record.leave_type_other,
  leaveReason: record.leave_reason || [],
  leaveReasonOther: record.leave_reason_other,
  address: record.address,
  deptHandover: mapDepartmentSection(record.dept_handover),
  financeHandover: mapFinanceSection(record.finance_handover),
  hrHandover: mapHrSection(record.hr_handover),
  allCompleted: record.all_completed,
  principalSign: record.principal_sign,
  principalDate: record.principal_date,
  principalSignRequired: record.principal_sign_required !== false,
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  departmentHeadOpinion: record.department_head_opinion,
  departmentHeadPassed: record.department_head_passed,
  operationsReviewOpinion: record.operations_review_opinion,
  operationsReviewPassed: record.operations_review_passed,
  academicReviewOpinion: record.academic_review_opinion,
  academicReviewPassed: record.academic_review_passed,
  teachingQualityReviewOpinion: record.teaching_quality_review_opinion,
  teachingQualityReviewPassed: record.teaching_quality_review_passed,
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
  approvalFlow: (record.approval_flow || []).map((item) => ({
    stage: item.stage,
    stageLabel: item.stage_label,
    status: item.status,
    statusLabel: item.status_label,
    approvers: (item.approvers || []).map(mapCurrentApprover),
    action: item.action,
    actionLabel: item.action_label,
    actedByUserId: item.acted_by_user_id,
    actedByName: item.acted_by_name,
    comment: item.comment,
    actedAt: item.acted_at,
  })),
  approvalActions: (record.approval_actions || []).map((item) => ({
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

export async function listWorkHandovers(params?: {
  campus?: string
  status?: WorkHandoverStatus
  department?: string
}) {
  const response = await api.get<ApiWorkHandoverRecord[]>('/human-resources/work-handovers', {
    params: {
      campus: params?.campus || undefined,
      status: params?.status || undefined,
      department: params?.department || undefined,
    },
  })
  return response.data.map(mapRecord)
}

export async function previewWorkHandoverApproverCandidates(payload: {
  campus: string
  department: string
  position: string
}) {
  const response = await api.post<ApiApprovalPreviewStage[]>(
    '/human-resources/work-handovers/approver-preview',
    payload,
  )
  return response.data.map(mapApprovalPreviewStage)
}

export async function getWorkHandover(applicationId: number) {
  const response = await api.get<ApiWorkHandoverRecord>(
    `/human-resources/work-handovers/${applicationId}`,
  )
  return mapRecord(response.data)
}

export async function createWorkHandover(payload: WorkHandoverPayload) {
  const response = await api.post<ApiWorkHandoverRecord>(
    '/human-resources/work-handovers',
    mapPayload(payload),
  )
  return mapRecord(response.data)
}

export async function updateWorkHandover(
  applicationId: number,
  payload: Partial<WorkHandoverPayload>,
) {
  const response = await api.put<ApiWorkHandoverRecord>(
    `/human-resources/work-handovers/${applicationId}`,
    mapPartialPayload(payload),
  )
  return mapRecord(response.data)
}

export async function deleteWorkHandover(applicationId: number) {
  await api.delete(`/human-resources/work-handovers/${applicationId}`)
}

export async function submitWorkHandover(applicationId: number) {
  const response = await api.post<ApiWorkHandoverRecord>(
    `/human-resources/work-handovers/${applicationId}/submit`,
  )
  return mapRecord(response.data)
}

export async function approveWorkHandover(applicationId: number, comment?: string) {
  const response = await api.post<ApiWorkHandoverRecord>(
    `/human-resources/work-handovers/${applicationId}/approve`,
    { comment },
  )
  return mapRecord(response.data)
}

export async function rejectWorkHandover(applicationId: number, comment: string) {
  const response = await api.post<ApiWorkHandoverRecord>(
    `/human-resources/work-handovers/${applicationId}/reject`,
    { comment },
  )
  return mapRecord(response.data)
}
