import React from 'react'
import CoreDataSummary from './01-core-data-summary'
import NewMediaDataSummary from './02-newmedia-data-summary'
import SemDataSummary from './03-sem-data-summary'
import OnlinePartnerDataSummary from './04-online-partner-data-summary'
import MarketReputationDataSummary from './05-market-reputation-data-summary'
import MarketFreePromotionSummary from './06-market-free-promotion-summary'

/**
 * 最高议事厅数据汇总
 * - 包含多个子表：核心数据、新媒体数据、SEM推广数据、网络合作伙伴数据、市场口碑数据等
 */
const MgmtCenterDataSummary: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <CoreDataSummary />
      <NewMediaDataSummary />
      <SemDataSummary />
      <OnlinePartnerDataSummary />
      <MarketReputationDataSummary />
      <MarketFreePromotionSummary />
    </div>
  )
}

export default MgmtCenterDataSummary
