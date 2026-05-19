import type { DataRecord, SortConfig, FilterConfig } from '../types'

// 格式化日期
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// 格式化货币
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
  }).format(value)
}

// 获取状态标签颜色
export const getStatusColor = (status: DataRecord['status']): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-gray-100 text-gray-800'
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// 获取状态文本
export const getStatusText = (status: DataRecord['status']): string => {
  switch (status) {
    case 'active':
      return '活跃'
    case 'inactive':
      return '非活跃'
    case 'pending':
      return '待处理'
    default:
      return '未知'
  }
}

// 数据排序
export const sortData = (data: DataRecord[], sortConfig: SortConfig): DataRecord[] => {
  return [...data].sort((a, b) => {
    const aValue = a[sortConfig.field]
    const bValue = b[sortConfig.field]

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.order === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.order === 'asc' ? aValue - bValue : bValue - aValue
    }

    return 0
  })
}

// 数据过滤
export const filterData = (data: DataRecord[], filters: FilterConfig[]): DataRecord[] => {
  if (filters.length === 0) return data

  return data.filter((record) => {
    return filters.every((filter) => {
      const value = record[filter.field]
      const filterValue = filter.value.toLowerCase()

      if (typeof value === 'string') {
        const stringValue = value.toLowerCase()
        switch (filter.operator) {
          case 'contains':
            return stringValue.includes(filterValue)
          case 'equals':
            return stringValue === filterValue
          case 'startsWith':
            return stringValue.startsWith(filterValue)
          case 'endsWith':
            return stringValue.endsWith(filterValue)
          default:
            return true
        }
      }

      if (typeof value === 'number') {
        const numValue = parseFloat(filterValue)
        if (isNaN(numValue)) return true
        return value === numValue
      }

      return true
    })
  })
}

// 分页数据
export const paginateData = (data: DataRecord[], page: number, pageSize: number): DataRecord[] => {
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  return data.slice(startIndex, endIndex)
}

// 生成唯一ID
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// 验证表单数据
export const validateFormData = (data: Partial<DataRecord>): string[] => {
  const errors: string[] = []

  if (!data.name || data.name.trim() === '') {
    errors.push('名称不能为空')
  }

  if (!data.category || data.category.trim() === '') {
    errors.push('类别不能为空')
  }

  if (data.value === undefined || data.value === null || data.value < 0) {
    errors.push('数值必须大于等于0')
  }

  if (!data.status) {
    errors.push('状态不能为空')
  }

  return errors
}

// 防抖函数
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
