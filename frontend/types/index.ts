// 数据看板表格数据类型定义
export interface DataRecord {
  id: string
  name: string
  category: string
  value: number
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  updatedAt: string
  description?: string
}

// 表格列配置
export interface TableColumn {
  key: keyof DataRecord
  title: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  render?: (value: any, record: DataRecord) => React.ReactNode
}

// 表格分页配置
export interface PaginationConfig {
  current: number
  pageSize: number
  total: number
  showSizeChanger?: boolean
  showQuickJumper?: boolean
}

// 表格排序配置
export interface SortConfig {
  field: keyof DataRecord
  order: 'asc' | 'desc'
}

// 表格过滤配置
export interface FilterConfig {
  field: keyof DataRecord
  value: string
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith'
}

// 表格操作类型
export type TableAction = 'create' | 'edit' | 'delete' | 'view'

// 表单模式
export type FormMode = 'create' | 'edit' | 'view'

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  total?: number
}

// 统计数据
export interface DashboardStats {
  totalRecords: number
  activeRecords: number
  inactiveRecords: number
  pendingRecords: number
  totalValue: number
  averageValue: number
}

// 教育管理系统相关类型
export interface Campus {
  id: string
  name: string
  website: string
  mobileWebsite: string
  status: 'active' | 'inactive'
  indicator: string
}

export interface MenuItem {
  id: string
  label: string
  icon: string
  section?: string
  children?: MenuItem[]
  href?: string
  target?: string
}

export interface MarketDailyRecord {
  id: string
  date: string
  platform: string
  cost: number
  clicks: number
  conversations: number
  validConversations: number
  pv: number
  leads: number
}

export interface MarketStats {
  totalRecords: number
  totalSpend: number
  totalClicks: number
  totalConversations: number
  totalValidConv: number
  totalPV: number
  totalLeads: number
  clickRate: number
  conversionRate: number
  leadRate: number
  avgClickPrice: number
}

export interface StudentProfile {
  id: string
  studentName: string
  gender: string
  enrollmentDate: string
  enrollmentAge?: number
  campusSource?: string
  consultant?: string
  tuitionAmount?: number
  idCard?: string
  major: string
  duration?: string
  classTeacher?: string
  studentStatus?: string
  education?: string
  phone?: string
  parentPhone?: string
  address?: string
  remarks?: string
}
