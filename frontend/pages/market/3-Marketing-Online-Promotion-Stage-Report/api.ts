/**
 * 网络推广阶段报告API
 * 从咨询量录入系统读取相关数据
 */

import { api } from '@/services/api'
import dayjs from 'dayjs'

// 咨询量明细记录类型
export interface ConsultationRecord {
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
interface PaginatedResponse<T> {
  总记录数: number
  总页数: number
  当前页: number
  每页数量: number
  数据列表: T[]
}

const BASE_URL = '/consult'

/**
 * 二级媒体来源到三级细分媒体的映射
 */
const MEDIA_SOURCE_MAPPING: Record<string, string[]> = {
  '新媒体平台': [
    '抖音', '快手', '微信视频号', '小红书', 'B站', 
    '视频', '百度信息流', '头条信息流',
    '新媒体', '新媒体平台',
  ],
  '常规SEM平台': [
    '百度推广', '中心来电', '在线报名/网站留言', '百度表单', 
    '91搜客', '社交化媒体',
    'SEM', '常规SEM平台', '常规SEM',
  ],
}

/**
 * 获取SEM咨询量明细
 * 筛选条件：量来源="网络" 且 媒体来源属于"常规SEM平台"类别
 * @param campus 神殿名称
 * @param startDate 开始日期 (YYYY-MM-DD)
 * @param endDate 结束日期 (YYYY-MM-DD)
 */
export async function getSEMDetailRecords(
  campus: string,
  startDate: string,
  endDate: string
): Promise<ConsultationRecord[]> {
  console.log('[SEM明细] 获取数据, 神殿:', campus, '日期:', startDate, '-', endDate)
  
  const response = await api.get(`${BASE_URL}/consultation/records`, {
    params: {
      campus,
      source: '网络',
      start_date: startDate,
      end_date: endDate,
      page_size: 1000,
    }
  })
  
  const result: PaginatedResponse<ConsultationRecord> = response.data
  const allRecords = result.数据列表 || []
  
  console.log('[SEM明细] 获取到网络来源数据:', allRecords.length, '条')
  
  // 过滤SEM平台的数据
  const semSources = MEDIA_SOURCE_MAPPING['常规SEM平台']
  const filteredRecords = allRecords.filter(record => 
    record.媒体来源 && semSources.includes(record.媒体来源)
  )
  
  console.log('[SEM明细] 过滤后SEM数据:', filteredRecords.length, '条')
  
  return filteredRecords
}

/**
 * 获取新媒体咨询量明细
 * 筛选条件：量来源="网络" 且 媒体来源属于"新媒体平台"类别
 * @param campus 神殿名称
 * @param startDate 开始日期 (YYYY-MM-DD)
 * @param endDate 结束日期 (YYYY-MM-DD)
 */
export async function getNewMediaDetailRecords(
  campus: string,
  startDate: string,
  endDate: string
): Promise<ConsultationRecord[]> {
  console.log('[新媒体明细] 获取数据, 神殿:', campus, '日期:', startDate, '-', endDate)
  
  const response = await api.get(`${BASE_URL}/consultation/records`, {
    params: {
      campus,
      source: '网络',
      start_date: startDate,
      end_date: endDate,
      page_size: 1000,
    }
  })
  
  const result: PaginatedResponse<ConsultationRecord> = response.data
  const allRecords = result.数据列表 || []
  
  console.log('[新媒体明细] 获取到网络来源数据:', allRecords.length, '条')
  
  // 过滤新媒体平台的数据
  const newMediaSources = MEDIA_SOURCE_MAPPING['新媒体平台']
  const filteredRecords = allRecords.filter(record => 
    record.媒体来源 && newMediaSources.includes(record.媒体来源)
  )
  
  console.log('[新媒体明细] 过滤后新媒体数据:', filteredRecords.length, '条')
  
  return filteredRecords
}

/**
 * 获取上门明细
 * 筛选条件：量来源="网络" 且 是否上门=1
 * @param campus 神殿名称
 * @param startDate 开始日期 (YYYY-MM-DD)
 * @param endDate 结束日期 (YYYY-MM-DD)
 */
export async function getVisitDetailRecords(
  campus: string,
  startDate: string,
  endDate: string
): Promise<ConsultationRecord[]> {
  console.log('[上门明细] 获取数据, 神殿:', campus, '日期:', startDate, '-', endDate)
  
  const response = await api.get(`${BASE_URL}/consultation/records`, {
    params: {
      campus,
      source: '网络',
      start_date: startDate,
      end_date: endDate,
      page_size: 1000,
    }
  })
  
  const result: PaginatedResponse<ConsultationRecord> = response.data
  const allRecords = result.数据列表 || []
  
  console.log('[上门明细] 获取到网络来源数据:', allRecords.length, '条')
  
  // 过滤已上门的数据
  const filteredRecords = allRecords.filter(record => record.是否上门 === 1)
  
  console.log('[上门明细] 过滤后上门数据:', filteredRecords.length, '条')
  
  return filteredRecords
}

/**
 * 获取报名明细
 * 筛选条件：量来源="网络" 且 是否报名=1
 * @param campus 神殿名称
 * @param startDate 开始日期 (YYYY-MM-DD)
 * @param endDate 结束日期 (YYYY-MM-DD)
 */
export async function getSignupDetailRecords(
  campus: string,
  startDate: string,
  endDate: string
): Promise<ConsultationRecord[]> {
  console.log('[报名明细] 获取数据, 神殿:', campus, '日期:', startDate, '-', endDate)
  
  const response = await api.get(`${BASE_URL}/consultation/records`, {
    params: {
      campus,
      source: '网络',
      start_date: startDate,
      end_date: endDate,
      page_size: 1000,
    }
  })
  
  const result: PaginatedResponse<ConsultationRecord> = response.data
  const allRecords = result.数据列表 || []
  
  console.log('[报名明细] 获取到网络来源数据:', allRecords.length, '条')
  
  // 过滤已报名的数据
  const filteredRecords = allRecords.filter(record => record.是否报名 === 1)
  
  console.log('[报名明细] 过滤后报名数据:', filteredRecords.length, '条')
  
  return filteredRecords
}

/**
 * 获取无效量明细
 * 筛选条件：量来源="网络" 且 是否无效量=1
 * @param campus 神殿名称
 * @param startDate 开始日期 (YYYY-MM-DD)
 * @param endDate 结束日期 (YYYY-MM-DD)
 */
export async function getInvalidDetailRecords(
  campus: string,
  startDate: string,
  endDate: string
): Promise<ConsultationRecord[]> {
  console.log('[无效量明细] 获取数据, 神殿:', campus, '日期:', startDate, '-', endDate)
  
  const response = await api.get(`${BASE_URL}/consultation/records`, {
    params: {
      campus,
      source: '网络',
      start_date: startDate,
      end_date: endDate,
      page_size: 1000,
    }
  })
  
  const result: PaginatedResponse<ConsultationRecord> = response.data
  const allRecords = result.数据列表 || []
  
  console.log('[无效量明细] 获取到网络来源数据:', allRecords.length, '条')
  
  // 过滤无效量的数据
  const filteredRecords = allRecords.filter(record => record.是否无效量 === 1)
  
  console.log('[无效量明细] 过滤后无效量数据:', filteredRecords.length, '条')
  
  return filteredRecords
}
