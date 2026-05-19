// [Common Module] Audit log service
import { api } from './api'

export interface AuditLogResource {
  id: number
  log_id: number
  schema_name: string
  table_name: string
  record_id?: string
  record_pk?: Record<string, any>
  biz_key?: string
  op: string
  before?: any
  after?: any
  diff?: any
  sensitivity_level: number
  created_at?: string
}

export interface AuditLogEntry {
  id: number
  ts?: string
  user_id?: number
  username?: string
  real_name?: string
  action: string
  action_display?: string
  action_category?: string
  module?: string
  endpoint?: string
  method?: string
  status_code?: number
  latency_ms?: number
  ip?: string
  user_agent?: string
  request_id?: string
  success: boolean
  error_message?: string
  resource_summary?: any
  extra?: any
  resources?: AuditLogResource[]
}

export interface AuditLogListResponse {
  total: number
  items: AuditLogEntry[]
}

export const listAuditLogs = async (params: {
  user_id?: number
  username?: string
  action?: string
  action_category?: string
  module?: string
  table_name?: string
  record_id?: string
  start_time?: string
  end_time?: string
  success?: boolean
  limit?: number
  offset?: number
  include_resources?: boolean
}) => {
  const res = await api.get('/logs', { params })
  return res.data as AuditLogListResponse
}

export const getAuditLog = async (logId: number, includeResources = true) => {
  const res = await api.get(`/logs/${logId}`, {
    params: { include_resources: includeResources },
  })
  return res.data as AuditLogEntry
}
