/**
 * 图表工具函数
 */

// 图表颜色配置
export const CHART_COLORS = [
  '#1890ff', // 蓝色
  '#52c41a', // 绿色
  '#faad14', // 橙色
  '#f5222d', // 红色
  '#722ed1', // 紫色
  '#13c2c2', // 青色
  '#eb2f96', // 粉色
  '#fa8c16', // 深橙色
]

/**
 * 解析百分比字符串为数字
 * @param str 百分比字符串，如 "85.5%"
 * @returns 数字值，如 85.5
 */
export const parsePercent = (str: string): number => {
  if (!str || str === '-' || str === '') return 0
  return parseFloat(str.replace('%', '')) || 0
}

/**
 * 格式化货币
 * @param value 数值
 * @returns 格式化后的货币字符串
 */
export const formatCurrency = (value: number): string => {
  return `¥${value.toLocaleString()}`
}

/**
 * 格式化百分比
 * @param value 数值
 * @returns 格式化后的百分比字符串
 */
export const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`
}

/**
 * 计算完成率
 * @param actual 实际值
 * @param plan 计划值
 * @returns 完成率百分比
 */
export const calcCompletionRate = (actual: number, plan: number): number => {
  if (!plan || plan === 0) return 0
  return (actual / plan) * 100
}
