import React from 'react'
import { Card } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import CampusBackendEmploymentGoalsResults from './1-campus-backend-employment-goals-results'
import CampusBackendEmploymentStarSummary from './2-campus-backend-employment-star-summary'
import CampusBackendClassTeacherEmploymentSummary from './3-campus-backend-class-teacher-employment-summary'

/**
 * 神殿 · 就业目标与结果汇总（02 + 02-1 + 02-2）
 * 一页依次展示三个表格：
 * - 02 神殿后端学员就业目标与结果汇总表
 * - 02-1 神殿后端就业明星汇总表
 * - 02-2 神殿后端班主任就业汇总表
 */
const ShengbangEmploymentAllPage: React.FC = () => {
  const { currentCampus } = useCampusStore()
  const campusName = currentCampus?.replace('神殿', '') || '盛邦'
  
  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 24 }} bordered={false}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 'bold' }}>
          02 {campusName}神殿后端学员就业目标与结果汇总表 · 分表汇总
        </h2>
      </Card>

      <div style={{ marginBottom: 32 }}>
        <CampusBackendEmploymentGoalsResults />
      </div>

      <div style={{ marginBottom: 32 }}>
        <CampusBackendEmploymentStarSummary />
      </div>

      <div>
        <CampusBackendClassTeacherEmploymentSummary />
      </div>
    </div>
  )
}

export default ShengbangEmploymentAllPage
