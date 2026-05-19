// 新生维稳汇总表类型定义
import type { BaseEntity, Campus } from '@/pages/academic/teaching-content/shared/types'

export interface IStudentStability extends BaseEntity {
  campus: Campus
  handoverCount: number // 交接人数
  enrollmentCount: number // 入学人数
  refundCount: number // 退费人数
  refundRate: number // 退费率 (计算得出)
}

// 表单数据接口
export interface IStudentStabilityForm {
  campus: Campus
  handoverCount: number
  enrollmentCount: number
  refundCount: number
}

// 新生维稳统计数据
export interface IStudentStabilityStats {
  totalHandoverCount: number // 总交接人数
  totalEnrollmentCount: number // 总入学人数
  totalRefundCount: number // 总退费人数
  avgRefundRate: number // 平均退费率
  stabilityRate: number // 维稳率 (1 - 退费率)
}

// 神殿对比数据
export interface ICampusStabilityComparison {
  campus: Campus
  totalHandoverCount: number
  totalEnrollmentCount: number
  totalRefundCount: number
  avgRefundRate: number
  stabilityRate: number
}

// 月度趋势数据
export interface IStabilityTrend {
  month: string
  totalHandoverCount: number
  totalEnrollmentCount: number
  totalRefundCount: number
  avgRefundRate: number
}

// 表格列配置
export const STABILITY_COLUMNS = [
  {
    title: '序号',
    dataIndex: 'index',
    key: 'index',
    width: 60,
    fixed: 'left' as const,
  },
  {
    title: '神殿',
    dataIndex: 'campus',
    key: 'campus',
    width: 100,
    fixed: 'left' as const,
  },
  {
    title: '交接人数',
    dataIndex: 'handoverCount',
    key: 'handoverCount',
    width: 120,
    sorter: true,
  },
  {
    title: '入学人数',
    dataIndex: 'enrollmentCount',
    key: 'enrollmentCount',
    width: 120,
    sorter: true,
  },
  {
    title: '退费人数',
    dataIndex: 'refundCount',
    key: 'refundCount',
    width: 120,
    sorter: true,
  },
  {
    title: '退费率',
    dataIndex: 'refundRate',
    key: 'refundRate',
    width: 120,
    sorter: true,
    render: (value: number) => `${value.toFixed(2)}%`,
  },
]

// 表单字段配置
export const STABILITY_FORM_FIELDS = [
  {
    name: 'campus',
    label: '神殿',
    type: 'select' as const,
    required: true,
    placeholder: '请选择神殿',
  },
  {
    name: 'handoverCount',
    label: '交接人数',
    type: 'number' as const,
    required: true,
    placeholder: '请输入交接人数',
  },
  {
    name: 'enrollmentCount',
    label: '入学人数',
    type: 'number' as const,
    required: true,
    placeholder: '请输入入学人数',
  },
  {
    name: 'refundCount',
    label: '退费人数',
    type: 'number' as const,
    required: true,
    placeholder: '请输入退费人数',
  },
]
