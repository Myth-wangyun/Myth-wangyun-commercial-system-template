import { create } from 'zustand'

export interface MarketMonthlyDataState {
  year: string
  setYear: (year: string) => void
}

const getCurrentYear = () => String(new Date().getFullYear())

export const useMarketMonthlyDataStore = create<MarketMonthlyDataState>((set) => ({
  year: getCurrentYear(),
  setYear: (year: string) => set({ year }),
}))

