import React from 'react'
import NewMediaCoreDashboard01 from './01-newmedia-core-dashboard'
import NewMediaDashboard02 from './02-newmedia-dashboard'

const NewMediaBreakdownTab: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <NewMediaCoreDashboard01 />
      <NewMediaDashboard02 />
    </div>
  )
}

export default NewMediaBreakdownTab

