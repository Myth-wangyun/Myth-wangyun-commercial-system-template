/**
 * 各神殿新媒体和SEM咨询数据API
 * 从咨询量录入系统读取相关数据
 */

import { api } from '@/services/api'

// 咨询量明细记录类型（简化版，用于展示）
export interface ConsultationRecordForDisplay {
  记录ID: number
  登记日期: string | null
  登记时间: string | null
  咨询师: string | null
  咨询者姓名: string | null
  年龄: string | null
  性别: string | null
  电话: string
  QQ: string | null
  微信: string | null
  学历: string | null
  状态: string | null
  位置: string | null
  量来源: string | null
  媒体来源: string | null
  关键字: string | null
  咨询结果: string | null
  备注: string | null
  神殿: string | null
  网聊专员: string | null
  报名意向: string | null
  是否上门: number
  是否报名: number
  是否订座: number
  是否无效量: number
  无效原因: string | null
  是否不算量: number
}

// 分页响应
export interface PaginatedResponse<T> {
  总记录数: number
  总页数: number
  当前页: number
  每页数量: number
  数据列表: T[]
}

// 查询参数
export interface ConsultationQueryParams {
  campus?: string
  source?: string  // 量来源（一级）: 例如"网络"
  media_source?: string  // 媒体来源（三级细分媒体，如"抖音"、"快手"）
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
}

/**
 * 二级媒体来源到三级细分媒体的映射
 * 数据库中的"媒体来源"字段存储的是三级细分媒体
 * 注意：需要包含所有可能的媒体来源值
 * 
 * 实际数据库中的值包括：抖音、快手、视频、小红书、B站、91搜客 等
 * 需要根据实际数据动态调整此映射
 */
export const MEDIA_SOURCE_MAPPING: Record<string, string[]> = {
  // 新媒体平台：抖音、快手、小红书、B站、视频号等
  '新媒体平台': [
    '抖音', '快手', '微信视频号', '小红书', 'B站', 
    '视频', '百度信息流', '头条信息流',
    '新媒体', '新媒体平台',  // 可能直接存储二级名称
  ],
  // 常规SEM平台：百度推广、在线报名等
  '常规SEM平台': [
    '百度推广', '中心来电', '在线报名/网站留言', '百度表单', 
    '91搜客', '社交化媒体',
    'SEM', '常规SEM平台', '常规SEM',  // 可能直接存储二级名称
  ],
  // 网络合作伙伴
  '网络合作伙伴': ['百教网', '91搜客', '知了好学', '坦途网', '厚学网'],
  // 免费推广
  '免费推广': ['社交化媒体', '问答', '分类信息', '地图', '视频'],
}

/**
 * 所有网络来源下的媒体来源（用于聊出量统计，不过滤）
 */
export const ALL_NETWORK_MEDIA_SOURCES: string[] = []

const BASE_URL = '/consult'

/**
 * 获取咨询量明细列表（按神殿、量来源和媒体来源筛选）
 * 用于各神殿新媒体和SEM数据展示
 * 
 * 注意：由于数据库中"媒体来源"字段存储的是三级细分媒体（如"抖音"、"快手"），
 * 而不是二级来源（如"新媒体平台"），所以需要：
 * 1. 先获取所有"网络"来源的数据
 * 2. 在返回结果中按三级细分媒体进行过滤
 * 
 * @param params.campus - 神殿名称
 * @param params.source - 量来源（一级），例如"网络"
 * @param params.media_source - 媒体来源（二级），例如"新媒体平台"、"常规SEM平台"
 * @param params.start_date - 开始日期
 * @param params.end_date - 结束日期
 * @param params.page - 页码
 * @param params.page_size - 每页数量
 */
export async function getConsultationRecordsByCampusAndSource(
  params: ConsultationQueryParams
): Promise<PaginatedResponse<ConsultationRecordForDisplay>> {
  const { media_source, ...otherParams } = params
  
  console.log('[API] 原始请求参数:', params)
  console.log('[API] 请求的媒体来源类型:', media_source)
  
  // 获取二级媒体来源对应的三级细分媒体列表
  const mediaDetails = media_source ? MEDIA_SOURCE_MAPPING[media_source] : null
  
  // 不传media_source给后端，获取所有网络来源数据后在前端过滤
  const queryParams = {
    ...otherParams,
    page_size: 1000  // 获取足够多的数据用于前端过滤
  }
  
  console.log('[API] 实际查询参数:', queryParams)
  
  const response = await api.get(`${BASE_URL}/consultation/records`, { 
    params: queryParams
  })
  const result: PaginatedResponse<ConsultationRecordForDisplay> = response.data
  
  console.log('[API] 后端返回数据:', {
    总记录数: result.总记录数,
    当前页数据条数: result.数据列表?.length || 0,
    媒体来源样例: result.数据列表?.slice(0, 10).map(r => r.媒体来源)
  })
  
  // 如果需要按媒体来源过滤
  if (mediaDetails && mediaDetails.length > 0 && result.数据列表) {
    console.log('[API] 需要过滤的媒体来源列表:', mediaDetails)
    
    const filteredData = result.数据列表.filter(record => {
      if (!record.媒体来源) return false
      return mediaDetails.includes(record.媒体来源)
    })
    
    console.log('[API] 过滤后数据条数:', filteredData.length)
    
    // 重新分页
    const page = params.page || 1
    const pageSize = params.page_size || 50
    const startIndex = (page - 1) * pageSize
    const pagedData = filteredData.slice(startIndex, startIndex + pageSize)
    
    return {
      总记录数: filteredData.length,
      总页数: Math.ceil(filteredData.length / pageSize),
      当前页: page,
      每页数量: pageSize,
      数据列表: pagedData
    }
  }
  
  // 如果没有指定媒体来源过滤，直接返回后端数据
  return result
}

/**
 * 获取量来源选项列表
 */
export async function getSourceOptions(): Promise<{ data: string[] }> {
  const response = await api.get(`${BASE_URL}/consultation/options/source`)
  return response.data
}

/**
 * 获取媒体来源选项列表（按量来源分组）
 */
export async function getMediaSourceOptions(): Promise<{ data: Record<string, string[]> }> {
  const response = await api.get(`${BASE_URL}/consultation/options/media-source`)
  return response.data
}

/**
 * 获取媒体来源层级结构
 */
export interface MediaHierarchyItem {
  name: string
  children: Array<{
    name: string
    children: string[]
  }>
}

export async function getMediaSourceHierarchy(): Promise<{ data: MediaHierarchyItem[] }> {
  const response = await api.get(`${BASE_URL}/consultation/options/media-source-hierarchy`)
  return response.data
}

/**
 * 聊出量统计结果
 */
export interface ChatOutputStats {
  date: string  // 日期 YYYY-MM-DD
  consultant: string  // 咨询师/网聊专员名称
  totalCount: number  // 总咨询量（聊出量）
  validCount: number  // 统计数量（现在等于totalCount，不做过滤）
  invalidCount: number  // 保留字段但不使用
}

/**
 * 按日期和咨询师统计聊出量
 * 根据用户要求："不管是否无效量和是否不算量"
 * 聊出量 = 所有网络来源的咨询记录数
 * 
 * 匹配规则：
 * - 使用"登记日期"字段匹配表格中的日期
 * - 使用"网聊专员"字段匹配表格中的"网聊姓名"
 * 
 * @param year - 年份
 * @param month - 月份
 * @param mediaSourceType - 媒体来源类型：暂不过滤，获取所有网络来源数据
 * @returns 按日期和咨询师分组的统计结果
 */
export async function getChatOutputStatsByDateAndConsultant(
  year: string,
  month: string,
  mediaSourceType: '新媒体平台' | '常规SEM平台' | 'all' = 'all'
): Promise<ChatOutputStats[]> {
  // 计算日期范围
  const startDate = `${year}-${month.padStart(2, '0')}-01`
  const endDateObj = new Date(parseInt(year), parseInt(month), 0) // 月末
  const endDate = `${year}-${month.padStart(2, '0')}-${endDateObj.getDate().toString().padStart(2, '0')}`
  
  console.log('[聊出量统计] 日期范围:', startDate, '-', endDate)
  
  // 直接从API获取所有网络来源的数据
  const response = await api.get(`${BASE_URL}/consultation/records`, { 
    params: {
      source: '网络',
      start_date: startDate,
      end_date: endDate,
      page_size: 1000,
    }
  })
  
  let allRecords: ConsultationRecordForDisplay[] = response.data.数据列表 || []
  console.log('[聊出量统计] 获取到网络来源数据条数:', allRecords.length)
  console.log('[聊出量统计] 数据样例:', allRecords.slice(0, 3).map(r => ({
    登记日期: r.登记日期,
    网聊专员: r.网聊专员,
    媒体来源: r.媒体来源
  })))
  
  // 不再按媒体来源过滤，获取所有网络来源数据
  // 根据用户要求："不管是否无效量和是否不算量"
  
  // 按日期和网聊专员分组统计
  const statsMap = new Map<string, ChatOutputStats>()
  
  allRecords.forEach((record: ConsultationRecordForDisplay) => {
    // 获取登记日期（只保留日期部分 YYYY-MM-DD）
    let recordDate = ''
    if (record.登记日期) {
      // 处理可能的日期格式: "2026-01-30T13:06:00" 或 "2026-01-30"
      recordDate = record.登记日期.split('T')[0]
    }
    if (!recordDate) return
    
    // 获取网聊专员名称（优先使用网聊专员，没有则使用咨询师）
    const consultant = record.网聊专员 || record.咨询师 || ''
    if (!consultant) return
    
    const key = `${recordDate}_${consultant}`
    
    if (!statsMap.has(key)) {
      statsMap.set(key, {
        date: recordDate,
        consultant: consultant,
        totalCount: 0,
        validCount: 0,
        invalidCount: 0,
      })
    }
    
    const stats = statsMap.get(key)!
    stats.totalCount++
    
    // 根据用户要求：不管是否无效量和不算量
    // validCount 现在等于 totalCount（统计所有记录）
    stats.validCount++
  })
  
  const result = Array.from(statsMap.values())
  console.log('[聊出量统计] 统计结果条数:', result.length)
  console.log('[聊出量统计] 统计结果样例:', result.slice(0, 5))
  
  return result
}

/**
 * 获取指定月份每天每个咨询师的聊出量
 * 用于填充A组/B组聊出率表格
 * 
 * @param year - 年份
 * @param month - 月份
 * @returns 日期->网聊专员->聊出量 的映射
 */
export async function getDailyChatOutputByConsultant(
  year: string,
  month: string
): Promise<Map<string, Map<string, number>>> {
  console.log('[getDailyChatOutputByConsultant] 开始获取聊出量, 年月:', year, month)
  
  const stats = await getChatOutputStatsByDateAndConsultant(year, month, 'all')
  
  // 转换为 日期 -> 网聊专员 -> 聊出量 的映射
  const result = new Map<string, Map<string, number>>()
  
  stats.forEach(stat => {
    if (!result.has(stat.date)) {
      result.set(stat.date, new Map())
    }
    result.get(stat.date)!.set(stat.consultant, stat.validCount)
  })
  
  console.log('[getDailyChatOutputByConsultant] 日期数量:', result.size)
  // 打印映射内容
  result.forEach((consultantMap, date) => {
    consultantMap.forEach((count, consultant) => {
      console.log(`[getDailyChatOutputByConsultant] ${date} - ${consultant}: ${count}`)
    })
  })
  
  return result
}
