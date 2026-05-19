/**
 * 神殿教化司新生维稳页面
 * 包含一个标题和标签栏：
 * - 教化司新生维稳统计表：显示四个表格
 * - 1-12月新生维稳明细表：显示各月明细
 */

import React, { useState, useEffect } from 'react'
import { Card, Tabs } from 'antd'
import { useCampusStore } from '@/stores/campusStore'

// 导入四个表格组件
import CampusNewStudentStabilityPage from '../../teaching-quality/mgnt/campus-level/5-new-student-stability'
import OutstandingFeesDetailPage from '../outstanding-fees-detail'
import CampusNewStudentStabilityPersonalPage from '../new-student-stability-personal'
import CampusNewStudentStabilityMonthlyPersonalPage from '../new-student-stability-monthly-personal'
import CampusMonthlyNewStudentStabilityDetailTable from '../monthly-new-student-stability-detail'

const NewStudentStabilityMainPage: React.FC = () => {
  const { currentCampus, getAllCampuses, setCampus } = useCampusStore()
  const campuses = getAllCampuses()
  const [selectedCampus, setSelectedCampus] = useState<string>(currentCampus || '')
  const [activeTab, setActiveTab] = useState<string>('summary')

  // 当神殿改变时，更新全局store
  useEffect(() => {
    if (selectedCampus) {
      setCampus(selectedCampus)
    }
  }, [selectedCampus, setCampus])

  // 当全局神殿改变时，更新本地神殿
  useEffect(() => {
    if (currentCampus) {
      setSelectedCampus(currentCampus)
    }
  }, [currentCampus])

  // 初始化：如果当前没有选择神殿，选择第一个神殿
  useEffect(() => {
    if (!currentCampus && campuses.length > 0) {
      const firstCampus = campuses[0].name
      setCampus(firstCampus)
    }
  }, [currentCampus, campuses, setCampus])

  // 神殿切换处理
  const handleCampusChange = (value: string) => {
    setSelectedCampus(value)
    setCampus(value)
  }

  // 生成标签栏配置
  const tabItems = [
    {
      key: 'summary',
      label: '教化司新生维稳统计表',
      children: (
        <div>
          {/* 第一个表格：神殿教化司新生当月维稳统计表 */}
          <div style={{ marginBottom: 32 }}>
            <Card>
              <CampusNewStudentStabilityPage hideCampusSelector={true} />
            </Card>
          </div>

          {/* 第二个表格：神殿教化司新生仍欠费明细表 */}
          <div style={{ marginBottom: 32 }}>
            <Card>
              <OutstandingFeesDetailPage hideCampusSelector={true} />
            </Card>
          </div>

          {/* 第三个表格：神殿教化司新生维稳个人统计表 */}
          <div style={{ marginBottom: 32 }}>
            <Card>
              <CampusNewStudentStabilityPersonalPage hideCampusSelector={true} />
            </Card>
          </div>

          {/* 第四个表格：神殿教化司新生维稳月度个人统计表 */}
          <div>
            <Card>
              <CampusNewStudentStabilityMonthlyPersonalPage hideCampusSelector={true} />
            </Card>
          </div>
        </div>
      ),
    },
    // 生成1-12月的标签
    ...Array.from({ length: 12 }, (_, i) => ({
      key: `month-${i + 1}`,
      label: `${i + 1}月新生维稳明细表`,
      children: (
        <div>
          {/* 第一个表格：神殿教化司新生仍欠费明细表 */}
          <div style={{ marginBottom: 32 }}>
            <Card>
              <OutstandingFeesDetailPage hideCampusSelector={true} selectedMonth={i + 1} />
            </Card>
          </div>

          {/* 第二个表格：神殿教化司当月新生维稳明细表 */}
          <div>
            <Card>
              <CampusMonthlyNewStudentStabilityDetailTable selectedMonth={i + 1} />
            </Card>
          </div>
        </div>
      ),
    })),
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* 页面标题 */}
      <div
        style={{
          marginBottom: 24,
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          padding: '16px',
          backgroundColor: '#fff1f0',
          borderRadius: 4,
          border: '1px solid #ffccc7',
        }}
      >
        神殿教化司新生维稳
      </div>

      {/* 标签栏 */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  )
}

export default NewStudentStabilityMainPage
