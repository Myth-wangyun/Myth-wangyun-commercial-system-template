import { create } from 'zustand'

interface RefreshEventState {
  stabilityTableUpdateKey: number
  triggerStabilityTableUpdate: () => void
  // 网络合作伙伴计划数据刷新触发器
  networkPartnerPlanRefreshKey: number
  triggerNetworkPartnerPlanRefresh: () => void
}

export const useRefreshEventStore = create<RefreshEventState>((set) => ({
  stabilityTableUpdateKey: 0,
  triggerStabilityTableUpdate: () => set((state) => ({ stabilityTableUpdateKey: state.stabilityTableUpdateKey + 1 })),
  // 网络合作伙伴计划数据刷新触发器
  networkPartnerPlanRefreshKey: 0,
  triggerNetworkPartnerPlanRefresh: () => set((state) => ({ networkPartnerPlanRefreshKey: state.networkPartnerPlanRefreshKey + 1 })),
}))

