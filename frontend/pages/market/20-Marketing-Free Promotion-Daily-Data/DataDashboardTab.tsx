import React, { useState, lazy, Suspense, useEffect } from 'react'
import { Tabs, Spin } from 'antd'
import type { Dayjs } from 'dayjs'

// 懒加载各个 Dashboard 组件
const SocialMediaDashboard = lazy(() => import('./dashboards/SocialMediaDashboard'))
const QADashboard = lazy(() => import('./dashboards/QADashboard'))
const ClassifiedDashboard = lazy(() => import('./dashboards/ClassifiedDashboard'))
const MapDashboard = lazy(() => import('./dashboards/MapDashboard'))
const WechatDashboard = lazy(() => import('./dashboards/WechatDashboard'))
const VideoDashboard = lazy(() => import('./dashboards/VideoDashboard'))

interface DataDashboardTabProps {
  campusId: string
  campusName: string
  selectedMonth: Dayjs
  onMonthChange: (month: Dayjs) => void
}

/**
 * 数据看板标签页
 * 包含6个子类别：01社交新媒体、02问答、03分类信息、04地图、05微信平台、06视频
 * 优化：使用懒加载、条件渲染、虚拟滚动
 */
const DataDashboardTab: React.FC<DataDashboardTabProps> = ({ campusId, campusName, selectedMonth, onMonthChange }) => {
  const [activeSubTab, setActiveSubTab] = useState<string>('social-media')
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set(['social-media']))

  // 预加载相邻标签页
  useEffect(() => {
    const tabOrder = ['social-media', 'qa', 'classified', 'map', 'wechat', 'video']
    const currentIndex = tabOrder.indexOf(activeSubTab)
    
    // 预加载下一个标签页
    if (currentIndex < tabOrder.length - 1) {
      const nextTab = tabOrder[currentIndex + 1]
      if (!loadedTabs.has(nextTab)) {
        const timer = setTimeout(() => {
          setLoadedTabs(prev => new Set([...prev, nextTab]))
        }, 100)
        return () => clearTimeout(timer)
      }
    }
  }, [activeSubTab, loadedTabs])

  const handleTabChange = (key: string) => {
    setActiveSubTab(key)
    setLoadedTabs(prev => new Set([...prev, key]))
  }

  // 使用条件渲染，只渲染当前激活或已加载的组件
  const renderActiveTab = () => {
    const loadingFallback = (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )

    return (
      <div style={{ minHeight: '600px' }}>
        <Suspense fallback={loadingFallback}>
          <div style={{ display: activeSubTab === 'social-media' ? 'block' : 'none' }}>
            {loadedTabs.has('social-media') && (
              <SocialMediaDashboard 
                campusId={campusId} 
                campusName={campusName}
                selectedMonth={selectedMonth}
                onMonthChange={onMonthChange}
              />
            )}
          </div>
          <div style={{ display: activeSubTab === 'qa' ? 'block' : 'none' }}>
            {loadedTabs.has('qa') && (
              <QADashboard 
                campusId={campusId} 
                campusName={campusName}
                selectedMonth={selectedMonth}
                onMonthChange={onMonthChange}
              />
            )}
          </div>
          <div style={{ display: activeSubTab === 'classified' ? 'block' : 'none' }}>
            {loadedTabs.has('classified') && (
              <ClassifiedDashboard 
                campusId={campusId} 
                campusName={campusName}
                selectedMonth={selectedMonth}
                onMonthChange={onMonthChange}
              />
            )}
          </div>
          <div style={{ display: activeSubTab === 'map' ? 'block' : 'none' }}>
            {loadedTabs.has('map') && (
              <MapDashboard 
                campusId={campusId} 
                campusName={campusName}
                selectedMonth={selectedMonth}
                onMonthChange={onMonthChange}
              />
            )}
          </div>
          <div style={{ display: activeSubTab === 'wechat' ? 'block' : 'none' }}>
            {loadedTabs.has('wechat') && (
              <WechatDashboard 
                campusId={campusId} 
                campusName={campusName}
                selectedMonth={selectedMonth}
                onMonthChange={onMonthChange}
              />
            )}
          </div>
          <div style={{ display: activeSubTab === 'video' ? 'block' : 'none' }}>
            {loadedTabs.has('video') && (
              <VideoDashboard 
                campusId={campusId} 
                campusName={campusName}
                selectedMonth={selectedMonth}
                onMonthChange={onMonthChange}
              />
            )}
          </div>
        </Suspense>
      </div>
    )
  }

  const subTabItems = [
    {
      key: 'social-media',
      label: '社交新媒体',
    },
    {
      key: 'qa',
      label: '问答',
    },
    {
      key: 'classified',
      label: '分类信息',
    },
    {
      key: 'map',
      label: '地图',
    },
    {
      key: 'wechat',
      label: '微信平台',
    },
    {
      key: 'video',
      label: '视频',
    },
  ]

  return (
    <div style={{ background: '#f7fafc', borderRadius: 16, boxShadow: '0 2px 16px 0 rgba(0,0,0,0.04)', padding: 24, marginBottom: 24 }}>
      <Tabs
        activeKey={activeSubTab}
        onChange={handleTabChange}
        type="line"
        items={subTabItems}
        tabBarStyle={{ fontWeight: 600, fontSize: 18, marginBottom: 18, gap: 24 }}
        style={{ marginBottom: 0 }}
      />
      <div style={{ borderRadius: 12, background: '#fff', boxShadow: '0 1.5px 8px 0 rgba(0,0,0,0.03)', padding: 12, minHeight: 600 }}>
        {renderActiveTab()}
      </div>
    </div>
  )
}

export default DataDashboardTab
