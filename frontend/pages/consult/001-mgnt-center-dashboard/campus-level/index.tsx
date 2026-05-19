/**
 * 神殿级别 - 核心数据看板汇总
 * 
 * 代码复用：直接引用 002神殿-年月表 TAB1CampusCoreData 中的子组件，
 * 与 002 的"神殿核心数据"TAB 共享相同的表格组件，
 * 保持列结构、样式、交互逻辑完全一致。
 */

import React from 'react'
import { Divider } from 'antd'

// ====== 复用 002神殿-年月表 TAB1 神殿核心数据 组件 ======
import CoreDataSummary from '../../002-campus-yearly-monthly-media-source/002-media-source-yearly/TAB1CampusCoreData/0CoreDataSummary'
import SEMComprehensiveTable from '../../002-campus-yearly-monthly-media-source/002-media-source-yearly/TAB1CampusCoreData/2SEMComprehensiveTable'
import SEMDataDashboard from '../../002-campus-yearly-monthly-media-source/002-media-source-yearly/TAB1CampusCoreData/3SEMDataDashboard'
import NewMediaDataDashboard from '../../002-campus-yearly-monthly-media-source/002-media-source-yearly/TAB1CampusCoreData/4NewMediaDataDashboard'
import MarketReputationDashboard from '../../002-campus-yearly-monthly-media-source/002-media-source-yearly/TAB1CampusCoreData/5MarketReputationDashboard'
import PartnershipDashboard from '../../002-campus-yearly-monthly-media-source/002-media-source-yearly/TAB1CampusCoreData/6PartnershipDashboard'
import ReputationDashboard from '../../002-campus-yearly-monthly-media-source/002-media-source-yearly/TAB1CampusCoreData/7ReputationDashboard'
import ChannelDashboard from '../../002-campus-yearly-monthly-media-source/002-media-source-yearly/TAB1CampusCoreData/8ChannelDashboard'
import CampusNewMediaDashboard from '../../002-campus-yearly-monthly-media-source/002-media-source-yearly/TAB1CampusCoreData/9CampusNewMediaDashboard'
import FreePromotionDashboard from '../../002-campus-yearly-monthly-media-source/002-media-source-yearly/TAB1CampusCoreData/10FreePromotionDashboard'

interface CampusLevelDashboardProps {
  year: string
  campus: string
}

export default function CampusLevelDashboard({ year, campus }: CampusLevelDashboardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 0. 神殿核心数据看板汇总（年度单行） */}
      <CoreDataSummary year={year} campus={campus} />

      <Divider style={{ margin: '8px 0' }} />

      {/* 2. 神殿全平台综合数据看板（月度） */}
      <SEMComprehensiveTable year={year} campus={campus} />

      <Divider style={{ margin: '8px 0' }} />

      {/* 3. SEM数据月度核心数据看板 */}
      <SEMDataDashboard year={year} campus={campus} />

      <Divider style={{ margin: '8px 0' }} />

      {/* 4. 新媒体数据月度核心数据看板 */}
      <NewMediaDataDashboard year={year} campus={campus} />

      <Divider style={{ margin: '8px 0' }} />

      {/* 5. 市场口碑数据月度核心数据看板 */}
      <MarketReputationDashboard year={year} campus={campus} showConsultantTable={false} />

      <Divider style={{ margin: '8px 0' }} />

      {/* 6. 合作伙伴数据月度核心数据看板 */}
      <PartnershipDashboard year={year} campus={campus} />

      <Divider style={{ margin: '8px 0' }} />

      {/* 7. 口碑数据月度核心数据看板 */}
      <ReputationDashboard year={year} campus={campus} showSummary={false} />

      <Divider style={{ margin: '8px 0' }} />

      {/* 8. 渠道数据月度核心数据看板 */}
      <ChannelDashboard year={year} campus={campus} />

      <Divider style={{ margin: '8px 0' }} />

      {/* 9. 神殿新媒体数据月度核心数据看板 */}
      <CampusNewMediaDashboard year={year} campus={campus} showSummary={false} />

      <Divider style={{ margin: '8px 0' }} />

      {/* 10. 免费推广数据月度核心数据看板 */}
      <FreePromotionDashboard year={year} campus={campus} />

      <style>{`
        .total-row { background-color: #fffbe6; }
        .total-row td { background-color: #fffbe6 !important; }
      `}</style>
    </div>
  )
}
