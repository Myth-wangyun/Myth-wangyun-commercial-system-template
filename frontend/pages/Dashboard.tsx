//页面级容器
import React, { useState, useEffect, useCallback } from 'react'
import type {
  DataRecord,
  TableColumn,
  PaginationConfig,
  SortConfig,
  FormMode,
  DashboardStats,
} from '../types'
import { dataService } from '../services/dataService'
import { sortData, paginateData, debounce } from '../utils'
import DataTable from '../components/DataTable'
import DataForm from '../components/DataForm'
import StatsCard from '../components/StatsCard'
import ConfirmDialog from '../components/ConfirmDialog'
import { Plus, RefreshCw } from 'lucide-react'

const Dashboard: React.FC = () => {
  // 状态管理
  const [data, setData] = useState<DataRecord[]>([])
  const [filteredData, setFilteredData] = useState<DataRecord[]>([])
  const [displayData, setDisplayData] = useState<DataRecord[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalRecords: 0,
    activeRecords: 0,
    inactiveRecords: 0,
    pendingRecords: 0,
    totalValue: 0,
    averageValue: 0,
  })

  // 加载状态
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)

  // 分页和排序
  const [pagination, setPagination] = useState<PaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)

  // 表单和对话框状态
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('create')
  const [selectedRecord, setSelectedRecord] = useState<DataRecord | undefined>()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState<string>('')

  // 表格列配置
  const columns: TableColumn[] = [
    {
      key: 'name',
      title: '名称',
      sortable: true,
      filterable: true,
      width: '200px',
    },
    {
      key: 'category',
      title: '类别',
      sortable: true,
      filterable: true,
      width: '120px',
    },
    {
      key: 'value',
      title: '数值',
      sortable: true,
      width: '120px',
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      filterable: true,
      width: '100px',
    },
    {
      key: 'createdAt',
      title: '创建时间',
      sortable: true,
      width: '150px',
    },
    {
      key: 'updatedAt',
      title: '更新时间',
      sortable: true,
      width: '150px',
    },
  ]

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [dataResponse, statsResponse] = await Promise.all([
        dataService.getAllData(),
        dataService.getDashboardStats(),
      ])

      if (dataResponse.success) {
        setData(dataResponse.data)
        setFilteredData(dataResponse.data)
        setPagination((prev) => ({ ...prev, total: dataResponse.data.length }))
      }

      if (statsResponse.success) {
        setStats(statsResponse.data)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 搜索功能
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (term.trim() === '') {
        setFilteredData(data)
        setPagination((prev) => ({ ...prev, total: data.length, current: 1 }))
        return
      }

      try {
        const response = await dataService.searchData(term)
        if (response.success) {
          setFilteredData(response.data)
          setPagination((prev) => ({ ...prev, total: response.data.length, current: 1 }))
        }
      } catch (error) {
        console.error('搜索失败:', error)
      }
    }, 300),
    [data],
  )

  // 处理搜索
  const handleSearch = (term: string) => {
    debouncedSearch(term)
  }

  // 处理排序
  const handleSort = (newSortConfig: SortConfig) => {
    setSortConfig(newSortConfig)
  }

  // 处理分页变化
  const handlePaginationChange = (newPagination: PaginationConfig) => {
    setPagination(newPagination)
  }

  // 处理新增
  const handleCreate = () => {
    setFormMode('create')
    setSelectedRecord(undefined)
    setShowForm(true)
  }

  // 处理编辑
  const handleEdit = (record: DataRecord) => {
    setFormMode('edit')
    setSelectedRecord(record)
    setShowForm(true)
  }

  // 处理查看
  const handleView = (record: DataRecord) => {
    setFormMode('view')
    setSelectedRecord(record)
    setShowForm(true)
  }

  // 处理删除
  const handleDelete = (id: string) => {
    setDeleteId(id)
    setShowConfirmDialog(true)
  }

  // 确认删除
  const confirmDelete = async () => {
    try {
      setFormLoading(true)
      const response = await dataService.deleteData(deleteId)
      if (response.success) {
        await loadData()
        setShowConfirmDialog(false)
        setDeleteId('')
      }
    } catch (error) {
      console.error('删除失败:', error)
    } finally {
      setFormLoading(false)
    }
  }

  // 处理表单提交
  const handleFormSubmit = async (formData: Partial<DataRecord>) => {
    try {
      setFormLoading(true)
      let response

      if (formMode === 'create') {
        response = await dataService.createData(
          formData as Omit<DataRecord, 'id' | 'createdAt' | 'updatedAt'>,
        )
      } else if (formMode === 'edit' && selectedRecord) {
        response = await dataService.updateData(selectedRecord.id, formData)
      }

      if (response?.success) {
        setShowForm(false)
        await loadData()
      }
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      setFormLoading(false)
    }
  }

  // 处理刷新
  const handleRefresh = () => {
    loadData()
  }

  // 处理表单取消
  const handleFormCancel = () => {
    setShowForm(false)
    setSelectedRecord(undefined)
  }

  // 处理确认对话框取消
  const handleConfirmCancel = () => {
    setShowConfirmDialog(false)
    setDeleteId('')
  }

  // 计算显示数据
  useEffect(() => {
    let processedData = [...filteredData]

    // 应用排序
    if (sortConfig) {
      processedData = sortData(processedData, sortConfig)
    }

    // 应用分页
    const paginatedData = paginateData(processedData, pagination.current, pagination.pageSize)
    setDisplayData(paginatedData)
  }, [filteredData, sortConfig, pagination])

  // 初始化加载
  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">数据看板</h1>
              <p className="text-sm text-gray-600">管理和查看您的数据记录</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                新增数据
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="mb-8">
          <StatsCard stats={stats} loading={loading} />
        </div>

        {/* 数据表格 */}
        <div>
          <DataTable
            data={displayData}
            columns={columns}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            onSort={handleSort}
            onSearch={handleSearch}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            loading={loading}
          />
        </div>
      </div>

      {/* 表单对话框 */}
      {showForm && (
        <DataForm
          mode={formMode}
          data={selectedRecord}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          loading={formLoading}
        />
      )}

      {/* 确认删除对话框 */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="确认删除"
        message="您确定要删除这条记录吗？此操作不可撤销。"
        confirmText="删除"
        cancelText="取消"
        onConfirm={confirmDelete}
        onCancel={handleConfirmCancel}
        loading={formLoading}
        type="danger"
      />
    </div>
  )
}

export default Dashboard
