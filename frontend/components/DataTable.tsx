import React, { useState } from 'react'
import type { DataRecord, TableColumn, PaginationConfig, SortConfig, FilterConfig } from '../types'
import { formatDate, formatCurrency, getStatusColor, getStatusText } from '../utils'
import { ChevronUp, ChevronDown, Search, Edit, Trash2, Eye } from 'lucide-react'

interface DataTableProps {
  data: DataRecord[]
  columns: TableColumn[]
  pagination: PaginationConfig
  onPaginationChange: (pagination: PaginationConfig) => void
  onSort: (sortConfig: SortConfig) => void
  onSearch: (term: string) => void
  onEdit: (record: DataRecord) => void
  onDelete: (id: string) => void
  onView: (record: DataRecord) => void
  loading?: boolean
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  pagination,
  onPaginationChange,
  onSort,
  onSearch,
  onEdit,
  onDelete,
  onView,
  loading = false,
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [filters, setFilters] = useState<FilterConfig[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // 处理排序
  const handleSort = (field: keyof DataRecord) => {
    const newSortConfig: SortConfig = {
      field,
      order: sortConfig?.field === field && sortConfig.order === 'asc' ? 'desc' : 'asc',
    }
    setSortConfig(newSortConfig)
    onSort(newSortConfig)
  }

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch(value)
  }

  // 处理过滤
  const handleFilter = (field: keyof DataRecord, value: string) => {
    const newFilters = filters.filter((f) => f.field !== field)
    if (value.trim() !== '') {
      newFilters.push({
        field,
        value: value.trim(),
        operator: 'contains',
      })
    }
    setFilters(newFilters)
  }

  // 处理分页
  const handlePageChange = (page: number) => {
    onPaginationChange({ ...pagination, current: page })
  }

  const handlePageSizeChange = (pageSize: number) => {
    onPaginationChange({ ...pagination, current: 1, pageSize })
  }

  // 渲染排序图标
  const renderSortIcon = (field: keyof DataRecord) => {
    if (sortConfig?.field === field) {
      return sortConfig.order === 'asc' ? (
        <ChevronUp className="w-4 h-4" />
      ) : (
        <ChevronDown className="w-4 h-4" />
      )
    }
    return null
  }

  // 渲染单元格内容
  const renderCellContent = (column: TableColumn, record: DataRecord) => {
    const value = record[column.key]

    if (column.render) {
      return column.render(value, record)
    }

    switch (column.key) {
      case 'value':
        return formatCurrency(value as number)
      case 'status':
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value as DataRecord['status'])}`}
          >
            {getStatusText(value as DataRecord['status'])}
          </span>
        )
      case 'createdAt':
      case 'updatedAt':
        return formatDate(value as string)
      default:
        return value
    }
  }

  // 计算总页数
  const totalPages = Math.ceil(pagination.total / pagination.pageSize)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 搜索和过滤栏 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索数据..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {columns
              .filter((col) => col.filterable)
              .map((column) => (
                <select
                  key={column.key}
                  onChange={(e) => handleFilter(column.key, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">{column.title}</option>
                  {Array.from(new Set(data.map((item) => item[column.key]))).map((value) => (
                    <option key={String(value)} value={String(value)}>
                      {String(value)}
                    </option>
                  ))}
                </select>
              ))}
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.title}
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                  </div>
                  <p className="mt-2">加载中...</p>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              data.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {renderCellContent(column, record)}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onView(record)}
                        className="text-primary-600 hover:text-primary-900 p-1 rounded"
                        title="查看"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(record)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(record.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      <div className="px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            显示 {(pagination.current - 1) * pagination.pageSize + 1} 到{' '}
            {Math.min(pagination.current * pagination.pageSize, pagination.total)} 条，共{' '}
            {pagination.total} 条记录
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pagination.pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={10}>10 条/页</option>
              <option value={20}>20 条/页</option>
              <option value={50}>50 条/页</option>
              <option value={100}>100 条/页</option>
            </select>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current <= 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-sm">
                {pagination.current} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DataTable
