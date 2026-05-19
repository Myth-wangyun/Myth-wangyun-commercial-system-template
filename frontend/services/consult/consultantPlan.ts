/**
 * 咨询师月度计划数据服务
 * 对应后端 /api/v1/consult/consultant-plan/* 接口
 * 按 咨询师 × 量来源 两个维度组合
 */

import api from '@/services/api'

// 支持的数据类型（量来源）
export const DATA_TYPES = ['SEM', '新媒体', '市场口碑', '合作伙伴', '口碑', '渠道', '神殿新媒体', '汇总'] as const
export type DataType = typeof DATA_TYPES[number]

// ==================== 类型定义 ====================

export interface ConsultantMonthlyPlan {
  记录ID?: number
  年份: number
  月份: number
  神殿: string
  咨询师: string
  数据类型: string  // SEM/新媒体/市场口碑/合作伙伴/口碑/渠道/神殿新媒体/汇总
  计划收入: number | null
  计划招生: number | null
  费用投入?: number | null  // 费用投入/市场投入
  创建时间?: string
  更新时间?: string
}

export interface ConsultantPlanSummary {
  咨询师: string
  数据类型: string
  年度计划收入: number
  年度计划招生: number
  月度明细: Record<number, {
    计划收入: number | null
    计划招生: number | null
  }>
}

export interface CampusPlanSummary {
  神殿: string
  年份: number
  数据类型?: string
  年度总计划收入: number
  年度总计划招生: number
  咨询师汇总: ConsultantPlanSummary[]
}

// 咨询师月度统计数据（实际咨询数据）
export interface ConsultantMonthlyStats {
  咨询总量: number
  上门量: number
  报名量: number
  退费人数: number
  电话量: number
  实际收入: number  // 咨询师负责的人的缴费金额
}

export interface ConsultantMonthlySummaryData {
  年份: number
  神殿: string
  数据类型: string
  咨询师数据: Record<string, Record<number, ConsultantMonthlyStats>>
}

// ==================== API 函数 ====================

/**
 * 获取支持的数据类型列表
 */
export async function getDataTypes(): Promise<string[]> {
  const response = await api.get('/consult/consultant-plan/data-types')
  return response.data || DATA_TYPES
}

/**
 * 获取咨询师月度计划数据列表
 */
export async function getConsultantPlanList(params: {
  year: number
  campus?: string
  month?: number
  consultant?: string
  data_type?: string
}): Promise<ConsultantMonthlyPlan[]> {
  console.log('🔍 [consultantPlan] getConsultantPlanList 调用参数:', params)
  // 如果没有传 data_type,打印调用栈
  if (!params.data_type) {
    console.warn('⚠️⚠️⚠️ [consultantPlan] getConsultantPlanList 调用时没有传 data_type!')
    console.trace('调用栈:')
  }
  const response = await api.get('/consult/consultant-plan/list', { params })
  console.log('🔍 [consultantPlan] getConsultantPlanList 返回数据:', response.data)
  return response.data?.数据列表 || []
}

/**
 * 获取神殿年度计划数据汇总（按咨询师和数据类型分组）
 */
export async function getCampusPlanSummary(year: number, campus: string, dataType?: string): Promise<CampusPlanSummary> {
  const response = await api.get('/consult/consultant-plan/campus-summary', {
    params: { year, campus, data_type: dataType }
  })
  return response.data
}

/**
 * 创建或更新咨询师月度计划数据
 */
export async function upsertConsultantPlan(data: ConsultantMonthlyPlan): Promise<ConsultantMonthlyPlan> {
  const response = await api.post('/consult/consultant-plan', data)
  return response.data
}

/**
 * 批量保存咨询师月度计划数据
 */
export async function batchSaveConsultantPlans(plans: ConsultantMonthlyPlan[]): Promise<{
  成功数量: number
  失败数量: number
}> {
  const response = await api.post('/consult/consultant-plan/batch', {
    数据列表: plans
  })
  // 后端返回 { success: true, data: { 数据列表: [...], 总数: n } }
  const result = response.data?.data || response.data
  return {
    成功数量: result.总数 || 0,
    失败数量: 0
  }
}

/**
 * 删除咨询师月度计划数据
 */
export async function deleteConsultantPlan(recordId: number): Promise<void> {
  await api.delete(`/consult/consultant-plan/${recordId}`)
}

/**
 * 获取咨询师计划数据映射（用于Dashboard快速查找）
 * 返回: Map<"咨询师_月份", { 计划收入, 计划招生 }>
 */
export async function getConsultantPlanMap(
  year: number,
  campus: string,
  dataType?: string
): Promise<Map<string, { 计划收入: number | null; 计划招生: number | null; 费用投入: number | null }>> {
  const plans = await getConsultantPlanList({ year, campus, data_type: dataType })
  const map = new Map<string, { 计划收入: number | null; 计划招生: number | null; 费用投入: number | null }>()
  
  plans.forEach(p => {
    const key = `${p.咨询师}_${p.月份}`
    map.set(key, {
      计划收入: p.计划收入,
      计划招生: p.计划招生,
      费用投入: p.费用投入 ?? null,
    })
  })
  
  return map
}

/**
 * 获取咨询师月度统计数据（实际咨询数据）
 * 包含咨询总量、上门量、报名量、退费人数、电话量等实际业务数据
 */
export async function getConsultantMonthlySummary(params: {
  年份: number
  神殿: string
  数据类型: string
  媒体来源?: string
}): Promise<ConsultantMonthlySummaryData> {
  const response = await api.get('/consult/consultation/stats/consultant-monthly-summary', {
    params
  })
  console.log('=== getConsultantMonthlySummary API响应 ===')
  console.log('请求参数:', params)
  console.log('response.data:', response.data)
  console.log('response.data.data:', response.data?.data)
  
  // 后端返回 { success: true, data: {...} } 格式
  const result = response.data?.data || response.data || {
    年份: params.年份,
    神殿: params.神殿,
    数据类型: params.数据类型,
    咨询师数据: {}
  }
  console.log('返回结果:', result)
  return result
}

/**
 * 获取月度计划汇总（所有咨询师的合计）
 * 返回: Map<月份, { 计划收入, 计划招生 }>
 */
export async function getMonthlyPlanTotals(
  year: number,
  campus: string,
  dataType?: string
): Promise<Map<number, { 计划收入: number; 计划招生: number }>> {
  const plans = await getConsultantPlanList({ year, campus, data_type: dataType })
  const map = new Map<number, { 计划收入: number; 计划招生: number }>()
  
  // 初始化12个月
  for (let m = 1; m <= 12; m++) {
    map.set(m, { 计划收入: 0, 计划招生: 0 })
  }
  
  // 累加每个咨询师的计划数据
  plans.forEach(p => {
    const current = map.get(p.月份)!
    current.计划收入 += p.计划收入 || 0
    current.计划招生 += p.计划招生 || 0
  })
  
  return map
}

/**
 * 获取神殿级月度计划汇总（从咨询师维度聚合，后端SQL聚合版本）
 * 用于替代神殿月度财务数据中的计划部分
 * 返回: Map<月份, { 计划收入, 计划招生, 费用投入 }>
 */
export async function getCampusMonthlyPlanTotals(
  year: number,
  campus: string,
  dataType?: string
): Promise<Map<number, { 计划收入: number; 计划招生: number; 费用投入: number }>> {
  const response = await api.get('/consult/consultant-plan/campus-monthly-totals', {
    params: { year, campus, data_type: dataType }
  })
  const items = response.data?.data || []
  const map = new Map<number, { 计划收入: number; 计划招生: number; 费用投入: number }>()

  for (let m = 1; m <= 12; m++) {
    map.set(m, { 计划收入: 0, 计划招生: 0, 费用投入: 0 })
  }

  items.forEach((item: any) => {
    const current = map.get(item.月份)
    if (current) {
      current.计划收入 += item.计划收入 || 0
      current.计划招生 += item.计划招生 || 0
      current.费用投入 += item.费用投入 || 0
    }
  })

  return map
}

/**
 * 获取所有神殿年度计划汇总（从咨询师维度聚合）
 * 用于001最高议事厅和007 TAB1
 * 返回: [{神殿, 数据类型, 计划收入, 计划招生, 费用投入}, ...]
 */
export async function getAllCampusYearlyPlanSummary(
  year: number,
  dataType?: string
): Promise<Array<{ 神殿: string; 数据类型: string; 计划收入: number; 计划招生: number; 费用投入: number }>> {
  const response = await api.get('/consult/consultant-plan/all-campus-yearly-summary', {
    params: { year, data_type: dataType }
  })
  return response.data?.data || []
}
