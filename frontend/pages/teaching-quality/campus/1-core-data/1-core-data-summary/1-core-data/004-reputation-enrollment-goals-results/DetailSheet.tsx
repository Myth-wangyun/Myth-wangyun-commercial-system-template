import React from 'react'
import CampusReputationEnrollmentRegistrationTable from '@/pages/campus/reputation-enrollment-registration'

const ReputationDetailSheet: React.FC = () => (
  <div
    className="campus-detail-table-wrapper"
    style={{
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <CampusReputationEnrollmentRegistrationTable />
  </div>
)

export default ReputationDetailSheet
