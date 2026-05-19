import React, { useState, useMemo } from 'react'
import { Card, Tabs, Typography } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import SummaryTab from './SummaryTab'
import DataDashboardTab from './DataDashboardTab'
import RegisterTab from './RegisterTab'

const { Title } = Typography

/**
 * 20-市场部免费推广日度数据表
 * 包含3个主标签页：汇总、数据看板、登记
 * 数据看板和登记下各有6个子页面
 * 三个标签页共享同一个年月选择状态
 */
const FreePromotionDailyDataPage: React.FC = () => {
  const { getAllCampuses, currentCampus, setCampus } = useCampusStore()
  const [activeMainTab, setActiveMainTab] = useState<string>('summary')
  // 统一的年月选择状态，三个标签页共享
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs())

  // 获取排序后的神殿列表 - 使用 useMemo 避免无限循环
  const campuses = useMemo(() => getAllCampuses(), [getAllCampuses])

  // 如果没有选中神殿，默认选择第一个
  const activeCampusId = currentCampus 
    ? campuses.find(c => c.name === currentCampus)?.id 
    : campuses[0]?.id

  // 神殿标签页配置
  const campusTabItems = campuses.map((campus) => ({
    key: campus.id,
    label: campus.name,
    children: (
      <Tabs
        activeKey={activeMainTab}
        onChange={setActiveMainTab}
        type="card"
        items={[
          {
            key: 'summary',
            label: '汇总',
            children: <SummaryTab 
              campusId={campus.id} 
              campusName={campus.name}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />,
          },
          {
            key: 'dashboard',
            label: '数据看板',
            children: <DataDashboardTab 
              campusId={campus.id} 
              campusName={campus.name}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />,
          },
          {
            key: 'register',
            label: '登记',
            children: <RegisterTab 
              campusId={campus.id} 
              campusName={campus.name}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />,
          },
        ]}
      />
    ),
  }))

  const handleCampusChange = (key: string) => {
    const campus = campuses.find(c => c.id === key)
    if (campus) {
      setCampus(campus.name)
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3} style={{ marginBottom: 24, textAlign: 'center' }}>
          20-市场部免费推广日度数据表
        </Title>

        <Tabs
          activeKey={activeCampusId}
          onChange={handleCampusChange}
          type="card"
          items={campusTabItems}
        />
      </Card>
    </div>
  )
}

export default FreePromotionDailyDataPage
