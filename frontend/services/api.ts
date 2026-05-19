import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { appMessage } from '@/utils/antdStatic'
import {
  getRuntimeCampus,
  handleRuntimeAuthExpired,
  notifyRuntimeTokenRefreshed,
} from './apiRuntime'

// 延迟导入 authStore 避免循环依赖
let authStoreGetter: (() => { token: string | null } | null) | null = null
export const setAuthStoreGetter = (getter: () => { token: string | null } | null) => {
  authStoreGetter = getter
}

export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  total?: number
  code?: number
}

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export function parsePaginationHeaders(
  headers: unknown,
  fallbackPage: number,
  fallbackPageSize: number,
) {
  const headerMap = (headers || {}) as Record<string, string | undefined>
  const readNumber = (name: string, fallback: number) => {
    const value = headerMap[name] ?? headerMap[name.toLowerCase()]
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  }

  return {
    total: readNumber('x-total-count', 0),
    page: readNumber('x-page', fallbackPage),
    pageSize: readNumber('x-page-size', fallbackPageSize),
  }
}

const getDefaultApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api/v1'
    }
  }

  return '/api/v1'
}

const API_BASE_URL = getDefaultApiBaseUrl()
export const HR_HEAVY_WRITE_TIMEOUT_MS = 120_000

const SILENT_ACCESS_DENIED_PATTERNS = [
  /\/human-resources\/appointment-interview-records(?:\?.*)?$/,
  /\/human-resources\/recruitment-requests(?:\?.*)?$/,
  /\/human-resources\/training-applications(?:\?.*)?$/,
  /\/human-resources\/regularization-applications(?:\?.*)?$/,
  /\/human-resources\/promotion-applications(?:\?.*)?$/,
  /\/human-resources\/social-insurance-applications(?:\?.*)?$/,
  /\/human-resources\/transfer-applications(?:\?.*)?$/,
  /\/human-resources\/unpaid-leave-applications(?:\?.*)?$/,
  /\/human-resources\/work-handovers(?:\?.*)?$/,
  /\/human-resources\/resignation-approvals(?:\?.*)?$/,
  /\/consult\/consultant-transfer\/pending-approvals(?:\?.*)?$/,
  /\/consult\/export\/pending-requests(?:\?.*)?$/,
] as const

const shouldSilenceAccessDenied = (config?: AxiosRequestConfig) => {
  const method = String(config?.method || 'get').toUpperCase()
  if (method !== 'GET') {
    return false
  }

  const requestUrl = String(config?.url || '')
  return SILENT_ACCESS_DENIED_PATTERNS.some((pattern) => pattern.test(requestUrl))
}

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

const fallbackHandleAuthExpired = (message: string) => {
  if (typeof window === 'undefined') return
  if (window.location.pathname === '/login') return

  const redirectPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (!redirectPath.startsWith('/login')) {
    sessionStorage.setItem('auth.redirect', redirectPath)
  }

  appMessage().error(message)
  window.location.href = '/login'
}

const triggerAuthExpired = async (message: string) => {
  const handled = await handleRuntimeAuthExpired(message)
  if (!handled) {
    fallbackHandleAuthExpired(message)
  }
}

const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10_000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  let isRefreshing = false
  let pendingRequests: Array<(token: string | null) => void> = []

  const resolvePending = (token: string | null) => {
    pendingRequests.forEach((callback) => callback(token))
    pendingRequests = []
  }

  const refreshAccessToken = async (): Promise<string | null> => {
    const response = await refreshClient.post('/auth/refresh', {})
    const data = response.data as {
      access_token?: string
    }

    if (!data?.access_token) {
      return null
    }

    notifyRuntimeTokenRefreshed(data.access_token)
    return data.access_token
  }

  instance.interceptors.request.use(
    (config) => {
      const requestUrl = String(config.url || '')
      
      // 从 authStore 获取 token 并添加 Authorization header
      const authStore = authStoreGetter?.()
      if (authStore?.token) {
        config.headers['Authorization'] = `Bearer ${authStore.token}`
      }
      
      const shouldSkipCampusHeader = requestUrl.includes('/class-employment-summary')

      if (!shouldSkipCampusHeader) {
        const currentCampus = getRuntimeCampus()
        if (currentCampus) {
          config.headers['X-Campus'] = btoa(encodeURIComponent(currentCampus))
        }
      }

      if (requestUrl.includes('/campus-manager-analysis')) {
        console.log(`[axios interceptor] request: ${config.method?.toUpperCase()} ${requestUrl}`)
        console.log('[axios interceptor] params:', config.params)
        console.log('[axios interceptor] full url:', config.baseURL + requestUrl)
      }

      if (requestUrl.includes('/consultant-plan')) {
        console.log(
          `[axios interceptor] consultant-plan request: ${config.method?.toUpperCase()} ${requestUrl}`,
        )
        console.log('[axios interceptor] consultant-plan params:', config.params)
        console.log('[axios interceptor] consultant-plan params type:', typeof config.params)
        if (config.params) {
          console.log('[axios interceptor] consultant-plan entries:', Object.entries(config.params))
        }
      }

      return config
    },
    (error) => Promise.reject(error),
  )

  instance.interceptors.response.use(
    (response: AxiosResponse<any>) => {
      const { data } = response

      if (data && typeof data === 'object' && 'success' in data && !data.success) {
        appMessage().error(data.message || 'Request failed')
        return Promise.reject(new Error(data.message || 'Request failed'))
      }

      return response
    },
    (error) => {
      if (!error.response) {
        if (error.request) {
          appMessage().error('Network request failed')
        } else {
          appMessage().error('Request configuration error')
        }
        return Promise.reject(error)
      }

      const { status, data } = error.response
      if (status === 401) {
        if (data?.code === 'IMPORT_USER_MISMATCH') {
          return Promise.reject(error)
        }

        const originalConfig = error.config as AxiosRequestConfig & { _retry?: boolean }
        const requestUrl = originalConfig?.url || ''
        const isAuthRequest =
          requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh')
        const authExpiredMessage = 'Session expired. Please sign in again.'

        if (!isAuthRequest && !originalConfig?._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              pendingRequests.push((token) => {
                if (!token) {
                  reject(error)
                  return
                }

                resolve(instance(originalConfig))
              })
            })
          }

          originalConfig._retry = true
          isRefreshing = true

          return refreshAccessToken()
            .then((newToken) => {
              isRefreshing = false
              resolvePending(newToken)

              if (!newToken) {
                return triggerAuthExpired(authExpiredMessage).then(() => Promise.reject(error))
              }

              return instance(originalConfig)
            })
            .catch((refreshError) => {
              isRefreshing = false
              resolvePending(null)
              return triggerAuthExpired(authExpiredMessage).then(() =>
                Promise.reject(refreshError),
              )
            })
        }

        if (isAuthRequest) {
          return Promise.reject(error)
        }

        return triggerAuthExpired(authExpiredMessage).then(() => Promise.reject(error))
      }

      switch (status) {
        case 403:
          if (shouldSilenceAccessDenied(error.config)) {
            break
          }
          appMessage().error('Access denied')
          break
        case 404:
          appMessage().error('Resource not found')
          break
        case 500:
          appMessage().error('Internal server error')
          break
        default:
          appMessage().error(data?.message || data?.detail || 'Request failed')
      }

      return Promise.reject(error)
    },
  )

  return instance
}

export const api = createApiInstance()
export const request = api

export const apiService = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.get(url, config).then((response) => response.data)
  },

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    return api.post(url, data, config).then((response) => response.data)
  },

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.put(url, data, config).then((response) => response.data)
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    return api.delete(url, config).then((response) => response.data)
  },

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> => {
    return api.patch(url, data, config).then((response) => response.data)
  },
}

export default api
