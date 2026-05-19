/**
 * 电话号码归属地查询服务
 * 支持真实API查询和测试模式两种方式
 */

import api from '../api'

// 电话归属地响应接口
export interface PhoneLocationResponse {
  phone: string
  province?: string
  city?: string
  location?: string  // 省+市或直接城市
  carrier?: string   // 运营商
  success: boolean
  message: string
}

/**
 * 查询电话号码归属地
 * @param phone 电话号码
 * @param testMode 测试模式（使用本地数据库，不消耗真实API额度）
 * @returns 归属地信息
 */
export async function getPhoneLocation(
  phone: string, 
  testMode: boolean = false
): Promise<PhoneLocationResponse> {
  const response = await api.get<PhoneLocationResponse>('/consult/phone-location', {
    params: { phone, test_mode: testMode }
  })
  return response.data
}

/**
 * 批量查询电话号码归属地
 * @param phones 电话号码数组
 * @param testMode 测试模式（使用本地数据库，不消耗真实API额度）
 * @returns 归属地信息列表
 */
export async function getPhoneLocationsBatch(
  phones: string[],
  testMode: boolean = false
): Promise<{
  items: PhoneLocationResponse[]
  total: number
}> {
  const response = await api.get('/consult/phone-location/batch', {
    params: { phones: phones.join(','), test_mode: testMode }
  })
  return response.data
}
