import React, { useEffect, useMemo } from 'react'
import { Card, DatePicker, Space, Tabs } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { useMarketMonthlyDataStore } from '@/stores/marketMonthlyDataStore'

import CampusCoreDashboardPage from './1-campus/01-core-dashboard'
import NewMediaDashboardPage from './1-campus/02-newmedia-dashboard'
import SEMDashboardPage from './1-campus/03-sem-dashboard'
import OnlinePartnerDashboardPage from './1-campus/04-online-partner-dashboard'
import ReputationDashboardPage from './1-campus/05-reputation-dashboard'
import MarketFreePromotionDataTable from './1-campus/07-market-free-promotion-data-table'
import NewMediaBreakdownTab from './2-new-media-breakdown'
import SemPromotionBreakdownTab from './3-SEM-promotion-breakdown'
import NetworkPartnerBreakdownTab from './4-network-partner-breakdown'
import MarketReputationTab from './5-market-reputation'
import FreePromotionTab from './6-free-promotion'

const MarketingMonthlyDataTabsPage: React.FC = () => {
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()
  const { year, setYear } = useMarketMonthlyDataStore()

  // 初始化神殿（依赖全局神殿选择器的 state，但兜底确保有值）
  useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      setCampus(campuses[0].name)
    }
  }, [currentCampus, campuses, setCampus])

  const campusLabel = useMemo(() => {
    if (!currentCampus) return ''
    return currentCampus.includes('神殿') ? currentCampus : `${currentCampus}神殿`
  }, [currentCampus])

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (!date) return
    setYear(date.format('YYYY'))
  }

  if (!currentCampus) return null

  return (
    <div style={{ padding: 24 }}>
      <Card style={{ marginBottom: 16 }}>
        <div
          style={{
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 'bold',
          }}
        >
          <FileTextOutlined style={{ marginRight: 8 }} />
          市场部月度数据表
        </div>
        <div style={{ marginTop: 12 }}>
          <Space>
            <span>选择年份：</span>
            <DatePicker
              picker="year"
              value={dayjs(year, 'YYYY')}
              onChange={handleYearChange}
              allowClear={false}
              style={{ width: 140 }}
              format="YYYY年"
            />
          </Space>
        </div>
      </Card>

      <Tabs
        defaultActiveKey="campus-core-dashboard"
        type="card"
        items={[
          {
            key: 'campus-core-dashboard',
            label: campusLabel,
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <CampusCoreDashboardPage />
                <NewMediaDashboardPage />
                <SEMDashboardPage />
                <OnlinePartnerDashboardPage />
                <ReputationDashboardPage />
                <MarketFreePromotionDataTable />
              </div>
            ),
          },
          {
            key: 'newmedia-breakdown',
            label: campusLabel ? `${campusLabel}新媒体分解` : '新媒体分解',
            children: <NewMediaBreakdownTab />,
          },
          {
            key: 'sem-promotion-breakdown',
            label: campusLabel ? `03${campusLabel}SEM推广分解` : '03SEM推广分解',
            children: <SemPromotionBreakdownTab />,
          },
          {
            key: 'network-partner-breakdown',
            label: campusLabel ? `04${campusLabel}网络合作伙伴分解` : '04网络合作伙伴分解',
            children: <NetworkPartnerBreakdownTab />,
          },
          {
            key: 'market-reputation',
            label: campusLabel ? `${campusLabel}市场口碑` : '市场口碑',
            children: <MarketReputationTab />,
          },
          {
            key: 'free-promotion',
            label: campusLabel ? `${campusLabel}免费推广` : '免费推广',
            children: <FreePromotionTab />,
          },
        ]}
      />
    </div>
  )
}

export default MarketingMonthlyDataTabsPage
