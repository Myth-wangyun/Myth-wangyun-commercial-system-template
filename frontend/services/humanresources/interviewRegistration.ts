import { api } from '../api'

export type InterviewDecision = '是' | '否' | ''

interface ApiInterviewRegistrationRecord {
  id: number
  region?: string | null
  campus_name?: string | null
  name: string
  source?: string | null
  phone?: string | null
  position?: string | null
  invite_date?: string | null
  inviter?: string | null
  scheduled_time?: string | null
  attended_first?: InterviewDecision | null
  first_interviewer?: string | null
  first_evaluation?: string | null
  first_hire_decision?: InterviewDecision | null
  attended_second?: InterviewDecision | null
  second_time?: string | null
  second_evaluation?: string | null
  final_hire_decision?: InterviewDecision | null
  reported?: InterviewDecision | null
  onboard_date?: string | null
  not_onboard_reason?: string | null
  created_by_user_id?: number | null
  created_by_name?: string | null
  created_at: string
  updated_at: string
}

export interface InterviewRegistrationRecord {
  id: number
  region: string
  campusName: string
  name: string
  source: string
  phone: string
  position: string
  inviteDate: string
  inviter: string
  scheduledTime: string
  attendedFirst: InterviewDecision
  firstInterviewer: string
  firstEvaluation: string
  firstHireDecision: InterviewDecision
  attendedSecond: InterviewDecision
  secondTime: string
  secondEvaluation: string
  finalHireDecision: InterviewDecision
  reported: InterviewDecision
  onboardDate: string
  notOnboardReason: string
  createdByUserId?: number | null
  createdByName?: string | null
  createdAt: string
  updatedAt: string
}

export interface InterviewRegistrationPayload {
  region?: string
  campusName?: string
  name: string
  source?: string
  phone?: string
  position?: string
  inviteDate?: string
  inviter?: string
  scheduledTime?: string
  attendedFirst?: InterviewDecision
  firstInterviewer?: string
  firstEvaluation?: string
  firstHireDecision?: InterviewDecision
  attendedSecond?: InterviewDecision
  secondTime?: string
  secondEvaluation?: string
  finalHireDecision?: InterviewDecision
  reported?: InterviewDecision
  onboardDate?: string
  notOnboardReason?: string
}

const normalizeString = (value?: string | null) => value || ''

const mapRecord = (record: ApiInterviewRegistrationRecord): InterviewRegistrationRecord => ({
  id: record.id,
  region: normalizeString(record.region),
  campusName: normalizeString(record.campus_name),
  name: record.name,
  source: normalizeString(record.source),
  phone: normalizeString(record.phone),
  position: normalizeString(record.position),
  inviteDate: normalizeString(record.invite_date),
  inviter: normalizeString(record.inviter),
  scheduledTime: normalizeString(record.scheduled_time),
  attendedFirst: (record.attended_first || '') as InterviewDecision,
  firstInterviewer: normalizeString(record.first_interviewer),
  firstEvaluation: normalizeString(record.first_evaluation),
  firstHireDecision: (record.first_hire_decision || '') as InterviewDecision,
  attendedSecond: (record.attended_second || '') as InterviewDecision,
  secondTime: normalizeString(record.second_time),
  secondEvaluation: normalizeString(record.second_evaluation),
  finalHireDecision: (record.final_hire_decision || '') as InterviewDecision,
  reported: (record.reported || '') as InterviewDecision,
  onboardDate: normalizeString(record.onboard_date),
  notOnboardReason: normalizeString(record.not_onboard_reason),
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

const mapPayload = (payload: InterviewRegistrationPayload) => ({
  region: payload.region || undefined,
  campus_name: payload.campusName || undefined,
  name: payload.name,
  source: payload.source || undefined,
  phone: payload.phone || undefined,
  position: payload.position || undefined,
  invite_date: payload.inviteDate || undefined,
  inviter: payload.inviter || undefined,
  scheduled_time: payload.scheduledTime || undefined,
  attended_first: payload.attendedFirst || undefined,
  first_interviewer: payload.firstInterviewer || undefined,
  first_evaluation: payload.firstEvaluation || undefined,
  first_hire_decision: payload.firstHireDecision || undefined,
  attended_second: payload.attendedSecond || undefined,
  second_time: payload.secondTime || undefined,
  second_evaluation: payload.secondEvaluation || undefined,
  final_hire_decision: payload.finalHireDecision || undefined,
  reported: payload.reported || undefined,
  onboard_date: payload.onboardDate || undefined,
  not_onboard_reason: payload.notOnboardReason || undefined,
})

export async function listInterviewRegistrations(params?: {
  campusName?: string
  search?: string
}) {
  const response = await api.get<ApiInterviewRegistrationRecord[]>(
    '/human-resources/interview-registrations',
    {
      params: {
        campus_name: params?.campusName,
        search: params?.search,
      },
    },
  )
  return response.data.map(mapRecord)
}

export async function getInterviewRegistration(id: number) {
  const response = await api.get<ApiInterviewRegistrationRecord>(
    `/human-resources/interview-registrations/${id}`,
  )
  return mapRecord(response.data)
}

export async function createInterviewRegistration(payload: InterviewRegistrationPayload) {
  const response = await api.post<ApiInterviewRegistrationRecord>(
    '/human-resources/interview-registrations',
    mapPayload(payload),
  )
  return mapRecord(response.data)
}

export async function updateInterviewRegistration(
  id: number,
  payload: InterviewRegistrationPayload,
) {
  const response = await api.put<ApiInterviewRegistrationRecord>(
    `/human-resources/interview-registrations/${id}`,
    mapPayload(payload),
  )
  return mapRecord(response.data)
}

export async function deleteInterviewRegistration(id: number) {
  await api.delete(`/human-resources/interview-registrations/${id}`)
}
