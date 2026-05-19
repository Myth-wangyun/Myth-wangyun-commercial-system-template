import React from 'react'
import SemPromotionDashboard01 from './01-sem-dashboard'
import SemPromotionDashboard02 from './02-sem-dashboard'

const SemPromotionBreakdownTab: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SemPromotionDashboard01 />
      <SemPromotionDashboard02 />
    </div>
  )
}

export default SemPromotionBreakdownTab
