// Mock数据服务
// 用于模拟后端API，提供测试数据

import { type ApiResponse } from '../api'

// 生成随机ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// 生成随机日期
export const generateRandomDate = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString().split('T')[0]
}

// 生成随机数字
export const generateRandomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 生成随机金额
export const generateRandomAmount = (min: number, max: number): number => {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

// 模拟API延迟
export const mockDelay = (ms: number = 500): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 模拟成功响应
export const mockSuccessResponse = <T>(data: T, message?: string): ApiResponse<T> => {
  return {
    success: true,
    data,
    message: message || '操作成功',
    code: 200,
  }
}

// 模拟错误响应
export const mockErrorResponse = (message: string, code: number = 400): ApiResponse<null> => {
  return {
    success: false,
    data: null,
    message,
    code,
  }
}

// 模拟分页数据
export const mockPaginatedResponse = <T>(
  data: T[],
  page: number = 1,
  pageSize: number = 10,
  total?: number,
): ApiResponse<{
  list: T[]
  pagination: {
    current: number
    pageSize: number
    total: number
    totalPages: number
  }
}> => {
  const totalCount = total || data.length
  const totalPages = Math.ceil(totalCount / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const list = data.slice(startIndex, endIndex)

  return {
    success: true,
    data: {
      list,
      pagination: {
        current: page,
        pageSize,
        total: totalCount,
        totalPages,
      },
    },
    message: '查询成功',
    code: 200,
  }
}

// 从localStorage获取数据
export const getStorageData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch (error) {
    console.error('获取localStorage数据失败:', error)
    return defaultValue
  }
}

// 保存数据到localStorage
export const setStorageData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('保存localStorage数据失败:', error)
  }
}

// 删除localStorage数据
export const removeStorageData = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('删除localStorage数据失败:', error)
  }
}

// 神殿感知的存储key生成
export const getCampusStorageKey = (baseKey: string, campus?: string): string => {
  const currentCampus = campus || 'default'
  return `${baseKey}_${currentCampus}`
}

export default {
  generateId,
  generateRandomDate,
  generateRandomNumber,
  generateRandomAmount,
  mockDelay,
  mockSuccessResponse,
  mockErrorResponse,
  mockPaginatedResponse,
  getStorageData,
  setStorageData,
  removeStorageData,
  getCampusStorageKey,
}
