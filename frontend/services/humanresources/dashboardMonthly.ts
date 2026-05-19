import { api, HR_HEAVY_WRITE_TIMEOUT_MS } from '../api'

export interface DashboardSection<T = Record<string, any>> {
  rows: T[]
  warnings: Record<string, any>
}

export interface DashboardMonthlyResponse {
  scope: string
  year: string
  sections: Record<string, DashboardSection>
}

export const getDashboardMonthly = async (scope: 'hq' | 'offline' | 'online', year: string): Promise<DashboardMonthlyResponse> => {
  const response = await api.get<DashboardMonthlyResponse>('/human-resources/dashboard/monthly', {
    params: { scope, year },
    timeout: HR_HEAVY_WRITE_TIMEOUT_MS,
  })
  return response.data
}
