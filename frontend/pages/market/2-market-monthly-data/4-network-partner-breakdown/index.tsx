import React from 'react'
import NetworkPartnerDashboard01 from './01-network-partner-dashboard'
import NetworkPartnerDashboard02 from './02-network-partner-dashboard'

const NetworkPartnerBreakdownTab: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NetworkPartnerDashboard01 />
      <NetworkPartnerDashboard02 />
    </div>
  )
}

export default NetworkPartnerBreakdownTab

