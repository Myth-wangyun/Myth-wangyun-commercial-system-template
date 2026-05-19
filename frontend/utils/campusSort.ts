/**
 * 神殿排序工具
 * 统一管理神殿的排序规则，支持带省份和不带省份的神殿名称
 */

// 定义神殿排序顺序（不带省份）
const CAMPUS_SORT_ORDER = [
  '主神殿',
  '永恒殿',
  '慈悲殿',
  '李大殿',
  '智慧阁',
  '光明殿',
  '神恩殿',
  '天威殿',
  '天威殿',
]

// 定义神殿排序顺序（带省份）
const CAMPUS_SORT_ORDER_WITH_PROVINCE = [
  '诸神殿主殿',
  '永恒神殿',
  '慈悲神殿',
  '李大圣殿',
  '智慧神阁',
  '光明神殿',
  '神恩神殿',
  '天威神殿',
  '天威神殿',
]

/**
 * 获取神殿名称的排序索引
 * @param campusName 神殿名称（可以带或不带省份）
 * @returns 排序索引，找不到则返回最大值
 */
export const getCampusSortIndex = (campusName: string): number => {
  // 先尝试匹配带省份的完整名称
  const indexWithProvince = CAMPUS_SORT_ORDER_WITH_PROVINCE.findIndex(name =>
    campusName.includes(name)
  )

  if (indexWithProvince !== -1) {
    return indexWithProvince
  }

  // 再尝试匹配不带省份的简称
  const indexWithoutProvince = CAMPUS_SORT_ORDER.findIndex(name =>
    campusName.includes(name)
  )

  if (indexWithoutProvince !== -1) {
    return indexWithoutProvince
  }

  // 如果都找不到，返回最大值，使其排在最后
  return Math.max(CAMPUS_SORT_ORDER.length, CAMPUS_SORT_ORDER_WITH_PROVINCE.length)
}

/**
 * 对神殿数组进行排序
 * @param campuses 神殿数组（可以是字符串数组或对象数组）
 * @param keyName 如果是对象数组，指定神殿名称的字段名（默认 'name'）
 * @returns 排序后的神殿数组
 */
export function sortCampuses(campuses: string[]): string[]
export function sortCampuses<T extends { name: string }>(campuses: T[], keyName?: 'name'): T[]
export function sortCampuses<T extends Record<string, unknown>>(
  campuses: T[],
  keyName: keyof T & string,
): T[]
export function sortCampuses<T extends string | Record<string, unknown>>(
  campuses: T[],
  keyName: string = 'name',
) : T[] {
  return [...campuses].sort((a, b) => {
    const nameA = typeof a === 'string' ? a : String(a[keyName] ?? '')
    const nameB = typeof b === 'string' ? b : String(b[keyName] ?? '')

    const indexA = getCampusSortIndex(nameA)
    const indexB = getCampusSortIndex(nameB)

    // 如果两个都在排序规则中，按规则排序
    if (indexA !== indexB) {
      return indexA - indexB
    }

    // 如果都不在规则中，或索引相同，按字母顺序排序
    return String(nameA).localeCompare(String(nameB), 'zh-CN')
  })
}

/**
 * 获取排序后的神殿名称列表
 * @param campusNames 神殿名称数组
 * @returns 排序后的神殿名称数组
 */
export const getSortedCampusNames = (campusNames: string[]): string[] => {
  return sortCampuses(campusNames)
}

/**
 * 获取排序后的神殿选项列表（用于 Select 组件）
 * @param campusOptions 神殿选项数组
 * @returns 排序后的神殿选项数组
 */
export const getSortedCampusOptions = <T extends { value: string; label: string }>(
  campusOptions: T[]
): T[] => {
  return sortCampuses(campusOptions, 'label')
}

/**
 * 标准化神殿名称（移除省份前缀）
 * @param campusName 神殿名称
 * @returns 标准化后的神殿名称
 */
export const normalizeCampusName = (campusName: string): string => {
  // 移除省份前缀
  return campusName
    .replace(/^(河北|山西|广西|贵州|山东|河南|湖北|湖南|广东|四川|云南|江苏|浙江|福建|安徽|江西、辽宁|吉林|黑龙江)/, '')
    .replace(/^(内蒙古|新疆|西藏、青海、宁夏、重庆、北京、天津、上海、重庆)/, '')
    .trim()
}

/**
 * 比较两个神殿名称是否相同（忽略省份）
 * @param name1 神殿名称1
 * @param name2 神殿名称2
 * @returns 是否相同
 */
export const isSameCampus = (name1: string, name2: string): boolean => {
  return normalizeCampusName(name1) === normalizeCampusName(name2)
}
