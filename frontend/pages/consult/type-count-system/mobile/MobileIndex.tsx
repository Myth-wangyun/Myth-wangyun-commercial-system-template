/**
 * 移动端 - 咨询量录入系统（Tab 页）
 */
import React, { useState } from 'react'
import { useCampusStore } from '@/stores/campusStore'
import MobileConsultationForm from './MobileConsultationForm'
import MobileConsultationList from './MobileConsultationList'

import './MobileIndex.css'

export default function MobileTypeCountSystem() {
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form')
  const [refreshKey, setRefreshKey] = useState(0)
  const { currentCampus } = useCampusStore()

  const handleFormSuccess = () => {
    setRefreshKey(k => k + 1)
    setActiveTab('list')
  }

  return (
    <div className="m-tcs-page">
      {/* Tab 切换 */}
      <div className="m-tcs-tabs">
        <div
          className={`m-tcs-tab ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          录入
        </div>
        <div
          className={`m-tcs-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          列表
        </div>
      </div>

      {/* 内容 */}
      <div className="m-tcs-content">
        {activeTab === 'form' ? (
          <MobileConsultationForm
            onSuccess={handleFormSuccess}
            campus={currentCampus || undefined}
          />
        ) : (
          <MobileConsultationList
            refreshKey={refreshKey}
            campus={currentCampus || undefined}
          />
        )}
      </div>
    </div>
  )
}
