import { api, HR_HEAVY_WRITE_TIMEOUT_MS } from '../api'

export interface DashboardSection<T = Record<string, any>> {
  rows: T[]
  warnings: Record<string, any>
}

export interface DashboardAnnualResponse {
  scope: string
  year: string
  sections: Record<string, DashboardSection>
}

export const getDashboardAnnual = async (scope: 'hq' | 'offline' | 'online', year: string): Promise<DashboardAnnualResponse> => {
  const response = await api.get<DashboardAnnualResponse>('/human-resources/dashboard/annual', {
    params: { scope, year },
    timeout: HR_HEAVY_WRITE_TIMEOUT_MS,
  })
  return response.data
}
