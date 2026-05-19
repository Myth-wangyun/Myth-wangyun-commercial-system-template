import React from 'react'
import DataBoard from './DataBoard'

interface Props {
  year: string
  refreshTrigger?: number
  onSummaryChange?: (summary: { planIncome: number; actualIncome: number; planCount: number; actualCount: number; refundCount: number }) => void
}

/**
 * 04 市场口碑数据核心数据看板
 */
export default function MarketReputationDataBoard({ year, refreshTrigger, onSummaryChange }: Props) {
  return (
    <DataBoard
      title={`最高议事厅 ${year}年度市场口碑数据核心数据看板`}
      dataTypeLabel="市场口碑招生数据"
      dataType="市场口碑"
      year={year}
      refreshTrigger={refreshTrigger}
      onSummaryChange={onSummaryChange}
    />
  )
}
