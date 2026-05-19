import { api } from '../api'

interface ApiWorkReportRecord {
  id: number
  reporter_user_id?: number | null
  name: string
  department: string
  position: string
  campus?: string | null
  report_date: string
  work_description: string
  difficulties: string
  achievements: string
  improvements: string
  future_plan: string
  can_edit: boolean
  can_delete: boolean
  created_at: string
  updated_at: string
}

interface ApiWorkReportStatus {
  has_completed_report: boolean
  latest_report_id?: number | null
  latest_report_date?: string | null
}

export interface WorkReportRecord {
  id: number
  reporterUserId?: number | null
  name: string
  department: string
  position: string
  campus?: string | null
  date: string
  workDescription: string
  difficulties: string
  achievements: string
  improvements: string
  futurePlan: string
  canEdit: boolean
  canDelete: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkReportPayload {
  date: string
  workDescription: string
  difficulties: string
  achievements: string
  improvements: string
  futurePlan: string
}

export interface WorkReportStatus {
  hasCompletedReport: boolean
  latestReportId?: number | null
  latestReportDate?: string | null
}

const mapRecord = (record: ApiWorkReportRecord): WorkReportRecord => ({
  id: record.id,
  reporterUserId: record.reporter_user_id ?? null,
  name: record.name,
  department: record.department,
  position: record.position,
  campus: record.campus ?? null,
  date: record.report_date,
  workDescription: record.work_description,
  difficulties: record.difficulties,
  achievements: record.achievements,
  improvements: record.improvements,
  futurePlan: record.future_plan,
  canEdit: record.can_edit,
  canDelete: record.can_delete,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

const toApiPayload = (payload: WorkReportPayload) => ({
  report_date: payload.date,
  work_description: payload.workDescription,
  difficulties: payload.difficulties,
  achievements: payload.achievements,
  improvements: payload.improvements,
  future_plan: payload.futurePlan,
})

const mapStatus = (status: ApiWorkReportStatus): WorkReportStatus => ({
  hasCompletedReport: status.has_completed_report,
  latestReportId: status.latest_report_id ?? null,
  latestReportDate: status.latest_report_date ?? null,
})

export const workReportApi = {
  async list(): Promise<WorkReportRecord[]> {
    const response = await api.get<ApiWorkReportRecord[]>('/human-resources/work-reports')
    return response.data.map(mapRecord)
  },

  async getMyStatus(): Promise<WorkReportStatus> {
    const response = await api.get<ApiWorkReportStatus>('/human-resources/work-reports/my-status')
    return mapStatus(response.data)
  },

  async create(payload: WorkReportPayload): Promise<WorkReportRecord> {
    const response = await api.post<ApiWorkReportRecord>(
      '/human-resources/work-reports',
      toApiPayload(payload),
    )
    return mapRecord(response.data)
  },

  async update(id: number, payload: WorkReportPayload): Promise<WorkReportRecord> {
    const response = await api.put<ApiWorkReportRecord>(
      `/human-resources/work-reports/${id}`,
      toApiPayload(payload),
    )
    return mapRecord(response.data)
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/human-resources/work-reports/${id}`)
  },
}
