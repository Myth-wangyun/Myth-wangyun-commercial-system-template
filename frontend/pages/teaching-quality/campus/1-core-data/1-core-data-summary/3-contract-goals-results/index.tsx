import React, { useRef } from 'react'
import { useCampusStore } from '@/stores/campusStore'
import { Card } from 'antd'
import CampusEnterpriseContractGoalsResults from './1-campus-enterprise-contract-goals-results'
import ShengbangPersonalEnterpriseContractSummary from './2-campus-personal-enterprise-contract-goals-results'
import ShengbangClassTeacherEnterpriseContractSummary from './3-campus-class-teacher-enterprise-contract-goals-results'

const ShengbangContractGoalsResultsAllPage: React.FC = () => {
  const { currentCampus } = useCampusStore()
  
  // 用于存储子组件的刷新函数
  const campusTableRefreshRef = useRef<(() => void) | null>(null)
  const personalTableRefreshRef = useRef<(() => void) | null>(null)

  // 当班主任表保存成功后，刷新其他两个表
  const handleClassTeacherSaved = () => {
    if (campusTableRefreshRef.current) {
      campusTableRefreshRef.current()
    }
    if (personalTableRefreshRef.current) {
      personalTableRefreshRef.current()
    }
  }

  if (!currentCampus) return null

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={`03${currentCampus || ''}教化司企业签约目标与结果汇总表 · 分表汇总`}
        bordered={false}
        style={{ marginBottom: 16 }}
      >
        <p style={{ marginBottom: 0 }}>
          下方依次为：神殿签约汇总、个人签约汇总、班主任签约汇总三张表。
        </p>
      </Card>
      <CampusEnterpriseContractGoalsResults onRefreshReady={(fn) => (campusTableRefreshRef.current = fn)} />
      <ShengbangPersonalEnterpriseContractSummary onRefreshReady={(fn) => (personalTableRefreshRef.current = fn)} />
      <ShengbangClassTeacherEnterpriseContractSummary onSaveSuccess={handleClassTeacherSaved} />
    </div>
  )
}

export default ShengbangContractGoalsResultsAllPage
