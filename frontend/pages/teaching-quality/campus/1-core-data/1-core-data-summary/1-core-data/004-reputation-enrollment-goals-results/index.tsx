/**
 * 教化司口碑招生目标与结果汇总表
 * Sheet：汇总（目标/个人/月度个人）+ 口碑报名明细
 */

import React, { useEffect, useRef, useState } from 'react'
import { Card, Tabs } from 'antd'
import { RiseOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'

import ReputationSummarySheet from './SummarySheet'
import ReputationDetailSheet from './DetailSheet'

type TabKey = 'summary' | 'detail'

const TeachingQualityReputationEnrollmentPage: React.FC = () => {
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('summary')

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

      const allElements = wrapperRef.current.querySelectorAll('.ant-card')
      allElements.forEach((card) => {
        const cardElement = card as HTMLElement
        const hasSelect = card.querySelector('.ant-select')
        const hasTable = cardElement.querySelector('.ant-table') !== null
        const hasStatistics = cardElement.querySelector('.ant-statistic') !== null

        if (hasSelect && !hasTable && !hasStatistics) {
          const cardText = cardElement.textContent || ''
          if (cardText.includes('选择神殿') || cardText.includes('全部神殿')) {
            cardElement.style.display = 'none'
          }
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
          <RiseOutlined style={{ marginRight: 8 }} />
          {currentCampus} - 教化司口碑招生目标与结果汇总表
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
          items={[
            { key: 'summary', label: '汇总' },
            { key: 'detail', label: '明细' },
          ]}
        />
      </Card>

      {activeTab === 'summary' && <ReputationSummarySheet />}
      {activeTab === 'detail' && <ReputationDetailSheet />}
    </div>
  )
}

export default TeachingQualityReputationEnrollmentPage
