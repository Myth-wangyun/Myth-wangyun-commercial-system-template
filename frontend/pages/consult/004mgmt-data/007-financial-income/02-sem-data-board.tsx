import React from 'react'
import DataBoard from './DataBoard'

interface Props {
  year: string
  refreshTrigger?: number
  onSummaryChange?: (summary: { planIncome: number; actualIncome: number; planCount: number; actualCount: number; refundCount: number }) => void
}

/**
 * 02 SEM数据核心数据看板
 */
export default function SemDataBoard({ year, refreshTrigger, onSummaryChange }: Props) {
  return (
    <DataBoard
      title={`最高议事厅 ${year}年度SEM数据核心数据看板`}
      dataTypeLabel="SEM招生数据"
      dataType="SEM"
      year={year}
      refreshTrigger={refreshTrigger}
      onSummaryChange={onSummaryChange}
    />
  )
}
