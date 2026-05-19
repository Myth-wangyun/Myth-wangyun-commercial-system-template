import { useState, useCallback } from 'react'
import { App } from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'

export interface TableState<T = Record<string, unknown>> {
  loading: boolean
  data: T[]
  pagination: {
    current: number
    pageSize: number
    total: number
  }
  searchText: string
  selectedDate: string
  selectedCampus: string
}

export interface TableActions<T = Record<string, unknown>> {
  setLoading: (loading: boolean) => void
  setData: (data: T[]) => void
  setPagination: (pagination: Partial<TableState<T>['pagination']>) => void
  setSearchText: (text: string) => void
  setSelectedDate: (date: string) => void
  setSelectedCampus: (campus: string) => void
  handleTableChange: (pagination: Pick<TablePaginationConfig, 'current' | 'pageSize'>) => void
  handleSearch: (value: string) => void
  handleDelete: (id: string, deleteFn: (id: string) => Promise<void>, _name?: string) => void
  resetFilters: () => void
}

export const useTable = <T extends Record<string, unknown> = Record<string, unknown>>(
  initialState?: Partial<TableState<T>>,
): [TableState<T>, TableActions<T>] => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<T[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    ...initialState?.pagination,
  })
  const [searchText, setSearchText] = useState(initialState?.searchText || '')
  const [selectedDate, setSelectedDate] = useState(initialState?.selectedDate || '')
  const [selectedCampus, setSelectedCampus] = useState(initialState?.selectedCampus || '')

  const handleTableChange = useCallback(
    (pagination: Pick<TablePaginationConfig, 'current' | 'pageSize'>) => {
      setPagination((prev) => ({
        ...prev,
        current: pagination.current || prev.current,
        pageSize: pagination.pageSize || prev.pageSize,
      }))
    },
    [],
  )

  const handleSearch = useCallback((value: string) => {
    setSearchText(value)
    setPagination((prev) => ({ ...prev, current: 1 }))
  }, [])

  const handleDelete = useCallback(
    async (id: string, deleteFn: (id: string) => Promise<void>, name?: string) => {
      void name
      try {
        await deleteFn(id)
        message.success('删除成功')
        setPagination((prev) => ({ ...prev, current: 1 }))
      } catch (error) {
        void error
        message.error('删除失败')
      }
    },
    [],
  )

  const resetFilters = useCallback(() => {
    setSearchText('')
    setSelectedDate('')
    setSelectedCampus('')
    setPagination((prev) => ({ ...prev, current: 1 }))
  }, [])

  const setPaginationState = useCallback((paginationUpdate: Partial<TableState<T>['pagination']>) => {
    setPagination((prev) => ({ ...prev, ...paginationUpdate }))
  }, [])

  const state: TableState<T> = {
    loading,
    data,
    pagination,
    searchText,
    selectedDate,
    selectedCampus,
  }

  const actions: TableActions<T> = {
    setLoading,
    setData,
    setPagination: setPaginationState,
    setSearchText,
    setSelectedDate,
    setSelectedCampus,
    handleTableChange,
    handleSearch,
    handleDelete,
    resetFilters,
  }

  return [state, actions]
}
