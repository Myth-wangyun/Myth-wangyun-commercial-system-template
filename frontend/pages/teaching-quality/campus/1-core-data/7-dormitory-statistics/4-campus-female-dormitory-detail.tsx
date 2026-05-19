import React from 'react'
import StudentDormitoryDetailTable from '@/pages/teaching-quality/campus/1-core-data/7-dormitory-statistics/student-dormiroty-detail'

const CampusFemaleDormitoryDetailPage: React.FC = () => {
  return (
    <StudentDormitoryDetailTable
      title="女宿住宿明细"
      apiPath="/campus-female-dormitory-detail"
      genderFixed="女"
    />
  )
}

export default CampusFemaleDormitoryDetailPage
