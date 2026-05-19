/**
 * 枚举值映射工具
 * 用于将后端返回的枚举值转换为用户友好的显示文本
 */

// 状态映射
export const STATUS_MAP: Record<string, string> = {
  '未联系': '未联系',
  '已联系': '已联系',
  '待跟进': '待跟进',
  '已上门': '已上门',
  '已报名': '已报名',
  '已订座': '已订座',
  '无意向': '无意向',
  '联系不上': '联系不上',
  '已退费': '已退费',
}

// 来源映射
export const SOURCE_MAP: Record<string, string> = {
  '网络': '网络',
  '口碑': '口碑',
  '渠道': '渠道',
  '校园': '校园',
  '其他': '其他',
}

// 学历映射
export const EDUCATION_MAP: Record<string, string> = {
  '初中': '初中',
  '高中': '高中',
  '中专': '中专',
  '大专': '大专',
  '本科': '本科',
  '本科以上': '本科以上',
  '其他': '其他',
}

// 报名意向映射
export const INTENTION_MAP: Record<string, string> = {
  'A': 'A-强意向',
  'B': 'B-中意向',
  'C': 'C-弱意向',
  'D': 'D-无意向',
  '强意向': '强意向',
  '中意向': '中意向',
  '弱意向': '弱意向',
  '无意向': '无意向',
  '已报名': '已报名',
  '联系不上': '联系不上',
}

// 性别映射
export const GENDER_MAP: Record<string, string> = {
  '男': '男',
  '女': '女',
  '未知': '未知',
}

// 咨询类别映射
export const CATEGORY_MAP: Record<string, string> = {
  '长期': '长期',
  '短期': '短期',
  '升学': '升学',
  '其他': '其他',
}

// 通用映射函数
export function mapEnum(value: string | null | undefined, mapping: Record<string, string>): string {
  if (!value) return '-'
  return mapping[value] || value
}

// 状态映射函数
export function mapStatus(status: string | null | undefined): string {
  return mapEnum(status, STATUS_MAP)
}

// 来源映射函数
export function mapSource(source: string | null | undefined): string {
  return mapEnum(source, SOURCE_MAP)
}

// 学历映射函数
export function mapEducation(education: string | null | undefined): string {
  return mapEnum(education, EDUCATION_MAP)
}

// 报名意向映射函数
export function mapIntention(intention: string | null | undefined): string {
  return mapEnum(intention, INTENTION_MAP)
}

// 性别映射函数
export function mapGender(gender: string | null | undefined): string {
  return mapEnum(gender, GENDER_MAP)
}

// 咨询类别映射函数
export function mapCategory(category: string | null | undefined): string {
  return mapEnum(category, CATEGORY_MAP)
}

// 布尔值映射
export function mapBoolean(value: number | null | undefined): string {
  if (value === 1) return '是'
  if (value === 0) return '否'
  return '-'
}

// 日期格式化
export function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  try {
    return new Date(date).toLocaleDateString('zh-CN')
  } catch {
    return date
  }
}

// 金额格式化
export function formatMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-'
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// 百分比格式化
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-'
  return `${(value * 100).toFixed(1)}%`
}
