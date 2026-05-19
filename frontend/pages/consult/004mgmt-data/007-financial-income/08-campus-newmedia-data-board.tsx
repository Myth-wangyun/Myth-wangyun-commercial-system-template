import React from 'react'
import DataBoard from './DataBoard'

interface Props {
  year: string
  refreshTrigger?: number
  onSummaryChange?: (summary: { planIncome: number; actualIncome: number; planCount: number; actualCount: number; refundCount: number }) => void
}

/**
 * 08 神殿新媒体数据核心数据看板
 */
export default function CampusNewMediaDataBoard({ year, refreshTrigger, onSummaryChange }: Props) {
  return (
    <DataBoard
      title={`最高议事厅 ${year}年度神殿新媒体数据核心数据看板`}
      dataTypeLabel="神殿新媒体招生数据"
      dataType="神殿新媒体"
      year={year}
      refreshTrigger={refreshTrigger}
      onSummaryChange={onSummaryChange}
    />
  )
}
