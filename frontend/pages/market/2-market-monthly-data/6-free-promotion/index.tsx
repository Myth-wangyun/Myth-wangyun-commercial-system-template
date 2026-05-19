import React from 'react'
import FreePromotionSummaryTable from './01-free-promotion-summary-table'

const FreePromotionTab: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <FreePromotionSummaryTable />
    </div>
  )
}

export default FreePromotionTab

