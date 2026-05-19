/**
 * 口碑统计汇总页面
 * 包含所有口碑招生相关的表格
 */

import React, { useEffect, useRef } from 'react'
import { Card } from 'antd'
import { RiseOutlined } from '@ant-design/icons'
import { useCampusStore } from '@/stores/campusStore'
import CoreDataTabs from '../../../../../components/common/CoreDataTabs'

// 导入口碑招生相关表格组件
import CampusReputationEnrollmentGoalsResultsPage from '../../../../campus/reputation-enrollment-goals-results'
// import CampusPersonalReputationEnrollmentPage from '../../../../campus/personal-reputation-enrollment';
// import CampusMonthlyPersonalReputationEnrollmentPage from '../../../../campus/monthly-personal-reputation-enrollment';
// import CampusReputationEnrollmentRegistrationPage from '../../../../campus/reputation-enrollment-registration';

const ReputationSummaryPage: React.FC = () => {
  const { currentCampus, setCampus, getAllCampuses } = useCampusStore()
  const campuses = getAllCampuses()
  const wrapperRef = useRef<HTMLDivElement>(null)

  // 初始化：如果当前没有选择神殿，选择第一个神殿
  useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      const firstCampus = campuses[0].name
      setCampus(firstCampus)
    }
  }, [currentCampus, campuses, setCampus])

  // 定义口碑招生相关表格组件
  const tables = [
    {
      key: '004',
      title: '神殿教化司口碑招生目标与结果汇总表',
      component: CampusReputationEnrollmentGoalsResultsPage,
      props: { hideCampusSelector: true },
    },
    // {
    //   key: 'personal-reputation',
    //   title: '神殿教化司个人口碑招生目标与结果汇总表',
    //   component: CampusPersonalReputationEnrollmentPage,
    //   props: { hideCampusSelector: true }
    // },
    // {
    //   key: 'monthly-personal-reputation',
    //   title: '神殿教化司月度个人口碑招生目标与结果汇总表',
    //   component: CampusMonthlyPersonalReputationEnrollmentPage,
    //   props: { hideCampusSelector: true }
    // },
    // {
    //   key: 'reputation-registration',
    //   title: '神殿教化司口碑报名登记明细表',
    //   component: CampusReputationEnrollmentRegistrationPage,
    //   props: { hideCampusSelector: true }
    // },
  ]

  // 隐藏所有神殿选择器
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
  }, [currentCampus, tables])

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
          {currentCampus} - 口碑统计汇总
        </h1>
      </Card>

      {/* 显示所有口碑招生相关表格 */}
      {tables.map((table, index) => {
        const Component = table.component
        const props = table.props || {}
        return (
          <div
            key={table.key}
            className="campus-summary-table-wrapper"
            style={{
              marginBottom: index < tables.length - 1 ? 32 : 0,
              order: index + 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Component {...props} />
          </div>
        )
      })}
    </div>
  )
}

export default ReputationSummaryPage
