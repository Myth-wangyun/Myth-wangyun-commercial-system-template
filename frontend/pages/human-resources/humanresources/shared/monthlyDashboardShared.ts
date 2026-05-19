import type { ColumnsType } from 'antd/es/table'

export type DashboardScope = 'hq' | 'offline' | 'online'
export type CellValue = number | string
export type MonthlySectionKey = 'hr' | 'training' | 'salary' | 'insurance'

export const HQ_DIVISIONS = ['运营部', '神藏司', '人资部', '教化司', '智慧司', '祈福司', '市场部']
export const OFFLINE_CAMPUSES = ['主神殿', '永恒殿', '慈悲殿', '李大殿', '智慧阁', '光明殿', '神恩殿', '天威殿']
export const ONLINE_DIVISIONS = ['操盘手', '主播', '助播', '运营', '助理', '组品', '短视频运营', '投流手', '后勤', '线上祈福司', '讲师', '线上班主任']

const ONLINE_DIVISION_DISPLAY_MAP: Record<string, string> = {
  线上咨询师: '线上祈福司',
  线上主任: '线上班主任',
  组员: '组品',
}

const DEFAULT_DEPARTMENT_DISPLAY_MAP: Record<string, string> = {}

const MONTHLY_SCOPE_CONFIG: Record<DashboardScope, {
  organizations: string[]
  orgColumnTitle: string
  displayMap: Record<string, string>
}> = {
  hq: {
    organizations: HQ_DIVISIONS,
    orgColumnTitle: '部门',
    displayMap: DEFAULT_DEPARTMENT_DISPLAY_MAP,
  },
  offline: {
    organizations: OFFLINE_CAMPUSES,
    orgColumnTitle: '神殿',
    displayMap: DEFAULT_DEPARTMENT_DISPLAY_MAP,
  },
  online: {
    organizations: ONLINE_DIVISIONS,
    orgColumnTitle: '事业部',
    displayMap: ONLINE_DIVISION_DISPLAY_MAP,
  },
}

export interface MonthlyGroupedRowBase {
  key: string
  rowType: 'grandTotal' | 'monthSubtotal' | 'month'
  month: string
  monthGroupFirstRow: boolean
  monthGroupSize: number
  department: string
}

export const createMonthGroupColumn = <T extends MonthlyGroupedRowBase>(): ColumnsType<T>[number] => ({
  title: '月份',
  dataIndex: 'month',
  key: 'month',
  width: 90,
  align: 'center',
  onCell: (record) => {
    if (record.rowType === 'grandTotal') {
      return { rowSpan: 1 }
    }

    return {
      rowSpan: record.monthGroupFirstRow ? record.monthGroupSize : 0,
    }
  },
})

export const createDepartmentColumn = <T extends MonthlyGroupedRowBase>(): ColumnsType<T>[number] => ({
  title: '部门',
  dataIndex: 'department',
  key: 'department',
  width: 100,
  align: 'center',
})

export const composeColumns = <T,>(...groups: ColumnsType<T>[]): ColumnsType<T> => groups.flat() as ColumnsType<T>

export const getScopeOrganizations = (scope: DashboardScope): string[] => {
  return MONTHLY_SCOPE_CONFIG[scope].organizations
}

export const getScopeOrgColumnTitle = (scope: DashboardScope): string => {
  return MONTHLY_SCOPE_CONFIG[scope].orgColumnTitle
}

export const getMonthlySectionOrgColumnTitle = (section: MonthlySectionKey, scope: DashboardScope): string => {
  if (section === 'insurance') {
    if (scope === 'offline') {
      return '神殿'
    }
    if (scope === 'online') {
      return '事业部'
    }
    return '归属'
  }
  return '部门'
}

export const shouldUseMonthSubtotalRows = (scope: DashboardScope): boolean => scope === 'hq'

export const getMonthlyGrandTotalLabel = (section: MonthlySectionKey, scope: DashboardScope): string => {
  if (scope === 'hq') {
    return '总合计'
  }
  if (section === 'salary' || section === 'insurance') {
    return '年度合计'
  }
  return '当前合计'
}

export const toScopeDisplayDepartment = (scope: DashboardScope, department: string): string => {
  return MONTHLY_SCOPE_CONFIG[scope].displayMap[department] || department
}

// --- Org name normalization (fuzzy matching from backend data) ---

export const normalizeHqDepartment = (value?: string | null): string => {
  const text = (value || '').replace(/\s+/g, '')
  if (!text) return ''
  if (text.includes('运营')) return '运营部'
  if (text.includes('财务')) return '神藏司'
  if (text.includes('人资') || text.includes('人力资源') || text.includes('行政')) return '人资部'
  if (text.includes('教质')) return '教化司'
  if (text.includes('学术')) return '智慧司'
  if (text.includes('咨询')) return '祈福司'
  if (text.includes('市场')) return '市场部'
  return value || ''
}

export const normalizeOfflineCampus = (value?: string | null): string => {
  const raw = (value || '').trim()
  if (!raw) return ''
  const mapping: Record<string, string> = {
    盛邦: '主神殿',
    冀美: '永恒殿',
    石美: '慈悲殿',
    晋美: '李大殿',
    原美: '智慧阁',
    太美: '光明殿',
    桂美: '神恩殿',
    邕美: '神恩殿',
    黔美: '天威殿',
  }
  if (raw.endsWith('神殿')) return raw
  const compact = raw.replace(/\s+/g, '')
  for (const [alias, campus] of Object.entries(mapping)) {
    if (compact.includes(alias)) return campus
  }
  return raw
}

export const normalizeOnlineOrg = (value?: string | null): string => {
  const text = (value || '').replace(/\s+/g, '')
  if (!text) return ''
  if (text.includes('短视频')) return '短视频运营'
  if (text.includes('投流')) return '投流手'
  if (text.includes('网咨') || text.includes('咨询')) return '线上咨询师'
  if (text.includes('主播')) return '主播'
  if (text.includes('讲师')) return '讲师'
  if (text.includes('后勤')) return '后勤'
  if (text.includes('助理')) return '助理'
  if (text.includes('财务')) return '财务'
  if (text.includes('招生')) return '招生手'
  if (text.includes('组员')) return '组员'
  if (text.includes('主任')) return '线上主任'
  if (text.includes('运营')) return '运营'
  return value || ''
}

export const normalizeOrgName = (scope: DashboardScope, value?: string | null): string =>
  scope === 'hq' ? normalizeHqDepartment(value) : scope === 'online' ? normalizeOnlineOrg(value) : normalizeOfflineCampus(value)

export const patchDepartmentColumnTitle = <T extends { department: string }>(columns: ColumnsType<T>, title: string): ColumnsType<T> => {
  return columns.map((column) => {
    if ('dataIndex' in column && column.dataIndex === 'department') {
      return { ...column, title }
    }
    return column
  }) as ColumnsType<T>
}

const ROW_TYPE_SORT_ORDER: Record<string, number> = { grandTotal: 0, monthSubtotal: 1, month: 2 }

/**
 * Sort monthly dashboard rows into correct display order.
 * Fixes row ordering issues when backend aggregate store returns rows
 * sorted by org_key (which breaks the interleaved month-group structure).
 */
export const sortMonthlyRows = <T extends MonthlyGroupedRowBase>(rows: T[]): T[] => {
  return [...rows].sort((a, b) => {
    const aType = ROW_TYPE_SORT_ORDER[a.rowType] ?? 99
    const bType = ROW_TYPE_SORT_ORDER[b.rowType] ?? 99
    if (aType !== bType) return aType - bType

    const aMonth = parseInt(a.month) || 0
    const bMonth = parseInt(b.month) || 0
    if (aMonth !== bMonth) return aMonth - bMonth

    const aIsTotal = a.department === '合计' ? 0 : 1
    const bIsTotal = b.department === '合计' ? 0 : 1
    return aIsTotal - bIsTotal
  })
}