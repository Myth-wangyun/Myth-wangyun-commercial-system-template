import React, { useState, useMemo } from 'react'
import { Card, Tabs, Typography, Space, DatePicker } from 'antd'
import { useCampusStore } from '@/stores/campusStore'
import StageDataSummaryTab from './StageDataSummaryTab'
import NewMediaDetailTab from './NewMediaDetailTab'
import SEMDetailTab from './SEMDetailTab'
import VisitDetailTab from './VisitDetailTab'
import SignupDetailTab from './SignupDetailTab'
import InvalidDetailTab from './InvalidDetailTab'
import dayjs, { type Dayjs } from 'dayjs'

const { Title } = Typography
const { RangePicker } = DatePicker

/**
 * 市场部-网推阶段业务汇报表（分神殿）
 * 包含：阶段数据总表、SEM咨询量明细、新媒体明细、上门明细、报名明细、无效量、10月份计划
 */
const OnlinePromotionStageReportPage: React.FC = () => {
  const { getAllCampuses, currentCampus, setCampus } = useCampusStore()
  // 默认日期范围：当前月1日至今天
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs()
  ])
  const [activeSubTab, setActiveSubTab] = useState<string>('stage-summary')

  // 获取排序后的神殿列表 - 使用 useMemo 避免无限循环
  const campuses = useMemo(() => getAllCampuses(), [getAllCampuses])

  // 获取当前选中的神殿对象
  const selectedCampus = useMemo(() => {
    return campuses.find(c => c.name === currentCampus) || campuses[0]
  }, [campuses, currentCampus])

  // 处理日期范围变化
  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]])
    }
  }

  const handleCampusChange = (key: string) => {
    const campus = campuses.find(c => c.id === key)
    if (campus) {
      setCampus(campus.name)
    }
  }

  // 神殿标签页配置（只显示标签，不包含内容）
  const campusTabItems = campuses.map((campus) => ({
    key: campus.id,
    label: campus.name,
  }))

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3} style={{ marginBottom: 24, textAlign: 'center' }}>
          市场部-网推阶段业务汇报表
        </Title>

        <Tabs
          activeKey={selectedCampus?.id}
          onChange={handleCampusChange}
          type="card"
          items={campusTabItems}
        />

        {/* 根据选中的神殿动态渲染内容 */}
        <div style={{ marginTop: 16 }}>
          <Space style={{ marginBottom: 16 }}>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              format="YYYY年MM月DD日"
              allowClear={false}
            />
          </Space>
          
          <Tabs
            activeKey={activeSubTab}
            onChange={setActiveSubTab}
            type="card"
            items={[
              {
                key: 'stage-summary',
                label: '阶段数据总表',
                children: <StageDataSummaryTab 
                  key={`stage-summary-${selectedCampus?.id}`}
                  campusId={selectedCampus?.name || ''} 
                  startDate={dateRange[0]} 
                  endDate={dateRange[1]} 
                />,
              },
              {
                key: 'sem-detail',
                label: 'SEM咨询量明细',
                children: <SEMDetailTab 
                  key={`sem-detail-${selectedCampus?.id}`}
                  campusId={selectedCampus?.name || ''} 
                  startDate={dateRange[0]} 
                  endDate={dateRange[1]} 
                />,
              },
              {
                key: 'newmedia-detail',
                label: '新媒体明细',
                children: <NewMediaDetailTab 
                  key={`newmedia-detail-${selectedCampus?.id}`}
                  campusId={selectedCampus?.name || ''} 
                  startDate={dateRange[0]} 
                  endDate={dateRange[1]} 
                />,
              },
              {
                key: 'visit-detail',
                label: '上门明细',
                children: <VisitDetailTab 
                  key={`visit-detail-${selectedCampus?.id}`}
                  campusId={selectedCampus?.name || ''} 
                  startDate={dateRange[0]} 
                  endDate={dateRange[1]} 
                />,
              },
              {
                key: 'signup-detail',
                label: '报名明细',
                children: <SignupDetailTab 
                  key={`signup-detail-${selectedCampus?.id}`}
                  campusId={selectedCampus?.name || ''} 
                  startDate={dateRange[0]} 
                  endDate={dateRange[1]} 
                />,
              },
              {
                key: 'invalid-detail',
                label: '无效量',
                children: <InvalidDetailTab 
                  key={`invalid-detail-${selectedCampus?.id}`}
                  campusId={selectedCampus?.name || ''} 
                  startDate={dateRange[0]} 
                  endDate={dateRange[1]} 
                />,
              },
            ]}
          />
        </div>
      </Card>
    </div>
  )
}

export default OnlinePromotionStageReportPage

