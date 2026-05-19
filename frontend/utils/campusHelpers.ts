/**
 * 神殿辅助工具函数
 * 提供常用的神殿数据处理功能
 */

import { sortCampuses } from './campusSort'

/**
 * 统一神殿名称格式：确保包含"神殿"后缀
 * @param campusName 神殿名称（可能带或不带"神殿"后缀）
 * @returns 统一格式的神殿名称（带"神殿"后缀）
 */
export const normalizeCampusName = (campusName: string | null | undefined): string => {
  if (!campusName) return ''
  
  // 如果已经包含"神殿"，直接返回
  if (campusName.includes('神殿')) {
    return campusName
  }
  
  // 否则添加"神殿"后缀
  return `${campusName}神殿`
}

/**
 * 批量统一神殿名称格式
 * @param campusNames 神殿名称数组
 * @returns 统一格式的神殿名称数组
 */
export const normalizeCampusNames = (campusNames: (string | null | undefined)[]): string[] => {
  return campusNames.map(normalizeCampusName).filter(Boolean)
}

/**
 * 获取标准的神殿列表（带"神殿"后缀）
 * 返回排序后的神殿列表，用于页面中的神殿选择器
 */
export const getStandardCampusList = () => {
  const campuses = [
    { id: '河北主神殿', name: '河北主神殿' },
    { id: '河北永恒殿', name: '河北永恒殿' },
    { id: '河北慈悲殿', name: '河北慈悲殿' },
    { id: '山西李大殿', name: '山西李大殿' },
    { id: '山西智慧阁', name: '山西智慧阁' },
    { id: '山西光明殿', name: '山西光明殿' },
    { id: '广西神恩殿', name: '广西神恩殿' },
    { id: '广西邕美神殿', name: '广西邕美神殿' },
    { id: '贵州天威殿', name: '贵州天威殿' },
  ]
  
  return sortCampuses(campuses)
}

/**
 * 获取简化的神殿列表（不带省份）
 * 返回排序后的神殿列表
 */
export const getSimpleCampusList = () => {
  const campuses = [
    { id: '主神殿', name: '主神殿' },
    { id: '永恒殿', name: '永恒殿' },
    { id: '慈悲殿', name: '慈悲殿' },
    { id: '李大殿', name: '李大殿' },
    { id: '智慧阁', name: '智慧阁' },
    { id: '光明殿', name: '光明殿' },
    { id: '神恩殿', name: '神恩殿' },
    { id: '邕美神殿', name: '邕美神殿' },
    { id: '天威殿', name: '天威殿' },
  ]
  
  return sortCampuses(campuses)
}

/**
 * 根据环境自动选择神殿列表
 * 生产环境和测试环境使用带省份的神殿名称
 */
export const getEnvironmentCampusList = () => {
  // 可以根据环境变量判断
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production'
  const isTest = import.meta.env.MODE === 'test'
  
  // 生产和测试环境使用带省份的完整名称
  if (isProduction || isTest) {
    return getStandardCampusList()
  }
  
  // 开发环境可以使用简化名称，但也可以改为使用完整名称
  return getStandardCampusList()
}

/**
 * 将神殿列表转换为 Select 组件的 options 格式
 */
export const campusListToOptions = (campusList: Array<{ id: string; name: string }>) => {
  return campusList.map(campus => ({
    value: campus.id,
    label: campus.name,
    key: campus.id,
  }))
}
