import { api, HR_HEAVY_WRITE_TIMEOUT_MS } from '../api'

interface ApiSocialInsuranceCostSummaryEmployee {
  service_fee: number
  id_number: string
  name: string
  injury_base: number
  pension_base: number
  unemployment_base: number
  medical_base: number
}

interface ApiSocialInsuranceCostSummaryRecord {
  id: number
  campus: string
  unit_name: string
  period: string
  injury_enterprise_rate: number
  employees: ApiSocialInsuranceCostSummaryEmployee[]
  remark?: string | null
  created_by_user_id?: number | null
  created_by_name?: string | null
  created_at: string
  updated_at: string
}

export interface SocialInsuranceCostSummaryEmployee {
  serviceFee: number
  idNumber: string
  name: string
  injuryBase: number
  pensionBase: number
  unemploymentBase: number
  medicalBase: number
}

export interface SocialInsuranceCostSummaryRecord {
  id: number
  campus: string
  unitName: string
  period: string
  injuryEnterpriseRate: number
  employees: SocialInsuranceCostSummaryEmployee[]
  remark?: string | null
  createdByUserId?: number | null
  createdByName?: string | null
  createdAt: string
  updatedAt: string
}

export interface SocialInsuranceCostSummaryPayload {
  campus: string
  unitName: string
  period: string
  injuryEnterpriseRate: number
  employees: SocialInsuranceCostSummaryEmployee[]
  remark?: string | null
}

const mapRecord = (
  record: ApiSocialInsuranceCostSummaryRecord,
): SocialInsuranceCostSummaryRecord => ({
  id: record.id,
  campus: record.campus,
  unitName: record.unit_name,
  period: record.period,
  injuryEnterpriseRate: record.injury_enterprise_rate,
  employees: (record.employees || []).map((item) => ({
    serviceFee: item.service_fee,
    idNumber: item.id_number,
    name: item.name,
    injuryBase: item.injury_base,
    pensionBase: item.pension_base,
    unemploymentBase: item.unemployment_base,
    medicalBase: item.medical_base,
  })),
  remark: record.remark,
  createdByUserId: record.created_by_user_id,
  createdByName: record.created_by_name,
  createdAt: record.created_at,
  updatedAt: record.updated_at,
})

const mapPayload = (payload: SocialInsuranceCostSummaryPayload) => ({
  campus: payload.campus,
  unit_name: payload.unitName,
  period: payload.period,
  injury_enterprise_rate: payload.injuryEnterpriseRate,
  employees: payload.employees.map((item) => ({
    service_fee: item.serviceFee,
    id_number: item.idNumber,
    name: item.name,
    injury_base: item.injuryBase,
    pension_base: item.pensionBase,
    unemployment_base: item.unemploymentBase,
    medical_base: item.medicalBase,
  })),
  remark: payload.remark || undefined,
})

export async function listSocialInsuranceCostSummaries(params?: {
  campus?: string
  search?: string
}) {
  const response = await api.get<ApiSocialInsuranceCostSummaryRecord[]>(
    '/human-resources/social-insurance-cost-summaries',
    {
      params: {
        campus: params?.campus || undefined,
        search: params?.search || undefined,
      },
    },
  )
  return (response.data || []).map(mapRecord)
}

export async function getSocialInsuranceCostSummary(recordId: number) {
  const response = await api.get<ApiSocialInsuranceCostSummaryRecord>(
    `/human-resources/social-insurance-cost-summaries/${recordId}`,
  )
  return mapRecord(response.data)
}

export async function createSocialInsuranceCostSummary(payload: SocialInsuranceCostSummaryPayload) {
  const response = await api.post<ApiSocialInsuranceCostSummaryRecord>(
    '/human-resources/social-insurance-cost-summaries',
    mapPayload(payload),
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapRecord(response.data)
}

export async function updateSocialInsuranceCostSummary(
  recordId: number,
  payload: SocialInsuranceCostSummaryPayload,
) {
  const response = await api.put<ApiSocialInsuranceCostSummaryRecord>(
    `/human-resources/social-insurance-cost-summaries/${recordId}`,
    mapPayload(payload),
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return mapRecord(response.data)
}

export async function deleteSocialInsuranceCostSummary(recordId: number) {
  const response = await api.delete<{ success: boolean }>(
    `/human-resources/social-insurance-cost-summaries/${recordId}`,
    { timeout: HR_HEAVY_WRITE_TIMEOUT_MS },
  )
  return response.data
}