import React from 'react'
import StudentDormitoryDetailTable from '@/pages/teaching-quality/campus/1-core-data/7-dormitory-statistics/student-dormiroty-detail'

const CampusMaleDormitoryDetailPage: React.FC = () => {
  return (
    <StudentDormitoryDetailTable
      title="男宿住宿明细"
      apiPath="/campus-male-dormitory-detail"
      genderFixed="男"
    />
  )
}

export default CampusMaleDormitoryDetailPage
