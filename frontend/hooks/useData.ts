import { useState, useEffect, useCallback } from 'react'
import { App } from 'antd'

type QueryParams = Record<string, unknown>

export interface DataState<T, S = unknown> {
  data: T[]
  loading: boolean
  error: string | null
  stats: S | null
}

export interface DataActions<T, S = unknown, P extends QueryParams = QueryParams> {
  setData: (data: T[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setStats: (stats: S | null) => void
  loadData: (params?: P) => Promise<void>
  refresh: () => Promise<void>
}

export const useData = <
  T,
  P extends QueryParams = QueryParams,
  S = unknown,
>(
  loadFn: (
    params?: P,
  ) => Promise<{ data: { list: T[]; total: number; page: number; pageSize: number } }>,
  statsFn?: (params?: P) => Promise<{ data: S }>,
  initialParams?: P,
): [DataState<T, S>, DataActions<T, S, P>] => {
  const { message } = App.useApp()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<S | null>(null)
  const [params, setParams] = useState<P | undefined>(initialParams)

  const loadData = useCallback(
    async (newParams?: P) => {
      setLoading(true)
      setError(null)

      try {
        const queryParams = { ...(params || {}), ...(newParams || {}) } as P
        setParams(queryParams)

        const [listResponse, statsResponse] = await Promise.all([
          loadFn(queryParams),
          statsFn ? statsFn(queryParams) : Promise.resolve<{ data: S | null }>({ data: null }),
        ])

        setData(listResponse.data?.list || [])
        setStats(statsResponse.data ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败')
        message.error('加载数据失败')
      } finally {
        setLoading(false)
      }
    },
    [loadFn, statsFn, params],
  )

  const refresh = useCallback(async () => {
    await loadData()
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [])

  const state: DataState<T, S> = {
    data,
    loading,
    error,
    stats,
  }

  const actions: DataActions<T, S, P> = {
    setData,
    setLoading,
    setError,
    setStats,
    loadData,
    refresh,
  }

  return [state, actions]
}
