import React from 'react'
import ClassEmploymentInfoTable from './1-ClassEmploymentInfoTable'

const ClassEmploymentInfoAll: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ClassEmploymentInfoTable />
    </div>
  )
}

export default ClassEmploymentInfoAll
