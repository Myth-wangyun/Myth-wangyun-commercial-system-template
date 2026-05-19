/**
 * Tab1CampusCoreData - 神殿核心数据看板汇总
 * 包含10个数据看板（按Excel模板要求）
 */

import React from 'react'
import { Divider, Select } from 'antd'
import { useCampusStore } from '@/stores/campusStore'

import CoreDataSummary from './0CoreDataSummary'
import SEMComprehensiveTable from './2SEMComprehensiveTable'
import SEMDataDashboard from './3SEMDataDashboard'
import NewMediaDataDashboard from './4NewMediaDataDashboard'
import MarketReputationDashboard from './5MarketReputationDashboard'
import PartnershipDashboard from './6PartnershipDashboard'
import ReputationDashboard from './7ReputationDashboard'
import ChannelDashboard from './8ChannelDashboard'
import CampusNewMediaDashboard from './9CampusNewMediaDashboard'
import FreePromotionDashboard from './10FreePromotionDashboard'

interface Props {
  year: string
}

export default function Tab1CampusCoreData({ year }: Props) {
  const campusStore = useCampusStore()
  const campusList = campusStore.getAllCampuses()
  
  // 使用全局的 currentCampus 和 setCampus，与顶部导航栏的神殿选择器绑定
  const currentCampus = campusStore.currentCampus || (campusList.length > 0 ? campusList[0].name : '未选择')
  const handleCampusChange = (value: string) => {
    campusStore.setCampus(value)
  }

  const campusOptions = campusList.map(c => ({ label: c.name, value: c.name }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 0. 神殿核心数据看板汇总 */}
      <CoreDataSummary year={year} campus={currentCampus} />

      <Divider style={{ margin: '12px 0' }} />

      {/* 2. SEM+新媒体+市场口碑+合作伙伴+口碑+渠道+神殿新媒体数据核心数据看板 */}
      <SEMComprehensiveTable year={year} campus={currentCampus} />

      <Divider style={{ margin: '12px 0' }} />

      {/* 3. SEM数据核心数据看板 */}
      <SEMDataDashboard year={year} campus={currentCampus} />

      <Divider style={{ margin: '12px 0' }} />

      {/* 4. 新媒体数据核心数据看板 */}
      <NewMediaDataDashboard year={year} campus={currentCampus} />

      <Divider style={{ margin: '12px 0' }} />

      {/* 5. 市场口碑数据核心数据看板 */}
      <MarketReputationDashboard year={year} campus={currentCampus} showConsultantTable={false} />

      <Divider style={{ margin: '12px 0' }} />

      {/* 6. 合作伙伴数据核心数据看板 */}
      <PartnershipDashboard year={year} campus={currentCampus} />

      <Divider style={{ margin: '12px 0' }} />

      {/* 7. 口碑数据核心数据看板 */}
      <ReputationDashboard year={year} campus={currentCampus} showSummary={false} />

      <Divider style={{ margin: '12px 0' }} />

      {/* 8. 渠道数据核心数据看板 */}
      <ChannelDashboard year={year} campus={currentCampus} />

      <Divider style={{ margin: '12px 0' }} />

      {/* 9. 神殿新媒体数据核心数据看板 */}
      <CampusNewMediaDashboard year={year} campus={currentCampus} showSummary={false} />

      <Divider style={{ margin: '12px 0' }} />

      {/* 10. 免费推广数据核心数据看板 */}
      <FreePromotionDashboard year={year} campus={currentCampus} />

      <style>{`
        .total-row { background-color: #fffbe6; }
        .total-row td { background-color: #fffbe6 !important; }
      `}</style>
    </div>
  )
}
