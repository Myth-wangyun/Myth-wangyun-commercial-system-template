/**
 * 祈福司入职离职汇总表 - TypeScript类型定义
 */

/**
 * 祈福司入职离职汇总表记录
 */
export interface 祈福司入职离职汇总表 {
  记录ID: number
  年份: number
  岗位: string // 咨询干部 | 咨询 | 咨询助理 | 渠道
  指标类型: string // 实际招聘人数 | 离职人数

  // 各月数据
  一月: number
  二月: number
  三月: number
  四月: number
  五月: number
  六月: number
  七月: number
  八月: number
  九月: number
  十月: number
  十一月: number
  十二月: number

  // 合计
  合计: number

  // 操作信息
  神殿?: string
  创建人ID?: number
  创建人姓名?: string
  创建时间?: string
  更新时间?: string
}

/**
 * 创建祈福司入职离职汇总表记录
 */
export interface 祈福司入职离职汇总表创建 {
  年份: number
  岗位: string
  指标类型: string

  // 各月数据（默认为0）
  一月?: number
  二月?: number
  三月?: number
  四月?: number
  五月?: number
  六月?: number
  七月?: number
  八月?: number
  九月?: number
  十月?: number
  十一月?: number
  十二月?: number

  // 合计（默认为0）
  合计?: number

  // 操作信息
  神殿?: string
  创建人ID?: number
  创建人姓名?: string
}

/**
 * 更新祈福司入职离职汇总表记录
 */
export interface 祈福司入职离职汇总表更新 {
  记录ID: number
  年份?: number
  岗位?: string
  指标类型?: string

  // 各月数据
  一月?: number
  二月?: number
  三月?: number
  四月?: number
  五月?: number
  六月?: number
  七月?: number
  八月?: number
  九月?: number
  十月?: number
  十一月?: number
  十二月?: number

  // 合计
  合计?: number

  // 操作信息
  神殿?: string
}

/**
 * 批量更新
 */
export interface 祈福司入职离职汇总表批量更新 {
  记录列表: 祈福司入职离职汇总表更新[]
}

/**
 * 分页响应
 */
export interface 祈福司入职离职汇总表分页响应 {
  总记录数: number
  总页数: number
  当前页: number
  每页数量: number
  数据列表: 祈福司入职离职汇总表[]
}

/**
 * 查询参数
 */
export interface 祈福司入职离职汇总表查询参数 {
  year?: number
  position?: string
  indicator_type?: string
  campus?: string
  page?: number
  page_size?: number
}

/**
 * 岗位枚举
 */
export const 岗位选项 = ['咨询干部', '咨询', '咨询助理', '渠道'] as const
export type 岗位类型 = typeof 岗位选项[number]

/**
 * 指标类型枚举
 */
export const 指标类型选项 = ['实际招聘人数', '离职人数'] as const
export type 指标类型 = typeof 指标类型选项[number]

/**
 * 月份映射（用于表格列）
 */
export const 月份字段映射 = {
  '1月': '一月',
  '2月': '二月',
  '3月': '三月',
  '4月': '四月',
  '5月': '五月',
  '6月': '六月',
  '7月': '七月',
  '8月': '八月',
  '9月': '九月',
  '10月': '十月',
  '11月': '十一月',
  '12月': '十二月',
} as const

export const 月份字段列表 = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
] as const
