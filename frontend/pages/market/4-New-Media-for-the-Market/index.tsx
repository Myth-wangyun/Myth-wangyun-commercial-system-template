import React, { useState, useMemo, useRef } from 'react'
import { Card, Tabs, Typography, Space, DatePicker } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useCampusStore } from '@/stores/campusStore'
import SummaryTab from './SummaryTab'
import DouyinTab from './DouyinTab'
import KuaishouTab from './KuaishouTab'
import BilibiliTab from './BilibiliTab'
import XiaohongshuTab from './XiaohongshuTab'
import WechatVideoTab from './WechatVideoTab'
import ExcelImporter, { type ImportedData } from './ExcelImporter'

const { Title } = Typography

// 定义子组件的ref类型
export interface TabRef {
  importData: (data: any[], month: string) => Promise<void>
  setMonth: (month: string) => void
}

/**
 * 市场部新媒体日度数据表
 * 包含神殿标签页，每个神殿下有6个子页面
 */
const NewMediaDailyDataPage: React.FC = () => {
  const { getAllCampuses, currentCampus, setCampus } = useCampusStore()
  const [activeSubTab, setActiveSubTab] = useState<string>('summary')
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs())
  
  // 创建各个Tab的ref
  const douyinRef = useRef<TabRef>(null)
  const kuaishouRef = useRef<TabRef>(null)
  const bilibiliRef = useRef<TabRef>(null)
  const xiaohongshuRef = useRef<TabRef>(null)
  const wechatVideoRef = useRef<TabRef>(null)

  // 获取排序后的神殿列表 - 使用 useMemo 避免无限循环
  const campuses = useMemo(() => getAllCampuses(), [getAllCampuses])

  // 如果没有选中神殿，默认选择第一个
  const activeCampusId = currentCampus 
    ? campuses.find(c => c.name === currentCampus)?.id 
    : campuses[0]?.id

  // 处理月份变化 - 同步所有Tab
  const handleMonthChange = (date: Dayjs | null) => {
    if (!date) return
    
    setSelectedMonth(date)
    const monthStr = date.format('YYYY-MM')
    
    // 同步所有Tab的月份
    douyinRef.current?.setMonth(monthStr)
    kuaishouRef.current?.setMonth(monthStr)
    bilibiliRef.current?.setMonth(monthStr)
    xiaohongshuRef.current?.setMonth(monthStr)
    wechatVideoRef.current?.setMonth(monthStr)
  }

  // 处理Excel导入
  const handleImportSuccess = (importedData: ImportedData) => {
    console.log('handleImportSuccess被调用，数据:', importedData)
    
    // 设置月份（会同步所有Tab）
    setSelectedMonth(dayjs(importedData.month))
    
    // 传递月份参数给 importData，避免异步状态更新问题
    const month = importedData.month
    
    // 设置月份并导入数据
    if (importedData.douyin?.length && douyinRef.current) {
      console.log('调用抖音Tab的setMonth和importData')
      douyinRef.current.setMonth(month)
      douyinRef.current.importData(importedData.douyin, month)
    }
    if (importedData.kuaishou?.length && kuaishouRef.current) {
      console.log('调用快手Tab的setMonth和importData')
      kuaishouRef.current.setMonth(month)
      kuaishouRef.current.importData(importedData.kuaishou, month)
    }
    if (importedData.bilibili?.length && bilibiliRef.current) {
      console.log('调用B站Tab的setMonth和importData')
      bilibiliRef.current.setMonth(month)
      bilibiliRef.current.importData(importedData.bilibili, month)
    }
    if (importedData.xiaohongshu?.length && xiaohongshuRef.current) {
      console.log('调用小红书Tab的setMonth和importData')
      xiaohongshuRef.current.setMonth(month)
      xiaohongshuRef.current.importData(importedData.xiaohongshu, month)
    }
    if (importedData.wechatVideo?.length && wechatVideoRef.current) {
      console.log('调用微信视频号Tab的setMonth和importData')
      wechatVideoRef.current.setMonth(month)
      wechatVideoRef.current.importData(importedData.wechatVideo, month)
    }
  }

  // 神殿标签页配置
  const campusTabItems = campuses.map((campus) => ({
    key: campus.id,
    label: campus.name,
    children: (
      <>
        <Space style={{ marginBottom: 16 }}>
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            format="YYYY年MM月"
          />
        </Space>
        <Tabs
          activeKey={activeSubTab}
          onChange={setActiveSubTab}
          type="card"
          items={[
            {
              key: 'summary',
              label: '汇总',
              children: <SummaryTab campusId={campus.id} selectedMonth={selectedMonth} />,
            },
            {
              key: 'douyin',
              label: '抖音',
              children: <DouyinTab ref={douyinRef} campusId={campus.id} selectedMonth={selectedMonth} />,
            },
            {
              key: 'kuaishou',
              label: '快手',
              children: <KuaishouTab ref={kuaishouRef} campusId={campus.id} selectedMonth={selectedMonth} />,
            },
            {
              key: 'bilibili',
              label: 'B站',
              children: <BilibiliTab ref={bilibiliRef} campusId={campus.id} selectedMonth={selectedMonth} />,
            },
            {
              key: 'xiaohongshu',
              label: '小红书',
              children: <XiaohongshuTab ref={xiaohongshuRef} campusId={campus.id} selectedMonth={selectedMonth} />,
            },
            {
              key: 'wechat-video',
              label: '微信视频号',
              children: <WechatVideoTab ref={wechatVideoRef} campusId={campus.id} selectedMonth={selectedMonth} />,
            },
          ]}
        />
      </>
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
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3} style={{ margin: 0 }}>
              市场部新媒体日度数据表
            </Title>
            <ExcelImporter 
              campusId={activeCampusId || ''} 
              onImportSuccess={handleImportSuccess}
            />
          </div>

          <Tabs
            activeKey={activeCampusId}
            onChange={handleCampusChange}
            type="card"
            items={campusTabItems}
          />
        </Space>
      </Card>
    </div>
  )
}

export default NewMediaDailyDataPage

