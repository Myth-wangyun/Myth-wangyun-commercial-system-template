import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { appMessage } from '@/utils/antdStatic'
import { authService, type LoginSuccessResponse } from '@/services/auth'
import { registerApiRuntime } from '@/services/apiRuntime'

export interface User {
  id: string
  username: string
  name: string
  role: string
  is_superuser?: boolean
  campus?: string | null
  campusAccessList?: string[]
  department?: string | null
  position?: string | null
  email?: string | null
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  loading: boolean
  permissions: string[]
  roles: string[]
  permissionsLoaded: boolean
  accessibleCampuses: string[]
  campusRestricted: boolean
  login: (username: string, password: string, remember?: boolean) => Promise<void>
  logout: () => Promise<void>
  clearSession: () => void
  setUser: (user: User) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  checkAuth: () => boolean
  refreshSession: () => Promise<boolean>
  refreshUserInfo: () => Promise<void>
  fetchPermissions: () => Promise<void>
  fetchAccessibleCampuses: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (...permissions: string[]) => boolean
}

const mapBackendUser = (payload: LoginSuccessResponse['user']): User => ({
  id: String(payload.user_id),
  username: payload.username,
  name: payload.real_name,
  role: payload.role,
  is_superuser: payload.is_superuser,
  campus: payload.campus ?? null,
  campusAccessList: payload.campus_access_list ?? [],
  department: payload.department ?? null,
  position: payload.position ?? null,
  email: payload.email ?? null,
})

const createLoggedOutState = () => ({
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  permissions: [],
  roles: [],
  permissionsLoaded: false,
  accessibleCampuses: [],
  campusRestricted: false,
})

const storeRedirectPath = () => {
  if (typeof window === 'undefined') return

  const redirectPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (!redirectPath.startsWith('/login')) {
    sessionStorage.setItem('auth.redirect', redirectPath)
  }
}

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const response =
      'response' in error
        ? (error.response as { data?: { detail?: string } } | undefined)
        : undefined
    const detail = response?.data?.detail
    if (typeof detail === 'string' && detail) {
      return detail
    }

    const message = 'message' in error ? error.message : undefined
    if (typeof message === 'string' && message) {
      return message
    }
  }

  return 'Login failed. Please try again.'
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...createLoggedOutState(),

      login: async (username: string, password: string, _remember = false) => {
        void _remember
        set({ loading: true })

        try {
          const data = await authService.login(username, password)
          const mappedUser = mapBackendUser(data.user)

          set({
            ...createLoggedOutState(),
            isAuthenticated: true,
            loading: false,
            token: data.access_token ?? null,
            user: mappedUser,
          })

          Promise.all([
            get()
              .fetchPermissions()
              .catch((err) => console.error('Failed to load permissions:', err)),
            get()
              .fetchAccessibleCampuses()
              .catch((err) => console.error('Failed to load campuses:', err)),
          ]).catch(() => {})
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error)
          set(createLoggedOutState())
          throw new Error(errorMessage)
        }
      },

      clearSession: () => {
        set(createLoggedOutState())
      },

      logout: async () => {
        get().clearSession()

        try {
          await Promise.race([
            authService.logout(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3_000)),
          ])
        } catch {
          console.warn('[auth] backend logout failed or timed out, local session cleared')
        }
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      },

      setToken: (token: string | null) => {
        set((state) => ({
          token,
          isAuthenticated: !!token || !!state.user,
        }))
      },

      setLoading: (loading: boolean) => {
        set({ loading })
      },

      checkAuth: () => {
        const { user, token } = get()
        const isAuthenticated = !!user || !!token
        set({ isAuthenticated })
        return isAuthenticated
      },

      refreshSession: async () => {
        const existingUser = get().user
        set({ loading: true })

        try {
          const data = await authService.refresh()
          if (!data?.access_token) {
            throw new Error('refresh failed')
          }

          set({
            token: data.access_token,
            isAuthenticated: true,
          })

          if (!existingUser) {
            const me = await authService.getMe()
            set({ user: mapBackendUser(me) })
          }

          await get().fetchPermissions()
          await get().fetchAccessibleCampuses()
          set({ loading: false })
          return true
        } catch {
          get().clearSession()
          return false
        }
      },

      refreshUserInfo: async () => {
        try {
          const me = await authService.getMe()
          const mappedUser = mapBackendUser(me)
          set({ user: mappedUser })
          await get().fetchPermissions()
          await get().fetchAccessibleCampuses()
        } catch (error) {
          console.error('[authStore] refreshUserInfo failed:', error)
          throw error
        }
      },

      fetchPermissions: async () => {
        try {
          const data = await authService.getMyPermissions()
          set({
            permissions: data.permissions || [],
            roles: (data.roles || []).map((role) => role.code),
            permissionsLoaded: true,
          })
        } catch (error) {
          console.error('Failed to load permissions:', error)
          set({
            permissions: [],
            roles: [],
            permissionsLoaded: true,
          })
        }
      },

      fetchAccessibleCampuses: async () => {
        try {
          const data = await authService.getMyAccessibleCampuses()
          set({
            accessibleCampuses: data.campuses || [],
            campusRestricted: data.restricted || false,
          })
        } catch (error) {
          console.error('Failed to load campuses:', error)
          set({
            accessibleCampuses: [],
            campusRestricted: false,
          })
        }
      },

      hasPermission: (permission: string): boolean => {
        const { permissions, user } = get()

        if (user?.role === 'admin') {
          return true
        }

        if (permissions.includes('*')) {
          return true
        }

        if (permissions.includes(permission)) {
          return true
        }

        const parts = permission.split('.')
        for (let index = 0; index < parts.length; index += 1) {
          const wildcard = `${parts.slice(0, index + 1).join('.')}.*`
          if (permissions.includes(wildcard)) {
            return true
          }
        }

        return false
      },

      hasAnyPermission: (...requiredPermissions: string[]): boolean => {
        const { hasPermission } = get()
        return requiredPermissions.some((permission) => hasPermission(permission))
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

registerApiRuntime({
  onAccessTokenRefreshed: (token) => {
    useAuthStore.getState().setToken(token)
  },
  handleAuthExpired: async (message) => {
    useAuthStore.getState().clearSession()

    if (typeof window === 'undefined') {
      return
    }

    if (window.location.pathname === '/login') {
      return
    }

    storeRedirectPath()
    appMessage().error(message || 'Session expired. Please sign in again.')
    window.location.href = '/login'
  },
})
