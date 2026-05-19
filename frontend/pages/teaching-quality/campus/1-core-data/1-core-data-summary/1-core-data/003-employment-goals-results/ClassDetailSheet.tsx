import React from 'react'
import ClassEmploymentDetailPage from '../../../../2-stu-emmplyment/1-class-employment-detail/TAB-index'

const EmploymentClassDetailSheet: React.FC = () => {
  return (
    <div
      className="campus-class-detail-wrapper"
      style={{
        marginBottom: 32,
        order: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ClassEmploymentDetailPage />
    </div>
  )
}

export default EmploymentClassDetailSheet
