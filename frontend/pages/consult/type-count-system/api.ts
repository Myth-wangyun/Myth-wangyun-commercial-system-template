/**
 * 咨询量录入系统API
 */

import { api } from '@/services/api'
import type {
  ConsultationRecord,
  ConsultationObject,
  CreateConsultationRequest,
  UpdateConsultationRequest,
  DuplicateCheckResponse,
  PaginatedResponse,
  ConsultationQueryParams,
  CreateConsultationResponse,
  OptionsResponse,
  FullConsultationInfo,
  ImportConsultationRequest,
  ImportConsultationResponse,
  ImportTemplateResponse,
  CampusInfo,
  TransferCheckResponse,
  TransferRequest,
  TransferResponse,
  BenefitPreviewResponse,
  TransferRecordsQueryParams,
  TransferStatisticsResponse,
  MyConsultationsQueryParams,
  MyConsultationsResponse,
  PermissionCheckResponse,
  DistributionViewResponse,
} from './types'

const BASE_URL = '/consult'

function normalizeMediaSourceOptions(data: unknown): string[] {
  if (Array.isArray(data)) {
    return data.filter((item): item is string => typeof item === 'string')
  }

  if (data && typeof data === 'object') {
    return Array.from(
      new Set(
        Object.values(data)
          .flatMap((items) => Array.isArray(items) ? items : [])
          .filter((item): item is string => typeof item === 'string')
      )
    )
  }

  return []
}

/**
 * 录入咨询量
 */
export async function createConsultationRecord(data: CreateConsultationRequest): Promise<CreateConsultationResponse> {
  const response = await api.post(`${BASE_URL}/consultation/record`, data)
  return response.data
}

/**
 * 检查重量
 */
export async function checkDuplicate(phone: string, secondPhone?: string, wechat?: string): Promise<DuplicateCheckResponse> {
  const params: Record<string, string> = { phone }
  if (secondPhone) {
    params.second_phone = secondPhone
  }
  if (wechat) {
    params.wechat = wechat
  }
  const response = await api.get(`${BASE_URL}/consultation/check-duplicate`, { params })
  return response.data
}

/**
 * 获取咨询量明细列表
 */
export async function getConsultationRecords(
  params: ConsultationQueryParams
): Promise<PaginatedResponse<ConsultationRecord>> {
  const response = await api.get(`${BASE_URL}/consultation/records`, { params })
  return response.data
}

/**
 * 获取咨询量主表列表
 */
export async function getConsultationObjects(
  params: ConsultationQueryParams
): Promise<PaginatedResponse<ConsultationObject>> {
  const response = await api.get(`${BASE_URL}/consultation/objects`, { params })
  return response.data
}

/**
 * 获取咨询对象完整信息
 */
export async function getConsultationObject(objectId: number): Promise<{ success: boolean; data: FullConsultationInfo }> {
  const response = await api.get(`${BASE_URL}/consultation/object/${objectId}`)
  return response.data
}

/**
 * 获取咨询明细记录
 */
export async function getConsultationRecord(recordId: number): Promise<ConsultationRecord> {
  const response = await api.get(`${BASE_URL}/consultation/record/${recordId}`)
  return response.data
}

/**
 * 更新咨询明细记录
 */
export async function updateConsultationRecord(data: UpdateConsultationRequest): Promise<ConsultationRecord> {
  const response = await api.put(`${BASE_URL}/consultation/record`, data)
  return response.data
}

/**
 * 删除咨询明细记录
 */
export async function deleteConsultationRecord(recordId: number): Promise<{ success: boolean; message: string }> {
  const response = await api.delete(`${BASE_URL}/consultation/record/${recordId}`)
  return response.data
}

/**
 * 添加电话号码
 */
export async function addPhoneToObject(objectId: number, phone: string): Promise<{ success: boolean; message: string; 电话列表: string[] }> {
  const response = await api.post(`${BASE_URL}/consultation/object/${objectId}/phone`, null, {
    params: { phone }
  })
  return response.data
}

/**
 * 获取状态选项
 */
export async function getStatusOptions(): Promise<OptionsResponse> {
  const response = await api.get(`${BASE_URL}/consultation/options/status`)
  return response.data
}

/**
 * 获取学历选项
 */
export async function getEducationOptions(): Promise<OptionsResponse> {
  const response = await api.get(`${BASE_URL}/consultation/options/education`)
  return response.data
}

/**
 * 获取报名意向选项
 */
export async function getIntentionOptions(): Promise<OptionsResponse> {
  const response = await api.get(`${BASE_URL}/consultation/options/intention`)
  return response.data
}

/**
 * 获取咨询类别选项
 */
export async function getCategoryOptions(): Promise<OptionsResponse> {
  const response = await api.get(`${BASE_URL}/consultation/options/category`)
  return response.data
}

/**
 * 获取量来源选项
 */
export async function getSourceOptions(): Promise<OptionsResponse> {
  const response = await api.get(`${BASE_URL}/consultation/options/source`)
  return response.data
}

/**
 * 获取地区选项（家庭住址地区）
 */
export async function getRegionOptions(): Promise<OptionsResponse> {
  const response = await api.get(`${BASE_URL}/consultation/options/region`)
  return response.data
}

/**
 * 获取媒体来源选项
 */
export async function getMediaSourceOptions(): Promise<OptionsResponse> {
  const response = await api.get(`${BASE_URL}/consultation/options/media-source`)
  return {
    ...response.data,
    data: normalizeMediaSourceOptions(response.data?.data),
  }
}

/**
 * 获取媒体来源层级结构
 */
export async function getMediaSourceHierarchy(): Promise<import('./types').MediaHierarchyResponse> {
  const response = await api.get(`${BASE_URL}/consultation/options/media-source-hierarchy`)
  return response.data
}

/**
 * 获取咨询师统计数据
 * 根据筛选条件统计每个咨询师的咨询量
 */
export interface ConsultantStatsParams {
  campus?: string
  consultant?: string
  start_date?: string
  end_date?: string
  data_source?: string
  media_source?: string
  is_visit?: number
  is_enrolled?: number
  is_reserved?: number
  is_invalid?: number
  is_excluded?: number
}

export interface ConsultantStatsResponse {
  success: boolean
  data: {
    consultant_stats: Array<{
      咨询师: string
      咨询量: number
      今日量: number
    }>
    total_count: number
    consultant_count: number
    unassigned_count: number
    today_new_count: number
    today_distributed_count: number
  }
}

export async function getConsultantStats(params: ConsultantStatsParams): Promise<ConsultantStatsResponse> {
  const response = await api.get(`${BASE_URL}/consultant-stats`, { params })
  return response.data
}

/**
 * 分量 - 分配咨询师
 */
export async function distributeConsultation(
  recordId: number, 
  data: { 咨询师: string; 分量人?: string }
): Promise<{ success: boolean; message: string }> {
  const response = await api.put(`${BASE_URL}/consultation/record/${recordId}/distribute`, data)
  return response.data
}

/**
 * 批量导入咨询量
 */
export async function importConsultationRecords(
  data: ImportConsultationRequest
): Promise<ImportConsultationResponse> {
  // 导入请求可能处理大量数据，设置5分钟超时
  const response = await api.post(`${BASE_URL}/consultation/import`, data, {
    timeout: 300000, // 5分钟
  })
  return response.data
}

/**
 * 获取导入模板字段说明
 */
export async function getImportTemplate(
  sourceType: '口碑' | '渠道'
): Promise<ImportTemplateResponse> {
  const response = await api.get(`${BASE_URL}/consultation/import/template`, {
    params: { source_type: sourceType }
  })
  return response.data
}

// ==================== 转量相关API ====================

/**
 * 获取可用神殿列表
 */
export async function getTransferCampuses(): Promise<CampusInfo[]> {
  const response = await api.get(`${BASE_URL}/transfer/campuses`)
  return response.data
}

/**
 * 检查是否可转量
 */
export async function checkCanTransfer(recordId: number): Promise<TransferCheckResponse> {
  const response = await api.get(`${BASE_URL}/transfer/check/${recordId}`)
  return response.data
}

/**
 * 执行转量操作
 */
export async function executeTransfer(data: TransferRequest): Promise<TransferResponse> {
  const response = await api.post(`${BASE_URL}/transfer/execute`, data)
  return response.data
}

/**
 * 预览转量权益分配
 */
export async function previewTransferBenefit(
  recordId: number,
  targetCampus: string
): Promise<BenefitPreviewResponse> {
  const response = await api.get(`${BASE_URL}/transfer/benefit-preview`, {
    params: { record_id: recordId, target_campus: targetCampus }
  })
  return response.data
}

/**
 * 查询转量记录
 */
export async function getTransferRecords(
  params: TransferRecordsQueryParams
): Promise<PaginatedResponse<ConsultationRecord>> {
  const response = await api.get(`${BASE_URL}/transfer/records`, { params })
  return response.data
}

/**
 * 获取转量统计
 */
export async function getTransferStatistics(
  campus?: string,
  startDate?: string,
  endDate?: string
): Promise<TransferStatisticsResponse> {
  const response = await api.get(`${BASE_URL}/transfer/statistics`, {
    params: { campus, start_date: startDate, end_date: endDate }
  })
  return response.data
}

/**
 * 获取转量规则说明
 */
export async function getTransferRules(): Promise<Record<string, any>> {
  const response = await api.get(`${BASE_URL}/transfer/rules`)
  return response.data
}

// ==================== 我的咨询量相关API ====================

/**
 * 获取我的全部咨询量（分门别类）
 */
export async function getMyConsultations(
  params: MyConsultationsQueryParams
): Promise<MyConsultationsResponse> {
  const response = await api.get(`${BASE_URL}/my-consultations`, { params })
  return response.data
}

/**
 * 获取我的私域咨询量
 */
export async function getMyPrivateConsultations(
  page: number = 1,
  pageSize: number = 50
): Promise<MyConsultationsResponse> {
  const response = await api.get(`${BASE_URL}/my-consultations/private`, {
    params: { page, page_size: pageSize }
  })
  return response.data
}

/**
 * 获取可再分配咨询量（标记'再'）
 */
export async function getRedistributableConsultations(
  page: number = 1,
  pageSize: number = 50
): Promise<MyConsultationsResponse> {
  const response = await api.get(`${BASE_URL}/my-consultations/redistributable`, {
    params: { page, page_size: pageSize }
  })
  return response.data
}

/**
 * 获取可新分配咨询量（标记'新'）
 */
export async function getNewAssignableConsultations(
  page: number = 1,
  pageSize: number = 50
): Promise<MyConsultationsResponse> {
  const response = await api.get(`${BASE_URL}/my-consultations/new-assignable`, {
    params: { page, page_size: pageSize }
  })
  return response.data
}

/**
 * 检查咨询量操作权限
 */
export async function checkConsultationPermission(objectId: number): Promise<PermissionCheckResponse> {
  const response = await api.get(`${BASE_URL}/my-consultations/check-permission/${objectId}`)
  return response.data
}

/**
 * 获取分量人员视图
 */
export async function getDistributionView(
  page: number = 1,
  pageSize: number = 50
): Promise<DistributionViewResponse> {
  const response = await api.get(`${BASE_URL}/distribution-view`, {
    params: { page, page_size: pageSize }
  })
  return response.data
}

/**
 * 获取咨询量管理规则说明
 */
export async function getConsultationRules(): Promise<Record<string, any>> {
  const response = await api.get(`${BASE_URL}/consultation-rules`)
  return response.data
}

// ==================== 咨询师转量相关API ====================

import type {
  ConsultantInfo,
  BatchConsultantTransferRequest,
  BatchConsultantTransferResponse,
  TransferPreviewResponse,
  PendingApprovalRecord,
  TransferApprovalRequest,
  TransferApprovalResponse,
  TransferRecordHistory,
  TransferStatisticsData,
} from './types'

/**
 * 获取咨询师列表
 */
export async function getConsultantList(campus?: string): Promise<ConsultantInfo[]> {
  const response = await api.get<{
    items: Array<{ real_name: string; campus?: string | null }>
  }>(`${BASE_URL}/consultants`, {
    params: {
      campus,
      department: '祈福司',
    }
  })

  const items = response.data?.items ?? []
  return items
    .filter(item => item.real_name)
    .map(item => ({
      name: item.real_name,
      campus: item.campus || '未分配'
    }))
}

/**
 * 预览转量数据
 */
export async function previewConsultantTransfer(
  sourceConsultant: string,
  targetConsultant: string,
  targetCampus?: string
): Promise<TransferPreviewResponse> {
  const response = await api.get(`${BASE_URL}/consultant-transfer/preview`, {
    params: {
      source_consultant: sourceConsultant,
      target_consultant: targetConsultant,
      target_campus: targetCampus
    }
  })
  return response.data
}

/**
 * 批量转量
 */
export async function batchConsultantTransfer(
  data: BatchConsultantTransferRequest
): Promise<BatchConsultantTransferResponse> {
  const response = await api.post(`${BASE_URL}/consultant-transfer/batch`, data)
  return response.data
}

/**
 * 获取待审批的转量记录
 */
export async function getPendingApprovals(campus?: string): Promise<PendingApprovalRecord[]> {
  const response = await api.get(`${BASE_URL}/consultant-transfer/pending-approvals`, {
    params: { campus }
  })
  return response.data
}

/**
 * 审批转量申请
 */
export async function approveTransfer(
  data: TransferApprovalRequest,
  targetConsultant: string
): Promise<TransferApprovalResponse> {
  const response = await api.post(`${BASE_URL}/consultant-transfer/approve`, data, {
    params: { target_consultant: targetConsultant }
  })
  return response.data
}

/**
 * 获取转量历史记录
 */
export async function getTransferHistory(params: {
  consultant?: string
  campus?: string
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}): Promise<TransferRecordHistory[]> {
  const response = await api.get(`${BASE_URL}/consultant-transfer/history`, { params })
  return response.data
}

/**
 * 获取转量统计数据
 */
export async function getConsultantTransferStatistics(params: {
  campus?: string
  start_date?: string
  end_date?: string
}): Promise<TransferStatisticsData> {
  const response = await api.get(`${BASE_URL}/consultant-transfer/statistics`, { params })
  return response.data
}
/**
 * 获取渠道部员工列表（渠道专员下拉选项）
 * 筛选：department='渠道部' 且 position!='渠道部新媒体'
 * 可按神殿过滤
 */
export async function getChannelStaffOptions(campus?: string): Promise<string[]> {
  const response = await api.get(`${BASE_URL}/consultation/options/channel-staff`, {
    params: campus ? { campus } : undefined,
  })
  return response.data.data
}