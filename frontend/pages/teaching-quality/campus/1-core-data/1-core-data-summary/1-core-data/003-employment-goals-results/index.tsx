/**
 * 学员就业目标与结果汇总表
 * Sheet：汇总（班级/明星/班主任）+ 班级详细数据
 */

import React, { useEffect, useRef, useState } from 'react'
import { Card, Tabs } from 'antd'
import { TrophyOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'

import EmploymentSummarySheet from './SummarySheet'
import EmploymentClassDetailSheet from './ClassDetailSheet'

type TabKey = 'summary' | 'class-detail'

const TeachingQualityEmploymentGoalsResultsPage: React.FC = () => {
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('summary')

  const viewTabs = [
    { key: 'summary' as TabKey, label: '汇总' },
    { key: 'class-detail' as TabKey, label: '班级详细数据' },
  ]

  useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      setCampus(campuses[0].name)
    }
  }, [currentCampus, campuses, setCampus])

  useEffect(() => {
    const hideSelectors = () => {
      if (!wrapperRef.current) return
      const allCards = wrapperRef.current.querySelectorAll('.ant-card')
      allCards.forEach((card) => {
        const cardElement = card as HTMLElement
        const cardExtra = cardElement.querySelector('.ant-card-extra')
        if (cardExtra) {
          const selects = cardExtra.querySelectorAll('.ant-select')
          selects.forEach((select) => {
            const selectElement = select as HTMLElement
            const selectText = selectElement.textContent || ''
            if (selectText.includes('全部神殿') || selectText.includes('选择神殿')) {
              const spaceItem = selectElement.closest('.ant-space-item')
              if (spaceItem) {
                ;(spaceItem as HTMLElement).style.display = 'none'
              } else {
                selectElement.style.display = 'none'
              }
            }
          })
        }
      })
    }

    const timers = [
      setTimeout(hideSelectors, 100),
      setTimeout(hideSelectors, 300),
      setTimeout(hideSelectors, 500),
      setTimeout(hideSelectors, 1000),
      setTimeout(hideSelectors, 2000),
    ]

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [currentCampus])

  if (!currentCampus) {
    return null
  }

  return (
    <div
      ref={wrapperRef}
      style={{
        padding: '24px',
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Card
        style={{
          marginBottom: 24,
          backgroundColor: '#fff',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 16,
          }}
        >
          <TrophyOutlined style={{ marginRight: 8 }} />
          {currentCampus} - 学员就业目标与结果汇总表
        </h1>
      </Card>

      <Card
        style={{
          marginBottom: 24,
          backgroundColor: '#fff',
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as TabKey)}
          type="card"
          items={viewTabs.map((tab) => ({ key: tab.key, label: tab.label }))}
        />
      </Card>

      {activeTab === 'summary' ? <EmploymentSummarySheet /> : <EmploymentClassDetailSheet />}
    </div>
  )
}

export default TeachingQualityEmploymentGoalsResultsPage
