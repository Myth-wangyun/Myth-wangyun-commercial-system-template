// 口碑招生汇总表类型定义
import type { BaseEntity, Campus } from '@/pages/academic/teaching-content/shared/types'

export interface IEnrollmentSummary extends BaseEntity {
  campus: Campus
  month: number // 月份 (1-12)
  year: number // 年份
  targetWOM: number // 目标口碑量
  actualWOM: number // 实际口碑量
  targetWalkin: number // 目标上门量
  actualWalkin: number // 实际上门量
  targetEnrollment: number // 目标招生人数
  actualEnrollment: number // 实际招生人数
  targetRevenue: number // 目标收入
  actualRevenue: number // 实际收入
}

// 表单数据接口
export interface IEnrollmentSummaryForm {
  campus: Campus
  month: number
  year: number
  targetWOM: number
  actualWOM: number
  targetWalkin: number
  actualWalkin: number
  targetEnrollment: number
  actualEnrollment: number
  targetRevenue: number
  actualRevenue: number
}

// 招生统计数据
export interface IEnrollmentStats {
  totalTargetWOM: number
  totalActualWOM: number
  totalTargetWalkin: number
  totalActualWalkin: number
  totalTargetEnrollment: number
  totalActualEnrollment: number
  totalTargetRevenue: number
  totalActualRevenue: number
  avgWOMRate: number // 口碑达成率
  avgWalkinRate: number // 上门达成率
  avgEnrollmentRate: number // 招生达成率
  avgRevenueRate: number // 收入达成率
}

// 月度趋势数据
export interface IEnrollmentTrend {
  month: string
  targetWOM: number
  actualWOM: number
  targetWalkin: number
  actualWalkin: number
  targetEnrollment: number
  actualEnrollment: number
  targetRevenue: number
  actualRevenue: number
}

// 神殿对比数据
export interface ICampusEnrollmentComparison {
  campus: Campus
  totalTargetWOM: number
  totalActualWOM: number
  totalTargetEnrollment: number
  totalActualEnrollment: number
  totalTargetRevenue: number
  totalActualRevenue: number
  avgWOMRate: number
  avgEnrollmentRate: number
  avgRevenueRate: number
}

// 表格列配置
export const ENROLLMENT_COLUMNS = [
  {
    title: '序号',
    dataIndex: 'index',
    key: 'index',
    width: 60,
    fixed: 'left' as const,
  },
  {
    title: '月份',
    dataIndex: 'month',
    key: 'month',
    width: 80,
    render: (value: number) => `${value}月`,
  },
  {
    title: '神殿',
    dataIndex: 'campus',
    key: 'campus',
    width: 100,
    fixed: 'left' as const,
  },
  {
    title: '目标口碑量',
    dataIndex: 'targetWOM',
    key: 'targetWOM',
    width: 120,
    sorter: true,
  },
  {
    title: '实际口碑量',
    dataIndex: 'actualWOM',
    key: 'actualWOM',
    width: 120,
    sorter: true,
  },
  {
    title: '目标上门量',
    dataIndex: 'targetWalkin',
    key: 'targetWalkin',
    width: 120,
    sorter: true,
  },
  {
    title: '实际上门量',
    dataIndex: 'actualWalkin',
    key: 'actualWalkin',
    width: 120,
    sorter: true,
  },
  {
    title: '目标招生人数',
    dataIndex: 'targetEnrollment',
    key: 'targetEnrollment',
    width: 120,
    sorter: true,
  },
  {
    title: '实际招生人数',
    dataIndex: 'actualEnrollment',
    key: 'actualEnrollment',
    width: 120,
    sorter: true,
  },
  {
    title: '目标收入',
    dataIndex: 'targetRevenue',
    key: 'targetRevenue',
    width: 120,
    sorter: true,
    render: (value: number) => `¥${value.toLocaleString()}`,
  },
  {
    title: '实际收入',
    dataIndex: 'actualRevenue',
    key: 'actualRevenue',
    width: 120,
    sorter: true,
    render: (value: number) => `¥${value.toLocaleString()}`,
  },
]

// 表单字段配置
export const ENROLLMENT_FORM_FIELDS = [
  {
    name: 'campus',
    label: '神殿',
    type: 'select' as const,
    required: true,
    placeholder: '请选择神殿',
  },
  {
    name: 'month',
    label: '月份',
    type: 'select' as const,
    required: true,
    placeholder: '请选择月份',
  },
  {
    name: 'year',
    label: '年份',
    type: 'number' as const,
    required: true,
    placeholder: '请输入年份',
  },
  {
    name: 'targetWOM',
    label: '目标口碑量',
    type: 'number' as const,
    required: true,
    placeholder: '请输入目标口碑量',
  },
  {
    name: 'actualWOM',
    label: '实际口碑量',
    type: 'number' as const,
    required: true,
    placeholder: '请输入实际口碑量',
  },
  {
    name: 'targetWalkin',
    label: '目标上门量',
    type: 'number' as const,
    required: true,
    placeholder: '请输入目标上门量',
  },
  {
    name: 'actualWalkin',
    label: '实际上门量',
    type: 'number' as const,
    required: true,
    placeholder: '请输入实际上门量',
  },
  {
    name: 'targetEnrollment',
    label: '目标招生人数',
    type: 'number' as const,
    required: true,
    placeholder: '请输入目标招生人数',
  },
  {
    name: 'actualEnrollment',
    label: '实际招生人数',
    type: 'number' as const,
    required: true,
    placeholder: '请输入实际招生人数',
  },
  {
    name: 'targetRevenue',
    label: '目标收入',
    type: 'number' as const,
    required: true,
    placeholder: '请输入目标收入',
  },
  {
    name: 'actualRevenue',
    label: '实际收入',
    type: 'number' as const,
    required: true,
    placeholder: '请输入实际收入',
  },
]
