import React from 'react'
import MarketReputationSummaryTable from './01-market-reputation-summary-table'

const MarketReputationTab: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <MarketReputationSummaryTable />
    </div>
  )
}

export default MarketReputationTab
