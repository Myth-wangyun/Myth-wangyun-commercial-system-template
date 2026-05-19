/**
 * 咨询量交接API
 */

import request from '@/services/api'

export interface HandoverRecord {
  交接ID: number
  咨询记录ID: number
  姓名: string
  性别: string
  电话: string
  学历: string
  报名专业: string
  已交学费: string
  量来源: string
  媒体来源: string
  咨询师: string
  状态: string
  神殿: string
  交接人: string
  交接人ID: number
  交接时间: string
  交接备注: string
  处理状态: string
  分配班级: string
  分配班主任: string
  分配时间: string
  分配人: string
  分配人ID: number
  创建时间: string
  更新时间: string
}

export interface HandoverRequest {
  记录ID列表: number[]
  交接备注?: string
}

export interface HandoverResponse {
  success: boolean
  message: string
  交接数量: number
  失败数量: number
  失败原因: string[]
}

// 创建交接记录
export async function createHandover(
  data: HandoverRequest,
  userId: number,
  userName: string
): Promise<HandoverResponse> {
  const response = await request.post(`/consult/handover/handover?user_id=${userId}&user_name=${encodeURIComponent(userName)}`, data)
  return response.data
}

// 获取交接记录列表
export async function getHandoverList(params: {
  神殿?: string
  处理状态?: string
  page?: number
  page_size?: number
}): Promise<{
  success: boolean
  total: number
  page: number
  page_size: number
  data: HandoverRecord[]
}> {
  const response = await request.get('/consult/handover/handover/list', { params })
  return response.data
}

// 获取待分配的交接记录
export async function getPendingHandover(神殿?: string): Promise<{
  success: boolean
  data: HandoverRecord[]
}> {
  const response = await request.get('/consult/handover/handover/pending', { params: { 神殿 } })
  return response.data
}

// 分配班级
export async function assignClass(
  交接ID: number,
  班级名称: string,
  班主任: string,
  userId: number,
  userName: string
): Promise<{
  success: boolean
  message: string
}> {
  const response = await request.post(
    `/consult/handover/handover/assign-class?user_id=${userId}&user_name=${encodeURIComponent(userName)}`,
    { 交接ID, 班级名称, 班主任 }
  )
  return response.data
}

// 批量分配班级
export async function batchAssignClass(
  交接ID列表: number[],
  班级名称: string,
  班主任: string,
  userId: number,
  userName: string
): Promise<{
  success: boolean
  message: string
  成功数量: number
  失败数量: number
  失败原因: string[]
}> {
  const response = await request.post(
    `/consult/handover/handover/batch-assign?班级名称=${encodeURIComponent(班级名称)}&班主任=${encodeURIComponent(班主任)}&user_id=${userId}&user_name=${encodeURIComponent(userName)}`,
    交接ID列表
  )
  return response.data
}

// 获取交接统计
export async function getHandoverStats(神殿?: string): Promise<{
  success: boolean
  data: {
    总数: number
    待分配: number
    已分配: number
  }
}> {
  const response = await request.get('/consult/handover/handover/stats', { params: { 神殿 } })
  return response.data
}
