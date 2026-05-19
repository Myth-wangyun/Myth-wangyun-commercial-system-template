import { create } from 'zustand'

export interface AppState {
  // 状态
  sidebarCollapsed: boolean
  currentPage: string
  searchTerm: string
  loading: boolean

  // 操作
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setCurrentPage: (page: string) => void
  setSearchTerm: (term: string) => void
  setLoading: (loading: boolean) => void
  clearSearch: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // 初始状态
  sidebarCollapsed: false,
  currentPage: 'campuses',
  searchTerm: '',
  loading: false,

  // 切换侧边栏
  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
  },

  // 设置侧边栏状态
  setSidebarCollapsed: (collapsed: boolean) => {
    set({ sidebarCollapsed: collapsed })
  },

  // 设置当前页面
  setCurrentPage: (page: string) => {
    set({ currentPage: page })
  },

  // 设置搜索词
  setSearchTerm: (term: string) => {
    set({ searchTerm: term })
  },

  // 设置加载状态
  setLoading: (loading: boolean) => {
    set({ loading })
  },

  // 清空搜索
  clearSearch: () => {
    set({ searchTerm: '' })
  },
}))
