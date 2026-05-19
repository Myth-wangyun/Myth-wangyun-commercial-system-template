import React from 'react'
import DataBoard from './DataBoard'

interface Props {
  year: string
  refreshTrigger?: number
  onSummaryChange?: (summary: { planIncome: number; actualIncome: number; planCount: number; actualCount: number; refundCount: number }) => void
}

/**
 * 05 网络合作伙伴数据核心数据看板
 */
export default function PartnerDataBoard({ year, refreshTrigger, onSummaryChange }: Props) {
  return (
    <DataBoard
      title={`最高议事厅 ${year}年度网络合作伙伴数据核心数据看板`}
      dataTypeLabel="网络合作伙伴招生数据"
      dataType="网络合作伙伴"
      year={year}
      refreshTrigger={refreshTrigger}
      onSummaryChange={onSummaryChange}
    />
  )
}
