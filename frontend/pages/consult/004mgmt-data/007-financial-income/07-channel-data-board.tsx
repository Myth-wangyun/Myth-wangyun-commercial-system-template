import React from 'react'
import DataBoard from './DataBoard'

interface Props {
  year: string
  refreshTrigger?: number
  onSummaryChange?: (summary: { planIncome: number; actualIncome: number; planCount: number; actualCount: number; refundCount: number }) => void
}

/**
 * 07 渠道数据核心数据看板
 */
export default function ChannelDataBoard({ year, refreshTrigger, onSummaryChange }: Props) {
  return (
    <DataBoard
      title={`最高议事厅 ${year}年度渠道数据核心数据看板`}
      dataTypeLabel="渠道招生数据"
      dataType="渠道"
      year={year}
      refreshTrigger={refreshTrigger}
      onSummaryChange={onSummaryChange}
    />
  )
}
