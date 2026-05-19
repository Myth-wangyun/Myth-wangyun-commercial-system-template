import React, { useCallback, useState } from 'react'
import { DatePicker, Space, Tabs } from 'antd'
import dayjs from 'dayjs'
import { NoCopyContainer } from '@/components/common'
import OverviewSummary from './00-overview-summary'
import CoreDataSummary from './01-core-data-summary'
import SemDataBoard from './02-sem-data-board'
import NewMediaDataBoard from './03-newmedia-data-board'
import MarketReputationDataBoard from './04-market-reputation-data-board'
import PartnerDataBoard from './05-partner-data-board'
import ReputationDataBoard from './06-reputation-data-board'
import ChannelDataBoard from './07-channel-data-board'
import CampusNewMediaDataBoard from './08-campus-newmedia-data-board'
import Tab2CampusDataSummary from './Tab2CampusDataSummary'
import Tab3ConsultantPlanSetting from './Tab3ConsultantPlanSetting'

type SummaryData = {
  planIncome: number
  actualIncome: number
  planCount: number
  actualCount: number
  refundCount: number
}

// 7个数据类型的key
const DATA_TYPE_KEYS = ['sem', 'newmedia', 'market', 'partner', 'reputation', 'channel', 'campusnewmedia']

/**
 * 006财务收入和退费 - 最高议事厅核心数据
 *
 * TAB1 - 最高议事厅核心数据汇总（按神殿汇总）
 * TAB2 - 各神殿数据看板汇总（按神殿分TAB，按月份展示）
 */
const MgntCenterCoreData: React.FC = () => {
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)
  
  // TAB2保存次数，变化时触发TAB1各DataBoard刷新
  const [tab2SaveCount, setTab2SaveCount] = useState(0)
  
  // 各子表的汇总数据
  const [summaryMap, setSummaryMap] = useState<Record<string, SummaryData>>({})
  const [loading, setLoading] = useState(false)

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (!date) return
    setYear(date.format('YYYY'))
  }

  // 处理子表汇总数据变化
  const handleSummaryChange = useCallback((key: string, data: SummaryData) => {
    setSummaryMap(prev => ({
      ...prev,
      [key]: data,
    }))
  }, [])

  // 计算总汇总（只用7个数据类型的子表合计，不包括core）
  const totalSummary: SummaryData = DATA_TYPE_KEYS.reduce(
    (acc, key) => {
      const curr = summaryMap[key]
      return {
        planIncome: acc.planIncome + (curr?.planIncome || 0),
        actualIncome: acc.actualIncome + (curr?.actualIncome || 0),
        planCount: acc.planCount + (curr?.planCount || 0),
        actualCount: acc.actualCount + (curr?.actualCount || 0),
        refundCount: acc.refundCount + (curr?.refundCount || 0),
      }
    },
    { planIncome: 0, actualIncome: 0, planCount: 0, actualCount: 0, refundCount: 0 }
  )

  // TAB1 - 最高议事厅核心数据汇总
  const Tab1Content = (
    <div>
      {/* 年份选择器 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Space>
          <span>选择年份：</span>
          <DatePicker
            picker="year"
            value={dayjs(year, 'YYYY')}
            onChange={handleYearChange}
            allowClear={false}
            style={{ width: 120 }}
            format="YYYY年"
          />
        </Space>
      </div>

      {/* 顶部总览 - 最高议事厅核心数据计划 */}
      <div style={{ marginBottom: 16 }}>
        <OverviewSummary 
          year={year} 
          loading={loading}
          summaryData={totalSummary}
        />
      </div>

      {/* 所有数据看板 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <CoreDataSummary 
          year={year}
        />
        <SemDataBoard 
          year={year} 
          refreshTrigger={tab2SaveCount}
          onSummaryChange={(data) => handleSummaryChange('sem', data)}
        />
        <NewMediaDataBoard 
          year={year}
          refreshTrigger={tab2SaveCount}
          onSummaryChange={(data) => handleSummaryChange('newmedia', data)}
        />
        <MarketReputationDataBoard 
          year={year}
          refreshTrigger={tab2SaveCount}
          onSummaryChange={(data) => handleSummaryChange('market', data)}
        />
        <PartnerDataBoard 
          year={year}
          refreshTrigger={tab2SaveCount}
          onSummaryChange={(data) => handleSummaryChange('partner', data)}
        />
        <ReputationDataBoard 
          year={year}
          refreshTrigger={tab2SaveCount}
          onSummaryChange={(data) => handleSummaryChange('reputation', data)}
        />
        <ChannelDataBoard 
          year={year}
          refreshTrigger={tab2SaveCount}
          onSummaryChange={(data) => handleSummaryChange('channel', data)}
        />
        <CampusNewMediaDataBoard 
          year={year}
          refreshTrigger={tab2SaveCount}
          onSummaryChange={(data) => handleSummaryChange('campusnewmedia', data)}
        />
      </div>
    </div>
  )

  const tabItems = [
    {
      key: 'tab1',
      label: 'TAB1-最高议事厅核心数据汇总',
      children: Tab1Content,
    },
    {
      key: 'tab2',
      label: 'TAB2-各神殿数据看板汇总',
      children: <Tab2CampusDataSummary onDataChange={() => setTab2SaveCount(c => c + 1)} />,
    },
  ]

  return (
    <NoCopyContainer warningMessage="祈福司门数据禁止复制">
      <Tabs
        defaultActiveKey="tab1"
        items={tabItems}
        size="large"
        type="card"
      />
    </NoCopyContainer>
  )
}

export default MgntCenterCoreData
