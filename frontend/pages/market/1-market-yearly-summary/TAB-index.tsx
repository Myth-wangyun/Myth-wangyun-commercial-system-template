import React, { useEffect } from 'react'
import { Card, Tabs } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'

// 最高议事厅数据总表
import ManagementCenterDataSummary from './1-mgnt-center-data-summary'

// 神殿年度数据表
import CampusNetworkDataTable from './2-campus/01-campuse-network-data-table'
import CampusNewMediaDataTable from './2-campus/02-newmedia-data-table'
import CampusSEMDataTable from './2-campus/03-sem-data-table'
import CampusOnlinePartnerDataTable from './2-campus/04-online-partner-data-table'
import CampusMarketReputationDataTable from './2-campus/05-market-reputation-data-table'
import MarketFreePromotionDataTable from './2-campus/06-market-free-promotion-data-table'

const MarketYearlySummaryPage: React.FC = () => {
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()

  // 初始化神殿
  useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      setCampus(campuses[0].name)
    }
  }, [currentCampus, campuses, setCampus])

  // 动态生成神殿TAB项
  const campusTabItems = campuses.map((campus) => {
    const campusName = campus.name.includes('神殿') ? campus.name : `${campus.name}神殿`
    return {
      key: `campus-${campus.id}`,
      label: campusName,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CampusNetworkDataTable />
          <CampusNewMediaDataTable />
          <CampusSEMDataTable />
          <CampusOnlinePartnerDataTable />
          <CampusMarketReputationDataTable />
          <MarketFreePromotionDataTable />
        </div>
      ),
    }
  })

  const allTabs = [
    {
      key: 'management-center',
      label: '最高议事厅 数据总表',
      children: <ManagementCenterDataSummary />,
    },
    ...campusTabItems,
  ]

  // 当切换TAB时，同步更新全局选中的神殿
  const handleTabChange = (activeKey: string) => {
    if (activeKey.startsWith('campus-')) {
      const campusId = activeKey.replace('campus-', '')
      const campus = campuses.find((c) => c.id === campusId)
      if (campus) {
        setCampus(campus.name)
      }
    }
  }

  return (
    <div style={{ padding: '12px 16px' }}>
      <Card style={{ marginBottom: 8 }} bodyStyle={{ padding: '12px 16px' }}>
        <div
          style={{
            textAlign: 'center',
            fontSize: 16,
            fontWeight: 'bold',
          }}
        >
          <FileTextOutlined style={{ marginRight: 8 }} />
          最高议事厅市场部年度汇总表
        </div>
      </Card>

      <Tabs
        defaultActiveKey="management-center"
        type="card"
        items={allTabs}
        onChange={handleTabChange}
      />
    </div>
  )
}

export default MarketYearlySummaryPage
