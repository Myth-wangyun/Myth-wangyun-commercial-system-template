/**
 * 001最高议事厅核心数据看板
 * TAB1: 集团汇总数据
 * TAB2-n: 各神殿数据看板
 */

import React, { useState, useMemo } from 'react'
import { Card, DatePicker, Space, Tabs } from 'antd'
import { DashboardOutlined, BankOutlined, HomeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import { normalizeCampusName } from '@/utils/campusSort'

import Tab1CoreDataPlan from './1CoreDataPlan'
import Tab2CoreDataSummary from './2CoreDataSummary'
import Tab3SEMData from './3SEMData'
import Tab4NewMediaData from './4NewMediaData'
import Tab5MarketReputationData from './5MarketReputationData'
import Tab6PartnerData from './6PartnerData'
import Tab7FreePromotionData from './7FreePromotionData'
import Tab8ChannelData from './8ChannelData'
import Tab9ReputationData from './9ReputationData'
import Tab10CampusNewMediaData from './10CampusNewMediaData'
import CampusLevelDashboard from './campus-level'

// 集团汇总组件
function GroupSummary({ year }: { year: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Tab1CoreDataPlan year={year} />
      <Tab2CoreDataSummary year={year} />
      <Tab3SEMData year={year} />
      <Tab4NewMediaData year={year} />
      <Tab5MarketReputationData year={year} />
      <Tab6PartnerData year={year} />
      <Tab7FreePromotionData year={year} />
      <Tab8ChannelData year={year} />
      <Tab9ReputationData year={year} />
      <Tab10CampusNewMediaData year={year} />
    </div>
  )
}

export default function MgntCenterDashboard() {
  const currentYear = dayjs().format('YYYY')
  const [year, setYear] = useState(currentYear)
  
  // 从 campusStore 获取神殿列表（使用原始名称，不标准化）
  const allCampuses = useCampusStore.getState().getAllCampuses()
  const campusList = useMemo(() => 
    allCampuses.map(c => c.name),
    [allCampuses]
  )

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (!date) return
    setYear(date.format('YYYY'))
  }

  // 生成 TAB 配置
  const tabItems = useMemo(() => {
    const items = [
      {
        key: 'group',
        label: (
          <span>
            <BankOutlined />
            <span style={{ marginLeft: 8 }}>集团汇总</span>
          </span>
        ),
        children: <GroupSummary year={year} />,
      },
      ...campusList.map((campus, idx) => ({
        key: `campus-${idx}`,
        label: (
          <span>
            <HomeOutlined />
            <span style={{ marginLeft: 8 }}>{campus}</span>
          </span>
        ),
        children: <CampusLevelDashboard year={year} campus={campus} />,
      })),
    ]
    return items
  }, [year, campusList])

  return (
    <div style={{ padding: '2px' }}>
      <Card
        title={
          <Space>
            <DashboardOutlined />
            <span>清美教育集团{year}年核心数据看板</span>
          </Space>
        }
        extra={
          <Space>
            <DatePicker
              value={dayjs(year, 'YYYY')}
              onChange={handleYearChange}
              picker="year"
              allowClear={false}
            />
          </Space>
        }
      >
        <Tabs 
          items={tabItems} 
          defaultActiveKey="group"
          type="card"
          size="small"
        />
      </Card>
    </div>
  )
}
