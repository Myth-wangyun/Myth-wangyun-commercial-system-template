/**
 * 阶段数据总表 API
 * 获取"各媒体投放情况"和"任务完成明细表"的数据
 * 数据来源参考 2-market-monthly-data 部分
 */

import { api } from '@/services/api'
import dayjs from 'dayjs'
import {
  getNewMediaMonthlyPlan,
  getSEMMonthlyPlan,
  getPartnerMonthlyPlan,
  getReputationMonthlyPlan,
} from '@/services/market/monthlyDetailPlanService'

// ===================== 类型定义 =====================

// 网络计划数据（来自市场部年度网络计划表）
export interface NetworkPlanData {
  id: number
  year: string
  month: number  // 0=总计, 1-12=月份
  campus: string
  // 网络中心计划（总计）
  network_plan_income: number
  network_plan_signup: number
  network_plan_total: number
  network_plan_cost: number
  // 新媒体计划
  newmedia_plan_income: number
  newmedia_plan_signup: number
  newmedia_plan_consult: number
  newmedia_plan_cost: number
  // SEM计划
  sem_plan_income: number
  sem_plan_signup: number
  sem_plan_consult: number
  sem_plan_cost: number
}

// 任务完成情况数据
export interface TaskCompletionData {
  // 计划数据
  planExpense: number      // 总任务-费用
  planQuantity: number     // 总任务-咨询量
  planIncome: number       // 总任务-收入
  planGrossSignup: number  // 总任务-毛报名
  planVisit: number        // 总任务-上门
  planNetSignup: number    // 总任务-净报名
  
  // 应完成数据（按天数比例计算）
  expectedExpense: number
  expectedQuantity: number
  expectedIncome: number
  expectedGrossSignup: number
  expectedVisit: number
  expectedNetSignup: number
  
  // 实际完成数据
  actualExpense: number
  actualQuantity: number
  actualIncome: number
  actualGrossSignup: number
  actualVisit: number
  actualNetSignup: number
}

// 媒体投放情况数据（单个媒体）
export interface MediaExpenseData {
  mediaType: string       // 传统大搜/新媒体
  specificMedia: string   // 百度/抖音/快手等
  expense: number         // 费用
  plannedConsult: number  // 计划咨询量
  completedConsult: number // 完成咨询量
  grossSignup: number     // 毛报名
  netSignup: number       // 净报名
  targetIncome: number    // 目标收入
  actualIncome: number    // 实际收入
}

// 咨询量记录（来自咨询量系统）
interface ConsultationRecord {
  记录ID: number
  登记日期: string | null
  媒体来源: string | null
  是否上门: number
  是否报名: number
  神殿: string | null
  量来源: string | null
}

// 平台每日数据类型
interface PlatformDailyData {
  consumption: number      // 消费
  consult_count: number    // 咨询量
  visit_count: number      // 上门
  gross_total: number      // 毛报名
  net_signup: number       // 净报名
  actual_income: number    // 实际收入
}

// ===================== 媒体来源映射 =====================

/**
 * 二级媒体来源到三级细分媒体的映射
 */
const MEDIA_SOURCE_MAPPING: Record<string, string[]> = {
  // 传统大搜（SEM）
  '百度': ['百度推广', '中心来电', '在线报名/网站留言', '百度表单', '91搜客', 'SEM', '常规SEM平台', '常规SEM'],
  '百教网': ['百教网'],
  '知了好学': ['知了好学'],
  '坦途网': ['坦途网'],
  '市场口碑': ['市场口碑', '口碑'],
  // 新媒体
  '抖音': ['抖音'],
  '快手': ['快手'],
  '微信视频号': ['微信视频号', '视频号'],
  'B站': ['B站', 'b站', 'bilibili'],
  '小红书': ['小红书'],
}

// ===================== API 函数 =====================

/**
 * 获取网络计划数据
 */
export async function getNetworkPlanData(
  year: string,
  campus: string
): Promise<NetworkPlanData[]> {
  try {
    const response = await api.get('/market/network-plan', {
      params: { year, campus }
    })
    // api.get 返回 AxiosResponse, response.data 是实际数据（数组）
    const data = response.data
    console.log('[阶段报告] 网络计划原始数据:', data)
    
    // 返回的可能是数组或带有value字段的对象
    if (Array.isArray(data)) {
      return data
    } else if (data && Array.isArray(data.value)) {
      return data.value
    }
    return []
  } catch (error) {
    console.error('[阶段报告] 获取网络计划数据失败:', error)
    return []
  }
}

/**
 * 获取咨询量汇总数据（按日期范围）
 */
async function getConsultationSummary(
  campus: string,
  startDate: string,
  endDate: string
): Promise<{
  total: number
  visit: number
  signup: number
  byMedia: Record<string, { count: number; visit: number; signup: number }>
}> {
  try {
    // 使用分页获取所有记录
    const records = await fetchAllRecords(campus, '网络', startDate, endDate)
    
    console.log('[阶段报告] 咨询量数据:', records.length, '条, 神殿:', campus)
    
    // 按媒体来源汇总
    const byMedia: Record<string, { count: number; visit: number; signup: number }> = {}
    let total = 0
    let visit = 0
    let signup = 0
    
    for (const record of records) {
      total++
      if (record.是否上门 === 1) visit++
      if (record.是否报名 === 1) signup++
      
      // 匹配具体媒体
      const media = record.媒体来源 || '未知'
      let matchedMedia = '其他'
      
      for (const [specificMedia, sources] of Object.entries(MEDIA_SOURCE_MAPPING)) {
        if (sources.includes(media)) {
          matchedMedia = specificMedia
          break
        }
      }
      
      if (!byMedia[matchedMedia]) {
        byMedia[matchedMedia] = { count: 0, visit: 0, signup: 0 }
      }
      byMedia[matchedMedia].count++
      if (record.是否上门 === 1) byMedia[matchedMedia].visit++
      if (record.是否报名 === 1) byMedia[matchedMedia].signup++
    }
    
    console.log('[阶段报告] 咨询量汇总: 总量=', total, '上门=', visit, '报名=', signup)
    
    return { total, visit, signup, byMedia }
  } catch (error) {
    console.error('[阶段报告] 获取咨询量汇总失败:', error)
    return { total: 0, visit: 0, signup: 0, byMedia: {} }
  }
}

/**
 * 获取平台每日数据汇总（抖音、快手、B站、小红书、微信视频号）
 */
async function getPlatformDailySummary(
  campus: string,
  startDate: string,
  endDate: string
): Promise<Record<string, PlatformDailyData>> {
  const result: Record<string, PlatformDailyData> = {
    '抖音': { consumption: 0, consult_count: 0, visit_count: 0, gross_total: 0, net_signup: 0, actual_income: 0 },
    '快手': { consumption: 0, consult_count: 0, visit_count: 0, gross_total: 0, net_signup: 0, actual_income: 0 },
    'B站': { consumption: 0, consult_count: 0, visit_count: 0, gross_total: 0, net_signup: 0, actual_income: 0 },
    '小红书': { consumption: 0, consult_count: 0, visit_count: 0, gross_total: 0, net_signup: 0, actual_income: 0 },
    '微信视频号': { consumption: 0, consult_count: 0, visit_count: 0, gross_total: 0, net_signup: 0, actual_income: 0 },
  }
  
  const month = startDate.substring(0, 7) // YYYY-MM
  
  // 获取各平台数据
  const platformApis = [
    { name: '抖音', url: '/market/douyin-daily-data' },
    { name: '快手', url: '/market/kuaishou-daily-data' },
    { name: 'B站', url: '/market/bilibili-daily-data' },
    { name: '小红书', url: '/market/xiaohongshu-daily-data' },
    { name: '微信视频号', url: '/market/wechat-video-daily-data' },
  ]
  
  await Promise.all(platformApis.map(async ({ name, url }) => {
    try {
      // 使用 api.get，返回 AxiosResponse
      const response = await api.get(url, {
        params: { campus, month }
      })
      // response.data 可能是 { items: [...] } 或直接是数组
      const data = response.data
      const items = data?.items || (Array.isArray(data) ? data : [])
      
      console.log(`[阶段报告] ${name}数据:`, items.length, '条')
      
      // 汇总指定日期范围内的数据
      for (const item of items) {
        if (item.date >= startDate && item.date <= endDate) {
          result[name].consumption += Number(item.consumption) || 0
          result[name].consult_count += Number(item.consult_count) || 0
          result[name].visit_count += Number(item.visit_count) || 0
          result[name].gross_total += Number(item.gross_total) || 0
          result[name].net_signup += Number(item.net_signup) || 0
          result[name].actual_income += Number(item.actual_income) || 0
        }
      }
    } catch (error) {
      console.warn(`[阶段报告] 获取${name}数据失败:`, error)
    }
  }))
  
  return result
}

/**
 * 获取网络合作伙伴每日数据汇总（百教网、知了好学、坦途网）
 */
async function getPartnerDailySummary(
  campus: string,
  startDate: string,
  endDate: string
): Promise<Record<string, PlatformDailyData>> {
  const result: Record<string, PlatformDailyData> = {
    '百教网': { consumption: 0, consult_count: 0, visit_count: 0, gross_total: 0, net_signup: 0, actual_income: 0 },
    '知了好学': { consumption: 0, consult_count: 0, visit_count: 0, gross_total: 0, net_signup: 0, actual_income: 0 },
    '坦途网': { consumption: 0, consult_count: 0, visit_count: 0, gross_total: 0, net_signup: 0, actual_income: 0 },
  }
  
  const month = startDate.substring(0, 7) // YYYY-MM
  
  // 获取各合作伙伴数据
  const partners = ['百教网', '知了好学', '坦途网']
  
  await Promise.all(partners.map(async (partner) => {
    try {
      console.log(`[阶段报告] 开始获取${partner}数据, 参数:`, { campus, partner, month })
      const response = await api.get('/market/online-partner-daily', {
        params: { campus, partner, month }
      })
      const data = response.data
      const items = data?.items || (Array.isArray(data) ? data : [])
      
      console.log(`[阶段报告] ${partner}数据:`, items.length, '条')
      console.log(`[阶段报告] ${partner}原始数据:`, items)
      
      // 汇总指定日期范围内的数据
      for (const item of items) {
        console.log(`[阶段报告] ${partner}处理记录:`, item.date, '范围:', startDate, '-', endDate)
        if (item.date >= startDate && item.date <= endDate) {
          const cost = Number(item.partner_cost) || 0
          const income = Number(item.partner_actual_income) || 0
          const gross = Number(item.gross_total) || 0
          const net = Number(item.net_signup) || 0
          
          console.log(`[阶段报告] ${partner}累加数据:`, { 
            date: item.date,
            partner_cost: cost, 
            partner_actual_income: income,
            gross_total: gross,
            net_signup: net
          })
          
          result[partner].consumption += cost
          result[partner].consult_count += Number(item.actual_consult_count) || 0
          result[partner].visit_count += Number(item.visit_count) || 0
          result[partner].gross_total += gross
          result[partner].net_signup += net
          result[partner].actual_income += income
        }
      }
      
      console.log(`[阶段报告] ${partner}最终汇总:`, result[partner])
    } catch (error) {
      console.warn(`[阶段报告] 获取${partner}数据失败:`, error)
    }
  }))
  
  return result
}

/**
 * 获取市场口碑每日数据汇总
 * @param campus 神殿名称
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param actualExpense 实际消费（从月度计划中传入）
 */
async function getReputationDailySummary(
  campus: string,
  startDate: string,
  endDate: string,
  actualExpense: number = 0
): Promise<PlatformDailyData> {
  const result: PlatformDailyData = {
    consumption: 0,
    consult_count: 0,
    visit_count: 0,
    gross_total: 0,
    net_signup: 0,
    actual_income: 0,
  }
  
  const month = startDate.substring(0, 7) // YYYY-MM
  
  try {
    const response = await api.get('/market/daily-reputation-data', {
      params: { campus, month }
    })
    const data = response.data
    const items = data?.items || (Array.isArray(data) ? data : [])
    
    console.log('[阶段报告] 市场口碑数据:', items.length, '条')
    
    // 计算日期范围内的天数和当月总天数，用于按比例分配花费
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    const daysInRange = end.diff(start, 'day') + 1
    const daysInMonth = start.daysInMonth()
    const costRatio = daysInRange / daysInMonth
    
    // 按比例分配月度实际消费到当前日期范围
    result.consumption = Math.round(actualExpense * costRatio)
    
    console.log('[阶段报告] 市场口碑花费计算:', {
      actualExpense,
      daysInRange,
      daysInMonth,
      costRatio,
      allocatedCost: result.consumption
    })
    
    // 汇总指定日期范围内的数据
    for (const item of items) {
      if (item.date >= startDate && item.date <= endDate) {
        result.consult_count += Number(item.actual_consult_count) || 0
        result.visit_count += Number(item.visit_count) || 0
        result.gross_total += Number(item.gross_count) || 0
        result.net_signup += Number(item.net_signup) || 0
        result.actual_income += Number(item.partner_income) || 0
      }
    }
  } catch (error) {
    console.warn('[阶段报告] 获取市场口碑数据失败:', error)
  }
  
  return result
}

/**
 * 获取SEM每日数据汇总（百度推广）
 */
async function getSEMDailySummary(
  campus: string,
  startDate: string,
  endDate: string
): Promise<PlatformDailyData> {
  const result: PlatformDailyData = {
    consumption: 0,
    consult_count: 0,
    visit_count: 0,
    gross_total: 0,
    net_signup: 0,
    actual_income: 0,
  }
  
  const month = startDate.substring(0, 7) // YYYY-MM
  
  try {
    // 获取百度推广数据
    const response = await api.get('/market/sem-daily/baidu', {
      params: { campus, month }
    })
    const data = response.data
    const items = data?.items || (Array.isArray(data) ? data : [])
    
    console.log('[阶段报告] SEM百度数据:', items.length, '条')
    
    for (const item of items) {
      if (item.date >= startDate && item.date <= endDate) {
        result.consumption += Number(item.consumption) || Number(item.baidu_consumption) || 0
        result.consult_count += Number(item.baidu_consult_count) || 0
        result.visit_count += Number(item.visit_count) || 0
        result.gross_total += Number(item.gross_total) || 0
        result.net_signup += Number(item.net_signup) || 0
        result.actual_income += Number(item.baidu_income) || 0
      }
    }
  } catch (error) {
    console.warn('[阶段报告] 获取SEM数据失败:', error)
  }
  
  return result
}

/**
 * 获取任务完成情况数据
 * @param campus 神殿名称
 * @param year 年份
 * @param month 月份
 * @param endDay 截止日（当月第几天）
 * @param customStartDate 自定义开始日期 (可选, YYYY-MM-DD)
 * @param customEndDate 自定义结束日期 (可选, YYYY-MM-DD)
 */
export async function getTaskCompletionData(
  campus: string,
  year: string,
  month: string,
  endDay: number,
  customStartDate?: string,
  customEndDate?: string
): Promise<TaskCompletionData> {
  // 使用自定义日期或默认从月初到指定日
  const startDate = customStartDate || `${year}-${month.padStart(2, '0')}-01`
  const endDate = customEndDate || `${year}-${month.padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
  const daysInMonth = dayjs(startDate).daysInMonth()
  const dayRatio = endDay / daysInMonth  // 时间进度比例
  
  console.log('[任务完成] 获取数据, 神殿:', campus, '日期范围:', startDate, '-', endDate, '进度:', (dayRatio * 100).toFixed(1) + '%')
  
  // 1. 获取计划数据
  const planDataList = await getNetworkPlanData(year, campus)
  const monthPlan = planDataList.find(p => p.month === parseInt(month))
  
  // 2. 获取口碑月度计划（用于获取实际消费）
  const reputationMonthlyPlan = await getReputationMonthlyPlan(year, campus, parseInt(month))
  const reputationActualExpense = reputationMonthlyPlan?.actual_expense || 0
  
  console.log('[任务完成] 市场口碑实际消费:', reputationActualExpense)
  
  // 3. 获取各平台实际费用（不使用咨询量系统，直接使用各平台日度数据）
  const [platformData, semData, partnerData, reputationData] = await Promise.all([
    getPlatformDailySummary(campus, startDate, endDate),
    getSEMDailySummary(campus, startDate, endDate),
    getPartnerDailySummary(campus, startDate, endDate),
    getReputationDailySummary(campus, startDate, endDate, reputationActualExpense),
  ])
  
  // 汇总实际消费（与各媒体投放情况合计一致）
  let actualExpense = semData.consumption
  for (const platform of Object.values(platformData)) {
    actualExpense += platform.consumption
  }
  for (const partner of Object.values(partnerData)) {
    actualExpense += partner.consumption
  }
  actualExpense += reputationData.consumption
  // 修复浮点数精度问题：保留两位小数
  actualExpense = Math.round(actualExpense * 100) / 100
  
  // 汇总实际收入（与各媒体投放情况合计一致）
  let actualIncome = semData.actual_income
  for (const platform of Object.values(platformData)) {
    actualIncome += platform.actual_income
  }
  for (const partner of Object.values(partnerData)) {
    actualIncome += partner.actual_income
  }
  actualIncome += reputationData.actual_income
  // 修复浮点数精度问题：保留两位小数
  actualIncome = Math.round(actualIncome * 100) / 100
  
  // 汇总毛报名（直接使用各平台日度数据，不使用咨询量系统）
  let actualGrossSignup = 0
  actualGrossSignup += semData.gross_total
  actualGrossSignup += partnerData['百教网'].gross_total
  actualGrossSignup += partnerData['知了好学'].gross_total
  actualGrossSignup += partnerData['坦途网'].gross_total
  actualGrossSignup += reputationData.gross_total
  actualGrossSignup += platformData['抖音'].gross_total
  actualGrossSignup += platformData['快手'].gross_total
  actualGrossSignup += platformData['微信视频号'].gross_total
  actualGrossSignup += platformData['B站'].gross_total
  actualGrossSignup += platformData['小红书'].gross_total
  // 确保为整数
  actualGrossSignup = Math.round(actualGrossSignup)
  
  // 汇总净报名（直接使用各平台日度数据）
  let actualNetSignup = 0
  actualNetSignup += semData.net_signup
  actualNetSignup += partnerData['百教网'].net_signup
  actualNetSignup += partnerData['知了好学'].net_signup
  actualNetSignup += partnerData['坦途网'].net_signup
  actualNetSignup += reputationData.net_signup
  actualNetSignup += platformData['抖音'].net_signup
  actualNetSignup += platformData['快手'].net_signup
  actualNetSignup += platformData['微信视频号'].net_signup
  actualNetSignup += platformData['B站'].net_signup
  actualNetSignup += platformData['小红书'].net_signup
  // 确保为整数
  actualNetSignup = Math.round(actualNetSignup)
  
  // 汇总上门（直接使用各平台日度数据）
  let actualVisit = 0
  actualVisit += semData.visit_count
  actualVisit += partnerData['百教网'].visit_count
  actualVisit += partnerData['知了好学'].visit_count
  actualVisit += partnerData['坦途网'].visit_count
  actualVisit += reputationData.visit_count
  actualVisit += platformData['抖音'].visit_count
  actualVisit += platformData['快手'].visit_count
  actualVisit += platformData['微信视频号'].visit_count
  actualVisit += platformData['B站'].visit_count
  actualVisit += platformData['小红书'].visit_count
  // 确保为整数
  actualVisit = Math.round(actualVisit)
  
  // 汇总咨询量（直接使用各平台日度数据，不使用咨询量系统）
  let actualQuantity = 0
  actualQuantity += semData.consult_count
  actualQuantity += partnerData['百教网'].consult_count
  actualQuantity += partnerData['知了好学'].consult_count
  actualQuantity += partnerData['坦途网'].consult_count
  actualQuantity += reputationData.consult_count
  actualQuantity += platformData['抖音'].consult_count
  actualQuantity += platformData['快手'].consult_count
  actualQuantity += platformData['微信视频号'].consult_count
  actualQuantity += platformData['B站'].consult_count
  actualQuantity += platformData['小红书'].consult_count
  // 确保为整数
  actualQuantity = Math.round(actualQuantity)
  
  // 确保数值类型正确
  const getPlanNumber = (value: any): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }
  
  // 构建结果
  const result: TaskCompletionData = {
    // 计划数据
    planExpense: Math.round(getPlanNumber(monthPlan?.network_plan_cost)),
    planQuantity: Math.round(getPlanNumber(monthPlan?.network_plan_total)),
    planIncome: Math.round(getPlanNumber(monthPlan?.network_plan_income)),
    planGrossSignup: Math.round(getPlanNumber(monthPlan?.network_plan_signup)),
    planVisit: Math.round(getPlanNumber(monthPlan?.network_plan_total) * 0.1), // 上门为量的十分之一
    planNetSignup: Math.round(getPlanNumber(monthPlan?.network_plan_signup)),
    
    // 应完成（按时间比例）
    expectedExpense: Math.round(getPlanNumber(monthPlan?.network_plan_cost) * dayRatio),
    expectedQuantity: Math.round(getPlanNumber(monthPlan?.network_plan_total) * dayRatio),
    expectedIncome: Math.round(getPlanNumber(monthPlan?.network_plan_income) * dayRatio),
    expectedGrossSignup: Math.round(getPlanNumber(monthPlan?.network_plan_signup) * dayRatio),
    expectedVisit: Math.round(getPlanNumber(monthPlan?.network_plan_total) * 0.1 * dayRatio),
    expectedNetSignup: Math.round(getPlanNumber(monthPlan?.network_plan_signup) * dayRatio),
    
    // 实际完成（与各媒体投放情况合计一致，直接使用各平台日度数据）
    actualExpense,
    actualQuantity,
    actualIncome,
    actualGrossSignup,
    actualVisit,
    actualNetSignup,
  }
  
  console.log('[任务完成] 数据汇总:', result)
  console.log('[任务完成] 从日度数据汇总: 量=', actualQuantity, '上门=', actualVisit, '毛报名=', actualGrossSignup, '净报名=', actualNetSignup)
  
  return result
}

/**
 * 获取各媒体投放情况数据
 * @param campus 神殿名称
 * @param year 年份
 * @param month 月份
 * @param endDay 截止日（当月第几天）
 * @param customStartDate 自定义开始日期 (可选, YYYY-MM-DD)
 * @param customEndDate 自定义结束日期 (可选, YYYY-MM-DD)
 */
export async function getMediaExpenseData(
  campus: string,
  year: string,
  month: string,
  endDay: number,
  customStartDate?: string,
  customEndDate?: string
): Promise<MediaExpenseData[]> {
  // 使用自定义日期或默认从月初到指定日
  const startDate = customStartDate || `${year}-${month.padStart(2, '0')}-01`
  const endDate = customEndDate || `${year}-${month.padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
  const monthNum = parseInt(month)
  
  console.log('[媒体投放] 获取数据, 神殿:', campus, '日期范围:', startDate, '-', endDate)
  
  // 1. 从月度详细计划获取各渠道的计划数据
  const [newmediaMonthlyPlan, semMonthlyPlan, partnerMonthlyPlan, reputationMonthlyPlan] = await Promise.all([
    getNewMediaMonthlyPlan(year, campus, monthNum),
    getSEMMonthlyPlan(year, campus, monthNum),
    getPartnerMonthlyPlan(year, campus, monthNum),
    getReputationMonthlyPlan(year, campus, monthNum),
  ])
  
  // 获取口碑的实际消费
  const reputationActualExpense = reputationMonthlyPlan?.actual_expense || 0
  
  console.log('[媒体投放] 市场口碑实际消费:', reputationActualExpense)
  
  // 2. 获取各平台实际费用和数据（不使用咨询量系统，直接使用日度数据）
  const [platformData, semData, partnerData, reputationData] = await Promise.all([
    getPlatformDailySummary(campus, startDate, endDate),
    getSEMDailySummary(campus, startDate, endDate),
    getPartnerDailySummary(campus, startDate, endDate),
    getReputationDailySummary(campus, startDate, endDate, reputationActualExpense),
  ])
  
  // SEM渠道名称映射
  const semChannelMap: Record<string, string> = {
    '百度': '百度推广',
    '神殿网站': '神殿网站/直接访问',
    'GEO': 'GEO',
  }
  
  // 从月度详细计划获取SEM百度推广的计划数据
  const baiduPlan = semMonthlyPlan['百度推广'] || null
  
  // 从月度详细计划获取网络合作伙伴的计划数据
  const baijiaowangPlan = partnerMonthlyPlan['百教网'] || null
  const zhiliaoPlan = partnerMonthlyPlan['知了好学'] || null
  const tantuPlan = partnerMonthlyPlan['坦途网'] || null
  
  // 从月度详细计划获取口碑的计划数据
  const koubeiPlan = reputationMonthlyPlan || null
  
  // 从月度详细计划获取新媒体各平台的计划数据
  const douyinPlan = newmediaMonthlyPlan['抖音'] || null
  const kuaishouPlan = newmediaMonthlyPlan['快手'] || null
  const shipinhaoplan = newmediaMonthlyPlan['微信视频号'] || null
  const bilibiliPlan = newmediaMonthlyPlan['B站'] || null
  const xiaohongshuPlan = newmediaMonthlyPlan['小红书'] || null
  
  // 辅助函数：修复浮点数精度
  const fixPrecision = (value: number): number => {
    return Math.round(value * 100) / 100
  }
  
  // 构建媒体投放数据（计划咨询量和目标收入从月度详细计划获取，实际数据直接使用日度数据）
  const result: MediaExpenseData[] = [
    // 传统大搜
    {
      mediaType: '传统大搜',
      specificMedia: '百度',
      expense: fixPrecision(semData.consumption),
      plannedConsult: Math.round(baiduPlan?.plan_consult_volume || 0),
      completedConsult: Math.round(semData.consult_count),
      grossSignup: Math.round(semData.gross_total),
      netSignup: Math.round(semData.net_signup),
      targetIncome: fixPrecision(baiduPlan?.plan_income || 0),  // 目标收入 = 月度计划的计划收入
      actualIncome: fixPrecision(semData.actual_income),
    },
    {
      mediaType: '',
      specificMedia: '百教网',
      expense: fixPrecision(partnerData['百教网'].consumption),
      plannedConsult: Math.round(baijiaowangPlan?.plan_consult_volume || 0),
      completedConsult: Math.round(partnerData['百教网'].consult_count),
      grossSignup: Math.round(partnerData['百教网'].gross_total),
      netSignup: Math.round(partnerData['百教网'].net_signup),
      targetIncome: fixPrecision(baijiaowangPlan?.plan_income || 0),
      actualIncome: fixPrecision(partnerData['百教网'].actual_income),
    },
    {
      mediaType: '',
      specificMedia: '知了好学',
      expense: fixPrecision(partnerData['知了好学'].consumption),
      plannedConsult: Math.round(zhiliaoPlan?.plan_consult_volume || 0),
      completedConsult: Math.round(partnerData['知了好学'].consult_count),
      grossSignup: Math.round(partnerData['知了好学'].gross_total),
      netSignup: Math.round(partnerData['知了好学'].net_signup),
      targetIncome: fixPrecision(zhiliaoPlan?.plan_income || 0),
      actualIncome: fixPrecision(partnerData['知了好学'].actual_income),
    },
    {
      mediaType: '',
      specificMedia: '坦途网',
      expense: fixPrecision(partnerData['坦途网'].consumption),
      plannedConsult: Math.round(tantuPlan?.plan_consult_volume || 0),
      completedConsult: Math.round(partnerData['坦途网'].consult_count),
      grossSignup: Math.round(partnerData['坦途网'].gross_total),
      netSignup: Math.round(partnerData['坦途网'].net_signup),
      targetIncome: fixPrecision(tantuPlan?.plan_income || 0),
      actualIncome: fixPrecision(partnerData['坦途网'].actual_income),
    },
    {
      mediaType: '',
      specificMedia: '市场口碑',
      expense: fixPrecision(reputationData.consumption),
      plannedConsult: Math.round(koubeiPlan?.plan_consult_volume || 0),
      completedConsult: Math.round(reputationData.consult_count),
      grossSignup: Math.round(reputationData.gross_total),
      netSignup: Math.round(reputationData.net_signup),
      targetIncome: fixPrecision(koubeiPlan?.plan_income || 0),
      actualIncome: fixPrecision(reputationData.actual_income),
    },
    // 新媒体
    {
      mediaType: '新媒体',
      specificMedia: '抖音',
      expense: fixPrecision(platformData['抖音'].consumption),
      plannedConsult: Math.round(douyinPlan?.plan_consult_volume || 0),
      completedConsult: Math.round(platformData['抖音'].consult_count),
      grossSignup: Math.round(platformData['抖音'].gross_total),
      netSignup: Math.round(platformData['抖音'].net_signup),
      targetIncome: fixPrecision(douyinPlan?.plan_income || 0),  // 目标收入 = 月度计划的计划收入
      actualIncome: fixPrecision(platformData['抖音'].actual_income),
    },
    {
      mediaType: '',
      specificMedia: '快手',
      expense: fixPrecision(platformData['快手'].consumption),
      plannedConsult: Math.round(kuaishouPlan?.plan_consult_volume || 0),
      completedConsult: Math.round(platformData['快手'].consult_count),
      grossSignup: Math.round(platformData['快手'].gross_total),
      netSignup: Math.round(platformData['快手'].net_signup),
      targetIncome: fixPrecision(kuaishouPlan?.plan_income || 0),
      actualIncome: fixPrecision(platformData['快手'].actual_income),
    },
    {
      mediaType: '',
      specificMedia: '微信视频号',
      expense: fixPrecision(platformData['微信视频号'].consumption),
      plannedConsult: Math.round(shipinhaoplan?.plan_consult_volume || 0),
      completedConsult: Math.round(platformData['微信视频号'].consult_count),
      grossSignup: Math.round(platformData['微信视频号'].gross_total),
      netSignup: Math.round(platformData['微信视频号'].net_signup),
      targetIncome: fixPrecision(shipinhaoplan?.plan_income || 0),
      actualIncome: fixPrecision(platformData['微信视频号'].actual_income),
    },
    {
      mediaType: '',
      specificMedia: 'B站',
      expense: fixPrecision(platformData['B站'].consumption),
      plannedConsult: Math.round(bilibiliPlan?.plan_consult_volume || 0),
      completedConsult: Math.round(platformData['B站'].consult_count),
      grossSignup: Math.round(platformData['B站'].gross_total),
      netSignup: Math.round(platformData['B站'].net_signup),
      targetIncome: fixPrecision(bilibiliPlan?.plan_income || 0),
      actualIncome: fixPrecision(platformData['B站'].actual_income),
    },
    {
      mediaType: '',
      specificMedia: '小红书',
      expense: fixPrecision(platformData['小红书'].consumption),
      plannedConsult: Math.round(xiaohongshuPlan?.plan_consult_volume || 0),
      completedConsult: Math.round(platformData['小红书'].consult_count),
      grossSignup: Math.round(platformData['小红书'].gross_total),
      netSignup: Math.round(platformData['小红书'].net_signup),
      targetIncome: fixPrecision(xiaohongshuPlan?.plan_income || 0),
      actualIncome: fixPrecision(platformData['小红书'].actual_income),
    },
  ]
  
  console.log('[媒体投放] 数据汇总:', result)
  
  return result
}

/**
 * 计算传统大搜合计
 */
export function calcSEMTotal(mediaData: MediaExpenseData[]): MediaExpenseData {
  const semItems = mediaData.filter(m => 
    ['百度', '百教网', '知了好学', '坦途网', '市场口碑'].includes(m.specificMedia)
  )
  
  return {
    mediaType: '',
    specificMedia: '合计',
    expense: Math.round(semItems.reduce((sum, m) => sum + m.expense, 0) * 100) / 100,
    plannedConsult: Math.round(semItems.reduce((sum, m) => sum + m.plannedConsult, 0)),
    completedConsult: Math.round(semItems.reduce((sum, m) => sum + m.completedConsult, 0)),
    grossSignup: Math.round(semItems.reduce((sum, m) => sum + m.grossSignup, 0)),
    netSignup: Math.round(semItems.reduce((sum, m) => sum + m.netSignup, 0)),
    targetIncome: Math.round(semItems.reduce((sum, m) => sum + m.targetIncome, 0) * 100) / 100,
    actualIncome: Math.round(semItems.reduce((sum, m) => sum + m.actualIncome, 0) * 100) / 100,
  }
}

/**
 * 计算新媒体合计
 */
export function calcNewMediaTotal(mediaData: MediaExpenseData[]): MediaExpenseData {
  const newmediaItems = mediaData.filter(m => 
    ['抖音', '快手', '微信视频号', 'B站', '小红书'].includes(m.specificMedia)
  )
  
  return {
    mediaType: '',
    specificMedia: '合计',
    expense: Math.round(newmediaItems.reduce((sum, m) => sum + m.expense, 0) * 100) / 100,
    plannedConsult: Math.round(newmediaItems.reduce((sum, m) => sum + m.plannedConsult, 0)),
    completedConsult: Math.round(newmediaItems.reduce((sum, m) => sum + m.completedConsult, 0)),
    grossSignup: Math.round(newmediaItems.reduce((sum, m) => sum + m.grossSignup, 0)),
    netSignup: Math.round(newmediaItems.reduce((sum, m) => sum + m.netSignup, 0)),
    targetIncome: Math.round(newmediaItems.reduce((sum, m) => sum + m.targetIncome, 0) * 100) / 100,
    actualIncome: Math.round(newmediaItems.reduce((sum, m) => sum + m.actualIncome, 0) * 100) / 100,
  }
}

/**
 * 计算总计
 */
export function calcGrandTotal(mediaData: MediaExpenseData[]): MediaExpenseData {
  const allItems = mediaData.filter(m => 
    m.specificMedia !== '合计' && m.specificMedia !== ''
  )
  
  return {
    mediaType: '合计',
    specificMedia: '',
    expense: Math.round(allItems.reduce((sum, m) => sum + m.expense, 0) * 100) / 100,
    plannedConsult: Math.round(allItems.reduce((sum, m) => sum + m.plannedConsult, 0)),
    completedConsult: Math.round(allItems.reduce((sum, m) => sum + m.completedConsult, 0)),
    grossSignup: Math.round(allItems.reduce((sum, m) => sum + m.grossSignup, 0)),
    netSignup: Math.round(allItems.reduce((sum, m) => sum + m.netSignup, 0)),
    targetIncome: Math.round(allItems.reduce((sum, m) => sum + m.targetIncome, 0) * 100) / 100,
    actualIncome: Math.round(allItems.reduce((sum, m) => sum + m.actualIncome, 0) * 100) / 100,
  }
}

// ===== 分析数据类型定义 =====

/**
 * 人群状态维度数据
 */
export interface CrowdStatusRow {
  status: string            // 人群状态
  quantity: number          // 量
  visit: number             // 上门
  visitConversionRate: string // 上门转化率
  signup: number            // 报名
  signupConversionRate: string // 报名转化率
}

/**
 * 学历维度数据
 */
export interface EducationRow {
  education: string         // 学历
  quantity: number          // 量
  visit: number             // 上门
  signup: number            // 报名
}

/**
 * 详细人群状态数据（学历+状态组合）
 */
export interface DetailedCrowdStatusRow {
  status: string            // 学历-状态
  quantity: number          // 量
  ratio: string             // 占比
  visit: number             // 上门
  signup: number            // 报名
}

/**
 * 地域维度数据
 */
export interface LocationRow {
  location: string          // 位置
  quantity: number          // 量
  ratio: string             // 占比
  visit: number             // 上门
  signup: number            // 报名
}

// ===== 神殿与当地城市映射 =====

/**
 * 根据神殿名称获取当地城市
 */
function getLocalCityByCampus(campus: string): string {
  // 河北神殿 -> 石家庄
  if (campus.includes('盛邦') || campus.includes('冀美') || campus.includes('石美') || campus.includes('河北')) {
    return '石家庄'
  }
  // 山西神殿 -> 太原
  if (campus.includes('晋美') || campus.includes('原美') || campus.includes('太美') || campus.includes('山西')) {
    return '太原'
  }
  // 广西神殿 -> 南宁
  if (campus.includes('桂美') || campus.includes('邕美') || campus.includes('广西')) {
    return '南宁'
  }
  // 贵州神殿 -> 贵阳
  if (campus.includes('黔美') || campus.includes('贵州')) {
    return '贵阳'
  }
  // 默认石家庄
  return '石家庄'
}

/**
 * 根据神殿获取地域列表
 */
function getLocationsByCampus(campus: string): string[] {
  // 河北神殿
  if (campus.includes('盛邦') || campus.includes('冀美') || campus.includes('石美') || campus.includes('河北')) {
    return ['石家庄', '邢台', '保定', '邯郸', '衡水', '沧州', '廊坊', '其他']
  }
  // 山西神殿
  if (campus.includes('晋美') || campus.includes('原美') || campus.includes('太美') || campus.includes('山西')) {
    return ['太原', '晋中', '吕梁', '阳泉', '忻州', '临汾', '朔州', '其他']
  }
  // 广西神殿
  if (campus.includes('桂美') || campus.includes('邕美') || campus.includes('广西')) {
    return ['南宁', '贵港', '钦州', '崇左', '河池', '百色', '来宾', '防城港', '其他']
  }
  // 贵州神殿（暂时使用河北配置）
  if (campus.includes('黔美') || campus.includes('贵州')) {
    return ['贵阳', '遵义', '六盘水', '安顺', '毕节', '铜仁', '黔东南', '黔南', '其他']
  }
  // 默认河北
  return ['石家庄', '邢台', '保定', '邯郸', '衡水', '沧州', '廊坊', '其他']
}

// ===== 分析数据获取函数 =====

/**
 * 获取所有咨询记录（自动分页获取）
 */
async function fetchAllRecords(
  campus: string,
  source: string,
  startDate: string,
  endDate: string
): Promise<any[]> {
  const allRecords: any[] = []
  let page = 1
  const pageSize = 1000 // 后端限制最大1000
  let hasMore = true
  
  while (hasMore) {
    const response = await api.get('/consult/consultation/records', {
      params: {
        campus,
        source,
        start_date: startDate,
        end_date: endDate,
        page,
        page_size: pageSize
      }
    })
    
    const records = parseRecordsResponse(response.data)
    allRecords.push(...records)
    
    // 检查是否还有更多数据
    const total = response.data?.总记录数 || response.data?.total || 0
    if (allRecords.length >= total || records.length < pageSize) {
      hasMore = false
    } else {
      page++
    }
  }
  
  return allRecords
}

/**
 * 从咨询记录获取分析数据
 */
export async function getAnalysisData(
  campus: string,
  startDate: string,
  endDate: string
): Promise<{
  baiduCrowdData: CrowdStatusRow[]
  newmediaCrowdData: CrowdStatusRow[]
  baiduEducationData: EducationRow[]
  newmediaEducationData: EducationRow[]
  baiduDetailedCrowdData: DetailedCrowdStatusRow[]
  newmediaDetailedCrowdData: DetailedCrowdStatusRow[]
  baiduLocationData: LocationRow[]
  newmediaLocationData: LocationRow[]
  baiduLocationIntentData: LocationRow[]
}> {
  // 新媒体平台来源列表（用于区分SEM和新媒体）
  const NEW_MEDIA_PLATFORMS = ['抖音', '快手', '微信视频号', 'B站', '小红书', '新媒体平台']
  
  try {
    // 获取所有网络来源的咨询记录（包含SEM和新媒体）
    const allNetworkRecords = await fetchAllRecords(campus, '网络', startDate, endDate)
    
    console.log('[stageSummaryApi] 网络来源总记录数量:', allNetworkRecords.length)
    
    // 根据媒体来源区分 SEM 和新媒体
    const semRecords = allNetworkRecords.filter(r => {
      const mediaSource = r['媒体来源'] || r.media_source || ''
      return !NEW_MEDIA_PLATFORMS.includes(mediaSource)
    })
    
    const newmediaRecords = allNetworkRecords.filter(r => {
      const mediaSource = r['媒体来源'] || r.media_source || ''
      return NEW_MEDIA_PLATFORMS.includes(mediaSource)
    })
    
    console.log('[stageSummaryApi] SEM记录数量:', semRecords.length)
    console.log('[stageSummaryApi] 新媒体记录数量:', newmediaRecords.length)
    
    // 根据神殿确定当地城市和地域列表
    const localCity = getLocalCityByCampus(campus)
    const locationList = getLocationsByCampus(campus)
    
    // 按人群状态分析
    const baiduCrowdData = analyzeByStatus(semRecords)
    const newmediaCrowdData = analyzeByStatus(newmediaRecords)
    
    // 按学历分析
    const baiduEducationData = analyzeByEducation(semRecords)
    const newmediaEducationData = analyzeByEducation(newmediaRecords)
    
    // 按学历+状态组合分析
    const baiduDetailedCrowdData = analyzeByDetailedStatus(semRecords)
    const newmediaDetailedCrowdData = analyzeByDetailedStatus(newmediaRecords)
    
    // 按地域分析
    const baiduLocationData = analyzeByLocation(semRecords, locationList)
    const newmediaLocationData = analyzeByLocation(newmediaRecords, locationList)
    
    // 按地域意向分析（只针对百度）
    const baiduLocationIntentData = analyzeByLocationIntent(semRecords, localCity)
    
    return {
      baiduCrowdData,
      newmediaCrowdData,
      baiduEducationData,
      newmediaEducationData,
      baiduDetailedCrowdData,
      newmediaDetailedCrowdData,
      baiduLocationData,
      newmediaLocationData,
      baiduLocationIntentData
    }
  } catch (error) {
    console.error('[stageSummaryApi] 获取分析数据失败:', error)
    return {
      baiduCrowdData: getEmptyCrowdData(),
      newmediaCrowdData: getEmptyCrowdData(),
      baiduEducationData: getEmptyEducationData(),
      newmediaEducationData: getEmptyEducationData(),
      baiduDetailedCrowdData: getEmptyDetailedCrowdData(),
      newmediaDetailedCrowdData: getEmptyDetailedCrowdData(),
      baiduLocationData: [],
      newmediaLocationData: [],
      baiduLocationIntentData: []
    }
  }
}

/**
 * 解析咨询记录响应
 */
function parseRecordsResponse(data: any): any[] {
  if (Array.isArray(data)) {
    return data
  }
  if (data && Array.isArray(data['数据列表'])) {
    return data['数据列表']
  }
  if (data && Array.isArray(data.items)) {
    return data.items
  }
  if (data && data.data && Array.isArray(data.data['数据列表'])) {
    return data.data['数据列表']
  }
  return []
}

/**
 * 判断是否上门
 */
function isVisit(record: any): boolean {
  return record['是否上门'] === 1 || record['是否上门'] === '是' || 
         record.is_visit === true || record.visit === 1
}

/**
 * 判断是否报名
 */
function isSignup(record: any): boolean {
  return record['是否报名'] === 1 || record['是否报名'] === '是' || 
         record.is_signup === true || record.signup === 1
}

/**
 * 按人群状态分析
 * 空、未标注、以及其他不在已知分类列表中的值都算作"未标注"
 */
function analyzeByStatus(records: any[]): CrowdStatusRow[] {
  const statusList = ['在读', '应届', '待业', '在职/创业', '未标注']
  // 已知的有效状态值（用于判断"未标注"）
  const knownStatuses = ['在读', '应届', '待业', '在职/创业', '在职', '创业']
  const result: CrowdStatusRow[] = []
  
  for (const status of statusList) {
    const filtered = records.filter(r => {
      const recordStatus = r['状态'] || r['人群状态'] || r.status || ''
      if (status === '未标注') {
        // 空、未标注、或者不在已知分类列表中的值都算作"未标注"
        return !recordStatus || recordStatus === '未标注' || recordStatus === '' || !knownStatuses.includes(recordStatus)
      }
      // 处理 "在职/创业" 可能的不同表示
      if (status === '在职/创业') {
        return recordStatus === '在职/创业' || recordStatus === '在职' || recordStatus === '创业'
      }
      return recordStatus === status
    })
    
    const quantity = filtered.length
    const visit = filtered.filter(r => isVisit(r)).length
    const signup = filtered.filter(r => isSignup(r)).length
    
    result.push({
      status,
      quantity,
      visit,
      visitConversionRate: quantity > 0 ? `${((visit / quantity) * 100).toFixed(1)}%` : '0%',
      signup,
      signupConversionRate: quantity > 0 ? `${((signup / quantity) * 100).toFixed(1)}%` : '0%'
    })
  }
  
  return result
}

/**
 * 按学历分析
 * 空、未标注、以及其他不在已知分类列表中的值都算作"未标注"
 * 分类规则：
 * - 三校生：包括"三校生"、"中专"
 * - 大学生：包括"大学生"、"大学"、"本科"、"专科"、"硕士"、"博士"
 */
function analyzeByEducation(records: any[]): EducationRow[] {
  const educationList = ['初中', '三校生', '高中', '大学生', '未标注']
  // 已知的有效学历值（用于判断"未标注"）
  const knownEducations = ['初中', '三校生', '中专', '高中', '高中（普高）', '大学生', '大学', '本科', '专科', '硕士', '博士']
  const result: EducationRow[] = []
  
  for (const education of educationList) {
    const filtered = records.filter(r => {
      const recordEducation = r['学历'] || r.education || ''
      if (education === '未标注') {
        // 空、未标注、或者不在已知分类列表中的值都算作"未标注"
        return !recordEducation || recordEducation === '未标注' || recordEducation === '' || !knownEducations.includes(recordEducation)
      }
      // 三校生：包括"三校生"、"中专"
      if (education === '三校生') {
        return recordEducation === '三校生' || recordEducation === '中专'
      }
      // 高中可能表示为 "高中" 或 "高中（普高）"
      if (education === '高中') {
        return recordEducation === '高中' || recordEducation === '高中（普高）'
      }
      // 大学生：包括"大学生"、"大学"、"本科"、"专科"、"硕士"、"博士"
      if (education === '大学生') {
        return recordEducation === '大学生' || recordEducation === '大学' || 
               recordEducation === '本科' || recordEducation === '专科' ||
               recordEducation === '硕士' || recordEducation === '博士'
      }
      return recordEducation === education
    })
    
    const quantity = filtered.length
    const visit = filtered.filter(r => isVisit(r)).length
    const signup = filtered.filter(r => isSignup(r)).length
    
    result.push({
      education,
      quantity,
      visit,
      signup
    })
  }
  
  return result
}

/**
 * 按学历+状态组合分析
 * 匹配页面显示的详细分类
 * 分类规则：
 * - 三校生：包括"三校生"、"中专"
 * - 大学生：包括"大学生"、"大学"、"本科"、"专科"、"硕士"、"博士"
 */
function analyzeByDetailedStatus(records: any[]): DetailedCrowdStatusRow[] {
  // 与页面显示匹配的详细分类
  const combinations = [
    { display: '初中-应届/在读', educations: ['初中'], statuses: ['应届', '在读'] },
    { display: '初中-待业', educations: ['初中'], statuses: ['待业'] },
    { display: '初中-在职', educations: ['初中'], statuses: ['在职', '在职/创业', '创业'] },
    { display: '高中-应届', educations: ['高中', '高中（普高）'], statuses: ['应届'] },
    { display: '高中-在读', educations: ['高中', '高中（普高）'], statuses: ['在读'] },
    { display: '高中-待业', educations: ['高中', '高中（普高）'], statuses: ['待业'] },
    { display: '高中-在职', educations: ['高中', '高中（普高）'], statuses: ['在职', '在职/创业', '创业'] },
    { display: '三校生-应届', educations: ['三校生', '中专'], statuses: ['应届'] },
    { display: '三校生-在读', educations: ['三校生', '中专'], statuses: ['在读'] },
    { display: '三校生-待业', educations: ['三校生', '中专'], statuses: ['待业'] },
    { display: '三校生-在职', educations: ['三校生', '中专'], statuses: ['在职', '在职/创业', '创业'] },
    { display: '大学-待业', educations: ['大学生', '大学', '本科', '专科', '硕士', '博士'], statuses: ['待业'] },
    { display: '大学-应届', educations: ['大学生', '大学', '本科', '专科', '硕士', '博士'], statuses: ['应届'] },
    { display: '大学-在读', educations: ['大学生', '大学', '本科', '专科', '硕士', '博士'], statuses: ['在读'] },
    { display: '大学-在职', educations: ['大学生', '大学', '本科', '专科', '硕士', '博士'], statuses: ['在职', '在职/创业', '创业'] },
  ]
  
  const totalRecords = records.length
  const result: DetailedCrowdStatusRow[] = []
  let matchedCount = 0
  
  for (const combo of combinations) {
    const filtered = records.filter(r => {
      const recordEducation = r['学历'] || r.education || ''
      const recordStatus = r['状态'] || r['人群状态'] || r.status || ''
      return combo.educations.includes(recordEducation) && combo.statuses.includes(recordStatus)
    })
    
    matchedCount += filtered.length
    
    const quantity = filtered.length
    const visit = filtered.filter(r => isVisit(r)).length
    const signup = filtered.filter(r => isSignup(r)).length
    
    result.push({
      status: combo.display,
      quantity,
      ratio: totalRecords > 0 ? `${((quantity / totalRecords) * 100).toFixed(1)}%` : '0%',
      visit,
      signup
    })
  }
  
  // 未标注：未被前面分类匹配到的记录
  const unmatched = records.filter(r => {
    const recordEducation = r['学历'] || r.education || ''
    const recordStatus = r['状态'] || r['人群状态'] || r.status || ''
    // 检查是否被任何分类匹配
    for (const combo of combinations) {
      if (combo.educations.includes(recordEducation) && combo.statuses.includes(recordStatus)) {
        return false
      }
    }
    return true
  })
  
  const unmatchedQuantity = unmatched.length
  const unmatchedVisit = unmatched.filter(r => isVisit(r)).length
  const unmatchedSignup = unmatched.filter(r => isSignup(r)).length
  
  result.push({
    status: '未标注',
    quantity: unmatchedQuantity,
    ratio: totalRecords > 0 ? `${((unmatchedQuantity / totalRecords) * 100).toFixed(1)}%` : '0%',
    visit: unmatchedVisit,
    signup: unmatchedSignup
  })
  
  return result
}

/**
 * 按地域分析
 * @param records 咨询记录
 * @param locationList 神殿对应的地域列表（如['石家庄', '邢台', '保定', ...]）
 */
function analyzeByLocation(records: any[], locationList: string[]): LocationRow[] {
  // 初始化所有地域的数据（包括'其他'）
  const locationMap = new Map<string, { quantity: number; visit: number; signup: number }>()
  
  // 预先初始化所有地域
  for (const loc of locationList) {
    locationMap.set(loc, { quantity: 0, visit: 0, signup: 0 })
  }
  
  for (const record of records) {
    const position = record['位置'] || record['地域'] || record.location || ''
    
    // 查找匹配的地域（去掉'其他'，最后再处理）
    let matchedLocation = '其他'
    for (const loc of locationList) {
      if (loc !== '其他' && position.includes(loc)) {
        matchedLocation = loc
        break
      }
    }
    
    // 如果没有匹配到任何地域，归类到'其他'
    if (!locationMap.has(matchedLocation)) {
      locationMap.set(matchedLocation, { quantity: 0, visit: 0, signup: 0 })
    }
    
    const data = locationMap.get(matchedLocation)!
    data.quantity++
    
    if (isVisit(record)) {
      data.visit++
    }
    if (isSignup(record)) {
      data.signup++
    }
  }
  
  const totalRecords = records.length
  const result: LocationRow[] = []
  
  // 按照地域列表的顺序返回结果
  for (const location of locationList) {
    const data = locationMap.get(location) || { quantity: 0, visit: 0, signup: 0 }
    result.push({
      location,
      quantity: data.quantity,
      ratio: totalRecords > 0 ? `${((data.quantity / totalRecords) * 100).toFixed(1)}%` : '0%',
      visit: data.visit,
      signup: data.signup
    })
  }
  
  return result
}

/**
 * 按地域意向分析
 * 意向地域的判断规则：
 * 1. 如果位置字段包含当地城市名（如石家庄），意向是当地
 * 2. 如果关键字字段包含当地城市名，意向是当地
 * 3. 否则是非当地
 */
function analyzeByLocationIntent(records: any[], localCity: string): LocationRow[] {
  // 统计本地和非本地的数量
  const localData = { quantity: 0, visit: 0, signup: 0 }
  const nonLocalData = { quantity: 0, visit: 0, signup: 0 }
  
  for (const record of records) {
    const position = record['位置'] || record['地域'] || record.location || ''
    const keyword = record['关键字'] || record.keyword || ''
    
    // 判断是否是本地意向：位置或关键字包含本地城市名
    const isLocal = position.includes(localCity) || keyword.includes(localCity)
    
    const targetData = isLocal ? localData : nonLocalData
    targetData.quantity++
    
    if (isVisit(record)) {
      targetData.visit++
    }
    if (isSignup(record)) {
      targetData.signup++
    }
  }
  
  const totalRecords = records.length
  const result: LocationRow[] = []
  
  // 本地城市
  result.push({
    location: localCity,
    quantity: localData.quantity,
    ratio: totalRecords > 0 ? `${((localData.quantity / totalRecords) * 100).toFixed(1)}%` : '0%',
    visit: localData.visit,
    signup: localData.signup
  })
  
  // 非本地城市
  result.push({
    location: `非${localCity}`,
    quantity: nonLocalData.quantity,
    ratio: totalRecords > 0 ? `${((nonLocalData.quantity / totalRecords) * 100).toFixed(1)}%` : '0%',
    visit: nonLocalData.visit,
    signup: nonLocalData.signup
  })
  
  console.log('[stageSummaryApi] 意向地域分析:', localCity, localData.quantity, '非' + localCity, nonLocalData.quantity)
  
  return result
}

// ===== 空数据模板 =====

function getEmptyCrowdData(): CrowdStatusRow[] {
  return [
    { status: '在读', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { status: '应届', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { status: '待业', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { status: '在职/创业', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
    { status: '未标注', quantity: 0, visit: 0, visitConversionRate: '0%', signup: 0, signupConversionRate: '0%' },
  ]
}

function getEmptyEducationData(): EducationRow[] {
  return [
    { education: '初中', quantity: 0, visit: 0, signup: 0 },
    { education: '三校生', quantity: 0, visit: 0, signup: 0 },
    { education: '高中', quantity: 0, visit: 0, signup: 0 },
    { education: '大学生', quantity: 0, visit: 0, signup: 0 },
    { education: '未标注', quantity: 0, visit: 0, signup: 0 },
  ]
}

function getEmptyDetailedCrowdData(): DetailedCrowdStatusRow[] {
  const combinations = [
    '初中-应届/在读', '初中-待业', '初中-在职',
    '高中-应届', '高中-在读', '高中-待业', '高中-在职',
    '三校生-应届', '三校生-在读', '三校生-待业', '三校生-在职',
    '大学-待业', '大学-应届', '大学-在读', '大学-在职',
    '未标注'
  ]
  return combinations.map(status => ({
    status,
    quantity: 0,
    ratio: '0%',
    visit: 0,
    signup: 0
  }))
}
