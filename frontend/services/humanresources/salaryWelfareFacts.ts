import { api, HR_HEAVY_WRITE_TIMEOUT_MS } from '../api'

export interface SalaryWelfareFactRecord {
  id?: number
  scope: string
  orgKind: string
  orgName: string
  statDate: string
  userId?: number | null
  personName?: string | null
  position?: string | null
  positionCategory?: string | null
  headcount: number
  salary: number
  annualWelfareTotal: number
  monthlyIncentiveTotal: number
  temporaryRewardTotal: number
  deduction: number
  cadreSalaryTotal: number
  staffSalaryTotal: number
  remark?: string | null
}

interface ApiSalaryWelfareFactRecord {
  id?: number
  scope: string
  org_kind: string
  org_name: string
  stat_date: string
  user_id?: number | null
  person_name?: string | null
  position?: string | null
  position_category?: string | null
  headcount: number
  salary: number
  annual_welfare_total: number
  monthly_incentive_total: number
  temporary_reward_total: number
  deduction: number
  cadre_salary_total: number
  staff_salary_total: number
  remark?: string | null
}

const mapRecord = (item: ApiSalaryWelfareFactRecord): SalaryWelfareFactRecord => ({
  id: item.id,
  scope: item.scope,
  orgKind: item.org_kind,
  orgName: item.org_name,
  statDate: item.stat_date,
  userId: item.user_id,
  personName: item.person_name,
  position: item.position,
  positionCategory: item.position_category,
  headcount: item.headcount,
  salary: item.salary,
  annualWelfareTotal: item.annual_welfare_total,
  monthlyIncentiveTotal: item.monthly_incentive_total,
  temporaryRewardTotal: item.temporary_reward_total,
  deduction: item.deduction,
  cadreSalaryTotal: item.cadre_salary_total,
  staffSalaryTotal: item.staff_salary_total,
  remark: item.remark,
})

const toPayload = (payload: SalaryWelfareFactRecord) => ({
  scope: payload.scope,
  org_kind: payload.orgKind,
  org_name: payload.orgName,
  stat_date: payload.statDate,
  user_id: payload.userId ?? null,
  person_name: payload.personName ?? null,
  position: payload.position ?? null,
  position_category: payload.positionCategory ?? null,
  headcount: payload.headcount,
  salary: payload.salary,
  annual_welfare_total: payload.annualWelfareTotal,
  monthly_incentive_total: payload.monthlyIncentiveTotal,
  temporary_reward_total: payload.temporaryRewardTotal,
  deduction: payload.deduction,
  cadre_salary_total: payload.cadreSalaryTotal,
  staff_salary_total: payload.staffSalaryTotal,
  remark: payload.remark ?? null,
})

export const listSalaryWelfareFacts = async (params: {
  scope: 'hq' | 'offline' | 'online'
  startDate?: string
  endDate?: string
  orgName?: string
}) => {
  const response = await api.get<ApiSalaryWelfareFactRecord[]>('/human-resources/salary-welfare-facts', {
    params: {
      scope: params.scope,
      start_date: params.startDate,
      end_date: params.endDate,
      org_name: params.orgName,
    },
  })
  return response.data.map(mapRecord)
}

export const createSalaryWelfareFact = async (payload: SalaryWelfareFactRecord) => {
  const response = await api.post<ApiSalaryWelfareFactRecord>(
    '/human-resources/salary-welfare-facts',
    toPayload(payload),
    {
      timeout: HR_HEAVY_WRITE_TIMEOUT_MS,
    },
  )
  return mapRecord(response.data)
}

export const updateSalaryWelfareFact = async (recordId: number, payload: Partial<SalaryWelfareFactRecord>) => {
  const response = await api.put<ApiSalaryWelfareFactRecord>(
    `/human-resources/salary-welfare-facts/${recordId}`,
    {
      org_kind: payload.orgKind,
      org_name: payload.orgName,
      stat_date: payload.statDate,
      user_id: payload.userId,
      person_name: payload.personName,
      position: payload.position,
      position_category: payload.positionCategory,
      headcount: payload.headcount,
      salary: payload.salary,
      annual_welfare_total: payload.annualWelfareTotal,
      monthly_incentive_total: payload.monthlyIncentiveTotal,
      temporary_reward_total: payload.temporaryRewardTotal,
      deduction: payload.deduction,
      cadre_salary_total: payload.cadreSalaryTotal,
      staff_salary_total: payload.staffSalaryTotal,
      remark: payload.remark,
    },
    {
      timeout: HR_HEAVY_WRITE_TIMEOUT_MS,
    },
  )
  return mapRecord(response.data)
}
