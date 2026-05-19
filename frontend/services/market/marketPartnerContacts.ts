import { apiService } from '@/services/api'

export interface PartnerContactRow {
  id?: number
  campus: string
  partner_name: string
  official_website: string
  partner_address: string
  landline: string
  contact_person: string
  phone: string
  wechat: string
  contract_signer: string
  contract_sign_date: string
  contract_expire_date: string
  negotiation_key_points: string
  notes: string
}

export const marketPartnerContactsApi = {
  listByCampus: async (campus: string) => {
    return apiService.get<{ items: PartnerContactRow[] }>(`/market/partner-contacts`, {
      params: { campus },
    })
  },

  listSummary: async () => {
    return apiService.get<{ items: PartnerContactRow[] }>(`/market/partner-contacts`, {
      params: { summary: true },
    })
  },

  bulkSave: async (campus: string, rows: PartnerContactRow[]) => {
    return apiService.post<{ saved_count: number; items: PartnerContactRow[] }>(
      `/market/partner-contacts/bulk-save`,
      {
        campus,
        rows,
      },
    )
  },

  deleteRow: async (id: number) => {
    return apiService.delete(`/market/partner-contacts/${id}`)
  },
}

