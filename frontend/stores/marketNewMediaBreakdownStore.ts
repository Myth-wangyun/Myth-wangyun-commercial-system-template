import { create } from 'zustand'
import dayjs from 'dayjs'

export interface MarketNewMediaBreakdownState {
  /** YYYY-MM-DD */
  date: string
  setDate: (date: string) => void
}

export const useMarketNewMediaBreakdownStore = create<MarketNewMediaBreakdownState>((set) => ({
  date: dayjs().format('YYYY-MM-DD'),
  setDate: (date: string) => set({ date }),
}))

